/* Scroll-scrubbed hero, Apple-style: the duck's frame sequence plays forwards as you scroll
   down and backwards as you scroll up. Frames: assets/media/sit-quack/001.webp … NNN.webp.

   data-mode="pass" (desktop): the canvas keeps its normal full-width place in the page and
     the frames play while it scrolls past.
   data-mode="pin"  (mobile):  the stage sticks to the screen while the frames play. */
(function () {
  var FRAMES = 120;
  var PATH = 'assets/media/sit-quack/';
  var PASS_RANGE = 0.42;   // desktop: fraction of the duck's height you scroll to play the whole clip
  var SCALE = 0.8;         // duck size relative to the original full-size hero (1 = full size)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var imgs = new Array(FRAMES);
  function src(i) { return PATH + String(i + 1).padStart(3, '0') + '.webp'; }
  function load(i) {
    if (imgs[i]) return imgs[i];
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () { im._ok = true; requestDraw(); };
    im.src = src(i);
    return (imgs[i] = im);
  }

  var scrubs = Array.prototype.slice.call(document.querySelectorAll('[data-scrub]')).map(function (el) {
    return { el: el, mode: el.getAttribute('data-mode') || 'pin', canvas: el.querySelector('canvas'), last: '' };
  });
  if (!scrubs.length) return;
  if (reduce) scrubs.forEach(function (s) { s.el.classList.add('scrub-static'); });

  /* first frame straight away, then the rest in order */
  load(0);
  var next = 1;
  (function pump() {
    if (next >= FRAMES) return;
    var im = load(next++);
    if (im._ok) return pump();
    im.addEventListener('load', pump, { once: true });
    im.addEventListener('error', pump, { once: true });
  })();

  function progress(s) {
    var r = s.el.getBoundingClientRect();
    if (s.mode === 'pass') {
      var top = r.top + window.scrollY - 72;     // page offset of the duck, below the nav
      return Math.min(1, Math.max(0, (window.scrollY - top) / (r.height * PASS_RANGE)));
    }
    var run = s.el.offsetHeight - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }

  function nearestLoaded(i) {
    for (var d = 0; d < FRAMES; d++) {
      if (imgs[i - d] && imgs[i - d]._ok) return imgs[i - d];
      if (imgs[i + d] && imgs[i + d]._ok) return imgs[i + d];
    }
    return null;
  }

  /* draw like CSS background-size: cover, anchored at (ax, ay) */
  function cover(ctx, im, w, h, ax, ay) {
    var iw = im.naturalWidth, ih = im.naturalHeight, k = Math.max(w / iw, h / ih);
    var dw = iw * k, dh = ih * k;
    ctx.drawImage(im, (w - dw) * ax, (h - dh) * ay, dw, dh);
  }

  function draw(s, force) {
    var c = s.canvas;
    if (!c || !c.offsetParent) return;           // the hidden layout (desktop vs mobile)
    var r = c.getBoundingClientRect();
    if (r.bottom < -50 || r.top > window.innerHeight + 50) return; // off screen
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (!w || !h) return;
    var resized = c.width !== w || c.height !== h;
    if (resized) { c.width = w; c.height = h; }
    var idx = reduce ? 0 : Math.round(progress(s) * (FRAMES - 1));
    var im = nearestLoaded(idx);
    if (!im) return;
    var key = im.src;
    if (!force && !resized && key === s.last) return;
    s.last = key;
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    if (SCALE >= 1) {
      if (s.mode === 'pass') cover(ctx, im, w, h, 0.5, 0.5);
      else cover(ctx, im, w, h, 0.52, 0);         // same crop as the old mobile hero photo
      return;
    }
    /* smaller duck: draw the square frame at SCALE of the full-size height, centred,
       and fade its edges into the hero background */
    var full = s.mode === 'pass' ? w : Math.max(w, h);   // size the frame had at 100%
    var size = full * SCALE;
    var x = (w - size) / 2;
    var y = s.mode === 'pass' ? (h - size) / 2 : h - size;
    ctx.drawImage(im, x, y, size, size);
    ctx.globalCompositeOperation = 'destination-in';
    var gx = ctx.createLinearGradient(x, 0, x + size, 0);
    gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.14, '#000');
    gx.addColorStop(0.86, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gx; ctx.fillRect(0, 0, w, h);
    var gy = ctx.createLinearGradient(0, y, 0, y + size);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.1, '#000');
    gy.addColorStop(0.94, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gy; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  /* top navigation: give it a soft background once the page has scrolled */
  var navs = document.querySelectorAll('.hero-nav');
  function navState() {
    navs.forEach(function (n) { n.classList.toggle('is-stuck', window.scrollY > 8); });
  }

  var queued = false;
  function requestDraw(force) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      navState();
      scrubs.forEach(function (s) { draw(s, force); });
    });
  }

  window.addEventListener('scroll', function () { requestDraw(); }, { passive: true });
  window.addEventListener('resize', function () { requestDraw(true); });
  requestDraw(true);
})();
