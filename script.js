// script.js — interactive behavior for static portfolio
document.addEventListener('DOMContentLoaded',function(){
  // PRELOADER
  const pre = document.getElementById('preloader');
  if(pre){
    setTimeout(()=>{ pre.style.opacity=0; pre.style.pointerEvents='none'; pre.setAttribute('aria-hidden','true'); setTimeout(()=>{ if(pre && pre.parentNode) pre.parentNode.removeChild(pre); },700); },900);
  }

  // CURSOR-GRADIENT follow
const cg = document.getElementById('cursor-gradient');
let mouse = {x: innerWidth/2, y: innerHeight/2}, pos={x:mouse.x,y:mouse.y};
window.addEventListener('mousemove', e=> (mouse={x:e.clientX,y:e.clientY}));
function lerp(a,b,t){return a+(b-a)*t;}
function anim(){ pos.x=lerp(pos.x,mouse.x,0.14); pos.y=lerp(pos.y,mouse.y,0.14);
 cg.style.background = `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, rgba(78,161,255,0.14), transparent 25%), radial-gradient(120px circle at ${pos.x+100}px ${pos.y-80}px, rgba(79,246,255,0.08), transparent 20%)`;
 requestAnimationFrame(anim); }
requestAnimationFrame(anim);


  // side social "stick" when contact visible
const side = document.getElementById('side-social');
const contact = document.getElementById('contact');

if (side && contact && 'IntersectionObserver' in window) {

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {

      if (entry.isIntersecting) {
        // Sayfa contact bölümüne geldiyse:
        side.classList.add('stuck');

        // 300ms sonra küçülme efekti ver
        setTimeout(() => {
          side.classList.add('minimized');
        }, 300);

      } else {
        // Yukarı çıkınca geri eski yerine dön
        side.classList.remove('stuck');
        side.classList.remove('minimized');
      }

    });
  }, { root: null, threshold: 0.15 });

  obs.observe(contact);
}


// Hover’da büyümesi
side.addEventListener("mouseenter", () => {
  side.classList.remove("minimized");
});
side.addEventListener("mouseleave", () => {
  if (side.classList.contains("stuck")) {
    side.classList.add("minimized");
  }
});


  // project hover => reveal code sample
  document.querySelectorAll('.project').forEach(p=>{
    p.addEventListener('mouseenter',()=>{
      const cs=p.querySelector('.code-sample');
      if(cs) cs.style.display='block';
    });
    p.addEventListener('mouseleave',()=>{
      const cs=p.querySelector('.code-sample');
      if(cs) cs.style.display='none';
    });
  });

  // theme toggle
  const themeBtn = document.getElementById('theme-toggle');
const applyLightTheme = ()=>{
  document.body.classList.add('light-mode');
  document.body.classList.remove('dark');
  themeBtn.textContent = '☀️';
  themeBtn.setAttribute('aria-pressed','false');
  localStorage.setItem('theme','light');
};

const applyDarkTheme = ()=>{
  document.body.classList.remove('light-mode');
  document.body.classList.add('dark');
  themeBtn.textContent = '🌙';
  themeBtn.setAttribute('aria-pressed','true');
  localStorage.setItem('theme','dark');
};

  if(themeBtn){
    // init from localStorage
    const saved = localStorage.getItem('theme') || 'dark';
    if(saved==='light') applyLightTheme(); else applyDarkTheme();

    themeBtn.addEventListener('click', ()=>{
      if(document.body.classList.contains('dark')) { applyLightTheme(); localStorage.setItem('theme','light'); }
      else { applyDarkTheme(); localStorage.setItem('theme','dark'); }
    });
  }

  // language toggle TR <-> EN (simple JSON)
  const langBtn = document.getElementById('lang-toggle');
  const strings = {
    en:{about_title:'About', about_text:'I am Taha Fere, a Computer Programming graduate. I like teamwork and problem solving. My focus is backend development with Python and FastAPI.'},
    tr:{about_title:'Hakkımda', about_text:'Ben Taha FERE, Bilgisayar Programcılığı mezunuyum. Takım çalışmasını ve problem çözmeyi severim. Yazılımda kendimi geliştirip güzel işler yapmayı hedefliyorum.'}
  };
  let lang = localStorage.getItem('lang') || 'tr';
  const applyLang = (lng)=>{
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const key = el.getAttribute('data-i18n');
      if(strings[lng] && strings[lng][key]) el.textContent = strings[lng][key];
    });
    langBtn.textContent = (lng==='tr') ? 'EN' : 'TR';
    langBtn.setAttribute('aria-pressed', (lng==='tr') ? 'false' : 'true');
    localStorage.setItem('lang', lng);
  };
  if(langBtn){ applyLang(lang); langBtn.addEventListener('click', ()=>{ lang = (lang==='tr') ? 'en' : 'tr'; applyLang(lang); }); }

  // set copyright year
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // smooth scroll for internal anchors (if you add more)
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click', (e)=>{
      const target = document.querySelector(a.getAttribute('href'));
      if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth'}); }
    });
  });
  cg.style.background = `
  radial-gradient(
    600px circle at ${x}px ${y}px,
    rgba(78, 161, 255, 0.18),
    rgba(79, 246, 255, 0.15),
    transparent
  )`;

});
