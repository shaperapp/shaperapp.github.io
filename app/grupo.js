/* Shaper · ranking entre amigos
   Grupos de até 25 pessoas, pódio da semana/geral, feed do que cada um treinou e o
   desafio surpresa do grupo (XP em dobro com prova). A prova original fica só no celular;
   o servidor guarda uma prévia pequena que se apaga sozinha em 10 minutos. */
(function () {
  "use strict";
  const G = { groups: [], cur: localStorage.getItem("shaper.grp") || "", board: [], chal: [], proofs: [], done: [], mode: "week", loaded: false, err: "" };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
  const iso = () => new Date().toISOString();
  const me = () => Net.user() && Net.user().id;
  const KIND = { workout: "🏋️", daily: "✅", mission: "⚡", boss: "⚔️", level: "⬆️", title: "🏅", pen: "☠️", group: "👥" };

  IC.rank = '<svg class="i" viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>';
  IC.grupo = '<svg class="i" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2A5 5 0 0 1 21 19"/></svg>';

  function cur() { return G.groups.find(g => g.id === G.cur) || G.groups[0] || null; }
  function activeChal(gid) { const n = Date.now(); return G.chal.find(c => c.group_id === gid && Date.parse(c.starts_at) <= n && Date.parse(c.ends_at) > n) || null; }
  function didChal(cid) { return !!(S.sys && S.sys.gdone && S.sys.gdone[cid]) || G.done.some(d => d.challenge_id === cid && d.user_id === me()); }
  const hh = h => String(h).padStart(2, "0") + "h";

  /* ---------- dados ---------- */
  let syncing = false;
  async function grpSync(force) {
    if (!Net.on() || !Net.user() || syncing) return;
    syncing = true;
    try {
      const m = await Net.sel("members", "select=group_id,groups(id,name,code,owner,win_start,win_end)&user_id=eq." + me());
      G.groups = (m || []).map(x => x.groups).filter(Boolean);
      if (!G.groups.some(g => g.id === G.cur)) G.cur = G.groups[0] ? G.groups[0].id : "";
      const ids = G.groups.map(g => g.id);
      G.chal = ids.length ? await Net.sel("challenges", "select=*&group_id=in.(" + ids.join(",") + ")&ends_at=gt." + iso() + "&order=starts_at") : [];
      // Android agenda o alarme de cada desafio para avisar mesmo com o app fechado
      nat("setGroupChallenges", JSON.stringify(G.chal.filter(c => !didChal(c.id)).map(c => ({
        id: c.id, g: (G.groups.find(g => g.id === c.group_id) || {}).name || "Grupo", t: c.title, d: c.descr, xp: c.xp * 2, s: Date.parse(c.starts_at), e: Date.parse(c.ends_at)
      }))));
      const g = cur();
      if (g) {
        G.board = await Net.rpc("leaderboard", { g: g.id }) || [];
        if (window.chatPeek) await chatPeek(g);
        // resumo para o widget do grupo na tela inicial
        const wk = G.board.slice().sort((x, y) => y.week_xp - x.week_xp || y.xp - x.xp), mi = wk.findIndex(p => p.user_id === me());
        nat("setGroupWidget", JSON.stringify({ name: g.name, pos: mi + 1 || 1, count: wk.length, leader: wk[0] ? wk[0].name : "", myXp: mi >= 0 ? wk[mi].week_xp : 0 }));
        const a = activeChal(g.id);
        if (a) {
          G.proofs = await Net.sel("proofs", "select=id,user_id,kind,preview,expires_at&challenge_id=eq." + a.id + "&expires_at=gt." + iso() + "&order=created_at.desc");
          G.done = await Net.sel("challenge_done", "select=challenge_id,user_id&challenge_id=eq." + a.id);
        } else { G.proofs = []; G.done = []; }
      } else { G.board = []; nat("setGroupWidget", ""); }
      G.err = "";
    } catch (e) { G.err = e.message; }
    finally { syncing = false; G.loaded = true; }
    if (tab === "grupo" && !$("#layer").innerHTML) render();
    refreshChal();
  }
  window.grpSync = grpSync;
  window.grpCtx = () => ({ g: cur(), board: G.board, me: me() });

  /* ---------- tela ---------- */
  const avatar = (p, cls) => window.netAvatar(p, cls);

  /* formulários de criar/entrar (estado guardado em G para sobreviver aos redesenhos) */
  G.form = "create"; G.name = ""; G.code = ""; G.w = { g: [18, 21] };
  const WINS = [[6, 9, "Manhã"], [11, 14, "Almoço"], [15, 18, "Tarde"], [18, 21, "Noite"], [20, 23, "Madrugada"]];
  const opts = (a, b, v) => { let s = ""; for (let h = a; h <= b; h++) s += '<option value="' + h + '"' + (h === v ? " selected" : "") + '>' + hh(h) + '</option>'; return s; };
  function winPick(p, w) {
    const [ws, we] = w;
    return '<div class="gc-win"><div class="gc-pre">' + WINS.map(x => '<button type="button" data-wpre="' + p + ':' + x[0] + ':' + x[1] + '" aria-pressed="' + (x[0] === ws && x[1] === we) + '"><b>' + x[2] + '</b><small>' + hh(x[0]) + '–' + hh(x[1]) + '</small></button>').join("") + '</div>' +
      '<div class="gc-tl"><i style="left:' + (ws / 24 * 100).toFixed(2) + '%;width:' + ((we - ws) / 24 * 100).toFixed(2) + '%"></i></div><div class="gc-tlx"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span></div>' +
      '<div class="gc-sel"><label>De<select id="' + p + 'Ws" data-wsel="' + p + '">' + opts(0, 23, ws) + '</select></label><label>até<select id="' + p + 'We" data-wsel="' + p + '">' + opts(1, 24, we) + '</select></label></div></div>';
  }
  const cells = (v, big) => '<span class="gc-cells' + (big ? " big" : "") + '">' + [0, 1, 2, 3, 4, 5].map(i => '<i' + (!big && i === v.length ? ' class="cur"' : "") + '>' + esc(v[i] || "") + '</i>').join("") + '</span>';
  function createForm() {
    return '<div class="gc-form"><label class="gc-lbl" for="gName">Nome do grupo</label><span class="gc-in"><span>👥</span><input id="gName" maxlength="30" placeholder="Ex.: Galera do shape" value="' + esc(G.name) + '"></span>' +
      '<span class="gc-lbl">Quando cai o desafio surpresa?</span>' + winPick("g", G.w.g) +
      '<p class="note">Todo dia, num horário sorteado dentro dessa janela, um desafio chega para todo o grupo ao mesmo tempo. Quem fizer com prova ganha XP em dobro.</p>' +
      '<button class="gc-go" data-gcreate>Criar grupo</button></div>';
  }
  function joinForm() {
    return '<div class="gc-form"><span class="gc-lbl">Código do convite</span><label class="gc-code"><input id="gCode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Código do convite" value="' + esc(G.code) + '">' + cells(G.code) + '</label>' +
      '<div class="gc-scan"><button type="button" data-gscan="camera">📷 Escanear QR</button><button type="button" data-gscan="gallery">🖼️ QR de uma foto</button></div>' +
      '<p class="note" style="text-align:center">Digite o código de 6 caracteres ou escaneie o QR code do grupo (pode ser um print que mandaram no WhatsApp).</p>' +
      '<button class="gc-go" data-gjoin' + (G.code.length === 6 ? "" : " disabled") + '>Entrar no grupo</button></div>';
  }
  function forms() {
    return '<div class="card gc-card"><div class="gc-tabs" data-f="' + G.form + '"><button data-gform="create" aria-pressed="' + (G.form === "create") + '">＋ Criar grupo</button><button data-gform="join" aria-pressed="' + (G.form === "join") + '"># Tenho um código</button></div>' +
      (G.form === "create" ? createForm() : joinForm()) + '</div>';
  }
  function moves(list) {
    const k = "shaper.pos." + G.cur + "." + G.mode, old = JSON.parse(localStorage.getItem(k) || "{}"), now = {};
    list.forEach((p, i) => { now[p.user_id] = i; });
    localStorage.setItem(k, JSON.stringify(now));
    return id => old[id] === undefined ? "" : old[id] > now[id] ? '<span class="rk-up">▲' + (old[id] - now[id]) + '</span>' : old[id] < now[id] ? '<span class="rk-down">▼' + (now[id] - old[id]) + '</span>' : "";
  }
  function proofHTML(p) {
    let fr = [];
    try { fr = JSON.parse(p.preview); } catch (e) {}
    if (!Array.isArray(fr)) fr = [];
    const who = G.board.find(b => b.user_id === p.user_id) || {};
    return '<div class="pf" data-pfend="' + Date.parse(p.expires_at) + '"><div class="pf-media' + (p.kind === "video" ? " vid" + Math.min(fr.length, 4) : "") + '">' +
      fr.slice(0, 4).map((f, i) => '<img alt="" src="' + esc(f) + '" style="--k:' + i + '">').join("") +
      '<div class="pf-cd">🔒 apaga em <b data-cd="' + Date.parse(p.expires_at) + '">--:--</b></div>' + (p.kind === "video" ? '<span class="pf-tag">▶ vídeo</span>' : "") + '</div>' +
      '<div class="pf-foot">' + avatar(who, "sm") + '<b>' + esc(who.name || "Amigo") + '</b><span class="muted">' + (p.kind === "video" ? "vídeo" : "foto") + '</span></div></div>';
  }
  function vRank() {
    if (!Net.on()) return '<div class="stack"><div><div class="greet">Entre amigos</div><h1>Grupo</h1></div><div class="card"><p class="note">O servidor do ranking ainda não foi configurado neste app.</p></div></div>';
    if (!Net.user()) return '<div class="stack"><div><div class="greet">Entre amigos</div><h1>Grupo</h1></div><div class="rk-hero"><div class="rk-trophy">🏆</div><h2>Compita com até 25 amigos</h2><p>Pódio da semana, treinos de cada um e desafios surpresa com XP em dobro.</p><button class="btn primary block" data-login>Entrar ou criar conta</button></div></div>';
    const head = '<div><div class="greet">Entre amigos</div><h1>Grupo</h1></div>';
    if (!G.loaded) { grpSync(); return '<div class="stack">' + head + '<div class="card rk-skel"></div><div class="card rk-skel" style="height:220px"></div></div>'; }
    const err = G.err ? '<div class="card" style="border-color:var(--danger)"><p class="note">' + esc(G.err) + '</p></div>' : "";
    const g = cur();
    if (!g) return '<div class="stack">' + head + err +
      '<div class="rk-hero gc-hero"><div class="gc-orbit"><span>💪</span><span>🔥</span><span>🏆</span><span>⚡</span><span>🐺</span></div><h2>Monte seu grupo</h2><p>Até 25 amigos no mesmo ranking, com desafios surpresa que valem XP em dobro.</p>' +
      '<div class="gc-steps"><span><b>1</b>Crie o grupo</span><span><b>2</b>Mande o QR ou código</span><span><b>3</b>Disputem o topo</span></div>' +
      '<button class="gc-qrbig" data-gscan="camera"><span>▦</span>Escanear QR code para entrar</button></div>' + forms() + '</div>';

    const owner = g.owner === me(), ac = activeChal(g.id), list = G.board.slice().sort((a, b) => G.mode === "week" ? b.week_xp - a.week_xp || b.xp - a.xp : b.xp - a.xp), mv = moves(list);
    const val = p => G.mode === "week" ? p.week_xp : p.xp;
    const pod = [list[1], list[0], list[2]].map((p, i) => p ? '<button class="pod p' + [2, 1, 3][i] + (p.user_id === me() ? " me" : "") + '" data-gmember="' + p.user_id + '">' + ([2, 1, 3][i] === 1 ? '<span class="crown">👑</span>' : "") + avatar(p, "lg") +
      '<b class="pod-name">' + esc(p.name) + '</b><span class="pod-xp">' + val(p) + ' XP</span><div class="pod-col"><span>' + [2, 1, 3][i] + '</span></div></button>' : '<div class="pod p' + [2, 1, 3][i] + ' empty"><div class="pod-col"><span>' + [2, 1, 3][i] + '</span></div></div>').join("");
    const rows = list.map((p, i) => '<button class="rk-row' + (p.user_id === me() ? " me" : "") + '" data-gmember="' + p.user_id + '" style="--d:' + Math.min(i, 12) * 35 + 'ms"><span class="rk-pos">' + (i + 1) + '</span>' + avatar(p) +
      '<span class="rk-who"><b>' + esc(p.name) + (p.user_id === me() ? ' <i>você</i>' : "") + '</b><span>Rank ' + esc(p.rank) + ' · Nv ' + p.level + ' · 🔥 ' + p.streak + ' · ' + p.workouts + ' treinos</span></span>' +
      '<span class="rk-xp">' + val(p) + '<small>XP</small>' + mv(p.user_id) + '</span></button>').join("");
    const leader = list[0] && list[0].user_id === me() && val(list[0]) > 0 ? '<div class="rk-lead">👑 Você lidera ' + (G.mode === "week" ? "a semana" : "o grupo") + '!</div>' : "";
    const chal = ac ? '<div class="rk-chal" data-end="' + Date.parse(ac.ends_at) + '"><div class="sys-lbl" style="color:var(--sysgold)">⚔ DESAFIO SURPRESA DO GRUPO · XP EM DOBRO</div><h2>' + esc(ac.title) + '</h2><p>' + esc(ac.descr) + '</p>' +
      '<div class="row between"><span>Termina em <b data-cd="' + Date.parse(ac.ends_at) + '">--:--</b></span><span>' + G.done.length + '/' + G.board.length + ' fizeram</span></div>' +
      (didChal(ac.id) ? '<div class="pill live">✓ Você já fez · +' + ac.xp * 2 + ' XP</div>' : '<button class="sys-btn solid" data-gch="' + ac.id + '">Fazer agora · +' + ac.xp * 2 + ' XP</button>') + '</div>'
      : '<div class="card rk-next"><span>⏳</span><div><b>Próximo desafio surpresa</b><span class="note">Chega sem aviso entre ' + hh(g.win_start) + ' e ' + hh(g.win_end) + '. Fique de olho!</span></div></div>';
    const proofs = ac && G.proofs.length ? '<div class="sec"><div class="sechead"><h3>Provas do desafio</h3><span>' + G.proofs.length + '</span></div><p class="note">🔒 Por segurança e privacidade, cada prova é apagada do servidor em 10 minutos. A foto ou o vídeo original fica só no celular de quem enviou.</p><div class="pf-grid">' + G.proofs.map(proofHTML).join("") + '</div></div>' : "";

    return v2(g, owner, ac, list, val, mv, err, proofs);
  }

  /* ---------- visual novo (v2.14): igual ao esboço ---------- */
  const SVG = p => '<svg viewBox="0 0 24 24" class="g2i" aria-hidden="true">' + p + '</svg>';
  const GI = {
    users: SVG('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5"/>'),
    chat: SVG('<path d="M4 5h16v11H9l-5 4z"/>'), plus: SVG('<path d="M12 5v14M5 12h14"/>'),
    gear: SVG('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>'),
    bolt: SVG('<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>'), img: SVG('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="9" cy="9.5" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>'),
    clock: SVG('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>')
  };
  G.set = false;
  function v2(g, owner, ac, list, val, mv, err, proofs) {
    const n = G.board.length;
    const head = '<div class="row between"><h1>Grupo</h1><span class="g2-pill">' + G.groups.length + ' grupo' + (G.groups.length > 1 ? "s" : "") + '</span></div>';
    const sel = G.groups.length > 1 ? '<div class="g2-seg" style="grid-template-columns:repeat(' + Math.min(G.groups.length, 4) + ',1fr)">' + G.groups.map(x => '<button data-gsel="' + x.id + '" class="' + (x.id === g.id ? "on" : "") + '">' + esc(x.name) + '</button>').join("") + '</div>' : "";
    const card = '<div class="g2-card"><div class="g2-top"><span class="g2-ib">' + GI.users + '</span><div class="g2-tt"><b>' + esc(g.name) + '</b><small>' + n + ' pessoa' + (n === 1 ? "" : "s") + ' · código ' + esc(g.code) + '</small></div><button class="g2-qr" data-gqr="' + esc(g.code) + '">QR</button></div>' +
      '<div class="g2-acts"><button data-chopen>' + GI.chat + 'Chat</button><button data-gshare="' + esc(g.code) + '">' + GI.plus + 'Convidar</button><button data-gset>' + GI.gear + 'Ajustes</button></div></div>';
    const chal = ac
      ? '<div class="g2-chal on" data-end="' + Date.parse(ac.ends_at) + '"><span class="g2-ib">' + GI.bolt + '</span><div class="g2-tt"><b>' + esc(ac.title) + '</b><small>' + esc(ac.descr) + ' · ' + G.done.length + '/' + n + ' fizeram</small></div><b class="g2-cd" data-cd="' + Date.parse(ac.ends_at) + '">--:--</b></div>' +
        (didChal(ac.id) ? '<div class="g2-ok">✓ Você já fez · +' + ac.xp * 2 + ' XP</div>' : '<button class="g2-go" data-gch="' + ac.id + '">' + GI.bolt + 'Fazer agora · +' + ac.xp * 2 + ' XP</button>')
      : '<div class="g2-chal"><span class="g2-ib">' + GI.bolt + '</span><div class="g2-tt"><b>Desafio surpresa hoje</b><small>Entre ' + hh(g.win_start) + ' e ' + hh(g.win_end) + ' · XP em dobro</small></div><b class="g2-cd">' + GI.clock + '</b></div>';
    const rows = list.map((p, i) => '<button class="g2-row' + (p.user_id === me() ? " me" : "") + '" data-gmember="' + p.user_id + '"><b class="g2-pos">' + (i + 1) + '</b>' + avatar(p, "sm") +
      '<span class="g2-who"><b>' + esc(p.user_id === me() ? "Você" : p.name) + '</b><small>' + p.workouts + ' treino' + (p.workouts === 1 ? "" : "s") + ' · Rank ' + esc(p.rank) + '</small></span><b class="g2-xp">' + val(p) + ' XP' + mv(p.user_id) + '</b></button>').join("");
    const board = '<div class="g2-box"><div class="row between"><b class="g2-h">' + (G.mode === "week" ? "Semana do grupo" : "Ranking geral") + '</b><button class="g2-link" data-gmode="' + (G.mode === "week" ? "all" : "week") + '">' + (G.mode === "week" ? "termina domingo · ver geral" : "ver semana") + '</button></div>' +
      '<div class="g2-list">' + (rows || '<p class="note">Ninguém treinou ainda.</p>') + '</div></div>';
    const cp = window.chatPrev ? chatPrev(g) : null;
    const chat = '<button class="g2-box g2-chat" data-chopen><div class="row between"><b class="g2-h">Chat</b><span class="muted" style="font-size:.82rem">' + (cp && cp.unread ? cp.unread + " nova" + (cp.unread > 1 ? "s" : "") + " · " : "") + 'some em 24 h</span></div>' +
      (cp && cp.text ? '<div class="g2-msg' + (cp.mine ? " mine" : "") + '">' + (cp.mine ? "" : '<small>' + esc(cp.who) + '</small>') + '<span>' + (cp.photo ? "📷 " : "") + esc(cp.text) + '</span></div>' : '<p class="note" style="margin:8px 0 0">Mande a primeira mensagem para o grupo.</p>') +
      '<div class="g2-in"><span>Mensagem…</span>' + GI.img + '</div></button>';
    const set = '<div class="g2-box g2-set" id="gSet"' + (G.set ? "" : " hidden") + '><b class="g2-h">Ajustes do grupo</b>' +
      '<div class="g2-acts" style="margin-top:10px"><button data-gcopy="' + esc(g.code) + '">Copiar código</button><button data-gqr="' + esc(g.code) + '">QR code</button></div>' +
      (owner ? '<span class="gc-lbl" style="margin-top:12px;display:block">Horário dos desafios</span><div class="gc-form">' + winPick("e", G.w.e && G.w.eid === g.id ? G.w.e : [g.win_start, g.win_end]) + '<button class="gc-go" data-gwin>Salvar horário</button></div>' : "") +
      '<button class="btn ghost danger block" style="margin-top:12px" data-gleave>' + (owner ? "Excluir este grupo" : "Sair do grupo") + '</button></div>';
    const other = '<div class="g2-two"><button data-gnew="create">' + GI.plus + 'Criar grupo</button><button data-gnew="join">Tenho um código</button></div>' +
      (G.other ? '<div class="g2-box">' + forms().replace('class="card gc-card"', 'class="gc-card"') + '</div>' : "");
    return '<div class="stack g2">' + head + err + sel + card + set + chal + board + chat + highlights() + proofs + other + '</div>';
  }
  document.addEventListener("click", e => {
    if (e.target.closest("[data-gset]")) { G.set = !G.set; const s = $("#gSet"); if (s) { s.hidden = !G.set; if (G.set) s.scrollIntoView({ behavior: "smooth", block: "nearest" }); } return; }
    const nw = e.target.closest("[data-gnew]");
    if (nw) { G.other = true; G.form = nw.dataset.gnew; render(); setTimeout(() => { const f = document.querySelector(".g2 .gc-card"); if (f) f.scrollIntoView({ behavior: "smooth", block: "center" }); }, 80); }
  });
  (window.EXTRA_VIEWS = window.EXTRA_VIEWS || {}).grupo = vRank; // aba Grupo (o Ranking geral fica em ranking.js)

  /* ---------- perfil de um amigo ---------- */
  async function openMember(uid) {
    const p = G.board.find(b => b.user_id === uid);
    if (!p) return;
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet"><div class="row between"><div class="row">' + avatar(p, "lg") + '<div><h2>' + esc(p.name) + '</h2><div class="muted">' + esc(p.title || "Rank " + p.rank) + '</div></div></div><button class="roundbtn" data-gclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<div class="tiles"><div class="tile"><b>' + p.rank + '</b><span>rank · nv ' + p.level + '</span></div><div class="tile"><b>' + p.workouts + '</b><span>treinos</span></div><div class="tile"><b>' + p.streak + '</b><span>dias seguidos</span></div></div>' +
      '<div class="tiles"><div class="tile"><b>' + p.xp + '</b><span>XP total</span></div><div class="tile"><b>' + p.week_xp + '</b><span>XP semana</span></div><div class="tile"><b>' + p.missions + '</b><span>missões</span></div></div>' +
      '<h3>Últimas atividades</h3><div id="gAct" class="rk-feed"><p class="note">Carregando…</p></div>' + modHTML(p) + '</div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") closeLayer(); };
    try {
      const a = await Net.sel("activities", "select=kind,title,xp,created_at&user_id=eq." + uid + "&order=created_at.desc&limit=25");
      const el = $("#gAct");
      if (el) el.innerHTML = a.length ? a.map(x => '<div><span class="ic">' + (KIND[x.kind] || "•") + '</span><span class="t">' + esc(x.title) + '<small>' + ago(x.created_at) + '</small></span>' + (x.xp ? '<b>+' + x.xp + '</b>' : "") + '</div>').join("") : '<p class="note">Nenhuma atividade ainda.</p>';
    } catch (e) { const el = $("#gAct"); if (el) el.innerHTML = '<p class="note">' + esc(e.message) + '</p>'; }
  }
  // conquistas do grupo calculadas do ranking: quem mais se destacou
  function highlights() {
    const b = G.board;
    if (b.length < 2) return "";
    const top = k => b.slice().sort((x, y) => (y[k] || 0) - (x[k] || 0))[0];
    const cards = [["👑", "Rei da semana", "week_xp", " XP"], ["🔥", "Mais constante", "streak", " dias seguidos"], ["🏋️", "Mais treinos", "workouts", " treinos"], ["⚡", "Caçador de missões", "missions", " missões"]]
      .map(([ic, t, k, u]) => { const p = top(k); return p && p[k] > 0 ? '<div><span>' + ic + '</span><b>' + esc(p.name) + (p.user_id === me() ? " (você)" : "") + '</b><small>' + t + ' · ' + p[k] + u + '</small></div>' : ""; }).join("");
    if (!cards) return "";
    const sum = b.reduce((a, p) => a + (p.week_xp || 0), 0);
    return '<div class="sec"><div class="sechead"><h3>Destaques da semana</h3></div><div class="gx"><div class="gx-sum"><span>📊</span><b>O grupo somou ' + sum + ' XP esta semana</b><small>' + b.length + ' pessoas competindo</small></div>' + cards + '</div></div>';
  }

  // moderação no perfil do amigo: denunciar, bloquear e (dono) remover do grupo
  function modHTML(p) {
    if (p.user_id === me()) return "";
    const g = cur(), owner = g && g.owner === me(), bl = window.chatBlocks ? chatBlocks().ids.includes(p.user_id) : false;
    return '<div class="gm-mod"><button data-gmrep="' + p.user_id + '">🚩 Denunciar perfil</button><button data-gmblock="' + p.user_id + '" data-on="' + (bl ? 0 : 1) + '">' + (bl ? "✅ Desbloquear" : "🚫 Bloquear") + '</button>' +
      (owner ? '<button class="danger" data-gmkick="' + p.user_id + '">👋 Remover do grupo</button>' : "") + '</div>';
  }
  document.addEventListener("click", async e => {
    const t = e.target, rep = t.closest("[data-gmrep]"), blk = t.closest("[data-gmblock]"), kick = t.closest("[data-gmkick]");
    if (!rep && !blk && !kick) return;
    const uid = (rep || blk || kick).getAttribute(rep ? "data-gmrep" : blk ? "data-gmblock" : "data-gmkick"), p = G.board.find(b => b.user_id === uid) || { name: "Amigo" };
    if (rep) {
      const box = t.closest(".gm-mod");
      box.innerHTML = '<b style="grid-column:1/-1">Por que você está denunciando ' + esc(p.name) + '?</b>' + ["Ofensivo ou assédio", "Perfil falso", "Nudez ou conteúdo sexual", "Spam ou golpe", "Outro motivo"].map(r => '<button data-gmwhy="' + r + '" data-u="' + uid + '">' + r + '</button>').join("");
      return;
    }
    if (blk && window.chatBlock) { if (await chatBlock(uid, p.name, blk.dataset.on === "1")) openMember(uid); return; }
    if (kick) {
      if (kick.dataset.sure !== "1") { kick.dataset.sure = "1"; kick.textContent = "Toque de novo para remover"; return; }
      closeLayer();
      run(() => Net.del("members", "group_id=eq." + cur().id + "&user_id=eq." + uid), p.name + " foi removido do grupo");
    }
  });
  document.addEventListener("click", e => { const w = e.target.closest("[data-gmwhy]"); if (w && window.chatReport) { closeLayer(); chatReport(null, w.dataset.u, w.dataset.gmwhy); } });

  function ago(t) {
    const m = Math.round((Date.now() - Date.parse(t)) / 60000);
    return m < 1 ? "agora" : m < 60 ? "há " + m + " min" : m < 1440 ? "há " + Math.round(m / 60) + " h" : "há " + Math.round(m / 1440) + " d";
  }

  /* ---------- desafio do grupo com prova ---------- */
  let CH = null; // { c, step, proof }
  function chalHTML() {
    const c = CH.c;
    const media = CH.proof ? '<div class="pf-media big' + (CH.proof.kind === "video" ? " vid" + Math.min(CH.proof.frames.length, 4) : "") + '">' + CH.proof.frames.slice(0, 4).map((f, i) => '<img alt="" src="' + f + '" style="--k:' + i + '">').join("") + '</div>' : "";
    return '<div class="sys-win"><div class="sys-top"><span class="sys-lbl" style="color:var(--sysgold)">[ Desafio do grupo ]</span><button class="sys-x" data-gclose aria-label="Fechar">✕</button></div>' +
      '<div class="sys-panel gold"><h4>⚔ XP EM DOBRO · +' + c.xp * 2 + ' XP</h4><h2 style="font-family:var(--display);font-size:1.6rem;color:#fff;margin:0">' + esc(c.title) + '</h2><p style="color:#fff">' + esc(c.descr) + '</p>' +
      '<div class="sys-timer" style="font-size:2.6rem" data-cd="' + Date.parse(c.ends_at) + '">--:--</div><p class="sys-lbl" style="text-align:center">tempo para enviar a prova</p></div>' +
      (CH.step === 0 ? '<div class="sys-panel"><h4>1 · CONFIRMAÇÃO</h4><p>Para valer XP em dobro você precisa confirmar que está fazendo agora e enviar uma foto ou um vídeo curto como prova.</p><button class="sys-btn solid" data-gstep="1">Confirmo: estou fazendo agora</button></div>'
        : CH.step === 1 ? '<div class="sys-panel"><h4>2 · PROVA</h4><p>Grave você fazendo o exercício. O original fica salvo só no seu celular.</p><div class="sys-row"><button class="sys-btn solid" data-gcap="video">🎥 Vídeo (até 15 s)</button><button class="sys-btn" data-gcap="photo">📷 Foto</button></div></div>'
          : '<div class="sys-panel"><h4>3 · ENVIAR</h4>' + media + '<p>🔒 Por segurança e privacidade, o grupo vê só esta prévia por 10 minutos e ela é apagada automaticamente.</p><div class="sys-row"><button class="sys-btn" data-gstep="1">Refazer</button><button class="sys-btn solid" data-gsend>Enviar prova</button></div></div>') + '</div>';
  }
  function drawChal() {
    const el = document.querySelector(".sys-screen.gch");
    if (el) window.fxMorph(el, chalHTML());
    else $("#layer").innerHTML = '<div class="sys-screen gch" id="scrim">' + chalHTML() + '</div>';
    tickCd();
  }
  function openChal(id) {
    const n = Date.now();
    const c = (id && G.chal.find(x => x.id === id)) || G.chal.find(x => Date.parse(x.starts_at) <= n && Date.parse(x.ends_at) > n && !didChal(x.id));
    if (!c) { toast("Nenhum desafio do grupo agora"); return; }
    if (didChal(c.id)) { toast("Você já fez este desafio"); return; }
    if (Date.parse(c.ends_at) <= Date.now()) { toast("Este desafio já terminou"); return; }
    CH = { c, step: 0, proof: null };
    drawChal();
    say("Desafio do grupo. " + c.descr);
  }
  window.grpOpenChallenge = id => {
    if (!Net.user()) return;
    const go = () => openChal(id);
    G.chal.length ? go() : grpSync().then(go);
  };
  function refreshChal() { if (CH && document.querySelector(".sys-screen.gch")) drawChal(); }

  // retorno da câmera (Android) com a prévia já reduzida
  window.proofReady = function (j) {
    if (!CH) return;
    let p = null;
    try { p = typeof j === "string" ? JSON.parse(j) : j; } catch (e) {}
    if (!p || !p.frames || !p.frames.length) { toast("Não foi possível usar a gravação"); return; }
    CH.proof = p; CH.step = 2; drawChal();
  };
  function capture(kind) {
    if (NATIVE) { nat("captureProof", kind); return; }
    const inp = document.createElement("input"); // navegador: só foto
    inp.type = "file"; inp.accept = "image/*"; inp.setAttribute("capture", "environment");
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = im.width * k; c.height = im.height * k; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); window.proofReady({ kind: "photo", frames: [c.toDataURL("image/jpeg", .6)] }); }; im.src = fr.result; };
      fr.readAsDataURL(f);
    };
    inp.click();
  }
  async function sendProof(btn) {
    const c = CH.c;
    btn.disabled = true; btn.textContent = "Enviando…";
    try {
      await Net.ins("proofs", { challenge_id: c.id, kind: CH.proof.kind, preview: JSON.stringify(CH.proof.frames.slice(0, 4)) });
      await Net.ins("challenge_done", { challenge_id: c.id, xp: c.xp * 2 });
      S.sys.gdone = S.sys.gdone || {}; S.sys.gdone[c.id] = 1;
      nat("groupChallengeDone", c.id);
      if (window.netLog) netLog("group", "Desafio do grupo: " + c.title, c.xp * 2);
      closeLayer(); CH = null;
      if (window.sysAddBonus) sysAddBonus(c.xp * 2, c.title); else save();
      grpSync(true);
    } catch (e) {
      toast(e.message); btn.disabled = false; btn.textContent = "Enviar prova";
    }
  }

  /* ---------- contagens regressivas (sem redesenhar a tela) ---------- */
  function tickCd() {
    const n = Date.now();
    document.querySelectorAll("[data-cd]").forEach(el => { el.textContent = mmss((+el.dataset.cd - n) / 1000); });
    document.querySelectorAll("[data-pfend]").forEach(el => { if (+el.dataset.pfend <= n) { el.classList.add("gone"); setTimeout(() => el.remove(), 400); } });
  }
  setInterval(tickCd, 1000);
  setInterval(() => { if (tab === "grupo" && !document.hidden && Net.user()) grpSync(); }, 30000);

  /* ---------- ações ---------- */
  async function run(fn, okMsg) {
    try { await fn(); if (okMsg) toast(okMsg); G.loaded = false; await grpSync(true); }
    catch (e) { toast(e.message); render(); }
  }
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-gclose]")) { CH = null; closeLayer(); render(); return; }
    const md = t.closest("[data-gmode]"); if (md) { G.mode = md.dataset.gmode; render(); return; }
    const sl = t.closest("[data-gsel]"); if (sl) { G.cur = sl.dataset.gsel; localStorage.setItem("shaper.grp", G.cur); G.loaded = false; render(); return; }
    const mb = t.closest("[data-gmember]"); if (mb) { openMember(mb.dataset.gmember); return; }
    const sh = t.closest("[data-gshare]");
    if (sh) { const txt = "Bora treinar comigo no Shaper! 💪 Entre no meu grupo: " + joinUrl(sh.dataset.gshare) + " (ou use o código " + sh.dataset.gshare + ")"; if (NATIVE) nat("share", txt); else { try { navigator.clipboard.writeText(txt); toast("Convite copiado"); } catch (er) { toast(sh.dataset.gshare); } } return; }
    const qb = t.closest("[data-gqr]"); if (qb) { showQr(qb.dataset.gqr); return; }
    const sc = t.closest("[data-gscan]");
    if (sc) {
      if (!Net.user()) { toast("Entre na sua conta primeiro"); if (window.netLogin) netLogin("in"); return; }
      if (sc.closest("#scrim")) closeLayer();
      if (sc.dataset.gscan === "camera" && window.qrLive) qrLive();
      else if (NATIVE) nat("scanQr", sc.dataset.gscan); else toast("A foto da galeria funciona no app Android");
      return;
    }
    const gf = t.closest("[data-gform]"); if (gf) { G.form = gf.dataset.gform; render(); if (G.form === "join") setTimeout(() => { const i = $("#gCode"); if (i) i.focus(); }, 50); return; }
    const wp = t.closest("[data-wpre]");
    if (wp) { const [p, a, b] = wp.dataset.wpre.split(":"); G.w[p] = [+a, +b]; if (p === "e") G.w.eid = cur().id; render(); return; }
    const cp0 = t.closest("[data-gcopy]");
    if (cp0) { copy(cp0.dataset.gcopy); return; }
    const busy = (b, txt) => { b.disabled = true; b.innerHTML = '<i class="auth-spin"></i>' + txt; };
    const cb = t.closest("[data-gcreate]");
    if (cb) {
      const n = G.name.trim(), [ws, we] = G.w.g;
      if (!n) { toast("Dê um nome ao grupo"); const i = $("#gName"); if (i) i.focus(); return; }
      if (we <= ws) { toast("O fim da janela precisa ser depois do início"); return; }
      busy(cb, "Criando…");
      run(async () => { const r = await Net.ins("groups", { name: n.slice(0, 30), win_start: ws, win_end: we }, true); if (r && r[0]) { G.cur = r[0].id; localStorage.setItem("shaper.grp", G.cur); G.name = ""; } }, "Grupo criado! Mande o código para os amigos.");
      return;
    }
    const jb = t.closest("[data-gjoin]");
    if (jb) {
      if (G.code.length !== 6) { toast("O código tem 6 letras/números"); return; }
      busy(jb, "Entrando…");
      run(async () => { const r = await Net.rpc("join_group", { code: G.code }); if (r && r.id) { G.cur = r.id; localStorage.setItem("shaper.grp", G.cur); G.code = ""; } }, "Você entrou no grupo!");
      return;
    }
    const wb = t.closest("[data-gwin]");
    if (wb) {
      const g = cur(), [ws, we] = G.w.e && G.w.eid === g.id ? G.w.e : [g.win_start, g.win_end];
      if (we <= ws) { toast("O fim da janela precisa ser depois do início"); return; }
      busy(wb, "Salvando…");
      run(() => Net.upd("groups", "id=eq." + g.id, { win_start: ws, win_end: we }).then(() => { G.w.e = null; }), "Horário dos desafios atualizado");
      return;
    }
    const lv = t.closest("[data-gleave]");
    if (lv) {
      const g = cur(), owner = g.owner === me();
      if (lv.dataset.sure !== "1") { lv.dataset.sure = "1"; lv.textContent = owner ? "Toque de novo para excluir o grupo" : "Toque de novo para sair"; return; }
      run(() => owner ? Net.del("groups", "id=eq." + g.id) : Net.del("members", "group_id=eq." + g.id + "&user_id=eq." + me()), owner ? "Grupo excluído" : "Você saiu do grupo");
      return;
    }
    const gc = t.closest("[data-gch]"); if (gc) { openChal(gc.dataset.gch); return; }
    if (!CH) return;
    const stp = t.closest("[data-gstep]"); if (stp) { CH.step = +stp.dataset.gstep; CH.proof = null; drawChal(); return; }
    const cp = t.closest("[data-gcap]"); if (cp) { capture(cp.dataset.gcap); return; }
    const sd = t.closest("[data-gsend]"); if (sd) sendProof(sd);
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && Net.user()) grpSync(); });

  // digitação: atualiza só o pedaço da tela que muda (sem redesenhar tudo a cada letra)
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.id === "gName") { G.name = t.value; return; }
    if (t.id === "gCode") {
      const v = t.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
      if (t.value !== v) t.value = v;
      G.code = v;
      const box = t.parentNode.querySelector(".gc-cells");
      if (box) box.outerHTML = cells(v);
      const b = document.querySelector("[data-gjoin]");
      if (b) b.disabled = v.length !== 6;
    }
  });
  document.addEventListener("change", e => {
    const p = e.target.dataset && e.target.dataset.wsel;
    if (!p) return;
    const ws = +$("#" + p + "Ws").value, we = +$("#" + p + "We").value;
    G.w[p] = [ws, we];
    if (p === "e") G.w.eid = cur().id;
    if (we <= ws) toast("O fim da janela precisa ser depois do início");
    render();
  });
  /* ---------- QR code do grupo ---------- */
  const JOIN = "https://shaperapp.github.io/entrar.html?c=";
  const joinUrl = code => JOIN + encodeURIComponent(code);
  function showQr(code) {
    const g = cur(), img = NATIVE ? nat("qrImage", joinUrl(code), 720) : "";
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet gq-sheet"><div class="row between"><h2>Convite do grupo</h2><button class="roundbtn" data-gclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<div class="gq-card"><b>' + esc(g ? g.name : "Grupo") + '</b>' +
      (img ? '<img class="gq-img" alt="QR code do grupo" src="' + img + '">' : '<div class="gq-img gq-none">QR code disponível no app Android</div>') +
      cells(code, true) + '<span>Aponte a câmera do celular ou use “Escanear QR” no Shaper</span></div>' +
      '<div class="gc-tacts" style="grid-template-columns:1fr 1fr"><button data-gcopy="' + esc(code) + '">Copiar código</button><button class="solid" data-gshare="' + esc(code) + '">Mandar convite</button></div>' +
      '<span class="gq-or">ou entre no grupo de outra pessoa</span><button class="gq-scan" data-gscan="camera">📷 Escanear QR de outro grupo</button></div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") closeLayer(); };
  }
  // código lido do QR (câmera/foto) ou link de convite aberto fora do app
  function codeFrom(txt) {
    const s = String(txt || "").trim(), m = s.match(/[?&]c=([A-Za-z0-9]{6})/) || s.match(/^([A-Za-z0-9]{6})$/);
    return m ? m[1].toUpperCase() : "";
  }
  // "Digitar código" no leitor: abre o formulário de código (dentro de "Outro grupo" se já tem grupo)
  window.grpTypeCode = () => {
    closeLayer(); tab = "grupo"; G.form = "join"; render(); scrollTo(0, 0);
    setTimeout(() => { const i = $("#gCode"); if (!i) return; const d = i.closest("details"); if (d) d.open = true; i.scrollIntoView({ block: "center", behavior: "smooth" }); i.focus(); }, 80);
  };
  window.qrScanned = txt => {
    const c = codeFrom(txt);
    if (!c) { toast("Esse QR não é de um grupo do Shaper"); return; }
    window.grpJoinLink(c);
  };
  window.grpJoinLink = code => {
    const c = codeFrom(code);
    if (!c) return;
    if (!Net.user()) { localStorage.setItem("shaper.joinCode", c); toast("Entre na sua conta para entrar no grupo " + c); if (window.netLogin) netLogin("in"); return; }
    if (G.groups.some(g => g.code === c)) { G.cur = G.groups.find(g => g.code === c).id; tab = "grupo"; render(); toast("Você já está neste grupo"); return; }
    closeLayer(); tab = "grupo"; G.form = "join"; G.code = c; render();
    run(async () => { const r = await Net.rpc("join_group", { code: c }); if (r && r.id) { G.cur = r.id; localStorage.setItem("shaper.grp", G.cur); G.code = ""; } }, "Você entrou no grupo! 🎉");
  };
  // convite aberto antes do login: entra assim que a conta estiver pronta
  setInterval(() => { const c = localStorage.getItem("shaper.joinCode"); if (c && Net.user() && G.loaded) { localStorage.removeItem("shaper.joinCode"); window.grpJoinLink(c); } }, 2000);

  function copy(code) {
    const done = () => toast("Código " + code + " copiado");
    try { navigator.clipboard.writeText(code).then(done, fallback); } catch (er) { fallback(); }
    function fallback() {
      const ta = document.createElement("textarea");
      ta.value = code; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (er) { toast(code); }
      ta.remove();
    }
  }

  render();
  if (Net.user()) grpSync();
})();
