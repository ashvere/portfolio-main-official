(function () {
    'use strict';

    /* ========== THEME TOGGLE ========== */


    /* ========== CHECK PREFERS REDUCED MOTION ========== */

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ========== HERO — CIRCULAR GALLERY ========== */

    var heroGalleryEl = document.getElementById('heroGallery');

    if (heroGalleryEl && typeof window.createCircularGallery === 'function') {
        var heroGalleryTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#1A1D1A';

        window.createCircularGallery(heroGalleryEl, {
            items: [
                { image: 'assets/img/me/1.png', text: 'BSICT Coding Sprint' },
                { image: 'assets/img/me/2.png', text: 'Planning the Build' },
                { image: 'assets/img/me/3.png', text: 'AI Productivity & Automation Seminar' },
                { image: 'assets/img/me/4.png', text: 'Coding at the Seminar' },
                { image: 'assets/img/me/5.png', text: 'Late-Night Build Session' },
                { image: 'assets/img/me/6.png', text: 'Project Planning — WVSU Library' },
                { image: 'assets/img/me/7.png', text: 'Pair Programming — WVSU Library' }
            ],
            bend: 3,
            textColor: heroGalleryTextColor,
            borderRadius: 0.06,
            font: 'bold 22px Inter',
            scrollSpeed: 2,
            scrollEase: 0.05
        }).catch(function (err) {
            console.error('CircularGallery failed to initialize:', err);
        });
    }

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
        var text = 'Machine learning and software engineer — I take ideas from notebook to production: computer vision, full-stack web, and mobile, built and deployed end to end.';
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

    /* ========== SKILL ORBIT ========== */

    var skillCategories = [
        {
            id: 'languages',
            label: 'Programming Languages',
            proficiency: 'Advanced',
            level: 90,
            tech: ['Python', 'Dart', 'JavaScript', 'TypeScript', 'HTML/CSS', 'SQL'],
            desc: 'Python trained the disease-detection model behind CapRice AI, Dart built its Flutter interface, and TypeScript keeps Farmstat\'s dashboard honest under real crop data.'
        },
        {
            id: 'frameworks',
            label: 'Mobile & Frontend Frameworks',
            proficiency: 'Advanced',
            level: 88,
            tech: ['Flutter', 'React Native', 'React', 'Next.js', 'HTML5/CSS3'],
            desc: 'Flutter is what CapRice AI runs on in the field — offline-capable, built for edge devices. React and Next.js power Farmstat\'s yield-analytics dashboard on the web.'
        },
        {
            id: 'backend',
            label: 'Backend & Cloud Infrastructure',
            proficiency: 'Intermediate',
            level: 75,
            tech: ['Google Cloud Platform', 'Firebase', 'Supabase', 'Flask', 'Node.js', 'REST APIs'],
            desc: 'The data layer behind Triad Core Secure Portal\'s authentication workflows and Farmstat\'s real-time crop statistics — built to stay up when the frontend isn\'t the only thing calling it.'
        },
        {
            id: 'ml',
            label: 'Machine Learning & AI Tools',
            proficiency: 'Advanced',
            level: 92,
            tech: ['TensorFlow', 'Keras', 'Computer Vision', 'MobileNetV2 / EfficientNetV2', 'Model Optimization', 'Data Augmentation', 'Ollama', 'Gemma 2', 'OpenCode CLI'],
            desc: 'Trained and optimized the computer vision model behind CapRice AI — 98.4% diagnostic accuracy at 42fps on-device — and I run local LLM workflows entirely offline with Ollama and Gemma 2.'
        },
        {
            id: 'databases',
            label: 'Databases & Local Storage',
            proficiency: 'Intermediate',
            level: 70,
            tech: ['MySQL', 'PostgreSQL', 'SQLite', 'Hive'],
            desc: 'SQLite and Hive keep CapRice AI working without a signal in the field; MySQL and PostgreSQL structure the server side of Farmstat and Triad Core Secure Portal.'
        },
        {
            id: 'tools',
            label: 'Developer Tools & Environment',
            proficiency: 'Advanced',
            level: 85,
            tech: ['Git', 'GitHub', 'Docker', 'VS Code', 'SDK Configuration'],
            desc: 'Docker containerizes CapRice AI\'s inference environment so it behaves the same on my laptop as it does on a deployed edge device; Git and GitHub tie every project together.'
        },
        {
            id: 'design',
            label: 'UI/UX & Design Systems',
            proficiency: 'Expert',
            level: 98,
            tech: ['Figma', 'Wireframing', 'Prototyping', 'Mobile-First UI/UX'],
            desc: 'Every interface — from CapRice AI\'s live diagnostic cards to Farmstat\'s analytics dashboard — starts as a Figma wireframe before a line of code.'
        },
        {
            id: 'architecture',
            label: 'Architecture & Paradigms',
            proficiency: 'Intermediate',
            level: 72,
            tech: ['SSR (Next.js)', 'MVC', 'Cross-Platform Architecture', 'Offline-First Storage'],
            desc: 'Offline-first architecture is what makes CapRice AI usable without connectivity; Triad Core Secure Portal\'s protected pipelines are built on that same discipline for handling data safely.'
        }
    ];

    var orbitWrap = document.getElementById('orbitWrap');
    var orbit = document.getElementById('orbit');

    if (orbitWrap && orbit) {
        var linesSvg = document.getElementById('orbitLines');
        var orbitTrack = document.getElementById('orbitTrack');
        var orbitDetail = document.getElementById('orbitDetail');
        var orbitDetailIndex = document.getElementById('orbitDetailIndex');
        var orbitDetailTitle = document.getElementById('orbitDetailTitle');
        var orbitDetailProfLabel = document.getElementById('orbitDetailProfLabel');
        var orbitDetailMeterFill = document.getElementById('orbitDetailMeterFill');
        var orbitDetailTech = document.getElementById('orbitDetailTech');
        var orbitDetailDesc = document.getElementById('orbitDetailDesc');
        var orbitPrevBtn = document.getElementById('orbitPrevBtn');
        var orbitNextBtn = document.getElementById('orbitNextBtn');

        var total = skillCategories.length;
        var activeIndex = 0;
        var isStripMode = false;

        var nodeEls = [];
        var lineEls = [];

        skillCategories.forEach(function (cat) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'orbit-node';
            btn.setAttribute('aria-pressed', 'false');
            btn.setAttribute('aria-label', cat.label);
            btn.innerHTML = '<span>' + cat.label + '</span>';
            btn.addEventListener('click', function () {
                setActive(nodeEls.indexOf(btn));
            });
            orbit.appendChild(btn);
            nodeEls.push(btn);

            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            linesSvg.appendChild(line);
            lineEls.push(line);
        });

        function pad(n) { return n < 10 ? '0' + n : '' + n; }

        function renderDetail(index, skipFade) {
            var cat = skillCategories[index];

            function apply() {
                orbitDetailIndex.textContent = pad(index + 1) + ' / ' + pad(total);
                orbitDetailTitle.textContent = cat.label;
                orbitDetailProfLabel.textContent = cat.proficiency + ' — ' + cat.level + '%';
                orbitDetailTech.innerHTML = '';
                cat.tech.forEach(function (t) {
                    var span = document.createElement('span');
                    span.className = 'tech-pill';
                    span.textContent = t;
                    orbitDetailTech.appendChild(span);
                });
                orbitDetailDesc.textContent = cat.desc;

                orbitDetailMeterFill.style.width = '0%';

                requestAnimationFrame(function () {
                    orbitDetailMeterFill.style.width = cat.level + '%';
                    orbitDetailTech.querySelectorAll('.tech-pill').forEach(function (pill, i) {
                        pill.style.transitionDelay = prefersReducedMotion ? '0ms' : (i * 45) + 'ms';
                        requestAnimationFrame(function () {
                            pill.classList.add('is-in');
                        });
                    });
                });
            }

            if (skipFade || prefersReducedMotion) {
                apply();
                return;
            }

            orbitDetail.classList.add('is-updating');
            setTimeout(function () {
                apply();
                orbitDetail.classList.remove('is-updating');
            }, 220);
        }

        function computeOrbitLayout() {
            if (isStripMode) return;

            var w = orbitWrap.clientWidth;
            var h = orbitWrap.clientHeight;
            var cx = w / 2;
            var cy = h / 2;
            var rx = Math.min(w * 0.42, 300);
            var ry = Math.min(h * 0.42, 120);
            var step = (2 * Math.PI) / total;
            var rotationOffset = Math.PI - activeIndex * step;

            if (orbitTrack) {
                orbitTrack.setAttribute('cx', cx);
                orbitTrack.setAttribute('cy', cy);
                orbitTrack.setAttribute('rx', rx);
                orbitTrack.setAttribute('ry', ry);
            }

            skillCategories.forEach(function (cat, i) {
                var theta = i * step + rotationOffset;
                var x = cx + rx * Math.sin(theta);
                var y = cy - ry * Math.cos(theta);
                var depth = (1 - Math.cos(theta)) / 2;
                var scale = 0.6 + depth * 0.5;
                var opacity = 0.28 + depth * 0.72;
                var blur = (1 - depth) * 2;
                var z = Math.round(depth * 100);

                var el = nodeEls[i];
                el.style.transform = 'translate(' + x + 'px, ' + y + 'px) scale(' + scale.toFixed(3) + ')';
                el.style.opacity = opacity.toFixed(3);
                el.style.filter = 'blur(' + blur.toFixed(2) + 'px)';
                el.style.zIndex = z;

                var line = lineEls[i];
                line.setAttribute('x1', cx);
                line.setAttribute('y1', cy);
                line.setAttribute('x2', x);
                line.setAttribute('y2', y);
                line.style.opacity = (0.08 + depth * 0.26).toFixed(2);
                line.classList.toggle('is-active', i === activeIndex);
            });
        }

        function setActive(index, skipFade) {
            activeIndex = ((index % total) + total) % total;

            nodeEls.forEach(function (el, i) {
                var active = i === activeIndex;
                el.classList.toggle('is-active', active);
                el.setAttribute('aria-pressed', active ? 'true' : 'false');
            });

            computeOrbitLayout();
            renderDetail(activeIndex, skipFade);

            if (isStripMode) {
                nodeEls[activeIndex].scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
            }
        }

        orbitPrevBtn.addEventListener('click', function () {
            setActive(activeIndex - 1);
        });

        orbitNextBtn.addEventListener('click', function () {
            setActive(activeIndex + 1);
        });

        orbitWrap.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight') {
                setActive(activeIndex + 1);
            } else if (e.key === 'ArrowLeft') {
                setActive(activeIndex - 1);
            }
        });

        function applyOrbitMode() {
            var shouldStrip = window.innerWidth <= 640;
            if (shouldStrip === isStripMode) {
                if (!shouldStrip) computeOrbitLayout();
                return;
            }
            isStripMode = shouldStrip;
            orbit.classList.toggle('strip-mode', isStripMode);
            nodeEls.forEach(function (el) {
                el.style.transform = '';
                el.style.opacity = '';
                el.style.filter = '';
                el.style.zIndex = '';
            });
            if (!isStripMode) computeOrbitLayout();
        }

        var orbitResizeTimer = null;
        window.addEventListener('resize', function () {
            clearTimeout(orbitResizeTimer);
            orbitResizeTimer = setTimeout(applyOrbitMode, 120);
        });

        applyOrbitMode();
        setActive(0, true);
    }

    /* ========== FEATURED WORK — SCROLL STACK ========== */

    var scrollStackEl = document.getElementById('scrollStack');

    if (scrollStackEl && typeof ScrollStack !== 'undefined' && typeof Lenis !== 'undefined') {
        new ScrollStack(scrollStackEl, {
            itemDistance: 60,
            itemScale: 0.03,
            itemStackDistance: 24,
            stackPosition: '18%',
            scaleEndPosition: '8%',
            baseScale: 0.88,
            useWindowScroll: false,
            reducedMotion: prefersReducedMotion
        });
    }

    /* ========== TECH STACK — LOGO LOOP ========== */

    var techLogoLoopEl = document.getElementById('techLogoLoop');

    if (techLogoLoopEl && typeof LogoLoop !== 'undefined') {
        var DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/';

        new LogoLoop(techLogoLoopEl, {
            logos: [
                { src: DEVICON_BASE + 'python/python-original.svg', title: 'Python' },
                { src: DEVICON_BASE + 'javascript/javascript-original.svg', title: 'JavaScript' },
                { src: DEVICON_BASE + 'typescript/typescript-original.svg', title: 'TypeScript' },
                { src: DEVICON_BASE + 'dart/dart-original.svg', title: 'Dart' },
                { src: DEVICON_BASE + 'flutter/flutter-original.svg', title: 'Flutter' },
                { src: DEVICON_BASE + 'react/react-original.svg', title: 'React' },
                { src: DEVICON_BASE + 'nextjs/nextjs-original.svg', title: 'Next.js' },
                { src: DEVICON_BASE + 'tensorflow/tensorflow-original.svg', title: 'TensorFlow' },
                { src: DEVICON_BASE + 'firebase/firebase-plain.svg', title: 'Firebase' },
                { src: DEVICON_BASE + 'googlecloud/googlecloud-original.svg', title: 'Google Cloud' },
                { src: DEVICON_BASE + 'nodejs/nodejs-original.svg', title: 'Node.js' },
                { src: DEVICON_BASE + 'mysql/mysql-original.svg', title: 'MySQL' },
                { src: DEVICON_BASE + 'postgresql/postgresql-original.svg', title: 'PostgreSQL' },
                { src: DEVICON_BASE + 'docker/docker-original.svg', title: 'Docker' },
                { src: DEVICON_BASE + 'git/git-original.svg', title: 'Git' },
                { src: DEVICON_BASE + 'figma/figma-original.svg', title: 'Figma' }
            ],
            speed: 60,
            direction: 'left',
            logoHeight: 42,
            gap: 48,
            hoverSpeed: 20,
            fadeOut: true,
            fadeOutColor: 'var(--cream)',
            className: 'logoloop--chips',
            ariaLabel: 'Technologies I work with'
        });
    }

    /* ========== EVENT PHOTOS — INFINITE SPIRAL ========== */

    var eventSpiralEl = document.getElementById('eventSpiral');

    if (eventSpiralEl && typeof InfiniteSpiral !== 'undefined') {
        var eventPhotoItems = [];
        for (var eventPhotoIndex = 1; eventPhotoIndex <= 15; eventPhotoIndex++) {
            eventPhotoItems.push({
                src: 'assets/img/events/' + eventPhotoIndex + '.jfif',
                alt: 'Event photo ' + eventPhotoIndex,
                href: 'assets/img/events/' + eventPhotoIndex + '.png',
                target: '_blank'
            });
        }

        new InfiniteSpiral(eventSpiralEl, {
            items: eventPhotoItems,
            animationMode: prefersReducedMotion ? 'drag' : 'all',
            speed: 0.45,
            radius: 150,
            cardWidth: 92,
            cardHeight: 92,
            verticalSpacing: 52,
            perspective: 1000,
            cardRadius: 10,
            centerScale: 1.25,
            edgeBlur: 5,
            cardsPerTurn: 7,
            pauseOnHover: true
        });
    }

    /* ========== CERTIFICATION MODALS ========== */

    var certModalOverlay = document.getElementById('certModalOverlay');

    if (certModalOverlay) {
        var certModalTriggers = Array.prototype.slice.call(document.querySelectorAll('.cert-modal-trigger'));
        var certModals = Array.prototype.slice.call(certModalOverlay.querySelectorAll('.cert-modal'));
        var activeCertModal = null;
        var lastCertModalTrigger = null;

        function openCertModal(modal, trigger) {
            if (activeCertModal) activeCertModal.hidden = true;
            modal.hidden = false;
            certModalOverlay.hidden = false;
            document.body.classList.add('cert-modal-open');
            activeCertModal = modal;
            lastCertModalTrigger = trigger || null;
        }

        function closeCertModal() {
            if (!activeCertModal) return;
            activeCertModal.hidden = true;
            certModalOverlay.hidden = true;
            document.body.classList.remove('cert-modal-open');
            activeCertModal = null;
            if (lastCertModalTrigger) lastCertModalTrigger.focus();
        }

        certModalTriggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                var modal = document.getElementById(trigger.getAttribute('data-modal-target'));
                if (modal) openCertModal(modal, trigger);
            });
        });

        certModals.forEach(function (modal) {
            var closeBtn = modal.querySelector('.cert-modal-close');
            if (closeBtn) closeBtn.addEventListener('click', closeCertModal);
        });

        certModalOverlay.addEventListener('click', function (event) {
            if (event.target === certModalOverlay) closeCertModal();
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && activeCertModal) closeCertModal();
        });
    }

})();
