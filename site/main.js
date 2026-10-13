/* ═══ משיבי רוח · גלילה מונעת פריימים ═══ */
(function () {
  'use strict';

  /* ── ⚠ יעד שליחת הטופס טרם הוגדר. כשיוגדר — להציב כאן URL ── */
  var SUBMIT_ENDPOINT = null;   /* לדוגמה: 'https://formspree.io/f/xxxx' */

  var mqSmall = window.matchMedia('(max-width: 767.98px)');
  var mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isStatic = function () { return mqSmall.matches || mqMotion.matches; };

  var pad = function (n) { return String(n).padStart(4, '0'); };
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ───────────────────────── Scrubber ───────────────────────── */
  function Scrubber(section) {
    this.el = section;
    this.seq = section.dataset.seq;
    this.count = parseInt(section.dataset.count, 10);
    this.ext = section.dataset.ext || 'jpg';
    this.canvas = section.querySelector('.cine__canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;
    this.poster = section.querySelector('.cine__poster');
    this.bar = section.querySelector('.cine__loader i');
    this.beats = [].slice.call(section.querySelectorAll('[data-from]'));
    this.frames = [];
    this.ready = false;
    this.loading = false;
    this.progress = 0;
    this.drawn = -1;
  }

  Scrubber.prototype.src = function (i) {
    return 'frames/' + this.seq + '/' + pad(i + 1) + '.' + this.ext;
  };

  /* טעינה מקדימה מלאה — לא מציירים לפני שכל הרצף בזיכרון */
  Scrubber.prototype.preload = function () {
    if (this.loading || this.ready) return;
    this.loading = true;
    var self = this, done = 0;
    for (var i = 0; i < this.count; i++) {
      var img = new Image();
      img.decoding = 'async';
      img.src = this.src(i);
      this.frames.push(img);
      var onDone = function () {
        done++;
        if (self.bar) self.bar.style.width = (done / self.count * 100) + '%';
        if (done === self.count) {
          self.ready = true;
          self.resize();
          self.el.classList.add('is-ready');
        }
      };
      img.onload = onDone;
      img.onerror = onDone;
    }
  };

  Scrubber.prototype.resize = function () {
    if (!this.canvas) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.drawn = -1;
  };

  /* ציור בהתנהגות object-fit: cover */
  Scrubber.prototype.draw = function (idx) {
    if (!this.ready || idx === this.drawn) return;
    var img = this.frames[idx];
    if (!img || !img.naturalWidth) return;
    var cw = this.canvas.width, ch = this.canvas.height;
    var scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    this.ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.drawn = idx;
  };

  Scrubber.prototype.measure = function () {
    var r = this.el.getBoundingClientRect();
    var span = this.el.offsetHeight - window.innerHeight;
    this.visible = r.top < window.innerHeight && r.bottom > 0;
    this.near = r.top < window.innerHeight * 2.2 && r.bottom > -window.innerHeight;
    this.progress = span > 0 ? clamp(-r.top / span) : (r.top <= 0 ? 1 : 0);
  };

  Scrubber.prototype.update = function () {
    this.measure();
    if (this.near) this.preload();
    if (this.visible && this.ready) {
      this.draw(Math.min(this.count - 1, Math.round(this.progress * (this.count - 1))));
    }
    this.beats.forEach(function (b) {
      var from = parseFloat(b.dataset.from);
      var to = b.dataset.to !== undefined ? parseFloat(b.dataset.to) : Infinity;
      b.classList.toggle('is-on', this.progress >= from && this.progress <= to);
    }, this);
  };

  /* מצב סטטי: מובייל / prefers-reduced-motion → הפריים האחרון בלבד */
  Scrubber.prototype.staticMode = function () {
    if (this.poster) this.poster.src = this.src(this.count - 1);
    this.beats.forEach(function (b) { b.classList.add('is-on'); });
  };

  /* חזרה למצב סקראב (שינוי רוחב חלון) */
  Scrubber.prototype.dynamicMode = function () {
    if (this.poster && !this.ready) this.poster.src = this.src(0);
  };

  /* ───────────────────────── boot ───────────────────────── */
  var scrubbers = [].slice.call(document.querySelectorAll('.cine')).map(function (s) {
    return new Scrubber(s);
  });

  var ticking = false;
  function frame() {
    ticking = false;
    scrubbers.forEach(function (s) { s.update(); });
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function start() {
    window.removeEventListener('scroll', onScroll);
    if (isStatic()) {
      scrubbers.forEach(function (s) { s.staticMode(); });
      return;
    }
    scrubbers.forEach(function (s) { s.dynamicMode(); s.resize(); });
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(start, 160);
  }, { passive: true });

  if (mqSmall.addEventListener) mqSmall.addEventListener('change', start);
  start();

  /* ───────────────────────── ניווט ───────────────────────── */
  var nav = document.getElementById('nav');
  var toggle = nav.querySelector('.nav__toggle');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
  });
  nav.querySelectorAll('.nav__links a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ───────────────────────── טופס ───────────────────────── */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'נא למלא שם מלא'; },
    org: function (v) { return v.trim().length >= 2 ? '' : 'נא למלא שם ארגון'; },
    phone: function (v) {
      var d = v.replace(/[^\d]/g, '');
      return d.length >= 9 && d.length <= 15 ? '' : 'נא למלא מספר טלפון תקין';
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'נא למלא כתובת דואר אלקטרוני תקינה';
    }
  };

  function validateField(input) {
    var msg = rules[input.name] ? rules[input.name](input.value) : '';
    var err = document.getElementById('e-' + input.id.replace('f-', ''));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  }

  form.querySelectorAll('input').forEach(function (input) {
    input.addEventListener('blur', function () { validateField(input); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form__status';
    status.textContent = '';

    var inputs = [].slice.call(form.querySelectorAll('input'));
    var ok = true, firstBad = null;
    inputs.forEach(function (i) {
      if (!validateField(i)) { ok = false; if (!firstBad) firstBad = i; }
    });
    if (!ok) {
      status.classList.add('is-bad');
      status.textContent = 'יש להשלים את השדות המסומנים.';
      if (firstBad) firstBad.focus();
      return;
    }

    var data = {};
    inputs.forEach(function (i) { data[i.name] = i.value.trim(); });

    if (!SUBMIT_ENDPOINT) {
      /* ⚠ hook — יעד השליחה טרם הוגדר */
      console.info('[משיבי רוח] פנייה מהטופס (טרם הוגדר יעד שליחה):', data);
      status.classList.add('is-ok');
      status.textContent = 'תודה, הפרטים התקבלו. ⚠ מצב הדגמה — יעד השליחה טרם הוגדר.';
      form.reset();
      return;
    }

    fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('bad response');
      status.classList.add('is-ok');
      status.textContent = 'תודה. הפנייה נשלחה — נחזור אליכם בקרוב.';
      form.reset();
    }).catch(function () {
      status.classList.add('is-bad');
      status.textContent = 'אירעה תקלה בשליחה. אפשר לנסות שוב בעוד רגע.';
    });
  });
})();
