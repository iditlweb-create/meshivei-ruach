/* ═══ משיבי רוח · סקיצה ב׳ · גלילה מונעת פריימים + קשת נפתחת ═══ */
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
    this.arch = section.querySelector('.arch');
    this.archBack = section.querySelector('.arch-back');
    this.archClipPath = section.classList.contains('cine--hero') ? document.getElementById('hero-book-clip-path') : null;
    this.archOutlinePath = section.classList.contains('cine--hero') ? document.getElementById('hero-book-outline-path') : null;
    this.archEnd = section.dataset.archEnd ? parseFloat(section.dataset.archEnd) : null;
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
          self.draw(Math.min(self.count - 1, Math.round(self.progress * (self.count - 1))));
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

  Scrubber.prototype.setArchShape = function (t) {
    if (this.archClipPath) {
      this.archClipPath.setAttribute('d',
        'M0 ' + (.403 * t) +
        ' C.06 ' + (.573 * t) + ' .17 ' + (.633 * t) + ' .31 ' + (.613 * t) +
        ' C.48 ' + (.593 * t) + ' .68 ' + (.593 * t) + ' .82 ' + (.633 * t) +
        ' C.92 ' + (.683 * t) + ' .97 ' + (.813 * t) + ' 1 ' + (.883 * t) +
        ' L1 1 L0 1Z');
    }
    if (this.archOutlinePath) {
      this.archOutlinePath.setAttribute('d',
        'M0 ' + (373 * t) +
        ' C70 ' + (543 * t) + ' 200 ' + (603 * t) + ' 350 ' + (583 * t) +
        ' C510 ' + (563 * t) + ' 700 ' + (573 * t) + ' 840 ' + (613 * t) +
        ' C930 ' + (663 * t) + ' 980 ' + (783 * t) + ' 1000 ' + (873 * t));
    }
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
      b.classList.toggle('is-past', Number.isFinite(to) && this.progress > to);
    }, this);

    var firstQuestions = this.el.querySelector('.problem-question-pair--one');
    var nextQuestions = this.el.querySelector('.problem-question-pair--two');
    if (firstQuestions && nextQuestions) {
      var firstVisible = this.progress >= 0.62;
      var secondVisible = this.progress > 0.82;
      var fallRight = clamp((this.progress - 0.78) / 0.08);
      var fallLeft = clamp((this.progress - 0.82) / 0.08);
      firstQuestions.style.setProperty('--fall-r', String(fallRight));
      firstQuestions.style.setProperty('--fall-l', String(fallLeft));
      nextQuestions.classList.toggle('is-staged', firstVisible);
      this.el.querySelectorAll('.problem-new__progress i').forEach(function (line, index) {
        line.classList.toggle('is-on', index === (secondVisible ? 1 : 0) && this.progress >= 0.62);
      }, this);
    }

    /* הקשת: רדיוס-פינות גדול בתחילת הגלילה → 0 (מלבן מלא) בסוף שלב הפתיחה */
    if (this.arch && this.archEnd) {
      var t = clamp(1 - this.progress / this.archEnd);
      this.arch.style.setProperty('--t', String(t));
      if (this.archBack) this.archBack.style.setProperty('--t', String(t));
      this.setArchShape(t);
    }
  };

  /* מצב סטטי: מובייל / prefers-reduced-motion → הפריים האחרון בלבד */
  Scrubber.prototype.staticMode = function () {
    if (this.poster) this.poster.src = this.src(this.el.classList.contains('cine--hero') ? 0 : this.count - 1);
    if (this.arch) this.arch.style.setProperty('--t', '0');
    if (this.archBack) this.archBack.style.setProperty('--t', '0');
    this.setArchShape(0);
    this.beats.forEach(function (b) { b.classList.add('is-on'); });
  };

  /* חזרה למצב סקראב (שינוי רוחב חלון) */
  Scrubber.prototype.dynamicMode = function () {
    if (this.poster && !this.ready) this.poster.src = this.src(0);
  };

  /* ─────────────── אייקוני קו — מצטיירים בלופ איטי ───────────────
     כל <svg data-draw> עם <use> מקבל עותק של הסימבול, כדי שכל קו
     יקבל pathLength=1 ועיכוב משלו. האנימציה עצמה ב-CSS (icon-draw). */
  var DRAW_SHAPES = 'path,circle,rect,line,polyline,ellipse';

  function drawIcon(svg, id) {
    var use = svg.querySelector('use');
    id = id || (use && (use.getAttribute('href') || '').slice(1));
    var symbol = id && document.getElementById(id);
    if (!symbol) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));
    [].forEach.call(symbol.childNodes, function (node) { svg.appendChild(node.cloneNode(true)); });
    [].forEach.call(svg.querySelectorAll(DRAW_SHAPES), function (shape, i) {
      shape.setAttribute('pathLength', '1');
      shape.style.setProperty('--i', i);
    });
    svg.dataset.icon = id;
    svg.classList.add('is-ready');
  }

  var drawIcons = [].slice.call(document.querySelectorAll('svg[data-draw]'));
  drawIcons.forEach(function (svg) { drawIcon(svg); });
  if ('IntersectionObserver' in window) {
    var iconObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-drawing', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    drawIcons.forEach(function (svg) { iconObserver.observe(svg); });
  } else {
    drawIcons.forEach(function (svg) { svg.classList.add('is-drawing'); });
  }

  /* ───────────────────────── boot ───────────────────────── */
  var scrubbers = [].slice.call(document.querySelectorAll('.cine')).map(function (s) {
    return new Scrubber(s);
  });

  /* ─────────────── סרטון הייחוד — גלילה מונעת זמן ─────────────── */
  var approachChapters = [
    { number: '01', icon: 'ic-philosophy', title: 'פילוסופיה מודרנית', copy: 'לשאול מחדש את מה שנדמה מובן מאליו' },
    { number: '02', icon: 'ic-jewish-sources', title: 'מקורות יהודיים', copy: 'מפגש מחודש עם טקסטים חיים' },
    { number: '03', icon: 'ic-discourse', title: 'שיח ישראלי עכשווי', copy: 'דיאלוג על החברה, הזהות והעתיד' },
    { number: '04', icon: 'ic-dialogue', title: 'למידה דיאלוגית', copy: 'קהילה שחושבת יחד' }
  ];

  function ApproachFilm(section) {
    this.el = section;
    this.video = section.querySelector('.approach-film__video');
    this.number = section.querySelector('[data-chapter-number]');
    this.title = section.querySelector('[data-chapter-title]');
    this.copy = section.querySelector('[data-chapter-copy]');
    this.chapter = section.querySelector('.approach-film__chapter');
    this.icon = section.querySelector('[data-chapter-icon]');
    this.items = [].slice.call(section.querySelectorAll('.approach-film__timeline li'));
    this.cue = section.querySelector('[data-approach-cue]');
    this.duration = 20;
    this.active = 0;
    this.chapterTimer = 0;
    this.lastSeek = -1;
    this.lastSeekAt = 0;
    this.targetTime = .08;
    this.playheadTime = .08;
    this.seekFrame = 0;
    this.failed = false;

    if (!this.video || mqMotion.matches) {
      this.fallback();
      return;
    }

    var self = this;
    this.video.pause();
    this.video.addEventListener('loadedmetadata', function () {
      if (Number.isFinite(self.video.duration)) self.duration = self.video.duration;
      self.el.classList.add('is-video-ready');
      self.update(true);
    }, { once: true });
    this.video.addEventListener('error', function () { self.fallback(); }, { once: true });
    this.video.load();
  }

  ApproachFilm.prototype.fallback = function () {
    this.failed = true;
    this.el.classList.add('is-fallback');
    if (this.video) this.video.removeAttribute('src');
  };

  ApproachFilm.prototype.setChapter = function (index) {
    if (index === this.active && this.title.textContent === approachChapters[index].title) return;
    this.active = index;
    var data = approachChapters[index];
    var self = this;
    window.clearTimeout(this.chapterTimer);
    this.chapter.classList.add('is-changing');
    this.chapterTimer = window.setTimeout(function () {
      self.number.textContent = data.number;
      self.title.textContent = data.title;
      self.copy.textContent = data.copy;
      if (self.icon) drawIcon(self.icon, data.icon);
      self.chapter.classList.remove('is-changing');
    }, 105);
    this.items.forEach(function (item, itemIndex) {
      var isActive = itemIndex === index;
      item.classList.toggle('is-active', isActive);
      if (isActive) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
  };

  ApproachFilm.prototype.renderProgress = function (progress) {
    this.el.style.setProperty('--film-progress', String(progress));
    if (this.cue) this.cue.style.opacity = progress < .07 ? String(1 - progress / .07) : '0';
    var chapterIndex = Math.min(3, Math.floor(progress * 4));
    this.setChapter(chapterIndex);
    this.items.forEach(function (item, index) {
      item.style.setProperty('--chapter-fill', String(clamp(progress * 4 - index)));
    });
  };

  ApproachFilm.prototype.startSeeking = function () {
    if (this.seekFrame || this.failed) return;
    var self = this;
    function step(now) {
      if (self.failed || !self.video || self.video.readyState < 1) {
        self.seekFrame = 0;
        return;
      }
      var delta = self.targetTime - self.playheadTime;
      if (Math.abs(delta) <= .045) {
        self.playheadTime = self.targetTime;
        try { self.video.currentTime = self.playheadTime; } catch (error) { self.fallback(); }
        self.renderProgress(clamp((self.playheadTime - .08) / Math.max(.1, self.duration - .16)));
        self.seekFrame = 0;
        return;
      }
      if (now - self.lastSeekAt >= 46) {
        var amount = Math.min(.46, Math.max(.08, Math.abs(delta) * .24));
        self.playheadTime += Math.sign(delta) * Math.min(Math.abs(delta), amount);
        self.lastSeekAt = now;
        self.lastSeek = self.playheadTime;
        try { self.video.currentTime = self.playheadTime; } catch (error) { self.fallback(); }
        self.renderProgress(clamp((self.playheadTime - .08) / Math.max(.1, self.duration - .16)));
      }
      self.seekFrame = window.requestAnimationFrame(step);
    }
    this.seekFrame = window.requestAnimationFrame(step);
  };

  ApproachFilm.prototype.update = function (force) {
    if (this.failed) return;
    var rect = this.el.getBoundingClientRect();
    var span = this.el.offsetHeight - window.innerHeight;
    var progress = span > 0 ? clamp(-rect.top / span) : 0;
    var visible = rect.top < window.innerHeight && rect.bottom > 0;
    this.targetTime = .08 + progress * Math.max(.1, this.duration - .16);

    if (force && this.video && this.video.readyState >= 1) {
      this.playheadTime = this.targetTime;
      try { this.video.currentTime = this.targetTime; } catch (error) { this.fallback(); }
      this.renderProgress(progress);
      return;
    }
    if (!visible || !this.video || this.video.readyState < 1) {
      this.renderProgress(progress);
      return;
    }
    this.startSeeking();
  };

  var approachFilmEl = document.querySelector('[data-video-scrub]');
  var approachFilm = approachFilmEl ? new ApproachFilm(approachFilmEl) : null;


  var ticking = false;
  function frame() {
    ticking = false;
    scrubbers.forEach(function (s) { s.update(); });
    if (approachFilm) approachFilm.update(false);
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }

  function start() {
    window.removeEventListener('scroll', onScroll);
    if (isStatic()) {
      scrubbers.forEach(function (s) { s.staticMode(); });
      if (approachFilm && mqMotion.matches) approachFilm.fallback();
      if (approachFilm && !mqMotion.matches) {
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
      }
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
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'נא למלא כתובת דואר אלקטרונית תקינה';
    },
    orgType: function (v) { return v ? '' : 'נא לבחור סוג ארגון'; }
  };

  function validateField(input) {
    var msg = rules[input.name] ? rules[input.name](input.value) : '';
    var err = document.getElementById('e-' + input.id.replace('f-', ''));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg; err.hidden = !msg; }
    return !msg;
  }

  form.querySelectorAll('input,select,textarea').forEach(function (field) {
    field.addEventListener('blur', function () { validateField(field); });
    field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', function () {
      if (field.getAttribute('aria-invalid') === 'true') validateField(field);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form__status';
    status.textContent = '';

    var inputs = [].slice.call(form.querySelectorAll('input,select,textarea'));
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
