import { TILE_SIZE } from './constants.js';
import { state } from './state.js';

// --- FLAMMEN & EFFEKTE ZEICHNEN AUSGELAGERT---

function drawFlame(ctx, x, y, radius, innerColor, outerColor, jaggy = 0.2) {
    const grad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(1, outerColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    const points = 16;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = radius * (1 - jaggy + Math.random() * jaggy * 2);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
}

function drawBeam(ctx, x, y, width, colorInner, colorOuter, isEnd) {
    const half = width / 2;
    ctx.fillStyle = colorOuter;
    ctx.beginPath();
    ctx.moveTo(x - 24, y - half);
    for(let i = -24; i <= 24; i+=4) ctx.lineTo(x + i, y - half + (Math.random()-0.5)*4);
    if (isEnd) ctx.quadraticCurveTo(x + 30, y, x + 24, y + half); else ctx.lineTo(x + 24, y + half);
    for(let i = 24; i >= -24; i-=4) ctx.lineTo(x + i, y + half + (Math.random()-0.5)*4);
    ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = colorInner;
    ctx.beginPath(); ctx.moveTo(x - 24, y - half*0.6);
    if (isEnd) { ctx.lineTo(x + 18, y - half*0.6); ctx.quadraticCurveTo(x + 24, y, x + 18, y + half*0.6); } 
    else { ctx.lineTo(x + 24, y - half*0.6); ctx.lineTo(x + 24, y + half*0.6); }
    ctx.lineTo(x - 24, y + half*0.6); ctx.fill();
}

function drawCampfire(ctx, x, y) {
    const cx = x;
    const cy = y + 10; 
    const t = Date.now() / 100;
    const scale = 1 + Math.sin(t) * 0.1;
    const sway = Math.cos(t * 1.5) * 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    // Basis
    const grad = ctx.createRadialGradient(0, 5, 5, 0, 0, 20);
    grad.addColorStop(0, '#ffcc00'); 
    grad.addColorStop(0.6, '#ff4400'); 
    grad.addColorStop(1, 'rgba(50, 0, 0, 0)'); 
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 10, 18, 8, 0, 0, Math.PI * 2); ctx.fill();

    // Flamme
    ctx.fillStyle = '#ffaa00';
    ctx.beginPath();
    ctx.moveTo(-10, 5);
    ctx.quadraticCurveTo(-5 + sway, -25, 0 + sway, -35);
    ctx.quadraticCurveTo(5 + sway, -25, 10, 5);
    ctx.fill();

    // Kern
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath();
    ctx.moveTo(-5, 5);
    ctx.quadraticCurveTo(0 + sway, -15, 0 + sway, -20);
    ctx.quadraticCurveTo(0 + sway, -15, 5, 5);
    ctx.fill();

    // Rauch
    if (Math.random() < 0.3) {
        ctx.fillStyle = 'rgba(50, 50, 50, 0.5)';
        const rx = (Math.random() - 0.5) * 20;
        const ry = -20 - Math.random() * 20;
        ctx.fillRect(rx, ry, 4, 4);
    }

    ctx.restore();
}

// Hauptfunktion, die alle Partikel zeichnet
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

            if (age < 15) {
                const grow = age / 15;
                drawFlame(ctx, cx, cy, 18 * grow, '#ffffff', '#ffff00', 0.1);
            } 
            else if (age < explosionDuration) {
                const pulse = Math.sin(Date.now() / 30) * 2;
                const baseSize = 16; 
                const isOil = p.isOilFire;
                const inner = isOil ? '#ff5500' : (p.isNapalm ? '#ffaa00' : '#ffff44');
                const outer = isOil ? '#000000' : (p.isNapalm ? '#ff2200' : '#ff6600');

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
            else if (p.isOilFire) {
                drawCampfire(ctx, cx, cy);
            }
            else {
                const emberDuration = max - explosionDuration;
                let emberProgress = 0;
                if (emberDuration > 0) emberProgress = (age - explosionDuration) / emberDuration;
                
                const jitter = (Math.random() - 0.5) * 3; 
                const pulse = Math.sin(Date.now() / 50) * 2; 
                const inner = '#ffcc00'; 
                const outer = '#cc2200';

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
        } else if (p.text) {
            ctx.fillStyle = p.color; ctx.font = '10px "Press Start 2P"'; ctx.fillText(p.text, p.x, p.y);
        } else {
            ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size || 4, p.size || 4);
        }
    });
}
