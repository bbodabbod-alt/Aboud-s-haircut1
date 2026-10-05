import { ref, onValue, set, update, remove, get } from 'firebase/database';
import { rtdb } from './firebase';
import { 
  DayKey, DayTimeSlot, DayTimeSlotsMap, BookingSubmission, BookingStatus,
  SalonSettings, BarberService, SalonAnnouncement
} from '../types';
import { 
  getDefaultTimeSlotsMap, DEFAULT_SALON_SETTINGS,
  DEFAULT_WEEKLY_SCHEDULE, DEFAULT_STATS_HIGHLIGHTS 
} from './salonStore';
import { SERVICES as INITIAL_SERVICES } from '../data/services';

/**
 * Generate safe, deterministic key for Firebase Realtime Database
 */
export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === null || obj === undefined) return '' as any;
  return JSON.parse(JSON.stringify(obj, (key, value) => (value === undefined ? '' : value)));
}

export function getSlotDocId(dayKey: DayKey, timeLabel: string): string {
  const cleanTime = encodeURIComponent(timeLabel.trim())
    .replace(/%/g, '_')
    .replace(/[\/\.\#\$\[\]]/g, '_');
  return `${dayKey}__${cleanTime}`;
}

export function getDayKeyFromDateStr(dateStr: string): DayKey {
  if (dateStr.includes('غداً') || dateStr.includes('غدا')) return 'tomorrow';
  if (dateStr.includes('بعد غد') || dateStr.includes('بعدغد')) return 'after_tomorrow';
  return 'today';
}

/**
 * Initialize all Realtime Database Nodes with Defaults if Empty
 */
export async function initializeRealtimeDefaults(): Promise<void> {
  try {
    // 1. Settings /settings
    const settingsSnap = await get(ref(rtdb, 'settings'));
    if (!settingsSnap.exists()) {
      await set(ref(rtdb, 'settings'), {
        ...DEFAULT_SALON_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
    }

    // 2. Services /services
    const servicesSnap = await get(ref(rtdb, 'services'));
    if (!servicesSnap.exists()) {
      const servicesMap: Record<string, BarberService> = {};
      INITIAL_SERVICES.forEach((s) => {
        servicesMap[s.id] = s;
      });
      await set(ref(rtdb, 'services'), servicesMap);
    }

    // 3. Slots /slots
    const slotsSnap = await get(ref(rtdb, 'slots'));
    if (!slotsSnap.exists()) {
      const defaultMap = getDefaultTimeSlotsMap();
      const slotsData: Record<string, any> = {};

      (['today', 'tomorrow', 'after_tomorrow'] as DayKey[]).forEach((dayKey) => {
        const slots = defaultMap[dayKey] || [];
        slots.forEach((slot) => {
          const docId = getSlotDocId(dayKey, slot.timeLabel);
          slotsData[docId] = {
            id: slot.id,
            dayKey,
            timeLabel: slot.timeLabel,
            period: slot.period,
            isAvailable: slot.isAvailable,
            booked: !slot.isAvailable,
            bookedCustomerName: '',
            bookedBookingId: '',
            updatedAt: new Date().toISOString(),
          };
        });
      });

      await set(ref(rtdb, 'slots'), slotsData);
    }
  } catch (error) {
    console.warn('Realtime Database defaults initialization:', error);
  }
}

// Kick off initialization
initializeRealtimeDefaults().catch((err) => {
  console.warn('Defaults init warning:', err);
});

/* =========================================================================
   1. ربط محتوى الموقع بقاعدة البيانات (/settings عبر onValue)
   ========================================================================= */

export function subscribeToFirebaseSettings(
  onUpdate: (settings: SalonSettings) => void
): () => void {
  const settingsRef = ref(rtdb, 'settings');

  const unsubscribe = onValue(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const workingHours = data.workingHours || {};
        const openTime = workingHours.openTime || data.openTime || DEFAULT_SALON_SETTINGS.openTime;
        const closeTime = workingHours.closeTime || data.closeTime || DEFAULT_SALON_SETTINGS.closeTime;
        const slotDurationMinutes = Number(workingHours.slotDurationMinutes || data.slotDurationMinutes || DEFAULT_SALON_SETTINGS.slotDurationMinutes || 90);

        onUpdate({
          ...DEFAULT_SALON_SETTINGS,
          ...data,
          openTime,
          closeTime,
          slotDurationMinutes,
          workingHours: {
            openTime,
            closeTime,
            slotDurationMinutes,
            updatedAt: workingHours.updatedAt || data.updatedAt,
          },
        } as SalonSettings);
      } else {
        onUpdate(DEFAULT_SALON_SETTINGS);
      }
    },
    (error) => {
      console.error('Realtime Database settings error:', error);
    }
  );

  return unsubscribe;
}

export async function saveSettingsToFirebase(
  newSettings: Partial<SalonSettings>
): Promise<void> {
  try {
    const settingsRef = ref(rtdb, 'settings');
    await update(settingsRef, {
      ...newSettings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving settings to Realtime Database:', error);
  }
}

/**
 * حفظ وتحديث أوقات العمل في المسار settings/workingHours فوراً في Firebase Realtime Database
 * وتحديث كائن settings العام لضمان المزامنة الحية المباشرة مع واجهة الزبون ولوحة التحكم
 */
export async function saveWorkingHoursToFirebase(workingHours: {
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
}): Promise<void> {
  try {
    const payload = sanitizeForFirebase({
      openTime: workingHours.openTime,
      closeTime: workingHours.closeTime,
      slotDurationMinutes: Number(workingHours.slotDurationMinutes) || 90,
      updatedAt: new Date().toISOString(),
    });

    // 1. تحديث مسار settings/workingHours فوراً
    const workingHoursRef = ref(rtdb, 'settings/workingHours');
    await set(workingHoursRef, payload);

    // 2. تحديث كائن settings العام
    const settingsRef = ref(rtdb, 'settings');
    await update(settingsRef, {
      openTime: payload.openTime,
      closeTime: payload.closeTime,
      slotDurationMinutes: payload.slotDurationMinutes,
      workingHours: payload,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving working hours to Realtime Database:', error);
  }
}

/**
 * اشتراك لحظي بمسار settings/workingHours المخصص في Firebase Realtime Database
 */
export function subscribeToFirebaseWorkingHours(
  onUpdate: (workingHours: { openTime: string; closeTime: string; slotDurationMinutes: number }) => void
): () => void {
  const workingHoursRef = ref(rtdb, 'settings/workingHours');
  const unsubscribe = onValue(
    workingHoursRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && (data.openTime || data.closeTime)) {
          onUpdate({
            openTime: data.openTime || '03:30 م',
            closeTime: data.closeTime || '03:30 ص',
            slotDurationMinutes: Number(data.slotDurationMinutes) || 90,
          });
        }
      }
    },
    (error) => {
      console.error('Realtime Database workingHours subscription error:', error);
    }
  );
  return unsubscribe;
}

/* =========================================================================
   2. ربط الخدمات والأسعار والصور بقاعدة البيانات (/services عبر onValue)
   ========================================================================= */

export function subscribeToFirebaseServices(
  onUpdate: (services: BarberService[]) => void
): () => void {
  const servicesRef = ref(rtdb, 'services');

  const unsubscribe = onValue(
    servicesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: BarberService[] = [];
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            if (item && (item.name || item.title)) {
              const imageVal = 
                item.image || 
                item.imageUrl || 
                item.img || 
                item.photo || 
                item.picture || 
                item.thumbnail || 
                item.url || 
                '';

              list.push({
                id: item.id || key,
                name: item.name || item.title || '',
                price: Number(item.price || 0),
                priceFormatted: item.priceFormatted || `${Number(item.price || 0).toLocaleString('en-US')} د.ع`,
                category: item.category || 'haircut',
                durationMinutes: Number(item.durationMinutes || item.duration || 25),
                description: item.description || item.desc || '',
                note: item.note || item.notes || '',
                image: imageVal || undefined,
                imageUrl: imageVal || undefined,
                highlighted: Boolean(item.highlighted || item.isPopular),
              });
            }
          });
        }
        if (list.length > 0) {
          // ترتيب تنازلي حسب السعر (من الأعلى سعراً إلى الأقل سعراً)
          list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
          onUpdate(list);
        } else {
          const sortedDefaults = [...INITIAL_SERVICES].sort((a, b) => b.price - a.price);
          onUpdate(sortedDefaults);
        }
      } else {
        const sortedDefaults = [...INITIAL_SERVICES].sort((a, b) => b.price - a.price);
        onUpdate(sortedDefaults);
      }
    },
    (error) => {
      console.error('Realtime Database services error:', error);
    }
  );

  return unsubscribe;
}

export async function saveServiceToFirebase(service: BarberService): Promise<void> {
  try {
    const serviceRef = ref(rtdb, `services/${service.id}`);
    const img = service.image || service.imageUrl || '';
    await set(serviceRef, {
      ...service,
      image: img,
      imageUrl: img,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving service to Realtime Database:', error);
  }
}

export async function deleteServiceFromFirebase(serviceId: string): Promise<void> {
  try {
    const serviceRef = ref(rtdb, `services/${serviceId}`);
    await remove(serviceRef);
  } catch (error) {
    console.error('Error deleting service from Realtime Database:', error);
  }
}

/* =========================================================================
   3. ربط التنبيهات وشريط الإعلانات بقاعدة البيانات (/notices عبر onValue)
   ========================================================================= */

export function subscribeToFirebaseNotices(
  onUpdate: (notices: SalonAnnouncement[]) => void
): () => void {
  const noticesRef = ref(rtdb, 'notices');

  const unsubscribe = onValue(
    noticesRef,
    (snapshot) => {
      const list: SalonAnnouncement[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            if (item && item.title) {
              list.push({
                id: item.id || key,
                title: item.title || '',
                content: item.content || '',
                type: item.type || 'info',
                timestamp: item.timestamp || new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
                isActive: Boolean(item.isActive),
                createdAt: item.createdAt || new Date().toISOString(),
              });
            }
          });
        }
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(list);
    },
    (error) => {
      console.error('Realtime Database notices error:', error);
    }
  );

  return unsubscribe;
}

export async function saveNoticeToFirebase(notice: SalonAnnouncement): Promise<void> {
  try {
    const noticeRef = ref(rtdb, `notices/${notice.id}`);
    await set(noticeRef, {
      ...notice,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error saving notice to Realtime Database:', error);
  }
}

export async function deleteNoticeFromFirebase(noticeId: string): Promise<void> {
  try {
    const noticeRef = ref(rtdb, `notices/${noticeId}`);
    await remove(noticeRef);
  } catch (error) {
    console.error('Error deleting notice from Realtime Database:', error);
  }
}

/* =========================================================================
   4. نظام الحجز والمواعيد اللحظي (/slots عبر onValue)
   ========================================================================= */

export function subscribeToFirebaseTimeSlots(
  onUpdate: (slotsMap: DayTimeSlotsMap) => void
): () => void {
  const slotsRef = ref(rtdb, 'slots');

  const unsubscribe = onValue(
    slotsRef,
    (snapshot) => {
      const defaultMap = getDefaultTimeSlotsMap();
      const result: DayTimeSlotsMap = {
        today: [...defaultMap.today],
        tomorrow: [...defaultMap.tomorrow],
        after_tomorrow: [...defaultMap.after_tomorrow],
      };

      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            const dayKey = item.dayKey as DayKey;
            if (dayKey && result[dayKey]) {
              const timeLabel = item.timeLabel;
              const isAvailable = Boolean(item.isAvailable);
              const booked = Boolean(item.booked);

              const existingIndex = result[dayKey].findIndex((s) => s.timeLabel === timeLabel);
              const slotItem: DayTimeSlot = {
                id: item.id || key,
                timeLabel: timeLabel,
                period: item.period || 'morning',
                isAvailable: isAvailable && !booked,
                bookedCustomerName: item.bookedCustomerName || undefined,
                bookedBookingId: item.bookedBookingId || undefined,
              };

              if (existingIndex >= 0) {
                result[dayKey][existingIndex] = slotItem;
              } else {
                result[dayKey].push(slotItem);
              }
            }
          });
        }
      }

      onUpdate(result);
    },
    (error) => {
      console.error('Realtime Database slots error:', error);
    }
  );

  return unsubscribe;
}

/**
 * عند حجز الزبون لموعد:
 * - تتغير حالة الموعد إلى (booked: true, isAvailable: false)
 * - ويُحفظ الحجز في /bookings بحالة مبدئية ('pending')
 */
export async function bookSlotInFirebase(
  bookingData: BookingSubmission
): Promise<void> {
  const dayKey = getDayKeyFromDateStr(bookingData.date);
  const slotDocId = getSlotDocId(dayKey, bookingData.timeSlot);

  try {
    // 1. تسجيل الحجز في /bookings بحالة مبدئية 'pending' مع تعقيم البيانات
    const safeBooking = sanitizeForFirebase({
      ...bookingData,
      status: 'pending',
      updatedAt: new Date().toISOString(),
    });

    const bookingRef = ref(rtdb, `bookings/${bookingData.id}`);
    await set(bookingRef, safeBooking);

    // 2. تحديث التوقيت في /slots إلى (booked: true, isAvailable: false)
    const slotRef = ref(rtdb, `slots/${slotDocId}`);
    await update(slotRef, {
      id: slotDocId,
      dayKey,
      timeLabel: bookingData.timeSlot,
      isAvailable: false,
      booked: true,
      bookedCustomerName: bookingData.customerName || '',
      bookedBookingId: bookingData.id,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error booking slot in Realtime Database:', error);
  }
}

/**
 * عند ضغط الأدمن على "تم الإنجاز":
 * - تتغير حالة الحجز إلى 'completed'
 * - يُعاد التوقيت المختار تلقائياً إلى (booked: false, isAvailable: true) ليعود متاحاً للجميع
 */
export async function completeBookingInFirebase(
  booking: BookingSubmission
): Promise<void> {
  const cleanId = String(booking?.id || '').trim();
  if (!cleanId || cleanId === 'bookings') return;

  const dayKey = getDayKeyFromDateStr(booking.date);
  const slotDocId = getSlotDocId(dayKey, booking.timeSlot);

  try {
    // 1. تحديث الحجز في /bookings إلى 'completed' للمعرف المحدد فقط
    const bookingRef = ref(rtdb, `bookings/${cleanId}`);
    await update(bookingRef, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });

    // 2. إرجاع التوقيت في /slots إلى (booked: false, isAvailable: true)
    const slotRef = ref(rtdb, `slots/${slotDocId}`);
    await update(slotRef, {
      id: slotDocId,
      dayKey,
      timeLabel: booking.timeSlot,
      isAvailable: true,
      booked: false,
      bookedCustomerName: '',
      bookedBookingId: '',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error completing booking in Realtime Database:', error);
  }
}

/**
 * دورة حياة الحجز في Firebase (Booking Lifecycle):
 * - قبول -> 'accepted' أو 'approved'
 * - رفض -> 'rejected' (ويتم تحرير الموعد إلى booked: false)
 * - تم الإنجاز -> 'completed' (ويتم تحرير الموعد إلى booked: false)
 * - ملغي -> 'cancelled'
 */
export async function updateBookingStatusInFirebase(
  bookingId: string,
  newStatus: BookingStatus,
  bookingDetails?: BookingSubmission
): Promise<void> {
  const cleanId = String(bookingId || '').trim();
  if (!cleanId || cleanId === 'bookings') return;

  try {
    // تحديث حالة الحجز المحدد فقط بنفس المعرف bookingId في Firebase Realtime Database
    const bookingRef = ref(rtdb, `bookings/${cleanId}`);
    await update(bookingRef, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // عند الرفض أو الإنجاز أو الإلغاء، يتم تحرير التوقيت ليعود متاحاً للجميع
    if (newStatus === 'completed' || newStatus === 'rejected' || newStatus === 'cancelled') {
      if (bookingDetails) {
        const dayKey = getDayKeyFromDateStr(bookingDetails.date);
        const slotDocId = getSlotDocId(dayKey, bookingDetails.timeSlot);
        const slotRef = ref(rtdb, `slots/${slotDocId}`);
        await update(slotRef, {
          id: slotDocId,
          dayKey,
          timeLabel: bookingDetails.timeSlot,
          isAvailable: true,
          booked: false,
          bookedCustomerName: '',
          bookedBookingId: '',
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating booking status in Realtime Database:', error);
  }
}

/**
 * حذف حجز محدد فقط من Firebase Realtime Database
 * المسار المخصص للـ ID المحدد فقط: ref(rtdb, `bookings/${cleanId}`)
 * يمنع منعاً باتاً مسح مسار 'bookings' الكامل لتفادي مسح باقي البيانات
 */
export async function deleteBookingFromFirebase(
  bookingId: string,
  bookingDetails?: BookingSubmission
): Promise<void> {
  const cleanId = String(bookingId || '').trim();
  if (!cleanId || cleanId === 'bookings') {
    console.error('deleteBookingFromFirebase rejected invalid target:', bookingId);
    return;
  }

  try {
    // 1. استدعاء دالة الحذف على المسار المخصص للـ ID المحدد فقط:
    // ref(database, `bookings/${cleanId}`)
    const bookingRef = ref(rtdb, `bookings/${cleanId}`);
    await remove(bookingRef);

    // 2. إذا كان الحجز المحذوف يشغل موعداً، نحرر الموعد تلقائياً
    if (bookingDetails && bookingDetails.status !== 'completed' && bookingDetails.status !== 'rejected') {
      const dayKey = getDayKeyFromDateStr(bookingDetails.date);
      const slotDocId = getSlotDocId(dayKey, bookingDetails.timeSlot);
      const slotRef = ref(rtdb, `slots/${slotDocId}`);
      await update(slotRef, {
        id: slotDocId,
        dayKey,
        timeLabel: bookingDetails.timeSlot,
        isAvailable: true,
        booked: false,
        bookedCustomerName: '',
        bookedBookingId: '',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error(`Error deleting booking ${cleanId} from Realtime Database:`, error);
  }
}

/**
 * تبديل حالة توقيت يدوياً من لوحة الأدمن
 */
export async function toggleSlotInFirebase(
  dayKey: DayKey,
  slot: DayTimeSlot
): Promise<void> {
  const slotDocId = getSlotDocId(dayKey, slot.timeLabel);
  const willBeAvailable = !slot.isAvailable;

  try {
    const slotRef = ref(rtdb, `slots/${slotDocId}`);
    await update(slotRef, {
      id: slot.id || slotDocId,
      dayKey,
      timeLabel: slot.timeLabel,
      period: slot.period,
      isAvailable: willBeAvailable,
      booked: !willBeAvailable,
      bookedCustomerName: willBeAvailable ? '' : 'مغلق يدوياً من الإدارة',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error toggling slot in Realtime Database:', error);
  }
}

/**
 * استماع لحظي لقائمة الحجوزات (/bookings عبر onValue)
 */
export function subscribeToFirebaseBookings(
  onUpdate: (bookings: BookingSubmission[]) => void
): () => void {
  const bookingsRef = ref(rtdb, 'bookings');

  const unsubscribe = onValue(
    bookingsRef,
    (snapshot) => {
      try {
        const list: BookingSubmission[] = [];
        if (snapshot && snapshot.exists()) {
          const data = snapshot.val();
          if (data && typeof data === 'object') {
            Object.keys(data).forEach((key) => {
              const d = data[key];
              if (d && typeof d === 'object' && (d.customerName || d.bookingCode)) {
                list.push({
                  id: d.id || key,
                  bookingCode: d.bookingCode || '',
                  customerName: d.customerName || '',
                  customerPhone: d.customerPhone || '',
                  serviceId: d.serviceId || '',
                  serviceName: d.serviceName || '',
                  servicePrice: Number(d.servicePrice || 0),
                  date: d.date || '',
                  timeSlot: d.timeSlot || '',
                  notes: d.notes || '',
                  status: (d.status as BookingStatus) || 'pending',
                  createdAt: d.createdAt || '',
                });
              }
            });
          }
        }

        // Sort newest first safely
        list.sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
        onUpdate(list);
      } catch (err) {
        console.error('Error parsing Firebase bookings snapshot:', err);
        onUpdate([]);
      }
    },
    (error) => {
      console.error('Realtime Database bookings error:', error);
      onUpdate([]);
    }
  );

  return unsubscribe;
}
