/* Shaper · histórico por exercício, recordes, progressão automática e resumo da semana
   No descanso depois de um exercício com meta de repetições, a pessoa marca quantas fez
   (vem preenchido com a meta). No fim do treino isso vira histórico (S.exlog), recordes e,
   no próximo treino, a meta sobe sozinha quando a pessoa bateu a anterior. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LOG = () => { if (!S.exlog || typeof S.exlog !== "object") S.exlog = {}; return S.exlog; };
  const best = id => (LOG()[id] || []).reduce((m, x) => Math.max(m, x.r || 0), 0);
  const bestS = id => (LOG()[id] || []).reduce((m, x) => Math.max(m, x.s || 0), 0);
  const last = id => { const l = LOG()[id]; return l && l.length ? l[l.length - 1] : null; };

  /* ---------- progressão: bateu a meta da última vez, a meta sobe ---------- */
  let UP = {}; // exercícios cuja meta subiu no treino atual
  const _bw = buildWorkout;
  buildWorkout = function (wd, pi) {
    const w = _bw(wd, pi);
    UP = {};
    w.items.forEach(it => {
      const l = last(it.id);
      if (!it.r || !l || !l.r) return;
      if (l.r >= it.r) { const up = Math.min(l.r + 1, Math.ceil(it.r * 1.6)); if (up > it.r) { it.r = up; UP[it.id] = 1; } }
    });
    return w;
  };
  const _rx = rxLong;
  rxLong = function (it) {
    let t = _rx(it);
    const l = last(it.id), b = best(it.id);
    if (UP[it.id]) t += " · ⬆ meta subiu";
    if (l && l.r) t += " · última: " + l.r + (b > l.r ? " · recorde: " + b : "");
    return t;
  };

  // voz: aviso de metade nos exercícios longos (os de troca de lado já falam "troque de lado")
  const _cue = cueCount;
  cueCount = function (sec, total) {
    _cue(sec, total);
    const s = PL && cur();
    if (s && s.t === "w" && EX[s.id] && !EX[s.id].side && total >= 40 && sec === Math.ceil(total / 2)) say("Metade! Continue firme");
  };

  /* ---------- no treino: contar repetições e guardar o que foi feito ---------- */
  // exercício logo antes deste descanso, se ele tinha meta de repetições
  function prevWork() { if (!PL) return -1; for (let j = PL.i - 1; j >= 0; j--) if (PL.st[j].t === "w") return PL.st[j].r ? j : -1; return -1; }
  const _rp = renderPlayer;
  renderPlayer = function () {
    _rp();
    if (!PL) return;
    if (PL.fin) { finExtra(); return; }
    const s = cur(); if (s.t !== "r") return;
    const j = prevWork(); if (j < 0 || !(PL.done && PL.done[j])) return;
    PL.reps = PL.reps || {};
    if (PL.reps[j] == null) PL.reps[j] = PL.st[j].r;
    const body = $("#plBody"), tm = body && body.querySelector(".pl-time"); if (!tm) return;
    tm.insertAdjacentHTML("beforebegin", '<div class="rp-box"><span>Quantas <b>' + esc(EX[PL.st[j].id].n) + '</b> você fez?</span>' +
      '<div class="rp-step"><button data-rp="-1" aria-label="Menos">−</button><b id="rpN">' + PL.reps[j] + '</b><button data-rp="1" aria-label="Mais">+</button></div></div>');
    body.querySelectorAll("[data-rp]").forEach(b => b.onclick = () => { PL.reps[j] = Math.max(0, Math.min(500, PL.reps[j] + +b.dataset.rp)); $("#rpN").textContent = PL.reps[j]; });
  };
  const _adv = advance;
  advance = function (auto) {
    if (PL && !PL.fin) {
      const s = cur();
      if (s.t === "w") { PL.done = PL.done || {}; PL.done[PL.i] = { s: Math.round(auto ? s.s : s.s - Math.max(0, PL.left)), full: !!auto }; }
    }
    _adv(auto);
  };
  const _fin = finish;
  finish = function () {
    // último exercício: sem descanso depois, conta a meta se ele foi até o fim
    if (PL && PL.done) {
      const L = LOG(), d = todayStr(), per = {}, prs = [];
      PL.reps = PL.reps || {};
      Object.keys(PL.done).forEach(k => {
        const st = PL.st[k], dn = PL.done[k]; if (!st || !EX[st.id] || st.id === "walk" || dn.s < 5) return;
        const r = st.r ? (PL.reps[k] != null ? PL.reps[k] : (dn.full ? st.r : 0)) : 0;
        const p = per[st.id] || (per[st.id] = { r: 0, s: 0, sets: 0 });
        p.r = Math.max(p.r, r); p.s = Math.max(p.s, dn.s); p.sets++;
      });
      Object.keys(per).forEach(id => {
        const p = per[id], br = best(id), bs = bestS(id), lst = last(id);
        if (p.r && p.r > br && (br || lst)) prs.push({ id, v: p.r, was: br, u: "rep" });
        else if (!p.r && p.s > bs && bs) prs.push({ id, v: p.s, was: bs, u: "s" });
        (L[id] = L[id] || []).push({ d, r: p.r, s: p.s, n: p.sets });
        if (L[id].length > 40) L[id] = L[id].slice(-40);
      });
      PL.prs = prs; PL.per = per;
    }
    _fin();
    if (PL && PL.prs && PL.prs.length) setTimeout(() => say(PL && PL.prs ? "Novo recorde! " + EX[PL.prs[0].id].n : ""), 3200);
  };
  function finExtra() {
    const hero = document.querySelector("#pl .done-hero"); if (!hero || hero.querySelector(".rp-sum,.rp-inv")) return;
    // nos treinos 3, 10 e 25 (quando a pessoa está curtindo) convida para chamar um amigo
    if ([3, 10, 25].includes(S.history.length) && window.inviteFriends) {
      const bt = hero.querySelector("#plDone");
      if (bt) bt.insertAdjacentHTML("beforebegin", '<button class="mx-invite rp-inv" data-invite><span>📣</span><div><b>' + S.history.length + ' treinos! Chama alguém pra treinar junto</b><small>Mande o Shaper para um amigo</small></div><i>↗</i></button>');
    }
    const per = PL.per || {}, ids = Object.keys(per).filter(id => per[id].r);
    if (!ids.length && !(PL.prs || []).length) return;
    const cmp = ids.slice(0, 6).map(id => { const l = LOG()[id], prev = l && l.length > 1 ? l[l.length - 2].r : 0, v = per[id].r;
      return '<li><span>' + esc(EX[id].n) + '</span><b>' + v + (prev ? ' <em class="' + (v > prev ? "up" : v < prev ? "down" : "") + '">' + (v > prev ? "▲ +" + (v - prev) : v < prev ? "▼ " + (v - prev) : "=") + '</em>' : "") + '</b></li>'; }).join("");
    hero.querySelector("h2").insertAdjacentHTML("afterend", '<div class="rp-sum">' +
      ((PL.prs || []).length ? '<div class="rp-pr"><span>🏆</span><div><b>' + (PL.prs.length > 1 ? PL.prs.length + " novos recordes!" : "Novo recorde!") + '</b>' +
        PL.prs.slice(0, 3).map(p => '<small>' + esc(EX[p.id].n) + ': ' + p.v + (p.u === "s" ? " s" : "") + ' (antes ' + p.was + ')</small>').join("") + '</div></div>' : "") +
      (cmp ? '<ul class="rp-cmp">' + cmp + '</ul><p class="note">Comparado com a última vez</p>' : "") + '</div>');
  }

  /* ---------- histórico do exercício (folha e "como fazer") ---------- */
  function histHTML(id) {
    const l = (LOG()[id] || []).slice(-10); if (!l.length) return "";
    const reps = l.some(x => x.r), key = reps ? "r" : "s", mx = Math.max(1, ...l.map(x => x[key])), b = reps ? best(id) : bestS(id);
    return '<div class="rp-hist"><div class="row between"><b>Seu histórico</b><span class="pill">🏆 recorde ' + b + (reps ? " rep" : " s") + '</span></div>' +
      '<div class="rp-bars">' + l.map(x => '<i style="--h:' + Math.max(8, Math.round(x[key] / mx * 100)) + '%"' + (x[key] === b ? ' class="pr"' : "") + '><em>' + x[key] + '</em></i>').join("") + '</div>' +
      '<small>' + l.length + ' treino' + (l.length > 1 ? "s" : "") + ' · último em ' + fmtD(l[l.length - 1].d) + '</small></div>';
  }
  const _open = openEx;
  openEx = function (id) { _open(id); const sh = $("#layer .sheet"), h = sh && sh.querySelector("h3"); if (h && histHTML(id)) h.parentNode.insertAdjacentHTML("beforebegin", histHTML(id)); };
  const _info = infoOver;
  infoOver = function (id) { _info(id); const sh = document.body.lastElementChild && document.body.lastElementChild.querySelector(".sheet"); if (sh && histHTML(id)) sh.insertAdjacentHTML("beforeend", histHTML(id)); };

  /* ---------- Progresso: resumo da semana e recordes ---------- */
  function week() {
    const from = addDays(todayStr(), -6), h = S.history.filter(x => x.d >= from), L = LOG();
    let prs = 0;
    Object.keys(L).forEach(id => { const l = L[id]; l.forEach((x, i) => { if (x.d >= from && x.r && x.r > Math.max(0, ...l.slice(0, i).map(y => y.r || 0)) && i > 0) prs++; }); });
    const x = window.sysStats ? sysStats() : {};
    return { n: h.length, min: Math.round(h.reduce((a, y) => a + (y.dur || 0), 0) / 60), days: new Set(h.map(y => y.d)).size, streak: streak(), prs, rank: x.rank || "E", level: x.level || 1, xp: x.xp || 0, from };
  }
  function recordsHTML() {
    const L = LOG(), ids = Object.keys(L).filter(id => EX[id] && L[id].some(x => x.r)).sort((a, b) => L[b][L[b].length - 1].d.localeCompare(L[a][L[a].length - 1].d)).slice(0, 8);
    if (!ids.length) return "";
    return '<div class="sec"><div class="sechead"><h3>Recordes pessoais</h3><span>repetições</span></div><div class="card rp-list">' +
      ids.map(id => '<button data-rpex="' + id + '"><span>' + esc(EX[id].n) + '</span><b>🏆 ' + best(id) + '</b></button>').join("") + '</div></div>';
  }
  const _vp = vProg;
  vProg = function () {
    const h = _vp(), w = week(), k = h.indexOf('<div class="card stack"');
    const card = '<div class="card rp-week"><div class="row between"><div><span class="greet">Últimos 7 dias</span><h3>Resumo da semana</h3></div><button class="qchip" data-rpshare>↗ Compartilhar</button></div>' +
      '<div class="rp-wk"><div><b>' + w.n + '</b><span>treinos</span></div><div><b>' + w.min + '</b><span>minutos</span></div><div><b>' + w.streak + '</b><span>sequência</span></div><div><b>' + w.prs + '</b><span>recordes</span></div></div></div>';
    const add = card + recordsHTML();
    return k < 0 ? h.replace(/<\/div>$/, add + "</div>") : h.slice(0, k) + add + h.slice(k);
  };

  /* ---------- imagem do resumo (1080 × 1350, boa para feed e stories) ---------- */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function weekImage() {
    const w = week(), cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    const c = cv.getContext("2d"), F = '"Archivo Black","Inter",system-ui,sans-serif', T = '"Inter",system-ui,sans-serif';
    const g = c.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, "#0B1430"); g.addColorStop(.55, "#1A2A6C"); g.addColorStop(1, "#3B1F6E"); c.fillStyle = g; c.fillRect(0, 0, 1080, 1350);
    const gl = c.createRadialGradient(880, 160, 20, 880, 160, 520); gl.addColorStop(0, "rgba(91,140,255,.55)"); gl.addColorStop(1, "rgba(91,140,255,0)"); c.fillStyle = gl; c.fillRect(0, 0, 1080, 1350);
    c.fillStyle = "#fff"; c.font = "800 44px " + T; c.fillText("SHAPER", 90, 130);
    c.fillStyle = "rgba(255,255,255,.7)"; c.font = "500 34px " + T; c.fillText(fmtD(w.from) + " a " + fmtD(todayStr()), 90, 185);
    c.fillStyle = "#fff"; c.font = "900 96px " + F; c.fillText("Minha", 90, 330); c.fillText("semana", 90, 440);
    const name = (window.myName ? myName() : "Atleta").slice(0, 22); c.fillStyle = "#9DB8FF"; c.font = "700 44px " + T; c.fillText(name, 90, 510);
    const box = [[w.n, "treinos"], [w.min, "minutos"], [w.streak, "dias seguidos"], [w.prs, "recordes"]];
    box.forEach(([v, l], i) => {
      const x = 90 + (i % 2) * 460, y = 590 + Math.floor(i / 2) * 290;
      rr(c, x, y, 430, 250, 40); c.fillStyle = "rgba(255,255,255,.1)"; c.fill(); c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#fff"; c.font = "900 120px " + F; c.fillText(String(v), x + 40, y + 150);
      c.fillStyle = "rgba(255,255,255,.75)"; c.font = "600 36px " + T; c.fillText(l, x + 40, y + 210);
    });
    rr(c, 90, 1180, 900, 100, 50); c.fillStyle = "#fff"; c.fill();
    c.fillStyle = "#0B1430"; c.font = "800 40px " + T; c.textAlign = "center"; c.fillText("Rank " + w.rank + " · Nível " + w.level + " · " + w.xp + " XP", 540, 1244);
    return cv;
  }
  async function shareWeek() {
    try { await document.fonts.ready; } catch (e) {}
    const cv = weekImage(), png = cv.toDataURL("image/png"), w = week();
    const txt = "Minha semana no Shaper: " + w.n + " treinos, " + w.min + " minutos" + (w.prs ? ", " + w.prs + " recordes" : "") + " 💪";
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet rp-sheet"><div class="row between"><h2>Resumo da semana</h2><button class="roundbtn" data-rpclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<img class="rp-img" alt="Resumo da semana" src="' + png + '">' +
      '<div class="row"><button class="btn primary" style="flex:1" data-rpout>↗ Compartilhar</button>' + (Net.on() && Net.user() && window.feedComposeWith ? '<button class="btn ghost" data-rpfeed>📸 Postar no feed</button>' : "") + '</div></div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") closeLayer(); };
    $("[data-rpclose]").onclick = closeLayer;
    $("[data-rpout]").onclick = async () => {
      if (NATIVE) { if (!nat("shareImage", png, txt)) { nat("share", txt); toast("Tire um print da imagem para postar"); } else toast("Imagem salva na galeria (Shaper)"); return; }
      try { const f = new File([await (await fetch(png)).blob()], "shaper-semana.png", { type: "image/png" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: txt }); return; } } catch (e) {}
      const a = document.createElement("a"); a.href = png; a.download = "shaper-semana.png"; a.click();
    };
    const fb = $("[data-rpfeed]");
    if (fb) fb.onclick = () => { closeLayer(); tab = "feed"; render(); feedComposeWith(cv.toDataURL("image/jpeg", .9), txt); };
  }
  window.shareWeek = shareWeek;

  document.addEventListener("click", e => {
    if (e.target.closest("[data-rpshare]")) { shareWeek(); return; }
    const x = e.target.closest("[data-rpex]"); if (x) openEx(x.dataset.rpex);
  });
})();
