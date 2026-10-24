/* Hero duck: by default (AUTO) the clip plays once by itself when the page opens.
   With AUTO off it is scroll-scrubbed, Apple-style: the duck's frame sequence plays forwards as you scroll
   down and backwards as you scroll up. Frames: assets/media/sit-quack/001.webp … NNN.webp.

   data-mode="pass" (desktop): the canvas keeps its normal full-width place in the page and
     the frames play while it scrolls past.
   data-mode="pin"  (mobile):  the stage sticks to the screen while the frames play. */
(function () {
  var FRAMES = 120;
  var PATH = 'assets/media/sit-quack/';
  var PASS_RANGE = 0.42;   // desktop: fraction of the duck's height you scroll to play the whole clip
  var TOP_CROP = 0.06;     // desktop: empty strip cut off the top of the frame (keep in sync with the CSS aspect-ratio)
  var SCALE = 0.64;        // desktop: duck size relative to the original full-size hero (1 = full size)
  var M_FILL = 0.8;        // mobile: duck width as a share of the screen width (capped so it fits the height)
  var M_X = 0.54, M_Y = 0.955;   // mobile: duck centre / feet position inside the frame
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 110;          // desktop, ms: how softly the frame glides to where the scroll is (higher = smoother, laggier)
  var M_EASE = 0;          // mobile: follow the finger directly; touch scrolling already has its own momentum

  /* How much the picture changes between consecutive frames (measured from the clip).
     Scroll is mapped to motion, not to frame number, so fast moments (the sit-down)
     get more scroll distance and don't jump. Re-measure if the clip changes. */
  var MOTION = [2.48,3.89,3.91,2.97,3.6,1.9,3.0,2.66,2.18,2.91,1.62,3.24,3.24,2.91,4.22,2.33,4.72,5.59,5.52,11.05,8.84,13.18,12.66,7.2,5.42,2.37,3.33,2.98,1.89,2.41,1.03,1.82,1.65,1.29,1.66,0.77,1.33,1.15,0.97,1.29,0.68,1.26,1.13,0.84,1.31,0.51,0.78,0.91,0.6,1.09,0.76,1.42,1.36,1.18,1.23,0.53,0.48,0.69,0.71,0.58,0.49,0.39,0.79,0.8,1.22,0.81,1.15,1.1,0.67,0.97,0.51,0.39,0.6,0.37,0.35,0.34,0.53,0.42,0.36,0.29,0.32,0.28,0.29,0.3,0.65,0.49,0.41,0.47,0.77,1.1,1.6,3.17,3.15,1.87,1.69,0.6,0.73,0.65,0.46,0.62,0.34,0.3,0.29,0.29,0.29,0.48,0.3,0.28,0.29,0.26,0.28,0.27,0.28,0.31,0.28,0.27,0.28,0.28,0.3];
  var cum = [0];
  for (var m = 0; m < MOTION.length; m++) cum.push(cum[m] + Math.pow(Math.max(MOTION[m], 0.3), 0.8));
  var total = cum[cum.length - 1];
  function frameAt(p) {                       // progress 0..1 → fractional frame index
    var t = p * total, lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (cum[mid] <= t) lo = mid; else hi = mid; }
    var span = cum[hi] - cum[lo];
    return Math.min(FRAMES - 1, lo + (span ? (t - cum[lo]) / span : 0));
  }

  var imgs = new Array(FRAMES);
  function src(i) { return PATH + String(i + 1).padStart(3, '0') + '.webp'; }
  function load(i) {
    if (imgs[i]) return imgs[i];
    var im = new Image();
    im.decoding = 'async';
    im.onload = function () {
      var done = function () {
        im._ok = true; loaded++;
        if (AUTO && loaded >= FRAMES && !playStart) startPlay();   // play once every frame is ready
        requestDraw();
      };
      if (im.decode) im.decode().then(done, done); else done();   // decode now, not mid-scroll
    };
    im.src = src(i);
    return (imgs[i] = im);
  }

  /* lets a preview page try other settings: mdScrubTune({ ease: 40, range: 0.3 }) */
  /* AUTO: the clip plays once by itself when the page opens (at FPS), instead of following the scroll */
  var AUTO = false, FPS = 30, playStart = 0, loaded = 0;
  function playing() { return AUTO && playStart > 0 && autoFrame() < FRAMES - 1; }
  function autoFrame() { return playStart ? Math.min(FRAMES - 1, (performance.now() - playStart) / 1000 * FPS) : 0; }
  function startPlay() { playStart = performance.now(); requestDraw(true); }
  function setAuto(on) {
    AUTO = on;
    scrubs.forEach(function (s) { s.el.classList.toggle('scrub-auto', on); });
    playStart = 0;
    if (on && loaded >= FRAMES) startPlay();
  }

  window.mdScrubTune = function (o) {
    if (o.auto != null) setAuto(o.auto && !reduce);
    if (o.ease != null) EASE = o.ease;
    if (o.range != null) PASS_RANGE = o.range;
    requestDraw(true);
  };

  var scrubs = Array.prototype.slice.call(document.querySelectorAll('[data-scrub]')).map(function (el) {
    return { el: el, mode: el.getAttribute('data-mode') || 'pin', canvas: el.querySelector('canvas'), last: '', cur: -1 };
  });
  if (!scrubs.length) return;
  if (reduce) scrubs.forEach(function (s) { s.el.classList.add('scrub-static'); });
  else setAuto(true);   // the duck plays once by itself when the page opens

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

  function paint(ctx, s, im, w, h) {
    if (s.mode === 'pin') {
      /* mobile: fill the screen and zoom in on the duck, feet kept near the bottom */
      var sz = Math.max(w, h, Math.min(w * M_FILL / 0.55, h / 0.9));   // the duck spans ~55% x 87% of a frame
      var px = Math.min(0, Math.max(w - sz, w / 2 - sz * M_X));
      var py = Math.min(0, Math.max(h - sz, h - sz * M_Y));
      ctx.drawImage(im, px, py, sz, sz);
      return null;
    }
    if (SCALE >= 1) { cover(ctx, im, w, h, 0.5, 0.5); return null; }
    var size = w * SCALE, x = (w - size) / 2, y = -size * TOP_CROP;
    ctx.drawImage(im, x, y, size, size);
    return { x: x, y: y, size: size };
  }

  function fadeEdges(ctx, box, w, h) {
    /* smaller duck: fade the square frame's edges into the hero background */
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

  /* returns true while the frame is still gliding towards the scroll position */
  function draw(s, force, dt) {
    var c = s.canvas;
    if (!c || !c.offsetParent) return false;     // the hidden layout (desktop vs mobile)
    var r = c.getBoundingClientRect();
    if (r.bottom < -50 || r.top > window.innerHeight + 50) return false; // off screen
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (!w || !h) return false;
    var resized = c.width !== w || c.height !== h;
    if (resized) { c.width = w; c.height = h; }

    var target = reduce ? 0 : AUTO ? autoFrame() : frameAt(progress(s));
    if (s.cur < 0 || force || reduce || AUTO) s.cur = target;
    else {
      var ease = s.mode === 'pin' ? M_EASE : EASE;
      s.cur = ease > 0 ? s.cur + (target - s.cur) * (1 - Math.exp(-dt / ease)) : target;   // frame-rate independent
    }
    var moving = Math.abs(target - s.cur) > 0.02;
    if (!moving) s.cur = target;
    var run = playing();

    /* while gliding, cross-fade the two nearest frames; at rest show one clean frame */
    var i = Math.floor(s.cur), f = s.cur - i;
    if (!moving && !run) { i = Math.round(s.cur); f = 0; }
    var a = imgs[i] && imgs[i]._ok ? imgs[i] : nearestLoaded(i);
    if (!a) return moving;
    var b = f > 0.03 && imgs[i + 1] && imgs[i + 1]._ok ? imgs[i + 1] : null;
    var key = a.src + '|' + (b ? b.src + Math.round(f * 20) : '');
    if (!force && !resized && key === s.last) return moving || run;
    s.last = key;

    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    var box = paint(ctx, s, a, w, h);
    if (b) { ctx.globalAlpha = f; paint(ctx, s, b, w, h); ctx.globalAlpha = 1; }
    if (box) fadeEdges(ctx, box, w, h);
    return moving || run;
  }

  /* top navigation: give it a soft background once the page has scrolled */
  var navs = document.querySelectorAll('.hero-nav');
  function navState() {
    navs.forEach(function (n) { n.classList.toggle('is-stuck', window.scrollY > 8); });
  }

  var queued = false, lastT = 0;
  function requestDraw(force) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function tick(t) {
      var dt = lastT ? Math.min(64, t - lastT) : 16; lastT = t;
      queued = false;
      navState();
      var moving = false;
      scrubs.forEach(function (s) { if (draw(s, force, dt)) moving = true; });
      force = false;
      if (moving) { queued = true; requestAnimationFrame(tick); } else lastT = 0;
    });
  }

  window.addEventListener('scroll', function () { requestDraw(); }, { passive: true });
  window.addEventListener('resize', function () { requestDraw(true); });
  requestDraw(true);
})();
