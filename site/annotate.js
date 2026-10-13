/* ═══ מנגנון הערות · בחירת אלמנט ← הערה ← שליחה בלחיצה אחת ═══ */
(function () {
  'use strict';
  if (window.top !== window.self) return;

  var KEY = 'mashivei-ruach-notes';
  var notes = [];
  try { notes = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { notes = []; }

  /* ── סגנון הכלי ── */
  var css = document.createElement('style');
  css.textContent = [
    '#mrx,#mrx *{box-sizing:border-box;font-family:system-ui,"Segoe UI",Arial,sans-serif}',
    '#mrx{position:fixed;z-index:2147483000;inset-block-end:18px;inset-inline-start:18px;direction:rtl;display:flex;gap:8px;align-items:center}',
    '#mrx button{font:inherit;cursor:pointer;border-radius:6px;border:1px solid transparent}',
    '#mrx .mrx-fab{background:#10263B;color:#FBF8F2;padding:11px 18px;font-size:14px;font-weight:600;box-shadow:0 8px 26px -10px rgba(0,0,0,.6);display:flex;gap:8px;align-items:center}',
    '#mrx .mrx-fab.on{background:#5F6E4A}',
    '#mrx .mrx-count{background:rgba(255,255,255,.22);border-radius:99px;padding:1px 8px;font-size:12px}',
    '#mrx .mrx-panel{position:fixed;inset-block:0;inset-inline-start:0;width:min(400px,92vw);background:#FBF8F2;box-shadow:0 0 50px -12px rgba(0,0,0,.45);display:none;flex-direction:column;color:#10263B}',
    '#mrx.open .mrx-panel{display:flex}',
    '#mrx .mrx-head{padding:16px 18px;border-block-end:1px solid rgba(16,38,59,.12);display:flex;align-items:center;gap:10px}',
    '#mrx .mrx-head h3{margin:0;font-size:15px;font-weight:700;flex:1}',
    '#mrx .mrx-x{background:none;border:0;font-size:20px;line-height:1;padding:2px 6px;color:#4A6076}',
    '#mrx .mrx-list{flex:1;overflow:auto;padding:12px 14px;display:grid;gap:10px;align-content:start}',
    '#mrx .mrx-empty{color:#4A6076;font-size:13px;line-height:1.7;padding:8px}',
    '#mrx .mrx-item{border:1px solid rgba(16,38,59,.14);border-radius:8px;padding:10px 12px;background:#fff;font-size:13px}',
    '#mrx .mrx-item b{display:block;font-size:11px;color:#5F6E4A;letter-spacing:.03em;margin-block-end:3px}',
    '#mrx .mrx-item code{display:block;font-size:11px;color:#4A6076;direction:ltr;text-align:left;margin-block-start:5px;word-break:break-all}',
    '#mrx .mrx-item .mrx-note{margin-block-start:6px;line-height:1.55}',
    '#mrx .mrx-item .mrx-del{float:inline-start;background:none;border:0;color:#B04A3A;font-size:12px;padding:0;margin-block-start:6px}',
    '#mrx .mrx-foot{padding:12px 14px;border-block-start:1px solid rgba(16,38,59,.12);display:grid;gap:8px}',
    '#mrx .mrx-send{background:#10263B;color:#FBF8F2;padding:12px;font-size:14px;font-weight:600}',
    '#mrx .mrx-copy{background:#fff;border-color:rgba(16,38,59,.3);color:#10263B;padding:10px;font-size:13px}',
    '#mrx .mrx-clear{background:none;color:#B04A3A;font-size:12px;padding:4px}',
    '#mrx .mrx-msg{font-size:12px;color:#5F6E4A;min-height:16px;text-align:center}',
    '.mrx-hi{outline:2px dashed #5F6E4A !important;outline-offset:2px;cursor:crosshair !important}',
    'body.mrx-marks .mrx-has{outline:2px solid #C9821F !important;outline-offset:2px}',
    '#mrx .mrx-eye{background:#FBF8F2;color:#10263B;border-color:rgba(16,38,59,.25);width:42px;height:42px;display:grid;place-items:center;box-shadow:0 8px 26px -12px rgba(0,0,0,.5)}',
    '#mrx .mrx-eye svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '#mrx .mrx-eye.off{background:#10263B;color:#FBF8F2;border-color:#10263B}',
    '#mrx-pop{position:absolute;z-index:2147483001;width:300px;background:#fff;border:1px solid rgba(16,38,59,.2);border-radius:10px;box-shadow:0 14px 40px -14px rgba(0,0,0,.5);padding:12px;direction:rtl;font-family:system-ui,sans-serif}',
    '#mrx-pop b{display:block;font-size:11px;color:#5F6E4A;margin-block-end:6px}',
    '#mrx-pop textarea{width:100%;min-height:80px;font:inherit;font-size:13px;padding:8px;border:1px solid rgba(16,38,59,.25);border-radius:6px;resize:vertical}',
    '#mrx-pop .row{display:flex;gap:8px;margin-block-start:8px}',
    '#mrx-pop button{flex:1;font:inherit;font-size:13px;padding:8px;border-radius:6px;cursor:pointer;border:1px solid transparent}',
    '#mrx-pop .ok{background:#10263B;color:#fff}',
    '#mrx-pop .no{background:#fff;border-color:rgba(16,38,59,.25);color:#10263B}'
  ].join('');
  document.head.appendChild(css);

  /* ── שלד ── */
  var root = document.createElement('div');
  root.id = 'mrx';
  root.innerHTML =
    '<button class="mrx-fab" type="button">✎ מצב הערות <span class="mrx-count">0</span></button>' +
    '<button class="mrx-eye off" type="button" aria-pressed="false" title="הצגת/הסתרת סימוני ההערות"></button>' +
    '<aside class="mrx-panel" aria-label="הערות">' +
      '<div class="mrx-head"><h3>הערות על העמוד</h3><button class="mrx-x" type="button" aria-label="סגירה">×</button></div>' +
      '<div class="mrx-list"></div>' +
      '<div class="mrx-foot">' +
        '<button class="mrx-send" type="button">שליחה לקלוד</button>' +
        '<button class="mrx-copy" type="button">העתקה ללוח</button>' +
        '<button class="mrx-clear" type="button">מחיקת כל ההערות</button>' +
        '<p class="mrx-msg"></p>' +
      '</div>' +
    '</aside>';
  document.body.appendChild(root);

  var fab = root.querySelector('.mrx-fab');
  var eye = root.querySelector('.mrx-eye');

  var EYE_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4l16 16"/><path d="M9.6 5.8A9.6 9.6 0 0 1 12 5.5c6.4 0 10 6.5 10 6.5a17 17 0 0 1-3.3 4.1"/><path d="M6.4 7.9A17 17 0 0 0 2 12s3.6 6.5 10 6.5c1.2 0 2.2-.2 3.2-.5"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  var MARKS_KEY = 'mashivei-ruach-marks';
  var marksOn = localStorage.getItem(MARKS_KEY) === '1';

  function applyMarks() {
    document.body.classList.toggle('mrx-marks', marksOn);
    eye.classList.toggle('off', !marksOn);
    eye.innerHTML = marksOn ? EYE_ON : EYE_OFF;
    eye.setAttribute('aria-pressed', String(marksOn));
    eye.setAttribute('aria-label', marksOn ? 'הסתרת סימוני ההערות' : 'הצגת סימוני ההערות');
  }
  eye.addEventListener('click', function () {
    marksOn = !marksOn;
    localStorage.setItem(MARKS_KEY, marksOn ? '1' : '0');
    applyMarks();
  });
  applyMarks();

  var count = root.querySelector('.mrx-count');
  var list = root.querySelector('.mrx-list');
  var msg = root.querySelector('.mrx-msg');
  var picking = false, hovered = null, pop = null;

  /* ── זיהוי אלמנט ── */
  function selectorOf(el) {
    var parts = [], node = el, depth = 0;
    while (node && node.nodeType === 1 && depth < 4 && node !== document.body) {
      var part = node.tagName.toLowerCase();
      if (node.id) { parts.unshift('#' + node.id); break; }
      if (node.dataset && node.dataset.el) { parts.unshift('[data-el="' + node.dataset.el + '"]'); break; }
      var cls = (node.className || '').toString().trim().split(/\s+/)
        .filter(function (c) { return c && c.indexOf('mrx') !== 0 && c !== 'is-on'; })[0];
      if (cls) part += '.' + cls;
      var p = node.parentElement;
      if (p) {
        var same = [].slice.call(p.children).filter(function (c) { return c.tagName === node.tagName; });
        if (same.length > 1) part += ':nth-of-type(' + (same.indexOf(node) + 1) + ')';
      }
      parts.unshift(part);
      node = p; depth++;
    }
    return parts.join(' > ');
  }

  function describe(el) {
    var secEl = el.closest('[data-section]');
    var idEl = el.closest('[data-el]');
    return {
      section: secEl ? secEl.dataset.section : '(מחוץ לסקציה מוגדרת)',
      el: idEl ? idEl.dataset.el : '(ללא מזהה — לפי סלקטור)',
      selector: selectorOf(el),
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 90)
    };
  }

  /* ── תצוגה ── */
  function save() { localStorage.setItem(KEY, JSON.stringify(notes)); render(); }

  function render() {
    count.textContent = notes.length;
    list.innerHTML = '';
    document.querySelectorAll('.mrx-has').forEach(function (e) { e.classList.remove('mrx-has'); });
    if (!notes.length) {
      list.innerHTML = '<p class="mrx-empty">אין עדיין הערות.<br>הפעילו את «מצב הערות», לחצו על כל אלמנט בעמוד וכתבו מה לשנות. בסיום — «שליחה לקלוד».</p>';
      return;
    }
    notes.forEach(function (n, i) {
      try { document.querySelectorAll(n.selector).forEach(function (e) { e.classList.add('mrx-has'); }); } catch (e) {}
      var d = document.createElement('div');
      d.className = 'mrx-item';
      d.innerHTML = '<b>' + esc(n.section) + ' · ' + esc(n.el) + '</b>' +
        '<div class="mrx-note">' + esc(n.note) + '</div>' +
        '<code>' + esc(n.selector) + '</code>' +
        '<button class="mrx-del" type="button">מחיקה</button>';
      d.querySelector('.mrx-del').addEventListener('click', function () {
        notes.splice(i, 1); save();
      });
      list.appendChild(d);
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── בחירה ── */
  function inTool(el) { return !!(el.closest && (el.closest('#mrx') || el.closest('#mrx-pop'))); }

  function onMove(e) {
    if (!picking) return;
    var el = e.target;
    if (!el || inTool(el)) return;
    if (hovered === el) return;
    if (hovered) hovered.classList.remove('mrx-hi');
    hovered = el;
    hovered.classList.add('mrx-hi');
  }

  function onClick(e) {
    if (!picking) return;
    if (inTool(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    openPop(e.target, e.pageX, e.pageY);
  }

  function closePop() { if (pop) { pop.remove(); pop = null; } }

  function openPop(el, x, y) {
    closePop();
    var info = describe(el);
    pop = document.createElement('div');
    pop.id = 'mrx-pop';
    pop.innerHTML = '<b>' + esc(info.section) + ' · ' + esc(info.el) + '</b>' +
      '<textarea placeholder="מה לשנות כאן?"></textarea>' +
      '<div class="row"><button class="ok" type="button">שמירת הערה</button>' +
      '<button class="no" type="button">ביטול</button></div>';
    document.body.appendChild(pop);
    var w = 300;
    pop.style.insetInlineStart = 'auto';
    pop.style.left = Math.max(10, Math.min(x - w / 2, window.innerWidth - w - 10)) + 'px';
    pop.style.top = (y + 14) + 'px';
    var ta = pop.querySelector('textarea');
    ta.focus();
    pop.querySelector('.no').addEventListener('click', closePop);
    pop.querySelector('.ok').addEventListener('click', function () {
      var v = ta.value.trim();
      if (!v) { ta.focus(); return; }
      info.note = v;
      info.ts = new Date().toISOString();
      notes.push(info); save(); closePop();
    });
    ta.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) pop.querySelector('.ok').click();
      if (ev.key === 'Escape') closePop();
    });
  }

  function setPicking(on) {
    picking = on;
    fab.classList.toggle('on', on);
    fab.firstChild.textContent = on ? '● בחרו אלמנט ' : '✎ מצב הערות ';
    if (!on && hovered) { hovered.classList.remove('mrx-hi'); hovered = null; }
    if (!on) closePop();
  }

  /* ── ייצוא ── */
  function toMarkdown() {
    var lines = ['# הערות · דף הנחיתה משיבי רוח',
                 '_' + new Date().toLocaleString('he-IL') + ' · ' + notes.length + ' הערות_', ''];
    var bySec = {};
    notes.forEach(function (n) { (bySec[n.section] = bySec[n.section] || []).push(n); });
    Object.keys(bySec).forEach(function (sec) {
      lines.push('## ' + sec, '');
      bySec[sec].forEach(function (n, i) {
        lines.push((i + 1) + '. **' + n.el + '** — ' + n.note);
        lines.push('   - סלקטור: `' + n.selector + '`');
        if (n.text) lines.push('   - טקסט נוכחי: "' + n.text + '"');
        lines.push('');
      });
    });
    return lines.join('\n');
  }

  fab.addEventListener('click', function () {
    var open = root.classList.toggle('open');
    setPicking(open);
  });
  root.querySelector('.mrx-x').addEventListener('click', function () {
    root.classList.remove('open'); setPicking(false);
  });
  root.querySelector('.mrx-clear').addEventListener('click', function () {
    if (notes.length && confirm('למחוק את כל ההערות?')) { notes = []; save(); }
  });
  root.querySelector('.mrx-copy').addEventListener('click', function () {
    navigator.clipboard.writeText(toMarkdown()).then(function () {
      msg.textContent = 'הועתק ללוח — אפשר להדביק בצ׳אט.';
    }, function () { msg.textContent = 'ההעתקה נכשלה.'; });
  });
  root.querySelector('.mrx-send').addEventListener('click', function () {
    if (!notes.length) { msg.textContent = 'אין הערות לשליחה.'; return; }
    msg.textContent = 'שולח…';
    fetch('/__notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: toMarkdown(), notes: notes })
    }).then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (d) { msg.textContent = 'נשמר בקובץ ' + d.file + ' ✓'; })
      .catch(function () {
        navigator.clipboard.writeText(toMarkdown());
        msg.textContent = 'השרת לא זמין — ההערות הועתקו ללוח במקום.';
      });
  });

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && picking) { root.classList.remove('open'); setPicking(false); }
  });

  render();
})();
