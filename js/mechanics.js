import { state } from './state.js';
import { TYPES, ITEMS, BOOST_PADS, OIL_PADS, HELL_CENTER, TILE_SIZE, GRID_W, GRID_H } from './constants.js';
import { createFloatingText } from './utils.js';

// ... (Bestehende Imports und Funktionen bleiben erhalten) ...

export function triggerHellFire() {
    const duration = 100; 
    const range = 5; 
    const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
    dirs.forEach(d => {
        for (let i = 1; i <= range; i++) {
            const tx = HELL_CENTER.x + (d.x * i); const ty = HELL_CENTER.y + (d.y * i);
            if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) break;
            const tile = state.grid[ty][tx];
            let type = (i === range) ? 'end' : 'middle';
            
            if (tile === TYPES.WALL_HARD) break;
            else if (tile === TYPES.WALL_SOFT) { 
                type = 'end';
                destroyWall(tx, ty); 
                createFire(tx, ty, duration, false, type, d); 
                break; 
            } 
            else { 
                destroyItem(tx, ty); 
                createFire(tx, ty, duration, false, type, d); 
            }
        }
    });
}

export function explodeBomb(b) {
    b.owner.activeBombs--; 
    if (!b.isRolling) {
        const fallbackTile = TYPES.EMPTY;
        state.grid[b.gy][b.gx] = (b.underlyingTile !== undefined) ? b.underlyingTile : fallbackTile;
    }
    
    const isBoostPad = (state.currentLevel.id === 'hell' || state.currentLevel.id === 'ice') && BOOST_PADS.some(p => p.x === b.gx && p.y === b.gy);
    const isOilSource = (b.underlyingTile === TYPES.OIL);
    const range = (isBoostPad || isOilSource) ? 15 : b.range; 
    
    let centerNapalm = b.napalm;
    let centerIsOil = isOilSource;
    let centerDuration = 60;

    if (isOilSource) centerDuration = 720; 
    else if (b.napalm) centerDuration = 720; 

    if (b.underlyingTile === TYPES.WATER) {
        centerNapalm = false;
        centerIsOil = false;
        centerDuration = 60; 
    }

    destroyItem(b.gx, b.gy); 
    extinguishNapalm(b.gx, b.gy); 
    createFire(b.gx, b.gy, centerDuration, centerNapalm, 'center', null, centerIsOil);
    
    const dirs = [{x:0, y:-1}, {x:0, y:1}, {x:-1, y:0}, {x:1, y:0}];
    dirs.forEach(d => {
        for (let i = 1; i <= range; i++) {
            const tx = b.gx + (d.x * i); const ty = b.gy + (d.y * i);
            if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) break;
            const tile = state.grid[ty][tx];
            
            let tileIsOil = (tile === TYPES.OIL);
            let tileNapalm = b.napalm;
            let tileIsOilFire = tileIsOil; 
            
            let tileDuration = 60; 
            if (tileIsOil) tileDuration = 720; 
            else if (tileNapalm) tileDuration = 720; 

            if (tile === TYPES.WATER) {
                tileNapalm = false;
                tileIsOilFire = false;
                tileDuration = 60;
            }

            let type = (i === range) ? 'end' : 'middle';

            if (tile === TYPES.WALL_HARD) break;
            else if (tile === TYPES.WALL_SOFT) { 
                type = 'end';
                destroyWall(tx, ty); 
                extinguishNapalm(tx, ty); 
                createFire(tx, ty, tileDuration, tileNapalm, type, d, tileIsOilFire); 
                break; 
            } else { 
                destroyItem(tx, ty); 
                extinguishNapalm(tx, ty); 
                createFire(tx, ty, tileDuration, tileNapalm, type, d, tileIsOilFire); 
            }
        }
    });
}

export function extinguishNapalm(gx, gy) { 
    state.particles.forEach(p => { 
        if (p.isFire && p.isNapalm && p.gx === gx && p.gy === gy) p.life = 0; 
    }); 
}

export function destroyItem(x, y) { 
    if (state.items[y][x] !== ITEMS.NONE) { 
        state.items[y][x] = ITEMS.NONE; 
        createFloatingText(x * TILE_SIZE, y * TILE_SIZE, "ASHES", "#555555"); 
        for(let i=0; i<5; i++) state.particles.push({ x: x * TILE_SIZE + TILE_SIZE/2, y: y * TILE_SIZE + TILE_SIZE/2, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 30, color: '#333333', size: Math.random()*3 }); 
    } 
}

export function createFire(gx, gy, duration, isNapalm = false, type = 'center', dir = null, isOilFire = false) { 
    state.particles.push({ 
        gx: gx, 
        gy: gy, 
        isFire: true, 
        isNapalm: isNapalm, 
        isOilFire: isOilFire, 
        life: duration, 
        maxLife: duration,
        type: type, 
        dir: dir    
    }); 
}

export function destroyWall(x, y) { 
    state.grid[y][x] = TYPES.EMPTY; 
    for(let i=0; i<5; i++) state.particles.push({ x: x * TILE_SIZE + TILE_SIZE/2, y: y * TILE_SIZE + TILE_SIZE/2, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 20, color: '#882222', size: Math.random()*5 }); 
}

export function killPlayer(p) { 
    if (p.invincibleTimer > 0 || !p.alive) return; 
    p.alive = false; 
    p.deathTimer = 90; 
    createFloatingText(p.x, p.y, "ELIMINATED", "#ff0000"); 
    for(let i=0; i<15; i++) { 
        state.particles.push({ x: p.x + 24, y: p.y + 24, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 60, color: '#666666', size: 4 }); 
    }
}

// --- NEU: EIS-SPAWN LOGIK ---
export function spawnRandomIce() {
    // Versuche 50x eine freie Stelle zu finden
    for(let i=0; i<50; i++) {
        // Zufällige Koordinaten (Rand ausschließen)
        let x = Math.floor(Math.random() * (GRID_W - 2)) + 1;
        let y = Math.floor(Math.random() * (GRID_H - 2)) + 1;

        // 1. Muss leer sein
        if (state.grid[y][x] !== TYPES.EMPTY) continue;
        
        // 2. Darf kein Spieler drauf stehen
        let blockedByPlayer = state.players.some(p => Math.round(p.x/TILE_SIZE) === x && Math.round(p.y/TILE_SIZE) === y);
        if (blockedByPlayer) continue;

        // 3. Darf keine Bombe dort sein
        let blockedByBomb = state.bombs.some(b => b.gx === x && b.gy === y);
        if (blockedByBomb) continue;

        // 4. Darf kein Feuer dort sein
        let blockedByFire = state.particles.some(p => p.isFire && p.gx === x && p.gy === y);
        if (blockedByFire) continue;
        
        // Valid! Starte Animation
        // Wir erzeugen einen "Freezing"-Partikel. Wenn dieser stirbt (nach der Animation),
        // wird die Wand gesetzt (Logik in game.js update loop).
        state.particles.push({
            type: 'freezing',
            gx: x, 
            gy: y,
            life: 60, // 1 Sekunde Animation
            maxLife: 60
        });
        return; // Erfolgreich gestartet
    }
}
