/*
 * Beispielfotos zu den Lektionen (KI-generiert mit Higgsfield, gpt_image_2_5).
 * Schlüssel: "kurs/lektion". abschnitt = exakter <h3>-Text (oder Lektionstitel → am Anfang).
 * vergleich: [vorher, nachher] → Vorher/Nachher-Schieberegler.
 * hoch: true → Hochformat (9:16).
 */
(function () {
  const f = n => `img/fotos/${n}.webp`;
  window.FOTOS = {
    "film/einstellungsgroessen": [
      { abschnitt: "Einstellungsgrößen & Bildsprache", src: f("01"), text: "Totale: Der Raum erzählt – die Figur ist winzig, die Weite wird zum Thema." },
      { abschnitt: "Einstellungsgrößen & Bildsprache", src: f("02"), text: "Großaufnahme: Das Gesicht füllt das Bild, jede kleine Regung zählt." },
      { abschnitt: "Einstellungsgrößen & Bildsprache", src: f("03"), text: "Detail: Nur noch das Auge – maximale Intensität." },
      { abschnitt: "Kameraperspektive", src: f("04"), text: "Untersicht (Froschperspektive): Die Figur wirkt mächtig und überlegen." },
      { abschnitt: "Kameraperspektive", src: f("05"), text: "Aufsicht: Von oben wirkt der Mann klein, verloren und verletzlich." },
      { abschnitt: "Bildkomposition", src: f("06"), text: "Drittel-Regel und führende Linien: Die Straße zieht den Blick in die Tiefe." },
      { abschnitt: "Bildkomposition", src: f("07"), text: "Zentralperspektive: Strenge Symmetrie erzeugt Ordnung – und Unbehagen." }
    ],
    "film/kamera": [
      { abschnitt: "Die 180°-Shutter-Regel", src: f("08"), text: "180°-Shutter (z. B. 1/50 s bei 25 fps): natürliche Bewegungsunschärfe an Beinen und Rädern." },
      { abschnitt: "Die 180°-Shutter-Regel", src: f("09"), text: "Sehr kurzer Shutter (1/1000 s und kürzer): Tropfen frieren ein, Bewegung wirkt stakkatohaft." },
      { abschnitt: "Bildraten (fps)", src: f("12"), text: "Zeitlupe: mit 60–120 fps gedreht, in 24/25 fps abgespielt – jeder Tropfen wird sichtbar." },
      { abschnitt: "Objektive & Brennweite", src: f("10"), text: "Weitwinkel (ca. 18 mm) nah dran: viel Umgebung, das Gesicht verzerrt – lebendig, komisch." },
      { abschnitt: "Objektive & Brennweite", src: f("11"), text: "Tele (ca. 85 mm): Der Hintergrund rückt heran und zerfließt zu weichem Bokeh." }
    ],
    "film/licht": [
      { abschnitt: "Licht: 3-Punkt-Licht & Lichtstimmung", src: f("00"), text: "3-Punkt-Licht in der Praxis: weiches Key von links, wenig Fill, warmes Rim trennt das Haar vom Hintergrund." },
      { abschnitt: "Lichtverhältnis (Contrast Ratio)", src: f("13"), text: "Niedriges Lichtverhältnis (ca. 2:1): hell, offen, freundlich – typisch Werbung." },
      { abschnitt: "Lichtverhältnis (Contrast Ratio)", src: f("14"), text: "Hohes Lichtverhältnis (8:1 und mehr): Eine Gesichtshälfte versinkt – Drama, Film noir." },
      { abschnitt: "Hartes vs. weiches Licht", src: f("15"), text: "Hartes Licht: Mittagssonne als kleine Quelle – scharfe Schattenkanten unter Nase und Kinn." },
      { abschnitt: "Hartes vs. weiches Licht", src: f("16"), text: "Weiches Licht: große Quelle nah am Gesicht – sanfte, fließende Übergänge." },
      { abschnitt: "Farbtemperatur", src: f("17"), text: "Mischlicht: warme Lampe innen (ca. 3200 K), kühles Abendlicht draußen (ca. 6500 K+)." },
      { abschnitt: "Motiviertes Licht", src: f("18"), text: "Motiviertes Licht: Der Laptop im Bild „erklärt“, woher das kühle Licht im Gesicht kommt." }
    ],
    "film/licht-commercial": [
      { abschnitt: "1. „Soften, then soften again“", src: f("19"), text: "Riesige Diffusion, dann noch eine Lage: so entsteht das schmeichelnde Commercial-Licht." },
      { abschnitt: "2. Negative Fill – Kontrast durch Wegnehmen", src: f("20"), text: "Negative Fill: Der schwarze Floppy schluckt Streulicht – die Schattenseite bekommt Form." },
      { abschnitt: "3. Sonne als Backlight", src: f("21"), text: "Sonne im Rücken: leuchtende Haarkante, das Gesicht weich über einen Bounce aufgehellt." },
      { abschnitt: "4. Fenster richtig nutzen", src: f("22"), text: "Fenster seitlich: Das Licht modelliert das Gesicht, der Raum dahinter fällt ins Dunkle ab." },
      { abschnitt: "6. Eye Light", src: f("23"), text: "Eye Light: Die kleinen Reflexionen in den Augen machen den Blick lebendig." }
    ],
    "film/false-color": [
      { abschnitt: "Workflow nach dem Wandering-DP-Prinzip", src: f("24"), text: "Am Set: Belichtung am Monitor prüfen, bevor die Kamera läuft." }
    ],
    "film/schnitt": [
      { abschnitt: "Kuleschow-Effekt", src: f("25"), text: "1 · Ein völlig neutrales Gesicht …" },
      { abschnitt: "Kuleschow-Effekt", src: f("26"), text: "2 · … geschnitten auf einen Teller Suppe: Das Publikum liest Hunger." },
      { abschnitt: "Kuleschow-Effekt", src: f("27"), text: "3 · … geschnitten auf ein spielendes Kind: Das Publikum liest Zärtlichkeit – derselbe Blick." },
      { abschnitt: "Continuity Editing (unsichtbarer Schnitt)", src: f("28"), text: "Over-the-Shoulder im Schuss-Gegenschuss: Die Kamera bleibt auf einer Seite der 180°-Achse." }
    ],
    "film/ton": [
      { abschnitt: "Die Tonebenen", src: f("30"), text: "Foley: Schritte, Kleidung und Requisiten werden im Studio synchron nachvertont." },
      { abschnitt: "Aufnahme-Praxis", src: f("29"), text: "Die Angel knapp über dem Bildrand – so nah wie möglich an den Stimmen." }
    ],
    "film/dramaturgie": [
      { abschnitt: "Show, don't tell", src: f("59"), text: "Show, don't tell: Zitternde Hände mit einem Brief sagen mehr als „Ich habe Angst“." },
      { abschnitt: "Vorbereitung wie am Set", src: f("31"), text: "Storyboard: Jede Einstellung ist skizziert, bevor gedreht wird." },
      { abschnitt: "Vorbereitung wie am Set", src: f("32"), text: "Am Set: Dank Shotlist weiß das ganze Team, was als Nächstes kommt." }
    ],
    "color/correction-vs-grading": [
      { abschnitt: "Die Reihenfolge eines Profi-Gradings", vergleich: [f("34"), f("33")], text: "Schieb den Regler: links das flache Ausgangsmaterial, rechts das fertige Grading mit Teal-Schatten und warmen Hauttönen." },
      { abschnitt: "Arbeitsumgebung", src: f("35"), text: "Grading-Suite: gedämpftes Licht, neutrale Wände, Bias-Light hinter dem kalibrierten Monitor." }
    ],
    "color/primaries": [
      { abschnitt: "Komplementärfarben – das Grundgesetz", src: f("36"), text: "Orange Haut vor Teal-Hintergrund: Komplementärkontrast lässt das Gesicht herausspringen." }
    ],
    "color/log-lut": [
      { abschnitt: "Warum Log so grau aussieht", vergleich: [f("38"), f("37")], text: "Links Log-ähnlich: flach, entsättigt, angehobene Schwarzwerte. Rechts nach Transformation und Grading." }
    ],
    "color/secondaries": [
      { abschnitt: "Typische Aufgaben", src: f("40"), text: "Typisch sekundär: Nur der Himmel wird mit einer Maske abgedunkelt und gesättigt." },
      { abschnitt: "Hauttöne", src: f("39"), text: "Ganz unterschiedliche Hauttöne – im Vectorscope liegen alle auf derselben Hautton-Linie." }
    ],
    "color/looks": [
      { abschnitt: "Farbharmonien", src: f("41"), text: "Analoge Harmonie: nur Gelb, Grün und Amber – ruhig und stimmig." },
      { abschnitt: "Farbharmonien", src: f("42"), text: "Monochrom: alles in Blau – Einsamkeit, Kälte, Melancholie." },
      { abschnitt: "Farbpsychologie (kulturell geprägt, nicht absolut)", src: f("43"), text: "Rot als Gefahr: Die Farbe allein erzeugt Spannung." },
      { abschnitt: "Was macht den „Filmlook“ aus?", src: f("44"), text: "Filmlook: Korn, rote Halation um die Lichter, weich auslaufende Spitzlichter." },
      { abschnitt: "Look-Development-Methode", src: f("45"), text: "Bleach Bypass: entsättigt, harter Kontrast, silbrige Töne – ein klarer Look mit Haltung." }
    ],
    "color/handy-grading": [
      { abschnitt: "Handy-Grading-Rezept", vergleich: [f("47"), f("46")], text: "Handy-Grading: links flach, rechts warm mit sanftem Kontrast – fertig für Instagram.", hoch: true }
    ],
    "edits/edits-app": [
      { abschnitt: "Projekt-Setup", src: f("48"), text: "Schneiden am Handy: Clips, Text und Musik auf getrennten Spuren der Timeline.", hoch: true }
    ],
    "edits/hook": [
      { abschnitt: "Hook-Typen", src: f("49"), text: "Starker erster Frame: Bewegung, Spannung und sofort verständlich.", hoch: true }
    ],
    "edits/beat-sync": [
      { abschnitt: "Speed Ramps", src: f("50"), text: "Speed Ramp: schnell in den Sprung, Zeitlupe am Höhepunkt – genau auf dem Beat.", hoch: true },
      { abschnitt: "Übergänge", src: f("51"), text: "Whip Pan: Die Bewegungsunschärfe verbindet zwei Clips unsichtbar.", hoch: true }
    ],
    "edits/kinetic-editing": [
      { abschnitt: "Bausteine eines Kinetic Edits", src: f("53"), text: "POV und Weitwinkel: Die Kamera ist mitten in der Bewegung – Energie pur.", hoch: true },
      { abschnitt: "Rezept: Der F1-Slow-Shutter-Look", src: f("52"), text: "Slow-Shutter-Panning: das Auto scharf, Hintergrund und Räder verwischt." }
    ],
    "edits/sounddesign-edits": [
      { abschnitt: "Die Sound-Ebenen in einem Kinetic Edit", src: f("54"), text: "Sounddesign: Whooshes, Risers und Hits geben jedem Schnitt Gewicht." }
    ],
    "edits/text-captions": [
      { abschnitt: "Typografie-Regeln", src: f("55"), text: "Freiraum lassen: Der leere Himmel ist Platz für Text – innerhalb der Safe Zones.", hoch: true }
    ],
    "edits/effekte": [
      { abschnitt: "Green Screen / Cutout", src: f("56"), text: "Green Screen: gleichmäßig ausleuchten und Abstand zur Wand halten – sonst färbt Grün aufs Motiv ab.", hoch: true },
      { abschnitt: "Overlays & Blend Modes", src: f("57"), text: "Light Leak im Modus „Screen“: Schwarz verschwindet, nur das Leuchten bleibt.", hoch: true }
    ],
    "edits/export": [
      { abschnitt: "Grain & Kompression", src: f("58"), text: "Feines Korn kaschiert Banding im Himmel, wenn Instagram komprimiert.", hoch: true }
    ]
  };
  // Titelbilder der Kurse
  window.KURS_FOTOS = { film: f("00"), color: f("33"), edits: f("52") };
})();
