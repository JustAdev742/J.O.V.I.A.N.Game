// Minimal, dependency-free interactivity:
// - theme toggle (persists in localStorage)
// - mobile menu toggle
// - card 3D tilt on pointermove (touch-friendly fallback)
// - project modal with accessible controls
// - contact form client-side validation + mailto fallback

(() => {
  const doc = document;
  const themeToggle = doc.getElementById('theme-toggle');
  const menuToggle = doc.getElementById('menu-toggle');
  const primaryNav = doc.querySelector('.primary-nav');
  const cards = Array.from(doc.querySelectorAll('.card'));
  const modal = doc.getElementById('project-modal');
  const modalTitle = doc.getElementById('modal-title');
  const modalTagline = doc.getElementById('modal-tagline');
  const modalBody = doc.getElementById('modal-body');
  const modalCta = doc.getElementById('modal-cta');
  const modalCloseBtns = modal.querySelectorAll('.modal-close');
  const modalBackdrop = modal.querySelector('.modal-backdrop');
  const form = doc.getElementById('contact-form');
  const mailtoBtn = doc.getElementById('mailto-fallback');

  // THEME: respect system preference, persist choice
  const LS_THEME = 'jovian-theme';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const getTheme = () => localStorage.getItem(LS_THEME) || (prefersDark ? 'dark' : 'dark');
  const applyTheme = (t) => {
    if (t === 'dark') {
      document.documentElement.style.setProperty('--bg-dark','#05070a');
      document.body.dataset.theme = 'dark';
      themeToggle.setAttribute('aria-pressed','true');
    } else {
      document.documentElement.style.setProperty('--bg-dark','#f7fbff');
      document.body.dataset.theme = 'light';
      themeToggle.setAttribute('aria-pressed','false');
    }
    localStorage.setItem(LS_THEME,t);
  };
  applyTheme(getTheme());
  themeToggle.addEventListener('click', () => {
    applyTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  // MOBILE MENU
  menuToggle.addEventListener('click', (e) => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    // fallback simple nav popover for small screens
    if (!expanded) {
      primaryNav.style.display = 'block';
      primaryNav.setAttribute('role','dialog');
    } else {
      primaryNav.style.display = '';
      primaryNav.removeAttribute('role');
    }
  });

  // CARD TILT - pointermove
  function bindTilt(el){
    const inner = el;
    function onMove(e){
      const rect = inner.getBoundingClientRect();
      const x = ( (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left ) / rect.width - 0.5;
      const y = ( (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top ) / rect.height - 0.5;
      inner.style.transform = `perspective(900px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*8).toFixed(2)}deg) translateZ(6px)`;
    }
    function onLeave(){
      inner.style.transform = '';
    }
    inner.addEventListener('pointermove', onMove);
    inner.addEventListener('pointerleave', onLeave);
    // focus/blur for keyboard accessibility
    inner.addEventListener('focus', () => inner.style.transform = 'translateY(-6px)');
    inner.addEventListener('blur', () => inner.style.transform = '');
  }
  cards.forEach(card => bindTilt(card));

  // PROJECT DETAILS (demo content - replace with your real data)
  const PROJECTS = {
    engine: {
      title: 'JOVIAN Engine',
      tagline: 'Scalable multi-threaded C++ engine with custom shader pipeline',
      body: `<p>Designed for massive-scale environments and deterministic simulation. Features include job-system scheduling, dynamic LOD, streaming virtual memory for world assets, and a modular renderer with hot-reload shaders.</p>
             <ul><li>Language: C++17/20</li><li>Rendering: Vulkan + HLSL cross-compile</li><li>Networking: deterministic rollback-based replication</li></ul>`,
      cta: { href: '#', text: 'Engine Whitepaper' }
    },
    hour: {
      title: 'Project: Hour of Joy',
      tagline: 'An atmospheric survival horror built on Unreal Engine 5',
      body: `<p>Experimental NPC reasoning with simulated emotional states, photoreal lighting, and adaptive audio that reacts to player stress. Target platforms: PC and next-gen consoles.</p>`,
      cta: { href: '#', text: 'Teaser & Notes' }
    },
    launcher: {
      title: 'CodeNova Launcher',
      tagline: 'Decentralized, privacy-first delivery & community tooling',
      body: `<p>A secure P2P update system with content integrity, modular plugin support, and user-first privacy controls. Built to reduce central server dependence while keeping update UX seamless.</p>`,
      cta: { href: '#', text: 'Download Beta' }
    }
  };

  function openModalFor(key){
    const data = PROJECTS[key];
    if (!data) return;
    modalTitle.textContent = data.title;
    modalTagline.textContent = data.tagline;
    modalBody.innerHTML = data.body;
    modalCta.href = data.cta.href;
    modalCta.textContent = data.cta.text;
    modal.setAttribute('aria-hidden','false');
    // trap focus (simple)
    const focusable = modal.querySelectorAll('button, [href], input, textarea');
    if (focusable.length) focusable[0].focus();
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    // return focus to last focused card (basic)
    document.activeElement.blur();
  }

  // Card action buttons
  doc.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const project = btn.dataset.open;
      openModalFor(project);
    });
  });

  // Close modal handlers
  modalCloseBtns.forEach(b => b.addEventListener('click', closeModal));
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target.dataset.dismiss) closeModal();
  });
  doc.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });

  // Simple contact form validation + mailto fallback
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();
    const status = doc.getElementById('form-status');

    if (!name || !email || !message) {
      status.textContent = 'Please complete all required fields.';
      status.style.color = '#f59e0b';
      return;
    }
    // Minimal email format check
    if (!/\S+@\S+\.\S+/.test(email)) {
      status.textContent = 'Please enter a valid email address.';
      status.style.color = '#f43f5e';
      return;
    }

    // Use mailto as demo fallback (replace with fetch to your API)
    const subject = encodeURIComponent(`Contact from ${name} — Jovian Games`);
    const body = encodeURIComponent(`${message}\n\n---\nFrom: ${name} <${email}>`);
    window.location.href = `mailto:support@joviangame.me?subject=${subject}&body=${body}`;
    status.textContent = 'Opening your mail client...';
    status.style.color = 'var(--accent-teal)';
    // Save draft to localStorage
    localStorage.setItem('jovian-contact-draft', JSON.stringify({name,email,message,ts:Date.now()}));
  });

  // Mailto fallback button: open mail client with populated draft if available
  mailtoBtn.addEventListener('click', () => {
    const draft = JSON.parse(localStorage.getItem('jovian-contact-draft') || '{}');
    const subject = encodeURIComponent(`Contact from ${draft.name || ''} — Jovian Games`);
    const body = encodeURIComponent(`${draft.message || ''}\n\nFrom: ${draft.name || ''} <${draft.email || ''}>`);
    window.location.href = `mailto:support@joviangame.me?subject=${subject}&body=${body}`;
  });

  // Restore draft if present
  const draft = JSON.parse(localStorage.getItem('jovian-contact-draft') || 'null');
  if (draft && draft.name) {
    form.name.value = draft.name || '';
    form.email.value = draft.email || '';
    form.message.value = draft.message || '';
  }
})();