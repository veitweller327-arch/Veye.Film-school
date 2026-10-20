/*
 * Lernprofil & intelligente Wiederholung
 * - Jede Quiz-Antwort (Schritt-Modus, Reels, ganze Lektion, Wiederholen) wird erfasst.
 * - Leitner-System mit 5 Fächern: richtig → nächstes Fach (längerer Abstand), falsch → Fach 1.
 * - Karten: Quizfragen (automatisch bewertet), Lernzettel-Fragen und Fachbegriffe (selbst bewertet).
 * - Daraus: Sicherheit pro Lektion, fällige Karten, Tagesplan, Lernserie.
 * Speicher: localStorage "veye:srs" (Kartenstand) und "veye:aktiv" (Lerntage).
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const get = (k, f) => { try { const v = localStorage.getItem("veye:" + k); return v ? JSON.parse(v) : f; } catch { return f; } };
  const set = (k, v) => { try { localStorage.setItem("veye:" + k, JSON.stringify(v)); } catch { /* voll */ } };
  const DAY = 864e5;
  const INTERVAL = [0, 1, 3, 7, 16, 35];          // Tage bis zur nächsten Wiederholung je Fach
  const NEW_PER_DAY = 12, SESSION = 20;
  const dayKey = (t = Date.now()) => new Date(t).toLocaleDateString("sv-SE"); // YYYY-MM-DD lokal
  const KURSE = () => window.KURSE || [];
  const lessonOf = (k, l) => { const kurs = KURSE().find(x => x.id === k); return kurs && { kurs, lesson: kurs.lektionen.find(x => x.id === l) }; };
  const isDone = key => !!(get("done", {})[key]);

  /* ---------------- Antworten erfassen ---------------- */
  function touchDay() {
    const a = get("aktiv", {});
    const d = dayKey();
    a[d] = (a[d] || 0) + 1;
    set("aktiv", a);
  }
  function grade(id, quality) {
    // quality: 0 = falsch, 1 = unsicher, 2 = richtig
    const s = get("srs", {});
    const c = s[id] || { box: 0, right: 0, wrong: 0, first: Date.now() };
    if (quality === 2) { c.box = Math.min(5, (c.box || 0) + 1); c.right++; }
    else if (quality === 1) { c.box = Math.max(1, c.box || 1); }
    else { c.box = 1; c.wrong++; }
    c.last = Date.now();
    // falsch: in 10 Minuten nochmal; sonst Intervall des Fachs (ab Tagesbeginn)
    c.due = quality === 0 ? Date.now() + 10 * 6e4 : startOfDay(Date.now() + Math.max(1, INTERVAL[c.box]) * DAY);
    c.hist = [...(c.hist || []).slice(-9), quality];
    s[id] = c;
    set("srs", s);
    touchDay();
    window.dispatchEvent(new CustomEvent("veye:lernen"));
  }
  const startOfDay = t => { const d = new Date(t); d.setHours(4, 0, 0, 0); return d.getTime(); };

  /** Quizantwort aus einem beliebigen Modus. Erste Antwort einer Karte zählt mit, Wiederholung am selben Tag nicht doppelt. */
  function recordQuiz(k, l, qi, correct) {
    const id = `${k}/${l}/q${qi}`;
    const c = get("srs", {})[id];
    if (c && c.last && dayKey(c.last) === dayKey() && correct && c.box >= 2) return; // schon heute gewusst
    grade(id, correct ? 2 : 0);
  }

  /* ---------------- Karten ---------------- */
  function cardsFor(k, l) {
    const x = lessonOf(k, l); if (!x || !x.lesson) return [];
    const out = (x.lesson.quiz || []).map((q, qi) => ({ id: `${k}/${l}/q${qi}`, type: "quiz", k, l, q }));
    const sum = ((get("notes", null) || readNotes())[`${k}/${l}`] || {}).summary;
    if (sum && sum.fragen) sum.fragen.forEach((f, i) => out.push({ id: `${k}/${l}/z${i}`, type: "frage", k, l, front: f.q, back: f.a }));
    if (window.Terms && window.Terms.find) {
      const seen = new Set();
      window.Terms.find(x.lesson.inhalt).forEach(t => { if (t.d && !seen.has(t.t)) { seen.add(t.t); out.push({ id: `g/${t.t}`, type: "begriff", k, l, front: t.t, back: t.d }); } });
    }
    return out;
  }
  function readNotes() { try { return JSON.parse(localStorage.getItem("veye:notes")) || {}; } catch { return {}; } }

  // alle Karten aus begonnenen/abgeschlossenen Lektionen (Begriffe nur einmal)
  function pool(filterKey) {
    const s = get("srs", {}), out = [], ids = new Set();
    KURSE().forEach(kurs => kurs.lektionen.forEach(lesson => {
      const key = `${kurs.id}/${lesson.id}`;
      if (filterKey && key !== filterKey) return;
      const started = isDone(key) || (lesson.quiz || []).some((_, qi) => s[`${key}/q${qi}`]);
      if (!started && !filterKey) return;
      cardsFor(kurs.id, lesson.id).forEach(c => { if (!ids.has(c.id)) { ids.add(c.id); out.push(c); } });
    }));
    return out;
  }

  function session(filterKey) {
    const s = get("srs", {}), now = Date.now();
    const all = pool(filterKey);
    if (filterKey) {
      // gezieltes Auffrischen einer Lektion: schwächste zuerst
      return all.sort((a, b) => ((s[a.id] || {}).box || 0) - ((s[b.id] || {}).box || 0)).slice(0, SESSION);
    }
    const due = all.filter(c => s[c.id] && s[c.id].due <= now).sort((a, b) => s[a.id].due - s[b.id].due);
    const introducedToday = Object.values(s).filter(c => c.first && dayKey(c.first) === dayKey()).length;
    const fresh = all.filter(c => !s[c.id]).slice(0, Math.max(0, NEW_PER_DAY - introducedToday));
    // Quizfragen vor Begriffen, damit neue Lektionen zuerst gefestigt werden
    fresh.sort((a, b) => (a.type === "quiz" ? 0 : 1) - (b.type === "quiz" ? 0 : 1));
    return [...due, ...fresh].slice(0, SESSION);
  }
  const dueCount = () => session().length;

  /* ---------------- Auswertung ---------------- */
  function mastery(k, l) {
    const x = lessonOf(k, l); if (!x || !x.lesson) return null;
    const s = get("srs", {});
    const qs = (x.lesson.quiz || []).map((_, qi) => s[`${k}/${l}/q${qi}`]);
    if (!qs.some(Boolean)) return null;
    // zuletzt falsch = 0; sonst nach Fach: eine richtige Antwort ist ein Anfang, sicher ist erst, was über Wochen hält
    const val = c => !c ? 0 : (c.hist && c.hist[c.hist.length - 1] === 0) ? 0 : [0, 25, 50, 70, 85, 100][Math.min(5, c.box || 0)];
    return Math.round(qs.reduce((a, c) => a + val(c), 0) / qs.length);
  }
  function overall() {
    const vals = [];
    KURSE().forEach(k => k.lektionen.forEach(l => { const m = mastery(k.id, l.id); if (m !== null) vals.push(m); }));
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }
  // schwächste Lektion: nur wo zuletzt Fehler passiert sind
  function weakest() {
    const s = get("srs", {});
    let best = null;
    KURSE().forEach(k => k.lektionen.forEach(l => {
      const m = mastery(k.id, l.id);
      const hadError = (l.quiz || []).some((_, qi) => { const c = s[`${k.id}/${l.id}/q${qi}`]; return c && c.hist && c.hist[c.hist.length - 1] === 0; });
      if (m !== null && m < 60 && hadError && (!best || m < best.m)) best = { k, l, m };
    }));
    return best;
  }
  function streak() {
    const a = get("aktiv", {});
    let n = 0, t = Date.now();
    if (!a[dayKey(t)]) t -= DAY; // heute noch nichts – Serie zählt bis gestern
    while (a[dayKey(t)]) { n++; t -= DAY; }
    return { days: n, today: !!a[dayKey()] };
  }
  function nextDueText() {
    const s = get("srs", {}), now = Date.now();
    const next = Object.values(s).map(c => c.due).filter(d => d > now).sort((a, b) => a - b)[0];
    if (!next) return "";
    const days = Math.round((startOfDay(next) - startOfDay(now)) / DAY);
    return days <= 0 ? "später heute" : days === 1 ? "morgen" : `in ${days} Tagen`;
  }

  /* ---------------- Wiederholen (Oberfläche) ---------------- */
  function review(root, opts = {}) {
    const filterKey = opts.lesson || null;
    let cards = session(filterKey), pos = 0, stats = { right: 0, wrong: 0 }, shown = false, answered = null;
    const label = c => { const x = lessonOf(c.k, c.l); return x ? `${x.kurs.titel} · ${x.lesson.titel}` : ""; };
    const TYPE = { quiz: "Quizfrage", frage: "Lernzettel", begriff: "Fachbegriff" };

    function render() {
      if (!cards.length) {
        const nd = nextDueText();
        root.innerHTML = `<div class="rv-empty">
          <span class="label acc">${filterKey ? "Auffrischen" : "Wiederholen"}</span>
          <p class="rv-big">${pool().length ? "Alles wiederholt." : "Noch nichts zum Wiederholen."}</p>
          <p class="muted">${pool().length ? `Die nächsten Karten sind ${nd || "bald"} fällig. Wiederholen lohnt sich genau dann, wenn du kurz davor bist zu vergessen.` : "Sobald du in einer Lektion Quizfragen beantwortest oder eine Lektion abschließt, kommen ihre Fragen und Fachbegriffe hierher – und tauchen in wachsenden Abständen wieder auf."}</p>
          <div class="row-gap"><a class="btn primary" href="#/kurse">Zu den Kursen</a><button class="btn" id="rvFree">Freies Quiz</button></div>
        </div>`;
        root.querySelector("#rvFree").onclick = () => opts.onFree && opts.onFree();
        return;
      }
      if (pos >= cards.length) {
        const total = stats.right + stats.wrong;
        root.innerHTML = `<div class="rv-done">
          <span class="label acc">Runde beendet</span>
          <p class="rv-big">${stats.right} / ${total} gewusst</p>
          <p class="muted">${stats.wrong ? `${stats.wrong} ${stats.wrong === 1 ? "Karte kommt" : "Karten kommen"} gleich noch einmal – falsche Antworten sind in 10 Minuten wieder fällig.` : "Stark. Alle Karten wandern ein Fach weiter und kommen erst später wieder."}</p>
          <div class="rv-boxes">${boxBar()}</div>
          <div class="row-gap"><button class="btn primary" id="rvAgain">Weiter wiederholen</button><a class="btn" href="#/">Zur Übersicht</a></div>
        </div>`;
        root.querySelector("#rvAgain").onclick = () => { cards = session(filterKey); pos = 0; stats = { right: 0, wrong: 0 }; render(); };
        return;
      }
      const c = cards[pos], st = get("srs", {})[c.id];
      const head = `<div class="step-head"><span>Karte ${pos + 1} von ${cards.length} · ${st ? `Fach ${st.box}` : "neu"}</span>
        <div class="progress"><div style="width:${(pos / cards.length) * 100}%"></div></div></div>`;
      let body;
      if (c.type === "quiz") {
        body = `<p class="q-title">${esc(c.q.frage)}</p>
          <div class="choices">${c.q.antworten.map((a, ai) => {
            let cls = ""; if (answered !== null) cls = ai === c.q.richtig ? "right" : ai === answered ? "wrong" : "dim";
            return `<button class="choice ${cls}" data-ai="${ai}" ${answered !== null ? "disabled" : ""}>${esc(a)}</button>`; }).join("")}</div>
          ${answered !== null ? `<div class="feedback ${answered === c.q.richtig ? "ok" : "bad"}"><strong>${answered === c.q.richtig ? "Richtig!" : "Nicht ganz."}</strong> ${esc(c.q.erklaerung || "")}</div>` : ""}`;
      } else {
        body = `<p class="q-title">${c.type === "begriff" ? `Was bedeutet <em>${esc(c.front)}</em>?` : esc(c.front)}</p>
          ${shown ? `<div class="rv-back">${esc(c.back)}</div>
            <p class="muted rv-hint">Wie gut wusstest du es?</p>
            <div class="rv-grade">
              <button class="btn" data-q="0">Nicht gewusst</button>
              <button class="btn" data-q="1">Unsicher</button>
              <button class="btn primary" data-q="2">Gewusst</button>
            </div>` : `<p class="muted rv-hint">Erst selbst überlegen – laut aussprechen hilft.</p><button class="btn primary" id="rvShow">Antwort zeigen</button>`}`;
      }
      root.innerHTML = `${head}<div class="step-card quiz-step rv-card k-${c.k}">
          <div class="eyebrow">${TYPE[c.type]} · ${esc(label(c))}</div>${body}</div>
        <div class="step-nav"><a class="muted rv-src" href="#/lektion/${c.k}/${c.l}">Zur Lektion</a>
          ${c.type === "quiz" ? `<button class="btn primary" id="rvNext" ${answered === null ? "disabled" : ""}>${answered === null ? "Erst antworten" : "Weiter →"}</button>` : "<span></span>"}</div>`;
      if (window.Terms) window.Terms.annotate(root.querySelector(".feedback, .rv-back") || document.createElement("div"));
      root.querySelectorAll(".choice").forEach(b => b.onclick = () => {
        answered = +b.dataset.ai;
        const ok = answered === c.q.richtig;
        grade(c.id, ok ? 2 : 0);
        ok ? stats.right++ : (stats.wrong++, cards.push(c));
        render();
      });
      const nx = root.querySelector("#rvNext"); if (nx) nx.onclick = () => { pos++; answered = null; render(); };
      const sh = root.querySelector("#rvShow"); if (sh) sh.onclick = () => { shown = true; render(); };
      root.querySelectorAll("[data-q]").forEach(b => b.onclick = () => {
        const q = +b.dataset.q;
        grade(c.id, q);
        q === 2 ? stats.right++ : (stats.wrong++, q === 0 && cards.push(c));
        shown = false; pos++; render();
      });
    }
    render();
  }

  function boxBar() {
    const s = get("srs", {}), n = [0, 0, 0, 0, 0, 0];
    Object.values(s).forEach(c => n[Math.min(5, c.box || 0)]++);
    const max = Math.max(1, ...n.slice(1));
    return [1, 2, 3, 4, 5].map(b => `<div class="rv-box"><div class="rv-bar"><i style="height:${(n[b] / max) * 100}%"></i></div><b>${n[b]}</b><span>Fach ${b}</span></div>`).join("");
  }

  /* ---------------- „Heute“-Bereich für die Startseite ---------------- */
  function todayHtml(nextLesson) {
    const due = dueCount(), weak = weakest(), st = streak(), ov = overall();
    const praxis = window.Praxis ? window.Praxis.openTask() : null;
    const tiles = [];
    tiles.push(`<a class="today-tile ${due ? "hot" : ""}" href="#/training">
      <span class="label">Wiederholen</span><b>${due ? `${due} Karten fällig` : pool().length ? "Alles wiederholt" : "Noch nichts fällig"}</b>
      <span>${due ? "Ca. " + Math.max(1, Math.round(due * 0.3)) + " Min. – festigt, was du schon gelernt hast." : nextDueText() ? `Nächste Karten ${nextDueText()}.` : "Beantworte Quizfragen, dann geht es los."}</span></a>`);
    if (nextLesson) tiles.push(`<a class="today-tile k-${nextLesson.k.id}" href="#/lektion/${nextLesson.k.id}/${nextLesson.l.id}">
      <span class="label">Neu lernen</span><b>${esc(nextLesson.l.titel)}</b><span>${esc(nextLesson.k.titel)}</span></a>`);
    if (weak) tiles.push(`<a class="today-tile k-${weak.k.id}" href="#/training?k=${weak.k.id}&l=${weak.l.id}">
      <span class="label">Auffrischen · ${weak.m} % sicher</span><b>${esc(weak.l.titel)}</b><span>Deine schwächste Lektion – gezielt die unsicheren Fragen.</span></a>`);
    else if (praxis) tiles.push(`<a class="today-tile k-${praxis.k.id}" href="#/lektion/${praxis.k.id}/${praxis.l.id}?praxis=1">
      <span class="label">Praxis</span><b>${esc(praxis.l.titel)}</b><span>Übung umsetzen und reflektieren – mit Feedback zu deinem Bild.</span></a>`);
    return `
      <div class="sec-head"><h2>Heute</h2><span class="label">${st.days ? `${st.days} ${st.days === 1 ? "Tag" : "Tage"} in Folge${st.today ? "" : " · heute noch offen"}` : "Starte deine Lernserie"}${ov !== null ? ` · ${ov} % sicher` : ""}</span></div>
      <div class="today">${tiles.join("")}</div>`;
  }

  window.Lernen = { recordQuiz, grade, session, dueCount, mastery, overall, weakest, streak, review, todayHtml, cardsFor };
})();
