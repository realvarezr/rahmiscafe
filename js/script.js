// ================================================
// Rahmi's Café & Lounge – Script principal
// ================================================

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

// ── Scrollspy: resaltar en el nav la sección visible (IntersectionObserver) ──
// Una sección cuenta como visible cuando cruza la franja central de la pantalla.
const navAnchors = document.querySelectorAll('.nav-links a[href^="#"], .nav-mobile a[href^="#"]');
const spyIds = new Set([...navAnchors].map(a => a.getAttribute('href').slice(1)));
const spyVisible = new Set();
const setActiveNav = () => {
  // Si hay dos secciones en la franja, gana la que está más abajo en el documento
  const sections = [...spyVisible].map(id => document.getElementById(id));
  sections.sort((a, b) => a.offsetTop - b.offsetTop);
  const current = sections.length ? sections[sections.length - 1].id : '';
  navAnchors.forEach(a => {
    const isActive = a.getAttribute('href') === '#' + current;
    a.classList.toggle('active', isActive);
    if (isActive) a.setAttribute('aria-current', 'location');
    else a.removeAttribute('aria-current');
  });
};
const spyObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) spyVisible.add(e.target.id);
    else spyVisible.delete(e.target.id);
  });
  setActiveNav();
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(sec => {
  if (spyIds.has(sec.id)) spyObs.observe(sec);
});

// ── Scroll to top ──
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  scrollTopBtn.classList.toggle('visible', window.scrollY > 450);
}, { passive: true });
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
