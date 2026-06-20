/**
 * 梦境艺术 - Dreamscape Art
 * Main JavaScript v2.0 - Professional Interactive Effects
 */

// ============================================
// DOM Elements
// ============================================
const cursorGlow = document.getElementById('cursorGlow');
const cursorTrail = document.getElementById('cursorTrail');
const scrollProgress = document.getElementById('scrollProgress');
const backToTopBtn = document.getElementById('backToTop');
const nav = document.querySelector('.glass-nav');
const navLinks = document.querySelectorAll('.nav-link');
const navToggle = document.getElementById('navToggle');
const navLinksContainer = document.getElementById('navLinks');
const sections = document.querySelectorAll('section');
const galleryItems = document.querySelectorAll('.gallery-item');
const statNumbers = document.querySelectorAll('.stat-number');
const pageLoader = document.getElementById('pageLoader');
const loaderBar = document.getElementById('loaderBar');

// ============================================
// State
// ============================================
let mouseX = 0, mouseY = 0;
let isMenuOpen = false;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================
// Loading Screen
// ============================================
function initLoader() {
    if (!pageLoader || !loaderBar) return;

    let progress = 0;
    const tick = () => {
        progress += (100 - progress) * 0.08;
        if (progress > 95) progress = 100;
        loaderBar.style.width = progress + '%';
        if (progress < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    window.addEventListener('load', () => {
        loaderBar.style.width = '100%';
        setTimeout(() => {
            pageLoader.classList.add('hidden');
            document.body.style.opacity = '1';
        }, 400);
    });
}

// ============================================
// Mobile Navigation
// ============================================
function initMobileNav() {
    if (!navToggle || !navLinksContainer) return;

    navToggle.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        navToggle.classList.toggle('active', isMenuOpen);
        navLinksContainer.classList.toggle('open', isMenuOpen);
        navToggle.setAttribute('aria-expanded', isMenuOpen);
    });

    // Close menu on link click
    navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            isMenuOpen = false;
            navToggle.classList.remove('active');
            navLinksContainer.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            isMenuOpen = false;
            navToggle.classList.remove('active');
            navLinksContainer.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.focus();
        }
    });
}

// ============================================
// Subtitle Carousel
// ============================================
function initSubtitleCarousel() {
    const subtitles = document.querySelectorAll('.hero-subtitle');
    if (subtitles.length <= 1) return;

    let current = 0;
    const interval = 4000;

    setInterval(() => {
        subtitles[current].classList.remove('active');
        current = (current + 1) % subtitles.length;
        subtitles[current].classList.add('active');
    }, interval);
}

// ============================================
// Hero Canvas
// ============================================
class HeroCanvas {
    constructor() {
        this.canvas = document.getElementById('heroCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.streams = [];
        this.dust = [];
        this.rings = [];
        this.running = true;

        this.resize();
        this.createStreams();
        this.createDust();
        this.createRings();
        this.animate();

        window.addEventListener('resize', () => {
            this.resize();
            this.createStreams();
            this.createDust();
            this.createRings();
        });

        // Visibility API
        document.addEventListener('visibilitychange', () => {
            this.running = !document.hidden;
            if (this.running) this.animate();
        });
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }

    createStreams() {
        this.streams = [];
        const count = window.innerWidth < 768 ? 4 : 8;
        for (let i = 0; i < count; i++) {
            this.streams.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                length: 80 + Math.random() * 180,
                angle: Math.random() * Math.PI * 2,
                speed: 0.15 + Math.random() * 0.35,
                width: 0.5 + Math.random() * 1.2,
                hue: 240 + Math.random() * 100,
                alpha: 0.08 + Math.random() * 0.15,
                curve: (Math.random() - 0.5) * 0.015
            });
        }
    }

    createDust() {
        this.dust = [];
        const count = window.innerWidth < 768 ? 25 : 50;
        for (let i = 0; i < count; i++) {
            this.dust.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: 0.5 + Math.random() * 1.5,
                speed: 0.08 + Math.random() * 0.25,
                angle: Math.random() * Math.PI * 2,
                alpha: 0.15 + Math.random() * 0.4,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.008 + Math.random() * 0.025,
                hue: 240 + Math.random() * 120
            });
        }
    }

    createRings() {
        this.rings = [];
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        for (let i = 0; i < 3; i++) {
            this.rings.push({
                x: cx, y: cy,
                radius: 80 + i * 70,
                maxRadius: 160 + i * 90,
                angle: (Math.PI * 2 / 3) * i,
                speed: 0.003 + i * 0.001,
                hue: 240 + i * 30,
                alpha: 0.06
            });
        }
    }

    animate() {
        if (!this.running) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.rings.forEach(r => {
            r.angle += r.speed;
            const cr = r.radius + Math.sin(r.angle) * (r.maxRadius - r.radius) * 0.3;
            ctx.beginPath();
            ctx.arc(r.x, r.y, cr, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${r.hue}, 70%, 65%, ${r.alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            const dotX = r.x + Math.cos(r.angle * 3) * cr;
            const dotY = r.y + Math.sin(r.angle * 3) * cr;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${r.hue}, 80%, 75%, ${r.alpha * 3})`;
            ctx.fill();
        });

        this.streams.forEach(s => {
            s.angle += s.curve;
            const endX = s.x + Math.cos(s.angle) * s.length;
            const endY = s.y + Math.sin(s.angle) * s.length;
            const grad = ctx.createLinearGradient(s.x, s.y, endX, endY);
            grad.addColorStop(0, `hsla(${s.hue}, 80%, 70%, 0)`);
            grad.addColorStop(0.5, `hsla(${s.hue}, 80%, 70%, ${s.alpha})`);
            grad.addColorStop(1, `hsla(${s.hue}, 80%, 70%, 0)`);
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(endX, endY);
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.width;
            ctx.stroke();
            s.x += Math.cos(s.angle) * s.speed;
            s.y += Math.sin(s.angle) * s.speed;
            if (s.x < -s.length || s.x > this.canvas.width + s.length ||
                s.y < -s.length || s.y > this.canvas.height + s.length) {
                s.x = Math.random() * this.canvas.width;
                s.y = Math.random() * this.canvas.height;
                s.angle = Math.random() * Math.PI * 2;
            }
        });

        this.dust.forEach(d => {
            d.pulse += d.pulseSpeed;
            const glow = Math.sin(d.pulse) * 0.3 + 0.7;
            const a = d.alpha * glow;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${d.hue}, 70%, 75%, ${a})`;
            ctx.fill();
            d.x += Math.cos(d.angle) * d.speed;
            d.y += Math.sin(d.angle) * d.speed;
            d.angle += (Math.random() - 0.5) * 0.01;
            if (d.x < -10) d.x = this.canvas.width + 10;
            if (d.x > this.canvas.width + 10) d.x = -10;
            if (d.y < -10) d.y = this.canvas.height + 10;
            if (d.y > this.canvas.height + 10) d.y = -10;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ============================================
// Cursor Effects
// ============================================
function initCursorEffects() {
    if (!window.matchMedia('(hover: hover)').matches) return;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursorGlow.style.left = mouseX + 'px';
        cursorGlow.style.top = mouseY + 'px';
        cursorGlow.style.opacity = '1';
        requestAnimationFrame(() => {
            cursorTrail.style.left = mouseX + 'px';
            cursorTrail.style.top = mouseY + 'px';
            cursorTrail.style.opacity = '1';
        });
    });

    document.addEventListener('mouseleave', () => {
        cursorGlow.style.opacity = '0';
        cursorTrail.style.opacity = '0';
    });

    const interactiveEls = document.querySelectorAll('a, button, .gallery-item, input, textarea');
    interactiveEls.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorTrail.style.width = '32px';
            cursorTrail.style.height = '32px';
            cursorTrail.style.borderColor = 'var(--accent-color)';
        });
        el.addEventListener('mouseleave', () => {
            cursorTrail.style.width = '20px';
            cursorTrail.style.height = '20px';
            cursorTrail.style.borderColor = 'var(--primary-color)';
        });
    });
}

// ============================================
// Scroll Effects
// ============================================
function initScrollEffects() {
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
                scrollProgress.style.width = scrollPercent + '%';

                if (scrollTop > 400) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }

                if (scrollTop > 30) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }

                updateActiveNavLink();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

function updateActiveNavLink() {
    let current = '';
    sections.forEach(section => {
        if (window.scrollY >= section.offsetTop - 200) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}

// ============================================
// Reveal Animations
// ============================================
function initRevealAnimations() {
    if (prefersReducedMotion) {
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ============================================
// Counter Animation (rAF-based)
// ============================================
function initCounterAnimation() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(num => observer.observe(num));
}

function animateCounter(element, target) {
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

// ============================================
// Gallery Tilt Effect
// ============================================
function initTiltEffect() {
    if (prefersReducedMotion) return;

    galleryItems.forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            item.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;

            // Highlight effect
            const inner = item.querySelector('.item-inner');
            if (inner) {
                const percentX = (x / rect.width) * 100;
                const percentY = (y / rect.height) * 100;
                inner.style.background = `radial-gradient(circle at ${percentX}% ${percentY}%, rgba(99, 102, 241, 0.08), var(--bg-card))`;
            }
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = '';
            const inner = item.querySelector('.item-inner');
            if (inner) inner.style.background = '';
        });
    });
}

// ============================================
// Smooth Scroll
// ============================================
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        const top = section.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Form with Validation
// ============================================
function initFormEffects() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = form.querySelector('#name');
        const email = form.querySelector('#email');
        const message = form.querySelector('#message');

        // Basic validation
        if (!name.value.trim()) { name.focus(); return; }
        if (!email.value.trim() || !email.value.includes('@')) { email.focus(); return; }
        if (!message.value.trim()) { message.focus(); return; }

        const btn = form.querySelector('.btn-submit');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>发送中...</span>';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = '<span>发送成功</span>';
            btn.style.background = 'var(--gradient-4)';

            setTimeout(() => {
                form.reset();
                btn.innerHTML = originalHTML;
                btn.style.background = '';
                btn.disabled = false;
            }, 2000);
        }, 1500);
    });
}

// ============================================
// Parallax Effect
// ============================================
function initParallaxEffect() {
    if (prefersReducedMotion) return;
    const floatingElements = document.querySelector('.floating-elements');
    if (!floatingElements || !window.matchMedia('(hover: hover)').matches) return;

    document.addEventListener('mousemove', (e) => {
        const moveX = (e.clientX - window.innerWidth / 2) * 0.015;
        const moveY = (e.clientY - window.innerHeight / 2) * 0.015;
        floatingElements.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
}

// ============================================
// Magnetic Buttons
// ============================================
function initMagneticButtons() {
    if (prefersReducedMotion || !window.matchMedia('(hover: hover)').matches) return;

    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-submit');
    buttons.forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            button.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });
}

// ============================================
// Text Scramble Effect
// ============================================
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        this.queue = [];

        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;

        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span class="scramble-char">${char}</span>`;
            } else {
                output += from;
            }
        }

        this.el.innerHTML = output;

        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
}

function initTextScramble() {
    if (prefersReducedMotion) return;

    const titleLines = document.querySelectorAll('.title-line');
    titleLines.forEach((line, index) => {
        const originalText = line.textContent;
        const scramble = new TextScramble(line);
        setTimeout(() => scramble.setText(originalText), 800 + (index * 250));
    });
}

// ============================================
// Keyboard Navigation
// ============================================
function initKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 't' || e.key === 'T') scrollToTop();
    });
}

// ============================================
// Newsletter Form
// ============================================
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input');
        const btn = form.querySelector('.btn-newsletter');

        if (!input.value.trim() || !input.value.includes('@')) {
            input.focus();
            return;
        }

        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span>已订阅</span>';
        btn.style.background = 'var(--gradient-4)';
        input.value = '';

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '';
        }, 2500);
    });
}

// ============================================
// Initialize
// ============================================
function init() {
    initLoader();
    initMobileNav();
    initCursorEffects();
    initScrollEffects();
    initRevealAnimations();
    initCounterAnimation();
    initTiltEffect();
    initFormEffects();
    initNewsletterForm();
    initParallaxEffect();
    initKeyboardNavigation();
    initMagneticButtons();
    initSubtitleCarousel();
    initClassicsLightbox();

    // Hero Canvas
    if (!prefersReducedMotion) {
        new HeroCanvas();
    }

    // Text scramble
    setTimeout(initTextScramble, 400);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ========== Lightbox 名画大图查看 ==========
function openLightbox(src, title, info) {
    const overlay = document.getElementById('lightbox');
    const img = document.getElementById('lightboxImage');
    const infoEl = document.getElementById('lightboxInfo');
    img.src = src;
    img.alt = title;
    infoEl.textContent = title + ' — ' + info;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const overlay = document.getElementById('lightbox');
    overlay.classList.remove('active');
    setTimeout(() => { document.getElementById('lightboxImage').src = ''; }, 400);
    document.body.style.overflow = '';
}

function initClassicsLightbox() {
    const overlay = document.getElementById('lightbox');
    const closeBtn = document.getElementById('lightboxClose');
    const content = document.getElementById('lightboxContent');
    if (!overlay) return;

    overlay.addEventListener('click', closeLightbox);
    closeBtn.addEventListener('click', closeLightbox);
    content.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

// Expose global functions
window.scrollToSection = scrollToSection;
window.scrollToTop = scrollToTop;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
