/* Shaper · editor de treinos
   Treinos padrão por objetivo (tanquinho, cintura, bunda, peito, perna, geral), treinos
   próprios e a escolha de qual treino cai em cada dia da semana. Estado em S.wk. */
(function () {
  "use strict";

  /* ---------- exercícios novos (sem foto: mostram um cartão com o nome) ---------- */
  const NEW_EX = {
    Lunge: { n: "Afundo", m: "Pernas e glúteos", side: 1, how: ["Em pé, dê um passo largo à frente.", "Desça até os dois joelhos ficarem a 90°.", "Volte empurrando com o pé da frente."], tip: "Joelho da frente alinhado com o pé, sem passar muito da ponta." },
    Sumo_Squat: { n: "Agachamento sumô", m: "Glúteos e parte interna da coxa", how: ["Pés bem afastados e virados para fora.", "Desça com o tronco reto.", "Suba apertando o glúteo."], tip: "Joelhos acompanham a direção dos pés." },
    Donkey_Kick: { n: "Coice de glúteo", m: "Glúteos", side: 1, how: ["De quatro apoios, joelho dobrado.", "Empurre o pé em direção ao teto.", "Desça sem encostar o joelho."], tip: "Não arqueie a lombar: o movimento é do quadril." },
    Fire_Hydrant: { n: "Abertura lateral de quadril", m: "Glúteo médio", side: 1, how: ["De quatro apoios.", "Abra a perna dobrada para o lado até a altura do quadril.", "Volte controlando."], tip: "Tronco parado; só a perna se move." },
    Wall_Sit: { n: "Cadeira na parede", m: "Coxas e glúteos", how: ["Costas na parede, desça até as coxas ficarem paralelas ao chão.", "Segure a posição.", "Respire sem prender o ar."], tip: "Joelhos acima dos tornozelos, não à frente." },
    Calf_Raise: { n: "Elevação de panturrilha", m: "Panturrilhas", how: ["Em pé, pés afastados na largura do quadril.", "Suba na ponta dos pés.", "Desça devagar."], tip: "Use uma parede para equilíbrio se precisar." },
    Wide_Pushup: { n: "Flexão aberta", m: "Peito", how: ["Mãos mais afastadas que os ombros.", "Desça o peito em direção ao chão.", "Empurre de volta."], tip: "Corpo em linha reta do calcanhar à cabeça." },
    Incline_Pushup: { n: "Flexão inclinada", m: "Peito (mais fácil)", how: ["Mãos num banco, sofá ou mesa firme.", "Desça o peito até a borda.", "Empurre de volta."], tip: "Quanto mais alto o apoio, mais fácil." },
    Diamond_Pushup: { n: "Flexão diamante", m: "Tríceps e peito", how: ["Mãos juntas formando um diamante.", "Desça com os cotovelos perto do corpo.", "Empurre de volta."], tip: "Difícil? Apoie os joelhos." },
    Tricep_Dip: { n: "Mergulho no banco", m: "Tríceps e peito", how: ["Mãos na borda de uma cadeira firme, atrás do corpo.", "Desça dobrando os cotovelos.", "Suba estendendo os braços."], tip: "Ombros longe das orelhas." },
    Burpee: { n: "Burpee", m: "Corpo todo e cardio", how: ["Agache e apoie as mãos no chão.", "Jogue as pernas para trás em prancha.", "Volte e salte com os braços para cima."], tip: "Sem salto e sem flexão é a versão mais leve." },
    High_Knees: { n: "Corrida estacionária", m: "Cardio e core", how: ["Corra no lugar.", "Suba os joelhos até a altura do quadril.", "Mexa os braços junto."], tip: "Pise com a ponta dos pés para amortecer." }
  };
  Object.keys(NEW_EX).forEach(k => { if (!EX[k]) EX[k] = NEW_EX[k]; });

  const TEMPLATES = {
    tanquinho: { n: "Tanquinho", f: "Abdômen inteiro para marcar os gomos", items: [["Crunches", 30, 20], ["Reverse_Crunch", 30, 15], ["Jackknife_Sit-Up", 30, 12], ["Air_Bike", 30, 24], ["Leg_Pull-In", 30, 15], ["Plank", 40]] },
    cintura: { n: "Cintura fina", f: "Oblíquos e transverso", items: [["Russian_Twist", 30, 24], ["Oblique_Crunches_-_On_The_Floor", 30, 16], ["Side_Bridge", 40], ["Alternate_Heel_Touchers", 30, 24], ["Elbow_to_Knee", 30, 20], ["Stomach_Vacuum", 20]] },
    bunda: { n: "Bumbum", f: "Glúteos firmes e empinados", items: [["Butt_Lift_Bridge", 40, 18], ["Sumo_Squat", 35, 15], ["Donkey_Kick", 40, 16], ["Fire_Hydrant", 40, 16], ["Lunge", 40, 14], ["Wall_Sit", 40]] },
    peito: { n: "Peito", f: "Peito e tríceps sem equipamento", items: [["Incline_Pushup", 30, 12], ["Pushups", 30, 12], ["Wide_Pushup", 30, 10], ["Diamond_Pushup", 30, 8], ["Tricep_Dip", 30, 12], ["Plank", 40]] },
    perna: { n: "Pernas", f: "Coxas, glúteos e panturrilhas", items: [["Bodyweight_Squat", 40, 20], ["Lunge", 40, 14], ["Sumo_Squat", 35, 15], ["Wall_Sit", 45], ["Calf_Raise", 35, 20], ["Freehand_Jump_Squat", 30, 12]] },
    geral: { n: "Corpo todo", f: "Treino geral para queimar e fortalecer", items: [["Burpee", 30, 8], ["Pushups", 30, 12], ["Bodyweight_Squat", 35, 18], ["Mountain_Climbers", 30], ["High_Knees", 30], ["Lunge", 35, 12], ["Plank", 40]] },
    costas: { n: "Costas e postura", f: "Costas fortes e postura reta, sem equipamento", items: [["Superman", 30, 12], ["Reverse_Snow_Angel", 30, 10], ["Prone_YTW", 30, 8], ["Bird_Dog", 30, 12], ["Prone_Swimmer", 30], ["Inverted_Row", 30, 8], ["Plank", 40]] },
    bracos: { n: "Braços e ombros", f: "Tríceps, bíceps e ombros com o peso do corpo", items: [["Pike_Pushup", 30, 8], ["Diamond_Pushup", 30, 8], ["Tricep_Dip", 30, 12], ["Arm_Circles", 30], ["Plank_Shoulder_Tap", 30, 16], ["Wide_Pushup", 30, 10], ["Plank_Up_Down", 30, 10]] },
    hiit: { n: "Cardio HIIT", f: "Queima rápida de calorias em pouco tempo", items: [["Jumping_Jack", 30], ["Burpee", 30, 8], ["Mountain_Climbers", 30], ["High_Knees", 30], ["Skater_Jump", 30, 16], ["Squat_Thrust", 30, 10], ["Fast_Feet", 30]] },
    mobilidade: { n: "Mobilidade", f: "Alongar, soltar e recuperar o corpo", rounds: 1, rest: 10, items: [["Cat_Cow", 40], ["Worlds_Greatest_Stretch", 45], ["Hip_Flexor_Stretch", 45], ["Hamstring_Stretch", 40], ["Cobra_Stretch", 30], ["Supine_Twist", 40], ["Childs_Pose", 40]] }
  };
  // objetivos do app (o questionário e o cartão "Seu objetivo" usam esta lista): plano da semana e dieta de cada um
  window.GOAL_DEFS = [
    { id: "emagrecer", ic: "🔥", n: "Emagrecer", d: "Perder gordura com cardio e treino de corpo todo", plan: ["hiit", "geral", "perna", "hiit", "cintura"], kcal: -500, prot: 2.0, diet: "para emagrecer" },
    { id: "massa", ic: "💪", n: "Ganhar massa e força", d: "Mais músculo: peito, costas, pernas e braços", plan: ["peito", "costas", "perna", "bracos", "geral"], kcal: 300, prot: 2.0, diet: "para ganhar massa" },
    { id: "definir", ic: "✨", n: "Definir e tonificar", d: "Corpo firme e definido por inteiro", plan: ["geral", "tanquinho", "perna", "peito", "bunda"], kcal: -250, prot: 2.1, diet: "para definir" },
    { id: "gluteos", ic: "🍑", n: "Glúteos e pernas", d: "Bumbum firme e pernas fortes", plan: ["bunda", "perna", "geral", "bunda", "cintura"], kcal: -200, prot: 1.9, diet: "para tonificar" },
    { id: "saude", ic: "❤️", n: "Saúde e disposição", d: "Mais energia, fôlego e mobilidade no dia a dia", plan: ["geral", "mobilidade", "hiit", "perna", "mobilidade"], kcal: 0, prot: 1.6, diet: "para o dia a dia" },
    { id: "abdomen", ic: "🎯", n: "Abdômen definido", d: "Foco no abdômen e na cintura (plano clássico de 90 dias)", plan: ["padrao", "tanquinho", "cintura"], kcal: -500, prot: 2.1, diet: "para definir o abdômen" }
  ];
  // nomes antigos do questionário → objetivos novos
  window.GOAL_OLD = { barriga: "emagrecer", definir: "abdomen", forca: "massa", saude: "saude" };
  const ORIG = PLAN.map(p => p);

  function W() {
    if (!S.wk || typeof S.wk !== "object") S.wk = {};
    const w = S.wk;
    w.custom = w.custom || {};
    if (!Array.isArray(w.week) || w.week.length !== 7) w.week = ["", "", "", "", "", "", ""];
    return w;
  }
  function resolve(key) {
    if (!key) return null;
    if (key === "rec") return ORIG[6]; // dia leve: recuperação ativa
    if (key.startsWith("t:")) return TEMPLATES[key.slice(2)] || null;
    if (key.startsWith("c:")) return W().custom[key.slice(2)] || null;
    return null;
  }
  function allList() {
    const L = Object.keys(TEMPLATES).map(k => ["t:" + k, TEMPLATES[k], true]);
    Object.keys(W().custom).forEach(k => L.push(["c:" + k, W().custom[k], false]));
    return L;
  }
  /** Coloca no PLAN o treino escolhido para cada dia (o resto do app segue igual). */
  function applyWeek() {
    const w = W();
    for (let d = 0; d < 7; d++) {
      const r = resolve(w.week[d]);
      PLAN[d] = r && r.items && r.items.length ? r : ORIG[d];
    }
  }
  window.wkApply = applyWeek;

  function startWith(t) {
    const wd = wdOf(todayStr()), keep = PLAN[wd];
    PLAN[wd] = t;
    try { startWorkout(wd); } finally { PLAN[wd] = keep; }
  }

  /* ---------- exercícios sem foto ---------- */
  const _vid = vidHTML;
  vidHTML = function (id, sp) {
    if (id !== "walk" && !IMG[id] && EX[id]) {
      const v = vidId(id);
      if (useVideo() && v) return '<div class="vid yt" role="img" aria-label="Vídeo: ' + EX[id].n + '"><iframe src="' + ytSrc(v) + '" title="' + EX[id].n + '" allow="autoplay; encrypted-media" referrerpolicy="strict-origin-when-cross-origin" tabindex="-1"></iframe><div class="shield"></div></div>';
      const bg = v && navigator.onLine !== false ? ' style="background-image:linear-gradient(180deg,rgba(8,12,24,.1),rgba(8,12,24,.78)),url(https://i.ytimg.com/vi/' + v + '/hqdefault.jpg)"' : "";
      return '<div class="vid walk wk-noimg' + (bg ? " wk-poster" : "") + '" role="img"' + bg + ' aria-label="' + EX[id].n + '"><div><b>' + EX[id].n + '</b>' + EX[id].m + '<small>' + EX[id].how[0] + '</small></div></div>';
    }
    return _vid(id, sp);
  };
  const _thumb = thumbHTML;
  thumbHTML = function (id) {
    if (id !== "walk" && !IMG[id] && EX[id] && vidId(id) && navigator.onLine !== false) return '<div class="thumb"><img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + vidId(id) + '/mqdefault.jpg"></div>';
    if (id !== "walk" && !IMG[id] && EX[id]) return '<div class="thumb walk">' + EX[id].n.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase() + '</div>';
    return _thumb(id);
  };

  /* ---------- treinos extras na aba Treino ---------- */
  const _vT = vTreino;
  vTreino = function () {
    const h = _vT(), mark = '<div class="sec"><div class="sechead"><h3>Exercícios</h3>', k = h.indexOf(mark);
    const extra = '<div class="sec"><div class="sechead"><h3>Treinos extras</h3><button class="qchip" data-wkedit>Editar treinos</button></div>' +
      '<div class="wk-grid">' + allList().map(([key, t]) => '<button class="wk-tile" data-wkstart="' + key + '"><b>' + esc(t.n) + '</b><span>' + t.items.length + ' exercícios</span></button>').join("") +
      '<button class="wk-tile add" data-wknew><b>＋ Montar meu treino</b><span>' + (window.LIB ? LIB.count() + " exercícios para escolher" : "escolha exercícios, voltas e descanso") + '</span></button>' +
      '<button class="wk-tile add" data-wkimport><b>📥 Importar treino</b><span>código ou QR de um amigo</span></button>' +
      '<button class="wk-tile add wk-com" data-wkcom><b>🌎 Treinos da comunidade</b><span>os mais usados pela galera</span></button></div></div>';
    return k < 0 ? h : h.slice(0, k) + extra + h.slice(k);
  };

  /* ---------- editor ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let ED = null; // treino em edição: {key, t}

  function editorHTML() {
    const w = W();
    const opts = sel => '<option value="">Padrão do programa</option><option value="rec"' + (sel === "rec" ? " selected" : "") + '>Dia leve (recuperação)</option>' + allList().map(([key, t]) => '<option value="' + key + '"' + (sel === key ? " selected" : "") + '>' + esc(t.n) + '</option>').join("");
    return '<div class="sheet wk-sheet" role="dialog" aria-label="Editar treinos"><div class="row between"><h2>Editar treinos</h2><button class="roundbtn" data-wkclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<div><h3 style="margin-bottom:8px">Sua semana</h3><div class="wk-week">' +
      WDL.map((d, i) => '<label class="wk-day"><span>' + d + '</span><select data-wkday="' + i + '">' + opts(w.week[i]) + '</select></label>').join("") + '</div>' +
      '<p class="note" style="margin-top:8px">"Padrão do programa" segue o plano de 90 dias. Escolha outro treino para trocar o dia.</p></div>' +
      '<div><div class="row between" style="margin-bottom:8px"><h3>Meus treinos</h3><div class="row" style="gap:6px"><button class="qchip" data-wkimport>📥 Importar</button><button class="qchip" data-wknew>+ Novo</button></div></div>' +
      allList().map(([key, t, tpl]) => '<div class="wk-row"><div class="t"><b>' + esc(t.n) + '</b><span>' + (tpl ? "Padrão · " : "") + t.items.length + ' exercícios · ' + esc(t.f || "") + '</span></div>' +
        '<button class="qchip" data-wkstart="' + key + '">Treinar</button><button class="qchip" data-wkshare="' + key + '" aria-label="Compartilhar">↗</button><button class="qchip" data-wkopen="' + key + '">' + (tpl ? "Copiar" : "Editar") + '</button></div>').join("") + '</div>' +
      '<button class="btn ghost block" data-wkreset>Voltar a semana para o padrão</button></div>';
  }

  /* seletor visual de exercícios: busca, filtro por músculo e toque para adicionar */
  const allEx = () => Object.keys(EX).filter(k => k !== "walk");
  const groupOf = id => EX[id].g || groupOld(id);
  const groupOld = id => { const m = (EX[id].m || "").toLowerCase(); return /obl|cintura|lateral/.test(m) ? "Cintura" : /abd|core|reto/.test(m) ? "Abdômen" : /gl[úu]te|bumbum/.test(m) ? "Glúteos" : /perna|coxa|quadr|panturr/.test(m) ? "Pernas" : /peito|tr[íi]ceps|bra[çc]o|ombro/.test(m) ? "Superior" : /cardio|queima|hiit/.test(m) ? "Cardio" : "Outros"; };
  function pickerHTML() {
    const q = (ED.q || "").toLowerCase(), cat = ED.cat || "Todos", eq = ED.eq == null ? "*" : ED.eq, have = new Set(allEx().map(groupOf));
    const cats = ["Todos"].concat((window.LIB ? LIB.GROUPS : [...have]).filter(g => have.has(g))), EQ = window.LIB ? LIB.EQUIP : { "": "Sem equipamento" };
    const list = allEx().filter(id => (cat === "Todos" || groupOf(id) === cat) && (eq === "*" || (EX[id].eq || "") === eq) && (!q || (EX[id].n + " " + EX[id].m + " " + groupOf(id)).toLowerCase().includes(q)))
      .sort((a, b) => EX[a].n.localeCompare(EX[b].n));
    const cnt = id => ED.t.items.filter(x => x[0] === id).length;
    return '<div class="wk-pick"><div class="row between"><h3>Escolha os exercícios</h3><button class="btn primary" data-wkpickdone>Pronto (' + ED.t.items.length + ')</button></div>' +
      '<input id="wkQ" class="wk-q" placeholder="🔍 Buscar exercício" value="' + esc(ED.q || "") + '">' +
      '<div class="qchips wk-scroll">' + cats.map(c => '<button class="qchip" data-wkcat="' + c + '" aria-pressed="' + (c === cat) + '">' + c + '</button>').join("") + '</div>' +
      '<div class="qchips wk-scroll wk-eq"><button class="qchip" data-wkeq="*" aria-pressed="' + (eq === "*") + '">Qualquer equipamento</button>' + Object.keys(EQ).map(k => '<button class="qchip" data-wkeq="' + k + '" aria-pressed="' + (eq === k) + '">' + EQ[k] + '</button>').join("") + '</div>' +
      '<p class="note wk-count">' + list.length + ' exercício' + (list.length === 1 ? "" : "s") + ' · toque para adicionar, ⓘ para ver como fazer</p>' +
      '<div class="wk-exgrid">' + (list.length ? list.map(id => '<button class="wk-excard' + (cnt(id) ? " on" : "") + '" data-wkpick="' + id + '">' + thumbHTML(id) +
        '<b>' + esc(EX[id].n) + '</b><small>' + esc(EX[id].m) + '</small>' + (cnt(id) ? '<i>' + cnt(id) + '</i>' : "") + '<span class="wk-info" data-wkinfo="' + id + '" role="button" aria-label="Como fazer">i</span></button>').join("") : '<p class="note">Nenhum exercício encontrado.</p>') + '</div></div>';
  }
  function dur(t) {
    const r = t.rounds || 3, rest = t.rest || 30, s = t.items.reduce((a, x) => a + x[1], 0);
    return Math.max(1, Math.round((r * s + rest * Math.max(0, t.items.length * r - 1)) / 60));
  }

  function workoutHTML() {
    const t = ED.t;
    if (t.rounds == null) t.rounds = 3;
    if (t.rest == null) t.rest = 30;
    if (t.keep == null) t.keep = true;
    if (ED.pick) return '<div class="sheet wk-sheet" role="dialog" aria-label="Escolher exercícios">' + pickerHTML() + '</div>';
    return '<div class="sheet wk-sheet" role="dialog" aria-label="Treino"><div class="row between"><button class="roundbtn" data-wkback aria-label="Voltar">' + IC.back + '</button><h2 style="flex:1;margin-left:10px">' + (ED.key ? "Editar treino" : "Montar meu treino") + '</h2></div>' +
      '<label class="f">Nome<input id="wkN" maxlength="30" value="' + esc(t.n) + '"></label>' +
      '<label class="f">Descrição<input id="wkF" maxlength="60" value="' + esc(t.f || "") + '" placeholder="Ex.: abdômen e cardio"></label>' +
      '<div class="wk-set"><div><span>Voltas</span><div class="qchips">' + [1, 2, 3, 4, 5].map(n => '<button class="qchip" data-wkrounds="' + n + '" aria-pressed="' + (t.rounds === n) + '">' + n + 'x</button>').join("") + '</div></div>' +
      '<div><span>Descanso entre exercícios</span><div class="qchips">' + [10, 15, 20, 30, 45, 60].map(n => '<button class="qchip" data-wkrest="' + n + '" aria-pressed="' + (t.rest === n) + '">' + n + 's</button>').join("") + '</div></div>' +
      '<label class="wk-keep"><input type="checkbox" id="wkKeep"' + (t.keep ? " checked" : "") + '><span><b>Usar exatamente meus tempos</b><small>Desmarcado, o app aumenta o tempo conforme a fase dos 90 dias.</small></span></label>' +
      (t.items.length ? '<div class="wk-dur">⏱ ≈ ' + dur(t) + ' min · ' + t.items.length + ' exercícios × ' + t.rounds + ' volta' + (t.rounds > 1 ? "s" : "") + '</div>' : "") + '</div>' +
      '<div><h3 style="margin-bottom:8px">Exercícios (' + t.items.length + ')</h3>' +
      (t.items.length ? t.items.map(([id, s, r], i) => '<div class="wk-ex">' + thumbHTML(id) + '<div class="t"><b>' + esc(EX[id] ? EX[id].n : id) + '</b>' +
        '<div class="wk-num"><label>Tempo<input type="number" min="10" max="600" step="5" inputmode="numeric" data-wks="' + i + '" value="' + s + '"> s</label>' +
        '<label>Meta<input type="number" min="0" max="200" inputmode="numeric" data-wkr="' + i + '" value="' + (r || 0) + '"> rep</label></div></div>' +
        '<div class="wk-ord"><button class="qchip" data-wkup="' + i + '" aria-label="Subir">↑</button><button class="qchip" data-wkdel="' + i + '" aria-label="Remover">✕</button></div></div>').join("")
        : '<p class="note">Toque em "Adicionar exercícios" para montar o treino do seu jeito.</p>') + '</div>' +
      '<button class="btn block wk-addbig" data-wkpickopen>＋ Adicionar exercícios</button>' +
      '<div class="row"><button class="btn primary" style="flex:1" data-wksave>Salvar treino</button>' + (t.items.length ? '<button class="btn ghost" data-wkshnow>↗ Compartilhar</button>' : "") + (ED.key && ED.key.startsWith("c:") ? '<button class="btn ghost danger" data-wkrm>Excluir</button>' : "") + '</div></div>';
  }

  function openEditor() {
    ED = null;
    $("#layer").innerHTML = '<div class="scrim" id="scrim">' + editorHTML() + '</div>';
  }
  function openWorkout(key) {
    const src = key ? resolve(key) : null;
    const copy = src ? JSON.parse(JSON.stringify({ n: src.n, f: src.f, items: src.items, rounds: src.rounds, rest: src.rest, keep: src.keep })) : { n: "Meu treino", f: "", items: [] };
    if (key && key.startsWith("t:")) { copy.n = src.n + " (meu)"; key = null; } // padrão: edita uma cópia
    ED = { key, t: copy };
    $("#layer").innerHTML = '<div class="scrim" id="scrim">' + workoutHTML() + '</div>';
  }
  function redrawWorkout() {
    const sh = document.querySelector(".wk-sheet");
    if (sh) window.fxMorph(sh.parentNode, workoutHTML());
  }
  function readFields() {
    if (!ED) return;
    const n = $("#wkN"), f = $("#wkF");
    if (n) ED.t.n = n.value.trim().slice(0, 30) || "Meu treino";
    if (f) ED.t.f = f.value.trim().slice(0, 60);
  }

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-wkedit]")) return openEditor();
    if (t.closest("[data-wkclose]")) { closeLayer(); render(); return; }
    if (t.closest("[data-wknew]")) return openWorkout(null);
    if (t.closest("[data-wkimport]")) { if (window.wkImport) wkImport(); return; }
    if (t.closest("[data-wkcom]")) { if (window.wkCommunity) wkCommunity(); return; }
    const sh = t.closest("[data-wkshare]"); if (sh) { const w = resolve(sh.dataset.wkshare); if (w && window.wkShare) wkShare(w, openEditor); return; }
    const inf = t.closest("[data-wkinfo]"); if (inf) { infoOver(inf.dataset.wkinfo); return; }
    const st = t.closest("[data-wkstart]");
    if (st) { const w = resolve(st.dataset.wkstart); if (w) { closeLayer(); startWith(w); } return; }
    const op = t.closest("[data-wkopen]"); if (op) return openWorkout(op.dataset.wkopen);
    if (t.closest("[data-wkback]")) return openEditor();
    if (t.closest("[data-wkreset]")) { W().week = ["", "", "", "", "", "", ""]; applyWeek(); save(); openEditor(); toast("Semana voltou ao padrão"); return; }
    if (!ED) return;
    const up = t.closest("[data-wkup]");
    if (up) { readFields(); const i = +up.dataset.wkup; if (i > 0) { const a = ED.t.items; [a[i - 1], a[i]] = [a[i], a[i - 1]]; } redrawWorkout(); return; }
    const del = t.closest("[data-wkdel]");
    if (del) { readFields(); ED.t.items.splice(+del.dataset.wkdel, 1); redrawWorkout(); return; }
    if (t.closest("[data-wkpickopen]")) { readFields(); ED.pick = true; ED.q = ""; redrawWorkout(); return; }
    if (t.closest("[data-wkpickdone]")) { ED.pick = false; redrawWorkout(); return; }
    const ct = t.closest("[data-wkcat]"); if (ct) { ED.cat = ct.dataset.wkcat; redrawWorkout(); return; }
    const eqb = t.closest("[data-wkeq]"); if (eqb) { ED.eq = eqb.dataset.wkeq; redrawWorkout(); return; }
    const pk = t.closest("[data-wkpick]");
    if (pk) {
      if (ED.t.items.length >= 40) { toast("Máximo de 40 exercícios"); return; }
      const id = pk.dataset.wkpick, e = EX[id] || {};
      ED.t.items.push([id, 30, /prancha|plank|segure|vácuo|parede/i.test(e.n + " " + (e.how || []).join(" ")) ? 0 : 12]);
      redrawWorkout(); toast("+ " + (e.n || id)); return;
    }
    const rd = t.closest("[data-wkrounds]"); if (rd) { readFields(); ED.t.rounds = +rd.dataset.wkrounds; redrawWorkout(); return; }
    const rs = t.closest("[data-wkrest]"); if (rs) { readFields(); ED.t.rest = +rs.dataset.wkrest; redrawWorkout(); return; }
    if (t.closest("[data-wksave]")) {
      readFields();
      if (!ED.t.items.length) { toast("Adicione pelo menos um exercício"); return; }
      const w = W(), id = ED.key ? ED.key.slice(2) : "w" + Date.now().toString(36);
      w.custom[id] = { n: ED.t.n, f: ED.t.f, items: ED.t.items, rounds: ED.t.rounds, rest: ED.t.rest, keep: !!ED.t.keep };
      applyWeek(); save(); toast("Treino salvo"); openEditor(); return;
    }
    if (t.closest("[data-wkshnow]")) { readFields(); const keep = ED; if (window.wkShare) wkShare(ED.t, () => { ED = keep; $("#layer").innerHTML = '<div class="scrim" id="scrim">' + workoutHTML() + '</div>'; }); return; }
    if (t.closest("[data-wkrm]")) {
      const w = W(), id = ED.key.slice(2);
      delete w.custom[id];
      w.week = w.week.map(k => k === "c:" + id ? "" : k);
      applyWeek(); save(); toast("Treino excluído"); openEditor();
    }
  });
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.matches("[data-wkday]")) { W().week[+t.dataset.wkday] = t.value; applyWeek(); save(); toast(WDL[+t.dataset.wkday] + ": " + (resolve(t.value) ? resolve(t.value).n : "padrão")); return; }
    if (!ED) return;
    if (t.matches("[data-wks]")) { ED.t.items[+t.dataset.wks][1] = Math.max(10, Math.min(600, Math.round(+t.value / 5) * 5 || 30)); readFields(); redrawWorkout(); }
    if (t.matches("[data-wkr]")) ED.t.items[+t.dataset.wkr][2] = Math.max(0, Math.min(200, +t.value || 0));
    if (t.id === "wkKeep") ED.t.keep = t.checked;
  });
  document.addEventListener("input", e => {
    if (!ED || e.target.id !== "wkQ") return;
    ED.q = e.target.value;
    const box = document.querySelector(".wk-exgrid"), tmp = document.createElement("div");
    tmp.innerHTML = pickerHTML();
    if (box) box.innerHTML = tmp.querySelector(".wk-exgrid").innerHTML; // só a lista: o campo de busca continua com o foco
  });

  // aplica ao abrir e depois de restaurar backup/resetar (S é trocado inteiro)
  const _save = save;
  save = function () { applyWeek(); _save(); };
  applyWeek();
  render();
})();
