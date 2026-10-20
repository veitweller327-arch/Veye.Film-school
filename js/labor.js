/*
 * Grading-Labor: einfache Grading-Pipeline + Scopes (Waveform, RGB-Parade, Vectorscope)
 * auf einem Canvas. Funktioniert mit Bildern, Videos und einem eingebauten Testbild.
 */
(function () {
  const MAX_W = 960;

  const DEFAULTS = {
    exposure: 0, temp: 0, tint: 0, contrast: 1, saturation: 1,
    lift: 0, gamma: 1, gain: 1,
    liftHue: 200, liftAmt: 0,
    gammaHue: 30, gammaAmt: 0,
    gainHue: 35, gainAmt: 0,
    split: 0
  };

  const PRESETS = {
    "Neutral": {},
    "Teal & Orange": { contrast: 1.15, saturation: 1.1, liftHue: 190, liftAmt: 0.6, gainHue: 32, gainAmt: 0.5, lift: -0.02 },
    "Bleach Bypass": { contrast: 1.35, saturation: 0.45, gain: 1.05, lift: -0.03 },
    "Vintage / Faded": { lift: 0.08, contrast: 0.9, saturation: 0.85, temp: 0.25, gainHue: 45, gainAmt: 0.3, liftHue: 260, liftAmt: 0.3 },
    "Kalte Nacht": { exposure: -0.4, temp: -0.5, saturation: 0.8, liftHue: 220, liftAmt: 0.5, contrast: 1.1 },
    "Warmer Sommer": { exposure: 0.15, temp: 0.45, saturation: 1.15, gamma: 1.05, gainHue: 40, gainAmt: 0.4 },
    "Matrix-Grün": { saturation: 0.75, contrast: 1.2, gammaHue: 120, gammaAmt: 0.5, liftHue: 140, liftAmt: 0.4 },
    "Schwarzweiß": { saturation: 0, contrast: 1.25 }
  };

  const SLIDERS = [
    ["Basis", [
      ["exposure", "Belichtung", -2, 2, 0.05],
      ["temp", "Temperatur", -1, 1, 0.01],
      ["tint", "Tönung", -1, 1, 0.01],
      ["contrast", "Kontrast", 0.5, 1.8, 0.01],
      ["saturation", "Sättigung", 0, 2, 0.01]
    ]],
    ["Lift (Schatten)", [
      ["lift", "Helligkeit", -0.3, 0.3, 0.005],
      ["liftHue", "Farbton °", 0, 360, 1],
      ["liftAmt", "Stärke", 0, 1, 0.01]
    ]],
    ["Gamma (Mitten)", [
      ["gamma", "Helligkeit", 0.5, 1.8, 0.01],
      ["gammaHue", "Farbton °", 0, 360, 1],
      ["gammaAmt", "Stärke", 0, 1, 0.01]
    ]],
    ["Gain (Lichter)", [
      ["gain", "Helligkeit", 0.5, 1.6, 0.01],
      ["gainHue", "Farbton °", 0, 360, 1],
      ["gainAmt", "Stärke", 0, 1, 0.01]
    ]],
    ["Vergleich", [
      ["split", "Vorher-Anteil", 0, 1, 0.01]
    ]]
  ];

  // Farbton -> mittelwertfreier RGB-Vektor (wie ein Color Wheel)
  function wheel(hueDeg, amt, scale) {
    const h = hueDeg * Math.PI / 180;
    return [
      Math.cos(h) * amt * scale,
      Math.cos(h - 2.0944) * amt * scale,
      Math.cos(h + 2.0944) * amt * scale
    ];
  }

  // Für die Kanäle unabhängigen Schritte werden 256er-LUTs gebaut.
  function buildLuts(p) {
    const exp = Math.pow(2, p.exposure);
    const wb = [1 + 0.25 * p.temp, 1 - 0.2 * p.tint, 1 - 0.25 * p.temp];
    const lc = wheel(p.liftHue, p.liftAmt, 0.08);
    const mc = wheel(p.gammaHue, p.gammaAmt, 0.25);
    const gc = wheel(p.gainHue, p.gainAmt, 0.15);
    const pivot = 0.435;
    const luts = [];
    for (let ch = 0; ch < 3; ch++) {
      const lut = new Uint8ClampedArray(256);
      const lift = p.lift + lc[ch];
      const gain = p.gain + gc[ch];
      const gamma = Math.max(0.1, p.gamma + mc[ch]);
      for (let i = 0; i < 256; i++) {
        let c = (i / 255) * exp * wb[ch];
        c = gain * (c + lift * (1 - c));
        c = c > 0 ? Math.pow(c, 1 / gamma) : c;
        c = (c - pivot) * p.contrast + pivot;
        lut[i] = Math.round(Math.min(1, Math.max(0, c)) * 255);
      }
      luts.push(lut);
    }
    return luts;
  }

  function grade(src, dst, p) {
    const [lr, lg, lb] = buildLuts(p);
    const s = p.saturation;
    const a = src.data, o = dst.data;
    const splitX = Math.round(p.split * src.width);
    const w = src.width;
    for (let i = 0; i < a.length; i += 4) {
      if ((i >> 2) % w < splitX) {
        o[i] = a[i]; o[i + 1] = a[i + 1]; o[i + 2] = a[i + 2]; o[i + 3] = 255;
        continue;
      }
      let r = lr[a[i]], g = lg[a[i + 1]], b = lb[a[i + 2]];
      if (s !== 1) {
        const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = y + (r - y) * s; g = y + (g - y) * s; b = y + (b - y) * s;
      }
      o[i] = r; o[i + 1] = g; o[i + 2] = b; o[i + 3] = 255;
    }
    // Trennlinie für den Vorher/Nachher-Vergleich
    if (splitX > 0 && splitX < w) {
      for (let y = 0; y < src.height; y++) {
        const i = (y * w + splitX) * 4;
        o[i] = o[i + 1] = o[i + 2] = 255;
      }
    }
  }

  /* ---------------- Scopes ---------------- */

  function drawGrid(ctx, W, H, labels) {
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "10px system-ui";
    ctx.lineWidth = 1;
    for (let v = 0; v <= 100; v += 25) {
      const y = H - (v / 100) * (H - 1);
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
      if (labels) ctx.fillText(String(v), 2, Math.max(10, y - 2));
    }
  }

  function renderWave(ctx, img, mode) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const acc = [new Float32Array(W * H), new Float32Array(W * H), new Float32Array(W * H)];
    const d = img.data, iw = img.width, ih = img.height;
    const step = Math.max(1, Math.floor((iw * ih) / 120000));
    const parade = mode === "parade";
    const colW = parade ? Math.floor(W / 3) : W;
    for (let p = 0; p < iw * ih; p += step) {
      const i = p * 4;
      const x = p % iw;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (parade) {
        const cx = Math.floor((x / iw) * colW);
        const vals = [r, g, b];
        for (let ch = 0; ch < 3; ch++) {
          const y = H - 1 - Math.floor((vals[ch] / 255) * (H - 1));
          acc[ch][y * W + cx + ch * colW] += 1;
        }
      } else {
        const cx = Math.floor((x / iw) * W);
        const yl = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const y = H - 1 - Math.floor((yl / 255) * (H - 1));
        acc[0][y * W + cx] += 1;
      }
    }
    const out = ctx.createImageData(W, H);
    const gainF = 40 / step;
    for (let k = 0; k < W * H; k++) {
      const o = k * 4;
      if (parade) {
        const col = Math.floor((k % W) / colW);
        const v = Math.min(255, acc[col] ? acc[col][k] * gainF * 4 : 0);
        out.data[o] = col === 0 ? v : v * 0.25;
        out.data[o + 1] = col === 1 ? v : v * 0.25;
        out.data[o + 2] = col === 2 ? v : v * 0.25;
      } else {
        const v = Math.min(255, acc[0][k] * gainF);
        out.data[o] = v * 0.7; out.data[o + 1] = v; out.data[o + 2] = v * 0.75;
      }
      out.data[o + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);
    drawGrid(ctx, W, H, true);
    if (parade) {
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      for (let c = 1; c < 3; c++) { ctx.beginPath(); ctx.moveTo(c * colW + 0.5, 0); ctx.lineTo(c * colW + 0.5, H); ctx.stroke(); }
    }
  }

  // Rec.709 Cb/Cr eines RGB-Werts (0..1)
  function cbcr(r, g, b) {
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return [(b - y) / 1.8556, (r - y) / 1.5748];
  }

  function renderVector(ctx, img) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 6;
    const scale = R / 0.5;
    const acc = new Float32Array(W * H);
    const d = img.data, n = img.width * img.height;
    const step = Math.max(1, Math.floor(n / 120000));
    for (let p = 0; p < n; p += step) {
      const i = p * 4;
      const [u, v] = cbcr(d[i] / 255, d[i + 1] / 255, d[i + 2] / 255);
      const x = Math.round(cx + u * scale), y = Math.round(cy - v * scale);
      if (x >= 0 && x < W && y >= 0 && y < H) acc[y * W + x] += 1;
    }
    const out = ctx.createImageData(W, H);
    const gainF = 30 / step;
    for (let k = 0; k < W * H; k++) {
      const v = Math.min(255, acc[k] * gainF);
      out.data[k * 4] = v * 0.75; out.data[k * 4 + 1] = v; out.data[k * 4 + 2] = v * 0.8; out.data[k * 4 + 3] = 255;
    }
    ctx.putImageData(out, 0, 0);

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

    // Zielfelder für 75%-Farbbalken
    ctx.font = "10px system-ui";
    const targets = { R: [.75, 0, 0], Y: [.75, .75, 0], G: [0, .75, 0], C: [0, .75, .75], B: [0, 0, .75], M: [.75, 0, .75] };
    for (const [name, rgb] of Object.entries(targets)) {
      const [u, v] = cbcr(...rgb);
      const x = cx + u * scale, y = cy - v * scale;
      ctx.strokeStyle = `rgb(${rgb.map(c => Math.round(c * 340)).join(",")})`;
      ctx.strokeRect(x - 5, y - 5, 10, 10);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fillText(name, x + 7, y + 4);
    }
    // Hautton-Linie (Richtung eines typischen Hauttons)
    const [su, sv] = cbcr(0.85, 0.62, 0.5);
    const len = Math.hypot(su, sv);
    ctx.strokeStyle = "rgba(255,190,140,0.7)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (su / len) * R, cy - (sv / len) * R); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,190,140,0.9)";
    ctx.fillText("Haut", cx + (su / len) * R * 0.55 - 26, cy - (sv / len) * R * 0.55);
  }

  /* ---------------- Testbild ---------------- */

  function drawTestImage(ctx, W, H) {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    sky.addColorStop(0, "#3d6fa8"); sky.addColorStop(1, "#c9d8e6");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.6);
    const ground = ctx.createLinearGradient(0, H * 0.6, 0, H);
    ground.addColorStop(0, "#5c7a3a"); ground.addColorStop(1, "#2a3a1a");
    ctx.fillStyle = ground; ctx.fillRect(0, H * 0.6, W, H * 0.4);
    // Sonne
    const sun = ctx.createRadialGradient(W * 0.8, H * 0.18, 5, W * 0.8, H * 0.18, H * 0.2);
    sun.addColorStop(0, "#fffbe8"); sun.addColorStop(0.3, "rgba(255,230,170,.8)"); sun.addColorStop(1, "rgba(255,230,170,0)");
    ctx.fillStyle = sun; ctx.fillRect(0, 0, W, H);
    // Graustufen-Rampe
    const ramp = ctx.createLinearGradient(W * 0.05, 0, W * 0.95, 0);
    ramp.addColorStop(0, "#000"); ramp.addColorStop(1, "#fff");
    ctx.fillStyle = ramp; ctx.fillRect(W * 0.05, H * 0.86, W * 0.9, H * 0.08);
    // Farbfelder
    const cols = ["#c03030", "#c0c030", "#30c030", "#30c0c0", "#3030c0", "#c030c0", "#808080"];
    const sw = (W * 0.5) / cols.length;
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(W * 0.05 + i * sw, H * 0.66, sw - 4, H * 0.14); });
    // Hauttöne (hell bis dunkel)
    const skins = ["#f1c7a8", "#e0ac8a", "#c68863", "#a0674a", "#6e4630"];
    skins.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(W * 0.62 + i * W * 0.07, H * 0.73, H * 0.06, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = `bold ${Math.round(H * 0.05)}px system-ui`;
    ctx.fillText("VEYE TESTBILD", W * 0.05, H * 0.12);
  }

  /* ---------------- UI ---------------- */

  function mount(root) {
    const params = { ...DEFAULTS };
    let source = null;       // ImageData des Originals
    let videoEl = null;
    let scopeMode = "wave";

    root.innerHTML = `
      <div class="labor">
        <div>
          <canvas id="lbView"></canvas>
          <div class="tabs" style="margin-top:12px">
            <button class="btn small active" data-scope="wave">Waveform</button>
            <button class="btn small" data-scope="parade">RGB-Parade</button>
            <button class="btn small" data-scope="vector">Vectorscope</button>
          </div>
          <div class="scope-wrap"><canvas id="lbScope" width="512" height="256"></canvas></div>
        </div>
        <div class="controls">
          <h4>Quelle</h4>
          <div class="preset-row">
            <label class="btn small">Bild / Video laden<input type="file" id="lbFile" accept="image/*,video/*" hidden></label>
            <button class="btn small" id="lbTest">Testbild</button>
            <button class="btn small" id="lbPlay" hidden>⏯</button>
          </div>
          <h4>Presets</h4>
          <div class="preset-row" id="lbPresets"></div>
          <div id="lbSliders"></div>
          <div class="preset-row" style="margin-top:16px">
            <button class="btn small" id="lbReset">Zurücksetzen</button>
            <button class="btn small" id="lbCopy">Werte kopieren</button>
          </div>
        </div>
      </div>`;

    const view = root.querySelector("#lbView");
    const vctx = view.getContext("2d", { willReadFrequently: true });
    const work = document.createElement("canvas");
    const wctx = work.getContext("2d", { willReadFrequently: true });
    const scope = root.querySelector("#lbScope");
    const sctx = scope.getContext("2d");

    // Presets
    const presetRow = root.querySelector("#lbPresets");
    Object.keys(PRESETS).forEach(name => {
      const b = document.createElement("button");
      b.className = "btn small"; b.textContent = name;
      b.onclick = () => { Object.assign(params, DEFAULTS, PRESETS[name], { split: params.split }); syncSliders(); render(); };
      presetRow.appendChild(b);
    });

    // Slider
    const sliderBox = root.querySelector("#lbSliders");
    const inputs = {};
    SLIDERS.forEach(([group, list]) => {
      const h = document.createElement("h4"); h.textContent = group; sliderBox.appendChild(h);
      list.forEach(([key, label, min, max, step]) => {
        const row = document.createElement("div"); row.className = "slider";
        row.innerHTML = `<span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}"><output></output>`;
        const inp = row.querySelector("input"), out = row.querySelector("output");
        inp.value = params[key];
        inp.oninput = () => { params[key] = parseFloat(inp.value); out.textContent = fmt(params[key]); render(); };
        inp.ondblclick = () => { params[key] = DEFAULTS[key]; syncSliders(); render(); };
        inputs[key] = [inp, out];
        sliderBox.appendChild(row);
      });
    });
    function fmt(v) { return Math.abs(v) >= 10 ? Math.round(v) : v.toFixed(2); }
    function syncSliders() {
      for (const k in inputs) { inputs[k][0].value = params[k]; inputs[k][1].textContent = fmt(params[k]); }
    }
    syncSliders();

    root.querySelectorAll("[data-scope]").forEach(b => b.onclick = () => {
      root.querySelectorAll("[data-scope]").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      scopeMode = b.dataset.scope;
      scope.width = scopeMode === "vector" ? 256 : 512;
      scope.height = 256;
      scope.style.maxWidth = scopeMode === "vector" ? "320px" : "";
      render();
    });

    root.querySelector("#lbReset").onclick = () => { Object.assign(params, DEFAULTS); syncSliders(); render(); };
    root.querySelector("#lbCopy").onclick = () => {
      const txt = Object.entries(params).filter(([k, v]) => v !== DEFAULTS[k]).map(([k, v]) => `${k}: ${v}`).join("\n") || "Keine Änderungen";
      navigator.clipboard?.writeText(txt).then(() => alert("Werte kopiert:\n\n" + txt), () => alert(txt));
    };

    function setSize(w, h) {
      const s = Math.min(1, MAX_W / w);
      view.width = work.width = Math.round(w * s);
      view.height = work.height = Math.round(h * s);
    }

    function loadTest() {
      stopVideo();
      setSize(960, 540);
      drawTestImage(vctx, view.width, view.height);
      source = vctx.getImageData(0, 0, view.width, view.height);
      render();
    }

    function stopVideo() {
      if (videoEl) { videoEl.pause(); URL.revokeObjectURL(videoEl.src); videoEl = null; }
      root.querySelector("#lbPlay").hidden = true;
    }

    root.querySelector("#lbTest").onclick = loadTest;
    root.querySelector("#lbPlay").onclick = () => { if (videoEl) videoEl.paused ? videoEl.play() : videoEl.pause(); };

    root.querySelector("#lbFile").onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      stopVideo();
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("video/")) {
        videoEl = document.createElement("video");
        videoEl.src = url; videoEl.muted = true; videoEl.loop = true; videoEl.playsInline = true;
        videoEl.onloadeddata = () => {
          setSize(videoEl.videoWidth, videoEl.videoHeight);
          root.querySelector("#lbPlay").hidden = false;
          videoEl.play();
          const v = videoEl;
          const tick = () => {
            if (videoEl !== v || !document.body.contains(view)) return;
            wctx.drawImage(v, 0, 0, work.width, work.height);
            source = wctx.getImageData(0, 0, work.width, work.height);
            render();
            if (v.paused) v.addEventListener("play", () => requestAnimationFrame(tick), { once: true });
            else requestAnimationFrame(tick);
          };
          tick();
        };
      } else {
        const img = new Image();
        img.onload = () => {
          setSize(img.width, img.height);
          vctx.drawImage(img, 0, 0, view.width, view.height);
          source = vctx.getImageData(0, 0, view.width, view.height);
          URL.revokeObjectURL(url);
          render();
        };
        img.src = url;
      }
    };

    let pending = false;
    function render() {
      if (!source || pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        const out = vctx.createImageData(source.width, source.height);
        grade(source, out, params);
        vctx.putImageData(out, 0, 0);
        if (scopeMode === "vector") renderVector(sctx, out);
        else renderWave(sctx, out, scopeMode);
      });
    }

    loadTest();
  }

  window.Labor = { mount };
})();
