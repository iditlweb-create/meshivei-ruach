(() => {
  const sections = [...document.querySelectorAll('.sketch')];
  const small = matchMedia('(max-width: 767.98px), (prefers-reduced-motion: reduce)');
  const images = [];
  let ready = false;
  let ticking = false;
  const pad = n => String(n).padStart(4, '0');

  function draw(section, index) {
    const canvas = section.querySelector('canvas');
    const image = images[index];
    if (!canvas || !image?.naturalWidth) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
    canvas.getContext('2d', {alpha:false}).drawImage(image, (w-dw)/2, (h-dh)/2, dw, dh);
    section.classList.add('ready');
  }

  function update() {
    ticking = false;
    if (small.matches) return;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      const range = section.offsetHeight - innerHeight;
      const p = Math.max(0, Math.min(1, range > 0 ? -rect.top / range : 0));
      section.style.setProperty('--p', p.toFixed(3));
      section.querySelector('.sticky')?.style.setProperty('--p', p.toFixed(3));
      if (rect.bottom > 0 && rect.top < innerHeight && ready) draw(section, Math.round(p * 71));
      section.querySelector('.intro-note')?.classList.toggle('is-visible', p >= .025);
      section.querySelectorAll('.people-points li, .page-stack li, .question-cloud li').forEach((li,i) => li.classList.toggle('shown', p >= .30 + i * .14));
      const notes = [...section.querySelectorAll('.thought-notes li')];
      if (notes.length) {
        const active = p < .1 ? -1 : Math.min(3, Math.floor((p - .1) / .225));
        notes.forEach((note,i) => note.classList.toggle('is-active', i === active));
      }
    }
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function preload() {
    if (small.matches || ready || images.length) return;
    let done = 0;
    for (let i=0; i<72; i++) {
      const img = new Image(); images.push(img);
      img.onload = img.onerror = () => { if (++done === 72) { ready = true; schedule(); } };
      img.src = `frames/v2/${pad(i+1)}.jpg`;
    }
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule, {passive:true});
  small.addEventListener?.('change', () => { preload(); schedule(); });
  preload(); schedule();
})();
