// ✅ FICHIER: src/utils/Animator.js
class Animator {
    constructor(basePath, frameCount, frameRate = 0.1, loop = true) {
        this.frames = [];
        this.timer = 0;
        this.currentFrame = 0;
        this.frameRate = frameRate;
        this.loop = loop;
        this.isFinished = false;

        // Préchargement des images
        for (let i = 0; i < frameCount; i++) {
            const img = new Image();
            img.src = `${basePath}_${i}.png`;
            this.frames.push(img);
        }
    }

    update(dt) {
        if (this.isFinished) return;

        this.timer += dt;
        if (this.timer >= this.frameRate) {
            this.timer = 0;
            this.currentFrame++;
            
            if (this.currentFrame >= this.frames.length) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frames.length - 1;
                    this.isFinished = true;
                }
            }
        }
    }

    getCurrentFrame() {
        return this.frames[this.currentFrame];
    }

    reset() {
        this.currentFrame = 0;
        this.timer = 0;
        this.isFinished = false;
    }
}

export default Animator;