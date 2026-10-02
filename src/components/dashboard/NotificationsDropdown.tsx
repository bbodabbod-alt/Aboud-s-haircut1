import { useState, useRef, useEffect } from 'react';
import { DashboardNotification } from '../../types';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearNotifications 
} from '../../utils/salonStore';
import { Bell, CheckCheck, Trash2, Calendar, X } from 'lucide-react';

interface NotificationsDropdownProps {
  notifications: DashboardNotification[];
  onNotificationsUpdated: () => void;
  onNavigateToBookings: () => void;
}

export default function NotificationsDropdown({
  notifications,
  onNotificationsUpdated,
  onNavigateToBookings,
}: NotificationsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (notif: DashboardNotification) => {
    markNotificationAsRead(notif.id);
    onNotificationsUpdated();
    setIsOpen(false);
    onNavigateToBookings();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    onNotificationsUpdated();
  };

  const handleClearAll = () => {
    clearNotifications();
    onNotificationsUpdated();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer"
        aria-label="جرس الإشعارات"
      >
        <Bell className="w-5 h-5" />
        
        {unreadCount > 0 && (
          <>
            <span className="animate-ping absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-amber-400 opacity-75" />
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-amber-500 text-neutral-950 text-[10px] font-black rounded-full flex items-center justify-center font-mono shadow-md">
              {unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#121620] border border-neutral-700/80 shadow-2xl z-50 overflow-hidden text-right animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="p-3.5 px-4 bg-[#161a26] border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white">إشعارات الحجوزات اللحظية</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} جديد
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>تحديد كمقروء</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 space-y-2">
                <Bell className="w-8 h-8 mx-auto text-neutral-600 stroke-[1.5]" />
                <p className="text-xs">لا توجد إشعارات حتى الآن</p>
                <p className="text-[10px] text-neutral-600">
                  ستظهر هنا تنبيهات فورية عندما يقوم الزبائن بحجز مواعيد جديدة من الموقع الرئيسي.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 hover:bg-neutral-900/90 transition-colors cursor-pointer flex items-start gap-3 ${
                    !notif.read ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.read ? 'bg-amber-500/20 text-amber-400' : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    <Calendar className="w-4 h-4" />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        {!notif.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" />
                        )}
                        <span>{notif.title}</span>
                      </p>
                      <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-2.5 px-4 bg-[#161a26] border-t border-neutral-800 flex items-center justify-between text-[11px]">
              <button
                onClick={handleClearAll}
                className="text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>مسح كل الإشعارات</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToBookings();
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                عرض كل الحجوزات ←
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
