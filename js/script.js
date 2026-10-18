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

// ── Formulario de reserva (solo en la página principal) ──
const reserveForm = document.getElementById('reserveForm');
if (reserveForm) {
  // ── Fecha mínima: hoy (fecha local, no UTC) ──
  const dateInput = document.getElementById('date');
  const now = new Date();
  dateInput.min = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');

  // ── Formulario de reserva: envío real a reservierung.php ──
  const formError = document.getElementById('formError');
  reserveForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    formError.hidden = true;
    const required = this.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      const empty = !field.value.trim() || (field.type === 'email' && !field.checkValidity());
      field.style.borderColor = empty ? '#A12622' : '';
      field.setAttribute('aria-invalid', String(empty));
      if (empty) valid = false;
    });
    if (!valid) {
      this.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const button = this.querySelector('.form-submit');
    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Wird gesendet …';
    let ok = false;
    try {
      const res = await fetch(this.action, { method: 'POST', body: new FormData(this), headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      ok = res.ok && data.ok === true;
    } catch (err) {
      ok = false;
    }
    button.disabled = false;
    button.textContent = label;

    if (!ok) {
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const wrapper = document.getElementById('reserveFormWrapper');
    wrapper.querySelectorAll('.form-title, .form-subtitle').forEach(el => el.style.display = 'none');
    this.style.display = 'none';
    const success = document.getElementById('formSuccess');
    success.style.display = 'block';
    success.setAttribute('tabindex', '-1');
    success.focus();
  });
}

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
