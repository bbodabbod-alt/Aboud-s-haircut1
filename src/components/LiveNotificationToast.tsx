import { useState, useEffect } from 'react';
import { SalonAnnouncement } from '../types';
import { BellRing, X, Megaphone, AlertTriangle, Sparkles } from 'lucide-react';

interface LiveNotificationToastProps {
  onDismiss?: () => void;
}

// Gentle Web Audio API synthesizer chime (no external mp3 files needed)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (err) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

export default function LiveNotificationToast({ onDismiss }: LiveNotificationToastProps) {
  const [activeToast, setActiveToast] = useState<SalonAnnouncement | null>(null);

  useEffect(() => {
    const handleBroadcast = (e: Event) => {
      const customEvent = e as CustomEvent<SalonAnnouncement>;
      if (customEvent.detail) {
        setActiveToast(customEvent.detail);
        playNotificationChime();
      }
    };

    window.addEventListener('salon_announcement_broadcast', handleBroadcast);
    return () => {
      window.removeEventListener('salon_announcement_broadcast', handleBroadcast);
    };
  }, []);

  // Auto-dismiss after 9 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
      if (onDismiss) onDismiss();
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeToast, onDismiss]);

  if (!activeToast) return null;

  const isClosure = activeToast.type === 'closure';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-start gap-3 ${
        isClosure
          ? 'bg-neutral-900/95 border-rose-500/60 shadow-rose-500/20 text-rose-100'
          : 'bg-neutral-900/95 border-amber-500/60 shadow-amber-500/20 text-neutral-100'
      }`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isClosure ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          {isClosure ? <AlertTriangle className="w-5 h-5" /> : <BellRing className="w-5 h-5 animate-bounce" />}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono">
              إشعار فوري جديد من الصالون
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {activeToast.timestamp}
            </span>
          </div>

          <h4 className="text-sm font-bold text-white leading-tight">
            {activeToast.title}
          </h4>

          <p className="text-xs text-neutral-200 leading-relaxed font-sans">
            {activeToast.content}
          </p>
        </div>

        <button
          onClick={() => setActiveToast(null)}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
