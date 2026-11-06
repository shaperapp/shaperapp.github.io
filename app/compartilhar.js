/* Shaper · compartilhar treinos
   Um treino montado vira um código de 6 letras (com QR code e link) guardado no servidor.
   Quem recebe digita o código, escaneia o QR ou abre o link e salva o treino igualzinho. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const LINK = "https://shaperapp.github.io/treino.html?t=";
  const cells = v => '<span class="gc-cells big">' + [0, 1, 2, 3, 4, 5].map(i => '<i>' + esc(v[i] || "") + '</i>').join("") + '</span>';
  const clamp = (v, a, b, d) => { v = Math.round(+v); return isFinite(v) ? Math.max(a, Math.min(b, v)) : d; };

  // só passa o que o app entende: exercícios que existem e números dentro do limite
  function clean(t) {
    const items = (Array.isArray(t.items) ? t.items : []).filter(x => Array.isArray(x) && EX[x[0]] && x[0] !== "walk").slice(0, 40)
      .map(x => [x[0], clamp(x[1], 10, 600, 30), clamp(x[2], 0, 200, 0)]);
    return { n: String(t.n || "Treino").trim().slice(0, 30) || "Treino", f: String(t.f || "").trim().slice(0, 60), items,
      rounds: clamp(t.rounds, 1, 10, 3), rest: clamp(t.rest, 0, 180, 30), keep: t.keep !== false };
  }
  const mins = t => Math.max(1, Math.round((t.rounds * t.items.reduce((a, x) => a + x[1], 0) + t.rest * Math.max(0, t.items.length * t.rounds - 1)) / 60));
  const groups = t => [...new Set(t.items.map(x => EX[x[0]].g).filter(Boolean))].slice(0, 4).join(" · ");
  function preview(t) {
    return '<div class="sh-prev"><b>' + esc(t.n) + '</b>' + (t.f ? '<span>' + esc(t.f) + '</span>' : "") +
      '<div class="sh-meta"><i>⏱ ' + mins(t) + ' min</i><i>💪 ' + t.items.length + ' exercícios</i><i>🔁 ' + t.rounds + 'x</i></div>' + (groups(t) ? '<small>' + esc(groups(t)) + '</small>' : "") +
      '<ol>' + t.items.slice(0, 8).map(x => '<li>' + esc(EX[x[0]].n) + ' <em>' + x[1] + ' s' + (x[2] ? ' · ' + x[2] + ' rep' : "") + '</em></li>').join("") + (t.items.length > 8 ? '<li class="more">+ ' + (t.items.length - 8) + ' exercícios</li>' : "") + '</ol></div>';
  }
  function sheet(html, back) {
    $("#layer").innerHTML = '<div class="scrim" id="scrim"><div class="sheet sh-sheet" role="dialog">' + html + '</div></div>';
    $("#scrim").onclick = e => { if (e.target.id === "scrim") { closeLayer(); if (back) back(); } };
  }
  const needLogin = () => { toast("Entre na sua conta para compartilhar treinos"); if (window.netLogin) netLogin("in"); };

  /* ---------- compartilhar ---------- */
  async function share(t, back) {
    if (!Net.on()) { toast("Servidor indisponível"); return; }
    if (!Net.user()) { needLogin(); return; }
    const w = clean(t);
    if (!w.items.length) { toast("Esse treino não tem exercícios"); return; }
    sheet('<div class="sh-load"><i class="auth-spin"></i>Gerando código…</div>');
    let code;
    try { code = await Net.rpc("share_workout", { w }); } catch (e) { closeLayer(); toast(e.message); return; }
    const url = LINK + code, img = NATIVE ? nat("qrImage", url, 720) : "";
    sheet('<div class="row between"><h2>Compartilhar treino</h2><button class="roundbtn" data-shclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<div class="gq-card sh-card"><b>' + esc(w.n) + '</b>' + (img ? '<img class="gq-img" alt="QR code do treino" src="' + img + '">' : "") + cells(code) +
      '<span>Quem tiver o Shaper escaneia o QR ou digita o código em Treino → Importar</span></div>' +
      '<div class="gc-tacts" style="grid-template-columns:1fr 1fr"><button data-shcopy="' + code + '">Copiar código</button><button class="solid" data-shsend="' + code + '" data-shname="' + esc(w.n) + '">Enviar</button></div>' +
      '<label class="wk-keep sh-pub"><input type="checkbox" data-shpub="' + code + '"><span><b>🌎 Mostrar na comunidade</b><small>Qualquer pessoa do Shaper pode achar e treinar esse treino.</small></span></label>' + preview(w), back);
    try { const r = await Net.rpc("get_workout", { c: code }), cb = document.querySelector('[data-shpub="' + code + '"]'); if (cb) cb.checked = !!r.public; } catch (e) {}
  }

  /* ---------- comunidade: treinos que as pessoas publicaram ---------- */
  const C = { q: "", sort: "top", list: null, busy: false };
  async function community(reload) {
    if (!Net.on()) { toast("Servidor indisponível"); return; }
    if (!Net.user()) { toast("Entre na sua conta para ver os treinos da comunidade"); if (window.netLogin) netLogin("in"); return; }
    if (reload || !C.list) {
      drawCommunity(true);
      try { C.list = await Net.rpc("community_workouts", { q: C.q, sort: C.sort, lim: 60 }); } catch (e) { C.list = []; toast(e.message); }
    }
    drawCommunity(false);
  }
  function drawCommunity(loading) {
    const av = x => window.netAvatar ? netAvatar({ photo: x.photo, avatar: x.avatar, rank: "E" }, "") : "";
    const html = '<div class="row between"><h2>🌎 Comunidade</h2><button class="roundbtn" data-shclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<form class="sh-search" data-shcq><input id="shQ" type="search" placeholder="Buscar treino (ex.: glúteo, abdômen)" value="' + esc(C.q) + '" autocomplete="off"></form>' +
      '<div class="qchips"><button class="qchip" data-shsort="top" aria-pressed="' + (C.sort === "top") + '">🔥 Mais importados</button><button class="qchip" data-shsort="new" aria-pressed="' + (C.sort === "new") + '">✨ Novos</button></div>' +
      (loading ? '<div class="sh-load"><i class="auth-spin"></i>Carregando treinos…</div>' :
        (C.list && C.list.length ? '<div class="sh-com">' + C.list.map(x => '<button class="sh-wk" data-shopen="' + x.code + '">' + av(x) +
          '<div><b>' + esc(x.name) + (x.mine ? ' <i class="ad-tag">seu</i>' : "") + '</b><span>' + esc(x.descr || "por " + x.author) + '</span>' +
          '<small>⏱ ' + x.mins + ' min · 💪 ' + x.items + ' exercícios · 📥 ' + x.uses + (x.descr ? " · por " + esc(x.author) : "") + '</small></div></button>').join("") + '</div>'
          : '<div class="fd-empty"><span>🏋️</span><b>Nenhum treino ainda</b><p>Compartilhe um treino e marque “Mostrar na comunidade”.</p></div>'));
    const sh = document.querySelector(".sh-sheet.sh-c");
    if (sh) window.fxMorph(sh, html); else { sheet(html); document.querySelector(".sh-sheet").classList.add("sh-c"); }
  }
  window.wkCommunity = () => community(true);

  /* ---------- importar ---------- */
  let pending = null;
  function importForm(msg) {
    sheet('<div class="row between"><h2>Importar treino</h2><button class="roundbtn" data-shclose aria-label="Fechar">' + IC.x + '</button></div>' +
      '<p class="note">Digite o código de 6 letras que te mandaram ou escaneie o QR do treino.</p>' +
      '<form class="sh-form" data-shform><input id="shCode" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC123" aria-label="Código do treino"><button class="btn primary">Buscar</button></form>' +
      (msg ? '<p class="note sh-err">' + esc(msg) + '</p>' : "") +
      '<button class="gq-scan" data-shscan>📷 Escanear QR do treino</button>' + (Net.user() ? '<button class="btn ghost block" data-shmine>Meus treinos compartilhados</button>' : ""));
    setTimeout(() => { const i = $("#shCode"); if (i) i.focus(); }, 80);
  }
  async function fetchCode(code) {
    code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) { importForm("O código tem 6 letras ou números"); return; }
    if (!Net.on()) { toast("Servidor indisponível"); return; }
    sheet('<div class="sh-load"><i class="auth-spin"></i>Buscando treino ' + code + '…</div>');
    try {
      const r = await Net.rpc("get_workout", { c: code }), w = clean(r.data || {});
      if (!w.items.length) throw new Error("Esse treino usa exercícios que este app ainda não tem. Atualize o Shaper.");
      pending = w;
      sheet('<div class="row between"><h2>Treino de ' + esc(r.author) + '</h2><button class="roundbtn" data-shclose aria-label="Fechar">' + IC.x + '</button></div>' +
        preview(w) + '<p class="note">Código ' + code + (r.uses ? ' · ' + r.uses + ' pessoa' + (r.uses > 1 ? "s" : "") + ' já importaram' : "") + '</p>' +
        '<div class="row"><button class="btn primary" style="flex:1" data-shsave>Salvar nos meus treinos</button><button class="btn ghost" data-shgo>Treinar agora</button></div>');
    } catch (e) { importForm(e.message); }
  }
  window.wkImportCode = c => { tab = "treino"; render(); fetchCode(c); };
  window.wkImport = () => importForm();
  window.wkShare = share;

  async function mine() {
    sheet('<div class="sh-load"><i class="auth-spin"></i>Carregando…</div>');
    try {
      const l = await Net.rpc("my_shared");
      sheet('<div class="row between"><h2>Meus compartilhados</h2><button class="roundbtn" data-shclose aria-label="Fechar">' + IC.x + '</button></div>' +
        (l.length ? l.map(x => '<div class="wk-row"><div class="t"><b>' + esc(x.name) + (x.public ? ' <i class="ad-tag">🌎 comunidade</i>' : "") + '</b><span>Código ' + x.code + ' · ' + x.uses + ' importaç' + (x.uses === 1 ? "ão" : "ões") + '</span>' +
          '<label class="sh-mini"><input type="checkbox" data-shpub="' + x.code + '"' + (x.public ? " checked" : "") + '> mostrar na comunidade</label></div><button class="qchip" data-shcopy="' + x.code + '">Copiar</button><button class="qchip" data-shdel="' + x.code + '">Parar</button></div>').join("")
          : '<p class="note">Você ainda não compartilhou nenhum treino.</p>'));
    } catch (e) { toast(e.message); closeLayer(); }
  }

  document.addEventListener("submit", e => {
    if (e.target.closest("[data-shcq]")) { e.preventDefault(); C.q = $("#shQ").value.trim(); community(true); return; }
    if (!e.target.closest("[data-shform]")) return;
    e.preventDefault(); fetchCode($("#shCode").value);
  });
  document.addEventListener("change", async e => {
    const cb = e.target.closest("[data-shpub]"); if (!cb) return;
    try { await Net.rpc("set_workout_public", { c: cb.dataset.shpub, on_: cb.checked }); toast(cb.checked ? "Treino publicado na comunidade 🌎" : "Treino saiu da comunidade"); C.list = null; }
    catch (er) { cb.checked = !cb.checked; toast(er.message); }
  });
  document.addEventListener("click", async e => {
    const t = e.target, b = s => t.closest(s);
    let x;
    if (b("[data-shclose]")) { closeLayer(); render(); return; }
    if ((x = b("[data-shcopy]"))) { const c = x.dataset.shcopy; try { await navigator.clipboard.writeText(c); toast("Código " + c + " copiado"); } catch (er) { if (NATIVE) nat("share", c); else toast(c); } return; }
    if ((x = b("[data-shsend]"))) {
      const c = x.dataset.shsend, txt = "Treina comigo no Shaper! 💪 Meu treino \"" + x.dataset.shname + "\": " + LINK + c + " (ou importe com o código " + c + ")";
      if (NATIVE) nat("share", txt); else if (navigator.share) navigator.share({ text: txt }).catch(() => {}); else { try { await navigator.clipboard.writeText(txt); toast("Link copiado"); } catch (er) { toast(c); } }
      return;
    }
    if (b("[data-shscan]")) { closeLayer(); if (window.qrLive) qrLive(); return; }
    if (b("[data-shmine]")) { mine(); return; }
    if ((x = b("[data-shsort]"))) { C.sort = x.dataset.shsort; community(true); return; }
    if ((x = b("[data-shopen]"))) { fetchCode(x.dataset.shopen); return; }
    if ((x = b("[data-shdel]"))) { try { await Net.rpc("unshare_workout", { c: x.dataset.shdel }); toast("Código desativado"); mine(); } catch (er) { toast(er.message); } return; }
    if (b("[data-shsave]") && pending) {
      const id = "w" + Date.now().toString(36);
      if (!S.wk || typeof S.wk !== "object") S.wk = {};
      S.wk.custom = S.wk.custom || {};
      S.wk.custom[id] = pending; pending = null;
      save(); closeLayer(); tab = "treino"; render(); toast("Treino salvo em Treinos extras 💪"); return;
    }
    if (b("[data-shgo]") && pending) {
      const w = pending, wd = wdOf(todayStr()), keep = PLAN[wd];
      closeLayer(); PLAN[wd] = w;
      try { startWorkout(wd); } finally { PLAN[wd] = keep; }
    }
  });

  // QR de treino lido pela câmera ou pela galeria
  const _qs = window.qrScanned;
  window.qrScanned = txt => {
    const m = String(txt || "").match(/treino\.html\?t=([A-Za-z0-9]{6})|workout\?t=([A-Za-z0-9]{6})/);
    if (m) { fetchCode(m[1] || m[2]); return; }
    if (_qs) _qs(txt);
  };
})();
