/*
 * Vorlesestimme – Sprachausgabe des Browsers (Web Speech API), komplett offline/kostenlos.
 * Wählt automatisch die natürlichste deutsche Stimme des Geräts (Siri/Premium auf dem iPhone,
 * „Natural“-Stimmen in Edge, Google-Stimmen in Chrome/Android). Lange Texte werden in Sätze
 * geteilt, weil manche Browser lange Äußerungen nach ~15 s abbrechen.
 */
(function () {
  const synth = window.speechSynthesis;
  const KEY = "veye:stimme";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* egal */ } };
  let prefs = { rate: 1, auto: true, ...load() };
  let queue = [], current = null, runId = 0;
  const listeners = new Set();
  const emit = () => listeners.forEach(f => { try { f(); } catch { /* egal */ } });

  const available = () => !!(synth && window.SpeechSynthesisUtterance);

  // Je natürlicher die Stimme klingt, desto höher die Punktzahl
  function score(v) {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural/.test(n)) s += 60;
    if (/premium/.test(n)) s += 55;
    if (/enhanced|erweitert|verbessert/.test(n)) s += 45;
    if (/siri/.test(n)) s += 40;
    if (/google/.test(n)) s += 30;
    if (/online/.test(n)) s += 10;
    if (/compact|espeak|kompakt/.test(n)) s -= 40;
    if (/^de[-_]de/i.test(v.lang)) s += 8; else if (/^de/i.test(v.lang)) s += 4;
    return s;
  }
  function voices() {
    if (!available()) return [];
    return synth.getVoices().filter(v => /^de/i.test(v.lang)).sort((a, b) => score(b) - score(a));
  }
  function voice() {
    const vs = voices();
    return vs.find(v => v.voiceURI === prefs.voice) || vs[0] || null;
  }
  if (available()) synth.addEventListener?.("voiceschanged", emit);

  /** Text aus einem Element holen und fürs Vorlesen glätten. */
  function textFrom(el) {
    if (!el) return "";
    const c = el.cloneNode(true);
    c.querySelectorAll("svg, .swipe-hint, .reel-actions, .reel-credit, [hidden], .cmp-tag, .opt, button.btn, input, .tt, .reel-rail, script, style, .tag, .label, .eyebrow, .reel-kicker + .reel-kicker").forEach(n => n.remove());
    c.querySelectorAll("*").forEach(n => n.append(" "));
    c.querySelectorAll("li, p, h1, h2, h3, h4, dt, dd, figcaption, .spec-row, tr, .reel-choice").forEach(n => n.append(". "));
    return clean(c.textContent);
  }
  function clean(t) {
    return String(t || "")
      .replace(/[★☆✓✗✕▶↗→←↑↓•·]/g, " ")
      .replace(/\bz\.\s?B\./g, "zum Beispiel").replace(/\bca\./g, "circa").replace(/\bbzw\./g, "beziehungsweise")
      .replace(/\bu\.\s?a\./g, "unter anderem").replace(/\bd\.\s?h\./g, "das heißt").replace(/\bvs\./g, "gegen")
      .replace(/(\d)\s?°/g, "$1 Grad").replace(/(\d)\s?K\b/g, "$1 Kelvin").replace(/\bfps\b/g, "Bilder pro Sekunde")
      .replace(/(\d)\s?mm\b/g, "$1 Millimeter").replace(/\bLUTs?\b/g, m => m.replace("LUT", "Lutt"))
      .replace(/(\d+):(\d+)/g, "$1 zu $2").replace(/(\d)\s*[–-]\s*(\d)/g, "$1 bis $2").replace(/\s*[–—]\s*/g, ", ")
      .replace(/:\s*\./g, ":")
      .replace(/\s*\.\s*(\.\s*)+/g, ". ").replace(/\s+/g, " ").trim();
  }
  // In Sätze bis ~220 Zeichen teilen
  function chunks(t) {
    const parts = t.match(/[^.!?…]+[.!?…]*\s*/g) || [t];
    const out = []; let buf = "";
    for (const p of parts) {
      if ((buf + p).length > 220 && buf) { out.push(buf.trim()); buf = ""; }
      buf += p;
    }
    if (buf.trim()) out.push(buf.trim());
    return out.filter(s => /[\p{L}\d]/u.test(s));
  }

  function stop() {
    runId++; queue = []; current = null;
    if (available()) synth.cancel();
    emit();
  }
  /** Liest Text vor. onend wird nur aufgerufen, wenn bis zum Ende gelesen (nicht abgebrochen) wurde. */
  function speak(text, opts = {}) {
    if (!available()) return false;
    stop();
    const id = runId;
    queue = chunks(clean(text));
    const next = () => {
      if (id !== runId) return;
      const s = queue.shift();
      if (!s) { current = null; emit(); if (opts.onend) opts.onend(); return; }
      const u = new SpeechSynthesisUtterance(s);
      const v = voice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "de-DE";
      u.rate = prefs.rate; u.pitch = 1;
      u.onend = () => next();
      u.onerror = e => { if (id === runId && e.error !== "interrupted" && e.error !== "canceled") next(); };
      current = u; emit();
      synth.speak(u);
    };
    next();
    // Chrome-Eigenheit: pausiert manchmal still – sanft anstoßen
    if (synth.paused) synth.resume();
    return true;
  }
  const speaking = () => !!current;

  function set(p) { prefs = { ...prefs, ...p }; save(prefs); emit(); }

  /** Kleines Einstellungs-Panel (Stimme, Tempo, Auto-Weiter). */
  function settingsHtml(opts = {}) {
    const vs = voices();
    const v = voice();
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    return `
      <label class="vs-row"><span>Stimme</span>
        <select class="vs-voice">${vs.length ? vs.map(x => `<option value="${esc(x.voiceURI)}" ${v && x.voiceURI === v.voiceURI ? "selected" : ""}>${esc(x.name)}${score(x) >= 40 ? " ★" : ""}</option>`).join("") : `<option>Standardstimme</option>`}</select></label>
      <label class="vs-row"><span>Tempo</span>
        <input type="range" class="vs-rate" min="0.7" max="1.5" step="0.05" value="${prefs.rate}"><output>${prefs.rate.toFixed(2).replace(/0$/, "")}×</output></label>
      ${opts.auto ? `<label class="vs-row vs-check"><input type="checkbox" class="vs-auto" ${prefs.auto ? "checked" : ""}><span>Nach dem Vorlesen automatisch weiter</span></label>` : ""}
      <div class="vs-foot"><button type="button" class="btn small vs-test">Probe hören</button>
        <span class="vs-hint">${vs.some(x => score(x) >= 40) ? "★ = besonders natürlich" : "Tipp: Natürlichere Stimmen am iPhone unter Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch laden (z. B. „Anna (Premium)“)."}</span></div>`;
  }
  function bindSettings(root) {
    const sel = root.querySelector(".vs-voice"), rate = root.querySelector(".vs-rate"), auto = root.querySelector(".vs-auto");
    if (sel) sel.onchange = () => { set({ voice: sel.value }); speak("So klinge ich."); };
    if (rate) rate.oninput = () => { set({ rate: +rate.value }); rate.nextElementSibling.textContent = (+rate.value).toFixed(2).replace(/0$/, "") + "×"; };
    if (rate) rate.onchange = () => speak("So schnell lese ich jetzt vor.");
    if (auto) auto.onchange = () => set({ auto: auto.checked });
    const t = root.querySelector(".vs-test");
    if (t) t.onclick = () => speak("Hallo! Ich lese dir die Lektionen vor. Wisch weiter, wann immer du willst.");
  }

  window.Stimme = {
    available, voices, voice, speak, stop, speaking, textFrom, clean,
    prefs: () => ({ ...prefs }), set, settingsHtml, bindSettings,
    onChange: f => { listeners.add(f); return () => listeners.delete(f); }
  };
  // Beim Verlassen nicht weiterreden
  window.addEventListener("pagehide", stop);
})();
