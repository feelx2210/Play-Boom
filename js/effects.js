// Diese Datei kümmert sich um komplexe visuelle Effekte wie prozedurales Feuer und Strahlen.

export function drawFlame(ctx, x, y, radius, innerColor, outerColor, jaggy = 0.2) {
    const grad = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(1, outerColor);
    ctx.fillStyle = grad;
    ctx.beginPath();
    const points = 16;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        // Zufällige Variation im Radius für den "zackigen" Look
        const r = radius * (1 - jaggy + Math.random() * jaggy * 2);
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
}

export function drawBeam(ctx, x, y, width, colorInner, colorOuter, isEnd) {
    const half = width / 2;
    
    // Äußerer Rand (Orange/Rot)
    ctx.fillStyle = colorOuter;
    ctx.beginPath();
    
    // Oben links bis oben rechts (mit Wackeln)
    ctx.moveTo(x - 24, y - half);
    for(let i = -24; i <= 24; i+=4) ctx.lineTo(x + i, y - half + (Math.random()-0.5)*4);
    
    if (isEnd) {
        // Runde Spitze am Ende
        ctx.quadraticCurveTo(x + 30, y, x + 24, y + half);
    } else {
        ctx.lineTo(x + 24, y + half);
    }
    
    // Unten rechts bis unten links
    for(let i = 24; i >= -24; i-=4) ctx.lineTo(x + i, y + half + (Math.random()-0.5)*4);
    ctx.closePath();
    ctx.fill();
    
    // Innerer Kern (Heller)
    ctx.fillStyle = colorInner;
    ctx.beginPath(); 
    ctx.moveTo(x - 24, y - half*0.6);
    
    if (isEnd) { 
        ctx.lineTo(x + 18, y - half*0.6); 
        ctx.quadraticCurveTo(x + 24, y, x + 18, y + half*0.6); 
    } else { 
        ctx.lineTo(x + 24, y - half*0.6); 
        ctx.lineTo(x + 24, y + half*0.6); 
    }
    
    ctx.lineTo(x - 24, y + half*0.6); 
    ctx.fill();
}
