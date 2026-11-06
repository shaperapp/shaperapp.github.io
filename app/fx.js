/* Shaper · fluidez
   O render original trocava o innerHTML da tela inteira a cada toque: recarregava o vídeo
   do YouTube, redecodificava as fotos e matava as transições. Aqui a tela nova é comparada
   com a atual e só o que mudou é alterado. Ao trocar de aba entra com animação. */
(function () {
  "use strict";
  const tpl = document.createElement("template");
  let lastTab = null;

  function views() {
    const v = { home: vHome, treino: vTreino, timer: vTimer, prog: vProg, rank: window.vRank || vHome, dieta: vDieta, ajustes: vAjustes };
    const x = window.EXTRA_VIEWS || {}; // abas novas (grupo, feed, mais) se registram aqui
    for (const k in x) v[k] = x[k];
    return v;
  }

  function same(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
    if (a.nodeType !== 1) return true;
    if (a.nodeName === "IFRAME") return a.getAttribute("src") === b.getAttribute("src");
    return a.id === b.id;
  }

  function syncAttrs(f, t) {
    const fa = f.attributes, ta = t.attributes;
    for (let i = fa.length - 1; i >= 0; i--) {
      const n = fa[i].name;
      if (n === "open" && f.nodeName === "DETAILS") continue; // não fecha o que o usuário abriu
      if (!t.hasAttribute(n)) f.removeAttribute(n);
    }
    for (let i = 0; i < ta.length; i++) {
      const a = ta[i];
      if (f.getAttribute(a.name) !== a.value) f.setAttribute(a.name, a.value);
    }
  }

  function morphEl(f, t) {
    if (f.nodeName === "IFRAME") return;
    syncAttrs(f, t);
    const n = f.nodeName;
    if (n === "INPUT") {
      if (f.type === "checkbox" || f.type === "radio") {
        const c = t.hasAttribute("checked");
        if (f.checked !== c) f.checked = c;
      } else if (document.activeElement !== f) {
        const v = t.getAttribute("value") || "";
        if (f.value !== v) f.value = v;
      }
      return;
    }
    if (n === "TEXTAREA") return;
    morphKids(f, t);
    if (n === "SELECT") {
      const s = f.querySelector("option[selected]");
      if (s && f.value !== s.value) f.value = s.value;
    }
  }

  function morphKids(f, t) {
    let a = f.firstChild, b = t.firstChild;
    while (b) {
      const nb = b.nextSibling;
      if (!a) f.appendChild(b);
      else if (same(a, b)) {
        if (a.nodeType === 1) morphEl(a, b);
        else if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
        a = a.nextSibling;
      } else {
        const na = a.nextSibling;
        f.replaceChild(b, a);
        a = na;
      }
      b = nb;
    }
    while (a) {
      const na = a.nextSibling;
      f.removeChild(a);
      a = na;
    }
  }

  function morph(el, html) {
    tpl.innerHTML = html;
    morphKids(el, tpl.content);
  }
  window.fxMorph = morph;

  function enter(app) {
    app.classList.remove("fx-enter");
    void app.offsetWidth;
    const st = app.querySelector(".stack");
    if (st) for (let i = 0; i < st.children.length; i++) st.children[i].style.setProperty("--i", Math.min(i, 9));
    app.classList.add("fx-enter");
  }

  renderTabs = function () {
    morph($("#tabs"), TABS.map(([k, l]) => '<button data-tab="' + k + '"' + (tab === k ? ' aria-current="page"' : "") + ">" + IC[k] + l + "</button>").join(""));
  };

  render = function () {
    renderTabs();
    const app = $("#app"), html = views()[tab]();
    if (tab !== lastTab) {
      app.innerHTML = html;
      enter(app);
      lastTab = tab;
    } else {
      morph(app, html);
    }
    bind();
  };
})();
