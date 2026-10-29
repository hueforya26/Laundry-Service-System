(function () {
  'use strict';

  var stage = document.getElementById('fkStage');
  if (!stage) return;


  var API_BASE = (window.LAUNDRY_API_URL || 'laundry-service-system-production.up.railway.app').replace(/\/+$/, '');

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var peso = function (n) { return '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 }); };
  var DAY = 864e5;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var reduceMotion = function () { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; };


  var orders = [];
  var loadState = 'loading'; 
  var loadError = '';

  function parseDate(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return isNaN(v) ? null : v;
    var s = String(v).trim();
    if (/^\d{4}-\d{2}-\d{2} \d/.test(s)) s = s.replace(' ', 'T');
    var d = new Date(s);
    return isNaN(d) ? null : d;
  }

  function pick(r, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (r[keys[i]] != null && r[keys[i]] !== '') return r[keys[i]];
    }
    return null;
  }

  function normalize(r) {
    var status = String(pick(r, ['status', 'order_status', 'orderStatus']) || '').trim();
    var created = parseDate(pick(r, ['created_at', 'createdAt', 'order_date', 'orderDate', 'date', 'created']));
    var doneAt = parseDate(pick(r, ['completed_at', 'completedAt', 'picked_up_at', 'pickedUpAt', 'updated_at', 'updatedAt']));
    var lower = status.toLowerCase();
    var cancelled = /cancel/.test(lower);
    var completed = !cancelled && /(complete|picked|claimed|done)/.test(lower) && !/\bnot\b/.test(lower);
    return {
      price: Number(pick(r, ['price', 'total', 'amount']) || 0) || 0,
      completed: completed,
      cancelled: cancelled,
      when: completed ? (doneAt || created) : created
    };
  }

  function loadOrders() {
    loadState = 'loading';
    return fetch(API_BASE + '/customers?scope=all', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('The server answered with ' + res.status + '.');
        return res.json();
      })
      .then(function (d) {
        var list = Array.isArray(d) ? d : (d && (d.customers || d.orders || d.data)) || [];
        orders = list.map(normalize).filter(function (o) { return o.when; });
        loadState = 'ok';
        loadError = '';
      })
      .catch(function (e) {
        orders = [];
        loadState = 'error';
        loadError = (e && e.message) || 'Could not reach the server.';
      })
      .then(function () { animStats = true; renderSales(); });
  }

  function getCompleted(start, end) {
    return orders.filter(function (o) { return o.completed && o.when >= start && o.when < end; });
  }
  function inProgress() {
    return orders.filter(function (o) { return !o.completed && !o.cancelled; }).length;
  }


  var startOfDay = function (d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  var addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  var toInput = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var fromInput = function (s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  var fmtD = function (d, o) { return d.toLocaleDateString('en-PH', o); };
  var today0 = startOfDay(new Date());

  var type = 'weekly';
  var metric = 'earnings';
  var animStats = true;

  function getRange(t, d) {
    if (t === 'daily') return { start: d, end: addDays(d, 1) };
    if (t === 'weekly') {
      var s = addDays(d, -((d.getDay() + 6) % 7)); // Mon–Sun
      return { start: s, end: addDays(s, 7) };
    }
    var m = new Date(d.getFullYear(), d.getMonth(), 1);
    return { start: m, end: new Date(d.getFullYear(), d.getMonth() + 1, 1) };
  }

  function niceMax(max) {
    if (max <= 0) return 4;
    var raw = max / 4, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p * 4;
  }

  function chartAxis(m, t, max) {
    var top, step;
    if (m === 'earnings') {
      if (t === 'daily') {
        if (max <= 800) return { top: 800, step: 200 };
        step = [250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000, 100000].find(function (x) { return Math.ceil(max / x) <= 4; });
        if (step) return { top: Math.ceil(max / step) * step, step: step };
      }
      top = niceMax(max);
      return { top: top, step: top / 4 };
    }
    var base = { daily: { top: 2, step: 1 }, weekly: { top: 4, step: 1 }, monthly: { top: 8, step: 2 } }[t];
    if (max <= base.top) return base;
    step = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].find(function (x) { return Math.ceil(max / x) <= 4; });
    if (step) return { top: Math.ceil(max / step) * step, step: step };
    top = niceMax(max);
    return { top: top, step: top / 4 };
  }

  function countUp(el) {
    var to = +el.dataset.to, money = el.dataset.money === '1';
    var fmt = function (v) { return money ? peso(v) : String(v); };
    if (!to || reduceMotion()) { el.textContent = fmt(to); return; }
    var t0 = performance.now(), D = 900;
    (function f(t) {
      var p = Math.min((t - t0) / D, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(to * e));
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  $$('.fk-seg', stage).forEach(function (s) {
    var p = document.createElement('span');
    p.className = 'fk-pill';
    p.setAttribute('aria-hidden', 'true');
    s.prepend(p);
  });

  function syncPills(snap) {
    $$('.fk-seg', stage).forEach(function (seg) {
      var p = seg.querySelector('.fk-pill'), b = seg.querySelector('[aria-pressed="true"]');
      if (!p || !b || !seg.offsetWidth) return;
      if (snap) p.classList.remove('fk-ready');
      p.style.width = b.offsetWidth + 'px';
      p.style.transform = 'translateX(' + b.offsetLeft + 'px)';
      if (!p.classList.contains('fk-ready')) { void p.offsetWidth; p.classList.add('fk-ready'); }
    });
  }
  new MutationObserver(function () { syncPills(); })
    .observe(stage, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
  window.addEventListener('resize', function () { syncPills(true); });
  window.addEventListener('load', function () { syncPills(true); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { syncPills(true); });


  function renderSales() {
    var dateEl = $('#fkDate');
    var d = fromInput(dateEl.value);
    if (!d || d > today0) { d = today0; dateEl.value = toInput(d); }
    var range = getRange(type, d), start = range.start, end = range.end;
    var list = getCompleted(start, end);
    var earn = list.reduce(function (s, o) { return s + o.price; }, 0);
    var last = addDays(end, -1);

    $('#fkRangeLabel').textContent =
      type === 'daily' ? fmtD(start, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
        : type === 'weekly' ? 'Week of ' + fmtD(start, { month: 'short', day: 'numeric' }) + ' – ' + fmtD(last, { month: 'short', day: 'numeric', year: 'numeric' })
          : fmtD(start, { month: 'long', year: 'numeric' });

    $('#fkStats').innerHTML =
      '<div class="fk-card fk-stat"><span class="fk-ico fk-teal"><svg class="fk-ic"><use href="#fk-i-coins"/></svg></span>' +
      '<div><div class="fk-lbl">Total earnings</div><div class="fk-val" data-to="' + earn + '" data-money="1">' + peso(earn) + '</div></div></div>' +
      '<div class="fk-card fk-stat fk-violet"><span class="fk-ico"><svg class="fk-ic"><use href="#fk-i-clip"/></svg></span>' +
      '<div><div class="fk-lbl">Completed orders</div><div class="fk-val" data-to="' + list.length + '">' + list.length + '</div></div></div>';
    if (animStats) { $$('#fkStats .fk-val').forEach(countUp); animStats = false; }

    var n, lab, idx, showEvery;
    if (type === 'daily') {
      n = 24; lab = function (i) { return (i % 12 || 12) + (i < 12 ? 'a' : 'p'); };
      idx = function (o) { return o.when.getHours(); }; showEvery = 3;
    } else if (type === 'weekly') {
      n = 7; lab = function (i) { return fmtD(addDays(start, i), { weekday: 'short' }); };
      idx = function (o) { return Math.round((startOfDay(o.when) - start) / DAY); }; showEvery = 1;
    } else {
      n = Math.round((end - start) / DAY); lab = function (i) { return String(i + 1); };
      idx = function (o) { return o.when.getDate() - 1; }; showEvery = n > 20 ? 5 : 2;
    }
    var fullLab = function (i) {
      return type === 'daily'
        ? lab(i) + ' – ' + ((((i + 1) % 12) || 12) + ((i + 1) % 24 < 12 ? 'a' : 'p'))
        : fmtD(addDays(start, i), { weekday: 'short', month: 'short', day: 'numeric' });
    };
    var earnV = Array(n).fill(0), cntV = Array(n).fill(0);
    list.forEach(function (o) { var i = idx(o); if (i >= 0 && i < n) { earnV[i] += o.price; cntV[i]++; } });
    var vals = metric === 'earnings' ? earnV : cntV;
    var fmtV = function (v) { return metric === 'earnings' ? peso(v) : v + (v === 1 ? ' order' : ' orders'); };

    $('#fkReadout').textContent =
      loadState === 'loading' ? 'Loading orders…'
        : loadState === 'error' ? 'Orders could not be loaded.'
          : list.length ? 'Hover or tap a bar for details' : 'No completed orders in this range.';

    var W = 640, H = 240, pl = 44, pb = 26, pt = 22;
    var ax = chartAxis(metric, type, Math.max.apply(null, vals)), top = ax.top, yStep = ax.step;
    var bw = (W - pl) / n, gap = Math.min(10, bw * 0.22);
    var s = '<svg class="fk-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      (metric === 'earnings' ? 'Earnings' : 'Completed orders') + ' chart, total ' +
      esc(metric === 'earnings' ? peso(earn) : list.length) +
      '"><defs><linearGradient id="fkBarG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#58f3de"/><stop offset="1" stop-color="#12b3a3"/></linearGradient></defs>';
    var lines = Math.round(top / yStep);
    for (var g = 0; g <= lines; g++) {
      var v = yStep * g, y = pt + (H - pt - pb) * (1 - v / top);
      s += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="rgba(200,205,255,' + (g ? 0.18 : 0.45) + ')"' +
        (g ? ' stroke-dasharray="4 6"' : '') + '/><text x="' + (pl - 8) + '" y="' + (y + 4) + '" text-anchor="end">' +
        (metric === 'earnings' ? '₱' : '') + (v >= 1000 ? (v / 1000) + 'k' : Math.round(v)) + '</text>';
    }
    vals.forEach(function (val, i) {
      var h = (H - pt - pb) * val / top, x = pl + i * bw + gap / 2, hh = Math.max(h, 3);
      s += '<rect class="fk-bar-r ' + (val ? '' : 'fk-zero') + '" tabindex="0" x="' + x + '" y="' + (H - pb - hh) + '" width="' + (bw - gap) +
        '" height="' + hh + '" rx="4" data-i="' + i + '" aria-label="' + esc(fullLab(i)) + ': ' + esc(fmtV(val)) + '"><title>' +
        esc(fullLab(i)) + ': ' + esc(fmtV(val)) + '</title></rect>';
      if (val > 0 && bw >= 22) {
        var short = bw < 30;
        var txt = metric === 'earnings' ? (short ? (val >= 1000 ? (Math.round(val / 100) / 10) + 'k' : String(Math.round(val))) : peso(val)) : String(val);
        s += '<text class="fk-bar-val" data-i="' + i + '" x="' + (x + (bw - gap) / 2) + '" y="' + (H - pb - hh - 5) +
          '" text-anchor="middle" font-weight="700" pointer-events="none"' + (short ? ' style="font-size:10px"' : '') + '>' + esc(txt) + '</text>';
      }
      if (i % showEvery === 0) {
        s += '<text x="' + (x + (bw - gap) / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(lab(i)) + '</text>';
      }
    });
    s += '</svg>';
    $('#fkChart').innerHTML = s;

    $$('#fkChart .fk-bar-r').forEach(function (r, i) {
      if (!reduceMotion()) r.style.animationDelay = i * 70 + 'ms';
      var show = function () {
        var k = +r.dataset.i;
        $('#fkReadout').innerHTML = '<b>' + esc(fullLab(k)) + '</b> · ' + peso(earnV[k]) + ' from ' + cntV[k] +
          ' completed order' + (cntV[k] === 1 ? '' : 's');
      };
      r.addEventListener('mouseenter', show);
      r.addEventListener('focus', show);
      r.addEventListener('click', show);
    });
    if (!reduceMotion() && window.Element && Element.prototype.animate) {
      $$('#fkChart .fk-bar-val').forEach(function (t) {
        t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: 500 + (+t.dataset.i) * 70, fill: 'backwards', easing: 'ease-out' });
      });
    }

    var rule = $('#fkRule');
    var ruleTxt = $('#fkRuleTxt');
    if (loadState === 'error') {
      rule.classList.add('fk-warn');
      ruleTxt.textContent = loadError + ' Refresh the page to try again.';
    } else {
      rule.classList.remove('fk-warn');
      var ip = inProgress();
      ruleTxt.textContent = loadState === 'loading'
        ? 'Loading your orders…'
        : 'Only orders marked Completed (picked up) are counted. ' + ip + ' order' + (ip === 1 ? ' is' : 's are') + ' still in progress and not included.';
    }
    syncPills();
  }

  
  $('#fkTypeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    type = b.dataset.t;
    $$('#fkTypeSeg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    animStats = true; renderSales();
  });
  $('#fkMetricSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    metric = b.dataset.m;
    $$('#fkMetricSeg button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    renderSales();
  });
  var dateEl = $('#fkDate');
  dateEl.max = toInput(today0);
  dateEl.value = toInput(today0);
  dateEl.addEventListener('change', function () { animStats = true; renderSales(); });


  
  var ADMIN_PASSWORD = 'admin123';
  var login = document.getElementById('adminLogin');
  var dash = document.getElementById('adminDashboard');
  var form = document.getElementById('adminLoginForm');
  var pw = document.getElementById('adminPassword');
  var msg = document.getElementById('adminLoginMessage');

  
  function setLocked(locked) {
    login.hidden = !locked;
    dash.hidden = false;
    if (locked) dash.setAttribute('inert', ''); else dash.removeAttribute('inert');
    document.body.style.overflow = locked ? 'hidden' : '';
    window.dispatchEvent(new Event('resize'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (pw.value === ADMIN_PASSWORD) {
      msg.textContent = '';
      pw.value = '';
      setLocked(false);
      loadOrders();
    } else {
      msg.textContent = 'Incorrect password.';
    }
  });


  $('#fkLogout').addEventListener('click', function () {
    window.location.href = 'Employee.html';
  });

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && loadState !== 'loading') loadOrders();
  });

  setLocked(true);

  renderSales();
  loadOrders();
})();