// ✅ FICHIER: src/managers/SoundManager.js
class SoundManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.initialized = false;

        // Configuration des sons (chemins vers tes assets uploadés)
        this.library = {
            shoot: './assets/sounds/spell_cast.wav', // Changé en .wav si dispo, sinon .mp3
            hit: './assets/sounds/attack_hit.mp3',
            die: './assets/sounds/defeat_sound.mp3',
            levelup: './assets/sounds/quest_reward.wav',
            bgm: './assets/sounds/bgm.mp3',
            // Nouveaux sons potentiels basés sur ta liste
            dash: './assets/sounds/jump-dash-coin.wav',
            ui_click: './assets/sounds/clik ingame.wav'
        };
        
        // Préchargement
        this.loadSounds();
    }

    loadSounds() {
        for (const [key, path] of Object.entries(this.library)) {
            this.sounds[key] = new Audio(path);
            this.sounds[key].volume = 0.4; // Volume par défaut (40%)
        }
        // Réglages spécifiques
        if(this.sounds.bgm) {
            this.sounds.bgm.loop = true;
            this.sounds.bgm.volume = 0.15; // Musique de fond discrète
        }
    }

    play(name) {
        if (!this.sounds[name]) return;
        
        // Permet de rejouer le son même s'il n'est pas fini (mitraillette)
        const clone = this.sounds[name].cloneNode();
        clone.volume = this.sounds[name].volume;
        
        // 🎵 SOUND DESIGN : Variation de pitch (tonalité)
        // Rend les sons répétitifs (comme le tir) beaucoup plus agréables
        const variance = 0.1; // +/- 10% de vitesse
        clone.playbackRate = 1.0 - (variance / 2) + (Math.random() * variance);

        clone.play().catch(e => console.warn("Audio bloqué par le navigateur", e));
    }

    startMusic() {
        if (this.sounds.bgm && this.sounds.bgm.paused) {
            this.sounds.bgm.play().catch(e => console.warn("Click pour lancer la musique"));
        }
    }
    
    stopMusic() {
        if (this.sounds.bgm) {
            this.sounds.bgm.pause();
            this.sounds.bgm.currentTime = 0;
        }
    }
}

export default SoundManager;