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
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* privat-Modus */ } };
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

  const hasContent = n => n && ((n.items && n.items.length) || (n.text && n.text.trim()));
  const entryCount = d => Object.values(d).reduce((a, n) => a + (n.items ? n.items.length : 0) + (n.text && n.text.trim() ? 1 : 0), 0);

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
        <button class="btn small" type="button" id="npCopy">Alles kopieren</button>
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
        ${items.length ? `<ul class="np-items">${items.map(i => `
          <li class="np-item" data-id="${i.id}">
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
    body.innerHTML = list.length
      ? list.map(k => sectionHtml(k, d[k], k === ctxKey)).join("")
      : `<div class="np-empty">
          <p class="np-empty-title">Dein Notizheft ist noch leer.</p>
          <p>Markiere Text in einer Lektion und tippe auf <b>＋ In Notizheft</b>, oder tippe in den Reels auf <b>☆ Merken</b>. Jeder Eintrag landet automatisch unter der passenden Lektion.</p>
          <a class="btn small" href="#/kurse">Zu den Kursen</a>
        </div>`;
    body.querySelectorAll("textarea").forEach(autosize);
    if (focusKey) {
      const sec = body.querySelector(`[data-key="${focusKey}"]`);
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
    if (e.target.closest(".np-close")) close();
    if (e.target.closest(".np-link")) { if (matchMedia("(max-width: 1199px)").matches) close(); }
  });

  panel.querySelector("#npCopy").onclick = () => {
    const d = load();
    const txt = order.filter(k => hasContent(d[k])).map(k => {
      const n = d[k], { kurs, lesson } = info[k];
      return [`## ${lesson.titel}`, `(${kurs.titel})`, "",
        ...n.items.map(i => `> ${i.text.replace(/\n/g, "\n> ")}\n  — ${i.quelle}`),
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

  window.Notes = { add, removeRef, open, close, toggle, updateBadge };
})();
