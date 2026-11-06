/* Shaper · backup na nuvem completo
   O backup dos números (extras.js) agora vem ligado por padrão para quem entra na conta, e as
   fotos de progresso também vão para a nuvem num espaço privado (bucket "fotos", pasta com o id
   da pessoa: só ela vê). Celular novo: as fotos voltam sozinhas. Apagar uma foto apaga lá também. */
(function () {
  "use strict";
  if (!window.Net) return;
  const B = "fotos";
  const nameOf = p => p.id + "_" + p.d + "_" + (p.pose === "lado" ? "lado" : "frente") + ".jpg";
  const parse = n => { const m = /^(\d+)_(\d{4}-\d{2}-\d{2})_(frente|lado)\.jpg$/.exec(n); return m ? { id: +m[1], d: m[2], pose: m[3] } : null; };
  const toBlob = data => fetch(data).then(r => r.blob());
  const toData = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(blob); });

  async function list() {
    const u = Net.user();
    const r = await Net.priv("POST", "list/" + B, JSON.stringify({ prefix: u.id + "/", limit: 1000 }), "application/json");
    return (await r.json()).map(o => o.name).filter(Boolean);
  }
  let busy = false;
  /** Sobe as fotos que ainda não estão na nuvem e baixa as que só estão lá. */
  async function syncPhotos(manual) {
    const u = Net.user();
    if (!u || busy || !S.cloud) return;
    busy = true;
    let up = 0, down = 0;
    try {
      const remote = await list(), have = new Set(remote);
      await loadPhotos();
      const local = new Set(PHOTOS.map(nameOf));
      for (const p of PHOTOS) {
        const n = nameOf(p);
        if (have.has(n)) continue;
        try { await Net.priv("POST", B + "/" + u.id + "/" + n, await toBlob(p.data), "image/jpeg"); up++; }
        catch (e) { if (!/exist|409|Duplicate/i.test(e.message)) throw e; }
      }
      for (const n of remote) {
        const m = parse(n);
        if (!m || local.has(n)) continue;
        const r = await Net.priv("GET", B + "/" + u.id + "/" + n);
        await DB.put({ id: m.id, d: m.d, pose: m.pose, data: await toData(await r.blob()) });
        down++;
      }
      if (down) { await loadPhotos(); if (tab === "prog") render(); }
      S.phCloudAt = Date.now(); localStorage.setItem(KEY, JSON.stringify(S));
      if (manual) toast(up || down ? "☁️ Fotos: " + up + " enviada" + (up === 1 ? "" : "s") + ", " + down + " baixada" + (down === 1 ? "" : "s") : "☁️ Fotos já estão na nuvem");
    } catch (e) { if (manual) toast(e.message); }
    busy = false;
  }
  window.cloudPhotos = syncPhotos;

  // apagar uma foto no celular apaga a cópia da nuvem
  const _del = DB.del.bind(DB);
  DB.del = function (id) {
    const p = PHOTOS.find(x => x.id === id), u = Net.user();
    if (p && u && S.cloud) Net.priv("DELETE", B + "/" + u.id + "/" + nameOf(p)).catch(() => {});
    return _del(id);
  };
  // excluir a conta apaga também as fotos guardadas
  const _purge = Net.purgeFeed;
  Net.purgeFeed = async function () {
    try { const u = Net.user(), names = u ? await list() : []; if (names.length) await Net.priv("DELETE", B, JSON.stringify({ prefixes: names.map(n => u.id + "/" + n) }), "application/json"); } catch (e) {}
    return _purge.apply(Net, arguments);
  };

  // backup automático ligado por padrão para quem tem conta (dá para desligar nos Ajustes)
  function auto() {
    if (!Net.user()) return;
    if (S.cloud === undefined) { S.cloud = true; save(); }
    if (S.cloud && Date.now() - (S.phCloudAt || 0) > 6 * 36e5) syncPhotos(false);
  }
  setTimeout(auto, 6000);
  setInterval(auto, 5 * 60000);

  // texto e botão nos Ajustes
  const _aj = vAjustes;
  vAjustes = function () {
    let h = _aj();
    h = h.replace("água e ajustes (sem fotos)", "água, ajustes e fotos de progresso (as fotos ficam num espaço privado, só você vê)");
    return h.replace('<button class="btn ghost" style="flex:1" data-cloudget>Restaurar</button></div>',
      '<button class="btn ghost" style="flex:1" data-cloudget>Restaurar</button></div><div class="setrow"><button class="btn ghost block" data-cloudph>🖼️ Sincronizar fotos agora</button></div>');
  };
  document.addEventListener("click", e => { if (e.target.closest("[data-cloudph]")) { if (!S.cloud) { S.cloud = true; save(); } syncPhotos(true); } });
  // depois de "Fazer backup agora", as fotos vão junto
  document.addEventListener("click", e => { if (e.target.closest("[data-cloudnow]")) setTimeout(() => syncPhotos(false), 1500); });
})();
