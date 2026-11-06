/* Shaper · conta e sincronização (Supabase via REST, sem biblioteca)
   Login por e-mail/senha, perfil público (nome, emoji, XP, rank), registro de atividades
   para o ranking dos amigos. Funciona sem internet: as atividades ficam numa fila. */
(function () {
  "use strict";
  const CFG = window.SHAPER_CFG || {};
  const AK = "shaper.auth.v1", QK = "shaper.outbox.v1", VK = "shaper.pkce.v1";
  const REDIR = window.ShaperNative ? "com.shaper.app://auth" : location.origin + location.pathname;
  const b64u = b => btoa(String.fromCharCode.apply(null, new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const AVATARS = ["💪", "🔥", "⚡", "🐺", "🦁", "🐉", "🥷", "🏆", "🚀", "👑", "🦅", "🐯"];
  let sess = null;
  try { sess = JSON.parse(localStorage.getItem(AK)); } catch (e) {}

  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const PT = {
    "Invalid login credentials": "E-mail ou senha incorretos",
    "User already registered": "Este e-mail já tem conta. Entre com ele.",
    "Email not confirmed": "Confirme seu e-mail pelo link que enviamos",
    "Password should be at least 6 characters.": "A senha precisa de pelo menos 6 caracteres",
    "Unable to validate email address: invalid format": "E-mail inválido",
    "Email rate limit exceeded": "Muitas tentativas. Espere alguns minutos.",
    "access_denied": "Login com Google cancelado",
    "invalid flow state, no valid flow state found": "O login demorou demais. Tente de novo.",
    "Unsupported provider: provider is not enabled": "O login com Google ainda não foi ativado no servidor"
  };

  function setSess(s) {
    sess = s;
    try { if (s) localStorage.setItem(AK, JSON.stringify(s)); else localStorage.removeItem(AK); } catch (e) {}
    toNative(s);
  }
  // o Android usa a sessão para avisar mensagens e desafios com o app fechado
  function toNative(s) {
    if (!window.ShaperNative) return;
    nat("setSession", s && s.user ? JSON.stringify({ url: CFG.url, key: CFG.key, access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at, uid: s.user.id }) : "");
  }
  // o Android pode ter renovado o login enquanto o app estava fechado: adota a sessão mais nova
  function adoptNative() {
    if (!window.ShaperNative || !sess) return;
    try {
      const n = JSON.parse(nat("getSession") || "null");
      if (n && n.uid === sess.user.id && n.expires_at > sess.expires_at) {
        sess = Object.assign({}, sess, { access_token: n.access_token, refresh_token: n.refresh_token, expires_at: n.expires_at });
        localStorage.setItem(AK, JSON.stringify(sess));
      } else toNative(sess);
    } catch (e) {}
  }
  adoptNative();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) adoptNative(); });
  function norm(j) {
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user.id, email: j.user.email } };
  }
  async function raw(path, o) {
    o = o || {};
    const h = { apikey: CFG.key, "Content-Type": "application/json" };
    // chaves novas (sb_publishable_…) não são JWT: só vão no Authorization quando há sessão
    if (o.auth !== false && sess) h.Authorization = "Bearer " + sess.access_token;
    else if (o.auth !== false && /^eyJ/.test(CFG.key || "")) h.Authorization = "Bearer " + CFG.key;
    Object.assign(h, o.headers || {});
    let r;
    try { r = await fetch(CFG.url + path, { method: o.method || "GET", headers: h, body: o.body !== undefined ? JSON.stringify(o.body) : undefined }); }
    catch (e) { throw new Error("Sem conexão com a internet"); }
    const t = await r.text();
    let j = null;
    try { j = t ? JSON.parse(t) : null; } catch (e) {}
    if (!r.ok) {
      const m = (j && (j.msg || j.message || j.error_description || j.error)) || ("Erro " + r.status);
      const er = new Error(PT[m] || m);
      er.status = r.status;
      throw er;
    }
    return j;
  }
  let refreshing = null;
  async function fresh() {
    if (sess && Date.now() / 1000 >= (sess.expires_at || 0) - 60) adoptNative(); // talvez o Android já tenha renovado
    if (!sess || Date.now() / 1000 < (sess.expires_at || 0) - 60) return;
    if (!refreshing) refreshing = raw("/auth/v1/token?grant_type=refresh_token", { method: "POST", auth: false, body: { refresh_token: sess.refresh_token } })
      .then(j => setSess(norm(j)))
      .catch(e => { if (e.status === 400 || e.status === 401) { setSess(null); toast("Sessão expirada. Entre de novo."); } throw e; })
      .finally(() => { refreshing = null; });
    return refreshing;
  }
  async function api(path, o) { await fresh(); return raw(path, o); }

  const Net = {
    on: () => !!(CFG.url && CFG.key),
    user: () => sess && sess.user,
    rpc: (fn, a) => api("/rest/v1/rpc/" + fn, { method: "POST", body: a || {} }),
    sel: (t, q) => api("/rest/v1/" + t + "?" + q),
    ins: (t, row, ret) => api("/rest/v1/" + t, { method: "POST", body: row, headers: { Prefer: ret ? "return=representation" : "return=minimal" } }),
    // fotos do Feed: Storage do Supabase (pasta com o id da pessoa); leitura pública pelo link
    async upload(path, blob) {
      await fresh();
      let r;
      try { r = await fetch(CFG.url + "/storage/v1/object/feed/" + path, { method: "POST", headers: { apikey: CFG.key, Authorization: "Bearer " + sess.access_token, "Content-Type": "image/jpeg", "x-upsert": "false" }, body: blob }); }
      catch (e) { throw new Error("Sem conexão com a internet"); }
      if (!r.ok) { let m = "Erro " + r.status; try { const j = await r.json(); m = j.message || j.error || m; } catch (e) {} throw new Error(m); }
    },
    async removeObj(path) {
      await fresh();
      try { await fetch(CFG.url + "/storage/v1/object/feed/" + path, { method: "DELETE", headers: { apikey: CFG.key, Authorization: "Bearer " + sess.access_token } }); } catch (e) {}
    },
    pubUrl: path => CFG.url + "/storage/v1/object/public/feed/" + path,
    // armazenamento privado (backup das fotos de progresso): bucket "fotos", pasta = id da pessoa
    async priv(method, path, body, type) {
      if (!sess) throw new Error("Entre na sua conta");
      await fresh();
      const h = { apikey: CFG.key, Authorization: "Bearer " + sess.access_token };
      if (type) h["Content-Type"] = type;
      if (method === "PUT") { method = "POST"; h["x-upsert"] = "true"; }
      let r;
      try { r = await fetch(CFG.url + "/storage/v1/object/" + path, { method, headers: h, body }); }
      catch (e) { throw new Error("Sem conexão com a internet"); }
      if (!r.ok) { let m = "Erro " + r.status; try { const j = await r.json(); m = j.message || j.error || m; } catch (e) {} throw new Error(m); }
      return r;
    },
    // apaga todas as fotos do Feed da pessoa (antes de excluir a conta)
    async purgeFeed() {
      if (!sess) return;
      await fresh();
      const h = { apikey: CFG.key, Authorization: "Bearer " + sess.access_token, "Content-Type": "application/json" }, uid = sess.user.id;
      try {
        const r = await fetch(CFG.url + "/storage/v1/object/list/feed", { method: "POST", headers: h, body: JSON.stringify({ prefix: uid + "/", limit: 1000 }) });
        const list = r.ok ? await r.json() : [];
        if (list.length) await fetch(CFG.url + "/storage/v1/object/feed", { method: "DELETE", headers: h, body: JSON.stringify({ prefixes: list.map(o => uid + "/" + o.name) }) });
      } catch (e) {}
    },
    upsert: (t, row) => api("/rest/v1/" + t, { method: "POST", body: row, headers: { Prefer: "resolution=merge-duplicates,return=minimal" } }),
    upd: (t, q, row) => api("/rest/v1/" + t + "?" + q, { method: "PATCH", body: row, headers: { Prefer: "return=minimal" } }),
    del: (t, q) => api("/rest/v1/" + t + "?" + q, { method: "DELETE" }),
    async signUp(email, pw, name) {
      const j = await raw("/auth/v1/signup", { method: "POST", auth: false, body: { email, password: pw, data: { name } } });
      if (j && j.access_token) { setSess(norm(j)); return true; }
      return false;
    },
    async signIn(email, pw) { setSess(norm(await raw("/auth/v1/token?grant_type=password", { method: "POST", auth: false, body: { email, password: pw } }))); },
    recover: email => raw("/auth/v1/recover", { method: "POST", auth: false, body: { email } }),
    // Google não deixa logar dentro de WebView: abre no navegador e volta por com.shaper.app://auth (PKCE)
    async signInGoogle() {
      let ok = true;
      try { const s = await raw("/auth/v1/settings", { auth: false }); ok = !!(s && s.external && s.external.google); } catch (e) {}
      if (!ok) throw new Error("O login com Google ainda não foi ativado no servidor");
      const v = b64u(crypto.getRandomValues(new Uint8Array(32)));
      const ch = b64u(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)));
      localStorage.setItem(VK, v);
      location.href = CFG.url + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(REDIR) +
        "&code_challenge=" + ch + "&code_challenge_method=s256";
    },
    async exchange(code) {
      const v = localStorage.getItem(VK);
      localStorage.removeItem(VK);
      if (!v) throw new Error("O login demorou demais. Toque em Continuar com Google de novo.");
      setSess(norm(await raw("/auth/v1/token?grant_type=pkce", { method: "POST", auth: false, body: { auth_code: code, code_verifier: v } })));
    },
    async signOut() { try { await api("/auth/v1/logout", { method: "POST" }); } catch (e) {} setSess(null); }
  };
  window.Net = Net;

  /* ---------- perfil local ---------- */
  function A() {
    if (!S.acct || typeof S.acct !== "object") S.acct = {};
    const a = S.acct;
    a.name = a.name || "Jogador";
    a.avatar = a.avatar || "💪";
    a.photo = a.photo || "";
    a.pv = a.pv || 0; // versão da foto: só reenvia ao servidor quando muda
    return a;
  }
  window.netAcct = A;
  const PHOTO_OK = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
  window.netAvatar = (p, cls) => '<span class="rk-av ' + (cls || "") + (p.photo && PHOTO_OK.test(p.photo) ? ' ph"' : '"') + ' data-rank="' + esc(p.rank || "E") + '">' +
    (p.photo && PHOTO_OK.test(p.photo) ? '<img alt="" src="' + p.photo + '">' : esc(p.avatar || "💪")) + '</span>';

  // foto de perfil: recorte quadrado no centro, 160 px, JPEG (~10 KB)
  function setPhoto(d) { const a = A(); a.photo = d; a.pv++; save(); netSync(true); render(); }
  function pickPhoto() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => {
        const s = Math.min(im.width, im.height), c = document.createElement("canvas");
        c.width = c.height = 160;
        c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 160, 160);
        URL.revokeObjectURL(url);
        setPhoto(c.toDataURL("image/jpeg", .82));
        toast("Foto de perfil atualizada");
      };
      im.onerror = () => { URL.revokeObjectURL(url); toast("Não foi possível abrir essa imagem"); };
      im.src = url;
    };
    inp.click();
  }

  /* ---------- fila de atividades + sincronização ---------- */
  function queue() { try { return JSON.parse(localStorage.getItem(QK)) || []; } catch (e) { return []; } }
  function setQueue(q) { try { localStorage.setItem(QK, JSON.stringify(q.slice(-200))); } catch (e) {} }
  window.netLog = function (kind, title, xp) {
    const q = queue();
    q.push({ kind, title: String(title).slice(0, 80), xp: Math.max(0, Math.min(1000, xp | 0)), created_at: new Date().toISOString() });
    setQueue(q);
    netSync();
  };
  let st = null, busy = false;
  function netSync(now) {
    clearTimeout(st);
    st = setTimeout(push, now ? 0 : 2500);
  }
  window.netSync = netSync;
  async function push() {
    const u = Net.user();
    if (!Net.on() || !u || busy || !navigator.onLine) return;
    busy = true;
    try {
      const x = window.sysStats ? sysStats() : {}, a = A(), pv = a.pv, adj = (S.adm && S.adm.xp) || 0;
      const row = {
        name: a.name, avatar: a.avatar, xp: Math.max(0, (x.xp || 0) - adj), // o servidor soma o ajuste do admin de novo level: x.level || 1, rank: x.rank || "E", title: x.title || "",
        streak: streak(), workouts: S.history.length, missions: x.missions || 0, updated_at: new Date().toISOString()
      };
      if (a.pvSent !== pv) row.photo = a.photo;
      await Net.upd("profiles", "id=eq." + u.id, row);
      if (a.pvSent !== pv) { a.pvSent = pv; save(); }
      // ajustes da moderação: XP extra/retirado, rank fixo e suspensão
      try {
        const m = (await Net.sel("profiles", "select=banned,ban_reason,xp_adj,rank_override&id=eq." + u.id))[0];
        if (m) {
          const o = S.adm || {}, n = { xp: m.xp_adj || 0, rank: m.rank_override || "", ban: !!m.banned, why: m.ban_reason || "" };
          if (o.xp !== n.xp || o.rank !== n.rank || o.ban !== n.ban || o.why !== n.why) {
            S.adm = n; save(); render();
            if (n.ban && !o.ban) toast("Sua conta foi suspensa pela moderação");
            if (n.xp !== (o.xp || 0) || n.rank !== (o.rank || "")) netSync();
          }
        }
      } catch (e) {}
      const q = queue();
      if (q.length) { await Net.ins("activities", q); setQueue(queue().slice(q.length)); }
      if (window.grpSync) grpSync();
    } catch (e) {
    } finally { busy = false; }
  }

  // treinos concluídos viram atividade no feed dos amigos
  const _save = save;
  save = function () {
    _save();
    if (!S.net || typeof S.net.h !== "number") { S.net = { h: S.history.length }; return; }
    if (S.history.length > S.net.h) {
      S.history.slice(S.net.h).forEach(h => window.netLog("workout", h.n || "Treino", 100));
      S.net.h = S.history.length;
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
    } else if (S.history.length < S.net.h) S.net.h = S.history.length;
  };

  async function afterLogin() {
    const u = Net.user();
    try {
      const p = await Net.sel("profiles", "select=name,avatar,photo&id=eq." + u.id);
      const a = A();
      if (p && p[0]) {
        if (p[0].name && a.name === "Jogador") a.name = p[0].name;
        if (p[0].avatar) a.avatar = p[0].avatar;
        if (p[0].photo && !a.photo) { a.photo = p[0].photo; a.pvSent = a.pv; } // celular novo: recupera a foto
      }
    } catch (e) {}
    S.net = { h: S.history.length };
    save();
    netSync(true);
  }

  /* ---------- tela de login ---------- */
  let mode = "in";
  const typed = { e: "", n: "" }; // mantém o que foi digitado quando a tela redesenha
  const G_ICON = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
  const AI = {
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
  };
  const field = (ic, inner) => '<label class="auth-field"><span class="auth-ic">' + AI[ic] + '</span>' + inner + '</label>';
  function authHTML(msg, ok) {
    const pw = mode !== "rec";
    return '<div class="auth-wrap"><div class="auth-hero"><div class="auth-mark"><span>S</span></div><h1>Shaper</h1>' +
      '<p>Treine 90 dias, suba de rank e desafie seus amigos.</p>' +
      '<div class="auth-chips"><span>🏆 Ranking</span><span>⚔ Desafios</span><span>🔥 Sequência</span></div></div>' +
      '<div class="auth-box">' +
      (mode !== "rec" ? '<button class="auth-google" type="button" data-auth-google>' + G_ICON + '<span>Continuar com Google</span></button>' +
        '<div class="auth-or"><span>ou use seu e-mail</span></div>' +
        '<div class="auth-tabs" data-m="' + mode + '"><button type="button" data-auth-mode="in" aria-pressed="' + (mode === "in") + '">Entrar</button><button type="button" data-auth-mode="up" aria-pressed="' + (mode === "up") + '">Criar conta</button></div>'
        : '<div class="auth-rec"><b>Esqueceu a senha?</b><span>Digite seu e-mail e mandamos um link para criar uma nova.</span></div>') +
      '<form id="authF" class="auth-form" novalidate>' +
      (mode === "up" ? field("user", '<input id="auN" maxlength="24" autocomplete="nickname" placeholder="Seu nome no ranking" value="' + esc(typed.n) + '" required>') : "") +
      field("mail", '<input id="auE" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" placeholder="E-mail" value="' + esc(typed.e) + '" required>') +
      (pw ? field("lock", '<input id="auP" type="password" minlength="6" placeholder="' + (mode === "up" ? "Crie uma senha (6+)" : "Senha") + '" autocomplete="' + (mode === "up" ? "new-password" : "current-password") + '" required>' +
        '<button type="button" class="auth-eye" data-auth-eye aria-label="Mostrar senha">Mostrar</button>') : "") +
      (msg ? '<p class="auth-msg' + (ok ? " ok" : "") + '" role="alert">' + esc(msg) + '</p>' : "") +
      '<button class="auth-go" type="submit" id="auGo">' + (mode === "up" ? "Criar minha conta" : mode === "rec" ? "Enviar link" : "Entrar") + '</button></form>' +
      (mode === "in" ? '<button class="auth-link" data-auth-mode="rec">Esqueci a senha</button>' : mode === "rec" ? '<button class="auth-link" data-auth-mode="in">← Voltar para o login</button>' : "") +
      '</div><button class="auth-skip" data-auth-skip>Continuar sem conta</button>' +
      '<p class="auth-note">🔒 Treinos, peso e fotos ficam só no seu celular. O ranking recebe só nome, foto, XP e atividades.</p></div>';
  }
  function remember() {
    if ($("#auE")) typed.e = $("#auE").value.trim();
    if ($("#auN")) typed.n = $("#auN").value.trim();
  }
  function busyBtn(b, txt) { b.disabled = true; b.classList.add("busy"); b.dataset.txt = b.innerHTML; b.innerHTML = '<i class="auth-spin"></i>' + txt; }
  async function finishLogin() {
    const el = document.querySelector(".auth-screen");
    if (el) el.remove();
    localStorage.removeItem("shaper.skipAuth");
    await afterLogin();
    toast("Bem-vindo, " + A().name + "!");
    render();
  }
  function openAuth(m, msg, ok) {
    if (!Net.on()) { toast("Servidor do ranking ainda não configurado"); return; }
    remember();
    mode = m || mode;
    let el = document.querySelector(".auth-screen");
    if (!el) { el = document.createElement("div"); el.className = "auth-screen scrim"; document.body.appendChild(el); el.innerHTML = authHTML(msg, ok); }
    else window.fxMorph(el, authHTML(msg, ok)); // troca de aba anima em vez de piscar
    const f = $("#authF");
    f.onsubmit = async ev => {
      ev.preventDefault();
      remember();
      const e = typed.e, p = $("#auP") ? $("#auP").value : "", n = typed.n;
      if (mode === "up" && !n) return openAuth(mode, "Escolha um nome para o ranking");
      if (!/^\S+@\S+\.\S+$/.test(e)) return openAuth(mode, "Digite um e-mail válido");
      if (mode !== "rec" && p.length < 6) return openAuth(mode, "A senha precisa de pelo menos 6 caracteres");
      busyBtn($("#auGo"), "Aguarde…");
      try {
        if (mode === "rec") { await Net.recover(e); return openAuth("in", "Se o e-mail tiver conta, enviamos um link para criar nova senha.", true); }
        if (mode === "up") {
          A().name = n.slice(0, 24);
          const done = await Net.signUp(e, p, n);
          if (!done) return openAuth("in", "Conta criada! Confirme pelo link no seu e-mail e depois entre aqui.", true);
        } else await Net.signIn(e, p);
        await finishLogin();
      } catch (er) { openAuth(mode, er.message); }
    };
  }
  window.netLogin = openAuth;

  // volta do Google: ?code=… (ou ?error=…) vindo do navegador
  window.netOAuth = async function (qs) {
    const p = new URLSearchParams(String(qs || "").replace(/^[?#&]+/, "").replace(/#/g, "&"));
    const err = p.get("error_description") || p.get("error"), code = p.get("code");
    if (!err && !code) return;
    if (err) { openAuth(mode, PT[err] || err); return; }
    const el = document.querySelector(".auth-screen .auth-google");
    if (el) busyBtn(el, "Entrando…");
    try { await Net.exchange(code); await finishLogin(); }
    catch (er) { openAuth("in", er.message); }
  };

  document.addEventListener("click", e => {
    const t = e.target;
    const m = t.closest("[data-auth-mode]"); if (m) { openAuth(m.dataset.authMode); return; }
    const gb = t.closest("[data-auth-google]");
    if (gb) {
      if (!navigator.onLine) { openAuth(mode, "Sem conexão com a internet"); return; }
      busyBtn(gb, "Abrindo o Google…");
      Net.signInGoogle().catch(er => openAuth(mode, er.message));
      setTimeout(() => { if (gb.isConnected && gb.disabled) { gb.disabled = false; gb.classList.remove("busy"); gb.innerHTML = gb.dataset.txt; } }, 6000);
      return;
    }
    const eye = t.closest("[data-auth-eye]");
    if (eye) { const i = $("#auP"), sh = i.type === "password"; i.type = sh ? "text" : "password"; eye.textContent = sh ? "Ocultar" : "Mostrar"; i.focus(); return; }
    if (t.closest("[data-auth-skip]")) { localStorage.setItem("shaper.skipAuth", "1"); document.querySelector(".auth-screen").remove(); return; }
    if (t.closest("[data-login]")) { openAuth("in"); return; }
    const av = t.closest("[data-avatar]");
    if (av) { const a = A(); a.avatar = av.dataset.avatar; if (a.photo) setPhoto(""); else { save(); netSync(true); render(); } return; }
    if (t.closest("[data-photo]")) { pickPhoto(); return; }
    if (t.closest("[data-nophoto]")) { setPhoto(""); toast("Foto removida"); return; }
    if (t.closest("[data-logout]")) { Net.signOut().then(() => { toast("Você saiu da conta"); render(); }); return; }
    if (t.closest("[data-delacct]")) {
      const box = $("#delBox");
      box.innerHTML = '<div class="confirm"><b>Excluir sua conta?</b><span class="note">Apaga do servidor seu perfil, grupos que você criou e atividades. Seus treinos no celular continuam.</span><div class="row"><button class="btn ghost danger" id="dlY" style="flex:1">Excluir</button><button class="btn" id="dlN" style="flex:1">Cancelar</button></div></div>';
      $("#dlN").onclick = render;
      $("#dlY").onclick = async () => {
        try { await Net.purgeFeed(); await Net.rpc("delete_account"); setSess(null); toast("Conta excluída"); render(); }
        catch (er) { toast(er.message); }
      };
    }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "acName") { A().name = e.target.value.trim().slice(0, 24) || "Jogador"; save(); netSync(true); toast("Nome atualizado"); }
  });

  function blockedHTML() {
    const n = window.chatBlocks ? chatBlocks().names : {}, ids = Object.keys(n);
    if (!ids.length) return "";
    return '<span class="acc-lbl">Pessoas bloqueadas</span>' + ids.map(id => '<div class="acc-blk"><span>🚫 ' + esc(n[id]) + '</span><button class="qchip" data-unblock="' + esc(id) + '">Desbloquear</button></div>').join("");
  }
  document.addEventListener("click", async e => {
    const u = e.target.closest("[data-unblock]");
    if (u && window.chatBlock) { const id = u.dataset.unblock; if (await chatBlock(id, chatBlocks().names[id] || "Pessoa", false)) render(); }
  });

  /* ---------- seção Conta nos Ajustes ---------- */
  function contaHTML() {
    const u = Net.user(), a = A();
    let b;
    if (!Net.on()) b = '<p class="note">O ranking entre amigos precisa do servidor configurado no app.</p>';
    else if (!u) b = '<div class="setrow"><div><b>Sem conta</b><span class="note">Entre para criar grupos e competir no ranking.</span></div></div><div class="setrow"><button class="btn primary block" data-login>Entrar ou criar conta</button></div>';
    else {
      const x = window.sysStats ? sysStats() : {};
      b = '<div class="acc-hero"><button class="acc-pic" data-photo aria-label="Trocar foto de perfil">' + window.netAvatar({ photo: a.photo, avatar: a.avatar, rank: x.rank }, "xl") +
        '<span class="acc-cam"><svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></span></button>' +
        '<b class="acc-name">' + esc(a.name) + '</b><span class="acc-mail">' + esc(u.email) + '</span>' +
        '<div class="acc-acts"><button class="acc-btn" data-photo>' + (a.photo ? "Trocar foto" : "Escolher foto") + '</button>' + (a.photo ? '<button class="acc-btn ghost" data-nophoto>Remover</button>' : "") + '</div></div>' +
        '<div class="acc-body"><label class="acc-lbl" for="acName">Nome no ranking</label><input id="acName" class="acc-in" maxlength="24" value="' + esc(a.name) + '">' +
        '<span class="acc-lbl">' + (a.photo ? "Ou troque a foto por um emoji" : "Ou use um emoji") + '</span><div class="acc-avs">' + AVATARS.map(e => '<button data-avatar="' + e + '" aria-pressed="' + (!a.photo && e === a.avatar) + '">' + e + '</button>').join("") + '</div>' +
        blockedHTML() +
        '<div class="acc-foot"><button class="btn ghost" style="flex:1" data-logout>Sair da conta</button><button class="btn ghost danger" style="flex:1" data-delacct>Excluir conta</button></div><div id="delBox"></div></div>';
    }
    const SITE = "https://shaperapp.github.io/";
    return '<div class="sec"><div class="sechead"><h3>Conta</h3></div><div class="card acc-card">' + b + '</div>' +
      '<p class="acc-legal"><a href="' + SITE + 'privacidade.html">Política de privacidade</a> · <a href="' + SITE + 'excluir-conta.html">Excluir conta pela web</a></p></div>';
  }
  const _vAj = vAjustes, MARK = '<div class="sec"><div class="sechead"><h3>Notificações</h3>';
  vAjustes = function () { const h = _vAj(), k = h.indexOf(MARK); return k < 0 ? h : h.slice(0, k) + contaHTML() + h.slice(k); };

  window.addEventListener("online", () => netSync(true));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) netSync(true); });

  if (!S.net) S.net = { h: S.history.length };
  // no navegador (testes) o Google volta para a própria página com ?code=
  if (!window.ShaperNative && /[?&#](code|error)=/.test(location.search + location.hash)) {
    const qs = location.search + location.hash;
    history.replaceState(null, "", location.pathname);
    setTimeout(() => window.netOAuth(qs), 300);
  } else if (Net.on() && !Net.user() && !localStorage.getItem("shaper.skipAuth")) setTimeout(() => openAuth("in"), 900);
  else netSync(true);
})();
