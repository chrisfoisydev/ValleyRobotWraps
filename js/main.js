// Valley Robot Wraps — site interactions

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const siteNav = document.getElementById('site-nav');

navToggle.addEventListener('click', () => {
  const open = siteNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

// Close mobile nav when a link is chosen
siteNav.addEventListener('click', (e) => {
  if (e.target.matches('a')) {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// Reveal-on-scroll animation
const revealTargets = document.querySelectorAll(
  '.card, .step, .platform, .price-card, .quote-card, .faq-list details, .split-copy, .split-art'
);
revealTargets.forEach((el) => el.classList.add('reveal'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
revealTargets.forEach((el) => observer.observe(el));

// Quote form (demo handler — no backend wired up yet)
const form = document.getElementById('quote-form');
const status = document.getElementById('form-status');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  status.classList.remove('ok', 'err');

  if (!form.checkValidity()) {
    status.textContent = 'Please fill in your name, email, platform, and fleet size.';
    status.classList.add('err');
    form.reportValidity();
    return;
  }

  const name = form.elements.name.value.trim().split(' ')[0] || 'there';
  status.textContent = `Thanks, ${name}! Your fleet quote request is in — we'll reply within one business day.`;
  status.classList.add('ok');
  form.reset();
});
