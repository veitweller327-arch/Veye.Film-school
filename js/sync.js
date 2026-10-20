/*
 * Geräte-Synchronisierung & Backup
 * - In der Claude-Webversion: automatischer Abgleich über den privaten Speicherbereich des
 *   Claude-Kontos (db-Capability, Pfad data/users/<id>/…). Nur die angemeldete Person sieht ihn.
 * - Überall: Backup-Datei (JSON inkl. Bilder) speichern und laden – z. B. über iCloud Drive.
 *
 * Abgleich je Speicherschlüssel: Hat sich nur eine Seite geändert, gewinnt sie. Haben sich beide
 * geändert, werden die Daten zusammengeführt (z. B. Notizen je Lektion, Karten nach letzter Antwort).
 */
(function () {
  const KEYS = ["done", "notes", "heft", "srs", "aktiv", "praxis", "saved", "feedAnswers", "videos"];
  const CHUNK = 200000; // Zeichen pro Dokument (Limit 256 KiB)
  const META = "veye-sync-meta";
  const ls = {
    get: k => { try { return localStorage.getItem("veye:" + k); } catch { return null; } },
    set: (k, v) => { try { if (v == null) localStorage.removeItem("veye:" + k); else localStorage.setItem("veye:" + k, v); } catch { /* voll */ } }
  };
  const meta = { load: () => { try { return JSON.parse(localStorage.getItem(META)) || {}; } catch { return {}; } },
                 save: m => { try { localStorage.setItem(META, JSON.stringify(m)); } catch { /* egal */ } } };
  const hash = s => { let h = 2166136261; s = s || ""; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ":" + s.length; };
  const parse = s => { try { return JSON.parse(s); } catch { return null; } };
  const device = (() => { try { let d = localStorage.getItem("veye-device"); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem("veye-device", d); } return d; } catch { return "x"; } })();

  /* ---------------- Zusammenführen ---------------- */
  function mergeValues(key, local, remote) {
    const L = parse(local), R = parse(remote);
    if (!L || typeof L !== "object") return remote;
    if (!R || typeof R !== "object") return local;
    if (Array.isArray(L) || Array.isArray(R)) {
      // Listen (Videos, gemerkte Karten): vereinigen
      const seen = new Set(), out = [];
      [...R, ...L].forEach(x => { const id = JSON.stringify(x && (x.id || x.url || x)); if (!seen.has(id)) { seen.add(id); out.push(x); } });
      return JSON.stringify(out);
    }
    const out = { ...R };
    for (const [k, lv] of Object.entries(L)) {
      const rv = R[k];
      if (rv === undefined) { out[k] = lv; continue; }
      if (JSON.stringify(rv) === JSON.stringify(lv)) continue;
      if (key === "srs") out[k] = (lv.last || 0) >= (rv.last || 0) ? lv : rv;
      else if (key === "aktiv") out[k] = Math.max(+lv || 0, +rv || 0);
      else if (key === "notes") {
        const items = new Map(); [...(rv.items || []), ...(lv.items || [])].forEach(i => items.set(i.id, i));
        const newer = (lv.updated || 0) >= (rv.updated || 0) ? lv : rv;
        const sum = [lv.summary, rv.summary].filter(Boolean).sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
        out[k] = { ...rv, ...lv, items: [...items.values()].sort((a, b) => (a.ts || 0) - (b.ts || 0)), text: newer.text || "", summary: sum, updated: Math.max(lv.updated || 0, rv.updated || 0) };
        if (!sum) delete out[k].summary;
      } else if (key === "heft" && k === "pages") {
        const pages = { ...rv };
        for (const [pid, lp] of Object.entries(lv)) {
          const rp = rv[pid];
          if (!rp) { pages[pid] = lp; continue; }
          const items = new Map(); [...(rp.items || []), ...(lp.items || [])].forEach(i => items.set(i.id, i));
          const hl = new Map(); [...(rp.hl || []), ...(lp.hl || [])].forEach(h => hl.set(h.id, h));
          const strokes = (lp.strokes || []).length >= (rp.strokes || []).length ? lp.strokes : rp.strokes;
          pages[pid] = { ...rp, ...lp, items: [...items.values()], hl: [...hl.values()], strokes: strokes || [] };
        }
        out[k] = pages;
      } else if (key === "heft" && k === "free") {
        const m = new Map(); [...(rv || []), ...(lv || [])].forEach(f => m.set(f.id, f)); out[k] = [...m.values()];
      } else if (key === "praxis") {
        const m = new Map(); [...(rv || []), ...(lv || [])].forEach(t => m.set(t.ts, { ...(m.get(t.ts) || {}), ...t })); out[k] = [...m.values()].sort((a, b) => a.ts - b.ts);
      } else out[k] = lv; // sonst: dieses Gerät gewinnt
    }
    return JSON.stringify(out);
  }

  /* ---------------- Bilder (IndexedDB des Notizhefts) ---------------- */
  function idb() {
    return new Promise(res => {
      try { const r = indexedDB.open("veye-heft", 1); r.onupgradeneeded = () => r.result.createObjectStore("bilder"); r.onsuccess = () => res(r.result); r.onerror = () => res(null); }
      catch { res(null); }
    });
  }
  async function localImages() {
    const d = await idb(); if (!d) return {};
    return new Promise(res => {
      const out = {}, st = d.transaction("bilder").objectStore("bilder"), rq = st.openCursor();
      rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      rq.onerror = () => res(out);
    });
  }
  async function putImage(id, blob) {
    const d = await idb(); if (!d) return;
    await new Promise(r => { const tx = d.transaction("bilder", "readwrite"); tx.objectStore("bilder").put(blob, id); tx.oncomplete = r; tx.onerror = r; });
  }
  const blobToDataUrl = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.onerror = () => r(""); f.readAsDataURL(b); });
  function dataUrlToBlob(u) {
    const [h, data] = String(u).split(","); if (!data) return null;
    const bin = atob(data), a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new Blob([a], { type: (h.match(/data:([^;]+)/) || [])[1] || "image/jpeg" });
  }

  /* ---------------- Cloud (Claude-Konto) ---------------- */
  let db = null, uid = null, ready = false, busy = false, lastSync = 0, status = "aus", unsub = null;
  const listeners = new Set();
  const emit = () => listeners.forEach(f => { try { f(info()); } catch { /* egal */ } });
  const info = () => ({ cloud: ready, status, lastSync });
  const col = () => db.collection(`data/users/${uid}`);

  async function writeChunks(name, str, extra = {}) {
    const parts = Math.max(1, Math.ceil(str.length / CHUNK));
    for (let i = 0; i < parts; i++) {
      await col().doc(`${name}~${i}`).set({ ...extra, name, part: i, parts, v: str.slice(i * CHUNK, (i + 1) * CHUNK) });
    }
    // überzählige alte Teile entfernen
    for (let i = parts; i < parts + 4; i++) { const r = col().doc(`${name}~${i}`); const s = await r.get(); if (s.exists) await r.delete(); else break; }
  }
  async function readChunks(name) {
    const first = await col().doc(`${name}~0`).get();
    if (!first.exists) return null;
    const d0 = first.data(); let s = d0.v || "";
    for (let i = 1; i < (d0.parts || 1); i++) { const p = await col().doc(`${name}~${i}`).get(); if (!p.exists) return null; s += p.data().v || ""; }
    return { v: s, t: d0.t || 0, by: d0.by };
  }

  async function syncNow(reason) {
    if (!ready || busy) return;
    busy = true; status = "läuft"; emit();
    let changedLocal = false;
    try {
      const m = meta.load();
      m.keys = m.keys || {};
      for (const key of KEYS) {
        const local = ls.get(key);
        const remote = await readChunks("k." + key);
        const km = m.keys[key] || {};
        const localChanged = hash(local) !== km.h;
        const remoteChanged = remote && remote.t !== km.t;
        let result = local;
        if (remote && remoteChanged && !localChanged) result = remote.v;
        else if (remote && remoteChanged && localChanged) result = mergeValues(key, local, remote.v);
        if (result !== local) { ls.set(key, result); changedLocal = true; }
        if (!remote || hash(result) !== hash(remote.v)) {
          const t = Date.now();
          if (result != null) await writeChunks("k." + key, result, { kind: "key", t, by: device });
          m.keys[key] = { h: hash(result), t };
        } else m.keys[key] = { h: hash(result), t: remote.t };
      }
      // Bilder: fehlende hochladen, fehlende herunterladen
      const imgs = await localImages();
      m.imgs = m.imgs || {};
      const remoteImgs = await col().where("kind", "==", "img").where("part", "==", 0).get();
      const remoteIds = new Set(remoteImgs.docs.map(d => d.data().id));
      for (const [id, blob] of Object.entries(imgs)) {
        if (remoteIds.has(id) || m.imgs[id]) { m.imgs[id] = 1; continue; }
        const url = await blobToDataUrl(blob);
        if (url) { await writeChunks("img." + id, url, { kind: "img", id, t: Date.now() }); m.imgs[id] = 1; }
      }
      for (const id of remoteIds) {
        if (imgs[id]) continue;
        const r = await readChunks("img." + id);
        const b = r && dataUrlToBlob(r.v);
        if (b) { await putImage(id, b); changedLocal = true; m.imgs[id] = 1; }
      }
      // Signal für andere Geräte
      if (reason !== "remote") await col().doc("stamp").set({ t: Date.now(), by: device });
      meta.save(m);
      lastSync = Date.now(); status = "ok";
    } catch (e) {
      status = e && e.code === "quota_exceeded" ? "voll" : "fehler";
    } finally {
      busy = false; emit();
      if (changedLocal) window.dispatchEvent(new CustomEvent("veye:sync"));
    }
  }

  // lokale Änderungen erkennen (günstig: Hash-Vergleich)
  function localDirty() {
    const m = meta.load().keys || {};
    return KEYS.some(k => hash(ls.get(k)) !== (m[k] || {}).h);
  }

  async function start() {
    if (!window.claude || typeof window.claude.use !== "function") { status = "nur lokal"; emit(); return; }
    let d = null;
    try {
      const [db0, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      d = db0 && typeof db0.collection === "function" ? db0 : null;
      uid = user && typeof user.id === "function" ? await user.id().catch(() => null) : null;
    } catch { d = null; uid = null; }
    if (!d || !uid) { status = "nur lokal"; emit(); return; }
    db = d; ready = true; emit();
    await syncNow("start");
    // andere Geräte melden Änderungen über das Stempel-Dokument
    unsub = col().doc("stamp").onSnapshot(s => {
      const v = s.exists && s.data();
      if (v && v.by !== device && v.t > lastSync) syncNow("remote");
    }, () => {});
    setInterval(() => { if (localDirty()) syncNow("local"); }, 15000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" ? localDirty() : true) syncNow("visible"); });
  }

  /* ---------------- Backup-Datei ---------------- */
  async function exportBackup() {
    const data = {};
    KEYS.forEach(k => { const v = ls.get(k); if (v != null) data[k] = v; });
    const imgs = await localImages(), images = {};
    for (const [id, b] of Object.entries(imgs)) images[id] = await blobToDataUrl(b);
    const json = JSON.stringify({ app: "veye-film-school", version: 1, created: new Date().toISOString(), data, images });
    const filename = `veye-backup-${new Date().toLocaleDateString("sv-SE")}.json`;
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads").catch(() => null) : null;
    if (dl) { await dl.save({ filename, data: json }); return "gespeichert"; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    return "gespeichert";
  }
  async function importBackup(file) {
    const j = parse(await file.text());
    if (!j || j.app !== "veye-film-school" || !j.data) throw new Error("Keine gültige Veye-Backup-Datei.");
    for (const k of KEYS) {
      if (j.data[k] == null) continue;
      const cur = ls.get(k);
      ls.set(k, cur ? mergeValues(k, cur, j.data[k]) : j.data[k]);
    }
    for (const [id, url] of Object.entries(j.images || {})) { const b = dataUrlToBlob(url); if (b) await putImage(id, b); }
    window.dispatchEvent(new CustomEvent("veye:sync"));
    if (ready) syncNow("import");
    return Object.keys(j.data).length;
  }

  window.Sync = { start, syncNow: () => syncNow("manual"), info, onChange: f => { listeners.add(f); return () => listeners.delete(f); }, exportBackup, importBackup };
  start().catch(() => { status = "nur lokal"; emit(); });
})();
