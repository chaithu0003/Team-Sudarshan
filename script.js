/* Main interactive behaviours for SkillsPassport.
   - Theme toggle, preloader, counters, ticker, accordion, modal and more.
   - Features intentionally use vanilla JS with accessibility considerations.
*/

/* -------------------------
   Helper utilities
   ------------------------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

/* Toast helper */
function showToast(message, timeout=3000){
    const container = $('#toast-container');
    if(!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = message;
    container.appendChild(t);
    setTimeout(()=> t.classList.add('visible'), 20);
    setTimeout(()=> {
        t.remove();
    }, timeout + 200);
}

/* -------------------------
   PRELOADER & DOM READY
   ------------------------- */
window.addEventListener('load', () => {
    const pre = $('#preloader');
    if(pre) pre.classList.add('hidden');
    // start counters, reveal
    initCounters();
    revealOnLoad();
});

/* -------------------------
   THEME TOGGLE (persisted)
   ------------------------- */
const themeToggle = $('#themeToggle');
function applyTheme(theme){
    document.documentElement.setAttribute('data-theme', theme);
    if(themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark');
}
(function initTheme(){
    const saved = localStorage.getItem('sp-theme');
    if(saved){
        applyTheme(saved);
    }else{
        // follow system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }
})();
if(themeToggle){
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('sp-theme', next);
        showToast(`${next[0].toUpperCase()+next.slice(1)} theme enabled`);
    });
}

/* -------------------------
   SCROLL PROGRESS
   ------------------------- */
const progress = document.querySelector('.scroll-progress');
window.addEventListener('scroll', () => {
    const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    if(progress) progress.style.width = Math.min(100, scrolled) + '%';
});

/* -------------------------
   CRYPTO TICKER - duplicate content for smooth loop
   ------------------------- */
(function initTicker(){
    const track = document.getElementById('tickerTrack');
    if(!track) return;
    // duplicate children to create continuous loop for CSS keyframe
    track.innerHTML += track.innerHTML;
})();

/* -------------------------
   TYPEWRITER (simple)
   ------------------------- */
(function typewriterInit(){
    const el = document.querySelector('.typewriter');
    if(!el) return;
    const words = JSON.parse(el.getAttribute('data-text') || '[]');
    let i=0, pos=0, forward=true;
    const speed = 90;
    function tick(){
        const word = words[i % words.length] || '';
        if(forward){
            pos++;
            if(pos >= word.length){ forward = false; setTimeout(tick, 900); return; }
        } else {
            pos--;
            if(pos <= 0){ forward = true; i++; }
        }
        el.textContent = word.slice(0, pos);
        setTimeout(tick, speed);
    }
    tick();
})();

/* -------------------------
   COUNTERS
   ------------------------- */
function animateValue(el, start, end, duration=1800){
    let startTime = null;
    const step = (timestamp) => {
        if(!startTime) startTime = timestamp;
        const progress = Math.min((timestamp-startTime)/duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        el.textContent = (end >= 100 && el.dataset.percent === 'true') ? `${value}%` : value;
        if(progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}
function initCounters(){
    $$('.stat-item').forEach(item => {
        const target = parseInt(item.dataset.target || '0', 10);
        const display = item.querySelector('h3');
        if(display){
            animateValue(display, 0, target, 1600);
        }
    });
}

/* -------------------------
   REVEAL ON SCROLL
   ------------------------- */
function revealOnLoad(){
    const observer = new IntersectionObserver((entries)=>{
        entries.forEach(e=>{
            if(e.isIntersecting){
                e.target.classList.add('visible');
                // if element is stat counters, start counters
                if(e.target.matches('.stat-item')) {
                    const h = e.target.querySelector('h3');
                    if(h && !h.dataset.animated){
                        animateValue(h, 0, parseInt(e.target.dataset.target||0), 1600);
                        h.dataset.animated = '1';
                    }
                }
            }
        });
    }, {threshold: 0.15});
    $$('.fade-in').forEach(el => observer.observe(el));
}

/* -------------------------
   MOBILE MENU
   ------------------------- */
const mobileToggle = $('#mobileToggle');
const mobileNav = $('#mobileNav');
if(mobileToggle && mobileNav){
    mobileToggle.addEventListener('click', ()=>{
        const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!expanded));
        mobileNav.setAttribute('aria-hidden', String(expanded));
    });
}

/* -------------------------
   ACCORDION
   ------------------------- */
$$('.accordion-item').forEach(item=>{
    const header = item.querySelector('.accordion-header');
    const body = item.querySelector('.accordion-body');
    if(!header || !body) return;
    header.addEventListener('click', ()=>{
        const isActive = item.classList.toggle('active');
        header.setAttribute('aria-expanded', isActive ? 'true' : 'false');
    });
});

/* -------------------------
   BACK TO TOP
   ------------------------- */
const backBtn = document.querySelector('.back-to-top');
window.addEventListener('scroll', ()=>{
    if(!backBtn) return;
    if(window.scrollY > 400) backBtn.classList.add('active');
    else backBtn.classList.remove('active');
});

/* -------------------------
   WALLET CONNECT (SIM)
   ------------------------- */
const connectBtn = $('#connectWalletBtn');
const walletModal = $('#walletModal');
const modalClose = walletModal ? walletModal.querySelector('.modal-close') : null;
if(connectBtn){
    connectBtn.addEventListener('click', ()=>{
        // open modal
        if(walletModal){
            walletModal.setAttribute('aria-hidden','false');
            walletModal.style.display = 'flex';
            // trap focus
            walletModal.querySelector('.wallet-btn').focus();
        }
    });
}
if(modalClose){
    modalClose.addEventListener('click', ()=> {
        walletModal.setAttribute('aria-hidden','true');
        walletModal.style.display = 'none';
    });
}
$$('.wallet-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
        const wallet = e.currentTarget.dataset.wallet;
        // simulate connect
        const fakeAccount = wallet === 'phantom' ? 'Phantom: 0xDEAD...BEAF' : '0x' + Math.random().toString(16).slice(2,10).toUpperCase();
        connectBtn.textContent = `${wallet[0].toUpperCase()+wallet.slice(1)} • ${fakeAccount}`;
        connectBtn.classList.remove('btn-primary');
        showToast(`Connected with ${wallet}`);
        // close modal
        if(walletModal){ walletModal.setAttribute('aria-hidden','true'); walletModal.style.display='none' }
    });
});

/* -------------------------
   NETWORK SWITCH
   ------------------------- */
const networkSwitch = $('#networkSwitch');
if(networkSwitch){
    networkSwitch.addEventListener('change', (e)=>{
        const net = e.target.value;
        showToast(`Switched network to ${net.toUpperCase()}`);
    });
}

/* -------------------------
   COPY CREDENTIAL ID (search)
   ------------------------- */
const copyBtn = $('#copySearchBtn');
const searchInput = $('#credentialSearch');
if(copyBtn && searchInput){
    copyBtn.addEventListener('click', async ()=>{
        try{
            const text = searchInput.value || generateShortId();
            await navigator.clipboard.writeText(text);
            showToast('Credential ID copied to clipboard');
        }catch(err){
            showToast('Copy failed');
        }
    });
}

/* Simple test credential generator */
function generateShortId(){
    return 'SP-' + Math.random().toString(36).slice(2,10).toUpperCase();
}

/* -------------------------
   NEWSLETTER FORM
   ------------------------- */
const newsletter = $('#newsletterForm');
if(newsletter){
    newsletter.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = $('#newsletterEmail').value.trim();
        if(!email || !email.includes('@')) {
            showToast('Enter a valid email');
            return;
        }
        // simulate submit
        showToast('Subscribed — check your inbox (demo)');
        newsletter.reset();
    });
}

/* -------------------------
   COOKIE CONSENT
   ------------------------- */
const cookieBar = $('#cookieBar');
const acceptCookies = $('#acceptCookies');
(function initCookie(){
    const accepted = localStorage.getItem('sp-cookies');
    if(!accepted){
        if(cookieBar){ cookieBar.setAttribute('aria-hidden','false') }
    }
})();
if(acceptCookies){
    acceptCookies.addEventListener('click', ()=>{
        localStorage.setItem('sp-cookies','1');
        if(cookieBar) cookieBar.setAttribute('aria-hidden','true');
        showToast('Cookies accepted');
    });
}

/* -------------------------
   Keyboard shortcuts
   ------------------------- */
window.addEventListener('keydown', (e)=>{
    if(e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){
        e.preventDefault();
        const f = $('#credentialSearch');
        if(f){ f.focus(); f.select(); showToast('Search focused'); }
    }
    if(e.key === 'Escape'){
        // close modal if open
        if(walletModal && walletModal.getAttribute('aria-hidden') === 'false'){
            walletModal.setAttribute('aria-hidden','true');
            walletModal.style.display='none';
        }
    }
});

/* -------------------------
   Reveal animations using IntersectionObserver for lazy loads
   ------------------------- */
(function initLazyReveal(){
    const elems = [...document.querySelectorAll('img[data-src], .fade-in')];
    if(!elems.length) return;
    const obs = new IntersectionObserver((entries, o)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){
                const t = entry.target;
                t.classList.add('visible');
                // lazy-load images
                if(t.tagName === 'IMG' && t.dataset.src){
                    t.src = t.dataset.src; t.removeAttribute('data-src'); 
                    t.onload = ()=> t.classList.add('loaded');
                }
                o.unobserve(t);
            }
        });
    }, {threshold: 0.12});
    elems.forEach(el => obs.observe(el));
})();

/* -------------------------
   Feature filter
   ------------------------- */
const featureFilter = $('#featureFilter');
if(featureFilter){
    featureFilter.addEventListener('change', (e)=>{
        const v = e.target.value;
        $$('#featureGrid .feature-card').forEach(card=>{
            if(v === 'all' || card.dataset.type === v) card.style.display = '';
            else card.style.display = 'none';
        });
    });
}

/* -------------------------
   Service worker registration stub for PWA (safe)
   ------------------------- */
if('serviceWorker' in navigator){
    navigator.serviceWorker && navigator.serviceWorker.register('/sw.js').catch(()=>{/* ignore in demo */});
}

/* -------------------------
   Small progressive UX: make links smooth
   ------------------------- */
document.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href^="#"]');
    if(a){
        const href = a.getAttribute('href');
        if(href.length > 1){
            e.preventDefault();
            const target = document.querySelector(href);
            if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
        }
    }
});

/* -------------------------
   Extra: mint-counter demo (visual demo)
   ------------------------- */
(function mintDemo(){
    // if you want to show dynamic numbers on ticker or elsewhere, you can update DOM periodically
    const tSpan = document.createElement('span');
    tSpan.textContent = `🚀 Credentials Minted: ${Math.floor(200 + Math.random()*1000)}`;
    // append to ticker for small dynamic feeling
    const ticker = document.getElementById('tickerTrack');
    if(ticker) ticker.appendChild(tSpan);
})();

/* End of script.js */
// skills-progress.js
(function () {
  // Respect reduced motion preference
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    // If reduced motion, just set final widths immediately
    document.querySelectorAll('.progress-fill').forEach(el => {
      const w = el.dataset.width || '0%';
      el.style.width = w;
    });
    return;
  }

  // Helper: parse "75%" -> 75 (number)
  function parsePercent(p) {
    if (!p) return 0;
    return Number(String(p).trim().replace('%', '')) || 0;
  }

  // Animate number counter from 0 -> target over duration (ms)
  function animateNumber(el, target, duration) {
    const start = 0;
    const startTime = performance.now();
    const step = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const value = Math.round(start + (target - start) * eased);
      el.textContent = value + '%';
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Animate bar width from 0 -> target over duration (ms)
  function animateBar(el, targetPercent, duration) {
    const target = Math.max(0, Math.min(100, targetPercent));
    el.style.width = '0%';
    const startTime = performance.now();
    const step = (time) => {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.style.width = (target * eased) + '%';
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // When an element comes into view, animate it once
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const container = entry.target;
      const bar = container.querySelector('.progress-fill');
      // find the percent label sibling if exists: .skill-info span:last-child
      const info = container.previousElementSibling; // .skill-info was above .progress-bg
      const percentLabel = info && info.querySelector('span:last-child');

      if (bar) {
        const dataWidth = bar.dataset.width || '0%';
        const pct = parsePercent(dataWidth);
        // duration proportional to percent but clamped 600-1200ms
        const duration = Math.max(600, Math.min(1200, pct * 12));
        animateBar(bar, pct, duration);
        if (percentLabel) {
          animateNumber(percentLabel, pct, duration);
        }
      }

      // stop observing this container (animate only once)
      obs.unobserve(container);
    });
  }, { threshold: 0.25 });

  // Attach observer to each .progress-bg (or to .progress-fill parent)
  document.querySelectorAll('.progress-bg').forEach(bg => {
    // initialize label to 0% to show counting
    const info = bg.previousElementSibling;
    const percentLabel = info && info.querySelector('span:last-child');
    if (percentLabel) percentLabel.textContent = '0%';
    // ensure fill starts at 0
    const fill = bg.querySelector('.progress-fill');
    if (fill) fill.style.width = '0%';
    observer.observe(bg);
  });

})();
