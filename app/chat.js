/* Shaper · chat do grupo
   Conversa rápida entre os membros, com fotos do treino. Cada mensagem (e foto) some sozinha
   em 24 horas: o servidor apaga e nem mostra as mais velhas. Atualiza a cada 4 s com o chat
   aberto; as fotos carregam à parte, só quando aparecem na conversa. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const DAY = 864e5, COLS = "select=id,user_id,body,created_at,has_img";
  const PIC_OK = /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/;
  const C = { gid: "", msgs: [], last: 0, timer: null, prev: {}, busy: false, img: {}, photo: "", loading: {}, blocked: new Set() };
  const HK = "shaper.chat.hidden", BK = "shaper.blockedNames";
  const hidden = () => { try { return JSON.parse(localStorage.getItem(HK)) || []; } catch (e) { return []; } };
  const hide = id => { const h = hidden(); h.push(id); localStorage.setItem(HK, JSON.stringify(h.slice(-300))); };
  const names = () => { try { return JSON.parse(localStorage.getItem(BK)) || {}; } catch (e) { return {}; } };
  async function loadBlocks() {
    try { const r = await Net.sel("blocks", "select=blocked"); C.blocked = new Set(r.map(x => x.blocked)); } catch (e) {}
  }
  window.chatBlocks = () => ({ ids: [...C.blocked], names: names() });
  window.chatBlock = async (uid, name, on) => {
    try {
      if (on) { await Net.ins("blocks", { blocked: uid }); C.blocked.add(uid); const n = names(); n[uid] = name; localStorage.setItem(BK, JSON.stringify(n)); }
      else { await Net.del("blocks", "blocked=eq." + uid); C.blocked.delete(uid); const n = names(); delete n[uid]; localStorage.setItem(BK, JSON.stringify(n)); }
      toast(on ? name + " bloqueado. Você não verá mais as mensagens dessa pessoa." : name + " desbloqueado");
      draw();
      return true;
    } catch (e) { toast(e.message); return false; }
  };
  const REASONS = ["Ofensivo ou assédio", "Nudez ou conteúdo sexual", "Violência ou ameaça", "Spam ou golpe", "Outro motivo"];
  window.chatReport = async (mid, uid, why) => {
    try {
      await Net.rpc("report", { mid: mid || null, who: uid || null, why });
      if (mid) { hide(mid); draw(); }
      toast("Obrigado! A denúncia foi enviada e vamos analisar.");
    } catch (e) { toast(e.message); }
  };
  // menu de uma mensagem: apagar (minha ou, se dono, qualquer uma), denunciar, bloquear, remover do grupo
  function menu(id) {
    const m = C.msgs.find(x => String(x.id) === String(id));
    if (!m) return;
    const c = ctx(), mine = m.user_id === c.me, owner = c.g && c.g.owner === c.me, p = who(m.user_id);
    const b = (a, t, cls) => '<button data-chact="' + a + '"' + (cls ? ' class="' + cls + '"' : "") + '>' + t + '</button>';
    const el = document.createElement("div");
    el.className = "ch-menu";
    el.innerHTML = '<div class="ch-mbox"><div class="ch-mprev"><b>' + esc(mine ? "Você" : p.name) + '</b><span>' + esc(m.body || "📷 Foto") + '</span></div>' +
      (mine || owner ? b("del", "🗑️ Apagar mensagem" + (!mine ? " (dono do grupo)" : ""), "danger") : "") +
      (!mine ? b("rep", "🚩 Denunciar mensagem") + b("block", "🚫 Bloquear " + esc(p.name)) : "") +
      (!mine && owner ? b("kick", "👋 Remover " + esc(p.name) + " do grupo", "danger") : "") +
      b("x", "Cancelar", "ghost") + '</div>';
    document.querySelector(".ch-sheet").appendChild(el);
    el.addEventListener("click", async e => {
      const a = e.target.closest("[data-chact]");
      if (e.target === el || (a && a.dataset.chact === "x")) { el.remove(); return; }
      if (!a) return;
      const act = a.dataset.chact;
      if (act === "rep") {
        el.querySelector(".ch-mbox").innerHTML = '<div class="ch-mprev"><b>Por que você está denunciando?</b><span>Ninguém do grupo fica sabendo quem denunciou.</span></div>' +
          REASONS.map(r => '<button data-chwhy="' + r + '">' + r + '</button>').join("") + b("x", "Cancelar", "ghost");
        return;
      }
      if (act === "del") { el.remove(); try { await Net.del("messages", "id=eq." + m.id); C.msgs = C.msgs.filter(x => x !== m); draw(); toast("Mensagem apagada"); } catch (er) { toast(er.message); } return; }
      if (act === "block") { el.remove(); await window.chatBlock(m.user_id, p.name, true); return; }
      if (act === "kick") {
        if (a.dataset.sure !== "1") { a.dataset.sure = "1"; a.textContent = "Toque de novo para remover " + p.name; return; }
        el.remove();
        try { await Net.del("members", "group_id=eq." + C.gid + "&user_id=eq." + m.user_id); toast(p.name + " foi removido do grupo"); if (window.grpSync) grpSync(true); } catch (er) { toast(er.message); }
      }
    });
    el.addEventListener("click", e => { const w = e.target.closest("[data-chwhy]"); if (w) { el.remove(); window.chatReport(m.id, m.user_id, w.dataset.chwhy); } });
  }
  const seenK = gid => "shaper.chat.seen." + gid;
  const ctx = () => window.grpCtx ? grpCtx() : { g: null, board: [], me: "" };
  const who = uid => ctx().board.find(b => b.user_id === uid) || { name: "Ex-membro", avatar: "👤", rank: "E" };
  const hm = t => { const d = new Date(t); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  const leftTxt = t => { const h = Math.max(0, (Date.parse(t) + DAY - Date.now()) / 36e5); return h >= 1 ? "some em " + Math.ceil(h) + " h" : "some em " + Math.max(1, Math.ceil(h * 60)) + " min"; };

  /* ---------- prévia no Ranking ---------- */
  window.chatPeek = async g => {
    if (!g || !Net.user()) return;
    try {
      const r = await Net.sel("messages", COLS + "&group_id=eq." + g.id + "&order=id.desc&limit=30");
      const seen = +localStorage.getItem(seenK(g.id)) || 0, me = ctx().me;
      C.prev[g.id] = { last: r[0] || null, unread: r.filter(m => m.id > seen && m.user_id !== me).length };
    } catch (e) { /* sem chat ainda: só não mostra a prévia */ }
  };
  window.chatCard = g => {
    const p = C.prev[g.id] || {}, m = p.last;
    const txt = m ? (m.body ? esc(m.body) : "📷 Foto") : "";
    const line = m ? '<b>' + esc(m.user_id === ctx().me ? "Você" : who(m.user_id).name) + ':</b> ' + (m.has_img && m.body ? "📷 " : "") + txt : "Mande a primeira mensagem ou uma foto do treino 📸";
    return '<button class="ch-card" data-chopen><span class="ch-ic">💬' + (p.unread ? '<i>' + (p.unread > 9 ? "9+" : p.unread) + '</i>' : "") + '</span>' +
      '<span class="ch-tx"><b>Chat do grupo</b><span>' + line + '</span></span><span class="ch-lock">🔒 24h</span></button>';
  };

  /* ---------- conversa ---------- */
  function pic(m) {
    const src = m.img || C.img[m.id] || "";
    return '<button type="button" class="ch-img' + (src ? "" : " loading") + '" data-chview="' + esc(m.id) + '"><img alt="Foto" src="' + (src && PIC_OK.test(src) ? src : "data:,") + '"></button>';
  }
  function bubbles() {
    const me = ctx().me, now = Date.now();
    C.msgs = C.msgs.filter(m => m.pending || Date.parse(m.created_at) + DAY > now); // passou de 24 h: some da tela também
    C.msgs = C.msgs.filter(m => !hidden().includes(m.id) && !C.blocked.has(m.user_id)); // denunciadas por mim / de quem bloqueei
    if (!C.msgs.length) return '<div class="ch-empty"><span>💬</span><b>Nenhuma mensagem nas últimas 24 h</b><p>Combine o treino, mande uma foto treinando ou comemore o desafio.</p></div>';
    let out = "", prev = null;
    C.msgs.forEach(m => {
      const mine = m.user_id === me, p = who(m.user_id), first = !prev || prev.user_id !== m.user_id || Date.parse(m.created_at) - Date.parse(prev.created_at) > 5 * 60e3;
      const photo = m.has_img || m.img;
      out += '<div class="ch-row' + (mine ? " me" : "") + (first ? " first" : "") + '">' +
        (!mine ? (first ? window.netAvatar(p, "sm") : '<span class="ch-sp"></span>') : "") +
        '<div class="ch-b' + (m.pending ? " pending" : "") + (photo ? " has-pic" : "") + '"' + (m.pending ? "" : ' data-chmsg="' + esc(m.id) + '"') + '>' + (!mine && first ? '<span class="ch-name">' + esc(p.name) + '</span>' : "") +
        (photo ? pic(m) : "") + (m.body ? '<span class="ch-t">' + esc(m.body) + '</span>' : "") +
        '<span class="ch-meta">' + (m.pending ? "enviando…" : hm(m.created_at) + " · " + leftTxt(m.created_at)) + '</span></div></div>';
      prev = m;
    });
    return out;
  }
  function draw(stick) {
    const box = document.getElementById("chList");
    if (!box) return false;
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    box.innerHTML = bubbles();
    if (stick || near) box.scrollTop = box.scrollHeight;
    box.querySelectorAll(".ch-img img").forEach(im => { if (!im.complete) im.onload = () => { if (stick || near) box.scrollTop = box.scrollHeight; }; });
    loadPics();
    return true;
  }
  // baixa as fotos que ainda não estão na memória (de 3 em 3)
  async function loadPics() {
    const ids = C.msgs.filter(m => m.has_img && !m.img && !C.img[m.id] && !C.loading[m.id] && typeof m.id === "number").map(m => m.id);
    for (let i = 0; i < ids.length; i += 3) {
      const part = ids.slice(i, i + 3);
      part.forEach(id => { C.loading[id] = 1; });
      try {
        const r = await Net.sel("messages", "select=id,img&id=in.(" + part.join(",") + ")");
        r.forEach(x => { if (x.img && PIC_OK.test(x.img)) C.img[x.id] = x.img; });
      } catch (e) {}
      part.forEach(id => {
        delete C.loading[id];
        const b = document.querySelector('[data-chview="' + id + '"]');
        if (b && C.img[id]) { b.classList.remove("loading"); b.querySelector("img").src = C.img[id]; }
      });
    }
  }
  function markSeen() { if (C.last) { localStorage.setItem(seenK(C.gid), String(C.last)); nat("chatSeen", C.last); } if (C.prev[C.gid]) C.prev[C.gid].unread = 0; }

  async function load() {
    try {
      const r = await Net.sel("messages", COLS + "&group_id=eq." + C.gid + "&order=id.desc&limit=100");
      C.msgs = r.reverse();
      C.last = C.msgs.length ? C.msgs[C.msgs.length - 1].id : 0;
      draw(true); markSeen();
    } catch (e) {
      const box = document.getElementById("chList");
      if (box) box.innerHTML = '<div class="ch-empty"><span>⚠️</span><b>Não deu para abrir o chat</b><p>' + esc(e.message) + '</p></div>';
    }
  }
  async function poll() {
    if (!document.getElementById("chList")) { stop(); return; }
    if (C.busy || document.hidden) { draw(); return; }
    C.busy = true;
    try {
      const r = await Net.sel("messages", COLS + "&group_id=eq." + C.gid + "&id=gt." + C.last + "&order=id");
      r.forEach(m => { if (!C.msgs.some(x => x.id === m.id)) C.msgs.push(m); });
      if (r.length) { C.last = r[r.length - 1].id; markSeen(); if (r.some(m => m.user_id !== ctx().me)) tone(988, .06, "sine", .15); }
      draw();
    } catch (e) {} finally { C.busy = false; }
  }
  function stop() { clearInterval(C.timer); C.timer = null; }

  function prevHTML() {
    return C.photo ? '<div class="ch-prev"><img alt="" src="' + C.photo + '"><span>Foto pronta · escreva uma legenda (opcional) e envie</span><button type="button" data-chnopic aria-label="Tirar foto">✕</button></div>' : "";
  }
  function open() {
    const c = ctx(), g = c.g;
    if (!g) return;
    C.gid = g.id; C.msgs = []; C.last = 0; C.photo = "";
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet ch-sheet" role="dialog" aria-label="Chat do grupo">' +
      '<div class="ch-head"><div class="ch-hic">💬</div><div class="ch-ht"><b>' + esc(g.name) + '</b><span>' + c.board.length + ' membros · 🔒 mensagens e fotos somem em 24 h</span></div><button class="roundbtn" data-chclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<div class="ch-list" id="chList"><div class="ch-empty"><span class="auth-spin" style="color:var(--blue)"></span></div></div>' +
      '<div id="chPrev"></div><div class="ch-pick" id="chPick" hidden><button type="button" data-chsrc="camera">📷 Tirar foto</button><button type="button" data-chsrc="gallery">🖼️ Da galeria</button></div>' +
      '<form class="ch-in" id="chForm"><button type="button" class="ch-cam" data-chpic aria-label="Mandar foto"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></button>' +
      '<input id="chText" maxlength="500" autocomplete="off" placeholder="Mensagem para o grupo"><button class="ch-send" aria-label="Enviar"><svg viewBox="0 0 24 24"><path d="M4 12 20 4l-6 16-3-7z"/></svg></button></form></div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") close(); };
    $("#chForm").onsubmit = ev => { ev.preventDefault(); send(); };
    loadBlocks().then(load);
    stop(); C.timer = setInterval(poll, 4000);
  }
  function close() { stop(); C.photo = ""; closeLayer(); render(); }

  // foto escolhida (Android manda já reduzida para 1280 px)
  window.chatPhoto = d => {
    if (!PIC_OK.test(d || "") || !document.getElementById("chList")) return;
    C.photo = d;
    $("#chPrev").innerHTML = prevHTML();
    const i = $("#chText"); if (i) { i.placeholder = "Legenda (opcional)"; i.focus(); }
  };
  function pickInBrowser(src) {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    if (src === "camera") inp.setAttribute("capture", "environment");
    inp.onchange = () => {
      const f = inp.files && inp.files[0]; if (!f) return;
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1280 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        window.chatPhoto(c.toDataURL("image/jpeg", .82));
      };
      im.src = url;
    };
    inp.click();
  }

  async function send() {
    const inp = $("#chText"), v = inp.value.trim(), photo = C.photo;
    if (!v && !photo) return;
    inp.value = ""; C.photo = ""; $("#chPrev").innerHTML = ""; inp.placeholder = "Mensagem para o grupo";
    const tmp = { id: "t" + Date.now(), user_id: ctx().me, body: v.slice(0, 500), img: photo || null, has_img: !!photo, created_at: new Date().toISOString(), pending: true };
    C.msgs.push(tmp); draw(true);
    try {
      const row = { group_id: C.gid, body: tmp.body };
      if (photo) row.img = photo;
      // devolve só os campos leves (a foto já está aqui)
      const r = await Net.ins("messages?select=id,user_id,body,created_at,has_img", row, true);
      const m = r && r[0];
      C.msgs = C.msgs.filter(x => x !== tmp);
      if (m) { if (photo) C.img[m.id] = photo; if (!C.msgs.some(x => x.id === m.id)) C.msgs.push(m); if (m.id > C.last) C.last = m.id; }
      markSeen(); draw(true);
    } catch (e) {
      C.msgs = C.msgs.filter(x => x !== tmp); draw();
      inp.value = v; if (photo) window.chatPhoto(photo);
      toast(e.message);
    }
    inp.focus();
  }

  function view(id) {
    const m = C.msgs.find(x => String(x.id) === String(id)), src = m && (m.img || C.img[m.id]);
    if (!src) return;
    const p = who(m.user_id), el = document.createElement("div");
    el.className = "ch-view";
    el.innerHTML = '<img alt="Foto" src="' + src + '"><div class="ch-vbar"><b>' + esc(m.user_id === ctx().me ? "Você" : p.name) + '</b><span>' + hm(m.created_at) + ' · 🔒 ' + leftTxt(m.created_at) + '</span></div>' + (m.body ? '<p>' + esc(m.body) + '</p>' : "") + '<button aria-label="Fechar">✕</button>';
    el.onclick = () => { el.classList.add("out"); setTimeout(() => el.remove(), 200); };
    document.body.appendChild(el);
  }

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("[data-chopen]")) { open(); return; }
    if (t.closest("[data-chclose]")) { close(); return; }
    if (t.closest("[data-chpic]")) { const p = $("#chPick"); if (p) p.hidden = !p.hidden; return; }
    const s = t.closest("[data-chsrc]");
    if (s) { $("#chPick").hidden = true; if (NATIVE) nat("pickChatPhoto", s.dataset.chsrc); else pickInBrowser(s.dataset.chsrc); return; }
    if (t.closest("[data-chnopic]")) { C.photo = ""; $("#chPrev").innerHTML = ""; $("#chText").placeholder = "Mensagem para o grupo"; return; }
    const v = t.closest("[data-chview]"); if (v) { view(v.dataset.chview); return; }
    const mb = t.closest("[data-chmsg]"); if (mb) menu(mb.dataset.chmsg);
  });
})();
