import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Scissors, Calendar, Sparkles, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import { getShopStatus, ShopStatusResult } from '../utils/shopHours';
import { SalonSettings } from '../types';
import fallbackHeroImg from '../assets/images/barbershop_hero_1790805996946.jpg';

interface HeroProps {
  onOpenBooking: () => void;
  settings?: SalonSettings;
}

export default function Hero({ onOpenBooking, settings }: HeroProps) {
  const openTime = settings?.openTime || '3:00 م';
  const closeTime = settings?.closeTime || '2:00 ص';

  const [shopStatus, setShopStatus] = useState<ShopStatusResult>(
    getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime)
  );

  useEffect(() => {
    setShopStatus(getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime));
    const timer = setInterval(() => {
      setShopStatus(getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings?.manualShopStatus, openTime, closeTime]);

  // 100% Dynamic Content from Settings (LocalStorage)
  const salonName = settings?.salonName || 'حلاقة عبود';
  const welcomeMessage = settings?.welcomeTitle || 'مرحباً بك ايها الزبون عند حلاقة عبود';
  const heroBadge = settings?.heroBadge || 'صالون الحلاقة الرجالية الأول';
  const heroHeadline = settings?.heroHeadline || 'أناقة لا تضاهى، وحلاقة تليق بحضورك';
  const heroDescription = settings?.heroSubtitle || 
    'نقدم لك تجربة حلاقة وعناية استثنائية تجمع بين الحرفية الدقيقة وأحدث تقنيات تنظيف البشرة العميق والأجهزة المتطورة، في بيئة مريحة ومعقمة بأعلى المعايير.';
  const heroImageSrc = settings?.heroImageUrl || fallbackHeroImg;

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-24 bg-gradient-to-b from-[#0c0e12] via-[#10131a] to-[#0c0e12]">
      {/* Background ambient glow effects */}
      <div className="absolute top-1/4 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text and Welcome Animation Zone */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            
            {/* Dynamic Status Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-700/80 shadow-inner"
            >
              <span className="relative flex h-2.5 w-2.5">
                {shopStatus.isOpen ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                )}
              </span>
              <span className={`text-xs font-semibold ${shopStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
                {shopStatus.statusText}
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-xs text-neutral-300">
                {shopStatus.isOpen
                  ? `نستقبلكم حتى ${closeTime}`
                  : shopStatus.countdown
                  ? `يفتح ${openTime} (متبقي ${shopStatus.countdown.hours}س و ${shopStatus.countdown.minutes}د)`
                  : `يفتح يومياً ${openTime}`}
              </span>
            </motion.div>

            {/* Main Animated Welcoming Message Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="p-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-600/20 shadow-lg shadow-amber-500/5 max-w-xl mx-auto lg:mx-0"
            >
              <div className="bg-[#12161f]/95 border border-amber-500/30 rounded-xl px-5 py-3.5 text-center flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  {welcomeMessage}
                </h2>
                <Scissors className="w-5 h-5 text-amber-400 shrink-0 rotate-45" />
              </div>
            </motion.div>

            {/* Main Headline (Dynamic 100%) */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 block">
                {heroHeadline}
              </span>
            </motion.h1>

            {/* Description (Dynamic 100%) */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-neutral-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              {heroDescription}
            </motion.p>

            {/* Call to Actions */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
            >
              <button
                onClick={onOpenBooking}
                className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-neutral-950 font-bold text-base rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                <span>احجز موعدك الآن</span>
              </button>

              <a
                href="#services"
                className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white font-medium text-base rounded-xl border border-neutral-700/80 transition-all flex items-center justify-center gap-2"
              >
                <span>استكشف العروض والخدمات</span>
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </a>
            </motion.div>

            {/* Trust Markers */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-6 border-t border-neutral-800/80 grid grid-cols-3 gap-3 text-right max-w-lg mx-auto lg:mx-0"
            >
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>تعقيم كامل للأدوات</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>أجهزة تنظيف حديثة</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>التزام دقيق بالموعد</span>
              </div>
            </motion.div>

          </div>

          {/* Barbershop Visual Showcase (Dynamic Hero Image from LocalStorage) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-neutral-800 to-amber-600/30 blur-sm" />
              
              <div className="relative rounded-2xl overflow-hidden border border-neutral-700/60 bg-neutral-900 shadow-2xl">
                <img
                  src={heroImageSrc}
                  alt={salonName}
                  className="w-full h-80 sm:h-96 object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackHeroImg;
                  }}
                />
                
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm font-bold text-amber-300">{salonName}</p>
                    <p className="text-xs text-neutral-300 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>دوام العمل: {openTime} - {closeTime}</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${shopStatus.isOpen ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/80 border-rose-500/50 text-rose-300'}`}>
                    {shopStatus.isOpen ? 'مفتوح للزبائن' : 'مغلق حالياً'}
                  </span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
