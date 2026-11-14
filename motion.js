/* 动效：滑动指示条、视图进场、列表错落进场、数字过渡 */
(function () {
  const RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const raf = window.requestAnimationFrame.bind(window);
  const groups = new Set(), last = new Map();
  let rules = [];

  function place(g, instant) {
    const ind = g._moInd; if (!ind) return;
    if (!g._moPos && g.offsetWidth) { g._moPos = 1; if (getComputedStyle(g).position === 'static') g.classList.add('mo-rel'); }
    if (!ind.isConnected || ind.parentNode !== g) g.insertBefore(ind, g.firstChild);
    const on = g.querySelector(g._moItem);
    if (!on || !on.offsetWidth || !g.offsetWidth) { ind.style.opacity = '0'; return; }
    const mode = g._moMode;
    let x = on.offsetLeft, y = on.offsetTop, w = on.offsetWidth, h = on.offsetHeight;
    if (mode === 'line') { h = 3; }
    else if (mode === 'under') { y = y + h - 3; h = 3; }
    else if (mode === 'dot') { const d = 26; x = x + (w - d) / 2; w = d; h = 3; y = 0; }
    if (g._moKey) last.set(g._moKey, { x, y, w, h, t: Date.now() });
    const first = ind.style.opacity !== '1' || instant || RM.matches;
    if (first) ind.style.transition = 'none';
    ind.style.width = w + 'px'; ind.style.height = h + 'px';
    ind.style.transform = `translate(${x}px,${y}px)`;
    ind.style.opacity = '1';
    if (first) { void ind.offsetWidth; ind.style.transition = ''; }
    if (g._moScroll && !instant && g.scrollWidth > g.clientWidth + 2) {
      const l = on.offsetLeft - (g.clientWidth - on.offsetWidth) / 2;
      g.scrollTo({ left: Math.max(0, l), behavior: RM.matches ? 'auto' : 'smooth' });
    }
  }
  function attach(g, opt) {
    if (g._moInd) return;
    const ind = document.createElement('span'); ind.className = 'mo-ind'; ind.setAttribute('aria-hidden', 'true');
    g._moInd = ind; g._moItem = opt.item || '.on'; g._moMode = opt.mode || 'pill'; g._moScroll = !!opt.scroll;
    g.classList.add('mo-g', 'mo-' + g._moMode);
    g.insertBefore(ind, g.firstChild);
    let pend = false;
    const sched = () => { if (pend) return; pend = true; raf(() => { pend = false; place(g); }); };
    new MutationObserver(sched).observe(g, { attributes: true, attributeFilter: ['class'], subtree: true, childList: true });
    if (window.ResizeObserver) new ResizeObserver(() => place(g, true)).observe(g);
    groups.add(g);
    g._moKey = opt.key ? opt.key(g) : opt.keep ? opt.sel + '|' + Array.prototype.indexOf.call(document.querySelectorAll(opt.sel), g) : null;
    const prev = g._moKey && last.get(g._moKey);
    if (prev && Date.now() - prev.t < 2500 && !RM.matches) {
      ind.style.transition = 'none'; ind.style.width = prev.w + 'px'; ind.style.height = prev.h + 'px';
      ind.style.transform = `translate(${prev.x}px,${prev.y}px)`; ind.style.opacity = '1'; void ind.offsetWidth; ind.style.transition = '';
      place(g);
    } else place(g, true);
  }
  function scan() {
    for (const r of rules) document.querySelectorAll(r.sel).forEach(g => attach(g, r));
    groups.forEach(g => { if (!g.isConnected) groups.delete(g); });
  }
  let scanPend = false;
  const M = window.Motion = {
    get reduced() { return RM.matches; },
    pills(list) {
      rules = rules.concat(list); scan();
      new MutationObserver(() => { if (scanPend) return; scanPend = true; raf(() => { scanPend = false; scan(); }); }).observe(document.body, { childList: true, subtree: true });
      window.addEventListener('resize', () => groups.forEach(g => place(g, true)));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => groups.forEach(g => place(g, true)));
    },
    refresh() { scan(); groups.forEach(g => place(g)); },
    enter(el, cls) {
      if (!el || RM.matches) return; cls = cls || 'mo-in';
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
      clearTimeout(el._moT); el._moT = setTimeout(() => el.classList.remove(cls), 600);
    },
    stagger(root, sel, step, max) {
      if (!root || RM.matches) return; step = step || 32; max = max || 14;
      const els = sel ? root.querySelectorAll(sel) : root.children; let i = 0;
      for (const e of els) {
        if (e.classList.contains('mo-ind')) continue;
        e.style.setProperty('--mo-d', Math.min(i++, max) * step + 'ms');
        e.classList.remove('mo-st'); void e.offsetWidth; e.classList.add('mo-st');
        e.addEventListener('animationend', function f(ev) { if (ev.target === e) { e.classList.remove('mo-st'); e.removeEventListener('animationend', f); } });
      }
    },
    count(el, to, opt) {
      if (!el) return; opt = opt || {}; const dec = opt.dec || 0, fmt = opt.fmt || (v => v.toFixed(dec));
      const from = el._moV != null ? el._moV : parseFloat(String(el.textContent).replace(/[^\d.\-]/g, '')) || 0;
      el._moV = to; cancelAnimationFrame(el._moR);
      if (RM.matches || from === to) { el.textContent = fmt(to); return; }
      const d = opt.dur || 420, t0 = performance.now();
      const tick = now => { const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) el._moR = raf(tick); };
      el._moR = raf(tick);
    },
    close(el, done, ms) {
      if (!el || RM.matches || el.hidden) { done(); return; }
      if (el._moCT) return;
      el.classList.add('mo-out');
      el._moCT = setTimeout(() => { el._moCT = 0; el.classList.remove('mo-out'); done(); }, ms || 170);
    },
    open(el) { if (el && el._moCT) { clearTimeout(el._moCT); el._moCT = 0; el.classList.remove('mo-out'); } },
    countUp(root, sel, dur) {
      if (!root || RM.matches) return;
      root.querySelectorAll(sel).forEach(el => {
        const node = [...el.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue)); if (!node) return;
        const m = node.nodeValue.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/); if (!m) return;
        const raw = m[2], to = parseFloat(raw.replace(/,/g, '')), dec = (raw.split('.')[1] || '').length, comma = raw.includes(',');
        if (!(to > 0)) return;
        const fmt = v => m[1] + (comma ? Number(v.toFixed(dec)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec)) + m[3];
        const d = dur || 650, t0 = performance.now();
        node.nodeValue = fmt(0);
        const tick = now => { const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3); node.nodeValue = k < 1 ? fmt(to * e) : m[1] + raw + m[3]; if (k < 1) raf(tick); };
        raf(tick);
      });
    },
    pulse(el, cls) { M.enter(el, cls || 'mo-pulse'); }
  };
})();
