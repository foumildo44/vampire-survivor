// ✅ FICHIER: src/managers/SpawnManager.js
import Enemy from '../entities/Enemy.js';

class SpawnManager {
    constructor(gameManager) {
        this.game = gameManager;
        this.timer = 0;
        this.waveTime = 0;
        
        // 🌊 SYSTÈME DE VAGUES
        this.currentWave = 0;
        this.isWaveActive = false;
        this.waveBreakDuration = 15; // 15 secondes de pause
        this.waveBreakTime = 0;
        this.enemiesPerWave = 10;
        this.enemiesSpawnedThisWave = 0;
        this.waveDifficulty = 1.0;
        
        // Configuration du spawn
        this.spawnRate = 2.0;
        this.minDistance = 8;
        this.maxDistance = 15;

        // 👑 BOSS SYSTEM
        this.bossSpawned = false;
        this.nextBossWave = 5;
        
        // ⭐ ÉLITES
        this.eliteChance = 0.1; // 10% de chance de base
    }

    update(dt) {
        // 🌊 GESTION DES VAGUES
        if (!this.isWaveActive) {
            this.waveBreakTime += dt;
            
            if (this.waveBreakTime >= this.waveBreakDuration) {
                this.startNewWave();
            }
            return;
        }

        // Spawn pendant la vague
        this.waveTime += dt;
        this.timer -= dt;

        // 👑 Boss aux vagues spéciales
        if (this.currentWave % this.nextBossWave === 0 && !this.bossSpawned) {
            this.spawnBoss();
            this.bossSpawned = true;
        }

        // Spawn normal
        if (this.timer <= 0 && this.enemiesSpawnedThisWave < this.enemiesPerWave) {
            this.spawnEnemy();
            this.enemiesSpawnedThisWave++;
            
            // Accélération du spawn au fil de la vague
            this.spawnRate = Math.max(0.3, 2.0 - (this.waveTime / 30));
            this.timer = this.spawnRate;
        }

        // 🏁 FIN DE VAGUE (tous les ennemis morts)
        if (this.enemiesSpawnedThisWave >= this.enemiesPerWave) {
            const aliveEnemies = this.game.enemies.filter(e => !e.isDead).length;
            if (aliveEnemies === 0) {
                this.endWave();
            }
        }
    }

    // 🌊 DÉMARRER UNE NOUVELLE VAGUE
    startNewWave() {
        this.currentWave++;
        this.isWaveActive = true;
        this.waveBreakTime = 0;
        this.waveTime = 0;
        this.enemiesSpawnedThisWave = 0;
        this.bossSpawned = false;
        
        // Difficulté progressive
        this.waveDifficulty = 1 + (this.currentWave * 0.15);
        this.enemiesPerWave = Math.floor(10 + (this.currentWave * 3));
        this.eliteChance = Math.min(0.4, 0.1 + (this.currentWave * 0.02));
        
        // Notification visuelle
        this.game.showWaveNotification(this.currentWave, this.enemiesPerWave);
        this.game.soundManager.play('levelup');
        
        console.log(`🌊 Vague ${this.currentWave} démarrée ! (${this.enemiesPerWave} ennemis)`);
    }

    // 🏁 TERMINER LA VAGUE
    endWave() {
        this.isWaveActive = false;
        
        // Récompenses
        const xpReward = Math.floor(50 * this.currentWave * this.waveDifficulty);
        const goldReward = Math.floor(25 * this.currentWave);
        
        this.game.player.gainXp(xpReward);
        // TODO: Ajouter l'or quand le système sera prêt
        
        // Notification de fin
        this.game.showWaveComplete(this.currentWave, xpReward, goldReward);
        this.game.soundManager.play('hit');
        
        console.log(`✅ Vague ${this.currentWave} terminée ! +${xpReward} XP, +${goldReward} OR`);
    }

    // 👑 SPAWN BOSS
    spawnBoss() {
        const player = this.game.player;
        if (!player) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = 12;
        
        const spawnX = player.x + Math.cos(angle) * distance;
        const spawnY = player.y + Math.sin(angle) * distance;

        if (this.game.levelManager.isWalkable(spawnX, spawnY)) {
            this.game.enemies.push(new Enemy(this.game, spawnX, spawnY, 'boss', true, false));
            this.game.soundManager.play('levelup');
            
            console.log('👑 BOSS SPAWNED !');
        }
    }

    // 🎯 SPAWN ENNEMI NORMAL
    spawnEnemy() {
        const player = this.game.player;
        if (!player) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = this.minDistance + Math.random() * (this.maxDistance - this.minDistance);
        
        const spawnX = player.x + Math.cos(angle) * distance;
        const spawnY = player.y + Math.sin(angle) * distance;

        if (this.game.levelManager.isWalkable(spawnX, spawnY)) {
            const type = this.chooseEnemyType();
            const isElite = Math.random() < this.eliteChance;
            
            this.game.enemies.push(new Enemy(this.game, spawnX, spawnY, type, false, isElite));
            
            if (isElite) {
                console.log('⭐ Élite spawné !');
            }
        }
    }

    chooseEnemyType() {
        const level = this.game.levelManager.levelIndex;
        const rand = Math.random();

        if (level === 1) {
            return rand < 0.7 ? 'skeleton' : 'zombie';
        } else if (level === 2) {
            return rand < 0.5 ? 'zombie' : 'lizard';
        } else {
            return rand < 0.6 ? 'lizard' : 'demon';
        }
    }
}

export default SpawnManager;