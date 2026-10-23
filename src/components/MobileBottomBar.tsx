import { Calendar, Phone, MessageSquare, Award } from 'lucide-react';

interface MobileBottomBarProps {
  onOpenBooking: () => void;
  onOpenLoyaltyModal?: () => void;
}

export default function MobileBottomBar({ onOpenBooking, onOpenLoyaltyModal }: MobileBottomBarProps) {
  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0e1117]/95 backdrop-blur-lg border-t border-neutral-800 p-2 shadow-2xl">
      <div className="flex items-center gap-1.5 max-w-md mx-auto">
        <a
          href="tel:+9647800000000"
          className="p-2 bg-neutral-900 border border-neutral-700/80 hover:bg-neutral-800 text-neutral-200 text-xs font-semibold rounded-xl flex items-center justify-center transition-colors"
          aria-label="اتصال بالصالون"
          title="اتصال"
        >
          <Phone className="w-4 h-4 text-amber-400" />
        </a>

        {onOpenLoyaltyModal && (
          <button
            onClick={onOpenLoyaltyModal}
            className="flex-1 py-2 px-2.5 bg-neutral-900/90 border border-amber-500/30 hover:bg-neutral-800 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer"
            aria-label="بطاقة الولاء"
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-[11px]">الولاء</span>
          </button>
        )}

        <a
          href="https://wa.me/?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%AD%D9%84%D8%A7%D9%82%D8%A9%20%D8%B9%D8%A8%D9%88%D8%AF%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%AD%D8%AC%D8%B2%20%D9%85%D9%88%D8%B9%D8%AF"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-2 px-2.5 bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-colors"
          aria-label="محادثة واتساب"
        >
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px]">واتساب</span>
        </a>

        <button
          onClick={onOpenBooking}
          className="flex-[1.5] py-2 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          <span>احجز</span>
        </button>
      </div>
    </div>
  );
}
