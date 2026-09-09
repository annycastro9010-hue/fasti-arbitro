import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Swords } from 'lucide-react';

interface TouchControlsProps {
  onTriggerAction: (action: 'pass' | 'fight' | 'charge_start' | 'charge_release') => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onTriggerAction }) => {
  const triggerKey = (key: string, isDown: boolean) => {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
      key,
      code: key === 'Enter' ? 'Enter' : key === ' ' ? 'Space' : `Key${key.toUpperCase()}`,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="w-full max-w-[960px] mx-auto mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Controles de Movimiento Virtual */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700 flex items-center justify-between">
        <div className="text-xs text-slate-400 font-semibold mb-1">
          <div>🎮 Movimiento:</div>
          <div className="text-slate-300 font-mono">WASD o Flechas</div>
        </div>

        {/* Mini D-Pad táctil */}
        <div className="grid grid-cols-3 gap-1.5 w-36 h-36">
          <div />
          <button
            onMouseDown={() => triggerKey('w', true)}
            onMouseUp={() => triggerKey('w', false)}
            onTouchStart={() => triggerKey('w', true)}
            onTouchEnd={() => triggerKey('w', false)}
            className="bg-slate-700 hover:bg-slate-600 active:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div />

          <button
            onMouseDown={() => triggerKey('a', true)}
            onMouseUp={() => triggerKey('a', false)}
            onTouchStart={() => triggerKey('a', true)}
            onTouchEnd={() => triggerKey('a', false)}
            className="bg-slate-700 hover:bg-slate-600 active:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 flex items-center justify-center text-[10px] text-slate-500 font-mono">
            3v3
          </div>
          <button
            onMouseDown={() => triggerKey('d', true)}
            onMouseUp={() => triggerKey('d', false)}
            onTouchStart={() => triggerKey('d', true)}
            onTouchEnd={() => triggerKey('d', false)}
            className="bg-slate-700 hover:bg-slate-600 active:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          <div />
          <button
            onMouseDown={() => triggerKey('s', true)}
            onMouseUp={() => triggerKey('s', false)}
            onTouchStart={() => triggerKey('s', true)}
            onTouchEnd={() => triggerKey('s', false)}
            className="bg-slate-700 hover:bg-slate-600 active:bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md active:scale-95 transition-all"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <div />
        </div>
      </div>

      {/* Botones de Acción Grande */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row gap-3 items-center justify-center">
        {/* Botón Barra de Fuerza: MANTENER Y SOLTAR */}
        <button
          onMouseDown={() => onTriggerAction('charge_start')}
          onMouseUp={() => onTriggerAction('charge_release')}
          onTouchStart={() => onTriggerAction('charge_start')}
          onTouchEnd={() => onTriggerAction('charge_release')}
          className="flex-1 w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 shadow-lg shadow-blue-500/20 text-white font-black text-lg flex items-center justify-center gap-3 transition-all border border-blue-400/30 select-none"
        >
          <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
          <div className="text-left">
            <div>CARGAR Y DISPARAR</div>
            <div className="text-[11px] font-normal text-blue-200">Mantén presionado ENTER y suelta</div>
          </div>
        </button>

        {/* Botón Pelear con el Árbitro con la frase icónica */}
        <button
          onClick={() => onTriggerAction('fight')}
          className="flex-1 w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 active:scale-95 shadow-lg shadow-red-500/25 text-white font-black text-lg flex items-center justify-center gap-3 transition-all border border-rose-400/40 animate-pulse hover:animate-none select-none"
        >
          <Swords className="w-6 h-6 text-amber-300 shrink-0" />
          <div className="text-left">
            <div>¡RECLAMAR AL ÁRBITRO!</div>
            <div className="text-[11px] font-normal text-rose-200">«¡¿Cómo a ellos sí se lo vale?!» (Tecla K / F)</div>
          </div>
        </button>
      </div>
    </div>
  );
};
