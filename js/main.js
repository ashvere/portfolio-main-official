(function () {
    'use strict';

    /* ========== THEME TOGGLE ========== */


    /* ========== CHECK PREFERS REDUCED MOTION ========== */

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ========== HAMBURGER MENU ========== */
    var navLinks = document.querySelector('.nav-links');
    var hamburger = document.querySelector('.hamburger');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function () {
            var isActive = navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isActive);
        });

        navLinks.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    /* ========== SCROLL REVEAL (STAGGERED) ========== */

    var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                if (prefersReducedMotion) {
                    entry.target.classList.add('visible');
                } else {
                    entry.target.classList.add('visible');
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach(function (el) {
        revealObserver.observe(el);
    });

    /* ========== SCROLL PROGRESS BAR ========== */

    var progressBar = document.getElementById('progressBar');

    if (progressBar) {
        window.addEventListener('scroll', function () {
            var scrollTop = window.scrollY;
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            var progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = progress + '%';
        });
    }

    /* ========== COUNTER ANIMATION ========== */

    var countersAnimated = false;

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1500;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(eased * target);
            el.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(step);
    }

    var counterObserver = new IntersectionObserver(function (entries) {
        if (countersAnimated) return;
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                countersAnimated = true;
                document.querySelectorAll('.stat-number').forEach(function (el) {
                    animateCounter(el);
                });
                counterObserver.disconnect();
            }
        });
    }, { threshold: 0.3 });

    var statsSection = document.querySelector('.stats-card');
    if (statsSection) {
        counterObserver.observe(statsSection);
    }

    /* ========== TYPEWRITER EFFECT ========== */

    var typewriterEl = document.getElementById('typewriter');
    if (typewriterEl) {
        var text = 'I design and build scalable software solutions that solve real problems and create meaningful impacts.';
        var speed = 18;
        var i = 0;
        typewriterEl.textContent = '';

        function typeWriter() {
            if (i < text.length) {
                typewriterEl.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
            } else {
                typewriterEl.classList.add('done');
            }
        }

        var heroObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setTimeout(typeWriter, 600);
                    heroObserver.disconnect();
                }
            });
        }, { threshold: 0.3 });

        heroObserver.observe(typewriterEl);
    }

    /* ========== CARD TILT + GLOW ========== */

    var tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            if (prefersReducedMotion) return;

            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;
            var rotateX = (y - centerY) / centerY * -6;
            var rotateY = (x - centerX) / centerX * 6;

            card.style.transform =
                'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.01)';

            var glow = card.querySelector('.project-visual');
            if (glow) {
                var glowX = (x / rect.width) * 100;
                var glowY = (y / rect.height) * 100;
                glow.style.setProperty('--glow-x', glowX + '%');
                glow.style.setProperty('--glow-y', glowY + '%');
                glow.style.background = 'radial-gradient(circle at ' + glowX + '% ' + glowY + '%, rgba(74, 93, 78, 0.06) 0%, transparent 60%)';
            }
        });

        card.addEventListener('mouseleave', function () {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            var glow = card.querySelector('.project-visual');
            if (glow) {
                glow.style.background = '';
            }
        });
    });

    /* ========== MAGNETIC BUTTONS WITH SPRING RETURN ========== */

    var magneticEls = document.querySelectorAll('[data-magnetic]');
    var magneticState = {};

    if (!prefersReducedMotion) {
        magneticEls.forEach(function (el) {
            var id = Math.random().toString(36).substr(2, 9);
            magneticState[id] = { x: 0, y: 0, targetX: 0, targetY: 0 };
            el.dataset.magneticId = id;

            el.addEventListener('mousemove', function (e) {
                var rect = el.getBoundingClientRect();
                var x = e.clientX - rect.left - rect.width / 2;
                var y = e.clientY - rect.top - rect.height / 2;
                var strength = 0.3;
                
                var state = magneticState[id];
                state.targetX = x * strength;
                state.targetY = y * strength;
            });

            el.addEventListener('mouseleave', function () {
                var state = magneticState[id];
                state.targetX = 0;
                state.targetY = 0;
            });
        });

        /* Spring-return lerp animation loop */
        var lastTime = Date.now();
        function updateMagneticPosition() {
            var now = Date.now();
            var deltaTime = Math.min(now - lastTime, 16) / 16;
            lastTime = now;

            Object.keys(magneticState).forEach(function (id) {
                var el = document.querySelector('[data-magnetic-id="' + id + '"]');
                if (!el) return;

                var state = magneticState[id];
                var damping = 0.15;
                state.x += (state.targetX - state.x) * damping;
                state.y += (state.targetY - state.y) * damping;

                el.style.transform = 'translate(' + state.x.toFixed(2) + 'px, ' + state.y.toFixed(2) + 'px)';
            });

            requestAnimationFrame(updateMagneticPosition);
        }

        updateMagneticPosition();
    }

    /* ========== HERO SUBTLE PARALLAX ========== */

    var heroContent = document.querySelector('.hero-text-content');
    if (heroContent && !prefersReducedMotion) {
        window.addEventListener('mousemove', function (e) {
            var x = (e.clientX / window.innerWidth - 0.5) * 6;
            var y = (e.clientY / window.innerHeight - 0.5) * 6;
            heroContent.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        });

        window.addEventListener('mouseleave', function () {
            heroContent.style.transform = 'translate(0, 0)';
        });
    }

})();
