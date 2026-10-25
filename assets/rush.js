(function(){
/* ---------- rush hour: chaos vs order (illustrative simulation) ---------- */
  function setupRush() {
    var svg = document.getElementById('rush-svg'); if (!svg) return;
    var NS = 'http://www.w3.org/2000/svg', card = document.getElementById('rushCard');
    function mk(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
    var names = ['Reception', 'Cardiology', 'X-Ray', 'Pharmacy', 'Lab', 'Radiology', 'Surgery', 'Wards', 'Cafe', 'Billing'];
    var rooms = [], DOOR = [], LANE = [];
    mk('rect', { 'class': 'cr', x: 0, y: 150, width: 960, height: 120 });
    for (var i = 0; i < 10; i++) {
      var top = i < 5, k = i % 5, x = 40 + k * 180, y = top ? 24 : 280;
      var r = mk('rect', { 'class': 'rm', x: x, y: y, width: 160, height: 116, rx: 10 });
      var t = mk('text', { 'class': 'rt', x: x + 80, y: y + 62 }); t.textContent = names[i];
      rooms.push(r);
      var dx = x + 80, dy = top ? 150 : 270, ly = top ? 162 + k * 9.5 : 258 - k * 9.5;
      DOOR.push([dx, dy]); LANE.push(ly);
    }
    var heat = [], HX = 12;
    for (i = 0; i < HX; i++) heat.push(mk('circle', { 'class': 'heat', cx: 40 + i * 80, cy: 210, r: 0 }));
    var ring = mk('circle', { 'class': 'ring', cx: 8, cy: 210, r: 8 });
    var desk = mk('g', {}); mk('rect', { 'class': 'dsk', x: 96, y: 196, width: 56, height: 28, rx: 8 }, desk);
    var dt = mk('text', { 'class': 'dsk-t', x: 124, y: 214 }, desk); dt.textContent = 'Desk';
    var routes = [];
    for (i = 0; i < 10; i++) {
      var top2 = i < 5, ly2 = LANE[i], dx2 = DOOR[i][0], pts = [[8, 210], [40, ly2], [dx2, ly2], [dx2, top2 ? 150 : 270], [dx2, top2 ? 100 : 320]];
      var segs = [], L = 0;
      for (var j = 0; j < pts.length - 1; j++) { var d = Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]); segs.push([L, d]); L += d; }
      routes.push({ pts: pts, segs: segs, len: L });
      mk('path', { 'class': 'lane', pathLength: 1, style: '--i:' + i, d: pts.map(function (p, n) { return (n ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join('') });
    }
    function rpos(rt, s) {
      for (var n = 0; n < rt.segs.length; n++) {
        var sg = rt.segs[n];
        if (s <= sg[0] + sg[1] || n === rt.segs.length - 1) {
          var f = Math.min(1, Math.max(0, (s - sg[0]) / sg[1])), a = rt.pts[n], b = rt.pts[n + 1];
          return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        }
      }
    }
    var N = 72, P = [], order = false, rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var SPEED = 95, GAP = 60;
    for (i = 0; i < N; i++) {
      var g = mk('g', {}), dest = i % 10, c = mk('circle', { 'class': 'pp', r: 5.2 }, g), q = mk('text', { 'class': 'q', y: -9 }, g); q.textContent = '?'; q.style.opacity = 0;
      var cyc = routes[dest].len + GAP * 4;
      P.push({ g: g, c: c, q: q, dest: dest, x: 20 + Math.random() * 900, y: 160 + Math.random() * 100, vx: 0, vy: 0, tgt: Math.floor(Math.random() * 10), tm: Math.random() * 3, lost: i % 3 === 0, desk: i % 4 === 1, s: (i / N) * cyc - 0, cyc: cyc, hit: 0 });
    }
    for (i = 0; i < N; i++) { P[i].ln = mk('line', { 'class': 'tr' }, P[i].g.parentNode); P[i].g.parentNode.insertBefore(P[i].ln, P[i].g); }
    var BT = ['Where is ' + names[5] + '?', 'Which floor?', 'Excuse me...', 'Lost again', 'Where is ' + names[3] + '?', 'Is this the way?', 'Where is ' + names[4] + '?'], bub = [];
    for (i = 0; i < 3; i++) { var bt = mk('text', { 'class': 'bub' }); bt.style.opacity = 0; bub.push({ el: bt, p: null, t: 0 }); }
    var tip = mk('text', { 'class': 'tip' }); tip.style.opacity = 0;
    var mouse = { x: -999, y: -999 }, bTimer = 0, disp = [0, 0, 0], wrong = 0, arrived = 0, tick = 0;
    function svgPt(e) { var r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 960, (e.clientY - r.top) / r.height * 420]; }
    svg.addEventListener('pointermove', function (e) { var m = svgPt(e); mouse.x = m[0]; mouse.y = m[1]; });
    svg.addEventListener('pointerleave', function () { mouse.x = mouse.y = -999; });
    function chaos(p, dt) {
      p.tm -= dt;
      if (p.tm <= 0) { p.tm = 1.2 + Math.random() * 3; if (Math.random() < .55) { p.tgt = Math.floor(Math.random() * 10); wrong++; } if (!p.desk && Math.random() < .12) p.lost = !p.lost; }
      var tx, ty;
      if (p.desk) { tx = 124 + Math.cos(p.tm * 2 + p.dest) * 34; ty = 210 + Math.sin(p.tm * 2 + p.dest) * 26 + (p.dest % 2 ? 22 : -22); }
      else { tx = DOOR[p.tgt][0]; ty = DOOR[p.tgt][1] + (p.tgt < 5 ? 14 : -14); }
      var dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1, sp = p.lost ? 22 : 46;
      if (d < 20 && !p.desk) { p.tgt = Math.floor(Math.random() * 10); wrong++; p.tm = 1; }
      p.vx += (dx / d * sp - p.vx) * Math.min(1, dt * 2) + (Math.random() - .5) * 90 * dt;
      p.vy += (dy / d * sp - p.vy) * Math.min(1, dt * 2) + (Math.random() - .5) * 90 * dt;
    }
    function step(dt) {
      var k;
      if (!order) {
        for (k = 0; k < N; k++) {
          chaos(P[k], dt);
          var mx = P[k].x - mouse.x, my = P[k].y - mouse.y, md = Math.hypot(mx, my);
          if (md < 70 && md > .1) { P[k].vx += mx / md * (70 - md) * 14 * dt; P[k].vy += my / md * (70 - md) * 14 * dt; }
        }
        for (k = 0; k < N; k++) for (var m = k + 1; m < N; m++) {
          var a = P[k], b = P[m], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
          if (d2 < 196 && d2 > .01) { var d = Math.sqrt(d2), f = (14 - d) * 6; dx /= d; dy /= d; a.vx -= dx * f * dt * 10; a.vy -= dy * f * dt * 10; b.vx += dx * f * dt * 10; b.vy += dy * f * dt * 10; }
        }
        for (k = 0; k < N; k++) {
          var q = P[k]; q.x += q.vx * dt; q.y += q.vy * dt;
          if (q.x < 8) { q.x = 8; q.vx = Math.abs(q.vx); } if (q.x > 952) { q.x = 952; q.vx = -Math.abs(q.vx); }
          if (q.y < 158) { q.y = 158; q.vy = Math.abs(q.vy); } if (q.y > 262) { q.y = 262; q.vy = -Math.abs(q.vy); }
        }
      } else {
        for (k = 0; k < N; k++) {
          var o = P[k], rt = routes[o.dest]; o.s += SPEED * dt;
          if (o.s > rt.len) { o.s -= o.cyc; arrived++; rooms[o.dest].setAttribute('class', 'rm hit'); (function (r) { setTimeout(function () { r.setAttribute('class', 'rm'); }, 450); })(rooms[o.dest]); }
          var s = Math.max(0, o.s), tp = rpos(rt, s), w = 1 - Math.exp(-dt * 5);
          o.x += (tp[0] - o.x) * w; o.y += (tp[1] - o.y) * w; o.vx = o.vy = 0;
          var fade = o.s < 0 ? 0 : (s > rt.len - 30 ? Math.max(0, (rt.len - s) / 30) : 1);
          o.op = fade; var tl = rpos(rt, Math.max(0, s - 26)); o.tx = tl[0]; o.ty = tl[1];
        }
      }
    }
    var stats = [document.getElementById('rV1'), document.getElementById('rV2'), document.getElementById('rV3')],
      labs = [document.getElementById('rL1'), document.getElementById('rL2'), document.getElementById('rL3')];
    function draw() {
      var lost = 0, desk = 0;
      for (var k = 0; k < N; k++) {
        var p = P[k], op = order ? (p.op === undefined ? 1 : p.op) : 1;
        p.g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
        p.g.style.opacity = op;
        var isLost = !order && p.lost && !p.desk;
        if (isLost) lost++; if (!order && p.desk) desk++;
        p.c.setAttribute('class', 'pp' + (isLost ? ' lost' : '')); p.q.style.opacity = isLost ? 1 : 0;
        if (order && p.tx !== undefined) { p.ln.setAttribute('x1', (p.tx - p.x).toFixed(1)); p.ln.setAttribute('y1', (p.ty - p.y).toFixed(1)); p.ln.setAttribute('x2', 0); p.ln.setAttribute('y2', 0); p.ln.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')'); p.ln.style.opacity = op * .5; } else p.ln.style.opacity = 0;
      }
      var tv = order ? [0, 0, arrived] : [desk, lost, wrong];
      for (k = 0; k < 3; k++) { disp[k] += (tv[k] - disp[k]) * .18; if (Math.abs(tv[k] - disp[k]) < .5) disp[k] = tv[k]; stats[k].textContent = String(Math.round(disp[k])); }
      labs[2].textContent = order ? 'Arrived at their room' : 'Wrong turns';
      var cells = [], bi;
      for (bi = 0; bi < HX; bi++) cells[bi] = 0;
      if (!order) for (k = 0; k < N; k++) cells[Math.min(HX - 1, Math.max(0, Math.floor(P[k].x / 80)))]++;
      for (bi = 0; bi < HX; bi++) heat[bi].setAttribute('r', order ? 0 : Math.min(52, Math.max(0, (cells[bi] - 3) * 6)).toFixed(0));
      var now = performance.now();
      if (!order && now - bTimer > 1100) {
        bTimer = now; var ls = P.filter(function (z) { return z.lost && !z.desk; }), b0 = bub.filter(function (z) { return !z.p || now - z.t > 2300; })[0];
        if (b0 && ls.length) { b0.p = ls[Math.floor(Math.random() * ls.length)]; b0.t = now; b0.el.textContent = BT[Math.floor(Math.random() * BT.length)]; }
      }
      bub.forEach(function (b) { if (!b.p) return; var age = now - b.t; if (order || age > 2300) { b.el.style.opacity = 0; b.p = null; return; } b.el.setAttribute('x', Math.min(880, Math.max(70, b.p.x)).toFixed(1)); b.el.setAttribute('y', (b.p.y - 20).toFixed(1)); b.el.style.opacity = age < 200 ? age / 200 : (age > 2000 ? (2300 - age) / 300 : 1); });
      var hov = null;
      if (order) for (k = 0; k < N; k++) if ((P[k].x - mouse.x) * (P[k].x - mouse.x) + (P[k].y - mouse.y) * (P[k].y - mouse.y) < 200 && (P[k].op === undefined || P[k].op > .5)) { hov = P[k]; break; }
      if (hov) { tip.textContent = 'Heading to ' + names[hov.dest]; tip.setAttribute('x', Math.min(860, Math.max(90, hov.x))); tip.setAttribute('y', hov.y - 14); tip.style.opacity = 1; } else tip.style.opacity = 0;
    }
    var cap = document.getElementById('rCap'), bC = document.getElementById('rChaos'), bO = document.getElementById('rOrder');
    function setMode(o) {
      if (order === o) return; order = o; arrived = 0;
      card.classList.toggle('order', o);
      bC.setAttribute('aria-pressed', String(!o)); bO.setAttribute('aria-pressed', String(o));
      cap.textContent = o ? 'Same crowd, same time. Each visitor scans once and walks straight to their room.' : 'Hospital, 10:30 am. Nobody knows where to go.';
      labs[0].textContent = o ? 'Asking at reception' : 'Asking at reception'; labs[1].textContent = 'Visitors lost';
      if (o) for (var k = 0; k < N; k++) { P[k].s = (k / N) * P[k].cyc * .85 - 40 - Math.random() * 20; P[k].op = 1; }
      bO.classList.remove('nudge');
      if (o && ring.animate && !rm) ring.animate([{ transform: 'scale(1)', opacity: .7 }, { transform: 'scale(120)', opacity: 0 }], { duration: 1100, easing: 'cubic-bezier(.22,1,.36,1)' });
      if (rm) { for (var n = 0; n < 160; n++) step(1 / 30); draw(); }
    }
    bC.onclick = function () { setMode(false); }; bO.onclick = function () { setMode(true); };
    if (rm) { for (var n = 0; n < 200; n++) step(1 / 30); draw(); return; }
    var last = 0, vis = false, nudged = false;
    function loop(t) {
      if (!vis) { last = 0; return; }
      var dt = last ? Math.min(.05, (t - last) / 1000) : .016; last = t; step(dt); if ((tick++ & 1) === 0) draw(); requestAnimationFrame(loop);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v && !vis) { vis = true; requestAnimationFrame(loop); if (!nudged) { nudged = true; setTimeout(function () { if (!order) bO.classList.add('nudge'); }, 6000); } } else if (!v) vis = false; }, { rootMargin: '80px' }).observe(card);
    } else { vis = true; requestAnimationFrame(loop); }
    draw();
  }


  function go(){try{setupRush()}catch(e){console.error(e)}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
})();
