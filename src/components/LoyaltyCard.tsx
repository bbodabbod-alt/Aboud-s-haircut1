import { useState, useEffect } from 'react';
import { CustomerLoyaltyData } from '../types';
import { 
  getStoredLoyaltyPhone, 
  setStoredLoyaltyPhone, 
  subscribeToCustomerLoyalty, 
  normalizeLoyaltyPhone 
} from '../utils/loyaltyService';
import { 
  Scissors, Gift, Award, Sparkles, Check, Phone, 
  Share2, ArrowLeft, Star, Crown, AlertCircle 
} from 'lucide-react';

interface LoyaltyCardProps {
  initialPhone?: string;
  customerName?: string;
  onSelectUseFreeHaircut?: () => void;
  showApplyFreeRewardButton?: boolean;
  compact?: boolean;
}

export default function LoyaltyCard({
  initialPhone = '',
  customerName = '',
  onSelectUseFreeHaircut,
  showApplyFreeRewardButton = false,
  compact = false,
}: LoyaltyCardProps) {
  const [phone, setPhone] = useState<string>(() => {
    return initialPhone || getStoredLoyaltyPhone() || '';
  });
  const [phoneInput, setPhoneInput] = useState<string>(phone);
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(!phone);
  const [loyaltyData, setLoyaltyData] = useState<CustomerLoyaltyData | null>(null);

  // Sync if initialPhone changes
  useEffect(() => {
    if (initialPhone && initialPhone !== phone) {
      setPhone(initialPhone);
      setPhoneInput(initialPhone);
      setIsEditingPhone(false);
    }
  }, [initialPhone]);

  // Subscribe to live loyalty data for this phone
  useEffect(() => {
    const clean = normalizeLoyaltyPhone(phone);
    if (!clean) {
      setLoyaltyData(null);
      return;
    }

    setStoredLoyaltyPhone(clean);
    const unsubscribe = subscribeToCustomerLoyalty(clean, (data) => {
      setLoyaltyData(data);
    });
    return () => unsubscribe();
  }, [phone]);

  const handlePhoneSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeLoyaltyPhone(phoneInput);
    if (clean) {
      setPhone(clean);
      setStoredLoyaltyPhone(clean);
      setIsEditingPhone(false);
    }
  };

  const currentStamps = loyaltyData ? Number(loyaltyData.stampsCount) || 0 : 0;
  const isFreeEligible = loyaltyData ? (loyaltyData.stampsCount >= 10 || loyaltyData.freeHaircutAvailable) : false;
  const displayName = loyaltyData?.customerName || customerName || 'زبون صالون عبود المميّز';
  const percentage = Math.min(100, (currentStamps / 10) * 100);

  const handleShareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `💈 بطاقة الولاء الرقمية الخاصة بي في صالون حلاقة عبود:\n\n` +
      `▪ الاسم: ${displayName}\n` +
      `▪ رصيد الأختام: ${currentStamps} من 10 أختام\n` +
      (isFreeEligible 
        ? `🎉 مبارك! حلاقتي القادمة مجانية بالكامل!\n`
        : `✨ باقي لي ${10 - currentStamps} أختام للحصول على حلاقة مجانية!\n`) +
      `\nاحصل على ختم مع كل حلاقة، والـ 10 علينا!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="w-full max-w-lg mx-auto font-sans select-none">
      
      {/* Physical-style Virtual Loyalty Card */}
      <div className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 shadow-2xl ${
        isFreeEligible
          ? 'border-amber-400/80 shadow-amber-500/20 bg-gradient-to-br from-[#161a24] via-[#10131b] to-[#1c170d]'
          : 'border-amber-500/40 shadow-black/60 bg-gradient-to-br from-[#121620] via-[#0d1017] to-[#171a22]'
      } ${compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'}`}>

        {/* Ambient Gold Glow Elements */}
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-yellow-500/10 blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex items-start justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 text-neutral-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20">
              <Scissors className="w-6 h-6 rotate-90" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white tracking-wide">
                  صالون حلاقة عبود
                </span>
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  <span>VIP LOYALTY</span>
                </span>
              </div>
              <p className="text-[10px] text-amber-400/90 font-mono tracking-widest uppercase">
                بطاقة الولاء الرقمية الافتراضية
              </p>
            </div>
          </div>

          <button
            onClick={handleShareOnWhatsApp}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/30 transition-all cursor-pointer"
            title="مشاركة أو حفظ البطاقة عبر واتساب"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Identity Bar / Phone Lookup */}
        <div className="relative z-10 py-3.5 border-b border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          {isEditingPhone ? (
            <form onSubmit={handlePhoneSubmit} className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Phone className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-2.5" />
                <input
                  type="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="أدخل رقم هاتفك لعرض أختامك..."
                  className="w-full bg-neutral-900 border border-amber-500/40 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold rounded-xl text-xs hover:from-amber-300 hover:to-amber-400 cursor-pointer shadow-sm transition-all"
              >
                تأكيد
              </button>
            </form>
          ) : (
            <>
              <div>
                <span className="text-[11px] text-neutral-400 block">حامل البطاقة:</span>
                <span className="text-white font-bold">{displayName}</span>
                {phone && (
                  <span className="text-[11px] text-amber-400/90 font-mono block" dir="ltr">
                    {phone}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsEditingPhone(true)}
                className="text-[10px] text-neutral-400 hover:text-amber-300 underline cursor-pointer transition-colors"
              >
                تغيير الرقم
              </button>
            </>
          )}
        </div>

        {/* Required Notice: Customer Phone & Loyalty Stamp Accumulation */}
        <div className="relative z-10 my-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-right">
            <strong className="text-amber-300 font-bold">ملاحظة هامة: </strong>
            يرجى إدخال رقم هاتفك الصحيح والخاص بك عند كل حجز، لكي يتم احتساب وتراكم النقاط والأختام تلقائياً على بطاقة الولاء الخاصة بك.
          </p>
        </div>

        {/* 10 Stamp Slots Grid */}
        <div className="relative z-10 py-5 space-y-3">
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-200 font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الأختام المكتسبة:</span>
            </span>
            <span className="font-mono font-black text-sm text-amber-400">
              {currentStamps} / 10
            </span>
          </div>

          {/* 10 Slots Layout: 2 rows of 5 */}
          <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isStamped = idx < currentStamps;
              const isTenth = idx === 9;

              return (
                <div
                  key={idx}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-2xl aspect-square transition-all duration-300 ${
                    isStamped
                      ? isTenth
                        ? 'bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-400 text-neutral-950 shadow-xl shadow-amber-500/40 border-2 border-amber-300 scale-105'
                        : 'bg-gradient-to-tr from-amber-400 to-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 border border-amber-300/80 scale-100'
                      : isTenth
                      ? 'bg-neutral-900/90 border-2 border-dashed border-amber-500/50 text-amber-400/80 hover:border-amber-400'
                      : 'bg-neutral-900/80 border-2 border-dashed border-neutral-700/80 text-neutral-500'
                  }`}
                >
                  {/* Slot Icon & Label */}
                  {isStamped ? (
                    <div className="flex flex-col items-center justify-center">
                      {isTenth ? (
                        <>
                          <Gift className="w-5 h-5 text-neutral-950 animate-bounce" />
                          <span className="text-[9px] font-black text-neutral-950 mt-0.5">مجاناً!</span>
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4 text-neutral-950 rotate-90" />
                          <span className="text-[10px] font-black text-neutral-950 mt-0.5">✓ {idx + 1}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      {isTenth ? (
                        <>
                          <Gift className="w-5 h-5 text-amber-400/70" />
                          <span className="text-[9px] font-bold text-amber-400/90 mt-0.5">الـ 10</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 text-neutral-600 mb-0.5" />
                          <span className="text-[11px] font-mono font-bold">{idx + 1}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Tiny Ribbon on 10th Slot */}
                  {isTenth && (
                    <div className="absolute -top-1 -right-1">
                      <span className="relative flex h-2.5 w-2.5">
                        {isStamped && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        )}
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Golden Progress Bar */}
          <div className="space-y-1 pt-1">
            <div className="w-full bg-neutral-900/90 rounded-full h-2 overflow-hidden border border-neutral-800">
              <div 
                className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-2 rounded-full transition-all duration-700 shadow-sm shadow-amber-500/50"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-neutral-400">
              <span>{currentStamps} من 10 أختام مكتملة</span>
              <span>{isFreeEligible ? '🎉 الهدية جاهزة!' : `باقي ${10 - currentStamps} أختام للهدية`}</span>
            </div>
          </div>

        </div>

        {/* Celebration Banner when 10 Stamps are Completed */}
        {isFreeEligible && (
          <div className="relative z-10 mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border border-amber-400/50 text-center space-y-1 animate-pulse">
            <div className="flex items-center justify-center gap-1.5 text-amber-300 font-black text-xs sm:text-sm">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>🎉 ألف مبروك! لقد أكملت 10 أختام وحصلت على حلاقة مجانية!</span>
            </div>
            <p className="text-[11px] text-amber-200/90">
              أبرز هذه البطاقة للحلاق عند زيارتك للصالون للاستفادة من حلاقتك المجانية.
            </p>

            {showApplyFreeRewardButton && onSelectUseFreeHaircut && (
              <button
                type="button"
                onClick={onSelectUseFreeHaircut}
                className="mt-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95"
              >
                تطبيق الحلاقة المجانية لهذا الحجز (0 د.ع)
              </button>
            )}
          </div>
        )}

        {/* Card Footer Policy Notice (Requested Text) */}
        <div className="relative z-10 pt-3 border-t border-neutral-800/80 text-center space-y-1">
          <p className="text-xs sm:text-sm font-black text-amber-400 tracking-wide">
            "احصل على ختم مع كل حلاقة، والـ 10 علينا!"
          </p>
          <p className="text-[10px] text-neutral-400 leading-relaxed">
            تُضاف الأختام تلقائياً إلى بطاقتك فور اكتمال حلاقتك في الصالون برقم هاتفك.
          </p>
        </div>

      </div>

    </div>
  );
}
