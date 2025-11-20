// ✅ FICHIER: src/managers/InventoryManager.js
class InventoryManager {
    constructor(gameManager) {
        this.game = gameManager;
    }

    // Retourne des bonus vides pour l'instant
    calculateTotalBonuses() {
        return { 
            damage: 0, 
            health: 0, 
            speed: 0, 
            regen: 0, 
            critChance: 0 
        };
    }
}

export default InventoryManager;