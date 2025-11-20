// ✨ FICHIER: src/managers/ParticleManager.js
class ParticleManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.particles = [];
    }

    // ========================================
    // EXPLOSION DE PARTICULES (Level Up, Mort)
    // ========================================
    spawnExplosion(x, y, count = 30, options = {}) {
        const defaults = {
            color: '#ffd700', // Or par défaut
            minSpeed: 2,
            maxSpeed: 8,
            minSize: 3,
            maxSize: 8,
            lifetime: 1.5,
            gravity: 5,
            fadeOut: true,
            glow: true
        };
        
        const opts = { ...defaults, ...options };

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = opts.minSpeed + Math.random() * (opts.maxSpeed - opts.minSpeed);
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: opts.minSize + Math.random() * (opts.maxSize - opts.minSize),
                color: opts.color,
                lifetime: opts.lifetime,
                maxLifetime: opts.lifetime,
                gravity: opts.gravity,
                fadeOut: opts.fadeOut,
                glow: opts.glow,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 10
            });
        }
    }

    // ========================================
    // PARTICULES LEVEL UP (Effet Spécial)
    // ========================================
    spawnLevelUpEffect(x, y) {
        // Explosion dorée principale
        this.spawnExplosion(x, y, 40, {
            color: '#ffd700',
            minSpeed: 3,
            maxSpeed: 10,
            minSize: 4,
            maxSize: 10,
            lifetime: 2.0,
            gravity: 3
        });

        // Particules blanches rapides
        this.spawnExplosion(x, y, 20, {
            color: '#ffffff',
            minSpeed: 8,
            maxSpeed: 15,
            minSize: 2,
            maxSize: 5,
            lifetime: 1.0,
            gravity: 1
        });

        // Étoiles lentes qui montent
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 2,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: -3 - Math.random() * 3,
                size: 6 + Math.random() * 4,
                color: '#ffeb3b',
                lifetime: 2.5,
                maxLifetime: 2.5,
                gravity: -1, // Monte vers le haut
                fadeOut: true,
                glow: true,
                rotation: 0,
                rotationSpeed: 5,
                star: true // Forme étoile
            });
        }
    }

    // ========================================
    // TRAIL (Traînée de particules)
    // ========================================
    spawnTrail(x, y, color = '#ff6b6b', size = 3) {
        this.particles.push({
            x: x + (Math.random() - 0.5) * 0.3,
            y: y + (Math.random() - 0.5) * 0.3,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: size,
            color: color,
            lifetime: 0.5,
            maxLifetime: 0.5,
            gravity: 0,
            fadeOut: true,
            glow: true,
            rotation: 0,
            rotationSpeed: 0
        });
    }

    // ========================================
    // PARTICULES D'IMPACT
    // ========================================
    spawnImpact(x, y, color = '#ff4444', count = 15) {
        this.spawnExplosion(x, y, count, {
            color: color,
            minSpeed: 2,
            maxSpeed: 6,
            minSize: 2,
            maxSize: 5,
            lifetime: 0.8,
            gravity: 8
        });
    }

    // ========================================
    // PARTICULES DE SOINS
    // ========================================
    spawnHealEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 1,
                y: y + Math.random() * 2,
                vx: (Math.random() - 0.5) * 1,
                vy: -2 - Math.random() * 2,
                size: 3 + Math.random() * 3,
                color: '#4caf50',
                lifetime: 1.5,
                maxLifetime: 1.5,
                gravity: -2,
                fadeOut: true,
                glow: true,
                rotation: 0,
                rotationSpeed: 3
            });
        }
    }

    // ========================================
    // UPDATE & CLEANUP
    // ========================================
    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Mouvement
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Gravité
            p.vy += p.gravity * dt;
            
            // Rotation
            p.rotation += p.rotationSpeed * dt;
            
            // Durée de vie
            p.lifetime -= dt;
            
            if (p.lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // ========================================
    // RENDER
    // ========================================
    render(ctx, renderer) {
        this.particles.forEach(p => {
            const screen = renderer.worldToScreen(p.x, p.y);
            
            ctx.save();
            ctx.translate(screen.x, screen.y);
            ctx.rotate(p.rotation);
            
            // Alpha (fade out)
            const alpha = p.fadeOut ? (p.lifetime / p.maxLifetime) : 1.0;
            
            // Glow effect
            if (p.glow) {
                ctx.shadowBlur = 10 * alpha;
                ctx.shadowColor = p.color;
            }
            
            // Dessin
            if (p.star) {
                this.drawStar(ctx, 0, 0, p.size, p.color, alpha);
            } else {
                ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(');
                // Fallback pour hex colors
                if (!ctx.fillStyle.includes('rgba')) {
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = p.color;
                }
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    // Helper pour dessiner une étoile
    drawStar(ctx, cx, cy, size, color, alpha) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size / 2;
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
    }
}

export default ParticleManager;