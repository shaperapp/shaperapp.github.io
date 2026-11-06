/* Ritmiq · barra de abas: Início, Treino, Feed, Ranking, Grupo e Mais
   Timer, Progresso, Dieta e Ajustes ficam na aba Mais (e continuam abrindo pelos atalhos). */
(function () {
  "use strict";
  IC.feed = '<svg class="i" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="9" cy="9.5" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/></svg>';
  IC.mais = '<svg class="i" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/></svg>';
  const MORE = ["timer", "prog", "dieta", "ajustes", "admin"];
  TABS.length = 0;
  [["home", "Início"], ["treino", "Treino"], ["feed", "Feed"], ["rank", "Ranking"], ["grupo", "Grupo"], ["mais", "Mais"]].forEach(t => TABS.push(t));

  // aba ativa: dentro de "Mais" acende o botão Mais
  const _rt = renderTabs;
  renderTabs = function () {
    const real = tab;
    if (MORE.includes(real)) { tab = "mais"; try { _rt(); } finally { tab = real; } }
    else _rt();
  };

  const TILES = [
    ["timer", "⏱️", "Timer", "Intervalos e cronômetro"],
    ["prog", "📈", "Progresso", "Peso, cintura e fotos"],
    ["dieta", "🥗", "Dieta", "Água, proteína e compras"],
    ["ajustes", "⚙️", "Ajustes", "Conta, lembretes, aparência"]
  ];
  function vMais() {
    const x = window.sysStats ? sysStats() : {}, adm = window.amAdmin && Net.user() ? [["admin", "🛡️", "Admin", "Moderação e pessoas"]] : [];
    if (window.admCheck) admCheck();
    return '<div class="stack"><div><div class="greet">Ritmiq</div><h1>Mais</h1></div>' +
      (S.adm && S.adm.ban ? '<div class="card ad-banned"><b>⛔ Conta suspensa</b><p class="note">' + (S.adm.why ? S.adm.why.replace(/[&<>"]/g, "") : "Sua conta foi suspensa pela moderação.") + ' Você ainda pode treinar, mas não pode postar, comentar nem conversar.</p></div>' : "") +
      '<div class="mx-grid">' + TILES.concat(adm).map(([k, ic, t, d]) => '<button class="mx-tile" data-goto="' + k + '"><span>' + ic + '</span><b>' + t + '</b><small>' + d + '</small></button>').join("") + '</div>' +
      '<button class="mx-invite" data-invite><span>📣</span><div><b>Convidar amigos</b><small>Treinar junto é mais fácil. Mande o Ritmiq para alguém!</small></div><i>↗</i></button>' +
      '<div class="card mx-row"><button data-goto="sistema">⚔️ Status do Sistema · Rank ' + (x.rank || "E") + '</button><button data-tour>🧭 Ver o tutorial</button></div></div>';
  }

  // convite para baixar o app (link do site com o download)
  const SITE = "https://shaperapp.github.io/";
  window.inviteFriends = async function () {
    const x = window.sysStats ? sysStats() : {};
    const txt = "Tô treinando com o Ritmiq 💪 Treinos guiados com vídeo, ranking com os amigos e desafios surpresa" + (x.rank ? " (já sou Rank " + x.rank + "!)" : "") + ". Baixa e treina comigo: " + SITE;
    if (NATIVE) { nat("share", txt); return; }
    if (navigator.share) { try { await navigator.share({ text: txt }); return; } catch (e) { return; } }
    try { await navigator.clipboard.writeText(txt); toast("Convite copiado: cole no WhatsApp"); } catch (e) { toast(SITE); }
  };
  document.addEventListener("click", e => { if (e.target.closest("[data-invite]")) inviteFriends(); });
  (window.EXTRA_VIEWS = window.EXTRA_VIEWS || {}).mais = vMais;

  document.addEventListener("click", e => {
    const g = e.target.closest("[data-goto]");
    if (!g) return;
    if (g.dataset.goto === "sistema") { if (window.sysOpen) sysOpen(); return; }
    tab = g.dataset.goto; render(); scrollTo(0, 0);
  });
  // a aba Ranking antiga (só grupo) virou Grupo: quem tinha ela aberta vai para o lugar certo
  if (!TABS.some(t => t[0] === tab) && !MORE.includes(tab)) tab = "home";
  render();
})();
