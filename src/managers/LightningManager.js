// ⚡ FICHIER: src/managers/LightningManager.js
import Animator from '../utils/Animator.js';

class LightningManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.lightnings = [];
        
        // ========================================
        // MODE 1: Sprite Animé (si tu as des frames)
        // ========================================
        this.useSprites = true; // Passe à false pour utiliser Canvas pur
        
        // Animation de l'éclair (tu ajouteras tes sprites ici)
        // Exemple: lightning_0.png, lightning_1.png, etc.
        this.lightningAnimPath = './assets/sprites/vfx/lightning/lightning';
        this.lightningFrameCount = 4; // Nombre de frames dans ton sprite sheet
        
        // ========================================
        // MODE 2: Canvas pur (backup si pas de sprites)
        // ========================================
        this.canvasSprite = new Image();
        this.canvasSprite.src = './assets/sprites/vfx/lightning_icon.png';
    }

    spawnLightning(startX, startY, damage, chainCount) {
        const firstTarget = this.findNearestEnemy(startX, startY, null);
        if(!firstTarget) return;

        let chain = [{ x: startX, y: startY }];
        let currentTarget = firstTarget;
        let hitEnemies = new Set();

        // ========================================
        // Construction de la chaîne d'éclairs
        // ========================================
        for(let i = 0; i < chainCount && currentTarget; i++) {
            chain.push({ 
                x: currentTarget.x, 
                y: currentTarget.y, 
                enemy: currentTarget 
            });
            
            hitEnemies.add(currentTarget.id);
            
            // Dégâts avec réduction par saut (-20% par bond)
            if(currentTarget.takeDamage) {
                const damageMultiplier = Math.pow(0.8, i);
                currentTarget.takeDamage(damage * damageMultiplier);
            }

            // Prochain ennemi dans un rayon de 5 cases
            currentTarget = this.findNearestEnemy(
                currentTarget.x, 
                currentTarget.y, 
                hitEnemies, 
                5.0
            );
        }

        // ========================================
        // Stockage pour rendu avec animation
        // ========================================
        this.lightnings.push({
            chain: chain,
            life: 0.3, // Durée d'affichage (300ms)
            maxLife: 0.3,
            width: 3 + Math.random() * 2,
            
            // Animation sprite (si activée)
            animator: this.useSprites ? 
                new Animator(this.lightningAnimPath, this.lightningFrameCount, 0.04, false) : 
                null,
            
            // Effets visuels
            color: `hsl(${190 + Math.random() * 20}, 100%, 70%)`, // Bleu électrique variable
            intensity: 1.0
        });

        // Son d'éclair
        this.game.soundManager.play('shoot');
    }

    findNearestEnemy(x, y, excludeSet, maxRange = 15) {
        if(!this.game.enemies || this.game.enemies.length === 0) return null;

        let nearest = null;
        let minDist = maxRange;

        for(const enemy of this.game.enemies) {
            if(enemy.isDead) continue;
            if(excludeSet && excludeSet.has(enemy.id)) continue;

            const dist = Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2);
            if(dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    update(dt) {
        for(let i = this.lightnings.length - 1; i >= 0; i--) {
            const lightning = this.lightnings[i];
            
            lightning.life -= dt;
            lightning.intensity = lightning.life / lightning.maxLife; // Fade out
            
            // Update animation
            if(lightning.animator && !lightning.animator.isFinished) {
                lightning.animator.update(dt);
            }
            
            // Suppression
            if(lightning.life <= 0) {
                this.lightnings.splice(i, 1);
            }
        }
    }

    // ========================================
    // RENDU (2 modes disponibles)
    // ========================================
    render(ctx, renderer) {
        this.lightnings.forEach(lightning => {
            if (this.useSprites && lightning.animator) {
                this.renderWithSprites(ctx, renderer, lightning);
            } else {
                this.renderWithCanvas(ctx, renderer, lightning);
            }
        });
    }

    // ========================================
    // MODE 1: Rendu avec Sprites
    // ========================================
    renderWithSprites(ctx, renderer, lightning) {
        const currentFrame = lightning.animator.getCurrentFrame();
        if (!currentFrame || !currentFrame.complete) return;

        ctx.save();
        ctx.globalAlpha = lightning.intensity;

        // Dessine le sprite le long de chaque segment de la chaîne
        for(let i = 0; i < lightning.chain.length - 1; i++) {
            const start = lightning.chain[i];
            const end = lightning.chain[i + 1];
            
            const screenStart = renderer.worldToScreen(start.x, start.y);
            const screenEnd = renderer.worldToScreen(end.x, end.y);
            
            // Calcul angle et distance
            const dx = screenEnd.x - screenStart.x;
            const dy = screenEnd.y - screenStart.y;
            const angle = Math.atan2(dy, dx);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Positionnement et rotation du sprite
            ctx.translate(screenStart.x, screenStart.y);
            ctx.rotate(angle);
            
            // Étire le sprite sur la longueur
            const spriteScale = distance / currentFrame.width;
            ctx.drawImage(
                currentFrame, 
                0, 
                -currentFrame.height / 2, 
                currentFrame.width * spriteScale, 
                currentFrame.height
            );
            
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        }

        ctx.restore();
    }

    // ========================================
    // MODE 2: Rendu Canvas Pur (Backup)
    // ========================================
    renderWithCanvas(ctx, renderer, lightning) {
        ctx.save();
        
        // Paramètres visuels
        const alpha = lightning.intensity;
        ctx.strokeStyle = lightning.color.replace(')', `, ${alpha})`).replace('hsl', 'hsla');
        ctx.lineWidth = lightning.width;
        ctx.shadowBlur = 20 * alpha;
        ctx.shadowColor = lightning.color;
        ctx.lineCap = 'round';

        // Dessine la chaîne avec effet "zigzag"
        ctx.beginPath();
        for(let i = 0; i < lightning.chain.length; i++) {
            const point = lightning.chain[i];
            const screen = renderer.worldToScreen(point.x, point.y);
            
            // Ajoute du bruit électrique
            const offsetX = (Math.random() - 0.5) * 15 * alpha;
            const offsetY = (Math.random() - 0.5) * 15 * alpha;
            
            if(i === 0) {
                ctx.moveTo(screen.x, screen.y);
            } else {
                ctx.lineTo(screen.x + offsetX, screen.y + offsetY);
            }
        }
        ctx.stroke();
        
        // Deuxième passage plus fin pour le "core" brillant
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = lightning.width * 0.3;
        ctx.shadowBlur = 5;
        ctx.stroke();

        ctx.restore();
    }

    // ========================================
    // DEBUG: Affiche les points de chaîne
    // ========================================
    renderDebug(ctx, renderer) {
        this.lightnings.forEach(lightning => {
            lightning.chain.forEach(point => {
                const screen = renderer.worldToScreen(point.x, point.y);
                ctx.fillStyle = 'red';
                ctx.fillRect(screen.x - 3, screen.y - 3, 6, 6);
            });
        });
    }
}

export default LightningManager;