import { TILE_SIZE } from './constants.js';
import { state } from './state.js';
import { drawFlame, drawBeam } from './effects.js';

// ... (drawOilFire Funktion bleibt unverändert)
function drawOilFire(ctx, x, y) {
    const t = Date.now();
    ctx.save();
    ctx.translate(x, y);

    // 1. Pulsierende Glut-Basis
    const pulse = Math.sin(t / 150) * 0.1 + 1; 
    const radius = 22 * pulse;
    
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius);
    grad.addColorStop(0, '#ffaa00');      
    grad.addColorStop(0.5, '#cc2200');    
    grad.addColorStop(0.8, '#440505');    
    grad.addColorStop(1, 'rgba(0,0,0,0)'); 
    
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();

    // 2. "Brutzelnde" Öl-Blasen
    for(let i=0; i<3; i++) {
        const offset = i * 850;
        const progress = ((t + offset) % 800) / 800; 
        if (progress < 0.9) { 
            const angle = (t / 600) + i * (Math.PI * 2 / 3);
            const dist = 6 + Math.sin(t/200 + i)*8;
            const bx = Math.cos(angle) * dist;
            const by = Math.sin(angle) * dist;
            const size = 5 * Math.sin(progress * Math.PI); 
            
            ctx.fillStyle = '#2a0000'; 
            ctx.beginPath(); ctx.arc(bx, by, size, 0, Math.PI*2); ctx.fill();
            
            ctx.fillStyle = '#ff6600';
            ctx.beginPath(); ctx.arc(bx - 1, by - 1, size * 0.3, 0, Math.PI*2); ctx.fill();
        }
    }
    // 3. Gift
    const particleCount = 2; 
    for(let j=0; j<particleCount; j++) {
        const cycle = 2200;
        const offset = j * (cycle / particleCount);
        const pProg = ((t + offset) % cycle) / cycle; 
        const px = Math.sin(t/400 + j)*10; 
        const py = 4 - (pProg * 18); 
        ctx.globalAlpha = Math.max(0, 1 - pProg * 1.5); 
        ctx.fillStyle = '#33ff33'; 
        ctx.beginPath(); ctx.rect(px, py, 3, 3); ctx.fill();
    }
    ctx.restore();
}

// ... (drawFreezing Funktion bleibt unverändert)
function drawFreezing(ctx, x, y, life, maxLife) {
    const cx = x; const cy = y;
    const progress = 1 - (life / maxLife); 
    ctx.save();
    ctx.translate(cx, cy);
    const size = TILE_SIZE * 0.8 * progress;
    ctx.fillStyle = `rgba(136, 204, 255, ${0.5 * progress})`;
    ctx.fillRect(-TILE_SIZE/2, -TILE_SIZE/2, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#ccffff'; ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for(let i=0; i<4; i++) {
        ctx.rotate(Math.PI/2); ctx.moveTo(0, 0); ctx.lineTo(-5, -size/2); ctx.lineTo(0, -size); ctx.lineTo(5, -size/2);
    }
    ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, size * 0.2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
}

// ÄNDERUNG: Neue, pixelige Napalm-Flamme
function drawNapalmFlame(ctx, x, y) {
    const t = Date.now();
    ctx.save();
    // Zentrieren horizontal, vertikal an den Boden der Kachel setzen
    ctx.translate(x + TILE_SIZE/2, y + TILE_SIZE - 8);

    const pixelSize = 4; // Größe eines "Retro-Pixels"

    // Definition der Flammen-Schichten von unten nach oben (Breite in unseren "Pixeln")
    // Eine Pyramidenform: unten breit (6), oben spitz (1)
    const layers = [6, 5, 4, 3, 2, 1];

    layers.forEach((width, i) => {
        // Jede Schicht wackelt leicht unterschiedlich basierend auf Zeit und Höhe (i)
        // Je höher (i), desto stärker das Wackeln.
        const wave = Math.sin(t / 150 + i * 0.6) * (i * 0.7);
        const currentY = -i * pixelSize; // Y-Position nach oben wandern lassen

        // Äußerer Rand (Rot/Dunkelorange flackernd)
        ctx.fillStyle = (Math.floor(t/100) + i) % 2 === 0 ? '#ff4400' : '#cc2200';
        ctx.fillRect((-width/2 * pixelSize) + wave, currentY, width * pixelSize, pixelSize);

        // Innerer Kern (Gelb/Hellorange flackernd) - nur wenn die Schicht breit genug ist
        if (width > 2) {
            const coreWidth = width - 2;
            ctx.fillStyle = (Math.floor(t/100) + i) % 2 === 0 ? '#ffff00' : '#ffcc00';
            // Kern zeichnen
            ctx.fillRect((-coreWidth/2 * pixelSize) + wave, currentY, coreWidth * pixelSize, pixelSize);
        }
    });

    // Gelegentlich ein einzelner "Funken"-Pixel oben drauf, der schnell aufsteigt
    if (Math.random() < 0.3) {
            ctx.fillStyle = '#ffff00';
            // Funke wackelt mit der Spitze mit
            const sparkWave = Math.sin(t / 150 + layers.length * 0.6) * (layers.length * 0.7);
            // Funke ist 1-2 Pixel über der Spitze
            const sparkHeight = (layers.length + (Math.floor(t/50)%2)) * pixelSize;
            ctx.fillRect(sparkWave - pixelSize/2, -sparkHeight, pixelSize, pixelSize);
    }

    ctx.restore();
}

export function drawAllParticles(ctx) {
    state.particles.forEach(p => {
        const px = p.gx * TILE_SIZE;
        const py = p.gy * TILE_SIZE;

        if (p.isFire) {
            const max = p.maxLife || 100;
            const currentLife = p.life;
            const age = max - currentLife;
            const cx = px + TILE_SIZE/2;
            const cy = py + TILE_SIZE/2;
            ctx.save();
            const explosionDuration = 100;
            
            // 1. Wachstumsphase
            if (age < 15) {
                const grow = age / 15;
                drawFlame(ctx, cx, cy, 18 * grow, '#ffffff', '#ffff00', 0.1);
            } 
            // 2. Volle Explosion
            else if (age < explosionDuration) {
                const pulse = Math.sin(Date.now() / 30) * 2;
                const baseSize = 16; 
                
                // Standard-Farben für die Explosion selbst
                const isOil = p.isOilFire;
                const inner = isOil ? '#ff5500' : '#ffff44'; 
                const outer = isOil ? '#000000' : '#ff6600'; 
                
                if (p.type === 'center') {
                    drawFlame(ctx, cx, cy, baseSize + pulse, inner, outer, 0.2);
                } else {
                    let angle = 0;
                    if (p.dir) {
                        if (p.dir.x === 0 && p.dir.y === -1) angle = -Math.PI/2;
                        if (p.dir.x === 0 && p.dir.y === 1) angle = Math.PI/2;
                        if (p.dir.x === -1 && p.dir.y === 0) angle = Math.PI;
                        if (p.dir.x === 1 && p.dir.y === 0) angle = 0;
                    }
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);
                    const beamWidth = 36 + Math.sin(Date.now()/40)*3; 
                    drawBeam(ctx, 0, 0, beamWidth, inner, outer, p.type === 'end');
                }
            } 
            // 3. Nachbrennen (Ölfelder)
            else if (p.isOilFire) {
                drawOilFire(ctx, cx, cy);
            } 
            // 4. Nachbrennen (Napalm) - Ruft die neue pixelige Funktion auf
            else if (p.isNapalm) {
                drawNapalmFlame(ctx, px, py); // Übergibt px, py (oben links der Kachel) für korrekte Positionierung
            }
            // 5. Ausglühen (Normale Explosion)
            else {
                const emberDuration = max - explosionDuration;
                let emberProgress = 0;
                if (emberDuration > 0) emberProgress = (age - explosionDuration) / emberDuration;
                const jitter = (Math.random() - 0.5) * 3; 
                const pulse = Math.sin(Date.now() / 50) * 2; 
                
                let inner = '#ffcc00'; 
                let outer = '#cc2200';

                if (emberProgress > 0.9) ctx.globalAlpha = 1 - ((emberProgress - 0.9) * 10);
                else ctx.globalAlpha = 1.0;
                
                if (p.type === 'center') {
                    drawFlame(ctx, cx, cy, 18 + pulse + jitter, inner, outer, 0.3);
                } else {
                    let angle = 0;
                    if (p.dir) {
                        if (p.dir.x === 0 && p.dir.y === -1) angle = -Math.PI/2;
                        if (p.dir.x === 0 && p.dir.y === 1) angle = Math.PI/2;
                        if (p.dir.x === -1 && p.dir.y === 0) angle = Math.PI;
                        if (p.dir.x === 1 && p.dir.y === 0) angle = 0;
                    }
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);
                    const beamWidth = 32 + pulse + jitter;
                    drawBeam(ctx, 0, 0, beamWidth, inner, outer, p.type === 'end');
                    if (Math.random() < 0.4) {
                         ctx.fillStyle = '#ffffaa';
                         const px = (Math.random() - 0.5) * 40;
                         const py = (Math.random() - 0.5) * 10;
                         ctx.fillRect(px, py, 2, 2);
                    }
                }
            }
            ctx.restore();
        } 
        else if (p.type === 'freezing') {
            drawFreezing(ctx, px + TILE_SIZE/2, py + TILE_SIZE/2, p.life, p.maxLife);
        }
        else if (p.text) {
            ctx.fillStyle = p.color; ctx.font = '10px "Press Start 2P"'; ctx.fillText(p.text, p.x, p.y);
        } else {
            ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size || 4, p.size || 4);
        }
    });
}
