/* Shaper · Ranking geral: todas as pessoas que usam o app (as que deixam o perfil público).
   Semana (XP dos últimos 7 dias) ou Geral (XP total), pódio, sua posição e top 100. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const R = { mode: "week", rows: [], loaded: false, busy: false, err: "", at: 0, pub: null };
  const me = () => Net.user() && Net.user().id;
  const av = (p, cls) => window.netAvatar(p, cls);

  async function load(force) {
    if (!Net.on() || !Net.user() || R.busy) return;
    if (!force && Date.now() - R.at < 30000 && R.loaded) return;
    R.busy = true;
    try {
      R.rows = await Net.rpc("global_board", { mode: R.mode }) || [];
      const p = await Net.sel("profiles", "select=public_rank&id=eq." + me());
      R.pub = p[0] ? p[0].public_rank !== false : true;
      R.err = ""; R.at = Date.now();
    } catch (e) { R.err = e.message; }
    R.busy = false; R.loaded = true;
    if (tab === "rank") render();
  }

  function vGlobal() {
    const head = '<div><div class="greet">Todos que usam o Shaper</div><h1>Ranking</h1></div>';
    if (!Net.on()) return '<div class="stack">' + head + '<div class="card"><p class="note">O servidor do ranking ainda não foi configurado.</p></div></div>';
    if (!Net.user()) return '<div class="stack">' + head + '<div class="rk-hero"><div class="rk-trophy">🌎</div><h2>Ranking de todo mundo</h2><p>Compare seu XP com todas as pessoas que treinam com o Shaper.</p><button class="btn primary block" data-login>Entrar ou criar conta</button></div></div>';
    if (!R.loaded) { load(); return '<div class="stack">' + head + '<div class="card rk-skel"></div><div class="card rk-skel" style="height:260px"></div></div>'; }
    const val = p => R.mode === "week" ? p.week_xp : p.xp, list = R.rows, mine = list.find(p => p.user_id === me());
    const top = list.filter(p => p.pos <= 100);
    const pod = [top[1], top[0], top[2]].map((p, i) => p ? '<div class="pod p' + [2, 1, 3][i] + (p.user_id === me() ? " me" : "") + '">' + ([2, 1, 3][i] === 1 ? '<span class="crown">👑</span>' : "") + av(p, "lg") +
      '<b class="pod-name">' + esc(p.name) + '</b><span class="pod-xp">' + val(p) + ' XP</span><div class="pod-col"><span>' + [2, 1, 3][i] + '</span></div></div>' : '<div class="pod p' + [2, 1, 3][i] + ' empty"><div class="pod-col"><span>' + [2, 1, 3][i] + '</span></div></div>').join("");
    const rows = top.slice(3).map((p, i) => '<div class="rk-row' + (p.user_id === me() ? " me" : "") + '" style="--d:' + Math.min(i, 12) * 30 + 'ms"><span class="rk-pos">' + p.pos + '</span>' + av(p) +
      '<span class="rk-who"><b>' + esc(p.name) + (p.user_id === me() ? ' <i>você</i>' : "") + '</b><span>Rank ' + esc(p.rank) + ' · Nv ' + p.level + ' · 🔥 ' + p.streak + '</span></span><span class="rk-xp">' + val(p) + '<small>XP</small></span></div>').join("");
    const total = list.length ? Math.max(...list.map(p => p.pos)) : 0;
    const youCard = mine ? '<div class="gr-me"><span class="gr-pos">#' + mine.pos + '</span><div><b>Sua posição ' + (R.mode === "week" ? "na semana" : "geral") + '</b><small>' + val(mine) + ' XP · ' +
      (mine.pos === 1 ? "você está no topo! 👑" : top[mine.pos - 2] ? "faltam " + (val(top[mine.pos - 2]) - val(mine) + 1) + " XP para passar " + esc(top[mine.pos - 2].name) : "continue treinando para subir") + '</small></div></div>' : "";
    return '<div class="stack">' + head + (R.err ? '<div class="card"><p class="note">' + esc(R.err) + '</p></div>' : "") +
      '<div class="segs" role="group"><button data-gmode2="week" aria-pressed="' + (R.mode === "week") + '">Esta semana</button><button data-gmode2="all" aria-pressed="' + (R.mode === "all") + '">Geral</button></div>' +
      youCard + (top.length ? '<div class="podium">' + pod + '</div>' + (rows ? '<div class="card rk-list">' + rows + '</div>' : "") : '<div class="card"><p class="note">Ninguém no ranking ainda. Treine para ser o primeiro!</p></div>') +
      '<p class="note" style="text-align:center">' + total + ' pessoas no ranking · atualiza sozinho</p>' +
      '<div class="card gr-pub"><div><b>' + (R.pub ? "🌎 Você aparece no ranking geral" : "🙈 Você está escondido do ranking geral") + '</b><small>Mostra só nome, foto, rank e XP. Seus grupos sempre te veem.</small></div>' +
      '<label class="switch"><input id="grPub" type="checkbox"' + (R.pub ? " checked" : "") + ' aria-label="Aparecer no ranking geral"><span></span></label></div></div>';
  }
  (window.EXTRA_VIEWS = window.EXTRA_VIEWS || {}).rank = vGlobal;
  window.vRank = vGlobal;

  document.addEventListener("click", e => {
    const m = e.target.closest("[data-gmode2]");
    if (m) { R.mode = m.dataset.gmode2; R.loaded = false; render(); load(true); }
  });
  document.addEventListener("change", async e => {
    if (e.target.id !== "grPub") return;
    try { await Net.upd("profiles", "id=eq." + me(), { public_rank: e.target.checked }); R.pub = e.target.checked; toast(e.target.checked ? "Você aparece no ranking geral" : "Você saiu do ranking geral"); load(true); }
    catch (er) { toast(er.message); e.target.checked = !e.target.checked; }
  });
  setInterval(() => { if (tab === "rank" && !document.hidden) load(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && tab === "rank") load(); });
})();
