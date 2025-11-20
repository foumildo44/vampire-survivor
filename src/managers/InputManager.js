// ✅ FICHIER: src/managers/InputManager.js
class InputManager {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            dash: false, // Barre d'espace
        };
        
        // Position de la souris
        this.mouse = { x: 0, y: 0 };

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    handleKey(e, isPressed) {
        // Support WASD, ZQSD et Flèches
        switch(e.code) {
            // Déplacement haut
            case 'KeyW': 
            case 'KeyZ': // AZERTY
            case 'ArrowUp': 
                this.keys.up = isPressed; 
                break;
            
            // Déplacement bas
            case 'KeyS': 
            case 'ArrowDown': 
                this.keys.down = isPressed; 
                break;
            
            // Déplacement gauche
            case 'KeyA': 
            case 'KeyQ': // AZERTY
            case 'ArrowLeft': 
                this.keys.left = isPressed; 
                break;
            
            // Déplacement droite
            case 'KeyD': 
            case 'ArrowRight': 
                this.keys.right = isPressed; 
                break;
            
            // 💨 DASH (Barre d'espace) - CORRIGÉ
            case 'Space':
                e.preventDefault(); // Empêche le scroll
                this.keys.dash = isPressed;
                break;
        }
    }

    // Retourne un vecteur normalisé (x, y entre -1 et 1)
    getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.keys.left) x -= 1;
        if (this.keys.right) x += 1;
        if (this.keys.up) y -= 1;
        if (this.keys.down) y += 1;

        // Normalisation pour éviter d'aller plus vite en diagonale
        if (x !== 0 || y !== 0) {
            const length = Math.sqrt(x * x + y * y);
            x /= length;
            y /= length;
        }

        return { x, y };
    }
}

export default InputManager;