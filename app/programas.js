/* Ritmiq · programas com tema, plano que se adapta e escudo da sequência
   - Programas: "30 dias de abdômen", "Iniciante absoluto", "Glúteo em 4 semanas", "Pós-parto",
     "Acima de 50" e "Alongamento ao acordar". Cada dia é um treino que fica um pouco mais
     difícil ao longo do programa. Estado em S.pg = {id, start, done:{dia:data}}.
   - Plano adaptativo: além do ajuste de tempo que já existia (Fácil/Na medida/Pesado), 3 treinos
     "fáceis" seguidos somam uma volta e 2 "pesados" seguidos sugerem a versão leve.
   - Escudo: a cada 7 dias seguidos você ganha um escudo (máx. 2). Se faltar um dia, ele é usado
     sozinho e a sequência continua. Estado em S.shield = {n, used:[datas], earned:[marcos]}. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ok = id => !!EX[id];

  /* ---------- programas ---------- */
  // dia: [lista de [id, segundos, reps]] em rodízio; "rest" = dia de descanso ativo
  const PROGS = [
    { id: "abs30", ic: "🔥", n: "30 dias de abdômen", s: "Tanquinho em 30 dias", lvl: "Todos os níveis", days: 30, rounds: 3, rest: 20, grow: .5, every: 7,
      rot: [
        [["Crunches", 30, 15], ["Reverse_Crunch", 30, 12], ["Plank", 30], ["Russian_Twist", 30, 20], ["Dead_Bug", 30, 12]],
        [["Bent-Knee_Hip_Raise", 30, 12], ["Air_Bike", 30, 20], ["Side_Bridge", 25], ["Heel_Tap_Crunch", 30, 20], ["Mountain_Climbers", 30]],
        [["Leg_Pull-In", 30, 12], ["Flutter_Kick", 30], ["Plank_Shoulder_Tap", 30, 16], ["Elbow_to_Knee", 30, 16], ["Hollow_Hold", 20]]
      ] },
    { id: "ini21", ic: "🌱", n: "Iniciante absoluto", s: "Do zero, 10 minutos por dia", lvl: "Nunca treinou", days: 21, rounds: 2, rest: 30, grow: .4, every: 4,
      rot: [
        [["Bodyweight_Squat", 30, 10], ["Incline_Pushup", 30, 8], ["Butt_Lift_Bridge", 30, 10], ["Dead_Bug", 30, 8], ["Plank", 20]],
        [["Jumping_Jack", 30], ["Reverse_Lunge", 30, 8], ["Knee_Pushup", 30, 8], ["Bird_Dog", 30, 10], ["Crunches", 30, 10]]
      ] },
    { id: "glu28", ic: "🍑", n: "Glúteo em 4 semanas", s: "Bumbum firme e empinado", lvl: "Iniciante a intermediário", days: 28, rounds: 3, rest: 20, grow: .5, every: 4,
      rot: [
        [["Butt_Lift_Bridge", 40, 18], ["Sumo_Squat", 35, 15], ["Donkey_Kick", 40, 16], ["Fire_Hydrant", 40, 16], ["Frog_Pump", 30, 20]],
        [["Hip_Thrust", 40, 15], ["Curtsy_Lunge", 40, 12], ["Clamshell", 40, 16], ["Single_Leg_Glute_Bridge", 40, 10], ["Squat_Pulse", 30]],
        [["Reverse_Lunge", 40, 12], ["Side_Lying_Leg_Raise", 40, 16], ["Wall_Sit", 40], ["Step_Up", 40, 12], ["Standing_Glute_Kickback", 40, 15]]
      ] },
    { id: "pos", ic: "🤱", n: "Pós-parto", s: "Volta suave, sem abdominal tradicional", lvl: "Só com liberação médica", days: 28, rounds: 2, rest: 30, grow: .3, every: 3,
      warn: "Comece só depois da liberação do seu médico (em geral 6 a 8 semanas após o parto; mais após cesárea). Pare se sentir dor, sangramento ou pressão na pelve. Se tiver diástase, prefira acompanhamento de fisioterapeuta.",
      rot: [
        [["Cat_Cow", 40], ["Butt_Lift_Bridge", 30, 10], ["Bird_Dog", 30, 8], ["Clamshell", 30, 12], ["Childs_Pose", 40]],
        [["Dead_Bug", 30, 8], ["Incline_Pushup", 30, 8], ["Side_Lying_Leg_Raise", 30, 12], ["Bodyweight_Squat", 30, 10], ["Supine_Twist", 40]]
      ] },
    { id: "s50", ic: "🧓", n: "Acima de 50 anos", s: "Força, equilíbrio e articulações", lvl: "Baixo impacto", days: 28, rounds: 2, rest: 30, grow: .3, every: 3,
      warn: "Se tiver problema de coração, pressão, coluna ou articulação, converse com seu médico antes. Faça os agachamentos sentando e levantando de uma cadeira se precisar.",
      rot: [
        [["Arm_Circles", 30], ["Bodyweight_Squat", 35, 10], ["Incline_Pushup", 30, 8], ["Calf_Raise", 30, 12], ["Bird_Dog", 30, 8], ["Hamstring_Stretch", 40]],
        [["Step_Up", 35, 10], ["Butt_Lift_Bridge", 30, 10], ["Wall_Sit", 25], ["Side_Lying_Leg_Raise", 30, 10], ["Cat_Cow", 40], ["Chest_Stretch", 40]]
      ] },
    { id: "alo", ic: "🧘", n: "Alongamento ao acordar", s: "5 minutos para soltar o corpo", lvl: "Todos", days: 30, rounds: 1, rest: 5, grow: 0, every: 0, fixed: 1,
      rot: [
        [["Cat_Cow", 40], ["Worlds_Greatest_Stretch", 50], ["Hip_Flexor_Stretch", 50], ["Hamstring_Stretch", 40], ["Cobra_Stretch", 30], ["Childs_Pose", 40], ["Neck_Stretch", 40]],
        [["Downward_Dog", 40], ["Thread_The_Needle", 50], ["Figure_Four_Stretch", 50], ["Supine_Twist", 50], ["Butterfly_Stretch", 40], ["Childs_Pose", 40]]
      ] }
  ];
  const P = id => PROGS.find(p => p.id === id);
  const G = () => (S.pg && P(S.pg.id)) ? S.pg : null;
  const isRest = (p, k) => p.every && (k + 1) % p.every === 0 && k + 1 < p.days;
  function dayWorkout(p, k) {
    if (isRest(p, k)) return { n: p.n + " · Dia " + (k + 1), f: "Descanso ativo: caminhada leve", items: [["walk", 1200]], keep: true, fixed: true, rounds: 1 };
    const g = 1 + p.grow * (k / Math.max(1, p.days - 1));
    const items = p.rot[k % p.rot.length].filter(x => ok(x[0])).map(([id, s, r]) => [id, Math.round(s * (p.fixed ? 1 : Math.min(1.35, g)) / 5) * 5, r ? Math.round(r * g) : 0]);
    return { n: p.n + " · Dia " + (k + 1), f: p.s, items, keep: true, fixed: p.fixed ? true : undefined, rounds: p.rounds, rest: p.rest };
  }
  function curDay() { const g = G(); if (!g) return 0; const p = P(g.id); let k = 0; while (k < p.days - 1 && g.done[k]) k++; return k; }
  function play(k) {
    const g = G(); if (!g) return;
    const t = dayWorkout(P(g.id), k), wd = wdOf(todayStr()), keep = PLAN[wd];
    PLAN[wd] = t;
    try { startWorkout(wd); } finally { PLAN[wd] = keep; }
    if (PL) PL.pg = { id: g.id, k };
  }
  const _fin = finish;
  finish = function () {
    const pg = PL && PL.pg;
    _fin();
    const g = G();
    if (pg && g && g.id === pg.id) {
      g.done[pg.k] = todayStr(); save();
      const p = P(g.id), n = Object.keys(g.done).length;
      if (n >= p.days) setTimeout(() => { toast("🏆 Programa concluído: " + p.n + "!"); say("Parabéns! Você concluiu o programa " + p.n); }, 2600);
    }
  };

  function cardsHTML() {
    const g = G();
    let top = "";
    if (g) {
      const p = P(g.id), k = curDay(), n = Object.keys(g.done).length, doneToday = Object.values(g.done).includes(todayStr());
      const t = dayWorkout(p, k);
      top = '<div class="card pg-cur"><div class="row between"><div><small>' + p.ic + ' Seu programa</small><h3>' + esc(p.n) + '</h3></div><span class="pill live">' + n + '/' + p.days + '</span></div>' +
        '<div class="pg-dots">' + Array.from({ length: p.days }, (_, i) => '<i class="' + (g.done[i] ? "d" : i === k ? "t" : isRest(p, i) ? "r" : "") + '"></i>').join("") + '</div>' +
        (n >= p.days ? '<p class="note">🏆 Concluído! Escolha outro programa abaixo ou repita este.</p><button class="btn ghost block" data-pgstart="' + p.id + '">Repetir programa</button>'
          : '<p class="note">Dia ' + (k + 1) + ': ' + esc(t.f) + ' · ' + t.items.length + ' exercício' + (t.items.length > 1 ? "s" : "") + (doneToday ? ' · ✅ você já fez um dia hoje' : "") + '</p>' +
            '<button class="btn primary block" data-pgplay="' + k + '">' + IC.play + ' ' + (isRest(p, k) ? "Fazer descanso ativo" : "Fazer o dia " + (k + 1)) + '</button>') +
        '<button class="pg-quit" data-pgquit>Sair do programa</button></div>';
    }
    const list = PROGS.filter(p => !g || p.id !== g.id).map(p => '<button class="pg-card" data-pgsee="' + p.id + '"><span>' + p.ic + '</span><b>' + esc(p.n) + '</b><small>' + p.days + ' dias · ' + esc(p.lvl) + '</small></button>').join("");
    return '<div class="sec"><div class="sechead"><h3>Programas</h3><span>' + PROGS.length + '</span></div>' + top + '<div class="pg-list">' + list + '</div></div>';
  }
  function see(id) {
    const p = P(id); if (!p) return;
    const first = dayWorkout(p, 0), rests = Array.from({ length: p.days }, (_, i) => isRest(p, i)).filter(Boolean).length;
    const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 80;
    d.innerHTML = '<div class="sheet"><div class="row between"><h2>' + p.ic + ' ' + esc(p.n) + '</h2><button class="roundbtn" data-x aria-label="Fechar">' + IC.x + '</button></div>' +
      '<p class="note">' + esc(p.s) + ' · ' + p.days + ' dias' + (rests ? ' (' + rests + ' de descanso ativo)' : "") + ' · ' + esc(p.lvl) + '. A cada dia o treino fica um pouco mais difícil.</p>' +
      (p.warn ? '<div class="card pg-warn">⚠️ ' + esc(p.warn) + '</div>' : "") +
      '<b>Dia 1</b><div>' + first.items.map(([id, s, r]) => '<button class="ex" data-ex="' + id + '">' + thumbHTML(id) + '<div class="t"><b>' + esc(EX[id].n) + '</b><span>' + (r ? r + " rep · " : "") + esc(EX[id].m || "") + '</span></div><div class="rx">' + s + ' s</div></button>').join("") + '</div>' +
      '<button class="btn primary block" data-pgstart="' + p.id + '">Começar programa</button></div>';
    document.body.appendChild(d);
    d.onclick = e => {
      if (e.target === d || e.target.closest("[data-x]")) d.remove();
      const ex = e.target.closest("[data-ex]"); if (ex) { d.remove(); openEx(ex.dataset.ex); }
      if (e.target.closest("[data-pgstart]")) d.remove();
    };
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-pgsee],[data-pgstart],[data-pgplay],[data-pgquit]");
    if (!a) return;
    if (a.dataset.pgsee) see(a.dataset.pgsee);
    else if (a.dataset.pgstart) { S.pg = { id: a.dataset.pgstart, start: todayStr(), done: {} }; save(); render(); toast("Programa iniciado: " + P(S.pg.id).n); }
    else if (a.dataset.pgplay != null) play(+a.dataset.pgplay);
    else if (a.hasAttribute("data-pgquit")) {
      if (a.dataset.sure) { S.pg = null; save(); render(); toast("Você saiu do programa"); }
      else { a.dataset.sure = 1; a.textContent = "Toque de novo para confirmar"; }
    }
  });
  const _vt = vTreino;
  vTreino = function () { const h = _vt(), k = h.indexOf('<div class="days"'); return k < 0 ? h + cardsHTML() : h.slice(0, k) + cardsHTML() + h.slice(k); };
  // atalho no Início quando há programa ativo
  const _vh = vHome;
  vHome = function () {
    const h = _vh(), g = G(); if (!g) return h;
    const p = P(g.id), n = Object.keys(g.done).length; if (n >= p.days) return h;
    const k = h.indexOf('<div class="sec"><div class="sechead"><h3>Atalhos');
    const card = '<button class="pg-home" data-pgplay="' + curDay() + '"><span>' + p.ic + '</span><div><b>' + esc(p.n) + ' · Dia ' + (curDay() + 1) + '</b><small>' + n + ' de ' + p.days + ' dias feitos</small></div>' + IC.play + '</button>';
    return k < 0 ? h : h.slice(0, k) + card + h.slice(k);
  };

  /* ---------- plano adaptativo (complementa o Fácil/Na medida/Pesado) ---------- */
  const feels = () => S.history.map(h => h.feel).filter(Boolean);
  const _bw = buildWorkout;
  buildWorkout = function (wd, pi) {
    const w = _bw(wd, pi);
    if (!w.fixed && !PLAN[wd].keep && S.xr > 0) w.rounds += 1;
    return w;
  };
  const _rate = rateWorkout;
  rateWorkout = function (k) {
    _rate(k);
    if (!PL) return;
    const f = feels(), l3 = f.slice(-3), l2 = f.slice(-2);
    PL.adapt = null;
    if (l3.length === 3 && l3.every(x => x === "easy") && !(S.xr > 0)) PL.adapt = "up";
    else if (l2.length === 2 && l2.every(x => x === "hard") && !S.light) PL.adapt = "light";
    else if (k === "hard" && S.xr > 0) PL.adapt = "down";
    if (PL && PL.adapt) renderPlayer();
  };
  const _rp = renderPlayer;
  renderPlayer = function () {
    _rp();
    if (!PL || !PL.fin || !PL.adapt) return;
    const hero = document.querySelector("#pl .done-hero .feel"); if (!hero || document.querySelector(".pg-adapt")) return;
    const T = { up: ["💪 Os últimos 3 treinos foram fáceis", "Quer somar uma volta nos treinos do plano?", "Somar 1 volta"],
      light: ["😮‍💨 Os últimos 2 treinos foram pesados", "Quer usar a versão leve nos próximos dias?", "Ativar versão leve"],
      down: ["Pesou com a volta extra?", "Dá para voltar ao número normal de voltas.", "Tirar a volta extra"] }[PL.adapt];
    hero.insertAdjacentHTML("afterend", '<div class="pg-adapt"><b>' + T[0] + '</b><small>' + T[1] + '</small><button class="btn blue" data-adapt="' + PL.adapt + '">' + T[2] + '</button></div>');
  };
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-adapt]"); if (!b) return;
    const a = b.dataset.adapt;
    if (a === "up") { S.xr = 1; toast("+1 volta nos próximos treinos"); }
    if (a === "light") { S.light = true; toast("Versão leve ativada"); }
    if (a === "down") { S.xr = 0; toast("Voltas normais de novo"); }
    save(); b.closest(".pg-adapt").remove();
  });

  /* ---------- escudo da sequência ---------- */
  const SH = () => { if (!S.shield || typeof S.shield !== "object") S.shield = { n: 0, used: [], earned: [] }; return S.shield; };
  const _streak = streak;
  streak = function () {
    const ds = doneSet(), used = new Set(SH().used);
    let d = todayStr(), n = 0;
    if (!ds[d]) d = addDays(d, -1);
    while (ds[d] || used.has(d)) { if (ds[d]) n++; d = addDays(d, -1); }
    return n;
  };
  const _best = bestStreak;
  bestStreak = function () {
    const ds = doneSet(), used = SH().used; const all = Object.keys(ds).concat(used).sort();
    let best = 0, run = 0, prev = null;
    [...new Set(all)].sort().forEach(d => { run = prev && diffDays(prev, d) === 1 ? run + (ds[d] ? 1 : 0) : (ds[d] ? 1 : 0); best = Math.max(best, run); prev = d; });
    return Math.max(best, _best());
  };
  function checkShield() {
    const s = SH(), ds = doneSet(), t = todayStr();
    // ganha 1 escudo a cada 7 dias seguidos (no máximo 2 guardados)
    const st = streak(), mark = Math.floor(st / 7);
    if (mark > 0) { const key = addDays(t, -st + 1) + "#" + mark; if (!s.earned.includes(key)) { s.earned.push(key); s.earned = s.earned.slice(-20); if (s.n < 2) { s.n++; setTimeout(() => toast("🛡️ Você ganhou um escudo de sequência!"), 900); } save(); } }
    // ontem ficou sem treino, mas a sequência antes era boa: usa o escudo sozinho
    const y = addDays(t, -1), y2 = addDays(t, -2);
    if (!ds[y] && !s.used.includes(y) && (ds[y2] || s.used.includes(y2)) && s.n > 0) {
      const used = new Set(s.used); let d = y2, run = 0; while (ds[d] || used.has(d)) { if (ds[d]) run++; d = addDays(d, -1); }
      if (run >= 3) { s.n--; s.used.push(y); s.used = s.used.slice(-30); save(); setTimeout(() => toast("🛡️ Escudo usado: sua sequência de " + run + " dias continua!"), 1200); }
    }
  }
  const _vp = vProg;
  vProg = function () {
    const h = _vp(), s = SH();
    const card = '<div class="card pg-shield"><span>🛡️</span><div><b>' + s.n + ' escudo' + (s.n === 1 ? "" : "s") + ' de sequência</b><small>A cada 7 dias seguidos você ganha um (máx. 2). Se faltar um dia, ele é usado sozinho e a sequência continua.' + (s.used.length ? " Usados: " + s.used.slice(-3).map(fmtD).join(", ") + "." : "") + '</small></div></div>';
    const k = h.indexOf('<div class="card stack" style="gap:12px"><div class="row between"><h3>Dia ');
    return k < 0 ? h : h.slice(0, k) + card + h.slice(k);
  };
  checkShield();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) checkShield(); });
  const _f2 = finish; finish = function () { _f2(); checkShield(); };
  window.PROGS = PROGS;
})();
