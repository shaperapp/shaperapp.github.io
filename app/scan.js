/* Ritmiq · leitor de QR code ao vivo para entrar num grupo
   Abre a câmera dentro do app e lê o QR sozinho (cerca de 4 quadros por segundo). Lê só o
   quadrado da mira (mais rápido e mais certeiro). No Android cada quadro é decodificado pelo
   app (ZXing); no navegador usa o BarcodeDetector, se houver. Tem lanterna quando o celular deixa. */
(function () {
  "use strict";
  let Q = null; // { el, stream, timer, det, track, torch, misses }

  function close() {
    if (!Q) return;
    clearInterval(Q.timer);
    if (Q.stream) Q.stream.getTracks().forEach(t => t.stop());
    Q.el.classList.add("out");
    const el = Q.el; setTimeout(() => el.remove(), 220);
    Q = null;
  }
  function found(txt) {
    if (!Q || Q.done) return;
    Q.done = true;
    Q.el.classList.add("ok");
    Q.el.querySelector(".qs-hint").textContent = "QR lido! Entrando…";
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
    nat("vibrate", 60);
    setTimeout(() => { close(); window.qrScanned && qrScanned(txt); }, 450);
  }
  // recorta o quadrado do meio da imagem (onde fica a mira) e manda decodificar
  function tick(video, cv) {
    if (!Q || Q.done || video.readyState < 2 || Q.busy) return;
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
    const side = Math.round(Math.min(vw, vh) * .78), sx = (vw - side) / 2, sy = (vh - side) / 2 - vh * .05, out = Math.min(720, side);
    cv.width = cv.height = out;
    cv.getContext("2d").drawImage(video, sx, Math.max(0, sy), side, side, 0, 0, out, out);
    if (NATIVE) {
      const t = nat("decodeQr", cv.toDataURL("image/jpeg", .8));
      if (t) found(t); else miss();
    } else if (Q.det) {
      Q.busy = true;
      Q.det.detect(cv).then(r => { if (r && r[0]) found(r[0].rawValue); else miss(); }).catch(() => {}).finally(() => { if (Q) Q.busy = false; });
    }
  }
  // depois de uns segundos sem achar, dá uma dica
  function miss() {
    if (!Q) return;
    Q.misses++;
    if (Q.misses === 28) Q.el.querySelector(".qs-hint").textContent = "Chegue mais perto e deixe o QR inteiro dentro da mira";
    if (Q.misses === 60 && Q.track && Q.torchOk && !Q.torch) Q.el.querySelector(".qs-hint").textContent = "Muito escuro? Toque na lanterna 🔦";
  }
  async function setTorch(on) {
    if (!Q || !Q.track) return;
    try { await Q.track.applyConstraints({ advanced: [{ torch: on }] }); Q.torch = on; Q.el.querySelector("[data-qstorch]").setAttribute("aria-pressed", on); } catch (e) { toast("Lanterna indisponível neste celular"); }
  }

  window.qrLive = async function () {
    if (Q) return;
    const el = document.createElement("div");
    el.className = "qs";
    el.innerHTML = '<video playsinline muted autoplay></video><div class="qs-shade"></div>' +
      '<div class="qs-frame"><s class="c1"></s><s class="c2"></s><s class="c3"></s><s class="c4"></s><i></i><b></b></div>' +
      '<div class="qs-top"><button class="qs-ic" data-qsclose aria-label="Fechar">✕</button><div><b>Entrar num grupo</b><span>Escaneie o QR code do grupo do seu amigo</span></div><button class="qs-ic" data-qstorch aria-pressed="false" aria-label="Lanterna" hidden>🔦</button></div>' +
      '<p class="qs-hint">Procurando QR code…</p>' +
      '<div class="qs-acts"><button data-qsgal><span>🖼️</span>Foto da galeria</button><button data-qscode><span>⌨️</span>Digitar código</button></div>';
    document.body.appendChild(el);
    Q = { el, stream: null, timer: null, det: null, busy: false, track: null, torch: false, torchOk: false, misses: 0, done: false };
    el.addEventListener("click", e => {
      if (e.target.closest("[data-qsclose]")) close();
      else if (e.target.closest("[data-qstorch]")) setTorch(!Q.torch);
      else if (e.target.closest("[data-qsgal]")) { close(); if (NATIVE) nat("scanQr", "gallery"); else toast("A foto da galeria funciona no app Android"); }
      else if (e.target.closest("[data-qscode]")) { close(); if (window.grpTypeCode) grpTypeCode(); }
    });
    if (!NATIVE && "BarcodeDetector" in window) { try { Q.det = new BarcodeDetector({ formats: ["qr_code"] }); } catch (e) {} }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      if (!Q) { s.getTracks().forEach(t => t.stop()); return; }
      Q.stream = s; Q.track = s.getVideoTracks()[0];
      try {
        const cap = Q.track.getCapabilities ? Q.track.getCapabilities() : {};
        if (cap.torch) { Q.torchOk = true; el.querySelector("[data-qstorch]").hidden = false; }
        if (cap.focusMode && cap.focusMode.includes("continuous")) Q.track.applyConstraints({ advanced: [{ focusMode: "continuous" }] }).catch(() => {});
      } catch (e) {}
      const v = el.querySelector("video"), cv = document.createElement("canvas");
      v.srcObject = s;
      await v.play().catch(() => {});
      el.classList.add("live");
      Q.timer = setInterval(() => tick(v, cv), 250);
    } catch (e) {
      // sem câmera ao vivo: cai para foto
      close();
      if (NATIVE) nat("scanQr", "camera");
      else toast("Não foi possível abrir a câmera aqui");
    }
  };
  window.scanDenied = () => { close(); toast("Sem permissão de câmera. Use “Foto da galeria”."); };
  window.addEventListener("pagehide", close);
})();
