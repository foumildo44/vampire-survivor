// ✅ FICHIER: src/managers/Renderer.js
class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.tileSize = 64; 
        this.width = canvas.width;
        this.height = canvas.height;
        this.camera = { x: 0, y: 0 };
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.canvas.width = w;
        this.canvas.height = h;
        this.ctx.imageSmoothingEnabled = false; 
    }

    clear(color = "#111") {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    worldToScreen(x, y) {
        return {
            x: Math.round((x * this.tileSize) - this.camera.x + (this.width / 2)),
            y: Math.round((y * this.tileSize) - this.camera.y + (this.height / 2))
        };
    }

    drawLayerTile(image, x, y) {
        if (!image || !image.complete) return;
        const pos = this.worldToScreen(x, y);
        if (pos.x < -70 || pos.x > this.width || pos.y < -70 || pos.y > this.height) return;
        this.ctx.drawImage(image, pos.x - 1, pos.y - 1, this.tileSize + 2, this.tileSize + 2);
    }

    drawSprite(image, x, y, z = 0, scale = 1, flipX = false, slashImage = null) {
        if (!image || !image.complete || image.naturalWidth === 0) return;

        const pos = this.worldToScreen(x, y);
        const margin = 200;
        if (pos.x < -margin || pos.x > this.width + margin || pos.y < -margin || pos.y > this.height + margin) return;

        const imgW = image.width * scale;
        const imgH = image.height * scale;

        this.ctx.save();
        const pivotX = pos.x + (this.tileSize / 2);
        const pivotY = pos.y + this.tileSize - 4; 

        this.ctx.translate(pivotX, pivotY);
        if (flipX) this.ctx.scale(-1, 1);

        this.ctx.drawImage(image, -imgW / 2, -imgH, imgW, imgH);

        // ⚔️ DESSIN DU SLASH
        if (slashImage && slashImage.complete && slashImage.naturalWidth > 0) {
            const sW = slashImage.width * 0.8;
            const sH = slashImage.height * 0.8;
            this.ctx.rotate(Math.random() * Math.PI * 2);
            this.ctx.drawImage(slashImage, -sW / 2, -sH / 2, sW, sH);
        }

        this.ctx.restore();
    }

    // ========================================
    // 📊 BARRE DE VIE AU-DESSUS DES ENNEMIS (AMÉLIORÉE)
    // ========================================
    drawHealthBar(x, y, hp, maxHp, isBoss = false) {
        const pos = this.worldToScreen(x, y);
        
        // Taille de la barre
        const width = isBoss ? 80 : 50;
        const height = isBoss ? 8 : 6;
        const barX = pos.x + (this.tileSize / 2) - (width / 2);
        const barY = pos.y - (isBoss ? 80 : 50);
        
        const pct = Math.max(0, Math.min(1, hp / maxHp));

        this.ctx.save();

        // Fond noir avec bordure
        this.ctx.fillStyle = "rgba(0,0,0,0.7)";
        this.ctx.fillRect(barX - 1, barY - 1, width + 2, height + 2);

        // Fond gris de la barre
        this.ctx.fillStyle = "#2a2a2a";
        this.ctx.fillRect(barX, barY, width, height);

        // Couleur selon le pourcentage de vie
        let barColor;
        if (pct > 0.6) {
            barColor = "#4caf50"; // Vert
        } else if (pct > 0.3) {
            barColor = "#ff9800"; // Orange
        } else {
            barColor = "#f44336"; // Rouge
        }

        // Boss = couleur spéciale
        if (isBoss) {
            barColor = "#9c27b0"; // Violet pour boss
        }

        // Barre de vie avec dégradé
        const gradient = this.ctx.createLinearGradient(barX, barY, barX, barY + height);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, this.darkenColor(barColor, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(barX, barY, (width) * pct, height);

        // Effet brillant
        this.ctx.fillStyle = "rgba(255,255,255,0.3)";
        this.ctx.fillRect(barX, barY, (width) * pct, height / 2);

        // Bordure
        this.ctx.strokeStyle = isBoss ? "#ff00ff" : "#000";
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, width, height);

        // Texte HP pour les boss
        if (isBoss) {
            this.ctx.font = "bold 10px Orbitron";
            this.ctx.fillStyle = "#fff";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "top";
            this.ctx.strokeStyle = "#000";
            this.ctx.lineWidth = 3;
            const text = `${Math.ceil(hp)} / ${maxHp}`;
            this.ctx.strokeText(text, pos.x + this.tileSize/2, barY - 15);
            this.ctx.fillText(text, pos.x + this.tileSize/2, barY - 15);
        }

        this.ctx.restore();
    }

    // Helper pour assombrir une couleur
    darkenColor(color, amount) {
        const num = parseInt(color.replace("#",""), 16);
        const r = Math.max(0, (num >> 16) - amount * 255);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - amount * 255);
        const b = Math.max(0, (num & 0x0000FF) - amount * 255);
        return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    }

    drawVignette() {
        const gradient = this.ctx.createRadialGradient(
            this.width / 2, this.height / 2, this.width / 3, 
            this.width / 2, this.height / 2, this.width
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, "rgba(0,0,0,0.6)");
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawSelectionCircle(x, y) {
        const pos = this.worldToScreen(x, y);
        this.ctx.save();
        this.ctx.translate(pos.x + 32, pos.y + 60);
        this.ctx.scale(1, 0.5);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.strokeStyle = "red";
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }

    follow(targetX, targetY) {
        const targetPixelX = (targetX * this.tileSize) + (this.tileSize / 2);
        const targetPixelY = (targetY * this.tileSize) + (this.tileSize / 2);
        this.camera.x += (targetPixelX - this.camera.x) * 0.08;
        this.camera.y += (targetPixelY - this.camera.y) * 0.08;
    }
}

export default Renderer;