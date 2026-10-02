import { useState, useEffect } from 'react';
import { BarberService, BookingSubmission, DayTimeSlot, DayKey, SalonSettings } from '../types';
import { SERVICES as DEFAULT_SERVICES } from '../data/services';
import { submitBooking } from '../utils/bookingApi';
import { getTimeSlotsForDay } from '../utils/salonStore';
import { subscribeToFirebaseTimeSlots } from '../utils/firebaseBookingService';
import { X, Calendar, Clock, User, Phone, CheckCircle2, AlertCircle, Share2, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: BarberService | null;
  onBookingSuccess: (booking: BookingSubmission) => void;
  existingBooking?: BookingSubmission | null;
  services?: BarberService[];
  settings?: SalonSettings;
}

export default function BookingModal({
  isOpen,
  onClose,
  selectedService,
  onBookingSuccess,
  existingBooking,
  services = DEFAULT_SERVICES,
  settings,
}: BookingModalProps) {
  const availableServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  // Form State
  const [serviceId, setServiceId] = useState<string>(selectedService?.id || availableServices[0].id);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState<DayKey>('today');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:30 صباحاً');
  const [notes, setNotes] = useState('');
  
  // Dynamic Time Slots from LocalStorage (Requirement 2)
  const [daySlots, setDaySlots] = useState<DayTimeSlot[]>(() => getTimeSlotsForDay('today'));

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingSubmission | null>(existingBooking || null);

  // Sync service when prop changes
  useEffect(() => {
    if (selectedService) {
      setServiceId(selectedService.id);
    } else if (availableServices.length > 0) {
      setServiceId(availableServices[0].id);
    }
  }, [selectedService, availableServices]);

  // Sync existing booking when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingBooking) {
        setConfirmedBooking(existingBooking);
      } else {
        setConfirmedBooking(null);
      }
      setErrorMessage('');
    }
  }, [isOpen, existingBooking]);

  // Dynamic Load Time Slots whenever selectedDate changes or LocalStorage / Firebase syncs
  useEffect(() => {
    const applySlots = (slots: DayTimeSlot[]) => {
      setDaySlots(slots);

      // إذا كان الوقت المختار مسبقاً غير متاح أو غير موجود في هذا اليوم، يتم تحديد أول توقيت متاح تلقائياً
      const isCurrentStillAvailable = slots.some((s) => s.timeLabel === selectedTimeSlot && s.isAvailable);
      if (!isCurrentStillAvailable) {
        const firstAvail = slots.find((s) => s.isAvailable);
        if (firstAvail) {
          setSelectedTimeSlot(firstAvail.timeLabel);
        }
      }
    };

    // تحميل الحالة الأولية
    applySlots(getTimeSlotsForDay(selectedDate));

    // الاشتراك اللحظي بقاعدة بيانات Firebase للتحديث الفوري (حجز / إنجاز) بدون ريلود
    const unsubscribeFirebase = subscribeToFirebaseTimeSlots((updatedMap) => {
      if (updatedMap && updatedMap[selectedDate]) {
        applySlots(updatedMap[selectedDate]);
      }
    });

    const handleSync = () => {
      applySlots(getTimeSlotsForDay(selectedDate));
    };

    window.addEventListener('salon_data_synced', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      unsubscribeFirebase();
      window.removeEventListener('salon_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [selectedDate, selectedTimeSlot]);

  // Handle escape key
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

  const currentService = availableServices.find(s => s.id === serviceId) || availableServices[0];

  // Helper date strings
  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const afterTomorrowDate = new Date(todayDate);
  afterTomorrowDate.setDate(afterTomorrowDate.getDate() + 2);

  const dateOptions: { id: DayKey; label: string; dateStr: string }[] = [
    { id: 'today', label: 'اليوم', dateStr: todayDate.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'short' }) },
    { id: 'tomorrow', label: 'غداً', dateStr: tomorrowDate.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'short' }) },
    { id: 'after_tomorrow', label: 'بعد غد', dateStr: afterTomorrowDate.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'short' }) },
  ];

  const activeDateOption = dateOptions.find(d => d.id === selectedDate) || dateOptions[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim()) {
      setErrorMessage('يرجى إدخال اسمك الكريم');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 8) {
      setErrorMessage('يرجى إدخال رقم هاتف صحيح لتأكيد الموعد');
      return;
    }
    if (!selectedTimeSlot) {
      setErrorMessage('يرجى اختيار توقيت الحضور المناسب لك');
      return;
    }

    // فحص إضافي: التأكد من أن التوقيت ما زال متاحاً
    const currentSlots = getTimeSlotsForDay(selectedDate);
    const chosenSlot = currentSlots.find((s) => s.timeLabel === selectedTimeSlot);
    if (chosenSlot && !chosenSlot.isAvailable) {
      setErrorMessage('عذراً، هذا التوقيت تم حجزه للتو من زبون آخر أو مغلق من الإدارة، يرجى اختيار وقت آخر.');
      return;
    }

    setIsSubmitting(true);

    try {
      // إرسال بيانات الحجز وحفظها ومزامنتها وترميز الوقت كمحجوز
      const result = await submitBooking({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        serviceId: currentService.id,
        serviceName: currentService.name,
        servicePrice: currentService.price,
        date: `${activeDateOption.label} (${activeDateOption.dateStr})`,
        timeSlot: selectedTimeSlot,
        notes: notes.trim(),
      });

      if (result.success) {
        setConfirmedBooking(result.booking);
        onBookingSuccess(result.booking);
      } else {
        setErrorMessage('تعذر إتمام الحجز، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('حدث خطأ أثناء حفظ الحجز، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (!confirmedBooking) return;
    const text = encodeURIComponent(
      `مرحباً صالون حلاقة عبود 💈\nتم تأكيد حجزي بالمعلومات التالية:\n\n` +
      `▪ رمز الحجز: ${confirmedBooking.bookingCode}\n` +
      `▪ الخدمة: ${confirmedBooking.serviceName}\n` +
      `▪ الموعد: ${confirmedBooking.date}\n` +
      `▪ التوقيت: ${confirmedBooking.timeSlot}\n` +
      `▪ الاسم: ${confirmedBooking.customerName}\n` +
      `▪ الهاتف: ${confirmedBooking.customerPhone}\n\n` +
      `يرجى تأكيد الحجز عند استلام الرسالة، شكراً لكم!`
    );
    const whatsappNum = (settings?.whatsapp || '9647712818522').replace(/\D/g, '');
    window.open(`https://wa.me/${whatsappNum}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#0e1117] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-[#151922]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {confirmedBooking ? 'تم تأكيد موعدك بنجاح' : 'احجز موعدك عند حلاقة عبود'}
              </h3>
              <p className="text-xs text-neutral-400">
                {confirmedBooking ? 'احتفظ برمز الحجز أو شاركه عبر واتساب' : 'اختر اليوم والوقت المناسب لحضورك'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {confirmedBooking ? (
            /* SUCCESS CONFIRMATION VIEW */
            <div className="space-y-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">
                  شكراً لك {confirmedBooking.customerName}! تم استلام حجزك
                </h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  حجزك مسجل ومعتمد في صالون عبود، يرجى الحضور قبل الموعد بـ 5 دقائق.
                </p>
              </div>

              {/* Exact Booking Details Box */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-700/80 text-right space-y-3.5 shadow-lg relative">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <span className="text-xs font-semibold text-neutral-400">رمز الحجز:</span>
                  <span className="text-sm font-mono font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
                    {confirmedBooking.bookingCode}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-neutral-400">الخدمة التي اخترتها:</span>
                  <span className="text-amber-300 font-bold text-sm">{confirmedBooking.serviceName}</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-neutral-400">توقيت الحضور المحدد:</span>
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{confirmedBooking.date} - {confirmedBooking.timeSlot}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-neutral-400">اسم صاحب الحجز:</span>
                  <span className="text-white font-semibold">{confirmedBooking.customerName}</span>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-neutral-400">رقم الهاتف:</span>
                  <span className="text-neutral-200 font-mono" dir="ltr">{confirmedBooking.customerPhone}</span>
                </div>

                {confirmedBooking.notes && (
                  <div className="text-xs text-neutral-300 bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800/80">
                    <span className="text-amber-400 font-semibold">ملاحظتك: </span>
                    <span>{confirmedBooking.notes}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-800">
                  <span className="text-neutral-400 font-medium">السعر المقدر:</span>
                  <span className="text-emerald-400 font-bold font-mono text-base">
                    {confirmedBooking.servicePrice.toLocaleString('en-US')} د.ع
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>إرسال تفاصيل الموعد عبر واتساب</span>
                </button>

                <button
                  onClick={onClose}
                  className="py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer border border-neutral-700"
                >
                  إغلاق ومتابعة التصفح
                </button>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => setConfirmedBooking(null)}
                  className="text-xs text-amber-400/80 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
                >
                  حجز موعد لخدمة أخرى
                </button>
              </div>

            </div>
          ) : (
            /* BOOKING FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Choose Service */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  الخدمة المراد حجزها:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {availableServices.map((service) => {
                    const isSelected = service.id === serviceId;
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setServiceId(service.id)}
                        className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-white shadow-md'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold">{service.name}</p>
                          {service.note && (
                            <p className="text-[11px] text-neutral-400 mt-0.5">{service.note}</p>
                          )}
                        </div>
                        <div className="text-left font-mono font-bold text-amber-400 text-xs">
                          {service.priceFormatted}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Choose Day (اليوم، غداً، بعد غد - Dynamic from LocalStorage) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>اختر اليوم:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {dateOptions.map((opt) => {
                    const isSelected = selectedDate === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedDate(opt.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold'
                            : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                        }`}
                      >
                        <span className="block text-xs font-semibold">{opt.label}</span>
                        <span className="block text-[10px] text-neutral-400 mt-0.5">{opt.dateStr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Available Barber Times Slots (Dynamic & Real-time with "محجوز" state - Requirement 2) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>الأوقات المتاحة للحلاق ({activeDateOption.label}):</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {daySlots.filter(s => s.isAvailable).length} وقت متاح
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1.5 border border-neutral-800 rounded-xl bg-neutral-900/60">
                  {daySlots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot.timeLabel;
                    const isBooked = !slot.isAvailable;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => {
                          if (!isBooked) {
                            setSelectedTimeSlot(slot.timeLabel);
                          }
                        }}
                        className={`p-2.5 rounded-xl text-xs font-medium transition-all text-center flex flex-col items-center justify-center min-h-[54px] ${
                          isBooked
                            ? 'bg-neutral-950/80 text-neutral-500 border border-neutral-900 cursor-not-allowed select-none opacity-60'
                            : isSelected
                            ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20 border border-amber-300 cursor-pointer scale-102'
                            : 'bg-neutral-800/80 text-neutral-200 border border-neutral-700/60 hover:border-amber-400/50 hover:text-white cursor-pointer'
                        }`}
                      >
                        <span className={`block font-mono ${isBooked ? 'line-through text-neutral-500' : ''}`}>
                          {slot.timeLabel}
                        </span>
                        
                        {/* Status Label (محجوز باللون الرمادي والأحمر / متاح) */}
                        {isBooked ? (
                          <span className="text-[10px] font-bold text-rose-500 mt-0.5">محجوز</span>
                        ) : (
                          <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-neutral-900 font-bold' : 'text-emerald-400/80'}`}>
                            متاح
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Customer Info Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>اسمك الكريم:</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: أحمد علي"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>رقم هاتفك / الواتساب:</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors text-right"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  ملاحظات إضافية (اختياري):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: تفضيل قصة معينة أو أي استفسار آخر..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Clock className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري تأكيد الموعد...' : 'تأكيد حجز الموعد الآن'}</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
