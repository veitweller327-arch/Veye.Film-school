/*
 * Reels-Modus: Lerninhalte als vertikaler Feed im Vollbild – wischen/scrollen wie bei
 * Instagram Reels oder TikTok. Jede Karte enthält einen kleinen Lernhappen, dazwischen
 * Quizkarten. Bilder pro Abschnitt kommen aus lesson.bilder (optional).
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, f) { try { const v = localStorage.getItem("veye:" + k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem("veye:" + k, JSON.stringify(v)); } catch { /* egal */ } }
  };
  const textOf = html => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim(); };

  /* ---------------- Lektion → Karten ---------------- */
  function lessonCards(kurs, lesson) {
    const root = document.createElement("div");
    root.innerHTML = lesson.inhalt;
    const bilder = lesson.bilder || [];
    const cards = [];
    let heading = lesson.titel, buf = [], bufLen = 0, partNo = 0;

    const push = (type, html, extra = {}) => cards.push({ type, kurs, lesson, heading, html, ...extra });
    const flush = () => {
      if (!buf.length) return;
      push("info", buf.join(""), { part: ++partNo });
      buf = []; bufLen = 0;
    };
    const addImage = h => {
      const img = bilder.find(b => b.abschnitt === h);
      if (img) push("bild", "", { bild: img });
    };

    for (const node of Array.from(root.children)) {
      const tag = node.tagName.toLowerCase();
      const len = node.textContent.length;
      if (tag === "h3") {
        flush(); heading = node.textContent.trim(); partNo = 0; addImage(heading);
      } else if (tag === "table") {
        flush(); push("tabelle", node.outerHTML);
      } else if (tag === "pre") {
        flush(); push("info", node.outerHTML);
      } else if (tag === "div" && node.classList.contains("box")) {
        flush();
        const label = node.querySelector("h4")?.textContent || "Merke";
        node.querySelector("h4")?.remove();
        push("tipp", node.innerHTML, { label });
      } else if (tag === "ul" || tag === "ol") {
        const items = Array.from(node.children);
        if (items.length <= 4 && bufLen + len < 420) { buf.push(node.outerHTML); bufLen += len; continue; }
        // Kurze Einleitung (z. B. „… folgende Punkte:“) bleibt bei den ersten Listenpunkten
        const lead = bufLen < 260 ? buf.join("") : "";
        if (!lead) flush(); else { buf = []; bufLen = 0; }
        for (let i = 0; i < items.length; i += 3) {
          const part = items.slice(i, i + 3).map(li => li.outerHTML).join("");
          push("info", (i === 0 ? lead : "") + `<${tag} start="${i + 1}">${part}</${tag}>`, { part: ++partNo });
        }
      } else {
        if (bufLen + len > 360) flush();
        buf.push(node.outerHTML); bufLen += len;
      }
    }
    flush();
    if (!cards.length || cards[0].heading !== lesson.titel) addImage(lesson.titel);

    // Quizkarten gleichmäßig verteilen
    const quiz = lesson.quiz || [];
    const infoIdx = cards.map((c, i) => c.type !== "bild" ? i : -1).filter(i => i >= 0);
    const inserts = quiz.map((q, qi) => ({ at: infoIdx[Math.min(infoIdx.length - 1, Math.round(((qi + 1) * infoIdx.length) / quiz.length) - 1)], q, qi }));
    for (let i = inserts.length - 1; i >= 0; i--) {
      const { at, q, qi } = inserts[i];
      cards.splice(at + 1, 0, { type: "quiz", kurs, lesson, heading: "Kurzer Check", q, qi });
    }
    cards.unshift({ type: "cover", kurs, lesson });
    cards.push({ type: "ende", kurs, lesson });
    return cards;
  }

  /* ---------------- Karten rendern ---------------- */
  function cardHtml(c, i, total, ctx) {
    const lvl = { basis: "Basis", vertiefung: "Vertiefung", praxis: "Praxis" }[c.lesson.level] || "";
    const saved = isSaved(c);
    const rail = c.type === "cover" || c.type === "ende" ? "" : `
      <div class="reel-rail">
        <button class="rail-btn ${saved ? "on" : ""}" data-act="save" aria-label="Merken"><span class="ico">${saved ? "★" : "☆"}</span><span>Merken</span></button>
        ${ctx.ai ? `<button class="rail-btn" data-act="ask" aria-label="Tutor fragen"><span class="ico">?</span><span>Fragen</span></button>` : ""}
        <a class="rail-btn" href="#/lektion/${c.kurs.id}/${c.lesson.id}" data-act="open" aria-label="Lektion öffnen"><span class="ico">↗</span><span>Lektion</span></a>
      </div>`;
    let body = "";
    switch (c.type) {
      case "cover":
        body = `
          <div class="a reel-kicker">${esc(c.kurs.icon)} ${esc(c.kurs.titel)}${lvl ? ` · ${lvl}` : ""}</div>
          <h2 class="a reel-cover-title">${esc(c.lesson.titel)}</h2>
          ${(c.lesson.mentor || []).length ? `<div class="a reel-sub">nach ${esc((window.CREATORS || []).filter(m => c.lesson.mentor.includes(m.id)).map(m => m.name).join(" & "))}</div>` : ""}
          <div class="a reel-sub">${ctx.countFor(c.lesson)} Karten · ${(c.lesson.quiz || []).length} Fragen</div>
          <div class="a swipe-hint"><span class="chev">⌃</span>Nach oben wischen</div>`;
        break;
      case "info":
        body = `<div class="a reel-kicker">${esc(c.heading)}</div><div class="a reel-text">${c.html}</div>`;
        break;
      case "tabelle":
        body = `<div class="a reel-kicker">${esc(c.heading)}</div><div class="a reel-table">${c.html}</div>`;
        break;
      case "tipp":
        body = `<div class="a reel-tip"><div class="reel-kicker">${esc(c.label)}</div><div class="reel-text">${c.html}</div></div>`;
        break;
      case "bild":
        body = `<div class="a reel-kicker">${esc(c.heading)}</div>
          <figure class="a reel-figure"><img src="${esc(c.bild.src)}" alt="${esc(c.bild.alt || c.heading)}" loading="lazy">
          ${c.bild.text ? `<figcaption>${esc(c.bild.text)}</figcaption>` : ""}</figure>
          ${c.bild.credit ? `<div class="a reel-credit">Bild: ${c.bild.quelle ? `<a href="${esc(c.bild.quelle)}" target="_blank" rel="noopener">${esc(c.bild.credit)}</a>` : esc(c.bild.credit)}${c.bild.lizenz ? ` · ${esc(c.bild.lizenz)}` : ""}</div>` : ""}`;
        break;
      case "quiz": {
        const given = ctx.answers[key(c)];
        body = `<div class="a reel-kicker">Kurzer Check</div>
          <p class="a reel-q">${esc(c.q.frage)}</p>
          <div class="a reel-choices">${c.q.antworten.map((a, ai) => {
            let cls = "";
            if (given !== undefined) cls = ai === c.q.richtig ? "right" : ai === given ? "wrong" : "dim";
            return `<button class="reel-choice ${cls}" data-ai="${ai}" ${given !== undefined ? "disabled" : ""}>${esc(a)}</button>`;
          }).join("")}</div>
          <div class="reel-feedback" ${given === undefined ? "hidden" : ""}>${given === undefined ? "" : feedbackHtml(c, given)}</div>`;
        break;
      }
      case "ende": {
        const qs = c.lesson.quiz || [];
        const right = qs.filter((q, qi) => ctx.answers[`${c.kurs.id}/${c.lesson.id}/${qi}`] === q.richtig).length;
        body = `
          <div class="a reel-kicker">Lektion geschafft</div>
          <h2 class="a reel-cover-title">${esc(c.lesson.titel)}</h2>
          ${qs.length ? `<div class="a reel-score">${right}<span>/${qs.length}</span></div><div class="a reel-sub">Fragen richtig</div>` : ""}
          ${c.lesson.aufgabe ? `<div class="a reel-tip"><div class="reel-kicker">Deine Praxis-Übung</div><div class="reel-text"><p>${esc(c.lesson.aufgabe)}</p></div></div>` : ""}
          <div class="a reel-actions">
            <button class="btn primary" data-act="done">${ctx.isDone(c.kurs.id, c.lesson.id) ? "✓ Abgeschlossen" : "Lektion abschließen"}</button>
            ${ctx.mode === "lektion" && ctx.nextLesson ? `<a class="btn" href="#/lektion/${c.kurs.id}/${ctx.nextLesson.id}" data-act="next">Nächste Lektion →</a>` : ""}
          </div>
          ${ctx.mode === "feed" && i < total - 1 ? `<div class="a swipe-hint"><span class="chev">⌃</span>Weiter zur nächsten Lektion</div>` : ""}`;
        break;
      }
    }
    return `<section class="reel reel-${c.type} theme-${c.kurs.id}" data-i="${i}">
      <div class="reel-bg"></div>
      <div class="reel-body">${body}</div>
      ${rail}
    </section>`;
  }

  function feedbackHtml(c, given) {
    const ok = given === c.q.richtig;
    return `<strong>${ok ? "Richtig!" : "Nicht ganz."}</strong> ${esc(c.q.erklaerung || "")}`;
  }

  const key = c => `${c.kurs.id}/${c.lesson.id}/${c.qi}`;
  const cardId = c => `${c.kurs.id}/${c.lesson.id}/${c.heading}/${c.part || c.type}/${textOf(c.html || "").slice(0, 40)}`;
  const isSaved = c => store.get("saved", []).some(s => s.id === cardId(c));

  /* ---------------- Vollbild-Feed ---------------- */
  let openFeed = null;

  function open(cards, opts) {
    if (openFeed) openFeed.close();
    const ctx = {
      ai: !!(window.Tutor && window.Tutor.aiAvailable()),
      answers: store.get("feedAnswers", {}),
      isDone: opts.isDone, mode: opts.mode, nextLesson: opts.nextLesson,
      countFor: l => cards.filter(c => c.lesson === l).length
    };
    const progressKey = opts.progressKey;
    const start = Math.min(cards.length - 1, Math.max(0, opts.start ?? store.get(progressKey, 0)));

    const wrap = document.createElement("div");
    wrap.className = "reels";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", opts.title);
    wrap.innerHTML = `
      <div class="reels-top">
        <button class="reels-close" aria-label="Schließen">✕</button>
        <div class="reels-title">${esc(opts.title)}</div>
        <div class="reels-count" aria-live="polite"></div>
      </div>
      <div class="reels-bar"><div></div></div>
      <div class="reels-scroll" tabindex="0">${cards.map((c, i) => cardHtml(c, i, cards.length, ctx)).join("")}</div>
      <div class="reels-sheet" hidden>
        <div class="sheet-inner">
          <div class="sheet-head"><strong>Frag den Tutor</strong><button class="reels-close sheet-x" aria-label="Schließen">✕</button></div>
          <div class="ask-row"><input type="text" id="reelAsk" placeholder="Was möchtest du dazu wissen?"><button class="btn small primary" id="reelAskBtn">Fragen</button></div>
          <div class="ai-out" id="reelAskOut" hidden></div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    document.documentElement.classList.add("reels-open");

    const scroller = wrap.querySelector(".reels-scroll");
    const count = wrap.querySelector(".reels-count");
    const bar = wrap.querySelector(".reels-bar > div");
    const sections = Array.from(scroller.children);
    let current = start;

    // Animation beim Einblenden jeder Karte
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting && e.intersectionRatio > 0.55) {
          e.target.classList.add("in-view");
          current = +e.target.dataset.i;
          store.set(progressKey, current);
          const c = cards[current];
          count.textContent = opts.mode === "feed" ? c.lesson.titel : `${current + 1} / ${cards.length}`;
          bar.style.width = `${((current + 1) / cards.length) * 100}%`;
        }
      });
    }, { root: scroller, threshold: [0.55] });
    sections.forEach(s => io.observe(s));

    // Startposition
    requestAnimationFrame(() => {
      sections[start].scrollIntoView({ block: "start" });
      sections[start].classList.add("in-view");
    });

    function go(delta) {
      const n = Math.max(0, Math.min(sections.length - 1, current + delta));
      sections[n].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }

    function onKey(e) {
      if (!wrap.querySelector(".reels-sheet").hidden) { if (e.key === "Escape") closeSheet(); return; }
      if (["ArrowDown", "PageDown", "j"].includes(e.key) || (e.key === " " && !e.shiftKey)) { e.preventDefault(); go(1); }
      else if (["ArrowUp", "PageUp", "k"].includes(e.key) || (e.key === " " && e.shiftKey)) { e.preventDefault(); go(-1); }
      else if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);

    // Aktionen
    scroller.addEventListener("click", e => {
      const sec = e.target.closest(".reel"); if (!sec) return;
      const c = cards[+sec.dataset.i];
      const choice = e.target.closest(".reel-choice");
      if (choice && !choice.disabled) {
        const ai = +choice.dataset.ai;
        ctx.answers[key(c)] = ai; store.set("feedAnswers", ctx.answers);
        sec.querySelectorAll(".reel-choice").forEach((b, bi) => {
          b.disabled = true;
          b.classList.add(bi === c.q.richtig ? "right" : bi === ai ? "wrong" : "dim");
        });
        const fb = sec.querySelector(".reel-feedback");
        fb.innerHTML = feedbackHtml(c, ai); fb.hidden = false;
        sec.classList.add(ai === c.q.richtig ? "pop-ok" : "pop-bad");
        return;
      }
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "save") {
        const list = store.get("saved", []);
        const id = cardId(c);
        const idx = list.findIndex(s => s.id === id);
        if (idx >= 0) list.splice(idx, 1);
        else list.push({ id, kurs: c.kurs.id, lektion: c.lesson.id, heading: c.heading, type: c.type, html: c.html || "", label: c.label || "", part: c.part || 0, bild: c.bild || null, qi: c.qi });
        store.set("saved", list);
        const btn = e.target.closest("[data-act]");
        btn.classList.toggle("on", idx < 0);
        btn.querySelector(".ico").textContent = idx < 0 ? "★" : "☆";
      } else if (act === "ask") {
        openSheet(c);
      } else if (act === "open" || act === "next") {
        close();
      } else if (act === "done") {
        if (!opts.isDone(c.kurs.id, c.lesson.id)) opts.markDone(c.kurs.id, c.lesson.id);
        e.target.textContent = "✓ Abgeschlossen";
        if (opts.mode === "feed") go(1);
      }
    });

    // Tutor-Bottom-Sheet
    let sheetCard = null;
    const sheet = wrap.querySelector(".reels-sheet");
    function openSheet(c) {
      sheetCard = c; sheet.hidden = false;
      wrap.querySelector("#reelAskOut").hidden = true;
      setTimeout(() => wrap.querySelector("#reelAsk").focus(), 50);
    }
    function closeSheet() { sheet.hidden = true; }
    wrap.querySelector(".sheet-x").onclick = closeSheet;
    sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
    const askNow = () => {
      const q = wrap.querySelector("#reelAsk").value.trim();
      if (!q || !sheetCard) return;
      const ctxText = sheetCard.type === "quiz"
        ? `Quizfrage: ${sheetCard.q.frage}\nAntworten: ${sheetCard.q.antworten.join(" / ")}\nRichtig: ${sheetCard.q.antworten[sheetCard.q.richtig]}\nErklärung: ${sheetCard.q.erklaerung || ""}`
        : `${sheetCard.heading}\n${textOf(sheetCard.html || "")}`;
      window.Tutor.ask(sheetCard.lesson.titel, ctxText, q, wrap.querySelector("#reelAskOut"), wrap.querySelector("#reelAskBtn"));
    };
    wrap.querySelector("#reelAskBtn").onclick = askNow;
    wrap.querySelector("#reelAsk").onkeydown = e => { if (e.key === "Enter") askNow(); };

    function close() {
      io.disconnect();
      document.removeEventListener("keydown", onKey);
      wrap.remove();
      document.documentElement.classList.remove("reels-open");
      openFeed = null;
      if (opts.onClose) opts.onClose();
    }
    wrap.querySelector(".reels-close").onclick = close;
    openFeed = { close };
    setTimeout(() => scroller.focus({ preventScroll: true }), 100);
    return openFeed;
  }

  // Beim Seitenwechsel (Hash-Navigation) Feed schließen
  window.addEventListener("hashchange", () => { if (openFeed) openFeed.close(); });

  function openLesson(kurs, lesson, opts) {
    const cards = lessonCards(kurs, lesson);
    return open(cards, { ...opts, mode: "lektion", title: lesson.titel, progressKey: `reel:${kurs.id}/${lesson.id}` });
  }

  function openAll(kurse, filter, opts) {
    let cards = [];
    if (filter === "gemerkt") {
      const saved = store.get("saved", []);
      saved.forEach(s => {
        const kurs = kurse.find(k => k.id === s.kurs); const lesson = kurs?.lektionen.find(l => l.id === s.lektion);
        if (!kurs || !lesson) return;
        const c = { type: s.type, kurs, lesson, heading: s.heading, html: s.html, label: s.label, part: s.part, bild: s.bild };
        if (s.type === "quiz" && lesson.quiz && lesson.quiz[s.qi]) Object.assign(c, { q: lesson.quiz[s.qi], qi: s.qi });
        if (s.type !== "quiz" || c.q) cards.push(c);
      });
      if (!cards.length) return null;
    } else {
      kurse.filter(k => filter === "alle" || k.id === filter).forEach(k => k.lektionen.forEach(l => { cards = cards.concat(lessonCards(k, l)); }));
    }
    return open(cards, { ...opts, mode: "feed", title: filter === "gemerkt" ? "Gemerkte Karten" : filter === "alle" ? "Lern-Feed" : kurse.find(k => k.id === filter).titel, progressKey: `reelfeed:${filter}` });
  }

  window.Feed = { lessonCards, openLesson, openAll, savedCount: () => store.get("saved", []).length };
})();
