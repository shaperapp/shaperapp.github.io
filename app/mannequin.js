/* Ritmiq · boneco animado (versão leve da demonstração)
   Um boneco vetorial (homem ou mulher, pelo perfil) faz cada exercício em loop, com
   movimento suave entre poses-chave. Leve: um SVG só, ~30 quadros/s, pausa fora da tela.
   Ângulos em graus no sentido horário a partir de "para cima" (90 = para frente/direita). */
(function () {
  "use strict";
  const G = 178; // chão
  const SEG = { m: { torso: 46, neck: 7, head: 11, ua: 24, fa: 22, th: 33, sh: 32, ft: 11 }, f: { torso: 43, neck: 7, head: 10.5, ua: 22.5, fa: 21, th: 32, sh: 31, ft: 10 } };
  const LOOK = {
    m: { skin: "#F1C09B", skin2: "#DFA47D", hair: "#2E241E", top: "#3BA3E6", top2: "#2C86C4", bottom: "#1E2229", bottom2: "#14171C", shoe: "#5E6672", sole: "#E8EAED", tw: 21, legW: 13 },
    f: { skin: "#F4C6A6", skin2: "#E2A988", hair: "#5A3726", top: "#F2628F", top2: "#D84B78", bottom: "#3D2F63", bottom2: "#2C2148", shoe: "#F2F3F5", sole: "#C9CCD2", tw: 18, legW: 12 }
  };
  const sin = d => Math.sin(d * Math.PI / 180), cos = d => Math.cos(d * Math.PI / 180);
  const P = (p, a, l) => [p[0] + l * sin(a), p[1] - l * cos(a)];
  const ang = (dx, dy) => Math.atan2(dx, -dy) * 180 / Math.PI;
  // dois ossos até um alvo; bend = 1 joelho para frente, -1 cotovelo para trás
  function ik(root, t, a, b, bend) {
    let dx = t[0] - root[0], dy = t[1] - root[1], d = Math.hypot(dx, dy);
    d = Math.max(Math.abs(a - b) + .01, Math.min(a + b - .01, d));
    const base = ang(dx, dy), phi = Math.acos((a * a + d * d - b * b) / (2 * a * d)) * 180 / Math.PI;
    const up = base - bend * phi, mid = P(root, up, a);
    return [up, ang(t[0] - mid[0], t[1] - mid[1])];
  }

  /* ---------- poses ----------
     x,y quadril · t tronco · h cabeça (relativa) · braços: s=ombro (0 junto ao corpo, 90 à frente,
     180 acima), e=cotovelo · pernas: q=quadril (0 reto, 90 coxa à frente), k=joelho ·
     ou alvos: H1/H2 mão, F1/F2 pé ([x,y]) para manter apoiados no chão */
  const ST = { x: 100, y: 113, t: 0, h: 0, s1: 14, e1: 22, s2: -12, e2: 22, q1: 0, k1: 2, q2: 0, k2: 2 };
  const st = o => Object.assign({}, ST, o);
  const SUP = { flip: 1, x: 82, y: 170, t: 92, h: 6, s1: 160, e1: 110, s2: 155, e2: 115, F1: [42, G], F2: [46, G] }; // deitado de costas, joelhos dobrados
  const sup = o => Object.assign({}, SUP, o);
  const PLK = { x: 80, y: 143, t: 78, h: 6, H1: [128, G], H2: [124, G], F1: [22, G], F2: [26, G] }; // prancha alta (braços esticados)
  const plk = o => Object.assign({}, PLK, o);
  const QUA = { x: 72, y: 136, t: 88, h: 8, H1: [120, G], H2: [116, G], F1: [44, G], F2: [48, G], knee: 1 }; // quatro apoios
  const qua = o => Object.assign({}, QUA, o);

  const T = {
    stand: [st({ y: 113 }), st({ y: 112, s1: 18, s2: -8 })],
    walk: [st({ q1: 28, k1: 8, q2: -18, k2: 22, s1: -24, e1: 30, s2: 30, e2: 30 }), st({ y: 111, q1: 0, k1: 30, q2: 0, k2: 4 }), st({ q1: -18, k1: 22, q2: 28, k2: 8, s1: 30, e1: 30, s2: -24, e2: 30 }), st({ y: 111, q1: 0, k1: 4, q2: 0, k2: 30 })],
    highknees: [st({ y: 108, q1: 88, k1: 100, q2: 0, k2: 6, s1: -35, e1: 95, s2: 55, e2: 95 }), st({ y: 106, q1: 8, k1: 12, q2: 8, k2: 12, s1: 10, e1: 90, s2: 10, e2: 90 }), st({ y: 108, q1: 0, k1: 6, q2: 88, k2: 100, s1: 55, e1: 95, s2: -35, e2: 95 }), st({ y: 106, q1: 8, k1: 12, q2: 8, k2: 12, s1: 10, e1: 90, s2: 10, e2: 90 })],
    jack: [st({ s1: 15, e1: 10, s2: -15, e2: 10 }), st({ y: 98, s1: 175, e1: 10, s2: 170, e2: 10, q1: 12, k1: 14, q2: -12, k2: 14 }), st({ s1: 15, e1: 10, s2: -15, e2: 10 })],
    squat: [st({ s1: 20, e1: 20, s2: 18, e2: 20, F1: [100, G], F2: [104, G] }), st({ x: 88, y: 142, t: 32, s1: 95, e1: 5, s2: 90, e2: 5, F1: [100, G], F2: [104, G] })],
    jumpsquat: [st({ x: 88, y: 142, t: 32, s1: -20, e1: 10, s2: -25, e2: 10, F1: [100, G], F2: [104, G] }), st({ y: 96, s1: 170, e1: 10, s2: 165, e2: 10, q1: 4, k1: 10, q2: 4, k2: 10 }), st({ x: 88, y: 142, t: 32, s1: -20, e1: 10, s2: -25, e2: 10, F1: [100, G], F2: [104, G] })],
    tuckjump: [st({ x: 90, y: 134, t: 22, s1: -10, e1: 30, F1: [100, G], F2: [104, G] }), st({ y: 84, s1: 60, e1: 80, s2: 55, e2: 80, q1: 105, k1: 125, q2: 100, k2: 125 }), st({ x: 90, y: 134, t: 22, s1: -10, e1: 30, F1: [100, G], F2: [104, G] })],
    lunge: [st({ F1: [104, G], F2: [96, G] }), st({ y: 140, t: 4, s1: 10, e1: 80, s2: 10, e2: 80, F1: [132, G], F2: [66, G], knee2: 1 })],
    wallsit: [st({ x: 70, y: 146, t: 0, s1: 90, e1: 0, s2: 85, e2: 0, F1: [104, G], F2: [107, G], prop: "wall" }), st({ x: 70, y: 147, t: 0, s1: 92, e1: 0, s2: 87, e2: 0, F1: [104, G], F2: [107, G], prop: "wall" })],
    calf: [st({ F1: [100, G], F2: [103, G] }), st({ y: 106, s1: 4, e1: 10, s2: -6, e2: 10, F1: [100, G - 6], F2: [103, G - 6], toe: 1 })],
    vacuum: [st({ s1: -30, e1: 120, s2: -30, e2: 120, breathe: 0 }), st({ s1: -30, e1: 120, s2: -30, e2: 120, breathe: 1 })],
    sidestretch: [st({ s1: 175, e1: 10, s2: -20, e2: 20 }), st({ t: -14, h: -10, s1: 190, e1: 20, s2: -10, e2: 20 })],
    pushup: [plk({}), plk({ x: 78, y: 158, t: 84, h: 4 })],
    inclinepush: [plk({ x: 82, y: 136, t: 66, H1: [128, 148], H2: [124, 148], prop: "bench" }), plk({ x: 82, y: 146, t: 72, H1: [128, 148], H2: [124, 148], prop: "bench" })],
    plank: [plk({ x: 78, y: 158, t: 82, H1: [118, G], H2: [114, G], elbowDown: 1 }), plk({ x: 78, y: 156, t: 82, H1: [118, G], H2: [114, G], elbowDown: 1 })],
    sideplank: [{ x: 74, y: 156, t: 72, h: 4, H1: [116, G], s2: 175, e2: 0, F1: [22, G], F2: [26, G - 4] }, { x: 74, y: 150, t: 70, h: 2, H1: [116, G], s2: 178, e2: 0, F1: [22, G], F2: [26, G - 4] }],
    climber: [plk({ q1: 115, k1: 120, F1: null }), plk({ q2: 115, k2: 120, F2: null })],
    burpee: [st({}), st({ x: 92, y: 140, t: 60, H1: [122, G], H2: [118, G], F1: [100, G], F2: [104, G] }), plk({}), st({ x: 92, y: 140, t: 60, H1: [122, G], H2: [118, G], F1: [100, G], F2: [104, G] }), st({ y: 98, s1: 175, e1: 5, s2: 170, e2: 5, q1: 4, k1: 8, q2: 4, k2: 8 })],
    crunch: [sup({}), sup({ t: 58, h: -18, s1: 150, e1: 120 })],
    situp: [sup({ s1: 175, e1: 5, s2: 170, e2: 5 }), sup({ t: 28, h: -10, s1: 110, e1: 5, s2: 105, e2: 5 })],
    vup: [sup({ t: 96, s1: 178, e1: 0, s2: 175, e2: 0, F1: null, F2: null, q1: 10, k1: 0, q2: 10, k2: 0 }), sup({ t: 45, h: -10, s1: 95, e1: 0, s2: 92, e2: 0, F1: null, F2: null, q1: 100, k1: 10, q2: 100, k2: 10 })],
    tuckcrunch: [sup({ t: 92, s1: 175, e1: 0, s2: 172, e2: 0, F1: null, F2: null, q1: 40, k1: 20, q2: 40, k2: 20 }), sup({ t: 55, h: -14, s1: 100, e1: 30, s2: 98, e2: 30, F1: null, F2: null, q1: 130, k1: 120, q2: 130, k2: 120 })],
    revcrunch: [sup({ t: 94, s1: -10, e1: 0, s2: -14, e2: 0, F1: null, F2: null, q1: 95, k1: 90, q2: 95, k2: 90 }), sup({ x: 84, y: 166, t: 100, s1: -10, e1: 0, s2: -14, e2: 0, F1: null, F2: null, q1: 150, k1: 120, q2: 150, k2: 120 })],
    legpull: [sup({ t: 70, s1: -40, e1: 10, s2: -44, e2: 10, F1: null, F2: null, q1: 40, k1: 5, q2: 40, k2: 5 }), sup({ t: 64, s1: -40, e1: 10, s2: -44, e2: 10, F1: null, F2: null, q1: 120, k1: 120, q2: 120, k2: 120 })],
    hipraise: [sup({ t: 94, s1: -8, e1: 0, s2: -12, e2: 0, F1: null, F2: null, q1: 90, k1: 90, q2: 90, k2: 90 }), sup({ x: 86, y: 160, t: 104, s1: -8, e1: 0, s2: -12, e2: 0, F1: null, F2: null, q1: 175, k1: 85, q2: 175, k2: 85 })],
    scissor: [sup({ t: 92, s1: -6, e1: 0, s2: -10, e2: 0, F1: null, F2: null, q1: 25, k1: 0, q2: 55, k2: 0 }), sup({ t: 92, s1: -6, e1: 0, s2: -10, e2: 0, F1: null, F2: null, q1: 55, k1: 0, q2: 25, k2: 0 })],
    bike: [sup({ t: 62, h: -16, s1: 150, e1: 125, s2: 150, e2: 125, F1: null, F2: null, q1: 130, k1: 120, q2: 30, k2: 10 }), sup({ t: 62, h: -16, s1: 150, e1: 125, s2: 150, e2: 125, F1: null, F2: null, q1: 30, k1: 10, q2: 130, k2: 120 })],
    toetouch: [sup({ t: 92, s1: 175, e1: 0, s2: 172, e2: 0, F1: null, F2: null, q1: 90, k1: 0, q2: 90, k2: 0 }), sup({ t: 62, h: -16, s1: 140, e1: 0, s2: 138, e2: 0, F1: null, F2: null, q1: 90, k1: 0, q2: 90, k2: 0 })],
    heeltouch: [sup({ t: 72, h: -10, s1: 12, e1: 0, s2: 8, e2: 0 }), sup({ t: 70, h: -10, s1: -6, e1: 0, s2: 24, e2: 0 })],
    deadbug: [sup({ t: 92, s1: 90, e1: 0, s2: 90, e2: 0, F1: null, F2: null, q1: 90, k1: 90, q2: 90, k2: 90 }), sup({ t: 92, s1: 165, e1: 0, s2: 90, e2: 0, F1: null, F2: null, q1: 90, k1: 90, q2: 10, k2: 0 }), sup({ t: 92, s1: 90, e1: 0, s2: 90, e2: 0, F1: null, F2: null, q1: 90, k1: 90, q2: 90, k2: 90 }), sup({ t: 92, s1: 90, e1: 0, s2: 165, e2: 0, F1: null, F2: null, q1: 10, k1: 0, q2: 90, k2: 90 })],
    twist: [{ x: 92, y: 172, t: -38, h: 10, s1: 60, e1: 70, s2: 40, e2: 70, q1: 95, k1: 95, q2: 92, k2: 95, mat: 1 }, { x: 92, y: 172, t: -36, h: 4, s1: 30, e1: 60, s2: 75, e2: 80, q1: 95, k1: 95, q2: 92, k2: 95, mat: 1 }],
    bridge: [sup({ t: 96, s1: -6, e1: 0, s2: -10, e2: 0, F1: [44, G], F2: [48, G] }), sup({ x: 72, y: 150, t: 110, s1: -4, e1: 0, s2: -8, e2: 0, F1: [44, G], F2: [48, G] })],
    superman: [{ x: 86, y: 170, t: 92, h: 6, s1: 175, e1: 0, s2: 172, e2: 0, q1: 0, k1: 0, q2: 0, k2: 0, prone: 1, mat: 1 }, { x: 86, y: 168, t: 80, h: 10, s1: 190, e1: 0, s2: 186, e2: 0, q1: -14, k1: 0, q2: -12, k2: 0, prone: 1, mat: 1 }],
    backcurl: [{ x: 86, y: 170, t: 92, h: 6, s1: -10, e1: 30, s2: -14, e2: 30, q1: 0, k1: 0, q2: 0, k2: 0, prone: 1, mat: 1 }, { x: 86, y: 168, t: 74, h: 12, s1: -20, e1: 20, s2: -24, e2: 20, q1: 0, k1: 0, q2: 0, k2: 0, prone: 1, mat: 1 }],
    donkey: [qua({}), qua({ q1: -70, k1: 90, F1: null })],
    hydrant: [qua({}), qua({ y: 134, q1: 50, k1: 95, F1: null, lift: 1 })],
    dip: [{ x: 74, y: 140, t: 2, h: 0, H1: [66, 128], H2: [70, 128], F1: [128, G], F2: [132, G], bend: -1, prop: "bench2" }, { x: 76, y: 160, t: 6, h: 0, H1: [66, 128], H2: [70, 128], F1: [128, G], F2: [132, G], bend: -1, prop: "bench2" }],
    crawl: [plk({ q1: 100, k1: 100, F1: null, H1: [134, G] }), plk({ q2: 100, k2: 100, F2: null, H2: [134, G] })],
    buttup: [plk({ x: 80, y: 158, t: 82, H1: [118, G], H2: [114, G], elbowDown: 1 }), plk({ x: 78, y: 118, t: 128, H1: [118, G], H2: [114, G], elbowDown: 1 })]
  };
  const MAP = {
    High_Knees: "highknees", Star_Jump: "jack", Bodyweight_Squat: "squat", Sumo_Squat: "squat", Freehand_Jump_Squat: "jumpsquat", Knee_Tuck_Jump: "tuckjump",
    Lunge: "lunge", Wall_Sit: "wallsit", Calf_Raise: "calf", Stomach_Vacuum: "vacuum", Standing_Lateral_Stretch: "sidestretch",
    Pushups: "pushup", Wide_Pushup: "pushup", Diamond_Pushup: "pushup", Incline_Pushup: "inclinepush", Plank: "plank", Side_Bridge: "sideplank",
    Mountain_Climbers: "climber", Spider_Crawl: "crawl", Burpee: "burpee", Crunches: "crunch", "Jackknife_Sit-Up": "vup", Cocoons: "tuckcrunch", Tuck_Crunch: "tuckcrunch",
    Reverse_Crunch: "revcrunch", "Leg_Pull-In": "legpull", "Bent-Knee_Hip_Raise": "hipraise", Scissor_Kick: "scissor", Air_Bike: "bike", Elbow_to_Knee: "bike",
    "Cross-Body_Crunch": "bike", Toe_Touchers: "toetouch", Alternate_Heel_Touchers: "heeltouch", "Oblique_Crunches_-_On_The_Floor": "heeltouch", Dead_Bug: "deadbug",
    Russian_Twist: "twist", Butt_Lift_Bridge: "bridge", Superman: "superman", Lower_Back_Curl: "backcurl", Donkey_Kick: "donkey", Fire_Hydrant: "hydrant",
    Tricep_Dip: "dip", "Butt-Ups": "buttup", walk: "walk"
  };
  const SPEED = { walk: .55, highknees: .32, jack: .42, jumpsquat: .55, tuckjump: .5, burpee: .6, climber: .3, crawl: .45, scissor: .45, bike: .5, deadbug: .7, twist: .6, wallsit: 1.6, plank: 1.6, sideplank: 1.6, vacuum: 1.8, calf: .7 };
  const tplOf = id => MAP[id] || (EX[id] && T[EX[id].mq] ? EX[id].mq : "stand"); // biblioteca.js diz a pose dos exercícios novos

  /* ---------- esqueleto a partir da pose ---------- */
  // deitado de costas (flip) o corpo fica espelhado: as juntas dobram para o outro lado
  function solve(p, sex) {
    const L = SEG[sex], f = p.flip ? -1 : 1, hip = [p.x, p.y], neck = P(hip, p.t, L.torso), headC = P(neck, p.t + f * (p.h || 0), L.neck + L.head);
    const leg = (q, k, F, bendSign) => {
      let th, sh;
      if (F) { const r = ik(hip, F, L.th, L.sh, bendSign * f); th = r[0]; sh = r[1]; }
      else { th = p.t + 180 - f * (q || 0); sh = th + f * (k || 0); }
      const knee = P(hip, th, L.th), ank = P(knee, sh, L.sh);
      // pé no chão fica reto; no ar acompanha a canela
      const ft = p.toe ? 130 : ank[1] > G - 12 ? (p.prone ? 180 + 90 : 90) : sh - 90;
      return { knee, ank, toe: P(ank, ft, L.ft), th, sh };
    };
    const arm = (s, e, H, bendSign) => {
      let ua, fa;
      if (H) { const r = ik(neck, H, L.ua, L.fa, bendSign * f); ua = r[0]; fa = r[1]; }
      else { ua = p.t + 180 - f * (s || 0); fa = ua - f * (e || 0); }
      const el = P(neck, ua, L.ua);
      return { el, hand: P(el, fa, L.fa), ua, fa };
    };
    return {
      hip, neck, headC, prone: p.prone,
      l1: leg(p.q1, p.k1, p.F1, p.knee ? -1 : 1), l2: leg(p.q2, p.k2, p.F2, (p.knee || p.knee2) ? -1 : 1),
      a1: arm(p.s1, p.e1, p.H1, p.bend || (p.elbowDown ? 1 : -1)), a2: arm(p.s2, p.e2, p.H2, p.bend || (p.elbowDown ? 1 : -1))
    };
  }
  const norm = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a; };
  // cada pose ganha também os ângulos das juntas (mesmo quando usa alvo de mão/pé),
  // assim a passagem entre poses é sempre contínua
  function prep(p, sx) {
    const o = Object.assign({}, p);
    ["F1", "F2", "H1", "H2"].forEach(k => { if (o[k] === null) delete o[k]; });
    const sk = solve(o, sx), f = o.flip ? -1 : 1;
    o.q1 = norm(f * (o.t + 180 - sk.l1.th)); o.k1 = norm(f * (sk.l1.sh - sk.l1.th));
    o.q2 = norm(f * (o.t + 180 - sk.l2.th)); o.k2 = norm(f * (sk.l2.sh - sk.l2.th));
    o.s1 = norm(f * (o.t + 180 - sk.a1.ua)); o.e1 = norm(f * (sk.a1.ua - sk.a1.fa));
    o.s2 = norm(f * (o.t + 180 - sk.a2.ua)); o.e2 = norm(f * (sk.a2.ua - sk.a2.fa));
    return o;
  }
  const NUM = ["x", "y", "t", "h", "q1", "k1", "q2", "k2", "s1", "e1", "s2", "e2"];
  function lerp(a, b, k) {
    const o = { flip: a.flip, prone: a.prone, toe: k < .5 ? a.toe : b.toe, breathe: a.breathe != null ? a.breathe + ((b.breathe || 0) - a.breathe) * k : 0, knee: a.knee, knee2: a.knee2, bend: a.bend, elbowDown: a.elbowDown };
    NUM.forEach(n => { const va = a[n] || 0, vb = b[n] || 0; o[n] = va + norm(vb - va) * k; });
    // mão/pé apoiado nas duas poses: continua apoiado (IK); senão anima pelos ângulos
    ["F1", "F2", "H1", "H2"].forEach(n => { if (a[n] && b[n]) o[n] = [a[n][0] + (b[n][0] - a[n][0]) * k, a[n][1] + (b[n][1] - a[n][1]) * k]; });
    return o;
  }

  /* ---------- desenho ---------- */
  const N = "http://www.w3.org/2000/svg";
  function el(tag, attrs, parent) { const e = document.createElementNS(N, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function build(svg, sex) {
    const c = LOOK[sex], g = {};
    el("ellipse", { cx: 100, cy: G + 3, rx: 46, ry: 5, fill: "rgba(20,30,60,.12)" }, svg).classList.add("mq-shadow");
    g.prop = el("g", {}, svg);
    const line = (w, color) => el("line", { "stroke-linecap": "round", "stroke-width": w, stroke: color }, svg);
    // lado de trás (mais escuro), corpo, lado da frente
    g.th2 = line(c.legW + 1, c.bottom2); g.sh2 = line(c.legW - 3, sex === "f" ? c.bottom2 : c.skin2); g.ft2 = line(7, c.sole);
    g.ua2 = line(8.5, c.skin2); g.fa2 = line(7.5, c.skin2); g.hd2 = el("circle", { r: 4, fill: c.skin2 }, svg);
    g.torso = line(c.tw, c.top); g.belly = line(c.tw - 2, sex === "f" ? c.skin : c.top2);
    g.neckL = line(8, c.skin);
    g.tail = sex === "f" ? el("ellipse", { rx: 6, ry: 9, fill: c.hair }, svg) : null;
    g.head = el("circle", { r: SEG[sex].head, fill: c.skin }, svg);
    g.hair = el("path", { fill: c.hair }, svg);
    g.ear = el("circle", { r: 2.4, fill: c.skin2 }, svg);
    g.shortsN = line(c.legW + 2.5, c.bottom); g.th1 = line(c.legW, sex === "f" ? c.bottom : c.skin); g.sh1 = line(c.legW - 3, sex === "f" ? c.bottom : c.skin); g.ft1 = line(7.5, c.shoe);
    g.ua1 = line(9, c.skin); g.cap = el("circle", { r: 6.5, fill: c.top }, svg); g.fa1 = line(8, c.skin); g.hd1 = el("circle", { r: 4.3, fill: c.skin }, svg);
    return g;
  }
  const set = (e, a, b) => { e.setAttribute("x1", a[0].toFixed(1)); e.setAttribute("y1", a[1].toFixed(1)); e.setAttribute("x2", b[0].toFixed(1)); e.setAttribute("y2", b[1].toFixed(1)); };
  const mid = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  function draw(g, sk, p, sex) {
    const hip = sk.hip, nk = sk.neck, hc = sk.headC, L = SEG[sex];
    set(g.th2, hip, sk.l2.knee); set(g.sh2, sk.l2.knee, sk.l2.ank); set(g.ft2, sk.l2.ank, sk.l2.toe);
    set(g.ua2, nk, sk.a2.el); set(g.fa2, sk.a2.el, sk.a2.hand); g.hd2.setAttribute("cx", sk.a2.hand[0].toFixed(1)); g.hd2.setAttribute("cy", sk.a2.hand[1].toFixed(1));
    const chest = mid(hip, nk, .92), waist = mid(hip, nk, .1), br = (p.breathe || 0) * 2;
    set(g.torso, waist, chest); g.torso.setAttribute("stroke-width", LOOK[sex].tw + br);
    set(g.belly, hip, mid(hip, nk, sex === "f" ? .4 : .3));
    set(g.neckL, nk, mid(nk, hc, .55));
    const ta = ang(hc[0] - nk[0], hc[1] - nk[1]);
    g.head.setAttribute("cx", hc[0].toFixed(1)); g.head.setAttribute("cy", hc[1].toFixed(1));
    // cabelo: meia-lua na nuca/topo, virada conforme a cabeça
    const f = p.flip ? -1 : 1, r = L.head + .6, s0 = P(hc, ta - f * 115, r), s1 = P(hc, ta + f * 65, r), back = P(hc, ta - f * 160, r * (sex === "f" ? 1.15 : .95));
    g.hair.setAttribute("d", "M" + s0[0].toFixed(1) + " " + s0[1].toFixed(1) + " A" + r + " " + r + " 0 0 " + (f > 0 ? 1 : 0) + " " + s1[0].toFixed(1) + " " + s1[1].toFixed(1) + " Q" + hc[0].toFixed(1) + " " + hc[1].toFixed(1) + " " + back[0].toFixed(1) + " " + back[1].toFixed(1) + " Z");
    const ear = P(hc, ta - f * 100, L.head * .25); g.ear.setAttribute("cx", ear[0].toFixed(1)); g.ear.setAttribute("cy", ear[1].toFixed(1));
    if (g.tail) { const ta2 = ta - f * 125, t = P(hc, ta2, L.head + 5); g.tail.setAttribute("cx", t[0].toFixed(1)); g.tail.setAttribute("cy", t[1].toFixed(1)); g.tail.setAttribute("transform", "rotate(" + ta2.toFixed(0) + " " + t[0].toFixed(1) + " " + t[1].toFixed(1) + ")"); }
    set(g.shortsN, hip, mid(hip, sk.l1.knee, sex === "f" ? 1 : .62));
    set(g.th1, mid(hip, sk.l1.knee, sex === "f" ? 0 : .55), sk.l1.knee); set(g.sh1, sk.l1.knee, sk.l1.ank); set(g.ft1, sk.l1.ank, sk.l1.toe);
    set(g.ua1, nk, sk.a1.el); set(g.fa1, sk.a1.el, sk.a1.hand);
    const cap = mid(nk, sk.a1.el, .18); g.cap.setAttribute("cx", cap[0].toFixed(1)); g.cap.setAttribute("cy", cap[1].toFixed(1));
    g.hd1.setAttribute("cx", sk.a1.hand[0].toFixed(1)); g.hd1.setAttribute("cy", sk.a1.hand[1].toFixed(1));
  }
  function propHTML(name) {
    if (name === "wall") return '<rect x="40" y="70" width="8" height="108" rx="2" fill="#D9DEE6"/>';
    if (name === "bench") return '<rect x="110" y="148" width="40" height="8" rx="3" fill="#C7CED9"/><rect x="114" y="156" width="6" height="22" fill="#B4BCC8"/><rect x="140" y="156" width="6" height="22" fill="#B4BCC8"/>';
    if (name === "bench2") return '<rect x="40" y="128" width="44" height="8" rx="3" fill="#C7CED9"/><rect x="44" y="136" width="6" height="42" fill="#B4BCC8"/><rect x="74" y="136" width="6" height="42" fill="#B4BCC8"/>';
    if (name === "mat") return '<rect x="14" y="176" width="172" height="5" rx="2.5" fill="#BFD4FF"/>';
    return "";
  }

  /* ---------- animação ---------- */
  const live = new Set();
  const sex = () => (S.profile && S.profile.sex === "f") ? "f" : "m";
  function mount(box) {
    if (box._mq) return;
    const id = box.dataset.mq, key = tplOf(id), sx = sex(), frames = T[key].map(f => prep(f, sx));
    const svg = el("svg", { viewBox: "12 34 176 160", class: "mq-svg", "aria-hidden": "true" });
    const lying = frames.some(f => f.mat || (f.t > 60 && f.y > 140));
    svg.innerHTML = '<defs><radialGradient id="mqBg" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#F7F9FC"/><stop offset="1" stop-color="#E9EEF6"/></radialGradient></defs><rect width="200" height="200" fill="url(#mqBg)"/>';
    const g = build(svg, sx);
    g.prop.innerHTML = (lying ? propHTML("mat") : "") + propHTML(frames[0].prop);
    box.innerHTML = ""; box.appendChild(svg);
    const m = { box, g, frames, sx, dur: (SPEED[key] || .75) * 1000, t0: performance.now(), still: box.classList.contains("mq-still") };
    box._mq = m;
    tick1(m, m.t0);
    if (!m.still) live.add(m);
    loop();
  }
  const ease = k => .5 - .5 * Math.cos(Math.PI * k);
  function tick1(m, now) {
    // o horário do quadro pode vir um pouco antes de t0: nunca deixa o índice ficar negativo
    const n = m.frames.length, el2 = Math.max(0, (now - m.t0) / m.dur), i = Math.floor(el2) % n, k = ease(el2 % 1);
    const pose = m.still ? m.frames[0] : lerp(m.frames[i], m.frames[(i + 1) % n], k);
    draw(m.g, solve(pose, m.sx), pose, m.sx);
  }
  let raf = 0, last = 0;
  function loop() {
    if (raf) return;
    const step = now => {
      raf = 0;
      if (document.hidden) return;
      live.forEach(m => { if (!m.box.isConnected) live.delete(m); });
      if (!live.size) return;
      if (now - last > 30) { last = now; live.forEach(m => tick1(m, now)); } // ~30 quadros/s
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) loop(); });
  // novos bonecos na tela (player, lista do treino, editor) são montados sozinhos
  new MutationObserver(() => document.querySelectorAll("[data-mq]").forEach(mount)).observe(document.body, { childList: true, subtree: true });

  /* ---------- liga na demonstração do app ---------- */
  // modo vídeo sem internet também usa o boneco (melhor que a foto parada)
  window.mqMode = () => S.demo === "boneco" || (S.demo === "video" && NATIVE && navigator.onLine === false);
  const _vid = vidHTML, _thumb = thumbHTML;
  vidHTML = function (id, sp) {
    if (window.mqMode() && EX[id]) return '<div class="vid mq" data-mq="' + id + '" role="img" aria-label="Demonstração animada: ' + EX[id].n + '"></div>';
    return _vid(id, sp);
  };
  thumbHTML = function (id) {
    if (window.mqMode() && EX[id]) return '<div class="thumb mq mq-still" data-mq="' + id + '"></div>';
    return _thumb(id);
  };
  // versão leve (boneco) vem ligada para todo mundo, uma vez; depois vale a escolha da pessoa
  if (!S.demoMq) { S.demo = "boneco"; S.demoMq = 1; save(); }
  // depois: o vídeo do YouTube (play automático) virou o padrão; o boneco entra quando está sem internet
  if (!S.demoYt) { S.demo = "video"; S.demoYt = 1; save(); }
  render();
})();
