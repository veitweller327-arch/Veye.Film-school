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

`js/heft.js`: realistisches Notizbuch mit Ledereinband, Doppelseiten (Handy: Einzelseite) und Umblätter-Animation. Pro Lektion links der Lernzettel, rechts Zitate, eigene Notizen und Platz für Skizzen; dazu Innenseite, Inhaltsverzeichnis und freie Skizzenseiten. Werkzeuge: Stift, Textmarker, Radierer, Textfelder (Farbe, Größe S/M/L), Rückgängig, Bilder einkleben (Polaroid, verschieb- und skalierbar), Haftnotizen. Zeichnungen und Positionen liegen in `localStorage` („veye:heft“), Bilder in IndexedDB.
