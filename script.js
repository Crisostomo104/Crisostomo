document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('siteHeader');
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('primaryNav');
    const navLinks = [...nav.querySelectorAll('a[href^="#"]:not(.btn)')];
    const sections = [...document.querySelectorAll('main section[id]')];

    /* ---------- Header shadow + active link (throttled with rAF) ---------- */
    let ticking = false;
    const onScroll = () => {
        header.classList.toggle('scrolled', window.scrollY > 8);
        const probe = window.scrollY + (header.offsetHeight || 68) + window.innerHeight * 0.25;
        let current = '';
        sections.forEach(s => { if (probe >= s.offsetTop) current = s.id; });
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    const setMenu = open => {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('click', e => {
        if (nav.classList.contains('open') && !header.contains(e.target)) setMenu(false);
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); }
    });
    // Reset if the viewport is resized up to desktop while the menu is open
    window.matchMedia('(min-width: 821px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

    /* ---------- Reveal on scroll ---------- */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(en => {
                if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in'));
    }


    /* ---------- Clean URL: smooth-scroll to sections without adding #hash ---------- */
    const web = location.protocol.startsWith('http');
    const cleanPath = () => location.pathname.replace(/index\.html$/, '') + location.search;
    const stripUrl = () => { if (web) { try { history.replaceState(null, '', cleanPath()); } catch (_) {} } };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('click', e => {
        const a = e.target.closest('a[href^="#"]');
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        const id = a.getAttribute('href').slice(1);
        const target = id ? document.getElementById(id) : document.body;
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        if (id && id !== 'main') target.setAttribute('tabindex', '-1');
        stripUrl();
    });

    // If someone opens a link that already has a #hash or /index.html, scroll there, then tidy the URL
    if (location.hash) {
        const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (t) setTimeout(() => t.scrollIntoView(), 0);
    }
    stripUrl();

    /* ---------- Contact form (Web3Forms) ---------- */
    const form = document.getElementById('contactForm');
    const toast = (icon, title, text) => {
        if (window.Swal) {
            return Swal.fire({ icon, title, text, confirmButtonColor: '#1e4fd8' });
        }
        alert(title + '\n' + text); // fallback if the CDN script is blocked
    };

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
            return toast('warning', 'Almost there', 'Please fill out all fields.');
        }
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Sending…';
        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json();
            if (res.ok) {
                toast('success', 'Sent!', 'Thanks for reaching out. I will reply soon.');
                form.reset();
            } else {
                toast('error', 'Error', json.message || 'Please try again.');
            }
        } catch (err) {
            toast('error', 'Network error', 'Something went wrong. Please try again later or email me directly.');
        }
        btn.disabled = false;
        btn.textContent = 'Send Inquiry';
    });
});
