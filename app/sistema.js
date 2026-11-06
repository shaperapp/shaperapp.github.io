/* Ritmiq · Sistema
   Nível, rank (E→S), atributos, missão diária com penalidade, chefes de fase, títulos
   e missões surpresa (agendadas pelo Android). Estado em S.sys: entra no backup e no reset. */
(function () {
  "use strict";
  const RANKS = ["E", "D", "C", "B", "A", "S"];
  const PENALTY = "50 abdominais + 60 segundos de prancha";
  const BOSSES = [
    { d: 1, n: "Avaliação inicial", s: "Prancha pelo máximo de tempo que aguentar. É o seu ponto de partida." },
    { d: 21, n: "Guardião da Base", s: "Prancha máxima. Supere a sua avaliação inicial." },
    { d: 45, n: "Senhor da Queima", s: "Prancha máxima. Mostre o que a fase Queima construiu." },
    { d: 70, n: "Titã da Trinca", s: "Prancha máxima. O abdômen já é outro." },
    { d: 90, n: "Chefe Final", s: "A última prancha dos 90 dias. Vá até o limite." }
  ];
  const TITLES = [
    ["awake", "Despertado", "Primeiro treino", () => S.history.length >= 1],
    ["firm", "Persistente", "7 dias seguidos", () => bestStreak() >= 7],
    ["unb", "Inabalável", "30 dias seguidos", () => bestStreak() >= 30],
    ["surv", "Sobrevivente", "Cumpriu uma penalidade", () => Object.keys(Y().pen).length >= 1],
    ["fast", "Reflexo Rápido", "10 missões surpresa", () => Y().ms.done >= 10],
    ["boss", "Matador de Chefes", "Venceu 3 chefes", () => Object.keys(Y().boss).filter(k => k !== "0").length >= 3],
    ["hunt", "Caçador de Gordura", "−5 cm de cintura", () => { const a = firstWaist(), b = curWaist(); return !!(a && b && a - b >= 5); }],
    ["srank", "Monarca", "Chegou ao Rank S", () => levelOf(xpTotal()) >= 50]
  ];

  function Y() {
    if (!S.sys || typeof S.sys !== "object") S.sys = {};
    const y = S.sys;
    if (y.on === undefined) y.on = true;
    if (y.surprise === undefined) y.surprise = true;
    if (y.bubble === undefined) y.bubble = true;
    y.since = y.since || todayStr();
    y.bonus = y.bonus || 0;
    y.dq = y.dq || {}; y.vit = y.vit || {}; y.pen = y.pen || {}; y.boss = y.boss || {};
    y.ms = y.ms || { done: 0, failed: 0, declined: 0 };
    y.titles = y.titles || [];
    return y;
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- números ---------- */
  function need(L) { const k = L - 1; return 10 * k * k + 90 * k; }
  function levelOf(xp) { let L = 1; while (need(L + 1) <= xp) L++; return L; }
  // rank fixo e XP extra vêm da moderação (S.adm, sincronizado em net.js)
  function rankOf(L) { return (S.adm && S.adm.rank) || RANKS[Math.min(5, Math.floor(L / 10))]; }
  function xpTotal() {
    const y = Y();
    let xp = Object.keys(doneSet()).length * 100 + Object.keys(y.dq).length * 150 +
      Math.max(0, S.logs.filter(l => l.kg).length - 1) * 20 + Object.keys(y.pen).length * 40 +
      Object.keys(y.boss).length * 300 + y.bonus;
    for (const d in y.vit) { if (y.vit[d].w) xp += 25; if (y.vit[d].p) xp += 25; }
    return Math.max(0, xp + ((S.adm && S.adm.xp) || 0));
  }
  function attrs() {
    const y = Y(), h = S.history, vit = Object.values(y.vit);
    return [
      ["FOR", "Força", 10 + h.length + Object.keys(y.boss).length * 3],
      ["RES", "Resistência", 10 + h.filter(x => /HIIT|Queima/i.test(x.n || "")).length * 2 + y.ms.done],
      ["DIS", "Disciplina", 10 + bestStreak() * 2 + Object.keys(y.dq).length],
      ["VIT", "Vitalidade", 10 + vit.filter(v => v.w).length + vit.filter(v => v.p).length]
    ];
  }
  function curTitle() {
    const y = Y();
    for (let i = TITLES.length - 1; i >= 0; i--) if (y.titles.indexOf(TITLES[i][0]) >= 0) return TITLES[i][1];
    return "";
  }
  const waterT = () => waterGoal();
  const fmtL = ml => (ml / 1000).toFixed(2).replace(".", ",") + " L";
  function items() {
    const t = todayStr(), W = (S.water && S.water.d === t) ? S.water.v : 0, P = (S.prot && S.prot.d === t) ? S.prot.v : 0;
    const T = targets(), wt = waterT(), done = !!doneSet()[t];
    return [
      { t: "Treino do dia", ok: done, p: done ? "feito" : "pendente", s: done ? "feito" : "pendente", f: done ? 1 : 0, ic: "🏋️", go: "treino" },
      { t: "Água", ok: W >= wt, p: fmtL(W) + " / " + fmtL(wt), s: fmtL(W).replace(/\s*L$/, "") + "/" + fmtL(wt), f: wt ? W / wt : 0, ic: "💧", go: "dieta" },
      { t: "Proteína", ok: P >= T.prot, p: P + " / " + T.prot + " g", s: P + "/" + T.prot + " g", f: T.prot ? P / T.prot : 0, ic: "🍗", go: "dieta" }
    ];
  }
  function penActive() {
    const y = Y(), t = todayStr(), p = addDays(t, -1);
    return y.on && p >= y.since && p >= S.start && !y.dq[p] && !y.pen[t];
  }
  function bossNow() {
    const c = dayC(), y = Y();
    for (let i = BOSSES.length - 1; i >= 0; i--) if (c >= BOSSES[i].d) return y.boss[i] ? null : Object.assign({ i }, BOSSES[i]);
    return null;
  }
  function prevBoss(i) { const y = Y(); for (let j = i - 1; j >= 0; j--) if (y.boss[j]) return y.boss[j].s; return null; }
  function leftToday() {
    const n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0);
    const min = Math.max(0, Math.round((m - n) / 60000));
    return Math.floor(min / 60) + "h " + String(min % 60).padStart(2, "0") + "m";
  }
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  function mission() { try { const j = nat("getMission"); return j ? JSON.parse(j) : null; } catch (e) { return null; } }

  /* ---------- verificação após cada save ---------- */
  function check() {
    const y = Y();
    if (!y.on) { push(); return; }
    const t = todayStr(), it = items(), pops = [];
    let ch = false;
    const v = y.vit[t] || (y.vit[t] = {});
    if (it[1].ok && !v.w) { v.w = 1; ch = true; }
    if (it[2].ok && !v.p) { v.p = 1; ch = true; }
    if (it.every(i => i.ok) && !y.dq[t]) {
      y.dq[t] = 1; ch = true;
      pops.push({ c: "", hd: "MISSÃO DIÁRIA", h: "Concluída", b: "+150 XP · Recompensa recebida", snd: "quest", say: "Missão diária concluída." });
    }
    const L = levelOf(xpTotal());
    if (!y.lv) { y.lv = L; ch = true; }
    else if (L > y.lv) { pops.push({ lv: [y.lv, L] }); y.lv = L; ch = true; }
    TITLES.forEach(T => {
      if (y.titles.indexOf(T[0]) < 0 && T[3]()) { y.titles.push(T[0]); ch = true; pops.push({ c: "gold", hd: "TÍTULO OBTIDO", h: T[1], b: T[2], snd: "title", say: "Título obtido. " + T[1] }); }
    });
    if (ch) persist();
    pops.forEach(pop);
    pops.forEach(p => { if (!window.netLog) return; if (p.lv) netLog("level", "Chegou ao nível " + p.lv[1], 0); else if (p.hd === "MISSÃO DIÁRIA") netLog("daily", "Missão diária concluída", 150); else if (p.hd === "TÍTULO OBTIDO") netLog("title", "Título: " + p.h, 0); });
    push();
    refreshScreen();
    if (window.netSync) netSync();
  }
  window.sysStats = () => { const xp = xpTotal(), L = levelOf(xp); return { xp, level: L, rank: rankOf(L), title: curTitle(), missions: Y().ms.done }; };
  window.sysAddBonus = (xp, title) => { Y().bonus += xp; Y().ms.done++; persist(); pop({ c: "gold", hd: "DESAFIO DO GRUPO", h: title, b: "+" + xp + " XP (em dobro)", snd: "title", say: "Desafio do grupo concluído. Experiência em dobro." }); check(); };

  function push() {
    if (!NATIVE) return;
    const y = Y(), xp = xpTotal(), L = levelOf(xp), it = items(), a = need(L), b = need(L + 1), T = targets(), boss = bossNow();
    const names = [MNAME[0], MNAME[1].replace("{w}", fmtL(waterT())), MNAME[2].replace("{p}", T.prot)];
    nat("systemStatus", JSON.stringify({
      on: !!y.on, date: todayStr(), level: L, rank: rankOf(L), xp, title: curTitle(),
      done: it.filter(i => i.ok).length, total: it.length,
      items: it.map((i, k) => ({ t: i.t, ok: i.ok, p: k === 0 ? (i.ok ? "concluída" : "pendente") : i.p, n: names[k], f: Math.max(0, Math.min(1, i.f)), xp: MXP[k] })),
      pct: Math.max(0, Math.min(1, (xp - a) / (b - a))), left: b - xp, next: L + 1,
      streak: typeof streak === "function" ? streak() : 0, boss: boss ? boss.n : "",
      pen: penActive() ? PENALTY : ""
    }));
  }
  function pushPrefs() { const y = Y(); nat("setSystemPrefs", !!y.on, !!(y.on && y.surprise), !!(y.on && y.bubble)); }

  /* ---------- pop-ups ---------- */
  const Q = [];
  let showing = false, BI = 0, BT = 0; // posição na fila atual ("1 de 3")
  function pop(o) { Q.push(o); if (showing) { BT++; counter(document.querySelector(".sys-popwrap")); } flush(); }
  function counter(w) {
    const ok = w && w.querySelector("[data-popok]");
    if (!ok) return;
    w.querySelectorAll(".s2-dots,.s2-cnt").forEach(x => x.remove());
    if (BT > 1) ok.insertAdjacentHTML("beforebegin", '<div class="s2-dots">' + Array.from({ length: BT }, (_, j) => '<i' + (j === BI - 1 ? ' class="on"' : "") + '></i>').join("") + '</div><small class="s2-cnt">' + BI + ' de ' + BT + ' novidades</small>');
    ok.textContent = BI < BT ? "Próxima" : "OK";
  }
  function flush() {
    if (showing || !Q.length || document.hidden || (PL && !PL.fin)) return;
    showing = true;
    if (BI >= BT) { BI = 0; BT = Q.length; }
    BI++;
    const o = Q.shift();
    if (o.lv) return levelUp(o.lv[0], o.lv[1]);
    panel('<div class="sys-pop ' + (o.c || "") + '"><div class="hd">[ ' + o.hd + ' ]</div><h2 class="sys-type" data-t="' + esc(o.h) + '"></h2>' +
      (o.b ? '<p>' + esc(o.b) + '</p>' : "") + '<button class="sys-btn solid" data-popok>OK</button></div>');
    sound(o.snd);
    if (o.say) say(o.say);
  }
  function panel(html, onClose) {
    const w = document.createElement("div");
    w.className = "scrim sys-popwrap";
    w.innerHTML = html;
    counter(w);
    document.body.appendChild(w);
    type(w);
    const close = () => { if (!w.isConnected) return; w.remove(); if (onClose) onClose(); showing = false; setTimeout(flush, 250); };
    w.addEventListener("click", e => { if (e.target.closest("[data-popok]")) close(); });
    // botão voltar do Android remove o .scrim direto: libera a fila também
    new MutationObserver((m, ob) => { if (!w.isConnected) { ob.disconnect(); if (showing) { showing = false; if (onClose) onClose(); setTimeout(flush, 250); } } }).observe(document.body, { childList: true });
    return { w, close };
  }
  function type(root) {
    root.querySelectorAll(".sys-type").forEach(el => {
      const s = el.dataset.t || ""; let i = 0;
      const step = () => { el.textContent = s.slice(0, ++i); if (i < s.length) setTimeout(step, 32); else el.classList.add("done"); };
      step();
    });
  }
  function levelUp(a, b) {
    const ra = rankOf(a), rb = rankOf(b);
    let sp = "";
    for (let i = 0; i < 16; i++) { const g = i / 16 * Math.PI * 2, r = 90 + Math.random() * 70; sp += '<i class="sys-spark" style="--x:' + Math.round(Math.cos(g) * r) + 'px;--y:' + Math.round(Math.sin(g) * r) + 'px;animation-delay:' + (i % 4) * 40 + 'ms"></i>'; }
    panel('<div class="sys-pop' + (rb !== ra ? " gold" : "") + '">' + sp + '<div class="hd">[ SISTEMA ]</div><div class="sys-big">LEVEL UP!</div>' +
      '<h2 class="sys-type" data-t="Nível ' + a + ' → ' + b + '"></h2>' +
      (rb !== ra ? '<p>Novo rank: <b style="color:#fff">' + ra + ' → ' + rb + '</b></p>' : '<p>Seus atributos aumentaram.</p>') +
      '<button class="sys-btn solid" data-popok>OK</button></div>');
    sound("level");
    say(rb !== ra ? "Subiu de nível. Novo rank, " + rb : "Subiu de nível. Nível " + b);
  }
  function sound(k) {
    if (!k) return;
    const seq = { quest: [[880, 0], [1320, 110]], title: [[784, 0], [1175, 120], [1568, 240]], level: [[523, 0], [659, 90], [784, 180], [1046, 270], [1568, 380]], alert: [[440, 0], [330, 160], [440, 320]] }[k] || [];
    seq.forEach(([f, d]) => setTimeout(() => tone(f, k === "level" ? .16 : .13, k === "alert" ? "square" : "sine", .3), d));
  }

  /* ---------- cartão na tela inicial ---------- */
  function qi(i) { return '<div class="sys-qi' + (i.ok ? " ok" : "") + '"><span class="ck">✓</span><span class="t">' + i.t + '</span><span class="p">' + i.p + '</span></div>'; }
  // ícones de linha (sem emoji) e XP de cada missão: treino 100, água 25, proteína 25
  const SV = p => '<svg viewBox="0 0 24 24" class="s2i" aria-hidden="true">' + p + '</svg>';
  const SIC = {
    treino: SV('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'), agua: SV('<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>'),
    prot: SV('<path d="M15.5 4.5a4 4 0 0 1 3 6.6l-6.4 6.4a3 3 0 1 1-4.2-4.2l1-1a4 4 0 0 1 6.6-7.8zM7 17l-2.5 2.5"/>'), ok: SV('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    bolt: SV('<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>'), fire: SV('<path d="M12 21c4 0 6.5-2.6 6.5-6.3 0-3.7-3-5.7-4-9.7-2 1.8-2.6 3.7-2.6 5.2C10.6 9 9.5 8 9.3 6.6 7 8.6 5.5 11.3 5.5 14.7 5.5 18.4 8 21 12 21z"/>'),
    clock: SV('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>'), warn: SV('<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>'), sword: SV('<path d="M14.5 4H20v5.5L9 20.5 3.5 15zM6 13l5 5M4 20l2-2"/>')
  };
  const MXP = [100, 25, 25], MNAME = ["Fazer o treino do dia", "Beber " + "{w}" + " de água", "Comer {p} g de proteína"];
  function missionRows(it) {
    const T = targets();
    return it.map((i, k) => {
      const f = Math.max(0, Math.min(1, i.f)), name = MNAME[k].replace("{w}", fmtL(waterT())).replace("{p}", T.prot);
      return '<div class="s2-mi' + (i.ok ? " done" : "") + '"><span class="s2-ic">' + (i.ok ? SIC.ok : [SIC.treino, SIC.agua, SIC.prot][k]) + '</span><div class="s2-mt"><div class="s2-row"><b>' + name + '</b><span class="s2-xp">+' + MXP[k] + ' XP</span></div>' +
        '<i class="s2-bar"><i style="width:' + (f * 100).toFixed(1) + '%"></i></i><small>' + (k === 0 ? (i.ok ? "concluída" : "pendente") : i.p) + '</small></div></div>';
    }).join("");
  }
  function cardHTML() {
    const y = Y();
    if (!y.on) return "";
    const xp = xpTotal(), L = levelOf(xp), a = need(L), b = need(L + 1), R = rankOf(L), it = items(), n = it.filter(i => i.ok).length, boss = bossNow(), m = mission();
    const pct = Math.max(0, Math.min(1, (xp - a) / (b - a))), C = 2 * Math.PI * 26, st = typeof streak === "function" ? streak() : 0;
    const row = (cls, ic, lbl, txt, go) => '<div class="s2-alert ' + cls + '"><span class="s2-ic">' + ic + '</span><div class="s2-mt"><span class="s2-lbl">' + lbl + '</span><b>' + txt + '</b></div>' + (go ? '<span class="s2-go">' + go + ' ›</span>' : "") + '</div>';
    return '<div class="sys-card s2" data-sysopen role="button" tabindex="0">' +
      '<div class="s2-top"><div class="s2-ring" data-rank="' + R + '"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" class="tr"/><circle cx="32" cy="32" r="26" class="pg" style="stroke-dasharray:' + C.toFixed(1) + ';stroke-dashoffset:' + (C * (1 - pct)).toFixed(1) + '"/></svg><span>' + R + '</span></div>' +
      '<div class="s2-who"><span class="s2-lbl">Sistema · Rank ' + R + (curTitle() ? " · " + esc(curTitle()) : "") + '</span><b class="s2-lv">Nível ' + L + '</b><small>Faltam ' + (b - xp) + ' XP para o nível ' + (L + 1) + '</small></div>' +
      '<span class="s2-chip" title="Dias seguidos">' + SIC.fire + st + '</span></div>' +
      '<div class="s2-head"><span class="s2-lbl">Missões de hoje · ' + n + ' de 3</span><span class="s2-chip' + (n === 3 ? " ok" : "") + '">' + (n === 3 ? SIC.ok + "+150 XP" : SIC.clock + leftToday()) + '</span></div>' +
      missionRows(it) +
      (penActive() ? row("red", SIC.warn, "Zona de penalidade", PENALTY, "") : "") +
      (boss ? row("boss", SIC.sword, "Chefe disponível", esc(boss.n), "Enfrentar") : "") +
      (m ? row("red", SIC.bolt, "Missão surpresa", m.st === "active" ? "Em andamento" : "Esperando sua resposta", "Ver") : "") + '</div>';
  }
  /* ---------- tela de status ---------- */
  function screenHTML() {
    const y = Y(), xp = xpTotal(), L = levelOf(xp), a = need(L), b = need(L + 1), R = rankOf(L), it = items(), n = it.filter(i => i.ok).length, boss = bossNow(), m = mission(), ct = curTitle();
    return '<div class="sys-win">' +
      '<div class="sys-top"><span class="sys-lbl" style="color:var(--sys)">[ Status ]</span><button class="sys-x" data-sysclose aria-label="Fechar">✕</button></div>' +
      '<div class="sys-panel"><div class="sys-head"><div class="sys-rank big" data-rank="' + R + '">' + R + '</div><div style="flex:1;min-width:0">' +
      '<div class="sys-lbl">Título</div><div style="font-weight:700;color:#fff">' + esc(ct || "Nenhum ainda") + '</div><div class="sys-lv" style="margin-top:4px">Nível ' + L + '</div></div></div>' +
      '<div class="sys-xp"><i style="width:' + ((xp - a) / (b - a) * 100).toFixed(1) + '%"></i></div><div class="row between"><span class="sys-lbl">' + (xp - a) + ' / ' + (b - a) + ' XP</span><span class="sys-lbl">Total ' + xp + ' XP</span></div></div>' +
      '<div class="sys-panel"><h4>ATRIBUTOS</h4><div class="sys-attr">' + attrs().map(x => '<div><span class="sys-lbl">' + x[0] + ' · ' + x[1] + '</span><b>' + x[2] + '</b></div>').join("") + '</div></div>' +
      '<div class="sys-panel"><div class="row between"><h4>MISSÃO DIÁRIA ' + n + '/3</h4><span class="sys-lbl">' + (n === 3 ? "Concluída" : leftToday()) + '</span></div>' +
      it.map(i => '<div class="sys-qi' + (i.ok ? " ok" : "") + '"><span class="ck">✓</span><span class="t">' + i.t + '</span><span class="p">' + i.p + '</span>' + (i.ok ? "" : '<button class="sys-btn sm" data-sysgo="' + i.go + '">Ir</button>') + '</div>').join("") +
      '<p>Recompensa: +150 XP. Se não concluir até a meia-noite, amanhã abre a zona de penalidade.</p></div>' +
      (penActive() ? '<div class="sys-panel red"><h4>⚠ ZONA DE PENALIDADE</h4><p>Você não concluiu a missão de ontem. Cumpra: <b style="color:#fff">' + PENALTY + '</b>.</p><button class="sys-btn red" data-syspen>Cumpri a penalidade (+40 XP)</button></div>' : "") +
      (boss ? '<div class="sys-panel gold"><h4>⚔ CHEFE · ' + esc(boss.n).toUpperCase() + '</h4><p>' + esc(boss.s) + '</p><button class="sys-btn gold" data-sysboss="' + boss.i + '">Enfrentar (+300 XP)</button></div>' : "") +
      '<div class="sys-panel' + (m ? " red" : "") + '"><h4>MISSÕES SURPRESA</h4>' +
      (m ? '<p><b style="color:#fff">' + esc(m.t) + '</b> · ' + esc(m.d) + ' · +' + m.xp + ' XP</p><button class="sys-btn solid" data-sysmission>' + (m.st === "active" ? "Ver missão em andamento" : "Responder missão") + '</button>'
        : '<p>' + (y.surprise ? "Podem aparecer até 2 por dia, entre 9h e 21h. Fique atento." : "Desativadas nos Ajustes.") + ' Concluídas: ' + y.ms.done + ' · Falhas: ' + y.ms.failed + '</p>') + '</div>' +
      '<div class="sys-panel"><h4>TÍTULOS ' + y.titles.length + '/' + TITLES.length + '</h4><div class="sys-titles">' +
      TITLES.map(T => '<div class="' + (y.titles.indexOf(T[0]) < 0 ? "off" : (T[1] === ct ? "cur" : "")) + '"><b>' + T[1] + '</b><span>' + T[2] + '</span></div>').join("") + '</div></div>' +
      '</div>';
  }
  function sysOpen() {
    if (PL && !PL.fin) return;
    $("#layer").innerHTML = '<div class="sys-screen" id="scrim">' + screenHTML() + '</div>';
    sound("quest");
  }
  function refreshScreen() {
    const el = document.querySelector(".sys-screen:not(.boss)");
    if (el) window.fxMorph(el, screenHTML());
  }

  /* ---------- chefe: cronômetro da prancha ---------- */
  function bossFight(i) {
    const B = BOSSES[i], prev = prevBoss(i);
    $("#layer").innerHTML = '<div class="sys-screen boss" id="scrim"><div class="sys-win" style="min-height:100%;justify-content:center;text-align:center">' +
      '<div class="sys-top"><span class="sys-lbl" style="color:var(--sysgold)">[ Chefe ]</span><button class="sys-x" data-sysclose aria-label="Fechar">✕</button></div>' +
      '<h2 class="sys-type" data-t="' + esc(B.n) + '" style="font-family:var(--display);font-size:1.8rem;color:#fff"></h2><p style="color:var(--sysmut);margin:0">' + esc(B.s) + (prev ? ' Recorde a bater: ' + mmss(prev) + '.' : "") + '</p>' +
      '<div class="sys-timer" id="bT">00:00</div><button class="sys-btn gold" id="bGo" style="min-height:58px;font-size:1.1rem">Começar</button></div></div>';
    type($("#layer"));
    let run = false, t0 = 0, iv = null, lastSay = 0;
    $("#bGo").onclick = () => {
      if (!run) {
        run = true; t0 = performance.now(); keepAwake(true); $("#bGo").textContent = "Parar"; say("Valendo. Aguente firme."); sound("alert");
        iv = setInterval(() => {
          const s = (performance.now() - t0) / 1000; const el = $("#bT"); if (!el) { clearInterval(iv); keepAwake(false); return; }
          el.textContent = mmss(s);
          const k = Math.floor(s / 15); if (k > lastSay) { lastSay = k; say(prev && s > prev ? "Novo recorde!" : mmss(s).replace(/^0/, "").replace(":", " minutos e ") + " segundos"); }
        }, 200);
      } else {
        clearInterval(iv); keepAwake(false);
        const s = Math.round((performance.now() - t0) / 1000);
        closeLayer();
        if (s < 10) { pop({ c: "red", hd: "CHEFE", h: "Muito cedo", b: "Aguente pelo menos 10 segundos para contar. Tente de novo.", snd: "alert" }); return; }
        Y().boss[i] = { s, d: todayStr() }; persist();
        if (window.netLog) netLog("boss", B.n + " · prancha " + mmss(s), 300);
        const diff = prev ? s - prev : null;
        pop({ c: "gold", hd: "CHEFE DERROTADO", h: B.n, b: "Prancha: " + mmss(s) + (diff !== null ? " (" + (diff >= 0 ? "+" : "") + diff + " s vs último)" : "") + " · +300 XP", snd: "title", say: "Chefe derrotado. " + s + " segundos." });
        check(); render();
      }
    };
  }

  /* ---------- missões surpresa ---------- */
  let shownKey = "", mTimer = null;
  function sysMission(force) {
    const m = mission();
    if (!m) return;
    const key = m.i + ":" + m.st + ":" + m.at;
    if (!force && key === shownKey) return;
    if (showing || (PL && !PL.fin)) return;
    shownKey = key; showing = true;
    const act = m.st === "active";
    const p = panel('<div class="sys-pop red"><div class="hd">[ ⚠ ' + (act ? "MISSÃO EM ANDAMENTO" : "MISSÃO SURPRESA") + ' ]</div><h2 class="sys-type" data-t="' + esc(m.t) + '"></h2>' +
      '<p style="color:#fff;font-size:1.05rem">' + esc(m.d) + '</p><p>Recompensa: +' + m.xp + ' XP' + (act ? "" : " · Limite: " + mmss(m.s) + " para cumprir") + '</p>' +
      '<div class="sys-timer" id="mT" style="font-size:2.6rem">--:--</div><p class="sys-lbl" id="mL">' + (act ? "Tempo restante" : "Aceite em") + '</p>' +
      '<div class="sys-row">' + (act ? '<button class="sys-btn" data-ma="decline">Desistir</button><button class="sys-btn solid" data-ma="done">Concluí ✓</button>'
        : '<button class="sys-btn" data-ma="decline">Recusar</button><button class="sys-btn red" data-ma="accept">Aceitar</button>') + '</div></div>', () => clearInterval(mTimer));
    sound("alert");
    if (!act) say("Alerta. Missão surpresa. " + m.d);
    const end = Date.now() + m.left;
    clearInterval(mTimer);
    mTimer = setInterval(() => { const el = p.w.querySelector("#mT"); if (!el) return clearInterval(mTimer); const s = (end - Date.now()) / 1000; el.textContent = mmss(s); if (s <= 0) { clearInterval(mTimer); p.close(); sysPull(); } }, 250);
    p.w.addEventListener("click", e => {
      const b = e.target.closest("[data-ma]"); if (!b) return;
      const a = b.dataset.ma;
      nat("missionAction", a);
      p.close();
      if (a === "accept") { say("Missão aceita. Valendo."); setTimeout(() => sysMission(true), 300); }
      else sysPull();
    });
  }
  function sysPull() {
    let r = [];
    try { r = JSON.parse(nat("takeMissionResults") || "[]"); } catch (e) {}
    if (!r.length) return;
    const y = Y();
    r.forEach(x => {
      if (x.r === "done") { y.bonus += x.xp; y.ms.done++; if (window.netLog) netLog("mission", "Missão surpresa: " + x.t, x.xp); pop({ c: "", hd: "MISSÃO CONCLUÍDA", h: x.t, b: "+" + x.xp + " XP", snd: "quest", say: "Missão concluída. Mais " + x.xp + " de experiência." }); }
      else if (x.r === "failed") { y.ms.failed++; pop({ c: "red", hd: "MISSÃO FALHOU", h: x.t, b: "O tempo acabou. A próxima vem sem aviso.", snd: "alert" }); }
      else if (x.r === "declined" || x.r === "missed") y.ms.declined++;
    });
    persist(); check();
    if (tab === "home" && !(PL && !PL.fin) && !$("#layer").innerHTML) render();
  }
  function sysResume() {
    if (!Y().on) return;
    sysPull(); sysMission(); flush(); check();
  }

  /* ---------- ajustes ---------- */
  function setHTML() {
    const y = Y(), sw = (id, on, lab) => '<label class="switch"><input id="' + id + '" type="checkbox"' + (on ? " checked" : "") + ' aria-label="' + lab + '"><span></span></label>';
    const perm = NATIVE && y.on && y.bubble && !nat("overlayAllowed");
    return '<div class="sec"><div class="sechead"><h3>Sistema</h3></div><div class="card" style="padding-block:4px">' +
      '<div class="setrow"><div><b>Níveis, rank e missões</b><span class="note">XP por treino, água, proteína e peso. Missão diária, penalidade, chefes e títulos.</span></div>' + sw("sysOn", y.on, "Sistema") + '</div>' +
      (NATIVE && nat("pipSupported") ? '<div class="setrow"><div><b>Janela flutuante no treino</b><span class="note">Ao sair do app no meio do treino, o cronômetro continua numa janelinha por cima dos outros apps.</span></div>' + sw("sysPip", nat("pipOn") !== false, "Janela flutuante") + '</div>' : "") +
      (y.on ? '<div class="setrow"><div><b>Missões surpresa</b><span class="note">Até 2 por dia, entre 9h e 21h. Você tem 20 min para aceitar.</span></div>' + sw("sysSur", y.surprise, "Missões surpresa") + '</div>' +
        '<div class="setrow"><div><b>Bolha sobre outros apps</b><span class="note">Mostra o progresso da missão, do treino e do timer por cima de outros apps até você concluir.</span></div>' + sw("sysBub", y.bubble, "Bolha flutuante") + '</div>' +
        (perm ? '<div class="setrow"><button class="btn blue block" id="sysPerm">Permitir exibir sobre outros apps</button></div>' : "") +
        (NATIVE && nat("exactAlarmAllowed") === false ? '<div class="setrow"><div><b>Alarmes no horário exato</b><span class="note">Sem esta permissão o alarme do treino pode atrasar alguns minutos.</span></div><button class="btn blue" id="sysExact">Permitir</button></div>' : "") +
        '<div class="setrow"><button class="btn ghost" style="flex:1" id="sysTest">Testar missão</button><button class="btn ghost" style="flex:1" data-sysopen>Ver status</button></div>' : "") +
      '</div></div>';
  }

  /* ---------- ganchos no app original ---------- */
  const _vHome = vHome;
  vHome = function () { const h = _vHome(), k = h.indexOf("</h1></div>"); return k < 0 ? h : h.slice(0, k + 11) + cardHTML() + h.slice(k + 11); };
  const _vAj = vAjustes, MARK = '<div class="sec"><div class="sechead"><h3>Perfil</h3>';
  vAjustes = function () { const h = _vAj(), k = h.indexOf(MARK); return k < 0 ? h : h.slice(0, k) + setHTML() + h.slice(k); };
  const _bind = bind;
  bind = function () {
    _bind();
    const pp = $("#sysPip"); if (pp) pp.onchange = () => { nat("setPip", pp.checked); toast(pp.checked ? "Janela flutuante ativada" : "Janela flutuante desativada"); };
    const on = $("#sysOn");
    if (on) {
      on.onchange = () => { Y().on = on.checked; persist(); pushPrefs(); check(); render(); toast(on.checked ? "Sistema ativado" : "Sistema desativado"); };
      const su = $("#sysSur"); if (su) su.onchange = () => { Y().surprise = su.checked; persist(); pushPrefs(); };
      const bu = $("#sysBub"); if (bu) bu.onchange = () => { Y().bubble = bu.checked; persist(); pushPrefs(); render(); if (bu.checked && NATIVE && !nat("overlayAllowed")) nat("requestOverlayPermission"); };
      const pm = $("#sysPerm"); if (pm) pm.onclick = () => nat("requestOverlayPermission");
      const ex = $("#sysExact"); if (ex) ex.onclick = () => nat("requestExactAlarm");
      const te = $("#sysTest"); if (te) te.onclick = () => { if (NATIVE) { nat("missionTest"); setTimeout(() => sysMission(true), 400); } else toast("As missões surpresa funcionam no app Android"); };
    }
  };
  let ct = null;
  const _save = save;
  save = function () { _save(); clearTimeout(ct); ct = setTimeout(check, 60); };

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-sysopen]")) { sysOpen(); return; }
    if (t.closest("[data-sysclose]")) { closeLayer(); render(); return; }
    const g = t.closest("[data-sysgo]"); if (g) { closeLayer(); tab = g.dataset.sysgo; if (tab === "treino") daySel = null; render(); scrollTo(0, 0); return; }
    if (t.closest("[data-syspen]")) {
      Y().pen[todayStr()] = 1; persist(); closeLayer();
      if (window.netLog) netLog("pen", "Cumpriu a penalidade", 40);
      pop({ c: "red", hd: "PENALIDADE CUMPRIDA", h: "Você sobreviveu", b: "+40 XP", snd: "quest", say: "Penalidade cumprida." });
      check(); render(); return;
    }
    const bo = t.closest("[data-sysboss]"); if (bo) { bossFight(+bo.dataset.sysboss); return; }
    if (t.closest("[data-sysmission]")) { closeLayer(); sysMission(true); }
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(sysResume, 200); });
  setInterval(flush, 1500); // pop-ups que esperaram o treino acabar ou o app voltar
  setInterval(() => { if (!document.hidden && tab === "home" && !$("#layer").innerHTML && Y().on) render(); }, 60000); // relógio da missão

  window.sysOpen = sysOpen;
  window.sysMission = () => sysMission(false);
  window.sysResume = sysResume;

  /* ---------- início ---------- */
  const y = Y();
  if (!y.init) {
    y.init = 1; y.lv = levelOf(xpTotal());
    TITLES.forEach(T => { if (T[3]()) y.titles.push(T[0]); });
    persist();
    if (y.on) setTimeout(() => pop({ c: "", hd: "SISTEMA", h: "Você foi escolhido", b: "Complete a missão diária, enfrente os chefes e suba do Rank E ao Rank S. Missões surpresa podem aparecer a qualquer momento.", snd: "level", say: "Bem-vindo, jogador." }), 700);
  }
  pushPrefs();
  render();
  check();
  setTimeout(sysResume, 500);
})();
