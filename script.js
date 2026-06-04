document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        
        // Toggle icon between bars and times
        const icon = hamburger.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = hamburger.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Active link highlighting on scroll
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinksItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth reveal animation for sections
    const revealElements = document.querySelectorAll('.section');
    
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    };
    
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    
    revealElements.forEach(el => {
        // Only apply to elements other than hero if you want hero to show immediately
        if (el.id !== 'home') {
            el.style.opacity = 0;
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            revealObserver.observe(el);
        }
    });

    // Web3Forms AJAX Submission & Security
    const contactForm = document.getElementById('contactForm');
    const formResult = document.getElementById('form-result');
    const submitBtn = contactForm ? contactForm.querySelector('button[type="submit"]') : null;
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // 1. Basic Security: Check if fields are just empty spaces
            const name = contactForm.querySelector('[name="name"]').value.trim();
            const email = contactForm.querySelector('[name="email"]').value.trim();
            const message = contactForm.querySelector('[name="message"]').value.trim();

            if (!name || !email || !message) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'Please fill out all fields completely.',
                    confirmButtonColor: '#6366f1',
                    background: '#1e1e1e',
                    color: '#f8fafc'
                });
                return;
            }

            // 2. Prevent Double-Click Spamming
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

            const formData = new FormData(contactForm);
            const object = Object.fromEntries(formData);
            const json = JSON.stringify(object);

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: json
            })
            .then(async (response) => {
                let json = await response.json();
                if (response.status == 200) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Sent!',
                        text: 'Your message has been sent successfully. I will get back to you soon!',
                        confirmButtonColor: '#10b981',
                        background: '#1e1e1e',
                        color: '#f8fafc'
                    });
                    contactForm.reset();
                } else {
                    console.log(response);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: json.message,
                        confirmButtonColor: '#ef4444',
                        background: '#1e1e1e',
                        color: '#f8fafc'
                    });
                }
            })
            .catch(error => {
                console.log(error);
                Swal.fire({
                        icon: 'error',
                        title: 'Network Error',
                        text: 'Something went wrong! Please try again later.',
                        confirmButtonColor: '#ef4444',
                        background: '#1e1e1e',
                        color: '#f8fafc'
                    });
            })
            .then(function() {
                // Re-enable the button
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
            });
        });
    }

    // Guestbook / Comments System
    const commentForm = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');
    const starRatingContainer = document.getElementById('starRating');
    const ratingInput = document.getElementById('commentRating');

    // Handle Star Rating UI
    if (starRatingContainer) {
        const stars = starRatingContainer.querySelectorAll('i');
        
        stars.forEach(star => {
            star.addEventListener('mouseover', function() {
                const rating = this.getAttribute('data-rating');
                stars.forEach(s => {
                    if (s.getAttribute('data-rating') <= rating) {
                        s.classList.add('hover');
                    } else {
                        s.classList.remove('hover');
                    }
                });
            });

            star.addEventListener('mouseout', function() {
                stars.forEach(s => s.classList.remove('hover'));
            });

            star.addEventListener('click', function() {
                const rating = this.getAttribute('data-rating');
                ratingInput.value = rating;
                
                stars.forEach(s => {
                    if (s.getAttribute('data-rating') <= rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
        });

        // Initialize 5 stars active
        stars.forEach(s => s.classList.add('active'));
    }

    // Load comments from LocalStorage on page load
    let comments = JSON.parse(localStorage.getItem('portfolio_reviews')) || [];

    function generateStars(rating) {
        let starsHTML = '';
        for(let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }

    function renderComments() {
        if(!commentsList) return;
        commentsList.innerHTML = '';
        
        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem;">No reviews yet. Be the first to leave some feedback!</p>';
            return;
        }

        comments.forEach(comment => {
            // Generate Gravatar URL using MD5 hash of email
            const emailHash = typeof md5 !== 'undefined' ? md5(comment.email.trim().toLowerCase()) : '';
            const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=mp&s=100`;

            const commentHTML = `
                <div class="comment">
                    <div class="comment-avatar">
                        <img src="${avatarUrl}" alt="${comment.name}">
                    </div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <div>
                                <h4>${comment.name}</h4>
                                <span style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.4rem;">${comment.email}</span>
                                <div class="comment-stars">${generateStars(comment.rating)}</div>
                            </div>
                            <p class="comment-date">${comment.date}</p>
                        </div>
                        <p class="comment-body">${comment.text}</p>
                    </div>
                </div>
            `;
            commentsList.insertAdjacentHTML('beforeend', commentHTML);
        });
    }

    renderComments();

    if (commentForm) {
        commentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nameInput = document.getElementById('commentName');
            const emailInput = document.getElementById('commentEmail');
            const textInput = document.getElementById('commentText');

            if (nameInput.value.trim() === '' || emailInput.value.trim() === '' || textInput.value.trim() === '') return;

            const newComment = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                text: textInput.value.trim(),
                rating: parseInt(ratingInput.value) || 5,
                date: new Date().toLocaleDateString()
            };

            // Add to beginning of array so newest is at top
            comments.unshift(newComment);
            
            // Save to LocalStorage
            localStorage.setItem('portfolio_reviews', JSON.stringify(comments));
            
            // Re-render
            renderComments();

            // Send Email Notification via Web3Forms API
            fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    access_key: "5091a732-d07f-439f-a407-d91bb5877229",
                    name: newComment.name,
                    email: newComment.email,
                    subject: "New Portfolio Review Received!",
                    message: `You received a new review on your portfolio!\n\nName: ${newComment.name}\nEmail: ${newComment.email}\nRating: ${newComment.rating} Stars\n\nComment/Suggestion:\n${newComment.text}`
                })
            }).catch(error => console.error("Error sending review email:", error));
            
            // Clear form
            commentForm.reset();
            // Reset stars visually
            if(starRatingContainer) {
                const stars = starRatingContainer.querySelectorAll('i');
                stars.forEach(s => s.classList.add('active'));
                ratingInput.value = 5;
            }

            Swal.fire({
                icon: 'success',
                title: 'Review Posted!',
                text: 'Thank you for your feedback.',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                background: '#1e1e1e',
                color: '#f8fafc'
            });
        });
    }

});
