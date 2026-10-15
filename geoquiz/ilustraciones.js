/* Ilustraciones de líneas del Geoquiz — dibujadas en SVG, sin archivos de imagen.
 * Uso: window.ILUS.svg("amonite") → texto <svg>. Cada pregunta elige la suya con el campo t en preguntas.js.
 * Temas: amonite, trilobite, volcan, capas, intrusion, piqueta, acido, rayador, cristal, lupa,
 *        tierra, placas, montana, corriente, clastos, termometro
 */
(function () {
  "use strict";
  const f = n => Math.round(n * 10) / 10;
  const P = (d, extra) => `<path pathLength="1" d="${d}"${extra || ""}/>`;
  const C = (x, y, r, extra) => `<circle pathLength="1" cx="${f(x)}" cy="${f(y)}" r="${f(r)}"${extra || ""}/>`;
  const L = (x1, y1, x2, y2, extra) => `<line pathLength="1" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"${extra || ""}/>`;
  const E = (x, y, rx, ry, extra) => `<ellipse pathLength="1" cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}"${extra || ""}/>`;
  const T = (x, y, s, txt) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" class="ilt">${txt}</text>`;
  const thin = ' class="th"';

  /* ---------- amonite: espiral logarítmica con costillas entre vueltas */
  function amonite() {
    const cx = 50, cy = 52, R = 42, b = Math.log(2.1) / (2 * Math.PI), turns = 3.4, tMax = turns * 2 * Math.PI;
    const pt = th => { const r = R * Math.exp(-b * (tMax - th)); return [cx + r * Math.cos(th), cy + r * Math.sin(th)]; };
    let d = "", out = "";
    for (let th = 0.4; th <= tMax; th += 0.05) { const [x, y] = pt(th); d += (d ? "L" : "M") + f(x) + "," + f(y); }
    out += P(d);
    // costillas: une cada punto de la vuelta exterior con la vuelta anterior, levemente curvadas
    for (let th = 2 * Math.PI + 0.4; th <= tMax; th += 0.17) {
      const [x1, y1] = pt(th), [x2, y2] = pt(th - 2 * Math.PI);
      const mx = (x1 + x2) / 2 + (y1 - y2) * 0.12, my = (y1 + y2) / 2 - (x1 - x2) * 0.12;
      out += P(`M${f(x1)},${f(y1)} Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}`, thin);
    }
    // quilla y abertura
    const [ax, ay] = pt(tMax), [bx, by] = pt(tMax - 2 * Math.PI);
    out += P(`M${f(ax)},${f(ay)} L${f(bx)},${f(by)}`);
    return out;
  }

  /* ---------- trilobite: céfalo, tórax de segmentos con pleuras curvas, pigidio */
  function trilobite() {
    let o = "";
    const W = y => y < 36 ? 30 : 30 - (y - 36) * 0.24;           // semiancho del cuerpo
    o += P("M20,36 C20,14 34,8 50,8 C66,8 80,14 80,36");         // céfalo
    o += P("M20,36 C16,46 14,58 16,70") + P("M80,36 C84,46 86,58 84,70");  // espinas genales
    o += P("M24,36 C24,22 36,14 50,14 C64,14 76,22 76,36", thin); // borde del céfalo
    o += P("M43,35 C40,24 44,14 50,14 C56,14 60,24 57,35");      // glabela
    o += P("M45,22 Q50,20 55,22", thin) + P("M44,28 Q50,26 56,28", thin);
    o += P("M30,28 C32,22 38,22 39,27", thin) + P("M61,27 C62,22 68,22 70,28", thin); // ojos
    o += P("M20,36 L80,36");
    for (let y = 40; y <= 72; y += 4) {
      const w = W(y);
      o += P(`M43,${y} Q50,${y + 1.6} 57,${y}`, thin);                                   // anillo axial
      o += P(`M43,${y} C36,${y} ${f(50 - w + 6)},${y + 0.5} ${f(50 - w)},${y + 3}`);      // pleura izq.
      o += P(`M57,${y} C64,${y} ${f(50 + w - 6)},${y + 0.5} ${f(50 + w)},${y + 3}`);      // pleura der.
    }
    o += P("M43,36 L44,74", thin) + P("M57,36 L56,74", thin);
    const wl = W(74);
    o += P(`M${f(50 - wl)},75 C${f(50 - wl)},90 ${f(50 + wl)},90 ${f(50 + wl)},75 Z`);   // pigidio
    o += P("M44,75 Q50,84 56,75", thin) + P("M38,78 Q50,88 62,78", thin);
    return o;
  }

  /* ---------- volcán estratificado con pluma */
  function volcan() {
    let o = "";
    o += P("M4,92 L36,44 Q42,38 46,42 Q50,46 54,42 Q58,38 64,44 L96,92");
    for (let i = 1; i <= 4; i++) { const y = 44 + i * 10, dx = (y - 44) * 0.67; o += P(`M${f(36 - dx + 4)},${y} Q50,${y + 3} ${f(64 + dx - 4)},${y}`, thin); }
    o += P("M50,46 L50,86", thin) + E(50, 89, 9, 3, thin);
    o += P("M46,40 C40,30 44,22 38,16 C32,10 40,2 48,6 C52,0 62,2 62,10 C70,8 74,18 66,22 C70,28 60,34 56,28 C54,34 48,36 46,30");
    o += C(30, 26, 2.4, thin) + C(72, 32, 1.8, thin) + C(24, 14, 1.4, thin);
    o += P("M54,46 C58,56 56,62 62,70", thin);
    return o;
  }

  /* ---------- estratos con estratificación cruzada */
  function capas() {
    let o = "";
    o += P("M6,20 L94,20 L94,88 L6,88 Z");
    const lines = [34, 52, 70];
    lines.forEach(y => o += P(`M6,${y} C30,${y - 3} 60,${y + 3} 94,${y}`));
    for (let x = 12; x < 82; x += 9) o += P(`M${x},22 Q${x + 6},28 ${x + 10},33`, thin);           // cruzada planar
    for (let x = 10; x < 80; x += 16) o += P(`M${x},54 Q${x + 8},66 ${x + 16},54`, thin);           // artesas
    for (let x = 11; x < 88; x += 7) for (let y = 74; y < 88; y += 6) o += C(x + (y % 12 ? 3 : 0), y, 0.9, thin); // arena
    o += P("M6,44 C30,42 60,46 94,44", thin);
    return o;
  }

  /* ---------- intrusión: dique y sill cortando capas */
  function intrusion() {
    let o = "";
    o += P("M6,14 L94,14 L94,90 L6,90 Z");
    [26, 38, 62, 76].forEach(y => o += P(`M6,${y} L94,${y}`, thin));
    o += P("M38,90 L42,62 L46,14", "") + P("M52,90 L54,62 L56,14");          // dique
    o += P("M54,46 L94,46") + P("M55,54 L94,54");                            // sill
        for (let y = 20; y < 88; y += 7) o += L(44 + (y % 2), y, 48 + (y % 2), y + 2, thin);
    for (let x = 62; x < 92; x += 7) o += L(x, 48, x + 2, 52, thin);
    return o;
  }

  /* ---------- piqueta geológica */
  function piqueta() {
    let o = "";
    o += `<g transform="rotate(-28 50 50)">`;
    o += P("M14,24 L38,24 L38,38 L14,38 Z");                    // cara plana
    o += P("M38,25 C58,24 76,26 92,33 C76,35 58,37 38,37");    // punta
    o += P("M44,38 L46,92 Q50,96 54,92 L56,38");                // mango
    o += P("M45.5,70 L54.5,70", thin) + P("M45.6,74 L54.4,74", thin) + P("M45.8,78 L54.2,78", thin) + P("M46,82 L54,82", thin) + P("M46.2,86 L53.8,86", thin);
    o += P("M18,28 L18,34", thin);
    o += `</g>`;
    o += P("M10,90 L28,78 L40,86 L30,94 Z", thin) + P("M22,84 L30,88", thin);
    return o;
  }

  /* ---------- gotero de ácido HCl y efervescencia */
  function acido() {
    let o = "";
    o += P("M22,46 L22,86 Q22,92 28,92 L52,92 Q58,92 58,86 L58,46 Q58,40 52,40 L28,40 Q22,40 22,46 Z");
    o += P("M32,40 L32,32 L48,32 L48,40") + P("M36,32 L36,22 L44,22 L44,32", thin);
    o += P("M34,22 C30,6 50,6 46,22");                          // pera de goma
    o += P("M26,58 L54,58 L54,76 L26,76 Z", thin);
    o += T(40, 71, 10, "HCl");
    o += P("M68,30 C64,36 64,40 68,40 C72,40 72,36 68,30 Z", thin);
    o += P("M74,48 C71,52 71,55 74,55 C77,55 77,52 74,48 Z", thin);
    o += P("M62,92 L70,74 L86,70 L96,84 L92,94 Z");             // roca
    o += C(76, 66, 2) + C(82, 62, 1.5, thin) + C(86, 66, 2.4, thin) + C(80, 56, 1.2, thin) + C(90, 58, 1.4, thin);
    return o;
  }

  /* ---------- rayador de acero y placa de raya */
  function rayador() {
    let o = "";
    o += P("M8,74 L58,60 L92,76 L42,92 Z");                     // placa de porcelana
    o += P("M30,78 C40,76 52,74 62,76", "");                   // raya
    o += P("M32,80 C42,78 52,77 60,79", thin);
    o += `<g transform="rotate(38 60 36)">`;
    o += P("M56,4 L64,4 L64,52 L56,52 Z");                      // cuerpo
    o += P("M56,52 L60,66 L64,52");                             // punta de acero
    o += P("M56,12 L64,12", thin) + P("M56,16 L64,16", thin) + P("M56,4 Q60,-2 64,4", thin);
    o += `</g>`;
    o += P("M10,40 L22,30 L34,34 L30,48 L16,50 Z", thin) + P("M22,30 L24,42 L30,48", thin) + P("M24,42 L16,50", thin); // mineral
    return o;
  }

  /* ---------- cristales de cuarzo */
  function cristal() {
    const prism = (x, w, yb, h, t) => P(`M${x - w},${yb} L${x - w},${yb - h} L${x},${yb - h - t} L${x + w},${yb - h} L${x + w},${yb} `) +
      P(`M${x},${yb - h - t} L${x},${yb - h + 6} M${x - w},${yb - h} L${x},${yb - h + 6} L${x + w},${yb - h}`, thin) + P(`M${x},${yb - h + 6} L${x},${yb}`, thin);
    let o = "";
    o += `<g transform="rotate(-16 36 80)">` + prism(36, 9, 86, 40, 14) + `</g>`;
    o += prism(56, 11, 88, 56, 16);
    o += `<g transform="rotate(20 74 82)">` + prism(76, 8, 88, 30, 12) + `</g>`;
    o += P("M10,90 C30,82 70,82 92,90 C70,96 30,96 10,90 Z", thin);
    return o;
  }

  /* ---------- lupa 10x */
  function lupa() {
    let o = "";
    o += C(42, 42, 26) + C(42, 42, 21, thin);
    o += P("M60,60 L66,66") + P("M64,62 L88,86 Q92,92 86,92 L62,68 Z");
    o += P("M30,30 Q34,24 42,24", thin);
    o += P("M32,46 L38,38 L48,40 L52,50 L44,56 L34,54 Z", thin) + P("M38,38 L44,48 L52,50 M44,48 L44,56", thin);
    o += T(80, 26, 11, "10&#215;");
    return o;
  }

  /* ---------- Tierra con corte */
  function tierra() {
    let o = "";
    o += P("M50,8 A42,42 0 1 0 92,50 L50,50 Z");
    o += P("M50,50 L50,8") + P("M50,50 L92,50");
    o += P("M50,14 A36,36 0 0 1 86,50", thin);
    o += P("M50,30 A20,20 0 0 1 70,50");
    o += P("M50,40 A10,10 0 0 1 60,50", thin);
    o += P("M24,30 C30,26 36,32 34,40 C30,46 22,42 24,30 Z", thin) + P("M20,62 C28,58 40,64 36,74 C30,80 18,74 20,62 Z", thin);
    return o;
  }

  /* ---------- subducción */
  function placas() {
    let o = "";
    o += P("M4,40 L52,40 C62,40 68,46 76,58 L94,92");          // placa oceánica que subduce
    o += P("M4,50 L50,50 C58,50 62,56 68,66 L82,92", thin);
    o += P("M94,40 L66,40 C64,30 60,24 56,24 L52,30");         // continente con volcán
    o += P("M60,24 C58,18 64,12 68,16 C72,10 80,14 76,20", thin);
    o += P("M94,40 L94,52 C88,52 80,54 76,58", thin);
    o += P("M70,60 C66,50 64,40 60,30", thin);                  // ascenso de magma
    o += C(70, 62, 3, thin);
    o += P("M14,30 L34,30 M28,26 L34,30 L28,34");               // flechas
    o += P("M92,24 L80,24 M86,20 L80,24 L86,28", thin);
    for (let x = 10; x < 46; x += 8) o += L(x, 45, x + 3, 45, thin);
    return o;
  }

  /* ---------- montañas con pliegues */
  function montana() {
    let o = "";
    o += P("M2,90 L30,34 L42,52 L58,18 L76,48 L84,40 L98,90");
    o += P("M58,18 L52,30 L58,28 L62,34 L66,28", thin) + P("M30,34 L26,42 L32,40 L36,44", thin);
    o += P("M14,74 C28,60 40,74 52,62 C64,50 76,64 90,58", thin);
    o += P("M18,84 C32,70 44,84 56,72 C68,60 78,74 92,68", thin);
    o += P("M76,80 L82,74 L90,78 L86,86 Z", thin) + P("M66,88 L70,84 L74,88 Z", thin);
    return o;
  }

  /* ---------- corriente con granos en suspensión y saltación */
  function corriente() {
    let o = "";
    for (let i = 0; i < 4; i++) { const y = 20 + i * 12; o += P(`M6,${y} C20,${y - 6} 32,${y + 6} 46,${y} C60,${y - 6} 72,${y + 6} 86,${y}`, i % 2 ? thin : ""); }
    o += P("M80,14 L90,20 L80,26");
    o += P("M4,86 C30,80 50,90 96,82");
    o += P("M18,82 C22,72 28,72 32,80", thin) + P("M40,84 C46,70 54,70 58,82", thin);
    o += C(32, 80, 2.2) + C(58, 82, 2.6) + C(74, 80, 3) + C(86, 79, 2.4) + C(12, 83, 2);
    [[24, 66], [44, 62], [66, 70], [80, 64], [30, 56], [56, 54]].forEach(([x, y]) => o += C(x, y, 1, thin));
    return o;
  }

  /* ---------- clastos (conglomerado) */
  function clastos() {
    let o = "";
    o += P("M8,62 C12,48 30,46 36,56 C40,66 30,76 18,74 C10,72 6,68 8,62 Z");
    o += P("M40,40 C46,28 66,28 70,40 C74,52 60,60 50,58 C42,56 36,50 40,40 Z");
    o += P("M54,72 C58,64 74,62 80,70 C84,78 74,86 64,84 C56,82 52,78 54,72 Z");
    o += P("M74,40 C78,34 90,36 92,44 C94,52 84,56 78,52 C74,50 72,44 74,40 Z", thin);
    o += P("M22,32 C24,26 32,26 34,30 C36,36 30,40 26,38 C22,36 20,36 22,32 Z", thin);
    o += P("M36,84 C38,80 44,80 46,84 C46,88 40,90 38,88 Z", thin);
    o += P("M48,36 C54,38 58,44 60,50", thin) + P("M16,58 C20,62 26,62 30,60", thin);
    [[40, 72], [46, 66], [30, 84], [86, 62], [70, 92], [12, 44]].forEach(([x, y]) => o += C(x, y, 1.1, thin));
    return o;
  }

  /* ---------- termómetro y manómetro (P–T) */
  function termometro() {
    let o = "";
    o += P("M22,14 Q22,8 28,8 Q34,8 34,14 L34,64 A11,11 0 1 1 22,64 Z");
    o += C(28, 73, 6) + P("M28,67 L28,24", "");
    for (let y = 22; y <= 58; y += 6) o += L(34, y, 39, y, thin);
    o += C(68, 52, 24) + C(68, 52, 19, thin);
    for (let a = -210; a <= 30; a += 30) { const r = a * Math.PI / 180; o += L(68 + 16 * Math.cos(r), 52 + 16 * Math.sin(r), 68 + 19 * Math.cos(r), 52 + 19 * Math.sin(r), thin); }
    o += P("M68,52 L80,40") + C(68, 52, 2);
    o += T(68, 68, 8, "kbar");
    return o;
  }


  /* ---------- sismograma (Geofísica) */
  function sismo() {
    let o = "";
    o += P("M6,18 L94,18", thin) + P("M6,82 L94,82", thin);
    for (let x = 14; x < 94; x += 16) o += L(x, 18, x, 22, thin) + L(x, 78, x, 82, thin);
    let d = "M6,50", k = 0;
    for (let x = 8; x <= 94; x += 1.6) {
      const env = 30 * Math.exp(-Math.pow((x - 42) / 13, 2)) + 12 * Math.exp(-Math.pow((x - 66) / 9, 2)) + 1.5;
      d += ` L${f(x)},${f(50 + (k++ % 2 ? 1 : -1) * env * (0.55 + 0.45 * Math.abs(Math.sin(x * 0.9))))}`;
    }
    o += P(d);
    o += P("M24,30 L24,40", thin) + T(24, 28, 8, "P") + P("M54,30 L54,40", thin) + T(54, 28, 8, "S");
    return o;
  }

  /* ---------- pliegues cortados por una falla (Geología Estructural) */
  function pliegue() {
    let o = "";
    const fx = y => 60 - (y - 6) * 0.07;                       // traza de la falla
    for (let i = 0; i < 4; i++) {
      const y0 = 30 + i * 12; let dl = "", dr = "";
      for (let x = 6; x <= 94; x += 2) {
        const yl = y0 + 12 * Math.sin((x - 6) / 14), yr = yl + 10;
        if (x <= fx(yl) - 2) dl += (dl ? " L" : "M") + f(x) + "," + f(yl);
        else if (x >= fx(yr) + 2) dr += (dr ? " L" : "M") + f(x) + "," + f(yr);
      }
      o += P(dl, i % 2 ? thin : "") + P(dr, i % 2 ? thin : "");
    }
    o += P("M60,6 L53.8,94");
    o += P("M66,12 L66,22 M62,18 L66,22 L70,18", thin) + P("M48,84 L48,74 M44,78 L48,74 L52,78", thin);
    return o;
  }

  /* ---------- brújula Brunton (Mapeo Geológico) */
  function brujula() {
    let o = "";
    o += C(46, 58, 30) + C(46, 58, 24, thin);
    for (let a = 0; a < 360; a += 30) { const r = a * Math.PI / 180; o += L(46 + 24 * Math.cos(r), 58 + 24 * Math.sin(r), 46 + 20 * Math.cos(r), 58 + 20 * Math.sin(r), thin); }
    o += P("M46,58 L54,38 L46,58 L38,78");
    o += P("M46,58 L54,38 L49,58 Z") + C(46, 58, 2);
    o += T(46, 44, 8, "N");
    o += P("M24,30 L68,30 L72,20 L28,20 Z", thin);               // tapa con espejo
    o += P("M76,58 L94,58 L94,52", "");                           // brazo de mira
    o += P("M30,28 L66,28", thin);
    return o;
  }

  /* ---------- acuífero y pozo (Hidrogeología) */
  function acuifero() {
    let o = "";
    o += P("M50,8 C44,18 40,24 40,30 C40,36 45,40 50,40 C55,40 60,36 60,30 C60,24 56,18 50,8 Z");
    o += P("M6,48 C30,44 60,52 94,48");
    o += `<line x1="6" y1="62" x2="70" y2="62" class="th" stroke-dasharray="3 4"/>`;   // nivel freático
    o += P("M30,54 L38,54 L34,60 Z", thin) + P("M31,57.5 L37,57.5", thin);
    o += P("M6,74 C30,72 60,76 94,74") + P("M6,90 C30,88 60,92 94,90");
    for (let x = 10; x < 92; x += 7) o += C(x, 82, 1, thin);
    o += P("M76,40 L76,88") + P("M82,40 L82,88") + P("M72,40 L86,40", thin);
    o += P("M18,66 L28,66 M24,63 L28,66 L24,69", thin);
    return o;
  }

  /* ---------- curvas de nivel y rumbo-manteo (Cartografía y SIG) */
  function mapa() {
    let o = "";
    o += P("M8,10 L92,10 L92,90 L8,90 Z", thin);
    const blob = (cx, cy, r, w) => { let d = ""; for (let a = 0; a <= 360; a += 10) { const t = a * Math.PI / 180, rr = r * (1 + w * Math.sin(3 * t) + w * 0.6 * Math.cos(5 * t)); d += (d ? " L" : "M") + f(cx + rr * Math.cos(t) * 1.25) + "," + f(cy + rr * Math.sin(t)); } return d + " Z"; };
    [30, 22, 14, 7].forEach((r, i) => o += P(blob(46, 52, r, 0.08 + i * 0.01), i % 2 ? thin : ""));
    o += P("M46,49 L49,55 L43,55 Z");
    o += P("M76,22 L86,22 M81,22 L81,28", "") + T(80, 36, 8, "35");  // símbolo rumbo/manteo
    o += P("M18,82 L18,70 M14,74 L18,70 L22,74", thin) + T(18, 66, 8, "N");
    return o;
  }

  const ART = { sismo, pliegue, brujula, acuifero, mapa, amonite, trilobite, volcan, capas, intrusion, piqueta, acido, rayador, cristal, lupa, tierra, placas, montana, corriente, clastos, termometro };
  const cache = {};
  function svg(name, cls) {
    const fn = ART[name] || ART.amonite;
    const inner = cache[name] || (cache[name] = fn());
    return `<svg class="ilus ${cls || ""}" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  }
  // Fondo decorativo: varias piezas repartidas por la pantalla
  function deco(names) {
    const spots = [[3, 8, -12, 15], [80, 6, 14, 13], [88, 62, -8, 14], [2, 66, 10, 12], [44, 84, -4, 9], [62, 30, 22, 7], [24, 36, -20, 7]];
    return names.slice(0, spots.length).map((n, i) => {
      const [x, y, r, s] = spots[i];
      return `<div class="deco-it" style="left:${x}%;top:${y}%;width:${s}vw;transform:rotate(${r}deg)">${svg(n)}</div>`;
    }).join("");
  }
  // Emblemas de jugador: ramos emblemáticos de la malla de Geología UCM
  const EMBLEMAS = [
    { id: "geofisica", n: "Geofísica", t: "tierra" },
    { id: "estructural", n: "Geo. Estructural", t: "brujula" },
    { id: "geomorfo", n: "Geomorfología", t: "montana" },
    { id: "vulcano", n: "Volcanología", t: "volcan" },
    { id: "mapeo", n: "Mapeo Geológico", t: "mapa" },
    { id: "sig", n: "Cartografía y SIG", t: "capas" },
    { id: "endogena", n: "Petrología Endógena", t: "intrusion" },
    { id: "exogena", n: "Petrología Exógena", t: "corriente" },
    { id: "cristalo", n: "Cristalografía", t: "lupa" },
    { id: "geoquimica", n: "Geoquímica", t: "acido" },
    { id: "hidro", n: "Hidrogeología", t: "acuifero" },
    { id: "remociones", n: "Remociones en Masa", t: "clastos" },
    { id: "metalo", n: "Metalogénesis", t: "piqueta" },
    { id: "estrati", n: "Estratigrafía Andina", t: "capas" },
    { id: "geopatrimonio", n: "Geopatrimonio", t: "volcan" }
  ];
  const emblema = id => EMBLEMAS.find(e => e.id === id) || null;
  window.ILUS = { svg, deco, names: Object.keys(ART), EMBLEMAS, emblema };
})();
