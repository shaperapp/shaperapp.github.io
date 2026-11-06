/* Ritmiq · aba Ajustes organizada
   Junta as seções (do app original e das novas) em grupos que abrem e fecham, com um cartão de
   perfil no topo, atalhos rápidos e busca. Também traz o horário das missões surpresa. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hh = h => String(h).padStart(2, "0") + "h";
  const DAYS = ["S", "T", "Q", "Q", "S", "S", "D"], DAYN = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

  /* ---------- desafios e missões: quando podem aparecer ---------- */
  function sched() {
    const d = { from: 9, to: 21, max: 2, days: 127, work: false, wf: 8, wt: 18, wd: 31, next: 0 };
    try { return Object.assign(d, NATIVE ? JSON.parse(nat("getChallengeSchedule") || "{}") : (S.chs || {})); } catch (e) { return d; }
  }
  function saveSched(x) {
    if (x.to <= x.from) x.to = Math.min(24, x.from + 1);
    if (NATIVE) nat("setChallengeSchedule", JSON.stringify(x)); else { S.chs = x; save(); }
  }
  const hsel = (id, v, a, b) => { let s = ""; for (let h = a; h <= b; h++) s += '<option value="' + h + '"' + (h === v ? " selected" : "") + '>' + hh(h) + '</option>'; return '<select id="' + id + '" data-chs="' + id + '">' + s + '</select>'; };
  const dayChips = (mask, key) => '<div class="ds-days">' + DAYS.map((l, i) => '<button data-chday="' + key + ':' + i + '" aria-pressed="' + !!(mask & (1 << i)) + '" aria-label="' + DAYN[i] + '">' + l + '</button>').join("") + '</div>';
  function chsHTML() {
    const x = sched(), next = x.next > Date.now() ? new Date(x.next) : null;
    const nextTxt = next ? next.toLocaleDateString("pt-BR", { weekday: "short" }) + " às " + String(next.getHours()).padStart(2, "0") + ":" + String(next.getMinutes()).padStart(2, "0") : "—";
    return '<div class="sec"><div class="sechead"><h3>Desafios e missões</h3></div><div class="card" style="padding-block:4px">' +
      '<div class="setrow wr"><div style="width:100%"><b>⚔️ Missões surpresa podem aparecer</b><span class="note">O app sorteia o horário dentro dessa janela.</span>' +
      '<div class="wr-time"><label>Das' + hsel("chFrom", x.from, 0, 23) + '</label><label>até' + hsel("chTo", x.to, 1, 24) + '</label></div>' +
      '<span class="ds-lbl">Quantas por dia</span><div class="wr-chips">' + [1, 2, 3].map(n => '<button data-chmax="' + n + '" aria-pressed="' + (x.max === n) + '">' + n + 'x</button>').join("") + '</div>' +
      '<span class="ds-lbl">Em quais dias</span>' + dayChips(x.days, "days") + '</div></div>' +
      '<div class="setrow"><div><b>💼 Horário de trabalho ou estudo</b><span class="note">Nesse período nenhuma missão aparece.</span></div><label class="switch"><input id="chWork" type="checkbox"' + (x.work ? " checked" : "") + ' aria-label="Horário de trabalho"><span></span></label></div>' +
      (x.work ? '<div class="setrow wr"><div style="width:100%"><div class="wr-time"><label>Das' + hsel("chWf", x.wf, 0, 23) + '</label><label>até' + hsel("chWt", x.wt, 1, 24) + '</label></div><span class="ds-lbl">Dias de trabalho</span>' + dayChips(x.wd, "wd") + '</div></div>' : "") +
      '<div class="setrow"><span class="note">⏳ Próxima missão sorteada: <b>' + nextTxt + '</b>. O horário do desafio do grupo é escolhido pelo dono do grupo, na aba Grupo.</span></div></div></div>';
  }
  document.addEventListener("change", e => {
    const t = e.target, k = t.dataset && t.dataset.chs;
    if (!k && t.id !== "chWork") return;
    const x = sched();
    if (t.id === "chWork") x.work = t.checked;
    if (k === "chFrom") x.from = +t.value;
    if (k === "chTo") x.to = +t.value;
    if (k === "chWf") x.wf = +t.value;
    if (k === "chWt") x.wt = +t.value;
    saveSched(x); render(); toast("Horário das missões atualizado");
  });
  document.addEventListener("click", e => {
    const m = e.target.closest("[data-chmax]"), d = e.target.closest("[data-chday]");
    if (!m && !d) return;
    const x = sched();
    if (m) x.max = +m.dataset.chmax;
    if (d) {
      const [key, i] = d.dataset.chday.split(":"), bit = 1 << +i;
      x[key] ^= bit;
      if (!x[key]) { x[key] = bit; toast("Escolha pelo menos um dia"); }
    }
    saveSched(x); render();
  });

  /* ---------- organização em grupos ---------- */
  const CATS = [
    ["conta", "👤", "Conta e perfil", "Nome, foto, login, bloqueados", ["Conta", "Perfil"]],
    ["plano", "🎯", "Plano, água e desafios", "Meta de água, lembretes, missões", ["Meu plano", "Desafios e missões", "Sistema"]],
    ["notif", "🔔", "Notificações e som", "Lembretes, voz, app fechado", ["Notificações", "Som e voz", "Funcionar com o app fechado"]],
    ["visual", "🎨", "Aparência e vídeos", "Tema, demonstração dos exercícios", ["Aparência", "Demonstração"]],
    ["dados", "☁️", "Dados e backup", "Nuvem, arquivo de backup", ["Backup na nuvem", "Backup"]],
    ["sobre", "ℹ️", "Sobre o app", "Versão, privacidade, ajuda", ["Sobre"]]
  ];
  const OK = "shaper.setOpen";
  const opened = () => { try { return JSON.parse(localStorage.getItem(OK)) || ["conta"]; } catch (e) { return ["conta"]; } };

  function header(root) {
    const a = window.netAcct ? netAcct() : { name: "Atleta" }, u = window.Net && Net.user(), x = window.sysStats ? sysStats() : {};
    const av = window.netAvatar ? netAvatar({ photo: a.photo, avatar: a.avatar, rank: x.rank }, "lg") : "";
    const q = id => root.querySelector("#" + id);
    const chip = (ic, t, on, attr) => '<button class="st-q' + (on ? " on" : "") + '" ' + attr + '><span>' + ic + '</span>' + t + '</button>';
    const th = S.theme || "light";
    return '<div class="st-head"><div class="st-me">' + av + '<div><b>' + esc(myName()) + '</b><span>' + (u ? esc(u.email) : "Sem conta · toque para entrar") + '</span><small>Rank ' + esc(x.rank || "E") + ' · Nível ' + (x.level || 1) + '</small></div>' +
      '<button class="st-edit" ' + (u ? 'data-stopen="conta"' : "data-login") + '>' + (u ? "Editar" : "Entrar") + '</button></div>' +
      '<div class="st-qs">' +
      (q("obCard") ? chip("💧", "Cartão água", q("obCard").hasAttribute("checked"), 'data-stproxy="obCard"') : "") +
      (q("sysBub") ? chip("🫧", "Bolha", q("sysBub").hasAttribute("checked"), 'data-stproxy="sysBub"') : "") +
      chip(th === "dark" ? "🌙" : th === "auto" ? "📱" : "☀️", th === "dark" ? "Escuro" : th === "auto" ? "Automático" : "Claro", th !== "light", "data-stheme") +
      chip("🔔", "Testar água", false, "data-wrtest") + '</div>' +
      '<label class="st-search"><span>🔍</span><input id="stQ" placeholder="Buscar nos ajustes" autocomplete="off"></label></div>';
  }
  const _vAj = vAjustes;
  vAjustes = function () {
    let h = _vAj();
    const k = h.indexOf('<div class="sec"><div class="sechead"><h3>Sistema</h3>');
    if (k >= 0) h = h.slice(0, k) + chsHTML() + h.slice(k);
    const tpl = document.createElement("template");
    tpl.innerHTML = h;
    const root = tpl.content.firstElementChild;
    if (!root) return h;
    const secs = [...root.querySelectorAll(":scope > .sec")], top = root.firstElementChild, used = new Set(), op = opened();
    const pick = names => secs.filter(s => { const t = (s.querySelector("h3") || {}).textContent || ""; if (names.includes(t.trim()) && !used.has(s)) { used.add(s); return true; } return false; });
    let body = "";
    CATS.forEach(([key, ic, t, d, names]) => {
      const list = pick(names);
      if (!list.length) return;
      body += '<details class="st-cat" data-cat="' + key + '"' + (op.includes(key) ? " open" : "") + '><summary><span class="st-ic">' + ic + '</span><span class="st-t"><b>' + t + '</b><small>' + d + '</small></span><i class="st-chev"></i></summary>' +
        '<div class="st-body">' + list.map(s => s.outerHTML).join("") + '</div></details>';
    });
    const rest = secs.filter(s => !used.has(s));
    if (rest.length) body += '<details class="st-cat" data-cat="outros"' + (op.includes("outros") ? " open" : "") + '><summary><span class="st-ic">🧩</span><span class="st-t"><b>Outros</b><small>Mais opções</small></span><i class="st-chev"></i></summary><div class="st-body">' + rest.map(s => s.outerHTML).join("") + '</div></details>';
    return '<div class="stack st">' + (top ? top.outerHTML : "") + header(root) + body + '</div>';
  };

  document.addEventListener("toggle", e => {
    const d = e.target;
    if (!d.classList || !d.classList.contains("st-cat") || document.getElementById("stQ") && document.getElementById("stQ").value) return;
    const s = new Set(opened());
    if (d.open) s.add(d.dataset.cat); else s.delete(d.dataset.cat);
    localStorage.setItem(OK, JSON.stringify([...s]));
  }, true);
  document.addEventListener("click", e => {
    const p = e.target.closest("[data-stproxy]");
    if (p) { const i = document.getElementById(p.dataset.stproxy); if (i) { i.click(); setTimeout(render, 120); } return; }
    if (e.target.closest("[data-stheme]")) { const n = { light: "dark", dark: "auto", auto: "light" }[S.theme || "light"], b = document.querySelector('[data-theme-set="' + n + '"]'); if (b) b.click(); return; }
    const o = e.target.closest("[data-stopen]");
    if (o) { const d = document.querySelector('.st-cat[data-cat="' + o.dataset.stopen + '"]'); if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); } }
  });
  // busca: mostra só os grupos e linhas que têm o texto
  document.addEventListener("input", e => {
    if (e.target.id !== "stQ") return;
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll(".st-cat").forEach(d => {
      const hit = !q || d.textContent.toLowerCase().includes(q);
      d.hidden = !hit;
      if (q && hit) d.open = true;
      d.querySelectorAll(".setrow").forEach(r => { r.classList.toggle("st-hit", !!q && r.textContent.toLowerCase().includes(q)); });
    });
  });
})();
