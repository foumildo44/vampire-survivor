// ✅ FICHIER: src/entities/Player.js
import { getAnimationDirection } from '../utils/Direction.js';
import Animator from '../utils/Animator.js';

class Player {
    constructor(gameManager) {
        this.game = gameManager;
        
        this.x = 0; this.y = 0; this.z = 0;
        this.scale = 0.24; 

        // Stats
        this.maxHp = 100;
        this.hp = this.maxHp;
        this.speed = 6.0;
        this.damageMult = 1.0;
        this.projectileCount = 1;

        // Progression
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 50; 

        // Auto-Attack
        this.attackCooldown = 0.6; 
        this.attackTimer = 0;

        // 🌀 SLASH
        this.slashLevel = 0; 
        this.slashTimer = 0;
        this.slashCooldown = 1.5;
        this.slashAnimator = new Animator('./assets/sprites/vfx/slash/slash', 12, 0.03, false);

        // ⚡ LIGHTNING
        this.lightningLevel = 0;
        this.lightningTimer = 0;
        this.lightningCooldown = 2.0;
        this.lightningDamage = 30;
        this.lightningChainCount = 3;

        // 💨 DASH (CORRIGÉ ET COMPLET)
        this.dashCooldown = 2.0;
        this.dashMaxCooldown = 3.0; // Pour l'UI
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashDuration = 0.2;
        this.dashSpeed = 15; // Vitesse du dash
        this.dashTime = 0; // Temps écoulé pendant le dash
        this.isInvulnerable = false;
        this.dashDirection = { x: 0, y: 0 }; // Direction du dash

        // Animation
        this.angle = Math.PI / 2; 
        this.isMoving = false;
        this.currentAnim = 'idle'; 
        this.flipX = false;
        this.currentSprite = null;

        this.sprites = {
            idle: { front: new Image(), back: new Image(), side: new Image(), quarter: new Image() },
            run: { front: new Image(), back: new Image(), side: new Image(), quarter: new Image() },
            dash: { front: new Image(), back: new Image(), side: new Image(), quarter: new Image() }
        };
        this.loadSprites();
        this.isDead = false;
    }

    loadSprites() {
        const path = './assets/sprites/hero/';
        ['front', 'back', 'side', 'quarter'].forEach(dir => {
            this.sprites.idle[dir].src = `${path}idle/idle_${dir}.png`;
            this.sprites.run[dir].src = `${path}run/run_${dir}.png`;
            this.sprites.dash[dir].src = `${path}dash/dash_${dir}.png`;
        });
        this.currentSprite = this.sprites.idle.front;
    }

    update(dt) {
        if (this.isDead) return;
        
        const input = this.game.input.getMovementVector();
        const level = this.game.levelManager;

        // ========================================
        // 💨 GESTION DU DASH
        // ========================================
        this.dashTimer = Math.max(0, this.dashTimer - dt);
        
        // Détection input dash (Espace)
        if (this.game.input.keys.dash && this.dashTimer <= 0 && !this.isDashing) {
            this.startDash(input);
        }

        // Mise à jour du dash en cours
        if (this.isDashing) {
            this.dashTime += dt;
            
            // Mouvement ultra-rapide
            const moveX = this.dashDirection.x * this.dashSpeed * dt;
            const moveY = this.dashDirection.y * this.dashSpeed * dt;
            
            const nextX = this.x + moveX;
            const nextY = this.y + moveY;
            
            if (level.isWalkable(nextX, this.y)) this.x = nextX;
            if (level.isWalkable(this.x, nextY)) this.y = nextY;

            // Fin du dash
            if (this.dashTime >= this.dashDuration) {
                this.endDash();
            }
        } 
        // ========================================
        // Mouvement Normal
        // ========================================
        else {
            this.isMoving = (input.x !== 0 || input.y !== 0);

            if (this.isMoving) {
                let nextX = this.x + (input.x * this.speed * dt);
                if (level.isWalkable(nextX, this.y)) this.x = nextX;
                
                let nextY = this.y + (input.y * this.speed * dt);
                if (level.isWalkable(this.x, nextY)) this.y = nextY;
                
                this.angle = Math.atan2(input.y, input.x);
            }
        }

        this.updateAnimationState();
        this.updateDashUI();

        // ========================================
        // ARMES
        // ========================================
        
        // Fireball
        this.attackTimer -= dt;
        if (this.attackTimer <= 0) {
            this.attackNearestEnemy();
            this.attackTimer = this.attackCooldown;
        }

        // Slash
        if (this.slashLevel > 0) {
            this.slashTimer -= dt;
            if (!this.slashAnimator.isFinished) {
                this.slashAnimator.update(dt);
            }
            if (this.slashTimer <= 0) {
                this.performSlash();
                this.slashTimer = this.slashCooldown;
            }
        }

        // Lightning
        if (this.lightningLevel > 0) {
            this.lightningTimer -= dt;
            if (this.lightningTimer <= 0) {
                this.castLightning();
                this.lightningTimer = this.lightningCooldown;
            }
        }
    }

    // ========================================
    // 💨 DASH METHODS
    // ========================================
    startDash(input) {
        // Direction: utilise input ou direction actuelle
        if (input.x !== 0 || input.y !== 0) {
            this.dashDirection = { x: input.x, y: input.y };
        } else {
            // Si aucun input, dash dans la direction où on regarde
            this.dashDirection = {
                x: Math.cos(this.angle),
                y: Math.sin(this.angle)
            };
        }

        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashTime = 0;
        this.dashTimer = this.dashMaxCooldown;
        
        // Son de dash
        this.game.soundManager.play('shoot');
        
        console.log("💨 Dash activé !");
    }

    endDash() {
        this.isDashing = false;
        this.isInvulnerable = false;
        console.log("💨 Dash terminé");
    }

    updateDashUI() {
        const indicator = document.getElementById('dash-indicator');
        const fill = document.getElementById('dash-cooldown-fill');
        
        if (!indicator || !fill) return;

        const pct = Math.max(0, 1 - (this.dashTimer / this.dashMaxCooldown));
        fill.style.width = `${pct * 100}%`;

        if (this.dashTimer <= 0) {
            indicator.classList.add('ready');
        } else {
            indicator.classList.remove('ready');
        }
    }

    // ========================================
    // ATTACKS
    // ========================================
    attackNearestEnemy() {
        if (!this.game.enemies || this.game.enemies.length === 0) return;
        
        for(let i = 0; i < this.projectileCount; i++) {
            setTimeout(() => {
                let nearest = null, minDist = 20;
                for (const enemy of this.game.enemies) {
                    if (enemy.isDead) continue;
                    const dist = Math.sqrt((this.x - enemy.x)**2 + (this.y - enemy.y)**2);
                    if (dist < minDist) { minDist = dist; nearest = enemy; }
                }
                if (nearest) {
                    this.game.projectileManager.spawnProjectile(this.x, this.y, nearest);
                    this.game.soundManager.play('shoot');
                }
            }, i * 100);
        }
    }

    performSlash() {
        this.slashAnimator.reset();
        
        const range = 3.0 + (this.slashLevel * 0.5); 
        const damage = 25 * this.damageMult;

        this.game.enemies.forEach(enemy => {
            if(enemy.isDead) return;
            const dist = Math.sqrt((this.x - enemy.x)**2 + (this.y - enemy.y)**2);
            if (dist < range) {
                if(enemy.takeDamage) {
                    enemy.takeDamage(damage);
                    
                    // Affiche les dégâts (NOUVEAU)
                    this.game.showDamageNumber(enemy.x, enemy.y, Math.floor(damage));
                }
                
                const pushAngle = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                enemy.x += Math.cos(pushAngle) * 1.5;
                enemy.y += Math.sin(pushAngle) * 1.5;
            }
        });
        this.game.soundManager.play('hit');
    }

    castLightning() {
        if (!this.game.enemies || this.game.enemies.length === 0) return;

        let firstTarget = null;
        let minDist = 15;

        for (const enemy of this.game.enemies) {
            if (enemy.isDead) continue;
            const dist = Math.sqrt((this.x - enemy.x)**2 + (this.y - enemy.y)**2);
            if (dist < minDist) {
                minDist = dist;
                firstTarget = enemy;
            }
        }

        if (!firstTarget) return;

        const totalChains = this.lightningChainCount + Math.floor(this.lightningLevel * 0.5);
        const baseDamage = this.lightningDamage * (1 + this.lightningLevel * 0.2) * this.damageMult;

        this.game.lightningManager.spawnLightning(this.x, this.y, baseDamage, totalChains);
        this.game.soundManager.play('shoot');
    }

    // ========================================
    // UPGRADES
    // ========================================
    upgradeLightning() {
        if (this.lightningLevel === 0) {
            this.lightningLevel = 1;
            this.lightningTimer = 0;
        } else {
            this.lightningLevel++;
            this.lightningCooldown *= 0.9;
            this.lightningChainCount++;
        }
    }

    upgradeSlash() {
        this.slashLevel++;
        this.slashCooldown *= 0.85;
        this.slashTimer = 0.1;
    }

    upgradeDash() {
        this.dashMaxCooldown *= 0.8; // -20% cooldown
        this.dashDuration += 0.05; // +0.05s de durée
        console.log("💨 Dash amélioré !");
    }

    // ========================================
    // XP
    // ========================================
    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
        this.game.triggerLevelUp(); 
    }

    // ========================================
    // HELPERS
    // ========================================
    heal(amount) { 
        this.hp = Math.min(this.hp + amount, this.maxHp); 
    }
    
    takeDamage(amount) { 
        if (this.isInvulnerable) return;
        this.hp -= amount; 
        if(this.hp <= 0) { 
            this.isDead = true; 
        }
    }
    
    updateAnimationState() {
        if (this.isDashing) {
            this.currentAnim = 'dash';
        } else {
            this.currentAnim = this.isMoving ? 'run' : 'idle';
        }
        
        const animData = getAnimationDirection(this.angle);
        this.flipX = animData.flipX;
        const spriteSet = this.sprites[this.currentAnim];
        if (spriteSet && spriteSet[animData.direction]) {
            this.currentSprite = spriteSet[animData.direction];
        }
    }

    getRenderData() {
        if (this.isDead) return null;
        
        const showSlash = !this.slashAnimator.isFinished;
        
        return {
            image: this.currentSprite || this.sprites.idle.front, 
            x: this.x, y: this.y, z: this.z,
            scale: this.scale, 
            flipX: this.flipX, 
            type: 'player',
            slashImage: showSlash ? this.slashAnimator.getCurrentFrame() : null
        };
    }
}

export default Player;