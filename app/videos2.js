/* Shaper · vídeos no formato certo e Versão leve sem fotos (v2.16)
   - Vídeos verticais (Shorts) aparecem numa moldura em pé, sem faixas pretas; os deitados
     ficam em 16:9. A lista dos verticais foi conferida no YouTube; links colados pela pessoa
     com "/shorts/" também entram como verticais.
   - Versão leve: as listas de exercícios mostram só o nome (sem foto) e, ao tocar, o exercício
     abre já com o vídeo do YouTube tocando sozinho. Na versão normal nada muda.
   - Mais rápido no celular: conecta antes ao YouTube, fotos carregam só quando aparecem. */
(function () {
  "use strict";
  const VERT = new Set(["l2AH6gMvY4c", "mJilHWIBWO8", "N28Hpdezg7Q", "mzr0RYNDzzI", "AI5A1PRYX7E", "aNXGOpP37CY", "aIq0fLi8iak", "mwRXjTOYy6g"]);
  const isVert = v => !!v && (VERT.has(v) || !!(S.vvert && S.vvert[v]));
  window.vidIsVert = isVert;

  // conectar antes aos servidores do vídeo deixa o play começar mais rápido
  ["https://www.youtube-nocookie.com", "https://i.ytimg.com", "https://www.google.com", "https://static.doubleclick.net"].forEach((h, i) => {
    if (i > 1) return;
    const l = document.createElement("link"); l.rel = "preconnect"; l.href = h; l.crossOrigin = ""; document.head.appendChild(l);
  });

  // versão leve: sempre vídeo (quando tem internet), nunca as fotos
  const _use = useVideo;
  useVideo = function () { return (S.light && navigator.onLine !== false) || _use(); };

  const _vid = vidHTML;
  vidHTML = function (id, sp) {
    // na versão leve o vídeo vale mesmo se a demonstração estiver em "boneco" ou "fotos"
    const d = S.demo, force = S.light && navigator.onLine !== false;
    let h;
    if (force) S.demo = "video";
    try { h = _vid(id, sp); } finally { S.demo = d; }
    const v = vidId(id);
    if (v && /class="vid yt/.test(h)) {
      h = h.replace('class="vid yt', 'class="vid yt ' + (isVert(v) ? "vert" : "wide"));
      if (S.light) h = h.replace(/<img alt="" src="[^"]*">/, ""); // sem foto por trás do vídeo
    }
    return h;
  };

  const _th = thumbHTML;
  thumbHTML = function (id) {
    if (S.light) return ""; // versão leve: só o nome do exercício
    return _th(id).replace(/<img /g, '<img loading="lazy" decoding="async" ');
  };

  try { if (!document.querySelector("#layer > *")) render(); } catch (e) {}

  // link colado pela pessoa: se for /shorts/, guarda como vertical
  document.addEventListener("submit", e => {
    const f = e.target; if (!f || f.id !== "vform") return;
    const u = (f.querySelector("#vurl") || {}).value || "", v = ytId(u);
    if (v) { S.vvert = S.vvert || {}; if (/shorts\//.test(u)) S.vvert[v] = 1; else delete S.vvert[v]; }
  }, true);
})();
