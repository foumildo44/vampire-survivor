// ✅ FICHIER: src/managers/LevelManager.js
class LevelManager {
    constructor(gameManager, levelIndex = 1) {
        this.game = gameManager;
        this.levelIndex = levelIndex;
        
        this.width = 80; // Map un peu plus grande
        this.height = 80;
        this.tileSize = 64; // Taille standard d'une tuile
        this.map = [];
        
        // 🌍 CONFIGURATION DES MONDES
        this.biomes = {
            1: { // MONDE 1 : FORET
                name: "Forêt Sombre",
                floor: './assets/sprites/floor.png',
                obstacle: './assets/sprites/tree.png',
                obstacle2: './assets/sprites/rock.png',
                bgColor: '#2d4626',
                density: 0.38 // Densité initiale élevée pour l'algo de lissage
            },
            2: { // MONDE 2 : NEIGE
                name: "Pics Gelés",
                floor: './assets/sprites/floor_snow.png',
                obstacle: './assets/sprites/tree_snow.png',
                obstacle2: './assets/sprites/wall_snow.png',
                bgColor: '#8faab8',
                density: 0.35
            },
            3: { // MONDE 3 : MAUDIT
                name: "Terres Maudites",
                floor: './assets/sprites/floor_cursed.png',
                obstacle: './assets/sprites/tree_cursed.png',
                obstacle2: './assets/sprites/rock_cursed.png',
                bgColor: '#2a1d36',
                density: 0.40
            }
        };

        this.loadBiome(levelIndex);
    }

    loadBiome(index) {
        this.levelIndex = index;
        const config = this.biomes[index] || this.biomes[1];
        this.backgroundColor = config.bgColor;
        
        // Chargement Sprites
        this.sprites = {
            floor: new Image(),
            obstacle: new Image(),
            obstacle2: new Image()
        };
        this.sprites.floor.src = config.floor;
        this.sprites.obstacle.src = config.obstacle;
        this.sprites.obstacle2.src = config.obstacle2;

        console.log(`🌍 Génération du monde : ${config.name}...`);
        this.generateOrganicMap(config.density);
    }

    // ✨ NOUVEAU : Génération procédurale organique (Cellular Automata)
    generateOrganicMap(density) {
        this.map = [];
        
        // Étape 1 : Bruit aléatoire
        for (let y = 0; y < this.height; y++) {
            let row = [];
            for (let x = 0; x < this.width; x++) {
                // Bords toujours fermés
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    row.push(1);
                } else {
                    // Remplissage aléatoire selon la densité
                    row.push(Math.random() < density ? 1 : 0);
                }
            }
            this.map.push(row);
        }

        // Étape 2 : Lissage (5 passes pour faire des formes naturelles)
        for (let i = 0; i < 5; i++) {
            this.smoothMap();
        }

        // Étape 3 : Nettoyage de la zone de spawn (toujours vide au centre)
        const cx = Math.floor(this.width / 2);
        const cy = Math.floor(this.height / 2);
        const safeZone = 6;
        for (let y = cy - safeZone; y <= cy + safeZone; y++) {
            for (let x = cx - safeZone; x <= cx + safeZone; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    this.map[y][x] = 0;
                }
            }
        }

        // Étape 4 : Diversification (Mélange arbres/rochers)
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.map[y][x] === 1) {
                    // 30% de chance d'être un obstacle de type 2 (rocher/mur)
                    if (Math.random() < 0.3) this.map[y][x] = 2;
                }
            }
        }
    }

    smoothMap() {
        const newMap = JSON.parse(JSON.stringify(this.map)); // Copie profonde
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                const neighbors = this.getNeighborCount(x, y);
                
                // Règle de l'automate : si plus de 4 voisins murs, je deviens un mur
                if (neighbors > 4) {
                    newMap[y][x] = 1;
                } else if (neighbors < 4) {
                    newMap[y][x] = 0;
                }
            }
        }
        this.map = newMap;
    }

    getNeighborCount(gridX, gridY) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const nx = gridX + i;
                const ny = gridY + j;
                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                    if (this.map[ny][nx] > 0) count++;
                } else {
                    count++; // Les bords comptent comme des murs
                }
            }
        }
        return count;
    }

    isWalkable(x, y) {
        const gridX = Math.floor(x);
        const gridY = Math.floor(y);
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) return false;
        return this.map[gridY][gridX] === 0;
    }

    renderFloor(renderer) {
        if (!this.sprites.floor.complete) return;
        
        const cx = Math.floor(renderer.camera.x);
        const cy = Math.floor(renderer.camera.y);
        const range = 20; // Augmenté pour les écrans larges

        for (let y = cy - range; y <= cy + range; y++) {
            for (let x = cx - range; x <= cx + range; x++) {
                if(x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    if (this.map[y][x] === 0) {
                        renderer.drawLayerTile(this.sprites.floor, x, y);
                    }
                }
            }
        }
    }

    getWalls() {
        const obstacles = [];
        const cx = Math.floor(this.game.renderer.camera.x);
        const cy = Math.floor(this.game.renderer.camera.y);
        const range = 20;

        for (let y = cy - range; y <= cy + range; y++) {
            for (let x = cx - range; x <= cx + range; x++) {
                if(x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    const type = this.map[y][x];
                    // Ajustement des échelles pour varier la taille
                    const randomScale = 0.9 + ((x * y) % 3) * 0.1; 
                    
                    if (type === 1 && this.sprites.obstacle.complete) {
                        obstacles.push({ 
                            image: this.sprites.obstacle, 
                            x: x, y: y, z: 0, 
                            scale: 1.2 * randomScale, 
                            type: 'wall' 
                        });
                    } else if (type === 2 && this.sprites.obstacle2.complete) {
                        obstacles.push({ 
                            image: this.sprites.obstacle2, 
                            x: x, y: y, z: 0, 
                            scale: 0.9 * randomScale, 
                            type: 'wall' 
                        });
                    }
                }
            }
        }
        return obstacles;
    }

    getSpawnPoint() { return { x: Math.floor(this.width/2), y: Math.floor(this.height/2) }; }
}

export default LevelManager;