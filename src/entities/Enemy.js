// ✅ FICHIER: src/entities/Enemy.js
import Animator from '../utils/Animator.js';

class Enemy {
    constructor(gameManager, x, y, type = 'skeleton', isBoss = false, isElite = false) {
        this.game = gameManager;
        this.id = Math.random().toString(36).substr(2, 9);
        
        this.x = x; this.y = y; this.z = 0;
        this.type = type;
        this.isDead = false;
        this.isFacingLeft = false;
        this.isBoss = isBoss;
        
        // ⭐ NOUVEAU: SYSTÈME D'ÉLITES
        this.isElite = isElite;
        this.eliteType = null;
        
        this.showHealthBar = true;

        // Config Stats de base
        this.stats = {
            skeleton: { hp: 20, speed: 2.2, sprite: './assets/sprites/skeleton.png', scale: 1.3, xp: 10, animated: false },
            zombie:   { hp: 40, speed: 1.5, sprite: './assets/sprites/zombie.png',   scale: 1.5, xp: 20, animated: false },
            lizard:   { hp: 60, speed: 3.0, path: './assets/sprites/enemies/lizard/walk', count: 6, scale: 0.0, xp: 30, animated: true },
            demon:    { hp: 100, speed: 1.8, path: './assets/sprites/enemies/demon/walk', count: 6, scale: 1.9, xp: 50, animated: true },
            boss:     { hp: 500, speed: 1.5, path: './assets/sprites/enemies/demon/walk', count: 6, scale: 1.2, xp: 200, animated: true }
        };

        const data = this.stats[type] || this.stats.skeleton;
        
        // ========================================
        // ⭐ APPLICATION DES MODIFICATEURS D'ÉLITE
        // ========================================
        let hpMult = isBoss ? 5 : 1;
        let speedMult = isBoss ? 0.8 : 1;
        let scaleMult = isBoss ? 1.5 : 1;
        let xpMult = isBoss ? 10 : 1;
        
        if (isElite) {
            this.eliteType = this.randomEliteType();
            const eliteMods = this.getEliteModifiers(this.eliteType);
            
            hpMult *= eliteMods.hp;
            speedMult *= eliteMods.speed;
            scaleMult *= eliteMods.scale;
            xpMult *= eliteMods.xp;
        }

        this.hp = data.hp * hpMult;
        this.maxHp = this.hp;
        this.speed = data.speed * speedMult;
        this.scale = data.scale * scaleMult;
        this.xpValue = data.xp * xpMult;
        this.isAnimated = data.animated;

        // Chargement sprites
        if (this.isAnimated) {
            this.animator = new Animator(data.path, data.count, 0.1, true);
        } else {
            this.sprite = new Image();
            this.sprite.src = data.sprite;
        }

        // ⭐ EFFET VISUEL ÉLITE (aura colorée)
        this.auraPhase = 0;
    }

    // ========================================
    // ⭐ TYPES D'ÉLITES
    // ========================================
    randomEliteType() {
        const types = ['swift', 'tank', 'explosive'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getEliteModifiers(type) {
        const mods = {
            swift: {
                hp: 1.5,
                speed: 2.0,
                scale: 1.1,
                xp: 3,
                color: '#00ffff', // Cyan
                name: '⚡ Rapide'
            },
            tank: {
                hp: 3.0,
                speed: 0.7,
                scale: 1.3,
                xp: 4,
                color: '#ff6b6b', // Rouge
                name: '🛡️ Tank'
            },
            explosive: {
                hp: 2.0,
                speed: 1.2,
                scale: 1.2,
                xp: 5,
                color: '#ffeb3b', // Jaune
                name: '💥 Explosif'
            }
        };
        return mods[type] || mods.swift;
    }

    // ========================================
    // UPDATE
    // ========================================
    update(dt) {
        if (this.isDead) return;

        if (this.isAnimated) this.animator.update(dt);
        
        // Animation de l'aura pour élites
        if (this.isElite) {
            this.auraPhase += dt * 3;
        }

        const player = this.game.player;
        if (!player || player.isDead) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 0.5) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            const nextX = this.x + dirX * this.speed * dt;
            const nextY = this.y + dirY * this.speed * dt;

            if (this.game.levelManager.isWalkable(nextX, this.y)) this.x = nextX;
            if (this.game.levelManager.isWalkable(this.x, nextY)) this.y = nextY;

            this.isFacingLeft = (dirX < 0);
        } else {
            const damage = this.isBoss ? 20 : (this.isElite ? 15 : 10);
            player.takeDamage(damage * dt);
        }
    }

    // ========================================
    // TAKE DAMAGE
    // ========================================
    takeDamage(amount) {
        const actualDamage = Math.floor(amount);
        this.hp -= actualDamage;

        // Affiche les dégâts
        if (this.game.showDamageNumber) {
            this.game.showDamageNumber(this.x, this.y, actualDamage);
        }

        if (this.hp <= 0 && !this.isDead) {
            this.isDead = true;
            
            // ⭐ EFFETS DE MORT SPÉCIAUX
            if (this.isElite && this.eliteType === 'explosive') {
                // L'élite explosif fait des dégâts de zone à sa mort
                this.explodeOnDeath();
            }
            
            // Particules de mort
            if (this.game.particleManager) {
                const color = this.isElite ? this.getEliteModifiers(this.eliteType).color : '#ff4444';
                this.game.particleManager.spawnExplosion(this.x, this.y, 20, {
                    color: color,
                    minSpeed: 2,
                    maxSpeed: 6,
                    lifetime: 1.0
                });
            }
            
            // Drops
            this.game.dropManager.spawnDrop(this.x, this.y, 'xp', this.xpValue);
            
            if (this.isBoss) {
                for(let i = 0; i < 5; i++) {
                    this.game.dropManager.spawnDrop(
                        this.x + (Math.random()-0.5)*2, 
                        this.y + (Math.random()-0.5)*2, 
                        'gold', 50
                    );
                }
            } else if (this.isElite) {
                // Élites dropent toujours de l'or
                this.game.dropManager.spawnDrop(this.x, this.y, 'gold', 25);
            } else if (Math.random() < 0.1) {
                this.game.dropManager.spawnDrop(this.x, this.y, 'gold', 10);
            }
        }
    }

    // ========================================
    // 💥 EXPLOSION DE L'ÉLITE EXPLOSIF
    // ========================================
    explodeOnDeath() {
        const explosionRadius = 3.0;
        const explosionDamage = 50;
        
        // Dégâts au joueur si proche
        const player = this.game.player;
        const distToPlayer = Math.sqrt(
            (player.x - this.x) ** 2 + (player.y - this.y) ** 2
        );
        
        if (distToPlayer < explosionRadius) {
            player.takeDamage(explosionDamage * (1 - distToPlayer / explosionRadius));
        }
        
        // Dégâts aux autres ennemis
        this.game.enemies.forEach(enemy => {
            if (enemy.isDead || enemy.id === this.id) return;
            const dist = Math.sqrt(
                (enemy.x - this.x) ** 2 + (enemy.y - this.y) ** 2
            );
            if (dist < explosionRadius) {
                enemy.takeDamage(explosionDamage * (1 - dist / explosionRadius));
            }
        });
        
        // Grosse explosion visuelle
        if (this.game.particleManager) {
            this.game.particleManager.spawnExplosion(this.x, this.y, 50, {
                color: '#ffaa00',
                minSpeed: 3,
                maxSpeed: 12,
                minSize: 4,
                maxSize: 12,
                lifetime: 1.5
            });
        }
        
        this.game.soundManager.play('hit');
    }

    // ========================================
    // RENDER DATA
    // ========================================
    getRenderData() {
        if (this.isDead) return null;
        
        const currentImage = this.isAnimated ? this.animator.getCurrentFrame() : this.sprite;

        return {
            image: currentImage, 
            x: this.x, y: this.y, z: this.z,
            scale: this.scale, 
            flipX: this.isFacingLeft, 
            type: 'enemy',
            
            // Barres de vie
            showHealthBar: this.showHealthBar,
            hp: this.hp,
            maxHp: this.maxHp,
            isBoss: this.isBoss,
            
            // ⭐ DONNÉES ÉLITE (pour le rendu de l'aura)
            isElite: this.isElite,
            eliteType: this.eliteType,
            eliteColor: this.isElite ? this.getEliteModifiers(this.eliteType).color : null,
            auraPhase: this.auraPhase
        };
    }
}

export default Enemy;