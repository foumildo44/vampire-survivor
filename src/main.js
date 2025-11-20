// ✅ FICHIER: src/main.js
import GameManager from './GameManager.js';

// Attendre que la page soit chargée
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameManager();
    game.init();
    
    // Pour debug dans la console du navigateur si besoin
    window.game = game;
});