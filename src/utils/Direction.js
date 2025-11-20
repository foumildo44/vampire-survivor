// ✅ FICHIER: src/utils/Direction.js
export const DIRECTIONS = {
    SOUTH: 'front',
    NORTH: 'back',
    SIDE: 'side',
    QUARTER: 'quarter'
};

export function getAnimationDirection(angleRad) {
    // Convertir en degrés (0 à 360)
    let deg = angleRad * (180 / Math.PI);
    if (deg < 0) deg += 360;

    // Définition des secteurs angulaires (Isométrique)
    // 0 = Droite (Est)
    // 90 = Bas (Sud)
    // 180 = Gauche (Ouest)
    // 270 = Haut (Nord)

    let direction = DIRECTIONS.SOUTH;
    let flipX = false;

    if (deg >= 337.5 || deg < 22.5) {
        // Droite
        direction = DIRECTIONS.SIDE;
        flipX = false;
    } else if (deg >= 22.5 && deg < 67.5) {
        // Diagonale Bas-Droite
        direction = DIRECTIONS.QUARTER;
        flipX = false;
    } else if (deg >= 67.5 && deg < 112.5) {
        // Bas
        direction = DIRECTIONS.SOUTH;
        flipX = false;
    } else if (deg >= 112.5 && deg < 157.5) {
        // Diagonale Bas-Gauche
        direction = DIRECTIONS.QUARTER;
        flipX = true; // On retourne l'image 3/4
    } else if (deg >= 157.5 && deg < 202.5) {
        // Gauche
        direction = DIRECTIONS.SIDE;
        flipX = true; // On retourne l'image Profil
    } else if (deg >= 202.5 && deg < 247.5) {
        // Diagonale Haut-Gauche
        direction = DIRECTIONS.SIDE; // Ou quarter si tu as un sprite dos-3/4, sinon on utilise profil
        flipX = true;
    } else if (deg >= 247.5 && deg < 292.5) {
        // Haut
        direction = DIRECTIONS.NORTH;
        flipX = false;
    } else if (deg >= 292.5 && deg < 337.5) {
        // Diagonale Haut-Droite
        direction = DIRECTIONS.SIDE;
        flipX = false;
    }

    return { direction, flipX };
}