/* Shaper · Feed: posts com texto e foto, curtidas e comentários
   As fotos vão para o Storage do Supabase (1280 px); o post guarda só o caminho.
   Cada post pode ser para todos ou só para quem está nos seus grupos. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PAGE = 15, SEL = "select=id,user_id,body,img_path,img_w,img_h,vis,likes,comments,created_at,profiles!posts_user_id_fkey(name,avatar,photo,rank,level)";
  const F = { scope: "all", posts: [], liked: new Set(), loaded: false, busy: false, end: false, err: "", at: 0, compose: null, open: null };
  const me = () => Net.user() && Net.user().id;
  const ago = t => { const m = Math.round((Date.now() - Date.parse(t)) / 60000); return m < 1 ? "agora" : m < 60 ? m + " min" : m < 1440 ? Math.round(m / 60) + " h" : m < 10080 ? Math.round(m / 1440) + " d" : new Date(t).toLocaleDateString("pt-BR"); };
  const who = p => Object.assign({ name: "Atleta", avatar: "💪", rank: "E", level: 1 }, p.profiles || {});

  /* ---------- dados ---------- */
  async function groupIds() {
    try { const r = await Net.sel("members", "select=user_id"); return [...new Set(r.map(x => x.user_id))]; } catch (e) { return []; }
  }
  async function load(more) {
    if (!Net.on() || !Net.user() || F.busy) return;
    F.busy = true;
    try {
      let q = SEL + "&hidden=eq.false&order=id.desc&limit=" + PAGE;
      if (more && F.posts.length) q += "&id=lt." + F.posts[F.posts.length - 1].id;
      if (F.scope === "groups") { const ids = await groupIds(); q += "&user_id=in.(" + (ids.length ? ids.join(",") : me()) + ")"; }
      const r = await Net.sel("posts", q);
      F.posts = more ? F.posts.concat(r.filter(p => !F.posts.some(x => x.id === p.id))) : r;
      F.end = r.length < PAGE;
      if (r.length) {
        const l = await Net.sel("likes", "select=post_id&user_id=eq." + me() + "&post_id=in.(" + r.map(p => p.id).join(",") + ")");
        l.forEach(x => F.liked.add(x.post_id));
      }
      F.err = ""; F.at = Date.now();
    } catch (e) { F.err = e.message; }
    F.busy = false; F.loaded = true;
    if (tab === "feed" && !$("#layer").innerHTML) render();
  }

  /* ---------- tela ---------- */
  function post(p) {
    const a = who(p), liked = F.liked.has(p.id), r = p.img_w && p.img_h ? (p.img_w / p.img_h).toFixed(3) : "1";
    return '<article class="fd-post" data-post="' + p.id + '"><header>' + window.netAvatar(a, "") +
      '<div class="fd-who"><b>' + esc(a.name) + (p.user_id === me() ? ' <i>você</i>' : "") + '</b><span>Rank ' + esc(a.rank) + ' · Nv ' + a.level + ' · ' + ago(p.created_at) + ' · ' + (p.vis === "groups" ? "👥 grupos" : "🌎 todos") + '</span></div>' +
      '<button class="fd-more" data-fdmenu="' + p.id + '" aria-label="Opções">⋯</button></header>' +
      (p.body ? '<p class="fd-body">' + esc(p.body) + '</p>' : "") +
      (p.img_path ? '<div class="fd-img" data-fdimg="' + p.id + '" style="aspect-ratio:' + r + '"><img loading="lazy" alt="" src="' + esc(Net.pubUrl(p.img_path)) + '"><i class="fd-heart">❤️</i></div>' : "") +
      '<footer><button class="fd-act' + (liked ? " on" : "") + '" data-fdlike="' + p.id + '"><span>' + (liked ? "❤️" : "🤍") + '</span><b>' + (p.likes || 0) + '</b></button>' +
      '<button class="fd-act" data-fdcom="' + p.id + '"><span>💬</span><b>' + (p.comments || 0) + '</b></button></footer></article>';
  }
  function vFeed() {
    const head = '<div class="row between"><div><div class="greet">Comunidade</div><h1>Feed</h1></div><button class="roundbtn" data-fdreload aria-label="Atualizar">↻</button></div>';
    if (!Net.on()) return '<div class="stack">' + head + '<div class="card"><p class="note">O servidor ainda não foi configurado.</p></div></div>';
    if (!Net.user()) return '<div class="stack">' + head + '<div class="rk-hero"><div class="rk-trophy">📸</div><h2>Mostre seu treino</h2><p>Poste fotos e conquistas, curta e comente o treino da galera.</p><button class="btn primary block" data-login>Entrar ou criar conta</button></div></div>';
    if (!F.loaded) { load(); }
    const a = window.netAcct ? netAcct() : {};
    return '<div class="stack fd">' + head +
      '<button class="fd-new" data-fdnew>' + window.netAvatar({ photo: a.photo, avatar: a.avatar, rank: (window.sysStats ? sysStats().rank : "E") }, "") + '<span>No que você está treinando hoje?</span><i>📸</i></button>' +
      '<div class="segs" role="group"><button data-fdscope="all" aria-pressed="' + (F.scope === "all") + '">🌎 Todos</button><button data-fdscope="groups" aria-pressed="' + (F.scope === "groups") + '">👥 Meus grupos</button></div>' +
      (F.err ? '<div class="card"><p class="note">' + esc(F.err) + '</p></div>' : "") +
      (!F.loaded ? '<div class="card rk-skel" style="height:320px"></div>' : F.posts.length ? F.posts.map(post).join("") +
        (F.end ? '<p class="note" style="text-align:center">Isso é tudo por enquanto 💪</p>' : '<button class="btn ghost block" data-fdmorebtn>' + (F.busy ? "Carregando…" : "Carregar mais") + '</button>')
        : '<div class="fd-empty"><span>📸</span><b>Nenhum post ainda</b><p>Seja o primeiro a mostrar o treino de hoje!</p></div>') +
      '<button class="fd-fab" data-fdnew aria-label="Novo post"><span>＋</span>Novo post</button></div>';
  }
  (window.EXTRA_VIEWS = window.EXTRA_VIEWS || {}).feed = vFeed;

  /* ---------- novo post ---------- */
  function drawCompose() {
    const c = F.compose;
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet fd-sheet" role="dialog" aria-label="Novo post"><div class="row between"><h2>Novo post</h2><button class="roundbtn" data-fdclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<textarea id="fdText" maxlength="1000" placeholder="Conte como foi o treino, uma conquista, uma dica…">' + esc(c.text) + '</textarea>' +
      (c.photo ? '<div class="fd-prev"><img alt="" src="' + c.photo + '"><button data-fdnopic aria-label="Tirar foto">✕</button></div>'
        : '<div class="gc-scan"><button type="button" data-fdpic="camera">📷 Tirar foto</button><button type="button" data-fdpic="gallery">🖼️ Da galeria</button></div>') +
      '<span class="ds-lbl">Quem pode ver</span><div class="wr-chips"><button data-fdvis="all" aria-pressed="' + (c.vis === "all") + '">🌎 Todos</button><button data-fdvis="groups" aria-pressed="' + (c.vis === "groups") + '">👥 Só meus grupos</button></div>' +
      '<p class="note">Sem nudez, ofensas ou spam: posts com denúncias são removidos.</p>' +
      '<button class="auth-go" data-fdpost' + (c.sending ? " disabled" : "") + '>' + (c.sending ? '<i class="auth-spin"></i>Publicando…' : "Publicar") + '</button></div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") closeCompose(); };
  }
  function closeCompose() { F.compose = null; closeLayer(); render(); }
  // outras telas (resumo da semana) abrem o novo post já com foto e texto
  window.feedComposeWith = (photo, text) => { F.compose = { text: text || "", photo: photo || "", vis: "all" }; drawCompose(); };
  const _cp = window.chatPhoto; // a mesma escolha de foto do Android serve para o chat e para o feed
  window.chatPhoto = d => { if (F.compose) { F.compose.text = ($("#fdText") || {}).value || F.compose.text; F.compose.photo = d; drawCompose(); } else if (_cp) _cp(d); };
  function pickBrowser(src) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    if (src === "camera") inp.setAttribute("capture", "environment");
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => { const k = Math.min(1, 1280 / Math.max(im.width, im.height)), c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url); window.chatPhoto(c.toDataURL("image/jpeg", .82)); };
      im.src = url;
    };
    inp.click();
  }
  async function publish() {
    const c = F.compose;
    c.text = $("#fdText").value.trim();
    if (!c.text && !c.photo) { toast("Escreva algo ou escolha uma foto"); return; }
    c.sending = true; drawCompose();
    let path = "";
    try {
      const row = { body: c.text.slice(0, 1000), vis: c.vis };
      if (c.photo) {
        const im = new Image(); im.src = c.photo; await im.decode();
        const blob = await (await fetch(c.photo)).blob();
        path = me() + "/" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + ".jpg";
        await Net.upload(path, blob);
        Object.assign(row, { img_path: path, img_w: im.naturalWidth, img_h: im.naturalHeight });
      }
      await Net.ins("posts", row);
      F.compose = null; closeLayer(); toast("Post publicado! 🎉");
      F.loaded = false; tab = "feed"; render(); load();
    } catch (e) {
      if (path) Net.removeObj(path);
      c.sending = false; drawCompose(); toast(e.message);
    }
  }

  /* ---------- curtir ---------- */
  async function like(id, force) {
    const p = F.posts.find(x => x.id === id);
    if (!p) return;
    const on = F.liked.has(id);
    if (force && on) return;
    if (on) { F.liked.delete(id); p.likes = Math.max(0, (p.likes || 0) - 1); } else { F.liked.add(id); p.likes = (p.likes || 0) + 1; }
    paint(p);
    try { if (on) await Net.del("likes", "post_id=eq." + id + "&user_id=eq." + me()); else await Net.ins("likes", { post_id: id }); }
    catch (e) { if (on) { F.liked.add(id); p.likes++; } else { F.liked.delete(id); p.likes--; } paint(p); toast(e.message); }
  }
  function paint(p) { // só o rodapé do post: sem redesenhar a lista inteira
    const el = document.querySelector('[data-post="' + p.id + '"] footer');
    if (!el) return;
    const tpl = document.createElement("div"); tpl.innerHTML = post(p);
    el.innerHTML = tpl.querySelector("footer").innerHTML;
    const b = el.querySelector("[data-fdlike]"); if (F.liked.has(p.id)) b.classList.add("pop");
  }

  /* ---------- comentários ---------- */
  async function openComments(id) {
    const p = F.posts.find(x => x.id === id);
    if (!p) return;
    F.open = { id, list: null };
    drawComments();
    try {
      F.open.list = await Net.sel("comments", "select=id,user_id,body,created_at,profiles!comments_user_id_fkey(name,avatar,photo,rank)&post_id=eq." + id + "&order=id");
    } catch (e) { F.open.list = []; toast(e.message); }
    drawComments(true);
  }
  function drawComments(stick) {
    const o = F.open, p = F.posts.find(x => x.id === o.id), mine = p && p.user_id === me();
    const list = o.list == null ? '<div class="ch-empty"><span class="auth-spin" style="color:var(--blue)"></span></div>'
      : o.list.length ? o.list.map(c => { const a = who(c); return '<div class="fd-c">' + window.netAvatar(a, "sm") + '<div><b>' + esc(a.name) + ' <small>' + ago(c.created_at) + '</small></b><span>' + esc(c.body) + '</span></div>' +
        (c.user_id === me() || mine ? '<button data-fdcdel="' + c.id + '" aria-label="Apagar">✕</button>' : '<button data-fdcrep="' + c.id + '" aria-label="Denunciar">🚩</button>') + '</div>'; }).join("")
        : '<div class="ch-empty"><span>💬</span><b>Sem comentários</b><p>Mande a primeira palavra de incentivo!</p></div>';
    const sheet = document.querySelector(".fd-csheet");
    const html = '<div class="row between"><h2>Comentários</h2><button class="roundbtn" data-fdclose aria-label="Fechar">' + IC.x + '</button></div><div class="fd-clist" id="fdCList">' + list + '</div>' +
      '<form class="ch-in" id="fdCForm"><input id="fdCText" maxlength="300" autocomplete="off" placeholder="Escreva um comentário"><button class="ch-send" aria-label="Enviar"><svg viewBox="0 0 24 24"><path d="M4 12 20 4l-6 16-3-7z"/></svg></button></form>';
    if (sheet) { const keep = ($("#fdCText") || {}).value || ""; sheet.innerHTML = html; $("#fdCText").value = keep; }
    else $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet fd-csheet" role="dialog" aria-label="Comentários">' + html + '</div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") { F.open = null; closeLayer(); render(); } };
    $("#fdCForm").onsubmit = ev => { ev.preventDefault(); comment(); };
    const box = $("#fdCList"); if (stick && box) box.scrollTop = box.scrollHeight;
  }
  async function comment() {
    const inp = $("#fdCText"), v = inp.value.trim(), o = F.open;
    if (!v || !o) return;
    inp.value = "";
    try {
      const r = await Net.ins("comments?select=id,user_id,body,created_at,profiles!comments_user_id_fkey(name,avatar,photo,rank)", { post_id: o.id, body: v.slice(0, 300) }, true);
      if (r && r[0]) o.list.push(r[0]);
      const p = F.posts.find(x => x.id === o.id); if (p) p.comments = (p.comments || 0) + 1;
      drawComments(true);
    } catch (e) { inp.value = v; toast(e.message); }
  }

  /* ---------- menu do post: apagar, denunciar, bloquear ---------- */
  const REASONS = ["Ofensivo ou assédio", "Nudez ou conteúdo sexual", "Violência", "Spam ou golpe", "Outro motivo"];
  function menu(id) {
    const p = F.posts.find(x => x.id === id); if (!p) return;
    const mine = p.user_id === me(), a = who(p);
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet fd-msheet"><b class="fd-mt">' + esc(mine ? "Seu post" : "Post de " + a.name) + '</b>' +
      (mine ? '<button class="danger" data-fdact="del">🗑️ Apagar post</button>' : '<button data-fdact="rep">🚩 Denunciar post</button><button data-fdact="block">🚫 Bloquear ' + esc(a.name) + '</button>') +
      '<button class="ghost" data-fdclose>Cancelar</button></div></div>';
    $("#scrim").onclick = async e => {
      if (e.target.id === "scrim") { closeLayer(); return; }
      const b = e.target.closest("[data-fdact],[data-fdwhy]"); if (!b) return;
      if (b.dataset.fdact === "rep") { e.currentTarget.querySelector(".sheet").innerHTML = '<b class="fd-mt">Por que você está denunciando?</b>' + REASONS.map(r => '<button data-fdwhy="' + r + '">' + r + '</button>').join("") + '<button class="ghost" data-fdclose>Cancelar</button>'; return; }
      closeLayer();
      if (b.dataset.fdwhy) { try { await Net.rpc("report_content", { pid: id, cid: null, why: b.dataset.fdwhy }); F.posts = F.posts.filter(x => x.id !== id); render(); toast("Obrigado! A denúncia foi enviada."); } catch (er) { toast(er.message); } return; }
      if (b.dataset.fdact === "del") { try { await Net.del("posts", "id=eq." + id); if (p.img_path) Net.removeObj(p.img_path); F.posts = F.posts.filter(x => x.id !== id); render(); toast("Post apagado"); } catch (er) { toast(er.message); } return; }
      if (b.dataset.fdact === "block" && window.chatBlock) { if (await chatBlock(p.user_id, a.name, true)) { F.posts = F.posts.filter(x => x.user_id !== p.user_id); render(); } }
    };
  }

  function view(id) {
    const p = F.posts.find(x => x.id === id); if (!p || !p.img_path) return;
    const el = document.createElement("div"); el.className = "ch-view";
    el.innerHTML = '<img alt="" src="' + esc(Net.pubUrl(p.img_path)) + '"><div class="ch-vbar"><b>' + esc(who(p).name) + '</b><span>' + ago(p.created_at) + '</span></div>' + (p.body ? '<p>' + esc(p.body) + '</p>' : "") + '<button aria-label="Fechar">✕</button>';
    el.onclick = () => { el.classList.add("out"); setTimeout(() => el.remove(), 200); };
    document.body.appendChild(el);
  }

  let lastTap = { id: 0, t: 0 };
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-fdnew]")) { F.compose = { text: "", photo: "", vis: "all" }; drawCompose(); return; }
    if (t.closest("[data-fdclose]")) { F.compose = null; F.open = null; closeLayer(); render(); return; }
    if (t.closest("[data-fdreload]")) { F.loaded = false; render(); load(); return; }
    if (t.closest("[data-fdmorebtn]")) { load(true); return; }
    const sc = t.closest("[data-fdscope]"); if (sc) { F.scope = sc.dataset.fdscope; F.loaded = false; render(); load(); return; }
    const pk = t.closest("[data-fdpic]"); if (pk) { F.compose.text = $("#fdText").value; if (NATIVE) nat("pickChatPhoto", pk.dataset.fdpic); else pickBrowser(pk.dataset.fdpic); return; }
    if (t.closest("[data-fdnopic]")) { F.compose.text = $("#fdText").value; F.compose.photo = ""; drawCompose(); return; }
    const vs = t.closest("[data-fdvis]"); if (vs) { F.compose.text = $("#fdText").value; F.compose.vis = vs.dataset.fdvis; drawCompose(); return; }
    if (t.closest("[data-fdpost]")) { publish(); return; }
    const lk = t.closest("[data-fdlike]"); if (lk) { like(+lk.dataset.fdlike); return; }
    const cm = t.closest("[data-fdcom]"); if (cm) { openComments(+cm.dataset.fdcom); return; }
    const mn = t.closest("[data-fdmenu]"); if (mn) { menu(+mn.dataset.fdmenu); return; }
    const cd = t.closest("[data-fdcdel]");
    if (cd) { const id = +cd.dataset.fdcdel; Net.del("comments", "id=eq." + id).then(() => { F.open.list = F.open.list.filter(c => c.id !== id); const p = F.posts.find(x => x.id === F.open.id); if (p) p.comments = Math.max(0, p.comments - 1); drawComments(); }).catch(er => toast(er.message)); return; }
    const cr = t.closest("[data-fdcrep]");
    if (cr) { const id = +cr.dataset.fdcrep; Net.rpc("report_content", { pid: null, cid: id, why: "Comentário impróprio" }).then(() => { F.open.list = F.open.list.filter(c => c.id !== id); drawComments(); toast("Comentário denunciado"); }).catch(er => toast(er.message)); return; }
    // foto: toque abre em tela cheia; toque duplo curte com coração
    const im = t.closest("[data-fdimg]");
    if (im) {
      const id = +im.dataset.fdimg, now = Date.now();
      if (lastTap.id === id && now - lastTap.t < 320) {
        lastTap = { id: 0, t: 0 }; clearTimeout(im._v);
        im.classList.remove("burst"); void im.offsetWidth; im.classList.add("burst");
        like(id, true);
      } else { lastTap = { id, t: now }; im._v = setTimeout(() => view(id), 330); }
    }
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden && tab === "feed" && Date.now() - F.at > 20000) load(); });
  const _rt = renderTabs; // ao abrir a aba Feed, atualiza se estiver velho
  renderTabs = function () { _rt(); if (tab === "feed" && F.loaded && Date.now() - F.at > 20000 && !F.busy) load(); };
})();
