import { useState } from 'react';
import { 
  BarberService, BookingSubmission, SalonSettings, 
  DashboardNotification, ManagerAccount, ServiceRatingEntry, ServiceRatingsMap,
  SalonAnnouncement
} from '../../types';
import BookingsManager from './BookingsManager';
import ServicesManager from './ServicesManager';
import RatingsManager from './RatingsManager';
import AnnouncementsManager from './AnnouncementsManager';
import TimeSlotsManager from './TimeSlotsManager';
import WebsiteContentManager from './WebsiteContentManager';
import AdminsPermissionsManager from './AdminsPermissionsManager';
import SalonSettingsManager from './SalonSettingsManager';
import AccountSettingsManager from './AccountSettingsManager';
import NotificationsDropdown from './NotificationsDropdown';
import { 
  Calendar, Sparkles, Settings, KeyRound, LogOut, 
  Scissors, Menu, X, Power, ShieldCheck, ArrowRight, Star, Megaphone, Crown, Clock, Globe
} from 'lucide-react';

interface DashboardLayoutProps {
  settings: SalonSettings;
  services: BarberService[];
  bookings: BookingSubmission[];
  notifications: DashboardNotification[];
  ratings: ServiceRatingEntry[];
  ratingsSummary: ServiceRatingsMap;
  announcements: SalonAnnouncement[];
  account: ManagerAccount | null;
  onRefreshData: () => void;
  onExitToCustomerSite: () => void;
  onLogout: () => void;
}

export default function DashboardLayout({
  settings,
  services,
  bookings,
  notifications,
  ratings,
  ratingsSummary,
  announcements,
  account,
  onRefreshData,
  onExitToCustomerSite,
  onLogout,
}: DashboardLayoutProps) {
  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'timeslots' | 'content' | 'ratings' | 'announcements' | 'admins' | 'settings' | 'account'>('bookings');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pendingBookingsCount = bookings.filter((b) => b.status === 'pending').length;
  const activeAnnouncementsCount = announcements.filter((a) => a.isActive).length;

  return (
    <div className="min-h-screen bg-[#090b0e] text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#11141c]/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              aria-label="القائمة الجانبية"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/10">
                <Scissors className="w-5 h-5 rotate-90" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-white tracking-tight block">
                  لوحة تحكم صالون عبود
                </span>
                <span className="text-[10px] text-amber-400 font-mono tracking-wider -mt-1 block">
                  CONTROL PANEL
                </span>
              </div>
            </div>
          </div>

          {/* Right: Notifications, Quick Status, Return to Site Button, Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
              <Power className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-neutral-400">حالة المحل:</span>
              <span className={`font-bold ${
                settings.manualShopStatus === 'open'
                  ? 'text-emerald-400'
                  : settings.manualShopStatus === 'closed'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}>
                {settings.manualShopStatus === 'open'
                  ? 'مفتوح دائماً'
                  : settings.manualShopStatus === 'closed'
                  ? 'مغلق مؤقتاً'
                  : 'تلقائي بالوقت'}
              </span>
            </div>

            {/* Notification Bell with Badge */}
            <NotificationsDropdown
              notifications={notifications}
              onNotificationsUpdated={onRefreshData}
              onNavigateToBookings={() => setActiveTab('bookings')}
            />

            {/* Button: "العودة للموقع" */}
            <button
              onClick={onExitToCustomerSite}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title="العودة للموقع الرئيسي للزبائن ومسح الرابط"
            >
              <ArrowRight className="w-4 h-4 rotate-180 text-amber-400" />
              <span>العودة للموقع</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="تسجيل الخروج من لوحة التحكم"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Sidebar Desktop */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
          <div className="p-4 rounded-2xl bg-[#121620] border border-neutral-800 space-y-1">
            <p className="text-[11px] text-neutral-500 font-bold px-3 py-1 uppercase tracking-wider">
              أقسام لوحة التحكم
            </p>

            {/* 1. Bookings */}
            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>الحجوزات والمواعيد</span>
              </div>
              {pendingBookingsCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono ${
                  activeTab === 'bookings' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500 text-neutral-950'
                }`}>
                  {pendingBookingsCount}
                </span>
              )}
            </button>

            {/* 2. Services */}
            <button
              onClick={() => setActiveTab('services')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>العروض والخدمات</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${
                activeTab === 'services' ? 'text-neutral-950' : 'text-neutral-500'
              }`}>
                {services.length}
              </span>
            </button>

            {/* 3. Time Slots */}
            <button
              onClick={() => setActiveTab('timeslots')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'timeslots'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>إدارة المواعيد والتوقيتات</span>
              </div>
            </button>

            {/* 4. NEW: إدارة محتوى الموقع (Website Content Management) */}
            <button
              onClick={() => setActiveTab('content')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>إدارة محتوى الموقع</span>
              </div>
            </button>

            {/* 5. Ratings Management */}
            <button
              onClick={() => setActiveTab('ratings')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'ratings'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>تقييمات الخدمات</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'ratings' ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-amber-400'
              }`}>
                {ratings.length}
              </span>
            </button>

            {/* 6. Instant Announcements */}
            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'announcements'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>الملاحظات والإعلانات</span>
              </div>
              {activeAnnouncementsCount > 0 && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'announcements' ? 'bg-neutral-950 text-rose-400' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {activeAnnouncementsCount} نشط
                </span>
              )}
            </button>

            {/* 7. Admins & Permissions */}
            <button
              onClick={() => setActiveTab('admins')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'admins'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>إدارة الآدمنية والصلاحيات</span>
              </div>
            </button>

            {/* 8. Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات الدوام والمحل</span>
            </button>

            {/* 9. Account */}
            <button
              onClick={() => setActiveTab('account')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'account'
                  ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/10'
                  : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>إعدادات الحساب</span>
            </button>
          </div>

          {/* Quick Return to Site in Sidebar */}
          <div className="p-3 rounded-2xl bg-[#121620] border border-neutral-800">
            <button
              onClick={onExitToCustomerSite}
              className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-amber-400" />
              <span>العودة للموقع</span>
            </button>
          </div>

          {/* Manager Account Info Pill */}
          <div className="p-4 rounded-2xl bg-[#121620] border border-neutral-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-neutral-200">{account?.username || '7aw12005'}</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-normal">
              حساب المالك الأساسي دائم الحماية ومسجل بـ 7aw12005.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Bar / Drawer */}
        {mobileSidebarOpen && (
          <div className="lg:hidden p-4 rounded-2xl bg-[#121620] border border-neutral-800 space-y-2 mb-4">
            <button
              onClick={() => {
                setActiveTab('bookings');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'bookings' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>الحجوزات والمواعيد</span>
              </div>
              {pendingBookingsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-neutral-950 font-bold">
                  {pendingBookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('services');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'services' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>العروض والخدمات ({services.length})</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('timeslots');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'timeslots' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>إدارة المواعيد والتوقيتات</span>
              </div>
            </button>

            {/* Mobile Website Content Manager */}
            <button
              onClick={() => {
                setActiveTab('content');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'content' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>إدارة محتوى الموقع</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('ratings');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'ratings' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>تقييمات الخدمات ({ratings.length})</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('announcements');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'announcements' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>الملاحظات والإعلانات</span>
              </div>
              {activeAnnouncementsCount > 0 && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  {activeAnnouncementsCount} نشط
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('admins');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                activeTab === 'admins' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>إدارة الآدمنية والصلاحيات</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'settings' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>إعدادات الدوام والمحل</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('account');
                setMobileSidebarOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                activeTab === 'account' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-300'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>إعدادات الحساب</span>
            </button>

            <button
              onClick={() => {
                setMobileSidebarOpen(false);
                onExitToCustomerSite();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-amber-500/10 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 border border-amber-500/30"
            >
              <ArrowRight className="w-4 h-4 rotate-180 text-amber-400" />
              <span>العودة للموقع</span>
            </button>
          </div>
        )}

        {/* Content Pane */}
        <main className="flex-1 min-w-0">
          {activeTab === 'bookings' && (
            <BookingsManager
              bookings={bookings}
              onBookingsUpdated={onRefreshData}
            />
          )}

          {activeTab === 'services' && (
            <ServicesManager
              services={services}
              onServicesUpdated={onRefreshData}
            />
          )}

          {activeTab === 'timeslots' && (
            <TimeSlotsManager
              onSlotsUpdated={onRefreshData}
            />
          )}

          {activeTab === 'content' && (
            <WebsiteContentManager
              settings={settings}
              services={services}
              onSettingsUpdated={onRefreshData}
              onServicesUpdated={onRefreshData}
            />
          )}

          {activeTab === 'ratings' && (
            <RatingsManager
              ratings={ratings}
              services={services}
              ratingsSummary={ratingsSummary}
              onRatingsUpdated={onRefreshData}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsManager
              announcements={announcements}
              onAnnouncementsUpdated={onRefreshData}
            />
          )}

          {activeTab === 'admins' && (
            <AdminsPermissionsManager
              onAdminsUpdated={onRefreshData}
            />
          )}

          {activeTab === 'settings' && (
            <SalonSettingsManager
              settings={settings}
              onSettingsUpdated={onRefreshData}
            />
          )}

          {activeTab === 'account' && (
            <AccountSettingsManager />
          )}
        </main>

      </div>

    </div>
  );
}
