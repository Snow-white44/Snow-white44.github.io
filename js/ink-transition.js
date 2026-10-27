/* Procedural ink/paper overlay; never delays PJAX or blocks pointer input. */
(() => {
  'use strict';
  if (window.blogInkTransition) return;
  let canvas, ctx, raf, timer, start = 0, phase = '', pending = false;
  let width, height, dark, bounds;
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const edge = Array.from({ length: 65 }, (_, i) => Math.sin(i * 13.7) * 5 + Math.sin(i * 3.1) * 3);
  const cleanup = () => {
    cancelAnimationFrame(raf); clearTimeout(timer); canvas?.remove();
    canvas = null; pending = false; phase = '';
  };
  function create() {
    canvas?.remove();
    const area = document.querySelector('#blog-container');
    bounds = area?.getBoundingClientRect();
    const left = Math.max(0, bounds?.left || 0);
    const top = Math.max(64, bounds?.top || 64);
    width = Math.min(innerWidth - left, bounds?.width || innerWidth);
    height = innerHeight - top;
    if (height < 40 || width < 40) return false;
    dark = document.documentElement.dataset.theme === 'dark';
    canvas = document.createElement('canvas');
    canvas.id = 'ink-page-transition'; canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = `position:fixed;left:${left}px;top:${top}px;width:${width}px;height:${height}px;pointer-events:none;z-index:9998;`;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx = canvas.getContext('2d');
    if (!ctx) { canvas = null; return false; }
    ctx.scale(dpr, dpr); document.body.append(canvas); return true;
  }
  const lineY = (x, i) => height * .66 - x / width * height * .32 + edge[i];
  function paper(upper, progress) {
    const direction = upper ? -1 : 1;
    const offset = direction * progress * height * .9;
    ctx.save(); ctx.translate(0, offset);
    ctx.beginPath(); ctx.moveTo(0, upper ? -height : height * 2);
    ctx.lineTo(width, upper ? -height : height * 2);
    for (let i = 64; i >= 0; i--) { const x = width * i / 64; ctx.lineTo(x, lineY(x, i)); }
    ctx.closePath(); ctx.fillStyle = dark ? '#20232a' : '#eee9df'; ctx.fill();
    ctx.save(); ctx.clip();
    // Small, deterministic fibers: no raster downloads or GPU blur filters.
    ctx.strokeStyle = dark ? '#ffffff0c' : '#554b3810'; ctx.lineWidth = .7;
    for (let i = 0; i < 220; i++) {
      const x = (i * 137.39) % width, y = (i * 79.17) % height;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y - 2); ctx.stroke();
    }
    ctx.restore();
    for (const [size, alpha] of [[17,.07],[8,.13],[2,.7]]) {
      ctx.beginPath();
      for (let i = 0; i <= 64; i++) { const x = width * i / 64; ctx.lineTo(x, lineY(x, i)); }
      ctx.strokeStyle = dark ? `rgba(196,201,207,${alpha})` : `rgba(35,40,43,${alpha})`;
      ctx.lineWidth = size; ctx.stroke();
    }
    ctx.restore();
  }
  function draw(now) {
    if (!canvas) return;
    ctx.clearRect(0, 0, width, height);
    const elapsed = now - start;
    if (phase === 'waiting') {
      // Leave the old page readable while fetching; only a small ink stroke moves.
      const x = width * (.42 + Math.sin(elapsed / 700) * .035);
      ctx.strokeStyle = dark ? '#d6d8dfaa' : '#30343baa'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, 9); ctx.quadraticCurveTo(x + 36, 4, x + 75, 10); ctx.stroke();
    } else {
      const p = Math.min(1, elapsed / 380), eased = 1 - Math.pow(1 - p, 3);
      ctx.globalAlpha = Math.min(1, (1 - p) * 3);
      paper(true, eased); paper(false, eased);
      ctx.fillStyle = dark ? '#b9bec7' : '#30343b';
      for (let i = 0; i < 22; i++) {
        const x = width * i / 22;
        ctx.beginPath(); ctx.ellipse(x + Math.sin(i * 7) * eased * 40,
          lineY(x, i) + Math.cos(i * 3) * eased * 80,
          Math.max(.2, (1-p) * (1 + i%3)), Math.max(.2, (1-p)*1.3), i, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (p >= 1) return cleanup();
    }
    raf = requestAnimationFrame(draw);
  }
  function reveal() {
    cleanup();
    if (reduce() || document.querySelector('#moon-opening') || !create()) return;
    phase = 'reveal'; start = performance.now(); draw(start);
    timer = setTimeout(cleanup, 1000);
  }
  document.addEventListener('pjax:send', () => {
    cleanup(); if (reduce()) return;
    pending = true;
    timer = setTimeout(() => {
      if (!pending || !create()) return;
      phase = 'waiting'; start = performance.now(); draw(start);
      timer = setTimeout(cleanup, 12000);
    }, 180);
  });
  document.addEventListener('pjax:complete', () => { if (pending) reveal(); });
  for (const name of ['pjax:error', 'pjax:abort']) document.addEventListener(name, cleanup);
  for (const name of ['pagehide', 'resize']) window.addEventListener(name, cleanup);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cleanup(); });
  window.blogInkTransition = { preview: reveal, cleanup };
})();
