(function(){
  /* videos: load each one only when it gets near the screen, and pause it while it's off screen,
     so the page doesn't download ~9 MB of video up front. Only the visible layout is armed. */
  var mq = window.matchMedia('(max-width: 760px)');
  function play(v){ v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){
    es.forEach(function(e){
      var v = e.target;
      if (e.isIntersecting) {
        if (v.hasAttribute('data-src')) { v.preload = 'auto'; v.src = v.getAttribute('data-src'); v.removeAttribute('data-src'); }
        play(v);
      } else if (!v.paused) v.pause();
    });
  }, { rootMargin: '600px 0px' }) : null;
  function arm(){
    var scope = document.querySelector(mq.matches ? '.site-m' : '.site-d');
    var other = document.querySelector(mq.matches ? '.site-d' : '.site-m');
    if (other) other.querySelectorAll('video').forEach(function(v){ if (io) io.unobserve(v); if (!v.paused) v.pause(); });
    scope.querySelectorAll('video').forEach(function(v){
      if (io) return io.observe(v);
      if (v.hasAttribute('data-src')) { v.src = v.getAttribute('data-src'); v.removeAttribute('data-src'); }
      play(v);
    });
  }
  /* let the hero duck's frames download first: start the videos once they're in,
     on the first scroll, or after 4 s, whichever comes first */
  var armed = false;
  function start(){
    if (armed) return; armed = true;
    arm(); (mq.addEventListener ? mq.addEventListener('change', arm) : mq.addListener(arm));
  }
  if (document.querySelector('[data-scrub]')) {
    document.addEventListener('duck:loaded', start);
    window.addEventListener('scroll', start, { passive: true, once: true });
    setTimeout(start, 4000);
  } else start();
  var L = ['Open-source duck robot','Playable out of the box','Train it yourself with reinforcement learning','25 cm, 800 g, 15 motors, camera, 7 trained moves, 50 Hz onboard policy loop','Pre-order today for €399'];
  var tag = 0, tick = 0;
  var typed = document.querySelectorAll('.typed'), lines = document.querySelectorAll('.tagline');
  var shown = null, label = null;
  function draw(){
    var t = L[tag].slice(0, Math.min(L[tag].length, Math.floor(tick * 2.5)));
    if (t !== shown) { shown = t; typed.forEach(function(el){ el.textContent = t; }); }   // only touch the page when the text changes
    if (L[tag] !== label) { label = L[tag]; lines.forEach(function(el){ el.setAttribute('aria-label', label); }); }
  }
  draw();
  setInterval(function(){ tick++; if (tick > 69) { tick = 0; tag = (tag + 1) % L.length; } draw(); }, 40);
  (function(el){ if (!el || el._fit) return; el._fit = true; var go = function(){ el.style.fontSize = '100px'; var w = el.scrollWidth, p = el.parentNode.clientWidth; if (w && p) el.style.fontSize = Math.min(96, Math.floor(100 * p / w)) + 'px'; }; go(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); window.addEventListener('resize', go); })(document.getElementById('m-logo'));
  var btn = document.getElementById('m-menu-btn'), menu = document.getElementById('m-menu');
  if (btn && menu) btn.addEventListener('click', function(){
    var open = menu.hidden; menu.hidden = !open;
    btn.setAttribute('aria-expanded', String(open)); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    btn.querySelector('.ico-open').hidden = open; btn.querySelector('.ico-close').hidden = !open;
  });
})();
