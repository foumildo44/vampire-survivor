// ✅ FICHIER: src/managers/ProjectileManager.js
import Animator from '../utils/Animator.js';

class ProjectileManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.projectiles = [];
        
        // On crée un animator "Modèle" qu'on clonera ou dont on partagera les images
        // Path: assets/sprites/vfx/fireball/fire_0.png
        this.basePath = './assets/sprites/vfx/fireball/fire';
    }

    spawnProjectile(startX, startY, target) {
        const angle = Math.atan2(target.y - startY, target.x - startX);
        
        this.projectiles.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * 30,
            vy: Math.sin(angle) * 30,
            life: 5.0,
            damage: 10,
            hitIds: [],
            // Chaque balle a son propre animateur pour ne pas être synchronisée
            animator: new Animator(this.basePath, 6, 0.08, true) 
        });
    }

    update(dt) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            
            // Mise à jour de l'animation
            p.animator.update(dt);

            if (p.life <= 0 || !this.game.levelManager.isWalkable(p.x, p.y)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            if(this.game.enemies) {
                for (const enemy of this.game.enemies) {
                    if (enemy.isDead || p.hitIds.includes(enemy.id)) continue;
                    const dist = Math.sqrt((p.x - enemy.x)**2 + (p.y - enemy.y)**2);
                    if (dist < 0.8) {
                        if (enemy.takeDamage) enemy.takeDamage(p.damage);
                        p.hitIds.push(enemy.id);
                        this.projectiles.splice(i, 1); 
                        break; 
                    }
                }
            }
        }
    }

    getRenderData() {
        return this.projectiles.map(p => ({
            image: p.animator.getCurrentFrame(),
            x: p.x, y: p.y, z: 0.8,
            scale: 0.04, // Ajusté pour les frames de feu
            type: 'projectile'
        }));
    }
}

export default ProjectileManager;