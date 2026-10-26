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
  let prefs = { rate: 0.95, auto: true, ...load() };
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
    // bekannt angenehme deutsche Stimmen (iOS/macOS Premium, Microsoft Natural, Google)
    if (/\b(anna|helena|petra|martin|markus|yannick|katja|seraphina|amala|florian|conrad|killian|vicki)\b/.test(n)) s += 12;
    if (/multilingual/.test(n)) s += 4;
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

  /** Text aus einem Element holen und fürs Vorlesen glätten – so, wie ein Mensch es vorlesen würde. */
  function textFrom(el) {
    if (!el) return "";
    const c = el.cloneNode(true);
    // Was man sieht, aber nicht vorliest: wiederholte Kapitelzeile, Nummern, Statistik, Bedienelemente
    c.querySelectorAll("svg, .swipe-hint, .reel-actions, .reel-credit, [hidden], .cmp-tag, .opt, button.btn, input, .tt, .reel-rail, script, style, .tag, .label, .eyebrow, .reel-kicker, .chap-nr, .kick-nr, .cover-stats, .cover-tags, .pill, .reel-note, .ring, .spec-head, .step-nr").forEach(n => n.remove());
    // Quiz: „Frage? Totale, Halbnah, Detail oder Amerikanische?“
    const ch = [...c.querySelectorAll(".reel-choice, .choice")];
    if (ch.length) {
      const names = ch.map(b => b.textContent.trim()).filter(Boolean);
      const list = document.createElement("p");
      list.textContent = names.length > 1 ? names.slice(0, -1).join(", ") + " oder " + names[names.length - 1] + "?" : names.join("");
      ch[0].parentElement.replaceWith(list);
    }
    // Tabellen-Karten: „Begriff: Wert.“ statt „Begriff. Wert.“
    c.querySelectorAll("dt, .spec-k").forEach(n => n.append(": "));
    c.querySelectorAll("dd, .spec-v").forEach(n => n.append(". "));
    c.querySelectorAll(".rc-title").forEach(n => n.append(". "));
    c.querySelectorAll(".quiz-badge, .tip-label").forEach(n => n.append(". "));
    c.querySelectorAll("*").forEach(n => n.append(" "));
    c.querySelectorAll("li, p, h1, h2, h3, h4, figcaption, tr, .term-name, .reel-statement").forEach(n => n.append(". "));
    c.querySelectorAll(".term-name").forEach(n => n.prepend(" "));
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
      .replace(/:\s*\./g, ":").replace(/([?!])\s*\./g, "$1").replace(/:\s*:/g, ":")
      .replace(/([?!])\s*:/g, "$1").replace(/\s+\//g, " oder").replace(/\/\s+/g, " ").replace(/\s*&\s*/g, " und ").replace(/\s+\./g, ".")
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

  /* ---- Eingesprochene Aufnahmen (natürliche Stimme „Bella“, audio/<schlüssel>.mp3) ---- */
  const clips = () => window.STIMME_CLIPS || null;
  let audio = null;
  // Aufnahmen für einen Text: ganze Karte, oder „Richtig!“/„Nicht ganz.“ + Erklärung
  function clipsFor(text) {
    const c = clips();
    if (!c || prefs.natural === false) return null;
    const t = clean(text);
    if (c.has(key(t))) return [key(t)];
    const m = t.match(/^(Richtig!|Nicht ganz\.) (.+)$/);
    if (m && c.has(key(m[1])) && c.has(key(m[2]))) return [key(m[1]), key(m[2])];
    return null;
  }
  const hasNatural = () => !!clips() && prefs.natural !== false;
  function playClips(keys, id, opts, fallbackText) {
    const next = () => {
      if (id !== runId) return;
      const k = keys.shift();
      if (!k) { current = null; audio = null; emit(); if (opts.onend) opts.onend(); return; }
      const a = new Audio(`audio/${k}.mp3`);
      a.playbackRate = Math.min(2, Math.max(0.5, prefs.rate / 0.95));
      a.preservesPitch = true;
      a.onended = () => setTimeout(next, keys.length ? 250 : 0);
      // Aufnahme fehlt oder Wiedergabe blockiert: einmalig auf die Gerätestimme ausweichen
      let failed = false;
      const fail = () => { if (failed || id !== runId) return; failed = true; audio = null; speakSynth(fallbackText, opts, id); };
      a.onerror = fail;
      audio = a; current = a; emit();
      a.play().catch(fail);
    };
    next();
  }

  function stop() {
    runId++; queue = []; current = null;
    if (audio) { try { audio.pause(); } catch { /* egal */ } audio = null; }
    if (available()) synth.cancel();
    emit();
  }
  /** Liest Text vor. onend wird nur aufgerufen, wenn bis zum Ende gelesen (nicht abgebrochen) wurde. */
  function speak(text, opts = {}) {
    const rec = clipsFor(text);
    if (!rec && !available()) return false;
    stop();
    const id = runId;
    if (rec) { playClips(rec, id, opts, text); return true; }
    return speakSynth(text, opts, id);
  }
  function speakSynth(text, opts, id) {
    if (!available()) { current = null; emit(); return false; }
    queue = chunks(clean(text));
    const next = () => {
      if (id !== runId) return;
      const s = queue.shift();
      if (!s) { current = null; emit(); if (opts.onend) opts.onend(); return; }
      const u = new SpeechSynthesisUtterance(s);
      const v = voice();
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "de-DE";
      u.rate = prefs.rate; u.pitch = 1;
      u.onend = () => setTimeout(next, queue.length ? 220 : 0);
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
    const nat = hasNatural();
    return `
      ${clips() ? `<label class="vs-row vs-check"><input type="checkbox" class="vs-natural" ${nat ? "checked" : ""}><span>Natürliche Stimme (Bella) für die Reels</span></label>` : ""}
      <label class="vs-row"><span>${clips() ? "Gerätestimme" : "Stimme"}</span>
        <select class="vs-voice">${vs.length ? vs.map(x => `<option value="${esc(x.voiceURI)}" ${v && x.voiceURI === v.voiceURI ? "selected" : ""}>${esc(x.name)}${score(x) >= 40 ? " ★" : ""}</option>`).join("") : `<option>Standardstimme</option>`}</select></label>
      <label class="vs-row"><span>Tempo</span>
        <input type="range" class="vs-rate" min="0.7" max="1.5" step="0.05" value="${prefs.rate}"><output>${prefs.rate.toFixed(2).replace(/0$/, "")}×</output></label>
      ${opts.auto ? `<label class="vs-row vs-check"><input type="checkbox" class="vs-auto" ${prefs.auto ? "checked" : ""}><span>Nach dem Vorlesen automatisch weiter</span></label>` : ""}
      <div class="vs-foot"><button type="button" class="btn small vs-test">Probe hören</button>
        <span class="vs-hint">${vs.some(x => score(x) >= 40) ? "★ = besonders natürlich" : "Tipp: Natürlichere Stimmen am iPhone unter Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch laden (z. B. „Anna (Premium)“)."}</span></div>`;
  }
  function bindSettings(root) {
    const sel = root.querySelector(".vs-voice"), rate = root.querySelector(".vs-rate"), auto = root.querySelector(".vs-auto"), nat = root.querySelector(".vs-natural");
    if (nat) nat.onchange = () => set({ natural: nat.checked });
    if (sel) sel.onchange = () => { set({ voice: sel.value }); speakSynth("So klinge ich.", {}, (stop(), runId)); };
    if (rate) rate.oninput = () => { set({ rate: +rate.value }); rate.nextElementSibling.textContent = (+rate.value).toFixed(2).replace(/0$/, "") + "×"; };
    if (rate) rate.onchange = () => speak("So schnell lese ich jetzt vor.");
    if (auto) auto.onchange = () => set({ auto: auto.checked });
    const t = root.querySelector(".vs-test");
    if (t) t.onclick = () => speak("Hallo! Ich lese dir die Lektionen vor. Wisch weiter, wann immer du willst.");
  }

  /** Stabiler Schlüssel eines Vorlesetexts (FNV-1a) – verknüpft Text und eingesprochene Aufnahme. */
  function key(text) {
    const t = clean(text); let h = 0x811c9dc5;
    for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  window.Stimme = {
    available, voices, voice, speak, stop, speaking, textFrom, clean, key,
    prefs: () => ({ ...prefs }), set, settingsHtml, bindSettings,
    onChange: f => { listeners.add(f); return () => listeners.delete(f); }
  };
  // Beim Verlassen nicht weiterreden
  window.addEventListener("pagehide", stop);
})();
