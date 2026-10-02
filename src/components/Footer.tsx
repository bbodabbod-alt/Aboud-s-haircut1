import { Scissors, Heart, Phone, Clock, MapPin } from 'lucide-react';
import { SalonSettings } from '../types';

interface FooterProps {
  onOpenBooking: () => void;
  onOpenMyBookings?: () => void;
  settings?: SalonSettings;
}

export default function Footer({ onOpenBooking, onOpenMyBookings, settings }: FooterProps) {
  const salonName = settings?.salonName || 'حلاقة عبود';
  const openTime = settings?.openTime || '3:00 م';
  const closeTime = settings?.closeTime || '2:00 ص';
  const phone = settings?.phone || '+964 780 000 0000';
  const location = settings?.location || 'الشارع العام - مقابل السوق التجاري';

  return (
    <footer className="bg-[#080a0e] border-t border-neutral-800/80 text-neutral-400 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-neutral-800/60">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-950 flex items-center justify-center font-bold">
                <Scissors className="w-4 h-4 rotate-90" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                {salonName}
              </span>
            </div>
            <p className="text-neutral-400 text-xs max-w-md leading-relaxed">
              صالون حلاقة عصري متكامل يقدم أرقى خدمات الحلاقة الرجالية، العناية بالبشرة، والتنظيف العميق بأجهزة متطورة، مع التزام تام بالنظافة ودقة المواعيد.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">روابط سريعة</h4>
            <ul className="space-y-1.5 text-neutral-400">
              <li><a href="#services" className="hover:text-amber-400 transition-colors">قائمة الأسعار والخدمات</a></li>
              <li><a href="#schedule" className="hover:text-amber-400 transition-colors">مواعيد وساعات العمل</a></li>
              {onOpenMyBookings && (
                <li>
                  <button
                    onClick={onOpenMyBookings}
                    className="hover:text-amber-400 transition-colors cursor-pointer text-right"
                  >
                    حجوزاتك ومواعيدك
                  </button>
                </li>
              )}
              <li><a href="#about" className="hover:text-amber-400 transition-colors">عن الصالون والنظافة</a></li>
              <li><a href="#contact" className="hover:text-amber-400 transition-colors">الموقع وأرقام التواصل</a></li>
            </ul>
          </div>

          {/* Customer Service & Working Hours (Dynamic from Settings) */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-semibold text-white">خدمة الزبائن والدوام</h4>
            <div className="space-y-1.5 text-[11px] text-neutral-300">
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>يومياً: {openTime} - {closeTime}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{location}</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span dir="ltr">{phone}</span>
              </p>
            </div>
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenBooking}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline underline-offset-4"
              >
                احجز موعد جديد
              </button>
              {onOpenMyBookings && (
                <>
                  <span className="text-neutral-600">·</span>
                  <button
                    onClick={onOpenMyBookings}
                    className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                  >
                    مراجعة مواعيدك
                  </button>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
          <p>© {new Date().getFullYear()} {salonName}. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-1">
            <span>تم التصميم والتطوير بعناية فائقة لزبائن عبود الكرام</span>
            <Heart className="w-3 h-3 text-amber-500 fill-amber-500/20" />
          </div>
        </div>

      </div>
    </footer>
  );
}
