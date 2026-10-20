/*
 * Veye Film School – Single-Page-App mit Hash-Routing.
 * Routen: #/  #/kurs/:id  #/lektion/:kurs/:lektion  #/videos  #/labor  #/glossar
 */
(function () {
  const app = document.getElementById("app");
  const KURSE = window.KURSE || [];

  /* ---------------- Speicher (localStorage, fehlertolerant) ---------------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("veye:" + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("veye:" + key, JSON.stringify(value)); } catch { /* privat-Modus */ }
    }
  };

  const done = () => store.get("done", {});
  const isDone = (k, l) => !!done()[k + "/" + l];
  function toggleDone(k, l) {
    const d = done(); const key = k + "/" + l;
    if (d[key]) delete d[key]; else d[key] = true;
    store.set("done", d);
  }
  function progress(kurs) {
    const n = kurs.lektionen.filter(l => isDone(kurs.id, l.id)).length;
    return { n, total: kurs.lektionen.length, pct: Math.round((n / kurs.lektionen.length) * 100) };
  }

  /* ---------------- Videos ---------------- */
  const userVideos = () => store.get("videos", []);
  const allVideos = () => [
    ...(window.VIDEOS || []).map((v, i) => ({ ...v, _src: "datei", _i: i })),
    ...userVideos().map((v, i) => ({ ...v, _src: "browser", _i: i }))
  ];

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function parseVideo(url) {
    url = String(url || "").trim();
    let m;
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/))) {
      return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${m[1]}`, vertical: url.includes("/shorts/") };
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return { type: "iframe", src: `https://player.vimeo.com/video/${m[1]}` };
    }
    if ((m = url.match(/instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/))) {
      const kind = m[1] === "reels" ? "reel" : m[1];
      return { type: "iframe", src: `https://www.instagram.com/${kind}/${m[2]}/embed`, vertical: true };
    }
    if (/\.(mp4|mov|webm|m4v)(\?.*)?$/i.test(url)) return { type: "video", src: url };
    return { type: "link", src: url };
  }

  function videoHtml(v) {
    const p = parseVideo(v.url);
    const vertical = v.hochkant || p.vertical ? " vertical" : "";
    // In der veröffentlichten Webversion sind eingebettete Fremdplayer gesperrt → Link-Button.
    if (p.type === "iframe" && window.VEYE_LINK_VIDEOS) {
      const host = /youtu/.test(v.url) ? "YouTube" : /vimeo/.test(v.url) ? "Vimeo" : /instagram/.test(v.url) ? "Instagram" : "Web";
      return `<a class="btn primary video-link" href="${esc(v.url)}" target="_blank" rel="noopener">▶ Auf ${host} ansehen</a>`;
    }
    if (p.type === "iframe") {
      return `<div class="video-embed${vertical}"><iframe src="${esc(p.src)}" loading="lazy" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`;
    }
    if (p.type === "video") {
      return `<div class="video-embed${vertical}"><video src="${esc(p.src)}" controls preload="metadata"></video></div>`;
    }
    return `<p><a href="${esc(p.src)}" target="_blank" rel="noopener">▶ Video öffnen</a></p>`;
  }

  function videoCard(v, opts = {}) {
    const lektion = findLektion(v.kurs, v.lektion);
    return `<div class="video-card">
      <h3>${esc(v.titel || "Ohne Titel")}</h3>
      ${opts.showLesson && lektion ? `<div class="muted" style="font-size:13px">→ <a href="#/lektion/${esc(v.kurs)}/${esc(v.lektion)}">${esc(lektion.titel)}</a></div>` : ""}
      ${videoHtml(v)}
      ${v.notizen ? `<div class="notes">${esc(v.notizen)}</div>` : ""}
      ${opts.editable && v._src === "browser" ? `<button class="btn small danger" data-del="${v._i}" style="margin-top:8px">Entfernen</button>` : ""}
      ${opts.editable && v._src === "datei" ? `<div class="muted" style="font-size:12px;margin-top:8px">aus data/videos.js</div>` : ""}
    </div>`;
  }

  /* ---------------- Helfer ---------------- */
  const CREATORS = window.CREATORS || [];
  const findKurs = id => KURSE.find(k => k.id === id);
  const findLektion = (k, l) => findKurs(k)?.lektionen.find(x => x.id === l);
  const levelTag = lv => `<span class="tag ${lv}">${{ basis: "Basis", vertiefung: "Vertiefung", praxis: "Praxis" }[lv] || lv}</span>`;

  function creatorCard(c) {
    const links = c.lektionen.map(ref => {
      const [k, l] = ref.split("/"); const lek = findLektion(k, l);
      return lek ? `<li><a href="#/lektion/${k}/${l}">${esc(lek.titel)}</a></li>` : "";
    }).join("");
    return `<div class="card mentor">
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.fokus)}</p>
      <ul>${links}</ul>
      <a class="btn small" href="${esc(c.url)}" target="_blank" rel="noopener">▶ YouTube-Kanal</a>
    </div>`;
  }

  /* ---------------- Seiten ---------------- */
  function home() {
    const total = KURSE.reduce((a, k) => a + k.lektionen.length, 0);
    const fertig = KURSE.reduce((a, k) => a + progress(k).n, 0);
    const vids = allVideos();
    return `
      <section class="hero">
        <h1>Lerne Film wie an der Filmhochschule.</h1>
        <p class="lead">Bildsprache, Kamera, Licht und Schnitt – Color Grading von den Scopes bis zum eigenen Look – und alles angewendet auf Instagram-Reels in der Edits-App.</p>
        <div class="progress" style="max-width:420px"><div style="width:${total ? (fertig / total) * 100 : 0}%"></div></div>
        <div class="progress-label">${fertig} von ${total} Lektionen abgeschlossen</div>
      </section>

      <h2>Kurse</h2>
      <div class="grid">
        ${KURSE.map(k => { const p = progress(k); return `
          <a class="card" href="#/kurs/${k.id}">
            <div class="icon">${k.icon}</div>
            <h3>${esc(k.titel)}</h3>
            <p>${esc(k.beschreibung)}</p>
            <div class="progress"><div style="width:${p.pct}%"></div></div>
            <div class="progress-label">${p.n}/${p.total} Lektionen</div>
          </a>`; }).join("")}
      </div>

      ${CREATORS.length ? `
      <h2>Deine Mentoren</h2>
      <p class="muted">An den Videos dieser Creator orientieren sich die Lektionen.</p>
      <div class="grid">${CREATORS.map(creatorCard).join("")}</div>` : ""}

      <h2>Werkzeuge</h2>
      <div class="grid">
        <a class="card" href="#/labor"><div class="icon">🎛️</div><h3>Grading-Labor</h3><p>Eigenes Bild oder Video laden, Lift/Gamma/Gain bewegen und live Waveform, Parade & Vectorscope lesen.</p></a>
        <a class="card" href="#/videos"><div class="icon">🎞️</div><h3>Meine Videos</h3><p>${vids.length ? vids.length + " Video(s) in deiner Bibliothek." : "Füge deine Lernvideos hinzu und ordne sie Lektionen zu."}</p></a>
        <a class="card" href="#/feed"><div class="icon">📲</div><h3>Lern-Feed</h3><p>Alle Lektionen als Reels – wischen, lernen, Quizkarten beantworten.</p></a>
        <a class="card" href="#/training"><div class="icon">🧠</div><h3>Training</h3><p>Gemischte Quizfragen aus allen Lektionen – zum Wiederholen.</p></a>
        <a class="card" href="#/glossar"><div class="icon">📖</div><h3>Glossar</h3><p>${(window.GLOSSAR || []).length} Fachbegriffe von ACES bis Whip Pan.</p></a>
      </div>

      <h2>Empfohlener Lernpfad</h2>
      <ol>
        <li><strong>Woche 1–2:</strong> Filmstudium-Basics (Einstellungsgrößen, Kamera, Licht) – jede Übung praktisch umsetzen.</li>
        <li><strong>Woche 3:</strong> Color Grading Basis (Korrektur vs. Grading, Scopes, Primaries) + Grading-Labor.</li>
        <li><strong>Woche 4:</strong> Instagram Edits: Setup, Hook, Beat-Sync – erstes Reel veröffentlichen.</li>
        <li><strong>Woche 5–6:</strong> Vertiefung: Commercial-Licht & False Color (Wandering DP), Schnitttheorie, Log/LUTs, Secondaries, Looks.</li>
        <li><strong>Danach:</strong> Kinetic Editing & Sounddesign (Paddy Cartwright), Effekte, Export, eigene Looks – und jede Woche ein Reel als Übung.</li>
      </ol>`;
  }

  function kursPage(id) {
    const k = findKurs(id);
    if (!k) return notFound();
    const p = progress(k);
    return `
      <div class="breadcrumb"><a href="#/">Start</a> / ${esc(k.titel)}</div>
      <h1>${k.icon} ${esc(k.titel)}</h1>
      <p class="lead">${esc(k.beschreibung)}</p>
      <div class="progress" style="max-width:420px"><div style="width:${p.pct}%"></div></div>
      <div class="progress-label" style="margin-bottom:24px">${p.n}/${p.total} abgeschlossen</div>
      <ul class="lesson-list">
        ${k.lektionen.map((l, i) => `
          <li class="${isDone(k.id, l.id) ? "done" : ""}">
            <a href="#/lektion/${k.id}/${l.id}">
              <span class="num">${isDone(k.id, l.id) ? "✓" : i + 1}</span>
              <span class="title">${esc(l.titel)}</span>
              ${levelTag(l.level)}
            </a>
          </li>`).join("")}
      </ul>`;
  }

  function lektionPage(kid, lid) {
    const k = findKurs(kid), l = findLektion(kid, lid);
    if (!k || !l) return notFound();
    const idx = k.lektionen.indexOf(l);
    const prev = k.lektionen[idx - 1], next = k.lektionen[idx + 1];
    const vids = allVideos().filter(v => v.kurs === kid && v.lektion === lid);
    const erledigt = isDone(kid, lid);

    return `
      <article class="lesson">
        <div class="breadcrumb"><a href="#/">Start</a> / <a href="#/kurs/${k.id}">${esc(k.titel)}</a> / Lektion ${idx + 1}</div>
        ${levelTag(l.level)}
        <h1>${esc(l.titel)}</h1>
        ${(l.mentor || []).map(id => CREATORS.find(c => c.id === id)).filter(Boolean).map(c => `
          <div class="box mentor-box"><h4>Orientiert an</h4><strong>${esc(c.name)}</strong> – ${esc(c.fokus)}
          <a href="${esc(c.url)}" target="_blank" rel="noopener">Zum Kanal →</a></div>`).join("")}

        <button class="reels-cta" id="reelsBtn">
          <span class="play">▶</span>
          <span><strong>Als Reels lernen</strong><small>${window.Feed.lessonCards(k, l).length} Karten · wischen wie bei Instagram</small></span>
        </button>

        <div class="mode-tabs" role="tablist">
          <button class="mode-tab" data-mode="schritte" role="tab">Schritt für Schritt</button>
          <button class="mode-tab" data-mode="tutor" role="tab" hidden>KI-Tutor</button>
          <button class="mode-tab" data-mode="lesen" role="tab">Ganze Lektion</button>
        </div>
        <div id="modeRoot"></div>

        <h2>Deine Videos zu dieser Lektion</h2>
        ${vids.length
          ? `<div class="grid">${vids.map(v => videoCard(v)).join("")}</div>`
          : `<p class="muted">Noch keine Videos zugeordnet. <a href="#/videos?kurs=${k.id}&lektion=${l.id}">Video hinzufügen →</a></p>`}

        ${l.quellen?.length ? `
          <h2>Quellen & weiterführend</h2>
          <ul class="sources">${l.quellen.map(q => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)}</a></li>`).join("")}</ul>` : ""}

        <div style="margin-top:32px">
          <button class="btn ${erledigt ? "" : "primary"}" id="doneBtn">${erledigt ? "✓ Abgeschlossen – rückgängig" : "Lektion abschließen"}</button>
        </div>

        <div class="lesson-nav">
          ${prev ? `<a class="btn" href="#/lektion/${k.id}/${prev.id}">← ${esc(prev.titel)}</a>` : "<span></span>"}
          ${next ? `<a class="btn" href="#/lektion/${k.id}/${next.id}">${esc(next.titel)} →</a>` : `<a class="btn" href="#/kurs/${k.id}">Zur Kursübersicht</a>`}
        </div>
      </article>`;
  }

  // Lernmodi einer Lektion: Schritt für Schritt / KI-Tutor / ganze Lektion lesen
  function bindLessonModes(k, l) {
    const root = document.getElementById("modeRoot");
    const tabs = document.querySelectorAll(".mode-tab");
    const tutorTab = document.querySelector('[data-mode="tutor"]');
    const vids = allVideos().filter(v => v.kurs === k.id && v.lektion === l.id);
    const markDone = () => { if (!isDone(k.id, l.id)) toggleDone(k.id, l.id); route(); };

    function show(mode) {
      if (mode === "tutor" && !window.Tutor.aiAvailable()) mode = "schritte";
      store.set("mode", mode);
      tabs.forEach(t => { t.classList.toggle("active", t.dataset.mode === mode); t.setAttribute("aria-selected", t.dataset.mode === mode); });
      if (mode === "lesen") {
        root.innerHTML = `${window.injectGrafiken ? window.injectGrafiken(k.id, l, l.inhalt) : l.inhalt}
          ${l.aufgabe ? `<div class="box task"><h4>Praxis-Übung</h4>${esc(l.aufgabe)}</div>` : ""}
          ${l.quiz?.length ? quizHtml(l.quiz) : ""}`;
        bindQuiz(l.quiz || []);
        enhanceTables(root);
      } else if (mode === "tutor") {
        window.Tutor.tutorMode(root, k, l, vids);
      } else {
        window.Tutor.stepMode(root, k, l, { markDone, switchMode: show });
      }
    }
    tabs.forEach(t => t.onclick = () => show(t.dataset.mode));
    const idx = k.lektionen.indexOf(l);
    document.getElementById("reelsBtn").onclick = () => window.Feed.openLesson(k, l, {
      isDone, nextLesson: k.lektionen[idx + 1],
      markDone: (kid, lid) => { if (!isDone(kid, lid)) toggleDone(kid, lid); },
      onClose: () => route()
    });
    show(store.get("mode", "schritte"));
    window.Tutor.aiReady.then(() => {
      if (!window.Tutor.aiAvailable() || !document.body.contains(tutorTab)) return;
      tutorTab.hidden = false;
      if (store.get("mode", "schritte") === "tutor") show("tutor");
    });
  }

  function quizHtml(quiz) {
    return `
      <div class="quiz" id="quiz">
        <h2 style="margin-top:0">Quiz</h2>
        ${quiz.map((q, qi) => `
          <div class="q" data-q="${qi}">
            <p>${qi + 1}. ${esc(q.frage)}</p>
            ${q.antworten.map((a, ai) => `<label><input type="radio" name="q${qi}" value="${ai}">${esc(a)}</label>`).join("")}
            <div class="explain" hidden></div>
          </div>`).join("")}
        <button class="btn primary" id="quizCheck">Auswerten</button>
        <span id="quizResult" style="margin-left:12px"></span>
      </div>`;
  }

  function bindQuiz(quiz) {
    const btn = document.getElementById("quizCheck");
    if (!btn) return;
    btn.onclick = () => {
      let score = 0;
      quiz.forEach((q, qi) => {
        const box = document.querySelector(`[data-q="${qi}"]`);
        const sel = box.querySelector("input:checked");
        box.querySelectorAll("label").forEach((lab, ai) => {
          lab.classList.remove("right", "wrong");
          if (ai === q.richtig) lab.classList.add("right");
          else if (sel && +sel.value === ai) lab.classList.add("wrong");
        });
        if (sel && +sel.value === q.richtig) score++;
        const ex = box.querySelector(".explain");
        ex.hidden = false; ex.textContent = q.erklaerung || "";
      });
      document.getElementById("quizResult").textContent = `${score} / ${quiz.length} richtig`;
    };
  }

  function videosPage(query) {
    const vids = allVideos();
    const optionen = KURSE.map(k => `<optgroup label="${esc(k.titel)}">${k.lektionen.map(l =>
      `<option value="${k.id}/${l.id}" ${query.kurs === k.id && query.lektion === l.id ? "selected" : ""}>${esc(l.titel)}</option>`).join("")}</optgroup>`).join("");

    return `
      <h1>Meine Videos</h1>
      <p class="lead">Füge Videos hinzu, die dir zur Verfügung stehen – YouTube, Vimeo, Instagram-Reels oder lokale Dateien im Ordner <code>videos/</code> – und ordne sie einer Lektion zu. Sie erscheinen dann direkt in der Lektion.</p>

      <form class="stack" id="videoForm">
        <label>Titel <input type="text" name="titel" required placeholder="z. B. Teal & Orange in 5 Minuten"></label>
        <label>Link oder Dateipfad <input type="text" name="url" required placeholder="https://youtube.com/watch?v=…  oder  videos/clip.mp4"></label>
        <label>Lektion <select name="ziel">${optionen}</select></label>
        <label>Notizen <textarea name="notizen" placeholder="Was lernst du aus dem Video? Zeitstempel?"></textarea></label>
        <label style="display:flex;gap:8px;align-items:center;color:var(--text)"><input type="checkbox" name="hochkant"> Hochformat (9:16)</label>
        <div><button class="btn primary">Video hinzufügen</button></div>
      </form>

      ${CREATORS.length ? `<h2>Kanäle</h2><div class="grid">${CREATORS.map(creatorCard).join("")}</div>` : ""}

      <h2>Bibliothek (${vids.length})</h2>
      ${vids.length ? `<div class="grid">${vids.map(v => videoCard(v, { showLesson: true, editable: true })).join("")}</div>`
                    : `<p class="muted">Noch leer.</p>`}

      <h2>Dauerhaft speichern</h2>
      <p class="muted">Videos, die du hier hinzufügst, liegen nur in diesem Browser. Damit sie dauerhaft und auf allen Geräten in der Plattform sind, exportiere sie und füge den Code in <code>data/videos.js</code> ein (oder schick mir die Links – dann trage ich sie ein und schreibe passende Zusammenfassungen in die Lektionen).</p>
      <button class="btn" id="exportBtn">Als Code für data/videos.js exportieren</button>
      <pre id="exportOut" hidden></pre>`;
  }

  function bindVideos() {
    const form = document.getElementById("videoForm");
    form.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(form);
      const [kurs, lektion] = String(f.get("ziel")).split("/");
      const list = userVideos();
      list.push({
        titel: f.get("titel").trim(), url: f.get("url").trim(), kurs, lektion,
        notizen: f.get("notizen").trim(), hochkant: !!f.get("hochkant")
      });
      store.set("videos", list);
      route();
    };
    document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      // Zwei Klicks statt confirm(), das in eingebetteten Ansichten blockiert sein kann
      if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = "Wirklich entfernen? Nochmal tippen"; return; }
      const list = userVideos(); list.splice(+b.dataset.del, 1); store.set("videos", list); route();
    });
    document.getElementById("exportBtn").onclick = () => {
      const out = document.getElementById("exportOut");
      const clean = userVideos().map(({ titel, url, kurs, lektion, notizen, hochkant }) =>
        ({ titel, url, kurs, lektion, ...(notizen ? { notizen } : {}), ...(hochkant ? { hochkant } : {}) }));
      out.textContent = clean.map(v => "  " + JSON.stringify(v, null, 2).replace(/\n/g, "\n  ")).join(",\n") + (clean.length ? "," : "// keine Browser-Videos vorhanden");
      out.hidden = false;
    };
  }

  function laborPage() {
    return `
      <h1>🎛️ Grading-Labor</h1>
      <p class="lead">Lade ein Standbild oder einen Clip und grade ihn live. Beobachte dabei die Scopes – genau so arbeiten Coloristen. Doppelklick auf einen Regler setzt ihn zurück.</p>
      <div id="laborRoot"></div>
      <div class="box tip"><h4>Übungen</h4>
        1) Testbild: Bringe die Graustufen-Rampe in der Parade auf deckungsgleiche Kanäle, nachdem du die Temperatur verstellt hast.<br>
        2) Wähle „Teal & Orange“ und beobachte im Vectorscope, wie sich die Wolke Richtung Hautton-Linie und Cyan aufteilt.<br>
        3) Setze „Vorher-Anteil“ auf 0,5 für einen direkten Vorher/Nachher-Vergleich.
      </div>
      <p class="muted" style="font-size:13px">Dein Material wird nur lokal im Browser verarbeitet und nirgends hochgeladen.</p>`;
  }

  function feedPage() {
    const saved = window.Feed.savedCount();
    const chips = [["alle", "Alle Kurse"], ...KURSE.map(k => [k.id, k.icon + " " + k.titel]), ["gemerkt", `★ Gemerkt (${saved})`]];
    return `
      <section class="feed-hero">
        <div class="phone-mock" aria-hidden="true">
          <div class="pm-card pm-1"><span>Licht</span><b>Key · Fill · Back</b></div>
          <div class="pm-card pm-2"><span>Kurzer Check</span><b>1/50 s bei 25 fps?</b></div>
          <div class="pm-card pm-3"><span>Color</span><b>Lift · Gamma · Gain</b></div>
        </div>
        <div class="feed-copy">
          <h1>Lern-Feed</h1>
          <p class="lead">Alle Lektionen als Reels: eine Idee pro Karte, Quizkarten dazwischen. Wisch nach oben für die nächste Karte, merk dir Karten mit ☆ und frag den Tutor mit „?“.</p>
          <div class="tabs" id="feedChips">${chips.map(([id, t], i) => `<button class="btn small ${i === 0 ? "active" : ""}" data-feed="${id}">${esc(t)}</button>`).join("")}</div>
          <button class="btn primary big" id="feedStart">▶ Feed starten</button>
          <p class="muted" id="feedNote" style="font-size:13px">Der Feed merkt sich, wo du aufgehört hast.</p>
        </div>
      </section>`;
  }

  function bindFeed() {
    let filter = "alle";
    document.querySelectorAll("[data-feed]").forEach(b => b.onclick = () => {
      filter = b.dataset.feed;
      document.querySelectorAll("[data-feed]").forEach(x => x.classList.toggle("active", x === b));
    });
    document.getElementById("feedStart").onclick = () => {
      const f = window.Feed.openAll(KURSE, filter, {
        isDone, markDone: (kid, lid) => { if (!isDone(kid, lid)) toggleDone(kid, lid); }, onClose: () => route()
      });
      if (!f) document.getElementById("feedNote").textContent = "Noch keine Karten gemerkt. Tippe im Feed auf ☆ Merken.";
    };
  }

  function trainingPage() {
    return `
      <h1>🧠 Training</h1>
      <p class="lead">10 zufällige Fragen aus allen Lektionen. Ideal zum Wiederholen – jeden Tag eine Runde.</p>
      <div id="trainRoot"></div>`;
  }

  function glossarPage() {
    const g = window.GLOSSAR || [];
    return `
      <div class="glossar">
        <h1>📖 Glossar</h1>
        <input type="text" id="gSearch" placeholder="Begriff suchen …">
        <div class="grid" id="gList">
          ${g.map(([t, d]) => `<div class="entry" data-t="${esc((t + " " + d).toLowerCase())}"><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("")}
        </div>
      </div>`;
  }

  function notFound() {
    return `<h1>Nicht gefunden</h1><p><a href="#/">Zur Startseite</a></p>`;
  }

  // Tabellen: Spaltenköpfe als data-label für die Handy-Ansicht (Zeilenkarten)
  function enhanceTables(root) {
    root.querySelectorAll("table").forEach(t => {
      if (t.parentElement.classList.contains("table-wrap")) return;
      const heads = Array.from(t.querySelectorAll("tr:first-child th")).map(th => th.textContent.trim());
      t.querySelectorAll("tr").forEach(tr => Array.from(tr.children).forEach((td, i) => {
        if (td.tagName === "TD" && heads[i]) td.setAttribute("data-label", heads[i]);
      }));
      const w = document.createElement("div"); w.className = "table-wrap";
      t.replaceWith(w); w.appendChild(t);
    });
  }
  window.enhanceTables = enhanceTables;

  /* ---------------- Router ---------------- */
  function route() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = hash.split("?");
    const query = Object.fromEntries(new URLSearchParams(qs || ""));
    const parts = path.split("/").filter(Boolean);

    let html, after = null;
    if (!parts.length) html = home();
    else if (parts[0] === "kurs") html = kursPage(parts[1]);
    else if (parts[0] === "lektion") {
      html = lektionPage(parts[1], parts[2]);
      after = () => {
        const l = findLektion(parts[1], parts[2]);
        if (!l) return;
        bindLessonModes(findKurs(parts[1]), l);
        document.getElementById("doneBtn").onclick = () => { toggleDone(parts[1], parts[2]); route(); };
      };
    }
    else if (parts[0] === "videos") { html = videosPage(query); after = bindVideos; }
    else if (parts[0] === "labor") { html = laborPage(); after = () => window.Labor.mount(document.getElementById("laborRoot")); }
    else if (parts[0] === "feed") { html = feedPage(); after = bindFeed; }
    else if (parts[0] === "training") { html = trainingPage(); after = () => window.Tutor.training(document.getElementById("trainRoot"), KURSE, isDone); }
    else if (parts[0] === "glossar") {
      html = glossarPage();
      after = () => {
        document.getElementById("gSearch").oninput = e => {
          const q = e.target.value.toLowerCase();
          document.querySelectorAll("#gList .entry").forEach(el => el.hidden = !el.dataset.t.includes(q));
        };
      };
    }
    else html = notFound();

    app.innerHTML = html;
    if (after) after();
    enhanceTables(app);

    // aktiven Menüpunkt markieren
    document.querySelectorAll("#nav a").forEach(a => {
      const target = a.getAttribute("href").replace(/^#/, "");
      a.classList.toggle("active", target === "/" ? path === "/" || path === "" : path.startsWith(target) ||
        (parts[0] === "lektion" && target === "/kurs/" + parts[1]));
    });
    document.getElementById("nav").classList.remove("open");
  }

  document.getElementById("menuBtn").onclick = () => document.getElementById("nav").classList.toggle("open");

  let lastPath = null;
  window.addEventListener("hashchange", () => {
    const p = location.hash.split("?")[0];
    route();
    if (p !== lastPath) window.scrollTo(0, 0);
    lastPath = p;
  });
  route();
})();
