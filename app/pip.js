/* Ritmiq · janela flutuante do treino (picture-in-picture)
   Ao sair do app no meio do treino, o Android encolhe o app numa janelinha por cima dos
   outros apps; aqui ela vira um cronômetro grande com anel de progresso. Também manda os
   detalhes da etapa para a notificação da tela de bloqueio. */
(function () {
  "use strict";
  const R = 46, C = 2 * Math.PI * R;
  let on = false, tm = null;

  function step() {
    const s = cur(), rest = s.t === "r", nx = nextWork(PL.i + 1);
    const wi = PL.st.slice(0, PL.i + 1).filter(x => x.t === "w").length, wt = PL.st.filter(x => x.t === "w").length;
    return { s, rest, nx, wi, wt };
  }

  const _rp = renderPlayer;
  renderPlayer = function () {
    if (PL && !PL.fin && PL.st && PL.st.length) {
      const k = step();
      nat("workoutExtra", k.rest ? "Descanso" : EX[k.s.id].n, k.nx ? EX[k.nx.id].n : "", PL.w.n, k.wi, k.wt, k.rest);
    }
    _rp();
    draw();
  };

  function draw() {
    if (!on) return;
    const el = document.getElementById("pipView");
    if (!el) return;
    if (!PL || PL.fin) {
      el.className = "pip-done";
      el.innerHTML = '<div class="pip-ok">✓</div><b>Treino concluído!</b><span>Toque para abrir</span>';
      return;
    }
    const k = step(), f = Math.max(0, Math.min(1, 1 - PL.left / k.s.s));
    el.className = (k.rest ? "rest" : "work") + (PL.run ? "" : " paused");
    el.innerHTML = '<div class="pip-top"><span>' + (k.rest ? "Descanso" : k.wi + "/" + k.wt) + '</span>' + (PL.run ? "" : "<span>⏸ pausado</span>") + '</div>' +
      '<div class="pip-ring"><svg viewBox="0 0 100 100"><circle class="tr" cx="50" cy="50" r="' + R + '"/><circle class="pg" cx="50" cy="50" r="' + R + '" style="stroke-dasharray:' + C.toFixed(1) + ';stroke-dashoffset:' + (C * (1 - f)).toFixed(1) + '"/></svg>' +
      '<b>' + fmtT(PL.left) + '</b></div>' +
      '<div class="pip-name">' + (k.rest ? (k.nx ? "a seguir: " + EX[k.nx.id].n : "último descanso") : EX[k.s.id].n) + '</div>';
  }

  window.pipMode = function (v) {
    on = !!v;
    document.documentElement.classList.toggle("pip", on);
    let el = document.getElementById("pipView");
    clearInterval(tm);
    if (on) {
      if (!el) { el = document.createElement("div"); el.id = "pipView"; document.body.appendChild(el); }
      draw();
      tm = setInterval(draw, 250);
    } else if (el) el.remove();
  };
})();
