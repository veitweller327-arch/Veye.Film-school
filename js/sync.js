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

  /* ---------------- Prüfen (Sicherheit) ----------------
   * Alles, was aus der Cloud oder einer Backup-Datei kommt, gilt als nicht vertrauenswürdig:
   * Form und Typen werden geprüft, gefährliche Schlüssel und Werte verworfen, Größen begrenzt.
   * Die Anzeige escapet zusätzlich selbst – das hier ist die zweite Verteidigungslinie. */
  const MAX_KEY = 25e6;                  // Zeichen je Speicherschlüssel
  const BAD = new Set(["__proto__", "constructor", "prototype"]);
  const IMG_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/;
  const COLOR = /^#[0-9a-f]{3,8}$/i;
  const isObj = x => !!x && typeof x === "object" && !Array.isArray(x);
  const str = (x, n = 20000) => typeof x === "string" ? x.slice(0, n) : x == null ? undefined : String(x).slice(0, n);
  const num = x => (typeof x === "number" && isFinite(x) ? x : undefined);
  const id = x => (typeof x === "string" || typeof x === "number") && String(x).length <= 200 ? String(x) : null;
  const webUrl = u => { u = String(u || "").trim().replace(/[\u0000- ]/g, ""); if (!u) return false; if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return true; try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };
  const safeParse = s => { try { return JSON.parse(s, (k, v) => (BAD.has(k) ? undefined : v)); } catch { return null; } };
  const dict = (o, f) => { const out = {}; if (isObj(o)) for (const [k, v] of Object.entries(o)) { if (BAD.has(k) || k.length > 200) continue; const c = f(v, k); if (c !== undefined) out[k] = c; } return out; };
  const list = (a, f, max = 5000) => (Array.isArray(a) ? a.slice(0, max).map(f).filter(x => x !== undefined) : []);

  // Tiefe Kopie ohne gefährliche Schlüssel, mit Grenzen für Tiefe, Listen und Textlänge.
  // Unbekannte Felder bleiben erhalten (kein Datenverlust), nur riskante Werte werden korrigiert.
  function deep(v, d = 0) {
    if (d > 12) return undefined;
    if (typeof v === "string") return v.length > 400000 ? v.slice(0, 400000) : v;
    if (typeof v === "number") return isFinite(v) ? v : 0;
    if (typeof v === "boolean" || v === null) return v;
    if (Array.isArray(v)) return v.slice(0, 50000).map(x => deep(x, d + 1)).filter(x => x !== undefined);
    if (isObj(v)) return dict(v, x => deep(x, d + 1));
    return undefined;
  }
  const heftItem = it => {
    if (!isObj(it) || !id(it.id) || !["img", "sticky", "text"].includes(it.type)) return undefined;
    const o = { ...it, id: id(it.id) };
    if (o.color !== undefined && !COLOR.test(o.color)) delete o.color;
    if (o.size !== undefined && !["s", "m", "l"].includes(o.size)) delete o.size;
    if (o.data !== undefined && !(typeof o.data === "string" && IMG_URL.test(o.data))) delete o.data;
    for (const k of ["x", "y", "w", "rot"]) if (o[k] !== undefined && num(o[k]) === undefined) o[k] = 0;
    return o;
  };
  const page = p => (isObj(p) ? { ...p,
    items: list(p.items, heftItem),
    strokes: list(p.strokes, s => (isObj(s) && Array.isArray(s.p) ? { ...s, c: COLOR.test(s.c) ? s.c : "#2b3a8f",
      p: s.p.filter(pt => Array.isArray(pt) && pt.length >= 2 && pt.every(n => typeof n === "number")) } : undefined)),
    hl: list(p.hl, h => (isObj(h) && id(h.id) ? { ...h, id: id(h.id), c: COLOR.test(h.c) ? h.c : "#ffe14d" } : undefined)) } : undefined);

  const CLEAN = {
    done: o => (isObj(o) ? o : {}),
    aktiv: o => dict(o, v => num(v)),
    feedAnswers: o => (isObj(o) ? o : {}),
    srs: o => dict(o, v => (isObj(v) ? v : undefined)),
    notes: o => dict(o, n => (isObj(n) ? { ...n,
      items: list(n.items, i => (isObj(i) && id(i.id) ? { ...i, id: id(i.id), text: str(i.text) || "", quelle: str(i.quelle, 300) || "" } : undefined)),
      text: str(n.text, 400000) || "", ...(n.summary !== undefined ? { summary: isObj(n.summary) ? n.summary : undefined } : {}) } : undefined)),
    heft: o => (isObj(o) ? { ...o, pages: dict(o.pages, page), free: list(o.free, f => (isObj(f) && id(f.id) ? { ...f, id: id(f.id) } : undefined), 1000) } : {}),
    praxis: o => dict(o, a => (Array.isArray(a) ? list(a, t => (isObj(t) && num(t.ts) !== undefined
      ? { ...t, thumb: typeof t.thumb === "string" && IMG_URL.test(t.thumb) ? t.thumb : "" } : undefined), 500) : undefined)),
    // Gemerkte Karten: nur der Verweis wird gebraucht, der Inhalt kommt aus den Lektionsdaten.
    saved: a => list(a, s => (isObj(s) && typeof s.id === "string" && s.id.length < 4000 && id(s.kurs) && id(s.lektion)
      ? { id: s.id, kurs: id(s.kurs), lektion: id(s.lektion), type: str(s.type, 40), ...(num(s.qi) !== undefined ? { qi: s.qi } : {}) } : undefined)),
    videos: a => list(a, v => (isObj(v) && typeof v.url === "string" && webUrl(v.url) ? { ...v } : undefined), 2000),
  };
  /** Liefert bereinigtes JSON oder null, wenn der Wert unbrauchbar ist. */
  function clean(key, s) {
    if (s == null || typeof s !== "string" || s.length > MAX_KEY || !CLEAN[key]) return null;
    const v = deep(safeParse(s));
    if (v == null || typeof v !== "object") return null;
    return JSON.stringify(CLEAN[key](v));
  }
  const cleanImage = u => (typeof u === "string" && u.length < 15e6 && IMG_URL.test(u) ? u : null);

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
      if (BAD.has(k)) continue;
      const rv = Object.prototype.hasOwnProperty.call(R, k) ? R[k] : undefined;
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
    if (!cleanImage(u)) return null; // nur echte Bilder (png/jpeg/webp/gif)
    const [h, data] = String(u).split(",");
    let bin; try { bin = atob(data); } catch { return null; }
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new Blob([a], { type: h.match(/data:([^;]+)/)[1] });
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
    const parts = Math.min(+d0.parts || 1, 200);
    for (let i = 1; i < parts; i++) { const p = await col().doc(`${name}~${i}`).get(); if (!p.exists) return null; s += p.data().v || ""; }
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
        let remote = await readChunks("k." + key);
        if (remote) remote.v = clean(key, remote.v); // Cloud-Daten erst prüfen
        if (remote && remote.v == null) remote = null; // unbrauchbar → wie nicht vorhanden
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
    if (!file || file.size > 300e6) throw new Error("Datei zu groß für ein Veye-Backup.");
    const j = safeParse(await file.text());
    if (!isObj(j) || j.app !== "veye-film-school" || !isObj(j.data)) throw new Error("Keine gültige Veye-Backup-Datei.");
    let n = 0;
    for (const k of KEYS) {
      const raw = j.data[k];
      if (raw == null) continue;
      const v = clean(k, typeof raw === "string" ? raw : JSON.stringify(raw));
      if (v == null) continue; // unbrauchbar → überspringen, nichts überschreiben
      const cur = ls.get(k);
      ls.set(k, cur ? clean(k, mergeValues(k, cur, v)) ?? cur : v);
      n++;
    }
    let imgs = 0;
    for (const [id, url] of Object.entries(isObj(j.images) ? j.images : {})) {
      if (imgs >= 2000 || BAD.has(id) || id.length > 200) continue;
      const b = dataUrlToBlob(url); if (b) { await putImage(id, b); imgs++; }
    }
    window.dispatchEvent(new CustomEvent("veye:sync"));
    if (ready) syncNow("import");
    return n;
  }

  window.Sync = { start, syncNow: () => syncNow("manual"), info, onChange: f => { listeners.add(f); return () => listeners.delete(f); }, exportBackup, importBackup };
  start().catch(() => { status = "nur lokal"; emit(); });
})();
