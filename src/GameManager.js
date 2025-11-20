// ✅ FICHIER: src/GameManager.js
import Loop from './Loop.js';
import Renderer from './managers/Renderer.js';
import InputManager from './managers/InputManager.js';
import SaveManager from './managers/SaveManager.js';
import InventoryManager from './managers/InventoryManager.js';
import LevelManager from './managers/LevelManager.js';
import SpawnManager from './managers/SpawnManager.js';
import ProjectileManager from './managers/ProjectileManager.js';
import DropManager from './managers/DropManager.js';
import SoundManager from './managers/SoundManager.js';
import UpgradeManager from './managers/UpgradeManager.js';
import ParticleManager from './managers/ParticleManager.js'; // ✨ NOUVEAU
import Player from './entities/Player.js';
import Enemy from './entities/Enemy.js';
import LightningManager from './managers/LightningManager.js';

class GameManager {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.input = new InputManager();
        this.saveManager = new SaveManager();
        this.inventoryManager = new InventoryManager(this);
        this.soundManager = new SoundManager();
        this.upgradeManager = new UpgradeManager(this);
        this.particleManager = new ParticleManager(this); // ✨ NOUVEAU
        
        this.currentLevelIndex = 1; 
        this.levelManager = new LevelManager(this, this.currentLevelIndex);
        this.player = new Player(this);
        this.enemies = [];
        
        this.spawnManager = new SpawnManager(this);
        this.projectileManager = new ProjectileManager(this);
        this.dropManager = new DropManager(this);
        this.lightningManager = new LightningManager(this);

        const spawn = this.levelManager.getSpawnPoint();
        this.player.x = spawn.x;
        this.player.y = spawn.y;

        this.isPaused = false;
        this.loop = new Loop(this);

        // 📊 STATS DE SESSION
        this.stats = {
            kills: 0,
            timeElapsed: 0
        };

        // 🗺️ Mini-map
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // 📊 INDICATEURS DE DÉGÂTS
        this.damageNumbers = [];

        // 🌊 NOTIFICATIONS UI (NOUVEAU)
        this.notifications = [];

        this.initUI();
    }

    initUI() {
        document.getElementById('resume-btn').onclick = () => this.togglePause();
        document.getElementById('quit-btn').onclick = () => {
            if(confirm('Voulez-vous vraiment quitter ? La progression sera perdue.')) {
                location.reload();
            }
        };
    }

    init() {
        this.renderer.resize(window.innerWidth, window.innerHeight);
        window.addEventListener('resize', () => this.renderer.resize(window.innerWidth, window.innerHeight));
        window.addEventListener('click', () => this.soundManager.startMusic(), { once: true });
        
        window.addEventListener('keydown', (e) => {
            if(e.code === 'Escape') this.togglePause();
        });

        this.loop.start();
    }

    togglePause() {
        if(document.getElementById('levelup-screen').classList.contains('hidden')) {
            this.isPaused = !this.isPaused;
            const menu = document.getElementById('pause-menu');
            if(this.isPaused) {
                menu.classList.remove('hidden');
            } else {
                menu.classList.add('hidden');
            }
        }
    }

    // ========================================
    // 🆙 LEVEL UP (avec particules)
    // ========================================
    triggerLevelUp() {
        this.isPaused = true;
        
        // ✨ EFFET VISUEL
        this.particleManager.spawnLevelUpEffect(this.player.x, this.player.y);
        
        const options = this.upgradeManager.getOptions(3);
        const container = document.getElementById('upgrade-container');
        container.innerHTML = '';

        options.forEach(opt => {
            const card = document.createElement('div');
            card.className = 'upgrade-card';
            card.setAttribute('data-rarity', opt.rarity);
            card.innerHTML = `
                <div class="card-icon">${opt.icon}</div>
                <div class="card-title">${opt.title}</div>
                <div class="card-desc">${opt.desc}</div>
            `;
            card.onclick = () => {
                card.style.transform = "scale(0.95)";
                setTimeout(() => this.upgradeManager.selectUpgrade(opt), 100);
            };
            container.appendChild(card);
        });

        const screen = document.getElementById('levelup-screen');
        screen.classList.remove('hidden');
    }

    resumeGame() {
        document.getElementById('levelup-screen').classList.add('hidden');
        this.isPaused = false;
    }

    // ========================================
    // 📊 SYSTÈME DE DÉGÂTS FLOTTANTS
    // ========================================
    showDamageNumber(worldX, worldY, damage, isCrit = false) {
        const screenPos = this.renderer.worldToScreen(worldX, worldY);
        
        const container = document.getElementById('damage-numbers');
        if (!container) return;

        const dmgElement = document.createElement('div');
        dmgElement.className = 'damage-number' + (isCrit ? ' crit' : '');
        dmgElement.textContent = isCrit ? `${damage}!` : damage;
        dmgElement.style.left = `${screenPos.x}px`;
        dmgElement.style.top = `${screenPos.y - 40}px`;
        
        container.appendChild(dmgElement);

        setTimeout(() => {
            dmgElement.remove();
        }, 800);
    }

    // ========================================
    // 🌊 NOTIFICATIONS DE VAGUES
    // ========================================
    showWaveNotification(wave, enemyCount) {
        const container = document.getElementById('damage-numbers');
        if (!container) return;

        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Cinzel', serif;
            font-size: 4rem;
            color: #ffd700;
            text-shadow: 0 0 20px rgba(255,215,0,0.8), 0 4px 8px rgba(0,0,0,0.9);
            z-index: 3000;
            pointer-events: none;
            animation: waveNotif 3s ease-out forwards;
        `;
        notif.textContent = `🌊 VAGUE ${wave}`;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes waveNotif {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        container.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    showWaveComplete(wave, xp, gold) {
        const container = document.getElementById('damage-numbers');
        if (!container) return;

        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 40%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Cinzel', serif;
            font-size: 2.5rem;
            color: #4caf50;
            text-shadow: 0 0 15px rgba(76,175,80,0.8), 0 4px 8px rgba(0,0,0,0.9);
            z-index: 3000;
            pointer-events: none;
            text-align: center;
            animation: waveNotif 4s ease-out forwards;
        `;
        notif.innerHTML = `
            ✅ VAGUE ${wave} TERMINÉE !<br>
            <span style="font-size: 1.5rem; color: #00bcd4;">+${xp} XP | +${gold} OR</span>
        `;
        
        container.appendChild(notif);
        setTimeout(() => notif.remove(), 4000);
    }

    // ========================================
    // 📊 HUD UPDATE
    // ========================================
    updateHUD() {
        const p = this.player;
        
        // Barres
        document.getElementById('hp-bar').style.width = `${(p.hp / p.maxHp) * 100}%`;
        document.getElementById('hp-text').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
        
        document.getElementById('xp-bar').style.width = `${(p.xp / p.xpToNextLevel) * 100}%`;
        document.getElementById('xp-text').textContent = `Niveau ${p.level}`;
        
        // Stats
        document.getElementById('stat-kills').textContent = this.stats.kills;
        document.getElementById('stat-level').textContent = p.level;
        
        const minutes = Math.floor(this.stats.timeElapsed / 60);
        const seconds = Math.floor(this.stats.timeElapsed % 60);
        document.getElementById('stat-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // 🌊 Indicateur de vague
        this.updateWaveHUD();
    }

    updateWaveHUD() {
        const waveNum = document.getElementById('wave-number');
        const waveBreak = document.getElementById('wave-break');
        const waveTimer = document.getElementById('wave-timer');
        
        if (!waveNum || !waveBreak || !waveTimer) return;

        const spawn = this.spawnManager;
        
        // Numéro de vague
        waveNum.textContent = spawn.currentWave || 1;
        
        // Pause entre vagues
        if (!spawn.isWaveActive && spawn.currentWave > 0) {
            const timeLeft = Math.ceil(spawn.waveBreakDuration - spawn.waveBreakTime);
            waveTimer.textContent = `${timeLeft}s`;
            waveBreak.classList.remove('hidden');
        } else {
            waveBreak.classList.add('hidden');
        }
    }

    // ========================================
    // UPDATE LOOP
    // ========================================
    update(dt) {
        if (this.isPaused) return;

        this.stats.timeElapsed += dt;
        this.player.update(dt);
        this.renderer.follow(this.player.x, this.player.y);
        this.spawnManager.update(dt);
        this.projectileManager.update(dt);
        this.dropManager.update(dt);
        this.lightningManager.update(dt);
        this.particleManager.update(dt); // ✨ NOUVEAU

        if (this.enemies) {
            this.enemies.forEach(enemy => enemy.update(dt));
            this.enemies = this.enemies.filter(e => {
                if(e.isDead && !e.counted) {
                    this.stats.kills++;
                    e.counted = true;
                }
                return !e.isDead;
            });
        }

        this.updateHUD();
    }

    // ========================================
    // RENDER LOOP
    // ========================================
    render() {
        this.renderer.clear(this.levelManager.backgroundColor);
        this.levelManager.renderFloor(this.renderer);

        const renderList = [];
        renderList.push(...this.levelManager.getWalls());
        renderList.push(...this.dropManager.getRenderData());

        const playerData = this.player.getRenderData();
        if (playerData) renderList.push(playerData);

        if (this.enemies) {
            this.enemies.forEach(enemy => {
                const data = enemy.getRenderData();
                if(data) renderList.push(data);
            });
        }

        renderList.push(...this.projectileManager.getRenderData());

        renderList.sort((a, b) => {
            if(a.type === 'projectile') return 1; 
            if(b.type === 'projectile') return -1;
            return (a.y - b.y) || (a.x - b.x);
        });

        renderList.forEach(obj => {
            // ⭐ AURA ÉLITE (avant le sprite)
            if (obj.type === 'enemy' && obj.isElite) {
                this.drawEliteAura(obj);
            }

            this.renderer.drawSprite(
                obj.image, obj.x, obj.y, obj.z || 0, obj.scale || 1, obj.flipX || false, obj.slashImage
            );

            // 📊 BARRES DE VIE
            if (obj.type === 'enemy' && obj.showHealthBar && obj.hp < obj.maxHp) {
                this.renderer.drawHealthBar(obj.x, obj.y, obj.hp, obj.maxHp, obj.isBoss);
            }
        });

        // ⚡ Éclairs
        this.lightningManager.render(this.ctx, this.renderer);

        // ✨ PARTICULES (par-dessus tout)
        this.particleManager.render(this.ctx, this.renderer);

        // 🗺️ Mini-map
        this.renderMinimap();
    }

    // ========================================
    // ⭐ DESSIN DE L'AURA ÉLITE
    // ========================================
    drawEliteAura(enemyData) {
        const pos = this.renderer.worldToScreen(enemyData.x, enemyData.y);
        const radius = 40 * enemyData.scale;
        const alpha = 0.3 + Math.sin(enemyData.auraPhase) * 0.2;
        
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        
        const gradient = this.ctx.createRadialGradient(
            pos.x + 32, pos.y + 32, 0,
            pos.x + 32, pos.y + 32, radius
        );
        gradient.addColorStop(0, enemyData.eliteColor.replace(')', ', 0.6)').replace('rgb', 'rgba'));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(pos.x + 32, pos.y + 32, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    // ========================================
    // 🗺️ MINIMAP
    // ========================================
    renderMinimap() {
        const ctx = this.minimapCtx;
        const size = 150;
        const scale = size / 60;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, size, size);

        // Murs
        ctx.fillStyle = '#444';
        for(let y = 0; y < this.levelManager.height; y++) {
            for(let x = 0; x < this.levelManager.width; x++) {
                if(this.levelManager.map[y][x] !== 0) {
                    ctx.fillRect(x * scale, y * scale, scale, scale);
                }
            }
        }

        // Ennemis
        this.enemies.forEach(e => {
            if(!e.isDead) {
                // Couleur selon type
                if (e.isBoss) {
                    ctx.fillStyle = '#9c27b0';
                    ctx.fillRect(e.x * scale - 2, e.y * scale - 2, 4, 4);
                } else if (e.isElite) {
                    ctx.fillStyle = e.getEliteModifiers(e.eliteType).color;
                    ctx.fillRect(e.x * scale - 1.5, e.y * scale - 1.5, 3, 3);
                } else {
                    ctx.fillStyle = '#ff4444';
                    ctx.fillRect(e.x * scale - 1, e.y * scale - 1, 2, 2);
                }
            }
        });

        // Joueur
        ctx.fillStyle = '#00ff88';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00ff88';
        ctx.fillRect(this.player.x * scale - 2, this.player.y * scale - 2, 4, 4);
        ctx.shadowBlur = 0;
    }
}

export default GameManager;