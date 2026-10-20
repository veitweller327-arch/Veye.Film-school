#!/usr/bin/env python3
"""Baut die Plattform zu EINER HTML-Datei (dist/veye-film-school.html) für die Veröffentlichung als Webseite.
Inline-CSS/JS, eingebettete Videos werden zu Link-Buttons (Fremd-Player sind dort gesperrt)."""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "css/style.css").read_text(encoding="utf-8")
body = re.search(r"<body>(.*)</body>", html, re.S).group(1)
body = re.sub(r'\s*<script src="[^"]+"></script>', "", body)
scripts = "".join(
    f"<script>\n{(root / f).read_text(encoding='utf-8')}\n</script>\n"
    for f in ["data/kurse.js", "data/begriffe.js", "data/videos.js", "data/grafiken.js", "js/labor.js", "js/terms.js", "js/tutor.js", "js/feed.js", "js/notes.js", "js/heft.js", "js/lernen.js", "js/praxis.js", "js/breakdown.js", "js/app.js"])
out = f"""<title>Veye Film School</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Caveat:wght@500;700&family=JetBrains+Mono:wght@500;600&family=Kalam:wght@300;400;700&family=Onest:wght@400..700&display=swap">
<meta name="description" content="Lernplattform für Filmstudium-Grundlagen, Color Grading und Instagram-Edits.">
<style>
{css}
body {{ background: var(--bg); }}
</style>
{body.strip()}
<script>window.VEYE_LINK_VIDEOS = true;</script>
{scripts}"""
dist = root / "dist"; dist.mkdir(exist_ok=True)
(dist / "veye-film-school.html").write_text(out, encoding="utf-8")
print(dist / "veye-film-school.html", len(out), "Zeichen")
