import { useEffect, useState } from 'react';
import { BookingSubmission, BookingStatus } from '../types';
import { subscribeToFirebaseBookings } from '../utils/firebaseBookingService';
import { X, Calendar, Clock, Scissors, Phone, User, CheckCircle2, Share2, Trash2, XCircle, CheckCheck } from 'lucide-react';

interface MyBookingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: BookingSubmission[];
  onOpenNewBooking: () => void;
  onCancelBooking: (id: string) => void;
}

export default function MyBookingsModal({
  isOpen,
  onClose,
  bookings,
  onOpenNewBooking,
  onCancelBooking,
}: MyBookingsModalProps) {
  // Live state synchronized with Firebase Firestore
  const [liveBookings, setLiveBookings] = useState<BookingSubmission[]>(bookings);

  useEffect(() => {
    setLiveBookings(bookings);
  }, [bookings]);

  // Real-time synchronization from Firebase Firestore (Status Machine)
  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToFirebaseBookings((fbBookings) => {
      setLiveBookings((prev) => {
        return prev.map((b) => {
          const match = fbBookings.find((fb) => fb.id === b.id || fb.bookingCode === b.bookingCode);
          if (match && match.status !== b.status) {
            return { ...b, status: match.status };
          }
          return b;
        });
      });
    });
    return () => unsubscribe();
  }, [isOpen]);

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

  const handleShare = (booking: BookingSubmission) => {
    const text = encodeURIComponent(
      `مرحباً صالون حلاقة عبود 💈\nتم تأكيد حجزي بالمعلومات التالية:\n\n` +
      `▪ رمز الحجز: ${booking.bookingCode}\n` +
      `▪ اسم الزبون: ${booking.customerName}\n` +
      `▪ نوع الخدمة: ${booking.serviceName}\n` +
      `▪ الوقت: ${booking.date} - ${booking.timeSlot}\n` +
      `▪ السعر: ${booking.servicePrice.toLocaleString('en-US')} د.ع\n` +
      `${booking.notes ? `▪ ملاحظات: ${booking.notes}\n` : ''}` +
      `\nشكراً لكم ويسعدني الحضور في الموعد المحدد.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  /**
   * دالة عرض شارة الحالة وفق متطلبات نظام حالات الحجز:
   * - accepted: "تم قبول حجزك لخدمة: {serviceName}"
   * - rejected: "تم رفض الحجز"
   * - completed: "تم إنجاز الخدمة"
   */
  const getCustomerStatusBadge = (booking: BookingSubmission) => {
    switch (booking.status) {
      case 'accepted':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تم قبول حجزك لخدمة: {booking.serviceName}</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/80 border border-rose-500/40 px-2.5 py-1 rounded-lg">
            <XCircle className="w-3.5 h-3.5" />
            <span>تم رفض الحجز</span>
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-400 bg-sky-950/80 border border-sky-500/40 px-2.5 py-1 rounded-lg">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تم إنجاز الخدمة</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 bg-neutral-800 border border-neutral-700 px-2.5 py-1 rounded-lg">
            <span>تم إلغاء الموعد</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-500/40 px-2.5 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة والتأكيد</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#11141c] border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 text-right"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#161a24]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>حجوزاتك</span>
                {liveBookings.length > 0 && (
                  <span className="text-xs bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                    {liveBookings.length}
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">مراجعة مواعيدك المحجوزة في صالون حلاقة عبود</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto">
          {liveBookings.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12 px-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-neutral-500">
                <Calendar className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">
                  لا توجد حجوزات حالية
                </h4>
                <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
                  لم تقم بحجز أي موعد حتى الآن. يمكنك اختيار الخدمة المناسبة وحجز موعدك المفضل بكل سهولة.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenNewBooking();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>احجز موعدك الآن</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Bookings List */
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-400 pb-1">
                <span>قائمة المواعيد الخاصة بك:</span>
                <span className="text-amber-400">تحديث لحظي من إدارة الصالون</span>
              </div>

              {liveBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl bg-neutral-900/90 border border-neutral-700/80 p-5 space-y-4 shadow-lg hover:border-amber-500/40 transition-colors"
                >
                  {/* Top Bar with Status and Code */}
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                      {getCustomerStatusBadge(booking)}
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-neutral-400">رمز الحجز:</span>
                      <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                        {booking.bookingCode}
                      </span>
                    </div>
                  </div>

                  {/* Booking Core Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* 1. Service */}
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                        <Scissors className="w-3.5 h-3.5 text-amber-400" />
                        <span>نوع الخدمة:</span>
                      </span>
                      <p className="text-sm font-bold text-amber-300">
                        {booking.serviceName}
                      </p>
                    </div>

                    {/* 2. Time & Date */}
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>الوقت المحدد:</span>
                      </span>
                      <p className="text-sm font-bold text-white">
                        {booking.timeSlot}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {booking.date}
                      </p>
                    </div>

                    {/* 3. Price */}
                    <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-1">
                      <span className="text-neutral-400 flex items-center gap-1 text-[11px]">
                        <span>السعر:</span>
                      </span>
                      <p className="text-base font-extrabold text-emerald-400 font-mono">
                        {booking.servicePrice.toLocaleString('en-US')} د.ع
                      </p>
                    </div>
                  </div>

                  {/* Customer Meta */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-1 border-t border-neutral-800/60">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-neutral-300">
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span>{booking.customerName}</span>
                      </span>
                      <span className="flex items-center gap-1 text-neutral-300 font-mono" dir="ltr">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span>{booking.customerPhone}</span>
                      </span>
                    </div>

                    {booking.notes && (
                      <span className="text-[11px] text-neutral-400">
                        ملاحظة: {booking.notes}
                      </span>
                    )}
                  </div>

                  {/* Actions for this booking */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleShare(booking)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>إرسال عبر واتساب</span>
                    </button>

                    {/* زر إلغاء الحجز: يتم إخفاؤه تماماً (display: none) عند إنجاز الخدمة أو إلغائها */}
                    <button
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟')) {
                          onCancelBooking(booking.id);
                        }
                      }}
                      style={{
                        display: (booking.status === 'completed' || booking.status === 'cancelled') ? 'none' : 'inline-flex'
                      }}
                      className="px-3 py-1.5 bg-neutral-800 hover:bg-rose-500/20 text-neutral-300 hover:text-rose-400 rounded-lg text-xs font-medium border border-neutral-700/60 transition-colors cursor-pointer items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إلغاء الحجز</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#161a24] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenNewBooking();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/10"
          >
            <Calendar className="w-4 h-4" />
            <span>حجز موعد إضافي</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
