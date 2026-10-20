/*
 * Fachbegriffe erklären: markiert Glossar-Begriffe im Text und zeigt beim Hovern,
 * Fokussieren oder Antippen eine Erklärungs-Karte.
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  /* ---------------- Begriffsindex ---------------- */
  const defs = new Map();      // Glossar-Begriff → Erklärung
  const keys = new Map();      // Suchwort (klein) → { term, exact }
  function addKey(word, term) {
    if (!word || !defs.has(term)) return;
    keys.set(word.toLowerCase(), { term, word });
  }
  (window.GLOSSAR || []).forEach(([t, d]) => {
    defs.set(t, d);
    addKey(t, t);
    // "Begriff (Abk.)" → auch "Begriff" allein
    const m = t.match(/^(.+?)\s*\((.+)\)$/);
    if (m) { addKey(m[1], t); addKey(m[2], t); }
  });
  Object.entries(window.BEGRIFF_ALIASE || {}).forEach(([alias, term]) => { if (term) addKey(alias, term); });

  // Längste Begriffe zuerst, damit "Key Light" vor "Key" greift
  const words = [...keys.values()].map(k => k.word).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${words.map(reEsc).join("|")})(?:es|en|s|n|e)?(?![\\p{L}\\p{N}])`, "giu");

  const SKIP = new Set(["A", "BUTTON", "CODE", "PRE", "SVG", "TEXT", "DFN", "H1", "H2", "H3", "H4", "SCRIPT", "STYLE",
    "INPUT", "TEXTAREA", "LABEL", "SELECT", "OPTION", "FIGCAPTION"]);
  const SKIP_CLASS = ["no-terms", "reel-kicker", "chap-title", "tag", "label", "term-name", "quiz-badge", "tip-label", "eyebrow", "spec-head", "pill"];

  function skipNode(el, root) {
    for (let n = el; n && n !== root; n = n.parentElement) {
      if (SKIP.has(n.nodeName.toUpperCase())) return true;
      if (n.classList && SKIP_CLASS.some(c => n.classList.contains(c))) return true;
    }
    return false;
  }

  /**
   * Markiert Begriffe innerhalb von root. Pro Aufruf wird jeder Begriff nur beim
   * ersten Vorkommen markiert (seen kann über mehrere Aufrufe geteilt werden).
   */
  function annotate(root, seen = new Set()) {
    if (!root || !keys.size) return seen;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.nodeValue.trim().length > 1 && !skipNode(n.parentElement, root)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const text = node.nodeValue;
      pattern.lastIndex = 0;
      let m, last = 0, frag = null;
      while ((m = pattern.exec(text))) {
        const hit = keys.get(m[1].toLowerCase());
        if (!hit || seen.has(hit.term)) continue;
        // kurze Begriffe/Abkürzungen nur in exakter Schreibweise (vermeidet "log", "key" im Fließtext)
        if (hit.word.length < 5 && m[1] !== hit.word) continue;
        seen.add(hit.term);
        frag = frag || document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const dfn = document.createElement("dfn");
        dfn.className = "gloss";
        dfn.tabIndex = 0;
        dfn.dataset.term = hit.term;
        dfn.setAttribute("aria-describedby", "termTip");
        dfn.textContent = m[0];
        frag.appendChild(dfn);
        last = m.index + m[0].length;
      }
      if (frag) {
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(frag, node);
      }
    }
    return seen;
  }

  /* ---------------- Erklärungs-Karte ---------------- */
  const tip = document.createElement("div");
  tip.id = "termTip";
  tip.className = "term-tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.appendChild(tip);

  let current = null, hideTimer = null;

  function show(dfn) {
    clearTimeout(hideTimer);
    const term = dfn.dataset.term, def = defs.get(term);
    if (!def) return;
    current = dfn;
    tip.innerHTML = `<span class="tt-label">Fachbegriff</span><strong>${esc(term)}</strong><p>${esc(def)}</p>`;
    tip.hidden = false;
    tip.classList.remove("in");
    const r = dfn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth, vh = window.innerHeight;
    const w = Math.min(320, vw - 24);
    tip.style.width = w + "px";
    const h = tip.offsetHeight;
    let left = Math.round(r.left + r.width / 2 - w / 2);
    left = Math.max(12, Math.min(vw - w - 12, left));
    const above = r.top - h - 12 > 8;
    const top = above ? r.top - h - 12 : r.bottom + 12;
    tip.style.left = left + "px";
    tip.style.top = Math.max(8, Math.min(vh - h - 8, top)) + "px";
    tip.style.setProperty("--ax", Math.round(r.left + r.width / 2 - left) + "px");
    tip.classList.toggle("below", !above);
    requestAnimationFrame(() => tip.classList.add("in"));
    document.querySelectorAll("dfn.gloss.open").forEach(d => d.classList.remove("open"));
    dfn.classList.add("open");
  }
  function hide(now) {
    clearTimeout(hideTimer);
    const run = () => { tip.hidden = true; tip.classList.remove("in"); if (current) current.classList.remove("open"); current = null; };
    if (now) run(); else hideTimer = setTimeout(run, 120);
  }

  const canHover = matchMedia("(hover: hover)").matches;
  // Auf Touch-Geräten nur Antippen – das automatische Hover/Fokus-Ereignis würde die Karte sofort wieder schließen
  let lastPointer = canHover ? "mouse" : "touch";
  document.addEventListener("pointerdown", e => { lastPointer = e.pointerType; }, true);
  document.addEventListener("mouseover", e => {
    if (lastPointer !== "mouse") return;
    const d = e.target.closest && e.target.closest("dfn.gloss");
    if (d) show(d);
    else if (e.target.closest && e.target.closest("#termTip")) clearTimeout(hideTimer);
  });
  document.addEventListener("mouseout", e => {
    if (lastPointer !== "mouse") return;
    const to = e.relatedTarget;
    if (current && !(to && (to.closest("dfn.gloss") === current || to.closest("#termTip")))) hide();
  });
  document.addEventListener("keydown", () => { lastPointer = "keyboard"; }, true);
  document.addEventListener("focusin", e => { if (lastPointer !== "keyboard") return; const d = e.target.closest && e.target.closest("dfn.gloss"); if (d) show(d); });
  document.addEventListener("focusout", e => { if (lastPointer === "keyboard" && e.target.closest && e.target.closest("dfn.gloss")) hide(); });
  // Antippen auf dem Handy: öffnen/schließen; Tippen daneben schließt
  document.addEventListener("click", e => {
    const d = e.target.closest && e.target.closest("dfn.gloss");
    if (d) {
      e.preventDefault(); e.stopPropagation();
      if (current === d && lastPointer !== "mouse") hide(true); else show(d);
    } else if (current && !(e.target.closest && e.target.closest("#termTip"))) hide(true);
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && current) hide(true); });
  document.addEventListener("scroll", () => { if (current) hide(true); }, true);
  window.addEventListener("resize", () => { if (current) hide(true); });
  window.addEventListener("hashchange", () => hide(true));

  window.Terms = { annotate, count: () => defs.size };
})();
