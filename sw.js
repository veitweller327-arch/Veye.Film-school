/*
 * Service Worker: macht die Plattform offline nutzbar und installierbar.
 * Eigene Dateien: aus dem Cache, im Hintergrund aktualisiert. Schriften: zur Laufzeit zwischengespeichert.
 * Bei Änderungen an Dateien VERSION erhöhen.
 */
const VERSION = "veye-v1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest", "./css/style.css",
  "./data/kurse.js", "./data/begriffe.js", "./data/videos.js", "./data/grafiken.js",
  "./js/labor.js", "./js/terms.js", "./js/tutor.js", "./js/feed.js", "./js/notes.js", "./js/heft.js",
  "./js/lernen.js", "./js/praxis.js", "./js/breakdown.js", "./js/app.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== "veye-fonts").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Google Fonts: zwischenspeichern
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("veye-fonts").then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Seitenaufrufe → App-Shell
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(r => { caches.open(VERSION).then(c => c.put("./index.html", r.clone())); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  // eigene Dateien: Cache zuerst, im Hintergrund aktualisieren
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
