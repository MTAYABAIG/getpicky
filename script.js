/* Picky website.
   1. Store links: fill these in once the listings are public (leave '' to scroll to the install steps).
   2. The live demo in the hero: measures the sample card the way Picky does, from the real DOM. */

const STORE_LINKS = {
  edge: '',
  chrome: '',
};

document.querySelectorAll('[data-store]').forEach((a) => {
  const url = STORE_LINKS[a.dataset.store];
  if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
});
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Tool list: the screenshots rotate on their own while the section is on screen; hover pauses, a click jumps.
(function tools() {
  const box = document.querySelector('.stagebox');
  const shots = document.querySelector('[data-shots]');
  const list = document.querySelector('[data-tools]');
  if (!box || !shots || !list) return;
  const buttons = [...list.querySelectorAll('[data-tool]')];
  const imgs = [...shots.querySelectorAll('[data-shot]')];
  const desc = document.querySelector('[data-tool-desc]');
  function show(b) {
    buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    imgs.forEach((img) => img.classList.toggle('on', img.dataset.shot === b.dataset.tool));
    if (desc) desc.textContent = b.dataset.desc;
  }
  buttons.forEach((b) => b.addEventListener('click', () => show(b)));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  box.classList.add('auto');
  box.addEventListener('animationend', (e) => {
    if (e.animationName !== 'tool-fill') return;
    const i = buttons.findIndex((b) => b.getAttribute('aria-pressed') === 'true');
    show(buttons[(i + 1) % buttons.length]);
  });
  new IntersectionObserver(([entry]) => box.classList.toggle('live', entry.isIntersecting), { threshold: 0.35 }).observe(box);
})();

// Video: switch between the full tour and the per-tool clips. Nothing loads or plays until the visitor asks.
(function videos() {
  const video = document.querySelector('[data-player]');
  if (!video) return;
  const cuts = [...document.querySelectorAll('.cut')];
  cuts.forEach((c) => c.addEventListener('click', () => {
    if (c.getAttribute('aria-pressed') === 'true') return;
    cuts.forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
    video.pause();
    video.poster = c.dataset.poster;
    video.src = c.dataset.src;
    video.load();
    video.play().catch(() => { /* the visitor can press play */ });
  }));
})();

// What you get: six cards, one scene each. The progress bar on the active card drives the steps; clicking a card
// jumps to it and pauses. Nothing runs until the section is on screen, and reduced-motion users step by clicking.
(function features() {
  const root = document.querySelector('[data-features]');
  if (!root) return;
  const stage = root.querySelector('[data-stage2]');
  const picks = [...root.querySelectorAll('[data-pick]')];
  const panes = [...root.querySelectorAll('[data-pane]')];
  const count = root.querySelector('[data-count]');
  const pauseBtn = root.querySelector('[data-pause]');
  const buy = stage.querySelector('.s-buy');
  const pxEl = root.querySelector('[data-px]');
  const sizeEl = root.querySelector('[data-size]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let index = 0, raf = 0;

  // Contrast numbers come from the sample page's real colors, same formula as the hero demo.
  const parse = (c) => { const m = (c.match(/[\d.]+/g) || []).map(Number); return { r: m[0] || 0, g: m[1] || 0, b: m[2] || 0 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const badge = (label, ok) => { const s = document.createElement('span'); s.className = 'badge ' + (ok ? 'pass' : 'fail'); s.textContent = label; return s; };
  const white = { r: 255, g: 255, b: 255 };
  [['title', '.s-title', white], ['buy', '.s-buy', null], ['blurb', '.s-blurb', white]].forEach(([key, sel, bg]) => {
    const el = stage.querySelector(sel), out = root.querySelector('[data-ratio="' + key + '"]');
    if (!el || !out) return;
    const cs = getComputedStyle(el);
    const r = ratio(parse(cs.color), bg || parse(cs.backgroundColor));
    const large = parseFloat(cs.fontSize) >= 24;
    out.append(r.toFixed(1) + ':1', badge('AA', r >= (large ? 3 : 4.5)), badge('AAA', r >= (large ? 4.5 : 7)));
  });

  function scrub(t0) {
    const tick = (t) => {
      const k = (Math.sin((t - t0) / 800 - Math.PI / 2) + 1) / 2;
      const px = Math.round(20 + k * 22);
      stage.style.setProperty('--px', px + 'px');
      if (pxEl) pxEl.textContent = px;
      if (sizeEl) sizeEl.textContent = Math.round(buy.getBoundingClientRect().width) + ' × 48';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function show(n) {
    index = (n + picks.length) % picks.length;
    const key = picks[index].dataset.pick;
    stage.dataset.step = key;
    picks.forEach((p, i) => p.setAttribute('aria-pressed', String(i === index)));
    panes.forEach((p) => { p.hidden = p.dataset.pane !== key; });
    if (count) count.textContent = (index + 1) + ' of ' + picks.length;
    cancelAnimationFrame(raf);
    stage.style.removeProperty('--px');
    if (pxEl) pxEl.textContent = '20';
    if (sizeEl) sizeEl.textContent = '120 × 48';
    if (key === 'edit' && !reduce) scrub(performance.now());
  }

  function setPaused(on) {
    root.classList.toggle('is-paused', on);
    pauseBtn.setAttribute('aria-pressed', String(on));
    pauseBtn.textContent = on ? 'Play steps' : 'Pause';
  }

  picks.forEach((p, i) => p.addEventListener('click', () => {
    show(i);
    setPaused(true);
    if (window.matchMedia('(max-width: 980px)').matches) stage.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }));
  pauseBtn.addEventListener('click', () => setPaused(!root.classList.contains('is-paused')));
  // The bar finishing moves to the next card.
  root.addEventListener('animationend', (e) => {
    if (e.animationName === 'fill' && !root.classList.contains('is-paused')) show(index + 1);
  });

  if (reduce) { setPaused(true); pauseBtn.hidden = true; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => root.classList.toggle('live', entry.isIntersecting), { threshold: 0.4 }).observe(stage);
  } else { root.classList.add('live'); }
  show(0);
})();

(function demo() {
  const stage = document.querySelector('[data-stage]');
  if (!stage) return;
  const card = stage.querySelector('[data-card]');
  const svg = stage.querySelector('[data-guides]');
  const out = {};
  document.querySelectorAll('[data-out]').forEach((n) => { out[n.dataset.out] = n; });
  const targets = [...stage.querySelectorAll('[data-inspect]')];
  const NS = 'http://www.w3.org/2000/svg';
  let current = null;

  const parse = (c) => {
    const m = (c.match(/[\d.]+/g) || []).map(Number);
    return { r: m[0] ?? 0, g: m[1] ?? 0, b: m[2] ?? 0, a: m.length > 3 ? m[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const bgOf = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c.a > 0.99) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const hasText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const tagName = (el) => el.tagName.toLowerCase() + (el.classList.length ? '.' + [...el.classList].filter((c) => c !== 'is-picked')[0] : '');

  function row(el, text) { el.textContent = text; }

  function readout(el) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const pad = ['Top', 'Right', 'Bottom', 'Left'].map((s) => Math.round(parseFloat(cs['padding' + s])));
    const padText = pad.every((v) => v === pad[0]) ? String(pad[0]) : pad[0] === pad[2] && pad[1] === pad[3] ? pad[0] + ' ' + pad[1] : pad.join(' ');
    row(out.el, tagName(el));
    row(out.size, Math.round(r.width) + ' × ' + Math.round(r.height));
    row(out.pad, padText);
    const text = hasText(el);
    row(out.font, text ? Math.round(parseFloat(cs.fontSize)) + ' / ' + cs.fontWeight : '–');
    out.color.textContent = '';
    out.contrast.textContent = '';
    if (!text) { out.color.textContent = '–'; out.contrast.textContent = '–'; return; }
    const fg = parse(cs.color);
    const bg = bgOf(el);
    const sw = document.createElement('i');
    sw.className = 'swatch';
    sw.style.background = hex(fg);
    out.color.append(sw, hex(fg));
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700);
    const aa = ratio >= (large ? 3 : 4.5);
    const aaa = ratio >= (large ? 4.5 : 7);
    const badge = (label, ok) => {
      const b = document.createElement('span');
      b.className = 'badge ' + (ok ? 'pass' : 'fail');
      b.textContent = label;
      return b;
    };
    out.contrast.append(ratio.toFixed(1) + ':1', badge('AA', aa), badge('AAA', aaa));
  }

  function guide(x1, y1, x2, y2, value) {
    if (value < 1) return;
    const g = document.createElementNS(NS, 'g');
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    g.append(line);
    const tick = (x, y) => {
      const t = document.createElementNS(NS, 'line');
      const horizontal = y1 === y2;
      t.setAttribute('x1', horizontal ? x : x - 4); t.setAttribute('x2', horizontal ? x : x + 4);
      t.setAttribute('y1', horizontal ? y - 4 : y); t.setAttribute('y2', horizontal ? y + 4 : y);
      return t;
    };
    g.append(tick(x1, y1), tick(x2, y2));
    const label = String(Math.round(value));
    const w = label.length * 7 + 12;
    // Centre the label on the card edge (x1,y1 is always the card edge) so it never sits on the text the line
    // crosses. Short gaps get the label in the middle.
    const d = Math.hypot(x2 - x1, y2 - y1);
    const t = d > 40 ? 0 : 0.5;
    const cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t;
    const pill = document.createElementNS(NS, 'rect');
    pill.setAttribute('class', 'pill');
    pill.setAttribute('x', cx - w / 2); pill.setAttribute('y', cy - 9); pill.setAttribute('width', w); pill.setAttribute('height', 18); pill.setAttribute('rx', 5);
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', cx); text.setAttribute('y', cy);
    text.textContent = label;
    g.append(pill, text);
    svg.append(g);
  }

  function draw(el) {
    svg.replaceChildren();
    if (el === card) return;
    const s = stage.getBoundingClientRect();
    const c = card.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const mx = r.left + r.width / 2 - s.left, my = r.top + r.height / 2 - s.top;
    guide(mx, c.top - s.top, mx, r.top - s.top, r.top - c.top);
    guide(mx, c.bottom - s.top, mx, r.bottom - s.top, c.bottom - r.bottom);
    guide(c.left - s.left, my, r.left - s.left, my, r.left - c.left);
    guide(c.right - s.left, my, r.right - s.left, my, c.right - r.right);
  }

  function select(el) {
    if (!el || el === current) return;
    if (current) current.classList.remove('is-picked');
    current = el;
    el.classList.add('is-picked');
    readout(el);
    draw(el);
  }

  stage.addEventListener('mouseover', (e) => select(e.target.closest('[data-inspect]')));
  stage.addEventListener('focusin', (e) => select(e.target.closest('[data-inspect]')));
  stage.addEventListener('click', (e) => select(e.target.closest('[data-inspect]')));
  window.addEventListener('resize', () => { if (current) draw(current); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (current) { readout(current); draw(current); } });

  select(stage.querySelector('.buy') || targets[0]);

  // Until the visitor touches the demo, a cursor glides from element to element and the readout follows it.
  const ghost = stage.querySelector('[data-ghost]');
  const seq = ['h2', '.blurb', '.price', '.buy', '.stock'].map((q) => stage.querySelector(q)).filter(Boolean);
  if (!ghost || !seq.length || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  let timer = 0, i = 0, visible = false, taken = false;
  const glide = (el) => {
    const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
    ghost.style.transform = `translate(${Math.round(r.left - s.left + r.width * 0.68)}px, ${Math.round(r.top - s.top + r.height * 0.62)}px)`;
  };
  const step = () => {
    const el = seq[i++ % seq.length];
    glide(el);
    timer = setTimeout(() => { select(el); timer = setTimeout(step, 2300); }, 950);
  };
  const stop = () => { taken = true; clearTimeout(timer); ghost.classList.remove('on'); };
  ['mouseover', 'focusin', 'touchstart', 'click'].forEach((t) => stage.addEventListener(t, stop, { once: true }));
  new IntersectionObserver(([entry]) => {
    if (taken) return;
    if (entry.isIntersecting && !visible) { visible = true; ghost.classList.add('on'); timer = setTimeout(step, 900); }
    else if (!entry.isIntersecting && visible) { visible = false; clearTimeout(timer); ghost.classList.remove('on'); }
  }, { threshold: 0.2 }).observe(stage);
})();
