# Veye Film School

Eine Lernplattform für Filmstudium-Grundlagen, Color Grading und Instagram-Edits.
Reines HTML/CSS/JavaScript – kein Build, kein Server nötig.

## Starten

`index.html` im Browser öffnen. (Optional lokal: `python3 -m http.server` und `http://localhost:8000` öffnen.)

## Inhalte

| Kurs | Lektionen |
|---|---|
| 🎬 Filmstudium – Grundlagen | Einstellungsgrößen & Bildsprache · Kameratechnik · Licht · Commercial-Licht (Wandering DP) · False Color (Wandering DP) · Montage & Schnitttheorie · Ton · Dramaturgie |
| 🎨 Color Grading | Korrektur vs. Grading · Scopes · Lift/Gamma/Gain · Log, LUTs & Farbräume · Secondaries · Looks · Grading am Handy |
| 📱 Instagram Edits & Reels | Edits-App & Setup/Safe Zones · Hook · Beat-Sync · Kinetic Editing (Paddy Cartwright) · Sounddesign (Paddy Cartwright) · Text & Untertitel · Green Screen & Keyframes · Export |

Jede Lektion hat Theorie, eine Praxis-Übung, ein Quiz und verlinkte Quellen – in drei Lernmodi:

- **Schritt für Schritt:** Stoff in Häppchen, dazwischen Fragen, die man beantworten muss.
- **KI-Tutor:** Gespräch mit Claude, das den Stoff erklärt, Fragen stellt und Antworten bewertet (nur in der veröffentlichten Webversion).
- **Ganze Lektion:** alles am Stück lesen.

Dazu: **Training** mit 10 zufälligen Fragen aus allen Lektionen.

**Werkzeuge:** Grading-Labor (eigenes Bild/Video live graden mit Waveform, RGB-Parade, Vectorscope), Video-Bibliothek, Glossar, Lernfortschritt.

## Eigene Videos hinzufügen

- **Schnell:** Seite „Meine Videos“ → Link einfügen → Lektion wählen (wird im Browser gespeichert).
- **Dauerhaft:** in `data/videos.js` eintragen (Export-Button auf der Seite erzeugt den Code). Lokale Dateien in den Ordner `videos/` legen und als `videos/datei.mp4` eintragen.

Unterstützt: YouTube (inkl. Shorts), Vimeo, Instagram-Reels, MP4/MOV/WebM.

## Inhalte erweitern

Alle Lektionen stehen in `data/kurse.js` – neue Lektion = neues Objekt im `lektionen`-Array.

## Webversion bauen

`python3 tools/build-webseite.py` erzeugt `dist/veye-film-school.html` (eine Datei mit allem), die als Webseite veröffentlicht wird.

## Lern-Grafiken

`data/grafiken.js` enthält 38 selbst gezeichnete, animierte SVG-Grafiken (Lichtaufbauten, Scopes, Farbkreise, Safe Zones …), die automatisch nach der passenden Abschnittsüberschrift in Lektionen, Schritt-Modus und Reels erscheinen. Fotos können zusätzlich pro Lektion über das Feld `bilder` (`{ abschnitt, src, alt, credit, lizenz, quelle }`) eingetragen werden.

## Fachbegriffe mit Erklärung

`data/begriffe.js` erweitert das Glossar (167 Begriffe) und definiert Schreibvarianten. `js/terms.js` markiert in Lektionen, Schritt-Modus, Reels und Tutor-Antworten jeden Fachbegriff beim ersten Vorkommen; beim Hovern, Fokussieren oder Antippen erscheint die Erklärung.

## Notizheft

`js/notes.js`: Seitenleiste (Desktop: Reiter am rechten Rand, Handy: „Notizen“ in der Kopfzeile). Markierter Text („＋ In Notizheft“) und in den Reels gemerkte Karten landen als Zitat unter der passenden Lektion; jede Lektion bekommt automatisch eine Überschrift und ein eigenes Notizfeld. Gespeichert wird im Browser; „Alles kopieren“ exportiert alles als Text.

### Lernzettel

Beim Abschließen einer Lektion legt der KI-Assistent einen Lernzettel ins Notizheft (Kernaussagen, wichtige Werte, Begriffe, Merksatz, Selbsttest-Fragen) und bezieht die eigenen Markierungen ein. Ohne KI wird der Lernzettel aus den Lektionsdaten erzeugt.

## Digitales Notizheft (#/notizheft)

`js/heft.js`: realistisches Notizbuch mit Ledereinband, Doppelseiten (Handy: Einzelseite) und Umblätter-Animation. Pro Lektion links der Lernzettel, rechts Zitate, eigene Notizen und Platz für Skizzen; dazu Innenseite, Inhaltsverzeichnis und freie Skizzenseiten. Werkzeuge: Stift, Textmarker, Radierer, Textfelder (Farbe, Größe S/M/L), Rückgängig, Bilder einkleben (Polaroid, verschieb- und skalierbar), Haftnotizen. Vollbild-Modus und Text-Markierungen (Textauswahl → Markerfarbe oder Unterstreichen, gespeichert als Textposition) inklusive. Zeichnungen und Positionen liegen in `localStorage` („veye:heft“), Bilder in IndexedDB.

## Lernprofil, Wiederholen & Praxis

- `js/lernen.js`: Jede Quizantwort (Schritt-Modus, Reels, ganze Lektion, Wiederholen) fließt in ein Leitner-System mit 5 Fächern (Abstände 1/3/7/16/35 Tage). Karten: Quizfragen, Lernzettel-Fragen, Fachbegriffe der begonnenen Lektionen. Daraus: Sicherheit pro Lektion, fällige Karten, Lernserie und der Bereich „Heute“ auf der Startseite (fällige Wiederholungen, nächste Lektion, schwächste Lektion).
- `js/praxis.js`: Pro Lektion die Übung umsetzen, Standbild hochladen, drei Reflexionsfragen beantworten; der KI-Dozent gibt Feedback zum Bild. Reflexion und Feedback landen im Notizheft, das Bild als Polaroid im digitalen Heft.
- `js/breakdown.js`: Breakdown-Trainer im Grading-Labor – Standbild hochladen, selbst analysieren (Einstellungsgröße, Perspektive, Key-Richtung, Härte, Kontrast, Farbe), danach Auflösung durch den KI-Dozenten mit Vergleich; Ergebnis im Notizheft.

## Als App installieren (PWA)

`manifest.webmanifest`, `sw.js` und `icons/` machen die Plattform installierbar (eigenes Icon, Vollbild, offline). Dafür muss der Ordner per HTTPS gehostet werden, z. B. mit GitHub Pages (Repository öffentlich → Settings → Pages → Branch `master`, Ordner `/`). Danach die Seite am Handy öffnen: Android „Installieren“, iPhone „Teilen → Zum Home-Bildschirm“. KI-Funktionen (Tutor, Lernzettel per KI, Dozenten-Feedback) gibt es nur in der Claude-Webversion; in der App greifen die Offline-Varianten. Bei Änderungen an Dateien `VERSION` in `sw.js` erhöhen.

## Geräte-Synchronisierung & Backup

`js/sync.js`: In der Claude-Webversion werden `done`, `notes`, `heft`, `srs`, `aktiv`, `praxis`, `saved`, `feedAnswers`, `videos` und die Notizheft-Bilder automatisch im privaten Speicherbereich des Claude-Kontos abgeglichen (`data/users/<id>/…`, 200-KB-Teile). Haben sich beide Seiten geändert, wird zusammengeführt (Notizen je Lektion, Karten nach letzter Antwort, Heftseiten nach Elementen). Seite „Geräte & Backup“ (`#/sync`): Status, manueller Abgleich, Backup-Datei speichern/laden (z. B. über iCloud Drive) – auch in der installierten App.

## Vorlesen, Fotos & Handy-Layout

- **Vorlesestimme** (`js/stimme.js`): Reels und Lektionen werden vorgelesen.
  - Sie läuft über die Sprachausgabe des Geräts, also offline und kostenlos.
  - Die natürlichste deutsche Stimme wird automatisch gewählt (iPhone: „Premium“/„Erweitert“, Edge: „Natural“, Chrome/Android: Google).
  - In den Reels liest „Vorlesen“ jede Karte vor und wischt danach automatisch weiter. Bei offenen Quizfragen wartet sie auf die Antwort.
  - Über „⋯“ lassen sich Stimme, Tempo und Auto-Weiter einstellen.
  - Natürlichere Stimmen am iPhone: Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch, dann z. B. „Anna (Premium)“ laden.
- **60 Beispielfotos** (`img/fotos/`, Zuordnung in `data/fotos.js`):
  - KI-generiert mit Higgsfield, passend zu den Abschnitten der Lektionen.
  - Erscheinen in Lektionen und Reels.
  - Color Grading hat Vorher/Nachher-Regler.
- **Handy-Layout:**
  - Tab-Leiste unten (Start, Kurse, Reels, Wiederholen, Heft).
  - Kompakte Startseite: Kurse als wischbare Reihe, Werkzeuge im 2er-Raster, Lernpfad und Mentoren einklappbar.
  - In Lektionen sind Videos und Quellen einklappbar.

## Sicherheit

- **Fremddaten gelten als nicht vertrauenswürdig.** Alles aus der Cloud-Synchronisierung oder einer Backup-Datei prüft `js/sync.js` (`clean()`), bevor es gespeichert wird:
  - Typen und Formen werden geprüft.
  - `__proto__`/`constructor`/`prototype` werden verworfen.
  - Bilder sind nur als `data:image/(png|jpeg|webp|gif)` zulässig, Video-Links nur als http(s) oder relativer Pfad.
  - Größen und Listenlängen sind begrenzt.
- **Die Anzeige escapet zusätzlich jeden gespeicherten Wert.** Gemerkte Reels werden nie aus gespeichertem HTML gerendert, sondern über ihre ID aus den Lektionsdaten neu erzeugt.
- **Die installierte App** (`index.html`) hat eine Content-Security-Policy:
  - nur eigene Skripte, keine Inline-Skripte, keine Plugins
  - Einbettungen nur von YouTube, Vimeo und Instagram
- **Cloud-Daten** liegen im privaten Bereich `data/users/<id>/` des Claude-Kontos. Andere Betrachter des Artifacts können ihn weder lesen noch beschreiben.
- **Backups nur aus eigener Quelle laden.** Eine Backup-Datei enthält alle Notizen und Bilder im Klartext und sollte nicht weitergegeben werden.
