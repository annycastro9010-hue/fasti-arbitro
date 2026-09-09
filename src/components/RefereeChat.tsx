import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, AlertCircle, ShieldAlert } from 'lucide-react';
import { sounds } from '../audio/soundEffects';

export interface ChatMessage {
  id: string;
  sender: 'player' | 'referee';
  text: string;
  timestamp: string;
  isYellowCard?: boolean;
}

interface RefereeChatProps {
  onSendInsult: (text: string, refereeReply: string, isYellowCard: boolean) => void;
}

const QUICK_INSULTS = [
  '¡¿Cómo a ellos sí se lo vale?! 🤬',
  '¡Árbitro vendido, cómprate lentes! 👓',
  '¡Estás ciego o te pagan con empanadas! 🥟',
  '¡Ladrón, no viste esa mano! 🛑',
  '¡Deja de favorecer al rojo! 😡',
];

const REFEREE_REPLIES = [
  { text: '¡A mí me respetas o los mando a las duchas a los 3! 🤬', isCard: false },
  { text: '¡TARJETA AMARILLA POR BOCÓN Y DESACATO! 🟨', isCard: true },
  { text: '¡El VAR me dice que te calles y sigas jugando! 📺', isCard: false },
  { text: '¡Lávate la boca antes de dirigirte a la autoridad! 😤', isCard: false },
  { text: '¡¿Quieres que te saque la roja de una vez?! 🟥', isCard: true },
  { text: '¡Yo cobro lo que veo, no lo que ustedes lloran! ⚖️', isCard: false },
  { text: '¡Una palabra más y les pito punto en contra! 🛑', isCard: false },
  { text: '¡Cómprate tú unas gafas para embocar la pelota! 👓', isCard: false },
];

export const RefereeChat: React.FC<RefereeChatProps> = ({ onSendInsult }) => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'referee',
      text: '⚖️ Soy la máxima autoridad aquí arriba. ¡El que reclame se va con tarjeta!',
      timestamp: 'Inicio',
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const raw = textToSend || inputText;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Player message
    const playerMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'player',
      text: trimmed,
      timestamp: time,
    };

    // Pick a funny referee response
    let replyObj = REFEREE_REPLIES[Math.floor(Math.random() * REFEREE_REPLIES.length)];
    if (trimmed.toLowerCase().includes('cómo a ellos') || trimmed.toLowerCase().includes('selo vale') || trimmed.toLowerCase().includes('se lo vale')) {
      replyObj = { text: '¡A ellos sí se lo vale porque ellos no me insultan! ¡A JUGAR! 😤', isCard: false };
    } else if (trimmed.toLowerCase().includes('ciego') || trimmed.toLowerCase().includes('lentes')) {
      replyObj = { text: '¡Tengo vista 20/20! ¡Tarjeta amarilla por ofensa a la vista! 🟨', isCard: true };
    } else if (trimmed.toLowerCase().includes('ladrón') || trimmed.toLowerCase().includes('vendido')) {
      replyObj = { text: '¡A mí nadie me compra! ¡Respeta el arbitraje o te expulso! 🟥', isCard: true };
    }

    setMessages(prev => [...prev, playerMsg]);
    setInputText('');

    // Trigger in canvas
    onSendInsult(trimmed, replyObj.text, replyObj.isCard);

    // Referee responds after a short pause
    setTimeout(() => {
      const refMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'referee',
        text: replyObj.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isYellowCard: replyObj.isCard,
      };
      setMessages(prev => [...prev, refMsg]);

      if (replyObj.isCard) {
        sounds.playPunch();
        sounds.playWhistle();
      } else {
        sounds.playAngry();
      }
    }, 600);
  };

  return (
    <div className="w-full max-w-[960px] mx-auto mt-3 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
      {/* Header del Chat */}
      <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs md:text-sm font-black text-white uppercase tracking-wider">
            🗣️ Chat con el Árbitro (¡Insúltalo o Reclámale!)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-full border border-slate-700">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          Árbitro en vivo (Arriba en el Centro)
        </div>
      </div>

      {/* Botones de Insultos Rápidos */}
      <div className="px-3 pt-2.5 pb-1 flex flex-wrap gap-1.5 bg-slate-950/40 border-b border-slate-800">
        <span className="text-[10px] text-slate-400 font-bold uppercase py-1 pr-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          Rápidos:
        </span>
        {QUICK_INSULTS.map((insult, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(insult)}
            className="text-xs py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-200 hover:border-rose-500/50 text-slate-300 border border-slate-700 active:scale-95 transition-all"
          >
            {insult}
          </button>
        ))}
      </div>

      {/* Historial de Mensajes */}
      <div className="p-3 h-48 overflow-y-auto space-y-2.5 bg-slate-950/60 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'player' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`text-[10px] font-bold ${msg.sender === 'player' ? 'text-blue-400' : 'text-amber-400'}`}>
                {msg.sender === 'player' ? 'Tú (Capitán)' : 'Árbitro Juez ⚖️'}
              </span>
              <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
            </div>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs font-semibold leading-relaxed shadow-sm ${
                msg.sender === 'player'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : msg.isYellowCard
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-500/50 rounded-tl-none'
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Caja de Texto para Escribir Cualquier Insulto */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-slate-800 border-t border-slate-700 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Escribe un insulto o reclamo al árbitro y pulsa Enviar..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Gritar</span>
        </button>
      </form>
    </div>
  );
};
