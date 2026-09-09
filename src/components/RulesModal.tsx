import { X, Trophy, Swords, Users } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-4">
          <span>⚽ Pelotazo Caos 3v3</span>
        </h2>

        <div className="space-y-4 text-sm leading-relaxed">
          {/* Regla 1: Objetivo y Barra de Fuerza */}
          <div className="flex items-start gap-3 bg-blue-950/40 border border-blue-500/30 p-3.5 rounded-2xl">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-base">Barra de Fuerza Oscilante (Enter) ⚡🖐️</div>
              Cuando tengas la pelota, verás una barra de fuerza. <strong className="text-amber-300">Mantén presionado ENTER</strong> y un punto oscilará de izquierda a derecha. <strong className="text-emerald-400">¡Suelta ENTER en el momento justo!</strong> Si la sueltas al máximo (zona roja), saldrá un <strong>Supertiro con fuego 🔥</strong> que cruzará la zona central (ahora mucho más ancha) hacia la barrera rival.
            </div>
          </div>

          {/* Regla 2: El Rival también Dispara */}
          <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-500/30 p-3.5 rounded-2xl">
            <Trophy className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-base">¡Cuidado: El Rival Contraataca! 🎯</div>
              Los rivales también toman la pelota, apuntan y <strong className="text-red-400">disparan con fuerza hacia tu portería</strong>. Muévete rápido para atrapar la pelota con las manos antes de que traspase tu barrera.
            </div>
          </div>

          {/* Regla 2: Pelear con el Árbitro */}
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-500/30 p-3.5 rounded-2xl">
            <Swords className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-base">¡El Árbitro en el Centro! ⚖️🥊</div>
              El árbitro camina en la franja neutral entre ambas líneas. Acércate a tu línea y presiona <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-amber-300 font-mono">K</kbd> o tírele la pelota para pelear:
              <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300 text-xs">
                <li><strong className="text-emerald-300">¡Si lo noqueas (😵)!:</strong> ¡La regla se anula! Las líneas se ponen en verde y puedes cruzar corriendo al campo contrario.</li>
                <li><strong className="text-rose-300">Si se enfurece (😡):</strong> Entra furioso a tu zona para perseguirte con tarjeta amarilla.</li>
              </ul>
            </div>
          </div>

          {/* Regla 3: Pases y Trabajo en equipo */}
          <div className="flex items-start gap-3 bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl">
            <Users className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-white text-base">Pases Inteligentes</div>
              Tus dos compañeros de equipo (Nico y Leo) avanzan por las bandas. Presiona <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-amber-300 font-mono">Espacio</kbd> o <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-600 rounded text-amber-300 font-mono">J</kbd> apuntando hacia ellos para pasarles el balón.
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-black text-white text-base shadow-lg active:scale-98 transition-all"
        >
          ¡ENTENDIDO, A JUGAR! 🔥
        </button>
      </div>
    </div>
  );
};
