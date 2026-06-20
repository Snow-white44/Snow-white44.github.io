/**
 * 梦境艺术 - Dreamscape Art
 * Advanced Particle System v3.0 - Cyberpunk Style
 */

// Simplex Noise
class SimplexNoise {
    constructor(seed = Math.random()) {
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        this.perm = new Uint8Array(512);
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        let n, q;
        for (let i = 255; i > 0; i--) {
            seed = (seed * 16807 + 0) % 2147483647;
            n = (seed % (i + 1) + i + 1) % (i + 1);
            q = p[i]; p[i] = p[n]; p[n] = q;
        }
        for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
    }
    noise2D(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s), j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const x0 = xin - (i - t), y0 = yin - (j - t);
        const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
        const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
        const ii = i & 255, jj = j & 255;
        const dot = (g, x, y) => g[0] * x + g[1] * y;
        let n0 = 0, n1 = 0, n2 = 0;
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot(this.grad3[this.perm[ii + this.perm[jj]] % 12], x0, y0); }
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot(this.grad3[this.perm[ii + i1 + this.perm[jj + j1]] % 12], x1, y1); }
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot(this.grad3[this.perm[ii + 1 + this.perm[jj + 1]] % 12], x2, y2); }
        return 70 * (n0 + n1 + n2);
    }
}

class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.noise = new SimplexNoise();
        this.particles = [];
        this.layerBuckets = [[], [], []];
        this.bursts = [];
        this.mouse = { x: null, y: null, radius: 200 };
        this.time = 0;
        this.hueShift = 0;
        this.running = true;
        this.cellSize = 120;

        // Adaptive particle count
        const isMobile = window.innerWidth < 768;
        const isLowPerf = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
        const factor = isMobile ? 0.3 : isLowPerf ? 0.5 : 1;

        this.layers = [
            { count: Math.floor(180 * factor), minSize: 0.5, maxSize: 1.8, speed: 0.3, opacity: 0.35, type: 'star' },
            { count: Math.floor(70 * factor), minSize: 1.5, maxSize: 3.5, speed: 0.6, opacity: 0.6, type: 'glow' },
            { count: Math.floor(12 * factor), minSize: 3, maxSize: 6, speed: 0.4, opacity: 0.85, type: 'orb' }
        ];

        this.connectionDistance = 130;

        this.init();
        this.animate();
        this.addEventListeners();
    }

    init() {
        this.resize();
        this.createAllParticles();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createAllParticles() {
        this.particles = [];
        this.layerBuckets = [[], [], []];

        // 科技感颜色方案 - 以青色、紫色、洋红为主
        const baseColors = [
            { h: 180, s: 100, l: 50 },  // 青色 #00f0ff
            { h: 280, s: 100, l: 50 },  // 紫色 #b000ff
            { h: 340, s: 100, l: 50 },  // 洋红 #ff003c
            { h: 160, s: 100, l: 50 },  // 绿色 #00ff88
            { h: 200, s: 80, l: 60 },   // 浅蓝
        ];

        this.layers.forEach((layer, layerIdx) => {
            for (let i = 0; i < layer.count; i++) {
                const color = baseColors[Math.floor(Math.random() * baseColors.length)];
                const p = {
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    size: layer.minSize + Math.random() * (layer.maxSize - layer.minSize),
                    color: color,
                    hsl: `hsla(${color.h}, ${color.s}%, ${color.l}%, `,
                    opacity: (0.3 + Math.random() * 0.5) * layer.opacity,
                    baseOpacity: (0.3 + Math.random() * 0.5) * layer.opacity,
                    layer: layerIdx,
                    type: layer.type,
                    speed: layer.speed,
                    noiseOffX: Math.random() * 1000,
                    noiseOffY: Math.random() * 1000 + 1000,
                    pulse: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.01 + Math.random() * 0.03,
                    trail: [],
                    trailLength: layerIdx === 2 ? 8 : layerIdx === 1 ? 3 : 0,
                    spiral: Math.random() < 0.15,
                    spiralRadius: 50 + Math.random() * 100,
                    spiralAngle: Math.random() * Math.PI * 2,
                    spiralSpeed: 0.005 + Math.random() * 0.01,
                    vx: 0, vy: 0
                };
                this.particles.push(p);
                this.layerBuckets[layerIdx].push(p);
            }
        });
    }

    updateParticle(p) {
        const timeScale = this.time * 0.0003;
        const nx = this.noise.noise2D(p.noiseOffX + timeScale, p.noiseOffY) * p.speed;
        const ny = this.noise.noise2D(p.noiseOffX, p.noiseOffY + timeScale) * p.speed;

        if (p.spiral) {
            p.spiralAngle += p.spiralSpeed;
            p.vx = (nx + Math.cos(p.spiralAngle) * p.spiralRadius * 0.01) * 0.5;
            p.vy = (ny + Math.sin(p.spiralAngle) * p.spiralRadius * 0.01) * 0.5;
        } else {
            p.vx = nx;
            p.vy = ny;
        }

        // Mouse interaction
        if (this.mouse.x !== null) {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.mouse.radius) {
                const force = (this.mouse.radius - dist) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);

                if (p.layer === 2) {
                    p.vx += Math.cos(angle) * force * 1.5;
                    p.vy += Math.sin(angle) * force * 1.5;
                } else {
                    const swirlAngle = angle + Math.PI * 0.5;
                    p.vx += Math.cos(swirlAngle) * force * 1.2;
                    p.vy += Math.sin(swirlAngle) * force * 1.2;
                    p.vx += Math.cos(angle) * force * 0.3;
                    p.vy += Math.sin(angle) * force * 0.3;
                }
                p.opacity = Math.min(1, p.baseOpacity + force * 0.4);
            } else {
                p.opacity += (p.baseOpacity - p.opacity) * 0.02;
            }
        }

        p.x += p.vx;
        p.y += p.vy;

        const margin = 50;
        if (p.x < -margin) p.x = this.canvas.width + margin;
        if (p.x > this.canvas.width + margin) p.x = -margin;
        if (p.y < -margin) p.y = this.canvas.height + margin;
        if (p.y > this.canvas.height + margin) p.y = -margin;

        p.pulse += p.pulseSpeed;

        if (p.trailLength > 0) {
            p.trail.unshift({ x: p.x, y: p.y });
            if (p.trail.length > p.trailLength) p.trail.pop();
        }

        p.color.h += this.hueShift * 0.01;
        p.hsl = `hsla(${p.color.h}, ${p.color.s}%, ${p.color.l}%, `;
    }

    drawParticle(p) {
        const ctx = this.ctx;
        const gi = Math.sin(p.pulse) * 0.2 + 0.8;

        // Trail with neon effect
        if (p.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i++) ctx.lineTo(p.trail[i].x, p.trail[i].y);
            ctx.strokeStyle = p.hsl + (p.opacity * gi * 0.3) + ')';
            ctx.lineWidth = p.size * 0.5;
            ctx.stroke();

            // Add glow to trail
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.hsl + '0.5)';
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (p.type === 'orb') {
            const r = p.size * gi;
            // Outer glow with cyberpunk color
            const g3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
            g3.addColorStop(0, p.hsl + (p.opacity * 0.15) + ')');
            g3.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 6, 0, Math.PI * 2);
            ctx.fillStyle = g3; ctx.fill();
            // Mid glow
            const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
            g2.addColorStop(0, p.hsl + (p.opacity * 0.4) + ')');
            g2.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
            ctx.fillStyle = g2; ctx.fill();
            // Core with bright center
            const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
            g1.addColorStop(0, `hsla(${p.color.h}, 100%, 90%, ${p.opacity * gi})`);
            g1.addColorStop(0.3, p.hsl + (p.opacity * gi) + ')');
            g1.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = g1; ctx.fill();

        } else if (p.type === 'glow') {
            const r = p.size * gi;
            const gradient = ctx.createRadialGradient(p.x, p.y, r * 0.3, p.x, p.y, r * 2.5);
            gradient.addColorStop(0, p.hsl + (p.opacity * 0.5) + ')');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = gradient; ctx.fill();
            ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = p.hsl + (p.opacity * gi) + ')';
            ctx.fill();

        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * gi, 0, Math.PI * 2);
            ctx.fillStyle = p.hsl + (p.opacity * gi) + ')';
            ctx.fill();
        }
    }

    drawConnections() {
        const ctx = this.ctx;
        const grid = {};

        this.particles.forEach((p, i) => {
            const cx = (p.x / this.cellSize) | 0;
            const cy = (p.y / this.cellSize) | 0;
            const key = cx * 10000 + cy;
            if (!grid[key]) grid[key] = [];
            grid[key].push(i);
        });

        const drawn = new Set();
        const cd = this.connectionDistance;

        this.particles.forEach((p, i) => {
            const cx = (p.x / this.cellSize) | 0;
            const cy = (p.y / this.cellSize) | 0;

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const key = (cx + dx) * 10000 + (cy + dy);
                    const bucket = grid[key];
                    if (!bucket) continue;

                    for (let k = 0; k < bucket.length; k++) {
                        const j = bucket[k];
                        if (j <= i) continue;
                        const pairKey = i * 100000 + j;
                        if (drawn.has(pairKey)) continue;
                        drawn.add(pairKey);

                        const p2 = this.particles[j];
                        const dx2 = p.x - p2.x;
                        const dy2 = p.y - p2.y;
                        const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

                        if (dist < cd) {
                            const alpha = (1 - dist / cd) * 0.15;
                            const grad = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
                            grad.addColorStop(0, p.hsl + alpha + ')');
                            grad.addColorStop(1, p2.hsl + alpha + ')');
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(p2.x, p2.y);
                            ctx.strokeStyle = grad;
                            ctx.lineWidth = 0.5 + alpha;
                            ctx.stroke();
                        }
                    }
                }
            }
        });
    }

    drawMouseConnections() {
        if (this.mouse.x === null) return;
        const ctx = this.ctx;

        // Draw a subtle circle at mouse position
        const time = this.time * 0.001;
        const pulseSize = 3 + Math.sin(time * 3) * 1;

        ctx.beginPath();
        ctx.arc(this.mouse.x, this.mouse.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.fill();

        // Draw connections to nearby particles
        this.particles.forEach(p => {
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.mouse.radius) {
                const alpha = (1 - dist / this.mouse.radius) * 0.25;
                const grad = ctx.createLinearGradient(this.mouse.x, this.mouse.y, p.x, p.y);
                grad.addColorStop(0, `rgba(0, 240, 255, ${alpha})`);
                grad.addColorStop(1, p.hsl + alpha + ')');
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(this.mouse.x, this.mouse.y);
                ctx.strokeStyle = grad;
                ctx.lineWidth = 0.7 + alpha;
                ctx.stroke();
            }
        });
    }

    createBurst(x, y) {
        const count = 18 + ((Math.random() * 12) | 0);
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
            const speed = 2 + Math.random() * 5;
            // Use cyberpunk colors for bursts
            const hues = [180, 280, 340, 160];
            const hue = hues[Math.floor(Math.random() * hues.length)];
            this.bursts.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.01,
                size: 1.5 + Math.random() * 3,
                hsl: `hsla(${hue}, 100%, 50%, `
            });
        }
        this.bursts.push({
            x, y, vx: 0, vy: 0,
            life: 1, decay: 0.012,
            size: 0, maxSize: 140 + Math.random() * 70,
            ring: true,
            hsl: 'hsla(180, 100%, 50%, '
        });
    }

    updateBursts() {
        for (let i = this.bursts.length - 1; i >= 0; i--) {
            const b = this.bursts[i];
            if (b.ring) {
                b.size += (b.maxSize - b.size) * 0.06;
            } else {
                b.x += b.vx; b.y += b.vy;
                b.vx *= 0.96; b.vy *= 0.96;
            }
            b.life -= b.decay;
            if (b.life <= 0) this.bursts.splice(i, 1);
        }
    }

    drawBursts() {
        const ctx = this.ctx;
        this.bursts.forEach(b => {
            if (b.ring) {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
                ctx.strokeStyle = b.hsl + (b.life * 0.5) + ')';
                ctx.lineWidth = 2 * b.life;
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size * b.life, 0, Math.PI * 2);
                ctx.fillStyle = b.hsl + (b.life * 0.8) + ')';
                ctx.fill();
            }
        });
    }

    // Draw hexagonal grid pattern in background
    drawHexGrid() {
        const ctx = this.ctx;
        const size = 30;
        const h = size * Math.sqrt(3);
        const time = this.time * 0.0001;

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
        ctx.lineWidth = 0.5;

        for (let y = -h; y < this.canvas.height + h; y += h) {
            for (let x = -size; x < this.canvas.width + size * 2; x += size * 1.5) {
                const offsetX = ((y / h) | 0) % 2 === 0 ? 0 : size * 0.75;
                const cx = x + offsetX;
                const cy = y;

                // Only draw some hexagons based on noise
                const noiseVal = this.noise.noise2D(cx * 0.005 + time, cy * 0.005);
                if (noiseVal > 0.2) {
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI / 3) * i - Math.PI / 6;
                        const px = cx + size * 0.5 * Math.cos(angle);
                        const py = cy + size * 0.5 * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }
    }

    animate(timestamp = 0) {
        if (!this.running) return;

        const ctx = this.ctx;
        this.time = timestamp;
        this.hueShift = Math.sin(timestamp * 0.0001) * 15;

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw subtle hex grid background
        this.drawHexGrid();

        // Update all particles
        for (let i = 0; i < this.particles.length; i++) {
            this.updateParticle(this.particles[i]);
        }

        // Draw connections
        this.drawConnections();
        this.drawMouseConnections();

        // Draw by layer using pre-sorted buckets (no filter)
        for (let l = 0; l < 3; l++) {
            const bucket = this.layerBuckets[l];
            for (let i = 0; i < bucket.length; i++) {
                this.drawParticle(bucket[i]);
            }
        }

        // Bursts
        this.updateBursts();
        this.drawBursts();

        requestAnimationFrame((t) => this.animate(t));
    }

    addEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        window.addEventListener('mousedown', (e) => this.createBurst(e.clientX, e.clientY));

        window.addEventListener('resize', () => {
            this.resize();
            this.createAllParticles();
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouse.x = e.touches[0].clientX;
                this.mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        window.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                this.createBurst(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        // Visibility API - pause when tab hidden
        document.addEventListener('visibilitychange', () => {
            this.running = !document.hidden;
            if (this.running) this.animate();
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        new ParticleSystem();
    }
});
