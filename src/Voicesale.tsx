import { useRef, useState } from 'react';
import { GemmaError, parseSaleText } from './utils/gemma';
import { NEO } from './ui';

/* The Web Speech API is missing from TypeScript's DOM types, so declare just what we use. */
interface SpeechRec {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecCtor = new () => SpeechRec;

const getSpeechCtor = (): SpeechRecCtor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecCtor;
    webkitSpeechRecognition?: SpeechRecCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

type Phase = 'idle' | 'listening' | 'thinking';

const LABEL: Record<Phase, string> = {
  idle: 'Voice Sale',
  listening: 'Listening… tap to stop',
  thinking: 'Reading your sale…',
};

const FILL: Record<Phase, string> = {
  idle: 'bg-go',
  listening: 'bg-danger',
  thinking: 'bg-warn',
};

export default function VoiceSale() {
  const [phase, setPhase] = useState<Phase>('idle');
  const recRef = useRef<SpeechRec | null>(null);

  const run = async (heard: string) => {
    setPhase('thinking');
    try {
      const result = await parseSaleText(heard);
      alert(`Heard: "${heard}"\n\n${JSON.stringify(result, null, 2)}`);
    } catch (err) {
      alert(err instanceof GemmaError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setPhase('idle');
    }
  };

  const onTap = () => {
    if (phase === 'thinking') return;
    if (phase === 'listening') {
      recRef.current?.stop();
      return;
    }

    const Ctor = getSpeechCtor();
    if (!Ctor) {
      // No speech support (e.g. Firefox): type the sentence so the flow still works.
      const typed = window.prompt('Type the sale, for example: 5 Maggi bechi');
      if (typed?.trim()) void run(typed.trim());
      return;
    }

    const rec = new Ctor();
    rec.lang = 'hi-IN'; // understands Hindi and Hinglish sales talk
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    let heard = '';
    rec.onresult = (e) => {
      heard = e.results[0][0].transcript;
    };
    rec.onerror = (e) => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') alert(`Mic problem: ${e.error}`);
    };
    rec.onend = () => {
      recRef.current = null;
      if (heard.trim()) void run(heard.trim());
      else setPhase('idle');
    };

    recRef.current = rec;
    setPhase('listening');
    rec.start();
  };

  return (
    <button
      type="button"
      onClick={onTap}
      aria-live="polite"
      className={`${NEO} flex h-16 w-full items-center justify-center gap-3 font-display text-2xl font-extrabold ${FILL[phase]}`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" aria-hidden="true">
        <rect x="9" y="3" width="6" height="11" />
        <path d="M5 11v1a7 7 0 0014 0v-1M12 19v3" />
      </svg>
      {LABEL[phase]}
    </button>
  );
}