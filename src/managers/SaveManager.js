// ✅ FICHIER: src/managers/SaveManager.js
class SaveManager {
    constructor() {
        // Données par défaut (pour éviter les plantages)
        this.data = {
            gold: 0,
            stats: { damage: 0, health: 0, speed: 0 },
            inventory: [],
            equipped: {}
        };
    }

    getStatLevel(statName) {
        return this.data.stats[statName] || 0;
    }
    
    save() {
        localStorage.setItem('vampire_survivor_save', JSON.stringify(this.data));
    }
    
    load() {
        const saved = localStorage.getItem('vampire_survivor_save');
        if(saved) {
            this.data = JSON.parse(saved);
        }
    }
}

export default SaveManager;