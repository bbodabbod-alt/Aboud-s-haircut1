import { useEffect } from 'react';
import LoyaltyCard from './LoyaltyCard';
import { X, Award } from 'lucide-react';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  customerName?: string;
}

export default function LoyaltyModal({
  isOpen,
  onClose,
  initialPhone = '',
  customerName = '',
}: LoyaltyModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-[#0e1117] rounded-3xl border border-amber-500/30 p-2 sm:p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-20 p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700/60 transition-colors cursor-pointer"
          aria-label="إغلاق بطاقة الولاء"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="text-center pt-3 pb-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>برنامج ولاء زبائن صالون عبود</span>
          </div>
        </div>

        {/* Virtual Card */}
        <LoyaltyCard
          initialPhone={initialPhone}
          customerName={customerName}
        />
      </div>
    </div>
  );
}
