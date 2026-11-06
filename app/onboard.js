/* Ritmiq · boas-vindas e plano de água
   Usuário novo responde um mini formulário (objetivo, foco, nível, dias, corpo e rotina).
   Com isso o app monta a semana de treinos, calcula quantos litros beber por dia e de
   quanto em quanto tempo lembrar. O cartão da água fica na tela até bater a meta. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hh = h => String(h).padStart(2, "0") + "h";
  const L = ml => (ml / 1000).toFixed(2).replace(".", ",").replace(/,00$/, "").replace(/(,\d)0$/, "$1") + " L";
  const dur = m => (m >= 60 ? Math.floor(m / 60) + "h" + (m % 60 ? " " + String(m % 60).padStart(2, "0") + "min" : "") : m + " min");

  // objetivos (v2.17): cada um já sugere os treinos da semana; a pessoa pode ajustar no passo seguinte
  const GOALS = (window.GOAL_DEFS || []).map(g => [g.id, g.ic, g.n, g.d]);
  const FOCUS = [["geral", "⚡", "Corpo todo", "Força e queima geral"], ["hiit", "🔥", "Cardio HIIT", "Queima calorias rápido"], ["peito", "🛡️", "Peito", "Peito e tríceps"], ["costas", "🧭", "Costas", "Postura e costas"],
    ["bracos", "💪", "Braços e ombros", "Bíceps, tríceps e ombros"], ["perna", "🏋️", "Pernas", "Coxas e panturrilhas"], ["bunda", "🍑", "Glúteos", "Bumbum firme"], ["tanquinho", "🎯", "Abdômen", "Abdômen inteiro"],
    ["cintura", "⏳", "Cintura", "Oblíquos e core"], ["mobilidade", "🧘", "Mobilidade", "Alongar e soltar o corpo"], ["padrao", "⭐", "Plano de abdômen 90 dias", "O programa clássico do app"]];
  const LEVELS = [["ini", "🌱", "Iniciante", "Estou começando ou voltando agora", .85], ["int", "🔥", "Intermediário", "Treino de vez em quando", 1], ["ava", "🚀", "Avançado", "Treino sempre e aguento pesado", 1.15]];
  const ACT = [["sent", "🪑", "Sentado a maior parte do dia", 0], ["pe", "🚶", "Em pé, ando bastante", 350], ["pesado", "🏗️", "Trabalho pesado ou muito ativo", 700]];
  const DAYS = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6] };
  const STEPS = ["goal", "focus", "level", "days", "body", "routine", "result"];

  let OB = null; // { i, a: respostas }

  /* ---------- cálculo do plano ---------- */
  function calc(a) {
    const kg = +a.kg || curW();
    let ml = 35 * kg + (ACT.find(x => x[0] === a.act) || ACT[0])[3] + (a.hot ? 500 : 0) + Math.round(a.days / 7 * 500);
    ml = Math.min(6000, Math.max(1500, Math.round(ml / 250) * 250));
    const cups = Math.ceil(ml / 250);
    const win = Math.max(4, (a.sleep > a.wake ? a.sleep - a.wake : a.sleep + 24 - a.wake) - 1) * 60; // para 1 h antes de dormir
    const every = Math.min(180, Math.max(20, Math.round(win / cups / 5) * 5));
    const g = (window.GOAL_DEFS || []).find(x => x.id === a.goal);
    const train = DAYS[a.days] || DAYS[5], focus = a.focus.length ? a.focus : (g ? g.plan : ["geral"]);
    const week = [0, 1, 2, 3, 4, 5, 6].map(d => {
      const k = train.indexOf(d);
      if (k < 0) return "rec";
      const f = focus[k % focus.length];
      return f === "padrao" ? "" : "t:" + f;
    });
    return { water: ml, cups, every, week };
  }

  function apply() {
    const a = OB.a, r = calc(a), p = S.profile;
    p.sex = a.sex; p.age = +a.age || p.age; p.height = +a.height || p.height; p.goalWeight = +a.goalKg || p.goalWeight;
    const kg = +a.kg;
    if (kg) {
      if (!S.history.length) { p.startWeight = kg; if (S.logs[0]) S.logs[0].kg = kg; }
      else { const t = todayStr(), l = S.logs.find(x => x.d === t); if (l) l.kg = kg; else S.logs.push({ d: t, kg, waist: null }); }
    }
    S.adj = (LEVELS.find(x => x[0] === a.level) || LEVELS[1])[4];
    if (!S.wk || typeof S.wk !== "object") S.wk = {};
    S.wk.week = r.week;
    if (a.nick && window.netAcct && netAcct().name === "Jogador") netAcct().name = a.nick; // vira o nome no ranking também
    S.plan = Object.assign({}, a, { water: r.water, cups: r.cups, every: r.every, card: true, at: todayStr(), gv: 2 });
    if (window.wkApply) wkApply();
    save(); syncWater(true);
  }

  /* ---------- telas ---------- */
  const opt = (k, ic, t, d, on, attr) => '<button type="button" class="ob-opt' + (on ? " on" : "") + '" ' + attr + '="' + k + '"><span class="ob-ic">' + ic + '</span><span class="ob-tx"><b>' + t + '</b><small>' + d + '</small></span><span class="ob-ck">✓</span></button>';
  const num = (id, label, v, unit, min, max, step) => '<label class="ob-num"><span>' + label + '</span><span class="ob-in"><input id="' + id + '" type="number" inputmode="decimal" min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + esc(v) + '"><i>' + unit + '</i></span></label>';
  const hours = (id, v) => { let s = ""; for (let h = 0; h < 24; h++) s += '<option value="' + h + '"' + (h === v ? " selected" : "") + '>' + hh(h) + '</option>'; return '<select id="' + id + '" class="ob-sel">' + s + '</select>'; };

  function body() {
    const a = OB.a, s = STEPS[OB.i];
    if (s === "goal") return '<h2>Qual é o seu objetivo?</h2><p>Vamos montar um plano só seu. Leva menos de 1 minuto.</p><div class="ob-list">' + GOALS.map(g => opt(g[0], g[1], g[2], g[3], a.goal === g[0], "data-obgoal")).join("") + '</div>';
    if (s === "focus") return '<h2>O que você quer treinar?</h2><p>Já marcamos o que combina com o seu objetivo. Troque se quiser (até 3); o app alterna entre eles nos dias de treino.</p><div class="ob-grid">' + FOCUS.map(g => opt(g[0], g[1], g[2], g[3], a.focus.includes(g[0]), "data-obfocus")).join("") + '</div>';
    if (s === "level") return '<h2>Qual é o seu nível?</h2><p>Ajusta o tempo de cada exercício e o descanso.</p><div class="ob-list">' + LEVELS.map(g => opt(g[0], g[1], g[2], g[3], a.level === g[0], "data-oblevel")).join("") + '</div>';
    if (s === "days") return '<h2>Quantos dias por semana?</h2><p>Nos outros dias o app passa um treino leve de recuperação.</p><div class="ob-days">' + [3, 4, 5, 6, 7].map(n => '<button type="button" data-obdays="' + n + '" class="' + (a.days === n ? "on" : "") + '"><b>' + n + '</b><small>dias</small></button>').join("") + '</div>' +
      '<div class="ob-week">' + WD.map((d, i) => '<span class="' + ((DAYS[a.days] || []).includes(i) ? "on" : "") + '">' + d + '</span>').join("") + '</div>';
    if (s === "body") return '<h2>Sobre você</h2><p>Usamos para calcular água, proteína e calorias.</p>' +
      '<label class="ob-num"><span>Como quer ser chamado?</span><span class="ob-in"><input id="obNick" maxlength="24" autocomplete="given-name" placeholder="Seu nome" value="' + esc(a.nick) + '"></span></label>' +
      '<div class="ob-sex"><button type="button" data-obsex="m" class="' + (a.sex === "m" ? "on" : "") + '">♂ Homem</button><button type="button" data-obsex="f" class="' + (a.sex === "f" ? "on" : "") + '">♀ Mulher</button></div>' +
      '<div class="ob-nums">' + num("obAge", "Idade", a.age, "anos", 12, 90) + num("obH", "Altura", a.height, "cm", 120, 230) + num("obKg", "Peso atual", a.kg, "kg", 35, 250, .1) + num("obGoal", "Peso meta", a.goalKg, "kg", 35, 250, .1) + '</div>';
    if (s === "routine") return '<h2>Sua rotina</h2><p>Define quantos litros beber e quando lembrar você.</p><div class="ob-list">' + ACT.map(g => opt(g[0], g[1], g[2], "", a.act === g[0], "data-obact")).join("") + '</div>' +
      '<button type="button" class="ob-toggle' + (a.hot ? " on" : "") + '" data-obhot><span>☀️ Moro num lugar quente ou suo muito</span><i></i></button>' +
      '<div class="ob-time"><label><span>⏰ Acordo às</span>' + hours("obWake", a.wake) + '</label><label><span>🌙 Durmo às</span>' + hours("obSleep", a.sleep) + '</label></div>';
    const r = calc(a);
    const tr = r.week.map((k, d) => '<div class="ob-wd' + (k === "rec" ? " rec" : "") + '"><span>' + WD[d] + '</span><b>' + (k === "rec" ? "Leve" : k === "" ? "90 dias" : (FOCUS.find(f => "t:" + f[0] === k) || [0, 0, "Treino"])[2]) + '</b></div>').join("");
    return '<div class="ob-done">🎯</div><h2>Seu plano está pronto!</h2><p>Você pode mudar tudo depois em Ajustes.</p>' +
      '<div class="ob-res water"><div class="ob-big">💧 ' + L(r.water) + '<small>por dia</small></div><div class="ob-facts"><span><b>' + r.cups + '</b> copos de 250 ml</span><span>1 copo a cada <b>' + dur(r.every) + '</b></span><span>das <b>' + hh(a.wake) + '</b> às <b>' + hh((a.sleep + 23) % 24) + '</b></span></div></div>' +
      '<div class="ob-res"><div class="ob-rh"><b>🏋️ Sua semana</b><span>' + a.days + ' treinos</span></div><div class="ob-wk">' + tr + '</div></div>' +
      '<p class="note" style="text-align:center">Um cartão da água fica na sua tela e na tela de bloqueio até você bater a meta do dia.</p>';
  }
  function canNext() {
    const a = OB.a, s = STEPS[OB.i];
    return s === "goal" ? !!a.goal : s === "focus" ? a.focus.length > 0 : s === "level" ? !!a.level : s === "days" ? !!a.days : s === "routine" ? !!a.act : true;
  }
  function draw() {
    let el = document.querySelector(".ob-screen");
    if (!el) { el = document.createElement("div"); el.className = "ob-screen"; document.body.appendChild(el); }
    const last = OB.i === STEPS.length - 1;
    el.innerHTML = '<div class="ob-wrap"><div class="ob-head">' + (OB.i ? '<button class="ob-back" data-obback aria-label="Voltar">‹</button>' : '<span></span>') +
      '<div class="ob-dots">' + STEPS.map((x, i) => '<i class="' + (i < OB.i ? "done" : i === OB.i ? "cur" : "") + '"></i>').join("") + '</div>' +
      (last ? '<span></span>' : '<button class="ob-skip" data-obskip>Pular</button>') + '</div>' +
      '<div class="ob-body" key="' + OB.i + '">' + body() + '</div>' +
      '<button class="ob-next" data-obnext' + (canNext() ? "" : " disabled") + '>' + (last ? "Começar meu plano 🚀" : OB.i === STEPS.length - 2 ? "Ver meu plano" : "Continuar") + '</button></div>';
    el.scrollTop = 0;
  }
  function readBody() {
    const a = OB.a, v = id => { const e = document.getElementById(id); return e ? e.value : undefined; };
    if (STEPS[OB.i] === "body") { if (v("obNick") !== undefined) a.nick = v("obNick").trim().slice(0, 24); a.age = v("obAge"); a.height = v("obH"); a.kg = v("obKg"); a.goalKg = v("obGoal"); }
    if (STEPS[OB.i] === "routine") { a.wake = +v("obWake"); a.sleep = +v("obSleep"); }
  }
  function open(force) {
    if (!force && (S.plan || document.querySelector(".ob-screen"))) return;
    const p = S.profile, prev = S.plan || {};
    OB = {
      i: 0, a: {
        nick: prev.nick || (S.acct && S.acct.name !== "Jogador" ? S.acct.name : "") || "", goal: prev.goal || "", focus: (prev.focus || []).slice(), level: prev.level || "", days: prev.days || 5, sex: prev.sex || p.sex || "m",
        age: p.age, height: p.height, kg: curW(), goalKg: p.goalWeight, act: prev.act || "", hot: !!prev.hot, wake: prev.wake != null ? prev.wake : 7, sleep: prev.sleep != null ? prev.sleep : 23
      }
    };
    draw();
  }
  window.obOpen = () => open(true);
  function close() { const el = document.querySelector(".ob-screen"); if (el) { el.classList.add("out"); setTimeout(() => el.remove(), 250); } OB = null; render(); }

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-obreplan]")) { open(true); return; }
    if (!OB) return;
    const a = OB.a;
    if (t.closest(".ob-screen button")) readBody(); // guarda o que foi digitado antes de redesenhar
    const pick = (sel, key, multi) => { const b = t.closest("[" + sel + "]"); if (!b) return false; const v = b.getAttribute(sel); if (multi) { const i = a[key].indexOf(v); if (i >= 0) a[key].splice(i, 1); else if (a[key].length < 3) a[key].push(v); else toast("Escolha até 3"); } else a[key] = isNaN(+v) || key === "sex" || key === "goal" || key === "level" || key === "act" ? v : +v; draw(); return true; };
    // escolher o objetivo já marca os treinos sugeridos para ele (dá para mudar no passo seguinte)
    const gb = t.closest("[data-obgoal]");
    if (gb) { const g = (window.GOAL_DEFS || []).find(x => x.id === gb.getAttribute("data-obgoal")); if (g) a.focus = g.plan.slice(0, 3); }
    if (pick("data-obgoal", "goal") || pick("data-obfocus", "focus", true) || pick("data-oblevel", "level") || pick("data-obdays", "days") || pick("data-obsex", "sex") || pick("data-obact", "act")) return;
    if (t.closest("[data-obhot]")) { readBody(); a.hot = !a.hot; draw(); return; }
    if (t.closest("[data-obback]")) { readBody(); OB.i = Math.max(0, OB.i - 1); draw(); return; }
    if (t.closest("[data-obskip]")) {
      if (!S.plan) S.plan = { skipped: true, water: 0, wake: 7, sleep: 23, every: 90, card: true, at: todayStr() };
      save(); syncWater(true); close(); toast("Você pode montar seu plano depois em Ajustes"); return;
    }
    if (t.closest("[data-obnext]")) {
      readBody();
      if (STEPS[OB.i] === "body" && (!(+a.kg > 30) || !(+a.height > 100) || !(+a.age > 10))) { toast("Confira idade, altura e peso"); return; }
      if (STEPS[OB.i] === "routine" && a.wake === a.sleep) { toast("A hora de acordar e de dormir não podem ser iguais"); return; }
      if (OB.i < STEPS.length - 1) { OB.i++; draw(); return; }
      apply(); close(); toast("Plano criado! Bora pro primeiro treino 💪");
      if (!S.tour && window.startTour) setTimeout(startTour, 700);
    }
  });
  document.addEventListener("change", e => { if (OB && (e.target.id === "obWake" || e.target.id === "obSleep")) readBody(); });

  /* ---------- água: total do dia vai para o cartão do Android ---------- */
  // janela acordado em minutos (para 1 h antes de dormir) e intervalo dos lembretes
  const winMin = P => { const w = P.wake != null ? P.wake : 7, s = P.sleep != null ? P.sleep : 23; return Math.max(4, (s > w ? s - w : s + 24 - w) - 1) * 60; };
  const waterEvery = P => P.wmode === "times" && P.times > 0 ? Math.max(20, Math.round(winMin(P) / P.times / 5) * 5) : (P.every || 90);
  let lastSent = "";
  function syncWater(force) {
    if (!NATIVE) return;
    const P = S.plan || {}, W = dayCounter("water");
    const j = JSON.stringify({ on: P.card !== false, goal: waterGoal(), cur: W.v, day: W.d, wake: P.wake != null ? P.wake : 7, sleep: P.sleep != null ? P.sleep : 23, every: waterEvery(P) });
    if (force || j !== lastSent) { lastSent = j; nat("setWaterPlan", j); }
  }
  function addWater(ml) {
    if (!(ml > 0)) return;
    const W = dayCounter("water");
    W.v += ml; W.h.push(ml);
  }
  // lembrete chegou com o app aberto: aviso dentro do app (o som já tocou no Android)
  window.waterNudge = left => toast("💧 Hora de beber água! Faltam " + L(left) + " hoje");
  window.waterFromNative = ml => { addWater(ml); save(); render(); toast("💧 +" + ml + " ml de água"); };
  const _save = save;
  save = function () { _save(); syncWater(); };
  function pullNative() { const v = NATIVE ? +nat("takeWater") || 0 : 0; if (v > 0) { addWater(v); save(); render(); toast("💧 +" + v + " ml marcados pela notificação"); } }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { pullNative(); syncWater(true); } });

  /* ---------- Ajustes: meu plano ---------- */
  function planHTML() {
    const P = S.plan;
    const sw = '<label class="switch"><input id="obCard" type="checkbox"' + (!P || P.card !== false ? " checked" : "") + ' aria-label="Cartão da água"><span></span></label>';
    const sum = P && !P.skipped ? '<div class="setrow"><div><b>💧 ' + L(waterGoal()) + ' de água por dia</b><span class="note">' + Math.ceil(waterGoal() / 250) + ' copos de 250 ml por dia</span></div></div>' +
      '<div class="setrow"><div><b>🏋️ ' + P.days + ' treinos por semana</b><span class="note">' + (P.focus || []).map(f => (FOCUS.find(x => x[0] === f) || [0, 0, f])[2]).join(" · ") + '</span></div></div>'
      : '<div class="setrow"><div><b>Você ainda não montou seu plano</b><span class="note">Responda 6 perguntas rápidas e o app calcula seus treinos e quanta água beber.</span></div></div>';
    return '<div class="sec"><div class="sechead"><h3>Meu plano</h3></div><div class="card" style="padding-block:4px">' + sum +
      '<div class="setrow"><div><b>Cartão da água na tela</b><span class="note">Fica na tela e na tela de bloqueio com +250/+500 ml até você bater a meta.</span></div>' + sw + '</div>' +
      remindHTML() +
      '<div class="setrow"><button class="btn block" data-obreplan>' + (P && !P.skipped ? "Refazer meu plano" : "Montar meu plano") + '</button></div></div></div>';
  }
  // lembretes de água: "a cada X" ou "N vezes por dia", dentro do horário escolhido
  const EVERY = [30, 45, 60, 90, 120, 180], TIMES = [3, 4, 5, 6, 8, 10, 12];
  function ensurePlan() { if (!S.plan) S.plan = { skipped: true, water: 0, wake: 7, sleep: 23, every: 90, card: true, at: todayStr() }; return S.plan; }
  function remindHTML() {
    const P = S.plan || { wake: 7, sleep: 23, every: 90 }, mode = P.wmode === "times" ? "times" : "every";
    const ev = waterEvery(P), n = Math.max(1, Math.floor(winMin(P) / ev)), per = Math.round(waterGoal() / n / 50) * 50;
    const hsel = (id, v) => { let s = ""; for (let h = 0; h < 24; h++) s += '<option value="' + h + '"' + (h === v ? " selected" : "") + '>' + hh(h) + '</option>'; return '<select id="' + id + '">' + s + '</select>'; };
    return '<div class="setrow wr"><div style="width:100%"><b>⏰ Lembretes de água</b><span class="note">Escolha de quanto em quanto tempo ou quantas vezes por dia.</span>' +
      '<div class="wr-tabs" data-m="' + mode + '"><button data-wrmode="every" aria-pressed="' + (mode === "every") + '">A cada</button><button data-wrmode="times" aria-pressed="' + (mode === "times") + '">Vezes por dia</button></div>' +
      '<div class="wr-chips">' + (mode === "every"
        ? EVERY.map(m => '<button data-wrevery="' + m + '" aria-pressed="' + ((P.every || 90) === m) + '">' + dur(m) + '</button>').join("")
        : TIMES.map(t => '<button data-wrtimes="' + t + '" aria-pressed="' + (P.times === t) + '">' + t + 'x</button>').join("")) + '</div>' +
      '<div class="wr-time"><label>Das' + hsel("wrWake", P.wake != null ? P.wake : 7) + '</label><label>até' + hsel("wrSleep", ((P.sleep != null ? P.sleep : 23) + 23) % 24) + '</label></div>' +
      '<div class="wr-sum">🔔 <b>' + n + 'x por dia</b>, 1 a cada <b>' + dur(ev) + '</b> · ≈ ' + per + ' ml por vez</div>' +
      '<button class="btn block wr-test" data-wrtest>🔔 Testar lembrete agora</button>' + testStatus() + '</div></div>';
  }
  function testStatus() {
    if (!NATIVE) return "";
    const ok = (v, t) => '<span class="' + (v ? "ok" : "no") + '">' + (v ? "✅ " : "⚠️ ") + t + '</span>';
    return '<div class="wr-st">' + ok(nat("notifAllowed") !== false, "Notificações") + ok(!!nat("overlayAllowed"), "Bolha na tela") + ok(!!nat("batteryOk"), "Bateria liberada") + '</div>';
  }
  document.addEventListener("click", e => {
    if (!e.target.closest("[data-wrtest]")) return;
    if (!NATIVE) { toast("O teste funciona no app Android"); return; }
    if (nat("notifAllowed") === false) { nat("requestNotificationPermission"); toast("Permita as notificações do Ritmiq e teste de novo"); return; }
    nat("waterTest", 5);
    toast("Saia do app agora (botão início). Em 5 s chega o lembrete com som, aviso e bolha 💧");
  });
  document.addEventListener("click", e => {
    const t = e.target, b = t.closest("[data-wrmode],[data-wrevery],[data-wrtimes]");
    if (!b) return;
    const P = ensurePlan();
    if (b.dataset.wrmode) { P.wmode = b.dataset.wrmode; if (P.wmode === "times" && !P.times) P.times = 6; }
    if (b.dataset.wrevery) { P.wmode = "every"; P.every = +b.dataset.wrevery; }
    if (b.dataset.wrtimes) { P.wmode = "times"; P.times = +b.dataset.wrtimes; }
    save(); syncWater(true); render();
    if (!b.dataset.wrmode) toast("Lembrete a cada " + dur(waterEvery(P)));
  });
  document.addEventListener("change", e => {
    if (e.target.id !== "wrWake" && e.target.id !== "wrSleep") return;
    const P = ensurePlan();
    if (e.target.id === "wrWake") P.wake = +e.target.value;
    else P.sleep = (+e.target.value + 1) % 24; // "até" é o último lembrete: dorme 1 h depois
    save(); syncWater(true); render();
  });

  const _vAj = vAjustes, MARK = '<div class="sec"><div class="sechead"><h3>Notificações</h3>';
  vAjustes = function () { const h = _vAj(), k = h.indexOf(MARK); return k < 0 ? h : h.slice(0, k) + planHTML() + h.slice(k); };
  document.addEventListener("change", e => {
    if (e.target.id !== "obCard") return;
    if (!S.plan) S.plan = { skipped: true, water: 0, wake: 7, sleep: 23, every: 90, at: todayStr() };
    S.plan.card = e.target.checked; save(); syncWater(true);
    toast(e.target.checked ? "Cartão da água ativado" : "Cartão da água desativado");
  });

  pullNative();
  syncWater(true);
  // usuário novo: abre o formulário depois do login (ou de "continuar sem conta")
  const wait = setInterval(() => {
    if (S.plan) { clearInterval(wait); return; }
    if (document.querySelector(".auth-screen,.sys-screen,#layer .scrim")) return;
    clearInterval(wait); open(false);
  }, 1200);
})();
