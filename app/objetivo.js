/* Shaper · objetivo da pessoa no centro do app (v2.17)
   O abdômen deixa de ser o alvo principal. Cada objetivo (emagrecer, ganhar massa, definir,
   glúteos e pernas, saúde, abdômen) monta a semana de treinos e ajusta a dieta (calorias e
   proteína). Dá para trocar a qualquer momento pelo cartão "Seu objetivo" no Início ou em Ajustes;
   histórico, XP e recordes continuam. Estado: S.plan.goal (+ S.plan.gv = 2 no formato novo). */
(function () {
  "use strict";
  const G = window.GOAL_DEFS || [];
  const DAYS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // quem respondeu o questionário antigo: traduz o objetivo para a lista nova (uma vez)
  if (S.plan && S.plan.goal && !S.plan.gv) { S.plan.goal = (window.GOAL_OLD || {})[S.plan.goal] || ""; S.plan.gv = 2; save(); }
  const goal = () => G.find(g => S.plan && g.id === S.plan.goal) || null;
  window.curGoal = goal;

  /** Troca o objetivo: refaz a semana de treinos (mantém os dias de treino) e a dieta. */
  function setGoal(id) {
    const g = G.find(x => x.id === id); if (!g) return;
    S.plan = S.plan || { water: 0, wake: 7, sleep: 23, every: 90, card: true, at: todayStr() };
    S.plan.goal = id; S.plan.gv = 2; S.plan.focus = g.plan.slice(0, 3);
    const train = DAYS[S.plan.days] || DAYS[5];
    if (!S.wk || typeof S.wk !== "object") S.wk = {};
    S.wk.week = [0, 1, 2, 3, 4, 5, 6].map(d => { const k = train.indexOf(d); if (k < 0) return "rec"; const f = g.plan[k % g.plan.length]; return f === "padrao" ? "" : "t:" + f; });
    if (window.wkApply) wkApply();
    save(); render();
    toast("Objetivo: " + g.n + ". Sua semana de treinos foi montada.");
  }
  window.setGoal = setGoal;

  // pessoa nova que pulou o questionário: começa em "Definir e tonificar" (corpo todo), não só abdômen
  if (!S.history.length && !(S.plan && S.plan.goal)) setTimeout(() => { if (!(S.plan && S.plan.goal) && !document.querySelector(".ob-screen")) { const t = toast; window.toast = () => {}; try { setGoal("definir"); } finally { window.toast = t; } } }, 2500);

  /* ---------- dieta segue o objetivo ---------- */
  const _t = targets;
  targets = function () {
    const T = _t(), g = goal();
    if (!g) return T;
    const w = curW();
    T.kcal = Math.round((T.tdee + g.kcal) / 50) * 50;
    T.prot = Math.round(w * g.prot);
    T.carb = Math.max(80, Math.round((T.kcal - T.prot * 4 - T.fat * 9) / 4));
    return T;
  };

  // textos que falavam só de "secar a barriga" passam a falar do objetivo
  const TFIX = [
    [/^O abdômen trincado aparece.*$/, "Resultado vem da soma: treino, alimentação e sono. Um sem os outros rende pouco."],
    [/^Para secar a barriga: /, "Para emagrecer: "],
    [/ e o acúmulo de gordura na barriga\./, " e atrapalha a recuperação dos músculos."]
  ];
  TIPS.forEach((t, i) => TFIX.forEach(([re, to]) => { if (re.test(TIPS[i])) TIPS[i] = TIPS[i].replace(re, to); }));
  if (PH[2] && PH[2].n === "Trinca") { PH[2].n = "Força"; PH[2].t = "Volume alto: mais voltas e menos descanso. 4 voltas, 30 s."; }
  if (PH[3] && PH[3].n === "Seco") PH[3].n = "Pico";

  const _vd = vDieta;
  vDieta = function () {
    const g = goal(), T = targets(), h = _vd();
    const kc = !g ? "menos 500 kcal" : g.kcal < 0 ? "menos " + (-g.kcal) + " kcal" : g.kcal > 0 ? "mais " + g.kcal + " kcal" : "na manutenção";
    return h.replace('<div class="greet">Para secar a barriga</div>', '<div class="greet">' + (g ? "Dieta " + esc(g.diet) : "Sua dieta") + '</div>')
      .replace(/Gasto estimado de ~\d+ kcal\/dia treinando 6 vezes por semana, menos 500 kcal para secar\./, "Gasto estimado de ~" + T.tdee + " kcal/dia, " + kc + (g ? " " + esc(g.diet) : "") + ".")
      .replace("<h3>Regras para secar</h3>", "<h3>Regras de ouro</h3>");
  };

  /* ---------- o resto do app fala do objetivo, não só de abdômen ---------- */
  // aba Treino: no lugar de "Fase 1 · Base" (do plano de abdômen), o objetivo escolhido
  const _vt = vTreino;
  vTreino = function () {
    const h = _vt(), g = goal();
    if (!g || g.id === "abdomen") return h;
    return h.replace(/<div class="greet">Fase \d+ · [^<]*<\/div>/, '<div class="greet">' + esc(g.n) + '</div>');
  };
  // conquistas de peso: quem quer ganhar massa ganha medalha por SUBIR de peso
  const _bl = badgeList;
  badgeList = function () {
    const L = _bl(), g = goal();
    if (!g || g.id !== "massa") return L;
    const w0 = S.profile.startWeight, w = curW();
    return L.map(b => b[0] === "kg2" ? ["kg2", "+2 kg", "de massa", w - w0 >= 2] : b[0] === "kg5" ? ["kg5", "+5 kg", "de massa", w - w0 >= 5] : b);
  };

  /* ---------- cartão "Seu objetivo" (Início e Ajustes) ---------- */
  function card() {
    const g = goal();
    return '<button class="card ob2-card" data-goalpick><span class="ob2-ic">' + (g ? g.ic : "🎯") + '</span><span class="ob2-tx"><small>Seu objetivo</small><b>' + (g ? esc(g.n) : "Escolha seu objetivo") + '</b></span><span class="ob2-go">' + (g ? "Trocar" : "Escolher") + ' ›</span></button>';
  }
  function sheet() {
    const g = goal();
    const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 80;
    d.innerHTML = '<div class="sheet ob2-sheet"><div class="row between"><h2>Qual é o seu objetivo?</h2><button class="roundbtn" data-x aria-label="Fechar">' + IC.x + '</button></div>' +
      '<p class="note">O app monta a sua semana de treinos e ajusta a dieta. Seu histórico, XP e recordes continuam.</p>' +
      G.map(x => '<button class="ob2-opt' + (g && g.id === x.id ? " on" : "") + '" data-goalset="' + x.id + '"><span class="ob2-ic">' + x.ic + '</span><span class="ob2-tx"><b>' + esc(x.n) + '</b><small>' + esc(x.d) + '</small></span><span class="ob2-ck">' + (g && g.id === x.id ? "✓" : "") + '</span></button>').join("") +
      '<p class="note">Quer escolher os treinos de cada dia você mesmo? Use Treino → editar a semana.</p></div>';
    document.body.appendChild(d);
    if (window.uiIcons) uiIcons(d);
    d.onclick = e => {
      if (e.target === d || e.target.closest("[data-x]")) { d.remove(); return; }
      const b = e.target.closest("[data-goalset]"); if (b) { d.remove(); setGoal(b.dataset.goalset); }
    };
  }
  document.addEventListener("click", e => { if (e.target.closest("[data-goalpick]")) sheet(); });

  const _vh = vHome;
  vHome = function () {
    const h = _vh(), k = h.indexOf('<div class="sys-card');
    return k < 0 ? h : h.slice(0, k) + card() + h.slice(k);
  };
  const _va = vAjustes;
  vAjustes = function () {
    const h = _va(), k = h.indexOf('<div class="sec"><div class="sechead"><h3>Notificações');
    const box = '<div class="sec"><div class="sechead"><h3>Objetivo</h3></div>' + card() + '</div>';
    return k < 0 ? h + box : h.slice(0, k) + box + h.slice(k);
  };
  try { if (!document.querySelector("#layer > *")) render(); } catch (e) {}
})();
