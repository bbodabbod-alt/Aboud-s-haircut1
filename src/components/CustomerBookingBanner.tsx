import { BookingSubmission } from '../types';
import { CheckCircle2, Clock, Calendar, Scissors, Phone, Share2 } from 'lucide-react';

interface CustomerBookingBannerProps {
  booking: BookingSubmission;
  totalBookingsCount?: number;
  onOpenBookingModal: () => void;
  onCancelBooking: () => void;
  onOpenMyBookings?: () => void;
}

export default function CustomerBookingBanner({
  booking,
  totalBookingsCount = 1,
  onOpenBookingModal,
  onCancelBooking,
  onOpenMyBookings,
}: CustomerBookingBannerProps) {
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `مرحباً صالون حلاقة عبود 💈\nتم تأكيد حجزي بالمعلومات التالية:\n\n` +
      `▪ رمز الحجز: ${booking.bookingCode}\n` +
      `▪ اسم الزبون: ${booking.customerName}\n` +
      `▪ الخدمة المطلوبة: ${booking.serviceName} (${booking.servicePrice.toLocaleString('en-US')} د.ع)\n` +
      `▪ موعد وتوقيت الحضور: ${booking.date} - ${booking.timeSlot}\n` +
      `${booking.notes ? `▪ ملاحظات: ${booking.notes}\n` : ''}` +
      `\nشكراً لكم ويسعدني الحضور في الموعد المحدد.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div id="customer-booking-details" className="relative py-6 bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-amber-950/30 border-y border-emerald-500/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-2xl bg-[#12161f] border border-emerald-500/40 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          
          {/* Top Decorative bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    تم الحجز بنجاح
                  </span>
                  <span className="text-xs text-neutral-400">
                    (هنا يظهر الحجز الخاص بالزبون)
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                  أهلاً بك يا {booking.customerName}، موعدك مؤكد في صالون عبود
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-center">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-neutral-400">رمز الحجز:</span>
                <span className="text-sm font-mono font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/30">
                  {booking.bookingCode}
                </span>
              </div>

              {onOpenMyBookings && (
                <button
                  onClick={onOpenMyBookings}
                  className="text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-colors cursor-pointer font-semibold"
                >
                  عرض في قائمة حجوزاتك {totalBookingsCount > 1 ? `(${totalBookingsCount})` : ''}
                </button>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 text-xs">
            
            {/* Service */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>الخدمة التي اخترتها:</span>
              </span>
              <p className="text-sm font-bold text-amber-300">
                {booking.serviceName}
              </p>
              <p className="text-emerald-400 font-mono font-semibold pt-0.5">
                {booking.servicePrice.toLocaleString('en-US')} د.ع
              </p>
            </div>

            {/* Time & Date */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>توقيت الحضور:</span>
              </span>
              <p className="text-sm font-bold text-white">
                {booking.timeSlot}
              </p>
              <p className="text-neutral-300 text-[11px] pt-0.5">
                {booking.date}
              </p>
            </div>

            {/* Customer Contact */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 space-y-1">
              <span className="text-neutral-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>بيانات التواصل:</span>
              </span>
              <p className="text-sm font-semibold text-white">
                {booking.customerName}
              </p>
              <p className="text-neutral-400 font-mono text-[11px] pt-0.5" dir="ltr">
                {booking.customerPhone}
              </p>
            </div>

            {/* Actions Quick Box */}
            <div className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col justify-between gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>إرسال للواتساب</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenBookingModal}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-[11px] font-medium transition-colors cursor-pointer text-center"
                >
                  تعديل الحجز
                </button>
                <button
                  onClick={onCancelBooking}
                  className="py-1.5 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg text-[11px] transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>

          </div>

          {/* Notes display if available */}
          {booking.notes && (
            <div className="pt-2 text-xs text-neutral-400 flex items-center gap-2">
              <span className="text-amber-400 font-semibold">ملاحظتك للحلاق:</span>
              <span className="text-neutral-300">{booking.notes}</span>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
