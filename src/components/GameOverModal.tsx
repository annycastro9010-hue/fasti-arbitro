import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';

interface GameOverModalProps {
  scorePlayer: number;
  scoreRival: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  scorePlayer,
  scoreRival,
  onRestart,
}) => {
  const isWinner = scorePlayer > scoreRival;
  const isTie = scorePlayer === scoreRival;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-md w-full p-8 text-center shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full ${isWinner ? 'bg-amber-500/20 border-2 border-amber-400' : 'bg-slate-800'}`}>
            <Trophy className={`w-14 h-14 ${isWinner ? 'text-amber-400' : 'text-slate-400'}`} />
          </div>
        </div>

        <h2 className="text-3xl font-black mb-2 text-white">
          {isWinner ? '🎉 ¡VICTORIA TOTAL!' : isTie ? '🤝 ¡EMPATE ÉPICO!' : '💔 DERROTA'}
        </h2>

        <p className="text-slate-400 text-sm mb-6">
          {isWinner
            ? '¡Cruzaron la barrera rival y dominaron la cancha (y al árbitro)!'
            : isTie
            ? 'Un partido reñido hasta el último segundo.'
            : 'El rival logró defender su barrera. ¡Pelea con el árbitro la próxima vez para distraerlos!'}
        </p>

        {/* Marcador Final */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 flex justify-around items-center mb-6">
          <div className="text-center">
            <div className="text-xs text-blue-400 font-bold uppercase">Tu Equipo</div>
            <div className="text-4xl font-black text-white">{scorePlayer}</div>
          </div>
          <div className="text-xl font-bold text-slate-600">-</div>
          <div className="text-center">
            <div className="text-xs text-red-400 font-bold uppercase">Rival</div>
            <div className="text-4xl font-black text-white">{scoreRival}</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-black text-lg text-white shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <RotateCcw className="w-5 h-5" />
          JUGAR REVANCHA
        </button>
      </div>
    </div>
  );
};
