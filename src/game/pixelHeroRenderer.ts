import type { Player, HeroExpression } from '../types/game';

interface DrawPixelHeroOptions {
  ctx: CanvasRenderingContext2D;
  player: Player;
  currentTime: number;
  isCharging?: boolean;
  chargePower?: number;
}

/**
 * Pixel-art renderer for the cube ninja character, exactly reproducing the design from the user's images:
 * - Cute pixelated cube body with cat/fox ears
 * - Red ninja headband with dynamic flowing ponytail/ribbon
 * - Big anime pixel eyes with dual glints
 * - 3 authentic facial expressions (smile, tongue out, serious) plus dazed
 * - Running animation cycle with alternating legs and body bob
 * - Retractable pixelated arm that pops out, winds up, whips forward to throw, and retracts
 */
export function drawPixelHero({
  ctx,
  player,
  currentTime,
  isCharging = false,
  chargePower = 0,
}: DrawPixelHeroOptions) {
  const isPlayerTeam = player.team === 'player';
  const isMoving = Math.hypot(player.vx, player.vy) > 0.4;
  const isStunned = player.stunTimer > 0;

  // Determine facing direction: if moving significantly horizontally, face movement direction.
  // Otherwise use throw angle or previous direction.
  let dir = player.facingDirection || 1;
  if (Math.abs(player.vx) > 0.3) {
    dir = player.vx > 0 ? 1 : -1;
    player.facingDirection = dir;
  }

  // Animation cycle values
  const runPhase = player.runCycle || 0;
  // Vertical body bob during running (0, 1, 0, -1)
  const bodyBob = isMoving && !isStunned ? Math.sin(runPhase * Math.PI * 2) * 2 : 0;
  // Slight forward tilt when running
  const runTilt = isMoving && !isStunned ? dir * 0.08 : 0;

  ctx.save();
  ctx.translate(player.x, player.y + bodyBob);

  // Flip horizontally if facing left, with 1.3x scale for crisp visible pixel art
  ctx.scale(dir * 1.3, 1.3);
  ctx.rotate(runTilt);

  // Palette definitions
  const bodyColor = isPlayerTeam ? '#1d5a68' : '#881337';
  const bodyHighlight = isPlayerTeam ? '#2e7a8c' : '#b91c1c';
  const bodyShadow = isPlayerTeam ? '#133e48' : '#4c0519';
  const outlineColor = '#09161a';

  const bandRed = '#e11d48';
  const bandHighlight = '#fb7185';
  const bandShadow = '#9f1239';
  const ponytailColor = '#881337';
  const ponytailShadow = '#4c0519';
  const ponytailHighlight = '#9f1239';

  // 1. DRAW HEADBAND PONYTAIL / RIBBON (Drawn behind the body on the left/back side)
  drawPonytail(ctx, {
    x: -16,
    y: -8,
    currentTime,
    isMoving,
    runPhase,
    vx: player.vx,
    vy: player.vy,
    ponytailColor,
    ponytailShadow,
    ponytailHighlight,
    outlineColor,
  });

  // 2. DRAW RUNNING LEGS (Under the body)
  drawLegs(ctx, {
    isMoving,
    runPhase,
    bodyColor,
    bodyShadow,
    outlineColor,
  });

  // 3. DRAW EARS (On top of body)
  drawEars(ctx, {
    bodyColor,
    bodyHighlight,
    bodyShadow,
    outlineColor,
  });

  // 4. DRAW CUBE BODY
  drawBody(ctx, {
    bodyColor,
    bodyHighlight,
    bodyShadow,
    outlineColor,
  });

  // 5. DRAW RED NINJA HEADBAND
  drawHeadband(ctx, {
    bandRed,
    bandHighlight,
    bandShadow,
    outlineColor,
  });

  // 6. DRAW EYES
  drawEyes(ctx, {
    expression: isStunned ? 'dazed' : player.expression,
    currentTime,
    isPlayerTeam,
    outlineColor,
  });

  // 7. DRAW MOUTH / EXPRESSION
  drawMouth(ctx, {
    expression: isStunned ? 'dazed' : player.expression,
  });

  // 8. DRAW PIXELATED ARM (Pop-out, Wind-up, Throw, Follow-through)
  drawPixelArm(ctx, {
    player,
    isCharging,
    chargePower,
    bodyColor,
    bodyHighlight,
    outlineColor,
    bandRed,
    currentTime,
  });

  ctx.restore();
}

// --------------------------------------------------------------------------
// COMPONENT DRAWING HELPERS (PIXEL ACCURATE)
// --------------------------------------------------------------------------

/**
 * Draw the fluttering ponytail / ribbon attached behind the ninja headband.
 */
function drawPonytail(
  ctx: CanvasRenderingContext2D,
  {
    x,
    y,
    currentTime,
    isMoving,
    runPhase,
    ponytailColor,
    ponytailShadow,
    ponytailHighlight,
    outlineColor,
  }: {
    x: number;
    y: number;
    currentTime: number;
    isMoving: boolean;
    runPhase: number;
    vx: number;
    vy: number;
    ponytailColor: string;
    ponytailShadow: string;
    ponytailHighlight: string;
    outlineColor: string;
  }
) {
  ctx.save();
  ctx.translate(x, y);

  // Ponytail flutter wave
  const flutter = isMoving
    ? Math.sin(runPhase * Math.PI * 2) * 4 + Math.cos(runPhase * Math.PI * 4) * 2
    : Math.sin(currentTime * 0.005) * 2;

  // Pixel blocks forming the tiered flowing ponytail (cascading down-left)
  const segments = [
    { ox: -3, oy: 0, w: 8, h: 6, col: ponytailColor },
    { ox: -7 + flutter * 0.4, oy: 5, w: 9, h: 7, col: ponytailHighlight },
    { ox: -9 + flutter * 0.8, oy: 11, w: 10, h: 8, col: ponytailColor },
    { ox: -8 + flutter * 1.2, oy: 18, w: 8, h: 8, col: ponytailShadow },
    { ox: -5 + flutter * 1.5, oy: 25, w: 6, h: 6, col: ponytailShadow },
    { ox: -3 + flutter * 1.8, oy: 30, w: 4, h: 4, col: ponytailShadow },
  ];

  // Draw black pixel outlines
  ctx.fillStyle = outlineColor;
  segments.forEach(s => {
    ctx.fillRect(Math.round(s.ox) - 1, Math.round(s.oy) - 1, s.w + 2, s.h + 2);
  });

  // Draw colored fill segments
  segments.forEach(s => {
    ctx.fillStyle = s.col;
    ctx.fillRect(Math.round(s.ox), Math.round(s.oy), s.w, s.h);
  });

  ctx.restore();
}

/**
 * Draw the running legs with a 4-frame pixel run cycle.
 */
function drawLegs(
  ctx: CanvasRenderingContext2D,
  {
    isMoving,
    runPhase,
    bodyColor,
    bodyShadow,
    outlineColor,
  }: {
    isMoving: boolean;
    runPhase: number;
    bodyColor: string;
    bodyShadow: string;
    outlineColor: string;
  }
) {
  // Body bottom is at y = 14
  const baseY = 14;
  const legW = 6;
  const legH = 8;

  let leftLegOffsetY = 0;
  let leftLegOffsetX = -10;
  let rightLegOffsetY = 0;
  let rightLegOffsetX = 4;

  if (isMoving) {
    // 4-step run cycle
    const cycle = (runPhase * 4) % 4;
    if (cycle < 1) {
      // Step 1: Left leg forward & raised, Right leg back
      leftLegOffsetY = -3;
      leftLegOffsetX = -7;
      rightLegOffsetY = 2;
      rightLegOffsetX = 7;
    } else if (cycle < 2) {
      // Step 2: Left leg landing, Right leg lifting
      leftLegOffsetY = 1;
      leftLegOffsetX = -9;
      rightLegOffsetY = -2;
      rightLegOffsetX = 5;
    } else if (cycle < 3) {
      // Step 3: Right leg forward & raised, Left leg back
      leftLegOffsetY = 2;
      leftLegOffsetX = -12;
      rightLegOffsetY = -3;
      rightLegOffsetX = 3;
    } else {
      // Step 4: Right leg landing, Left leg lifting
      leftLegOffsetY = -2;
      leftLegOffsetX = -10;
      rightLegOffsetY = 1;
      rightLegOffsetX = 4;
    }
  }

  // Draw Left (Back) Leg
  drawSingleLeg(ctx, leftLegOffsetX, baseY + leftLegOffsetY, legW, legH, bodyShadow, outlineColor);

  // Draw Right (Front) Leg
  drawSingleLeg(ctx, rightLegOffsetX, baseY + rightLegOffsetY, legW, legH, bodyColor, outlineColor);
}

function drawSingleLeg(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  outlineColor: string
) {
  // Pixel outline
  ctx.fillStyle = outlineColor;
  ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, w + 2, h + 2);

  // Pixel fill
  ctx.fillStyle = fillColor;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);

  // Sole highlight / shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(Math.round(x), Math.round(y + h - 2), w, 2);
}

/**
 * Draw the cat/fox pixel ears on top of the head.
 */
function drawEars(
  ctx: CanvasRenderingContext2D,
  {
    bodyColor,
    bodyHighlight,
    outlineColor,
  }: {
    bodyColor: string;
    bodyHighlight: string;
    bodyShadow: string;
    outlineColor: string;
  }
) {
  // Left ear (slanted back ear: x ~ -9, y ~ -28 to -16)
  drawPixelTriangle(ctx, -10, -16, -4, -28, 0, -16, bodyColor, outlineColor);

  // Right ear (tall pointy front ear: x ~ 4 to 15, y ~ -31 to -16)
  drawPixelTriangle(ctx, 3, -16, 11, -32, 16, -16, bodyHighlight, outlineColor);
}

function drawPixelTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  fillColor: string,
  outlineColor: string
) {
  ctx.fillStyle = outlineColor;
  ctx.beginPath();
  ctx.moveTo(x1 - 1, y1 + 1);
  ctx.lineTo(x2, y2 - 2);
  ctx.lineTo(x3 + 1, y3 + 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw the main rounded pixel cube body.
 */
function drawBody(
  ctx: CanvasRenderingContext2D,
  {
    bodyColor,
    bodyHighlight,
    bodyShadow,
    outlineColor,
  }: {
    bodyColor: string;
    bodyHighlight: string;
    bodyShadow: string;
    outlineColor: string;
  }
) {
  const x = -17;
  const y = -16;
  const w = 34;
  const h = 30;

  // 1. Black outer pixel border
  ctx.fillStyle = outlineColor;
  // Corner-stepped rectangle for clean pixel-art bevel
  ctx.fillRect(x - 2, y, w + 4, h);
  ctx.fillRect(x, y - 2, w, h + 4);

  // 2. Main base fill
  ctx.fillStyle = bodyColor;
  ctx.fillRect(x, y, w, h);

  // 3. Subtle highlight on top/left edge
  ctx.fillStyle = bodyHighlight;
  ctx.fillRect(x + 2, y + 2, w - 4, 3);
  ctx.fillRect(x + 2, y + 2, 3, h - 4);

  // 4. Shadow on bottom edge
  ctx.fillStyle = bodyShadow;
  ctx.fillRect(x + 2, y + h - 3, w - 4, 3);
}

/**
 * Draw the thick red ninja headband across the forehead.
 */
function drawHeadband(
  ctx: CanvasRenderingContext2D,
  {
    bandRed,
    bandHighlight,
    bandShadow,
    outlineColor,
  }: {
    bandRed: string;
    bandHighlight: string;
    bandShadow: string;
    outlineColor: string;
  }
) {
  const x = -19;
  const y = -13;
  const w = 38;
  const h = 10;

  // Headband black border
  ctx.fillStyle = outlineColor;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // Main red band
  ctx.fillStyle = bandRed;
  ctx.fillRect(x, y, w, h);

  // Top highlight line
  ctx.fillStyle = bandHighlight;
  ctx.fillRect(x + 1, y, w - 2, 2);

  // Bottom shadow line
  ctx.fillStyle = bandShadow;
  ctx.fillRect(x + 1, y + h - 2, w - 2, 2);
}

/**
 * Draw big anime pixel eyes.
 */
function drawEyes(
  ctx: CanvasRenderingContext2D,
  {
    expression,
    currentTime,
    outlineColor,
  }: {
    expression: HeroExpression;
    currentTime: number;
    isPlayerTeam: boolean;
    outlineColor: string;
  }
) {
  const eyeY = 0;
  const eyeW = 9;
  const eyeH = 10;

  if (expression === 'dazed') {
    // Dazed spiral / X eyes
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.5;

    // Left X
    ctx.beginPath();
    ctx.moveTo(-11, eyeY);
    ctx.lineTo(-4, eyeY + 7);
    ctx.moveTo(-4, eyeY);
    ctx.lineTo(-11, eyeY + 7);
    ctx.stroke();

    // Right X
    ctx.beginPath();
    ctx.moveTo(2, eyeY);
    ctx.lineTo(9, eyeY + 7);
    ctx.moveTo(9, eyeY);
    ctx.lineTo(2, eyeY + 7);
    ctx.stroke();
    return;
  }

  // Periodic subtle blink (every ~4 seconds)
  const isBlinking = Math.sin(currentTime * 0.003) > 0.98;
  if (isBlinking) {
    ctx.fillStyle = outlineColor;
    ctx.fillRect(-12, eyeY + 4, 10, 3);
    ctx.fillRect(1, eyeY + 4, 10, 3);
    return;
  }

  // Left Eye (-12 to -3)
  drawSingleAnimeEye(ctx, -12, eyeY, eyeW, eyeH, outlineColor);

  // Right Eye (1 to 10)
  drawSingleAnimeEye(ctx, 1, eyeY, eyeW, eyeH, outlineColor);
}

function drawSingleAnimeEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  outlineColor: string
) {
  // 1. Black outline
  ctx.fillStyle = outlineColor;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);

  // 2. White sclera background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);

  // 3. Dark cyan/teal pupil fill (middle-bottom)
  ctx.fillStyle = '#0f4450';
  ctx.fillRect(x + 1, y + 2, w - 2, h - 3);

  // 4. Dual white pixel sparkles (top-left & top-right)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 1, y + 1, 3, 3); // Main big sparkle
  ctx.fillRect(x + 5, y + 2, 2, 2); // Secondary small sparkle

  // 5. Bottom subtle cyan shine
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x + 2, y + h - 3, w - 4, 2);
}

/**
 * Draw authentic mouths from the 3 uploaded images:
 * - smile: cheeky pixel smile (image 1)
 * - tongue: mouth open with pink tongue sticking out (image 2)
 * - serious: straight focused line (image 3)
 */
function drawMouth(
  ctx: CanvasRenderingContext2D,
  {
    expression,
  }: {
    expression: HeroExpression;
  }
) {
  const mouthY = 9;

  if (expression === 'tongue') {
    // Image 2: Tongue out!
    // Black upper mouth slot
    ctx.fillStyle = '#09161a';
    ctx.fillRect(-6, mouthY, 10, 2);

    // Pink tongue sticking out
    ctx.fillStyle = '#09161a';
    ctx.fillRect(-4, mouthY + 1, 7, 7); // tongue black border

    ctx.fillStyle = '#f472b6'; // Vibrant pink tongue
    ctx.fillRect(-3, mouthY + 2, 5, 5);

    // Tongue cleft shadow
    ctx.fillStyle = '#db2777';
    ctx.fillRect(-1, mouthY + 2, 1, 4);
  } else if (expression === 'serious') {
    // Image 3: Straight focused pixel line
    ctx.fillStyle = '#09161a';
    ctx.fillRect(-5, mouthY + 1, 9, 2);
  } else if (expression === 'dazed') {
    // Wavy dizzy mouth
    ctx.fillStyle = '#09161a';
    ctx.fillRect(-6, mouthY + 1, 3, 2);
    ctx.fillRect(-3, mouthY, 3, 2);
    ctx.fillRect(0, mouthY + 1, 3, 2);
    ctx.fillRect(3, mouthY + 2, 3, 2);
  } else {
    // Image 1: Iconic pixel smile with side upturn!
    ctx.fillStyle = '#09161a';
    // Horizontal smile base
    ctx.fillRect(-6, mouthY + 2, 8, 2);
    // Left upward hook
    ctx.fillRect(-7, mouthY + 1, 2, 2);
    // Right upward upturn
    ctx.fillRect(1, mouthY + 1, 2, 2);
    ctx.fillRect(2, mouthY, 2, 2);
  }
}

/**
 * Draw the pixelated retractable arm:
 * - Hidden normally
 * - Pops out when holding the ball
 * - Pulls back (wind-up) when charging
 * - Whips forward with swoosh trail on throw release
 * - Follow-through and retracts smoothly back into the cube
 */
function drawPixelArm(
  ctx: CanvasRenderingContext2D,
  {
    player,
    isCharging,
    chargePower,
    bodyColor,
    bodyHighlight,
    outlineColor,
    bandRed,
    currentTime,
  }: {
    player: Player;
    isCharging: boolean;
    chargePower: number;
    bodyColor: string;
    bodyHighlight: string;
    outlineColor: string;
    bandRed: string;
    currentTime: number;
  }
) {
  const armState = player.armState || 'none';
  if (armState === 'none' && !player.hasBall && !isCharging) {
    return; // Arm cleanly retracted inside cube!
  }

  ctx.save();

  // Arm emerges from the right side of the cube body (shoulder at x: 12, y: 3)
  const shoulderX = 13;
  const shoulderY = 3;

  let armAngle = 0; // 0 = forward (pointing right)
  let armLength = 16;
  let trembleX = 0;
  let trembleY = 0;

  if (armState === 'charging' || isCharging) {
    // Wind-up: Arm pulls backwards and up!
    // As power increases, arm pulls back further
    const pwr = chargePower || player.armChargePower || 0;
    armAngle = -Math.PI * 0.45 - pwr * 0.35; // Cocked back between -80° and -140°
    armLength = 16 + pwr * 4;

    // Power tremble
    trembleX = (Math.random() - 0.5) * (1.5 + pwr * 3);
    trembleY = (Math.random() - 0.5) * (1.5 + pwr * 3);

    // Energy spark particles radiating from arm when power > 0.4
    if (pwr > 0.35 && Math.random() < 0.6) {
      drawEnergySpark(ctx, shoulderX + Math.cos(armAngle) * armLength, shoulderY + Math.sin(armAngle) * armLength, pwr);
    }
  } else if (armState === 'throwing') {
    // Throwing swing / follow-through:
    // armTimer goes from 0 to 18 frames
    const progress = Math.min(1, (player.armTimer || 0) / 16);
    if (progress < 0.3) {
      // Violent forward whip!
      const swingRatio = progress / 0.3; // 0 to 1
      armAngle = -Math.PI * 0.6 + swingRatio * (Math.PI * 0.85); // Swings from back to forward-down
      armLength = 20;

      // Draw Pixel Swoosh Trail
      drawPixelSwoosh(ctx, shoulderX, shoulderY, armLength, armAngle);
    } else {
      // Follow-through and retracting back
      const retractRatio = (progress - 0.3) / 0.7; // 0 to 1
      armAngle = 0.25 - retractRatio * 0.25;
      armLength = Math.max(0, 18 * (1 - retractRatio));
    }
  } else {
    // Normal holding pose: arm extended forward-down slightly holding ball
    armAngle = 0.15 + Math.sin(currentTime * 0.006) * 0.08;
    armLength = 14;
  }

  if (armLength > 2) {
    ctx.translate(shoulderX + trembleX, shoulderY + trembleY);
    ctx.rotate(armAngle);

    // Draw the chunky pixelated arm segments:
    // Segment 1: Upper arm / shoulder block
    drawArmBlock(ctx, 0, -3, 6, 6, bodyColor, outlineColor);

    // Segment 2: Forearm block
    drawArmBlock(ctx, 5, -3, 6, 6, bodyHighlight, outlineColor);

    // Segment 3: Red ninja wristband
    ctx.fillStyle = outlineColor;
    ctx.fillRect(10, -4, 4, 8);
    ctx.fillStyle = bandRed;
    ctx.fillRect(11, -3, 2, 6);

    // Segment 4: Pixel Mitten / Hand (clutching fingers)
    drawArmBlock(ctx, 13, -4, 5, 7, bodyColor, outlineColor);
    // Finger pixel notches
    ctx.fillStyle = outlineColor;
    ctx.fillRect(15, -2, 3, 1);
    ctx.fillRect(15, 1, 3, 1);
  }

  ctx.restore();
}

function drawArmBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fillColor: string,
  outlineColor: string
) {
  ctx.fillStyle = outlineColor;
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, w, h);
}

/**
 * Pixelated energy spark particle when charging power.
 */
function drawEnergySpark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  power: number
) {
  const sparkDist = 12 + Math.random() * 12;
  const sparkAngle = Math.random() * Math.PI * 2;
  const sx = x + Math.cos(sparkAngle) * sparkDist;
  const sy = y + Math.sin(sparkAngle) * sparkDist;
  const sparkColor = power > 0.8 ? '#f97316' : '#facc15';

  ctx.fillStyle = sparkColor;
  ctx.fillRect(Math.round(sx), Math.round(sy), 3, 3);
}

/**
 * Pixelated swoosh arc effect during throw swing.
 */
function drawPixelSwoosh(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  currentAngle: number
) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, radius + 2, currentAngle - 0.9, currentAngle);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius + 4, currentAngle - 1.1, currentAngle);
  ctx.stroke();
  ctx.restore();
}
