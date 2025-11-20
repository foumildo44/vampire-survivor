// ✅ FICHIER: src/Loop.js
class Loop {
    constructor(gameManager) {
        this.game = gameManager;
        this.lastTime = 0;
        this.isRunning = false;
        this.animate = this.animate.bind(this);
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.animate);
        }
    }

    stop() {
        this.isRunning = false;
    }

    animate(currentTime) {
        if (!this.isRunning) return;

        // Calcul du temps écoulé (Delta Time) en secondes
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Mise à jour et Dessin
        this.game.update(dt);
        this.game.render();

        requestAnimationFrame(this.animate);
    }
}

export default Loop;