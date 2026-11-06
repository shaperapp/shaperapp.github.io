/* Shaper · voz da treinadora (v2.17)
   Voz feminina fixa, suave e clara. No Android quem cuida é o Voice.java (escolhe uma voz
   feminina instalada e offline, que não muda no meio do treino). No iPhone/navegador usamos a voz
   feminina do sistema (Luciana, Francisca, Google português…). Em todos: a contagem 3, 2, 1 entra
   em fila e não corta a fala anterior. Em Ajustes → Som e voz dá para escolher a voz e o jeito. */
(function () {
  "use strict";
  const STY = { suave: [0.92, 0.97, "Suave"], normal: [1.0, 1.0, "Normal"], animada: [1.08, 1.05, "Animada"] };
  const V = () => (S.voz = S.voz && typeof S.voz === "object" ? S.voz : { name: "", st: "suave" });
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function push() { const v = V(), s = STY[v.st] || STY.suave; nat("voiceChoose", v.name || "", s[0], s[1]); }
  if (NATIVE) push();

  /* ---------- navegador / iPhone ---------- */
  const SS = window.speechSynthesis;
  const FEM = /luciana|francisca|fernanda|camila|vit[oó]ria|maria|joana|google portugu|female|feminina|samantha|paulina|monica|m[oó]nica|helena|elvira/i;
  function webVoices() {
    if (!SS) return [];
    const lang = S.lang === "en" ? "en" : S.lang === "es" ? "es" : "pt";
    return SS.getVoices().filter(v => (v.lang || "").toLowerCase().startsWith(lang));
  }
  function webPick() {
    const list = webVoices(), want = V().name;
    return list.find(v => v.name === want) ||
      list.find(v => FEM.test(v.name) && /BR|MX|US/i.test(v.lang) && v.localService) || list.find(v => FEM.test(v.name)) ||
      list.find(v => /BR/i.test(v.lang) && v.localService) || list[0] || null;
  }
  if (!NATIVE && SS) {
    const speak = SS.speak.bind(SS), cancel = SS.cancel.bind(SS);
    let next = null;
    // o app chama cancel() antes de cada fala; só cortamos de verdade quando a próxima fala é longa
    SS.cancel = function () { next = "cancel"; };
    SS.speak = function (u) {
      const short = (u.text || "").length <= 14;
      if (next === "cancel" && !short) cancel();
      next = null;
      const v = webPick(), s = STY[V().st] || STY.suave;
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = s[0]; u.pitch = s[1]; u.volume = 1;
      speak(u);
    };
    window.shaperStopVoice = cancel;
    try { SS.getVoices(); SS.onvoiceschanged = () => {}; } catch (e) {}
  }

  /* ---------- Ajustes → Som e voz ---------- */
  function list() {
    if (NATIVE) { try { return JSON.parse(nat("voiceList") || "[]").map(o => ({ id: o.n, f: o.f, off: o.off, br: o.br })); } catch (e) { return []; } }
    return webVoices().map(v => ({ id: v.name, f: FEM.test(v.name), off: v.localService, br: /BR/i.test(v.lang) }));
  }
  function label(o, i) {
    return (o.f ? "Voz feminina " : "Voz ") + (i + 1) + (o.br ? "" : " (outro sotaque)") + (o.off ? "" : " · precisa de internet");
  }
  function box() {
    const v = V(), L = list().sort((a, b) => (b.f - a.f) || (b.off - a.off) || (b.br - a.br));
    return '<div class="setrow wr vz-box"><div style="width:100%"><b>Voz da treinadora</b><span class="note">A voz Dora é uma voz feminina de IA gravada dentro do app: natural, sempre igual e funciona sem internet. Frases que ela não tem são ditas pela voz do celular.</span>' +
      '<div class="wr-chips" style="margin-top:8px"><button data-vzia="1" aria-pressed="' + (v.ia !== false) + '">Voz IA Dora (recomendada)</button><button data-vzia="0" aria-pressed="' + (v.ia === false) + '">Só a voz do celular</button></div>' +
      '<span class="note" style="margin-top:8px">Voz do celular (usada quando a Dora não tem a frase):</span>' +
      '<label class="f" style="margin-top:8px">Qual voz<select id="vzName"><option value="">Automática (feminina)</option>' + L.map((o, i) => '<option value="' + esc(o.id) + '"' + (o.id === v.name ? " selected" : "") + '>' + esc(label(o, i)) + '</option>').join("") + '</select></label>' +
      '<div class="wr-chips" style="margin-top:8px">' + Object.keys(STY).map(k => '<button data-vzst="' + k + '" aria-pressed="' + (v.st === k) + '">' + STY[k][2] + '</button>').join("") + '</div>' +
      (L.length ? "" : '<span class="note" style="margin-top:6px">Se não aparecer nenhuma voz feminina, instale "Serviços de fala do Google" e baixe a voz em português nas configurações do celular.</span>') + '</div></div>';
  }
  const _va = vAjustes;
  vAjustes = function () {
    const h = _va(), m = '<div class="setrow"><button class="btn ghost" style="flex:1" id="testAlarm">';
    return h.indexOf(m) < 0 ? h : h.replace(m, box() + m);
  };
  /* ---------- voz de IA "Dora" (áudios gravados dentro do app, funciona sem internet) ---------- */
  let KEYS = null;
  fetch("voz/index.json").then(r => r.ok ? r.json() : []).then(a => { KEYS = new Set(a); }).catch(() => {});
  const key = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  /** Quebra a frase em pedaços que têm áudio. Se algum pedaço não tiver, devolve null (aí fala a voz do celular). */
  function plan(t) {
    if (!KEYS) return null;
    const out = [];
    for (let seg of t.split(/[.!?;]+/)) {
      for (let part of seg.split(/:/)) {
        part = part.trim(); if (!part) continue;
        const bits = /^[\d,\s]+$/.test(part) ? part.split(/[,\s]+/).filter(Boolean) : [part];
        for (const b of bits) { const k = key(b); if (!KEYS.has(k)) return null; out.push(k); }
      }
    }
    return out.length ? out : null;
  }
  const iaOn = () => V().ia !== false && (!S.lang || S.lang === "pt");
  // navegador / iPhone: toca os áudios em fila
  const A = typeof Audio !== "undefined" ? new Audio() : null;
  let AQ = [];
  function aNext() { const k = AQ.shift(); if (!k || !A) return; A.src = "voz/" + k + ".mp3"; A.play().catch(() => {}); }
  if (A) A.onended = aNext;
  function play(ks, add) {
    if (NATIVE) { nat("speakClips", JSON.stringify(ks), !!add); return; }
    if (!A) return;
    if (!add) { AQ = []; try { A.pause(); } catch (e) {} if (window.shaperStopVoice) shaperStopVoice(); }
    AQ.push.apply(AQ, ks);
    if (A.paused || A.ended || !A.src) aNext();
  }
  const _say2 = say;
  say = function (t) {
    if (!S.voice || !t) return _say2(t);
    if (iaOn()) { const ks = plan(String(t)); if (ks) { play(ks, String(t).length <= 14); return; } }
    if (!NATIVE && A) { AQ = []; try { A.pause(); } catch (e) {} }
    _say2(t);
  };
  // iPhone: o primeiro toque libera o áudio para o resto do treino
  if (!NATIVE && A) document.addEventListener("touchend", function un() { try { A.muted = true; A.src = "voz/1.mp3"; A.play().then(() => { A.pause(); A.muted = false; }).catch(() => { A.muted = false; }); } catch (e) {} document.removeEventListener("touchend", un); }, { once: true });

  function test() { const s = S.voice; S.voice = true; say("Prancha. 40 segundos. Meta de 15 repetições. Faltam 10 segundos. 3, 2, 1."); S.voice = s; }
  document.addEventListener("change", e => { if (e.target.id === "vzName") { V().name = e.target.value; save(); push(); setTimeout(test, 250); } });
  document.addEventListener("click", e => {
    const ia = e.target.closest("[data-vzia]");
    if (ia) { V().ia = ia.dataset.vzia === "1"; save(); render(); setTimeout(test, 250); return; }
    const b = e.target.closest("[data-vzst]"); if (!b) return;
    V().st = b.dataset.vzst; save(); push(); render(); setTimeout(test, 250);
  });
})();
