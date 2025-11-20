// ✅ FICHIER: src/managers/DropManager.js
class DropManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.drops = [];
        
        // Images des drops
        this.sprites = {
            xp: new Image(),
            gold: new Image(),
            health: new Image()
        };
        
        // Assure-toi d'avoir ces images dans assets/sprites/ (tu les avais dans ton premier envoi)
        this.sprites.xp.src = './assets/sprites/xp_gem.png';
        this.sprites.gold.src = './assets/sprites/coin.png';
        this.sprites.health.src = './assets/sprites/heart.png';
    }

    spawnDrop(x, y, type, value) {
        this.drops.push({
            x: x + (Math.random() - 0.5) * 0.5, // Légère dispersion
            y: y + (Math.random() - 0.5) * 0.5,
            z: 0,
            type: type,   // 'xp', 'gold', 'health'
            value: value, // Combien ça donne
            life: 30.0,   // Disparait après 30s
            magnet: false // Est-ce qu'il est en train d'être aspiré ?
        });
    }

    update(dt) {
        const player = this.game.player;
        if (!player || player.isDead) return;

        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            
            // Distance avec le joueur
            const dx = player.x - drop.x;
            const dy = player.y - drop.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            // Rayon de ramassage (Magnet) = 3 cases
            if (dist < 3.0) {
                drop.magnet = true;
            }

            if (drop.magnet) {
                // Aspiration rapide vers le joueur
                drop.x += dx * 5 * dt;
                drop.y += dy * 5 * dt;

                // Collecte
                if (dist < 0.5) {
                    this.collect(drop);
                    this.drops.splice(i, 1);
                    continue;
                }
            } else {
                // Vieillissement
                drop.life -= dt;
                if (drop.life <= 0) this.drops.splice(i, 1);
            }
        }
    }

    collect(drop) {
        if (drop.type === 'xp') {
            this.game.player.gainXp(drop.value);
        } else if (drop.type === 'gold') {
            // On ajoutera la gestion de l'or plus tard dans SaveManager
            console.log("Or + " + drop.value);
        } else if (drop.type === 'health') {
            this.game.player.heal(drop.value);
        }
    }

    getRenderData() {
        return this.drops.map(d => ({
            image: this.sprites[d.type],
            x: d.x, y: d.y, z: 0.2 + Math.sin(Date.now() / 200) * 0.1, // Petit effet de flottement
            scale: 0.04,
            type: 'drop'
        }));
    }
}

export default DropManager;