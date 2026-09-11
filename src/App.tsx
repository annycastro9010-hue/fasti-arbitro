import { useState, useEffect, useCallback } from 'react';
import { GameCanvas, type ChatInsultEvent } from './game/GameCanvas';
import { ScoreBoard } from './components/ScoreBoard';
import { TouchControls } from './components/TouchControls';
import { RulesModal } from './components/RulesModal';
import { GameOverModal } from './components/GameOverModal';
import { RefereeChat } from './components/RefereeChat';
import type { GameState } from './types/game';
import { sounds } from './audio/soundEffects';
import { HelpCircle, Sparkles } from 'lucide-react';

export function App() {
  const [scorePlayer, setScorePlayer] = useState(0);
  const [scoreRival, setScoreRival] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90); // 90 seconds match
  const [refereeMood, setRefereeMood] = useState<GameState['refereeMood']>('Normal');
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [externalAction, setExternalAction] = useState<'pass' | 'fight' | 'charge_start' | 'charge_release' | null>(null);
  const [chatInsultEvent, setChatInsultEvent] = useState<ChatInsultEvent | null>(null);
  const [gameKey, setGameKey] = useState(0); // To force remount when restarted

  // Match countdown timer
  useEffect(() => {
    if (isPaused || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsGameOver(true);
          sounds.playWhistle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isGameOver]);

  const handleScoreUpdate = useCallback((player: number, rival: number) => {
    setScorePlayer(player);
    setScoreRival(rival);
  }, []);

  const handleRefereeMoodUpdate = useCallback((mood: GameState['refereeMood']) => {
    setRefereeMood(mood);
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
  };

  const handleTogglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleRestartGame = () => {
    setScorePlayer(0);
    setScoreRival(0);
    setTimeLeft(90);
    setRefereeMood('Normal');
    setIsPaused(false);
    setIsGameOver(false);
    setGameKey(k => k + 1);
  };

  const handleSendInsult = (playerText: string, refText: string, isCard: boolean) => {
    setChatInsultEvent({
      playerText,
      refText,
      isCard,
      id: Date.now(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-3 md:p-6 select-none font-sans">
      {/* Encabezado Principal */}
      <header className="w-full max-w-[960px] flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src="./mascot/mascot_smile.png"
            alt="Mascota Ninja"
            className="w-11 h-11 object-contain rounded-2xl bg-slate-900 border border-slate-700 shadow-lg p-0.5"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2 m-0">
              PELOTAZO CAOS 3v3
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> ¡Insulta al Árbitro en el Chat!
              </span>
            </h1>
            <p className="text-xs text-slate-400 m-0">
              Sin arcos: pasa la pelota al fondo rival con la mano. El árbitro vigila arriba en el centro y responde a tus insultos en vivo.
            </p>
          </div>
        </div>

        <button
          onClick={() => setRulesOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
        >
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Cómo Jugar</span>
        </button>
      </header>

      {/* Marcador Superior */}
      <ScoreBoard
        scorePlayer={scorePlayer}
        scoreRival={scoreRival}
        timeLeft={timeLeft}
        refereeMood={refereeMood}
        isPaused={isPaused}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onTogglePause={handleTogglePause}
        onRestartGame={handleRestartGame}
      />

      {/* Lienzo del Juego (Canvas 2D) */}
      <main className="w-full max-w-[960px] flex-1 flex flex-col justify-center">
        <GameCanvas
          key={gameKey}
          onScoreUpdate={handleScoreUpdate}
          onRefereeMoodUpdate={handleRefereeMoodUpdate}
          isPaused={isPaused || isGameOver}
          onGameOver={() => setIsGameOver(true)}
          externalAction={externalAction}
          onClearAction={() => setExternalAction(null)}
          chatInsultEvent={chatInsultEvent}
        />

        {/* Controles Táctiles y de Teclado */}
        <TouchControls onTriggerAction={(action) => setExternalAction(action)} />

        {/* 🗣️ CHAT INTERACTIVO CON EL ÁRBITRO */}
        <RefereeChat onSendInsult={handleSendInsult} />
      </main>

      {/* Barra de atajos de teclado rápida */}
      <footer className="w-full max-w-[960px] text-center text-xs text-slate-500 mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        <div><span className="text-slate-400 font-mono font-bold">WASD / Flechas:</span> Moverse</div>
        <div><span className="text-amber-400 font-mono font-bold">Mantén ENTER:</span> Cargar Fuerza ⚡</div>
        <div><span className="text-emerald-400 font-mono font-bold">Suelta ENTER:</span> ¡Disparar con la Mano! 🚀</div>
        <div><span className="text-rose-400 font-mono font-bold">Chat de Abajo:</span> Escribe e insulta al árbitro 🤬</div>
      </footer>

      {/* Modales */}
      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
      {isGameOver && (
        <GameOverModal
          scorePlayer={scorePlayer}
          scoreRival={scoreRival}
          onRestart={handleRestartGame}
        />
      )}
    </div>
  );
}

export default App;
