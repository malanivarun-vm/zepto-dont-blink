// drawShareCard(canvas, { durationSecs, reward })
// Renders the full share card onto the given <canvas> element.
export function drawShareCard(canvas, { durationSecs, reward }) {
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;   // 335
  const H   = canvas.height;  // 480

  // ── Background gradient ──────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#0f0517');
  bg.addColorStop(0.5, '#160924');
  bg.addColorStop(1,   '#0a0310');
  ctx.fillStyle = bg;
  ctx.roundRect(0, 0, W, H, 24);
  ctx.fill();

  // ── Border ────────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(124, 58, 237, 0.4)';
  ctx.lineWidth   = 1.5;
  ctx.roundRect(0, 0, W, H, 24);
  ctx.stroke();

  // ── Glow blob ─────────────────────────────────────────────────────────────
  const glow = ctx.createRadialGradient(W/2, H*0.45, 20, W/2, H*0.45, 200);
  glow.addColorStop(0,   'rgba(124, 58, 237, 0.25)');
  glow.addColorStop(1,   'rgba(124, 58, 237, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Wordmark ──────────────────────────────────────────────────────────────
  ctx.font         = '700 13px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle    = 'rgba(255,255,255,0.5)';
  ctx.letterSpacing = '0.1em';
  ctx.textAlign    = 'center';
  ctx.fillText('ZEPTO', W/2, 44);

  // ── Scoop emoji ───────────────────────────────────────────────────────────
  ctx.font      = '84px serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('🍦', W/2, 160);

  // ── "DON'T BLINK" headline ────────────────────────────────────────────────
  ctx.font      = '900 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.letterSpacing = '0.04em';
  ctx.fillText("DON'T BLINK", W/2, 206);

  // ── Duration ──────────────────────────────────────────────────────────────
  ctx.font      = '900 56px -apple-system, BlinkMacSystemFont, sans-serif';

  // Gradient text via clip
  const textGrad = ctx.createLinearGradient(W*0.2, 0, W*0.8, 0);
  textGrad.addColorStop(0, '#7c3aed');
  textGrad.addColorStop(1, '#ff2d6b');
  ctx.fillStyle = textGrad;
  ctx.letterSpacing = '0em';
  ctx.fillText(`${durationSecs.toFixed(1)}s`, W/2, 278);

  ctx.font      = '700 13px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.letterSpacing = '0.08em';
  ctx.fillText('SECONDS HELD', W/2, 300);

  // ── Cash pill ─────────────────────────────────────────────────────────────
  if (reward > 0) {
    const pillW = 180, pillH = 40, pillX = (W - pillW)/2, pillY = 318;
    ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.lineWidth   = 1;
    roundRect(ctx, pillX, pillY, pillW, pillH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.font      = '800 16px -apple-system, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.letterSpacing = '0em';
    ctx.fillText(`₹${reward} Zepto Cash`, W/2, pillY + 26);
  } else {
    ctx.font      = '600 13px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('Try for 10s to earn Zepto Cash', W/2, 346);
  }

  // ── World record callout ───────────────────────────────────────────────────
  ctx.font      = '600 11px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.letterSpacing = '0em';
  ctx.fillText('World record: 1 hr 5 min 11 sec', W/2, 386);

  // ── Hashtag ────────────────────────────────────────────────────────────────
  ctx.font      = '800 16px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(124,58,237,0.8)';
  ctx.letterSpacing = '0.02em';
  ctx.fillText('#DontBlink', W/2, 420);

  // ── Divider line ────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(40, 402); ctx.lineTo(W-40, 402);
  ctx.stroke();

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.font      = '600 11px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('zepto.team · 10-min delivery', W/2, 460);
}

// Helper: Canvas roundRect polyfill for older environments
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
