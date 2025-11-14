/* ---------- Mobile nav toggle ---------- */
const mobileToggle = document.getElementById('mobileToggle');
const mobileNav = document.getElementById('mobileNav');
mobileToggle && mobileToggle.addEventListener('click', () => {
  const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
  mobileToggle.setAttribute('aria-expanded', String(!expanded));
  mobileNav.style.display = expanded ? 'none' : 'block';
  mobileNav.setAttribute('aria-hidden', String(expanded));
});

// Close mobile nav on link click
document.querySelectorAll('.mobile-link').forEach(a => a.addEventListener('click', () => {
  mobileNav.style.display = 'none';
  mobileToggle.setAttribute('aria-expanded','false');
}));

/* ---------- Section reveal & active nav ---------- */
const navLinks = document.querySelectorAll('.nav-link');

// remove active class from all links
function clearActive() {
  navLinks.forEach(a => a.classList.remove('active'));
}

// when clicking nav links
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    clearActive();
    link.classList.add('active');
  });
});

// helper for top buttons
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

// attach click handlers to desktop nav (close mobile if open)
document.querySelectorAll('nav.desktop a').forEach(a => {
  a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if(href && href.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      scrollToSection(id);
      // close mobile nav if visible
      mobileNav.style.display = 'none';
      mobileToggle && mobileToggle.setAttribute('aria-expanded','false');
    }
  });
});

/* ---------- FAQ accordion (accessible) ---------- */
document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.faq-item');
    const open = parent.classList.contains('faq-open');
    // close all
    document.querySelectorAll('.faq-item').forEach(it => {
      it.classList.remove('faq-open');
      it.querySelector('.faq-btn').setAttribute('aria-expanded','false');
      it.querySelector('.faq-panel').style.maxHeight = null;
    });
    if(!open){
      parent.classList.add('faq-open');
      btn.setAttribute('aria-expanded','true');
      const panel = parent.querySelector('.faq-panel');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});

/* ---------- Contact form: client-side validation + fake send ---------- */
const form = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

function showToast(msg, time = 3000){
  const root = document.getElementById('toastRoot');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(()=> t.remove(), time);
}

if(form){
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.textContent = '';
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    if(!name){ feedback.textContent = 'Please enter your name.'; return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ feedback.textContent = 'Please enter a valid email.'; return; }
    if(message.length < 8){ feedback.textContent = 'Message is too short.'; return; }

    // simulate sending...
    const submitBtn = form.querySelector('button[type="submit"]');
    const old = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.textContent = old;
      submitBtn.disabled = false;
      form.reset();
      feedback.textContent = '';
      showToast('Message sent — we will get back to you shortly!');
    }, 900); // simulate network
  });
}

/* ---------- Small accessibility helpers ---------- */
window.addEventListener('load', () => {
  document.querySelectorAll('.faq-item').forEach(it => {
    if(it.classList.contains('faq-open')){
      const p = it.querySelector('.faq-panel');
      p.style.maxHeight = p.scrollHeight + 'px';
    }
  });
});

// Keyboard support for mobile toggle (Enter/Space)
mobileToggle && mobileToggle.addEventListener('keydown', (ev) => {
  if(ev.key === 'Enter' || ev.key === ' ') mobileToggle.click();
});
