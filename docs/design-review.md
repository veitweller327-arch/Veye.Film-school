# Design-Review: Veye Film School

Angewendet: [apple-design-skill](https://github.com/dickwu/apple-design-skill). Er prüft nach Apples Human Interface Guidelines (HIG), Stand Oktober 2026.

- **Plattform:** Web-App/PWA, vor allem iPhone (Safari, Home-Bildschirm) und Desktop-Browser.
- **Geltungsbereich:** Für eine Web-App gelten laut Skill die Prinzipien und Grundlagen, also Barrierefreiheit, Farbe, Typografie, Layout und Text. Plattform-Konventionen wie Tab-Leiste und Sheets wurden sinngemäß angewendet.
- **Gemessen:** automatisch per Playwright bei 390 px Breite auf 11 Seiten. Kontrast wird aus den echten CSS-Farben berechnet, nicht geschätzt.

## Zusammenfassung

- **These:** Lernen wie im Schneideraum. Warmes Fast-Schwarz, ein Tungsten-Akzent (3200 K), Timecode-Labels, Fotos als Anschauung.
- **Woran man sich erinnert:** die Fortschritts-Timeline mit Playhead und die Reels mit Vorlesen.
- **Bewertung vorher:** Kritische Mängel. Vor allem lief bei 200 % Text jede Seite seitlich über.
- **Bewertung nachher:** Gut.

## Kritisch (behoben)

| Was | Messwert vorher | Regel | Lösung |
| --- | --- | --- | --- |
| 200 % Textgröße | Seiten 223–315 px breit bei 195 px Platz | `typography.md › Supporting Dynamic Type`: „Make sure your app's layout adapts to all font sizes“ | Komposita umbrechen (`overflow-wrap: anywhere`, `lang="de"` für Silbentrennung), Tab-Beschriftungen kürzen, Kopfzeile schrumpft → jetzt 195 px |
| Text unter Minimum | 35 Stellen mit 7,96–10,5 px | `accessibility.md › Vision`: Minimum 11 pt | alle auf ≥ 11 px |
| Kontrast „Löschen“/„Gespeichert“ | `#5f5c58` auf `#141416`: 2,98:1 | `accessibility.md › Vision`: 4,5:1 bis 17 pt | → `#8e8a84`: 5,36:1 |
| Regler ohne Namen | 15 Regler im Grading-Labor ohne Beschriftung | `accessibility.md`: Bedienelemente für VoiceOver beschreiben | `aria-label` je Regler |
| Dauer-Animation trotz „Bewegung reduzieren“ | Hero-Licht lief endlos | `accessibility.md › Cognitive` | globale Reduced-Motion-Regel |

## Verbesserungen (behoben)

- **High · Tippflächen:** Viele Bedienelemente lagen unter 44 pt.
  - Vorher: Kopfzeile 34 × 34, Knöpfe 42–33 hoch, Modus-Tabs 37, Chips 31, Heft-Werkzeuge 38 × 36.
  - Regel: `accessibility.md › Mobility`, Standard 44 × 44 pt, Minimum 28.
  - Nachher: Hauptelemente 44, kleine Zweitknöpfe 36 und Chips 40 (über dem Minimum von 28).
- **High · Hamburger-Menü am Handy entfernt.**
  - Regel: `tab-bars.md › Best practices`: „Avoid overflow tabs“, und `designing-for-ios.md`: „limiting the number of onscreen controls“.
  - Die Tab-Leiste trägt die Navigation. Labor, Mediathek und Glossar liegen auf dem Start-Tab unter „Werkzeuge“.
- **Medium · Aktiver Tab gefüllt** (`tab-bars.md`: „Prefer filled symbols“).
- **Medium · Sheets in den Reels lassen sich nach unten wegwischen** (`sheets.md`), zusätzlich zu ✕ und Tippen daneben.
- **Medium · Tastaturfokus überall sichtbar** (`accessibility.md › Speech`, Full Keyboard Access).
- **Medium · Mehr Kontrast:** Bei der Systemeinstellung „Mehr Kontrast“ wird `--muted` heller, 10,8:1 statt 5,8:1 (`accessibility.md › Vision`).
- **Medium · Transparenz reduzieren:** Kopf- und Tab-Leiste werden deckend (`materials.md`).
- **Medium · Namen einheitlich** (`writing.md`): Die Seitenleiste heißt „Notizen“, die Heft-Seite „Notizheft“. Vorher hießen beide „Notizheft“.

## Gestaltung (Craft)

- **High · Große Ziffern 01/02/03 auf den Kurskarten entfernt.**
  - Der Skill nennt „01 / 02 / 03 markers on content that isn't a sequence“ ein Template-Muster, und die Kurse sind keine feste Reihenfolge.
  - Jetzt trägt das Foto die Karte. Die Lektionsliste behält ihre Nummern, weil sie eine echte Reihenfolge ist.
- **Medium · Eine Symbolsprache:** In der Reels-Leiste ersetzen Linien-Icons im Strich der Tab-Leiste die Textzeichen ★ ? ↗.
- **Bewusst behalten:**
  - **Nur dunkles Erscheinungsbild:** `dark-mode.md`: „In rare cases, consider using only a dark appearance … an app that supports immersive media viewing“. Für Color Grading ist eine neutrale, dunkle Umgebung fachlich richtig.
  - **Akzentfarbe:** Fast-Schwarz mit einer Akzentfarbe steht auf der Template-Liste des Skills. Hier ist sie aber aus dem Thema begründet (Tungsten-Licht) und auf Hauptaktionen und Status beschränkt (`branding.md`).
- **Low · Offen:** Zwei Handschriften (Kalam und Caveat) im Notizheft. `typography.md`: „Minimize the number of typefaces“. Beibehalten, weil sie das realistische Heft tragen. Eine zusammenzulegen wäre möglich.

## Was funktioniert

- **Kontrast der Farb-Tokens:**

  | Farbe | Hintergrund | Kontrast |
  | --- | --- | --- |
  | Text `#ece8e2` | Grund `#0a0a0b` | 16,2:1 |
  | `--muted` | Grund | 5,8:1 |
  | Akzent | Grund | 9,2:1 |
  | Knopftext `#17110a` | Akzent | 8,7:1 |
  | Teal | Grund | 8,6:1 |
  | Rosé | Grund | 7,0:1 |

- Rückmeldungen erscheinen in der Oberfläche statt in Alerts. Zerstörende Aktionen brauchen einen zweiten Tipp.
- Die Tab-Leiste hat fünf Ziele mit Ein-Wort-Beschriftungen, berücksichtigt Safe Areas und bleibt außer in Vollbild-Modalen sichtbar.
- Vorlesen und Reels pausieren nichts automatisch zeitgesteuert. Jede Aktion ist umkehrbar.

## Grenzen dieser Prüfung

- Kein echtes iPhone. VoiceOver, „Fetter Text“ und die Stimme wurden nicht am Gerät gehört.
- Die Web-App folgt nicht der iOS-Einstellung „Größerer Text“ (Dynamic Type), nur Zoom und Textgröße des Browsers. Getestet wurde 200 % per Zoom-Simulation.
- Kontrast auf Fotos und Verläufen lässt sich nicht automatisch messen. Dort sorgen Abdunklung und Textschatten für Lesbarkeit, geprüft per Augenschein.
