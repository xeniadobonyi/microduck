/* Scroll-scrubbed hero: as the visitor scrolls through .scrub, the duck's frame sequence
   plays forwards (and backwards when scrolling up), Apple-style.
   Frames live in assets/media/sit-quack/001.webp … NNN.webp. */
(function () {
  var FRAMES = 120;
  var PATH = 'assets/media/sit-quack/';
  var FADE = 0.12; // soft edge so the frame melts into the hero background
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
    return { el: el, canvas: el.querySelector('canvas'), last: -1 };
  });
  if (!scrubs.length) return;

  if (reduce) scrubs.forEach(function (s) { s.el.classList.add('scrub-static'); });

  /* load the first frame straight away, then the rest in order */
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
    var run = s.el.offsetHeight - window.innerHeight;
    if (run <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / run));
  }

  function nearestLoaded(i) {
    for (var d = 0; d < FRAMES; d++) {
      if (imgs[i - d] && imgs[i - d]._ok) return imgs[i - d];
      if (imgs[i + d] && imgs[i + d]._ok) return imgs[i + d];
    }
    return null;
  }

  function draw(s, force) {
    var c = s.canvas;
    if (!c || !c.offsetParent) return; // hidden layout (desktop vs mobile)
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (!w || !h) return;
    var resized = c.width !== w || c.height !== h;
    if (resized) { c.width = w; c.height = h; }
    var idx = reduce ? 0 : Math.round(progress(s) * (FRAMES - 1));
    var im = nearestLoaded(idx);
    if (!im) return;
    var key = idx + ':' + (im._ok ? im.src : '');
    if (!force && !resized && key === s.last) return;
    s.last = key;

    var ctx = c.getContext('2d');
    var size = Math.min(w, h);            // square frames, fitted to the shorter side
    var x = (w - size) / 2, y = h - size; // sit the duck on the bottom edge of the stage
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(im, x, y, size, size);

    /* fade the frame's edges into the page background */
    ctx.globalCompositeOperation = 'destination-in';
    var gx = ctx.createLinearGradient(x, 0, x + size, 0);
    gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(FADE, '#000');
    gx.addColorStop(1 - FADE, '#000'); gx.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gx; ctx.fillRect(0, 0, w, h);
    var gy = ctx.createLinearGradient(0, y, 0, y + size);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(FADE * 0.8, '#000'); gy.addColorStop(1 - FADE * 0.5, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gy; ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }

  var queued = false;
  function requestDraw(force) {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      scrubs.forEach(function (s) { draw(s, force); });
    });
  }

  window.addEventListener('scroll', function () { requestDraw(); }, { passive: true });
  window.addEventListener('resize', function () { requestDraw(true); });
  requestDraw(true);
})();
