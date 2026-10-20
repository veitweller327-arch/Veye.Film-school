/*
 * DEINE VIDEOS
 * ------------
 * Hier trägst du Videos ein, die dauerhaft in der Plattform erscheinen sollen.
 * (Videos, die du über die Seite "Meine Videos" hinzufügst, liegen nur in deinem Browser –
 *  dort gibt es einen Export-Button, der dir den passenden Code für diese Datei erzeugt.)
 *
 * Felder:
 *   titel    – Anzeigename
 *   url      – YouTube-Link, Vimeo-Link, Instagram-Link oder lokale Datei (z. B. "videos/mein-clip.mp4")
 *   kurs     – "film" | "color" | "edits"
 *   lektion  – ID der Lektion (siehe data/kurse.js), optional
 *   notizen  – deine Notizen / Kernaussagen, optional
 *   hochkant – true, wenn es ein 9:16-Video ist (optional)
 *
 * Beispiel:
 *   {
 *     titel: "Lift Gamma Gain erklärt",
 *     url: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
 *     kurs: "color",
 *     lektion: "primaries",
 *     notizen: "Ab 04:30 wird die Parade erklärt."
 *   },
 */
window.VIDEOS = [
  /* ---------- Paddy Cartwright ---------- */
  {
    titel: "Kinetic Editing – Episode 1 (Formel 1)",
    url: "https://www.youtube.com/watch?v=TaOYRspaWSE",
    kurs: "edits", lektion: "kinetic-editing",
    notizen: "Paddy geht einen seiner F1-Edits durch. Achte auf: Schnitt auf Bewegung, Slow-Shutter-Shots, Sounddesign."
  },
  {
    titel: "Kinetic Editing – Episode 2 (Nike Commercial)",
    url: "https://www.youtube.com/watch?v=C-TDLX2Anf8",
    kurs: "edits", lektion: "kinetic-editing",
    notizen: "Edit eines Nike-Werbedrehs – wie kommerzielle Sportbilder geschnitten werden."
  },
  {
    titel: "Kinetic Editing – Ep. 3 (Running)",
    url: "https://www.youtube.com/watch?v=Mt9aWG3iJio",
    kurs: "edits", lektion: "kinetic-editing",
    notizen: "Lauf-Videos: Rhythmus aus Schritten und Musik."
  },
  {
    titel: "Kinetic Editing – Ep. 4 (High-Pace-Motorradvideo)",
    url: "https://www.youtube.com/watch?v=WtIswR89LPk",
    kurs: "edits", lektion: "kinetic-editing",
    notizen: "Hohes Tempo: Speed Ramps, gematchte Bewegungsrichtungen, Motor-Sounds."
  },
  {
    titel: "Go film something in 45 minutes",
    url: "https://www.youtube.com/watch?v=4nYdnOqfSnU",
    kurs: "edits", lektion: "kinetic-editing",
    notizen: "Kurze, selbst gestellte Filmchallenges – Grundlage der Übung in dieser Lektion."
  },
  {
    titel: "How Passion Projects Got Him A Gig With F1 (Beyond The Cut)",
    url: "https://www.youtube.com/watch?v=jQKzG8BYwRg",
    kurs: "edits", lektion: "sounddesign-edits",
    notizen: "Podcast: eigene Soundbibliothek, echte Geräusche übertreiben, Schnitt wie Musikkomposition, Passion Projects."
  },
  {
    titel: "Sign Spin Tutorial (After Effects)",
    url: "https://www.youtube.com/watch?v=EvM5LrMyJHk",
    kurs: "edits", lektion: "effekte",
    notizen: "Motion-Graphics-Effekt in After Effects – Prinzip lässt sich mit Keyframes auch in Edits/CapCut annähern."
  }

  /* ---------- The Wandering DP ----------
   * Für einzelne Wandering-DP-Videos einfach Links ergänzen, z. B.:
   * { titel: "...", url: "https://www.youtube.com/watch?v=...", kurs: "film", lektion: "licht-commercial", notizen: "..." },
   */
];
