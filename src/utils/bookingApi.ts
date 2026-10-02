import { BookingSubmission, TimeSlot } from '../types';
import { registerCustomerBooking, getAllBookings, updateBookingStatus, markSlotAsBookedByCustomer } from './salonStore';
import { bookSlotInFirebase, completeBookingInFirebase, updateBookingStatusInFirebase } from './firebaseBookingService';

const CUSTOMER_BOOKINGS_STORAGE_KEY = 'abboud_customer_bookings_list_v1';
const LEGACY_SINGLE_KEY = 'abboud_customer_active_booking_v1';

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: 't1', timeLabel: '10:30 صباحاً', period: 'morning', isAvailable: true },
  { id: 't2', timeLabel: '11:30 صباحاً', period: 'morning', isAvailable: true },
  { id: 't3', timeLabel: '01:00 ظهراً', period: 'afternoon', isAvailable: true },
  { id: 't4', timeLabel: '02:00 ظهراً', period: 'afternoon', isAvailable: true },
  { id: 't5', timeLabel: '03:30 عصراً', period: 'afternoon', isAvailable: true },
  { id: 't6', timeLabel: '04:30 عصراً', period: 'afternoon', isAvailable: false },
  { id: 't7', timeLabel: '06:00 مساءً', period: 'evening', isAvailable: true },
  { id: 't8', timeLabel: '07:15 مساءً', period: 'evening', isAvailable: true },
  { id: 't9', timeLabel: '08:30 مساءً', period: 'evening', isAvailable: true },
  { id: 't10', timeLabel: '09:45 مساءً', period: 'evening', isAvailable: false },
  { id: 't11', timeLabel: '10:45 مساءً', period: 'evening', isAvailable: true },
];

/**
 * جلب قائمة حجوزات الزبون ومزامنة حالتها مع التخزين الموحد
 */
export function getCustomerBookings(): BookingSubmission[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_BOOKINGS_STORAGE_KEY);
    let customerList: BookingSubmission[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) customerList = parsed;
    } else {
      const legacy = localStorage.getItem(LEGACY_SINGLE_KEY);
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (parsedLegacy && parsedLegacy.id) customerList = [parsedLegacy];
      }
    }

    // مزامنة حالة الحجوزات مع مستودع الصالون العام ليرى الزبون أي قرار (قبول/رفض) فوراً
    const allStoreBookings = getAllBookings();
    if (allStoreBookings.length > 0 && customerList.length > 0) {
      customerList = customerList.map((cb) => {
        const match = allStoreBookings.find((sb) => sb.id === cb.id || sb.bookingCode === cb.bookingCode);
        if (match && match.status !== cb.status) {
          return { ...cb, status: match.status };
        }
        return cb;
      });
      localStorage.setItem(CUSTOMER_BOOKINGS_STORAGE_KEY, JSON.stringify(customerList));
    }

    return customerList;
  } catch (err) {
    console.error('Error reading customer bookings:', err);
    return [];
  }
}

export function saveCustomerBooking(booking: BookingSubmission) {
  try {
    const existing = getCustomerBookings();
    const filtered = existing.filter((b) => b.id !== booking.id);
    const updated = [booking, ...filtered];
    localStorage.setItem(CUSTOMER_BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(LEGACY_SINGLE_KEY, JSON.stringify(booking));
  } catch (err) {
    console.error('Error saving customer booking:', err);
  }
}

export function removeCustomerBooking(bookingId: string) {
  try {
    const existing = getCustomerBookings();
    const updated = existing.filter((b) => b.id !== bookingId);
    const target = existing.find((b) => b.id === bookingId);
    localStorage.setItem(CUSTOMER_BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
    if (updated.length > 0) {
      localStorage.setItem(LEGACY_SINGLE_KEY, JSON.stringify(updated[0]));
    } else {
      localStorage.removeItem(LEGACY_SINGLE_KEY);
    }
    // تحديث الحالة في المستودع وقاعدة البيانات أيضاً إلى ملغي
    updateBookingStatus(bookingId, 'cancelled');
    if (target) {
      updateBookingStatusInFirebase(bookingId, 'cancelled', target).catch((err) => {
        console.error('Firebase cancel update error:', err);
      });
    }
    return updated;
  } catch (err) {
    console.error('Error removing customer booking:', err);
    return [];
  }
}

/**
 * 1. دالة إرسال الحجز (submitBooking):
 * تقوم بتسجيل الحجز في قاعدة بيانات Firebase، وتحديث حالة التوقيت المُختار
 * فوراً في Firebase إلى (محجوز / booked: true / isAvailable: false)
 * مع حفظه محلياً لضمان سرعة الاستجابة اللحظية.
 */
export async function submitBooking(
  bookingData: Omit<BookingSubmission, 'id' | 'bookingCode' | 'createdAt' | 'status'>
): Promise<{
  success: boolean;
  booking: BookingSubmission;
  message: string;
}> {
  // 1. تسجيل الحجز في المستودع المحلي
  const completeBooking = registerCustomerBooking(bookingData);

  // 2. تحديث التوقيت محلياً
  markSlotAsBookedByCustomer(bookingData.date, bookingData.timeSlot, bookingData.customerName, completeBooking.id);

  // 3. حفظ الحجز في قائمة الزبون
  saveCustomerBooking(completeBooking);

  // 4. تحديث التوقيت المُختار في Firebase فوراً إلى (محجوز / booked: true) وتسجيل الحجز
  try {
    await bookSlotInFirebase(completeBooking);
  } catch (err) {
    console.error('Failed to sync booking with Firebase:', err);
  }

  return {
    success: true,
    booking: completeBooking,
    message: 'تم الحجز وتحديث التوقيت في قاعدة البيانات بنجاح!',
  };
}

/**
 * 2. دالة زر "تم الإنجاز" (completeBooking):
 * في لوحة الأدمن، عند الضغط على "تم الإنجاز"، يتم تحديث حالة الموعد في قاعدة بيانات Firebase
 * وإعادة حالة التوقيت تلقائياً إلى (متوفر / booked: false / isAvailable: true)
 */
export async function completeBooking(booking: BookingSubmission): Promise<void> {
  // تحديث محلي
  updateBookingStatus(booking.id, 'completed');

  // تحديث في Firebase (إعادة التوقيت إلى متوفر)
  try {
    await completeBookingInFirebase(booking);
  } catch (err) {
    console.error('Failed to complete booking in Firebase:', err);
  }
}
