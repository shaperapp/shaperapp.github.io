/* Shaper · Painel do admin: visão geral, pessoas (XP, rank, suspensão), denúncias,
   conversas dos grupos, posts, erros e histórico. Tudo passa por funções admin_* do
   servidor, que conferem se quem chama é admin; o app só esconde a entrada dos outros. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const when = t => { if (!t) return "—"; const m = Math.round((Date.now() - Date.parse(t)) / 60000); return m < 1 ? "agora" : m < 60 ? m + " min" : m < 1440 ? Math.round(m / 60) + " h" : m < 10080 ? Math.round(m / 1440) + " d" : new Date(t).toLocaleDateString("pt-BR"); };
  const RANKS = ["E", "D", "C", "B", "A", "S"];
  const SECS = [["geral", "📊 Geral"], ["users", "👤 Pessoas"], ["reports", "🚩 Denúncias"], ["chat", "💬 Conversas"], ["posts", "📸 Posts"], ["errors", "🐞 Erros"], ["log", "📜 Histórico"]];
  const A = { sec: "geral", q: "", data: {}, busy: "", err: "", gid: null, uid: null };
  const KIND = { post: "Post", comment: "Comentário", message: "Mensagem", user: "Perfil" };

  // quem é admin: pergunta ao servidor uma vez por sessão (guarda a última resposta para a aba Mais)
  let checked = "";
  window.amAdmin = localStorage.getItem("shaper.adm") === "1";
  async function check() {
    const u = Net.on() && Net.user(); if (!u || checked === u.id) return;
    checked = u.id;
    let ok = false;
    try { ok = (await Net.rpc("is_admin")) === true; } catch (e) { checked = ""; return; }
    if (ok !== window.amAdmin) { window.amAdmin = ok; localStorage.setItem("shaper.adm", ok ? "1" : "0"); if (tab === "mais" || tab === "admin") render(); }
  }
  window.admCheck = check;

  /* ---------- dados ---------- */
  async function load(sec, force) {
    if (!window.amAdmin || A.busy === sec || (!force && A.data[sec])) return;
    A.busy = sec; A.err = "";
    try {
      let d;
      if (sec === "geral") d = await Net.rpc("admin_stats");
      else if (sec === "users") d = await Net.rpc("admin_users", { q: A.q, lim: 80 });
      else if (sec === "reports") d = await Net.rpc("admin_reports", { lim: 150 });
      else if (sec === "chat") d = { groups: await Net.rpc("admin_groups"), msgs: await Net.rpc("admin_messages", { gid: A.gid, uid: A.uid, lim: 200 }) };
      else if (sec === "posts") d = await Net.rpc("admin_posts", { uid: A.uid, before: null, lim: 40 });
      else if (sec === "errors") d = await Net.rpc("admin_errors", { lim: 100 });
      else if (sec === "log") d = await Net.rpc("admin_logs", { lim: 100 });
      A.data[sec] = d;
    } catch (e) { A.err = e.message; }
    A.busy = "";
    if (tab === "admin" && !$("#layer").innerHTML) render();
  }
  const reload = sec => { delete A.data[sec]; load(sec, true); };

  /* ---------- tela ---------- */
  const av = p => window.netAvatar ? netAvatar({ photo: p.photo, avatar: p.avatar || "💪", rank: p.rank || "E" }, "") : "";
  const empty = t => '<div class="fd-empty"><span>✨</span><b>' + t + '</b></div>';
  const skel = '<div class="card rk-skel" style="height:220px"></div>';
  const tile = (n, t, warn) => '<div class="ad-stat' + (warn && n ? " warn" : "") + '"><b>' + (n == null ? "—" : n) + '</b><span>' + t + '</span></div>';

  function secGeral(s) {
    return '<div class="ad-grid">' + tile(s.users, "pessoas") + tile(s.new7, "novas (7 d)") + tile(s.active7, "ativas (7 d)") + tile(s.banned, "suspensas", 1) +
      tile(s.posts, "posts") + tile(s.hidden, "posts ocultos", 1) + tile(s.comments, "comentários") + tile(s.messages, "mensagens (24 h)") +
      tile(s.groups, "grupos") + tile(s.reports, "denúncias", 1) + tile(s.errors, "erros (24 h)", 1) + '</div>' +
      '<div class="card mx-row"><button data-adsec="reports">🚩 Ver denúncias</button><button data-adsec="users">👤 Buscar pessoa</button></div>';
  }
  function userRow(u) {
    return '<button class="ad-row" data-aduser="' + u.id + '">' + av(u) + '<div><b>' + esc(u.name) + (u.is_admin ? ' <i class="ad-tag">admin</i>' : "") + (u.banned ? ' <i class="ad-tag red">suspensa</i>' : "") + '</b>' +
      '<span>' + esc(u.email || "") + '</span><span>Rank ' + esc(u.rank) + ' · ' + (u.xp + u.xp_adj) + ' XP' + (u.xp_adj ? ' (' + (u.xp_adj > 0 ? "+" : "") + u.xp_adj + ')' : "") + ' · visto ' + when(u.last_seen) + (u.reported ? ' · 🚩' + u.reported : "") + '</span></div></button>';
  }
  function secUsers(list) {
    return '<form class="ad-search" data-adsearch><input id="adQ" type="search" placeholder="Nome, e-mail ou id" value="' + esc(A.q) + '" autocomplete="off"><button class="btn primary">Buscar</button></form>' +
      (list.length ? '<div class="card ad-list">' + list.map(userRow).join("") + '</div>' : empty("Ninguém encontrado"));
  }
  function secReports(list) {
    if (!list.length) return empty("Nenhuma denúncia aberta");
    return list.map(r => '<div class="card ad-rep"><div class="row between"><b>' + KIND[r.kind] + ' · ' + esc(r.reason) + '</b><span class="note">' + when(r.created_at) + '</span></div>' +
      (r.body ? '<p class="ad-quote">' + esc(r.body) + '</p>' : "") + (r.had_img ? '<p class="note">📷 tinha foto</p>' : "") +
      '<p class="note">De <b>' + esc(r.reporter_name || "?") + '</b> contra <b>' + esc(r.target_name || "?") + '</b>' + (r.group_name ? ' · grupo ' + esc(r.group_name) : "") + ' · ' + r.total + ' denúncia(s) contra essa pessoa</p>' +
      '<div class="ad-acts">' + (r.ref && r.kind !== "user" ? '<button class="danger" data-addel="' + r.kind + ':' + r.ref + '" data-adrep="' + r.id + '">🗑️ Apagar conteúdo</button>' : "") +
      (r.target ? '<button data-aduser="' + r.target + '">👤 Ver pessoa</button>' : "") + '<button data-adresolve="' + r.id + '">✅ Resolvida</button></div></div>').join("");
  }
  function secChat(d) {
    const g = d.groups || [], m = d.msgs || [];
    return '<div class="ad-chips"><button data-adgid="" aria-pressed="' + !A.gid + '">Todos</button>' + g.map(x => '<button data-adgid="' + x.id + '" aria-pressed="' + (A.gid === x.id) + '">' + esc(x.name) + ' <small>' + x.members + '👤 ' + x.msgs + '💬</small></button>').join("") + '</div>' +
      (A.uid ? '<p class="note">Só mensagens de uma pessoa · <button class="linkbtn" data-aduid="">mostrar todas</button></p>' : "") +
      (A.gid ? (() => { const x = g.find(y => y.id === A.gid); return x ? '<div class="card ad-gi"><b>' + esc(x.name) + '</b><span class="note">Código ' + esc(x.code) + ' · dono ' + esc(x.owner_name || "?") + ' · criado ' + when(x.created_at) + '</span><button class="danger" data-addel="group:' + x.id + '">🗑️ Apagar grupo</button></div>' : ""; })() : "") +
      (m.length ? '<div class="card ad-list">' + m.map(x => '<div class="ad-msg"><div class="row between"><b data-aduser="' + x.user_id + '">' + esc(x.name || "?") + '</b><span class="note">' + (A.gid ? "" : esc(x.group_name) + " · ") + when(x.created_at) + '</span></div>' +
        (x.body ? '<p>' + esc(x.body) + '</p>' : "") + '<div class="ad-acts">' + (x.has_img ? '<button data-adimg="' + x.id + '">📷 Ver foto</button>' : "") + '<button class="danger" data-addel="message:' + x.id + '">🗑️</button></div></div>').join("") + '</div>'
        : empty("Nenhuma mensagem nas últimas 24 h"));
  }
  function secPosts(list) {
    return (A.uid ? '<p class="note">Só posts de uma pessoa · <button class="linkbtn" data-aduid="">mostrar todos</button></p>' : "") +
      (list.length ? list.map(p => '<div class="card ad-post' + (p.hidden ? " off" : "") + '"><div class="ad-row" data-aduser="' + p.user_id + '">' + av(p) + '<div><b>' + esc(p.name || "?") + '</b><span>' + when(p.created_at) + ' · ' + (p.vis === "groups" ? "👥 grupos" : "🌎 todos") + ' · ❤️ ' + p.likes + ' · 💬 ' + p.comments + (p.reports ? ' · 🚩 ' + p.reports : "") + (p.hidden ? ' · <i class="ad-tag red">oculto</i>' : "") + '</span></div></div>' +
        (p.body ? '<p>' + esc(p.body) + '</p>' : "") + (p.img_path ? '<img loading="lazy" alt="" src="' + esc(Net.pubUrl(p.img_path)) + '">' : "") +
        '<div class="ad-acts"><button data-adcoms="' + p.id + '">💬 Comentários</button><button data-adhide="' + p.id + ':' + (p.hidden ? 0 : 1) + '">' + (p.hidden ? "👁️ Mostrar" : "🙈 Ocultar") + '</button><button class="danger" data-addel="post:' + p.id + '">🗑️ Apagar</button></div></div>').join("") : empty("Nenhum post"));
  }
  function secErrors(list) {
    return list.length ? '<div class="card ad-list">' + list.map(e => '<div class="ad-msg"><div class="row between"><b>' + esc(e.name || "anônimo") + '</b><span class="note">' + esc(e.version) + ' · ' + when(e.created_at) + '</span></div><p class="ad-mono">' + esc(e.msg.slice(0, 400)) + '</p><span class="note">' + esc(e.device) + '</span></div>').join("") + '</div>' : empty("Nenhum erro 🎉");
  }
  const ACT = { ban: "suspendeu", unban: "reativou", rank: "ajustou rank/XP de", hide: "ocultou post de", unhide: "mostrou post de", "admin+": "deu admin para", "admin-": "tirou admin de" };
  function secLog(list) {
    return list.length ? '<div class="card ad-list">' + list.map(l => '<div class="ad-msg"><p><b>' + esc(l.admin_name || "?") + '</b> ' + esc(ACT[l.action] || l.action.replace("del ", "apagou ") + " de") + ' <b>' + esc(l.target_name || "—") + '</b></p><span class="note">' + esc(l.detail) + ' · ' + when(l.created_at) + '</span></div>').join("") + '</div>' : empty("Nada por aqui ainda");
  }

  function vAdmin() {
    const head = '<div class="row between"><div><div class="greet">Moderação</div><h1>Admin</h1></div><button class="roundbtn" data-adreload aria-label="Atualizar">↻</button></div>';
    if (!Net.user() || !window.amAdmin) { check(); return '<div class="stack">' + head + '<div class="card"><p class="note">Acesso só para administradores.</p></div></div>'; }
    const d = A.data[A.sec];
    if (d === undefined) load(A.sec);
    const body = d === undefined ? skel : A.sec === "geral" ? secGeral(d || {}) : A.sec === "users" ? secUsers(d || []) : A.sec === "reports" ? secReports(d || []) :
      A.sec === "chat" ? secChat(d || {}) : A.sec === "posts" ? secPosts(d || []) : A.sec === "errors" ? secErrors(d || []) : secLog(d || []);
    return '<div class="stack ad">' + head +
      '<div class="ad-tabs" role="tablist">' + SECS.map(([k, t]) => '<button data-adsec="' + k + '" aria-pressed="' + (A.sec === k) + '">' + t + '</button>').join("") + '</div>' +
      (A.err ? '<div class="card"><p class="note">' + esc(A.err) + '</p></div>' : "") + body + '</div>';
  }
  (window.EXTRA_VIEWS = window.EXTRA_VIEWS || {}).admin = vAdmin;

  /* ---------- ficha da pessoa ---------- */
  let cur = null;
  function findUser(id) { for (const k of ["users"]) { const l = A.data[k] || []; const u = l.find(x => x.id === id); if (u) return u; } return null; }
  async function openUser(id) {
    cur = findUser(id);
    if (!cur) { try { const r = await Net.rpc("admin_users", { q: id, lim: 1 }); cur = r[0]; } catch (e) { toast(e.message); return; } }
    if (!cur) { toast("Pessoa não encontrada"); return; }
    cur.adj = cur.xp_adj; cur.rk = cur.rank_override || "";
    drawUser();
  }
  function drawUser() {
    const u = cur, total = Math.max(0, u.xp + u.adj);
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet ad-sheet" role="dialog" aria-label="Pessoa"><div class="row between"><div class="ad-row">' + av(u) + '<div><b>' + esc(u.name) + '</b><span>' + esc(u.email || "") + '</span></div></div><button class="roundbtn" data-adclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<div class="ad-grid sm">' + tile(u.workouts, "treinos") + tile(u.streak, "sequência") + tile(u.groups, "grupos") + tile(u.posts, "posts") + tile(u.reported, "denúncias", 1) + tile(when(u.created_at), "conta criada") + '</div>' +
      '<h3>XP</h3><p class="note">App: ' + u.xp + ' XP · ajuste do admin: <b>' + (u.adj > 0 ? "+" : "") + u.adj + '</b> · total <b>' + total + '</b></p>' +
      '<div class="ad-acts">' + [-1000, -100, 100, 1000].map(n => '<button data-adxp="' + n + '">' + (n > 0 ? "+" : "") + n + '</button>').join("") + '<button data-adxp="0">Zerar ajuste</button></div>' +
      '<h3>Rank</h3><div class="ad-chips"><button data-adrk="" aria-pressed="' + !u.rk + '">Automático</button>' + RANKS.map(r => '<button data-adrk="' + r + '" aria-pressed="' + (u.rk === r) + '">' + r + '</button>').join("") + '</div>' +
      '<button class="btn primary block" data-adsave>Salvar XP e rank</button>' +
      '<h3>Conta</h3>' + (u.banned ? '<p class="note">Suspensa: ' + esc(u.ban_reason || "sem motivo") + '</p><button class="btn block" data-adban="0">✅ Reativar conta</button>'
        : '<input id="adWhy" type="text" maxlength="200" placeholder="Motivo da suspensão (a pessoa vê)"><button class="btn block danger" data-adban="1">⛔ Suspender conta</button>') +
      '<div class="ad-acts"><button data-adsee="chat">💬 Mensagens</button><button data-adsee="posts">📸 Posts</button><button data-adadm="' + (u.is_admin ? 0 : 1) + '">' + (u.is_admin ? "Tirar admin" : "🛡️ Tornar admin") + '</button></div></div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") closeUser(); };
  }
  function closeUser() { cur = null; closeLayer(); render(); }
  async function act(fn, args, msg) {
    try { await Net.rpc(fn, args); toast(msg); return true; } catch (e) { toast(e.message); return false; }
  }

  /* ---------- confirmar ações que apagam ---------- */
  function confirmSheet(txt, ok) {
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet fd-msheet"><b class="fd-mt">' + esc(txt) + '</b><button class="danger" data-adyes>Sim, apagar</button><button class="ghost" data-adno>Cancelar</button></div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim" || e.target.closest("[data-adno]")) { closeLayer(); return; } if (e.target.closest("[data-adyes]")) { closeLayer(); ok(); } };
  }
  function showImg(src) {
    const el = document.createElement("div"); el.className = "ch-view";
    el.innerHTML = '<img alt="" src="' + esc(src) + '"><button aria-label="Fechar">✕</button>';
    el.onclick = () => { el.classList.add("out"); setTimeout(() => el.remove(), 200); };
    document.body.appendChild(el);
  }
  async function showComments(pid) {
    try {
      const l = await Net.rpc("admin_comments", { pid });
      $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet ad-sheet"><div class="row between"><h2>Comentários</h2><button class="roundbtn" data-adclose aria-label="Fechar">' + IC.x + '</button></div>' +
        (l.length ? l.map(c => '<div class="ad-msg"><div class="row between"><b>' + esc(c.name || "?") + '</b><span class="note">' + when(c.created_at) + '</span></div><p>' + esc(c.body) + '</p><div class="ad-acts"><button class="danger" data-addel="comment:' + c.id + '" data-adpid="' + pid + '">🗑️</button></div></div>').join("") : '<p class="note">Sem comentários.</p>') + '</div></div>';
      $("#scrim").onclick = e => { if (e.target.id === "scrim") closeUser(); };
    } catch (e) { toast(e.message); }
  }

  document.addEventListener("submit", e => {
    if (!e.target.closest("[data-adsearch]")) return;
    e.preventDefault(); A.q = $("#adQ").value.trim(); reload("users"); render();
  });
  document.addEventListener("click", async e => {
    const t = e.target, $t = s => t.closest(s);
    if (!$t(".ad") && !$t(".ad-sheet") && !$t("#scrim")) return;
    let b;
    if ($t("[data-adclose]")) { closeUser(); return; }
    if ($t("[data-adreload]")) { reload(A.sec); render(); return; }
    if ((b = $t("[data-adsec]"))) { A.sec = b.dataset.adsec; if (A.sec !== "chat" && A.sec !== "posts") A.uid = null; render(); return; }
    if ((b = $t("[data-adgid]"))) { A.gid = b.dataset.adgid || null; reload("chat"); render(); return; }
    if ((b = $t("[data-aduid]"))) { A.uid = null; reload(A.sec); render(); return; }
    if ((b = $t("[data-adsee]"))) { A.uid = cur.id; A.gid = null; A.sec = b.dataset.adsee; delete A.data[A.sec]; closeUser(); return; }
    if ((b = $t("[data-aduser]"))) { openUser(b.dataset.aduser); return; }
    if ((b = $t("[data-adimg]"))) { try { const src = await Net.rpc("admin_message_img", { mid: +b.dataset.adimg }); if (src) showImg(src); else toast("A foto já foi apagada"); } catch (er) { toast(er.message); } return; }
    if ((b = $t("[data-adcoms]"))) { showComments(+b.dataset.adcoms); return; }
    if ((b = $t("[data-adresolve]"))) { if (await act("admin_resolve", { rid: +b.dataset.adresolve }, "Denúncia resolvida")) { A.data.reports = (A.data.reports || []).filter(r => r.id !== +b.dataset.adresolve); render(); } return; }
    if ((b = $t("[data-adhide]"))) {
      const [pid, on] = b.dataset.adhide.split(":");
      if (await act("admin_hide_post", { pid: +pid, on_: on === "1" }, on === "1" ? "Post ocultado" : "Post visível de novo")) { const p = (A.data.posts || []).find(x => x.id === +pid); if (p) p.hidden = on === "1"; render(); }
      return;
    }
    if ((b = $t("[data-addel]"))) {
      const [kind, rid] = b.dataset.addel.split(":"), rep = b.dataset.adrep, pid = b.dataset.adpid;
      confirmSheet("Apagar " + (KIND[kind] || "grupo").toLowerCase() + (kind === "group" ? " e todas as mensagens dele" : "") + "? Não dá para desfazer.", async () => {
        try {
          const img = await Net.rpc("admin_delete", { kind, rid });
          if (img) Net.removeObj(img).catch(() => {});
          if (rep) await Net.rpc("admin_resolve", { rid: +rep }).catch(() => {});
          toast("Apagado");
          if (kind === "comment" && pid) { showComments(+pid); delete A.data.posts; return; }
          if (kind === "group") A.gid = null;
          ["reports", "chat", "posts", "geral"].forEach(k => delete A.data[k]);
          render();
        } catch (er) { toast(er.message); }
      });
      return;
    }
    if (!cur) return;
    if ((b = $t("[data-adxp]"))) { const n = +b.dataset.adxp; cur.adj = n ? cur.adj + n : 0; drawUser(); return; }
    if ((b = $t("[data-adrk]"))) { cur.rk = b.dataset.adrk; drawUser(); return; }
    if ($t("[data-adsave]")) {
      if (await act("admin_set_rank", { uid: cur.id, adj: cur.adj, rk: cur.rk }, "XP e rank salvos")) { cur.xp_adj = cur.adj; cur.rank_override = cur.rk || null; if (cur.rk) cur.rank = cur.rk; delete A.data.log; drawUser(); }
      return;
    }
    if ((b = $t("[data-adban]"))) {
      const on = b.dataset.adban === "1", why = on ? ($("#adWhy").value.trim() || "Violou as regras do app") : "";
      if (await act("admin_ban", { uid: cur.id, on_: on, why }, on ? "Conta suspensa" : "Conta reativada")) { cur.banned = on; cur.ban_reason = why; delete A.data.geral; delete A.data.log; drawUser(); }
      return;
    }
    if ((b = $t("[data-adadm]"))) {
      const on = b.dataset.adadm === "1";
      if (await act("admin_set_admin", { uid: cur.id, on_: on }, on ? "Agora é admin" : "Acesso de admin removido")) { cur.is_admin = on; drawUser(); }
    }
  });

  // confere ao abrir o app e quando a conta muda
  setTimeout(check, 1500);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
})();
