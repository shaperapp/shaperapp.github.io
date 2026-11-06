/* Shaper · visual novo do Início (v2.13)
   Ordem: saudação → treino de hoje (grande, no topo) → cartão do Sistema com as missões →
   passos → semana → plano de 90 dias (recolhido) → dica. Usa o HTML que os outros módulos
   já montam e só reorganiza, então tudo continua funcionando igual (botões, missões, chefe). */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SV = p => '<svg viewBox="0 0 24 24" class="hv-i" aria-hidden="true">' + p + '</svg>';
  const PLAY = '<svg viewBox="0 0 24 24" class="hv-i" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none"/></svg>';
  const FIRE = SV('<path d="M12 21c4 0 6.5-2.6 6.5-6.3 0-3.7-3-5.7-4-9.7-2 1.8-2.6 3.7-2.6 5.2C10.6 9 9.5 8 9.3 6.6 7 8.6 5.5 11.3 5.5 14.7 5.5 18.4 8 21 12 21z"/>');
  let planOpen = false;

  function hero() {
    const t = todayStr(), wd = wdOf(t), done = !!doneSet()[t];
    const g = S.pg && window.PROGS && PROGS.find(p => p.id === S.pg.id);
    let lab, title, sub, btn;
    if (g && Object.keys(S.pg.done || {}).length < g.days) {
      let k = 0; while (k < g.days - 1 && S.pg.done[k]) k++;
      lab = "Seu programa · " + Object.keys(S.pg.done).length + " de " + g.days + " dias";
      title = esc(g.n) + " · dia " + (k + 1);
      sub = esc(g.s);
      btn = '<button class="hv-go" data-pgplay="' + k + '">' + PLAY + ' Fazer o dia ' + (k + 1) + '</button>';
    } else {
      const w = buildWorkout(wd, phaseIdx(dayC()));
      lab = "Treino de hoje · ~" + estMin(w) + " min";
      title = esc(w.n);
      sub = w.items.length + " exercícios · " + w.rounds + " " + (w.rounds > 1 ? "voltas" : "volta") + (w.fixed ? "" : " · " + w.rest + " s de descanso");
      btn = '<button class="hv-go" data-act="start" data-wd="' + wd + '">' + PLAY + ' ' + (done ? "Treinar de novo" : "Começar treino") + '</button>';
    }
    return '<div class="hv-hero"><small>' + lab + '</small><b>' + title + '</b><small>' + sub + '</small>' +
      (done ? '<span class="hv-done">✓ Treino de hoje concluído</span>' : "") + btn +
      '<label class="hv-light"><input id="lightOn" type="checkbox"' + (S.light ? " checked" : "") + '> Versão leve (dias de cansaço)</label></div>';
  }
  function week() {
    const t = todayStr(), wd = wdOf(t), ws = addDays(t, -wd), ds = doneSet();
    let n = 0;
    const cells = WD.map((d, i) => {
      const day = addDays(ws, i), ok = !!ds[day]; if (ok) n++;
      return '<span class="hv-d' + (ok ? " ok" : i === wd ? " now" : "") + '">' + (ok ? "✓" : d.slice(0, 1)) + '</span>';
    }).join("");
    return '<button class="card hv-week" data-go="prog"><div class="row between"><b>Esta semana</b><span class="muted" style="font-size:.85rem">' + n + ' de 6 treinos ›</span></div><div class="hv-days">' + cells + '</div></button>';
  }

  const _vh = vHome;
  vHome = function () {
    const box = document.createElement("div");
    box.innerHTML = _vh();
    const st = box.firstElementChild;
    if (!st) return box.innerHTML;
    const kids = [...st.children], pick = sel => st.querySelector(":scope > " + sel);
    const secBy = re => kids.find(c => c.classList.contains("sec") && re.test((c.querySelector("h3") || {}).textContent || ""));
    const head = kids[0], sys = pick(".sys-card"), steps = st.querySelector(".st-card"), pw = st.querySelector(".pw-hint");
    const seg = pick(".seg"), tiles = pick(".tiles"), phase = kids.find(c => c.classList.contains("card") && /^Fase \d/.test(c.textContent.trim()));
    const datas = secBy(/Datas do programa/), dica = secBy(/Dica do dia/);
    const name = head ? head.outerHTML.replace('<h1 class="hi-name">', '<h1 class="hi-name">') : "";
    const top = '<div class="hv-top">' + name + '<div class="hv-meta"><span class="hv-streak">' + FIRE + streak() + '</span><button class="roundbtn" data-go="ajustes" aria-label="Ajustes">' + IC.gear + '</button></div></div>';
    const plan = '<details class="card hv-plan"' + (planOpen ? " open" : "") + '><summary><span><b>Plano de 90 dias</b><small>Dia ' + dayC() + ' · fase ' + (phaseIdx(dayC()) + 1) + ' de 4</small></span></summary><div class="hv-plan-in">' +
      (seg ? seg.outerHTML : "") + (phase ? phase.outerHTML : "") + (tiles ? tiles.outerHTML : "") + (datas ? datas.outerHTML.replace(/<div class="sechead">[\s\S]*?<\/div>/, "") : "") + '</div></details>';
    return '<div class="stack hv">' + top + (pw ? pw.outerHTML : "") + hero() + (sys ? sys.outerHTML : "") + (steps ? steps.outerHTML : "") + week() + plan + (dica ? dica.outerHTML : "") + '</div>';
  };
  document.addEventListener("toggle", e => { if (e.target.classList && e.target.classList.contains("hv-plan")) planOpen = e.target.open; }, true);
})();
