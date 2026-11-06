/* Ritmiq · versão web (iPhone e navegador)
   Só roda fora do app Android. Abre links de treino (?t=) e de grupo (?c=) vindos do site,
   mostra como instalar no iPhone (Safari → Compartilhar → Adicionar à Tela de Início) e,
   no Android pelo navegador, oferece o app completo. */
(function () {
  "use strict";
  if (NATIVE) return;
  const ua = navigator.userAgent || "";
  const IOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const ANDROID = /Android/i.test(ua);
  const STANDALONE = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  document.documentElement.classList.add("web");
  if (IOS) document.documentElement.classList.add("ios");

  // links do site: /app/?t=CODIGO (treino) e /app/?c=CODIGO (grupo)
  const q = new URLSearchParams(location.search), clean = v => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const t = clean(q.get("t")), c = clean(q.get("c"));
  if (t.length === 6 || c.length === 6) {
    history.replaceState(null, "", location.pathname);
    setTimeout(() => {
      if (t.length === 6 && window.wkImportCode) wkImportCode(t);
      if (c.length === 6 && window.grpJoinLink) grpJoinLink(c);
    }, 1200);
  }

  // cartão no Início: instalar no iPhone ou baixar o app Android
  const HIDE = "shaper.pwaHint";
  function hint() {
    if (STANDALONE || localStorage.getItem(HIDE)) return "";
    if (IOS) return '<div class="card pw-hint"><div class="pw-top"><span>📲</span><div><b>Instale o Ritmiq no iPhone</b><small>Fica com ícone na tela e abre em tela cheia, como um app.</small></div><button class="pw-x" data-pwx aria-label="Fechar">×</button></div>' +
      '<ol><li>Toque em <b>Compartilhar</b> <svg viewBox="0 0 24 24" class="pw-sh"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 11v9h14v-9"/></svg> na barra do Safari</li><li>Escolha <b>Adicionar à Tela de Início</b></li><li>Toque em <b>Adicionar</b></li></ol>' +
      (/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV/i.test(ua) ? '<p class="note">Abra este link no <b>Safari</b> para instalar.</p>' : "") + '</div>';
    if (ANDROID) return '<div class="card pw-hint"><div class="pw-top"><span>🤖</span><div><b>Tem Android? Baixe o app completo</b><small>Com alarme com a tela desligada, bolha do treino, widgets e contador de passos.</small></div><button class="pw-x" data-pwx aria-label="Fechar">×</button></div><a class="btn primary block" href="../Ritmiq.apk" download>⬇ Baixar para Android</a></div>';
    return "";
  }
  const _vh = vHome;
  vHome = function () { const h = _vh(), x = hint(); if (!x) return h; const k = h.indexOf('<div class="sec"><div class="sechead"><h3>Atalhos'); return k < 0 ? x + h : h.slice(0, k) + x + h.slice(k); };
  document.addEventListener("click", e => { if (e.target.closest("[data-pwx]")) { localStorage.setItem(HIDE, "1"); render(); } });
})();
