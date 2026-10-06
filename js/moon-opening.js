/* Standalone first-visit intro; loaded once even if PJAX evaluates head scripts. */
(() => {
  'use strict';
  if (window.__moonOpeningInstalled) return;
  window.__moonOpeningInstalled = true;
  const key = 'snow-white-opening-seen';
  // Only the homepage, not article deep links or paginated lists.
  if (!/^\/(?:index\.html)?$/.test(location.pathname)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || navigator.connection?.saveData) return;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch (_) { return; } // Without session storage, avoid replaying on every page.

  const start = () => {
    const overlay = document.createElement('div');
    overlay.id = 'moon-opening';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', '月光开场动画');
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.poster = '/media/moon-opening-v6.jpg';
    video.setAttribute('aria-hidden', 'true');
    const skip = document.createElement('button');
    skip.type = 'button'; skip.textContent = '跳过开场';
    overlay.append(video, skip);
    const previousFocus = document.activeElement;
    const content = document.getElementById('body-wrap');
    const wasInert = content?.inert;
    if (content) content.inert = true;
    document.body.append(overlay);
    document.documentElement.classList.add('moon-opening-active');
    skip.focus({ preventScroll: true });
    let done = false, frame, startup, watchdog;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(frame); clearTimeout(startup); clearTimeout(watchdog);
      document.removeEventListener('keydown', keys);
      document.removeEventListener('pjax:send', finish);
      window.removeEventListener('pagehide', finish);
      document.documentElement.classList.remove('moon-opening-active');
      if (content) content.inert = wasInert;
      video.pause(); video.removeAttribute('src'); video.load(); overlay.remove();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
    const keys = (event) => {
      if (event.key === 'Escape') finish();
      if (event.key === 'Tab') { event.preventDefault(); skip.focus(); }
    };
    // The baked preview ends at 5.6s, before its screenshot reveal (5.65s).
    // Reveal the LIVE page instead, starting just after the moon breaks at 4.55s.
    const tick = () => {
      if (done) return;
      const p = Math.max(0, Math.min(1, (video.currentTime - 4.75) / .8));
      if (p) {
        const r = p * 145;
        const mask = `radial-gradient(ellipse at 33% 62%, transparent ${Math.max(0, r - 22)}%, black ${r}%)`;
        overlay.style.maskImage = mask;
        overlay.style.webkitMaskImage = mask;
        overlay.style.opacity = String(1 - p * p);
      }
      if (p >= 1) return finish();
      frame = requestAnimationFrame(tick);
    };
    skip.addEventListener('click', finish);
    document.addEventListener('keydown', keys);
    document.addEventListener('pjax:send', finish);
    window.addEventListener('pagehide', finish);
    video.addEventListener('ended', finish);
    video.addEventListener('error', finish);
    video.addEventListener('playing', () => clearTimeout(startup), { once: true });
    startup = setTimeout(finish, 2500);
    watchdog = setTimeout(finish, 12000);
    video.src = '/media/moon-opening-v6.mp4';
    try { video.play()?.catch(finish); } catch (_) { finish(); }
    frame = requestAnimationFrame(tick);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
