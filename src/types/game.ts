export type Team = 'player' | 'rival';

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  team: Team;
  number: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  radius: number;
  isControlled: boolean;
  hasBall: boolean;
  stunTimer: number; // For when tackled or hit
  facingAngle: number;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ownerId: string | null;
  elevation: number; // for visual bounce or kick
}

export type RefereeState = 'idle' | 'patrolling' | 'fighting' | 'dazed' | 'angry';

export interface Referee {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  radius: number;
  state: RefereeState;
  stateTimer: number;
  targetPlayerId: string | null;
  health: number; // 0-100 for fight mini-meter
  dazedAngle: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  lifetime: number;
  opacity: number;
}

export interface ComicDustParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameState {
  scorePlayer: number;
  scoreRival: number;
  timeLeft: number;
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  refereeMood: 'Normal' | '¡Peleando!' | '¡Noqueado! 😵' | '¡FURIOSO! 😡';
}
