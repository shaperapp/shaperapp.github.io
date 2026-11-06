/* Shaper · modo academia, mapa muscular, antes e depois e passos do dia
   - Carga em kg: nos exercícios com halter/kettlebell, no descanso a pessoa marca o peso usado.
     Vai para S.exlog (campo kg), vira recorde de carga e aparece na próxima vez.
   - Mapa muscular: corpo de frente e de costas colorido pelas séries feitas nos últimos 7 dias.
   - Antes e depois: monta uma imagem com a primeira e a última foto lado a lado, pronta para postar.
   - Passos: contador de passos do celular (sensor do Android), com meta e calorias estimadas. */
(function () {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const WEIGHTED = { halter: 1, kettlebell: 1 };
  const LOG = () => (S.exlog = S.exlog && typeof S.exlog === "object" ? S.exlog : {});
  const lastKg = id => { const l = LOG()[id] || []; for (let i = l.length - 1; i >= 0; i--) if (l[i].kg) return l[i].kg; return 0; };
  const bestKg = id => (LOG()[id] || []).reduce((m, x) => Math.max(m, x.kg || 0), 0);
  const fmtKg = v => String(Math.round(v * 10) / 10).replace(".", ",");

  /* ---------- carga em kg ---------- */
  function prevW() { if (!PL) return -1; for (let j = PL.i - 1; j >= 0; j--) if (PL.st[j].t === "w") return j; return -1; }
  const _rp = renderPlayer;
  renderPlayer = function () {
    _rp();
    if (!PL || PL.fin || cur().t !== "r") return;
    const j = prevW(); if (j < 0 || !(PL.done && PL.done[j])) return;
    const id = PL.st[j].id; if (!EX[id] || !WEIGHTED[EX[id].eq]) return;
    PL.kg = PL.kg || {};
    if (PL.kg[j] == null) PL.kg[j] = lastKg(id) || 5;
    const body = $("#plBody"), tm = body && body.querySelector(".pl-time"); if (!tm || body.querySelector(".kg-box")) return;
    tm.insertAdjacentHTML("beforebegin", '<div class="rp-box kg-box"><span>Carga em <b>' + esc(EX[id].n) + '</b></span>' +
      '<div class="rp-step"><button data-kg="-1" aria-label="Menos 1 kg">−</button><b><span id="kgN">' + fmtKg(PL.kg[j]) + '</span> kg</b><button data-kg="1" aria-label="Mais 1 kg">+</button></div>' +
      '<small>' + (bestKg(id) ? "Recorde: " + fmtKg(bestKg(id)) + " kg" : "Por halter. Fica salvo para a próxima vez.") + '</small></div>');
    body.querySelectorAll("[data-kg]").forEach(b => b.onclick = () => { PL.kg[j] = Math.max(0, Math.min(300, PL.kg[j] + +b.dataset.kg)); $("#kgN").textContent = fmtKg(PL.kg[j]); });
  };
  const _fin = finish;
  finish = function () {
    const kg = {};
    if (PL && PL.kg) Object.keys(PL.kg).forEach(j => { const st = PL.st[j]; if (st && PL.kg[j] > 0) kg[st.id] = Math.max(kg[st.id] || 0, PL.kg[j]); });
    const before = {}; Object.keys(kg).forEach(id => before[id] = bestKg(id));
    _fin();
    const L = LOG(), t = todayStr(), prs = [];
    Object.keys(kg).forEach(id => {
      const l = L[id]; if (!l || !l.length) return;
      const e = l[l.length - 1]; if (e.d === t) e.kg = kg[id];
      if (before[id] && kg[id] > before[id]) prs.push(EX[id].n + ": " + fmtKg(kg[id]) + " kg");
    });
    if (Object.keys(kg).length) save();
    if (prs.length) setTimeout(() => { toast("🏋️ Recorde de carga! " + prs[0]); const h = document.querySelector("#pl .done-hero h2"); if (h) h.insertAdjacentHTML("afterend", '<div class="rp-pr"><span>🏋️</span><div><b>Recorde de carga</b>' + prs.slice(0, 3).map(x => '<small>' + esc(x) + '</small>').join("") + '</div></div>'); }, 600);
  };
  const _rx = rxLong;
  rxLong = function (it) { const t = _rx(it), k = WEIGHTED[(EX[it.id] || {}).eq] && lastKg(it.id); return k ? t + " · carga: " + fmtKg(k) + " kg" : t; };

  /* ---------- mapa muscular da semana ---------- */
  // alguns exercícios antigos tinham o grupo adivinhado errado (flexão contava como abdômen)
  const FIXG = { Pushups: "Peito", Tricep_Dip: "Braços", Mountain_Climbers: "Cardio", High_Knees: "Cardio", Knee_Tuck_Jump: "Cardio", Bodyweight_Squat: "Pernas", Lunge: "Pernas", Wall_Sit: "Pernas", Lower_Back_Curl: "Costas" };
  Object.keys(FIXG).forEach(id => { if (EX[id]) EX[id].g = FIXG[id]; });
  function weekSets() {
    const from = addDays(todayStr(), -6), L = LOG(), g = {};
    Object.keys(L).forEach(id => { if (!EX[id]) return; L[id].forEach(x => { if (x.d >= from) { const k = EX[id].g || "Outros"; g[k] = (g[k] || 0) + (x.n || 1); } }); });
    return g;
  }
  function bodySVG(g, back) {
    const v = k => Math.min(1, (g[k] || 0) / 12), f = k => 'fill="var(--blue)" fill-opacity="' + (0.1 + v(k) * 0.85).toFixed(2) + '"';
    const base = 'fill="var(--field)"';
    const parts = back
      ? '<rect x="38" y="44" width="44" height="46" rx="12" ' + f("Costas") + '/><circle cx="33" cy="46" r="10" ' + f("Ombros") + '/><circle cx="87" cy="46" r="10" ' + f("Ombros") + '/>' +
        '<rect x="18" y="56" width="12" height="44" rx="6" ' + f("Braços") + '/><rect x="90" y="56" width="12" height="44" rx="6" ' + f("Braços") + '/>' +
        '<rect x="40" y="90" width="40" height="16" rx="6" ' + f("Cintura") + '/><ellipse cx="50" cy="116" rx="11" ry="11" ' + f("Glúteos") + '/><ellipse cx="70" cy="116" rx="11" ry="11" ' + f("Glúteos") + '/>' +
        '<rect x="40" y="128" width="17" height="48" rx="8" ' + f("Pernas") + '/><rect x="63" y="128" width="17" height="48" rx="8" ' + f("Pernas") + '/>'
      : '<circle cx="33" cy="46" r="10" ' + f("Ombros") + '/><circle cx="87" cy="46" r="10" ' + f("Ombros") + '/><rect x="40" y="42" width="19" height="22" rx="7" ' + f("Peito") + '/><rect x="61" y="42" width="19" height="22" rx="7" ' + f("Peito") + '/>' +
        '<rect x="18" y="56" width="12" height="44" rx="6" ' + f("Braços") + '/><rect x="90" y="56" width="12" height="44" rx="6" ' + f("Braços") + '/>' +
        '<rect x="49" y="66" width="22" height="40" rx="6" ' + f("Abdômen") + '/><rect x="39" y="68" width="9" height="36" rx="4" ' + f("Cintura") + '/><rect x="72" y="68" width="9" height="36" rx="4" ' + f("Cintura") + '/>' +
        '<rect x="40" y="110" width="17" height="66" rx="8" ' + f("Pernas") + '/><rect x="63" y="110" width="17" height="66" rx="8" ' + f("Pernas") + '/>';
    return '<svg viewBox="0 0 120 190" class="mm-body" role="img" aria-label="Corpo ' + (back ? "de costas" : "de frente") + '"><circle cx="60" cy="20" r="13" ' + base + '/><rect x="54" y="32" width="12" height="8" ' + base + '/>' + parts + '</svg>';
  }
  function mapHTML() {
    const g = weekSets(), total = Object.values(g).reduce((a, b) => a + b, 0);
    const order = ["Abdômen", "Cintura", "Glúteos", "Pernas", "Peito", "Costas", "Ombros", "Braços", "Cardio", "Alongamento"];
    const miss = order.slice(0, 8).filter(k => !g[k]);
    return '<div class="sec"><div class="sechead"><h3>Músculos da semana</h3><span>' + total + ' séries</span></div><div class="card stack" style="gap:10px">' +
      (total ? '<div class="mm-wrap"><figure>' + bodySVG(g, false) + '<figcaption>Frente</figcaption></figure><figure>' + bodySVG(g, true) + '<figcaption>Costas</figcaption></figure></div>' +
        '<div class="mm-chips">' + order.filter(k => g[k]).map(k => '<span>' + k + ' <b>' + g[k] + '</b></span>').join("") + '</div>' +
        (miss.length ? '<p class="note">Sem treino esta semana: ' + miss.join(", ") + '.</p>' : '<p class="note">Você treinou todos os grupos esta semana. 👏</p>')
        : '<p class="note">Termine um treino para ver aqui quais músculos você trabalhou nos últimos 7 dias.</p>') + '</div></div>';
  }

  /* ---------- antes e depois para postar ---------- */
  function load(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
  function cover(x, im, dx, dy, w, h) { const k = Math.max(w / im.width, h / im.height), sw = w / k, sh = h / k; x.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, dx, dy, w, h); }
  async function beforeAfter(pose) {
    const list = PHOTOS.filter(p => p.pose === pose); if (list.length < 2) return;
    const a = list[0], b = list[list.length - 1], cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1350;
    const x = cv.getContext("2d"), [ia, ib] = await Promise.all([load(a.data), load(b.data)]);
    x.fillStyle = "#0B1020"; x.fillRect(0, 0, 1080, 1350);
    cover(x, ia, 30, 150, 500, 1000); cover(x, ib, 550, 150, 500, 1000);
    x.fillStyle = "#fff"; x.font = "800 64px system-ui, sans-serif"; x.textAlign = "center"; x.fillText("ANTES  ·  AGORA", 540, 100);
    const days = diffDays(a.d, b.d), kg0 = (S.logs.find(l => l.d >= a.d && l.kg) || {}).kg, kg1 = curW(), w0 = firstWaist(), w1 = curWaist();
    x.font = "700 40px system-ui, sans-serif";
    [[a, 280], [b, 800]].forEach(([p, cx]) => { x.fillStyle = "rgba(11,16,32,.75)"; x.fillRect(cx - 150, 1080, 300, 60); x.fillStyle = "#fff"; x.fillText(fmtD(p.d), cx, 1124); });
    const facts = [days + " dias"]; if (kg0 && Math.abs(kg0 - kg1) >= .1) facts.push((kg1 - kg0 > 0 ? "+" : "") + fmtKg(kg1 - kg0) + " kg"); if (w0 && w1 && w0 !== w1) facts.push((w1 - w0 > 0 ? "+" : "") + fmtKg(w1 - w0) + " cm de cintura");
    x.font = "800 50px system-ui, sans-serif"; x.fillStyle = "#7DA2FF"; x.fillText(facts.join("  ·  "), 540, 1230);
    x.font = "600 34px system-ui, sans-serif"; x.fillStyle = "rgba(255,255,255,.7)"; x.fillText("Treinando com o Shaper", 540, 1300);
    const png = cv.toDataURL("image/jpeg", .9), txt = "Meu antes e depois: " + facts.join(" · ") + " 💪 #Shaper";
    const d = document.createElement("div"); d.className = "scrim"; d.style.zIndex = 80;
    d.innerHTML = '<div class="sheet"><div class="row between"><h2>Antes e depois</h2><button class="roundbtn" data-x aria-label="Fechar">' + IC.x + '</button></div><img class="ba-img" alt="Antes e depois" src="' + png + '"><div class="row"><button class="btn primary" style="flex:1" data-bashare>Compartilhar</button><button class="btn ghost" style="flex:1" data-bafeed>Postar no Feed</button></div><p class="note">A imagem só sai do celular se você compartilhar.</p></div>';
    document.body.appendChild(d);
    d.onclick = async e => {
      if (e.target === d || e.target.closest("[data-x]")) d.remove();
      if (e.target.closest("[data-bafeed]") && window.feedComposeWith) { d.remove(); closeLayer(); tab = "feed"; render(); feedComposeWith(png, txt); }
      if (e.target.closest("[data-bashare]")) {
        if (NATIVE) { if (!nat("shareImage", png, txt)) toast("Tire um print da imagem para postar"); else toast("Imagem salva na galeria (Shaper)"); return; }
        try { const f = new File([await (await fetch(png)).blob()], "shaper-antes-depois.jpg", { type: "image/jpeg" }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text: txt }); return; } } catch (er) {}
        const a2 = document.createElement("a"); a2.href = png; a2.download = "shaper-antes-depois.jpg"; a2.click();
      }
    };
  }
  const _ph = photosHTML;
  photosHTML = function () {
    const h = _ph(), n = PHOTOS.filter(p => p.pose === poseSel).length;
    if (n < 2) return h;
    return h.replace('<label class="btn primary block" for="phFile"', '<button class="btn blue block" data-ba="' + poseSel + '">✨ Montar antes e depois para postar</button><label class="btn primary block" for="phFile"');
  };
  document.addEventListener("click", e => { const b = e.target.closest("[data-ba]"); if (b) beforeAfter(b.dataset.ba).catch(() => toast("Não foi possível montar a imagem")); });

  const _vp = vProg;
  vProg = function () { const h = _vp(), k = h.indexOf('<div class="sec"><div class="sechead"><h3>Fotos de progresso'); return k < 0 ? h + mapHTML() : h.slice(0, k) + mapHTML() + h.slice(k); };

  /* ---------- passos do dia ---------- */
  function steps() { try { return JSON.parse(nat("stepsToday") || "null"); } catch (e) { return null; } }
  function stepsHTML() {
    if (!NATIVE || !nat("stepsAvailable")) return "";
    const st = steps() || {}, goal = S.stepGoal || 8000, log = S.stepLog = S.stepLog || {};
    if (st.perm && st.today >= 0) { log[todayStr()] = st.today; const ks = Object.keys(log).sort(); if (ks.length > 35) ks.slice(0, ks.length - 35).forEach(k => delete log[k]); }
    if (!st.perm) return '<div class="card st-card"><div class="st-top"><span>👣</span><div><b>Passos do dia</b><small>Conte seus passos e calorias gastas andando, direto do sensor do celular.</small></div></div><button class="btn blue block" data-steps-on>Ativar contador de passos</button></div>';
    const n = st.today || 0, kcal = Math.round(n * 0.04 * curW() / 70), pct = Math.min(100, n / goal * 100);
    const days = Array.from({ length: 7 }, (_, i) => addDays(todayStr(), i - 6)), mx = Math.max(goal, ...days.map(d => log[d] || 0));
    return '<div class="card st-card"><div class="st-top"><span>👣</span><div><b>' + n.toLocaleString("pt-BR") + ' passos hoje</b><small>~' + kcal + ' kcal · ~' + fmtKg(n * 0.00075) + ' km · meta ' + goal.toLocaleString("pt-BR") + '</small></div><button class="roundbtn" data-steps-goal aria-label="Mudar meta">🎯</button></div>' +
      '<div class="bar' + (n >= goal ? " ok" : "") + '"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
      '<div class="st-week">' + days.map(d => '<i style="--h:' + Math.max(4, Math.round((log[d] || 0) / mx * 100)) + '%"' + ((log[d] || 0) >= goal ? ' class="ok"' : "") + '><em>' + WD[wdOf(d)].slice(0, 1) + '</em></i>').join("") + '</div>' +
      (st.note ? '<p class="note">' + esc(st.note) + '</p>' : "") + '</div>';
  }
  const _vh = vHome;
  vHome = function () { const h = _vh(), s = stepsHTML(); if (!s) return h; const k = h.indexOf('<div class="sec"><div class="sechead"><h3>Treino de hoje'); return k < 0 ? h : h.slice(0, k) + s + h.slice(k); };
  document.addEventListener("click", e => {
    if (e.target.closest("[data-steps-on]")) { nat("requestSteps"); setTimeout(render, 2500); return; }
    if (e.target.closest("[data-steps-goal]")) { const L = [5000, 6000, 8000, 10000, 12000], g = S.stepGoal || 8000; S.stepGoal = L[(L.indexOf(g) + 1) % L.length]; save(); render(); toast("Meta: " + S.stepGoal.toLocaleString("pt-BR") + " passos"); }
  });
  window.shaperSteps = () => { if (tab === "home" && !PL) render(); };
})();
