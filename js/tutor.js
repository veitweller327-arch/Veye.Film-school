/*
 * Interaktive Lernmodi:
 *  - Schritt für Schritt: Lektion in Abschnitten, dazwischen Fragen (läuft überall).
 *  - KI-Tutor: Gespräch mit Claude über die Lektion (nur in der veröffentlichten
 *    Webversion, wenn die "sample"-Fähigkeit verfügbar ist).
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- KI-Verfügbarkeit ---------------- */
  let aiFn = null, aiBlocked = false;
  const aiReady = (window.claude && typeof window.claude.use === "function")
    ? window.claude.use("sample").then(fn => (aiFn = fn), () => null)
    : Promise.resolve(null);
  const aiAvailable = () => !!aiFn && !aiBlocked;

  function aiErrorText(e) {
    const code = e && e.code;
    if (["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(code)) {
      aiBlocked = true;
      return "Der KI-Tutor ist in dieser Ansicht nicht freigegeben. Der Modus „Schritt für Schritt“ funktioniert weiterhin.";
    }
    if (code === "rate_limited") return "Gerade zu viele Anfragen. Warte einen Moment und versuch es dann noch einmal.";
    if (code === "session_expired") return "Bitte melde dich bei Claude neu an.";
    if (code === "refused") return "Darauf kann der Tutor nicht antworten. Formuliere die Frage anders.";
    return "Verbindung unterbrochen. Tippe auf „Nochmal“, um es erneut zu versuchen.";
  }

  /* ---------------- Text-Helfer ---------------- */
  function htmlToText(html) {
    const prepared = String(html)
      .replace(/<\/(td|th)>/gi, " | ")
      .replace(/<\/(tr|li|p|h3|h4|div|pre|ol|ul|table)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n");
    const d = document.createElement("div");
    d.innerHTML = prepared;
    return d.textContent.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  }

  // Minimaler, sicherer Markdown-Renderer für Tutor-Antworten
  function md(text) {
    const lines = esc(text).split("\n");
    let out = "", list = null;
    const inline = s => s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*(?!\s)(.+?)\*/g, "$1<em>$2</em>").replace(/`([^`]+)`/g, "<code>$1</code>");
    for (const raw of lines) {
      const line = raw.trimEnd();
      const ul = line.match(/^\s*[-•]\s+(.*)/), ol = line.match(/^\s*\d+[.)]\s+(.*)/);
      const type = ul ? "ul" : ol ? "ol" : null;
      if (type) {
        if (list !== type) { if (list) out += `</${list}>`; out += `<${type}>`; list = type; }
        out += `<li>${inline((ul || ol)[1])}</li>`;
        continue;
      }
      if (list) { out += `</${list}>`; list = null; }
      if (/^#{1,4}\s/.test(line)) out += `<p><strong>${inline(line.replace(/^#+\s/, ""))}</strong></p>`;
      else if (line.trim()) out += `<p>${inline(line)}</p>`;
    }
    if (list) out += `</${list}>`;
    return out;
  }

  const store = {
    get(k, f) { try { const v = localStorage.getItem("veye:" + k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem("veye:" + k, JSON.stringify(v)); } catch { /* egal */ } }
  };

  /* ---------------- Schritt für Schritt ---------------- */
  function splitChunks(html) {
    const parts = String(html).split(/(?=<h3>)/i).map(s => s.trim()).filter(Boolean);
    // Sehr kurze Einleitungen mit dem nächsten Abschnitt zusammenfassen
    const out = [];
    for (const p of parts) {
      if (out.length && htmlToText(out[out.length - 1]).length < 120) out[out.length - 1] += p;
      else out.push(p);
    }
    return out;
  }

  // Verteilt die Quizfragen gleichmäßig hinter die Abschnitte
  function planSteps(lesson) {
    const chunks = splitChunks(lesson.inhalt);
    const quiz = lesson.quiz || [];
    const after = chunks.map(() => []);
    quiz.forEach((q, i) => {
      const idx = Math.min(chunks.length - 1, Math.max(0, Math.round(((i + 1) * chunks.length) / quiz.length) - 1));
      after[idx].push(i);
    });
    const steps = [];
    chunks.forEach((c, i) => {
      steps.push({ type: "chunk", html: c, index: i });
      after[i].forEach(qi => steps.push({ type: "quiz", qi }));
    });
    steps.push({ type: "end" });
    return steps;
  }

  function stepMode(root, kurs, lesson, hooks) {
    const steps = planSteps(lesson);
    const key = `step:${kurs.id}/${lesson.id}`;
    const state = store.get(key, { pos: 0, answers: {} });
    if (state.pos >= steps.length) state.pos = 0;
    const save = () => store.set(key, state);

    function render() {
      const step = steps[state.pos];
      const total = steps.length;
      let body = "";

      if (step.type === "chunk") {
        body = `<div class="step-card">${step.html}</div>
          <div class="step-check" id="selfCheck"></div>
          <div class="ask-box" id="askBox"></div>`;
      } else if (step.type === "quiz") {
        const q = lesson.quiz[step.qi];
        const given = state.answers[step.qi];
        body = `<div class="step-card quiz-step">
          <div class="eyebrow">Frage an dich</div>
          <p class="q-title">${esc(q.frage)}</p>
          <div class="choices">
            ${q.antworten.map((a, ai) => {
              let cls = "";
              if (given !== undefined) cls = ai === q.richtig ? "right" : ai === given ? "wrong" : "dim";
              return `<button class="choice ${cls}" data-ai="${ai}" ${given !== undefined ? "disabled" : ""}>${esc(a)}</button>`;
            }).join("")}
          </div>
          ${given !== undefined ? `<div class="feedback ${given === q.richtig ? "ok" : "bad"}">
            <strong>${given === q.richtig ? "Richtig!" : "Nicht ganz."}</strong> ${esc(q.erklaerung || "")}</div>` : ""}
        </div>`;
      } else {
        const qn = (lesson.quiz || []).length;
        const right = Object.entries(state.answers).filter(([qi, a]) => lesson.quiz[qi] && lesson.quiz[qi].richtig === a).length;
        body = `<div class="step-card end-step">
          <div class="eyebrow">Geschafft</div>
          <h3>Lektion durchgearbeitet</h3>
          ${qn ? `<p class="score">${right} von ${qn} Fragen richtig</p>` : ""}
          ${lesson.aufgabe ? `<div class="box task"><h4>Jetzt du – Praxis-Übung</h4>${esc(lesson.aufgabe)}</div>` : ""}
          <div class="row-gap">
            <button class="btn primary" id="stepDone">Lektion abschließen</button>
            <button class="btn" id="stepRestart">Nochmal von vorn</button>
            ${aiAvailable() ? `<button class="btn" id="stepToTutor">Mit KI-Tutor vertiefen</button>` : ""}
          </div>
        </div>`;
      }

      const canNext = step.type !== "quiz" || state.answers[step.qi] !== undefined;
      root.innerHTML = `
        <div class="step-head">
          <span>Schritt ${state.pos + 1} von ${total}</span>
          <div class="progress"><div style="width:${((state.pos + 1) / total) * 100}%"></div></div>
        </div>
        ${body}
        <div class="step-nav">
          <button class="btn" id="stepPrev" ${state.pos === 0 ? "disabled" : ""}>← Zurück</button>
          ${step.type !== "end" ? `<button class="btn primary" id="stepNext" ${canNext ? "" : "disabled"}>${canNext ? "Weiter →" : "Erst antworten"}</button>` : ""}
        </div>`;

      if (window.enhanceTables) window.enhanceTables(root);
      root.querySelector("#stepPrev").onclick = () => { state.pos--; save(); render(); scrollTop(); };
      const next = root.querySelector("#stepNext");
      if (next) next.onclick = () => { state.pos++; save(); render(); scrollTop(); };

      root.querySelectorAll(".choice").forEach(b => b.onclick = () => {
        state.answers[step.qi] = +b.dataset.ai; save(); render();
      });

      if (step.type === "chunk") {
        aiReady.then(() => { if (aiAvailable() && steps[state.pos] === step) renderAiExtras(root, lesson, step); });
      }
      if (step.type === "end") {
        root.querySelector("#stepDone").onclick = () => hooks.markDone();
        root.querySelector("#stepRestart").onclick = () => { state.pos = 0; state.answers = {}; save(); render(); scrollTop(); };
        const t = root.querySelector("#stepToTutor");
        if (t) t.onclick = () => hooks.switchMode("tutor");
      }
    }

    function scrollTop() { root.scrollIntoView({ behavior: "smooth", block: "start" }); }
    render();
  }

  // Im Schritt-Modus: "Erklär's mit eigenen Worten" + "Frage stellen", beides per KI
  function renderAiExtras(root, lesson, step) {
    const chunkText = htmlToText(step.html).slice(0, 6000);
    const check = root.querySelector("#selfCheck");
    const ask = root.querySelector("#askBox");
    if (!check || !ask) return;

    check.innerHTML = `
      <div class="eyebrow">Selbstcheck mit dem Tutor</div>
      <label class="muted" for="selfIn">Fasse den Abschnitt in 1–2 Sätzen mit eigenen Worten zusammen. Der Tutor gibt dir Feedback.</label>
      <textarea id="selfIn" placeholder="In eigenen Worten …"></textarea>
      <div class="row-gap"><button class="btn small" id="selfBtn">Feedback holen</button></div>
      <div class="ai-out" id="selfOut" hidden></div>`;
    ask.innerHTML = `
      <div class="eyebrow">Frage zu diesem Abschnitt</div>
      <div class="ask-row">
        <input type="text" id="askIn" placeholder="z. B. Was ist der Unterschied zu …?">
        <button class="btn small" id="askBtn">Fragen</button>
      </div>
      <div class="ai-out" id="askOut" hidden></div>`;

    const run = async (btn, out, prompt) => {
      btn.disabled = true; out.hidden = false; out.innerHTML = `<p class="thinking">Tutor denkt nach …</p>`;
      try {
        await aiFn(prompt, { modelTier: "quick", cache: false, onText: ({ text }) => { out.innerHTML = md(text); } });
      } catch (e) {
        out.innerHTML = (e && e.text ? md(e.text) : "") + `<p class="muted">${esc(aiErrorText(e))}</p>`;
      } finally { btn.disabled = false; }
    };

    root.querySelector("#selfBtn").onclick = () => {
      const ans = root.querySelector("#selfIn").value.trim();
      if (!ans) return;
      run(root.querySelector("#selfBtn"), root.querySelector("#selfOut"),
        `Du bist ein freundlicher, präziser Dozent an einer Filmhochschule. Ein Student hat folgenden Lernabschnitt gelesen und ihn in eigenen Worten zusammengefasst.\n\n` +
        `LERNABSCHNITT (Lektion „${lesson.titel}“):\n${chunkText}\n\nZUSAMMENFASSUNG DES STUDENTEN:\n${ans}\n\n` +
        `Gib Feedback auf Deutsch, duze den Studenten, maximal 5 Sätze: Was ist richtig? Was fehlt oder ist falsch? Ende mit einem kurzen Merksatz. Keine Überschriften.`);
    };
    const askFn = () => {
      const q = root.querySelector("#askIn").value.trim();
      if (!q) return;
      run(root.querySelector("#askBtn"), root.querySelector("#askOut"),
        `Du bist ein Dozent an einer Filmhochschule (Kamera, Licht, Schnitt, Color Grading, Instagram-Edits). Beantworte die Frage eines Studenten auf Deutsch, duze ihn, kurz und praxisnah (max. 8 Sätze oder eine kurze Liste). ` +
        `Beziehe dich auf den Lernabschnitt; wenn die Frage darüber hinausgeht, beantworte sie trotzdem fachlich korrekt.\n\nLERNABSCHNITT (Lektion „${lesson.titel}“):\n${chunkText}\n\nFRAGE:\n${q}`);
    };
    root.querySelector("#askBtn").onclick = askFn;
    root.querySelector("#askIn").onkeydown = e => { if (e.key === "Enter") askFn(); };
  }

  /* ---------------- KI-Tutor (Gespräch) ---------------- */
  function tutorRules(kurs, lesson, videos) {
    const lessonText = htmlToText(lesson.inhalt).slice(0, 14000);
    const quiz = (lesson.quiz || []).map(q => `- ${q.frage} (Antwort: ${q.antworten[q.richtig]})`).join("\n");
    const vids = videos.map(v => `- ${v.titel}${v.notizen ? ": " + v.notizen : ""}`).join("\n");
    return `Du bist der persönliche Tutor in der „Veye Film School“, einer Lernplattform für Filmstudium-Grundlagen, Color Grading und Instagram-Edits. ` +
      `Du unterrichtest wie ein guter Dozent an einer Filmhochschule: auf Deutsch, per Du, warm, klar und praxisnah.

SO UNTERRICHTEST DU:
- Bring den Stoff der Lektion in kleinen Portionen bei: pro Nachricht EIN Gedanke, höchstens ca. 120 Wörter.
- Beende JEDE Nachricht mit genau EINER Frage an den Studenten (Verständnisfrage, Anwendungsfrage oder „Was würdest du tun, wenn …“). Markiere sie mit „**Frage:**“.
- Wenn der Student antwortet: bewerte die Antwort ehrlich (richtig / teilweise / falsch), erkläre kurz warum, und mach dann mit dem nächsten Teil weiter.
- Wenn er „weiter“ sagt, fahre mit dem nächsten Thema fort. Wenn er etwas nicht versteht, erkläre es einfacher und mit einem Alltagsbeispiel.
- Nutze konkrete Zahlen, Werte und Praxisbeispiele aus der Lektion. Verbinde mit Instagram-Reels, wo es passt.
- Rückfragen außerhalb der Lektion beantwortest du kurz und fachlich korrekt und führst dann zurück.
- Wenn alle Themen behandelt sind: fasse die 3 wichtigsten Punkte zusammen und gib die Praxis-Übung als Hausaufgabe.
- Formatierung: kurze Absätze, **fett** für Schlüsselbegriffe, Listen mit „- “. Keine Tabellen, keine Überschriften.

KURS: ${kurs.titel}
LEKTION: ${lesson.titel}

LEKTIONSINHALT:
${lessonText}

PRAXIS-ÜBUNG: ${lesson.aufgabe || "–"}

QUIZFRAGEN DER LEKTION (nutze sie als Ideen, stelle aber eigene, auch offene Fragen):
${quiz || "–"}
${vids ? `\nVIDEOS ZU DIESER LEKTION (kannst du empfehlen):\n${vids}` : ""}`;
  }

  function tutorMode(root, kurs, lesson, videos) {
    const key = `chat:${kurs.id}/${lesson.id}`;
    let turns = store.get(key, []);
    let ctl = null, busy = false;
    const save = () => store.set(key, turns.slice(-30));

    root.innerHTML = `
      <div class="chat">
        <div class="chat-log" id="chatLog" aria-live="polite"></div>
        <div class="chat-quick" id="chatQuick">
          <button class="btn small" data-say="Weiter, bitte.">Weiter</button>
          <button class="btn small" data-say="Das habe ich nicht verstanden. Erklär es bitte einfacher, mit einem Alltagsbeispiel.">Erklär's einfacher</button>
          <button class="btn small" data-say="Gib mir ein konkretes Praxisbeispiel für ein Instagram-Reel dazu.">Praxisbeispiel</button>
          <button class="btn small" data-say="Stell mir eine schwierigere Frage zu dem Thema.">Schwerere Frage</button>
        </div>
        <form class="chat-input" id="chatForm">
          <textarea id="chatIn" rows="2" placeholder="Deine Antwort oder Frage …"></textarea>
          <div class="chat-actions">
            <button class="btn primary" id="chatSend">Senden</button>
            <button type="button" class="btn" id="chatStop" hidden>Stopp</button>
          </div>
        </form>
        <div class="row-gap">
          <button type="button" class="btn small" id="chatReset">Gespräch neu starten</button>
        </div>
      </div>`;

    const log = root.querySelector("#chatLog");
    const input = root.querySelector("#chatIn");
    const send = root.querySelector("#chatSend");
    const stop = root.querySelector("#chatStop");

    function bubble(role, html) {
      const div = document.createElement("div");
      div.className = "msg " + (role === "user" ? "me" : "tutor");
      div.innerHTML = `<div class="who">${role === "user" ? "Du" : "Tutor"}</div><div class="txt">${html}</div>`;
      log.appendChild(div);
      return div.querySelector(".txt");
    }
    function renderLog() {
      log.innerHTML = "";
      turns.forEach(t => {
        if (t.hidden) return;
        bubble(t.role, t.role === "user" ? `<p>${esc(t.content)}</p>` : md(t.content));
      });
      if (!turns.length) {
        bubble("assistant", `<p>Hi! Ich bin dein Tutor für <strong>${esc(lesson.titel)}</strong>. Ich erkläre dir den Stoff Stück für Stück und stelle dir nach jedem Teil eine Frage.</p><p class="muted">Tippe auf „Starten“, wenn du bereit bist.</p>`);
        const b = document.createElement("button");
        b.className = "btn primary"; b.textContent = "Starten"; b.type = "button";
        b.onclick = () => ask("Hallo! Bitte starte die Lektion mit dem ersten Teil.", true);
        log.lastChild.querySelector(".txt").appendChild(b);
      }
      log.scrollTop = log.scrollHeight;
    }

    function setBusy(v) {
      busy = v; send.disabled = v; stop.hidden = !v;
      root.querySelectorAll("[data-say]").forEach(b => b.disabled = v);
    }

    async function ask(text, hidden) {
      if (busy || !text.trim()) return;
      if (!aiAvailable()) { renderLog(); bubble("assistant", `<p class="muted">${esc(aiErrorText({ code: "not_granted" }))}</p>`); return; }
      turns.push({ role: "user", content: text, ...(hidden ? { hidden: true } : {}) });
      save(); renderLog();
      const out = bubble("assistant", `<p class="thinking">Tutor denkt nach …</p>`);
      log.scrollTop = log.scrollHeight;
      setBusy(true);
      ctl = new AbortController();
      const rules = tutorRules(kurs, lesson, videos);
      const history = turns.slice(-16).map(t => ({ role: t.role, content: t.content }));
      try {
        const { text: answer } = await aiFn([{ role: "user", content: rules }, ...history], {
          modelTier: "quick", cache: false, signal: ctl.signal,
          onText: ({ text: t }) => { out.innerHTML = md(t); log.scrollTop = log.scrollHeight; }
        });
        turns.push({ role: "assistant", content: answer });
      } catch (e) {
        if (e && e.text) turns.push({ role: "assistant", content: e.text });
        else turns.pop(); // fehlgeschlagene Nachricht zurücknehmen
        save(); renderLog();
        if (!e || e.code !== "cancelled") {
          const t = bubble("assistant", `<p class="muted">${esc(aiErrorText(e))}</p>`);
          if (!aiBlocked) {
            const retry = document.createElement("button");
            retry.className = "btn small"; retry.type = "button"; retry.textContent = "Nochmal";
            retry.onclick = () => ask(text, hidden);
            t.appendChild(retry);
          }
        }
      } finally {
        save(); setBusy(false); log.scrollTop = log.scrollHeight;
      }
    }

    root.querySelector("#chatForm").onsubmit = e => { e.preventDefault(); const t = input.value; input.value = ""; ask(t); };
    input.onkeydown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); root.querySelector("#chatForm").requestSubmit(); } };
    stop.onclick = () => ctl && ctl.abort();
    root.querySelectorAll("[data-say]").forEach(b => b.onclick = () => ask(b.dataset.say));
    const reset = root.querySelector("#chatReset");
    reset.onclick = () => {
      if (!reset.dataset.armed) { reset.dataset.armed = "1"; reset.textContent = "Wirklich neu starten? Nochmal tippen"; return; }
      if (ctl) ctl.abort();
      turns = []; save(); renderLog(); reset.textContent = "Gespräch neu starten"; delete reset.dataset.armed;
    };
    renderLog();
  }

  /* ---------------- Training: gemischte Fragen ---------------- */
  function training(root, kurse, isDone) {
    const pool = [];
    kurse.forEach(k => k.lektionen.forEach(l => (l.quiz || []).forEach(q => pool.push({ k, l, q }))));
    let filter = "alle", round = [], pos = 0, score = 0, answered = null;

    function newRound() {
      let p = pool;
      if (filter === "erledigt") p = pool.filter(x => isDone(x.k.id, x.l.id));
      else if (filter !== "alle") p = pool.filter(x => x.k.id === filter);
      round = p.slice().sort(() => Math.random() - 0.5).slice(0, 10);
      pos = 0; score = 0; answered = null; render();
    }

    function render() {
      const filters = [["alle", "Alles"], ["erledigt", "Nur abgeschlossene Lektionen"], ...kurse.map(k => [k.id, k.titel])];
      const head = `<div class="tabs">${filters.map(([id, t]) => `<button class="btn small ${filter === id ? "active" : ""}" data-f="${id}">${esc(t)}</button>`).join("")}</div>`;
      if (!round.length) {
        root.innerHTML = head + `<p class="muted">Für diese Auswahl gibt es noch keine Fragen. Schließe zuerst eine Lektion ab oder wähle „Alles“.</p>`;
      } else if (pos >= round.length) {
        root.innerHTML = head + `<div class="step-card end-step"><div class="eyebrow">Runde beendet</div>
          <p class="score">${score} von ${round.length} richtig</p>
          <p class="muted">${score === round.length ? "Perfekt! Du kannst den Stoff." : score >= round.length * 0.7 ? "Stark. Die falschen Fragen lohnen einen zweiten Blick in die Lektion." : "Schau dir die Lektionen zu den falschen Fragen noch einmal an."}</p>
          <button class="btn primary" id="again">Neue Runde</button></div>`;
        root.querySelector("#again").onclick = newRound;
      } else {
        const { k, l, q } = round[pos];
        root.innerHTML = head + `
          <div class="step-head"><span>Frage ${pos + 1} von ${round.length} · ${score} richtig</span>
          <div class="progress"><div style="width:${(pos / round.length) * 100}%"></div></div></div>
          <div class="step-card quiz-step">
            <div class="eyebrow">${esc(k.titel)} · ${esc(l.titel)}</div>
            <p class="q-title">${esc(q.frage)}</p>
            <div class="choices">${q.antworten.map((a, ai) => {
              let cls = "";
              if (answered !== null) cls = ai === q.richtig ? "right" : ai === answered ? "wrong" : "dim";
              return `<button class="choice ${cls}" data-ai="${ai}" ${answered !== null ? "disabled" : ""}>${esc(a)}</button>`;
            }).join("")}</div>
            ${answered !== null ? `<div class="feedback ${answered === q.richtig ? "ok" : "bad"}"><strong>${answered === q.richtig ? "Richtig!" : "Nicht ganz."}</strong> ${esc(q.erklaerung || "")}
              ${answered !== q.richtig ? ` <a href="#/lektion/${k.id}/${l.id}">Zur Lektion →</a>` : ""}</div>` : ""}
          </div>
          <div class="step-nav"><span></span><button class="btn primary" id="tNext" ${answered === null ? "disabled" : ""}>${answered === null ? "Erst antworten" : "Weiter →"}</button></div>`;
        root.querySelectorAll(".choice").forEach(b => b.onclick = () => {
          answered = +b.dataset.ai; if (answered === q.richtig) score++; render();
        });
        root.querySelector("#tNext").onclick = () => { pos++; answered = null; render(); };
      }
      root.querySelectorAll("[data-f]").forEach(b => b.onclick = () => { filter = b.dataset.f; newRound(); });
    }
    newRound();
  }

  // Einzelne Frage zu einem Textausschnitt (z. B. aus dem Reels-Modus)
  async function ask(lessonTitle, contextText, question, out, btn) {
    if (!aiAvailable()) { out.hidden = false; out.innerHTML = `<p class="muted">${esc(aiErrorText({ code: "not_granted" }))}</p>`; return; }
    btn.disabled = true; out.hidden = false; out.innerHTML = `<p class="thinking">Tutor denkt nach …</p>`;
    try {
      await aiFn(`Du bist ein Dozent an einer Filmhochschule (Kamera, Licht, Schnitt, Color Grading, Instagram-Edits). Beantworte die Frage eines Studenten auf Deutsch, duze ihn, kurz und praxisnah (max. 6 Sätze oder eine kurze Liste).\n\nLEKTION: ${lessonTitle}\nLERNKARTE:\n${String(contextText).slice(0, 4000)}\n\nFRAGE:\n${question}`,
        { modelTier: "quick", cache: false, onText: ({ text }) => { out.innerHTML = md(text); } });
    } catch (e) {
      out.innerHTML = (e && e.text ? md(e.text) : "") + `<p class="muted">${esc(aiErrorText(e))}</p>`;
    } finally { btn.disabled = false; }
  }

  window.Tutor = { aiReady, aiAvailable, stepMode, tutorMode, training, ask };
})();
