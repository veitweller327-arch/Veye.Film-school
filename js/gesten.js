/*
 * Wisch-Geste „Zurück“ wie am iPhone: nach rechts wischen → eine Ebene zurück.
 * - Seite folgt dem Finger, ab ~⅓ Breite oder schnellem Wisch wird zurück navigiert.
 * - Reels und Notizen-Leiste: Wischen schließt sie.
 * - Ignoriert Bereiche, die selbst waagerecht reagieren (Karussells, Regler,
 *   Notizheft, Zeichenflächen, Eingabefelder).
 * - Safari am iPhone hat am linken Rand eine eigene Zurück-Geste – die bleibt unangetastet.
 */
(function () {
  if (!("ontouchstart" in window)) return;

  /* ---- eigener Verlauf, damit „Zurück“ auch ohne Browser-Verlauf sinnvoll ist ---- */
  const KEY = "veye:navstack";
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = s => { try { sessionStorage.setItem(KEY, JSON.stringify(s.slice(-50))); } catch { /* egal */ } };
  const cur = () => location.hash || "#/";
  let stack = load();
  if (stack[stack.length - 1] !== cur()) { stack.push(cur()); save(stack); }
  window.addEventListener("hashchange", () => {
    const h = cur();
    if (stack[stack.length - 2] === h) stack.pop();
    else if (stack[stack.length - 1] !== h) stack.push(h);
    save(stack);
  });
  function parentOf(h) {
    const [path, qs] = h.replace(/^#/, "").split("?");
    const p = path.split("/").filter(Boolean);
    const q = new URLSearchParams(qs || "");
    if (p[0] === "lektion" && p[1]) return `#/kurs/${p[1]}`;
    if (p[0] === "kurs") return "#/kurse";
    if (p[0] === "training" && q.get("k") && q.get("l")) return `#/lektion/${q.get("k")}/${q.get("l")}`;
    return "#/";
  }
  const canGoBack = () => cur() !== "#/" && cur() !== "#";
  function goBack() {
    if (stack.length > 1) history.back();
    else location.hash = parentOf(cur());
  }
  window.VeyeBack = { goBack, canGoBack };

  /* ---- Geste ---- */
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const nativeEdge = ios && !standalone && window.top === window; // Safari-Rand-Geste nicht doppeln
  const SKIP = "input, textarea, select, [contenteditable], .swipe-row, .cmp, .hf-stage, .labor, canvas, .bd-drop, .chat-log, .reels-sheet, .term-tip, .tabbar, .sel-note";

  function sidewaysScroller(el) {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (e.scrollWidth > e.clientWidth + 2) {
        const ox = getComputedStyle(e).overflowX;
        if (ox === "auto" || ox === "scroll") return e;
      }
    }
    return null;
  }
  // Karussell ganz links + weiter nach rechts ziehen: Browser soll dabei nicht „zurück“ navigieren
  let edgeGuard = null;

  let g = null;
  const indicator = document.createElement("div");
  indicator.className = "back-hint";
  indicator.setAttribute("aria-hidden", "true");
  indicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>';
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(indicator));
  if (document.body) document.body.appendChild(indicator);

  function layerFor(target) {
    const reels = document.querySelector(".reels");
    if (reels) return { el: reels, kind: "reels" };
    const panel = document.querySelector(".notes-panel.in");
    if (panel && panel.contains(target)) return { el: panel, kind: "notes" };
    if (document.documentElement.classList.contains("heft-full")) return null;
    if (!canGoBack()) return null;
    return { el: document.getElementById("app"), kind: "page" };
  }

  document.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) { g = null; return; }
    const t = e.touches[0], target = e.target;
    if (nativeEdge && t.clientX < 28) { g = null; return; }
    edgeGuard = null;
    const sc = sidewaysScroller(target);
    if (sc) { edgeGuard = { el: sc, x0: t.clientX, y0: t.clientY }; g = null; return; }
    if (target.closest && target.closest(SKIP)) { g = null; return; }
    if (window.getSelection && String(window.getSelection())) { g = null; return; }
    const layer = layerFor(target);
    if (!layer) { g = null; return; }
    g = { x0: t.clientX, y0: t.clientY, t0: performance.now(), dx: 0, on: false, dead: false, layer };
  }, { passive: true });

  document.addEventListener("touchmove", e => {
    if (edgeGuard) {
      const t = e.touches[0], dx = t.clientX - edgeGuard.x0, dy = t.clientY - edgeGuard.y0;
      if (edgeGuard.el.scrollLeft <= 0 && dx > 8 && dx > Math.abs(dy) && e.cancelable) e.preventDefault();
      return;
    }
    if (!g || g.dead) return;
    const t = e.touches[0];
    const dx = t.clientX - g.x0, dy = t.clientY - g.y0;
    if (!g.on) {
      if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
      if (dx > 0 && dx > Math.abs(dy) * 1.6) { g.on = true; g.layer.el.classList.add("swiping"); }
      else { g.dead = true; return; }
    }
    if (e.cancelable) e.preventDefault();
    g.dx = Math.max(0, dx);
    const w = window.innerWidth;
    g.layer.el.style.transform = `translate3d(${g.dx}px, 0, 0)`;
    if (g.layer.kind === "page") g.layer.el.style.opacity = String(1 - Math.min(.35, g.dx / w * .5));
    indicator.style.setProperty("--p", Math.min(1, g.dx / (w * .3)).toFixed(3));
    indicator.classList.add("on");
  }, { passive: false });

  function end() {
    if (!g) return;
    const { layer, dx, t0, on } = g;
    g = null;
    indicator.classList.remove("on");
    if (!on) return;
    const w = window.innerWidth;
    const v = dx / Math.max(1, performance.now() - t0); // px/ms
    const commit = dx > w * .32 || (v > .55 && dx > 40);
    const el = layer.el;
    el.classList.remove("swiping");
    if (!commit) {
      el.style.transform = ""; el.style.opacity = "";
      return;
    }
    el.classList.add("swipe-out");
    el.style.transform = `translate3d(${w}px, 0, 0)`;
    if (layer.kind === "notes") {
      setTimeout(() => { if (window.Notes) window.Notes.close(); setTimeout(() => { el.classList.remove("swipe-out"); el.style.transform = ""; }, 60); }, 200);
      return;
    }
    setTimeout(() => {
      el.classList.remove("swipe-out");
      el.style.transform = ""; el.style.opacity = "";
      if (layer.kind === "reels") document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      else if (layer.kind === "notes") { if (window.Notes) window.Notes.close(); }
      else {
        el.classList.add("swipe-in");
        goBack();
        setTimeout(() => el.classList.remove("swipe-in"), 420);
      }
    }, 200);
  }
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
})();
