(() => {
  /* =========================
     Helpers
  ========================= */
  const navLinks = Array.from(document.querySelectorAll('a.nav-link'));

  function clearActive() {
    navLinks.forEach(a => a.classList.remove('active'));
  }

  function addActiveWhere(predicate) {
    clearActive();
    navLinks.forEach(a => {
      if (predicate(a)) a.classList.add('active');
    });
  }

  function fileFromPath(pathname) {
    const f = (pathname || '').split('/').pop();
    return f && f.length ? f : 'index.html';
  }

  function currentFile() {
    return fileFromPath(window.location.pathname);
  }

  // returns { file, id } where id is section id (no #)
  function parseLink(a) {
    const href = (a.getAttribute('href') || '').trim();
    if (!href) return { file: '', id: '' };

    // "#contact" style (same page)
    if (href.startsWith('#')) {
      return { file: currentFile(), id: href.slice(1) };
    }

    try {
      const u = new URL(href, window.location.href);
      return { file: fileFromPath(u.pathname), id: (u.hash || '').replace('#', '') };
    } catch {
      return { file: '', id: '' };
    }
  }

  function headerOffset() {
    // If your header is fixed/sticky and tall, this protects active logic
    const header = document.querySelector('header');
    if (!header) return 90;
    const h = Math.round(header.getBoundingClientRect().height);
    return Math.max(70, Math.min(h + 10, 160));
  }

  /* =========================
     Mobile nav toggle
  ========================= */
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileNav = document.getElementById('mobileNav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!expanded));
      mobileNav.style.display = expanded ? 'none' : 'block';
      mobileNav.setAttribute('aria-hidden', String(expanded));
    });

    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.style.display = 'none';
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileNav.setAttribute('aria-hidden', 'true');
      });
    });

    mobileToggle.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') mobileToggle.click();
    });
  }

  /* =========================
     Page active fallback
     (used when you're above the first spied section)
  ========================= */
  function setActiveByPageOnly() {
    const file = currentFile();

    // Prefer exact page links (same file), ignoring hash
    addActiveWhere(a => {
      const info = parseLink(a);
      return info.file === file && !info.id;
    });

    // If no "plain" link exists (rare), allow hash links to same file
    if (!document.querySelector('a.nav-link.active')) {
      addActiveWhere(a => parseLink(a).file === file);
    }

    // If still nothing and we're on index, activate the Home link
    if (!document.querySelector('a.nav-link.active') && file === 'index.html') {
      addActiveWhere(a => {
        const href = (a.getAttribute('href') || '').trim();
        return href === 'index.html' || href === 'index.html#home' || href === '#home';
      });
    }
  }

  /* =========================
     Scroll Spy (ALL pages)
     - Only spies IDs that exist on THIS page
     - Activates the nav link that points to that ID
  ========================= */
  let spyTargets = []; // { id, top, links[] }

  function rebuildSpyTargets() {
    const map = new Map(); // id -> array of <a>

    navLinks.forEach(a => {
      const info = parseLink(a);
      if (!info.id) return;

      // Only spy if that element exists on THIS page
      const el = document.getElementById(info.id);
      if (!el) return;

      if (!map.has(info.id)) map.set(info.id, []);
      map.get(info.id).push(a);
    });

    spyTargets = [];
    const y = window.scrollY || window.pageYOffset || 0;

    map.forEach((links, id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const top = rect.top + y;

      spyTargets.push({ id, top, links });
    });

    // Sort by top position
    spyTargets.sort((a, b) => a.top - b.top);
  }

  function activateSpyId(id) {
    clearActive();
    navLinks.forEach(a => {
      const info = parseLink(a);
      if (info.id === id) a.classList.add('active');
    });
  }

  function runScrollSpy() {
    if (!spyTargets.length) {
      setActiveByPageOnly();
      return;
    }

    const line = (window.scrollY || 0) + headerOffset() + 5;

    // Find last section whose top <= line
    let current = null;
    for (const t of spyTargets) {
      if (t.top <= line) current = t;
      else break;
    }

    if (current) {
      activateSpyId(current.id);
    } else {
      // Above first section
      setActiveByPageOnly();
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      runScrollSpy();
    });
  }

  function onLoadOrResize() {
    rebuildSpyTargets();
    runScrollSpy();
  }

  /* =========================
     FAQ accordion (accessible)
  ========================= */
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.closest('.faq-item');
      if (!parent) return;

      const open = parent.classList.contains('faq-open');

      document.querySelectorAll('.faq-item').forEach(it => {
        it.classList.remove('faq-open');
        const b = it.querySelector('.faq-btn');
        const p = it.querySelector('.faq-panel');
        if (b) b.setAttribute('aria-expanded', 'false');
        if (p) p.style.maxHeight = null;
      });

      if (!open) {
        parent.classList.add('faq-open');
        btn.setAttribute('aria-expanded', 'true');
        const panel = parent.querySelector('.faq-panel');
        if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });

  /* =========================
     Contact form: validation + fake send
  ========================= */
  const form = document.getElementById('contactForm');
  const feedback = document.getElementById('formFeedback');

  function showToast(msg, time = 3000) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => t.remove(), time);
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (feedback) feedback.textContent = '';

      const name = (document.getElementById('name')?.value || '').trim();
      const email = (document.getElementById('email')?.value || '').trim();
      const message = (document.getElementById('message')?.value || '').trim();

      if (!name) { if (feedback) feedback.textContent = 'Please enter your name.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { if (feedback) feedback.textContent = 'Please enter a valid email.'; return; }
      if (message.length < 8) { if (feedback) feedback.textContent = 'Message is too short.'; return; }

      const submitBtn = form.querySelector('button[type="submit"]');
      const old = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.textContent = old;
          submitBtn.disabled = false;
        }
        form.reset();
        if (feedback) feedback.textContent = '';
        showToast('Message sent — we will get back to you shortly!');
      }, 900);
    });
  }

  /* =========================
     Boot
  ========================= */
  document.addEventListener('DOMContentLoaded', () => {
    // Page fallback immediately
    setActiveByPageOnly();

    // Build spy for THIS page and run
    onLoadOrResize();

    // Keep updating while scrolling
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onLoadOrResize);

    // If hash changes and that ID exists on this page, activate it
    window.addEventListener('hashchange', () => {
      onLoadOrResize();
    });
  });

  // FAQ panels sized correctly if any is pre-open
  window.addEventListener('load', () => {
    document.querySelectorAll('.faq-item').forEach(it => {
      if (it.classList.contains('faq-open')) {
        const p = it.querySelector('.faq-panel');
        if (p) p.style.maxHeight = p.scrollHeight + 'px';
      }
    });
  });
})();


const form = document.getElementById('contactForm');
const feedback = document.getElementById('formFeedback');

function showToast(msg, time = 3000){
  const root = document.getElementById('toastRoot');
  if(!root) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  root.appendChild(t);
  setTimeout(()=> t.remove(), time);
}

if(form){
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (feedback) feedback.textContent = '';

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const message = document.getElementById('message')?.value.trim();

    if(!name){ if(feedback) feedback.textContent = 'Please enter your name.'; return; }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ if(feedback) feedback.textContent = 'Please enter a valid email.'; return; }
    if(message.length < 8){ if(feedback) feedback.textContent = 'Message is too short.'; return; }

    const submitBtn = form.querySelector('button[type="submit"]');
    const old = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){ submitBtn.textContent = 'Sending...'; submitBtn.disabled = true; }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if(res.ok){
        form.reset();
        showToast('Message sent — we will get back to you shortly!');
      } else {
        showToast('Failed to send. Please try again.');
      }
    } catch (err) {
      showToast('Network error. Please try again.');
    } finally {
      if(submitBtn){ submitBtn.textContent = old; submitBtn.disabled = false; }
    }
  });
}
