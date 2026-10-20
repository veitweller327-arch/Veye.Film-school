/*
 * Praxis-Reflexion: Theorie → eigenes Ergebnis → Nachdenken → Feedback.
 * Pro Lektion: Übung umsetzen, Standbild/Foto hochladen, drei Reflexionsfragen beantworten.
 * Der KI-Dozent gibt Feedback zum Bild und zur Reflexion (bezogen auf die Lektion).
 * Alles landet zusätzlich im Notizheft (Reflexion + Feedback als Einträge, Foto als Polaroid).
 * Speicher: localStorage "veye:praxis" → { "kurs/lektion": [ Versuch, … ] }
 */
(function () {
  const safeThumb = u => typeof u === "string" && /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/.test(u);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const load = () => { try { return JSON.parse(localStorage.getItem("veye:praxis")) || {}; } catch { return {}; } };
  const save = d => { try { localStorage.setItem("veye:praxis", JSON.stringify(d)); return true; } catch { return false; } };
  const fmt = ts => new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const QUESTIONS = [
    ["a", "Was hast du gemacht?", "Setup, Kamera, Licht, Schnitt – kurz beschreiben …"],
    ["b", "Was hat funktioniert – was nicht?", "Ehrlich sein: Wo warst du zufrieden, wo nicht?"],
    ["c", "Was probierst du beim nächsten Mal anders?", "Eine konkrete Änderung …"]
  ];

  // kleines Vorschaubild (für die Anzeige in der Lektion) + größere Version fürs Notizheft/KI
  function prepare(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const make = max => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); return c; };
        const thumb = make(360).toDataURL("image/jpeg", 0.78);
        make(1400).toBlob(b => { URL.revokeObjectURL(img.src); b ? res({ thumb, blob: b }) : rej(); }, "image/jpeg", 0.86);
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  function dataUrlToBlob(u) {
    const [head, data] = u.split(","), bin = atob(data), arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: (head.match(/data:([^;]+)/) || [])[1] || "image/jpeg" });
  }

  function openTask() {
    const done = (() => { try { return JSON.parse(localStorage.getItem("veye:done")) || {}; } catch { return {}; } })();
    const p = load();
    for (const k of window.KURSE || []) for (const l of k.lektionen) {
      const key = `${k.id}/${l.id}`;
      if (done[key] && l.aufgabe && !(p[key] && p[key].length)) return { k, l };
    }
    return null;
  }

  function section(k, l) {
    if (!l.aufgabe) return "";
    const tries = load()[`${k.id}/${l.id}`] || [];
    return `
      <section class="praxis" id="praxis">
        <div class="sec-head"><h2>Praxis</h2><span class="label">${tries.length ? `${tries.length} ${tries.length === 1 ? "Versuch" : "Versuche"} reflektiert` : "Theorie anwenden"}</span></div>
        <div class="px-card">
          <div class="px-task"><span class="label acc">Deine Übung</span><p>${esc(l.aufgabe)}</p></div>
          <div id="pxBody"></div>
        </div>
      </section>`;
  }

  function bind(root, k, l) {
    const body = root.querySelector("#pxBody"); if (!body) return;
    const key = `${k.id}/${l.id}`;
    let file = null, prep = null;

    const ai = () => !!(window.Tutor && window.Tutor.aiAvailable());
    const md = t => (window.Tutor && window.Tutor.md ? window.Tutor.md(t) : `<p>${esc(t)}</p>`);

    function renderList() {
      const tries = load()[key] || [];
      body.innerHTML = `
        ${tries.slice().reverse().map((t, i) => `
          <article class="px-try">
            <header><span class="label">Versuch ${tries.length - i} · ${fmt(t.ts)}</span></header>
            <div class="px-try-grid ${safeThumb(t.thumb) ? "" : "no-img"}">
              ${safeThumb(t.thumb) ? `<img src="${esc(t.thumb)}" alt="Dein Ergebnis vom ${esc(fmt(t.ts))}">` : ""}
              <dl>${QUESTIONS.map(([id, q]) => t[id] ? `<div><dt>${q}</dt><dd>${esc(t[id])}</dd></div>` : "").join("")}</dl>
            </div>
            ${t.feedback ? `<div class="px-feedback"><span class="label acc">Feedback vom Dozenten</span>${md(t.feedback)}</div>`
              : ai() ? `<button class="btn small px-fb" data-i="${tries.length - 1 - i}">Feedback holen</button>` : ""}
          </article>`).join("")}
        <button class="btn ${tries.length ? "" : "primary"} big px-start">${tries.length ? "Neuen Versuch reflektieren" : "Umsetzen & reflektieren"}</button>`;
      body.querySelector(".px-start").onclick = renderForm;
      body.querySelectorAll(".px-fb").forEach(b => b.onclick = () => feedback(+b.dataset.i, b));
      if (window.Terms) body.querySelectorAll(".px-feedback").forEach(el => window.Terms.annotate(el));
    }

    function renderForm() {
      file = null; prep = null;
      body.innerHTML = `
        <form class="px-form" novalidate>
          <label class="px-drop" for="pxFile">
            <input type="file" id="pxFile" accept="image/*" hidden>
            <span class="px-drop-in"><b>Standbild oder Foto deines Ergebnisses</b><span>optional · Screenshot aus dem Schnitt, Handyfoto vom Set, Skizze</span></span>
            <img class="px-prev" alt="" hidden>
          </label>
          ${QUESTIONS.map(([id, q, ph]) => `<label class="px-q"><span>${q}</span><textarea name="${id}" rows="2" placeholder="${ph}"></textarea></label>`).join("")}
          <p class="px-note muted"></p>
          <div class="row-gap">
            ${ai() ? `<button type="submit" class="btn primary" data-fb="1">Speichern & Feedback holen</button><button type="submit" class="btn">Nur speichern</button>`
                   : `<button type="submit" class="btn primary">Speichern</button>`}
            <button type="button" class="btn px-cancel">Abbrechen</button>
          </div>
        </form>`;
      const form = body.querySelector("form");
      form.querySelectorAll("textarea").forEach(t => t.addEventListener("input", () => { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; }));
      form.querySelector("#pxFile").onchange = async e => {
        file = e.target.files[0]; if (!file) return;
        try {
          prep = await prepare(file);
          const im = form.querySelector(".px-prev"); im.src = prep.thumb; im.hidden = false;
          form.querySelector(".px-drop").classList.add("has");
        } catch { form.querySelector(".px-note").textContent = "Dieses Bild konnte nicht gelesen werden."; }
      };
      form.querySelector(".px-cancel").onclick = renderList;
      form.onsubmit = async e => {
        e.preventDefault();
        const withFb = e.submitter && e.submitter.dataset.fb;
        const v = Object.fromEntries(QUESTIONS.map(([id]) => [id, form.elements[id].value.trim()]));
        if (!v.a && !v.b && !v.c && !prep) { form.querySelector(".px-note").textContent = "Schreib mindestens eine Antwort oder lade ein Bild hoch."; return; }
        const attempt = { ts: Date.now(), ...v, thumb: prep ? prep.thumb : "" };
        const d = load(); d[key] = [...(d[key] || []), attempt];
        if (!save(d)) { attempt.thumb = ""; d[key][d[key].length - 1] = attempt; save(d); }
        // ins Notizheft
        const text = QUESTIONS.map(([id, q]) => v[id] ? `${q}\n${v[id]}` : "").filter(Boolean).join("\n\n");
        if (window.Notes && text) window.Notes.add(k.id, l.id, { text, quelle: "Praxis-Reflexion" });
        if (prep && window.Heft && window.Heft.addImage) window.Heft.addImage(`${key}:b`, prep.blob, `Praxis · ${fmt(attempt.ts)}`);
        if (prep) attempt._blob = prep.blob;
        renderList();
        if (withFb) feedback(d[key].length - 1, null, prep && prep.blob);
      };
      form.querySelector("textarea").focus();
    }

    async function feedback(i, btn, blob) {
      const tries = load()[key] || [], t = tries[i]; if (!t) return;
      const holder = document.createElement("div");
      holder.className = "px-feedback";
      holder.innerHTML = `<span class="label acc">Feedback vom Dozenten</span><p class="thinking">Der Dozent sieht sich dein Ergebnis an …</p>`;
      const art = body.querySelectorAll(".px-try")[tries.length - 1 - i];
      if (btn) btn.replaceWith(holder); else if (art) art.appendChild(holder);
      // Bild für die KI: frisch hochgeladen oder aus dem Vorschaubild
      let images;
      try {
        const lim = window.Tutor.imageLimits ? await window.Tutor.imageLimits() : null;
        if (lim && lim.images) {
          if (blob) images = [blob];
          else if (safeThumb(t.thumb)) images = [dataUrlToBlob(t.thumb)];
        }
      } catch { images = undefined; }
      const lessonText = window.Tutor.htmlToText ? window.Tutor.htmlToText(l.inhalt).slice(0, 6000) : "";
      const prompt = `Du bist Dozent an einer Filmhochschule und gibst einem Studenten Feedback auf seine Praxis-Übung. Deutsch, per Du, ehrlich, konkret und ermutigend – kein Lob ohne Begründung.

LEKTION: ${l.titel} (${k.titel})
LEKTIONSINHALT (Auszug):
${lessonText}

ÜBUNG: ${l.aufgabe}

REFLEXION DES STUDENTEN:
- Was gemacht: ${t.a || "–"}
- Was funktioniert hat / nicht: ${t.b || "–"}
- Nächstes Mal anders: ${t.c || "–"}

${images ? "ANGEHÄNGT: ein Bild des Ergebnisses (Standbild, Foto oder Skizze). Beziehe dich konkret auf Bildgestaltung, Licht, Farbe, Schärfe – was du tatsächlich siehst." : "Es gibt kein Bild – beziehe dich nur auf die Reflexion."}

Antworte in genau diesem Aufbau (Markdown, max. 180 Wörter):
**Was gut funktioniert:** 1–2 konkrete Punkte.
**Was du verbessern kannst:**
- 2–3 konkrete Punkte, jeweils mit dem passenden Fachbegriff aus der Lektion und wie du es umsetzt.
**Nächstes Experiment:** eine kleine, konkrete Übung (max. 2 Sätze).`;
      try {
        const { text } = await window.Tutor.sampleText(prompt, { images, modelTier: "default", cache: false,
          onText: ({ text }) => { holder.innerHTML = `<span class="label acc">Feedback vom Dozenten</span>${md(text)}`; } });
        const d = load(); if (d[key] && d[key][i]) { d[key][i].feedback = text; save(d); }
        if (window.Notes) window.Notes.add(k.id, l.id, { text: text.replace(/\*\*/g, ""), quelle: "Feedback vom Dozenten" });
        renderList();
      } catch (e) {
        holder.innerHTML = `<span class="label acc">Feedback vom Dozenten</span><p class="muted">${esc(window.Tutor.errorText ? window.Tutor.errorText(e) : "Feedback gerade nicht möglich.")}</p>`;
      }
    }

    renderList();
  }

  window.Praxis = { section, bind, openTask };
})();
