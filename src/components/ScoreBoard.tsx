import { Volume2, VolumeX, Pause, Play, RotateCcw, ShieldAlert } from 'lucide-react';

interface ScoreBoardProps {
  scorePlayer: number;
  scoreRival: number;
  timeLeft: number;
  refereeMood: string;
  isPaused: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onRestartGame: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  scorePlayer,
  scoreRival,
  timeLeft,
  refereeMood,
  isPaused,
  soundEnabled,
  onToggleSound,
  onTogglePause,
  onRestartGame,
}) => {
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getMoodBadge = (mood: string) => {
    if (mood.includes('Noqueado')) {
      return 'bg-purple-600/90 text-purple-100 border-purple-400 animate-pulse';
    }
    if (mood.includes('FURIOSO') || mood.includes('Peleando')) {
      return 'bg-red-600/90 text-red-100 border-red-400 animate-bounce';
    }
    return 'bg-slate-700/80 text-slate-200 border-slate-600';
  };

  return (
    <div className="w-full max-w-[960px] mx-auto bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-slate-700 mb-3 flex flex-wrap items-center justify-between gap-4">
      {/* Marcador Central */}
      <div className="flex items-center gap-6">
        {/* Tu Equipo */}
        <div className="flex items-center gap-3 bg-blue-950/60 border border-blue-500/40 rounded-xl px-4 py-2">
          <img src="./mascot/blue_smile.png" alt="Ninja Azul" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
          <div>
            <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Ninjas Azules</div>
            <div className="text-3xl font-black text-white">{scorePlayer}</div>
          </div>
        </div>

        <div className="text-2xl font-black text-slate-500">VS</div>

        {/* Rival */}
        <div className="flex items-center gap-3 bg-red-950/60 border border-red-500/40 rounded-xl px-4 py-2">
          <div>
            <div className="text-xs font-semibold text-red-300 uppercase tracking-wider text-right">Ninjas Rojos</div>
            <div className="text-3xl font-black text-white text-right">{scoreRival}</div>
          </div>
          <img src="./mascot/red_smile.png" alt="Ninja Rojo" className="w-8 h-8 object-contain rounded-lg shadow-sm" />
        </div>
      </div>

      {/* Tiempo & Estado del Árbitro */}
      <div className="flex items-center gap-4">
        {/* Timer */}
        <div className="bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-700 text-center min-w-[90px]">
          <div className="text-[10px] uppercase font-bold text-slate-400">Tiempo</div>
          <div className="text-2xl font-mono font-bold text-amber-400">{formatTime(timeLeft)}</div>
        </div>

        {/* Estado del Árbitro */}
        <div className={`px-4 py-2 rounded-xl border text-center transition-all ${getMoodBadge(refereeMood)}`}>
          <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold tracking-wider">
            <ShieldAlert className="w-3 h-3" />
            Árbitro
          </div>
          <div className="text-sm font-black whitespace-nowrap">{refereeMood}</div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-slate-200 hover:text-white border border-slate-600"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-rose-400" />}
        </button>

        <button
          onClick={onTogglePause}
          title={isPaused ? 'Reanudar juego' : 'Pausar juego'}
          className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-slate-200 hover:text-white border border-slate-600"
        >
          {isPaused ? <Play className="w-5 h-5 text-amber-400" /> : <Pause className="w-5 h-5" />}
        </button>

        <button
          onClick={onRestartGame}
          title="Reiniciar partido"
          className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-slate-200 hover:text-white border border-slate-600"
        >
          <RotateCcw className="w-5 h-5 text-sky-400" />
        </button>
      </div>
    </div>
  );
};
