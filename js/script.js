/**
 * JEJAK SEBOTOL — script.js (v2)
 * Tim localhost:3000 | Techno Versary Vol. II
 * Vanilla JavaScript: IntersectionObserver, requestAnimationFrame, localStorage
 * Zero external libraries, zero console errors, fully accessible
 */

'use strict';

/* ═══════════════════════════════════════════════════
   0. HELPERS
═══════════════════════════════════════════════════ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ═══════════════════════════════════════════════════
   1. MARK ACTIVE NAV LINK
═══════════════════════════════════════════════════ */
(function markActiveNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  $$('.nav-links a, nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('active');
    }
  });
})();

/* ═══════════════════════════════════════════════════
   2. NAVBAR: SCROLL SHADOW + MOBILE MENU
═══════════════════════════════════════════════════ */
(function initNavbar() {
  const navbar = $('.navbar');
  if (!navbar) return;

  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('.nav-toggle');
  const links  = $('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    links.classList.toggle('open', !isOpen);
  });

  $$('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    }
  });
})();

/* ═══════════════════════════════════════════════════
   3. SCENE THEME OBSERVER
═══════════════════════════════════════════════════ */
const sceneLabels = {
  'scene-1': 'Di Tangan Kita',
  'scene-2': 'Hanyut ke Sungai',
  'scene-3': 'Tiba di Laut',
  'scene-4': 'Kembali ke Piring Kita',
  'scene-5': 'Kamu Bisa Mengubah Akhir Ceritanya'
};

function updateProgressIndicators(activeScene) {
  const scenes = $$('.scene[data-scene]');
  const idx = scenes.findIndex(s => s === activeScene);
  if (idx === -1) return;

  const labelText = sceneLabels[activeScene.dataset.scene] || '';
  const stepText  = `0${idx + 1} / 0${scenes.length}`;

  // Update counters
  $$('.scene-counter, .pi-counter').forEach(el => {
    el.textContent = stepText;
  });

  // Update stage labels
  $$('.stage-label, #stage-label-text').forEach(el => {
    el.textContent = labelText;
  });

  // Update dots
  $$('.pi-dot, .progress-dot, .stage-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === idx);
  });
}

(function initThemeObserver() {
  const scenes = $$('.scene[data-theme]');
  if (!scenes.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.body.dataset.theme = entry.target.dataset.theme;
        updateProgressIndicators(entry.target);
      }
    });
  }, { threshold: 0.35, rootMargin: '-8% 0px -8% 0px' });

  scenes.forEach(s => observer.observe(s));
})();

/* ═══════════════════════════════════════════════════
   4. FADE-UP ANIMATIONS (IntersectionObserver)
═══════════════════════════════════════════════════ */
(function initFadeUp() {
  const elements = $$('.fade-up');
  if (!elements.length) return;

  if (prefersReducedMotion()) {
    elements.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════
   5. STICKY BOTTLE MORPHING STAGE (cerita.html)
═══════════════════════════════════════════════════ */
(function initStickyStage() {
  const stage = $('.bottle-stage');
  if (!stage) return;

  const illustrations = $$('.stage-illus, .stage-illustration');
  const scenes        = $$('.scene[data-scene]');

  function setSceneIllustration(sceneId) {
    illustrations.forEach(img => {
      const match = img.dataset.for === sceneId;
      if (match) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    });
  }

  if (illustrations.length) {
    setSceneIllustration('scene-1');
  }

  const sceneObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setSceneIllustration(entry.target.dataset.scene);
      }
    });
  }, { threshold: 0.35 });

  scenes.forEach(s => sceneObserver.observe(s));

  // Connect dot click to scroll
  $$('.pi-dot, .progress-dot, .stage-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      if (scenes[i]) {
        scenes[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════
   6. COUNT-UP ANIMATION FOR STATS
═══════════════════════════════════════════════════ */
function countUp(el, target, duration = 1600, suffix = '') {
  if (prefersReducedMotion()) {
    el.textContent = target.toLocaleString('id-ID') + suffix;
    return;
  }

  const start    = performance.now();
  const startVal = 0;

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic bezier ease-out (0.22, 1, 0.36, 1) approximation
    const eased    = 1 - Math.pow(1 - progress, 3.5);
    const current  = Math.round(startVal + (target - startVal) * eased);
    el.textContent = current.toLocaleString('id-ID') + suffix;

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

(function initCountUp() {
  const elements = $$('[data-count]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        countUp(el, target, 1600, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.4 });

  elements.forEach(el => observer.observe(el));
})();

/* ═══════════════════════════════════════════════════
   7. KALKULATOR PLASTIK SEKALI PAKAI (aksi.html)
═══════════════════════════════════════════════════ */
(function initKalkulator() {
  const form = $('#kalkulator');
  if (!form) return;

  const inputs = {
    botol:   $('#inp-botol'),
    kantong: $('#inp-kantong'),
    sedotan: $('#inp-sedotan'),
  };

  const targetState = { current: 50 };
  const resTotal    = $('#res-total');
  const resHemat    = $('#res-hemat');
  const resEqv      = $('#res-eqv');
  const targetBtns  = $$('.target-btn');

  // Steppers
  $$('.stepper').forEach(stepper => {
    const input = stepper.querySelector('.stepper__input');
    const dec   = stepper.querySelector('[data-action="dec"]');
    const inc   = stepper.querySelector('[data-action="inc"]');
    if (!input || !dec || !inc) return;

    dec.addEventListener('click', () => {
      input.value = Math.max(0, (Number(input.value) || 0) - 1);
      // Sync slider if present
      const relatedSlider = $(`input[type="range"][data-for="${input.id.replace('inp-', '')}"]`);
      if (relatedSlider) relatedSlider.value = input.value;
      recalculate();
    });

    inc.addEventListener('click', () => {
      input.value = Math.min(999, (Number(input.value) || 0) + 1);
      const relatedSlider = $(`input[type="range"][data-for="${input.id.replace('inp-', '')}"]`);
      if (relatedSlider) relatedSlider.value = input.value;
      recalculate();
    });

    input.addEventListener('input', () => {
      const relatedSlider = $(`input[type="range"][data-for="${input.id.replace('inp-', '')}"]`);
      if (relatedSlider) relatedSlider.value = input.value;
      recalculate();
    });
  });

  // Range sliders
  $$('input[type="range"][data-for]').forEach(slider => {
    const targetKey = slider.dataset.for;
    const relatedInput = $('#inp-' + targetKey);
    if (!relatedInput) return;

    slider.addEventListener('input', () => {
      relatedInput.value = slider.value;
      recalculate();
    });
  });

  // Target reduction buttons
  targetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      targetBtns.forEach(b => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      targetState.current = Number(btn.dataset.target);
      recalculate();
    });
  });

  function getVal(key) {
    return Math.max(0, Number((inputs[key] && inputs[key].value) || 0));
  }

  function recalculate() {
    const botol   = getVal('botol');
    const kantong = getVal('kantong');
    const sedotan = getVal('sedotan');
    const pct     = targetState.current;

    const totalMingguan = botol + kantong + sedotan;
    const totalTahunan  = totalMingguan * 52;
    const hematTahunan  = Math.round(totalTahunan * (pct / 100));
    // Asumsi kasar tim: botol 15 g, kantong 5 g, sedotan 1 g
    const gramMingguan  = botol * 15 + kantong * 5 + sedotan * 1;
    const beratKg       = (gramMingguan * 52 * (pct / 100) / 1000).toFixed(1);

    if (resTotal) countUp(resTotal, totalTahunan, 600);
    if (resHemat) countUp(resHemat, hematTahunan, 600);
    if (resEqv) {
      if (prefersReducedMotion()) {
        resEqv.textContent = beratKg;
      } else {
        resEqv.textContent = beratKg;
      }
    }
  }

  recalculate();
})();

/* ═══════════════════════════════════════════════════
   8. CHECKLIST 4 AKSI NYATA (localStorage)
═══════════════════════════════════════════════════ */
(function initChecklist() {
  const container = $('#aksi-list');
  if (!container) return;

  const cards       = $$('.action-card', container);
  const barFill     = $('#progress-fill');
  const progressTxt = $('#progress-text');
  const completeMsg = $('#completion-msg');

  const STORAGE_KEY = 'jejak_sebotol_aksi_v2';
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_) {
    saved = [];
  }

  function save() {
    try {
      const state = cards.map(c => c.classList.contains('checked'));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function updateView() {
    const checkedCount = cards.filter(c => c.classList.contains('checked')).length;
    const total        = cards.length;
    const pct          = total ? Math.round((checkedCount / total) * 100) : 0;

    if (barFill) {
      barFill.style.width = pct + '%';
      barFill.setAttribute('aria-valuenow', pct);
    }

    if (progressTxt) {
      progressTxt.textContent = `${checkedCount} dari ${total} aksi sudah kamu pilih`;
    }

    if (completeMsg) {
      completeMsg.style.display = checkedCount === total ? 'block' : 'none';
    }
  }

  function toggle(card) {
    const isChecked = card.classList.contains('checked');
    if (!isChecked) {
      card.classList.add('checked', 'just-checked');
      setTimeout(() => card.classList.remove('just-checked'), 450);
      card.setAttribute('aria-pressed', 'true');
    } else {
      card.classList.remove('checked', 'just-checked');
      card.setAttribute('aria-pressed', 'false');
    }
    save();
    updateView();
  }

  cards.forEach((card, i) => {
    if (saved[i]) {
      card.classList.add('checked');
      card.setAttribute('aria-pressed', 'true');
    } else {
      card.setAttribute('aria-pressed', 'false');
    }

    card.addEventListener('click', () => toggle(card));

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(card);
      }
    });

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
  });

  updateView();
})();

/* ═══════════════════════════════════════════════════
   9. PARTIKEL MIKROPLASTIK CANVAS (Adegan 4)
═══════════════════════════════════════════════════ */
(function initParticleCanvas() {
  const canvas = $('#particle-canvas');
  if (!canvas || prefersReducedMotion()) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let rafId = null;
  let isRunning = false;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x     = Math.random() * canvas.width;
      this.y     = Math.random() * canvas.height;
      this.vx    = (Math.random() - 0.5) * 0.45;
      this.vy    = (Math.random() - 0.5) * 0.45;
      this.r     = Math.random() * 2.2 + 0.8;
      this.life  = Math.random();
      this.color = Math.random() > 0.5 ? '#F1D38A' : '#6FD0E8';
      this.baseAlpha = Math.random() * 0.5 + 0.35;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life += 0.0035;
      if (this.life > 1) this.reset();

      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.baseAlpha * (1 - Math.abs(this.life - 0.5) * 1.8);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    resize();
    particles = Array.from({ length: 50 }, () => new Particle());
    canvas.classList.add('visible');

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      if (isRunning) rafId = requestAnimationFrame(loop);
    }
    loop();
  }

  function stop() {
    isRunning = false;
    canvas.classList.remove('visible');
    if (rafId) cancelAnimationFrame(rafId);
  }

  const scene4 = $('.scene[data-scene="scene-4"]');
  if (scene4) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0.25 });
    observer.observe(scene4);
  }

  window.addEventListener('resize', resize, { passive: true });
})();

/* ═══════════════════════════════════════════════════
   10. CONTACT FORM MAILTO
═══════════════════════════════════════════════════ */
(function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const nama   = ($('#f-nama')   ? $('#f-nama').value   : '').trim();
    const email  = ($('#f-email')  ? $('#f-email').value  : '').trim();
    const subjek = ($('#f-subjek') ? $('#f-subjek').value : '').trim();
    const pesan  = ($('#f-pesan')  ? $('#f-pesan').value  : '').trim();

    const targetEmail = 'localhost3000.team@gmail.com';
    const emailSubject = encodeURIComponent(`[Jejak Sebotol] ${subjek || 'Pesan dari ' + nama}`);
    const emailBody    = encodeURIComponent(
      `Nama: ${nama}\nAlamat Email: ${email}\n\nPesan:\n${pesan}\n\n--\nDikirim melalui Formulir Website Jejak Sebotol`
    );

    window.location.href = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;
  });
})();

/* ═══════════════════════════════════════════════════
   11. PAGE ENTRY FADE-IN
═══════════════════════════════════════════════════ */
(function initPageEntry() {
  if (prefersReducedMotion()) return;
  document.body.classList.add('page-enter');
})();

/* ═══════════════════════════════════════════════════
   12. SALIN KOMITMENKU (aksi.html)
═══════════════════════════════════════════════════ */
(function initCopyCommit() {
  const btn = $('#copy-commit');
  if (!btn) return;
  const status = $('#copy-status');

  function buildText() {
    const picked = $$('#aksi-list .action-card.checked h3').map(h => h.textContent.trim());
    if (!picked.length) return '';
    const lines = picked.map((p, i) => `${i + 1}. ${p}`).join('\n');
    const isWeb = location.protocol.startsWith('http');
    const link = isWeb ? `\nIkuti jejak sebotolnya: ${location.origin}${location.pathname.replace(/[^/]*$/, '')}cerita.html` : '';
    return `Aku berkomitmen mengurangi plastik sekali pakai lewat:\n${lines}\n${link}\n#JejakSebotol`;
  }

  btn.addEventListener('click', async () => {
    const text = buildText();
    if (!text) { status.textContent = 'Pilih minimal satu aksi dulu ya.'; return; }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Tersalin! Tempel di media sosialmu.';
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (__) {}
      ta.remove();
      status.textContent = ok ? 'Tersalin! Tempel di media sosialmu.' : 'Salin manual:\n' + text;
    }
  });
})();
