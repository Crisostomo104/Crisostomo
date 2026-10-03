document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const links = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('main section');

    // Navbar style + active link on scroll
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
        let current = '';
        sections.forEach(s => {
            if (window.scrollY >= s.offsetTop - s.clientHeight / 3) current = s.id;
        });
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + current));
    }, { passive: true });

    // Mobile menu
    hamburger.addEventListener('click', e => {
        navLinks.classList.toggle('active');
        e.stopPropagation();
    });
    document.addEventListener('click', e => {
        if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) navLinks.classList.remove('active');
    });
    links.forEach(l => l.addEventListener('click', () => navLinks.classList.remove('active')));

    // Reveal on scroll (skips hero; shows everything if motion is reduced)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach(en => {
                if (en.isIntersecting) {
                    en.target.style.opacity = 1;
                    en.target.style.transform = 'translateY(0)';
                    obs.unobserve(en.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        document.querySelectorAll('.section').forEach(el => {
            if (el.id === 'home') return;
            el.style.opacity = 0;
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity .8s ease-out, transform .8s ease-out';
            io.observe(el);
        });
    }

    // Contact form (Web3Forms)
    const form = document.getElementById('contactForm');
    const theme = { background: '#1e1e1e', color: '#f8fafc' };
    const toast = (icon, title, text) => Swal.fire({ icon, title, text, confirmButtonColor: '#6366f1', ...theme });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (!data.name.trim() || !data.email.trim() || !data.message.trim()) {
            return toast('warning', 'Almost there', 'Please fill out all fields.');
        }
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
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
