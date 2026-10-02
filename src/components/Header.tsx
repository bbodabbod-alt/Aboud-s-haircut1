import { useState, useEffect } from 'react';
import { getShopStatus, ShopStatusResult } from '../utils/shopHours';
import { 
  Scissors, Clock, Calendar, Phone, Menu, X, BookmarkCheck, 
  BellRing, Check, Megaphone, Sparkles, ShieldCheck, MapPin 
} from 'lucide-react';
import { SalonSettings, DashboardNotification } from '../types';
import CustomerNotificationsDropdown from './CustomerNotificationsDropdown';

interface HeaderProps {
  onOpenBooking: () => void;
  onOpenMyBookings: () => void;
  onOpenAnnouncements?: () => void;
  announcementsCount?: number;
  bookingsCount: number;
  settings?: SalonSettings;
  customerNotifications?: DashboardNotification[];
  onNotificationsUpdated?: () => void;
  pushEnabled?: boolean;
  onRequestPush?: () => void;
}

export default function Header({
  onOpenBooking,
  onOpenMyBookings,
  onOpenAnnouncements = () => {},
  announcementsCount = 0,
  bookingsCount,
  settings,
  customerNotifications = [],
  onNotificationsUpdated = () => {},
  pushEnabled = false,
  onRequestPush = () => {},
}: HeaderProps) {
  const openTime = settings?.openTime || '10:00 ص';
  const closeTime = settings?.closeTime || '11:30 م';

  const [shopStatus, setShopStatus] = useState<ShopStatusResult>(
    getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update status when settings change or every 20 seconds
  useEffect(() => {
    setShopStatus(getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime));
    const timer = setInterval(() => {
      setShopStatus(getShopStatus(settings?.manualShopStatus || 'auto', openTime, closeTime));
    }, 20000);
    return () => clearInterval(timer);
  }, [settings?.manualShopStatus, openTime, closeTime]);

  const salonDisplayName = settings?.salonName || 'حلاقة عبود';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#0c0e12]/90 border-b border-neutral-800">
      {/* Top Banner with dynamic shop status and Notification Enable Button */}
      <div className="w-full bg-[#131720] border-b border-neutral-800/80 px-4 py-1.5 text-xs text-neutral-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {shopStatus.isOpen ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              )}
            </span>
            <span className={`font-semibold ${shopStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
              {shopStatus.statusText}
            </span>
            <span className="hidden sm:inline text-neutral-500" aria-hidden="true">·</span>
            <span className="hidden sm:inline text-neutral-400">{shopStatus.subText}</span>
          </div>

          <div className="flex items-center gap-3 text-neutral-400 text-[11px] sm:text-xs">
            {/* Quick Announcements Pill in Top Bar */}
            <button
              onClick={onOpenAnnouncements}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="عرض الملاحظات والتنبيهات المباشرة"
            >
              <Megaphone className="w-3.5 h-3.5 text-amber-400" />
              <span>الملاحظات {announcementsCount > 0 ? `(${announcementsCount})` : ''}</span>
            </button>

            <span className="text-neutral-600 hidden xs:inline" aria-hidden="true">|</span>

            {/* Enable Notifications Button */}
            <button
              onClick={onRequestPush}
              className={`font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                pushEnabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
              }`}
              title={pushEnabled ? 'إشعارات الموقع مفعلة على جهازك' : 'تفعيل إشعارات الموقع لتلقي تنبيهات الصالون الفورية'}
            >
              {pushEnabled ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xs:inline">الإشعارات مفعلة</span>
                </>
              ) : (
                <>
                  <BellRing className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>تفعيل إشعارات الموقع</span>
                </>
              )}
            </button>

            <span className="text-neutral-600 hidden sm:inline" aria-hidden="true">|</span>

            <div className="hidden sm:flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>الوقت الحالي: <strong className="text-neutral-200 font-mono tabular-nums">{shopStatus.currentTimeFormatted}</strong></span>
            </div>

            <span className="text-neutral-600" aria-hidden="true">|</span>

            <button
              onClick={onOpenMyBookings}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="عرض ومراجعة حجوزاتك"
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>حجوزاتك {bookingsCount > 0 ? `(${bookingsCount})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Zone */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-neutral-950 rotate-90" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              {salonDisplayName}
            </span>
            <span className="text-[10px] text-neutral-400 -mt-1 tracking-wider">
              ABBOUD BARBERSHOP
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300">
          <a href="#services" className="hover:text-amber-400 transition-colors">
            العروض والخدمات
          </a>
          <a href="#schedule" className="hover:text-amber-400 transition-colors">
            ساعات العمل
          </a>

          {/* Item in Nav: "الملاحظات والتنبيهات" */}
          <button
            onClick={onOpenAnnouncements}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer relative py-1"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>الملاحظات والتنبيهات</span>
            {announcementsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-extrabold rounded-full font-mono animate-pulse">
                {announcementsCount}
              </span>
            )}
          </button>
          
          <button
            onClick={onOpenMyBookings}
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer relative py-1"
          >
            <span>حجوزاتك</span>
            {bookingsCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 text-[10px] font-extrabold rounded-full font-mono">
                {bookingsCount}
              </span>
            ) : null}
          </button>

          <a href="#about" className="hover:text-amber-400 transition-colors">
            عن الصالون
          </a>
          <a href="#contact" className="hover:text-amber-400 transition-colors">
            الموقع والتواصل
          </a>
        </nav>

        {/* Primary Action Zone */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Customer Notifications Bell Icon */}
          <CustomerNotificationsDropdown
            notifications={customerNotifications}
            onNotificationsUpdated={onNotificationsUpdated}
            onOpenMyBookings={onOpenMyBookings}
          />

          <a
            href={`tel:${(settings?.phone || '07712818522').replace(/\s+/g, '')}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs text-neutral-300 hover:text-white border border-neutral-700/80 rounded-lg hover:border-neutral-500 transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
            <span className="tabular-nums">اتصل بنا</span>
          </a>

          <button
            onClick={onOpenBooking}
            className="flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-neutral-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-98 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span className="whitespace-nowrap">احجز موعد</span>
          </button>

          {/* Mobile hamburger menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white focus:outline-none"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (القائمة الجانبية للزبون - تصميم ذهبي موحد لكافة العناصر) */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-[#0e1117] border-b border-neutral-800 space-y-4 animate-in slide-in-from-top-2 duration-200">
          
          {/* Unified Golden Cards Menu (صناديق متساوية بتصميم ذهبي موحد ومتناسق) */}
          <div className="flex flex-col space-y-2.5">
            
            {/* 1. العروض والخدمات */}
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full px-3.5 py-3 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer shadow-sm shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>العروض والخدمات</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-normal">الأسعار والباقات</span>
            </a>

            {/* 2. ساعات العمل */}
            <a
              href="#schedule"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full px-3.5 py-3 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer shadow-sm shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>ساعات العمل</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-normal">أيام الأسبوع</span>
            </a>

            {/* 3. الملاحظات والتنبيهات المهمة */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAnnouncements();
              }}
              className="w-full px-3.5 py-3 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer shadow-sm shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الملاحظات والتنبيهات المهمة</span>
              </div>
              {announcementsCount > 0 ? (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-black rounded-full font-mono">
                  {announcementsCount}
                </span>
              ) : (
                <span className="text-[11px] text-neutral-400 font-normal">سجل الإعلانات</span>
              )}
            </button>

            {/* 4. حجوزاتك ومواعيدك */}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMyBookings();
              }}
              className="w-full px-3.5 py-3 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer shadow-sm shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5">
                <BookmarkCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>حجوزاتك ومواعيدك</span>
              </div>
              {bookingsCount > 0 ? (
                <span className="px-2 py-0.5 bg-amber-500 text-neutral-950 text-xs font-black rounded-full font-mono">
                  {bookingsCount}
                </span>
              ) : (
                <span className="text-[11px] text-neutral-400 font-normal">عرض المواعيد</span>
              )}
            </button>

            {/* 5. عن الصالون */}
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full px-3.5 py-3 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer shadow-sm shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>عن الصالون</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-normal">خبرة وضمان</span>
            </a>

            {/* 6. الموقع والتواصل */}
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full px-3.5 py-3 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer shadow-sm shadow-amber-500/5"
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                <span>الموقع والتواصل</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-normal">العنوان والاتصال</span>
            </a>
          </div>

          {/* Action Bottom Buttons */}
          <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onRequestPush();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 border border-neutral-700/80 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-neutral-800 transition-colors"
            >
              <BellRing className="w-4 h-4 text-amber-400" />
              <span>{pushEnabled ? 'الإشعارات مفعلة ✓' : 'تفعيل إشعارات الموقع'}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>احجز موعد جديد</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
