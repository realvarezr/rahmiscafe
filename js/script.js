// ================================================
// Rahmi's Café & Lounge – Script principal
// ================================================

// ── Hero: fondo con fotos y transición en barrido difuminado (izquierda → derecha) ──
const heroLayers = document.querySelectorAll('.hero-bg-layer');
if (heroLayers.length > 1) {
  let heroCurrent = 0;
  let heroZ = 1;
  const HERO_FEATHER = 16;   // ancho de la franja difuminada, en % del contenedor
  const HERO_DURATION = 1400; // duración del barrido, ms

  function setHeroMask(layer, edge) {
    const blackEnd = edge - HERO_FEATHER;
    const transStart = edge + HERO_FEATHER;
    const mask = `linear-gradient(to right, black 0%, black ${blackEnd}%, transparent ${transStart}%, transparent 100%)`;
    layer.style.maskImage = mask;
    layer.style.webkitMaskImage = mask;
  }

  function revealHeroLayer(layer) {
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / HERO_DURATION, 1);
      const edge = -HERO_FEATHER + p * (100 + 2 * HERO_FEATHER);
      setHeroMask(layer, edge);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  setInterval(() => {
    const next = (heroCurrent + 1) % heroLayers.length;
    const layer = heroLayers[next];
    heroZ++;
    layer.style.zIndex = heroZ;
    setHeroMask(layer, -HERO_FEATHER); // estado inicial: totalmente oculta
    revealHeroLayer(layer);
    heroCurrent = next;
  }, 5000);
}

// ── Scroll reveal ──
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 70);
      obs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// ── Fecha mínima: hoy ──
const dateInput = document.getElementById('date');
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;

// ── Bloquear lunes (fix zona horaria: fecha local, no UTC) ──
dateInput.addEventListener('input', function() {
  const [y, m, d] = this.value.split('-').map(Number);
  const selected = new Date(y, m - 1, d);
  if (selected.getDay() === 1) {
    this.value = '';
    this.setCustomValidity('Montag ist unser Ruhetag. Bitte einen anderen Tag wählen.');
  } else {
    this.setCustomValidity('');
  }
});

// ── Formulario de reserva ──
document.getElementById('reserveForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const required = this.querySelectorAll('[required]');
  let valid = true;
  required.forEach(field => {
    if (!field.value.trim()) {
      field.style.borderColor = '#c0392b';
      valid = false;
    } else {
      field.style.borderColor = '';
    }
  });
  if (!valid) return;

  const wrapper = document.getElementById('reserveFormWrapper');
  wrapper.querySelectorAll('.form-title, .form-subtitle').forEach(el => el.style.display = 'none');
  this.style.display = 'none';
  document.getElementById('formSuccess').style.display = 'block';
});

// ── Menú hamburguesa (móvil) ──
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
hamburger.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  hamburger.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});

// ── Scrollspy: resaltar sección activa en el nav ──
const spySections = document.querySelectorAll('section[id]');
const navAnchors  = document.querySelectorAll('.nav-links a[href^="#"]');
const onScroll = () => {
  let current = '';
  spySections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });
  navAnchors.forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === '#' + current);
  });
};
window.addEventListener('scroll', onScroll, { passive: true });

// ── Scroll to top ──
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 450);
}, { passive: true });
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
