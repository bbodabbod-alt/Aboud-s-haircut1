import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ServicesSection from './components/ServicesSection';
import ScheduleSection from './components/ScheduleSection';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import MyBookingsModal from './components/MyBookingsModal';
import AnnouncementsModal from './components/AnnouncementsModal';
import CustomerBookingBanner from './components/CustomerBookingBanner';
import MobileBottomBar from './components/MobileBottomBar';
import AnnouncementBanner from './components/AnnouncementBanner';
import LiveNotificationToast from './components/LiveNotificationToast';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardLogin from './components/dashboard/DashboardLogin';

import { 
  BarberService, BookingSubmission, SalonSettings, 
  DashboardNotification, ManagerAccount, ServiceRatingsMap,
  ServiceRatingEntry, DaySchedule, SalonStatsHighlights, SalonAnnouncement
} from './types';
import { 
  getSalonSettings, getSalonServices, getAllBookings, 
  getDashboardNotifications, getCustomerNotifications, 
  getServiceRatings, submitServiceRating, getAllCustomerRatings,
  getWeeklySchedule, getStatsHighlights, getAllAnnouncements,
  isPushNotificationsEnabled, setPushNotificationsEnabled,
  getManagerAccount, isManagerSessionActive, setManagerSessionActive,
  saveAllDayTimeSlotsMap 
} from './utils/salonStore';
import { getCustomerBookings, removeCustomerBooking } from './utils/bookingApi';
import { 
  subscribeToFirebaseBookings, subscribeToFirebaseTimeSlots,
  subscribeToFirebaseSettings, subscribeToFirebaseServices, subscribeToFirebaseNotices
} from './utils/firebaseBookingService';

/**
 * 1. دالة التحقق من الرابط (URL Routing):
 * تتحقق مما إذا كان الرابط ينتهي بـ #admin أو ?admin أو يحتوي عليهما.
 * الاعتماد على كلمة admin يكون برمجياً في الرابط فقط، مع تجنب ظهورها كنص للزبائن.
 */
function isDashboardRoute(): boolean {
  if (typeof window === 'undefined') return false;

  const hash = (window.location.hash || '').toLowerCase();
  const search = (window.location.search || '').toLowerCase();
  const href = (window.location.href || '').toLowerCase();

  // فحص شامل: ينتهي بـ #admin أو ?admin أو يحتوي على كلمة admin في الـ hash أو الـ search
  const hasAdminInHash = hash.includes('admin');
  const hasAdminInSearch = search.includes('admin');
  const hasAdminInHref = href.endsWith('#admin') || href.includes('?admin') || href.includes('&admin');

  return hasAdminInHash || hasAdminInSearch || hasAdminInHref;
}

export default function App() {
  // Navigation View: 'customer' (واجهة الزبون) أو 'control-panel' (لوحة التحكم)
  const [currentView, setCurrentView] = useState<'customer' | 'control-panel'>(() => {
    return isDashboardRoute() ? 'control-panel' : 'customer';
  });
  
  const [isManagerLoggedIn, setIsManagerLoggedIn] = useState<boolean>(() => {
    return isManagerSessionActive();
  });

  // Synchronized Data State
  const [salonSettings, setSalonSettings] = useState<SalonSettings>(getSalonSettings());
  const [salonServices, setSalonServices] = useState<BarberService[]>(getSalonServices());
  const [allBookings, setAllBookings] = useState<BookingSubmission[]>(getAllBookings());
  const [notifications, setNotifications] = useState<DashboardNotification[]>(getDashboardNotifications());
  const [customerNotifications, setCustomerNotifications] = useState<DashboardNotification[]>(getCustomerNotifications());
  const [serviceRatings, setServiceRatings] = useState<ServiceRatingsMap>(getServiceRatings());
  const [customerRatings, setCustomerRatings] = useState<ServiceRatingEntry[]>(getAllCustomerRatings());
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(getWeeklySchedule());
  const [statsHighlights, setStatsHighlights] = useState<SalonStatsHighlights>(getStatsHighlights());
  const [announcements, setAnnouncements] = useState<SalonAnnouncement[]>(getAllAnnouncements());
  const [pushEnabled, setPushEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted' || isPushNotificationsEnabled();
    }
    return isPushNotificationsEnabled();
  });
  const [managerAccount, setManagerAccount] = useState<ManagerAccount | null>(getManagerAccount());
  
  // Customer Modals & State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<BarberService | null>(null);
  const [customerBookings, setCustomerBookings] = useState<BookingSubmission[]>(getCustomerBookings());

  // Function to refresh all data from LocalStorage
  const refreshAllData = useCallback(() => {
    setSalonSettings(getSalonSettings());
    setSalonServices(getSalonServices());
    setAllBookings(getAllBookings());
    setNotifications(getDashboardNotifications());
    setCustomerNotifications(getCustomerNotifications());
    setServiceRatings(getServiceRatings());
    setCustomerRatings(getAllCustomerRatings());
    setWeeklySchedule(getWeeklySchedule());
    setStatsHighlights(getStatsHighlights());
    setAnnouncements(getAllAnnouncements());
    setPushEnabled(
      (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') ||
      isPushNotificationsEnabled()
    );
    setManagerAccount(getManagerAccount());
    setCustomerBookings(getCustomerBookings());
    setIsManagerLoggedIn(isManagerSessionActive());
  }, []);

  /* =========================================================================
     1. تفعيل المراقبة اللحظية للرابط (URL Routing Listeners)
     - مستمع hashchange يتفاعل فور كتابة #admin في الرابط والضغط على Enter بدون reload.
     - مستمع popstate لأسهم الرجوع والتقدم.
     - فحص دوري خفيف (200ms) لضمان الاستجابة في جميع المتصفحات والـ Iframes.
     ========================================================================= */
  useEffect(() => {
    const checkAndApplyRoute = () => {
      const isTargetingDashboard = isDashboardRoute();
      setCurrentView(isTargetingDashboard ? 'control-panel' : 'customer');
    };

    // التحقق فور تحميل الصفحة
    checkAndApplyRoute();

    window.addEventListener('hashchange', checkAndApplyRoute);
    window.addEventListener('popstate', checkAndApplyRoute);

    // فحص دوري سريع لضمان الاستجابة الفورية في بيئة Iframe
    const pollTimer = setInterval(() => {
      const isTargetingDashboard = isDashboardRoute();
      setCurrentView((prev) => {
        const next = isTargetingDashboard ? 'control-panel' : 'customer';
        return prev === next ? prev : next;
      });
    }, 200);

    return () => {
      window.removeEventListener('hashchange', checkAndApplyRoute);
      window.removeEventListener('popstate', checkAndApplyRoute);
      clearInterval(pollTimer);
    };
  }, []);

  // 2. Cross-Tab & In-Tab Real-time synchronization
  useEffect(() => {
    refreshAllData();

    const handleStorageEvent = () => {
      refreshAllData();
    };

    const handleLocalSyncEvent = () => {
      refreshAllData();
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('salon_data_synced', handleLocalSyncEvent);
    window.addEventListener('salon_announcement_broadcast', handleLocalSyncEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('salon_data_synced', handleLocalSyncEvent);
      window.removeEventListener('salon_announcement_broadcast', handleLocalSyncEvent);
    };
  }, [refreshAllData]);

  // 3. Full Cloud Real-time synchronization via Firebase (/settings, /services, /notices, /slots, /bookings)
  useEffect(() => {
    // 1. Settings (/settings/general)
    const unsubscribeSettings = subscribeToFirebaseSettings((fbSettings) => {
      if (fbSettings) {
        setSalonSettings(fbSettings);
        if (fbSettings.weeklySchedule) setWeeklySchedule(fbSettings.weeklySchedule);
        if (fbSettings.statsHighlights) setStatsHighlights(fbSettings.statsHighlights);
      }
    });

    // 2. Services (/services)
    const unsubscribeServices = subscribeToFirebaseServices((fbServices) => {
      if (fbServices && fbServices.length > 0) {
        const sorted = [...fbServices].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        setSalonServices(sorted);
      }
    });

    // 3. Notices & Announcements (/notices)
    const unsubscribeNotices = subscribeToFirebaseNotices((fbNotices) => {
      if (fbNotices) {
        setAnnouncements(fbNotices);
      }
    });

    // 4. Time Slots (/slots & /timeSlots)
    const unsubscribeSlots = subscribeToFirebaseTimeSlots((fbSlotsMap) => {
      saveAllDayTimeSlotsMap(fbSlotsMap);
    });

    // 5. Bookings (/bookings)
    const unsubscribeBookings = subscribeToFirebaseBookings((fbBookings) => {
      if (fbBookings && fbBookings.length > 0) {
        setAllBookings(fbBookings);
        // مزامنة حالة حجوزات الزبون النشطة فور تغيير حالتها (قبول / تم الإنجاز / رفض)
        setCustomerBookings((prevCustomerBookings) => {
          const list = prevCustomerBookings && prevCustomerBookings.length > 0 ? prevCustomerBookings : getCustomerBookings();
          if (!list || list.length === 0) return list;
          let hasChanges = false;
          const updated = list.map((cb) => {
            const match = fbBookings.find((fb) => fb.id === cb.id || fb.bookingCode === cb.bookingCode);
            if (match && match.status !== cb.status) {
              hasChanges = true;
              return { ...cb, status: match.status };
            }
            return cb;
          });
          if (hasChanges) {
            localStorage.setItem('abboud_customer_bookings_list_v1', JSON.stringify(updated));
            return updated;
          }
          return list;
        });
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeServices();
      unsubscribeNotices();
      unsubscribeSlots();
      unsubscribeBookings();
    };
  }, []);

  /* =========================================================================
     3. زر "العودة للموقع":
     يقوم برمجياً بمسح كلمة admin من الرابط والعودة للرابط الأساسي وإظهار واجهة الزبون
     ========================================================================= */
  const handleExitToCustomerSite = () => {
    try {
      const cleanPath = window.location.pathname;
      window.history.pushState(null, '', cleanPath);
      window.location.hash = '';
      if (window.location.search.includes('admin')) {
        window.location.search = '';
      }
    } catch (err) {
      console.error('Error clearing admin from URL:', err);
    }

    setCurrentView('customer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setManagerSessionActive(false);
    setIsManagerLoggedIn(false);
  };

  // Pure Genuine Service Rating Handler
  const handleRateService = (
    serviceId: string, 
    stars: number, 
    serviceName?: string,
    comment?: string,
    authorName?: string
  ) => {
    submitServiceRating(serviceId, stars, serviceName, comment, authorName);
    refreshAllData();
  };

  // Web Push Notification Permission Handler
  const handleRequestPushNotification = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPushNotificationsEnabled(true);
          setPushEnabled(true);
          new Notification('صالون عبود 💈', {
            body: 'تم تفعيل إشعارات الصالون بنجاح! ستصلك التنبيهات والملاحظات فوراً.',
            icon: '/favicon.ico',
          });
        } else {
          setPushNotificationsEnabled(true);
          setPushEnabled(true);
        }
      } else {
        setPushNotificationsEnabled(true);
        setPushEnabled(true);
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      setPushNotificationsEnabled(true);
      setPushEnabled(true);
    }
  };

  // Customer Booking Handlers
  const handleOpenBooking = (service?: BarberService) => {
    if (service) {
      setSelectedService(service);
    }
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleOpenMyBookings = () => {
    setCustomerBookings(getCustomerBookings());
    setIsMyBookingsOpen(true);
  };

  const handleCloseMyBookings = () => {
    setIsMyBookingsOpen(false);
  };

  const handleBookingSuccess = (newBooking: BookingSubmission) => {
    refreshAllData();
  };

  const handleCancelCustomerBooking = (bookingId: string) => {
    const updated = removeCustomerBooking(bookingId);
    setCustomerBookings(updated);
    refreshAllData();
  };

  const latestCustomerBooking = customerBookings.length > 0 ? customerBookings[0] : null;

  /* =========================================================================
     2. منطق التبديل (Switching Logic):
     إذا كان الرابط ينتهي بـ #admin أو ?admin: إخفاء واجهة الزبون بالكامل وإظهار لوحة التحكم.
     إذا كان الرابط لا يحتوي على كلمة admin: إخفاء لوحة التحكم وعرض واجهة الزبون الرئيسية.
     ========================================================================= */
  if (currentView === 'control-panel') {
    return (
      <div id="control-panel-root" className="min-h-screen bg-[#090b0e]">
        {!isManagerLoggedIn ? (
          <DashboardLogin
            onLoginSuccess={() => {
              setIsManagerLoggedIn(true);
              refreshAllData();
            }}
            onExitToCustomerSite={handleExitToCustomerSite}
          />
        ) : (
          <DashboardLayout
            settings={salonSettings}
            services={salonServices}
            bookings={allBookings}
            notifications={notifications}
            ratings={customerRatings}
            ratingsSummary={serviceRatings}
            announcements={announcements}
            account={managerAccount}
            onRefreshData={refreshAllData}
            onExitToCustomerSite={handleExitToCustomerSite}
            onLogout={handleLogout}
          />
        )}
      </div>
    );
  }

  /* =========================================================================
     واجهة الزبون الرئيسية (Customer View)
     نظيفة تماماً من أي كلمة أو زر للوحة التحكم، مع نظام تقييم النجوم وجرس الإشعارات
     ========================================================================= */
  return (
    <div id="customer-view-root" className="min-h-screen bg-[#0c0e12] text-neutral-100 flex flex-col font-sans pb-16 md:pb-0 selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Live Notification Pop-up Toast */}
      <LiveNotificationToast onDismiss={refreshAllData} />

      {/* Top Header & Navigation with Announcements Option in Menu (Requirement 1) */}
      <Header
        onOpenBooking={() => handleOpenBooking()}
        onOpenMyBookings={handleOpenMyBookings}
        onOpenAnnouncements={() => setIsAnnouncementsOpen(true)}
        announcementsCount={announcements.filter((a) => a.isActive).length}
        bookingsCount={customerBookings.length}
        settings={salonSettings}
        customerNotifications={customerNotifications}
        onNotificationsUpdated={refreshAllData}
        pushEnabled={pushEnabled}
        onRequestPush={handleRequestPushNotification}
      />

      {/* Prominent Instant Announcements Bar */}
      <AnnouncementBanner
        announcements={announcements}
        pushEnabled={pushEnabled}
        onRequestPush={handleRequestPushNotification}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <Hero 
          onOpenBooking={() => handleOpenBooking()} 
          settings={salonSettings}
        />

        {/* Customer Active Booking Details Banner */}
        {latestCustomerBooking && (
          <CustomerBookingBanner
            booking={latestCustomerBooking}
            totalBookingsCount={customerBookings.length}
            onOpenBookingModal={() => handleOpenBooking()}
            onCancelBooking={() => {
              if (window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الحجز؟')) {
                handleCancelCustomerBooking(latestCustomerBooking.id);
              }
            }}
            onOpenMyBookings={handleOpenMyBookings}
          />
        )}

        {/* Services & Offers Cards Section (كروت نظيفة وبدون شارات المدة الزمنية + نظام تقييم حقيقي) */}
        <ServicesSection 
          onSelectService={(service) => handleOpenBooking(service)} 
          services={salonServices}
          ratings={serviceRatings}
          onRateService={handleRateService}
        />

        {/* Schedule & Working Hours (Dynamic 7-Day Schedule from LocalStorage) */}
        <ScheduleSection 
          onOpenBooking={() => handleOpenBooking()} 
          settings={salonSettings}
          weeklySchedule={weeklySchedule}
        />

        {/* About & Craftsmanship (Dynamic Stats Highlights & Content from LocalStorage) */}
        <AboutSection statsHighlights={statsHighlights} settings={salonSettings} />

        {/* Contact & Location (Dynamic from Settings) */}
        <ContactSection settings={salonSettings} />
      </main>

      {/* Footer (Dynamic from Settings) */}
      <Footer
        onOpenBooking={() => handleOpenBooking()}
        onOpenMyBookings={handleOpenMyBookings}
        settings={salonSettings}
      />

      {/* Sticky Mobile Action Bar */}
      <MobileBottomBar onOpenBooking={() => handleOpenBooking()} />

      {/* New Booking Form Modal */}
      <BookingModal
        isOpen={isBookingOpen}
        onClose={handleCloseBooking}
        selectedService={selectedService}
        onBookingSuccess={handleBookingSuccess}
        services={salonServices}
        settings={salonSettings}
      />

      {/* "حجوزاتك" Modal */}
      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={handleCloseMyBookings}
        bookings={customerBookings}
        onOpenNewBooking={() => handleOpenBooking()}
        onCancelBooking={handleCancelCustomerBooking}
      />

      {/* "الملاحظات والتنبيهات المهمة" Modal (Requirement 2) */}
      <AnnouncementsModal
        isOpen={isAnnouncementsOpen}
        onClose={() => setIsAnnouncementsOpen(false)}
        announcements={announcements}
        pushEnabled={pushEnabled}
        onRequestPush={handleRequestPushNotification}
      />
    </div>
  );
}
