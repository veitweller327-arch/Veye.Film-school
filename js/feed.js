/*
 * Reels-Modus: Lerninhalte als vertikaler Vollbild-Feed – wischen/scrollen wie bei
 * Instagram Reels oder TikTok. Der Lektionstext wird in abwechslungsreiche Kartentypen
 * zerlegt (Kapitel, Begriffe, Schritte, Datenblatt, Vergleich, Merksatz, Quiz …).
 * Bilder pro Abschnitt kommen optional aus lesson.bilder.
 */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k, f) { try { const v = localStorage.getItem("veye:" + k); return v ? JSON.parse(v) : f; } catch { return f; } },
    set(k, v) { try { localStorage.setItem("veye:" + k, JSON.stringify(v)); } catch { /* egal */ } }
  };
  const textOf = html => { const d = document.createElement("div"); d.innerHTML = html; return d.textContent.replace(/\s+/g, " ").trim(); };
  const pad = n => String(n).padStart(2, "0");
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= Lektion → Karten ================= */

  // Listenpunkt der Form "<strong>Begriff:</strong> Erklärung" zerlegen
  function splitTerm(li) {
    const first = li.firstElementChild;
    if (!first || first.tagName !== "STRONG" || li.firstChild !== first) return null;
    const term = first.textContent.replace(/[:：]\s*$/, "").trim();
    const clone = li.cloneNode(true);
    clone.removeChild(clone.firstElementChild);
    const rest = clone.innerHTML.replace(/^\s*[:–-]?\s*/, "").trim();
    return term.length <= 60 ? { term, rest } : null;
  }

  function parseTable(table) {
    const rows = Array.from(table.querySelectorAll("tr")).map(tr => Array.from(tr.children).map(td => td.innerHTML.trim()));
    const head = table.querySelector("tr") && table.querySelector("tr").querySelector("th") ? rows.shift() : null;
    return { head: head || [], rows };
  }

  function lessonCards(kurs, lesson) {
    const root = document.createElement("div");
    root.innerHTML = lesson.inhalt;
    const bilder = [...((window.GRAFIKEN || {})[`${kurs.id}/${lesson.id}`] || []), ...(lesson.bilder || [])];
    const cards = [];
    let heading = lesson.titel, chapter = 0, firstInSection = true;
    let buf = [], bufLen = 0;

    const push = (type, extra) => {
      cards.push({ type, kurs, lesson, heading, chapter, first: firstInSection && chapter > 0, ...extra });
      firstInSection = false;
    };
    const takeLead = () => {
      if (!buf.length || bufLen > 260) { flush(); return ""; }
      const lead = buf.join(""); buf = []; bufLen = 0; return lead;
    };
    function flush() {
      if (!buf.length) return;
      const html = buf.join("");
      const t = textOf(html);
      if (buf.length === 1 && /^<p/i.test(buf[0]) && t.length < 170) push("statement", { html: buf[0].replace(/^<p[^>]*>|<\/p>$/g, "") });
      else push("text", { html });
      buf = []; bufLen = 0;
    }
    const addImage = h => {
      const img = bilder.find(b => b.abschnitt === h);
      if (img) push("bild", { bild: img });
    };
    addImage(lesson.titel);

    for (const node of Array.from(root.children)) {
      const tag = node.tagName.toLowerCase();
      const len = node.textContent.length;

      if (tag === "h3") {
        flush(); heading = node.textContent.trim(); chapter++; firstInSection = true; addImage(heading);

      } else if (tag === "table") {
        const lead = takeLead();
        const { head, rows } = parseTable(node);
        if (head.length === 2 || (!head.length && rows[0] && rows[0].length === 2)) {
          for (let i = 0; i < rows.length; i += 5) push("spec", { lead: i === 0 ? lead : "", head, rows: rows.slice(i, i + 5) });
        } else {
          for (let i = 0; i < rows.length; i += 3) push("zeilen", { lead: i === 0 ? lead : "", head, rows: rows.slice(i, i + 3), from: i, total: rows.length });
        }

      } else if (tag === "pre") {
        flush();
        const t = node.textContent;
        if (t.includes("→")) push("flow", { steps: t.split("→").map(s => s.replace(/[[\]]/g, "").trim()).filter(Boolean) });
        else push("text", { html: node.outerHTML });

      } else if (tag === "div" && node.classList.contains("box")) {
        flush();
        const label = node.querySelector("h4")?.textContent || "";
        node.querySelector("h4")?.remove();
        push("tipp", { html: node.innerHTML, label, kind: node.classList.contains("task") ? "task" : node.classList.contains("tip") ? "tip" : "note" });

      } else if (tag === "ul" || tag === "ol") {
        const items = Array.from(node.children);
        const terms = items.map(splitTerm);
        const termish = terms.filter(Boolean).length >= Math.ceil(items.length * 0.6);
        if (tag === "ol") {
          const lead = takeLead();
          for (let i = 0; i < items.length; i += 4) push("schritte", { lead: i === 0 ? lead : "", from: i, items: items.slice(i, i + 4).map(li => li.innerHTML) });
        } else if (termish) {
          const lead = takeLead();
          for (let i = 0; i < items.length; i += 3) {
            push("begriffe", { lead: i === 0 ? lead : "", items: items.slice(i, i + 3).map((li, k) => terms[i + k] || { term: "", rest: li.innerHTML }) });
          }
        } else if (items.length <= 4 && bufLen + len < 420) {
          buf.push(node.outerHTML); bufLen += len;
        } else {
          const lead = takeLead();
          for (let i = 0; i < items.length; i += 4) push("liste", { lead: i === 0 ? lead : "", items: items.slice(i, i + 4).map(li => li.innerHTML) });
        }

      } else {
        if (bufLen + len > 320) flush();
        buf.push(node.outerHTML); bufLen += len;
      }
    }
    flush();

    // Quizkarten gleichmäßig zwischen die Inhaltskarten streuen
    const quiz = lesson.quiz || [];
    const n = cards.length;
    const at = quiz.map((q, qi) => Math.max(1, Math.round(((qi + 1) * n) / quiz.length)));
    for (let qi = quiz.length - 1; qi >= 0; qi--) {
      const prev = cards[Math.min(at[qi], cards.length) - 1];
      cards.splice(at[qi], 0, { type: "quiz", kurs, lesson, heading: prev ? prev.heading : lesson.titel, chapter: prev ? prev.chapter : 0, q: quiz[qi], qi });
    }
    cards.unshift({ type: "cover", kurs, lesson, chapters: chapter });
    cards.push({ type: "ende", kurs, lesson });
    return cards;
  }

  /* ================= Karten rendern ================= */

  const LEVEL = { basis: "Basis", vertiefung: "Vertiefung", praxis: "Praxis" };
  const TIP_LABEL = { tip: "Profi-Tipp", task: "Deine Aufgabe", note: "Merke" };

  function header(c) {
    if (c.first) {
      return `<div class="a chap"><span class="chap-nr">${pad(c.chapter)}</span><span class="chap-line"></span></div>
              <h3 class="a chap-title">${esc(c.heading)}</h3>`;
    }
    return `<div class="a reel-kicker">${c.chapter ? `<span class="kick-nr">${pad(c.chapter)}</span>` : ""}${esc(c.heading)}</div>`;
  }
  const leadHtml = c => c.lead ? `<div class="a reel-lead">${c.lead}</div>` : "";

  function bodyHtml(c, i, total, ctx) {
    switch (c.type) {
      case "cover": {
        const mentors = (window.CREATORS || []).filter(m => (c.lesson.mentor || []).includes(m.id)).map(m => m.name);
        return `
          <div class="a cover-tags"><span class="pill">${esc(c.kurs.titel)}</span>${LEVEL[c.lesson.level] ? `<span class="pill ghost">${LEVEL[c.lesson.level]}</span>` : ""}</div>
          <h2 class="a reel-cover-title">${esc(c.lesson.titel)}</h2>
          ${mentors.length ? `<div class="a reel-sub">nach ${esc(mentors.join(" & "))}</div>` : ""}
          <div class="a cover-stats">
            <div><b>${ctx.countFor(c.lesson)}</b><span>Karten</span></div>
            <div><b>${c.chapters || 1}</b><span>Kapitel</span></div>
            <div><b>${(c.lesson.quiz || []).length}</b><span>Fragen</span></div>
          </div>
          <div class="a swipe-hint"><span class="chev"></span>Nach oben wischen</div>`;
      }
      case "text":
        return `${header(c)}<div class="a reel-text">${c.html}</div>`;
      case "statement":
        return `${header(c)}<p class="a reel-statement">${c.html}</p>`;
      case "begriffe":
        return `${header(c)}${leadHtml(c)}<div class="terms">${c.items.map(t => `
          <div class="a term">${t.term ? `<div class="term-name">${esc(t.term)}</div>` : ""}<div class="term-desc">${t.rest}</div></div>`).join("")}</div>`;
      case "liste":
        return `${header(c)}${leadHtml(c)}<ul class="reel-list">${c.items.map(li => `<li class="a">${li}</li>`).join("")}</ul>`;
      case "schritte":
        return `${header(c)}${leadHtml(c)}<ol class="steps">${c.items.map((li, k) => `
          <li class="a"><span class="step-nr">${c.from + k + 1}</span><div>${li}</div></li>`).join("")}</ol>`;
      case "spec":
        return `${header(c)}${leadHtml(c)}
          ${c.head.length ? `<div class="a spec-head"><span>${c.head[0]}</span><span>${c.head[1] || ""}</span></div>` : ""}
          <div class="spec">${c.rows.map(r => `<div class="a spec-row ${textOf(r[1] || "").length > 18 ? "long" : ""}"><span class="spec-k">${r[0] || ""}</span><span class="spec-v">${r[1] || ""}</span></div>`).join("")}</div>`;
      case "zeilen":
        return `${header(c)}${leadHtml(c)}
          <div class="rowcards">${c.rows.map(r => `
            <div class="a rowcard">
              <div class="rc-title">${r[0] || ""}</div>
              <dl>${r.slice(1).map((cell, k) => `<div><dt>${c.head[k + 1] || ""}</dt><dd>${cell}</dd></div>`).join("")}</dl>
            </div>`).join("")}</div>
          ${c.total > 3 ? `<div class="a reel-note">${c.from + 1}–${Math.min(c.total, c.from + 3)} von ${c.total}</div>` : ""}`;
      case "flow":
        return `${header(c)}<div class="flow">${c.steps.map((s, k) => `${k ? `<span class="a flow-arrow" style="--d:${(k * 0.09).toFixed(2)}" aria-hidden="true"></span>` : ""}<span class="a flow-chip" style="--d:${(k * 0.09 + 0.05).toFixed(2)}"><i>${k + 1}</i>${esc(s)}</span>`).join("")}</div>`;
      case "tipp":
        return `${header(c)}<div class="a reel-tip tip-${c.kind}"><div class="tip-label"><span class="tip-dot"></span>${esc(c.label || TIP_LABEL[c.kind])}</div><div class="reel-text">${c.html}</div></div>`;
      case "bild":
        return `${header(c)}
          <figure class="a reel-figure ${c.bild.svg ? "is-svg" : ""}">${c.bild.svg ? c.bild.svg : `<img src="${esc(c.bild.src)}" alt="${esc(c.bild.alt || c.heading)}" loading="lazy">`}
          ${c.bild.text ? `<figcaption>${esc(c.bild.text)}</figcaption>` : ""}</figure>
          ${c.bild.credit ? `<div class="a reel-credit">Bild: ${c.bild.quelle ? `<a href="${esc(c.bild.quelle)}" target="_blank" rel="noopener">${esc(c.bild.credit)}</a>` : esc(c.bild.credit)}${c.bild.lizenz ? ` · ${esc(c.bild.lizenz)}` : ""}</div>` : ""}`;
      case "quiz": {
        const given = ctx.answers[qkey(c)];
        return `<div class="a quiz-badge">Kurzer Check</div>
          <p class="a reel-q">${esc(c.q.frage)}</p>
          <div class="reel-choices">${c.q.antworten.map((a, ai) => {
            let cls = "";
            if (given !== undefined) cls = ai === c.q.richtig ? "right" : ai === given ? "wrong" : "dim";
            return `<button class="a reel-choice ${cls}" data-ai="${ai}" ${given !== undefined ? "disabled" : ""}><span class="opt">${"ABCD"[ai] || ai + 1}</span><span>${esc(a)}</span></button>`;
          }).join("")}</div>
          <div class="reel-feedback ${given === undefined ? "" : given === c.q.richtig ? "ok" : "bad"}" ${given === undefined ? "hidden" : ""}>${given === undefined ? "" : feedbackHtml(c, given)}</div>`;
      }
      case "ende": {
        const qs = c.lesson.quiz || [];
        const right = qs.filter((q, qi) => ctx.answers[`${c.kurs.id}/${c.lesson.id}/${qi}`] === q.richtig).length;
        const pct = qs.length ? right / qs.length : 1;
        return `
          <div class="a reel-kicker">Lektion geschafft</div>
          <h2 class="a reel-cover-title small">${esc(c.lesson.titel)}</h2>
          ${qs.length ? `<div class="a ring" style="--pct:${pct}"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="ring-bg"/><circle cx="60" cy="60" r="52" class="ring-fg" pathLength="100"/></svg><div class="ring-txt"><b>${right}<small>/${qs.length}</small></b><span>richtig</span></div></div>` : ""}
          ${c.lesson.aufgabe ? `<div class="a reel-tip tip-task"><div class="tip-label"><span class="tip-dot"></span>Deine Praxis-Übung</div><div class="reel-text"><p>${esc(c.lesson.aufgabe)}</p></div></div>` : ""}
          <div class="a reel-actions">
            <button class="btn primary" data-act="done">${ctx.isDone(c.kurs.id, c.lesson.id) ? "✓ Abgeschlossen" : "Lektion abschließen"}</button>
            ${ctx.mode === "lektion" && ctx.nextLesson ? `<a class="btn" href="#/lektion/${c.kurs.id}/${ctx.nextLesson.id}" data-act="next">Nächste Lektion →</a>` : ""}
          </div>
          ${ctx.mode === "feed" && i < total - 1 ? `<div class="a swipe-hint"><span class="chev"></span>Weiter zur nächsten Lektion</div>` : ""}`;
      }
    }
    return "";
  }

  function cardHtml(c, i, total, ctx) {
    const saved = isSaved(c);
    const rail = c.type === "cover" || c.type === "ende" ? "" : `
      <div class="reel-rail">
        <button class="rail-btn ${saved ? "on" : ""}" data-act="save" aria-label="Merken" aria-pressed="${saved}"><span class="ico">${saved ? "★" : "☆"}</span><span>Merken</span></button>
        ${ctx.ai ? `<button class="rail-btn" data-act="ask" aria-label="Tutor fragen"><span class="ico">?</span><span>Fragen</span></button>` : ""}
        <a class="rail-btn" href="#/lektion/${c.kurs.id}/${c.lesson.id}" data-act="open" aria-label="Lektion öffnen"><span class="ico">↗</span><span>Lektion</span></a>
      </div>`;
    const layout = ["l1", "l2", "l3", "l4"][i % 4];
    return `<section class="reel reel-${c.type} theme-${c.kurs.id} ${layout}" data-i="${i}" data-notes-k="${c.kurs.id}" data-notes-l="${c.lesson.id}" data-notes-src="Reels · markiert">
      <div class="reel-bg"></div>
      <div class="reel-body">${bodyHtml(c, i, total, ctx)}</div>
      ${rail}
    </section>`;
  }

  function feedbackHtml(c, given) {
    const ok = given === c.q.richtig;
    return `<strong>${ok ? "Richtig!" : "Nicht ganz."}</strong> ${esc(c.q.erklaerung || "")}`;
  }

  const qkey = c => `${c.kurs.id}/${c.lesson.id}/${c.qi}`;
  const cardId = c => `${c.kurs.id}/${c.lesson.id}/${c.type}/${c.heading}/${c.qi ?? ""}/${textOf(JSON.stringify([c.html, c.items, c.rows, c.steps, c.lead])).slice(0, 60)}`;
  const isSaved = c => store.get("saved", []).some(s => s.id === cardId(c));

  /* ================= Vollbild-Feed ================= */
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
    const segmented = opts.mode === "lektion" && cards.length <= 40;

    const wrap = document.createElement("div");
    wrap.className = "reels";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", opts.title);
    wrap.innerHTML = `
      <div class="reels-top">
        ${segmented ? `<div class="reels-segs">${cards.map(() => "<i></i>").join("")}</div>` : `<div class="reels-bar"><div></div></div>`}
        <div class="reels-toprow">
          <button class="reels-close" aria-label="Schließen">✕</button>
          <div class="reels-title"></div>
          <div class="reels-count" aria-live="polite"></div>
        </div>
      </div>
      <div class="reels-scroll" tabindex="0">${cards.map((c, i) => cardHtml(c, i, cards.length, ctx)).join("")}</div>
      <div class="reels-sheet" hidden>
        <div class="sheet-inner">
          <div class="sheet-grip"></div>
          <div class="sheet-head"><strong>Frag den Tutor</strong><button class="reels-close sheet-x" aria-label="Schließen">✕</button></div>
          <div class="sheet-ctx" id="reelAskCtx"></div>
          <div class="ask-row"><input type="text" id="reelAsk" placeholder="Was möchtest du dazu wissen?"><button class="btn small primary" id="reelAskBtn">Fragen</button></div>
          <div class="ai-out" id="reelAskOut" hidden></div>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    document.documentElement.classList.add("reels-open");
    if (window.Terms) wrap.querySelectorAll(".reel-body").forEach(b => window.Terms.annotate(b));

    const scroller = wrap.querySelector(".reels-scroll");
    const titleEl = wrap.querySelector(".reels-title");
    const count = wrap.querySelector(".reels-count");
    const bar = wrap.querySelector(".reels-bar > div");
    const segs = Array.from(wrap.querySelectorAll(".reels-segs i"));
    const sections = Array.from(scroller.children);
    const sheet = wrap.querySelector(".reels-sheet");
    let current = start;

    function setCurrent(i) {
      current = i;
      store.set(progressKey, i);
      const c = cards[i];
      titleEl.textContent = opts.mode === "feed" ? c.lesson.titel : opts.title;
      count.textContent = `${i + 1} / ${cards.length}`;
      if (bar) bar.style.width = `${((i + 1) / cards.length) * 100}%`;
      segs.forEach((s, k) => { s.className = k < i ? "done" : k === i ? "now" : ""; });
      // Abschlusskarte mit aktuellem Quizstand neu aufbauen
      if (c.type === "ende") {
        const body = sections[i].querySelector(".reel-body");
        body.innerHTML = bodyHtml(c, i, cards.length, ctx);
        if (window.Terms) window.Terms.annotate(body);
      }
    }

    // Einblenden + sanftes Zurücktreten der Nachbarkarten
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        e.target.style.setProperty("--vis", Math.round(e.intersectionRatio * 20) / 20);
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          e.target.classList.add("in-view");
          setCurrent(+e.target.dataset.i);
        }
      });
    }, { root: scroller, threshold: Array.from({ length: 21 }, (_, k) => k / 20) });
    sections.forEach(s => io.observe(s));

    requestAnimationFrame(() => {
      sections[start].scrollIntoView({ block: "start" });
      sections[start].classList.add("in-view");
      sections[start].style.setProperty("--vis", 1);
      setCurrent(start);
    });

    function go(delta) {
      const n = Math.max(0, Math.min(sections.length - 1, current + delta));
      sections[n].scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    }

    function onKey(e) {
      if (!sheet.hidden) { if (e.key === "Escape") closeSheet(); return; }
      if (["ArrowDown", "PageDown", "j"].includes(e.key) || (e.key === " " && !e.shiftKey)) { e.preventDefault(); go(1); }
      else if (["ArrowUp", "PageUp", "k"].includes(e.key) || (e.key === " " && e.shiftKey)) { e.preventDefault(); go(-1); }
      else if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);

    scroller.addEventListener("click", e => {
      const sec = e.target.closest(".reel"); if (!sec) return;
      const c = cards[+sec.dataset.i];
      const choice = e.target.closest(".reel-choice");
      if (choice && !choice.disabled) {
        const ai = +choice.dataset.ai;
        ctx.answers[qkey(c)] = ai; store.set("feedAnswers", ctx.answers);
        if (window.Lernen) window.Lernen.recordQuiz(c.kurs.id, c.lesson.id, c.qi, ai === c.q.richtig);
        sec.querySelectorAll(".reel-choice").forEach((b, bi) => {
          b.disabled = true;
          b.classList.add(bi === c.q.richtig ? "right" : bi === ai ? "wrong" : "dim");
        });
        const fb = sec.querySelector(".reel-feedback");
        fb.innerHTML = feedbackHtml(c, ai); fb.hidden = false;
        fb.classList.add(ai === c.q.richtig ? "ok" : "bad");
        sec.classList.add(ai === c.q.richtig ? "pop-ok" : "pop-bad");
        return;
      }
      const btn = e.target.closest("[data-act]");
      const act = btn?.dataset.act;
      if (act === "save") {
        const list = store.get("saved", []);
        const id = cardId(c);
        const idx = list.findIndex(s => s.id === id);
        if (idx >= 0) list.splice(idx, 1);
        else {
          // nur der Verweis – der Inhalt wird beim Öffnen aus den Lektionsdaten erzeugt
          list.push({ id, kurs: c.kurs.id, lektion: c.lesson.id, type: c.type, ...(c.qi != null ? { qi: c.qi } : {}) });
        }
        store.set("saved", list);
        if (window.Notes) {
          if (idx >= 0) window.Notes.removeRef(id);
          else {
            const body = c.type === "bild" ? `${c.heading}: ${(c.bild && (c.bild.text || c.bild.alt)) || "Grafik"}`
              : textOf(cardText(c).split("\n").slice(1).join("\n")) || c.heading;
            window.Notes.add(c.kurs.id, c.lesson.id, { text: body, quelle: `Reels · ${c.type === "quiz" ? "Quizfrage" : c.heading}`, ref: id });
          }
        }
        btn.classList.toggle("on", idx < 0);
        btn.setAttribute("aria-pressed", idx < 0);
        btn.querySelector(".ico").textContent = idx < 0 ? "★" : "☆";
      } else if (act === "ask") {
        openSheet(c);
      } else if (act === "open" || act === "next") {
        close();
      } else if (act === "done") {
        if (!opts.isDone(c.kurs.id, c.lesson.id)) opts.markDone(c.kurs.id, c.lesson.id);
        btn.textContent = "✓ Abgeschlossen";
        if (opts.mode === "feed") go(1);
      }
    });

    // Tutor-Bottom-Sheet
    let sheetCard = null;
    const cardText = c => c.type === "quiz"
      ? `Quizfrage: ${c.q.frage}\nAntworten: ${c.q.antworten.join(" / ")}\nRichtig: ${c.q.antworten[c.q.richtig]}\nErklärung: ${c.q.erklaerung || ""}`
      : `${c.heading}\n${textOf([c.lead, c.html, (c.items || []).map(t => typeof t === "string" ? t : `${t.term}: ${t.rest}`).join("\n"),
          (c.rows || []).map(r => r.join(" | ")).join("\n"), (c.steps || []).join(" → ")].filter(Boolean).join("\n"))}`;
    function openSheet(c) {
      sheetCard = c; sheet.hidden = false;
      wrap.querySelector("#reelAskCtx").textContent = c.type === "quiz" ? c.q.frage : c.heading;
      wrap.querySelector("#reelAskOut").hidden = true;
      setTimeout(() => wrap.querySelector("#reelAsk").focus(), 60);
    }
    function closeSheet() { sheet.hidden = true; }
    wrap.querySelector(".sheet-x").onclick = closeSheet;
    sheet.addEventListener("click", e => { if (e.target === sheet) closeSheet(); });
    const askNow = () => {
      const q = wrap.querySelector("#reelAsk").value.trim();
      if (!q || !sheetCard) return;
      window.Tutor.ask(sheetCard.lesson.titel, cardText(sheetCard), q, wrap.querySelector("#reelAskOut"), wrap.querySelector("#reelAskBtn"));
    };
    wrap.querySelector("#reelAskBtn").onclick = askNow;
    wrap.querySelector("#reelAsk").onkeydown = e => { if (e.key === "Enter") askNow(); };

    function close() {
      io.disconnect();
      document.removeEventListener("keydown", onKey);
      openFeed = null;
      const done = () => {
        wrap.remove();
        document.documentElement.classList.remove("reels-open");
        if (opts.onClose) opts.onClose();
      };
      if (reduceMotion()) done();
      else { wrap.classList.add("closing"); setTimeout(done, 220); }
    }
    wrap.querySelector(".reels-close").onclick = close;
    openFeed = { close };
    setTimeout(() => scroller.focus({ preventScroll: true }), 100);
    return openFeed;
  }

  window.addEventListener("hashchange", () => { if (openFeed) openFeed.close(); });

  function openLesson(kurs, lesson, opts) {
    return open(lessonCards(kurs, lesson), { ...opts, mode: "lektion", title: lesson.titel, progressKey: `reel:${kurs.id}/${lesson.id}` });
  }

  function openAll(kurse, filter, opts) {
    let cards = [];
    if (filter === "gemerkt") {
      store.get("saved", []).forEach(s => {
        if (!s || typeof s !== "object") return;
        const kurs = kurse.find(k => k.id === s.kurs); const lesson = kurs?.lektionen.find(l => l.id === s.lektion);
        if (!kurs || !lesson) return;
        // Sicherheit: gespeicherte Inhalte (Sync/Backup) nie als HTML rendern – die Karte wird
        // über ihre ID aus den Lektionsdaten neu erzeugt.
        const c = lessonCards(kurs, lesson).find(x => cardId(x) === s.id);
        if (c) cards.push({ ...c, first: false });
      });
      if (!cards.length) return null;
    } else {
      kurse.filter(k => filter === "alle" || k.id === filter).forEach(k => k.lektionen.forEach(l => { cards = cards.concat(lessonCards(k, l)); }));
    }
    const title = filter === "gemerkt" ? "Gemerkte Karten" : filter === "alle" ? "Lern-Feed" : kurse.find(k => k.id === filter).titel;
    return open(cards, { ...opts, mode: "feed", title, progressKey: `reelfeed:${filter}` });
  }

  window.Feed = { lessonCards, openLesson, openAll, savedCount: () => store.get("saved", []).length };
})();
