/* Shaper · backup na nuvem, relatório de erros, funcionar com o app fechado, tema e tutorial */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const ver = () => (NATIVE && nat("appVersion")) || "web";
  const dev = () => (NATIVE && nat("brand")) || navigator.userAgent.slice(0, 120);

  /* ---------- relatório de erros (vai para o servidor quando houver conta) ---------- */
  const EQ = "shaper.errq";
  const errq = () => { try { return JSON.parse(localStorage.getItem(EQ)) || []; } catch (e) { return []; } };
  function logErr(msg) {
    msg = String(msg || "").slice(0, 1900);
    if (!msg || /Sem conexão|Failed to fetch|NetworkError|Load failed|ResizeObserver/i.test(msg)) return;
    const q = errq();
    if (q.some(x => x.msg === msg)) return;
    q.push({ msg, at: Date.now() });
    try { localStorage.setItem(EQ, JSON.stringify(q.slice(-20))); } catch (e) {}
    flushErr();
  }
  window.addEventListener("error", e => logErr((e.message || "erro") + " @ " + String(e.filename || "").split("/").pop() + ":" + (e.lineno || 0)));
  window.addEventListener("unhandledrejection", e => { const r = e.reason; logErr("promise: " + (r && (r.stack || r.message) || r)); });
  const crash = NATIVE ? nat("takeCrash") : "";
  if (crash) logErr("android: " + crash);
  let flushing = false;
  async function flushErr() {
    if (flushing || !window.Net || !Net.on() || !Net.user() || !navigator.onLine) return;
    const q = errq();
    if (!q.length) return;
    flushing = true;
    try { await Net.ins("errors", q.map(x => ({ msg: x.msg, version: ver(), device: dev() }))); localStorage.removeItem(EQ); } catch (e) {}
    flushing = false;
  }

  /* ---------- backup na nuvem (só os números; fotos ficam no celular) ---------- */
  function clean(v) {
    if (typeof v === "string") return v.startsWith("data:") ? undefined : v;
    if (Array.isArray(v)) return v.map(clean).filter(x => x !== undefined);
    if (v && typeof v === "object") { const o = {}; for (const k in v) { if (k === "cloudAt") continue; const c = clean(v[k]); if (c !== undefined) o[k] = c; } return o; }
    return v;
  }
  async function backup(manual) {
    const u = Net.user();
    if (!u) { if (manual) toast("Entre na sua conta para fazer backup"); return; }
    const data = clean(S);
    if (JSON.stringify(data).length > 350000) { if (manual) toast("Backup grande demais"); return; }
    try {
      await Net.upsert("backups", { user_id: u.id, data, version: ver(), updated_at: new Date().toISOString() });
      S.cloudAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(S));
      if (manual) { toast("☁️ Backup feito"); render(); }
    } catch (e) { if (manual) toast(e.message); }
  }
  async function restore(auto) {
    const u = Net.user();
    if (!u) return;
    try {
      const r = await Net.sel("backups", "select=data,updated_at&user_id=eq." + u.id);
      if (!r[0]) { if (!auto) toast("Nenhum backup na nuvem ainda"); return; }
      window.shaperImport(JSON.stringify({ app: "shaper", v: 1, date: r[0].updated_at, state: r[0].data })); // sem "photos": mantém as do celular
    } catch (e) { if (!auto) toast(e.message); }
  }
  function autoCloud() {
    if (!window.Net || !Net.user()) return;
    flushErr();
    // celular novo: tem backup e ainda não treinou aqui → oferece restaurar (uma vez por conta)
    const uid = Net.user().id;
    if (localStorage.getItem("shaper.cloudAsked") !== uid && !S.history.length) { localStorage.setItem("shaper.cloudAsked", uid); restore(true); return; }
    if (S.cloud && Date.now() - (S.cloudAt || 0) > 12 * 36e5) backup(false);
  }
  setInterval(autoCloud, 60000);
  setTimeout(autoCloud, 4000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(autoCloud, 1500); });

  /* ---------- funcionar com o app fechado ---------- */
  const OEM = /xiaomi|redmi|poco|oppo|realme|oneplus|vivo|iqoo|huawei|honor|asus|samsung|motorola|infinix|tecno/i;
  function bgItems() {
    if (!NATIVE) return [];
    const b = nat("brand") || "", list = [];
    list.push({ ok: !!nat("batteryOk"), t: "Bateria sem restrições", d: "Sem isso o Android pode atrasar alarmes, lembretes de água e avisos do chat.", act: "bat", btn: "Liberar" });
    if (nat("exactAlarmAllowed") === false) list.push({ ok: false, t: "Alarmes no horário exato", d: "O fim de cada exercício toca na hora certa.", act: "exact", btn: "Permitir" });
    list.push({ ok: !!nat("overlayAllowed"), t: "Exibir sobre outros apps", d: "Para a bolha do treino, da água e dos desafios.", act: "overlay", btn: "Permitir" });
    if (OEM.test(b)) list.push({ ok: localStorage.getItem("shaper.autostart") === "1", t: "Inicialização automática", d: "Seu " + esc(b.split(" ")[0]) + " fecha apps em segundo plano. Ative o Shaper na lista.", act: "auto", btn: "Abrir" });
    return list;
  }
  function bgHTML() {
    const it = bgItems();
    if (!it.length) return "";
    const ok = it.filter(x => x.ok).length;
    return '<div class="sec"><div class="sechead"><h3>Funcionar com o app fechado</h3><span>' + ok + '/' + it.length + '</span></div><div class="card" style="padding-block:4px">' +
      it.map(x => '<div class="setrow"><div><b>' + (x.ok ? "✅ " : "⚠️ ") + x.t + '</b><span class="note">' + x.d + '</span></div>' + (x.ok ? "" : '<button class="btn blue" data-bg="' + x.act + '">' + x.btn + '</button>') + '</div>').join("") +
      '<div class="setrow"><span class="note">Mensagens do chat e desafios do grupo chegam com o app fechado em até 15 minutos.</span></div></div></div>';
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-bg]");
    if (b) {
      const a = b.dataset.bg;
      if (a === "bat") nat("openBattery");
      if (a === "exact") nat("requestExactAlarm");
      if (a === "overlay") nat("requestOverlayPermission");
      if (a === "auto") { nat("openAutostart"); localStorage.setItem("shaper.autostart", "1"); }
      return;
    }
    if (e.target.closest("[data-bgok]")) { localStorage.setItem("shaper.bgHide", "1"); render(); return; }
    if (e.target.closest("[data-bggo]")) { tab = "ajustes"; render(); setTimeout(() => { const s = [...document.querySelectorAll(".sec h3")].find(h => /app fechado/.test(h.textContent)); if (s) s.scrollIntoView({ behavior: "smooth", block: "start" }); }, 200); return; }
    if (e.target.closest("[data-cloudnow]")) { backup(true); return; }
    if (e.target.closest("[data-cloudget]")) { restore(false); return; }
    if (e.target.closest("[data-tour]")) { startTour(); return; }
    const th = e.target.closest("[data-theme-set]"); if (th) { S.theme = th.dataset.themeSet; save(); theme(); render(); }
  });
  document.addEventListener("change", e => {
    if (e.target.id === "cloudOn") { S.cloud = e.target.checked; save(); if (S.cloud) backup(true); else toast("Backup automático desligado"); }
  });

  /* ---------- seções nos Ajustes ---------- */
  function cloudHTML() {
    if (!window.Net || !Net.on()) return "";
    const u = Net.user(), at = S.cloudAt ? new Date(S.cloudAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "nunca";
    return '<div class="sec"><div class="sechead"><h3>Backup na nuvem</h3></div><div class="card" style="padding-block:4px">' +
      (u ? '<div class="setrow"><div><b>☁️ Backup automático</b><span class="note">Guarda seus treinos, peso, água e ajustes (sem fotos) para não perder ao trocar de celular. Último: ' + at + '</span></div><label class="switch"><input id="cloudOn" type="checkbox"' + (S.cloud ? " checked" : "") + ' aria-label="Backup automático"><span></span></label></div>' +
        '<div class="setrow"><button class="btn" style="flex:1" data-cloudnow>Fazer backup agora</button><button class="btn ghost" style="flex:1" data-cloudget>Restaurar</button></div>'
        : '<div class="setrow"><span class="note">Entre na sua conta para guardar um backup dos seus treinos na nuvem.</span></div>') + '</div></div>';
  }
  function looksHTML() {
    const t = S.theme || "light";
    return '<div class="sec"><div class="sechead"><h3>Aparência</h3></div><div class="card" style="padding-block:4px"><div class="setrow wr"><div style="width:100%"><b>Tema</b>' +
      '<div class="wr-chips" style="margin-top:8px">' + [["light", "☀️ Claro"], ["dark", "🌙 Escuro"], ["auto", "📱 Automático"]].map(([k, l]) => '<button data-theme-set="' + k + '" aria-pressed="' + (t === k) + '">' + l + '</button>').join("") + '</div></div></div>' +
      '<div class="setrow"><button class="btn ghost block" data-tour>Ver o tutorial do app</button></div></div></div>';
  }
  const _vAj = vAjustes, MARK = '<div class="sec"><div class="sechead"><h3>Notificações</h3>';
  vAjustes = function () { const h = _vAj(), k = h.indexOf(MARK); return k < 0 ? h : h.slice(0, k) + cloudHTML() + bgHTML() + looksHTML() + h.slice(k); };

  // aviso na tela inicial enquanto a bateria ainda limita o app
  const _vHome = vHome;
  vHome = function () {
    const h = _vHome(), k = h.indexOf("</h1></div>");
    if (k < 0 || !NATIVE || localStorage.getItem("shaper.bgHide") || nat("batteryOk")) return h;
    const ban = '<div class="bg-ban"><span>🔋</span><div><b>Libere o Shaper na bateria</b><small>Assim alarmes e lembretes de água não atrasam.</small></div><button data-bggo>Ajustar</button><button class="x" data-bgok aria-label="Dispensar">✕</button></div>';
    return h.slice(0, k + 11) + ban + h.slice(k + 11);
  };

  // app em segundo plano: pausa as animações (economiza bateria e deixa a volta mais suave)
  document.addEventListener("visibilitychange", () => document.documentElement.classList.toggle("bg", document.hidden));

  /* ---------- tema ---------- */
  function theme() {
    const t = S.theme || "light", dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? "#0E100F" : "#EDEFEC";
  }
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", theme); } catch (e) {}
  theme();

  /* ---------- tutorial rápido (depois das boas-vindas ou pelos Ajustes) ---------- */
  const TOUR = [
    ["home", "🏠 Início", "Sua missão diária, a água do dia e o treino de hoje ficam aqui. Complete tudo para ganhar XP."],
    ["treino", "🏋️ Treino", "Comece o treino do dia, veja a semana e toque em “Montar meu treino” para criar o seu."],
    ["feed", "📸 Feed", "Poste fotos do treino, curta e comente o que a galera está fazendo."],
    ["rank", "🏆 Ranking", "Compare seu XP com todas as pessoas que usam o Shaper, na semana ou no geral."],
    ["grupo", "👥 Grupo", "Crie um grupo, chame amigos pelo QR code e converse no chat. Desafios surpresa valem XP em dobro."],
    ["mais", "➕ Mais", "Timer, Progresso, Dieta e Ajustes (conta, água, desafios e aparência) ficam aqui."]
  ];
  let T = -1;
  function drawTour() {
    let el = document.querySelector(".tour");
    if (T < 0 || T >= TOUR.length) { if (el) el.remove(); T = -1; S.tour = 1; save(); return; }
    const [k, h, p] = TOUR[T];
    const btn = document.querySelector('#tabs [data-tab="' + k + '"]');
    const r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2 - 30, top: innerHeight - 70, width: 60, height: 60 };
    if (!el) { el = document.createElement("div"); el.className = "tour"; document.body.appendChild(el); }
    el.innerHTML = '<div class="tour-hole" style="left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px"></div>' +
      '<div class="tour-card" style="bottom:' + (innerHeight - r.top + 18) + 'px"><span class="tour-n">' + (T + 1) + '/' + TOUR.length + '</span><b>' + h + '</b><p>' + p + '</p>' +
      '<div class="row between"><button class="tour-skip" data-tourskip>Pular</button><button class="tour-next" data-tournext>' + (T === TOUR.length - 1 ? "Começar 🚀" : "Próximo") + '</button></div></div>';
  }
  function startTour() { closeLayer(); tab = "home"; render(); T = 0; setTimeout(drawTour, 250); }
  window.startTour = startTour;
  document.addEventListener("click", e => {
    if (e.target.closest("[data-tournext]")) { T++; drawTour(); }
    else if (e.target.closest("[data-tourskip]")) { T = TOUR.length; drawTour(); }
  });
  window.addEventListener("resize", () => { if (T >= 0) drawTour(); });
})();
