/* Shaper · ícones de linha no lugar dos emojis da interface (v2.15)
   Depois de cada desenho da tela, troca os emojis dos botões, cartões e títulos por ícones do
   mesmo conjunto do resto do app. Não mexe no que as pessoas escrevem: posts, comentários,
   chat, nomes, avatares e campos de texto continuam como estão. */
(function () {
  "use strict";
  const P = {
    fire: '<path d="M12 21c4 0 6.5-2.6 6.5-6.3 0-3.7-3-5.7-4-9.7-2 1.8-2.6 3.7-2.6 5.2C10.6 9 9.5 8 9.3 6.6 7 8.6 5.5 11.3 5.5 14.7 5.5 18.4 8 21 12 21z"/>',
    barbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>',
    drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
    egg: '<path d="M12 3c-3.5 0-6 6-6 10a6 6 0 0 0 12 0c0-4-2.5-10-6-10z"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2.5h5"/>',
    chart: '<path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/>',
    food: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v6M9 3v6M17 21V3c-2 1-3 4-3 8h3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    mega: '<path d="M4 10v4h3l6 4V6L7 10zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    sword: '<path d="M14.5 4H20v5.5L9 20.5 3.5 15zM6 13l5 5M4 20l2-2"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
    leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
    moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/>',
    walk: '<circle cx="13" cy="4" r="1.6"/><path d="m7 21 3-5 3 2v5M10 16l1-6 4 3 3 1M11 10l-3 2-1 3"/>',
    tv: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M8 21h8M9 3l3 3 3-3"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 3.5 5.7 3.5 9s-1 6.3-3.5 9c-2.5-2.7-3.5-5.7-3.5-9s1-6.3 3.5-9z"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6 6 0 0 1 3.5 5.5"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    coffee: '<path d="M5 9h11v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3"/>',
    bowl: '<path d="M3 11h18a9 9 0 0 1-18 0zM8 7c0-1 1-2 2-2M12 7c0-1 1-2 2-2"/>',
    apple: '<path d="M12 7c-3-2-7 0-7 5 0 4 3 8 5 8 1 0 1.5-.5 2-.5s1 .5 2 .5c2 0 5-4 5-8 0-5-4-7-7-5zM12 7c0-2 1-3.5 3-4"/>',
    plate: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="m16 10 5-3v10l-5-3"/>',
    image: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="9" cy="9.5" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9.5a4.3 4.3 0 0 1-.5 8.5z"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"/>',
    bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>',
    star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 3h7l-2 6.5h-3z"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    warn: '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10"/>',
    cart: '<path d="M3 4h2.5l2 11h10l2-8H7M9 20a1 1 0 1 0 0-.1M17 20a1 1 0 1 0 0-.1"/>',
    note: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l2 2M15 8l2 2"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    rocket: '<path d="M14 4c3 0 6 3 6 6l-7 7-6-6zM7 11l-3 1 2 2M13 17l-1 3-2-2M15 9.5a.5.5 0 1 0 0-.1"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    scale: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8.5 9a5 5 0 0 1 7 0l-2 2.2a2 2 0 0 0-3 0z"/>'
  };
  const E = {
    "🔥": "fire", "🏋️": "barbell", "🏋": "barbell", "💧": "drop", "🍗": "egg", "🥚": "egg", "⏱️": "timer", "⏱": "timer", "⏳": "timer", "📈": "chart", "📊": "chart", "🥗": "food",
    "⚙️": "gear", "⚙": "gear", "📣": "mega", "⚔️": "sword", "⚔": "sword", "🧭": "compass", "🌱": "leaf", "🍑": "target", "🎯": "target", "🤱": "heart", "❤️": "heart",
    "🧓": "user", "👤": "user", "🧍": "user", "🧘": "sun", "☀️": "sun", "🌙": "moon", "🛡️": "shield", "🛡": "shield", "👣": "walk", "📺": "tv", "🏆": "trophy",
    "🌎": "globe", "🌍": "globe", "👥": "users", "📸": "camera", "📷": "camera", "☕": "coffee", "🍛": "bowl", "🍎": "apple", "🍽️": "plate", "✅": "check",
    "🎥": "video", "🖼️": "image", "📲": "phone", "📱": "phone", "🤖": "phone", "☁️": "cloud", "🔔": "bell", "⚡": "bolt", "💪": "bolt", "⭐": "star",
    "🏅": "medal", "🥇": "medal", "⬆️": "up", "☠️": "warn", "⚠️": "warn", "⚠": "warn", "💬": "chat", "🔒": "lock", "📅": "calendar", "🗓️": "calendar",
    "📚": "book", "📖": "book", "🛒": "cart", "📝": "note", "🔗": "link", "🔑": "key", "▦": "qr", "🚀": "rocket", "✨": "sparkle", "🔎": "search", "🔍": "search", "⚖️": "scale"
  };
  const keys = Object.keys(E).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const RE = new RegExp("(" + keys.join("|") + ")\\uFE0F?", "g"), RT = new RegExp(keys.join("|"));
  const svg = n => '<svg viewBox="0 0 24 24" class="ui-i" aria-hidden="true">' + P[n] + '</svg>';
  // onde NÃO trocar: conteúdo das pessoas e avatares
  const SKIP = ".f2-post,.fd-post,.fd-body,.g2-msg,.ch-msg,.ch-bub,.ch-list,.rk-av,.acc-avs,.acc-pic,.av,input,textarea,select,option,[contenteditable],.toast,.sys-type,.tut,.ml-it,.ml-row,.cm-list,.fd-sheet,.ad-msg";
  function fix(root) {
    if (!root) return;
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => RT.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
    const list = []; let n; while ((n = tw.nextNode())) list.push(n);
    list.forEach(t => {
      RE.lastIndex = 0;
      const html = t.nodeValue.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])).replace(RE, (m, e) => svg(E[e] || E[e.replace(/️/g, "")] || "star"));
      const s = document.createElement("span"); s.className = "ui-ic"; s.innerHTML = html;
      t.parentNode.replaceChild(s, t);
    });
    RE.lastIndex = 0;
  }
  window.uiIcons = fix;
  const _r = render;
  render = function () { const out = _r.apply(this, arguments); try { fix($("#app")); } catch (e) {} return out; };
  // folhas e janelas (#layer) também: observa e troca quando abrem
  let q = false;
  new MutationObserver(() => { if (q) return; q = true; requestAnimationFrame(() => { q = false; try { fix($("#layer")); document.querySelectorAll("body > .scrim").forEach(fix); } catch (e) {} }); })
    .observe(document.body, { childList: true, subtree: false });
  const lay = $("#layer"); if (lay) new MutationObserver(() => { requestAnimationFrame(() => { try { fix(lay); } catch (e) {} }); }).observe(lay, { childList: true });
  try { fix($("#app")); } catch (e) {}
})();
