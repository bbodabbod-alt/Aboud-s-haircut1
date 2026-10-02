import { useState, useEffect } from 'react';
import { Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { getShopStatus, ShopStatusResult } from '../utils/shopHours';
import { SalonSettings, DaySchedule } from '../types';
import { getWeeklySchedule, DEFAULT_WEEKLY_SCHEDULE } from '../utils/salonStore';

interface ScheduleSectionProps {
  onOpenBooking: () => void;
  settings?: SalonSettings;
  weeklySchedule?: DaySchedule[];
}

export default function ScheduleSection({ onOpenBooking, settings, weeklySchedule }: ScheduleSectionProps) {
  const openTime = settings?.openTime || '3:00 م';
  const closeTime = settings?.closeTime || '2:00 ص';

  const [shopStatus, setShopStatus] = useState<ShopStatusResult>(
    getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime)
  );

  // Dynamic Weekly Schedule (Requirement 1)
  const currentSchedule: DaySchedule[] = 
    weeklySchedule && weeklySchedule.length > 0
      ? weeklySchedule
      : settings?.weeklySchedule && settings.weeklySchedule.length > 0
      ? settings.weeklySchedule
      : getWeeklySchedule() || DEFAULT_WEEKLY_SCHEDULE;

  useEffect(() => {
    setShopStatus(getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime));
    const timer = setInterval(() => {
      setShopStatus(getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [settings?.manualShopStatus, openTime, closeTime]);

  return (
    <section id="schedule" className="py-20 bg-[#0e1117] border-t border-neutral-800 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Schedule Info */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Clock className="w-4 h-4" />
              <span>مواعيد الحضور والاستقبال</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              ساعات عمل صالون عبود
            </h2>

            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              نحرص في صالون عبود على توفير أوقات مرنة تناسب جميع الزبائن، مع نظام حجز مسبق يضمن لك عدم الانتظار وبدء خدمتك فور وصولك في الموعد المحدد.
            </p>

            {/* Live Status Card */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  {shopStatus.isOpen ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  )}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>الحالة الحالية:</span>
                    <span className={shopStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'}>{shopStatus.statusText}</span>
                  </h4>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{shopStatus.subText}</p>
                  {!shopStatus.isOpen && shopStatus.countdown && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>العد التنازلي للافتتاح: {shopStatus.countdown.formatted}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={onOpenBooking}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
              >
                احجز موعدك
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>يُفضل الحجز المسبق قبل الحضور لتفادي فترات الذروة وازدحام المحل.</span>
            </div>
          </div>

          {/* Days Table Card (Dynamic Weekly Schedule from LocalStorage - Requirement 1) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 overflow-hidden shadow-xl">
              <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-[#151922]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>جدول أوقات العمل الأسبوعي</span>
                </h3>
                <span className="text-xs text-amber-400 font-semibold font-mono">
                  {openTime} - {closeTime}
                </span>
              </div>

              <div className="divide-y divide-neutral-800/80">
                {currentSchedule.map((item, idx) => (
                  <div key={idx} className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-850 transition-colors">
                    <span className="text-sm font-semibold text-white">{item.day}</span>
                    <div className="flex items-center gap-4">
                      {/* Hours or Closed label */}
                      <span className={`text-xs font-mono font-medium ${
                        item.isClosed ? 'text-rose-400 font-sans' : 'text-neutral-300'
                      }`}>
                        {item.isClosed ? 'مغلق (عطلة)' : `${item.openTime} - ${item.closeTime}`}
                      </span>

                      {/* Status Note Badge */}
                      <span className={`text-[11px] px-2 py-0.5 rounded hidden sm:inline ${
                        item.isClosed
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-neutral-800 text-amber-300'
                      }`}>
                        {item.isClosed ? 'عطلة أسبوعية' : item.note || 'متاح للعمل'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
