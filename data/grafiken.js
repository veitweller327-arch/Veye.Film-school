/*
 * Lern-Grafiken (SVG), selbst gezeichnet, frei verwendbar.
 * Zuordnung: "kurs/lektion" → [{ abschnitt, svg, text }].
 * abschnitt = exakter <h3>-Titel; der Lektionstitel steht für die Einleitung.
 * Klassen: .dr = Linie zeichnet sich ein (pathLength="1"), .pp = blendet gestaffelt ein (--i).
 */
(function () {
  const W = (vb, label, body) => `<svg class="dia" viewBox="${vb}" role="img" aria-label="${label}">${body}</svg>`;
  const T = (x, y, s, cls = "t", anchor = "start", extra = "") => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" ${extra}>${s}</text>`;
  const r1 = n => Math.round(n * 10) / 10;
  const pp = (i, inner) => `<g class="pp" style="--i:${i}">${inner}</g>`;

  // Rec.709 Cb/Cr – für Vectorscope & Farbräume
  const cbcr = (r, g, b) => { const y = 0.2126 * r + 0.7152 * g + 0.0722 * b; return [(b - y) / 1.8556, (r - y) / 1.5748]; };

  /* ---------------- Film: Bildsprache ---------------- */

  function shotSizes() {
    const cx = 200;
    const frames = [
      ["Halbtotale", 28, 300], ["Halbnah", 34, 192], ["Nah", 40, 140], ["Groß", 46, 104]
    ];
    const person = `
      <circle cx="${cx}" cy="66" r="15" class="fm2"/>
      <rect x="${cx - 6}" y="78" width="12" height="12" class="fm2"/>
      <path class="fm2" d="M${cx - 25} 88 L${cx + 25} 88 Q${cx + 42} 92 ${cx + 44} 110 L${cx + 48} 185 L${cx + 32} 185 L${cx + 28} 122 L${cx + 26} 190 L${cx + 22} 290 L${cx + 6} 290 L${cx} 200 L${cx - 6} 290 L${cx - 22} 290 L${cx - 26} 190 L${cx - 28} 122 L${cx - 32} 185 L${cx - 48} 185 L${cx - 44} 110 Q${cx - 42} 92 ${cx - 25} 88 Z"/>
      <circle cx="${cx - 6}" cy="64" r="2" class="fb"/><circle cx="${cx + 6}" cy="64" r="2" class="fb"/>`;
    const rects = frames.map(([name, top, bottom], i) => {
      const h = bottom - top, w = Math.min(381, h * 1.4), x = cx - w / 2;
      return `<rect x="${r1(x)}" y="${top}" width="${r1(w)}" height="${h}" rx="3" class="ac dr" pathLength="1" style="--i:${i};opacity:${0.45 + i * 0.15}"/>
              ${pp(i + 1, T(r1(x + w - 6), bottom - 6, name, "th", "end"))}`;
    }).join("");
    const detail = `<rect x="${cx - 16}" y="58" width="32" height="13" rx="2" class="ac dr" pathLength="1" style="--i:4"/>${pp(5, T(cx + 22, 68, "Detail", "th"))}`;
    return W("0 0 400 310", "Einstellungsgrößen an einer Figur", person + rects + detail);
  }

  function perspective() {
    const fig = x => `<circle cx="${x}" cy="118" r="11" class="fm2"/><path class="fm2" d="M${x - 16} 134 h32 l4 60 h-12 l-2 46 h-14 l-2 -46 h-12 z"/>`;
    const cam = (x, y, ang, i, name, note) => {
      const a = (ang * Math.PI) / 180, dx = Math.cos(a) * 30, dy = Math.sin(a) * 30;
      return pp(i, `<g transform="translate(${x} ${y}) rotate(${ang})"><rect x="-14" y="-9" width="22" height="18" rx="3" class="fa"/><path d="M8 -6 L18 -10 L18 10 L8 6 Z" class="fa"/></g>
        <line x1="${x + dx}" y1="${y + dy}" x2="180" y2="${170}" class="ln dash"/>
        ${T(x < 180 ? x - 22 : x + 22, y + 4, name, "tb", x < 180 ? "end" : "start")}${T(x < 180 ? x - 22 : x + 22, y + 18, note, "t", x < 180 ? "end" : "start")}`);
    };
    return W("0 0 360 260", "Kameraperspektiven", fig(180) +
      `<line x1="20" y1="240" x2="340" y2="240" class="gd"/>` +
      cam(96, 40, 40, 0, "Aufsicht", "wirkt klein") +
      cam(112, 150, 5, 1, "Normalsicht", "neutral") +
      cam(292, 228, -150, 2, "", "") + pp(2, T(300, 186, "Untersicht", "tb", "middle") + T(300, 200, "wirkt mächtig", "t", "middle")));
  }

  function thirds() {
    const x0 = 10, y0 = 14, w = 340, h = 191;
    const xs = [x0 + w / 3, x0 + (2 * w) / 3], ys = [y0 + h / 3, y0 + (2 * h) / 3];
    return W("0 0 360 230", "Drittelregel mit Blickraum", `
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="4" class="ln"/>
      <path d="M${x0} ${r1(ys[1] + 18)} Q 120 ${r1(ys[1] + 4)} 200 ${r1(ys[1] + 14)} T ${x0 + w} ${r1(ys[1] + 10)} L ${x0 + w} ${y0 + h} L ${x0} ${y0 + h} Z" class="fm"/>
      ${xs.map(x => `<line x1="${r1(x)}" y1="${y0}" x2="${r1(x)}" y2="${y0 + h}" class="gd dr" pathLength="1"/>`).join("")}
      ${ys.map(y => `<line x1="${x0}" y1="${r1(y)}" x2="${x0 + w}" y2="${r1(y)}" class="gd dr" pathLength="1"/>`).join("")}
      ${xs.flatMap(x => ys.map(y => `<circle cx="${r1(x)}" cy="${r1(y)}" r="3.5" class="fa pp" style="--i:1"/>`)).join("")}
      <g class="pp" style="--i:2"><circle cx="${r1(xs[1])}" cy="${r1(ys[0])}" r="17" class="fm2"/><path class="fm2" d="M${r1(xs[1] - 30)} ${y0 + h} Q ${r1(xs[1] - 28)} ${r1(ys[0] + 26)} ${r1(xs[1])} ${r1(ys[0] + 24)} Q ${r1(xs[1] + 28)} ${r1(ys[0] + 26)} ${r1(xs[1] + 30)} ${y0 + h} Z"/>
      <circle cx="${r1(xs[1] - 8)}" cy="${r1(ys[0] - 2)}" r="2" class="fb"/></g>
      <g class="pp" style="--i:3"><path d="M${r1(xs[1] - 30)} ${r1(ys[0] - 2)} L ${r1(x0 + 40)} ${r1(ys[0] - 2)}" class="ac dash"/><path d="M${x0 + 48} ${r1(ys[0] - 8)} l-8 6 l8 6" class="ac"/>
      ${T(r1((x0 + 40 + xs[1] - 30) / 2), r1(ys[0] - 10), "Blickraum", "th", "middle")}</g>
      ${pp(4, T(r1(xs[1] - 24), r1(ys[0] - 24), "Augen auf der Linie", "t", "end"))}`);
  }

  /* ---------------- Film: Kamera ---------------- */

  function exposureTriangle() {
    const A = [180, 34], B = [52, 228], C = [308, 228];
    return W("0 0 360 270", "Belichtungsdreieck", `
      <path d="M${A} L${B} L${C} Z" class="ac dr" pathLength="1"/>
      <path d="M${A} L${B} L${C} Z" class="fa" style="opacity:.08"/>
      ${pp(1, `<circle cx="${A[0]}" cy="${A[1]}" r="6" class="fa"/>${T(180, 18, "BLENDE", "th", "middle")}${T(232, 52, "offen = Bokeh", "t")}`)}
      ${pp(2, `<circle cx="${B[0]}" cy="${B[1]}" r="6" class="fa"/>${T(52, 252, "ISO", "th", "middle")}${T(52, 266, "hoch = Rauschen", "t", "middle")}`)}
      ${pp(3, `<circle cx="${C[0]}" cy="${C[1]}" r="6" class="fa"/>${T(308, 252, "SHUTTER", "th", "middle")}${T(308, 266, "lang = Motion Blur", "t", "middle")}`)}
      ${pp(4, T(180, 160, "Belichtung", "tb", "middle") + T(180, 176, "jeder Wert hat eine", "t", "middle") + T(180, 189, "Nebenwirkung", "t", "middle"))}`);
  }

  function shutter() {
    const cx = 100, cy = 125, r = 82;
    return W("0 0 360 250", "180-Grad-Shutter", `
      <circle cx="${cx}" cy="${cy}" r="${r}" class="ln"/>
      <path d="M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx} ${cy + r} Z" class="fa pp" style="--i:1;opacity:.85"/>
      <path d="M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 0 0 ${cx} ${cy + r} Z" class="fm"/>
      <circle cx="${cx}" cy="${cy}" r="4" class="fb"/>
      ${pp(2, T(cx + 40, cy + 4, "180° offen", "tdark", "middle"))}
      ${pp(2, T(cx - 40, cy + 4, "zu", "t", "middle"))}
      ${pp(3, T(210, 70, "Verschlusszeit ≈", "t") + T(210, 92, "1 / (2 × fps)", "tbig"))}
      ${pp(4, ["24 fps → 1/50 s", "25 fps → 1/50 s", "30 fps → 1/60 s", "60 fps → 1/120 s"].map((s, i) => T(210, 128 + i * 20, s, "tb")).join(""))}`);
  }

  function fov() {
    const cam = [200, 250], L = 205;
    const lenses = [["16 mm", 48, 0.35], ["35 mm", 27, 0.55], ["50 mm", 20, 0.75], ["85 mm", 12, 1]];
    const wedges = lenses.map(([name, half, op], i) => {
      const a = (half * Math.PI) / 180;
      const l = [r1(cam[0] - L * Math.sin(a)), r1(cam[1] - L * Math.cos(a))], rr = [r1(cam[0] + L * Math.sin(a)), r1(cam[1] - L * Math.cos(a))];
      return `<path d="M${cam} L${l} A${L} ${L} 0 0 1 ${rr} Z" class="fa" style="opacity:${0.05 + i * 0.03}"/>
        <path d="M${l} L${cam} L${rr}" class="ac dr" pathLength="1" style="--i:${i};opacity:${op}"/>
        ${pp(i + 1, `<line x1="${70 + (i % 2) * 150}" y1="${288 + Math.floor(i / 2) * 22}" x2="${92 + (i % 2) * 150}" y2="${288 + Math.floor(i / 2) * 22}" class="ac" style="opacity:${op}"/>${T(98 + (i % 2) * 150, 292 + Math.floor(i / 2) * 22, name + " · " + half * 2 + "°", "tb")}`)}`;
    }).join("");
    return W("0 0 400 350", "Bildwinkel verschiedener Brennweiten", wedges + `<rect x="${cam[0] - 12}" y="${cam[1] - 6}" width="24" height="14" rx="3" class="fa"/>` +
      pp(5, T(200, 342, "kurz = weiter Winkel · lang = eng + Kompression", "t", "middle")));
  }

  /* ---------------- Film: Licht ---------------- */

  function lamp(x, y, label, sub, cls, i, tx = x, ty = y + 26, anchor = "middle") {
    return pp(i, `<circle cx="${x}" cy="${y}" r="13" class="${cls}"/><circle cx="${x}" cy="${y}" r="5" class="fb"/>
      ${T(tx, ty, label, "tb", anchor)}${sub ? T(tx, ty + 14, sub, "t", anchor) : ""}`);
  }
  const beam = (x1, y1, x2, y2, cls = "ac", i = 0) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls} dr" pathLength="1" style="--i:${i}"/>`;
  const subjectTop = (x, y) => `<circle cx="${x}" cy="${y}" r="20" class="fm2"/><path d="M${x - 6} ${y + 18} L${x} ${y + 28} L${x + 6} ${y + 18}" class="fm2"/>`;
  const cameraTop = (x, y) => `<rect x="${x - 16}" y="${y - 10}" width="32" height="22" rx="4" class="fa"/><path d="M${x - 9} ${y - 10} L${x - 13} ${y - 22} L${x + 13} ${y - 22} L${x + 9} ${y - 10} Z" class="fa"/>${T(x, y + 28, "Kamera", "t", "middle")}`;

  function threePoint() {
    return W("0 0 360 300", "3-Punkt-Licht von oben", `
      ${beam(88, 196, 166, 136, "ac", 0)}${beam(276, 204, 196, 138, "ln", 1)}${beam(258, 46, 194, 106, "teal", 2)}
      ${subjectTop(180, 120)}
      ${cameraTop(180, 256)}
      ${lamp(80, 204, "Key", "hell · 30–45°", "fa", 1, 80, 232)}
      ${lamp(284, 212, "Fill", "schwächer", "fm3", 2, 284, 240)}
      ${lamp(266, 38, "Back", "Trennung", "fteal", 3, 288, 34, "start")}`);
  }

  function ratios() {
    const items = [["2:1", "1 Blende", "#b9b9b9"], ["4:1", "2 Blenden", "#8a8a8a"], ["8:1", "3 Blenden", "#565656"]];
    return W("0 0 360 200", "Lichtverhältnisse an einem Gesicht", T(180, 14, "Schattenseite: Blenden unter dem Key", "t", "middle") + items.map(([r, s, g], i) => {
      const x = 62 + i * 118;
      return pp(i, `<clipPath id="fc${i}"><ellipse cx="${x}" cy="92" rx="40" ry="50"/></clipPath>
        <g clip-path="url(#fc${i})"><rect x="${x - 40}" y="40" width="40" height="110" fill="#efe7df"/><rect x="${x}" y="40" width="40" height="110" fill="${g}"/></g>
        <ellipse cx="${x}" cy="92" rx="40" ry="50" class="ln"/>
        ${T(x, 168, r, "tbig", "middle")}${T(x, 186, s, "t", "middle")}`);
    }).join(""));
  }

  function hardSoft() {
    return W("0 0 360 220", "Hartes und weiches Licht", `
      <defs><linearGradient id="softsh" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>
      <line x1="10" y1="170" x2="170" y2="170" class="gd"/><line x1="190" y1="170" x2="350" y2="170" class="gd"/>
      ${pp(0, `<circle cx="40" cy="40" r="5" class="fa"/>${beam(40, 40, 116, 170, "ln dash", 0)}<circle cx="80" cy="128" r="22" class="fm2"/>
        <path d="M80 150 L150 170 L104 170 Z" fill="#000" opacity=".55"/>${T(90, 200, "kleine Quelle", "tb", "middle")}${T(90, 214, "→ harte Schattenkante", "t", "middle")}`)}
      ${pp(1, `<rect x="196" y="22" width="70" height="16" rx="3" class="fa"/><circle cx="270" cy="128" r="22" class="fm2"/>
        <path d="M270 150 L350 170 L284 170 Z" fill="url(#softsh)"/>${T(270, 200, "große Quelle", "tb", "middle")}${T(270, 214, "→ weicher Übergang", "t", "middle")}`)}`);
  }

  function kelvin() {
    const x = k => r1(20 + ((k - 1500) / (10000 - 1500)) * 320);
    const marks = [[1900, "Kerze", "1.900 K"], [3200, "Glühbirne", "3.200 K"], [5600, "Tageslicht", "5.600 K"], [7000, "Schatten", "7.000 K"]];
    return W("0 0 360 170", "Farbtemperatur-Skala in Kelvin", `
      <defs><linearGradient id="kel" x1="0" x2="1">
        <stop offset="0" stop-color="#ff7a1a"/><stop offset=".2" stop-color="#ffb46b"/><stop offset=".48" stop-color="#fff1df"/>
        <stop offset=".68" stop-color="#dfe6ff"/><stop offset="1" stop-color="#9fb7ff"/></linearGradient></defs>
      <rect x="20" y="64" width="320" height="34" rx="8" fill="url(#kel)"/>
      ${T(20, 124, "warm", "th")}${T(340, 124, "kalt", "th", "end")}
      ${marks.map(([k, n, v], i) => pp(i, `<line x1="${x(k)}" y1="58" x2="${x(k)}" y2="104" stroke="#111" stroke-width="2"/>
        ${T(x(k), 48, v, "tb", "middle")}${T(x(k), i % 2 ? 150 : 140, n, "t", "middle")}`)).join("")}`);
  }

  function negativeFill() {
    return W("0 0 360 300", "Großer Bounce als Key und Negative Fill", `
      ${beam(150, 40, 58, 110, "ac dash", 0)}
      ${[90, 130, 170].map((y, i) => beam(62, y, 158, 128 + i * 6, "acsoft", i + 1)).join("")}
      <rect x="44" y="60" width="14" height="150" rx="2" class="fwhite"/>
      <rect x="300" y="70" width="14" height="130" rx="2" class="fblack"/>
      ${[110, 140, 165].map((y, i) => `<line x1="202" y1="${130 + (i - 1) * 8}" x2="296" y2="${y}" class="ln dash pp" style="--i:${i + 2};opacity:.35"/>`).join("")}
      ${subjectTop(180, 130)}${cameraTop(180, 262)}
      ${lamp(150, 34, "Lampe", "", "fa", 1, 178, 38, "start")}
      ${pp(2, T(51, 228, "12×12 Bounce", "tb", "middle") + T(51, 242, "= weicher Key", "t", "middle"))}
      ${pp(3, T(307, 218, "Negative Fill", "tb", "middle") + T(307, 232, "schluckt Licht", "t", "middle"))}`);
  }

  function sunBack() {
    const rays = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${r1(300 + Math.cos(a) * 24)}" y1="${r1(48 + Math.sin(a) * 24)}" x2="${r1(300 + Math.cos(a) * 32)}" y2="${r1(48 + Math.sin(a) * 32)}" class="ac"/>`; }).join("");
    return W("0 0 360 300", "Sonne als Gegenlicht", `
      ${pp(0, `<circle cx="300" cy="48" r="17" class="fa"/>${rays}${T(300, 96, "Sonne = Backlight", "tb", "middle")}`)}
      ${beam(284, 60, 196, 118, "ac", 1)}
      ${subjectTop(180, 130)}
      <path d="M166 114 A21 21 0 0 1 198 116" class="ac pp" style="--i:2;stroke-width:4"/>
      ${[0, 1, 2].map(i => beam(78, 200 - i * 6, 160, 140 + i * 6, "acsoft", i + 2)).join("")}
      <rect x="40" y="186" width="56" height="12" rx="2" transform="rotate(-35 68 192)" class="fwhite"/>
      ${pp(3, T(46, 236, "Bounce / Diffusion", "tb", "middle") + T(46, 250, "= Key von vorne", "t", "middle"))}
      ${cameraTop(180, 262)}`);
  }

  function stopsLadder() {
    const rows = [["Key (Gesicht)", 0, 0], ["Fill", -2, -3], ["Hintergrund", -1.5, -3.5]];
    const x = s => r1(300 + s * 60);
    return W("0 0 360 200", "Belichtung in Blendenstufen", `
      ${[0, -1, -2, -3, -4].map(s => `<line x1="${x(s)}" y1="30" x2="${x(s)}" y2="170" class="gd"/>${T(x(s), 188, s === 0 ? "0" : String(s), "t", "middle")}`).join("")}
      ${T(300, 18, "Blendenstufen relativ zum Key", "t", "end")}
      ${rows.map(([n, a, b], i) => {
        const y = 52 + i * 44;
        return pp(i, `${T(12, y + 5, n, "tb")}${a === b ? `<circle cx="${x(a)}" cy="${y}" r="8" class="fa"/>`
          : `<rect x="${x(b)}" y="${y - 8}" width="${r1(x(a) - x(b))}" height="16" rx="8" class="fa" style="opacity:${0.9 - i * 0.2}"/>`}`);
      }).join("")}`);
  }

  function falseColor() {
    const bands = [[0, 2, "#6b2fbf"], [2, 10, "#2f5bd8"], [10, 38, "#3a3a3a"], [38, 45, "#3fb950"], [45, 52, "#5a5a5a"],
      [52, 56, "#ff7eb6"], [56, 84, "#8a8a8a"], [84, 97, "#f3d03e"], [97, 100, "#ff4545"]];
    const x = v => r1(20 + v * 3.2);
    const notes = [[1, "abgesoffen", 34], [41.5, "18 % Grau", 34], [54, "Haut", 152], [90, "fast weiß", 34], [98.5, "Clipping", 152]];
    return W("0 0 360 190", "False-Color-Legende (Beispiel)", `
      ${bands.map(([a, b, c]) => `<rect x="${x(a)}" y="70" width="${r1(x(b) - x(a))}" height="40" fill="${c}"/>`).join("")}
      <defs><linearGradient id="fcg" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".18"/></linearGradient></defs>
      <rect x="20" y="70" width="320" height="40" fill="url(#fcg)"/>
      ${[0, 20, 40, 60, 80, 100].map(v => `<line x1="${x(v)}" y1="110" x2="${x(v)}" y2="118" class="ln"/>${T(x(v), 132, v, "t", "middle")}`).join("")}
      ${notes.map(([v, s, y], i) => pp(i, `<line x1="${x(v)}" y1="${y > 100 ? 118 : 70}" x2="${x(v)}" y2="${y > 100 ? y - 12 : y + 6}" class="ln"/>${T(x(v), y, s, "tb", v > 95 ? "end" : v < 5 ? "start" : "middle")}`)).join("")}
      ${T(180, 182, "IRE / % – Farben je nach Kamera/Monitor verschieden", "t", "middle")}`);
  }

  /* ---------------- Film: Schnitt, Ton, Dramaturgie ---------------- */

  function rule180() {
    return W("0 0 360 280", "180-Grad-Regel", `
      <rect x="10" y="124" width="340" height="146" rx="6" fill="rgba(92,207,122,.1)"/>
      <rect x="10" y="10" width="340" height="110" rx="6" fill="rgba(255,93,93,.08)"/>
      <line x1="10" y1="122" x2="350" y2="122" class="ac dash dr" pathLength="1"/>
      ${T(16, 142, "Handlungsachse", "th")}
      ${pp(0, `<circle cx="120" cy="122" r="16" class="fm2"/>${T(120, 127, "A", "tb", "middle")}<circle cx="240" cy="122" r="16" class="fm2"/>${T(240, 127, "B", "tb", "middle")}`)}
      ${pp(1, `${cameraTop(150, 222)}${cameraTop(220, 222)}${T(185, 262, "Kameras auf einer Seite: Blickrichtungen bleiben", "t", "middle")}`)}
      ${pp(2, `<g transform="rotate(180 180 46)"><rect x="164" y="36" width="32" height="22" rx="4" class="fa"/><path d="M171 36 L167 24 L193 24 L189 36 Z" class="fa"/></g><path d="M164 32 L196 62 M196 32 L164 62" stroke="#ff5d5d" stroke-width="3"/>${T(180, 92, "Achsensprung – verwirrt", "t", "middle")}`)}`);
  }

  function jlCut() {
    const track = (y, segs, i) => segs.map(([a, b, c, t]) => `<rect x="${a}" y="${y}" width="${b - a}" height="22" rx="4" fill="${c}" class="pp" style="--i:${i}"/>${t ? T(a + 8, y + 15, t, "tdark") : ""}`).join("");
    const A = "#ff8a3d", B = "#2ec4c4";
    const block = (y0, title, v, a, note) => `${T(10, y0, title, "tbig")}${T(10, y0 + 16, note, "t")}
      ${T(30, y0 + 44, "V", "t", "end")}${track(y0 + 30, v, 1)}${T(30, y0 + 72, "A", "t", "end")}${track(y0 + 58, a, 2)}
      <line x1="190" y1="${y0 + 24}" x2="190" y2="${y0 + 86}" class="ln dash"/>`;
    return W("0 0 360 250", "J-Cut und L-Cut", `
      ${block(20, "J-Cut", [[38, 188, A, "Szene 1"], [192, 350, B, "Szene 2"]], [[38, 128, A], [132, 350, B, "Ton 2 kommt früher"]], "Ton der nächsten Szene beginnt vorher")}
      ${block(140, "L-Cut", [[38, 188, A, "Szene 1"], [192, 350, B, "Szene 2"]], [[38, 268, A, "Ton 1 läuft weiter"], [272, 350, B]], "Ton läuft unter dem neuen Bild weiter")}`);
  }

  function ruleOfSix() {
    const data = [["Emotion", 51], ["Story", 23], ["Rhythmus", 10], ["Blickführung", 7], ["2D-Bildebene", 5], ["3D-Raum", 4]];
    const x0 = 112, max = 230;
    return W("0 0 360 220", "Walter Murchs Rule of Six", data.map(([n, v], i) => {
      const y = 18 + i * 32, w = r1((v / 51) * max);
      return pp(i, `${T(x0 - 10, y + 15, n, "tb", "end")}<rect x="${x0}" y="${y}" width="${w}" height="20" rx="4" class="fa" style="opacity:${1 - i * 0.12}"/>${T(r1(x0 + w + 6), y + 15, v + " %", "th")}`);
    }).join(""));
  }

  function soundLayers() {
    const rows = [
      ["Dialog", t => (Math.sin(t * 0.9) > -0.2 ? 0.55 + 0.4 * Math.abs(Math.sin(t * 3.1)) : 0.05)],
      ["Atmo", t => 0.22 + 0.06 * Math.sin(t * 1.7)],
      ["Foley", t => (Math.sin(t * 2.3) > 0.85 ? 0.7 : 0.04)],
      ["SFX", t => (Math.abs(t - 14) < 0.6 || Math.abs(t - 30) < 0.6 ? 0.95 : 0.03)],
      ["Musik", t => 0.4 + 0.15 * Math.sin(t * 0.5) + 0.1 * Math.abs(Math.sin(t * 2))]
    ];
    return W("0 0 360 230", "Tonebenen im Schnitt", rows.map(([n, f], i) => {
      const y = 26 + i * 42;
      const bars = Array.from({ length: 64 }, (_, k) => { const h = Math.max(1, f(k * 0.6) * 30); return `<rect x="${r1(80 + k * 4.1)}" y="${r1(y - h / 2)}" width="2.6" height="${r1(h)}" rx="1"/>`; }).join("");
      return pp(i, `${T(66, y + 4, n, "tb", "end")}<g class="${i === 0 ? "fa" : i === 4 ? "fteal" : "fm3"}">${bars}</g>`);
    }).join(""));
  }

  function threeAct() {
    const x = p => r1(20 + p * 320), y = v => r1(190 - v * 150);
    const pts = [[0, 0.12], [0.18, 0.18], [0.25, 0.38], [0.5, 0.55], [0.62, 0.48], [0.75, 0.3], [0.88, 0.95], [0.95, 0.5], [1, 0.32]];
    const d = "M" + pts.map(([p, v]) => `${x(p)} ${y(v)}`).join(" L");
    const marks = [[0.25, "Plot Point 1"], [0.5, "Midpoint"], [0.75, "Tiefpunkt"], [0.88, "Klimax"]];
    return W("0 0 360 240", "Drei-Akt-Struktur als Spannungskurve", `
      <rect x="${x(0)}" y="30" width="${x(0.25) - x(0)}" height="160" fill="rgba(255,255,255,.03)"/>
      <rect x="${x(0.75)}" y="30" width="${x(1) - x(0.75)}" height="160" fill="rgba(255,255,255,.03)"/>
      ${T(x(0.125), 222, "I · 25 %", "th", "middle")}${T(x(0.5), 222, "II · 50 %", "th", "middle")}${T(x(0.875), 222, "III · 25 %", "th", "middle")}
      <line x1="20" y1="190" x2="340" y2="190" class="gd"/>${T(20, 22, "Spannung", "t")}
      <path d="${d}" class="ac dr" pathLength="1" style="stroke-width:3;stroke-linejoin:round"/>
      ${marks.map(([p, n], i) => { const v = pts.find(q => q[0] === p)[1]; return pp(i + 1, `<circle cx="${x(p)}" cy="${y(v)}" r="5" class="fa"/>${T(x(p), r1(y(v) - 10), n, "tb", p > 0.85 ? "end" : "middle")}`); }).join("")}`);
  }

  /* ---------------- Color ---------------- */

  function waveform() {
    let dots = "";
    let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let k = 0; k < 900; k++) {
      const xp = rnd();
      let v;
      if (xp > 0.38 && xp < 0.62 && rnd() > 0.35) v = 0.45 + rnd() * 0.25;         // Gesicht
      else if (xp > 0.78 && xp < 0.92 && rnd() > 0.4) v = 0.82 + rnd() * 0.12;    // Fenster
      else v = 0.06 + rnd() * 0.2 + (xp > 0.38 && xp < 0.62 ? 0.08 : 0);          // Hintergrund
      dots += `<rect x="${r1(40 + xp * 270)}" y="${r1(200 - v * 180)}" width="1.6" height="1.6"/>`;
    }
    return W("0 0 360 225", "Waveform eines Porträts", `
      ${[0, 25, 50, 75, 100].map(v => `<line x1="40" y1="${200 - v * 1.8}" x2="310" y2="${200 - v * 1.8}" class="gd"/>${T(32, 204 - v * 1.8, v, "t", "end")}`).join("")}
      <g class="fwave pp" style="--i:0">${dots}</g>
      ${pp(1, `<line x1="314" y1="${200 - 0.95 * 180}" x2="314" y2="${200 - 0.82 * 180}" class="ac"/>${T(320, 52, "Lichter", "tb")}`)}
      ${pp(2, `<line x1="314" y1="${200 - 0.7 * 180}" x2="314" y2="${200 - 0.45 * 180}" class="ac"/>${T(320, 98, "Haut", "tb")}${T(320, 112, "≈ 40–70", "t")}`)}
      ${pp(3, `<line x1="314" y1="${200 - 0.3 * 180}" x2="314" y2="${200 - 0.06 * 180}" class="ac"/>${T(320, 170, "Schatten", "tb")}`)}
      ${T(175, 222, "links ↔ rechts im Bild", "t", "middle")}`);
  }

  function parade() {
    let seed = 3; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const col = (x0, shift, color, i) => {
      let d = "";
      for (let k = 0; k < 260; k++) { const xp = rnd(); const v = Math.min(0.98, 0.15 + xp * 0.55 + rnd() * 0.12 + shift); d += `<rect x="${r1(x0 + xp * 96)}" y="${r1(190 - v * 170)}" width="1.6" height="1.6"/>`; }
      return pp(i, `<g fill="${color}">${d}</g>`);
    };
    return W("0 0 360 225", "RGB-Parade mit Blaustich", `
      ${[0, 50, 100].map(v => `<line x1="20" y1="${190 - v * 1.7}" x2="340" y2="${190 - v * 1.7}" class="gd"/>`).join("")}
      ${col(24, 0, "#ff6b6b", 0)}${col(132, 0.01, "#6bff8e", 1)}${col(240, 0.12, "#6b9bff", 2)}
      ${T(72, 212, "R", "th", "middle")}${T(180, 212, "G", "th", "middle")}${T(288, 212, "B", "th", "middle")}
      ${pp(3, `<path d="M240 ${r1(190 - 0.82 * 170)} h96" class="ac dash"/>${T(336, 22, "Blau steht höher → Blaustich", "tb", "end")}`)}`);
  }

  function vectorscope() {
    const cx = 132, cy = 120, R = 100, s = R / 0.5;
    const tg = { R: [.75, 0, 0, "#ff5d5d"], Mg: [.75, 0, .75, "#e05cff"], B: [0, 0, .75, "#6b8bff"], Cy: [0, .75, .75, "#2ec4c4"], G: [0, .75, 0, "#5ccf7a"], Yl: [.75, .75, 0, "#f3d03e"] };
    const [su, sv] = cbcr(0.85, 0.62, 0.5); const len = Math.hypot(su, sv);
    let seed = 11; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    let cloud = "";
    for (let k = 0; k < 220; k++) { const t = rnd() * 0.75 + 0.1, j = (rnd() - 0.5) * 0.08; cloud += `<rect x="${r1(cx + (su / len * t - sv / len * j) * R)}" y="${r1(cy - (sv / len * t + su / len * j) * R)}" width="1.8" height="1.8"/>`; }
    return W("0 0 360 240", "Vectorscope mit Hautton-Linie", `
      <circle cx="${cx}" cy="${cy}" r="${R}" class="ln"/><circle cx="${cx}" cy="${cy}" r="${R / 2}" class="gd"/>
      <line x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}" class="gd"/><line x1="${cx}" y1="${cy - R}" x2="${cx}" y2="${cy + R}" class="gd"/>
      ${Object.entries(tg).map(([n, [r, g, b, c]], i) => { const [u, v] = cbcr(r, g, b); const x = r1(cx + u * s), y = r1(cy - v * s);
        return pp(i, `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="none" stroke="${c}" stroke-width="1.5"/>${T(r1(x + (u > 0 ? 10 : -10)), y + 4, n, "tb", u > 0 ? "start" : "end")}`); }).join("")}
      <line x1="${cx}" y1="${cy}" x2="${r1(cx + su / len * R)}" y2="${r1(cy - sv / len * R)}" class="ac dash dr" pathLength="1" style="stroke-width:2"/>
      <g class="fwave pp" style="--i:6">${cloud}</g>
      ${pp(7, `${T(300, 40, "Hautton-Linie", "tb", "middle")}${T(300, 54, "alle Hauttypen", "t", "middle")}${T(300, 66, "liegen darauf", "t", "middle")}`)}
      ${pp(8, `${T(300, 160, "Winkel = Farbton", "t", "middle")}${T(300, 174, "Abstand = Sättigung", "t", "middle")}`)}`);
  }

  function liftGammaGain() {
    const g = (x0, title, f, i) => {
      const pts = Array.from({ length: 41 }, (_, k) => { const v = k / 40; return `${r1(x0 + v * 90)} ${r1(150 - Math.min(1, Math.max(0, f(v))) * 110)}`; }).join(" L");
      return pp(i, `<rect x="${x0}" y="40" width="90" height="110" class="ln" style="opacity:.4"/>
        <line x1="${x0}" y1="150" x2="${x0 + 90}" y2="40" class="gd dash"/>
        <path d="M${pts}" class="ac dr" pathLength="1" style="--i:${i};stroke-width:2.5"/>
        ${T(x0 + 45, 24, title[0], "tbig", "middle")}${T(x0 + 45, 172, title[1], "t", "middle")}`);
    };
    return W("0 0 360 200", "Lift, Gamma und Gain als Kurven", `
      ${g(15, ["Lift", "→ Schatten"], v => v + 0.25 * (1 - v), 0)}
      ${g(135, ["Gamma", "→ Mitten"], v => Math.pow(v, 1 / 1.6), 1)}
      ${g(255, ["Gain", "→ Lichter"], v => v * 0.7, 2)}
      ${T(180, 194, "Eingang → Ausgang · gestrichelt = unverändert", "t", "middle")}`);
  }

  function hueRing(cx, cy, r, w, n = 36) {
    let out = "";
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const p = (a, rr) => `${r1(cx + Math.cos(a) * rr)} ${r1(cy + Math.sin(a) * rr)}`;
      out += `<path d="M${p(a0, r)} A${r} ${r} 0 0 1 ${p(a1, r)} L${p(a1, r - w)} A${r - w} ${r - w} 0 0 0 ${p(a0, r - w)} Z" fill="hsl(${(k / n) * 360} 80% 58%)"/>`;
    }
    return out;
  }
  const huePos = (cx, cy, r, h) => { const a = (h / 360) * 2 * Math.PI - Math.PI / 2; return [r1(cx + Math.cos(a) * r), r1(cy + Math.sin(a) * r)]; };

  function complement() {
    const cx = 130, cy = 120, R = 92;
    const pairs = [[0, "Rot", "Cyan"], [120, "Grün", "Magenta"], [240, "Blau", "Gelb"]];
    return W("0 0 360 240", "Komplementärfarben im Farbkreis", `${hueRing(cx, cy, R, 18)}
      ${pairs.map(([h, a, b], i) => { const p1 = huePos(cx, cy, R - 9, h), p2 = huePos(cx, cy, R - 9, h + 180);
        return `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" class="ln dr" pathLength="1" style="--i:${i};stroke-width:2"/>
          ${pp(i + 1, `<circle cx="${p1[0]}" cy="${p1[1]}" r="5" class="fb"/><circle cx="${p2[0]}" cy="${p2[1]}" r="5" class="fb"/>${T(250, 70 + i * 34, `${a} ↔ ${b}`, "tb")}`)}`; }).join("")}
      ${pp(4, T(250, 190, "Stich entfernen =", "t") + T(250, 204, "Gegenfarbe dazu", "t"))}`);
  }

  function sCurve() {
    const f = v => 1 / (1 + Math.exp(-9 * (v - 0.5)));
    const lo = f(0), hi = f(1);
    const pts = Array.from({ length: 41 }, (_, k) => { const v = k / 40; const o = (f(v) - lo) / (hi - lo); return `${r1(40 + v * 180)} ${r1(200 - (0.06 + o * 0.9) * 180)}`; }).join(" L");
    return W("0 0 360 220", "S-Kurve für mehr Kontrast", `
      <rect x="40" y="20" width="180" height="180" class="ln" style="opacity:.4"/>
      ${[0.25, 0.5, 0.75].map(v => `<line x1="${40 + v * 180}" y1="20" x2="${40 + v * 180}" y2="200" class="gd"/><line x1="40" y1="${20 + v * 180}" x2="220" y2="${20 + v * 180}" class="gd"/>`).join("")}
      <line x1="40" y1="200" x2="220" y2="20" class="gd dash"/>
      <path d="M${pts}" class="ac dr" pathLength="1" style="stroke-width:3"/>
      ${pp(1, `<circle cx="85" cy="${r1(200 - (0.06 + ((f(0.25) - lo) / (hi - lo)) * 0.9) * 180)}" r="5" class="fa"/>${T(240, 160, "Schatten runter", "tb")}`)}
      ${pp(2, `<circle cx="175" cy="${r1(200 - (0.06 + ((f(0.75) - lo) / (hi - lo)) * 0.9) * 180)}" r="5" class="fa"/>${T(240, 60, "Lichter hoch", "tb")}`)}
      ${pp(3, `${T(240, 100, "Schwarzpunkt", "t")}${T(240, 114, "angehoben = Fade", "t")}`)}`);
  }

  function logCurve() {
    const x = s => r1(30 + ((s + 8) / 14) * 300), y = v => r1(200 - v * 175);
    const log = s => Math.min(0.95, Math.max(0.05, 0.42 + s * 0.065));
    const rec = s => { const lin = 0.18 * Math.pow(2, s); return Math.min(1, Math.pow(Math.min(lin, 1), 1 / 2.4) * 1.0); };
    const path = f => "M" + Array.from({ length: 57 }, (_, k) => { const s = -8 + k * 0.25; return `${x(s)} ${y(f(s))}`; }).join(" L");
    return W("0 0 360 230", "Log-Kurve und Rec.709 im Vergleich", `
      ${[-8, -4, 0, 4, 6].map(s => `<line x1="${x(s)}" y1="20" x2="${x(s)}" y2="200" class="gd"/>${T(x(s), 216, s > 0 ? "+" + s : s, "t", "middle")}`).join("")}
      ${T(330, 228, "Blenden um Mittelgrau", "t", "end")}
      <path d="${path(rec)}" class="ln dr" pathLength="1" style="stroke-width:2.5"/>
      <path d="${path(log)}" class="ac dr" pathLength="1" style="--i:1;stroke-width:3"/>
      ${pp(2, T(40, 32, "Rec.709: kontrastreich,", "tb") + T(40, 46, "clippt bei ~+2,5 Blenden", "t"))}
      ${pp(3, T(196, 172, "Log: flach, aber", "tb") + T(196, 186, "~14 Blenden Zeichnung", "t"))}`);
  }

  function gamut() {
    const locus = [[0.1741, 0.005], [0.144, 0.0297], [0.1241, 0.0578], [0.0913, 0.1327], [0.0454, 0.295], [0.0082, 0.5384], [0.0139, 0.7502],
      [0.0743, 0.8338], [0.1547, 0.8059], [0.2296, 0.7543], [0.3016, 0.6923], [0.3731, 0.6245], [0.4441, 0.5547], [0.5125, 0.4866],
      [0.5752, 0.4242], [0.627, 0.3725], [0.6915, 0.3083], [0.7347, 0.2653]];
    const X = v => r1(30 + v * 330), Y = v => r1(250 - v * 270);
    const P = pts => pts.map(([a, b]) => `${X(a)} ${Y(b)}`).join(" L");
    const tri = [["Rec.2020", [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]], "#b062ff"], ["DCI-P3", [[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]], "#2ec4c4"], ["Rec.709", [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]], "#ff8a3d"]];
    return W("0 0 360 260", "Farbräume im Vergleich", `
      <defs><linearGradient id="loc" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4b5bff" stop-opacity=".35"/><stop offset=".5" stop-color="#3fd97a" stop-opacity=".3"/><stop offset="1" stop-color="#ff5a3a" stop-opacity=".35"/></linearGradient></defs>
      <path d="M${P(locus)} Z" fill="url(#loc)" stroke="rgba(255,255,255,.35)"/>
      ${tri.map(([n, pts, c], i) => `<path d="M${P(pts)} Z" fill="none" stroke="${c}" stroke-width="2" class="dr" pathLength="1" style="--i:${i}"/>
        ${pp(i + 1, `<line x1="250" y1="${40 + i * 22}" x2="268" y2="${40 + i * 22}" stroke="${c}" stroke-width="3"/>${T(274, 44 + i * 22, n, "tb")}`)}`).join("")}
      ${pp(4, T(250, 120, "alle sichtbaren", "t") + T(250, 134, "Farben (Hufeisen)", "t"))}`);
  }

  function powerWindow() {
    return W("0 0 360 240", "Power Window mit Softness", `
      <rect x="20" y="16" width="320" height="200" rx="6" fill="rgba(0,0,0,.25)"/>
      <ellipse cx="150" cy="110" rx="46" ry="58" class="fm2"/><path d="M84 216 Q150 150 216 216 Z" class="fm2"/>
      <ellipse cx="150" cy="104" rx="88" ry="98" fill="none" stroke="rgba(255,255,255,.35)" stroke-dasharray="4 5" class="pp" style="--i:1"/>
      <ellipse cx="150" cy="104" rx="60" ry="72" class="ac dr" pathLength="1" style="stroke-width:2.5"/>
      ${pp(2, `<line x1="210" y1="80" x2="250" y2="60" class="ln"/>${T(254, 58, "Innen: volle", "tb")}${T(254, 72, "Korrektur", "t")}`)}
      ${pp(3, `<line x1="236" y1="130" x2="256" y2="130" class="ln"/>${T(260, 126, "Softness:", "tb")}${T(260, 140, "weicher Übergang", "t")}`)}
      ${pp(4, `<path d="M96 200 q-30 -10 -44 -40" class="ac dash"/><path d="M48 166 l4 -8 l6 7" class="ac"/>${T(28, 150, "Tracking", "tb")}`)}`);
  }

  function harmonies() {
    const wheel = (cx, title, hues, i) => `${hueRing(cx, 96, 46, 10, 24)}
      ${hues.map(h => { const p = huePos(cx, 96, 41, h); return `<line x1="${cx}" y1="96" x2="${p[0]}" y2="${p[1]}" class="ln pp" style="--i:${i}"/><circle cx="${p[0]}" cy="${p[1]}" r="6" class="fb pp" style="--i:${i}"/>`; }).join("")}
      ${T(cx, 168, title, "tb", "middle")}`;
    return W("0 0 360 200", "Farbharmonien", `
      ${wheel(62, "Komplementär", [30, 210], 0)}${wheel(180, "Analog", [10, 40, 70], 1)}${wheel(298, "Triadisch", [0, 120, 240], 2)}
      ${T(62, 184, "Teal & Orange", "t", "middle")}${T(180, 184, "ruhig, harmonisch", "t", "middle")}${T(298, 184, "bunt, verspielt", "t", "middle")}`);
  }

  /* ---------------- Instagram Edits ---------------- */

  const phone = (x, y, w, h) => `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="16" fill="#0b0c0f" stroke="rgba(255,255,255,.25)"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="rgba(255,255,255,.04)"/>`;

  function safeZones() {
    const s = 0.14, x = 34, y = 16, w = 1080 * s, h = 1920 * s;
    const top = 220 * s, bot = 420 * s, right = 120 * s;
    return W("0 0 360 300", "Safe Zones für Reels", `${phone(x, y, w, h)}
      <rect x="${x}" y="${y}" width="${r1(w)}" height="${r1(top)}" fill="rgba(255,93,93,.25)" class="pp" style="--i:0"/>
      <rect x="${x}" y="${r1(y + h - bot)}" width="${r1(w)}" height="${r1(bot)}" fill="rgba(255,93,93,.25)" class="pp" style="--i:1"/>
      <rect x="${r1(x + w - right)}" y="${r1(y + top)}" width="${r1(right)}" height="${r1(h - top - bot)}" fill="rgba(255,93,93,.18)" class="pp" style="--i:2"/>
      <rect x="${x + 4}" y="${r1(y + top + 4)}" width="${r1(w - right - 8)}" height="${r1(h - top - bot - 8)}" rx="6" class="ac dr" pathLength="1" style="stroke-width:2"/>
      ${T(r1(x + (w - right) / 2), r1(y + top + (h - top - bot) / 2), "Gesicht &amp;", "tb", "middle")}${T(r1(x + (w - right) / 2), r1(y + top + (h - top - bot) / 2 + 15), "Text hier", "tb", "middle")}
      ${[[y + top / 2, "oben ≈ 220 px", "Kamera-UI, Reels-Titel"], [y + top + (h - top - bot) / 2, "rechts ≈ 120 px", "Like · Kommentar · Teilen"], [y + h - bot / 2, "unten ≈ 420 px", "Caption, Name, Audio"]]
        .map(([yy, a, b], i) => pp(i + 3, `<line x1="${r1(x + w + 6)}" y1="${r1(yy)}" x2="206" y2="${r1(yy)}" class="ln dash"/>${T(212, r1(yy - 2), a, "tb")}${T(212, r1(yy + 12), b, "t")}`)).join("")}
      ${T(212, 292, "1080 × 1920 px · 9:16", "th")}`);
  }

  function retention() {
    const x = t => r1(40 + (t / 30) * 300), y = p => r1(200 - p * 1.7);
    const curve = (f) => "M" + Array.from({ length: 61 }, (_, k) => { const t = k * 0.5; return `${x(t)} ${y(f(t))}`; }).join(" L");
    return W("0 0 360 230", "Zuschauerbindung mit und ohne Hook", `
      <rect x="${x(0)}" y="20" width="${r1(x(3) - x(0))}" height="180" fill="rgba(255,138,61,.12)"/>${T(r1((x(0) + x(3)) / 2), 16, "Hook", "th", "middle")}
      ${[0, 50, 100].map(p => `<line x1="40" y1="${y(p)}" x2="340" y2="${y(p)}" class="gd"/>${T(34, r1(y(p) + 4), p + "%", "t", "end")}`).join("")}
      ${[0, 10, 20, 30].map(t => T(x(t), 216, t + " s", "t", "middle")).join("")}
      <path d="${curve(t => 100 * Math.exp(-t / 2.2) * 0.75 + 25 * Math.exp(-t / 30))}" class="ln dr" pathLength="1" style="stroke-width:2.5"/>
      <path d="${curve(t => 100 * Math.exp(-t / 40) - (t < 3 ? t * 3 : 9))}" class="ac dr" pathLength="1" style="--i:1;stroke-width:3"/>
      ${pp(2, T(200, 72, "mit starkem Hook", "tb"))}${pp(3, T(150, 148, "ohne Hook: früh weggewischt", "t"))}`);
  }

  function beats() {
    const x = t => r1(20 + t * 80);
    const ticks = Array.from({ length: 9 }, (_, k) => k * 0.5);
    const clips = [[0, 1, "#ff8a3d"], [1, 2, "#ffb36b"], [2, 2.5, "#2ec4c4"], [2.5, 3, "#7b6cff"], [3, 3.5, "#ff4f8b"], [3.5, 4, "#2ec4c4"]];
    return W("0 0 360 200", "Schnitt auf den Beat bei 120 BPM", `
      ${ticks.map((t, i) => `<line x1="${x(t)}" y1="40" x2="${x(t)}" y2="150" class="${i % 2 ? "gd" : "ln"} dash"/>${pp(i, `<circle cx="${x(t)}" cy="40" r="${i % 2 ? 3 : 5}" class="fa"/>`)}`).join("")}
      ${Array.from({ length: 80 }, (_, k) => { const t = k * 0.05; const h = 6 + 26 * Math.exp(-((t * 2) % 1) * 5); return `<rect x="${r1(x(t))}" y="${r1(70 - h / 2)}" width="2.5" height="${r1(h)}" class="fteal"/>`; }).join("")}
      ${clips.map(([a, b, c], i) => `<rect x="${r1(x(a) + 1)}" y="104" width="${r1(x(b) - x(a) - 2)}" height="26" rx="4" fill="${c}" class="pp" style="--i:${i + 2}"/>`).join("")}
      <line x1="${x(2)}" y1="26" x2="${x(2)}" y2="140" class="ac" style="stroke-width:2"/>${T(x(2), 20, "Drop", "th", "middle")}
      ${T(20, 170, "1 Beat = 60 / 120 BPM = 0,5 s", "tb")}${T(20, 186, "vor dem Drop lange Clips, danach auf jeden Beat", "t")}`);
  }

  function speedRamp() {
    const x = t => r1(30 + t * 300), y = v => r1(190 - (v / 200) * 160);
    const f = t => t < 0.3 ? 100 : t < 0.45 ? 100 - (t - 0.3) / 0.15 * 75 : t < 0.6 ? 25 : t < 0.72 ? 25 + (t - 0.6) / 0.12 * 175 : t < 0.85 ? 200 : 200 - (t - 0.85) / 0.15 * 100;
    const d = "M" + Array.from({ length: 101 }, (_, k) => `${x(k / 100)} ${y(f(k / 100))}`).join(" L");
    return W("0 0 360 220", "Speed Ramp", `
      ${[25, 100, 200].map(v => `<line x1="30" y1="${y(v)}" x2="330" y2="${y(v)}" class="gd"/>${T(26, r1(y(v) + 4), v + "%", "t", "end")}`).join("")}
      <path d="${d}" class="ac dr" pathLength="1" style="stroke-width:3;stroke-linejoin:round"/>
      ${pp(1, T(x(0.52), r1(y(25) + 18), "Zeitlupe auf den Höhepunkt", "tb", "middle"))}
      ${pp(2, T(x(0.78), r1(y(200) - 10), "schnell", "tb", "middle"))}
      ${pp(3, T(30, 214, "Material mit 60 fps+ filmen, sonst ruckelt die Zeitlupe", "t"))}`);
  }

  function slowShutter() {
    const car = (x, y) => `<path d="M${x} ${y} h70 q8 0 10 -8 l-12 -14 h-36 l-14 14 h-18 z" class="fm2"/><circle cx="${x + 14}" cy="${y + 2}" r="7" class="fb"/><circle cx="${x + 58}" cy="${y + 2}" r="7" class="fb"/>`;
    const streaks = (x, y, len, n) => Array.from({ length: n }, (_, k) => `<rect x="${x - len}" y="${y - 22 + k * 6}" width="${len}" height="3" rx="1.5" fill="url(#streak)"/>`).join("");
    return W("0 0 360 220", "Kurze und lange Verschlusszeit", `
      <defs><linearGradient id="streak" x1="0" x2="1"><stop offset="0" stop-color="#ff8a3d" stop-opacity="0"/><stop offset="1" stop-color="#ff8a3d" stop-opacity=".8"/></linearGradient></defs>
      <rect x="10" y="20" width="160" height="130" rx="8" fill="rgba(255,255,255,.03)"/><rect x="190" y="20" width="160" height="130" rx="8" fill="rgba(255,255,255,.03)"/>
      ${pp(0, `${streaks(76, 104, 18, 4)}${car(60, 104)}${T(90, 176, "1/50 s", "tbig", "middle")}${T(90, 192, "normale Bewegung", "t", "middle")}`)}
      ${pp(1, `${streaks(270, 104, 70, 5)}<g opacity=".8">${car(260, 104)}</g>${T(270, 176, "1/8 s", "tbig", "middle")}${T(270, 192, "Streifen = Speed", "t", "middle")}`)}
      ${T(180, 214, "Weitwinkel · nah am Boden · danach beschleunigen", "t", "middle")}`);
  }

  function soundEnvelope() {
    const x = t => r1(20 + t * 32);
    const env = t => t < 3 ? 0.08 + (t / 3) * 0.75 : t < 3.6 ? 0.02 : t < 4.1 ? 1 - (t - 3.6) * 1.4 : t < 6 ? 0.35 + 0.05 * Math.sin(t * 9) : t < 7 ? 0.35 + Math.sin((t - 6) * Math.PI) * 0.45 : 0.35;
    const bars = Array.from({ length: 100 }, (_, k) => { const t = k * 0.1; const h = Math.max(1.5, env(t) * 120); return `<rect x="${x(t)}" y="${r1(110 - h / 2)}" width="2" height="${r1(h)}" rx="1"/>`; }).join("");
    const labels = [[1.5, "Riser"], [3.3, "Stille"], [3.85, "Hit"], [6.5, "Whoosh"], [8.5, "Musik"]];
    const ly = i => (i === 2 ? 218 : 202);
    return W("0 0 360 228", "Sounddesign-Bausteine", `<g class="fa">${bars}</g>
      ${labels.map(([t, n], i) => pp(i, `<line x1="${x(t)}" y1="176" x2="${x(t)}" y2="${ly(i) - 14}" class="ln"/>${T(x(t), ly(i), n, "tb", "middle")}`)).join("")}
      ${T(20, 20, "Lautstärke über die Zeit", "t")}`);
  }

  function keyframes() {
    const x = t => r1(40 + t * 280), y = v => r1(150 - v * 100);
    const path = f => "M" + Array.from({ length: 51 }, (_, k) => `${x(k / 50)} ${y(f(k / 50))}`).join(" L");
    const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return W("0 0 360 220", "Keyframes mit linearer und weicher Interpolation", `
      <line x1="30" y1="180" x2="330" y2="180" class="ln"/>
      ${[0, 1].map((t, i) => pp(i, `<rect x="${x(t) - 7}" y="173" width="14" height="14" transform="rotate(45 ${x(t)} 180)" class="fa"/><line x1="${x(t)}" y1="40" x2="${x(t)}" y2="170" class="gd dash"/>`)).join("")}
      ${T(x(0), 34, "Keyframe 1: 100 %", "tb", "start")}${T(x(1), 34, "Keyframe 2: 140 %", "tb", "end")}
      <path d="${path(t => t)}" class="ln dr" pathLength="1" style="stroke-width:2"/>
      <path d="${path(ease)}" class="ac dr" pathLength="1" style="--i:1;stroke-width:3"/>
      ${pp(2, `<line x1="60" y1="208" x2="80" y2="208" class="ln" style="stroke-width:2"/>${T(86, 212, "linear", "tb")}`)}
      ${pp(3, `<line x1="170" y1="208" x2="190" y2="208" class="ac" style="stroke-width:3"/>${T(196, 212, "Ease In/Out = weicher", "tb")}`)}`);
  }

  function captionPhone() {
    const s = 0.14, x = 34, y = 16, w = 1080 * s, h = 1920 * s;
    return W("0 0 360 300", "Untertitel richtig platzieren", `${phone(x, y, w, h)}
      <rect x="${x}" y="${y}" width="${r1(w)}" height="${r1(h)}" rx="11" fill="url(#capbg)"/>
      <defs><linearGradient id="capbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f3a"/><stop offset="1" stop-color="#14161b"/></linearGradient></defs>
      <circle cx="${r1(x + w / 2)}" cy="${r1(y + h * 0.38)}" r="26" class="fm2"/>
      ${pp(0, `<rect x="${r1(x + 18)}" y="${r1(y + h * 0.56)}" width="${r1(w - 36)}" height="34" rx="6" fill="rgba(0,0,0,.55)"/>
        <text x="${r1(x + w / 2)}" y="${r1(y + h * 0.56 + 15)}" text-anchor="middle" class="capt">DIESER EINE</text>
        <text x="${r1(x + w / 2)}" y="${r1(y + h * 0.56 + 29)}" text-anchor="middle" class="capt"><tspan class="capt-hi">REGLER</tspan> ÄNDERT ALLES</text>`)}
      ${[["3–5 Wörter pro Zeile", 70], ["Kasten oder Kontur", 110], ["Keyword in Akzentfarbe", 150], ["in der Safe Zone", 190], ["max. 2 Schriften", 230]]
        .map(([t, yy], i) => pp(i + 1, `<circle cx="212" cy="${yy - 4}" r="3" class="fa"/>${T(222, yy, t, "tb")}`)).join("")}`);
  }

  /* ---------------- Zuordnung ---------------- */
  window.GRAFIKEN = {
    "film/einstellungsgroessen": [
      { abschnitt: "Einstellungsgrößen & Bildsprache", svg: shotSizes(), text: "Je enger der Rahmen, desto näher sind wir der Emotion." },
      { abschnitt: "Kameraperspektive", svg: perspective(), text: "Die Kamerahöhe bestimmt, wie mächtig eine Figur wirkt." },
      { abschnitt: "Bildkomposition", svg: thirds(), text: "Augen auf die Drittellinie, Platz in Blickrichtung lassen." }
    ],
    "film/kamera": [
      { abschnitt: "Kameratechnik: Belichtung, Shutter, Bildrate", svg: exposureTriangle(), text: "Drei Werte steuern die Helligkeit – jeder mit eigener Nebenwirkung." },
      { abschnitt: "Die 180°-Shutter-Regel", svg: shutter(), text: "Der Verschluss ist pro Bild halb so lange offen wie ein Frame dauert." },
      { abschnitt: "Objektive & Brennweite", svg: fov(), text: "Bildwinkel im Vollformat: je länger die Brennweite, desto enger." }
    ],
    "film/licht": [
      { abschnitt: "Licht: 3-Punkt-Licht & Lichtstimmung", svg: threePoint(), text: "Der klassische Aufbau von oben gesehen." },
      { abschnitt: "Lichtverhältnis (Contrast Ratio)", svg: ratios(), text: "Je dunkler die Schattenseite, desto dramatischer." },
      { abschnitt: "Hartes vs. weiches Licht", svg: hardSoft(), text: "Die Größe der Quelle entscheidet über die Schattenkante." },
      { abschnitt: "Farbtemperatur", svg: kelvin(), text: "Niedrige Kelvin = warm, hohe Kelvin = kalt." }
    ],
    "film/licht-commercial": [
      { abschnitt: "2. Negative Fill – Kontrast durch Wegnehmen", svg: negativeFill(), text: "Weicher Key über einen großen Bounce, Gegenseite schwarz abgedeckt." },
      { abschnitt: "3. Sonne als Backlight", svg: sunBack(), text: "Person drehen: Sonne von hinten, weicher Key von vorne." },
      { abschnitt: "5. Belichtung in Blendenstufen denken", svg: stopsLadder(), text: "Ausgangspunkt aus dem Location-Lighting-Tutorial von The Wandering DP." }
    ],
    "film/false-color": [
      { abschnitt: "Was ist False Color?", svg: falseColor(), text: "Beispiel-Legende. Lerne die Farben deines eigenen Geräts." },
      { abschnitt: "Lichtverhältnisse in Blendenstufen", svg: ratios(), text: "Jede Blendenstufe halbiert das Licht auf der Schattenseite." }
    ],
    "film/schnitt": [
      { abschnitt: "Continuity Editing (unsichtbarer Schnitt)", svg: rule180(), text: "Bleib auf einer Seite der Achse." },
      { abschnitt: "Schnitttechniken", svg: jlCut(), text: "Ton und Bild müssen nicht gleichzeitig schneiden." },
      { abschnitt: "Walter Murchs „Rule of Six“", svg: ruleOfSix(), text: "Gewichtung der Schnittgründe nach Walter Murch." }
    ],
    "film/ton": [{ abschnitt: "Die Tonebenen", svg: soundLayers(), text: "Fünf Ebenen ergeben zusammen den Klang einer Szene." }],
    "film/dramaturgie": [{ abschnitt: "Drei-Akt-Struktur", svg: threeAct(), text: "Die Spannung steigt bis zur Klimax im dritten Akt." }],
    "color/scopes": [
      { abschnitt: "Waveform (Luma)", svg: waveform(), text: "So sieht ein Porträt mit hellem Fenster in der Waveform aus." },
      { abschnitt: "RGB-Parade", svg: parade(), text: "Bei neutralen Flächen müssen alle drei Kanäle gleich hoch liegen." },
      { abschnitt: "Vectorscope", svg: vectorscope(), text: "Hauttöne sammeln sich auf der Hautton-Linie zwischen Rot und Gelb." }
    ],
    "color/primaries": [
      { abschnitt: "Primärkorrektur: Lift, Gamma, Gain & Kurven", svg: liftGammaGain(), text: "Was die drei Räder mit der Helligkeitskurve machen." },
      { abschnitt: "Komplementärfarben – das Grundgesetz", svg: complement(), text: "Gegenüberliegende Farben heben sich gegenseitig auf." },
      { abschnitt: "Kurven", svg: sCurve(), text: "Die S-Kurve: der schnellste Weg zu mehr Kontrast." }
    ],
    "color/log-lut": [
      { abschnitt: "Warum Log so grau aussieht", svg: logCurve(), text: "Log verteilt viel mehr Blendenstufen auf die verfügbaren Werte." },
      { abschnitt: "Farbraum & Gamma", svg: gamut(), text: "Rec.709 deckt nur einen Teil der sichtbaren Farben ab." }
    ],
    "color/secondaries": [{ abschnitt: "Werkzeuge", svg: powerWindow(), text: "Eine getrackte Maske mit weicher Kante hellt nur das Gesicht auf." }],
    "color/looks": [{ abschnitt: "Farbharmonien", svg: harmonies(), text: "Drei klassische Wege, Farben zu kombinieren." }],
    "edits/edits-app": [{ abschnitt: "Safe Zones (sichere Bereiche)", svg: safeZones(), text: "Rot = wird von Instagram überdeckt." }],
    "edits/hook": [{ abschnitt: "Hook & Retention: Die ersten 3 Sekunden", svg: retention(), text: "Schematische Darstellung: Die ersten Sekunden entscheiden." }],
    "edits/beat-sync": [
      { abschnitt: "Beats markieren", svg: beats(), text: "Clips enden auf den Beat-Markern." },
      { abschnitt: "Speed Ramps", svg: speedRamp(), text: "Tempo innerhalb eines Clips verändern." }
    ],
    "edits/kinetic-editing": [{ abschnitt: "Rezept: Der F1-Slow-Shutter-Look", svg: slowShutter(), text: "Lange Belichtung zieht Bewegung zu Streifen." }],
    "edits/sounddesign-edits": [{ abschnitt: "Die Sound-Ebenen in einem Kinetic Edit", svg: soundEnvelope(), text: "Riser baut auf, Stille spannt, der Hit entlädt." }],
    "edits/text-captions": [{ abschnitt: "Typografie-Regeln", svg: captionPhone(), text: "So sitzen Untertitel sauber im Reel." }],
    "edits/effekte": [{ abschnitt: "Keyframes", svg: keyframes(), text: "Zwischen zwei Keyframes rechnet die App die Bewegung aus." }]
  };

  // Grafiken in Lektions-HTML einsetzen (nach der passenden Überschrift bzw. am Anfang)
  window.injectGrafiken = function (kursId, lesson, html) {
    const list = window.GRAFIKEN[`${kursId}/${lesson.id}`] || [];
    let out = html;
    for (const g of list) {
      const fig = `<figure class="lesson-fig">${g.svg}${g.text ? `<figcaption>${g.text}</figcaption>` : ""}</figure>`;
      if (g.abschnitt === lesson.titel) out = fig + out;
      else {
        const h = `<h3>${g.abschnitt}</h3>`;
        const i = out.indexOf(h);
        if (i >= 0) out = out.slice(0, i + h.length) + fig + out.slice(i + h.length);
      }
    }
    return out;
  };
})();
