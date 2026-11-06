/* Shaper · registro de refeições
   Marque o que comeu em cada refeição (lista de alimentos brasileiros com porção caseira) ou
   digite um alimento com as calorias. Mostra calorias e macros do dia contra a meta da Dieta.
   Estado: S.food = {d, items:[{m, n, k, p, c, g}]}, S.foodLog = {data: kcal} (últimos 35 dias),
   S.foodMine = alimentos digitados pela pessoa (para repetir rápido). */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const MEALS = [["cafe", "☕", "Café da manhã"], ["almoco", "🍛", "Almoço"], ["lanche", "🍎", "Lanche"], ["jantar", "🍽️", "Jantar"]];
  // [nome · porção, kcal, proteína g, carboidrato g, gordura g] (valores médios aproximados, TACO/rotulagem)
  const F = [
    ["Arroz branco · 4 col. sopa (100 g)", 128, 2.5, 28, .2], ["Arroz integral · 4 col. sopa (100 g)", 124, 2.6, 26, 1], ["Feijão · 1 concha (100 g)", 76, 4.8, 13.6, .5],
    ["Macarrão cozido · 1 pegador (110 g)", 160, 5.5, 33, 1], ["Batata-doce cozida · 150 g", 116, 2, 27, .2], ["Batata cozida · 150 g", 78, 1.8, 18, .1],
    ["Mandioca cozida · 100 g", 125, .6, 30, .3], ["Cuscuz de milho · 1 prato fundo (150 g)", 170, 3.3, 37, 1], ["Tapioca · 1 média (goma 50 g)", 120, 0, 30, 0],
    ["Pão francês · 1 un", 135, 4, 28, 1.5], ["Pão integral · 2 fatias", 120, 5, 22, 1.5], ["Pão de queijo · 3 un pequenos", 180, 4, 22, 9],
    ["Aveia · 2 col. sopa (30 g)", 117, 4.4, 20, 2.6], ["Granola · 3 col. sopa (40 g)", 170, 4, 26, 6], ["Cuscuz com ovo · 1 prato", 250, 10, 37, 6],
    ["Ovo cozido · 1 un", 70, 6.3, .6, 4.8], ["Ovo frito · 1 un", 110, 6.3, .6, 9], ["Omelete · 2 ovos", 180, 13, 1, 13],
    ["Frango grelhado · 120 g", 190, 38, 0, 3.5], ["Frango desfiado · 100 g", 165, 31, 0, 3.6], ["Carne moída · 100 g", 215, 26, 0, 12],
    ["Patinho/carne magra · 120 g", 230, 36, 0, 9], ["Bife de alcatra · 120 g", 260, 34, 0, 13], ["Carne de panela · 120 g", 280, 32, 2, 16],
    ["Peixe (tilápia) · 120 g", 155, 31, 0, 2.6], ["Atum em lata (água) · 1 lata", 130, 28, 0, 1.5], ["Sardinha em lata · 1 lata", 190, 22, 0, 11],
    ["Linguiça · 1 gomo (80 g)", 240, 12, 1, 21], ["Presunto · 2 fatias", 60, 8, 1, 2.5], ["Queijo muçarela · 2 fatias", 140, 9, 1, 11],
    ["Queijo branco · 2 fatias (60 g)", 160, 10, 2, 12], ["Requeijão · 1 col. sopa", 60, 2, 1, 5.5], ["Manteiga · 1 col. chá", 36, 0, 0, 4],
    ["Leite integral · 1 copo (200 ml)", 120, 6.4, 9.4, 6.4], ["Leite desnatado · 1 copo", 70, 6.6, 10, .4], ["Iogurte natural · 1 pote", 90, 6, 9, 3],
    ["Iogurte grego · 1 pote", 130, 5, 15, 6], ["Whey · 1 dose (30 g)", 120, 24, 3, 1.5], ["Café com açúcar · 1 xícara", 40, 0, 10, 0],
    ["Café preto sem açúcar", 3, 0, 0, 0], ["Suco de laranja · 1 copo", 90, 1.4, 21, .2], ["Refrigerante · 1 lata", 140, 0, 37, 0],
    ["Refrigerante zero · 1 lata", 1, 0, 0, 0], ["Cerveja · 1 lata", 150, 1.5, 13, 0], ["Banana · 1 média", 90, 1.2, 23, .3],
    ["Maçã · 1 média", 80, .3, 21, .2], ["Mamão · 1 fatia", 55, .8, 14, .1], ["Morango · 10 un", 35, .7, 8, .3],
    ["Laranja · 1 un", 60, 1.2, 15, .2], ["Abacate · 2 col. sopa", 80, 1, 3.5, 7.5], ["Açaí · 300 ml com granola", 450, 5, 70, 16],
    ["Salada verde à vontade", 20, 1.5, 3.5, .2], ["Legumes cozidos · 1 xícara", 60, 2.5, 12, .3], ["Azeite · 1 col. sopa", 108, 0, 0, 12],
    ["Pasta de amendoim · 1 col. sopa", 95, 4, 3, 8], ["Castanhas · 1 punhado (30 g)", 190, 4.5, 7, 17], ["Chocolate · 2 quadradinhos (25 g)", 135, 1.5, 15, 8],
    ["Biscoito recheado · 3 un", 150, 1.5, 22, 6], ["Bolo simples · 1 fatia", 210, 3.5, 34, 7], ["Pizza · 1 fatia", 280, 12, 32, 11],
    ["Hambúrguer de lanchonete · 1 un", 500, 26, 40, 26], ["Batata frita · porção média", 340, 4, 44, 17], ["Coxinha · 1 un média", 280, 9, 30, 13],
    ["Pastel de carne · 1 un", 300, 9, 28, 17], ["Esfirra de carne · 1 un", 180, 8, 26, 5], ["Marmita PF (arroz, feijão, carne, salada)", 650, 38, 75, 20],
    ["Feijoada · 1 concha + arroz", 500, 25, 50, 22], ["Strogonoff de frango + arroz", 560, 32, 55, 22], ["Lasanha · 1 pedaço", 420, 22, 35, 21],
    ["Sopa de legumes · 1 prato", 120, 5, 18, 3], ["Barra de proteína · 1 un", 200, 15, 20, 7], ["Pipoca · 1 tigela (sem manteiga)", 110, 3.5, 22, 1.3]
  ];
  const fmt = v => String(Math.round(v)).replace(".", ",");
  function day() { const t = todayStr(); if (!S.food || S.food.d !== t) S.food = { d: t, items: [] }; return S.food; }
  function totals() { return day().items.reduce((a, x) => (a.k += x.k, a.p += x.p || 0, a.c += x.c || 0, a.g += x.g || 0, a), { k: 0, p: 0, c: 0, g: 0 }); }
  function remember() { const L = S.foodLog = S.foodLog || {}; L[todayStr()] = Math.round(totals().k); const ks = Object.keys(L).sort(); if (ks.length > 35) ks.slice(0, ks.length - 35).forEach(k => delete L[k]); }
  // a proteína das refeições também entra no contador de proteína do dia (o mesmo dos botões rápidos)
  function prot(g) { const P = dayCounter("prot"), v = Math.round(g); if (!v) return; if (v > 0) { P.v += v; P.h.push(v); } else { P.v = Math.max(0, P.v + v); const i = P.h.lastIndexOf(-v); if (i >= 0) P.h.splice(i, 1); } }
  function add(m, f) { day().items.push({ m, n: f[0], k: f[1], p: f[2] || 0, c: f[3] || 0, g: f[4] || 0 }); prot(f[2] || 0); remember(); save(); }

  function cardHTML() {
    const T = targets(), t = totals(), it = day().items, pct = Math.min(100, t.k / T.kcal * 100), over = t.k > T.kcal;
    const mac = (lab, v, goal, cls) => '<div class="ml-mac"><small>' + lab + '</small><b>' + fmt(v) + '<em>/' + goal + ' g</em></b><div class="bar ' + cls + '"><i style="width:' + Math.min(100, v / goal * 100).toFixed(1) + '%"></i></div></div>';
    const L = S.foodLog || {}, days = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), i - 6)), mx = Math.max(T.kcal * 1.2, ...days.map(d => L[d] || 0));
    return '<div class="sec"><div class="sechead"><h3>Refeições de hoje</h3><span>' + fmtD(todayStr()) + '</span></div><div class="card stack ml-card" style="gap:12px">' +
      '<div class="row between"><b>Calorias</b><span><b class="disp">' + fmt(t.k) + '</b> / ' + T.kcal + ' kcal</span></div>' +
      '<div class="bar' + (over ? " over" : t.k >= T.kcal * .9 ? " ok" : "") + '"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
      '<p class="note">' + (over ? "Passou " + fmt(t.k - T.kcal) + " kcal da meta de hoje. Tudo bem: siga o plano na próxima refeição." : "Faltam " + fmt(T.kcal - t.k) + " kcal para a meta.") + '</p>' +
      '<div class="ml-macs">' + mac("Proteína", t.p, T.prot, "") + mac("Carbo", t.c, T.carb, "c") + mac("Gordura", t.g, T.fat, "g") + '</div>' +
      MEALS.map(([k, ic, n]) => { const xs = it.map((x, i) => [x, i]).filter(([x]) => x.m === k), kc = xs.reduce((a, [x]) => a + x.k, 0);
        return '<div class="ml-meal"><div class="row between"><b>' + ic + ' ' + n + '</b><span class="muted">' + (kc ? fmt(kc) + " kcal" : "") + '</span></div>' +
          xs.map(([x, i]) => '<div class="ml-it"><span>' + esc(x.n) + '</span><em>' + fmt(x.k) + '</em><button data-fdel="' + i + '" aria-label="Remover">×</button></div>').join("") +
          '<button class="ml-add" data-fadd="' + k + '">+ Adicionar</button></div>'; }).join("") +
      (Object.keys(L).length > 1 ? '<div class="ml-week">' + days.map(d => '<i style="--h:' + Math.max(4, Math.round((L[d] || 0) / mx * 100)) + '%"' + ((L[d] || 0) > T.kcal ? ' class="over"' : "") + '><em>' + WD[wdOf(d)].slice(0, 1) + '</em></i>').join("") + '</div><p class="note">Calorias dos últimos 7 dias (a linha é a meta).</p>' : "") +
      '</div></div>';
  }
  function picker(m) {
    const mine = (S.foodMine || []).slice(-8).reverse();
    const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 80;
    const meal = MEALS.find(x => x[0] === m);
    d.innerHTML = '<div class="sheet ml-sheet"><div class="row between"><h2>' + meal[1] + ' ' + meal[2] + '</h2><button class="roundbtn" data-x aria-label="Fechar">' + IC.x + '</button></div>' +
      '<input class="ml-q" type="search" placeholder="Buscar alimento (ex.: frango, pão, banana)" aria-label="Buscar alimento"><div class="ml-res"></div>' +
      '<details class="fold"><summary>Não achou? Digite o alimento</summary><form class="fields ml-own" style="margin-top:10px"><label class="f" style="grid-column:1/-1">Alimento<input name="n" required maxlength="60" placeholder="Ex.: sanduíche natural"></label><label class="f">Calorias (kcal)<input name="k" type="number" inputmode="numeric" min="1" max="3000" required></label><label class="f">Proteína (g, opcional)<input name="p" type="number" inputmode="decimal" min="0" max="300"></label><button class="btn primary" style="grid-column:1/-1" type="submit">Adicionar</button></form></details>' +
      '<p class="note">Valores médios aproximados por porção caseira.</p></div>';
    document.body.appendChild(d);
    const q = d.querySelector(".ml-q"), res = d.querySelector(".ml-res");
    const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    const draw = () => {
      const s = norm(q.value.trim()), all = mine.map(f => [f, 1]).concat(F.map(f => [f, 0]));
      const list = all.filter(([f]) => !s || norm(f[0]).includes(s)).slice(0, 40);
      res.innerHTML = list.map(([f, own], i) => '<button class="ml-row" data-fi="' + i + '"><span>' + (own ? "⭐ " : "") + esc(f[0]) + '</span><em>' + fmt(f[1]) + ' kcal</em></button>').join("") || '<p class="note">Nada encontrado. Digite o alimento abaixo.</p>';
      res.querySelectorAll("[data-fi]").forEach(b => b.onclick = () => { add(m, list[+b.dataset.fi][0]); toast("+" + fmt(list[+b.dataset.fi][0][1]) + " kcal"); d.remove(); render(); });
    };
    q.oninput = draw; draw();
    d.querySelector(".ml-own").onsubmit = e => {
      e.preventDefault(); const fd = new FormData(e.target), f = [String(fd.get("n")).trim().slice(0, 60), Math.max(1, Math.min(3000, +fd.get("k") || 0)), Math.max(0, +fd.get("p") || 0), 0, 0];
      if (!f[0] || !f[1]) return;
      S.foodMine = (S.foodMine || []).filter(x => x[0] !== f[0]).concat([f]).slice(-20);
      add(m, f); d.remove(); render(); toast("Adicionado");
    };
    d.onclick = e => { if (e.target === d || e.target.closest("[data-x]")) d.remove(); };
  }
  document.addEventListener("click", e => {
    const a = e.target.closest("[data-fadd]"); if (a) { picker(a.dataset.fadd); return; }
    const r = e.target.closest("[data-fdel]"); if (r) { const x = day().items.splice(+r.dataset.fdel, 1)[0]; if (x) prot(-(x.p || 0)); remember(); save(); render(); }
  });
  const _vd = vDieta;
  vDieta = function () { const h = _vd(), k = h.indexOf('<div class="sec"><div class="sechead"><h3>Hoje</h3>'); return k < 0 ? h + cardHTML() : h.slice(0, k) + cardHTML() + h.slice(k); };
})();
