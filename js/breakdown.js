/*
 * Breakdown-Trainer: Filmbilder analysieren wie ein Kameramann (Methode nach The Wandering DP).
 * 1. Standbild hochladen  2. selbst einschätzen  3. Auflösung durch den KI-Dozenten (mit Vergleich).
 * Ergebnisse landen im Notizheft unter der Lektion „Licht wie ein Commercial-DP“.
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LESSON = ["film", "licht-commercial"];

  const FRAGEN = [
    { id: "groesse", q: "Einstellungsgröße", opts: ["Totale", "Halbtotale", "Halbnah", "Nah", "Groß", "Detail"] },
    { id: "perspektive", q: "Perspektive", opts: ["Normalsicht", "Untersicht", "Aufsicht", "Dutch Angle", "Over-the-Shoulder"] },
    { id: "key", q: "Woher kommt das Key Light?", opts: ["Links", "Rechts", "Von vorne", "Von oben", "Gegenlicht"] },
    { id: "haerte", q: "Hart oder weich?", opts: ["Hart", "Eher hart", "Eher weich", "Sehr weich"] },
    { id: "kontrast", q: "Lichtverhältnis Key : Fill", opts: ["ca. 2:1 (flach)", "ca. 4:1", "ca. 8:1+ (dramatisch)"] },
    { id: "farbe", q: "Farbstimmung", opts: ["Warm", "Kalt", "Neutral", "Teal & Orange", "Entsättigt", "Monochrom"] }
  ];

  function mount(root) {
    let img = null, thumb = "", picks = {};
    const ai = () => !!(window.Tutor && window.Tutor.aiAvailable());

    root.innerHTML = `
      <div class="sec-head"><h2>Breakdown-Trainer</h2><span class="label">Sehen lernen</span></div>
      <p class="lead bd-lead">Lade ein Standbild aus einem Film, Werbespot oder Musikvideo hoch und analysiere es selbst – Licht, Bildgröße, Perspektive, Farbe. Erst danach löst der Dozent auf. So trainierst du dein Auge wie ein Kameramann.</p>
      <div class="bd">
        <label class="bd-drop" for="bdFile">
          <input type="file" id="bdFile" accept="image/*" hidden>
          <span class="bd-drop-in"><b>Standbild hochladen</b><span>Screenshot aus einem Film oder Reel · JPG/PNG</span></span>
          <img class="bd-img" alt="" hidden>
        </label>
        <div class="bd-side">
          <div class="bd-qs">${FRAGEN.map(f => `
            <fieldset class="bd-q"><legend>${f.q}</legend>
              <div class="bd-opts">${f.opts.map(o => `<button type="button" class="chip" data-f="${f.id}" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>
            </fieldset>`).join("")}
            <label class="bd-free"><span>Wie wirkt das Bild – und warum?</span><textarea id="bdFree" rows="2" placeholder="z. B. einsam, weil viel Negativraum und kaltes Licht …"></textarea></label>
          </div>
          <div class="row-gap">
            <button type="button" class="btn primary" id="bdGo" disabled>${ai() ? "Auflösen lassen" : "Im Notizheft speichern"}</button>
            <button type="button" class="btn" id="bdReset">Neues Bild</button>
          </div>
          <p class="muted bd-note" id="bdNote">${ai() ? "Tipp: Schau auf Schattenkanten (Größe der Quelle), Glanzpunkte in den Augen (Richtung) und die Schattenseite (Kontrast)." : "Ohne KI-Verbindung speicherst du deine Analyse – vergleiche sie selbst mit der Breakdown-Methode aus der Lektion."}</p>
        </div>
      </div>
      <div id="bdOut"></div>`;

    const go = root.querySelector("#bdGo");
    const update = () => { go.disabled = !img || Object.keys(picks).length < 3; };

    root.querySelector("#bdFile").onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        c.toBlob(b => { img = b; update(); }, "image/jpeg", 0.86);
        const t = document.createElement("canvas"), ts = Math.min(1, 480 / Math.max(im.width, im.height));
        t.width = Math.round(im.width * ts); t.height = Math.round(im.height * ts); t.getContext("2d").drawImage(im, 0, 0, t.width, t.height);
        thumb = t.toDataURL("image/jpeg", 0.8);
        const el = root.querySelector(".bd-img"); el.src = thumb; el.hidden = false;
        root.querySelector(".bd-drop").classList.add("has");
        URL.revokeObjectURL(im.src);
      };
      im.src = URL.createObjectURL(f);
    };
    root.querySelectorAll(".chip").forEach(b => b.onclick = () => {
      const f = b.dataset.f;
      if (picks[f] === b.dataset.v) delete picks[f]; else picks[f] = b.dataset.v;
      root.querySelectorAll(`.chip[data-f="${f}"]`).forEach(x => x.classList.toggle("on", picks[f] === x.dataset.v));
      update();
    });
    root.querySelector("#bdReset").onclick = () => mount(root);

    go.onclick = async () => {
      const free = root.querySelector("#bdFree").value.trim();
      const mine = FRAGEN.map(f => `${f.q}: ${picks[f.id] || "–"}`).join("\n") + (free ? `\nWirkung: ${free}` : "");
      const out = root.querySelector("#bdOut");
      const save = (fb) => {
        if (window.Notes) window.Notes.add(LESSON[0], LESSON[1], { text: `Breakdown – meine Analyse:\n${mine}${fb ? `\n\nAuflösung:\n${fb.replace(/\*\*/g, "")}` : ""}`, quelle: "Breakdown-Trainer" });
        if (window.Heft && window.Heft.addImage && img) window.Heft.addImage(`${LESSON[0]}/${LESSON[1]}:b`, img, "Breakdown");
      };
      if (!ai()) { save(""); out.innerHTML = `<div class="bd-result"><span class="label acc">Gespeichert</span><p>Deine Analyse und das Bild liegen im Notizheft unter „Licht wie ein Commercial-DP“.</p></div>`; return; }
      go.disabled = true;
      out.innerHTML = `<div class="bd-result"><span class="label acc">Auflösung</span><p class="thinking">Der Dozent analysiert das Bild …</p></div>`;
      const box = out.querySelector(".bd-result");
      const prompt = `Du bist Kameramann und Dozent an einer Filmhochschule und machst einen Licht- und Bild-Breakdown wie „The Wandering DP“. Angehängt ist ein Standbild. Ein Student hat es zuerst selbst analysiert.

ANALYSE DES STUDENTEN:
${mine}

Aufgabe: Analysiere das Bild selbst und vergleiche dann mit der Einschätzung. Deutsch, per Du, konkret – begründe alles mit dem, was im Bild sichtbar ist (Schattenkanten, Glanzpunkte in den Augen, Helligkeit der Schattenseite, Hintergrund, Farben).

Aufbau (Markdown, max. 230 Wörter):
**Vergleich:** pro Kategorie eine Zeile „✓“ oder „✗“ + kurze Korrektur, z. B. „- Key Light: ✗ – kommt von rechts, sichtbar am Schatten der Nase.“
**So ist es vermutlich gelichtet:** 2–3 Sätze zum wahrscheinlichen Aufbau (Quellen, Größe, Position, Negative Fill, Backlight).
**Darauf achten beim nächsten Bild:** ein konkreter Seh-Tipp.
Wenn etwas im Bild nicht eindeutig ist, sag das ehrlich.`;
      try {
        const lim = await window.Tutor.imageLimits();
        if (!lim || !lim.images) throw { code: "images_unavailable" };
        const md = window.Tutor.md;
        const { text } = await window.Tutor.sampleText(prompt, { images: [img], modelTier: "default", cache: false,
          onText: ({ text }) => { box.innerHTML = `<span class="label acc">Auflösung</span>${md(text)}`; } });
        if (window.Terms) window.Terms.annotate(box);
        save(text);
        box.insertAdjacentHTML("beforeend", `<p class="muted bd-saved">Im Notizheft gespeichert – unter „Licht wie ein Commercial-DP“.</p>`);
      } catch (e) {
        box.innerHTML = `<span class="label acc">Auflösung</span><p class="muted">${esc(e && e.code === "images_unavailable" ? "Bildanalyse ist in dieser Ansicht nicht verfügbar. Deine Analyse wurde im Notizheft gespeichert." : (window.Tutor.errorText ? window.Tutor.errorText(e) : "Gerade nicht möglich."))}</p>`;
        if (e && e.code === "images_unavailable") save("");
      } finally { go.disabled = false; }
    };
  }

  window.Breakdown = { mount };
})();
