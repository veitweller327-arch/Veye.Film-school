/*
 * Lerninhalte der Veye Film School.
 * Jeder Kurs hat Lektionen mit: id, titel, level (basis | vertiefung | praxis),
 * inhalt (HTML), aufgabe (Praxisübung), quiz und quellen.
 * Eigene Videos werden über data/videos.js den Lektionen zugeordnet (Feld "lektion").
 */
window.KURSE = [
  /* ================================================================
   * KURS 1 – FILMSTUDIUM GRUNDLAGEN
   * ================================================================ */
  {
    id: "film",
    icon: "🎬",
    titel: "Filmstudium – Grundlagen",
    beschreibung: "Was im ersten Jahr an der Filmhochschule unterrichtet wird: Bildsprache, Kamera, Licht, Schnitt, Ton und Dramaturgie.",
    lektionen: [
      {
        id: "einstellungsgroessen",
        titel: "Einstellungsgrößen & Bildsprache",
        level: "basis",
        inhalt: `
<p>Die <strong>Einstellungsgröße</strong> legt fest, wie viel vom Motiv im Bild zu sehen ist. Sie ist das erste Vokabular der Filmsprache: Jede Größe erzeugt eine andere emotionale Nähe zum Publikum.</p>
<table>
<tr><th>Größe</th><th>Was ist zu sehen?</th><th>Wirkung / Einsatz</th></tr>
<tr><td>Weit / Panorama (Extreme Wide)</td><td>Landschaft, Figur winzig</td><td>Ort etablieren, Einsamkeit, Größe</td></tr>
<tr><td>Totale (Wide)</td><td>Ganze Figur mit Umgebung</td><td>Orientierung, Establishing Shot</td></tr>
<tr><td>Halbtotale (Full)</td><td>Figur von Kopf bis Fuß</td><td>Körpersprache, Bewegung</td></tr>
<tr><td>Amerikanische (Cowboy)</td><td>Kopf bis Oberschenkel</td><td>Dialog in Gruppe, Western-Ursprung (Holster im Bild)</td></tr>
<tr><td>Halbnah (Medium)</td><td>Kopf bis Hüfte</td><td>Standard für Dialoge</td></tr>
<tr><td>Nah (Medium Close-Up)</td><td>Kopf bis Brust</td><td>Emotion + etwas Gestik</td></tr>
<tr><td>Groß (Close-Up)</td><td>Gesicht</td><td>Gefühle, Reaktionen</td></tr>
<tr><td>Detail (Extreme Close-Up)</td><td>Augen, Hand, Objekt</td><td>Spannung, wichtige Info hervorheben</td></tr>
</table>
<h3>Kameraperspektive</h3>
<ul>
<li><strong>Normalsicht</strong> (Augenhöhe) – neutral.</li>
<li><strong>Untersicht / Froschperspektive</strong> – Figur wirkt mächtig, bedrohlich.</li>
<li><strong>Aufsicht / Vogelperspektive</strong> – Figur wirkt klein, verletzlich.</li>
<li><strong>Dutch Angle</strong> (gekippter Horizont) – Unruhe, Wahnsinn, etwas stimmt nicht.</li>
<li><strong>Over-the-Shoulder (OTS)</strong> – klassisch für Dialoge (Schuss/Gegenschuss).</li>
<li><strong>POV</strong> – wir sehen durch die Augen der Figur.</li>
</ul>
<h3>Bildkomposition</h3>
<ul>
<li><strong>Drittelregel:</strong> Bild gedanklich in 3×3 teilen, wichtige Elemente (Augen, Horizont) auf die Linien/Schnittpunkte legen.</li>
<li><strong>Blickraum (Lead Room):</strong> Schaut eine Figur nach rechts, braucht sie rechts mehr Platz.</li>
<li><strong>Kopfraum (Headroom):</strong> Nicht zu viel Luft über dem Kopf – bei Close-Ups darf die Stirn auch angeschnitten sein.</li>
<li><strong>Führende Linien, Rahmen im Rahmen, Symmetrie</strong> (z. B. Wes Anderson, Kubrick) lenken den Blick.</li>
<li><strong>Tiefe:</strong> Vordergrund – Mittelgrund – Hintergrund staffeln, damit das Bild nicht flach wirkt.</li>
</ul>
<div class="box tip"><h4>Für Instagram</h4>Im 9:16-Hochformat funktionieren Nah- und Großaufnahmen am besten – auf dem Handy-Display sind Totalen schnell zu klein. Die Drittelregel gilt trotzdem, nur vertikal gedacht.</div>
`,
        aufgabe: "Nimm eine kurze Szene (z. B. „Kaffee kochen“) in 8 Einstellungen auf – von der Totale bis zum Detail. Schneide sie zu 20 Sekunden zusammen und beobachte, wie sich die Wirkung ändert.",
        quiz: [
          { frage: "Welche Einstellung zeigt eine Figur von Kopf bis Hüfte?", antworten: ["Totale", "Halbnah", "Detail", "Amerikanische"], richtig: 1, erklaerung: "Halbnah (Medium Shot) = Kopf bis Hüfte, Standard für Dialoge." },
          { frage: "Was bewirkt eine Untersicht (Froschperspektive)?", antworten: ["Figur wirkt klein", "Figur wirkt mächtig", "Neutral", "Orientierung im Raum"], richtig: 1, erklaerung: "Von unten gefilmt wirkt eine Figur größer und dominanter." },
          { frage: "Wofür steht 'Lead Room'?", antworten: ["Platz über dem Kopf", "Platz in Blickrichtung", "Abstand zur Kamera", "Länge der Einstellung"], richtig: 1, erklaerung: "Blickraum: In Blick- oder Bewegungsrichtung bleibt mehr Raum frei." }
        ],
        quellen: [
          { titel: "StudioBinder – Ultimate Guide to Camera Shots", url: "https://www.studiobinder.com/blog/ultimate-guide-to-camera-shots/" },
          { titel: "Wikipedia – Einstellungsgröße", url: "https://de.wikipedia.org/wiki/Einstellungsgr%C3%B6%C3%9Fe" },
          { titel: "Wikipedia – Rule of thirds", url: "https://en.wikipedia.org/wiki/Rule_of_thirds" }
        ]
      },
      {
        id: "kamera",
        titel: "Kameratechnik: Belichtung, Shutter, Bildrate",
        level: "basis",
        inhalt: `
<p>Belichtung entsteht aus drei Werten – dem <strong>Belichtungsdreieck</strong>. Jeder Wert hat neben der Helligkeit auch einen gestalterischen Nebeneffekt.</p>
<table>
<tr><th>Wert</th><th>Heller wenn …</th><th>Nebeneffekt</th></tr>
<tr><td><strong>Blende</strong> (f-Zahl)</td><td>kleine Zahl (f/1.8)</td><td>Schärfentiefe: offene Blende = unscharfer Hintergrund (Bokeh)</td></tr>
<tr><td><strong>Verschlusszeit</strong> (Shutter)</td><td>länger (1/50)</td><td>Bewegungsunschärfe (Motion Blur)</td></tr>
<tr><td><strong>ISO</strong> (Gain)</td><td>höher</td><td>Bildrauschen</td></tr>
</table>
<h3>Die 180°-Shutter-Regel</h3>
<p>Für natürlich wirkende Bewegungsunschärfe gilt: <strong>Verschlusszeit ≈ 1 / (2 × Bildrate)</strong>.</p>
<ul>
<li>24 fps → 1/48 bzw. 1/50 s</li>
<li>25 fps → 1/50 s (PAL-Länder, Deutschland)</li>
<li>30 fps → 1/60 s</li>
<li>60 fps → 1/120 s</li>
</ul>
<p>Weil die Verschlusszeit damit festliegt, regelt man die Helligkeit draußen mit einem <strong>ND-Filter</strong> („Sonnenbrille für die Kamera“) statt mit dem Shutter.</p>
<div class="box tip"><h4>Flimmern vermeiden</h4>In Deutschland läuft das Stromnetz mit 50 Hz. Unter Kunstlicht (LED, Neonröhren) daher Shutter auf 1/50 oder 1/100 stellen, sonst flimmert das Bild.</div>
<h3>Bildraten (fps)</h3>
<ul>
<li><strong>24 fps</strong> – der klassische Kino-Look.</li>
<li><strong>25 / 30 fps</strong> – TV, Social Media, Vlogs.</li>
<li><strong>50 / 60 fps</strong> – flüssige Bewegung oder 2× Zeitlupe.</li>
<li><strong>100 / 120 fps+</strong> – Zeitlupe (auf einer 25/30-fps-Timeline abspielen).</li>
</ul>
<h3>Log, RAW & Codecs</h3>
<p><strong>Log-Profile</strong> (S-Log3, C-Log, V-Log, Apple Log …) speichern einen sehr flachen, kontrastarmen Bildeindruck. Das sieht zuerst „grau“ aus, enthält aber mehr Dynamikumfang (Details in Lichtern und Schatten) – ideal fürs Color Grading. <strong>10-Bit</strong> ist dafür Pflicht, 8-Bit-Log führt schnell zu Banding. <strong>RAW</strong> speichert die Sensordaten fast unverändert und bietet die größte Freiheit.</p>
<h3>Objektive & Brennweite</h3>
<ul>
<li><strong>Weitwinkel</strong> (14–24 mm): Raum wirkt groß, Gesichter verzerren nah.</li>
<li><strong>Normal</strong> (35–50 mm): entspricht etwa dem menschlichen Sehen.</li>
<li><strong>Tele</strong> (85 mm+): Hintergrund rückt nah heran (Kompression), schmeichelhaft für Porträts.</li>
</ul>
`,
        aufgabe: "Filme dieselbe Bewegung (z. B. Hand winkt) mit 1/50, 1/250 und 1/1000 s. Vergleiche die Bewegungsunschärfe. Danach: eine Porträtaufnahme mit f/1.8 und f/8.",
        quiz: [
          { frage: "Welche Verschlusszeit nach 180°-Regel bei 25 fps?", antworten: ["1/25", "1/50", "1/100", "1/200"], richtig: 1, erklaerung: "1 / (2 × 25) = 1/50 s." },
          { frage: "Was bewirkt eine kleine Blendenzahl (f/1.8)?", antworten: ["Mehr Schärfentiefe", "Weniger Licht", "Unscharfer Hintergrund", "Mehr Rauschen"], richtig: 2, erklaerung: "Offene Blende = geringe Schärfentiefe = Bokeh." },
          { frage: "Wozu dient ein ND-Filter?", antworten: ["Farben verstärken", "Licht reduzieren, ohne Shutter/Blende zu ändern", "Schärfe erhöhen", "Rauschen entfernen"], richtig: 1, erklaerung: "ND = Neutraldichte: dunkelt das Bild ab, ohne die Farben zu verändern." }
        ],
        quellen: [
          { titel: "Wikipedia – Belichtung (Fotografie)", url: "https://de.wikipedia.org/wiki/Belichtung_(Fotografie)" },
          { titel: "StudioBinder – 180 Degree Shutter Rule", url: "https://www.studiobinder.com/blog/what-is-the-180-degree-shutter-rule/" },
          { titel: "Netflix Partner Help Center – Kamera-/Produktionsrichtlinien", url: "https://partnerhelp.netflixstudios.com/" }
        ]
      },
      {
        id: "licht",
        titel: "Licht: 3-Punkt-Licht & Lichtstimmung",
        level: "basis",
        inhalt: `
<p>Licht ist das wichtigste Gestaltungsmittel – Color Grading kann schlechtes Licht kaum retten. Die Grundlage ist das <strong>3-Punkt-Licht</strong>:</p>
<ul>
<li><strong>Key Light (Führungslicht):</strong> Hauptlichtquelle, meist 30–45° seitlich vor der Person.</li>
<li><strong>Fill Light (Aufhelllicht):</strong> gegenüber, schwächer – hellt die Schatten auf.</li>
<li><strong>Back Light / Rim Light (Spitzlicht):</strong> von hinten oben – trennt die Person vom Hintergrund.</li>
</ul>
<h3>Lichtverhältnis (Contrast Ratio)</h3>
<p>Das Verhältnis Key : Fill bestimmt die Stimmung:</p>
<ul>
<li><strong>High Key</strong> (z. B. 1:1 bis 2:1): hell, wenig Schatten – Komödie, Werbung, Beauty.</li>
<li><strong>Low Key</strong> (z. B. 8:1 und mehr): viel Schatten – Thriller, Drama, Film noir.</li>
</ul>
<h3>Hartes vs. weiches Licht</h3>
<p>Je <strong>größer</strong> die Lichtquelle im Verhältnis zum Motiv, desto <strong>weicher</strong> die Schatten. Softbox, Diffusor oder ein bewölkter Himmel = weich. Nackte Glühbirne, Mittagssonne = hart.</p>
<h3>Farbtemperatur</h3>
<table>
<tr><th>Lichtquelle</th><th>Kelvin (ca.)</th></tr>
<tr><td>Kerze</td><td>1.900 K</td></tr>
<tr><td>Glühbirne / Tungsten</td><td>3.200 K</td></tr>
<tr><td>Tageslicht Mittag</td><td>5.600 K</td></tr>
<tr><td>Bewölkter Himmel / Schatten</td><td>6.500–7.500 K</td></tr>
</table>
<p>Der <strong>Weißabgleich</strong> der Kamera sagt ihr, welche Farbe „weiß“ ist. Bewusster Mix (warmes Lampenlicht innen + kaltes Fensterlicht) erzeugt schon vor dem Grading einen Look.</p>
<h3>Motiviertes Licht</h3>
<p>Im Film soll Licht eine glaubhafte Quelle haben (Fenster, Lampe, Bildschirm). Profis setzen ihre Lampen so, dass sie diese Quelle „nachbauen“.</p>
<div class="box tip"><h4>Ohne Equipment</h4>Ein Fenster ist die beste kostenlose Softbox. Person seitlich ans Fenster setzen (Key), weiße Wand oder Styroporplatte gegenüber als Fill.</div>
`,
        aufgabe: "Baue mit Fenster + Schreibtischlampe + weißem Karton ein 3-Punkt-Licht. Mache je ein Foto als High Key und als Low Key.",
        quiz: [
          { frage: "Welches Licht trennt die Person vom Hintergrund?", antworten: ["Key", "Fill", "Back Light", "Practical"], richtig: 2, erklaerung: "Das Back/Rim Light zeichnet eine helle Kante um Haare und Schultern." },
          { frage: "Was macht Licht weicher?", antworten: ["Kleinere Quelle", "Größere Quelle relativ zum Motiv", "Höhere Kelvin-Zahl", "Mehr ISO"], richtig: 1, erklaerung: "Große Lichtquellen erzeugen weiche Schattenübergänge." },
          { frage: "Welche Farbtemperatur hat Tageslicht ungefähr?", antworten: ["1.900 K", "3.200 K", "5.600 K", "10.000 K"], richtig: 2, erklaerung: "Tageslicht wird mit ca. 5.600 K angegeben." }
        ],
        quellen: [
          { titel: "Wikipedia – Three-point lighting", url: "https://en.wikipedia.org/wiki/Three-point_lighting" },
          { titel: "Wikipedia – Farbtemperatur", url: "https://de.wikipedia.org/wiki/Farbtemperatur" },
          { titel: "StudioBinder – Film Lighting Techniques", url: "https://www.studiobinder.com/blog/film-lighting-techniques/" }
        ]
      },
      {
        id: "schnitt",
        titel: "Montage & Schnitttheorie",
        level: "vertiefung",
        inhalt: `
<p>Schnitt ist nicht „Fehler rausschneiden“, sondern <strong>Bedeutung erzeugen</strong>. Zwei Bilder hintereinander ergeben eine dritte Aussage.</p>
<h3>Kuleschow-Effekt</h3>
<p>Der sowjetische Filmemacher Lew Kuleschow zeigte in den 1920ern dasselbe neutrale Gesicht nach einem Teller Suppe, einem Sarg und einem spielenden Kind. Das Publikum las jedes Mal eine andere Emotion hinein. <em>Kontext entsteht durch den Schnitt.</em></p>
<h3>Continuity Editing (unsichtbarer Schnitt)</h3>
<ul>
<li><strong>180°-Regel:</strong> Zwischen zwei Figuren verläuft eine gedachte Achse. Bleibt die Kamera auf einer Seite, behalten die Figuren ihre Blickrichtung. Ein „Achsensprung“ verwirrt.</li>
<li><strong>Match on Action:</strong> Auf einer Bewegung schneiden (Tür öffnen in der Totale → Hand an der Klinke im Detail). Der Schnitt verschwindet in der Bewegung.</li>
<li><strong>Eyeline Match:</strong> Figur schaut → Schnitt auf das, was sie sieht.</li>
<li><strong>30°-Regel:</strong> Zwischen zwei Einstellungen desselben Motivs die Kamera mindestens ~30° versetzen oder die Größe deutlich ändern, sonst wirkt es wie ein Jump Cut.</li>
</ul>
<h3>Schnitttechniken</h3>
<table>
<tr><th>Technik</th><th>Beschreibung</th></tr>
<tr><td>J-Cut</td><td>Ton der nächsten Szene beginnt vor dem Bild.</td></tr>
<tr><td>L-Cut</td><td>Ton der aktuellen Szene läuft unter dem nächsten Bild weiter.</td></tr>
<tr><td>Match Cut</td><td>Zwei ähnliche Formen/Bewegungen verbinden (Knochen → Raumschiff in „2001“).</td></tr>
<tr><td>Jump Cut</td><td>Sprung innerhalb einer Einstellung – Vlog-Stil, Ungeduld, Energie.</td></tr>
<tr><td>Cross Cutting / Parallelmontage</td><td>Zwischen zwei gleichzeitigen Handlungen wechseln – Spannung.</td></tr>
<tr><td>Montage-Sequenz</td><td>Zeitraffung durch viele kurze Bilder (Trainingsmontage).</td></tr>
<tr><td>Smash Cut</td><td>Abrupter Wechsel von laut zu leise oder umgekehrt.</td></tr>
</table>
<h3>Walter Murchs „Rule of Six“</h3>
<p>Der Cutter von „Apocalypse Now“ gewichtet in seinem Buch <em>In the Blink of an Eye</em> die Gründe für einen Schnitt: <strong>Emotion (51 %)</strong>, Story (23 %), Rhythmus (10 %), Blickführung (7 %), 2D-Bildebene (5 %), 3D-Raum (4 %). Emotion schlägt alles.</p>
<div class="box tip"><h4>Für Reels</h4>J- und L-Cuts mit Musik machen Edits viel flüssiger. Schneide auf den Beat, aber nicht <em>jeden</em> Beat – Variation hält Spannung.</div>
`,
        aufgabe: "Schneide eine 30-Sekunden-Szene zweimal: einmal nur harte Schnitte, einmal mit J-/L-Cuts und Match on Action. Was wirkt professioneller?",
        quiz: [
          { frage: "Beim J-Cut …", antworten: ["läuft der alte Ton weiter", "beginnt der neue Ton vor dem Bild", "wird auf Schwarz geblendet", "springt die Kamera über die Achse"], richtig: 1, erklaerung: "Die Form des J: Audio (unten) ragt nach vorne." },
          { frage: "Was ist laut Walter Murch der wichtigste Schnittgrund?", antworten: ["Rhythmus", "Story", "Emotion", "Blickführung"], richtig: 2, erklaerung: "Emotion mit 51 %." },
          { frage: "Was beschreibt der Kuleschow-Effekt?", antworten: ["Farbwirkung", "Bedeutung entsteht durch Bildfolge", "Tonversatz", "Bewegungsunschärfe"], richtig: 1, erklaerung: "Das gleiche Gesicht wirkt je nach vorherigem Bild anders." }
        ],
        quellen: [
          { titel: "Wikipedia – Kuleschow-Effekt", url: "https://de.wikipedia.org/wiki/Kuleschow-Effekt" },
          { titel: "Wikipedia – 180-Grad-Regel", url: "https://de.wikipedia.org/wiki/180-Grad-Regel" },
          { titel: "Walter Murch – In the Blink of an Eye (Buch)", url: "https://en.wikipedia.org/wiki/In_the_Blink_of_an_Eye_(Murch_book)" },
          { titel: "Every Frame a Painting (YouTube, Video-Essays zu Schnitt)", url: "https://www.youtube.com/user/everyframeapainting" }
        ]
      },
      {
        id: "ton",
        titel: "Ton & Sounddesign",
        level: "basis",
        inhalt: `
<p>Ein alter Satz an Filmschulen: <strong>„Das Publikum verzeiht schlechtes Bild, aber keinen schlechten Ton.“</strong></p>
<h3>Die Tonebenen</h3>
<ul>
<li><strong>Dialog / O-Ton</strong> – am wichtigsten, muss immer verständlich sein.</li>
<li><strong>Atmo (Ambience)</strong> – Raumklang (Stadt, Wald, Büro). Ohne Atmo klingen Schnitte „löchrig“.</li>
<li><strong>Foley / Geräusche</strong> – Schritte, Kleidung, Gegenstände, oft nachträglich aufgenommen.</li>
<li><strong>Sound Effects (SFX)</strong> – Whooshes, Impacts, Risers.</li>
<li><strong>Musik</strong> – Score oder Songs.</li>
</ul>
<h3>Aufnahme-Praxis</h3>
<ul>
<li>Mikrofon so <strong>nah</strong> wie möglich an die Quelle (Ansteck- oder Richtmikro statt Kamera-Mikro).</li>
<li>Pegel: Sprache etwa bei <strong>−12 dBFS</strong> aussteuern, Spitzen nie über 0 dBFS (Clipping ist nicht reparierbar).</li>
<li>Immer 30 Sekunden <strong>Raumton</strong> aufnehmen – zum Füllen von Lücken.</li>
</ul>
<h3>Lautheit für Social Media</h3>
<p>Plattformen normalisieren die Lautstärke. Ein gängiger Zielwert für Social/Streaming liegt bei etwa <strong>−14 LUFS</strong> integriert, mit True Peak unter −1 dBTP. Musik unter Sprache etwa 15–20 dB leiser mischen („Ducking“).</p>
`,
        aufgabe: "Nimm denselben Satz einmal mit dem Kamera-/Handy-Mikro aus 2 m und einmal mit dem Handy nah am Mund (als Rekorder) auf. Vergleiche.",
        quiz: [
          { frage: "Was ist Atmo?", antworten: ["Musik", "Raumklang/Umgebungsgeräusch", "Sprachaufnahme", "Kompressor"], richtig: 1, erklaerung: "Atmo = die Klangkulisse eines Ortes." },
          { frage: "Ab welchem Pegel entsteht digitales Clipping?", antworten: ["−12 dBFS", "−6 dBFS", "0 dBFS", "−20 dBFS"], richtig: 2, erklaerung: "0 dBFS ist das digitale Maximum." }
        ],
        quellen: [
          { titel: "Wikipedia – Foley", url: "https://de.wikipedia.org/wiki/Ger%C3%A4uschemacher" },
          { titel: "Wikipedia – LUFS / Lautheit (EBU R 128)", url: "https://de.wikipedia.org/wiki/EBU_R_128" }
        ]
      },
      {
        id: "dramaturgie",
        titel: "Dramaturgie, Storyboard & Shotlist",
        level: "vertiefung",
        inhalt: `
<h3>Drei-Akt-Struktur</h3>
<ol>
<li><strong>Exposition (ca. 25 %)</strong> – Figur, Welt, Wunsch. Endet mit dem <em>Plot Point 1</em> (auslösendes Ereignis).</li>
<li><strong>Konfrontation (ca. 50 %)</strong> – Hindernisse, Midpoint, Eskalation. Endet mit dem Tiefpunkt.</li>
<li><strong>Auflösung (ca. 25 %)</strong> – Klimax und neue Normalität.</li>
</ol>
<p>Auch ein 30-Sekunden-Reel hat eine Mini-Dramaturgie: <strong>Hook → Spannung/Inhalt → Payoff</strong>.</p>
<h3>Show, don't tell</h3>
<p>Zeige Gefühle durch Handlung und Bild, statt sie aussprechen zu lassen. Ein zitternder Kaffeebecher erzählt mehr als „Ich bin nervös“.</p>
<h3>Vorbereitung wie am Set</h3>
<ul>
<li><strong>Treatment</strong> – die Geschichte in Prosa (1–3 Seiten).</li>
<li><strong>Drehbuch</strong> – Szenenköpfe (INNEN/AUSSEN – ORT – TAG/NACHT), Handlung, Dialog.</li>
<li><strong>Storyboard</strong> – gezeichnete Einstellungen (Strichmännchen reichen!).</li>
<li><strong>Shotlist</strong> – Tabelle: Nr., Einstellungsgröße, Bewegung, Objektiv, Inhalt, Dauer.</li>
<li><strong>Drehplan</strong> – Reihenfolge nach Ort/Licht, nicht nach Story.</li>
</ul>
<h3>Heldenreise (Campbell / Vogler)</h3>
<p>Gewöhnliche Welt → Ruf des Abenteuers → Weigerung → Mentor → Schwelle → Prüfungen → Krise → Belohnung → Rückkehr. Viele Blockbuster folgen dieser Struktur.</p>
`,
        aufgabe: "Schreibe für dein nächstes Reel eine Shotlist mit mindestens 6 Einstellungen inkl. Hook-Shot. Zeichne ein Mini-Storyboard dazu.",
        quiz: [
          { frage: "Was gehört in eine Shotlist?", antworten: ["Nur Dialog", "Einstellungsgröße, Bewegung, Inhalt", "Budget", "Musikrechte"], richtig: 1, erklaerung: "Die Shotlist beschreibt jede geplante Einstellung technisch." },
          { frage: "'Show, don't tell' bedeutet …", antworten: ["Mehr Dialog", "Gefühle durch Handlung/Bild zeigen", "Text einblenden", "Off-Sprecher nutzen"], richtig: 1, erklaerung: "Visuelles Erzählen statt Erklären." }
        ],
        quellen: [
          { titel: "Wikipedia – Drei-Akt-Struktur", url: "https://de.wikipedia.org/wiki/Drei-Akt-Struktur" },
          { titel: "Wikipedia – Heldenreise", url: "https://de.wikipedia.org/wiki/Heldenreise" },
          { titel: "StudioBinder – How to Make a Shot List", url: "https://www.studiobinder.com/blog/how-to-make-a-shot-list/" }
        ]
      }
    ]
  },

  /* ================================================================
   * KURS 2 – COLOR GRADING
   * ================================================================ */
  {
    id: "color",
    icon: "🎨",
    titel: "Color Grading",
    beschreibung: "Von Farbkorrektur und Scopes über Log/LUTs und Farbräume bis zu eigenen Looks – Basis und Profi-Workflow.",
    lektionen: [
      {
        id: "correction-vs-grading",
        titel: "Farbkorrektur vs. Color Grading",
        level: "basis",
        inhalt: `
<p>Zwei Schritte, die oft verwechselt werden:</p>
<table>
<tr><th></th><th>Color Correction (Korrektur)</th><th>Color Grading (Gestaltung)</th></tr>
<tr><td>Ziel</td><td>Technisch richtig, neutral, einheitlich</td><td>Stimmung, Stil, Story</td></tr>
<tr><td>Was?</td><td>Belichtung, Weißabgleich, Kontrast, Shot-Matching</td><td>Look, Farbharmonie, Akzente</td></tr>
<tr><td>Frage</td><td>„Sieht es echt aus?“</td><td>„Wie soll es sich anfühlen?“</td></tr>
</table>
<h3>Die Reihenfolge eines Profi-Gradings</h3>
<ol>
<li><strong>Normalisieren</strong> – Log/RAW in einen Ausgabefarbraum bringen (Color Space Transform oder LUT).</li>
<li><strong>Primärkorrektur</strong> – Belichtung, Weißabgleich, Kontrast.</li>
<li><strong>Shot Matching</strong> – alle Einstellungen einer Szene angleichen.</li>
<li><strong>Sekundärkorrektur</strong> – gezielte Bereiche (Hauttöne, Himmel) per Maske/Qualifier.</li>
<li><strong>Look</strong> – kreativer Stil über alles.</li>
<li><strong>Finishing</strong> – Vignette, Grain, Schärfe, Ausgabe-Check.</li>
</ol>
<div class="box"><h4>Merksatz</h4>Erst korrigieren, dann graden. Ein Look auf ungleich belichtetem Material sieht in jeder Einstellung anders aus.</div>
<h3>Arbeitsumgebung</h3>
<ul>
<li>Bildschirm-Helligkeit nicht auf Maximum, Night-Shift/True-Tone <strong>aus</strong>.</li>
<li>Neutraler, gedimmter Raum – grelle Wände verfälschen die Wahrnehmung.</li>
<li>Den Augen nicht trauen: <strong>Scopes</strong> lügen nicht (nächste Lektion).</li>
<li>Für Instagram: das fertige Video immer auch auf dem Handy prüfen.</li>
</ul>
`,
        aufgabe: "Nimm 3 Clips aus verschiedenen Situationen. Korrigiere sie nur neutral (kein Look!), bis Weiß weiß ist und Hauttöne natürlich wirken.",
        quiz: [
          { frage: "Was kommt zuerst?", antworten: ["Look", "Grain", "Primärkorrektur", "Vignette"], richtig: 2, erklaerung: "Erst technisch korrigieren, dann kreativ graden." },
          { frage: "Shot Matching bedeutet …", antworten: ["Clips synchronisieren", "Clips einer Szene farblich angleichen", "Clips zuschneiden", "LUT exportieren"], richtig: 1, erklaerung: "Alle Einstellungen sollen wie aus einem Guss wirken." }
        ],
        quellen: [
          { titel: "Blackmagic Design – DaVinci Resolve Training (kostenlose Bücher & Kurse)", url: "https://www.blackmagicdesign.com/products/davinciresolve/training" },
          { titel: "Mixing Light – Profi-Colorist-Tutorials", url: "https://mixinglight.com/" }
        ]
      },
      {
        id: "scopes",
        titel: "Scopes lesen: Waveform, Parade, Vectorscope",
        level: "basis",
        inhalt: `
<p>Scopes zeigen das Bild als Messdaten. Sie sind wichtiger als das Auge, weil sich das Auge an Farbstiche gewöhnt.</p>
<h3>Waveform (Luma)</h3>
<p>Horizontal = Position im Bild (links→rechts), vertikal = Helligkeit (unten 0 = Schwarz, oben 100 bzw. 1023 = Weiß).</p>
<ul>
<li>Alles klebt unten → unterbelichtet. Alles klebt oben → überbelichtet / abgeschnitten (Clipping).</li>
<li>Gesunder Kontrast nutzt den Bereich gut aus, ohne hart abzuschneiden.</li>
<li>Hauttöne liegen grob im Bereich 40–70 % (je nach Hauttyp und Stimmung).</li>
</ul>
<h3>RGB-Parade</h3>
<p>Drei Waveforms nebeneinander für Rot, Grün, Blau. Bei einer <strong>neutralen</strong> Fläche (weiße Wand, graues Shirt) müssen alle drei auf gleicher Höhe liegen. Ist Blau höher → Blaustich.</p>
<h3>Vectorscope</h3>
<p>Ein Farbkreis: Der Winkel ist der Farbton, der Abstand zur Mitte die Sättigung.</p>
<ul>
<li>Neutrales Bild = Wolke in der Mitte.</li>
<li><strong>Skin Tone Line</strong> (Hautton-Linie): zeigt zwischen Rot und Gelb. Hauttöne aller Ethnien liegen – unterschiedlich hell, aber im Farbton – sehr nah an dieser Linie.</li>
<li>Ausschlag weit nach außen = zu gesättigt.</li>
</ul>
<h3>Histogramm</h3>
<p>Zeigt, wie viele Pixel welche Helligkeit haben – aber nicht <em>wo</em> im Bild. Für Video ist die Waveform daher praktischer.</p>
<div class="box tip"><h4>Ausprobieren</h4>Im <a href="#/labor">Grading-Labor</a> dieser Plattform kannst du ein eigenes Bild laden und Waveform, Parade und Vectorscope live beobachten, während du Regler bewegst.</div>
`,
        aufgabe: "Lade im Grading-Labor ein Foto mit Person. Bringe die Hauttöne auf die Hautton-Linie und kontrolliere mit der Parade, ob ein weißes Objekt neutral ist.",
        quiz: [
          { frage: "Was zeigt die vertikale Achse der Waveform?", antworten: ["Farbton", "Helligkeit", "Bildposition", "Sättigung"], richtig: 1, erklaerung: "Unten Schwarz, oben Weiß." },
          { frage: "In der RGB-Parade ist bei einer weißen Wand Blau höher als Rot und Grün. Das bedeutet:", antworten: ["Rotstich", "Blaustich", "Überbelichtung", "Alles korrekt"], richtig: 1, erklaerung: "Ungleich hohe Kanäle bei neutralen Flächen = Farbstich." },
          { frage: "Wo liegen Hauttöne im Vectorscope?", antworten: ["Mitte", "Richtung Cyan", "Auf der Linie zwischen Rot und Gelb", "Richtung Blau"], richtig: 2, erklaerung: "Die Skin Tone Line / I-Line." }
        ],
        quellen: [
          { titel: "Blackmagic – DaVinci Resolve Colorist Guide (Kapitel Scopes)", url: "https://www.blackmagicdesign.com/products/davinciresolve/training" },
          { titel: "Frame.io Insider – Video Scopes erklärt", url: "https://blog.frame.io/" },
          { titel: "Wikipedia – Vectorscope", url: "https://en.wikipedia.org/wiki/Vectorscope" }
        ]
      },
      {
        id: "primaries",
        titel: "Primärkorrektur: Lift, Gamma, Gain & Kurven",
        level: "basis",
        inhalt: `
<p>Die drei klassischen <strong>Color Wheels</strong> wirken auf verschiedene Helligkeitsbereiche:</p>
<table>
<tr><th>Rad</th><th>Bereich</th><th>Typischer Einsatz</th></tr>
<tr><td><strong>Lift</strong></td><td>Schatten / Schwarz</td><td>Schwarzwert setzen, kühle/warme Schatten</td></tr>
<tr><td><strong>Gamma</strong></td><td>Mitteltöne</td><td>Gesamthelligkeit, Hauttöne</td></tr>
<tr><td><strong>Gain</strong></td><td>Lichter / Weiß</td><td>Weißpunkt, Highlights</td></tr>
<tr><td><strong>Offset</strong></td><td>Alles gleichmäßig</td><td>Belichtung & Weißabgleich global (v. a. bei Log)</td></tr>
</table>
<p>Jedes Rad hat einen <strong>Helligkeitsregler</strong> und einen <strong>Farbpunkt</strong>. Schiebst du den Farbpunkt Richtung Blau, wird der Bereich blauer (und gelber Stich wird neutralisiert – Komplementärfarben!).</p>
<h3>Komplementärfarben – das Grundgesetz</h3>
<p>Rot ↔ Cyan · Grün ↔ Magenta · Blau ↔ Gelb. Einen Stich entfernst du, indem du die Gegenfarbe hinzufügst.</p>
<h3>Kurven</h3>
<ul>
<li><strong>S-Kurve</strong> auf Luma: Schatten runter, Lichter hoch → mehr Kontrast.</li>
<li>Untersten Punkt anheben → „gefadete“, milchige Schwarztöne (Film-/Vintage-Look).</li>
<li><strong>Hue vs. Sat / Hue vs. Hue</strong> – einzelne Farben gezielt entsättigen oder verschieben (z. B. Grün Richtung Teal).</li>
</ul>
<h3>Reihenfolge in der Praxis</h3>
<ol>
<li>Schwarz- und Weißpunkt setzen (Waveform).</li>
<li>Weißabgleich (Parade: neutrale Fläche angleichen).</li>
<li>Mitteltöne / Hauttöne (Gamma, Vectorscope).</li>
<li>Sättigung moderat anpassen.</li>
</ol>
`,
        aufgabe: "Erstelle im Grading-Labor nur mit Lift/Gamma/Gain einen Look mit kühlen Schatten und warmen Lichtern. Notiere deine Werte.",
        quiz: [
          { frage: "Welches Rad beeinflusst vor allem die Mitteltöne?", antworten: ["Lift", "Gamma", "Gain", "Offset"], richtig: 1, erklaerung: "Gamma = Midtones." },
          { frage: "Das Bild hat einen Grünstich. Welche Farbe fügst du hinzu?", antworten: ["Gelb", "Cyan", "Magenta", "Blau"], richtig: 2, erklaerung: "Magenta ist die Komplementärfarbe zu Grün." },
          { frage: "Eine S-Kurve bewirkt …", antworten: ["weniger Kontrast", "mehr Kontrast", "mehr Sättigung", "Weißabgleich"], richtig: 1, erklaerung: "Schatten dunkler, Lichter heller." }
        ],
        quellen: [
          { titel: "Blackmagic – DaVinci Resolve Training", url: "https://www.blackmagicdesign.com/products/davinciresolve/training" },
          { titel: "Wikipedia – Komplementärfarbe", url: "https://de.wikipedia.org/wiki/Komplement%C3%A4rfarbe" }
        ]
      },
      {
        id: "log-lut",
        titel: "Log-Material, LUTs & Farbräume",
        level: "vertiefung",
        inhalt: `
<h3>Warum Log so grau aussieht</h3>
<p>Log-Kurven „stauchen“ einen großen Dynamikumfang (12–15+ Blendenstufen) in die verfügbaren Bits. Das Bild wirkt flach – es muss erst in einen Anzeigefarbraum wie <strong>Rec.709</strong> transformiert werden.</p>
<h3>Farbraum & Gamma</h3>
<ul>
<li><strong>Farbraum (Gamut):</strong> welche Farben darstellbar sind – z. B. Rec.709 (HD-TV, Web), Rec.2020 (HDR), DCI-P3 (Kino, viele Handys), Sony S-Gamut3, ARRI Wide Gamut, DaVinci Wide Gamut.</li>
<li><strong>Gamma / Transferfunktion:</strong> wie Helligkeit kodiert ist – z. B. Gamma 2.4, sRGB, S-Log3, LogC, HLG, PQ.</li>
</ul>
<h3>LUTs (Look-Up Tables)</h3>
<p>Eine LUT ist eine Tabelle: „Eingangsfarbe X wird zu Ausgangsfarbe Y“.</p>
<ul>
<li><strong>Technische LUT / Conversion LUT:</strong> wandelt z. B. S-Log3 → Rec.709 (vom Kamerahersteller).</li>
<li><strong>Kreative LUT:</strong> ein Look (Film-Emulation, Teal & Orange …).</li>
</ul>
<div class="box"><h4>Wichtig</h4>LUTs sind <strong>keine Zauberfilter</strong>. Sie erwarten korrekt belichtetes Material im passenden Farbraum. Erst korrigieren, dann LUT – und LUT ggf. nur mit 50–70 % Deckkraft nutzen.</div>
<h3>Farbmanagement-Workflows</h3>
<ul>
<li><strong>Display-referred:</strong> Du gradest direkt im Ausgabefarbraum (Rec.709). Einfach, aber Regler verhalten sich bei Log unnatürlich.</li>
<li><strong>Scene-referred:</strong> Material wird in einen großen Arbeitsfarbraum (z. B. DaVinci Wide Gamut/Intermediate oder <strong>ACES</strong>) übersetzt, gegradet und erst am Ende für die Ausgabe konvertiert. Profi-Standard – Material verschiedener Kameras passt besser zusammen.</li>
</ul>
<h3>Handy-Footage</h3>
<p>iPhones ab 15 Pro filmen in <strong>Apple Log</strong>, viele Android-Flaggschiffe haben ebenfalls Log-Modi. Normales Handy-Video ist meist schon Rec.709 (oder HDR/HLG – Vorsicht: HDR-Clips sehen in SDR-Projekten oft falsch aus).</p>
`,
        aufgabe: "Falls du Log-Material hast: Konvertiere einen Clip einmal mit LUT und einmal per Color Space Transform (DaVinci Resolve). Vergleiche, wie sich die Regler danach verhalten.",
        quiz: [
          { frage: "Wozu dient eine technische LUT?", antworten: ["Kreativer Look", "Umrechnung z. B. Log → Rec.709", "Ton normalisieren", "Rauschen entfernen"], richtig: 1, erklaerung: "Conversion LUTs transformieren zwischen Farbräumen." },
          { frage: "Welcher Farbraum ist Standard für HD/Web (SDR)?", antworten: ["Rec.2020", "Rec.709", "ACES AP0", "S-Gamut3"], richtig: 1, erklaerung: "Rec.709 ist der HD-Standard." },
          { frage: "ACES ist …", antworten: ["Ein Kamerahersteller", "Ein Farbmanagement-System der Filmindustrie", "Ein Codec", "Eine LUT-Sammlung"], richtig: 1, erklaerung: "Academy Color Encoding System – von der Oscar-Akademie entwickelt." }
        ],
        quellen: [
          { titel: "ACES Central – Academy Color Encoding System", url: "https://acescentral.com/" },
          { titel: "Wikipedia – Rec. 709", url: "https://en.wikipedia.org/wiki/Rec._709" },
          { titel: "Cullen Kelly (YouTube) – Farbmanagement & Look Development", url: "https://www.youtube.com/@CullenKelly" },
          { titel: "Netflix Partner Help Center – Color Managed Workflow", url: "https://partnerhelp.netflixstudios.com/" }
        ]
      },
      {
        id: "secondaries",
        titel: "Sekundärkorrektur: Qualifier, Masken, Hauttöne",
        level: "vertiefung",
        inhalt: `
<p>Sekundärkorrekturen betreffen nur einen <strong>Teil</strong> des Bildes.</p>
<h3>Werkzeuge</h3>
<ul>
<li><strong>Qualifier (HSL-Keyer):</strong> wählt Pixel nach Farbton, Sättigung, Helligkeit aus – z. B. „nur der Himmel“ oder „nur Haut“.</li>
<li><strong>Power Windows / Masken:</strong> Kreise, Rechtecke, Formen. Mit weicher Kante (Softness) und <strong>Tracking</strong>, damit sie dem Motiv folgen.</li>
<li><strong>Magic Mask / Objektmasken (KI):</strong> erkennt Personen, Gesichter, Objekte automatisch.</li>
<li><strong>Hue-Kurven:</strong> Farbbereich verschieben ohne Maske.</li>
</ul>
<h3>Typische Aufgaben</h3>
<ul>
<li>Gesicht leicht aufhellen (Kreis-Maske + Gamma), damit der Blick dorthin geht.</li>
<li>Himmel blauer/dunkler (Verlaufsmaske).</li>
<li>Grüne Vegetation Richtung Teal/Oliv drehen.</li>
<li>Hauttöne isolieren und vor dem Look „schützen“.</li>
<li><strong>Vignette</strong> – Ränder subtil abdunkeln, lenkt den Blick zur Mitte.</li>
</ul>
<h3>Hauttöne</h3>
<p>Menschen reagieren extrem empfindlich auf falsche Hautfarben. Selbst in starken Looks sollten Hauttöne nahe der Hautton-Linie bleiben. Leicht wärmere, gesättigtere Haut wirkt gesund; grünliche oder magenta Haut wirkt krank.</p>
<h3>Node-Struktur (DaVinci Resolve)</h3>
<p>Resolve arbeitet mit <strong>Nodes</strong> – jeder Schritt ein Baustein. Eine bewährte Grundstruktur:</p>
<pre>[CST in] → [Belichtung] → [Weißabgleich] → [Kontrast] → [Sat] → [Haut-Qualifier] → [Look] → [Vignette] → [CST out]</pre>
`,
        aufgabe: "Gesicht in einem Clip mit getrackter Kreismaske um ca. 1/3 Blende aufhellen. Zusätzlich: Hintergrund leicht entsättigen.",
        quiz: [
          { frage: "Womit wählst du Pixel nach Farbe aus?", antworten: ["Power Window", "Qualifier", "Offset", "LUT"], richtig: 1, erklaerung: "Der Qualifier (HSL-Keyer) wählt nach Farbton/Sättigung/Helligkeit." },
          { frage: "Warum trackt man Masken?", antworten: ["Für Ton-Sync", "Damit sie dem Motiv folgen", "Für Export", "Für Rauschreduzierung"], richtig: 1, erklaerung: "Sonst bleibt die Maske stehen, während sich die Person bewegt." }
        ],
        quellen: [
          { titel: "Blackmagic – DaVinci Resolve Colorist Guide", url: "https://www.blackmagicdesign.com/products/davinciresolve/training" },
          { titel: "Darren Mostyn (YouTube) – DaVinci Resolve Tutorials", url: "https://www.youtube.com/@DarrenMostyn" }
        ]
      },
      {
        id: "looks",
        titel: "Looks entwickeln: Farbharmonie & Filmlook",
        level: "vertiefung",
        inhalt: `
<h3>Farbharmonien</h3>
<ul>
<li><strong>Komplementär:</strong> zwei Gegenfarben – <em>Teal & Orange</em> ist der Blockbuster-Klassiker (Haut = Orange, Schatten/Hintergrund = Teal).</li>
<li><strong>Analog:</strong> benachbarte Farben – ruhig, harmonisch (z. B. Gelb-Orange-Rot).</li>
<li><strong>Monochrom:</strong> ein Farbton dominiert – stark stilisiert (z. B. grün in „Matrix“).</li>
<li><strong>Triadisch:</strong> drei gleich verteilte Farben – bunt, verspielt.</li>
</ul>
<h3>Farbpsychologie (kulturell geprägt, nicht absolut)</h3>
<table>
<tr><th>Farbe</th><th>Häufige Wirkung im Film</th></tr>
<tr><td>Warm (Orange/Gelb)</td><td>Nostalgie, Geborgenheit, Hitze</td></tr>
<tr><td>Kalt (Blau/Teal)</td><td>Distanz, Nacht, Technik, Melancholie</td></tr>
<tr><td>Grün</td><td>Natur – oder Krankheit, Künstlichkeit</td></tr>
<tr><td>Rot</td><td>Gefahr, Leidenschaft, Gewalt</td></tr>
<tr><td>Entsättigt</td><td>Härte, Realismus, Krieg</td></tr>
</table>
<h3>Was macht den „Filmlook“ aus?</h3>
<ul>
<li>Weiches <strong>Highlight-Roll-off</strong> statt hart abgeschnittener Lichter.</li>
<li>Leicht angehobene oder getönte Schwarztöne.</li>
<li>Farbtrennung: Haut und Hintergrund unterscheiden sich farblich.</li>
<li>Subtil reduzierte Sättigung in Extremen (Lichter/Schatten).</li>
<li><strong>Grain</strong>, leichte <strong>Halation</strong> (rötlicher Schimmer um Lichter), evtl. Bloom.</li>
<li>Nicht vergessen: 24 fps, 180°-Shutter, gutes Licht – Grading allein macht keinen Kinolook.</li>
</ul>
<h3>Look-Development-Methode</h3>
<ol>
<li><strong>Referenzen sammeln</strong> – Stills aus Filmen (z. B. über Shotdeck oder FILMGRAB).</li>
<li>Mood definieren: 3 Adjektive („kalt, einsam, ruhig“).</li>
<li>Look auf einer Hauptszene bauen, dann auf andere übertragen.</li>
<li><strong>Weniger ist mehr</strong> – nach 10 Minuten Pause noch mal mit frischen Augen ansehen.</li>
</ol>
`,
        aufgabe: "Suche dir 3 Stills aus einem Lieblingsfilm. Baue den Look im Grading-Labor nach und speichere einen Screenshot neben dem Original.",
        quiz: [
          { frage: "Teal & Orange ist welche Farbharmonie?", antworten: ["Analog", "Monochrom", "Komplementär", "Triadisch"], richtig: 2, erklaerung: "Teal und Orange liegen sich im Farbkreis gegenüber." },
          { frage: "Was ist Halation?", antworten: ["Bildrauschen", "Rötlicher Schimmer um helle Lichter (Film-Artefakt)", "Verzerrung", "Bewegungsunschärfe"], richtig: 1, erklaerung: "Entsteht beim analogen Film durch Lichtreflexion im Trägermaterial." }
        ],
        quellen: [
          { titel: "FILMGRAB – Filmstills als Referenz", url: "https://film-grab.com/" },
          { titel: "ShotDeck – Profi-Referenzdatenbank", url: "https://shotdeck.com/" },
          { titel: "No Film School – Color Grading Artikel", url: "https://nofilmschool.com/" },
          { titel: "Wikipedia – Teal and orange", url: "https://en.wikipedia.org/wiki/Teal_and_orange" }
        ]
      },
      {
        id: "handy-grading",
        titel: "Grading am Handy (Edits, CapCut, Lightroom)",
        level: "praxis",
        inhalt: `
<p>Viele Prinzipien aus Resolve funktionieren auch in Handy-Apps – nur mit einfacheren Reglern. So übersetzt du sie:</p>
<table>
<tr><th>Profi-Begriff</th><th>Typischer App-Regler</th></tr>
<tr><td>Offset / Belichtung</td><td>Helligkeit / Belichtung</td></tr>
<tr><td>Lift</td><td>Schatten / Schwarz</td></tr>
<tr><td>Gain</td><td>Lichter / Weiß</td></tr>
<tr><td>S-Kurve</td><td>Kontrast (oder Kurven, falls vorhanden)</td></tr>
<tr><td>Weißabgleich</td><td>Temperatur (blau↔gelb) & Tönung (grün↔magenta)</td></tr>
<tr><td>Sättigung</td><td>Sättigung / Dynamik (Vibrance schont Hauttöne)</td></tr>
<tr><td>Hue vs. Sat</td><td>HSL / Farbmixer (falls vorhanden)</td></tr>
</table>
<h3>Handy-Grading-Rezept</h3>
<ol>
<li><strong>Belichtung</strong> so, dass das Gesicht gut sichtbar ist.</li>
<li><strong>Lichter</strong> runter (Himmel/Fenster zurückholen), <strong>Schatten</strong> leicht hoch.</li>
<li><strong>Temperatur/Tönung</strong> bis Weiß neutral wirkt.</li>
<li><strong>Kontrast</strong> leicht hoch, <strong>Sättigung</strong> eher über „Dynamik“ statt „Sättigung“.</li>
<li>Erst dann Filter/Look – Filter-Stärke meist auf 30–60 % reduzieren.</li>
<li>Auf <strong>allen Clips gleich</strong> anwenden (Einstellungen kopieren/„auf alle anwenden“) und Ausreißer einzeln anpassen.</li>
</ol>
<div class="box tip"><h4>Workflow-Tipp</h4>Für maximale Kontrolle: in DaVinci Resolve (kostenlos, auch fürs iPad) graden, als hochwertige Datei exportieren und dann in Edits/CapCut nur noch Text, Musik und Effekte hinzufügen.</div>
`,
        aufgabe: "Grade denselben Clip in deiner Handy-App und im Grading-Labor nach dem Rezept. Vergleiche die Ergebnisse auf dem Handy-Display.",
        quiz: [
          { frage: "Welcher Regler entspricht etwa 'Lift'?", antworten: ["Lichter", "Schatten/Schwarz", "Sättigung", "Schärfe"], richtig: 1, erklaerung: "Lift wirkt auf die dunklen Bildbereiche." },
          { frage: "Warum 'Dynamik' statt 'Sättigung'?", antworten: ["Ist schneller", "Schont bereits gesättigte Farben/Hauttöne", "Macht das Bild heller", "Entfernt Rauschen"], richtig: 1, erklaerung: "Vibrance hebt vor allem schwach gesättigte Farben an." }
        ],
        quellen: [
          { titel: "Blackmagic – DaVinci Resolve für iPad", url: "https://www.blackmagicdesign.com/products/davinciresolve" },
          { titel: "CapCut – Ressourcen & Tutorials", url: "https://www.capcut.com/resource" }
        ]
      }
    ]
  },

  /* ================================================================
   * KURS 3 – INSTAGRAM EDITS
   * ================================================================ */
  {
    id: "edits",
    icon: "📱",
    titel: "Instagram Edits & Reels",
    beschreibung: "Spezifisch für die Edits-App von Instagram (und CapCut): Format, Hook, Beat-Sync, Übergänge, Text, Green Screen, Export.",
    lektionen: [
      {
        id: "edits-app",
        titel: "Die Edits-App: Überblick & Projekt-Setup",
        level: "basis",
        inhalt: `
<p><strong>Edits</strong> ist die kostenlose Videoschnitt-App von Instagram/Meta für iOS und Android (gestartet 2025). Sie ist direkt auf Reels ausgerichtet und exportiert ohne Wasserzeichen.</p>
<h3>Funktionen (Stand 2026, je nach Gerät/Account teils schrittweise ausgerollt)</h3>
<ul>
<li>Timeline mit framegenauem Schnitt, mehreren Spuren (Video, Overlay, Text, Audio).</li>
<li>Aufnahme direkt in der App (inkl. Teleprompter-ähnlicher Funktionen je nach Version).</li>
<li><strong>Green Screen</strong> / Hintergrund ersetzen und automatische Freistellung (Cutout).</li>
<li><strong>Auto-Untertitel</strong>, Textanimationen, Schriftarten.</li>
<li>Farbanpassungen (Helligkeit, Kontrast, Sättigung, Temperatur, Lichter, Schatten …) und Filter.</li>
<li>Geschwindigkeit inkl. Speed Ramps, Übergänge, Effekte, Soundeffekte, Musikbibliothek.</li>
<li><strong>Keyframes</strong> für Position, Skalierung, Rotation (Verfügbarkeit kann variieren).</li>
<li>Export bis 4K, teils mit HDR; direkte Veröffentlichung auf Instagram/Facebook, Insights zu veröffentlichten Reels.</li>
</ul>
<div class="box"><h4>Hinweis</h4>Die App wird laufend aktualisiert. Wenn ein Werkzeug hier beschrieben ist, aber bei dir fehlt: App aktualisieren – oder es ist für deinen Account noch nicht freigeschaltet. Gleiche Funktionen findest du fast immer auch in <strong>CapCut</strong>.</div>
<h3>Projekt-Setup</h3>
<ul>
<li>Format: <strong>9:16</strong> (1080 × 1920 px).</li>
<li>Bildrate: am besten die deines Materials (meist 30 fps; 25 fps bei Kamera-Material aus Europa).</li>
<li>Material vorher sortieren: ein Album/Ordner pro Projekt.</li>
<li>Länge planen: Reels mit hoher Wiedergabequote sind oft kurz (7–30 s) – lieber kürzer und knackig.</li>
</ul>
<h3>Safe Zones (sichere Bereiche)</h3>
<p>Instagram legt Benutzername, Caption, Buttons und Musik-Info über dein Video. Wichtige Inhalte (Gesicht, Text) daher im mittleren Bereich halten:</p>
<ul>
<li>Oben ca. <strong>220–250 px</strong> frei lassen.</li>
<li>Unten ca. <strong>400–450 px</strong> frei lassen (Caption & Buttons).</li>
<li>Rechts ca. <strong>120 px</strong> frei lassen (Like/Kommentar/Teilen-Buttons).</li>
<li>Das Profilraster zeigt eine <strong>4:5- bzw. 3:4-Vorschau</strong> – das Titelbild entsprechend mittig gestalten.</li>
</ul>
`,
        aufgabe: "Lege ein Projekt in Edits an, importiere 5 Clips und richte dir eine Safe-Zone-Vorlage ein (z. B. transparentes PNG mit markierten Rändern als Overlay, das du vor dem Export ausblendest).",
        quiz: [
          { frage: "Welche Auflösung ist Standard für Reels?", antworten: ["1920 × 1080", "1080 × 1080", "1080 × 1920", "720 × 1280"], richtig: 2, erklaerung: "9:16 Hochformat in Full-HD." },
          { frage: "Wo verdeckt Instagram am meisten Fläche?", antworten: ["Oben", "Unten", "Links", "Gar nicht"], richtig: 1, erklaerung: "Unten liegen Caption, Benutzername und Audio-Info." }
        ],
        quellen: [
          { titel: "Planoly – Everything You Need to Know About Instagram's Edits App", url: "https://planoly.com/blog/instagrams-edits-app-review" },
          { titel: "Influencer Marketing Hub – Instagram Edits App", url: "https://influencermarketinghub.com/instagram-edits-app" },
          { titel: "Metricool – Best Video Editing Apps for Instagram Reels 2026", url: "https://metricool.com/video-editing-apps-for-instagram/" },
          { titel: "Instagram Hilfebereich – Reels", url: "https://help.instagram.com/" }
        ]
      },
      {
        id: "hook",
        titel: "Hook & Retention: Die ersten 3 Sekunden",
        level: "basis",
        inhalt: `
<p>Auf Instagram entscheidet sich in den ersten 1–3 Sekunden, ob jemand weiterwischt. Die Filmtheorie dahinter: <strong>Neugier erzeugen und sofort Bewegung zeigen.</strong></p>
<h3>Hook-Typen</h3>
<ul>
<li><strong>Visueller Hook:</strong> der stärkste Shot zuerst (Ergebnis zeigen, dann den Weg).</li>
<li><strong>Text-Hook:</strong> großer Satz im oberen Drittel („Dieser eine Regler verändert alles“).</li>
<li><strong>Bewegungs-Hook:</strong> schnelle Kamerabewegung, Whip Pan, Zoom-In im ersten Frame.</li>
<li><strong>Sound-Hook:</strong> markanter Sound / Beat-Drop direkt am Start.</li>
<li><strong>Before/After:</strong> ideal für Color Grading-Content.</li>
</ul>
<h3>Retention-Tricks aus dem Schnitt</h3>
<ul>
<li>Kein Intro, kein Logo am Anfang – direkt rein.</li>
<li><strong>Pattern Interrupts:</strong> alle 2–4 Sekunden eine Veränderung (Schnitt, Zoom, Text, Sound).</li>
<li>Pausen und „Ähms“ rausschneiden (Jump Cuts).</li>
<li>Den Payoff erst am Ende auflösen.</li>
<li><strong>Loop:</strong> Ende so gestalten, dass es nahtlos in den Anfang übergeht → Wiederholungen.</li>
</ul>
<div class="box tip"><h4>Analyse</h4>Edits zeigt dir bei veröffentlichten Reels Insights. Achte darauf, an welcher Sekunde die Zuschauer abspringen, und optimiere genau diesen Moment.</div>
`,
        aufgabe: "Schneide dasselbe Reel mit drei verschiedenen Hooks (visuell, Text, Before/After). Poste sie mit Abstand und vergleiche die Wiedergabequote.",
        quiz: [
          { frage: "Was ist ein Pattern Interrupt?", antworten: ["Ein Fehler im Video", "Eine bewusste Veränderung, um Aufmerksamkeit zu halten", "Ein Übergangseffekt", "Werbung"], richtig: 1, erklaerung: "Regelmäßige Reize verhindern, dass der Zuschauer abschaltet." },
          { frage: "Warum Loops?", antworten: ["Kleinere Datei", "Fördert Wiederholungen", "Bessere Farben", "Pflicht bei Instagram"], richtig: 1, erklaerung: "Nahtlose Loops werden öfter mehrfach geschaut." }
        ],
        quellen: [
          { titel: "Instagram Creators – Tipps für Reels", url: "https://creators.instagram.com/" },
          { titel: "Later – Instagram Reels Guide", url: "https://later.com/blog/instagram-reels/" }
        ]
      },
      {
        id: "beat-sync",
        titel: "Schnitt auf Musik: Beat-Sync & Rhythmus",
        level: "praxis",
        inhalt: `
<h3>Beats markieren</h3>
<ol>
<li>Musik in die Timeline legen.</li>
<li>Beats markieren – manuell beim Abspielen tippen oder (falls vorhanden) automatische Beat-Erkennung nutzen.</li>
<li>Clips an die Marker schneiden (Clipenden „snappen“ an Marker).</li>
</ol>
<h3>Rhythmus-Regeln</h3>
<ul>
<li>Nicht auf jeden Beat schneiden – auf <strong>Akzente</strong> (Snare, Drop, Gesangseinsatz) schneiden.</li>
<li>Ruhige Strophe = längere Clips; Drop/Refrain = schnelle Schnitte.</li>
<li><strong>Bewegung im Clip</strong> auf den Beat legen (Sprung, Drehung, Handbewegung) – wirkt noch stärker als ein Schnitt.</li>
<li>Bei 120 BPM dauert ein Beat 0,5 s. Formel: <code>Beatlänge (s) = 60 / BPM</code>.</li>
</ul>
<h3>Speed Ramps</h3>
<p>Ein Speed Ramp ändert die Geschwindigkeit innerhalb eines Clips (normal → Zeitlupe → schnell). Am besten mit Material in <strong>60 fps</strong> oder mehr, damit die Zeitlupe flüssig bleibt. In Edits/CapCut: Clip auswählen → Geschwindigkeit → Kurve/Ramp.</p>
<h3>Übergänge</h3>
<ul>
<li><strong>Whip Pan:</strong> schnelle Kameradrehung am Ende von Clip A und am Anfang von Clip B → Schnitt in der Bewegungsunschärfe.</li>
<li><strong>Match Cut:</strong> gleiche Form/Position in beiden Clips (Hand verdeckt Kamera → Hand gibt neue Szene frei).</li>
<li><strong>Zoom Transition:</strong> Reinzoomen auf den Beat.</li>
<li>Faustregel: <em>In-Camera-Übergänge</em> (beim Drehen geplant) wirken hochwertiger als App-Effekte.</li>
</ul>
`,
        aufgabe: "Wähle einen Song mit klarem Drop. Schneide ein 15-Sekunden-Reel, in dem vor dem Drop lange Clips laufen und ab dem Drop auf jeden zweiten Beat geschnitten wird.",
        quiz: [
          { frage: "Wie lang ist ein Beat bei 100 BPM?", antworten: ["0,5 s", "0,6 s", "1 s", "0,1 s"], richtig: 1, erklaerung: "60 / 100 = 0,6 s." },
          { frage: "Welche Bildrate eignet sich für flüssige Speed Ramps?", antworten: ["24 fps", "25 fps", "30 fps", "60 fps oder mehr"], richtig: 3, erklaerung: "Mehr Bilder pro Sekunde = mehr Material für die Zeitlupe." }
        ],
        quellen: [
          { titel: "CapCut – Ressourcen (Beat, Speed, Transitions)", url: "https://www.capcut.com/resource" },
          { titel: "Wikipedia – Tempo (Musik) / BPM", url: "https://de.wikipedia.org/wiki/Tempo_(Musik)" }
        ]
      },
      {
        id: "text-captions",
        titel: "Text, Untertitel & Typografie",
        level: "praxis",
        inhalt: `
<p>Ein großer Teil der Nutzer schaut Reels zumindest anfangs <strong>ohne Ton</strong>. Untertitel sind daher Pflicht bei Sprechvideos.</p>
<h3>Auto-Captions</h3>
<ol>
<li>In Edits/CapCut „Untertitel/Captions“ automatisch generieren.</li>
<li><strong>Immer korrigieren</strong> – besonders Namen und Fachbegriffe.</li>
<li>Kurze Zeilen: max. 3–5 Wörter pro Einblendung.</li>
</ol>
<h3>Typografie-Regeln</h3>
<ul>
<li>Max. <strong>2 Schriftarten</strong> pro Video (eine für Headlines, eine für Text).</li>
<li>Kontrast: weiße Schrift mit Kontur/Schatten oder halbtransparentem Hintergrund.</li>
<li>Schlüsselwörter farbig hervorheben (Akzentfarbe aus deinem Grading!).</li>
<li>Text innerhalb der <strong>Safe Zones</strong> platzieren.</li>
<li>Text lang genug stehen lassen: Faustregel ca. 0,3 s pro Wort, mindestens ~1 s.</li>
</ul>
<h3>Textanimation</h3>
<p>Einfache Pop-In- oder Typewriter-Animationen wirken dynamisch. Übertreibe es nicht – zu viele Effekte lenken vom Inhalt ab.</p>
`,
        aufgabe: "Nimm ein 20-Sekunden-Sprechvideo auf, generiere Auto-Captions, korrigiere sie und hebe pro Satz ein Schlüsselwort farbig hervor.",
        quiz: [
          { frage: "Wie viele Schriftarten maximal pro Video?", antworten: ["1", "2", "5", "Egal"], richtig: 1, erklaerung: "Zwei Schriften bleiben übersichtlich und konsistent." },
          { frage: "Warum Untertitel?", antworten: ["Pflicht laut Instagram", "Viele schauen ohne Ton", "Bessere Bildqualität", "Kürzere Datei"], richtig: 1, erklaerung: "Ohne Ton geht sonst die Botschaft verloren." }
        ],
        quellen: [
          { titel: "Instagram Hilfebereich – Untertitel", url: "https://help.instagram.com/" },
          { titel: "Planoly – Instagram Edits App Review", url: "https://planoly.com/blog/instagrams-edits-app-review" }
        ]
      },
      {
        id: "effekte",
        titel: "Green Screen, Keyframes & Overlays",
        level: "vertiefung",
        inhalt: `
<h3>Green Screen / Cutout</h3>
<ul>
<li><strong>Echter Green Screen:</strong> gleichmäßig ausleuchten, Abstand Person ↔ Hintergrund ≥ 1,5 m (weniger grüne Reflexion), keine grüne Kleidung.</li>
<li><strong>KI-Cutout</strong> (in Edits/CapCut): stellt Personen ohne Green Screen frei. Funktioniert am besten bei gutem Kontrast zwischen Person und Hintergrund.</li>
<li>Nach dem Freistellen: <strong>Farben angleichen</strong>! Person und neuer Hintergrund müssen dieselbe Lichtrichtung, Farbtemperatur und denselben Kontrast haben – das ist Color Grading.</li>
</ul>
<h3>Keyframes</h3>
<p>Ein Keyframe speichert einen Wert (Position, Größe, Rotation, Deckkraft …) zu einem Zeitpunkt. Zwischen zwei Keyframes berechnet die App die Animation.</p>
<ol>
<li>Playhead an den Startpunkt → Keyframe setzen (◇-Symbol).</li>
<li>Playhead weiter → Wert ändern (z. B. Clip größer ziehen) → zweiter Keyframe entsteht.</li>
<li>Für weiche Bewegung <strong>Easing</strong> (Ease In/Out) wählen, falls verfügbar.</li>
</ol>
<p>Typische Anwendungen: langsamer „Ken Burns“-Zoom auf Fotos, Zoom auf den Beat, Text, der ins Bild fliegt, Grading-Übergang von Vorher zu Nachher.</p>
<h3>Overlays & Blend Modes</h3>
<ul>
<li><strong>Bild-in-Bild:</strong> zweiten Clip als Overlay (z. B. Reaktion, Tutorial-Screen).</li>
<li><strong>Mischmodi</strong> (Screen, Multiply, Overlay): Light Leaks, Film-Grain oder Staub über das Video legen.</li>
<li><strong>Masken:</strong> Split-Screen „Before / After“ für Grading-Content.</li>
</ul>
<div class="box tip"><h4>Before/After-Grading-Reel</h4>1) Clip zweimal übereinander legen. 2) Obere Spur graden, untere original lassen. 3) Maske (linear) auf die obere Spur, mit Keyframes von links nach rechts schieben. Fertig ist der klassische Wisch-Vergleich.</div>
`,
        aufgabe: "Erstelle ein 10-Sekunden-Before/After-Reel eines deiner Gradings mit wandernder Maske per Keyframes.",
        quiz: [
          { frage: "Was speichert ein Keyframe?", antworten: ["Eine Datei", "Einen Wert zu einem Zeitpunkt", "Eine Farbe", "Eine Tonspur"], richtig: 1, erklaerung: "Zwischen Keyframes wird interpoliert." },
          { frage: "Warum Abstand zum Green Screen?", antworten: ["Bessere Akustik", "Weniger grüne Reflexion/Schatten auf der Person", "Höhere Auflösung", "Schnellerer Export"], richtig: 1, erklaerung: "Grünes Streulicht (Spill) erschwert das Keying." }
        ],
        quellen: [
          { titel: "Influencer Marketing Hub – Edits: Green Screen & Features", url: "https://influencermarketinghub.com/instagram-edits-app" },
          { titel: "Wikipedia – Chroma Keying", url: "https://de.wikipedia.org/wiki/Chroma_Keying" },
          { titel: "CapCut – Keyframe Tutorials", url: "https://www.capcut.com/resource" }
        ]
      },
      {
        id: "export",
        titel: "Export & Upload ohne Qualitätsverlust",
        level: "praxis",
        inhalt: `
<h3>Empfohlene Export-Einstellungen</h3>
<table>
<tr><th>Einstellung</th><th>Empfehlung</th></tr>
<tr><td>Auflösung</td><td>1080 × 1920 (9:16). 4K-Export geht, wird aber von Instagram heruntergerechnet.</td></tr>
<tr><td>Bildrate</td><td>wie das Projekt (meist 30 fps)</td></tr>
<tr><td>Codec</td><td>H.264 oder HEVC (H.265)</td></tr>
<tr><td>Bitrate</td><td>hoch (in Apps meist „Hoch/Empfohlen“ wählen)</td></tr>
<tr><td>Audio</td><td>AAC, 48 kHz</td></tr>
<tr><td>Farbe</td><td>SDR Rec.709, wenn du nicht bewusst HDR gradest</td></tr>
</table>
<h3>Upload-Tipps</h3>
<ul>
<li>In der Instagram-App unter Einstellungen → „Medienqualität“ → <strong>„In höchster Qualität hochladen“</strong> aktivieren.</li>
<li>Über WLAN hochladen.</li>
<li>Nicht mehrfach exportieren/komprimieren (z. B. über WhatsApp schicken) – jede Kompression kostet Qualität.</li>
<li>HDR-Clips vom Handy können nach dem Upload überstrahlt oder ausgewaschen wirken. Für konsistente Farben in SDR exportieren.</li>
<li><strong>Titelbild (Cover)</strong> bewusst wählen – im Profilraster mittig zugeschnitten.</li>
</ul>
<h3>Grain & Kompression</h3>
<p>Feines Film-Grain wird von der Instagram-Kompression oft „matschig“. Lieber etwas gröberes, dezentes Grain nutzen – oder ganz darauf verzichten. Banding in Verläufen (Himmel) lässt sich mit leichtem Grain dagegen kaschieren.</p>
`,
        aufgabe: "Exportiere dasselbe Reel einmal mit niedriger und einmal mit höchster Qualität und lade beide (privat/als Entwurf) hoch. Vergleiche Schatten und Verläufe.",
        quiz: [
          { frage: "Welcher Codec ist Standard für Social Media?", antworten: ["ProRes", "H.264", "DNxHR", "GIF"], richtig: 1, erklaerung: "H.264 (oder HEVC) ist effizient und überall kompatibel." },
          { frage: "Was verbessert die Upload-Qualität in der Instagram-App?", antworten: ["Mobile Daten", "„In höchster Qualität hochladen“ aktivieren", "Video per Messenger senden", "Niedrige Auflösung"], richtig: 1, erklaerung: "Diese Einstellung verhindert zusätzliche Datensparkompression." }
        ],
        quellen: [
          { titel: "Instagram Hilfebereich", url: "https://help.instagram.com/" },
          { titel: "Metricool – Video Editing Apps for Instagram 2026", url: "https://metricool.com/video-editing-apps-for-instagram/" }
        ]
      }
    ]
  }
];

/* Glossar – wird auf der Glossar-Seite durchsuchbar angezeigt. */
window.GLOSSAR = [
  ["ACES", "Academy Color Encoding System – standardisiertes Farbmanagement der Filmindustrie."],
  ["Achsensprung", "Verletzung der 180°-Regel; Figuren scheinen plötzlich die Seite zu wechseln."],
  ["Banding", "Sichtbare Stufen in Farbverläufen, oft bei 8-Bit-Material oder starker Kompression."],
  ["Bitrate", "Datenmenge pro Sekunde Video; höher = bessere Qualität, größere Datei."],
  ["Blende", "Öffnung des Objektivs (f-Zahl). Kleine Zahl = viel Licht, geringe Schärfentiefe."],
  ["Clipping", "Abgeschnittene Information: reines Weiß/Schwarz bzw. übersteuerter Ton ohne Details."],
  ["Color Space Transform (CST)", "Umrechnung zwischen Farbräumen/Gammas, z. B. S-Log3 → Rec.709."],
  ["Dynamikumfang", "Spanne zwischen dunkelstem und hellstem darstellbarem Detail, in Blendenstufen."],
  ["Gain", "Rad/Regler für die Lichter. Bei Kameras auch: elektronische Verstärkung (≈ ISO)."],
  ["Gamma", "Mitteltöne im Grading; allgemein: die Helligkeitskurve eines Signals."],
  ["Grain", "Filmkorn – körnige Struktur analoger Filme, digital oft nachgeahmt."],
  ["Halation", "Rötlicher Lichtschimmer um helle Bereiche, typisch für analogen Film."],
  ["Hook", "Der Aufmerksamkeitsfänger in den ersten Sekunden eines Social-Videos."],
  ["J-Cut / L-Cut", "Ton beginnt vor dem Bild (J) bzw. läuft nach dem Bildschnitt weiter (L)."],
  ["Keyframe", "Gespeicherter Wert zu einem Zeitpunkt, zwischen Keyframes wird animiert."],
  ["Kelvin (K)", "Einheit der Farbtemperatur. Niedrig = warm/orange, hoch = kalt/blau."],
  ["Lift", "Rad/Regler für die Schatten bzw. den Schwarzwert."],
  ["Log", "Flache Aufnahmekurve mit großem Dynamikumfang, muss nachträglich transformiert werden."],
  ["LUFS", "Maßeinheit für wahrgenommene Lautheit. Social/Streaming oft ca. −14 LUFS."],
  ["LUT", "Look-Up Table – Tabelle, die Eingangs- in Ausgangsfarben umrechnet."],
  ["Match Cut", "Schnitt, der zwei Bilder über Form, Bewegung oder Inhalt verbindet."],
  ["ND-Filter", "Neutraldichtefilter – dunkelt das Bild ohne Farbveränderung ab."],
  ["Node", "Bearbeitungsbaustein in DaVinci Resolve; Nodes werden zu einem Baum verbunden."],
  ["Offset", "Verschiebt alle Helligkeits-/Farbwerte gleichmäßig."],
  ["Power Window", "Form-Maske in DaVinci Resolve für lokale Korrekturen."],
  ["Qualifier", "Werkzeug zur Auswahl von Bildbereichen nach Farbton, Sättigung und Helligkeit."],
  ["Rec.709", "Farbraum- und Gammastandard für HD-Video und die meisten Web-Inhalte (SDR)."],
  ["RGB-Parade", "Scope mit drei nebeneinanderliegenden Waveforms für Rot, Grün, Blau."],
  ["Safe Zone", "Bildbereich, der nicht von Plattform-Oberflächen verdeckt wird."],
  ["Schärfentiefe", "Bereich, der scharf abgebildet wird; abhängig von Blende, Brennweite, Abstand."],
  ["Shot Matching", "Angleichen der Farben mehrerer Einstellungen einer Szene."],
  ["Skin Tone Line", "Linie im Vectorscope, auf der natürliche Hauttöne liegen."],
  ["Speed Ramp", "Fließende Geschwindigkeitsänderung innerhalb eines Clips."],
  ["Teal & Orange", "Komplementärer Look: warme Hauttöne vor kühlem Hintergrund."],
  ["Vectorscope", "Scope, das Farbton (Winkel) und Sättigung (Abstand zur Mitte) zeigt."],
  ["Waveform", "Scope, das die Helligkeit über die Bildbreite darstellt."],
  ["Weißabgleich", "Einstellung, die festlegt, welche Farbe als neutrales Weiß gilt."],
  ["Whip Pan", "Sehr schneller Kameraschwenk, oft als Übergang genutzt."]
];
