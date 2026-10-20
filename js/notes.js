/*
 * Notizheft: Seitenleiste mit Notizen pro Lektion.
 * - Gemerkte Inhalte (Textauswahl, Reels-„Merken“) landen als Zitat unter der Lektion.
 * - Pro Lektion wird automatisch eine Überschrift angelegt; darunter ein freies Notizfeld.
 * Gespeichert wird lokal im Browser (localStorage "veye:notes").
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KEY = "veye:notes";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = d => {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* privat-Modus */ }
    window.dispatchEvent(new CustomEvent("veye:notes"));
  };
  const pad2 = n => String(n).padStart(2, "0");

  // Lehrplan-Reihenfolge und Titel
  const order = [], info = {};
  (window.KURSE || []).forEach((k, ki) => k.lektionen.forEach((l, li) => {
    const key = `${k.id}/${l.id}`;
    order.push(key);
    info[key] = { kurs: k, lesson: l, label: `${pad2(ki + 1)}.${pad2(li + 1)} · ${k.titel}` };
  }));

  let ctxKey = null;       // aktuelle Lektion (aus der Route)
  let isOpen = false;

  const hasContent = n => n && ((n.items && n.items.length) || (n.text && n.text.trim()) || n.summary);
  const entryCount = d => Object.values(d).reduce((a, n) => a + (n.items ? n.items.length : 0) + (n.text && n.text.trim() ? 1 : 0) + (n.summary ? 1 : 0), 0);
  const isDone = key => { try { return !!(JSON.parse(localStorage.getItem("veye:done")) || {})[key]; } catch { return false; } };

  /* ---------------- Daten-API ---------------- */
  function add(kursId, lessonId, { text, quelle = "Markiert", ref = null }) {
    const key = `${kursId}/${lessonId}`;
    if (!info[key] || !text || !text.trim()) return;
    const d = load();
    const n = d[key] || (d[key] = { items: [], text: "", created: Date.now() });
    if (ref && n.items.some(i => i.ref === ref)) return;
    n.items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text: text.trim().slice(0, 2000), quelle, ref, ts: Date.now() });
    n.updated = Date.now();
    save(d);
    updateBadge(true);
    toast(`Im Notizheft unter „${info[key].lesson.titel}“`, () => open(key));
    if (isOpen) render(key);
  }
  function removeRef(ref) {
    const d = load();
    let changed = false;
    Object.values(d).forEach(n => { const before = n.items.length; n.items = n.items.filter(i => i.ref !== ref); changed = changed || before !== n.items.length; });
    if (changed) { save(d); updateBadge(); if (isOpen) render(); }
  }

  /* ---------------- UI-Gerüst ---------------- */
  const tab = document.createElement("button");
  tab.className = "notes-tab";
  tab.type = "button";
  tab.setAttribute("aria-label", "Notizheft öffnen");
  tab.innerHTML = `<span>Notizheft</span><b class="notes-count"></b>`;
  document.body.appendChild(tab);

  const panel = document.createElement("aside");
  panel.className = "notes-panel";
  panel.setAttribute("aria-label", "Notizheft");
  panel.hidden = true;
  panel.innerHTML = `
    <div class="np-head">
      <div><span class="label acc">Notizheft</span><div class="np-meta" id="npMeta"></div></div>
      <div class="np-actions">
        <a class="btn small" href="#/notizheft" id="npBook">Als Heft</a>
        <button class="btn small" type="button" id="npCopy">Kopieren</button>
        <button class="np-close" type="button" aria-label="Notizheft schließen">✕</button>
      </div>
    </div>
    <div class="np-body" id="npBody"></div>
    <textarea class="np-export" id="npExport" readonly hidden aria-label="Alle Notizen als Text"></textarea>`;
  document.body.appendChild(panel);

  const toastEl = document.createElement("div");
  toastEl.className = "notes-toast";
  toastEl.setAttribute("role", "status");
  toastEl.hidden = true;
  document.body.appendChild(toastEl);

  const selBtn = document.createElement("button");
  selBtn.className = "sel-note";
  selBtn.type = "button";
  selBtn.hidden = true;
  selBtn.innerHTML = `<span>＋</span> In Notizheft`;
  document.body.appendChild(selBtn);

  function updateBadge(bump) {
    const n = entryCount(load());
    document.querySelectorAll(".notes-count").forEach(el => {
      el.textContent = n ? String(n) : "";
      if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
    });
  }

  let toastTimer = null;
  function toast(msg, action) {
    toastEl.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">Öffnen</button>` : ""}`;
    toastEl.hidden = false;
    toastEl.classList.remove("in"); void toastEl.offsetWidth; toastEl.classList.add("in");
    const b = toastEl.querySelector("button");
    if (b) b.onclick = () => { toastEl.hidden = true; action(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3200);
  }

  /* ---------------- Lernzettel ---------------- */
  const pending = new Set();
  const queue = [];
  let running = false;

  const plain = html => {
    if (window.Tutor && window.Tutor.htmlToText) return window.Tutor.htmlToText(html);
    const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim();
  };
  const firstSentence = t => { const m = String(t).replace(/\s+/g, " ").trim().match(/^.{20,220}?[.!?](\s|$)/); return (m ? m[0] : String(t).slice(0, 200)).trim(); };
  const clean = (v, max = 260) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

  // Ohne KI: Lernzettel direkt aus den Lektionsdaten
  function autoSummary(key) {
    const { lesson } = info[key];
    const root = document.createElement("div");
    root.innerHTML = lesson.inhalt;
    const kern = [], werte = [];
    let heading = null, tookForHeading = false;
    for (const el of Array.from(root.children)) {
      const tag = el.tagName;
      if (tag === "H3") { heading = el.textContent.trim(); tookForHeading = false; continue; }
      if (!tookForHeading && (tag === "P" || tag === "UL" || tag === "OL") && kern.length < 5) {
        const t = tag === "P" ? firstSentence(el.textContent) : clean(el.querySelector("li")?.textContent, 200);
        if (t.length > 25) { kern.push(heading ? `${heading.replace(/^\d+\.\s*/, "")}: ${t}` : t); tookForHeading = true; }
      }
      if (tag === "TABLE" && werte.length < 6) {
        Array.from(el.querySelectorAll("tr")).filter(tr => tr.querySelector("td")).slice(0, 6 - werte.length).forEach(tr => {
          const c = Array.from(tr.children).map(td => clean(td.textContent, 90));
          werte.push({ k: c[0], v: c.slice(1).join(" · ") });
        });
      }
    }
    const tip = root.querySelector(".box.tip, .box");
    const tipText = tip ? clean(Array.from(tip.childNodes).filter(n => n.nodeName !== "H4").map(n => n.textContent).join(" "), 600) : "";
    const twoSentences = (tipText.match(/[^.!?]+[.!?]+/g) || [tipText]).slice(0, 2).join(" ").trim();
    const merksatz = tipText ? clean(twoSentences, 280) : (kern[0] || "");
    const seen = new Set();
    const begriffe = (window.Terms ? window.Terms.find(lesson.inhalt) : []).filter(b => b.d && !seen.has(b.t) && seen.add(b.t)).slice(0, 6);
    const fragen = (lesson.quiz || []).map(q => ({ q: q.frage, a: `${q.antworten[q.richtig]}${q.erklaerung ? " – " + q.erklaerung : ""}` }));
    return { kind: "auto", ts: Date.now(), kern, werte, begriffe, merksatz, fragen };
  }

  // Mit KI: Lernzettel aus Lektion + eigenen Markierungen/Notizen
  async function aiSummary(key) {
    const { kurs, lesson } = info[key];
    const n = load()[key] || {};
    const eigene = [...(n.items || []).map(i => "- " + clean(i.text, 400)), n.text ? "Eigene Notiz: " + clean(n.text, 800) : ""].filter(Boolean).join("\n");
    const prompt = `Du bist ein Dozent an einer Filmhochschule und schreibst einen kompakten Lernzettel zum Wiederholen – auf Deutsch, per Du, präzise und praxisnah.
Nutze NUR Fakten aus dem Lektionstext. Keine Einleitung, keine Floskeln.

Antworte ausschließlich mit einem JSON-Objekt in genau dieser Form:
{"kern":["…"],"werte":[{"k":"…","v":"…"}],"begriffe":[{"t":"…","d":"…"}],"merksatz":"…","fragen":[{"q":"…","a":"…"}],"fokus":"…"}

Regeln:
- kern: 4–5 Kernaussagen, je ein Satz, das Wichtigste zuerst.
- werte: bis zu 6 konkrete Zahlen/Werte/Einstellungen aus der Lektion (k = wofür, v = Wert). Leeres Array, wenn es keine gibt.
- begriffe: 4–6 Fachbegriffe mit Erklärung in max. 15 Wörtern.
- merksatz: ein einprägsamer Satz.
- fragen: 4 Selbsttest-Fragen, gemischt aus Verständnis und Anwendung (z. B. für ein Instagram-Reel), mit kurzer Antwort.
- fokus: ein Satz, der an die Markierungen/Notizen des Studenten anknüpft; leerer String, wenn keine vorhanden sind.

KURS: ${kurs.titel}
LEKTION: ${lesson.titel}

LEKTIONSTEXT:
${plain(lesson.inhalt).slice(0, 12000)}

PRAXIS-ÜBUNG: ${lesson.aufgabe || "–"}

MARKIERUNGEN UND NOTIZEN DES STUDENTEN:
${eigene || "keine"}`;
    const r = await window.Tutor.sampleJson(prompt, { modelTier: "default" });
    const arr = (v, max) => (Array.isArray(v) ? v : []).slice(0, max);
    const sum = {
      kind: "ki", ts: Date.now(),
      kern: arr(r && r.kern, 6).map(x => clean(x, 300)).filter(Boolean),
      werte: arr(r && r.werte, 8).map(x => ({ k: clean(x && x.k, 90), v: clean(x && x.v, 140) })).filter(x => x.k && x.v),
      begriffe: arr(r && r.begriffe, 8).map(x => ({ t: clean(x && x.t, 60), d: clean(x && x.d, 200) })).filter(x => x.t && x.d),
      merksatz: clean(r && r.merksatz, 260),
      fragen: arr(r && r.fragen, 6).map(x => ({ q: clean(x && x.q, 260), a: clean(x && x.a, 400) })).filter(x => x.q && x.a),
      fokus: clean(r && r.fokus, 300)
    };
    if (!sum.kern.length) throw { code: "invalid_json" };
    return sum;
  }

  function storeSummary(key, sum) {
    const d = load();
    const n = d[key] || (d[key] = { items: [], text: "", created: Date.now() });
    n.summary = sum; n.updated = Date.now();
    save(d);
  }

  /**
   * Lernzettel sicherstellen. Mit KI (wenn verfügbar), sonst aus den Lektionsdaten.
   * force: vorhandenen Lernzettel neu erstellen.
   */
  async function ensureSummary(kursId, lessonId, { force = false, quiet = false } = {}) {
    const key = `${kursId}/${lessonId}`;
    if (!info[key] || pending.has(key)) return;
    const existing = (load()[key] || {}).summary;
    if (existing && !force) return;
    if (window.Tutor) await window.Tutor.aiReady;
    const useAi = !!(window.Tutor && window.Tutor.aiAvailable());
    if (!useAi) {
      storeSummary(key, autoSummary(key));
      updateBadge(true);
      if (!quiet) toast(`Lernzettel für „${info[key].lesson.titel}“ im Notizheft`, () => open(key));
      if (isOpen) render();
      return;
    }
    pending.add(key);
    queue.push(key);
    if (isOpen) render();
    if (!quiet) toast(`Der Assistent schreibt deinen Lernzettel zu „${info[key].lesson.titel}“ …`);
    runQueue();
  }

  async function runQueue() {
    if (running) return;
    running = true;
    while (queue.length) {
      const key = queue.shift();
      try {
        storeSummary(key, await aiSummary(key));
        toast(`Lernzettel für „${info[key].lesson.titel}“ ist fertig`, () => open(key));
      } catch (e) {
        // Fallback, damit trotzdem etwas im Heft steht
        if (!(load()[key] || {}).summary) storeSummary(key, autoSummary(key));
        const msg = window.Tutor && window.Tutor.errorText ? window.Tutor.errorText(e) : "";
        toast(`Lernzettel aus der Lektion erstellt${msg ? " – KI gerade nicht verfügbar" : ""}`, () => open(key));
        if (e && e.code === "rate_limited") { queue.forEach(k => pending.delete(k)); queue.length = 0; }
      }
      pending.delete(key);
      updateBadge(true);
      if (isOpen) render();
    }
    running = false;
  }

  function summaryHtml(key, n) {
    if (pending.has(key)) return `<div class="np-sum loading"><div class="np-sum-head"><span class="label acc">Lernzettel</span></div><p class="thinking">Der Assistent fasst die Lektion zusammen …</p></div>`;
    const s = n && n.summary;
    const ai = !!(window.Tutor && window.Tutor.aiAvailable());
    if (!s) return `<div class="np-sum empty"><div><span class="label acc">Lernzettel</span><p>Das Wichtigste dieser Lektion – geordnet zum Wiederholen.</p></div>
      <button type="button" class="btn small primary np-sum-make">${ai ? "Mit KI erstellen" : "Erstellen"}</button></div>`;
    return `
      <div class="np-sum">
        <div class="np-sum-head">
          <span class="label acc">Lernzettel</span>
          <span class="np-kind">${s.kind === "ki" ? "KI-Assistent" : "aus der Lektion"} · ${fmtDate(s.ts)}</span>
        </div>
        ${s.fokus ? `<p class="np-fokus">${esc(s.fokus)}</p>` : ""}
        ${s.kern && s.kern.length ? `<div class="np-block"><span class="np-bl">Kernaussagen</span><ol class="np-kern">${s.kern.map(k => `<li>${esc(k)}</li>`).join("")}</ol></div>` : ""}
        ${s.werte && s.werte.length ? `<div class="np-block"><span class="np-bl">Wichtige Werte</span><dl class="np-werte">${s.werte.map(w => `<div><dt>${esc(w.k)}</dt><dd>${esc(w.v)}</dd></div>`).join("")}</dl></div>` : ""}
        ${s.begriffe && s.begriffe.length ? `<div class="np-block"><span class="np-bl">Begriffe</span><dl class="np-begr">${s.begriffe.map(b => `<div><dt>${esc(b.t)}</dt><dd>${esc(b.d)}</dd></div>`).join("")}</dl></div>` : ""}
        ${s.merksatz ? `<div class="np-merk"><span class="np-bl">Merksatz</span><p>${esc(s.merksatz)}</p></div>` : ""}
        ${s.fragen && s.fragen.length ? `<div class="np-block"><span class="np-bl">Selbsttest · tippen zum Aufdecken</span>${s.fragen.map((f, i) => `<details class="np-q"><summary><span>${i + 1}</span>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>` : ""}
        <div class="np-sum-actions">
          ${ai ? `<button type="button" class="np-sum-make" data-force="1">${s.kind === "ki" ? "Neu erstellen" : "Mit KI verbessern"}</button>` : ""}
          <button type="button" class="np-sum-del">Entfernen</button>
        </div>
      </div>`;
  }

  /* ---------------- Rendern ---------------- */
  const fmtDate = ts => new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

  function sectionHtml(key, n, current) {
    const { kurs, lesson, label } = info[key];
    const items = (n && n.items) || [];
    return `
      <section class="np-sec k-${kurs.id} ${current ? "current" : ""}" data-key="${key}">
        <header class="np-sec-head">
          <span class="label">${current ? "Aktuelle Lektion · " : ""}${esc(label)}</span>
          <h3>${esc(lesson.titel)}</h3>
          <a href="#/lektion/${kurs.id}/${lesson.id}" class="np-link">Zur Lektion →</a>
        </header>
        ${summaryHtml(key, n)}
        ${items.length ? `<ul class="np-items">${items.map(i => `
          <li class="np-item" data-id="${esc(i.id)}">
            <blockquote>${esc(i.text)}</blockquote>
            <div class="np-item-foot"><span>${esc(i.quelle)} · ${fmtDate(i.ts)}</span><button type="button" class="np-del" aria-label="Eintrag löschen">Löschen</button></div>
          </li>`).join("")}</ul>` : ""}
        <label class="np-own"><span class="label">Eigene Notizen</span>
          <textarea rows="3" placeholder="${current && !items.length ? "Schreib hier mit – oder markiere Text in der Lektion …" : "Weitere Gedanken, Fragen, Ideen …"}">${esc((n && n.text) || "")}</textarea>
        </label>
        <div class="np-saved" aria-live="polite"></div>
      </section>`;
  }

  function render(focusKey) {
    const d = load();
    const keys = order.filter(k => hasContent(d[k]));
    const showCurrent = ctxKey && info[ctxKey];
    const list = showCurrent ? [ctxKey, ...keys.filter(k => k !== ctxKey)] : keys;
    setMeta(d);
    const body = panel.querySelector("#npBody");
    const missing = order.filter(k => isDone(k) && !(d[k] && d[k].summary) && !pending.has(k));
    const hint = missing.length ? `<div class="np-hint"><p>Für <b>${missing.length}</b> abgeschlossene ${missing.length === 1 ? "Lektion fehlt" : "Lektionen fehlt"} noch ein Lernzettel.</p>
      <button type="button" class="btn small np-make-all">Alle erstellen</button></div>` : "";
    body.innerHTML = list.length
      ? hint + list.map(k => sectionHtml(k, d[k], k === ctxKey)).join("")
      : `<div class="np-empty">
          <p class="np-empty-title">Dein Notizheft ist noch leer.</p>
          <p>Markiere Text in einer Lektion und tippe auf <b>＋ In Notizheft</b>, oder tippe in den Reels auf <b>☆ Merken</b>. Jeder Eintrag landet automatisch unter der passenden Lektion.</p>
          <a class="btn small" href="#/kurse">Zu den Kursen</a>
        </div>` + hint;
    body.querySelectorAll("textarea").forEach(autosize);
    if (focusKey) {
      const sec = body.querySelector(`[data-key="${CSS.escape(focusKey)}"]`);
      if (sec) { sec.scrollIntoView({ block: "start" }); sec.classList.add("flash"); }
    }
  }

  function setMeta(d) {
    const lessons = order.filter(k => hasContent(d[k])).length, entries = entryCount(d);
    panel.querySelector("#npMeta").textContent = lessons
      ? `${lessons} ${lessons === 1 ? "Lektion" : "Lektionen"} · ${entries} ${entries === 1 ? "Eintrag" : "Einträge"}`
      : "Noch leer";
  }

  function autosize(t) { t.style.height = "auto"; t.style.height = Math.min(480, t.scrollHeight + 2) + "px"; }

  // Eingaben speichern (entprellt)
  const timers = {};
  panel.addEventListener("input", e => {
    const t = e.target.closest("textarea"); if (!t || t.id === "npExport") return;
    autosize(t);
    const sec = t.closest(".np-sec"), key = sec.dataset.key;
    const status = sec.querySelector(".np-saved");
    status.textContent = "…";
    clearTimeout(timers[key]);
    timers[key] = setTimeout(() => {
      const d = load();
      const n = d[key] || (d[key] = { items: [], text: "", created: Date.now() });
      n.text = t.value; n.updated = Date.now();
      if (!hasContent(n)) delete d[key];
      save(d); updateBadge();
      status.textContent = "Gespeichert";
      setMeta(d);
    }, 400);
  });

  panel.addEventListener("click", e => {
    const del = e.target.closest(".np-del");
    if (del) {
      if (!del.dataset.armed) { del.dataset.armed = "1"; del.textContent = "Wirklich löschen?"; return; }
      const key = del.closest(".np-sec").dataset.key, id = del.closest(".np-item").dataset.id;
      const d = load();
      if (d[key]) {
        const item = d[key].items.find(i => i.id === id);
        d[key].items = d[key].items.filter(i => i.id !== id);
        if (!hasContent(d[key])) delete d[key];
        save(d);
        // auch die Merken-Markierung im Reels-Feed aufheben
        if (item && item.ref) {
          try { const s = JSON.parse(localStorage.getItem("veye:saved")) || []; localStorage.setItem("veye:saved", JSON.stringify(s.filter(x => x.id !== item.ref))); } catch { /* egal */ }
        }
      }
      updateBadge(); render();
      return;
    }
    const make = e.target.closest(".np-sum-make");
    if (make) {
      const [k, l] = make.closest(".np-sec").dataset.key.split("/");
      ensureSummary(k, l, { force: !!make.dataset.force });
      return;
    }
    const sdel = e.target.closest(".np-sum-del");
    if (sdel) {
      if (!sdel.dataset.armed) { sdel.dataset.armed = "1"; sdel.textContent = "Wirklich entfernen?"; return; }
      const key = sdel.closest(".np-sec").dataset.key, d = load();
      if (d[key]) { delete d[key].summary; if (!hasContent(d[key])) delete d[key]; save(d); }
      updateBadge(); render();
      return;
    }
    if (e.target.closest(".np-make-all")) {
      order.filter(k => isDone(k) && !(load()[k] || {}).summary).forEach((k, i) => { const [a, b] = k.split("/"); ensureSummary(a, b, { quiet: i > 0 }); });
      return;
    }
    if (e.target.closest(".np-close")) close();
    if (e.target.closest("#npBook")) close();
    if (e.target.closest(".np-link")) { if (matchMedia("(max-width: 1199px)").matches) close(); }
  });

  panel.querySelector("#npCopy").onclick = () => {
    const d = load();
    const txt = order.filter(k => hasContent(d[k])).map(k => {
      const n = d[k], { kurs, lesson } = info[k];
      const s = n.summary;
      const zettel = s ? [
        "LERNZETTEL",
        ...(s.kern || []).map((k, i) => `${i + 1}. ${k}`),
        ...(s.werte && s.werte.length ? ["", "Wichtige Werte:", ...s.werte.map(w => `- ${w.k}: ${w.v}`)] : []),
        ...(s.begriffe && s.begriffe.length ? ["", "Begriffe:", ...s.begriffe.map(b => `- ${b.t}: ${b.d}`)] : []),
        ...(s.merksatz ? ["", `Merksatz: ${s.merksatz}`] : []),
        ...(s.fragen && s.fragen.length ? ["", "Selbsttest:", ...s.fragen.map((f, i) => `${i + 1}. ${f.q}\n   → ${f.a}`)] : []),
        ""] : [];
      return [`## ${lesson.titel}`, `(${kurs.titel})`, "", ...zettel,
        ...(n.items || []).map(i => `> ${i.text.replace(/\n/g, "\n> ")}\n  — ${i.quelle}`),
        n.text && n.text.trim() ? `\n${n.text.trim()}` : ""].join("\n");
    }).join("\n\n");
    const out = panel.querySelector("#npExport");
    if (!txt) { toast("Noch nichts zum Kopieren."); return; }
    const done = () => toast("Alle Notizen kopiert.");
    const fallback = () => { out.hidden = false; out.value = txt; out.focus(); out.select(); toast("Text ist markiert – jetzt kopieren."); };
    try { navigator.clipboard.writeText(txt).then(done, fallback); } catch { fallback(); }
  };

  /* ---------------- Öffnen / Schließen ---------------- */
  function open(focusKey) {
    isOpen = true;
    panel.hidden = false;
    document.documentElement.classList.add("notes-open");
    requestAnimationFrame(() => panel.classList.add("in"));
    panel.querySelector("#npExport").hidden = true;
    render(focusKey || ctxKey);
    tab.setAttribute("aria-expanded", "true");
  }
  function close() {
    isOpen = false;
    panel.classList.remove("in");
    document.documentElement.classList.remove("notes-open");
    tab.setAttribute("aria-expanded", "false");
    setTimeout(() => { if (!isOpen) panel.hidden = true; }, 260);
  }
  const toggle = () => (isOpen ? close() : open());
  tab.onclick = toggle;
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen && !document.querySelector(".term-tip:not([hidden])")) close(); });

  /* ---------------- Text markieren → Notiz ---------------- */
  let selCtx = null;
  function placeSelBtn() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { selBtn.hidden = true; return; }
    const text = sel.toString().trim();
    const node = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
    const scope = node && node.closest("[data-notes-k]");
    if (!scope || text.length < 3 || node.closest(".notes-panel, textarea, input")) { selBtn.hidden = true; return; }
    selCtx = { k: scope.dataset.notesK, l: scope.dataset.notesL, text, quelle: scope.dataset.notesSrc || "Markiert" };
    const r = sel.getRangeAt(0).getBoundingClientRect();
    selBtn.hidden = false;
    const w = selBtn.offsetWidth, h = selBtn.offsetHeight;
    const vw = document.documentElement.clientWidth;
    let top = r.top - h - 10;
    if (top < 70) top = r.bottom + 10;
    top = Math.max(70, Math.min(window.innerHeight - h - 12, top));
    selBtn.style.left = Math.max(10, Math.min(vw - w - 10, r.left + r.width / 2 - w / 2)) + "px";
    selBtn.style.top = top + "px";
  }
  let selTimer = null;
  document.addEventListener("selectionchange", () => { clearTimeout(selTimer); selTimer = setTimeout(placeSelBtn, 180); });
  document.addEventListener("scroll", () => { if (!selBtn.hidden) placeSelBtn(); }, true);
  selBtn.addEventListener("mousedown", e => e.preventDefault()); // Auswahl nicht verlieren
  selBtn.onclick = () => {
    if (!selCtx) return;
    add(selCtx.k, selCtx.l, { text: selCtx.text, quelle: selCtx.quelle });
    window.getSelection().removeAllRanges();
    selBtn.hidden = true;
  };

  /* ---------------- Kontext aus der Route ---------------- */
  function syncRoute() {
    const m = location.hash.match(/^#\/lektion\/([^/?]+)\/([^/?]+)/);
    ctxKey = m && info[`${m[1]}/${m[2]}`] ? `${m[1]}/${m[2]}` : null;
    selBtn.hidden = true;
    if (isOpen) render();
  }
  window.addEventListener("hashchange", syncRoute);
  syncRoute();
  updateBadge();

  window.Notes = { add, removeRef, open, close, toggle, updateBadge, ensureSummary };
})();
