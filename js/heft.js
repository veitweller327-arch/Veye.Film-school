/*
 * Digitales Notizheft (#/notizheft)
 * Realistisches Notizbuch mit Einband, Doppelseiten, Umblätter-Animation,
 * Stift/Marker/Radierer, Skizzen-Upload (Polaroids) und Haftnotizen.
 *
 * Daten:
 *  - Lektionsnotizen & Lernzettel: localStorage "veye:notes" (gemeinsam mit dem Notizheft-Panel)
 *  - Zeichnungen, Haftnotizen, Bildpositionen, freie Seiten: localStorage "veye:heft"
 *  - Bilddateien: IndexedDB "veye-heft" (Fallback: Data-URL im Eintrag)
 * Koordinaten sind relativ zur Seitenbreite gespeichert (x, y, w in Einheiten von W).
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad2 = n => String(n).padStart(2, "0");

  const HKEY = "veye:heft";
  const loadHeft = () => { try { return JSON.parse(localStorage.getItem(HKEY)) || {}; } catch { return {}; } };
  const saveHeft = h => { try { localStorage.setItem(HKEY, JSON.stringify(h)); return true; } catch { return false; } };
  const loadNotes = () => { try { return JSON.parse(localStorage.getItem("veye:notes")) || {}; } catch { return {}; } };

  /* ---------------- Bilder in IndexedDB ---------------- */
  let dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(res => {
      try {
        const r = indexedDB.open("veye-heft", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("bilder");
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(null);
      } catch { res(null); }
    });
    return dbP;
  }
  async function putImage(id, blob) {
    const d = await db(); if (!d) return false;
    return new Promise(res => { const tx = d.transaction("bilder", "readwrite"); tx.objectStore("bilder").put(blob, id); tx.oncomplete = () => res(true); tx.onerror = () => res(false); });
  }
  const urlCache = {};
  async function imageUrl(item) {
    if (item.data) return item.data;
    if (urlCache[item.id]) return urlCache[item.id];
    const d = await db(); if (!d) return "";
    return new Promise(res => {
      const rq = d.transaction("bilder").objectStore("bilder").get(item.id);
      rq.onsuccess = () => { const b = rq.result; res(b ? (urlCache[item.id] = URL.createObjectURL(b)) : ""); };
      rq.onerror = () => res("");
    });
  }
  async function delImage(id) {
    const d = await db(); if (!d) return;
    d.transaction("bilder", "readwrite").objectStore("bilder").delete(id);
  }
  // Bild verkleinern (max. 1400 px), als JPEG
  function shrink(file) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1400 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        c.toBlob(b => b ? res({ blob: b, ratio: c.height / c.width }) : rej(), "image/jpeg", 0.86);
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  /* ---------------- Seiten zusammenstellen ---------------- */
  function lessonInfo() {
    const out = [];
    (window.KURSE || []).forEach((k, ki) => k.lektionen.forEach((l, li) => out.push({ key: `${k.id}/${l.id}`, kurs: k, lesson: l, no: `${pad2(ki + 1)}.${pad2(li + 1)}` })));
    return out;
  }
  function buildPages() {
    const notes = loadNotes(), heft = loadHeft();
    const pages = [{ id: "innen", type: "innen" }, { id: "inhalt", type: "inhalt" }];
    lessonInfo().forEach(x => {
      const n = notes[x.key];
      const used = n && ((n.items && n.items.length) || (n.text && n.text.trim()) || n.summary);
      const drawn = heft.pages && (heft.pages[x.key + ":a"] || heft.pages[x.key + ":b"]);
      if (used || drawn) {
        pages.push({ id: x.key + ":a", type: "zettel", ...x });
        pages.push({ id: x.key + ":b", type: "notizen", ...x });
      }
    });
    (heft.free || []).forEach(f => pages.push({ id: "frei:" + f.id, type: "frei", free: f }));
    return pages;
  }

  /* ---------------- Seiteninhalte (HTML) ---------------- */
  const today = () => new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });

  function pageHead(p, sub) {
    return `<header class="ph">
      <div class="ph-meta"><span class="ph-stamp k-${p.kurs.id}">${p.no}</span><span>${esc(p.kurs.titel)}</span></div>
      <h2 class="ph-title">${esc(p.lesson.titel)}</h2>
      ${sub ? `<div class="ph-sub">${sub}</div>` : ""}
    </header>`;
  }

  function contentHtml(p, pages) {
    const notes = loadNotes(), heft = loadHeft();
    switch (p.type) {
      case "innen": {
        return `<div class="pc-innen">
          <div class="owner"><span>Dieses Notizheft gehört</span>
            <div class="owner-line" contenteditable="true" spellcheck="false" data-field="owner">${esc(heft.owner || "")}</div></div>
          <div class="stamp-big">VEYE<small>Film School · Notizheft</small></div>
          <ul class="howto">
            <li><b>Marker</b> – direkt über den Text ziehen</li>
            <li><b>Stift</b> – Skizzen, Pfeile, Lichtpläne</li>
            <li><b>Bild</b> – Fotos &amp; Skizzen einkleben</li>
            <li><b>Zettel</b> – Haftnotiz aufkleben</li>
            <li><b>Text</b> – Textfeld irgendwo auf die Seite setzen</li>
            <li><b>Markieren</b> – Text auswählen, Farbe tippen</li>
            <li>Blättern: Pfeile, Wischen oder ← →</li>
          </ul>
          <div class="date-note">angefangen am ${esc(heft.started || today())}</div>
        </div>`;
      }
      case "inhalt": {
        const rows = pages.map((q, i) => ({ q, i })).filter(({ q }) => q.type === "zettel" || q.type === "frei");
        return `<h2 class="hand-title">Inhalt</h2>
          ${rows.length ? `<ol class="toc">${rows.map(({ q, i }) => `
            <li><button type="button" data-goto="${i}"><span class="toc-t">${q.type === "frei" ? esc(q.free.title || "Skizzen") : esc(q.lesson.titel)}</span><span class="toc-dots"></span><span class="toc-n">${i}</span></button></li>`).join("")}</ol>`
            : `<p class="hand-muted">Noch leer. Markiere in einer Lektion etwas mit „＋ In Notizheft“, schließe eine Lektion ab – oder leg mit <b>＋ Seite</b> eine Skizzenseite an.</p>`}`;
      }
      case "zettel": {
        const n = notes[p.key] || {}, s = n.summary;
        const sub = s ? `Lernzettel · ${new Date(s.ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}` : "Lernzettel";
        if (!s) return pageHead(p, sub) + `<p class="hand-muted">Hier steht bald das Wichtigste dieser Lektion.</p>
          <button type="button" class="paper-btn" data-make="${p.key}">Lernzettel schreiben lassen</button>`;
        return pageHead(p, sub) + `
          ${s.fokus ? `<p class="focus-line">${esc(s.fokus)}</p>` : ""}
          ${s.kern && s.kern.length ? `<h3 class="hand-h">Das Wichtigste</h3><ol class="hand-list">${s.kern.map(k => `<li>${esc(k)}</li>`).join("")}</ol>` : ""}
          ${s.werte && s.werte.length ? `<h3 class="hand-h">Werte</h3><dl class="hand-werte">${s.werte.map(w => `<div><dt>${esc(w.k)}</dt><dd>${esc(w.v)}</dd></div>`).join("")}</dl>` : ""}
          ${s.merksatz ? `<p class="merk"><span>${esc(s.merksatz)}</span></p>` : ""}
          ${s.begriffe && s.begriffe.length ? `<h3 class="hand-h">Begriffe</h3><dl class="hand-begr">${s.begriffe.map(b => `<div><dt>${esc(b.t)}</dt><dd>${esc(b.d)}</dd></div>`).join("")}</dl>` : ""}
          ${s.fragen && s.fragen.length ? `<h3 class="hand-h">Selbsttest</h3>${s.fragen.map((f, i) => `<details class="hand-q"><summary>${i + 1}. ${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}` : ""}`;
      }
      case "notizen": {
        const n = notes[p.key] || {};
        const items = n.items || [];
        return pageHead(p, "Notizen &amp; Skizzen") + `
          ${items.length ? `<div class="clips">${items.map((it, i) => `
            <figure class="clip" style="--r:${((i % 3) - 1) * 0.8}deg"><blockquote>${esc(it.text)}</blockquote><figcaption>${esc(it.quelle)}</figcaption></figure>`).join("")}</div>` : ""}
          <h3 class="hand-h">Meine Gedanken</h3>
          <div class="lined" contenteditable="true" spellcheck="false" data-own="${p.key}" data-placeholder="Hier schreiben …">${esc(n.text || "")}</div>`;
      }
      case "frei": {
        return `<div class="free-head" contenteditable="true" spellcheck="false" data-free-title="${p.free.id}" data-placeholder="Titel …">${esc(p.free.title || "")}</div>
          <div class="free-date">${esc(p.free.date || "")}</div>`;
      }
    }
    return "";
  }

  /* ---------------- Zustand ---------------- */
  let pages = [], idx = 0, single = false, tool = "hand", color = "#2b3a8f", root = null, book = null, busy = false;
  const COLORS = [["#2b2a33", "Graphit"], ["#2b3a8f", "Tinte"], ["#b3312c", "Rot"], ["#2f7d4e", "Grün"]];
  const MARKERS = [["#ffe14d", "Gelb"], ["#ff8ec7", "Pink"], ["#7fe0ff", "Blau"], ["#a6f28a", "Grün"]];
  let markerColor = "#ffe14d";
  let textColor = "#2b3a8f", textSize = "m";
  const SIZES = [["s", "Klein"], ["m", "Mittel"], ["l", "Groß"]];
  const undoStack = [];

  const pageData = id => { const h = loadHeft(); return (h.pages && h.pages[id]) || { strokes: [], items: [] }; };
  function setPageData(id, fn) {
    const h = loadHeft(); h.pages = h.pages || {};
    const d = h.pages[id] || { strokes: [], items: [] };
    fn(d); h.pages[id] = d;
    if (!saveHeft(h)) toast("Speicher voll – bitte ein paar Bilder entfernen.");
  }

  /* ---------------- Seite aufbauen ---------------- */
  function buildPage(p, side, num) {
    const el = document.createElement("div");
    el.className = `pg ${side}${p ? " pg-" + p.type : " pg-blank"}`;
    if (!p) { el.innerHTML = `<div class="pg-paper"></div>`; return el; }
    el.dataset.id = p.id;
    el.innerHTML = `
      <div class="pg-scroll">
        <div class="pg-content">${contentHtml(p, pages)}</div>
        <div class="pg-layer"><canvas class="pg-ink"></canvas></div>
      </div>
      ${num ? `<div class="pg-num">${num}</div>` : ""}`;
    applyHighlights(el.querySelector(".pg-content"), pageData(p.id).hl || []);
    return el;
  }

  /* ---------------- Text markieren (Highlights) ---------------- */
  const HL_COLORS = [["#ffe14d", "Gelb"], ["#ff8ec7", "Pink"], ["#7fe0ff", "Blau"], ["#a6f28a", "Grün"]];

  // Textknoten eines Bereichs in Reihenfolge
  function textNodes(root) {
    const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  }
  function offsetOf(root, node, off) {
    const r = document.createRange(); r.selectNodeContents(root); r.setEnd(node, off);
    return r.toString().length;
  }
  function unwrapMarks(root) {
    root.querySelectorAll("mark.hl").forEach(m => { const p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
  }
  // Markierungen anwenden; passt der gespeicherte Text nicht mehr zur Position, wird er im Text gesucht
  function applyHighlights(root, list) {
    if (!root || !list.length) return;
    const full = root.textContent;
    list.forEach(h => {
      let s = h.s, e = h.e;
      if (full.slice(s, e) !== h.t) { const i = full.indexOf(h.t); if (i < 0) return; s = i; e = i + h.t.length; }
      let pos = 0;
      for (const n of textNodes(root)) {
        const len = n.nodeValue.length, a = Math.max(s, pos), b = Math.min(e, pos + len);
        if (a < b) {
          const r = document.createRange(); r.setStart(n, a - pos); r.setEnd(n, b - pos);
          const m = document.createElement("mark");
          m.className = "hl" + (h.u ? " hl-u" : "");
          m.dataset.hl = h.id;
          m.style.setProperty("--hl", h.c);
          try { r.surroundContents(m); } catch { /* über Elementgrenzen – überspringen */ }
          pos += len; // Knoten wurde geteilt; Restlänge bleibt gleich
          continue;
        }
        pos += len;
        if (pos >= e) break;
      }
    });
  }
  function refreshHighlights(pg) {
    const c = pg && pg.querySelector(".pg-content"); if (!c) return;
    unwrapMarks(c);
    applyHighlights(c, pageData(pg.dataset.id).hl || []);
  }

  // nach dem Einhängen: Zeichenebene an Inhaltshöhe anpassen und Inhalte zeichnen
  function layoutPage(el) {
    if (!el || !el.dataset.id) return;
    const sc = el.querySelector(".pg-scroll"), layer = el.querySelector(".pg-layer"), cv = el.querySelector("canvas");
    const W = sc.clientWidth;
    if (!W) return;
    const d = pageData(el.dataset.id);
    // Höhe: Inhalt, Elemente und mind. eine Seite
    let maxY = 0;
    d.items.forEach(it => { maxY = Math.max(maxY, (it.y + (it.h || it.w)) * W + 40); });
    d.strokes.forEach(s => s.p.forEach(pt => { maxY = Math.max(maxY, pt[1] * W + 20); }));
    const H = Math.max(sc.clientHeight, el.querySelector(".pg-content").scrollHeight, maxY);
    layer.style.height = H + "px";
    layer.style.setProperty("--w", W + "px");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + "px"; cv.style.height = H + "px";
    cv._W = W; cv._dpr = dpr;
    drawStrokes(cv, d.strokes);
    layer.querySelectorAll(".it").forEach(n => n.remove());
    d.items.forEach(it => layer.appendChild(itemEl(it)));
  }

  function strokeStyle(ctx, s, W) {
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (s.t === "marker") { ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.42; ctx.strokeStyle = s.c; ctx.lineWidth = W * 0.032; }
    else { ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 0.92; ctx.strokeStyle = s.c; ctx.lineWidth = W * (s.s || 0.0042); }
  }
  function drawStroke(ctx, s, W) {
    if (!s.p.length) return;
    strokeStyle(ctx, s, W);
    ctx.beginPath();
    const pts = s.p.map(([x, y]) => [x * W, y * W]);
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 1) ctx.lineTo(pts[0][0] + 0.1, pts[0][1] + 0.1);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    if (pts.length > 1) ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
    ctx.stroke();
  }
  function drawStrokes(cv, strokes) {
    const ctx = cv.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(cv._dpr, 0, 0, cv._dpr, 0, 0);
    // Marker zuerst (liegt unter der Tinte)
    strokes.filter(s => s.t === "marker").forEach(s => drawStroke(ctx, s, cv._W));
    strokes.filter(s => s.t !== "marker").forEach(s => drawStroke(ctx, s, cv._W));
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }

  function itemEl(it) {
    const n = document.createElement("div");
    n.className = `it it-${it.type}`;
    n.dataset.item = it.id;
    n.style.left = `calc(var(--w) * ${it.x})`;
    n.style.top = `calc(var(--w) * ${it.y})`;
    n.style.width = `calc(var(--w) * ${it.w})`;
    n.style.setProperty("--rot", (it.rot || 0) + "deg");
    if (it.type === "img") {
      n.innerHTML = `<div class="tape"></div><div class="polaroid"><img alt="Skizze" draggable="false"><div class="pol-cap" contenteditable="true" spellcheck="false" data-cap="${it.id}" data-placeholder="Beschriftung">${esc(it.cap || "")}</div></div>
        <button type="button" class="it-del" aria-label="Entfernen">✕</button><span class="it-size" aria-hidden="true"></span>`;
      imageUrl(it).then(u => { const img = n.querySelector("img"); if (img && u) img.src = u; });
    } else if (it.type === "text") {
      n.style.setProperty("--ink", it.color || "#2b3a8f");
      n.innerHTML = `<div class="tbox tbox-${it.size || "m"}"><div class="tbox-grip" title="Verschieben" aria-hidden="true"></div><div class="tbox-text" contenteditable="true" spellcheck="false" data-tbox="${it.id}" data-placeholder="Text …">${esc(it.text || "")}</div></div>
        <button type="button" class="it-del" aria-label="Textfeld entfernen">✕</button><span class="it-size" aria-hidden="true"></span>`;
    } else {
      n.style.setProperty("--note", it.color || "#ffe680");
      n.innerHTML = `<div class="sticky"><div class="sticky-grip"></div><div class="sticky-text" contenteditable="true" spellcheck="false" data-sticky="${it.id}" data-placeholder="Notiz …">${esc(it.text || "")}</div></div>
        <button type="button" class="it-del" aria-label="Entfernen">✕</button><span class="it-size" aria-hidden="true"></span>`;
    }
    return n;
  }

  /* ---------------- Ansicht ---------------- */
  function spreadStart(i) { return single ? i : i - (i % 2); }
  function visible() {
    const s = spreadStart(idx);
    return single ? [s] : [s, s + 1];
  }
  const numFor = i => (i >= 1 && pages[i] ? String(i) : "");

  function renderView() {
    if (!book) return;
    const sheet = book.querySelector(".sheets");
    sheet.innerHTML = "";
    const [a, b] = visible();
    if (single) sheet.appendChild(buildPage(pages[a], "single", numFor(a)));
    else { sheet.appendChild(buildPage(pages[a], "left", numFor(a))); sheet.appendChild(buildPage(pages[b], "right", numFor(b))); }
    requestAnimationFrame(() => sheet.querySelectorAll(".pg").forEach(layoutPage));
    updateNav();
  }

  function updateNav() {
    const [a, b] = visible();
    const last = pages.length - 1;
    root.querySelector("#hfPrev").disabled = a <= 0;
    root.querySelector("#hfNext").disabled = (single ? a : (b ?? a)) >= last;
    root.querySelector("#hfPos").textContent = single || b > last ? `${a} / ${last}` : `${a}–${b} / ${last}`;
  }

  // Umblättern mit 3D-Animation
  function go(dir) {
    if (busy) return;
    const step = single ? 1 : 2;
    const from = spreadStart(idx), to = from + dir * step;
    if (to < 0 || to > pages.length - 1) return;
    idx = to;
    if (reduceMotion()) { renderView(); return; }
    busy = true;
    const sheet = book.querySelector(".sheets");
    const leaf = document.createElement("div");
    leaf.className = `leaf ${single ? "leaf-single" : dir > 0 ? "leaf-next" : "leaf-prev"}`;
    let front, back;
    if (single) {
      if (dir > 0) {
        front = sheet.querySelector(".pg"); back = buildPage(null, "single back", "");
        sheet.innerHTML = ""; sheet.appendChild(buildPage(pages[to], "single", numFor(to)));
      } else {
        front = buildPage(pages[to], "single", numFor(to)); back = buildPage(null, "single back", "");
        leaf.classList.add("reverse");
      }
    } else if (dir > 0) {
      front = sheet.querySelector(".pg.right"); back = buildPage(pages[to], "left", numFor(to));
      const right = buildPage(pages[to + 1], "right", numFor(to + 1));
      sheet.replaceChild(right, front);
    } else {
      front = sheet.querySelector(".pg.left"); back = buildPage(pages[to + 1], "right", numFor(to + 1));
      const left = buildPage(pages[to], "left", numFor(to));
      sheet.replaceChild(left, front);
    }
    const ff = document.createElement("div"); ff.className = "face front"; ff.appendChild(front);
    const fb = document.createElement("div"); fb.className = "face back"; fb.appendChild(back);
    leaf.append(ff, fb);
    book.querySelector(".flip-layer").appendChild(leaf);
    requestAnimationFrame(() => {
      sheet.querySelectorAll(".pg").forEach(layoutPage);
      [front, back].forEach(layoutPage);
      requestAnimationFrame(() => leaf.classList.add("turn"));
    });
    const done = () => { leaf.remove(); busy = false; renderView(); };
    leaf.addEventListener("transitionend", e => { if (e.target === leaf) done(); }, { once: true });
    setTimeout(() => { if (busy) done(); }, 1200);
  }

  function goTo(i) {
    if (i < 0 || i >= pages.length) return;
    const target = spreadStart(i), cur = spreadStart(idx);
    if (target === cur) return;
    idx = i;
    renderView();
    book.querySelector(".sheets").classList.add("jump");
    setTimeout(() => book.querySelector(".sheets") && book.querySelector(".sheets").classList.remove("jump"), 500);
  }

  /* ---------------- Werkzeuge ---------------- */
  function setTool(t) {
    tool = t;
    root.dataset.tool = t;
    root.querySelectorAll("[data-tool]").forEach(b => b.classList.toggle("on", b.dataset.tool === t));
    const pal = root.querySelector("#hfPalette");
    const show = t === "pen" || t === "marker" || t === "text";
    pal.hidden = !show;
    const cur = t === "pen" ? color : t === "marker" ? markerColor : textColor;
    if (show) pal.innerHTML = (t === "marker" ? MARKERS : COLORS).map(([c, n]) =>
      `<button type="button" class="sw ${c === cur ? "on" : ""}" data-color="${c}" style="--sw:${c}" aria-label="${n}"></button>`).join("")
      + (t === "text" ? `<span class="pal-sep"></span>` + SIZES.map(([z, n]) => `<button type="button" class="sz sz-${z} ${z === textSize ? "on" : ""}" data-size="${z}" aria-label="${n}">A</button>`).join("") : "");
  }

  // Zeichnen
  let drawing = null;
  function canvasPoint(cv, e) {
    const r = cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * (cv._W / cv._W), (e.clientY - r.top) / r.width];
  }
  function onDown(e) {
    const cv = e.target.closest && e.target.closest("canvas.pg-ink");
    if (!cv || !["pen", "marker", "eraser"].includes(tool) || busy) return;
    e.preventDefault();
    cv.setPointerCapture(e.pointerId);
    const pg = cv.closest(".pg"), id = pg.dataset.id;
    const [x, y] = canvasPoint(cv, e);
    if (tool === "eraser") { drawing = { cv, id, erase: true }; eraseAt(cv, id, x, y); return; }
    const s = { t: tool, c: tool === "pen" ? color : markerColor, p: [[+x.toFixed(4), +y.toFixed(4)]] };
    drawing = { cv, id, s, last: [e.clientX, e.clientY] };
  }
  function onMove(e) {
    if (!drawing) return;
    const [x, y] = canvasPoint(drawing.cv, e);
    if (drawing.erase) { eraseAt(drawing.cv, drawing.id, x, y); return; }
    const dx = e.clientX - drawing.last[0], dy = e.clientY - drawing.last[1];
    if (dx * dx + dy * dy < 4) return;
    drawing.last = [e.clientX, e.clientY];
    drawing.s.p.push([+x.toFixed(4), +y.toFixed(4)]);
    const d = pageData(drawing.id);
    drawStrokes(drawing.cv, [...d.strokes, drawing.s]);
  }
  function onUp() {
    if (!drawing) return;
    if (drawing.s) {
      const s = drawing.s, id = drawing.id;
      setPageData(id, d => d.strokes.push(s));
      undoStack.push({ id, undo: () => setPageData(id, d => { d.strokes = d.strokes.filter(x => x !== s && JSON.stringify(x) !== JSON.stringify(s)); }) });
      refreshInkHeight(drawing.cv.closest(".pg"));
    }
    drawing = null;
  }
  function eraseAt(cv, id, x, y) {
    const r = 0.02;
    let removed = null;
    setPageData(id, d => {
      const keep = [];
      d.strokes.forEach(s => { if (!removed && s.p.some(([px, py]) => Math.hypot(px - x, py - y) < r)) removed = s; else keep.push(s); });
      d.strokes = keep;
    });
    if (removed) {
      undoStack.push({ id, undo: () => setPageData(id, d => d.strokes.push(removed)) });
      drawStrokes(cv, pageData(id).strokes);
    }
  }
  function refreshInkHeight(pg) {
    const layer = pg.querySelector(".pg-layer"), sc = pg.querySelector(".pg-scroll");
    if (layer.offsetHeight < sc.scrollHeight - 2) layoutPage(pg);
  }

  // Elemente verschieben / skalieren (Hand-Werkzeug)
  let drag = null;
  function onItemDown(e) {
    const it = e.target.closest(".it");
    if (!it || tool !== "hand") return;
    if (e.target.closest(".it-del")) return;
    if (e.target.closest("[contenteditable]") && !e.target.closest(".sticky-grip, .tbox-grip")) return;
    const pg = it.closest(".pg"); if (!pg || !pg.dataset.id) return;
    e.preventDefault();
    const W = pg.querySelector(".pg-scroll").clientWidth;
    const d = pageData(pg.dataset.id).items.find(x => x.id === it.dataset.item);
    if (!d) return;
    drag = { it, pg, W, id: pg.dataset.id, item: d, sx: e.clientX, sy: e.clientY, x: d.x, y: d.y, w: d.w, resize: !!e.target.closest(".it-size") };
    it.classList.add("dragging");
    it.setPointerCapture(e.pointerId);
  }
  function onItemMove(e) {
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / drag.W, dy = (e.clientY - drag.sy) / drag.W;
    if (drag.resize) {
      drag.item.w = Math.max(0.18, Math.min(0.95, drag.w + dx));
      drag.it.style.width = `calc(var(--w) * ${drag.item.w})`;
    } else {
      drag.item.x = Math.max(-0.05, Math.min(0.95 - Math.min(drag.item.w, 0.9), drag.x + dx));
      drag.item.y = Math.max(0, drag.y + dy);
      drag.it.style.left = `calc(var(--w) * ${drag.item.x})`;
      drag.it.style.top = `calc(var(--w) * ${drag.item.y})`;
    }
  }
  function onItemUp() {
    if (!drag) return;
    const { id, item, it, pg } = drag;
    it.classList.remove("dragging");
    setPageData(id, d => { const t = d.items.find(x => x.id === item.id); if (t) Object.assign(t, { x: +item.x.toFixed(4), y: +item.y.toFixed(4), w: +item.w.toFixed(4) }); });
    drag = null;
    refreshInkHeight(pg);
  }

  // Neues Element auf der aktuell sichtbaren (rechten) Seite
  function targetPage() {
    const pgs = [...book.querySelectorAll(".sheets .pg[data-id]")];
    return pgs.find(p => p.classList.contains("right")) || pgs[pgs.length - 1] || null;
  }
  function addItem(pg, item, keepPos) {
    const sc = pg.querySelector(".pg-scroll"), W = sc.clientWidth;
    if (!keepPos) item.y = (sc.scrollTop + sc.clientHeight * 0.18) / W;
    setPageData(pg.dataset.id, d => d.items.push(item));
    undoStack.push({ id: pg.dataset.id, undo: () => { setPageData(pg.dataset.id, d => { d.items = d.items.filter(x => x.id !== item.id); }); if (item.type === "img") delImage(item.id); } });
    layoutPage(pg);
    const n = pg.querySelector(`[data-item="${item.id}"]`);
    if (n) n.classList.add("landed");
    setTool("hand");
  }

  async function upload(files) {
    let pg = targetPage();
    if (!pg) return;
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const { blob, ratio } = await shrink(f);
        const id = uid();
        const item = { id, type: "img", x: 0.12 + Math.random() * 0.2, w: 0.62, h: 0.62 * ratio + 0.12, rot: +(Math.random() * 6 - 3).toFixed(1) };
        const ok = await putImage(id, blob);
        if (!ok) item.data = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
        addItem(pg, item);
      } catch { toast("Dieses Bild konnte nicht gelesen werden."); }
    }
  }

  /* ---------------- Text-Eingaben speichern ---------------- */
  const tmr = {};
  function onInput(e) {
    const t = e.target;
    const later = (k, fn) => { clearTimeout(tmr[k]); tmr[k] = setTimeout(fn, 450); };
    if (t.dataset.own) {
      later("own" + t.dataset.own, () => {
        let d; try { d = JSON.parse(localStorage.getItem("veye:notes")) || {}; } catch { d = {}; }
        const n = d[t.dataset.own] || (d[t.dataset.own] = { items: [], text: "", created: Date.now() });
        n.text = t.innerText.replace(/\n{3,}/g, "\n\n").trim(); n.updated = Date.now();
        try { localStorage.setItem("veye:notes", JSON.stringify(d)); } catch { /* voll */ }
        if (window.Notes) window.Notes.updateBadge();
      });
    } else if (t.dataset.sticky || t.dataset.cap || t.dataset.tbox) {
      const pg = t.closest(".pg"), id = t.dataset.sticky || t.dataset.cap || t.dataset.tbox;
      later("it" + id, () => setPageData(pg.dataset.id, d => { const it = d.items.find(x => x.id === id); if (it) it[t.dataset.cap ? "cap" : "text"] = t.innerText.replace(/\n{3,}/g, "\n\n").trim(); }));
    } else if (t.dataset.freeTitle) {
      later("ft", () => { const h = loadHeft(); const f = (h.free || []).find(x => x.id === t.dataset.freeTitle); if (f) { f.title = t.innerText.trim(); saveHeft(h); } });
    } else if (t.dataset.field === "owner") {
      later("owner", () => { const h = loadHeft(); h.owner = t.innerText.trim(); saveHeft(h); });
    }
  }

  let toastTimer;
  function toast(msg) {
    const el = root && root.querySelector(".hf-toast"); if (!el) return;
    el.textContent = msg; el.hidden = false; el.classList.remove("in"); void el.offsetWidth; el.classList.add("in");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  /* ---------------- Icons ---------------- */
  const I = {
    prev: '<path d="M15 5l-7 7 7 7"/>', next: '<path d="M9 5l7 7-7 7"/>',
    hand: '<path d="M8 12V6.5a1.5 1.5 0 013 0V11m0-5.5V5a1.5 1.5 0 013 0v6m0-4.5a1.5 1.5 0 013 0V13c0 4-2.5 7-6 7s-5-2-6.5-4.5L4 12.5a1.5 1.5 0 012.5-1.5L8 13"/>',
    pen: '<path d="M4 20l4-1 11-11a2.1 2.1 0 00-3-3L5 16l-1 4z"/><path d="M14 6l3 3"/>',
    marker: '<path d="M9 15l-4 4h5l2-2"/><path d="M9 15l7-11 4 3-7 11z"/><path d="M4 21h16" opacity=".5"/>',
    eraser: '<path d="M7 20h12"/><path d="M5 14l8-9 6 6-8 9H8z"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
    note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>',
    undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 12" transform="translate(0 -6)"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    text: '<path d="M5 6V4h14v2"/><path d="M12 4v16"/><path d="M9 20h6"/>',
    full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', unfull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>', close: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;

  /* ---------------- Seite montieren ---------------- */
  function mount(el) {
    root = el;
    const h = loadHeft();
    if (!h.started) { h.started = today(); saveHeft(h); }
    pages = buildPages();
    single = matchMedia("(max-width: 860px)").matches;
    const opened = sessionStorageGet("heft-open");
    idx = Math.min(+(sessionStorageGet("heft-idx") || 0), pages.length - 1);

    el.innerHTML = `
      <section class="hf-stage bleed">
        <div class="hf-lamp"></div>
        <div class="hf-top">
          <div><span class="label acc">Digitales Notizheft</span><h1>Notizheft</h1></div>
          <p class="muted">${(n => `${n} ${n === 1 ? "Lektion" : "Lektionen"}`)(pages.filter(p => p.type === "zettel").length)} · ${(n => `${n} ${n === 1 ? "Skizzenseite" : "Skizzenseiten"}`)(pages.filter(p => p.type === "frei").length)}</p>
        </div>
        <div class="book ${single ? "single" : ""} ${opened ? "open" : "closed"}">
          <div class="book-pages">
            <div class="edge-l"></div><div class="edge-r"></div>
            <div class="sheets"></div>
            <div class="flip-layer"></div>
          </div>
          <div class="ribbon"></div>
          <button class="cover" type="button" aria-label="Notizheft aufschlagen">
            <span class="cover-front">
              <span class="cover-emboss">VEYE</span>
              <span class="cover-sub">Film School · Notizheft</span>
              <span class="cover-label">${esc(h.owner || "Notizen & Skizzen")}</span>
              <span class="band"></span>
              <span class="cover-hint">Tippen zum Aufschlagen</span>
            </span>
            <span class="cover-back"></span>
          </button>
        </div>
        <div class="hf-tools" role="toolbar" aria-label="Werkzeuge">
          <button type="button" id="hfPrev" class="tb" aria-label="Zurückblättern">${icon("prev")}</button>
          <span id="hfPos" class="tb-pos"></span>
          <button type="button" id="hfNext" class="tb" aria-label="Weiterblättern">${icon("next")}</button>
          <span class="tb-sep"></span>
          <button type="button" class="tb" data-tool="hand" aria-label="Auswählen und verschieben">${icon("hand")}<span>Hand</span></button>
          <button type="button" class="tb" data-tool="pen" aria-label="Stift">${icon("pen")}<span>Stift</span></button>
          <button type="button" class="tb" data-tool="marker" aria-label="Textmarker">${icon("marker")}<span>Marker</span></button>
          <button type="button" class="tb" data-tool="eraser" aria-label="Radierer">${icon("eraser")}<span>Radierer</span></button>
          <button type="button" class="tb" data-tool="text" aria-label="Textfeld">${icon("text")}<span>Text</span></button>
          <span class="tb-sep"></span>
          <label class="tb" aria-label="Bild einkleben">${icon("image")}<span>Bild</span><input type="file" id="hfFile" accept="image/*" multiple hidden></label>
          <button type="button" class="tb" id="hfNote" aria-label="Haftnotiz">${icon("note")}<span>Zettel</span></button>
          <button type="button" class="tb" id="hfUndo" aria-label="Rückgängig">${icon("undo")}<span>Zurück</span></button>
          <button type="button" class="tb" id="hfAdd" aria-label="Neue Skizzenseite">${icon("plus")}<span>Seite</span></button>
          <button type="button" class="tb" id="hfFull" aria-label="Vollbild">${icon("full")}<span>Vollbild</span></button>
          <div class="palette" id="hfPalette" hidden></div>
        </div>
        <div class="hf-toast" role="status" hidden></div>
        <button type="button" class="hf-exit" id="hfExit" aria-label="Vollbild beenden">${icon("unfull")}<span>Vollbild beenden</span></button>
        <div class="hl-pop" id="hlPop" role="toolbar" aria-label="Text markieren" hidden>
          ${HL_COLORS.map(([c, n]) => `<button type="button" class="hl-sw" data-hl="${c}" style="--sw:${c}" aria-label="Markieren ${n}"></button>`).join("")}
          <button type="button" class="hl-u-btn" data-hlu="1" aria-label="Unterstreichen">U</button>
          <button type="button" class="hl-x" data-hlx="1" aria-label="Markierung entfernen">${icon("eraser")}</button>
        </div>
      </section>`;
    book = el.querySelector(".book");
    renderView();
    setTool("hand");

    const cover = el.querySelector(".cover");
    const openBook = () => {
      if (!book.classList.contains("closed")) return;
      book.classList.remove("closed"); book.classList.add("opening");
      sessionStorageSet("heft-open", "1");
      setTimeout(() => { book.classList.remove("opening"); book.classList.add("open"); book.querySelectorAll(".sheets .pg").forEach(layoutPage); }, reduceMotion() ? 0 : 1100);
    };
    cover.onclick = openBook;

    el.querySelector("#hfPrev").onclick = () => { openBook(); go(-1); };
    el.querySelector("#hfNext").onclick = () => { if (book.classList.contains("closed")) return openBook(); go(1); };
    el.querySelectorAll("[data-tool]").forEach(b => b.onclick = () => {
      openBook(); setTool(b.dataset.tool);
      if (b.dataset.tool === "text") toast("Tippe auf die Seite, wo der Text hin soll");
    });
    el.querySelector("#hfPalette").onclick = e => {
      const sz = e.target.closest("[data-size]");
      if (sz) { textSize = sz.dataset.size; setTool(tool); return; }
      const sw = e.target.closest("[data-color]"); if (!sw) return;
      if (tool === "pen") color = sw.dataset.color; else if (tool === "marker") markerColor = sw.dataset.color; else textColor = sw.dataset.color;
      setTool(tool);
    };

    // Text-Werkzeug: an der angetippten Stelle ein Textfeld anlegen
    el.addEventListener("pointerdown", e => {
      if (tool !== "text" || busy) return;
      const sc = e.target.closest && e.target.closest(".sheets .pg-scroll");
      if (!sc || e.target.closest(".it, [contenteditable], button, a, details, summary")) return;
      e.preventDefault();
      const pg = sc.closest(".pg"), layer = pg.querySelector(".pg-layer"), r = layer.getBoundingClientRect(), W = sc.clientWidth;
      const w = 0.5;
      const x = Math.max(0.02, Math.min(0.98 - w, (e.clientX - r.left) / W - 0.03));
      const y = Math.max(0, (e.clientY - r.top) / W - 0.03);
      const item = { id: uid(), type: "text", x: +x.toFixed(4), y: +y.toFixed(4), w, rot: 0, color: textColor, size: textSize, text: "" };
      addItem(pg, item, true);
      setTimeout(() => { const t = pg.querySelector(`[data-tbox="${item.id}"]`); if (t) t.focus(); }, 60);
    });
    el.querySelector("#hfFile").onchange = e => { openBook(); upload([...e.target.files]); e.target.value = ""; };
    el.querySelector("#hfNote").onclick = () => {
      openBook();
      const pg = targetPage(); if (!pg) return;
      const tones = ["#ffe680", "#ffc2d6", "#c5ecff", "#d4f5b5"];
      addItem(pg, { id: uid(), type: "sticky", x: 0.2 + Math.random() * 0.3, w: 0.42, rot: +(Math.random() * 6 - 3).toFixed(1), color: tones[Math.floor(Math.random() * tones.length)], text: "" });
      setTimeout(() => { const t = pg.querySelector(".it.landed .sticky-text"); if (t) t.focus(); }, 380);
    };
    el.querySelector("#hfUndo").onclick = () => {
      const u = undoStack.pop();
      if (!u) { toast("Nichts zum Rückgängigmachen."); return; }
      u.undo();
      book.querySelectorAll(".sheets .pg").forEach(pg => { refreshHighlights(pg); layoutPage(pg); });
    };
    el.querySelector("#hfAdd").onclick = () => {
      openBook();
      const hh = loadHeft(); hh.free = hh.free || [];
      const f = { id: uid(), title: "", date: today() };
      hh.free.push(f); saveHeft(hh);
      pages = buildPages();
      const i = pages.findIndex(p => p.id === "frei:" + f.id);
      idx = i; renderView();
      toast("Neue Skizzenseite angelegt");
      setTimeout(() => { const t = book.querySelector(`[data-free-title="${f.id}"]`); if (t) t.focus(); }, 200);
    };

    // Inhalt: Klicks
    el.addEventListener("click", e => {
      const g = e.target.closest("[data-goto]"); if (g) { goTo(+g.dataset.goto); return; }
      const mk = e.target.closest("[data-make]");
      if (mk && window.Notes) { const [k, l] = mk.dataset.make.split("/"); window.Notes.ensureSummary(k, l, { force: true }); mk.disabled = true; mk.textContent = "Wird geschrieben …"; return; }
      const del = e.target.closest(".it-del");
      if (del) {
        const it = del.closest(".it"), pg = it.closest(".pg"), id = it.dataset.item;
        if (!del.dataset.armed) { del.dataset.armed = "1"; del.classList.add("armed"); setTimeout(() => { del.removeAttribute("data-armed"); del.classList.remove("armed"); }, 2500); return; }
        let gone = null;
        setPageData(pg.dataset.id, d => { gone = d.items.find(x => x.id === id); d.items = d.items.filter(x => x.id !== id); });
        it.classList.add("removing");
        setTimeout(() => layoutPage(pg), 250);
        if (gone && gone.type === "img") undoStack.push({ id: pg.dataset.id, undo: () => setPageData(pg.dataset.id, d => d.items.push(gone)) });
      }
    });
    el.addEventListener("input", onInput);
    el.addEventListener("pointerdown", e => { onDown(e); onItemDown(e); swipeStart(e); });
    el.addEventListener("pointermove", e => { onMove(e); onItemMove(e); });
    el.addEventListener("pointerup", e => { onUp(e); onItemUp(e); swipeEnd(e); });
    el.addEventListener("pointercancel", () => { onUp(); onItemUp(); swipe = null; });

    // Wischen zum Blättern (Hand-Werkzeug)
    let swipe = null;
    function swipeStart(e) {
      if (e.pointerType === "mouse") return; // mit der Maus wird markiert, nicht geblättert
      if (tool !== "hand" || e.target.closest(".it, [contenteditable], button, .hf-tools, details")) return;
      if (!e.target.closest(".book")) return;
      swipe = { x: e.clientX, y: e.clientY, t: Date.now() };
    }
    function swipeEnd(e) {
      if (!swipe) return;
      const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) { swipe = null; return; }
      if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && Date.now() - swipe.t < 700) {
        if (book.classList.contains("closed")) openBook(); else go(dx < 0 ? 1 : -1);
      }
      swipe = null;
    }

    const onKey = e => {
      if (!document.body.contains(el)) { document.removeEventListener("keydown", onKey); return; }
      if (e.target.closest && e.target.closest("[contenteditable], input, textarea")) return;
      if (e.key === "ArrowRight") { if (book.classList.contains("closed")) openBook(); else go(1); }
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);

    /* Vollbild */
    const stage = el.querySelector(".hf-stage");
    const relayout = () => setTimeout(() => book.querySelectorAll(".sheets .pg").forEach(layoutPage), 60);
    function setFull(on) {
      stage.classList.toggle("full", on);
      document.documentElement.classList.toggle("heft-full", on);
      const btn = el.querySelector("#hfFull");
      btn.innerHTML = `${icon(on ? "unfull" : "full")}<span>${on ? "Beenden" : "Vollbild"}</span>`;
      btn.classList.toggle("on", on);
      relayout();
    }
    el.querySelector("#hfFull").onclick = () => {
      const on = !stage.classList.contains("full");
      setFull(on);
      try {
        if (on && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } catch { /* nicht erlaubt – Vollbild innerhalb der Seite reicht */ }
    };
    el.querySelector("#hfExit").onclick = () => el.querySelector("#hfFull").click();
    const onFs = () => {
      if (!document.body.contains(el)) { document.removeEventListener("fullscreenchange", onFs); return; }
      if (!document.fullscreenElement && stage.classList.contains("full")) setFull(false); else relayout();
    };
    document.addEventListener("fullscreenchange", onFs);
    const onEsc = e => {
      if (!document.body.contains(el)) { document.removeEventListener("keydown", onEsc); return; }
      if (e.key === "Escape" && stage.classList.contains("full") && el.querySelector("#hlPop").hidden) {
        setFull(false);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      }
    };
    document.addEventListener("keydown", onEsc);
    window.addEventListener("hashchange", function off() { document.documentElement.classList.remove("heft-full"); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); window.removeEventListener("hashchange", off); });

    /* Text markieren */
    const pop = el.querySelector("#hlPop");
    let selInfo = null;
    function readSelection() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount || tool !== "hand") return null;
      const r = sel.getRangeAt(0);
      const node = r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement;
      const content = node && node.closest(".sheets .pg-content");
      if (!content || !content.contains(r.startContainer) || !content.contains(r.endContainer)) return null;
      const t = r.toString();
      if (!t.trim()) return null;
      const s = offsetOf(content, r.startContainer, r.startOffset);
      return { pg: content.closest(".pg"), content, s, e: s + t.length, t, rect: r.getBoundingClientRect() };
    }
    function placePop() {
      selInfo = readSelection();
      if (!selInfo) { pop.hidden = true; return; }
      pop.hidden = false;
      const w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth;
      const touch = matchMedia("(hover: none)").matches;
      let top = touch ? selInfo.rect.bottom + 14 : selInfo.rect.top - h - 10;
      if (top < 8) top = selInfo.rect.bottom + 10;
      top = Math.min(window.innerHeight - h - 8, top);
      pop.style.left = Math.max(8, Math.min(vw - w - 8, selInfo.rect.left + selInfo.rect.width / 2 - w / 2)) + "px";
      pop.style.top = top + "px";
    }
    let selT = null;
    const onSel = () => {
      if (!document.body.contains(el)) { document.removeEventListener("selectionchange", onSel); return; }
      clearTimeout(selT); selT = setTimeout(placePop, 150);
    };
    document.addEventListener("selectionchange", onSel);
    pop.addEventListener("mousedown", e => e.preventDefault()); // Auswahl behalten
    pop.addEventListener("click", e => {
      if (!selInfo) return;
      const { pg, s, e: end, t } = selInfo, id = pg.dataset.id;
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.hlx) {
        let removed = [];
        setPageData(id, d => { const all = d.hl || []; removed = all.filter(h => h.s < end && h.e > s); d.hl = all.filter(h => !(h.s < end && h.e > s)); });
        if (removed.length) undoStack.push({ id, undo: () => setPageData(id, d => { d.hl = [...(d.hl || []), ...removed]; }) });
      } else {
        const h = { id: uid(), s, e: end, t, c: b.dataset.hl || "#b3312c", u: !!b.dataset.hlu };
        setPageData(id, d => { d.hl = (d.hl || []).filter(x => !(x.s < end && x.e > s)); d.hl.push(h); });
        undoStack.push({ id, undo: () => setPageData(id, d => { d.hl = (d.hl || []).filter(x => x.id !== h.id); }) });
      }
      window.getSelection().removeAllRanges();
      pop.hidden = true;
      refreshHighlights(pg);
      const m = pg.querySelectorAll("mark.hl"); m.forEach(x => x.classList.add("fresh"));
      setTimeout(() => m.forEach(x => x.classList.remove("fresh")), 900);
    });
    stage.addEventListener("scroll", () => { pop.hidden = true; }, true);

    const onResize = () => {
      if (!document.body.contains(el)) { window.removeEventListener("resize", onResize); return; }
      const s = matchMedia("(max-width: 860px)").matches;
      if (s !== single) { single = s; book.classList.toggle("single", s); renderView(); }
      else book.querySelectorAll(".sheets .pg").forEach(layoutPage);
    };
    window.addEventListener("resize", onResize);

    // Lernzettel fertig o. Ä. → Seiten neu aufbauen (nur wenn nicht gerade geschrieben wird)
    const onNotes = () => {
      if (!document.body.contains(el)) { window.removeEventListener("veye:notes", onNotes); return; }
      if (document.activeElement && document.activeElement.closest && document.activeElement.closest(".book [contenteditable]")) return;
      const cur = pages[spreadStart(idx)] && pages[spreadStart(idx)].id;
      pages = buildPages();
      const i = pages.findIndex(p => p.id === cur);
      if (i >= 0) idx = i;
      renderView();
    };
    window.addEventListener("veye:notes", onNotes);

    // Position merken
    const remember = setInterval(() => { if (!document.body.contains(el)) clearInterval(remember); else sessionStorageSet("heft-idx", String(spreadStart(idx))); }, 1000);
  }

  function sessionStorageGet(k) { try { return sessionStorage.getItem("veye:" + k); } catch { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem("veye:" + k, v); } catch { /* egal */ } }

  window.Heft = { mount };
})();
