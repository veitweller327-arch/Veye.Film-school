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
    // Beim Abschließen schreibt der Assistent den Lernzettel ins Notizheft
    if (d[key] && window.Notes) window.Notes.ensureSummary(k, l);
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

  // Nur http(s) oder relative Pfade – verhindert javascript:/data:-Links aus Sync oder Backup.
  const isWebUrl = u => {
    u = String(u || "").trim().replace(/[\u0000-\u0020]/g, "");
    if (!u) return false;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return true; // relativer Pfad (z. B. videos/clip.mp4)
    try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; }
  };

  function parseVideo(url) {
    url = String(url || "").trim();
    if (!isWebUrl(url)) return { type: "invalid", src: "" };
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
    if (p.type === "invalid") return `<p class="muted">Ungültige Video-Adresse (nur http/https).</p>`;
    return `<p><a href="${esc(p.src)}" target="_blank" rel="noopener">▶ Video öffnen</a></p>`;
  }

  function videoCard(v, opts = {}) {
    const lektion = findLektion(v.kurs, v.lektion);
    return `<div class="video-card">
      <h3>${esc(v.titel || "Ohne Titel")}</h3>
      ${opts.showLesson && lektion ? `<div class="muted" style="font-size:13px">→ <a href="#/lektion/${esc(v.kurs)}/${esc(v.lektion)}">${esc(lektion.titel)}</a></div>` : ""}
      ${videoHtml(v)}
      ${v.notizen ? `<div class="notes">${esc(v.notizen)}</div>` : ""}
      ${opts.editable && v._src === "browser" ? `<button class="btn small danger" data-del="${+v._i}" style="margin-top:8px">Entfernen</button>` : ""}
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
    return `<div class="mentor">
      <span class="label">${esc(c.person)}</span>
      <h3>${esc(c.name)}</h3>
      <p>${esc(c.fokus)}</p>
      <ul>${links}</ul>
      <a class="btn small" href="${esc(c.url)}" target="_blank" rel="noopener">YouTube-Kanal ↗</a>
    </div>`;
  }

  /* ---------------- Seiten ---------------- */
  const pad2 = n => String(n).padStart(2, "0");
  const allLessons = () => KURSE.flatMap(k => k.lektionen.map(l => ({ k, l })));
  const nextLesson = () => allLessons().find(x => !isDone(x.k.id, x.l.id)) || null;

  function courseCard(k, i) {
    const p = progress(k);
    return `
      <a class="course k-${k.id}" href="#/kurs/${k.id}">
        <div class="course-frame"><span class="course-tc">${pad2(k.lektionen.length)} LEKTIONEN</span><span class="course-no">${pad2(i + 1)}</span></div>
        <div class="course-body">
          <h3>${esc(k.titel)}</h3>
          <p>${esc(k.beschreibung)}</p>
        </div>
        <div class="course-foot" style="display:block">
          <div class="progress"><div style="width:${p.pct}%"></div></div>
          <div class="progress-label">${pad2(p.n)} / ${pad2(p.total)} abgeschlossen</div>
        </div>
      </a>`;
  }

  function home() {
    const lessons = allLessons();
    const total = lessons.length;
    const fertig = lessons.filter(x => isDone(x.k.id, x.l.id)).length;
    const nx = nextLesson();
    const headAt = nx ? lessons.findIndex(x => x === nx || (x.k === nx.k && x.l === nx.l)) : total - 1;
    const grafiken = Object.values(window.GRAFIKEN || {}).reduce((a, l) => a + l.length, 0);
    const vids = allVideos();
    return `
      <section class="hero-cine bleed">
        <div class="hero-frame hero-bars">
          <div class="hero-light"></div>
          <div class="hero-inner">
            <div class="hero-meta rise"><span>${KURSE.length} Kurse</span><span>${total} Lektionen</span><span>${grafiken} Grafiken</span></div>
            <h1 class="rise">Lerne Film wie an der <em>Filmhochschule.</em></h1>
            <p class="lead rise">Bildsprache, Kamera, Licht und Schnitt. Color Grading von den Scopes bis zum eigenen Look. Und alles angewendet auf Reels in der Edits-App.</p>
            <div class="hero-cta rise">
              ${nx ? `<a class="btn primary big" href="#/lektion/${nx.k.id}/${nx.l.id}">▶ ${fertig ? "Weiterlernen" : "Erste Lektion starten"}</a>` : `<a class="btn primary big" href="#/training">Wiederholen im Training</a>`}
              <a class="btn big" href="#/feed">Lern-Feed öffnen</a>
            </div>
          </div>
        </div>
        <div class="timeline">
          <div class="tl-row"><span class="label">Dein Fortschritt</span><span class="label acc">${pad2(fertig)} / ${pad2(total)}</span></div>
          <div class="tl-track" role="img" aria-label="${fertig} von ${total} Lektionen abgeschlossen">
            ${lessons.map(x => `<i class="k-${x.k.id} ${isDone(x.k.id, x.l.id) ? "done" : ""}" title="${esc(x.l.titel)}"></i>`).join("")}
            <span class="tl-head" style="left:calc(${((headAt + 0.5) / total) * 100}% - 1px)"></span>
          </div>
          <div class="tl-legend">${KURSE.map(k => `<span style="--c:var(--${k.id === "film" ? "accent" : k.id === "color" ? "accent2" : "rose"})">${esc(k.titel)}</span>`).join("")}</div>
        </div>
      </section>

      ${window.Lernen ? window.Lernen.todayHtml(nx) : ""}
      ${installHint()}

      <div class="sec-head"><h2>Kurse</h2><span class="label">${KURSE.length} Kurse · ${total} Lektionen</span></div>
      <div class="course-grid">${KURSE.map(courseCard).join("")}</div>

      <div class="sec-head"><h2>Werkzeuge</h2><span class="label">Üben & nachschlagen</span></div>
      <div class="tools">
        <a class="tool" href="#/feed"><b>Lern-Feed</b><span>Alle Lektionen als Reels zum Wischen.</span></a>
        <a class="tool" href="#/training"><b>Wiederholen</b><span>Spaced Repetition: Karten kommen wieder, bevor du sie vergisst.</span></a>
        <a class="tool" href="#/labor"><b>Grading-Labor</b><span>Eigene Bilder graden, Scopes live lesen.</span></a>
        <a class="tool" href="#/labor?breakdown=1"><b>Breakdown</b><span>Filmbilder analysieren, dann auflösen lassen.</span></a>
        <a class="tool" href="#/videos"><b>Mediathek</b><span>${vids.length} Videos, Lektionen zugeordnet.</span></a>
        <a class="tool" href="#/glossar"><b>Glossar</b><span>${(window.GLOSSAR || []).length} Fachbegriffe von ACES bis Whip Pan.</span></a>
      </div>

      ${CREATORS.length ? `
      <div class="sec-head"><h2>Mentoren</h2><span class="label">Inhalte orientiert an</span></div>
      <div class="mentors">${CREATORS.map(creatorCard).join("")}</div>` : ""}

      <div class="sec-head"><h2>Lernpfad</h2><span class="label">Empfehlung · 6 Wochen +</span></div>
      <ol class="path">
        <li><span class="label">Woche 1–2</span><p>Filmstudium-Basics: Einstellungsgrößen, Kamera, Licht. Jede Übung praktisch umsetzen.</p></li>
        <li><span class="label">Woche 3</span><p>Color Grading Basis: Korrektur, Scopes, Primaries – dazu das Grading-Labor.</p></li>
        <li><span class="label">Woche 4</span><p>Edits: Setup, Hook, Beat-Sync. Erstes Reel veröffentlichen.</p></li>
        <li><span class="label">Woche 5–6</span><p>Vertiefung: Commercial-Licht, False Color, Schnitttheorie, Log, Looks.</p></li>
        <li><span class="label">Danach</span><p>Kinetic Editing, Sounddesign, Effekte – und jede Woche ein Reel.</p></li>
      </ol>`;
  }

  /* ---------------- Als App installieren (nur in der gehosteten Version mit Manifest) ---------------- */
  let installEvent = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installEvent = e; if (location.hash === "" || location.hash === "#/") route(); });
  const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  function installHint() {
    if (!document.querySelector('link[rel="manifest"]') || standalone() || store.get("installHidden", false)) return "";
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!installEvent && !ios) return "";
    return `<div class="install">
      <img src="icons/icon-192.png" alt="" width="48" height="48">
      <div><b>Veye als App</b><span>${ios ? "In Safari unten auf <strong>Teilen</strong> tippen, dann <strong>Zum Home-Bildschirm</strong>." : "Mit eigenem Icon, im Vollbild und auch offline."}</span></div>
      ${ios ? "" : `<button class="btn primary small" id="installBtn">Installieren</button>`}
      <button class="install-x" id="installX" aria-label="Hinweis ausblenden">✕</button>
    </div>`;
  }
  function bindInstall() {
    const b = document.getElementById("installBtn");
    if (b) b.onclick = async () => { if (!installEvent) return; installEvent.prompt(); await installEvent.userChoice.catch(() => null); installEvent = null; route(); };
    const x = document.getElementById("installX");
    if (x) x.onclick = () => { store.set("installHidden", true); route(); };
  }

  /* ---------------- Geräte & Backup ---------------- */
  function syncPage() {
    const i = window.Sync ? window.Sync.info() : { cloud: false };
    const app = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
    return `
      <header class="page-head"><span class="label">Geräte & Backup</span><h1>Überall weiterlernen</h1>
        <p class="lead">Notizen, Notizheft mit Skizzen und Fotos, Lernfortschritt, Wiederholungskarten und Praxis-Reflexionen – auf Computer und Handy gleich.</p></header>
      <div class="sync-grid">
        <section class="sync-card ${i.cloud ? "on" : ""}" id="syncCard">
          <span class="label acc">Automatisch · Claude-Konto</span>
          <h2 id="syncTitle">${i.cloud ? "Synchronisierung aktiv" : "Nicht verbunden"}</h2>
          <p id="syncText"></p>
          <div class="row-gap">${i.cloud ? `<button class="btn primary" id="syncNow">Jetzt synchronisieren</button>` : ""}</div>
          <ul class="sync-how">
            <li>Öffne die Veye-Webseite auf jedem Gerät über <b>denselben Link</b> und mit <b>demselben Claude-Konto</b>.</li>
            <li>Änderungen werden beim Öffnen, alle paar Sekunden und beim Wechsel der App abgeglichen.</li>
            <li>Hast du auf beiden Geräten gearbeitet, wird zusammengeführt – nichts wird überschrieben.</li>
            <li>Der Speicherbereich ist privat: Nur du siehst ihn, auch wenn du die Seite teilst.</li>
          </ul>
        </section>
        <section class="sync-card">
          <span class="label acc">Backup-Datei · z. B. iCloud Drive</span>
          <h2>Sichern & übertragen</h2>
          <p>Speichert alles in einer Datei – inklusive Bilder. Auf dem iPhone wählst du beim Speichern <b>„In Dateien sichern“ → iCloud Drive</b>. Auf dem anderen Gerät lädst du sie hier wieder; vorhandene Daten werden zusammengeführt.${app ? " Für die installierte App ist das der Weg, um Daten mit dem Computer zu teilen." : ""}</p>
          <div class="row-gap">
            <button class="btn primary" id="bkSave">Backup speichern</button>
            <label class="btn" for="bkFile">Backup laden<input type="file" id="bkFile" accept="application/json,.json" hidden></label>
          </div>
          <p class="muted" id="bkNote"></p>
        </section>
      </div>`;
  }
  function bindSync() {
    const upd = i => {
      const t = document.getElementById("syncText"); if (!t) return;
      const ago = i.lastSync ? Math.max(0, Math.round((Date.now() - i.lastSync) / 60000)) : null;
      t.textContent = !i.cloud ? (i.status === "nur lokal"
          ? "Diese Ansicht ist nicht mit einem Claude-Konto verbunden (z. B. installierte App oder lokale Datei). Nutze hier die Backup-Datei."
          : "Verbindung wird hergestellt …")
        : i.status === "läuft" ? "Gleiche ab …"
        : i.status === "fehler" ? "Der letzte Abgleich ist fehlgeschlagen. Er wird automatisch erneut versucht."
        : i.status === "voll" ? "Der Speicher ist voll – entferne ein paar große Bilder aus dem Notizheft."
        : `Zuletzt abgeglichen ${ago === 0 ? "gerade eben" : ago === 1 ? "vor 1 Minute" : `vor ${ago} Minuten`}.`;
      document.getElementById("syncTitle").textContent = i.cloud ? "Synchronisierung aktiv" : "Nicht verbunden";
      document.getElementById("syncCard").classList.toggle("on", !!i.cloud);
    };
    if (window.Sync) { upd(window.Sync.info()); const off = window.Sync.onChange(i => { if (!document.getElementById("syncText")) off(); else upd(i); }); }
    const now = document.getElementById("syncNow"); if (now) now.onclick = () => window.Sync.syncNow();
    const note = document.getElementById("bkNote");
    document.getElementById("bkSave").onclick = async () => {
      note.textContent = "Backup wird erstellt …";
      try { await window.Sync.exportBackup(); note.textContent = "Backup erstellt."; }
      catch (e) { note.textContent = e && e.code === "declined" ? "Speichern abgebrochen." : "Backup konnte nicht gespeichert werden."; }
    };
    document.getElementById("bkFile").onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try { const n = await window.Sync.importBackup(f); note.textContent = `Backup geladen (${n} Bereiche zusammengeführt).`; }
      catch (err) { note.textContent = err.message || "Datei konnte nicht gelesen werden."; }
      e.target.value = "";
    };
  }

  function kursePage() {
    return `
      <header class="page-head"><span class="label">Übersicht</span><h1>Kurse</h1>
        <p class="lead">Drei Kurse, aufgebaut wie ein erstes Jahr an der Filmhochschule – vom Bild über die Farbe bis zum fertigen Reel.</p></header>
      <div class="course-grid">${KURSE.map(courseCard).join("")}</div>`;
  }

  function kursPage(id) {
    const k = findKurs(id);
    if (!k) return notFound();
    const p = progress(k);
    const no = KURSE.indexOf(k) + 1;
    return `
      <section class="course-head bleed k-${k.id}">
        <div class="course-frame"></div>
        <div class="course-head-in">
          <div class="crumbs"><a href="#/">Start</a><span>/</span><a href="#/kurse">Kurse</a><span>/</span>Kurs ${pad2(no)}</div>
          <h1>${esc(k.titel)}</h1>
          <p class="lead">${esc(k.beschreibung)}</p>
          <div class="progress"><div style="width:${p.pct}%"></div></div>
          <div class="progress-label">${pad2(p.n)} / ${pad2(p.total)} Lektionen abgeschlossen</div>
        </div>
      </section>
      <div class="sec-head k-${k.id}"><h2>Lektionen</h2><span class="label">${pad2(k.lektionen.length)} Einträge</span></div>
      <ul class="edl k-${k.id}">
        ${k.lektionen.map((l, i) => `
          <li class="${isDone(k.id, l.id) ? "done" : ""}">
            <a href="#/lektion/${k.id}/${l.id}">
              <span class="edl-no">${pad2(i + 1)}</span>
              <span class="edl-title">${esc(l.titel)}<small>${(m => m === null ? "" : `${m} % sicher · `)(window.Lernen ? window.Lernen.mastery(k.id, l.id) : null)}${window.Feed.lessonCards(k, l).length} Karten · ${(l.quiz || []).length} Fragen${(window.GRAFIKEN || {})[k.id + "/" + l.id] ? ` · ${window.GRAFIKEN[k.id + "/" + l.id].length} Grafiken` : ""}</small></span>
              ${levelTag(l.level)}
              <span class="edl-state">✓</span>
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
      <article class="lesson k-${k.id}" data-notes-k="${k.id}" data-notes-l="${l.id}">
        <header class="lesson-head">
          <div class="crumbs"><a href="#/">Start</a><span>/</span><a href="#/kurs/${k.id}">${esc(k.titel)}</a><span>/</span>Lektion ${pad2(idx + 1)}</div>
          <h1>${esc(l.titel)}</h1>
          <div class="lesson-meta">${levelTag(l.level)}<span class="label">${window.Feed.lessonCards(k, l).length} Karten · ${(l.quiz || []).length} Fragen</span>${erledigt ? `<span class="label acc">✓ abgeschlossen</span>` : ""}
            ${(m => m === null ? "" : `<a class="mastery-pill" href="#/training?k=${k.id}&l=${l.id}" title="Sicherheit aus deinen Quizantworten – antippen zum Auffrischen"><i style="--m:${m}%"></i>${m} % sicher</a>`)(window.Lernen ? window.Lernen.mastery(k.id, l.id) : null)}</div>
          ${(l.mentor || []).map(id => CREATORS.find(c => c.id === id)).filter(Boolean).map(c => `
            <div class="mentor-line">Orientiert an <strong>${esc(c.name)}</strong> · <a href="${esc(c.url)}" target="_blank" rel="noopener">Kanal ansehen</a></div>`).join("")}
        </header>

        <div class="lesson-tools">
          <div class="mode-tabs" role="tablist">
            <button class="mode-tab" data-mode="schritte" role="tab">Schritt für Schritt</button>
            <button class="mode-tab" data-mode="tutor" role="tab" hidden>KI-Tutor</button>
            <button class="mode-tab" data-mode="lesen" role="tab">Ganze Lektion</button>
          </div>
          <button class="reels-cta" id="reelsBtn"><span class="play">▶</span><span><strong>Als Reels</strong><small>wischen</small></span></button>
        </div>
        <div id="modeRoot"></div>

        ${window.Praxis ? window.Praxis.section(k, l) : ""}

        <div class="sec-head"><h2>Videos</h2><span class="label">${vids.length ? pad2(vids.length) + " zugeordnet" : "Mediathek"}</span></div>
        ${vids.length
          ? `<div class="grid">${vids.map(v => videoCard(v)).join("")}</div>`
          : `<p class="muted">Noch keine Videos zugeordnet. <a href="#/videos?kurs=${k.id}&lektion=${l.id}">Video hinzufügen →</a></p>`}

        ${l.quellen?.length ? `
          <div class="sec-head"><h2>Quellen</h2><span class="label">${pad2(l.quellen.length)} Links</span></div>
          <ul class="sources">${l.quellen.map(q => `<li><a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.titel)}</a></li>`).join("")}</ul>` : ""}

        <div class="lesson-foot">
          <button class="btn ${erledigt ? "" : "primary"} big" id="doneBtn">${erledigt ? "✓ Abgeschlossen – rückgängig" : "Lektion abschließen"}</button>
          <div class="lesson-nav">
            ${prev ? `<a class="nav-card" href="#/lektion/${k.id}/${prev.id}"><span class="label">← Vorherige</span><b>${esc(prev.titel)}</b></a>` : "<span></span>"}
            ${next ? `<a class="nav-card next" href="#/lektion/${k.id}/${next.id}"><span class="label">Nächste →</span><b>${esc(next.titel)}</b></a>` : `<a class="nav-card next" href="#/kurs/${k.id}"><span class="label">Kurs beendet</span><b>Zur Kursübersicht</b></a>`}
          </div>
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
        bindQuiz(l.quiz || [], k, l);
        enhanceTables(root);
        if (window.Terms) window.Terms.annotate(root);
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

  function bindQuiz(quiz, k, l) {
    const btn = document.getElementById("quizCheck");
    if (!btn) return;
    btn.onclick = () => {
      let score = 0;
      quiz.forEach((q, qi) => {
        const box = document.querySelector(`[data-q="${qi}"]`);
        const sel = box.querySelector("input:checked");
        if (sel && k && l && window.Lernen) window.Lernen.recordQuiz(k.id, l.id, qi, +sel.value === q.richtig);
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
      <header class="page-head"><span class="label">Mediathek</span><h1>Videos</h1>
      <p class="lead">Füge Videos hinzu, die dir zur Verfügung stehen – YouTube, Vimeo, Instagram-Reels oder lokale Dateien im Ordner <code>videos/</code> – und ordne sie einer Lektion zu. Sie erscheinen dann direkt in der Lektion.</p></header>

      <form class="stack" id="videoForm">
        <label>Titel <input type="text" name="titel" required placeholder="z. B. Teal & Orange in 5 Minuten"></label>
        <label>Link oder Dateipfad <input type="text" name="url" required placeholder="https://youtube.com/watch?v=…  oder  videos/clip.mp4"></label>
        <label>Lektion <select name="ziel">${optionen}</select></label>
        <label>Notizen <textarea name="notizen" placeholder="Was lernst du aus dem Video? Zeitstempel?"></textarea></label>
        <label style="display:flex;gap:8px;align-items:center;color:var(--text)"><input type="checkbox" name="hochkant"> Hochformat (9:16)</label>
        <div><button class="btn primary">Video hinzufügen</button></div>
      </form>

      ${CREATORS.length ? `<div class="sec-head"><h2>Kanäle</h2><span class="label">Mentoren</span></div><div class="mentors">${CREATORS.map(creatorCard).join("")}</div>` : ""}

      <div class="sec-head"><h2>Bibliothek</h2><span class="label">${vids.length} Videos</span></div>
      ${vids.length ? `<div class="grid">${vids.map(v => videoCard(v, { showLesson: true, editable: true })).join("")}</div>`
                    : `<p class="muted">Noch leer.</p>`}

      <div class="sec-head"><h2>Dauerhaft speichern</h2></div>
      <p class="muted">Videos, die du hier hinzufügst, liegen nur in diesem Browser. Damit sie dauerhaft und auf allen Geräten in der Plattform sind, exportiere sie und füge den Code in <code>data/videos.js</code> ein (oder schick mir die Links – dann trage ich sie ein und schreibe passende Zusammenfassungen in die Lektionen).</p>
      <button class="btn" id="exportBtn">Als Code für data/videos.js exportieren</button>
      <pre id="exportOut" hidden></pre>`;
  }

  function bindVideos() {
    const form = document.getElementById("videoForm");
    form.querySelector("[name=url]").oninput = e => e.target.setCustomValidity("");
    form.onsubmit = e => {
      e.preventDefault();
      const f = new FormData(form);
      const [kurs, lektion] = String(f.get("ziel")).split("/");
      if (!isWebUrl(String(f.get("url")).trim())) { form.querySelector("[name=url]").setCustomValidity("Bitte eine http(s)-Adresse"); form.reportValidity(); return; }
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
      <header class="page-head"><span class="label">Werkzeug</span><h1>Grading-Labor</h1>
      <p class="lead">Lade ein Standbild oder einen Clip und grade ihn live. Beobachte dabei die Scopes – genau so arbeiten Coloristen. Doppelklick auf einen Regler setzt ihn zurück.</p></header>
      <div id="laborRoot"></div>
      <div class="box tip"><h4>Übungen</h4>
        1) Testbild: Bringe die Graustufen-Rampe in der Parade auf deckungsgleiche Kanäle, nachdem du die Temperatur verstellt hast.<br>
        2) Wähle „Teal & Orange“ und beobachte im Vectorscope, wie sich die Wolke Richtung Hautton-Linie und Cyan aufteilt.<br>
        3) Setze „Vorher-Anteil“ auf 0,5 für einen direkten Vorher/Nachher-Vergleich.
      </div>
      <p class="muted" style="font-size:13px">Dein Material wird nur lokal im Browser verarbeitet und nirgends hochgeladen.</p>
      <section id="breakdownRoot" class="breakdown"></section>`;
  }

  function feedPage() {
    const saved = window.Feed.savedCount();
    const chips = [["alle", "Alle Kurse"], ...KURSE.map(k => [k.id, k.titel]), ["gemerkt", `★ Gemerkt (${saved})`]];
    return `
      <section class="feed-hero">
        <div class="phone-mock" aria-hidden="true">
          <div class="pm-card pm-1"><span>Licht</span><b>Key · Fill · Back</b></div>
          <div class="pm-card pm-2"><span>Kurzer Check</span><b>1/50 s bei 25 fps?</b></div>
          <div class="pm-card pm-3"><span>Color</span><b>Lift · Gamma · Gain</b></div>
        </div>
        <div class="feed-copy">
          <span class="label acc">Reels-Modus</span>
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

  function trainingPage(query) {
    const focus = query.k && query.l ? findLektion(query.k, query.l) : null;
    return `
      <header class="page-head"><span class="label">${focus ? "Auffrischen" : "Wiederholen"}</span><h1>${focus ? esc(focus.titel) : "Wiederholen"}</h1>
      <p class="lead">${focus ? "Die unsichersten Karten dieser Lektion zuerst." : "Fragen und Fachbegriffe kommen genau dann wieder, wenn du sie zu vergessen drohst: Was du weißt, rückt in längere Abstände – was du nicht weißt, kommt sofort wieder."}</p></header>
      <div class="tabs" id="trainTabs">
        <button class="btn small active" data-tm="srs">${focus ? "Auffrischen" : "Fällige Karten"}</button>
        <button class="btn small" data-tm="frei">Freies Quiz</button>
      </div>
      <div id="trainRoot"></div>`;
  }
  function bindTraining(query) {
    const root = document.getElementById("trainRoot");
    const lessonKey = query.k && query.l ? `${query.k}/${query.l}` : null;
    const show = m => {
      document.querySelectorAll("[data-tm]").forEach(b => b.classList.toggle("active", b.dataset.tm === m));
      if (m === "frei") window.Tutor.training(root, KURSE, isDone);
      else window.Lernen.review(root, { lesson: lessonKey, onFree: () => show("frei") });
    };
    document.querySelectorAll("[data-tm]").forEach(b => b.onclick = () => show(b.dataset.tm));
    show("srs");
  }

  function glossarPage() {
    const g = window.GLOSSAR || [];
    return `
      <div class="glossar">
        <header class="page-head"><span class="label">Nachschlagen</span><h1>Glossar</h1>
          <p class="lead">${g.length} Fachbegriffe aus Kamera, Licht, Schnitt, Color und Social.</p></header>
        <input type="text" id="gSearch" placeholder="Begriff suchen …" aria-label="Begriff suchen">
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
    if (!parts.length) { html = home(); after = bindInstall; }
    else if (parts[0] === "kurse") html = kursePage();
    else if (parts[0] === "kurs") html = kursPage(parts[1]);
    else if (parts[0] === "lektion") {
      html = lektionPage(parts[1], parts[2]);
      after = () => {
        const l = findLektion(parts[1], parts[2]);
        if (!l) return;
        bindLessonModes(findKurs(parts[1]), l);
        if (window.Praxis) window.Praxis.bind(app, findKurs(parts[1]), l);
        if (query.praxis) setTimeout(() => { const p = document.getElementById("praxis"); if (p) p.scrollIntoView({ behavior: "smooth", block: "start" }); }, 120);
        document.getElementById("doneBtn").onclick = () => { toggleDone(parts[1], parts[2]); route(); };
      };
    }
    else if (parts[0] === "videos") { html = videosPage(query); after = bindVideos; }
    else if (parts[0] === "labor") { html = laborPage(); after = () => {
      window.Labor.mount(document.getElementById("laborRoot"));
      if (window.Breakdown) window.Breakdown.mount(document.getElementById("breakdownRoot"));
      if (query.breakdown) setTimeout(() => document.getElementById("breakdownRoot").scrollIntoView({ behavior: "smooth" }), 150);
    }; }
    else if (parts[0] === "sync") { html = syncPage(); after = bindSync; }
    else if (parts[0] === "notizheft") { html = `<div id="heftRoot"></div>`; after = () => window.Heft.mount(document.getElementById("heftRoot")); }
    else if (parts[0] === "feed") { html = feedPage(); after = bindFeed; }
    else if (parts[0] === "training") { html = trainingPage(query); after = () => bindTraining(query); }
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
    const section = ["kurs", "lektion"].includes(parts[0]) ? "kurse" : parts[0] || "";
    document.querySelectorAll("#nav a").forEach(a => {
      a.classList.toggle("active", a.getAttribute("href").replace(/^#\//, "") === section);
    });
    document.getElementById("nav").classList.remove("open");
    const due = window.Lernen ? window.Lernen.dueCount() : 0;
    document.querySelectorAll(".due-count").forEach(b => { b.textContent = due ? String(due) : ""; });
  }

  const notesBtn = document.getElementById("notesBtn");
  if (notesBtn) notesBtn.onclick = () => window.Notes && window.Notes.toggle();
  window.addEventListener("veye:lernen", () => {
    const due = window.Lernen ? window.Lernen.dueCount() : 0;
    document.querySelectorAll(".due-count").forEach(b => { b.textContent = due ? String(due) : ""; });
  });
  // Offline-Fähigkeit (nur wenn gehostet; in der Claude-Webversion gibt es kein Manifest)
  if ("serviceWorker" in navigator && document.querySelector('link[rel="manifest"]') && /^https?:$/.test(location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  // Daten vom anderen Gerät angekommen → Ansicht auffrischen (nicht beim Tippen)
  window.addEventListener("veye:sync", () => {
    window.dispatchEvent(new CustomEvent("veye:notes"));
    if (window.Notes) window.Notes.updateBadge();
    const a = document.activeElement;
    const typing = a && (a.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(a.tagName));
    if (!typing && !document.querySelector(".reels") && !/^#\/(notizheft|sync)/.test(location.hash)) route();
  });
  if (window.Sync) {
    const dot = i => { const b = document.getElementById("syncBtn"); if (b) { b.dataset.state = i.cloud ? (i.status === "fehler" || i.status === "voll" ? "err" : i.status === "läuft" ? "busy" : "ok") : "off"; b.title = i.cloud ? "Synchronisiert über dein Claude-Konto" : "Geräte & Backup"; } };
    dot(window.Sync.info()); window.Sync.onChange(dot);
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
