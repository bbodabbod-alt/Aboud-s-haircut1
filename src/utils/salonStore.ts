/**
 * آلية المزامنة والربط المباشر بين موقع الزبائن ولوحة التحكم (Control Panel)
 * 
 * تستخدم هذه الوحدة LocalStorage كمستودع بيانات موحد ومحدث لحظياً.
 * عند حدوث أي تعديل (تغيير الأسعار، الصور، النصوص، أو حالات الحجز، أو التقييمات الحقيقية، أو الإشعارات)،
 * يتم حفظ البيانات فوراً وإرسال إشعار لحظي (Storage Event & Custom Event)
 * لتحديث الواجهات في المتصفح تلقائياً دون الحاجة لتحديث الصفحة.
 */

import { 
  BarberService, BookingSubmission, BookingStatus, SalonSettings, 
  ManagerAccount, DashboardNotification, ServiceRatingsMap, ServiceRatingInfo,
  ServiceRatingEntry, DaySchedule, SalonStatsHighlights, SalonAnnouncement,
  AdminUser, AdminRole, DayKey, DayTimeSlot, DayTimeSlotsMap
} from '../types';
import { SERVICES as INITIAL_SERVICES } from '../data/services';
import { 
  saveSettingsToFirebase, saveServiceToFirebase, deleteServiceFromFirebase,
  saveNoticeToFirebase, deleteNoticeFromFirebase, saveWorkingHoursToFirebase
} from './firebaseBookingService';
import { parseTimeString } from './shopHours';

// المفاتيح الموحدة في التخزين المحلي (LocalStorage Keys)
const STORAGE_KEYS = {
  SETTINGS: 'salon_control_panel_settings_v1',
  SERVICES: 'salon_control_panel_services_v1',
  BOOKINGS: 'salon_control_panel_bookings_v1',
  AUTH: 'salon_control_panel_auth_v1',
  SESSION: 'salon_control_panel_session_v1',
  NOTIFICATIONS: 'salon_control_panel_notifications_v1',
  CUSTOMER_NOTIFICATIONS: 'salon_customer_notifications_v1',
  INDIVIDUAL_RATINGS: 'salon_individual_ratings_v2',
  CLEARED_FAKE_FLAG: 'salon_has_cleared_fake_ratings_v2',
  WEEKLY_SCHEDULE: 'salon_weekly_schedule_v1',
  STATS_HIGHLIGHTS: 'salon_stats_highlights_v1',
  ANNOUNCEMENTS: 'salon_announcements_v1',
  PUSH_PREF: 'salon_push_notifications_enabled_v1',
  ADMIN_USERS: 'salon_admin_users_v2',
  ACTIVE_ADMIN: 'salon_active_admin_session_v2',
  TIME_SLOTS: 'salon_day_time_slots_v3',
};

/**
 * بيانات تسجيل الدخول الثابتة للمالك الأساسي (صلاحية مطلقة غير قابلة للحذف)
 * Username: 7aw12005
 * Password: 07712818522abood##
 */
export const MASTER_OWNER_ACCOUNT: AdminUser = {
  id: 'admin_master_owner',
  username: '7aw12005',
  passwordPlain: '07712818522abood##',
  role: 'owner',
  displayName: 'مالك الصالون الأساسي (عبود)',
  createdAt: '2026-01-01',
  isOwner: true,
};

// جدول أوقات العمل الأسبوعي الافتراضي
export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: 'السبت', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'متاح للعمل' },
  { day: 'الأحد', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'متاح للعمل' },
  { day: 'الإثنين', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'متاح للعمل' },
  { day: 'الثلاثاء', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'متاح للعمل' },
  { day: 'الأربعاء', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'متاح للعمل' },
  { day: 'الخميس', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'ساعات العمل الرسمية' },
  { day: 'الجمعة', openTime: '03:30 م', closeTime: '03:30 ص', isClosed: false, note: 'بعد صلاة الجمعة' },
];

// الإحصائيات والمميزات البصرية الافتراضية
export const DEFAULT_STATS_HIGHLIGHTS: SalonStatsHighlights = {
  experienceYearsValue: '10+',
  experienceYearsLabel: 'سنوات من الخبرة والاحتراف',
  sterilizationPercentValue: '100%',
  sterilizationPercentLabel: 'تعقيم طبي للأدوات قبل كل استخدام',
};

// الإعدادات الافتراضية للصالون
export const DEFAULT_SALON_SETTINGS: SalonSettings = {
  salonName: 'حلاقة عبود',
  // Hero / Brand Section
  welcomeTitle: 'مرحباً بك ايها الزبون عند حلاقة عبود',
  heroHeadline: 'أناقة لا تضاهى، وحلاقة تليق بحضورك',
  heroSubtitle: 'نقدم لك تجربة حلاقة وعناية استثنائية تجمع بين الحرفية الدقيقة وأحدث تقنيات تنظيف البشرة العميق والأجهزة المتطورة، في بيئة مريحة ومعقمة بأعلى المعايير.',
  heroBadge: 'صالون الحلاقة الرجالية الأول',
  heroImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200',
  // Shop status & timing
  manualShopStatus: 'auto',
  openTime: '03:30 م',
  closeTime: '03:30 ص',
  slotDurationMinutes: 90,
  workingHours: {
    openTime: '03:30 م',
    closeTime: '03:30 ص',
    slotDurationMinutes: 90,
  },
  // Contact & Location & Social
  phone: '07712818522',
  whatsapp: '9647712818522',
  location: 'الشارع العام - مقابل السوق التجاري',
  googleMapsUrl: 'https://maps.google.com/?q=Baghdad',
  instagramUrl: 'https://instagram.com',
  tiktokUrl: 'https://tiktok.com',
  facebookUrl: 'https://facebook.com',
  // About Us Section
  aboutTitle: 'عن صالون حلاقة عبود',
  aboutSubtitle: 'لمسة احترافية تعتني بأدق التفاصيل لمظهرك',
  aboutDescription: 'في صالون حلاقة عبود، لا تقتصر التجربة على مجرد قص الشعر أو اللحية؛ بل هي عناية رجالية متكاملة تشمل تقييم نوع الشعر، اختيار القَصة الأنسب لملامح وجهك، واستخدام أحدث أجهزة البخار والتقشير للعناية الفائقة بالبشرة.',
  aboutDescriptionSecondary: 'فريقنا مؤلف من حلاقين محترفين شغوفين بمهنتهم، نحرص على تقديم خدمات VIP تتضمن تنظيف البشرة بأجهزة البخار والألتراسونيك، وسشوار احترافي، ومساج للرأس والوجه لتغادر الصالون بكامل انتعاشك وجاذبيتك.',
  aboutImageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200',
  aboutExperienceYears: '10+',
  aboutMasterBarberName: 'الكابتن عبود',
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
  statsHighlights: DEFAULT_STATS_HIGHLIGHTS,
};

// تنظيف أي بيانات تقييم وهمية سابقة لضمان أن النظام يبدأ بـ 0 تقييمات حقيقية
function ensureNoFakeRatings() {
  try {
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEYS.CLEARED_FAKE_FLAG)) {
      localStorage.removeItem('salon_service_ratings_v1');
      localStorage.setItem(STORAGE_KEYS.CLEARED_FAKE_FLAG, 'true');
    }
  } catch (err) {
    console.error('Error clearing old fake ratings:', err);
  }
}
ensureNoFakeRatings();

/**
 * بث حدث داخلي في النافذة لتحديث المكونات المشتركة لحظياً
 */
function broadcastLocalChange(keyName: string) {
  try {
    window.dispatchEvent(new CustomEvent('salon_data_synced', { detail: { key: keyName } }));
  } catch (err) {
    console.error('Error broadcasting change:', err);
  }
}

/* =========================================================================
   1. إدارة إعدادات الصالون (اسم المحل، النصوص، حالة المحل اليدوية)
   ========================================================================= */

export function getSalonSettings(): SalonSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SALON_SETTINGS;
    return { ...DEFAULT_SALON_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error getting salon settings:', err);
    return DEFAULT_SALON_SETTINGS;
  }
}

export function saveSalonSettings(newSettings: Partial<SalonSettings>): SalonSettings {
  const current = getSalonSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.SETTINGS);

  // إذا تم تغيير أوقات العمل أو مدة الجلسة، نزامن المواعيد الديناميكية ومسار settings/workingHours في Firebase فوراً
  if (newSettings.openTime || newSettings.closeTime || newSettings.slotDurationMinutes || newSettings.workingHours) {
    syncDynamicTimeSlotsWithSettings(updated);
    saveWorkingHoursToFirebase({
      openTime: updated.openTime,
      closeTime: updated.closeTime,
      slotDurationMinutes: Number(updated.slotDurationMinutes) || 90,
    }).catch((err) => {
      console.error('Firebase working hours sync error:', err);
    });
  }

  saveSettingsToFirebase(updated).catch((err) => {
    console.error('Firebase settings sync error:', err);
  });
  return updated;
}

/* =========================================================================
   2. إدارة العروض والخدمات (الأسعار، الصور، الأسماء، الإضافة والحذف)
   ========================================================================= */

export function getSalonServices(): BarberService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    const parsed: BarberService[] = raw ? JSON.parse(raw) : INITIAL_SERVICES;
    return [...parsed].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } catch (err) {
    console.error('Error reading salon services:', err);
    return [...INITIAL_SERVICES].sort((a, b) => b.price - a.price);
  }
}

export function saveSalonServices(services: BarberService[]): void {
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  broadcastLocalChange(STORAGE_KEYS.SERVICES);
}

export function updateSalonService(updatedService: BarberService): void {
  const services = getSalonServices();
  const idx = services.findIndex((s) => s.id === updatedService.id);
  if (idx !== -1) {
    services[idx] = updatedService;
  } else {
    services.push(updatedService);
  }
  saveSalonServices(services);
  saveServiceToFirebase(updatedService).catch((err) => {
    console.error('Firebase service save error:', err);
  });
}

export function deleteSalonService(serviceId: string): void {
  const services = getSalonServices().filter((s) => s.id !== serviceId);
  saveSalonServices(services);
  deleteServiceFromFirebase(serviceId).catch((err) => {
    console.error('Firebase service delete error:', err);
  });
}

/* =========================================================================
   3. إدارة الحجوزات (استقبال، قبول، رفض، إنجاز)
   مع إرسال إشعار لحظي للزبون فور قبول أو رفض الحجز (Two-way Notifications)
   ========================================================================= */

export function getAllBookings(): BookingSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error getting bookings:', err);
    return [];
  }
}

export function saveAllBookings(bookings: BookingSubmission[]): void {
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  broadcastLocalChange(STORAGE_KEYS.BOOKINGS);
}

export function updateBookingStatus(bookingId: string, newStatus: BookingStatus): BookingSubmission[] {
  const bookings = getAllBookings();
  let targetBooking: BookingSubmission | undefined;

  const updated = bookings.map((b) => {
    if (b.id === bookingId) {
      targetBooking = { ...b, status: newStatus };
      return targetBooking;
    }
    return b;
  });

  saveAllBookings(updated);

  // إرسال إشعار لحظي في جرس الزبون فور تغيير الحالة
  if (targetBooking) {
    if (newStatus === 'accepted') {
      addCustomerNotification({
        title: 'تم قبول حجزك بنجاح ✅',
        message: `تم قبول حجزك لخدمة "${targetBooking.serviceName}" في وقت ${targetBooking.timeSlot}. نتشرف بحضورك!`,
        bookingId: targetBooking.id,
      });
    } else if (newStatus === 'rejected') {
      addCustomerNotification({
        title: 'نعتذر، لم يتم قبول الحجز ❌',
        message: `تم رفض حجزك لخدمة "${targetBooking.serviceName}" في وقت ${targetBooking.timeSlot}. يرجى اختيار موعد آخر.`,
        bookingId: targetBooking.id,
      });
    } else if (newStatus === 'completed') {
      addCustomerNotification({
        title: 'تم إنجاز الخدمة بنجاح 👍',
        message: `سعدنا بخدمتك في صالون عبود لخدمة "${targetBooking.serviceName}". نتمنى لك يوماً رائعاً!`,
        bookingId: targetBooking.id,
      });
    }
  }

  return updated;
}

export function deleteBooking(bookingId: string): BookingSubmission[] {
  const cleanId = String(bookingId || '').trim();
  if (!cleanId || cleanId === 'bookings') return getAllBookings();
  const updated = getAllBookings().filter((b) => b.id !== cleanId);
  saveAllBookings(updated);
  return updated;
}

/* =========================================================================
   4. تسجيل حجز جديد قادم من موقع الزبائن + إطلاق تنبيه إشعار للوحة التحكم
   ========================================================================= */

export function registerCustomerBooking(
  bookingData: Omit<BookingSubmission, 'id' | 'bookingCode' | 'createdAt' | 'status'>
): BookingSubmission {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingCode = `AB-${randomSuffix}`;

  const newBooking: BookingSubmission = {
    ...bookingData,
    id: `bk_${Date.now()}_${randomSuffix}`,
    bookingCode,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  const existingBookings = getAllBookings();
  const updatedBookings = [newBooking, ...existingBookings];
  saveAllBookings(updatedBookings);

  // إشعار فوري في لوحة التحكم (لدى الحلاق)
  addDashboardNotification({
    title: 'حجز جديد وارد 💈',
    message: `حجز جديد: [${newBooking.serviceName}] في وقت [${newBooking.timeSlot}] - الزبون: ${newBooking.customerName}`,
    bookingId: newBooking.id,
  });

  return newBooking;
}

/* =========================================================================
   5. نظام إشعارات لوحة التحكم (لدى الحلاق)
   ========================================================================= */

export function getDashboardNotifications(): DashboardNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error getting dashboard notifications:', err);
    return [];
  }
}

export function addDashboardNotification(notif: {
  title: string;
  message: string;
  bookingId?: string;
}): DashboardNotification {
  const notifications = getDashboardNotifications();
  const newNotif: DashboardNotification = {
    id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: notif.title,
    message: notif.message,
    bookingId: notif.bookingId,
    timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  const updated = [newNotif, ...notifications.slice(0, 30)];
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.NOTIFICATIONS);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const notifications = getDashboardNotifications();
  const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.NOTIFICATIONS);
}

export function markAllNotificationsAsRead(): void {
  const notifications = getDashboardNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.NOTIFICATIONS);
}

export function clearNotifications(): void {
  localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  broadcastLocalChange(STORAGE_KEYS.NOTIFICATIONS);
}

/* =========================================================================
   6. نظام إشعارات الزبون اللحظية (Customer Notification Bell)
   ========================================================================= */

export function getCustomerNotifications(): DashboardNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error getting customer notifications:', err);
    return [];
  }
}

export function addCustomerNotification(notif: {
  title: string;
  message: string;
  bookingId?: string;
}): DashboardNotification {
  const notifications = getCustomerNotifications();
  const newNotif: DashboardNotification = {
    id: `cnotif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: notif.title,
    message: notif.message,
    bookingId: notif.bookingId,
    timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  const updated = [newNotif, ...notifications.slice(0, 30)];
  localStorage.setItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
  return newNotif;
}

export function markCustomerNotificationAsRead(id: string): void {
  const notifications = getCustomerNotifications();
  const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
}

export function markAllCustomerNotificationsAsRead(): void {
  const notifications = getCustomerNotifications();
  const updated = notifications.map((n) => ({ ...n, read: true }));
  localStorage.setItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
}

export function clearCustomerNotifications(): void {
  localStorage.removeItem(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
  broadcastLocalChange(STORAGE_KEYS.CUSTOMER_NOTIFICATIONS);
}

/* =========================================================================
   7. نظام التقييمات الحقيقي 100% (Real Ratings Management)
   خالٍ تماماً من أي قيم افتراضية وهمية. يبدأ فارغاً حتى يقيّم الزبائن فعلياً.
   ========================================================================= */

export function getAllCustomerRatings(): ServiceRatingEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INDIVIDUAL_RATINGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading customer ratings list:', err);
    return [];
  }
}

export function saveAllCustomerRatings(ratings: ServiceRatingEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.INDIVIDUAL_RATINGS, JSON.stringify(ratings));
  broadcastLocalChange(STORAGE_KEYS.INDIVIDUAL_RATINGS);
}

/**
 * حساب إحصائيات التقييم لكل خدمة بناءً على التقييمات الحقيقية فقط
 */
export function getServiceRatings(): ServiceRatingsMap {
  const allRatings = getAllCustomerRatings();
  const summary: ServiceRatingsMap = {};

  allRatings.forEach((entry) => {
    if (!summary[entry.serviceId]) {
      summary[entry.serviceId] = {
        totalScore: 0,
        count: 0,
        average: 0,
      };
    }
    summary[entry.serviceId].totalScore += entry.stars;
    summary[entry.serviceId].count += 1;
  });

  // حساب المتوسط الحقيقي
  Object.keys(summary).forEach((id) => {
    const item = summary[id];
    if (item.count > 0) {
      item.average = Math.round((item.totalScore / item.count) * 10) / 10;
    }
  });

  return summary;
}

/**
 * تسجيل تقييم حقيقي جديد من الزبون وحفظه في سجل التقييمات
 */
export function submitCustomerRating(
  serviceId: string, 
  serviceName: string, 
  starRating: number,
  comment?: string,
  authorName?: string
): ServiceRatingEntry {
  const clamped = Math.max(1, Math.min(5, Math.round(starRating)));
  const existing = getAllCustomerRatings();

  const newEntry: ServiceRatingEntry = {
    id: `rate_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    serviceId,
    serviceName,
    stars: clamped,
    authorName: authorName?.trim() || undefined,
    comment: comment?.trim() || undefined,
    timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' }),
  };

  const updated = [newEntry, ...existing];
  saveAllCustomerRatings(updated);

  // إشعار في لوحة التحكم للحلاق بوصول تقييم ورأي جديد
  const messageDetail = comment?.trim()
    ? `تقييم ${clamped} نجوم لخدمة "${serviceName}" مع رأي: "${comment.trim().slice(0, 60)}..."`
    : `أعطى أحد الزبائن تقييم ${clamped} نجوم لخدمة "${serviceName}".`;

  addDashboardNotification({
    title: comment?.trim() ? 'رأي وتقييم جديد من زبون 💬⭐' : 'تقييم جديد من زبون ⭐',
    message: messageDetail,
  });

  return newEntry;
}

/**
 * دالة مساعدة لتسجيل تقييم بالنجوم من واجهة الزبون مع إرجاع الملخص المحدث فوراً
 */
export function submitServiceRating(
  serviceId: string, 
  starRating: number, 
  serviceName?: string,
  comment?: string,
  authorName?: string
): ServiceRatingInfo {
  // البحث عن اسم الخدمة إن لم يُمرر
  let finalServiceName = serviceName;
  if (!finalServiceName) {
    const service = getSalonServices().find((s) => s.id === serviceId);
    finalServiceName = service ? service.name : 'خدمة في الصالون';
  }

  submitCustomerRating(serviceId, finalServiceName, starRating, comment, authorName);
  const summary = getServiceRatings();
  return summary[serviceId] || { totalScore: starRating, count: 1, average: starRating, userRating: starRating };
}

/**
 * حذف تقييم قديم أو غير مناسب من لوحة التحكم
 */
export function deleteCustomerRating(ratingId: string): ServiceRatingEntry[] {
  const existing = getAllCustomerRatings();
  const updated = existing.filter((r) => r.id !== ratingId);
  saveAllCustomerRatings(updated);
  return updated;
}

/* =========================================================================
   8. نظام الحماية وتسجيل الدخول للوحة التحكم (Authentication & Setup)
   ========================================================================= */

/* =========================================================================
   8. نظام الحماية وإدارة المشرفين والصلاحيات (Authentication & Admin Management)
   - الاعتماد الثابت الحصري للمالك: Username: 7aw12005 / Password: 07712818522abood##
   - إدارة المشرفين الإضافيين وتحديد صلاحياتهم وتخزينهم في LocalStorage
   ========================================================================= */

/**
 * جلب قائمة كافة المشرفين (المالك الأساسي دائماً في البداية + المشرفين الإضافيين)
 */
export function getAllAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_USERS);
    const secondaryAdmins: AdminUser[] = raw ? JSON.parse(raw) : [];

    // التأكد من عدم تكرار حساب المالك
    const filteredSecondary = secondaryAdmins.filter(
      (a) => a.username.toLowerCase() !== MASTER_OWNER_ACCOUNT.username.toLowerCase()
    );

    return [MASTER_OWNER_ACCOUNT, ...filteredSecondary];
  } catch (err) {
    console.error('Error getting admin users:', err);
    return [MASTER_OWNER_ACCOUNT];
  }
}

export function saveSecondaryAdminUsers(secondaryUsers: AdminUser[]): void {
  // تصفية حساب المالك الثابت لحمايته دائماً
  const filtered = secondaryUsers.filter(
    (u) => u.id !== MASTER_OWNER_ACCOUNT.id && u.username.toLowerCase() !== MASTER_OWNER_ACCOUNT.username.toLowerCase()
  );
  localStorage.setItem(STORAGE_KEYS.ADMIN_USERS, JSON.stringify(filtered));
  broadcastLocalChange(STORAGE_KEYS.ADMIN_USERS);
}

/**
 * إضافة مشرف جديد إلى لوحة التحكم
 */
export function addAdminUser(
  username: string,
  passwordPlain: string,
  role: AdminRole = 'moderator',
  displayName?: string
): { success: boolean; message: string; admin?: AdminUser } {
  const cleanUsername = username.trim().toLowerCase();
  const cleanPassword = passwordPlain.trim();

  if (!cleanUsername || !cleanPassword) {
    return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  if (cleanPassword.length < 4) {
    return { success: false, message: 'يجب أن تتكون كلمة المرور من 4 خانات على الأقل' };
  }

  // منع تكرار اسم المالك أو أي مشرف مسجل
  const allAdmins = getAllAdminUsers();
  if (allAdmins.some((a) => a.username.toLowerCase() === cleanUsername)) {
    return { success: false, message: 'اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم آخر' };
  }

  const newAdmin: AdminUser = {
    id: `admin_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    username: cleanUsername,
    passwordPlain: cleanPassword,
    role,
    displayName: displayName?.trim() || cleanUsername,
    createdAt: new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' }),
    isOwner: false,
  };

  const secondary = allAdmins.filter((a) => a.id !== MASTER_OWNER_ACCOUNT.id);
  saveSecondaryAdminUsers([newAdmin, ...secondary]);

  return { success: true, message: 'تمت إضافة المشرف الجديد بنجاح!', admin: newAdmin };
}

/**
 * تعديل بيانات مشرف إضافي
 */
export function updateAdminUser(
  id: string,
  updates: Partial<Pick<AdminUser, 'displayName' | 'passwordPlain' | 'role'>>
): { success: boolean; message: string } {
  if (id === MASTER_OWNER_ACCOUNT.id) {
    return { success: false, message: 'لا يمكن تعديل بيانات المالك الأساسي المحمية' };
  }

  const allAdmins = getAllAdminUsers();
  const target = allAdmins.find((a) => a.id === id);
  if (!target) {
    return { success: false, message: 'المشرف غير موجود' };
  }

  const updatedSecondary = allAdmins
    .filter((a) => a.id !== MASTER_OWNER_ACCOUNT.id)
    .map((a) => (a.id === id ? { ...a, ...updates } : a));

  saveSecondaryAdminUsers(updatedSecondary);
  return { success: true, message: 'تم تحديث بيانات المشرف بنجاح' };
}

/**
 * حذف مشرف إضافي (محمي: لا يمكن حذف المالك الأساسي أبداً)
 */
export function deleteAdminUser(id: string): { success: boolean; message: string } {
  if (id === MASTER_OWNER_ACCOUNT.id) {
    return { success: false, message: 'خطأ أمني: لا يمكن حذف حساب المالك الأساسي نهائياً' };
  }

  const allAdmins = getAllAdminUsers();
  const filtered = allAdmins.filter((a) => a.id !== id && a.id !== MASTER_OWNER_ACCOUNT.id);
  saveSecondaryAdminUsers(filtered);

  return { success: true, message: 'تم حذف المشرف بنجاح' };
}

/**
 * خيار تحويل الملكية أو منح صلاحيات كاملة لمشرف محدد
 */
export function transferOwnership(targetAdminId: string): { success: boolean; message: string } {
  if (targetAdminId === MASTER_OWNER_ACCOUNT.id) {
    return { success: true, message: 'هذا الحساب هو المالك الأساسي بالفعل' };
  }

  const allAdmins = getAllAdminUsers();
  const target = allAdmins.find((a) => a.id === targetAdminId);
  if (!target) {
    return { success: false, message: 'لم يتم العثور على المشرف المطلوب' };
  }

  // ترقية المشرف لصلاحيات كاملة
  const updatedSecondary = allAdmins
    .filter((a) => a.id !== MASTER_OWNER_ACCOUNT.id)
    .map((a) => (a.id === targetAdminId ? { ...a, role: 'superadmin' as AdminRole } : a));

  saveSecondaryAdminUsers(updatedSecondary);
  return { success: true, message: `تم منح صلاحيات الإدارة الكاملة للمشرف "${target.displayName}" بنجاح!` };
}

/**
 * التحقق من تسجيل الدخول الحصري:
 * المالك الأساسي: Username: 7aw12005 / Password: 07712818522abood##
 * أو أي مشرف إضافي تم اعتماده مسبقاً
 */
export function verifyManagerLogin(
  usernameInput: string,
  passwordInput: string
): { success: boolean; user?: AdminUser; error?: string } {
  const cleanUser = usernameInput.trim();
  const cleanPass = passwordInput.trim();

  if (!cleanUser || !cleanPass) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  // 1. الفحص الصارم لحساب المالك الأساسي الثابت
  if (
    cleanUser.toLowerCase() === MASTER_OWNER_ACCOUNT.username.toLowerCase() &&
    cleanPass === MASTER_OWNER_ACCOUNT.passwordPlain
  ) {
    setManagerSessionActive(true, MASTER_OWNER_ACCOUNT);
    return { success: true, user: MASTER_OWNER_ACCOUNT };
  }

  // 2. الفحص في قائمة المشرفين الإضافيين
  const allAdmins = getAllAdminUsers();
  const matchedAdmin = allAdmins.find(
    (a) => a.username.toLowerCase() === cleanUser.toLowerCase() && a.passwordPlain === cleanPass
  );

  if (matchedAdmin) {
    setManagerSessionActive(true, matchedAdmin);
    return { success: true, user: matchedAdmin };
  }

  return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
}

export function isManagerSessionActive(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION) === 'active_logged_in';
  } catch {
    return false;
  }
}

export function getActiveAdminUser(): AdminUser {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.ACTIVE_ADMIN);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading active admin:', err);
  }
  return MASTER_OWNER_ACCOUNT;
}

export function setManagerSessionActive(active: boolean, user?: AdminUser): void {
  try {
    if (active) {
      sessionStorage.setItem(STORAGE_KEYS.SESSION, 'active_logged_in');
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_ADMIN, JSON.stringify(user || MASTER_OWNER_ACCOUNT));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_ADMIN);
    }
  } catch (err) {
    console.error('Error setting session active:', err);
  }
}

export function getManagerAccount(): ManagerAccount {
  const active = getActiveAdminUser();
  return {
    username: active.username,
    passwordHash: '',
    setupDate: active.createdAt,
  };
}

/* =========================================================================
   9. إدارة جدول أوقات العمل الأسبوعي (Weekly Schedule)
   ========================================================================= */

export function getWeeklySchedule(): DaySchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_SCHEDULE);
    if (!raw) return DEFAULT_WEEKLY_SCHEDULE;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error getting weekly schedule:', err);
    return DEFAULT_WEEKLY_SCHEDULE;
  }
}

export function saveWeeklySchedule(schedule: DaySchedule[]): DaySchedule[] {
  localStorage.setItem(STORAGE_KEYS.WEEKLY_SCHEDULE, JSON.stringify(schedule));
  broadcastLocalChange(STORAGE_KEYS.WEEKLY_SCHEDULE);
  return schedule;
}

/* =========================================================================
   10. إدارة الإحصائيات والمميزات البصرية (Stats & Visual Highlights)
   ========================================================================= */

export function getStatsHighlights(): SalonStatsHighlights {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS_HIGHLIGHTS);
    if (!raw) return DEFAULT_STATS_HIGHLIGHTS;
    return { ...DEFAULT_STATS_HIGHLIGHTS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error getting stats highlights:', err);
    return DEFAULT_STATS_HIGHLIGHTS;
  }
}

export function saveStatsHighlights(stats: Partial<SalonStatsHighlights>): SalonStatsHighlights {
  const current = getStatsHighlights();
  const updated = { ...current, ...stats };
  localStorage.setItem(STORAGE_KEYS.STATS_HIGHLIGHTS, JSON.stringify(updated));
  broadcastLocalChange(STORAGE_KEYS.STATS_HIGHLIGHTS);
  return updated;
}

/* =========================================================================
   11. إدارة الملاحظات والتنبيهات الفورية (Instant Announcements & Alerts)
   ========================================================================= */

export function getAllAnnouncements(): SalonAnnouncement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error getting announcements:', err);
    return [];
  }
}

export function saveAllAnnouncements(announcements: SalonAnnouncement[]): void {
  localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  broadcastLocalChange(STORAGE_KEYS.ANNOUNCEMENTS);
}

export function getActiveAnnouncements(): SalonAnnouncement[] {
  return getAllAnnouncements().filter((a) => a.isActive);
}

/**
 * نشر وإرسال إشعار فوري جديد من قبل صاحب المحل
 * وحفظه في LocalStorage وإرساله لجرس إشعارات الزبائن لحظياً
 */
export function publishAnnouncement(
  title: string,
  content: string,
  type: 'alert' | 'info' | 'offer' | 'closure' = 'alert'
): SalonAnnouncement {
  const newAnnouncement: SalonAnnouncement = {
    id: `ann_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
    title: title.trim() || 'تنبيه من صالون عبود',
    content: content.trim(),
    type,
    timestamp: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'short', day: 'numeric' }),
    isActive: true,
  };

  const existing = getAllAnnouncements();
  const updated = [newAnnouncement, ...existing];
  saveAllAnnouncements(updated);

  // إرسال إشعار فوري إلى جرس إشعارات الزبائن
  addCustomerNotification({
    title: `📢 ${newAnnouncement.title}`,
    message: newAnnouncement.content,
  });

  // حفظ في قاعدة بيانات Firebase للمزامنة السحابية اللحظية (/notices)
  saveNoticeToFirebase(newAnnouncement).catch((err) => {
    console.error('Firebase notice publish error:', err);
  });

  // بث حدث خاص للإشعار الفوري المنبثق في المتصفح والواجهة
  try {
    window.dispatchEvent(
      new CustomEvent('salon_announcement_broadcast', { detail: newAnnouncement })
    );
  } catch (err) {
    console.error('Error broadcasting announcement event:', err);
  }

  // محاولة إظهار Web Push Browser Notification إذا كان الإذن ممنوحاً
  triggerBrowserNotificationIfPermitted(newAnnouncement.title, newAnnouncement.content);

  return newAnnouncement;
}

export function toggleAnnouncementActive(id: string): SalonAnnouncement[] {
  const announcements = getAllAnnouncements();
  const updated = announcements.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a));
  saveAllAnnouncements(updated);
  const target = updated.find((a) => a.id === id);
  if (target) {
    saveNoticeToFirebase(target).catch((err) => {
      console.error('Firebase notice toggle error:', err);
    });
  }
  return updated;
}

export function deleteAnnouncement(id: string): SalonAnnouncement[] {
  const announcements = getAllAnnouncements();
  const updated = announcements.filter((a) => a.id !== id);
  saveAllAnnouncements(updated);
  deleteNoticeFromFirebase(id).catch((err) => {
    console.error('Firebase notice delete error:', err);
  });
  return updated;
}

/* =========================================================================
   12. إعدادات تفضيلات إشعارات الويب للمتصفح (Web Push Notification Preference)
   ========================================================================= */

export function isPushNotificationsEnabled(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.PUSH_PREF) === 'true';
  } catch {
    return false;
  }
}

export function setPushNotificationsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PUSH_PREF, enabled ? 'true' : 'false');
    broadcastLocalChange(STORAGE_KEYS.PUSH_PREF);
  } catch (err) {
    console.error('Error saving push notification pref:', err);
  }
}

export function triggerBrowserNotificationIfPermitted(title: string, body: string): void {
  try {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`صالون عبود: ${title}`, {
          body,
          icon: '/favicon.ico',
        });
      }
    }
  } catch (err) {
    console.error('Browser notification error:', err);
  }
}

/* =========================================================================
   13. إدارة المواعيد والتوقيتات وحالات الإتاحة (Time Slots Management)
   - التحكم الكامل بأوقات الحجز لكل يوم (اليوم، غداً، بعد غد)
   - إضافة، تعديل، حذف، وتحديد حالة التوقيت (متاح / محجوز)
   - مزامنة فورية مع حجوزات الزبائن عبر LocalStorage
   ========================================================================= */

/**
 * قائمة مواعيد احتياطية قياسية في حال حدوث أي خطأ أو تعذر قراءة أوقات العمل
 */
export function getFallbackTimeSlots(dayKey: DayKey = 'today'): DayTimeSlot[] {
  const safeDayKey: DayKey = (dayKey === 'tomorrow' || dayKey === 'after_tomorrow') ? dayKey : 'today';
  return [
    { id: `dyn_${safeDayKey}_15_30`, dayKey: safeDayKey, timeLabel: '03:30 عصراً', period: 'afternoon', isAvailable: true },
    { id: `dyn_${safeDayKey}_17_00`, dayKey: safeDayKey, timeLabel: '05:00 مساءً', period: 'evening', isAvailable: true },
    { id: `dyn_${safeDayKey}_18_30`, dayKey: safeDayKey, timeLabel: '06:30 مساءً', period: 'evening', isAvailable: true },
    { id: `dyn_${safeDayKey}_20_00`, dayKey: safeDayKey, timeLabel: '08:00 مساءً', period: 'evening', isAvailable: true },
    { id: `dyn_${safeDayKey}_21_30`, dayKey: safeDayKey, timeLabel: '09:30 مساءً', period: 'evening', isAvailable: true },
    { id: `dyn_${safeDayKey}_23_00`, dayKey: safeDayKey, timeLabel: '11:00 مساءً', period: 'evening', isAvailable: true },
    { id: `dyn_${safeDayKey}_00_30`, dayKey: safeDayKey, timeLabel: '12:30 ليلاً', period: 'evening', isAvailable: true },
    { id: `dyn_${safeDayKey}_02_00`, dayKey: safeDayKey, timeLabel: '02:00 ليلاً', period: 'evening', isAvailable: true },
  ];
}

/**
 * دالة توليد وحساب المواعيد الديناميكية (Dynamic Time Slots Generation):
 * تقسم أوقات الحجز تلقائياً بناءً على:
 * 1. وقت بداية العمل (openTime، مثال: 03:30 PM أو 03:30 م)
 * 2. وقت نهاية العمل (closeTime، مثال: 03:30 AM اليوم التالي أو 03:30 ص)
 * 3. مدة الموعد/الجلسة (slotDurationMinutes، مثال: 90 دقيقة)
 * بزيادة منتظمة بين كل موعد والآخر، مع المعالجة الحسابية الكاملة لدوام منتصف الليل
 */
export function generateDynamicTimeSlots(
  openTime?: string | null,
  closeTime?: string | null,
  slotDurationMinutes?: number | string | null,
  dayKey: DayKey = 'today'
): DayTimeSlot[] {
  const safeDayKey: DayKey = (dayKey === 'tomorrow' || dayKey === 'after_tomorrow')
    ? dayKey
    : 'today';

  try {
    // 1. فحص وجود أوقات العمل وتطبيق القيم الافتراضية الصارمة (Null Safety)
    const rawOpen = typeof openTime === 'string' ? openTime.trim() : '';
    const safeOpenTime = (rawOpen.length > 0 && !rawOpen.includes('Invalid') && !rawOpen.includes('NaN') && !rawOpen.includes('undefined') && !rawOpen.includes('null'))
      ? rawOpen
      : '03:30 م';

    const rawClose = typeof closeTime === 'string' ? closeTime.trim() : '';
    const safeCloseTime = (rawClose.length > 0 && !rawClose.includes('Invalid') && !rawClose.includes('NaN') && !rawClose.includes('undefined') && !rawClose.includes('null'))
      ? rawClose
      : '03:30 ص';

    const parsedDuration = Number(slotDurationMinutes);
    const duration = (!isNaN(parsedDuration) && parsedDuration >= 15 && parsedDuration <= 240)
      ? parsedDuration
      : 90;

    const openParsed = parseTimeString(safeOpenTime, 15, 30);
    const closeParsed = parseTimeString(safeCloseTime, 3, 30);

    const startMinutes = Number(openParsed?.totalMinutes ?? 930);
    const endMinutes = Number(closeParsed?.totalMinutes ?? 210);

    const isOvernight = startMinutes > endMinutes;
    const totalOperationalMinutes = isOvernight
      ? (24 * 60 - startMinutes) + endMinutes
      : (endMinutes - startMinutes);

    if (isNaN(totalOperationalMinutes) || totalOperationalMinutes <= 0) {
      return getFallbackTimeSlots(safeDayKey);
    }

    const slots: DayTimeSlot[] = [];
    let currentOffset = 0;
    let safetyCounter = 0;
    const maxSlots = 48; // حماية ضد أي حلقة لانهائية

    while (currentOffset + duration <= totalOperationalMinutes && safetyCounter < maxSlots) {
      safetyCounter++;
      const rawMinutes = (startMinutes + currentOffset) % (24 * 60);
      const hour24 = Math.floor(rawMinutes / 60);
      const minute = rawMinutes % 60;

      const hour12 = hour24 % 12 || 12;
      const hourPad = hour12.toString().padStart(2, '0');
      const minPad = minute.toString().padStart(2, '0');

      // تحديد الفترة والوصف باللغة العربية
      let periodText = 'مساءً';
      let periodCategory: 'morning' | 'afternoon' | 'evening' = 'evening';

      if (hour24 >= 4 && hour24 < 12) {
        periodText = 'صباحاً';
        periodCategory = 'morning';
      } else if (hour24 >= 12 && hour24 < 15) {
        periodText = 'ظهراً';
        periodCategory = 'afternoon';
      } else if (hour24 >= 15 && hour24 < 17) {
        periodText = 'عصراً';
        periodCategory = 'afternoon';
      } else if (hour24 >= 17 && hour24 < 24) {
        periodText = 'مساءً';
        periodCategory = 'evening';
      } else {
        periodText = 'ليلاً';
        periodCategory = 'evening';
      }

      const timeLabel = `${hourPad}:${minPad} ${periodText}`;
      const id = `dyn_${safeDayKey}_${hour24.toString().padStart(2, '0')}_${minPad}`;

      slots.push({
        id,
        dayKey: safeDayKey,
        timeLabel,
        period: periodCategory,
        isAvailable: true,
      });

      currentOffset += duration;
    }

    return (Array.isArray(slots) && slots.length > 0) ? slots : getFallbackTimeSlots(safeDayKey);
  } catch (err) {
    console.warn('generateDynamicTimeSlots caught error, returning fallback slots:', err);
    return getFallbackTimeSlots(safeDayKey);
  }
}

export function createDefaultTimeSlots(dayKey: DayKey = 'today', customSettings?: SalonSettings): DayTimeSlot[] {
  try {
    const settings = customSettings || getSalonSettings();
    const openTime = settings?.workingHours?.openTime || settings?.openTime || '03:30 م';
    const closeTime = settings?.workingHours?.closeTime || settings?.closeTime || '03:30 ص';
    const duration = Number(settings?.workingHours?.slotDurationMinutes || settings?.slotDurationMinutes) || 90;

    const slots = generateDynamicTimeSlots(openTime, closeTime, duration, dayKey);
    return slots && slots.length > 0 ? slots : getFallbackTimeSlots(dayKey);
  } catch (err) {
    console.error('Error in createDefaultTimeSlots:', err);
    return getFallbackTimeSlots(dayKey);
  }
}

export function getDefaultTimeSlotsMap(customSettings?: SalonSettings): DayTimeSlotsMap {
  const settings = customSettings || getSalonSettings();
  return {
    today: createDefaultTimeSlots('today', settings),
    tomorrow: createDefaultTimeSlots('tomorrow', settings),
    after_tomorrow: createDefaultTimeSlots('after_tomorrow', settings),
  };
}

/**
 * مزامنة المواعيد الديناميكية عند تحديث إعدادات العمل وحفظها محلياً
 */
export function syncDynamicTimeSlotsWithSettings(settings: SalonSettings): DayTimeSlotsMap {
  const newMap = getDefaultTimeSlotsMap(settings);
  const activeBookings = getAllBookings().filter(
    (b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'approved'
  );

  (['today', 'tomorrow', 'after_tomorrow'] as DayKey[]).forEach((dayKey) => {
    const dayKeyword = dayKey === 'today' ? 'اليوم' : dayKey === 'tomorrow' ? 'غداً' : 'بعد غد';
    newMap[dayKey] = newMap[dayKey].map((slot) => {
      const match = activeBookings.find(
        (b) => b.date.includes(dayKeyword) && b.timeSlot === slot.timeLabel
      );
      if (match) {
        return {
          ...slot,
          isAvailable: false,
          bookedCustomerName: match.customerName,
          bookedBookingId: match.id,
        };
      }
      return slot;
    });
  });

  saveAllDayTimeSlotsMap(newMap);
  return newMap;
}

/**
 * جلب خريطة الأوقات لكافة الأيام ومزامنتها لحظياً مع الحجوزات الفعلية والإعدادات الديناميكية
 */
export function getAllDayTimeSlotsMap(customSettings?: SalonSettings): DayTimeSlotsMap {
  try {
    const settings = customSettings || getSalonSettings();
    const dynamicDefaults = getDefaultTimeSlotsMap(settings);

    const raw = localStorage.getItem(STORAGE_KEYS.TIME_SLOTS);
    let map: DayTimeSlotsMap;
    if (raw) {
      map = JSON.parse(raw);
    } else {
      map = dynamicDefaults;
    }

    // التأكد من وجود المفاتيح الثلاثة وتوافقها مع الأوقات الديناميكية المولدة
    (['today', 'tomorrow', 'after_tomorrow'] as DayKey[]).forEach((dayKey) => {
      const generated = dynamicDefaults[dayKey];
      if (!map[dayKey] || !Array.isArray(map[dayKey]) || map[dayKey].length === 0) {
        map[dayKey] = generated;
      } else {
        // الحفاظ على حالة المواعيد المحجوزة
        const existingMap = new Map(map[dayKey].map((s) => [s.timeLabel, s]));
        map[dayKey] = generated.map((genSlot) => {
          const matchExisting = existingMap.get(genSlot.timeLabel);
          if (matchExisting) {
            return {
              ...genSlot,
              isAvailable: matchExisting.isAvailable,
              bookedCustomerName: matchExisting.bookedCustomerName,
              bookedBookingId: matchExisting.bookedBookingId,
            };
          }
          return genSlot;
        });
      }
    });

    // مزامنة حالة الحجوزات الفعلية المسجلة في المتجر مع هذه الأوقات
    const activeBookings = getAllBookings().filter(
      (b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'approved'
    );

    (['today', 'tomorrow', 'after_tomorrow'] as DayKey[]).forEach((dayKey) => {
      const dayKeyword = dayKey === 'today' ? 'اليوم' : dayKey === 'tomorrow' ? 'غداً' : 'بعد غد';
      
      map[dayKey] = map[dayKey].map((slot) => {
        // فحص هل يوجد حجز زبون مطابق لهذا اليوم وهذا التوقيت
        const match = activeBookings.find(
          (b) => b.date.includes(dayKeyword) && b.timeSlot === slot.timeLabel
        );
        if (match) {
          return {
            ...slot,
            isAvailable: false,
            bookedCustomerName: match.customerName,
            bookedBookingId: match.id,
          };
        }
        return slot;
      });
    });

    return map;
  } catch (err) {
    console.error('Error getting time slots map:', err);
    return getDefaultTimeSlotsMap(customSettings);
  }
}

export function saveAllDayTimeSlotsMap(map: DayTimeSlotsMap): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TIME_SLOTS, JSON.stringify(map));
    broadcastLocalChange(STORAGE_KEYS.TIME_SLOTS);
  } catch (err) {
    console.error('Error saving time slots map:', err);
  }
}

export function getTimeSlotsForDay(day: DayKey, customSettings?: SalonSettings): DayTimeSlot[] {
  const map = getAllDayTimeSlotsMap(customSettings);
  return map[day] || createDefaultTimeSlots(day, customSettings);
}

/**
 * تبديل حالة توقيت معين (متاح / محجوز)
 */
export function toggleTimeSlotAvailability(day: DayKey, slotId: string): DayTimeSlotsMap {
  const map = getAllDayTimeSlotsMap();
  if (!map[day]) map[day] = createDefaultTimeSlots();

  map[day] = map[day].map((slot) => {
    if (slot.id === slotId) {
      const nextAvailable = !slot.isAvailable;
      return {
        ...slot,
        isAvailable: nextAvailable,
        bookedCustomerName: nextAvailable ? undefined : slot.bookedCustomerName || 'مغلق يدوياً من الإدارة',
      };
    }
    return slot;
  });

  saveAllDayTimeSlotsMap(map);
  return map;
}

/**
 * إضافة توقيت مخصص جديد لليوم المحدد (أو لكافة الأيام)
 */
export function addCustomTimeSlot(
  day: DayKey,
  timeLabel: string,
  period: 'morning' | 'afternoon' | 'evening' = 'morning',
  isAvailable: boolean = true,
  applyToAllDays: boolean = false
): { success: boolean; message: string } {
  const cleanLabel = timeLabel.trim();
  if (!cleanLabel) {
    return { success: false, message: 'يرجى كتابة نص التوقيت (مثلاً: 12:15 ظهراً)' };
  }

  const map = getAllDayTimeSlotsMap();
  const targetDays: DayKey[] = applyToAllDays ? ['today', 'tomorrow', 'after_tomorrow'] : [day];

  targetDays.forEach((targetDay) => {
    if (!map[targetDay]) map[targetDay] = createDefaultTimeSlots();

    // فحص عدم التكرار لنفس اليوم
    const exists = map[targetDay].some((s) => s.timeLabel === cleanLabel);
    if (!exists) {
      const newSlot: DayTimeSlot = {
        id: `slot_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
        timeLabel: cleanLabel,
        period,
        isAvailable,
        isCustomAdded: true,
      };
      map[targetDay].push(newSlot);
    }
  });

  saveAllDayTimeSlotsMap(map);
  return { success: true, message: 'تمت إضافة التوقيت بنجاح وتحديثه في واجهة الحجز!' };
}

/**
 * تعديل نص أو فترة توقيت موجود
 */
export function updateTimeSlotLabel(
  day: DayKey,
  slotId: string,
  newTimeLabel: string,
  period?: 'morning' | 'afternoon' | 'evening'
): { success: boolean; message: string } {
  const cleanLabel = newTimeLabel.trim();
  if (!cleanLabel) {
    return { success: false, message: 'نص التوقيت مطلوب' };
  }

  const map = getAllDayTimeSlotsMap();
  if (!map[day]) return { success: false, message: 'اليوم غير موجود' };

  map[day] = map[day].map((slot) => {
    if (slot.id === slotId) {
      return {
        ...slot,
        timeLabel: cleanLabel,
        period: period || slot.period,
      };
    }
    return slot;
  });

  saveAllDayTimeSlotsMap(map);
  return { success: true, message: 'تم تعديل التوقيت بنجاح' };
}

/**
 * حذف توقيت معين من جدول اليوم
 */
export function deleteTimeSlot(day: DayKey, slotId: string): { success: boolean; message: string } {
  const map = getAllDayTimeSlotsMap();
  if (!map[day]) return { success: false, message: 'اليوم غير موجود' };

  map[day] = map[day].filter((s) => s.id !== slotId);
  saveAllDayTimeSlotsMap(map);
  return { success: true, message: 'تم حذف التوقيت بنجاح' };
}

/**
 * إعادة تعيين كافة أوقات اليوم إلى الحالة الافتراضية
 */
export function resetTimeSlotsForDay(day: DayKey): DayTimeSlotsMap {
  const map = getAllDayTimeSlotsMap();
  map[day] = createDefaultTimeSlots();
  saveAllDayTimeSlotsMap(map);
  return map;
}

/**
 * ترميز حجز جديد من الزبون ليصبح التوقيت محجوزاً فوراً
 */
export function markSlotAsBookedByCustomer(
  dateLabel: string,
  timeSlotLabel: string,
  customerName: string,
  bookingId: string
): void {
  try {
    let targetDay: DayKey = 'today';
    if (dateLabel.includes('غداً') || dateLabel.includes('غدا')) targetDay = 'tomorrow';
    else if (dateLabel.includes('بعد غد') || dateLabel.includes('بعدغد')) targetDay = 'after_tomorrow';

    const map = getAllDayTimeSlotsMap();
    if (map[targetDay]) {
      map[targetDay] = map[targetDay].map((slot) => {
        if (slot.timeLabel === timeSlotLabel) {
          return {
            ...slot,
            isAvailable: false,
            bookedCustomerName: customerName,
            bookedBookingId: bookingId,
          };
        }
        return slot;
      });
      saveAllDayTimeSlotsMap(map);
    }
  } catch (err) {
    console.error('Error marking slot as booked:', err);
  }
}



