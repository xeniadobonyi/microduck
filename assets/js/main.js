(function(){
  var mq = window.matchMedia('(max-width: 760px)');
  function arm(){
    var scope = document.querySelector(mq.matches ? '.site-m' : '.site-d');
    scope.querySelectorAll('video[data-src]').forEach(function(v){
      v.src = v.getAttribute('data-src'); v.removeAttribute('data-src');
      v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){});
    });
  }
  arm(); (mq.addEventListener ? mq.addEventListener('change', arm) : mq.addListener(arm));
  var L = ['Open-source duck robot','Playable out of the box','Train it yourself with reinforcement learning','25 cm, 800 g, 15 motors, camera, 7 trained moves, 50 Hz onboard policy loop','Pre-order today for €399'];
  var tag = 0, tick = 0;
  var typed = document.querySelectorAll('.typed'), lines = document.querySelectorAll('.tagline');
  function draw(){
    var t = L[tag].slice(0, Math.min(L[tag].length, Math.floor(tick * 2.5)));
    typed.forEach(function(el){ el.textContent = t; });
    lines.forEach(function(el){ el.setAttribute('aria-label', L[tag]); });
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
