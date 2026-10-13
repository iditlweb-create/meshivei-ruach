(() => {
  const section = document.querySelector('.problem-sketch');
  const sticky = document.querySelector('.problem-sketch__sticky');
  const canvas = document.querySelector('.problem-film');
  const person = document.querySelector('.problem-person');
  const pairs = [...document.querySelectorAll('.question-pair')];
  const progress = [...document.querySelectorAll('.problem-progress i')];
  const small = matchMedia('(max-width: 767.98px), (prefers-reduced-motion: reduce)');
  const frames = [];
  let ready = false;
  let ticking = false;
  const pad = n => String(n).padStart(4, '0');

  function draw(index) {
    const image = frames[index];
    if (!image?.naturalWidth) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const scale = Math.max(w / image.naturalWidth, h / image.naturalHeight);
    const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
    canvas.getContext('2d', {alpha:false}).drawImage(image,(w-dw)/2,(h-dh)/2,dw,dh);
    sticky.classList.add('is-ready');
  }

  function update() {
    ticking = false;
    if (small.matches) return;
    const rect = section.getBoundingClientRect();
    const range = section.offsetHeight - innerHeight;
    const p = Math.max(0,Math.min(1,range > 0 ? -rect.top / range : 0));
    sticky.style.setProperty('--p',p.toFixed(3));
    person.classList.toggle('is-entered',p >= .035);
    const phase = p < .15 ? -1 : p < .56 ? 0 : 1;
    pairs.forEach((pair,i) => {
      pair.classList.toggle('is-active',i === phase);
      pair.classList.toggle('is-staged',phase === 0 && i === 1);
      pair.classList.toggle('is-dropping',phase === 1 && i === 0);
    });
    progress.forEach((line,i) => line.classList.toggle('is-on',i === phase));
    if (ready) draw(Math.round(p * 36));
  }

  function schedule(){if(!ticking){ticking=true;requestAnimationFrame(update)}}
  function preload(){
    if(small.matches||frames.length)return;
    let done=0;
    for(let i=36;i<=72;i++){
      const image=new Image();frames.push(image);
      image.onload=image.onerror=()=>{if(++done===37){ready=true;schedule()}};
      image.src=`frames/hero/${pad(i)}.jpg`;
    }
  }
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule,{passive:true});
  small.addEventListener?.('change',()=>{preload();schedule()});
  preload();schedule();
})();
