/* Areyos site: motion and small behaviours. Needs GSAP 3 + ScrollTrigger. */
(function () {
  'use strict';
  var root = document.documentElement;
  var G = window.gsap, ST = window.ScrollTrigger;
  if (!G || !ST) { root.classList.remove('js'); return; }
  G.registerPlugin(ST);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';
  var started = false;
  var STATE = { rm: false, desk: false, mid: false };
  var failsafe = setTimeout(function () { if (!started) root.classList.remove('js'); }, 4000);

  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }

  /* ---------------------------------------------------------------- QR art */
  function buildQR() {
    var el = $('#qr'); if (!el) return;
    var n = 25, seed = 11, dark = [], y, x;
    function rnd() { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    for (y = 0; y < n; y++) { dark[y] = []; for (x = 0; x < n; x++) dark[y][x] = rnd() > 0.52; }
    function finder(ox, oy) {
      for (var j = -1; j <= 7; j++) for (var i = -1; i <= 7; i++) {
        var gx = ox + i, gy = oy + j; if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        var m = Math.max(Math.abs(i - 3), Math.abs(j - 3));
        dark[gy][gx] = (i >= 0 && i <= 6 && j >= 0 && j <= 6) && (m === 3 || m <= 1);
      }
    }
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    for (i = 8; i < n - 8; i++) { dark[6][i] = i % 2 === 0; dark[i][6] = i % 2 === 0; }
    for (var j2 = -2; j2 <= 2; j2++) for (var i2 = -2; i2 <= 2; i2++) {
      var mm2 = Math.max(Math.abs(i2), Math.abs(j2));
      dark[n - 7 + j2][n - 7 + i2] = (mm2 === 2 || mm2 === 0);
    }
    var d = '';
    for (y = 0; y < n; y++) for (x = 0; x < n; x++) if (dark[y][x]) d += 'M' + x + ' ' + y + 'h1v1h-1z';
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('fill', '#0A0A0A'); el.appendChild(p);
    var i;
  }

  /* ------------------------------------------------------------ hero route */
  var stair = $('#stair');
  var svg = $('#route'), sA = $('#sA'), sB = $('#sB'), sC = $('#sC');
  var nStart = $('#nStart'), nMid = $('#nMid'), pinG = $('#pinG'), walk = $('#walk'), tracks = $('#tracks');
  var words = $$('.word', stair), chevs = $$('.row .chev', stair);

  function rect(el) {
    var a = el.getBoundingClientRect(), b = stair.getBoundingClientRect();
    return { l: a.left - b.left, r: a.right - b.left, t: a.top - b.top, b: a.bottom - b.top, cy: (a.top + a.bottom) / 2 - b.top };
  }
  function corner(x0, y0, x1, y1, xv, r) {
    return 'M' + x0 + ' ' + y0 + 'H' + (xv - r) + 'Q' + xv + ' ' + y0 + ' ' + xv + ' ' + (y0 + r) + 'V' + (y1 - r) + 'Q' + xv + ' ' + y1 + ' ' + (xv + r) + ' ' + y1 + 'H' + x1;
  }
  /* Position via cx/cy, never via a transform attribute: GSAP owns the transform
     (scale pop-in) and rewrites it, which used to halve the translate and leave
     the dots left of the line, and let a late font re-layout fight the tween. */
  function setPos(el, x, y) {
    var cs = el.tagName.toLowerCase() === 'circle' ? [el] : Array.prototype.slice.call(el.querySelectorAll('circle'));
    cs.forEach(function (c) { c.setAttribute('cx', x); c.setAttribute('cy', y); });
  }

  function heroLayout() {
    var b = stair.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    var F = parseFloat(getComputedStyle(stair).fontSize);
    var wide = window.matchMedia('(min-width:1000px)').matches;
    var w0 = rect(words[0]), w1 = rect(words[1]), w2 = rect(words[2]);
    var c1 = rect(chevs[0]), c2 = rect(chevs[1]);
    var y0 = w0.cy, y1 = w1.cy, y2 = w2.cy, dA, dB, dC = '', r;
    svg.classList.toggle('is-rail', !wide);
    if (wide) {
      var s0 = w0.r + F * 0.2, xv1 = s0 + (c1.l - s0) * 0.4; r = Math.min(F * 0.26, (xv1 - s0) * 0.9, (y1 - y0) / 2.2);
      dA = corner(s0, y0, c1.l - F * 0.1, y1, xv1, r);
      var s1 = w1.r + F * 0.2, xv2 = s1 + (c2.l - s1) * 0.4; r = Math.min(F * 0.26, (xv2 - s1) * 0.9, (y2 - y1) / 2.2);
      dB = corner(s1, y1, c2.l - F * 0.1, y2, xv2, r);
      var s2 = w2.r + F * 0.2, px = s2 + F * 0.78;
      dC = 'M' + s2 + ' ' + y2 + 'H' + (px - 9);
      setPos(nStart, s0, y0); nStart.style.display = '';
      setPos(pinG, px, y2); nMid.style.display = 'none';
    } else {
      var x = 14;
      dA = 'M' + x + ' ' + y0 + 'V' + y1; dB = 'M' + x + ' ' + y1 + 'V' + y2;
      setPos(nStart, x, y0); setPos(nMid, x, y1); setPos(pinG, x, y2);
      nStart.style.display = ''; nMid.style.display = '';
    }
    sA.setAttribute('d', dA); sB.setAttribute('d', dB); sC.setAttribute('d', dC || 'M0 0');
    sC.style.display = dC ? '' : 'none';
    tracks.textContent = '';
    [dA, dB, dC].forEach(function (d) {
      if (!d) return; var t = document.createElementNS(NS, 'path'); t.setAttribute('d', d); t.setAttribute('class', 'track'); tracks.appendChild(t);
    });
  }

  function heroIntro() {
    var lower = $('#heroLower'), status = $('.status'), pinDot = $('.pin', pinG);
    var wide = window.matchMedia('(min-width:1000px)').matches;
    var HIDE = 'inset(-14% 100% -24% -8%)', SHOW = 'inset(-14% -8% -24% -8%)';
    if (STATE.rm) { root.classList.remove('js'); G.set([sA, sB, sC], { '--d': 0 }); G.set(walk, { opacity: 0 }); return; }
    G.set(words, { opacity: 1, clipPath: HIDE });
    G.set(chevs, { opacity: 0 });
    G.set([sA, sB, sC], { '--d': 1 });
    G.set([nStart, nMid, pinG, walk], { opacity: 0 });
    G.set(status, { opacity: 0, y: 8 });
    G.set(lower, { opacity: 0, y: 16 });
    var tl = G.timeline({ delay: 0.12 });
    function travel(path, dur, at) {
      var o = { v: 0 };
      tl.to(o, { v: 1, duration: dur, ease: 'power2.inOut', onUpdate: function () {
        var len = path.getTotalLength(), pt = path.getPointAtLength(o.v * len); setPos(walk, pt.x, pt.y);
      } }, at);
      tl.fromTo(path, { '--d': 1 }, { '--d': 0, duration: dur, ease: 'power2.inOut' }, at);
    }
    function reveal(i, at) {
      tl.to(words[i], { clipPath: SHOW, duration: 0.85, ease: 'expo.out' }, at);
    }
    tl.to(status, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0);
    reveal(0, 0.05);
    if (wide) {
      tl.fromTo(nStart, { opacity: 0, attr: { r: 0 } }, { opacity: 1, attr: { r: 7 }, duration: 0.4, ease: 'back.out(2)' }, 0.3);
      tl.to(lower, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.5);
      tl.set(walk, { opacity: 1 }, 0.55);
      travel(sA, 0.85, 0.55);
      tl.to(chevs[0], { opacity: 1, duration: 0.3 }, 1.2); reveal(1, 1.25);
      travel(sB, 0.85, 1.55);
      tl.to(chevs[1], { opacity: 1, duration: 0.3 }, 2.2); reveal(2, 2.25);
      travel(sC, 0.5, 2.55);
      tl.to(walk, { opacity: 0, duration: 0.25 }, 3.0);
      tl.fromTo(pinG, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.95); tl.fromTo(pinDot, { attr: { r: 2 } }, { attr: { r: 9 }, duration: 0.5, ease: 'back.out(2.2)' }, 2.95);
    } else {
      tl.fromTo(nStart, { opacity: 0, attr: { r: 0 } }, { opacity: 1, attr: { r: 7 }, duration: 0.4, ease: 'back.out(2)' }, 0.1);
      tl.to(lower, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.5);
      tl.set(walk, { opacity: 1 }, 0.45);
      travel(sA, 0.7, 0.45);
      tl.fromTo(nMid, { opacity: 0, attr: { r: 0 } }, { opacity: 1, attr: { r: 7 }, duration: 0.35, ease: 'back.out(2)' }, 1.1);
      tl.to(chevs[0], { opacity: 1, duration: 0.3 }, 1.1); reveal(1, 1.1);
      travel(sB, 0.7, 1.2);
      tl.to(chevs[1], { opacity: 1, duration: 0.3 }, 1.85); reveal(2, 1.85);
      tl.to(walk, { opacity: 0, duration: 0.25 }, 1.95);
      tl.fromTo(pinG, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.9); tl.fromTo(pinDot, { attr: { r: 2 } }, { attr: { r: 9 }, duration: 0.5, ease: 'back.out(2.2)' }, 1.9);
    }
    tl.add(function () { G.set(words, { clearProps: 'clipPath' }); });
  }

  /* ------------------------------------------------------------------- nav */
  function setupNav() {
    var nav = $('#nav');
    ST.create({
      start: 0, end: 'max',
      onUpdate: function (s) {
        var y = s.scroll();
        nav.classList.toggle('is-scrolled', y > 8);
        if (y > 520 && s.direction === 1 && !nav.contains(document.activeElement)) nav.classList.add('is-hidden');
        else if (s.direction === -1 || y <= 520) nav.classList.remove('is-hidden');
      }
    });
  }

  /* ------------------------------------------------------------------ rail */
  var rail, railFill, railNodes = [], railSecs = [];
  function buildRail() {
    railSecs = $$('[data-stop]');
    rail = document.createElement('nav');
    rail.className = 'rail'; rail.setAttribute('aria-label', 'Page sections');
    rail.innerHTML = '<span class="rail-line"></span><span class="rail-fill"></span>';
    railFill = $('.rail-fill', rail);
    railSecs.forEach(function (s) {
      var a = document.createElement('a');
      a.href = '#' + s.id; a.setAttribute('data-label', s.getAttribute('data-stop')); a.setAttribute('aria-label', s.getAttribute('data-stop'));
      rail.appendChild(a); railNodes.push(a);
    });
    document.body.appendChild(rail);
    ST.create({
      start: 0, end: 'max',
      onUpdate: function (s) { updateRail(s.progress); }
    });
    ST.addEventListener('refresh', placeRail);
    [].concat($$('.sec--ink'), $$('footer.foot')).forEach(function (el) {
      ST.create({ trigger: el, start: 'top 50%', end: 'bottom 50%',
        onEnter: function () { rail.classList.add('on-dark'); }, onEnterBack: function () { rail.classList.add('on-dark'); },
        onLeave: function () { rail.classList.remove('on-dark'); }, onLeaveBack: function () { rail.classList.remove('on-dark'); } });
    });
    var cta = $('#cta');
    ST.create({ trigger: cta, start: 'top 50%', end: 'bottom 50%',
      onEnter: function () { rail.classList.add('on-blue'); }, onEnterBack: function () { rail.classList.add('on-blue'); },
      onLeave: function () { rail.classList.remove('on-blue'); }, onLeaveBack: function () { rail.classList.remove('on-blue'); } });
    placeRail();
  }
  var railFrac = [];
  function placeRail() {
    if (!rail) return;
    var vh = window.innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh), sy = window.pageYOffset;
    railFrac = railSecs.map(function (s, i) {
      var top = s.getBoundingClientRect().top + sy;
      var f = i === 0 ? 0 : Math.min(1, Math.max(0, (top - vh * 0.5) / max));
      railNodes[i].style.top = (f * 100) + '%';
      return f;
    });
    updateRail(Math.min(1, sy / max));
  }
  function updateRail(p) {
    if (!railFill) return;
    railFill.style.transform = 'scaleY(' + p + ')';
    for (var i = 0; i < railNodes.length; i++) railNodes[i].classList.toggle('is-on', p >= railFrac[i] - 0.0005);
  }

  /* --------------------------------------------------------- tangle vs clear */
  var T = { lost: $('#tLost'), clear: $('#tClear'), walker: $('#walker'), cap: $('#tCap'), bW: $('#bWalk'), bC: $('#bClear') };
  var tTl = null, tAuto = null;
  var CAP = { walk: 'Without a map, every route inside is a guess.', clear: 'A clear route changes everything.' };
  function walkerAt(path, v) { var pt = path.getPointAtLength(v * path.getTotalLength()); setPos(T.walker, pt.x, pt.y); }
  function playTangle(mode, instant) {
    if (tTl) tTl.kill();
    var clear = mode === 'clear';
    T.bW.setAttribute('aria-pressed', String(!clear)); T.bC.setAttribute('aria-pressed', String(clear));
    if (T.cap.textContent !== CAP[mode]) {
      if (instant) T.cap.textContent = CAP[mode];
      else G.to(T.cap, { opacity: 0, duration: 0.18, onComplete: function () { T.cap.textContent = CAP[mode]; G.to(T.cap, { opacity: 1, duration: 0.3 }); } });
    }
    if (instant) {
      G.set(T.lost, { '--d': clear ? 0 : 0, opacity: clear ? 0.16 : 1 });
      G.set(T.clear, { '--d': clear ? 0 : 1, opacity: 1 });
      walkerAt(clear ? T.clear : T.lost, 1); return;
    }
    var o = { v: 0 }; tTl = G.timeline();
    if (!clear) {
      tTl.set(T.clear, { '--d': 1 }).set(T.lost, { '--d': 1, opacity: 1 });
      tTl.to(T.lost, { '--d': 0, duration: 4.2, ease: 'none' }, 0);
      tTl.to(o, { v: 1, duration: 4.2, ease: 'none', onUpdate: function () { walkerAt(T.lost, o.v); } }, 0);
    } else {
      tTl.to(T.lost, { opacity: 0.16, '--d': 0, duration: 0.5 }, 0);
      tTl.set(T.clear, { '--d': 1, opacity: 1 }, 0.1);
      tTl.add(function () { walkerAt(T.clear, 0); }, 0.1);
      tTl.to(T.clear, { '--d': 0, duration: 1.3, ease: 'power2.inOut' }, 0.3);
      tTl.to(o, { v: 1, duration: 1.3, ease: 'power2.inOut', onUpdate: function () { walkerAt(T.clear, o.v); } }, 0.3);
    }
  }
  function bindTangle() {
    T.bW.addEventListener('click', function () { if (tAuto) tAuto.kill(); playTangle('walk', STATE.rm); });
    T.bC.addEventListener('click', function () { if (tAuto) tAuto.kill(); playTangle('clear', STATE.rm); });
    playTangle('walk', true); G.set(T.lost, { opacity: 1 }); G.set(T.clear, { '--d': 1 });
  }

  /* ---------------------------------------------------------------- phone */
  var screens = $$('.screen'), steps = $$('.step'), tabs = $$('#tabs button'), phone = $('#phone');
  var cur = 0, userTouched = false, cycle = null;
  function fitPhone() {
    var slot = $('#phoneSlot'); if (!slot) return;
    var k = window.innerWidth >= 960 ? Math.min(1, (window.innerHeight - 120) / 576) : 1;
    k = Math.max(0.62, k);
    phone.style.transform = k < 1 ? 'scale(' + k + ')' : '';
    slot.style.width = 288 * k + 'px'; slot.style.height = 576 * k + 'px';
  }
  function enterScreen(i, instant) {
    var sc = screens[i], rt;
    if (i === 1) {
      var items = $$('.sugg li', sc), pick = $('.pick', sc);
      if (instant) { return; }
      pick.classList.remove('pick');
      G.fromTo(items, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, delay: 0.2, ease: 'power2.out' });
      G.delayedCall(1, function () { if (cur === 1) pick.classList.add('pick'); });
    } else if (i === 2) {
      rt = $('#rt1'); if (instant) { G.set(rt, { '--d': 0 }); return; }
      G.fromTo(rt, { '--d': 1 }, { '--d': 0, duration: 1.2, delay: 0.25, ease: 'power2.inOut' });
      G.fromTo('#pd1', { scale: 0 }, { scale: 1, duration: 0.45, delay: 1.25, ease: 'back.out(2.4)', transformOrigin: 'center', svgOrigin: '180 87' });
      G.fromTo($('.card', sc), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power3.out' });
    } else if (i === 3) {
      rt = $('#rt2'); if (instant) { G.set(rt, { '--d': 0 }); return; }
      G.fromTo(rt, { '--d': 1 }, { '--d': 0, duration: 1, delay: 0.2, ease: 'power2.inOut' });
      G.fromTo($('.turn', sc), { y: -22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power3.out' });
      G.fromTo($('.card', sc), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: 'power3.out' });
    } else if (i === 4) {
      if (instant) return;
      G.fromTo($('.badge', sc), { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(2)' });
      G.fromTo($$('h4,p,.btns', sc), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, delay: 0.2, ease: 'power2.out' });
    }
  }
  function setStep(i, instant) {
    if (i === cur && screens[i].classList.contains('is-on') && !instant) return;
    var prev = cur; cur = i; instant = instant || STATE.rm;
    steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', String(k === i)); });
    phone.setAttribute('data-s', i);
    screens.forEach(function (sc, k) {
      G.killTweensOf(sc);
      if (k === i) {
        sc.classList.add('is-on');
        if (instant) G.set(sc, { autoAlpha: 1, x: 0 });
        else G.fromTo(sc, { autoAlpha: 0, x: i >= prev ? 20 : -20 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' });
        enterScreen(i, instant);
      } else if (sc.classList.contains('is-on')) {
        sc.classList.remove('is-on');
        if (instant) G.set(sc, { autoAlpha: 0 });
        else G.to(sc, { autoAlpha: 0, x: i >= prev ? -20 : 20, duration: 0.3, ease: 'power2.in' });
      } else { G.set(sc, { autoAlpha: 0 }); }
    });
  }
  function bindTabs() {
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { userTouched = true; if (cycle) cycle.pause(); setStep(k); });
    });
    steps.forEach(function (el, k) {
      el.addEventListener('click', function () {
        if (!STATE.desk) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - window.innerHeight * 0.4, behavior: STATE.rm ? 'auto' : 'smooth' });
      });
    });
  }

  /* ------------------------------------------------- scroll-driven sections */
  var mm = G.matchMedia();
  function setupScroll() {
    mm.add({ desk: '(min-width: 960px)', mid: '(min-width: 760px)', rm: '(prefers-reduced-motion: reduce)' }, function (ctx) {
      var c = ctx.conditions; STATE.desk = c.desk; STATE.mid = c.mid; STATE.rm = c.rm;
      var rm = c.rm;

      /* top progress bar (small screens) */
      if (!rm) G.to('#barFill', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

      if (!rm) {
        /* headings: left-to-right wipe, like a route being drawn */
        $$('[data-wipe]').forEach(function (h) {
          G.fromTo(h, { clipPath: 'inset(-8% 100% -22% -3%)' }, {
            clipPath: 'inset(-8% -3% -22% -3%)', duration: 1.15, ease: 'expo.out',
            scrollTrigger: { trigger: h, start: 'top 90%', once: true },
            onComplete: function () { G.set(h, { clearProps: 'clipPath' }); }
          });
        });

        /* ruled rows: the top line draws, then content settles in */
        $$('[data-rows]').forEach(function (list) {
          var items = $$('.rr', list);
          var groups = items.map(function (it) { return $$(':scope > *', it); });
          G.set(items, { '--rs': 0 });
          groups.forEach(function (g) { G.set(g, { opacity: 0 }); });
          ST.create({
            trigger: list, start: 'top 85%', once: true,
            onEnter: function () {
              items.forEach(function (it, n) {
                G.to(it, { '--rs': 1, duration: 1, ease: 'power3.inOut', delay: n * 0.1 });
                G.to(groups[n], { opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.25 + n * 0.1 });
              });
            }
          });
        });

        /* line icons draw in */
        $$('[data-icons]').forEach(function (list) {
          $$('.cap-ico svg, .venue > svg', list).forEach(function (s) {
            var shapes = $$('path, rect', s);
            shapes.forEach(function (p) { var l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
            ST.create({
              trigger: s, start: 'top 90%', once: true,
              onEnter: function () { G.to(shapes, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out', stagger: 0.06, delay: 0.2 }); }
            });
          });
        });

        /* big chevron drifts under the CTA */
        G.fromTo('#ctaBg', { yPercent: 8 }, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '#cta', start: 'top bottom', end: 'bottom top', scrub: true } });
      }

      /* problem: replay the wander, then the clear route, once when scrolled to */
      ST.create({
        trigger: '#planCard', start: 'top 72%', once: true,
        onEnter: function () {
          if (rm) { playTangle('clear', true); return; }
          playTangle('walk');
          tAuto = G.delayedCall(4.9, function () { playTangle('clear'); });
        }
      });

      /* solution: steps drive the phone */
      setStep(0, true);
      if (c.desk) {
        steps.forEach(function (el, i) {
          ST.create({ trigger: el, start: 'top 52%', end: 'bottom 52%', onToggle: function (s) { if (s.isActive) setStep(i); } });
        });
      } else {
        userTouched = false;
        cycle = G.delayedCall(5.2, function advance() { if (userTouched) return; setStep((cur + 1) % 5); cycle.restart(true); });
        cycle.pause();
        ST.create({
          trigger: '#phoneSlot', start: 'top 85%', end: 'bottom 15%',
          onToggle: function (s) { if (rm || userTouched) return; if (s.isActive) cycle.restart(true); else cycle.pause(); }
        });
      }

      /* rollout: the line lights each state as it arrives */
      var stops = $('#stops'), stopEls = $$('.stop', stops);
      if (!rm) {
        var vertical = !c.mid;
        stops.classList.add('is-live');
        stopEls.forEach(function (s) { s.classList.remove('is-on'); });
        stops.style.setProperty('--p', 0);
        var fr = [];
        function measure() {
          fr = stopEls.map(function (s) { return vertical ? s.offsetTop / stops.offsetHeight : s.offsetLeft / stops.offsetWidth; });
        }
        measure();
        ST.addEventListener('refresh', measure);
        ST.create({
          trigger: stops, start: vertical ? 'top 75%' : 'top 80%', end: vertical ? 'bottom 55%' : 'top 35%', scrub: 0.5,
          onUpdate: function (s) {
            stops.style.setProperty('--p', s.progress);
            stopEls.forEach(function (el, i) { el.classList.toggle('is-on', s.progress >= fr[i] + 0.002); });
          }
        });
      } else {
        stops.classList.remove('is-live'); stopEls.forEach(function (s) { s.classList.add('is-on'); }); stops.style.setProperty('--p', 1);
      }

      return function () { if (cycle) cycle.kill(); };
    });
  }

  /* ------------------------------------------------------------------ init */
  function init() {
    if (started) return; started = true; clearTimeout(failsafe);
    try {
      STATE.rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      buildQR(); fitPhone(); bindTangle(); bindTabs();
      heroLayout(); heroIntro();
      setupNav(); buildRail(); setupScroll();
      window.addEventListener('resize', debounce(function () { fitPhone(); heroLayout(); ST.refresh(); }, 160));
      ST.refresh();
    } catch (e) {
      root.classList.remove('js');
      if (window.console) console.error(e);
    }
  }
  var fontsDone = false;
  function go() { if (fontsDone) return; fontsDone = true; init(); }
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('700 1em "Inter Variable"'), document.fonts.load('700 1em Inter')]).then(go, go);
    setTimeout(go, 1800);
  } else { go(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (started) { heroLayout(); ST.refresh(); } });
})();
