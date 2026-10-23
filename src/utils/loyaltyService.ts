import { ref, get, set, update, onValue } from 'firebase/database';
import { rtdb } from './firebase';
import { CustomerLoyaltyData, BookingSubmission } from '../types';

const LOYALTY_STORAGE_PREFIX = 'abboud_loyalty_data_';
const LAST_PHONE_STORAGE_KEY = 'abboud_last_loyalty_phone';

/**
 * تحويل الأرقام العربية إلى إنجليزية وتنظيف رقم الهاتف ليكون مفتاحاً فريداً آمناً في Firebase
 */
export function normalizeLoyaltyPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const arabicToEnglishMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  const converted = String(rawPhone).replace(/[٠-٩]/g, (d) => arabicToEnglishMap[d] || d);
  // إبقاء الأرقام فقط
  const digits = converted.replace(/\D/g, '');
  return digits;
}

/**
 * حفظ آخر رقم هاتف استخدمه الزبون في المتصفح لاسترجاع بطاقته تلقائياً
 */
export function setStoredLoyaltyPhone(phone: string): void {
  try {
    const clean = normalizeLoyaltyPhone(phone);
    if (clean) {
      localStorage.setItem(LAST_PHONE_STORAGE_KEY, clean);
    }
  } catch (e) {
    console.error('Error saving last loyalty phone:', e);
  }
}

export function getStoredLoyaltyPhone(): string {
  try {
    return localStorage.getItem(LAST_PHONE_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * جلب بيانات بطاقة الولاء من LocalStorage كـ Fallback سريع
 */
export function getLocalLoyaltyData(phone: string): CustomerLoyaltyData | null {
  try {
    const clean = normalizeLoyaltyPhone(phone);
    if (!clean) return null;
    const raw = localStorage.getItem(`${LOYALTY_STORAGE_PREFIX}${clean}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalLoyaltyData(data: CustomerLoyaltyData): void {
  try {
    const clean = normalizeLoyaltyPhone(data.phone);
    if (clean) {
      localStorage.setItem(`${LOYALTY_STORAGE_PREFIX}${clean}`, JSON.stringify(data));
      setStoredLoyaltyPhone(clean);
    }
  } catch (e) {
    console.error('Error saving local loyalty data:', e);
  }
}

/**
 * جلب بيانات بطاقة الولاء من Firebase Realtime Database
 */
export async function getLoyaltyDataFromFirebase(rawPhone: string): Promise<CustomerLoyaltyData | null> {
  const cleanPhone = normalizeLoyaltyPhone(rawPhone);
  if (!cleanPhone) return null;

  try {
    const loyaltyRef = ref(rtdb, `loyalty_customers/${cleanPhone}`);
    const snapshot = await get(loyaltyRef);
    if (snapshot.exists()) {
      const data = snapshot.val() as CustomerLoyaltyData;
      saveLocalLoyaltyData(data);
      return data;
    }
    return getLocalLoyaltyData(cleanPhone);
  } catch (error) {
    console.error(`Error getting loyalty data for ${cleanPhone}:`, error);
    return getLocalLoyaltyData(cleanPhone);
  }
}

/**
 * الاشتراك الحي بتحديثات بطاقة الزبون من Firebase Realtime Database
 */
export function subscribeToCustomerLoyalty(
  rawPhone: string,
  callback: (data: CustomerLoyaltyData | null) => void
): () => void {
  const cleanPhone = normalizeLoyaltyPhone(rawPhone);
  if (!cleanPhone) {
    callback(null);
    return () => {};
  }

  // إرسال البيانات المحلية فوراً
  const initialLocal = getLocalLoyaltyData(cleanPhone);
  if (initialLocal) {
    callback(initialLocal);
  }

  const loyaltyRef = ref(rtdb, `loyalty_customers/${cleanPhone}`);
  const unsubscribe = onValue(
    loyaltyRef,
    (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val() as CustomerLoyaltyData;
          saveLocalLoyaltyData(data);
          callback(data);
        } else {
          // لم تُنشأ بعد
          callback(null);
        }
      } catch (err) {
        console.error('Error parsing customer loyalty snapshot:', err);
      }
    },
    (err) => {
      console.error('Error in loyalty subscription:', err);
    }
  );

  return unsubscribe;
}

/**
 * الاشتراك الحي بجميع زبائن بطاقات الولاء في لوحة التحكم
 */
export function subscribeToAllLoyaltyCustomers(
  callback: (customers: CustomerLoyaltyData[]) => void
): () => void {
  const loyaltyRef = ref(rtdb, 'loyalty_customers');
  const unsubscribe = onValue(
    loyaltyRef,
    (snapshot) => {
      try {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: CustomerLoyaltyData[] = Object.values(val || {}).map((item: any) => ({
            phone: String(item.phone || ''),
            customerName: String(item.customerName || 'زبون الصالون'),
            stampsCount: Number(item.stampsCount) || 0,
            completedVisits: Number(item.completedVisits) || 0,
            freeHaircutAvailable: Boolean(item.freeHaircutAvailable),
            freeHaircutsRedeemed: Number(item.freeHaircutsRedeemed) || 0,
            lastVisitDate: item.lastVisitDate || '',
            updatedAt: item.updatedAt || '',
          }));
          // ترتيب تنازلي حسب آخر زيارة
          list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
          callback(list);
        } else {
          callback([]);
        }
      } catch (err) {
        console.error('Error in all loyalty customers snapshot:', err);
        callback([]);
      }
    },
    (err) => {
      console.error('Error reading all loyalty customers:', err);
      callback([]);
    }
  );

  return unsubscribe;
}

/**
 * زيادة ختم للزبون عند تحويل الحجز إلى 'completed' (تم الإنجاز)
 * - stampsCount يزداد بمقدار +1
 * - completedVisits يزداد بمقدار +1
 * - إذا وصل stampsCount إلى 10، يتم تفعيل freeHaircutAvailable: true
 */
export async function recordCompletedVisitForLoyalty(
  rawPhone: string,
  customerName: string,
  _booking?: BookingSubmission
): Promise<CustomerLoyaltyData> {
  const cleanPhone = normalizeLoyaltyPhone(rawPhone);
  if (!cleanPhone) {
    throw new Error('رقم الهاتف غير صالح لحساب نقاط الولاء');
  }

  const loyaltyRef = ref(rtdb, `loyalty_customers/${cleanPhone}`);
  let currentData: CustomerLoyaltyData | null = null;

  try {
    const snap = await get(loyaltyRef);
    if (snap.exists()) {
      currentData = snap.val() as CustomerLoyaltyData;
    }
  } catch (err) {
    console.warn('Could not read existing loyalty data from Firebase, checking local:', err);
    currentData = getLocalLoyaltyData(cleanPhone);
  }

  const previousStamps = Number(currentData?.stampsCount) || 0;
  const previousVisits = Number(currentData?.completedVisits) || 0;
  const previousRedeemed = Number(currentData?.freeHaircutsRedeemed) || 0;

  // زيادة الختم والزيارة
  const newStamps = previousStamps + 1;
  const newVisits = previousVisits + 1;

  // إذا وصل إلى 10 أو تجاوزها، يصبح مؤهلاً لحلاقة مجانية
  const freeAvailable = newStamps >= 10 || Boolean(currentData?.freeHaircutAvailable);
  const cappedStamps = newStamps >= 10 ? 10 : newStamps;

  const updatedData: CustomerLoyaltyData = {
    phone: cleanPhone,
    customerName: customerName || currentData?.customerName || 'زبون الصالون',
    stampsCount: cappedStamps,
    completedVisits: newVisits,
    freeHaircutAvailable: freeAvailable,
    freeHaircutsRedeemed: previousRedeemed,
    lastVisitDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. تحديث محلي فوري
  saveLocalLoyaltyData(updatedData);

  // 2. تحديث Firebase Realtime Database
  try {
    await update(loyaltyRef, updatedData);
  } catch (err) {
    console.error('Error saving updated loyalty data to Firebase:', err);
  }

  return updatedData;
}

/**
 * استخدام وصرف الحلاقة المجانية (Redeem Free Haircut)
 * عند الاستخدام يتم تصفير عداد الأختام إلى 0، وإلغاء تفعيل الهدية، وزيادة عداد الهدايا المصروفة
 */
export async function redeemFreeHaircutInFirebase(rawPhone: string): Promise<CustomerLoyaltyData> {
  const cleanPhone = normalizeLoyaltyPhone(rawPhone);
  if (!cleanPhone) {
    throw new Error('رقم الهاتف غير صالح لصرف الحلاقة المجانية');
  }

  const loyaltyRef = ref(rtdb, `loyalty_customers/${cleanPhone}`);
  let currentData: CustomerLoyaltyData | null = null;

  try {
    const snap = await get(loyaltyRef);
    if (snap.exists()) {
      currentData = snap.val() as CustomerLoyaltyData;
    }
  } catch (err) {
    currentData = getLocalLoyaltyData(cleanPhone);
  }

  const updatedData: CustomerLoyaltyData = {
    phone: cleanPhone,
    customerName: currentData?.customerName || 'زبون الصالون',
    stampsCount: 0, // إعادة العداد إلى 0
    completedVisits: Number(currentData?.completedVisits) || 10,
    freeHaircutAvailable: false, // إلغاء التفعيل بعد الاستخدام
    freeHaircutsRedeemed: (Number(currentData?.freeHaircutsRedeemed) || 0) + 1,
    lastVisitDate: currentData?.lastVisitDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveLocalLoyaltyData(updatedData);

  try {
    await update(loyaltyRef, updatedData);
  } catch (err) {
    console.error('Error redeeming loyalty haircut in Firebase:', err);
  }

  return updatedData;
}

/**
 * تعديل يدوي للأختام من قبل الأدمن في لوحة التحكم
 */
export async function adminAdjustLoyaltyStamps(
  rawPhone: string,
  newStamps: number,
  customerName?: string
): Promise<CustomerLoyaltyData> {
  const cleanPhone = normalizeLoyaltyPhone(rawPhone);
  if (!cleanPhone) throw new Error('رقم هاتف غير صالح');

  const loyaltyRef = ref(rtdb, `loyalty_customers/${cleanPhone}`);
  let currentData: CustomerLoyaltyData | null = null;

  try {
    const snap = await get(loyaltyRef);
    if (snap.exists()) {
      currentData = snap.val() as CustomerLoyaltyData;
    }
  } catch {
    currentData = getLocalLoyaltyData(cleanPhone);
  }

  const safeStamps = Math.max(0, Math.min(10, newStamps));
  const isFree = safeStamps >= 10;

  const updatedData: CustomerLoyaltyData = {
    phone: cleanPhone,
    customerName: customerName || currentData?.customerName || 'زبون الصالون',
    stampsCount: safeStamps,
    completedVisits: Number(currentData?.completedVisits) || safeStamps,
    freeHaircutAvailable: isFree,
    freeHaircutsRedeemed: Number(currentData?.freeHaircutsRedeemed) || 0,
    lastVisitDate: currentData?.lastVisitDate || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveLocalLoyaltyData(updatedData);
  await set(loyaltyRef, updatedData);
  return updatedData;
}
