import React, { useEffect, useRef, useCallback } from 'react';
import type { Player, Ball, Referee, FloatingText, ComicDustParticle, GameState } from '../types/game';
import { sounds } from '../audio/soundEffects';
import confetti from 'canvas-confetti';
import { drawPixelHero } from './pixelHeroRenderer';

export interface ChatInsultEvent {
  playerText: string;
  refText: string;
  isCard: boolean;
  id: number;
}

interface GameCanvasProps {
  onScoreUpdate: (playerScore: number, rivalScore: number) => void;
  onRefereeMoodUpdate: (mood: GameState['refereeMood']) => void;
  isPaused: boolean;
  onGameOver?: (winner: 'player' | 'rival') => void;
  externalAction?: string | null;
  onClearAction?: () => void;
  chatInsultEvent?: ChatInsultEvent | null;
}

const FIELD_WIDTH = 960;
const FIELD_HEIGHT = 540;

// Entire back boundary line (NO GOALPOSTS / SIN ARCOS)
const ENDLINE_LEFT = 35;
const ENDLINE_RIGHT = 925;

// Large Central Zone for the Referee
const BOUNDARY_LINE_PLAYER = 340; // Blue team limit
const BOUNDARY_LINE_RIVAL = 620;  // Red team limit

// Referee is UP in the Center (ARRIBA EN EL CENTRO)
const REFEREE_POS_X = (BOUNDARY_LINE_PLAYER + BOUNDARY_LINE_RIVAL) / 2; // 480
const REFEREE_POS_Y = 58;                                              // Top center

interface SpeechBubble {
  id: string;
  speaker: 'referee' | 'player';
  x: number;
  y: number;
  text: string;
  duration: number; // in frames
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  onScoreUpdate,
  onRefereeMoodUpdate,
  isPaused,
  externalAction,
  onClearAction,
  chatInsultEvent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const gameStateRef = useRef({
    scorePlayer: 0,
    scoreRival: 0,
    isGoalScored: false,
    screenShake: 0,
    lastScorer: null as 'player' | 'rival' | null,
  });

  const lastThrowerRef = useRef<string | null>(null);
  const throwCooldownRef = useRef<number>(0);
  const rivalAimYRef = useRef<number>(270);

  const chargeRef = useRef({
    isCharging: false,
    power: 0,
    direction: 1,
    speed: 0.038,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const playersRef = useRef<Player[]>([
    // Player Team (Azul)
    { id: 'p1', name: 'Tú (Lanzador)', team: 'player', number: 10, x: 230, y: 270, vx: 0, vy: 0, speed: 4.4, radius: 18, isControlled: true, hasBall: true, stunTimer: 0, facingAngle: 0, runCycle: 0, armState: 'holding', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: 1 },
    { id: 'p2', name: 'Nico (Ala)', team: 'player', number: 7, x: 170, y: 150, vx: 0, vy: 0, speed: 4.0, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: 0, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: 1 },
    { id: 'p3', name: 'Leo (Defensa)', team: 'player', number: 4, x: 130, y: 390, vx: 0, vy: 0, speed: 3.9, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: 0, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: 1 },

    // Rival Team (Rojo)
    { id: 'r1', name: 'Rival Ariete', team: 'rival', number: 9, x: 730, y: 270, vx: 0, vy: 0, speed: 3.8, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: Math.PI, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: -1 },
    { id: 'r2', name: 'Rival Tirador', team: 'rival', number: 8, x: 790, y: 160, vx: 0, vy: 0, speed: 3.7, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: Math.PI, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: -1 },
    { id: 'r3', name: 'Rival Bloqueador', team: 'rival', number: 3, x: 840, y: 380, vx: 0, vy: 0, speed: 3.6, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: Math.PI, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: -1 },
  ]);

  const rivalShootTimerRef = useRef(0);

  const ballRef = useRef<Ball>({
    x: 230,
    y: 270,
    vx: 0,
    vy: 0,
    radius: 11,
    ownerId: 'p1',
    elevation: 12,
  });

  // Referee stays UP in the center (SE QUEDA QUIETO ARRIBA EN EL CENTRO)
  const refereeRef = useRef<Referee>({
    x: REFEREE_POS_X,
    y: REFEREE_POS_Y,
    vx: 0,
    vy: 0,
    speed: 0,
    radius: 19,
    state: 'idle',
    stateTimer: 0,
    targetPlayerId: null,
    health: 100,
    dazedAngle: 0,
  });

  const particlesRef = useRef<ComicDustParticle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const speechBubblesRef = useRef<SpeechBubble[]>([]);

  const addSpeechBubble = useCallback((speaker: 'referee' | 'player', x: number, y: number, text: string, duration: number = 180) => {
    if (speechBubblesRef.current.length > 2) {
      speechBubblesRef.current.shift();
    }
    speechBubblesRef.current.push({
      id: Math.random().toString(),
      speaker,
      x,
      y,
      text,
      duration,
    });
  }, []);

  const addFloatingText = useCallback((text: string, x: number, y: number, color: string = '#facc15') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      lifetime: 60,
      opacity: 1,
    });
  }, []);

  const addDustExplosion = useCallback((x: number, y: number, count: number = 8, color: string = '#f8fafc') => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const spd = 2 + Math.random() * 4;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 10 + Math.random() * 16,
        color,
        life: 0,
        maxLife: 20 + Math.random() * 15,
      });
    }
  }, []);

  const addFireTrail = useCallback((x: number, y: number) => {
    particlesRef.current.push({
      id: Math.random().toString(),
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 7 + Math.random() * 7,
      color: Math.random() > 0.4 ? '#f97316' : '#ef4444',
      life: 0,
      maxLife: 16,
    });
  }, []);

  // Handle chat insults from player
  useEffect(() => {
    if (!chatInsultEvent) return;
    const controlled = playersRef.current.find(p => p.isControlled) || playersRef.current[0];

    // Player yells in canvas
    addSpeechBubble('player', controlled.x, controlled.y - 50, chatInsultEvent.playerText, 160);
    addFloatingText('🗣️ ¡GRITO AL ÁRBITRO!', controlled.x, controlled.y - 25, '#fbbf24');

    // Referee hears from top center and responds
    setTimeout(() => {
      addSpeechBubble('referee', REFEREE_POS_X, REFEREE_POS_Y + 45, chatInsultEvent.refText, 190);

      if (chatInsultEvent.isCard) {
        refereeRef.current.state = 'angry';
        refereeRef.current.stateTimer = 220;
        controlled.stunTimer = 60;
        addFloatingText('🟨 ¡TARJETA AMARILLA!', controlled.x, controlled.y - 25, '#eab308');
        onRefereeMoodUpdate('¡FURIOSO! 😡');
      } else {
        refereeRef.current.state = 'angry';
        refereeRef.current.stateTimer = 160;
        onRefereeMoodUpdate('¡Peleando!');
      }
    }, 550);
  }, [chatInsultEvent, addSpeechBubble, addFloatingText, onRefereeMoodUpdate]);

  // Reset after point
  const resetAfterGoal = useCallback((scoringTeam: 'player' | 'rival') => {
    const nextOwner = scoringTeam === 'player' ? 'r1' : 'p1';

    playersRef.current = [
      { id: 'p1', name: 'Tú (Lanzador)', team: 'player', number: 10, x: 230, y: 270, vx: 0, vy: 0, speed: 4.4, radius: 18, isControlled: true, hasBall: nextOwner === 'p1', stunTimer: 0, facingAngle: 0, runCycle: 0, armState: nextOwner === 'p1' ? 'holding' : 'none', armTimer: 0, expression: scoringTeam === 'player' ? 'tongue' : 'serious', expressionTimer: 120, facingDirection: 1 },
      { id: 'p2', name: 'Nico (Ala)', team: 'player', number: 7, x: 170, y: 150, vx: 0, vy: 0, speed: 4.0, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: 0, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: 1 },
      { id: 'p3', name: 'Leo (Defensa)', team: 'player', number: 4, x: 130, y: 390, vx: 0, vy: 0, speed: 3.9, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: 0, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: 1 },

      { id: 'r1', name: 'Rival Ariete', team: 'rival', number: 9, x: 730, y: 270, vx: 0, vy: 0, speed: 3.8, radius: 18, isControlled: false, hasBall: nextOwner === 'r1', stunTimer: 0, facingAngle: Math.PI, runCycle: 0, armState: nextOwner === 'r1' ? 'holding' : 'none', armTimer: 0, expression: scoringTeam === 'rival' ? 'tongue' : 'serious', expressionTimer: 120, facingDirection: -1 },
      { id: 'r2', name: 'Rival Tirador', team: 'rival', number: 8, x: 790, y: 160, vx: 0, vy: 0, speed: 3.7, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: Math.PI, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: -1 },
      { id: 'r3', name: 'Rival Bloqueador', team: 'rival', number: 3, x: 840, y: 380, vx: 0, vy: 0, speed: 3.6, radius: 18, isControlled: false, hasBall: false, stunTimer: 0, facingAngle: Math.PI, runCycle: 0, armState: 'none', armTimer: 0, expression: 'smile', expressionTimer: 0, facingDirection: -1 },
    ];

    const ownerPlayer = playersRef.current.find(p => p.id === nextOwner)!;
    ballRef.current = {
      x: ownerPlayer.x + (nextOwner === 'p1' ? 18 : -18),
      y: ownerPlayer.y,
      vx: 0,
      vy: 0,
      radius: 11,
      ownerId: nextOwner,
      elevation: 12,
    };

    // Referee stays UP in the center
    refereeRef.current.x = REFEREE_POS_X;
    refereeRef.current.y = REFEREE_POS_Y;
    refereeRef.current.vx = 0;
    refereeRef.current.vy = 0;
    refereeRef.current.state = 'idle';

    chargeRef.current.isCharging = false;
    chargeRef.current.power = 0;
    rivalShootTimerRef.current = 0;
    lastThrowerRef.current = null;
    throwCooldownRef.current = 0;

    onRefereeMoodUpdate('Normal');
    sounds.playWhistle();
  }, [onRefereeMoodUpdate]);

  // Execute Shoot
  const executeReleaseShoot = useCallback((power: number) => {
    const controlledPlayer = playersRef.current.find(p => p.isControlled);
    if (!controlledPlayer || !controlledPlayer.hasBall) return;

    controlledPlayer.hasBall = false;
    controlledPlayer.armState = 'throwing';
    controlledPlayer.armTimer = 0;
    controlledPlayer.throwAngle = controlledPlayer.facingAngle;

    ballRef.current.ownerId = null;
    ballRef.current.elevation = 20 + power * 8;
    lastThrowerRef.current = controlledPlayer.id;
    throwCooldownRef.current = 35;

    const baseSpeed = 9 + power * 15;
    const isSuperShot = power >= 0.82;

    const aimAngle = controlledPlayer.facingAngle;
    const vx = Math.max(7 + power * 10, Math.cos(aimAngle) * baseSpeed);
    const vy = Math.sin(aimAngle) * baseSpeed * 0.7;

    ballRef.current.vx = vx;
    ballRef.current.vy = vy;

    if (isSuperShot) {
      gameStateRef.current.screenShake = 10;
      controlledPlayer.expression = 'tongue';
      controlledPlayer.expressionTimer = 80;
      sounds.playPunch();
      sounds.playKick();
      addFloatingText('🔥 ¡SUPERTIRO FURIOSO! 🚀', controlledPlayer.x, controlledPlayer.y - 35, '#f97316');
      addDustExplosion(controlledPlayer.x, controlledPlayer.y, 14, '#fdba74');
    } else {
      sounds.playKick();
      controlledPlayer.expression = 'smile';
      controlledPlayer.expressionTimer = 50;
      const pct = Math.round(power * 100);
      addFloatingText(`¡TIRO ${pct}%! 🖐️`, controlledPlayer.x, controlledPlayer.y - 30, '#38bdf8');
      addDustExplosion(controlledPlayer.x, controlledPlayer.y, 6, '#cbd5e1');
    }
  }, [addFloatingText, addDustExplosion]);

  const handleStartCharge = useCallback(() => {
    const controlledPlayer = playersRef.current.find(p => p.isControlled);
    if (controlledPlayer?.hasBall) {
      chargeRef.current.isCharging = true;
      controlledPlayer.armState = 'charging';
      controlledPlayer.expression = 'serious';
    } else {
      const ball = ballRef.current;
      if (!controlledPlayer) return;
      const dist = Math.hypot(ball.x - controlledPlayer.x, ball.y - controlledPlayer.y);
      if (dist < 45 && !ball.ownerId) {
        if (controlledPlayer.id === lastThrowerRef.current && throwCooldownRef.current > 0) {
          return;
        }
        ball.ownerId = controlledPlayer.id;
        controlledPlayer.hasBall = true;
        controlledPlayer.armState = 'holding';
        controlledPlayer.armTimer = 0;
        ball.elevation = 12;
        lastThrowerRef.current = null;
        throwCooldownRef.current = 0;
        sounds.playKick();
        addFloatingText('¡ATRAPADA! 🧤', controlledPlayer.x, controlledPlayer.y - 25, '#22c55e');
      } else {
        let closest = controlledPlayer;
        let minDist = dist;
        playersRef.current.filter(p => p.team === 'player').forEach(tm => {
          const d = Math.hypot(ball.x - tm.x, ball.y - tm.y);
          if (d < minDist) {
            minDist = d;
            closest = tm;
          }
        });
        if (closest.id !== controlledPlayer.id) {
          controlledPlayer.isControlled = false;
          closest.isControlled = true;
          addFloatingText('¡CAMBIO! 🔄', closest.x, closest.y - 25, '#60a5fa');
        }
      }
    }
  }, [addFloatingText]);

  const handleReleaseCharge = useCallback(() => {
    if (chargeRef.current.isCharging) {
      const pwr = chargeRef.current.power;
      chargeRef.current.isCharging = false;
      chargeRef.current.power = 0;
      chargeRef.current.direction = 1;
      executeReleaseShoot(pwr);
    }
  }, [executeReleaseShoot]);

  // Pelear con el Árbitro diciendo: "¡¿CÓMO A ELLOS SÍ SE LO VALE?!"
  const handleFightReferee = useCallback(() => {
    const controlledPlayer = playersRef.current.find(p => p.isControlled);
    const referee = refereeRef.current;
    if (!controlledPlayer) return;

    referee.state = 'fighting';
    referee.stateTimer = 50;
    gameStateRef.current.screenShake = 14;

    const chosenComplaint = '¡¿CÓMO A ELLOS SÍ SE LO VALE?! 🤬';
    addSpeechBubble('player', controlledPlayer.x, controlledPlayer.y - 50, chosenComplaint, 150);

    sounds.playPunch();
    addDustExplosion(referee.x, referee.y, 16, '#f8fafc');
    addFloatingText('¡¡¡RECLAMO FURIOSO!!! 🥊', controlledPlayer.x, controlledPlayer.y - 25, '#ef4444');
    onRefereeMoodUpdate('¡Peleando!');

    setTimeout(() => {
      if (Math.random() < 0.65) {
        referee.state = 'dazed';
        referee.stateTimer = 420;
        sounds.playDazed();
        addSpeechBubble('referee', REFEREE_POS_X, REFEREE_POS_Y + 45, '😵 ¡¡MIS OJOS!! ¡YA NO SÉ QUÉ VALE!', 180);
        addFloatingText('😵 ¡ÁRBITRO NOQUEADO!', referee.x, referee.y - 25, '#a855f7');
        onRefereeMoodUpdate('¡Noqueado! 😵');

        playersRef.current.filter(p => p.team === 'rival').forEach(r => {
          r.stunTimer = 120;
        });
      } else {
        referee.state = 'angry';
        referee.stateTimer = 260;
        sounds.playAngry();
        sounds.playWhistle();
        addSpeechBubble('referee', REFEREE_POS_X, REFEREE_POS_Y + 45, '😡 ¡¡TARJETA AMARILLA POR RECLAMAR!!', 180);
        addFloatingText('🟨 ¡AMARILLA POR BOCÓN!', controlledPlayer.x, controlledPlayer.y - 25, '#eab308');
        controlledPlayer.stunTimer = 60;
        onRefereeMoodUpdate('¡FURIOSO! 😡');
      }
    }, 700);
  }, [addFloatingText, addDustExplosion, addSpeechBubble, onRefereeMoodUpdate]);

  // Touch actions
  useEffect(() => {
    if (!externalAction) return;
    if (externalAction === 'charge_start') {
      handleStartCharge();
    } else if (externalAction === 'charge_release') {
      handleReleaseCharge();
    } else if (externalAction === 'pass') {
      handleStartCharge();
      setTimeout(() => {
        executeReleaseShoot(0.65);
        chargeRef.current.isCharging = false;
        chargeRef.current.power = 0;
      }, 100);
    } else if (externalAction === 'fight') {
      handleFightReferee();
    }
    if (onClearAction) onClearAction();
  }, [externalAction, handleStartCharge, handleReleaseCharge, executeReleaseShoot, handleFightReferee, onClearAction]);

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (e.g. the chat box!)
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      keysPressed.current[e.key.toLowerCase()] = true;

      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'Space' || e.key.toLowerCase() === 'j') {
        if (!e.repeat) {
          e.preventDefault();
          handleStartCharge();
        }
      } else if (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleFightReferee();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      keysPressed.current[e.key.toLowerCase()] = false;

      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'Space' || e.key.toLowerCase() === 'j') {
        e.preventDefault();
        handleReleaseCharge();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleStartCharge, handleReleaseCharge, handleFightReferee]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const loop = (currentTime: number) => {
      if (!isPaused) {
        const keys = keysPressed.current;
        const controlled = playersRef.current.find(p => p.isControlled);
        const ball = ballRef.current;
        const referee = refereeRef.current;
        const isLineFree = referee.state === 'dazed';

        // Throw cooldown update
        if (throwCooldownRef.current > 0) {
          throwCooldownRef.current -= 1;
          if (throwCooldownRef.current === 0) {
            lastThrowerRef.current = null;
          }
        }

        if (gameStateRef.current.screenShake > 0) {
          gameStateRef.current.screenShake -= 0.6;
          if (gameStateRef.current.screenShake < 0) gameStateRef.current.screenShake = 0;
        }

        // Power meter oscillation
        const charge = chargeRef.current;
        if (charge.isCharging) {
          charge.power += charge.direction * charge.speed;
          if (charge.power >= 1) {
            charge.power = 1;
            charge.direction = -1;
          } else if (charge.power <= 0) {
            charge.power = 0;
            charge.direction = 1;
          }
        }

        // Controlled player movement
        if (controlled && controlled.stunTimer <= 0) {
          let moveX = 0;
          let moveY = 0;
          if (keys['w'] || keys['arrowup']) moveY -= 1;
          if (keys['s'] || keys['arrowdown']) moveY += 1;
          if (keys['a'] || keys['arrowleft']) moveX -= 1;
          if (keys['d'] || keys['arrowright']) moveX += 1;

          if (moveX !== 0 || moveY !== 0) {
            const length = Math.hypot(moveX, moveY);
            const normX = moveX / length;
            const normY = moveY / length;
            controlled.vx = normX * controlled.speed;
            controlled.vy = normY * controlled.speed;
            controlled.facingAngle = Math.atan2(normY, normX);
          } else {
            controlled.vx *= 0.7;
            controlled.vy *= 0.7;
          }
        }

        // Players update
        playersRef.current.forEach(player => {
          if (player.stunTimer > 0) {
            player.stunTimer -= 1;
            player.vx *= 0.8;
            player.vy *= 0.8;
          } else if (!player.isControlled) {
            // Teammates AI (Azules)
            if (player.team === 'player') {
              const defaultTargetX = Math.min(BOUNDARY_LINE_PLAYER - 40, 160 + Math.sin(currentTime * 0.003 + player.number) * 50);
              const defaultTargetY = player.id === 'p2' ? 150 : 390;

              if (!ball.ownerId && ball.x <= BOUNDARY_LINE_PLAYER + 30) {
                // Ball on player side: help intercept or recover
                const dx = ball.x - player.x;
                const dy = ball.y - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 10) {
                  player.vx = (dx / dist) * player.speed * 0.95;
                  player.vy = (dy / dist) * player.speed * 0.95;
                  player.facingAngle = Math.atan2(dy, dx);
                }
              } else {
                const dx = defaultTargetX - player.x;
                const dy = defaultTargetY - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 15) {
                  player.vx = (dx / dist) * player.speed * 0.75;
                  player.vy = (dy / dist) * player.speed * 0.75;
                  player.facingAngle = 0;
                } else {
                  player.vx *= 0.6;
                  player.vy *= 0.6;
                }
              }
            }
            // Rival AI (Rojos)
            else if (player.team === 'rival') {
              if (player.hasBall) {
                // 1. Advance towards the firing line
                const frontLineX = isLineFree ? BOUNDARY_LINE_PLAYER + 60 : BOUNDARY_LINE_RIVAL + 25;
                const dx = frontLineX - player.x;
                player.facingAngle = Math.PI; // Face player goal (left)

                if (Math.abs(dx) > 12) {
                  player.vx = (dx > 0 ? 1 : -1) * player.speed * 0.9;
                } else {
                  player.vx = 0;
                }

                // 2. Weave vertically to find an open shot
                const playerDefendY = controlled ? controlled.y : 270;
                const preferredTargetY = playerDefendY < FIELD_HEIGHT / 2 ? 390 : 150;
                rivalAimYRef.current = preferredTargetY;

                const desiredY = player.id === 'r1' ? (playerDefendY < 270 ? 330 : 210) : player.y;
                const dyMove = desiredY - player.y;
                if (Math.abs(dyMove) > 10) {
                  player.vy = (dyMove > 0 ? 1 : -1) * player.speed * 0.6;
                } else {
                  player.vy = 0;
                }

                rivalShootTimerRef.current += 1;

                if (rivalShootTimerRef.current > 10) {
                  player.armState = 'charging';
                  player.armChargePower = Math.min(1, rivalShootTimerRef.current / 48);
                  player.expression = 'serious';
                }

                // Fire trail windup particles
                if (rivalShootTimerRef.current % 12 === 0 && rivalShootTimerRef.current < 45) {
                  addFireTrail(player.x - 14, player.y);
                }

                // 3. RELEASE SHOT!
                if (rivalShootTimerRef.current >= 48) {
                  rivalShootTimerRef.current = 0;
                  player.hasBall = false;
                  player.armState = 'throwing';
                  player.armTimer = 0;
                  player.expression = 'tongue';
                  player.expressionTimer = 60;
                  ball.ownerId = null;

                  const rivalPower = 0.68 + Math.random() * 0.32; // 0.68 - 1.0
                  const isSuperRivalShot = rivalPower >= 0.88;
                  const throwSpeed = 14 + rivalPower * 9; // 20 - 23 px/frame

                  // Aim at open baseline spot
                  const targetY = Math.max(65, Math.min(FIELD_HEIGHT - 65, preferredTargetY + (Math.random() - 0.5) * 110));
                  const targetX = ENDLINE_LEFT;
                  const shootDx = targetX - player.x;
                  const shootDy = targetY - player.y;
                  const angle = Math.atan2(shootDy, shootDx);

                  ball.vx = Math.cos(angle) * throwSpeed;
                  ball.vy = Math.sin(angle) * throwSpeed;
                  ball.elevation = 18 + rivalPower * 8;

                  lastThrowerRef.current = player.id;
                  throwCooldownRef.current = 40; // Shooter cannot immediately re-catch!

                  sounds.playKick();
                  if (isSuperRivalShot) {
                    sounds.playPunch();
                    gameStateRef.current.screenShake = 11;
                    addFloatingText('🔥 ¡CAÑONAZO RIVAL! 🚀', player.x, player.y - 30, '#ef4444');
                    addDustExplosion(player.x, player.y, 14, '#f87171');
                  } else {
                    addFloatingText('💥 ¡DISPARO RIVAL! 🖐️', player.x, player.y - 25, '#f87171');
                    addDustExplosion(player.x, player.y, 8, '#fca5a5');
                  }
                }
              } else {
                // Rival without ball: Defend, intercept or chase loose ball
                if (!ball.ownerId) {
                  if (ball.vx > 1.5) {
                    // Ball shot by player towards rival side: INTERCEPT!
                    const timeToReach = (player.x - ball.x) / ball.vx;
                    if (timeToReach > 0 && timeToReach < 85) {
                      const predictedY = Math.max(50, Math.min(FIELD_HEIGHT - 50, ball.y + ball.vy * timeToReach));
                      const dy = predictedY - player.y;
                      if (Math.abs(dy) > 8) {
                        player.vy = (dy > 0 ? 1 : -1) * player.speed * 1.0;
                      } else {
                        player.vy = 0;
                      }
                      // Step towards line to meet ball
                      const targetInterX = BOUNDARY_LINE_RIVAL + 35;
                      const dx = targetInterX - player.x;
                      if (Math.abs(dx) > 10) {
                        player.vx = (dx > 0 ? 1 : -1) * player.speed * 0.7;
                      } else {
                        player.vx = 0;
                      }
                    }
                  } else if (ball.x >= (isLineFree ? BOUNDARY_LINE_PLAYER : BOUNDARY_LINE_RIVAL - 20)) {
                    // Loose ball in reachable territory: chase it!
                    const dx = ball.x - player.x;
                    const dy = ball.y - player.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 8) {
                      player.vx = (dx / dist) * player.speed * 0.95;
                      player.vy = (dy / dist) * player.speed * 0.95;
                    }
                  } else {
                    // Return to guard formation
                    const targetX = player.id === 'r1' ? 730 : player.id === 'r2' ? 800 : 830;
                    const targetY = player.id === 'r1' ? 270 : player.id === 'r2' ? 150 : 390;
                    const dx = targetX - player.x;
                    const dy = targetY - player.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 15) {
                      player.vx = (dx / dist) * player.speed * 0.6;
                      player.vy = (dy / dist) * player.speed * 0.6;
                    } else {
                      player.vx *= 0.5;
                      player.vy *= 0.5;
                    }
                  }
                } else {
                  // Ball is possessed
                  const ballOwner = playersRef.current.find(p => p.id === ball.ownerId);
                  if (ballOwner?.team === 'rival') {
                    // Teammate rival has ball: spread out
                    const targetY = player.id === 'r1' ? 270 : player.id === 'r2' ? 130 : 410;
                    const dy = targetY - player.y;
                    if (Math.abs(dy) > 10) {
                      player.vy = (dy > 0 ? 1 : -1) * player.speed * 0.5;
                    }
                  } else {
                    // Player has ball: form defensive wall
                    const targetX = BOUNDARY_LINE_RIVAL + 30;
                    const dx = targetX - player.x;
                    if (Math.abs(dx) > 15) {
                      player.vx = (dx > 0 ? 1 : -1) * player.speed * 0.6;
                    }
                    const targetY = player.id === 'r1' ? 270 : player.id === 'r2' ? 160 : 380;
                    const dy = targetY - player.y;
                    if (Math.abs(dy) > 10) {
                      player.vy = (dy > 0 ? 1 : -1) * player.speed * 0.4;
                    }
                  }
                }
                player.facingAngle = Math.PI;
              }
            }
          }

          player.x += player.vx;
          player.y += player.vy;

          if (!isLineFree) {
            if (player.team === 'player' && player.x > BOUNDARY_LINE_PLAYER) {
              player.x = BOUNDARY_LINE_PLAYER;
              player.vx = 0;
            } else if (player.team === 'rival' && player.x < BOUNDARY_LINE_RIVAL) {
              player.x = BOUNDARY_LINE_RIVAL;
              player.vx = 0;
            }
          }

          player.x = Math.max(player.radius + 20, Math.min(FIELD_WIDTH - player.radius - 20, player.x));
          player.y = Math.max(player.radius + 25, Math.min(FIELD_HEIGHT - player.radius - 25, player.y));

          // --- PIXEL ANIMATION UPDATES ---
          const spd = Math.hypot(player.vx, player.vy);
          const isMoving = spd > 0.35;

          // 1. Run cycle and running dust particles
          if (isMoving && player.stunTimer <= 0) {
            player.runCycle = (player.runCycle + spd * 0.048) % 1;
            if (Math.random() < 0.22) {
              const facing = player.facingDirection || 1;
              particlesRef.current.push({
                id: Math.random().toString(),
                x: player.x - facing * 10 + (Math.random() - 0.5) * 6,
                y: player.y + 14,
                vx: -facing * (0.8 + Math.random() * 0.7),
                vy: -0.3 - Math.random() * 0.4,
                size: 2 + Math.random() * 2,
                color: player.team === 'player' ? '#93c5fd' : '#fca5a5',
                life: 0,
                maxLife: 15,
              });
            }
          } else {
            player.runCycle = 0;
          }

          // 2. Facing direction based on movement
          if (Math.abs(player.vx) > 0.35) {
            player.facingDirection = player.vx > 0 ? 1 : -1;
          }

          // 3. Arm state and timers
          if (player.armState === 'throwing') {
            player.armTimer += 1;
            if (player.armTimer > 18) {
              player.armState = player.hasBall ? 'holding' : 'none';
              player.armTimer = 0;
            }
          } else if (player.hasBall) {
            if (player.isControlled && chargeRef.current.isCharging) {
              player.armState = 'charging';
              player.armChargePower = chargeRef.current.power;
            } else if (!player.isControlled && player.team === 'rival' && rivalShootTimerRef.current > 10) {
              player.armState = 'charging';
              player.armChargePower = Math.min(1, rivalShootTimerRef.current / 48);
            } else {
              player.armState = 'holding';
            }
          } else {
            player.armState = 'none';
          }

          // 4. Facial expressions
          if (player.expressionTimer > 0) {
            player.expressionTimer -= 1;
            if (player.expressionTimer <= 0) {
              player.expression = 'smile';
            }
          } else if (player.stunTimer > 0) {
            player.expression = 'dazed';
          } else if (player.armState === 'charging') {
            player.expression = 'serious';
          } else if (spd > 3.0) {
            player.expression = 'tongue';
          } else {
            player.expression = 'smile';
          }
        });

        // --- REFEREE (STATIONARY AT TOP CENTER: 480, 58) ---
        referee.x = REFEREE_POS_X;
        referee.y = REFEREE_POS_Y;
        referee.vx = 0;
        referee.vy = 0;

        if (referee.state === 'fighting') {
          referee.stateTimer -= 1;
          referee.x += (Math.random() - 0.5) * 4;
          referee.y += (Math.random() - 0.5) * 4;
        } else if (referee.state === 'dazed') {
          referee.stateTimer -= 1;
          referee.dazedAngle += 0.08;
          if (referee.stateTimer <= 0) {
            referee.state = 'idle';
            onRefereeMoodUpdate('Normal');
            addSpeechBubble('referee', REFEREE_POS_X, REFEREE_POS_Y + 45, '⚖️ ¡CONTINÚA EL JUEGO!', 120);
          }
        } else if (referee.state === 'angry') {
          referee.stateTimer -= 1;
          if (referee.stateTimer <= 0) {
            referee.state = 'idle';
            onRefereeMoodUpdate('Normal');
          }
        }

        // --- BALL LOGIC ---
        if (ball.ownerId) {
          const owner = playersRef.current.find(p => p.id === ball.ownerId);
          if (owner) {
            const dir = owner.facingDirection || 1;
            const shoulderX = owner.x + dir * 17;
            const shoulderY = owner.y + 4;

            if (owner.armState === 'charging') {
              const pwr = owner.isControlled ? chargeRef.current.power : (owner.armChargePower || 0.5);
              const armAngle = -Math.PI * 0.45 - pwr * 0.35;
              const armLen = (16 + pwr * 4) * 1.3;
              ball.x = shoulderX + dir * Math.cos(armAngle) * armLen;
              ball.y = shoulderY + Math.sin(armAngle) * armLen;
              ball.elevation = 14 + pwr * 6;
            } else {
              ball.x = shoulderX + dir * 19;
              ball.y = shoulderY + 4;
              ball.elevation = 12;
            }
            ball.vx = 0;
            ball.vy = 0;
          } else {
            ball.ownerId = null;
          }
        } else {
          ball.x += ball.vx;
          ball.y += ball.vy;
          ball.vx *= 0.988;
          ball.vy *= 0.988;

          if (Math.abs(ball.vx) > 14) {
            addFireTrail(ball.x, ball.y);
          }

          if (ball.elevation > 0) {
            ball.elevation -= 0.35;
            if (ball.elevation < 0) ball.elevation = 0;
          }

          // Catching ball
          playersRef.current.forEach(player => {
            if (player.stunTimer <= 0) {
              // Cannot immediately catch own throw during cooldown!
              if (player.id === lastThrowerRef.current && throwCooldownRef.current > 0) {
                return;
              }

              const dist = Math.hypot(ball.x - player.x, ball.y - player.y);
              if (dist < player.radius + ball.radius + 12) {
                ball.ownerId = player.id;
                player.hasBall = true;
                ball.elevation = 12;
                lastThrowerRef.current = null;
                throwCooldownRef.current = 0;

                if (player.team === 'player') {
                  sounds.playKick();
                  // Check if it was an interception of a rival shot
                  if (ball.vx < -4) {
                    addFloatingText('🧤 ¡ATAJADÓN! 🛡️', player.x, player.y - 28, '#22c55e');
                  } else {
                    addFloatingText('¡ATRAPADO! 🧤', player.x, player.y - 25, '#38bdf8');
                  }
                  if (!player.isControlled) {
                    playersRef.current.forEach(p => p.isControlled = false);
                    player.isControlled = true;
                  }
                } else {
                  sounds.playKick();
                  addFloatingText('¡RIVAL RECUPERA! 🛑', player.x, player.y - 25, '#f87171');
                  rivalShootTimerRef.current = 0;
                }
              }
            }
          });

          // Wall bounce (top/bottom)
          if (ball.y < ball.radius + 20) {
            ball.y = ball.radius + 20;
            ball.vy = -ball.vy * 0.85;
          } else if (ball.y > FIELD_HEIGHT - ball.radius - 20) {
            ball.y = FIELD_HEIGHT - ball.radius - 20;
            ball.vy = -ball.vy * 0.85;
          }
        }

        // --- CHECK POINTS (NO GOALPOSTS: FULL BASELINE) ---
        if (!gameStateRef.current.isGoalScored) {
          if (ball.x >= ENDLINE_RIGHT) {
            gameStateRef.current.isGoalScored = true;
            gameStateRef.current.lastScorer = 'player';
            gameStateRef.current.scorePlayer += 1;
            gameStateRef.current.screenShake = 16;
            onScoreUpdate(gameStateRef.current.scorePlayer, gameStateRef.current.scoreRival);
            sounds.playGoal();
            sounds.playWhistle();

            const refSays = ['¡SÍ FUE PUNTO! ¡VÁLIDO! ✅', '¡PUNTO PARA EL AZUL! 🎯', '¡¡VALIÓ!! ¡BUEN TIRO! 💥'];
            addSpeechBubble('referee', REFEREE_POS_X, REFEREE_POS_Y + 45, refSays[Math.floor(Math.random() * refSays.length)], 180);

            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 }
            });

            setTimeout(() => {
              gameStateRef.current.isGoalScored = false;
              resetAfterGoal('player');
            }, 2500);
          } else if (ball.x <= ENDLINE_LEFT) {
            gameStateRef.current.isGoalScored = true;
            gameStateRef.current.lastScorer = 'rival';
            gameStateRef.current.scoreRival += 1;
            gameStateRef.current.screenShake = 16;
            onScoreUpdate(gameStateRef.current.scorePlayer, gameStateRef.current.scoreRival);
            sounds.playWhistle();
            sounds.playAngry();

            addSpeechBubble('referee', REFEREE_POS_X, REFEREE_POS_Y + 45, '🚨 ¡PUNTO VÁLIDO PARA EL ROJO! ¡HAY QUE DEFENDER!', 180);

            setTimeout(() => {
              gameStateRef.current.isGoalScored = false;
              resetAfterGoal('rival');
            }, 2500);
          }
        }

        // Update particles
        particlesRef.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life += 1;
          p.size = Math.max(1, p.size * 0.94);
        });
        particlesRef.current = particlesRef.current.filter(p => p.life < p.maxLife);

        floatingTextsRef.current.forEach(ft => {
          ft.y -= 1.2;
          ft.lifetime -= 1;
          ft.opacity = Math.max(0, ft.lifetime / 60);
        });
        floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.lifetime > 0);

        speechBubblesRef.current.forEach(sb => {
          sb.duration -= 1;
        });
        speechBubblesRef.current = speechBubblesRef.current.filter(sb => sb.duration > 0);
      }

      // --- 2. RENDER CANVAS (SIN ARCOS) ---
      ctx.save();

      if (gameStateRef.current.screenShake > 0) {
        const shakeX = (Math.random() - 0.5) * gameStateRef.current.screenShake;
        const shakeY = (Math.random() - 0.5) * gameStateRef.current.screenShake;
        ctx.translate(shakeX, shakeY);
      }

      // Court Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

      // Blue side (Left)
      ctx.fillStyle = '#172554';
      ctx.fillRect(20, 20, BOUNDARY_LINE_PLAYER - 20, FIELD_HEIGHT - 40);

      // Red side (Right)
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(BOUNDARY_LINE_RIVAL, 20, FIELD_WIDTH - 20 - BOUNDARY_LINE_RIVAL, FIELD_HEIGHT - 40);

      // WIDE Central Neutral Zone (280px wide)
      const centralWidth = BOUNDARY_LINE_RIVAL - BOUNDARY_LINE_PLAYER;
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.fillRect(BOUNDARY_LINE_PLAYER, 20, centralWidth, FIELD_HEIGHT - 40);

      // Hazard stripes in center
      ctx.save();
      ctx.beginPath();
      ctx.rect(BOUNDARY_LINE_PLAYER, 20, centralWidth, FIELD_HEIGHT - 40);
      ctx.clip();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.14)';
      ctx.lineWidth = 16;
      for (let x = BOUNDARY_LINE_PLAYER - 200; x < BOUNDARY_LINE_RIVAL + 200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x + FIELD_HEIGHT, FIELD_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();

      // Outer Border
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, FIELD_WIDTH - 40, FIELD_HEIGHT - 40);

      // BOUNDARY LINES
      const refDazed = refereeRef.current.state === 'dazed';

      // Blue Team Line
      ctx.lineWidth = 6;
      ctx.strokeStyle = refDazed ? '#22c55e' : '#3b82f6';
      ctx.shadowColor = refDazed ? '#4ade80' : '#60a5fa';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(BOUNDARY_LINE_PLAYER, 20);
      ctx.lineTo(BOUNDARY_LINE_PLAYER, FIELD_HEIGHT - 20);
      ctx.stroke();

      // Red Team Line
      ctx.strokeStyle = refDazed ? '#22c55e' : '#ef4444';
      ctx.shadowColor = refDazed ? '#4ade80' : '#f87171';
      ctx.beginPath();
      ctx.moveTo(BOUNDARY_LINE_RIVAL, 20);
      ctx.lineTo(BOUNDARY_LINE_RIVAL, FIELD_HEIGHT - 20);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 🚫 NO ARCOS: Full baseline boundary
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(ENDLINE_LEFT, 20);
      ctx.lineTo(ENDLINE_LEFT, FIELD_HEIGHT - 20);
      ctx.stroke();

      const pulseGlow = 4 + Math.sin(currentTime * 0.008) * 3;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = pulseGlow;
      ctx.beginPath();
      ctx.moveTo(ENDLINE_RIGHT, 20);
      ctx.lineTo(ENDLINE_RIGHT, FIELD_HEIGHT - 20);
      ctx.stroke();

      // Section Labels
      ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('🛡️ TU ZONA (SIN ARCOS - PASA LA LÍNEA)', BOUNDARY_LINE_PLAYER / 2, 45);

      ctx.fillStyle = '#f87171';
      ctx.fillText('🎯 LÍNEA DE FONDO RIVAL (¡PASA DE AQUÍ!)', (BOUNDARY_LINE_RIVAL + FIELD_WIDTH) / 2, 45);

      // Render Particles
      particlesRef.current.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Render Referee (STATIONARY UP IN THE CENTER: x=480, y=58)
      const ref = refereeRef.current;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(ref.x, ref.y + ref.radius + 2, ref.radius * 0.9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(ref.x, ref.y);
      ctx.beginPath();
      ctx.arc(0, 0, ref.radius, 0, Math.PI * 2);
      ctx.fillStyle = ref.state === 'angry' ? '#dc2626' : '#0f172a';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-7, -ref.radius + 3, 4, ref.radius * 2 - 6);
      ctx.fillRect(3, -ref.radius + 3, 4, ref.radius * 2 - 6);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 4, 4, 0, Math.PI * 2);
      ctx.fill();

      if (ref.state === 'dazed') {
        ctx.font = '16px serif';
        const starX = Math.cos(ref.dazedAngle) * 22;
        const starY = Math.sin(ref.dazedAngle) * 12 - 20;
        ctx.fillText('⭐', starX, starY);
        ctx.fillText('💫', -starX, -starY - 20);
      } else if (ref.state === 'angry') {
        ctx.font = '18px serif';
        ctx.fillText('💢', 8, -18);
      } else if (ref.state === 'fighting') {
        ctx.font = 'bold 20px system-ui';
        ctx.fillText('💥', 0, -22);
      }
      ctx.restore();

      ctx.font = 'bold 11px system-ui';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText('Árbitro Juez (Arriba) ⚖️', ref.x, ref.y - ref.radius - 6);

      // Render Players
      playersRef.current.forEach(p => {
        // Pixel-art oval shadow under character
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 17, 16, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Controlled player indicator (halo + pulsing arrow)
        if (p.isControlled) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y + 2, 26, 0, Math.PI * 2);
          ctx.stroke();

          const arrowBob = Math.sin(currentTime * 0.008) * 3;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - 25 + arrowBob);
          ctx.lineTo(p.x - 5, p.y - 33 + arrowBob);
          ctx.lineTo(p.x + 5, p.y - 33 + arrowBob);
          ctx.closePath();
          ctx.fill();
        }

        // Draw the full pixel-art ninja hero (with running cycle, flowing ribbon, expressions & pixel arm)
        drawPixelHero({
          ctx,
          player: p,
          currentTime,
          isCharging: p.isControlled && chargeRef.current.isCharging,
          chargePower: p.isControlled ? chargeRef.current.power : (p.armChargePower || 0),
        });

        // Stunned / Dazed effect
        if (p.stunTimer > 0) {
          ctx.font = '16px serif';
          ctx.textAlign = 'center';
          ctx.fillText('💫', p.x, p.y - 26);
        }

        // Name & Number pixel tag
        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = p.team === 'player' ? '#93c5fd' : '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText(`${p.name} #${p.number}`, p.x, p.y + 28);
      });

      // Render Ball
      const b = ballRef.current;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(b.x, b.y + b.elevation + 6, Math.max(5, b.radius * 0.9 - b.elevation * 0.2), 5, 0, 0, Math.PI * 2);
      ctx.fill();

      const ballDrawY = b.y - b.elevation;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(b.x, ballDrawY, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(b.x, ballDrawY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Power meter above player
      const controlledPlayer = playersRef.current.find(p => p.isControlled);
      if (controlledPlayer && controlledPlayer.hasBall) {
        const barWidth = 90;
        const barHeight = 14;
        const barX = controlledPlayer.x - barWidth / 2;
        const barY = controlledPlayer.y - controlledPlayer.radius - 38;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 8);
        ctx.fill();
        ctx.stroke();

        const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(0.5, '#eab308');
        grad.addColorStop(0.85, '#f97316');
        grad.addColorStop(1, '#ef4444');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 4);
        ctx.fill();

        const pointerX = barX + chargeRef.current.power * barWidth;
        const pointerY = barY + barHeight / 2;

        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pointerX, pointerY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = 'bold 11px system-ui';
        ctx.fillStyle = chargeRef.current.isCharging ? '#facc15' : '#e2e8f0';
        ctx.textAlign = 'center';
        const label = chargeRef.current.isCharging
          ? `¡FUERZA: ${Math.round(chargeRef.current.power * 100)}%! (¡Suelta Enter!)`
          : 'Mantén Enter para cargar';
        ctx.fillText(label, controlledPlayer.x, barY - 8);

        ctx.restore();
      }

      // Visual indicator for rival with ball (Aim telegraphing)
      const rivalWithBall = playersRef.current.find(p => p.team === 'rival' && p.hasBall);
      if (rivalWithBall) {
        ctx.save();
        // Pulsing red danger ring around the rival
        const pulse = 8 + Math.sin(currentTime * 0.015) * 4;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = pulse;
        ctx.beginPath();
        ctx.arc(rivalWithBall.x, rivalWithBall.y, rivalWithBall.radius + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Aim trajectory preview
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rivalWithBall.x, rivalWithBall.y);
        ctx.lineTo(ENDLINE_LEFT, rivalAimYRef.current);
        ctx.stroke();
        ctx.setLineDash([]);

        // Charge progress bar
        const chargePct = Math.min(1, rivalShootTimerRef.current / 48);
        const barW = 54;
        const barH = 7;
        const barX = rivalWithBall.x - barW / 2;
        const barY = rivalWithBall.y - rivalWithBall.radius - 24;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(barX - 2, barY - 2, barW + 4, barH + 4);
        ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

        ctx.fillStyle = chargePct > 0.75 ? '#ef4444' : '#f59e0b';
        ctx.fillRect(barX, barY, barW * chargePct, barH);

        ctx.font = 'bold 10px system-ui';
        ctx.fillStyle = '#fca5a5';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ ¡APUNTANDO!', rivalWithBall.x, barY - 6);
        ctx.restore();
      }

      // --- SPEECH BUBBLES ---
      speechBubblesRef.current.forEach(sb => {
        ctx.save();
        ctx.font = 'bold 13px system-ui';
        const textMetrics = ctx.measureText(sb.text);
        const padding = 10;
        const bw = textMetrics.width + padding * 2;
        const bh = 30;
        const bx = sb.x - bw / 2;
        const by = sb.y - bh - 10;

        ctx.fillStyle = sb.speaker === 'referee' ? '#ffffff' : '#fef08a';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 10);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(sb.x - 6, by + bh);
        ctx.lineTo(sb.x, by + bh + 8);
        ctx.lineTo(sb.x + 6, by + bh);
        ctx.fillStyle = sb.speaker === 'referee' ? '#ffffff' : '#fef08a';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sb.text, sb.x, by + bh / 2);
        ctx.restore();
      });

      // Floating Texts
      floatingTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.opacity;
        ctx.font = '900 18px system-ui';
        ctx.fillStyle = ft.color;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      if (gameStateRef.current.isGoalScored) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

        const isPlayerGoal = gameStateRef.current.lastScorer === 'player';
        ctx.font = '900 48px system-ui';
        ctx.fillStyle = isPlayerGoal ? '#facc15' : '#f87171';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;

        const title = isPlayerGoal ? '🎉 ¡¡¡PUNTO ANOTADO!!! 💥🖐️' : '🚨 ¡¡¡PUNTO DEL RIVAL!!! 😱🛡️';
        const subtitle = isPlayerGoal
          ? '¡Gran tiro a la línea de fondo rival!'
          : '¡El rival contraatacó y anotó! ¡Muévete para atajar!';

        ctx.strokeText(title, FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 10);
        ctx.fillText(title, FIELD_WIDTH / 2, FIELD_HEIGHT / 2 - 10);

        ctx.font = 'bold 20px system-ui';
        ctx.fillStyle = '#f8fafc';
        ctx.strokeText(subtitle, FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 35);
        ctx.fillText(subtitle, FIELD_WIDTH / 2, FIELD_HEIGHT / 2 + 35);

        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, onScoreUpdate, onRefereeMoodUpdate, resetAfterGoal, addFireTrail]);

  return (
    <div className="relative w-full max-w-[960px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-700 bg-slate-900 aspect-[16/9]">
      <canvas
        ref={canvasRef}
        width={FIELD_WIDTH}
        height={FIELD_HEIGHT}
        className="w-full h-full block"
      />
    </div>
  );
};
