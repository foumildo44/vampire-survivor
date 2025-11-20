// ✅ FICHIER: src/managers/UpgradeManager.js
class UpgradeManager {
    constructor(gameManager) {
        this.game = gameManager;
        
        // Helper pour créer l'image HTML
        const img = (path) => `<img src="${path}" style="width:48px; height:48px; image-rendering: pixelated;">`;

        this.pool = [
            // ========================================
            // TIER COMMON
            // ========================================
            {
                id: 'heal',
                title: 'Potion de Vie',
                desc: 'Restaure immédiatement 50% de vos PV.',
                icon: img('./assets/sprites/heal.png'),
                rarity: 'common',
                effect: () => {
                    this.game.player.heal(this.game.player.maxHp * 0.5);
                }
            },
            {
                id: 'speed',
                title: 'Bottes de Vent',
                desc: 'Augmente la vitesse de déplacement de +10%.',
                icon: img('./assets/sprites/boost.png'),
                rarity: 'common',
                effect: () => { 
                    this.game.player.speed *= 1.1; 
                }
            },
            {
                id: 'maxhp',
                title: 'Cœur de Titan',
                desc: '+20 PV max et soigne complètement.',
                icon: img('./assets/sprites/heart.png'), // Réutilisation du coeur pour l'instant
                rarity: 'common',
                effect: () => {
                    this.game.player.maxHp += 20;
                    this.game.player.hp = this.game.player.maxHp;
                }
            },

            // ========================================
            // TIER RARE
            // ========================================
            {
                id: 'damage',
                title: 'Force Brute',
                desc: 'Augmente les dégâts de toutes vos armes de +20%.',
                icon: img('./assets/sprites/attack_slash.png'),
                rarity: 'rare',
                effect: () => { 
                    this.game.player.damageMult += 0.2; 
                }
            },
            {
                id: 'attack_speed',
                title: 'Dextérité',
                desc: 'Réduit le cooldown de vos attaques de 15%.',
                icon: img('./assets/sprites/arrow.png'),
                rarity: 'rare',
                effect: () => {
                    this.game.player.attackCooldown *= 0.85;
                }
            },

            // ========================================
            // TIER EPIC
            // ========================================
            {
                id: 'slash',
                title: 'Lame Spectrale',
                desc: 'Invoque une lame tournoyante qui repousse les ennemis.',
                icon: img('./assets/sprites/vfx/slash/slash_icon.png'), // Utilise une frame de l'effet
                rarity: 'epic',
                effect: () => { 
                    this.game.player.upgradeSlash(); 
                }
            },
            {
                id: 'lightning',
                title: 'Chaîne de Foudre',
                desc: 'Éclair qui saute entre ennemis. Dégâts massifs.',
                icon: img('./assets/sprites/vfx/lightning/lightning_icon.png'),
                rarity: 'epic',
                effect: () => { 
                    this.game.player.upgradeLightning(); 
                }
            },

            // ========================================
            // TIER LEGENDARY
            // ========================================
            {
                id: 'multishot',
                title: 'Multi-Canons',
                desc: 'Ajoute un projectile supplémentaire à vos tirs automatiques.',
                icon: img('./assets/sprites/fire_icon.png'),
                rarity: 'legendary',
                effect: () => { 
                    this.game.player.projectileCount = (this.game.player.projectileCount || 1) + 1;
                }
            },
            {
                id: 'super_lightning',
                title: 'Tempête Foudroyante',
                desc: 'Double les sauts de chaîne et les dégâts du Lightning.',
                icon: img('./assets/sprites/vfx/lightning/lightning_major_icon.png'),
                rarity: 'legendary',
                effect: () => {
                    if (this.game.player.lightningLevel > 0) {
                        this.game.player.lightningChainCount += 3;
                        this.game.player.lightningDamage *= 2;
                        this.game.player.lightningCooldown *= 0.5;
                    } else {
                        this.game.player.upgradeLightning();
                        this.game.player.lightningChainCount += 2;
                    }
                }
            }
        ];
    }

    getOptions(count = 3) {
        return this.getWeightedOptions(count);
    }

    selectUpgrade(upgrade) {
        upgrade.effect();
        this.game.soundManager.play('levelup'); // Utilise le nouveau wav si dispo
        console.log(`✅ Upgrade appliqué: ${upgrade.title}`);
        this.game.resumeGame();
    }

    getWeightedOptions(count = 3) {
        const weights = { common: 50, rare: 30, epic: 15, legendary: 5 };
        const weightedPool = [];
        this.pool.forEach(upgrade => {
            const weight = weights[upgrade.rarity] || 10;
            for (let i = 0; i < weight; i++) weightedPool.push(upgrade);
        });

        const selected = [];
        const usedIds = new Set();

        while (selected.length < count && weightedPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * weightedPool.length);
            const choice = weightedPool[randomIndex];
            
            if (!usedIds.has(choice.id)) {
                selected.push(choice);
                usedIds.add(choice.id);
            }
        }
        return selected;
    }
}

export default UpgradeManager;