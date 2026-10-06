import { useState, useEffect, useRef, useMemo } from 'react';
import { BarberService, BookingSubmission, DayTimeSlot, DayKey, SalonSettings } from '../types';
import { SERVICES as DEFAULT_SERVICES } from '../data/services';
import { submitBooking } from '../utils/bookingApi';
import { generateDynamicTimeSlots, getAllBookings, getFallbackTimeSlots } from '../utils/salonStore';
import { subscribeToFirebaseBookings, subscribeToFirebaseWorkingHours } from '../utils/firebaseBookingService';
import { X, Calendar, Clock, User, Phone, CheckCircle2, AlertCircle, Share2, Copy, Check } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedService: BarberService | null;
  onBookingSuccess: (booking: BookingSubmission) => void;
  existingBooking?: BookingSubmission | null;
  services?: BarberService[];
  settings?: SalonSettings;
}

export const DEFAULT_WORKING_HOURS = {
  openTime: "03:30 م",
  closeTime: "03:30 ص",
  slotDurationMinutes: 90,
};

function safeFormatDate(d: Date, fallback: string): string {
  try {
    return d.toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'short' });
  } catch {
    try {
      return d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'short' });
    } catch {
      return fallback;
    }
  }
}

function BookingModalInner({
  isOpen,
  onClose,
  selectedService,
  onBookingSuccess,
  existingBooking,
  services = DEFAULT_SERVICES,
  settings,
}: BookingModalProps) {
  // ترتيب الخدمات تنازلياً مع حماية كاملة ضد القيم غير المعرفة
  const availableServices = useMemo(() => {
    const list = Array.isArray(services) && services.length > 0 ? services : DEFAULT_SERVICES;
    return list
      .filter((s): s is BarberService => Boolean(s && s.id))
      .slice()
      .sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
  }, [services]);

  const fallbackService: BarberService = DEFAULT_SERVICES[0] || {
    id: 'default_service',
    name: 'حلاقة شعر احترافية',
    price: 10000,
    priceFormatted: '10,000 د.ع',
    category: 'haircut',
    durationMinutes: 25,
  };

  // Form State
  const initialServiceId = selectedService?.id || availableServices[0]?.id || fallbackService.id;
  const [serviceId, setServiceId] = useState<string>(initialServiceId);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedDate, setSelectedDate] = useState<DayKey>('today');
  const [notes, setNotes] = useState('');

  // 1. التهيئة الفورية بالقيم الافتراضية الصارمة (Hardcoded Fallback) دون انتظار Firebase
  const initialOpen = settings?.workingHours?.openTime || settings?.openTime || DEFAULT_WORKING_HOURS.openTime;
  const initialClose = settings?.workingHours?.closeTime || settings?.closeTime || DEFAULT_WORKING_HOURS.closeTime;
  const initialDuration = Number(settings?.workingHours?.slotDurationMinutes || settings?.slotDurationMinutes) || DEFAULT_WORKING_HOURS.slotDurationMinutes;

  const [fbWorkingHours, setFbWorkingHours] = useState<{
    openTime: string;
    closeTime: string;
    slotDurationMinutes: number;
  }>({
    openTime: initialOpen,
    closeTime: initialClose,
    slotDurationMinutes: initialDuration,
  });

  const effectiveOpenTime = fbWorkingHours?.openTime || initialOpen || DEFAULT_WORKING_HOURS.openTime;
  const effectiveCloseTime = fbWorkingHours?.closeTime || initialClose || DEFAULT_WORKING_HOURS.closeTime;
  const effectiveDuration = fbWorkingHours?.slotDurationMinutes || initialDuration || DEFAULT_WORKING_HOURS.slotDurationMinutes;

  // 2. توليد المواعيد فوراً في لحظة الـ First Render دون شاشات تعليق أو توقف
  const [daySlots, setDaySlots] = useState<DayTimeSlot[]>(() => {
    try {
      const generated = generateDynamicTimeSlots(initialOpen, initialClose, initialDuration, 'today');
      return (Array.isArray(generated) && generated.length > 0) ? generated : getFallbackTimeSlots('today');
    } catch {
      return getFallbackTimeSlots('today');
    }
  });
  const [isLoadingSlots] = useState<boolean>(false);

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(() => {
    try {
      const generated = generateDynamicTimeSlots(initialOpen, initialClose, initialDuration, 'today');
      const first = Array.isArray(generated) ? generated.find((s) => s && s.isAvailable) : undefined;
      return first ? first.timeLabel : (generated[0]?.timeLabel || '03:30 عصراً');
    } catch {
      return '03:30 عصراً';
    }
  });

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingSubmission | null>(existingBooking || null);
  const [isCopied, setIsCopied] = useState(false);

  // Sync service when selectedService prop changes
  useEffect(() => {
    if (selectedService?.id) {
      setServiceId(selectedService.id);
    } else if (availableServices.length > 0 && !serviceId) {
      setServiceId(availableServices[0].id);
    }
  }, [selectedService, availableServices, serviceId]);

  // اشتراك لحظي بمسار settings/workingHours في Firebase في الخلفية دون إعادة تعيين الواجهة
  useEffect(() => {
    let isMounted = true;
    try {
      const unsubscribe = subscribeToFirebaseWorkingHours((fbHours) => {
        if (!isMounted) return;
        if (fbHours && (fbHours.openTime || fbHours.closeTime)) {
          setFbWorkingHours({
            openTime: fbHours.openTime || DEFAULT_WORKING_HOURS.openTime,
            closeTime: fbHours.closeTime || DEFAULT_WORKING_HOURS.closeTime,
            slotDurationMinutes: Number(fbHours.slotDurationMinutes) || DEFAULT_WORKING_HOURS.slotDurationMinutes,
          });
        }
      });
      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.warn('Silent fallback for working hours listener:', err);
    }
  }, []);

  // إدارة ظهور نافذة التأكيد وضمان عدم إغلاقها تلقائياً بعد نجاح الحجز
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setConfirmedBooking(existingBooking || null);
      setErrorMessage('');
      setIsCopied(false);
    } else if (!isOpen) {
      setConfirmedBooking(null);
      setErrorMessage('');
      setIsCopied(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, existingBooking]);

  // دالة حساب وتوليد المواعيد ومزامنتها في الخلفية
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    try {
      // 1. توليد المواعيد الأساسية بالزيادة المحددة ومعالجة منتصف الليل
      const baseGenerated = generateDynamicTimeSlots(
        effectiveOpenTime,
        effectiveCloseTime,
        effectiveDuration,
        selectedDate
      );
      const safeBase = (baseGenerated && baseGenerated.length > 0)
        ? baseGenerated
        : getFallbackTimeSlots(selectedDate);

      const syncWithBookings = (allBookingsList: BookingSubmission[]) => {
        if (!isMounted) return;

        try {
          const dayKeyword = selectedDate === 'today' ? 'اليوم' : selectedDate === 'tomorrow' ? 'غداً' : 'بعد غد';
          
          const safeBookings = Array.isArray(allBookingsList)
            ? allBookingsList.filter(
                (b): b is BookingSubmission =>
                  Boolean(
                    b &&
                    (b.status === 'pending' || b.status === 'accepted' || b.status === 'approved') &&
                    typeof b.date === 'string' &&
                    b.date.includes(dayKeyword)
                  )
              )
            : [];

          const computed = safeBase.map((slot) => {
            if (!slot) return slot;
            const match = safeBookings.find((b) => b.timeSlot === slot.timeLabel);
            if (match) {
              return {
                ...slot,
                isAvailable: false,
                bookedCustomerName: match.customerName || 'محجوز',
                bookedBookingId: match.id,
              };
            }
            return slot;
          });

          setDaySlots(computed);

          // تحديد أول توقيت متاح تلقائياً إن لم يكن التوقيت الحالي متاحاً
          setSelectedTimeSlot((currentSelected) => {
            const isStillAvailable = computed.some((s) => s && s.timeLabel === currentSelected && s.isAvailable);
            if (isStillAvailable) return currentSelected;
            const firstAvail = computed.find((s) => s && s.isAvailable);
            return firstAvail ? firstAvail.timeLabel : (computed[0]?.timeLabel || '');
          });
        } catch (innerErr) {
          console.error('Error syncing slots with bookings:', innerErr);
          if (isMounted) {
            setDaySlots(safeBase);
          }
        }
      };

      // مزامنة أولية مع التخزين المحلي فوراً
      syncWithBookings(getAllBookings());

      // اشتراك لحظي مع Firebase
      const unsubscribe = subscribeToFirebaseBookings((fbBookings) => {
        syncWithBookings(fbBookings);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    } catch (err) {
      console.error('Error in slots generation effect:', err);
      if (isMounted) {
        setDaySlots(getFallbackTimeSlots(selectedDate));
      }
    }
  }, [isOpen, selectedDate, effectiveOpenTime, effectiveCloseTime, effectiveDuration]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleManualClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleManualClose = () => {
    setConfirmedBooking(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentService: BarberService =
    availableServices.find((s) => s && s.id === serviceId) ||
    availableServices[0] ||
    fallbackService;

  // Helper date strings with fallback
  const todayDate = new Date();
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const afterTomorrowDate = new Date(todayDate);
  afterTomorrowDate.setDate(afterTomorrowDate.getDate() + 2);

  const dateOptions: { id: DayKey; label: string; dateStr: string }[] = [
    { id: 'today', label: 'اليوم', dateStr: safeFormatDate(todayDate, 'اليوم') },
    { id: 'tomorrow', label: 'غداً', dateStr: safeFormatDate(tomorrowDate, 'غداً') },
    { id: 'after_tomorrow', label: 'بعد غد', dateStr: safeFormatDate(afterTomorrowDate, 'بعد غد') },
  ];

  const activeDateOption = dateOptions.find((d) => d.id === selectedDate) || dateOptions[0];

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
    const chosenSlot = daySlots.find((s) => s && s.timeLabel === selectedTimeSlot);
    if (chosenSlot && !chosenSlot.isAvailable) {
      setErrorMessage('عذراً، هذا التوقيت تم حجزه للتو من زبون آخر أو مغلق من الإدارة، يرجى اختيار وقت آخر.');
      return;
    }

    setIsSubmitting(true);

    try {
      // إرسال بيانات الحجز وحفظها ومزامنتها وترميز الوقت كمحجوز في Firebase
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

      if (result && result.success && result.booking) {
        // تفعيل عرض كارت "تم تأكيد موعدك بنجاح" فور نجاح عملية الكتابة في Firebase
        setConfirmedBooking(result.booking);
        // إشعار التطبيق دون إغلاق الـ Modal
        onBookingSuccess(result.booking);
      } else {
        setErrorMessage('تعذر إتمام الحجز، يرجى المحاولة مرة أخرى');
      }
    } catch (err) {
      console.error('Error submitting booking:', err);
      setErrorMessage('حدث خطأ أثناء حفظ الحجز، يرجى المحاولة مرة أخرى');
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappUrl = useMemo(() => {
    if (!confirmedBooking) return '#';
    try {
      const text = encodeURIComponent(
        `مرحباً صالون حلاقة عبود 💈\nتم تأكيد حجزي بالمعلومات التالية:\n\n` +
        `▪ رمز الحجز: ${confirmedBooking.bookingCode || '---'}\n` +
        `▪ الخدمة: ${confirmedBooking.serviceName || 'حلاقة'}\n` +
        `▪ الموعد: ${confirmedBooking.date || 'اليوم'}\n` +
        `▪ التوقيت: ${confirmedBooking.timeSlot || ''}\n` +
        `▪ الاسم: ${confirmedBooking.customerName || ''}\n` +
        `▪ الهاتف: ${confirmedBooking.customerPhone || ''}\n\n` +
        `يرجى تأكيد الحجز عند استلام الرسالة، شكراً لكم!`
      );
      const whatsappNum = (settings?.whatsapp || '9647712818522').replace(/\D/g, '');
      return `https://wa.me/${whatsappNum}?text=${text}`;
    } catch {
      return '#';
    }
  }, [confirmedBooking, settings?.whatsapp]);

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
            type="button"
            onClick={handleManualClose}
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
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-lg border border-amber-400/20">
                      {confirmedBooking.bookingCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard?.writeText) {
                          navigator.clipboard.writeText(confirmedBooking.bookingCode);
                        }
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="نسخ رمز الحجز"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                    </button>
                  </div>
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
                    {(Number(confirmedBooking.servicePrice) || 0).toLocaleString('en-US')} د.ع
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/25 active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>إرسال تفاصيل الموعد عبر واتساب</span>
                </a>

                <button
                  type="button"
                  onClick={handleManualClose}
                  className="py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer border border-neutral-700"
                >
                  إغلاق ومتابعة التصفح
                </button>
              </div>

              <div className="pt-1">
                <button
                  type="button"
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
                          {service.priceFormatted || `${(Number(service.price) || 0).toLocaleString('en-US')} د.ع`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Choose Day */}
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

              {/* 3. Available Barber Times Slots (Dynamic & Real-time with Loading Spinner) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>الأوقات المتاحة للحلاق ({activeDateOption.label}):</span>
                  </label>
                  <span className="text-[11px] text-neutral-400">
                    {daySlots.filter((s) => s && s.isAvailable).length} وقت متاح
                  </span>
                </div>

                {isLoadingSlots ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-neutral-400 border border-neutral-800 rounded-xl bg-neutral-900/60">
                    <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium">جاري تحميل المواعيد المتاحة...</span>
                  </div>
                ) : daySlots.length === 0 ? (
                  <div className="py-6 px-4 text-center text-xs text-neutral-400 bg-neutral-900/40 rounded-xl border border-neutral-800">
                    لا توجد مواعيد متاحة في هذا اليوم حالياً، يرجى اختيار يوم آخر.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1.5 border border-neutral-800 rounded-xl bg-neutral-900/60">
                    {daySlots.map((slot) => {
                      if (!slot) return null;
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
                          
                          {/* Status Label (محجوز / متاح) */}
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
                )}
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
                  disabled={isSubmitting || isLoadingSlots || !selectedTimeSlot}
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

export default function BookingModal(props: BookingModalProps) {
  if (!props.isOpen) return null;
  return <BookingModalInner {...props} />;
}
