/* Mascotas del Geoquiz — personajes originales con temática geológica, dibujados en SVG (sin imágenes).
 * Una por cada emblema (ramo de la malla). Uso: window.MASCOTAS.svg("vulcano") → <svg> a color.
 * window.MASCOTAS.bg("vulcano") → color de fondo pastel para su tarjeta.
 */
(function () {
  "use strict";
  const INK = "#2a1d17";
  let uid = 0;
  const st = (w) => ` stroke="${INK}" stroke-width="${w || 2.6}" stroke-linejoin="round" stroke-linecap="round"`;

  /* ---------- cara compartida: ojos grandes con brillo, mejillas y boca según el ánimo */
  function face(cx, cy, s, mood) {
    s = s || 1; mood = mood || "happy";
    const ex = 9.5 * s, er = 7 * s;
    let o = "";
    if (mood === "worried") {
      o += `<path d="M${cx - ex - 6 * s},${cy - 11 * s} L${cx - ex + 5 * s},${cy - 13 * s}"${st(2.2)} fill="none"/>`;
      o += `<path d="M${cx + ex + 6 * s},${cy - 11 * s} L${cx + ex - 5 * s},${cy - 13 * s}"${st(2.2)} fill="none"/>`;
    }
    [-1, 1].forEach(k => {
      const x = cx + k * ex;
      o += `<ellipse cx="${x}" cy="${cy}" rx="${er}" ry="${er * 1.12}" fill="#fff"${st(2.2)}/>`;
      if (mood === "wink" && k === 1) {
        o += `<path d="M${x - er + 1.5},${cy + 1} Q${x},${cy - 5 * s} ${x + er - 1.5},${cy + 1}"${st(2.4)} fill="none"/>`;
        o += `<rect x="${x - er - 1}" y="${cy + 1.5}" width="${2 * er + 2}" height="${er + 2}" fill="var(--mbg,transparent)" opacity="0"/>`;
      } else {
        const px = x + (mood === "worried" ? 0 : 1.2 * s), py = cy + 1.6 * s;
        o += `<circle cx="${px}" cy="${py}" r="${4.4 * s}" fill="${INK}"/>`;
        o += `<circle cx="${px + 1.6 * s}" cy="${py - 1.8 * s}" r="${1.6 * s}" fill="#fff"/>`;
      }
    });
    o += `<ellipse cx="${cx - 15 * s}" cy="${cy + 9 * s}" rx="${4 * s}" ry="${2.4 * s}" fill="#ff7a8a" opacity=".55"/>`;
    o += `<ellipse cx="${cx + 15 * s}" cy="${cy + 9 * s}" rx="${4 * s}" ry="${2.4 * s}" fill="#ff7a8a" opacity=".55"/>`;
    const my = cy + 10 * s;
    if (mood === "worried") {
      o += `<ellipse cx="${cx}" cy="${my + 2.5 * s}" rx="${3.2 * s}" ry="${4 * s}" fill="#6b1f24"${st(2)}/>`;
    } else if (mood === "grin" || mood === "wink") {
      o += `<path d="M${cx - 7 * s},${my} Q${cx},${my + 7 * s} ${cx + 7 * s},${my}"${st(2.4)} fill="none"/>`;
    } else {
      o += `<path d="M${cx - 7.5 * s},${my} Q${cx},${my + 11 * s} ${cx + 7.5 * s},${my} Z" fill="#6b1f24"${st(2.2)}/>`;
      o += `<path d="M${cx - 4 * s},${my + 5.2 * s} Q${cx},${my + 2.6 * s} ${cx + 4 * s},${my + 5.2 * s} Q${cx},${my + 8.4 * s} ${cx - 4 * s},${my + 5.2 * s} Z" fill="#ff8a96"/>`;
    }
    return o;
  }
  const clip = (shape, inner) => { const id = "mc" + (++uid); return `<clipPath id="${id}">${shape}</clipPath><g clip-path="url(#${id})">${inner}</g>`; };
  const ground = (y, w) => `<ellipse cx="50" cy="${y}" rx="${w || 30}" ry="4" fill="#000" opacity=".14"/>`;
  const shine = (x, y, s) => `<path d="M${x},${y - 5 * s} L${x + 1.4 * s},${y - 1.4 * s} L${x + 5 * s},${y} L${x + 1.4 * s},${y + 1.4 * s} L${x},${y + 5 * s} L${x - 1.4 * s},${y + 1.4 * s} L${x - 5 * s},${y} L${x - 1.4 * s},${y - 1.4 * s} Z" fill="#fff"/>`;

  const DRAW = {
    /* Geofísica: la Tierra que tiembla */
    geofisica() {
      const c = `<circle cx="50" cy="54" r="31"/>`;
      let o = ground(91, 26);
      o += `<path d="M10,40 Q6,54 10,68 M4,34 Q-2,54 4,74" fill="none"${st(2.4)}/><path d="M90,40 Q94,54 90,68 M96,34 Q102,54 96,74" fill="none"${st(2.4)}/>`;
      o += clip(c, `<rect x="0" y="0" width="100" height="100" fill="#3b8fd9"/>
        <path d="M14,40 C24,30 38,34 36,44 C34,52 22,50 18,58 C14,62 12,52 14,40 Z" fill="#5cc26a"/>
        <path d="M58,26 C70,24 82,34 78,44 C74,50 64,44 60,50 C56,54 52,40 58,26 Z" fill="#5cc26a"/>
        <path d="M54,74 C62,70 76,72 74,80 C70,88 56,86 54,74 Z" fill="#5cc26a"/>
        <path d="M20,40 A31,31 0 0 1 60,24 A40,40 0 0 0 22,46 Z" fill="#fff" opacity=".22"/>`);
      o += `<circle cx="50" cy="54" r="31" fill="none"${st(3)}/>`;
      return o + face(50, 54, 1, "happy");
    },
    /* Geología Estructural: bloque plegado con casco */
    estructural() {
      const b = `<rect x="18" y="34" width="64" height="52" rx="12"/>`;
      let o = ground(90, 32);
      let bands = `<rect x="0" y="0" width="100" height="100" fill="#c98b5a"/>`;
      ["#a8693e", "#e0a978", "#a8693e"].forEach((col, i) => {
        let d = ""; for (let x = 10; x <= 90; x += 2) d += (d ? " L" : "M") + x + "," + (52 + i * 11 + 7 * Math.sin((x - 10) / 9)).toFixed(1);
        bands += `<path d="${d} L90,100 L10,100 Z" fill="${col}"/>`;
      });
      o += clip(b, bands);
      o += `<rect x="18" y="34" width="64" height="52" rx="12" fill="none"${st(3)}/>`;
      o += `<path d="M24,36 Q24,12 50,12 Q76,12 76,36 Z" fill="#f4c430"${st(2.8)}/><path d="M14,36 L86,36 Q86,42 80,42 L20,42 Q14,42 14,36 Z" fill="#f4c430"${st(2.8)}/><path d="M44,13 L44,34 M56,13 L56,34" stroke="#d9a400" stroke-width="3"/>`;
      return o + face(50, 60, .95, "grin");
    },
    /* Geomorfología: cerro nevado */
    geomorfo() {
      let o = ground(90, 38);
      o += `<path d="M8,88 L40,22 Q44,16 48,22 L54,32 L60,24 Q64,18 68,24 L92,88 Z" fill="#7f93b8"${st(3)}/>`;
      o += `<path d="M33,36 L40,22 Q44,16 48,22 L54,32 L60,24 Q64,18 68,24 L72,34 L66,32 L62,38 L56,33 L50,40 L44,32 L38,40 Z" fill="#fff"${st(2.4)}/>`;
      o += `<path d="M8,88 Q24,74 38,82 Q52,74 66,82 Q80,74 92,88 Z" fill="#6cc070"${st(2.6)}/>`;
      return o + face(50, 58, .9, "happy");
    },
    /* Volcanología: volcán con lava y fumarola */
    vulcano() {
      let o = ground(91, 36);
      o += `<path d="M38,22 C30,20 28,10 36,8 C38,2 48,2 50,8 C56,4 64,8 62,14 C68,16 66,24 58,22 Z" fill="#c9ccd3"${st(2.4)}/>`;
      o += `<path d="M10,88 L36,30 L64,30 L90,88 Z" fill="#8a5a3c"${st(3)}/>`;
      o += `<path d="M36,30 L64,30 L60,38 Q58,46 55,40 Q52,52 48,40 Q44,48 42,38 Z" fill="#ff7a1a"${st(2.4)}/>`;
      o += `<ellipse cx="50" cy="30" rx="14" ry="3.5" fill="#ffb23a"${st(2.4)}/>`;
      o += `<path d="M14,88 L24,66 Q30,72 34,66 L28,88 Z" fill="#6e432a" opacity=".6"/>`;
      return o + face(50, 62, .95, "happy");
    },
    /* Mapeo Geológico: roca exploradora con sombrero */
    mapeo() {
      let o = ground(90, 32);
      o += `<path d="M18,62 C16,44 30,34 50,34 C72,34 86,46 84,64 C82,82 66,88 50,88 C32,88 20,80 18,62 Z" fill="#a3a9b3"${st(3)}/>`;
      o += `<path d="M26,72 C30,78 38,82 46,82" fill="none" stroke="#7d838d" stroke-width="3" stroke-linecap="round"/><circle cx="72" cy="70" r="2" fill="#7d838d"/><circle cx="30" cy="50" r="1.6" fill="#7d838d"/>`;
      o += `<path d="M30,38 Q30,16 50,16 Q70,16 70,38 Z" fill="#c9a66b"${st(2.8)}/><path d="M8,38 Q50,30 92,38 Q90,46 50,42 Q10,46 8,38 Z" fill="#c9a66b"${st(2.8)}/><path d="M31,32 Q50,28 69,32 L69,37 Q50,33 31,37 Z" fill="#7a4b2a"/>`;
      return o + face(50, 60, .95, "wink");
    },
    /* Cartografía y SIG: marcador de mapa */
    sig() {
      let o = `<path d="M10,82 L34,74 L58,82 L90,72 L90,92 L58,98 L34,92 L10,98 Z" fill="#9fd3a0"${st(2.4)}/><path d="M34,74 L34,92 M58,82 L58,98" stroke="${INK}" stroke-width="2"/>`;
      o += `<path d="M50,90 C40,76 20,62 20,42 C20,24 34,12 50,12 C66,12 80,24 80,42 C80,62 60,76 50,90 Z" fill="#e8483b"${st(3)}/>`;
      o += `<path d="M30,30 C34,22 42,18 50,18" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>`;
      return o + face(50, 42, .95, "happy");
    },
    /* Petrología Endógena: granito moteado */
    endogena() {
      const c = `<path d="M16,60 C14,40 30,28 50,28 C72,28 86,40 84,60 C82,80 68,88 50,88 C30,88 18,80 16,60 Z"/>`;
      let dots = `<rect width="100" height="100" fill="#efb5a4"/>`;
      const P = [[26,44],[38,36],[64,36],[76,48],[24,66],[34,78],[70,72],[80,62],[58,82],[44,84],[30,56],[72,40]];
      P.forEach(([x, y], i) => dots += `<path d="M${x},${y} l3,-2 l2,3 l-3,2 Z" fill="${i % 3 ? "#2d2d33" : "#fff"}"/>`);
      let o = ground(91, 32) + clip(c, dots);
      o += `<path d="M16,60 C14,40 30,28 50,28 C72,28 86,40 84,60 C82,80 68,88 50,88 C30,88 18,80 16,60 Z" fill="none"${st(3)}/>`;
      return o + face(50, 58, 1, "happy");
    },
    /* Petrología Exógena: arenisca en capas */
    exogena() {
      const b = `<rect x="16" y="28" width="68" height="60" rx="16"/>`;
      let o = ground(91, 34);
      o += clip(b, `<rect width="100" height="100" fill="#f0d29a"/><rect y="42" width="100" height="10" fill="#e3b678"/><rect y="62" width="100" height="9" fill="#d69a5e"/><rect y="78" width="100" height="12" fill="#c98a4f"/>
        ${[[24,36],[60,34],[74,46],[30,68],[70,84],[46,86]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#a8743e"/>`).join("")}`);
      o += `<rect x="16" y="28" width="68" height="60" rx="16" fill="none"${st(3)}/>`;
      return o + face(50, 56, 1, "grin");
    },
    /* Cristalografía: amatista */
    cristalo() {
      let o = ground(91, 30);
      o += `<path d="M18,88 L16,52 L24,40 L32,52 L32,88 Z" fill="#a57be8"${st(2.6)}/><path d="M68,88 L68,56 L76,44 L84,56 L82,88 Z" fill="#a57be8"${st(2.6)}/>`;
      o += `<path d="M30,88 L30,34 L50,10 L70,34 L70,88 Z" fill="#8d5bd6"${st(3)}/>`;
      o += `<path d="M50,10 L50,34 L30,34 Z" fill="#b994f2"/><path d="M50,10 L70,34 L50,34 Z" fill="#6c3fb5"/><path d="M30,34 L50,34 L70,34" fill="none"${st(2.4)}/><path d="M50,10 L50,34" ${st(2)}/>`;
      o += `<path d="M30,88 L30,34 L50,10 L70,34 L70,88 Z" fill="none"${st(3)}/>` + shine(80, 26, 1) + shine(22, 30, .7);
      return o + face(50, 58, .9, "happy");
    },
    /* Geoquímica: matraz burbujeante */
    geoquimica() {
      let o = ground(91, 30);
      o += `<path d="M40,10 L60,10 L60,14 L56,14 L56,36 L80,80 Q84,88 76,88 L24,88 Q16,88 20,80 L44,36 L44,14 L40,14 Z" fill="#e2f5f7"${st(3)}/>`;
      o += `<path d="M30,62 L70,62 L80,80 Q84,88 76,88 L24,88 Q16,88 20,80 Z" fill="#5cc97c"${st(2.4)}/>`;
      o += `<circle cx="36" cy="74" r="3" fill="#bff0cb"/><circle cx="62" cy="78" r="2.2" fill="#bff0cb"/><circle cx="54" cy="52" r="2.6" fill="none"${st(1.8)}/><circle cx="60" cy="42" r="1.8" fill="none"${st(1.6)}/>`;
      o += `<rect x="42" y="4" width="16" height="8" rx="2" fill="#a8693e"${st(2.4)}/>`;
      return o + face(50, 70, .78, "happy");
    },
    /* Hidrogeología: gota de agua */
    hidro() {
      let o = ground(92, 26);
      o += `<path d="M50,8 C40,26 20,44 20,62 C20,80 34,90 50,90 C66,90 80,80 80,62 C80,44 60,26 50,8 Z" fill="#3fa9e8"${st(3)}/>`;
      o += `<path d="M30,56 C30,46 36,38 42,32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".55"/>`;
      return o + face(50, 62, 1, "happy");
    },
    /* Remociones en Masa: roca rodando, asustada */
    remociones() {
      let o = ground(91, 30);
      o += `<path d="M2,40 L12,40 M0,52 L10,52 M4,64 L14,64" ${st(2.4)}/>`;
      o += `<path d="M20,58 C18,38 34,26 54,28 C74,30 86,44 84,62 C82,80 66,90 48,88 C30,86 22,76 20,58 Z" fill="#b08b67"${st(3)}/>`;
      o += `<path d="M60,34 L66,44 M70,72 L76,66" stroke="#8a6849" stroke-width="3" stroke-linecap="round"/>`;
      o += `<circle cx="88" cy="84" r="4" fill="#b08b67"${st(2)}/><circle cx="12" cy="86" r="3" fill="#b08b67"${st(2)}/>`;
      return o + face(52, 58, 1, "worried");
    },
    /* Metalogénesis: pepita de oro */
    metalo() {
      let o = ground(90, 32);
      o += `<path d="M16,64 C12,48 24,36 36,38 C40,26 58,24 64,34 C78,32 88,46 84,60 C88,74 74,86 58,84 C48,90 30,88 26,80 C16,78 14,72 16,64 Z" fill="#f4c430"${st(3)}/>`;
      o += `<path d="M24,48 C28,42 34,40 38,42 M56,30 C60,30 62,32 64,36" fill="none" stroke="#fff3b0" stroke-width="3.5" stroke-linecap="round"/><path d="M70,76 C76,74 80,70 80,64" fill="none" stroke="#c99a12" stroke-width="3.5" stroke-linecap="round"/>`;
      o += shine(82, 30, 1.1) + shine(16, 34, .7);
      return o + face(50, 58, 1, "grin");
    },
    /* Estratigrafía Andina: amonite con su animalito asomado */
    estrati() {
      let o = ground(92, 34);
      const cx = 60, cy = 46, R = 32, k = Math.log(2.2) / (2 * Math.PI), tMax = 3 * 2 * Math.PI;
      const pt = th => { const r = R * Math.exp(-k * (tMax - th)); return [cx + r * Math.cos(th), cy + r * Math.sin(th)]; };
      o += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#e7a868"${st(3)}/>`;
      let ribs = "";
      for (let th = 2 * Math.PI; th <= tMax; th += 0.26) { const [x1, y1] = pt(th), [x2, y2] = pt(th - 2 * Math.PI); ribs += `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} `; }
      o += `<path d="${ribs}" stroke="#b46d34" stroke-width="2" stroke-linecap="round"/>`;
      let d = ""; for (let th = 1; th <= tMax; th += 0.08) { const [x, y] = pt(th); d += (d ? " L" : "M") + x.toFixed(1) + "," + y.toFixed(1); }
      o += `<path d="${d}" fill="none"${st(2.6)}/>`;
      o += `<path d="M44,40 A20,20 0 0 1 64,22" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/>`;
      // animalito: cabeza y tentáculos saliendo de la abertura

      ["M18,78 C12,84 14,92 21,88", "M26,80 C24,88 27,93 31,88", "M35,80 C35,88 39,91 41,86", "M43,78 C46,85 50,85 49,80"].forEach(dd => o += `<path d="${dd}" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/><path d="${dd}" fill="none" stroke="#f4a3b0" stroke-width="3.6" stroke-linecap="round"/>`);
      o += `<path d="M12,64 C12,48 22,42 34,42 C46,42 54,50 54,62 C54,76 44,82 32,82 C20,82 12,76 12,64 Z" fill="#f7b8c2"${st(3)}/>`;
      return o + face(33, 62, .78, "happy");
    },
    /* Geopatrimonio: trilobite */
    geopatrimonio() {
      let o = ground(93, 26);
      o += `<path d="M22,44 C14,58 16,76 24,86" fill="none"${st(2.8)}/><path d="M78,44 C86,58 84,76 76,86" fill="none"${st(2.8)}/>`;
      o += `<path d="M26,46 L74,46 L70,78 Q50,96 30,78 Z" fill="#4f9fa2"${st(3)}/>`;
      for (let y = 52; y <= 76; y += 6) o += `<path d="M${28 + (y - 46) * .14},${y} Q50,${y + 3} ${72 - (y - 46) * .14},${y}" fill="none" stroke="#2f7477" stroke-width="2.2" stroke-linecap="round"/>`;
      o += `<path d="M42,46 L44,82 M58,46 L56,82" stroke="#2f7477" stroke-width="2.2"/>`;
      o += `<path d="M18,48 C18,22 34,10 50,10 C66,10 82,22 82,48 Z" fill="#6cc0c2"${st(3)}/>`;
      return o + face(50, 32, .82, "happy");
    }
  };

  const BG = { geofisica: "#dbeeff", estructural: "#ffe9cf", geomorfo: "#e3ecfb", vulcano: "#ffe1d1", mapeo: "#efe7d6", sig: "#ffe0dd", endogena: "#fde4ea", exogena: "#fbf0d8", cristalo: "#ece2ff", geoquimica: "#dcf5e4", hidro: "#d9f1ff", remociones: "#f1e6db", metalo: "#fff3c4", estrati: "#ffead7", geopatrimonio: "#d9f2f1" };
  const cache = {};
  function svg(id) {
    const fn = DRAW[id]; if (!fn) return "";
    if (!cache[id]) cache[id] = fn();
    return `<svg class="masc" viewBox="0 0 100 100" aria-hidden="true">${cache[id]}</svg>`;
  }
  window.MASCOTAS = { svg, bg: id => BG[id] || "#eee", ids: Object.keys(DRAW) };
})();
