/* Hero duck: the frame sequence assets/media/sit-quack/001.webp … NNN.webp plays once by itself
   (sit down, then quack) when the page opens, drawn to a canvas.

   data-mode="pass" (desktop): full-width canvas, duck drawn at SCALE with soft edges.
   data-mode="pin"  (mobile):  the duck is zoomed to fill the screen.

   Loading: frames download a few at a time in order; playback starts as soon as the rest will
   arrive before they're needed, and pauses on a frame that hasn't arrived rather than skipping.
   (The earlier scroll-scrubbed version is in the git history, commit 1cfa2dc.) */
(function () {
  var FRAMES = 120;
  var SRC = 1440;            // frame size in pixels
  var PATH = 'assets/media/sit-quack/';
  var FPS = 30;              // playback speed of the clip
  var PARALLEL = 6;          // frames downloading at the same time
  var BUFFER = 12;           // frames that must be ready before playback starts
  var TOP_CROP = 0.06;       // desktop: empty strip cut off the top of the frame (keep in sync with the CSS aspect-ratio)
  var SCALE = 0.64;          // desktop: duck size relative to the original full-size hero (1 = full size)
  var M_FILL = 0.8;          // mobile: duck width as a share of the screen width
  var M_X = 0.54, M_Y = 0.955;   // mobile: duck centre / feet position inside the frame
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scrubs = Array.prototype.slice.call(document.querySelectorAll('[data-scrub]')).map(function (el) {
    return { el: el, mode: el.getAttribute('data-mode') || 'pin', canvas: el.querySelector('canvas'), last: null };
  });
  if (!scrubs.length) return;
  if (reduce) scrubs.forEach(function (s) { s.el.classList.add('scrub-static'); });

  /* ---------- loading ---------- */
  var imgs = new Array(FRAMES), ok = new Array(FRAMES), settled = 0, t0 = performance.now();
  function src(i) { return PATH + String(i + 1).padStart(3, '0') + '.webp'; }
  function load(i, after) {
    var im = new Image();
    im.decoding = 'async';
    var finish = function (good) {
      if (good) { imgs[i] = im; ok[i] = true; }
      settled++;
      if (settled === FRAMES) document.dispatchEvent(new Event('duck:loaded'));   // main.js starts the videos then
      if (after) after();
      kick();
    };
    im.onload = function () {
      if (im.decode) im.decode().then(function () { finish(true); }, function () { finish(true); });
      else finish(true);
    };
    im.onerror = function () { finish(false); };   // a missing frame is skipped, it never blocks playback
    im.src = src(i);
  }
  var next = 1, active = 0;
  function pump() {
    while (active < PARALLEL && next < FRAMES) {
      active++;
      load(next++, function () { active--; pump(); });
    }
  }
  load(0);                                  // first frame (preloaded in the page head)
  if (!reduce) pump();
  else { next = FRAMES; settled = FRAMES - 1; }   // reduced motion only ever shows the first frame

  /* contiguous frames ready from the start */
  var ready = 0;
  function readyCount() {
    while (ready < FRAMES && (ok[ready] || (settled >= FRAMES && !ok[ready]))) ready++;
    return ready;
  }

  /* ---------- playback ---------- */
  var pos = 0, started = false, done = reduce;
  function canStart() {
    if (started || done || document.hidden) return false;
    if (!visibleScrub()) return false;
    var k = readyCount();
    if (k >= FRAMES || settled >= FRAMES) return true;
    if (k < BUFFER) return false;
    /* start when, at the download speed so far, the rest arrives before it's needed */
    var perFrame = (performance.now() - t0) / Math.max(1, settled);
    return (FRAMES - k) * perFrame * 1.25 <= (FRAMES - BUFFER) / FPS * 1000;
  }
  function kick() {
    if (!started && canStart()) started = true;
    requestDraw();
  }
  document.addEventListener('visibilitychange', kick);

  /* once the clip has played, keep only the last frame (120 decoded frames are a lot of memory) */
  function release() {
    var keep = FRAMES - 1;
    while (keep > 0 && !imgs[keep]) keep--;
    for (var i = 0; i < FRAMES; i++) if (i !== keep) imgs[i] = null;
  }

  function frameNear(i) {
    for (var d = 0; d < FRAMES; d++) {
      if (imgs[i - d]) return imgs[i - d];
      if (imgs[i + d]) return imgs[i + d];
    }
    return null;
  }

  /* ---------- drawing ---------- */
  function paint(ctx, s, im, w, h) {
    if (s.mode === 'pin') {
      /* mobile: fill the screen and zoom in on the duck, feet kept near the bottom */
      var sz = Math.max(w, h, Math.min(w * M_FILL / 0.55, h / 0.9));   // the duck spans ~55% x 87% of a frame
      var px = Math.min(0, Math.max(w - sz, w / 2 - sz * M_X));
      var py = Math.min(0, Math.max(h - sz, h - sz * M_Y));
      ctx.drawImage(im, px, py, sz, sz);
      return null;
    }
    var size = w * SCALE, x = (w - size) / 2, y = -size * TOP_CROP;
    ctx.drawImage(im, x, y, size, size);
    return { x: x, y: y, size: size };
  }

  function fadeEdges(ctx, box, w, h) {
    /* fade the square frame's edges into the hero background */
    ctx.globalCompositeOperation = 'destination-in';
    var gx = ctx.createLinearGradient(box.x, 0, box.x + box.size, 0);
    gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.14, '#000');
    gx.addColorStop(0.86, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gx; ctx.fillRect(0, 0, w, h);
    var top = Math.max(0, box.y), gy = ctx.createLinearGradient(0, top, 0, box.y + box.size);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.05, '#000');
    gy.addColorStop(0.94, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gy; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  function onScreen(s) {
    var c = s.canvas;
    if (!c || !c.offsetParent) return false;            // the hidden layout (desktop vs mobile)
    var r = c.getBoundingClientRect();
    return r.bottom > -50 && r.top < window.innerHeight + 50;
  }
  function visibleScrub() {
    for (var k = 0; k < scrubs.length; k++) if (onScreen(scrubs[k])) return true;
    return false;
  }

  function draw(s, force) {
    if (!onScreen(s)) return;
    var c = s.canvas;
    /* canvas pixels: screen density (max 2), but never more than the 1440 px frames can fill */
    var cw = c.clientWidth, ch = c.clientHeight;
    var frameCss = s.mode === 'pin' ? Math.max(cw, ch, Math.min(cw * M_FILL / 0.55, ch / 0.9)) : cw * SCALE;
    var dpr = Math.min(window.devicePixelRatio || 1, 2, SRC / frameCss);
    var w = Math.round(cw * dpr), h = Math.round(ch * dpr);
    if (!w || !h) return;
    var resized = c.width !== w || c.height !== h;
    if (resized) { c.width = w; c.height = h; }

    /* between two frames, cross-fade them so 30 fps looks smooth on a 60/120 Hz screen */
    var i = Math.floor(pos), f = done ? 0 : pos - i;
    if (done) i = FRAMES - 1;
    var a = imgs[i] || frameNear(i);
    if (!a) return;
    var b = f > 0.03 && imgs[i + 1] ? imgs[i + 1] : null;
    var key = i + ':' + (b ? Math.round(f * 16) : '') + ':' + (a === imgs[i]);
    if (!force && !resized && key === s.last) return;
    s.last = key;

    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    var box = paint(ctx, s, a, w, h);
    if (b) { ctx.globalAlpha = f; paint(ctx, s, b, w, h); ctx.globalAlpha = 1; }
    if (box) fadeEdges(ctx, box, w, h);
  }

  /* ---------- top navigation: soft background once the page has scrolled ---------- */
  var navs = document.querySelectorAll('.hero-nav'), stuck = null;
  function navState() {
    var on = window.scrollY > 8;
    if (on === stuck) return;
    stuck = on;
    navs.forEach(function (n) { n.classList.toggle('is-stuck', on); });
  }

  /* ---------- frame loop: runs only while something is changing ---------- */
  var queued = false, forceNext = false, lastT = 0;
  function requestDraw(force) {
    if (force) forceNext = true;
    if (queued) return;
    queued = true;
    requestAnimationFrame(tick);
  }
  function tick(t) {
    queued = false;
    var dt = lastT ? Math.min(250, t - lastT) : 0;   // keep real time on a slow device (skip, don't stretch)
    lastT = 0;
    navState();
    if (!started && canStart()) started = true;
    var playing = started && !done && !document.hidden && visibleScrub();
    if (playing) {
      var step = pos + dt / 1000 * FPS, end = FRAMES - 1;
      /* never run ahead of the download: wait on the next frame if it isn't there yet */
      var need = Math.min(end, Math.floor(step) + 1);
      if (imgs[need] || !imgs[need] && settled >= FRAMES && !ok[need]) pos = Math.min(end, step);
      if (pos >= end) { done = true; release(); }
    }
    var force = forceNext; forceNext = false;
    scrubs.forEach(function (s) { draw(s, force); });
    if (playing && !done) { lastT = t; queued = true; requestAnimationFrame(tick); }
  }

  window.addEventListener('scroll', function () { requestDraw(); }, { passive: true });
  window.addEventListener('resize', function () { requestDraw(true); });
  requestDraw(true);
})();
