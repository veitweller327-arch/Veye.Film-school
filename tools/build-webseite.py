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
    for f in ["data/kurse.js", "data/videos.js", "js/labor.js", "js/tutor.js", "js/app.js"])
out = f"""<title>Veye Film School</title>
<meta name="claude:viewport-fit-sides" content="cover">
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
