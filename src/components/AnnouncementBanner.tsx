import { useState } from 'react';
import { SalonAnnouncement } from '../types';
import { Megaphone, AlertTriangle, Sparkles, Info, X, Bell, BellRing, Check } from 'lucide-react';

interface AnnouncementBannerProps {
  announcements: SalonAnnouncement[];
  pushEnabled: boolean;
  onRequestPush: () => void;
}

export default function AnnouncementBanner({
  announcements,
  pushEnabled,
  onRequestPush,
}: AnnouncementBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Filter only active and non-dismissed announcements
  const activeList = announcements.filter((a) => a.isActive && !dismissedIds.includes(a.id));

  if (activeList.length === 0) return null;

  const current = activeList[0];

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const isClosure = current.type === 'closure';
  const isOffer = current.type === 'offer';
  const isInfo = current.type === 'info';

  const bgColor = isClosure 
    ? 'bg-gradient-to-r from-rose-950/90 via-neutral-900 to-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/30'
    : isOffer
    ? 'bg-gradient-to-r from-emerald-950/90 via-neutral-900 to-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/30'
    : isInfo
    ? 'bg-gradient-to-r from-blue-950/90 via-neutral-900 to-blue-950/90 border-blue-500/40 text-blue-200 shadow-blue-950/30'
    : 'bg-gradient-to-r from-amber-950/90 via-neutral-900 to-amber-950/90 border-amber-500/40 text-amber-200 shadow-amber-950/30';

  const badgeColor = isClosure
    ? 'bg-rose-500 text-neutral-950 font-black'
    : isOffer
    ? 'bg-emerald-500 text-neutral-950 font-black'
    : isInfo
    ? 'bg-blue-500 text-neutral-950 font-black'
    : 'bg-amber-400 text-neutral-950 font-black';

  return (
    <div className="w-full relative z-30 animate-in slide-in-from-top duration-300">
      <div className={`border-b border-t shadow-lg px-4 py-3 ${bgColor}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Announcement Content */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider shrink-0 ${badgeColor}`}>
                {current.type === 'closure' ? '🚨 إشعار عاجل' : current.type === 'offer' ? '🎁 عرض خاص' : '📢 تنبيه الصالون'}
              </span>

              <strong className="text-xs sm:text-sm font-bold text-white font-sans">
                {current.title}:
              </strong>

              <span className="text-xs sm:text-sm text-neutral-100 font-medium">
                {current.content}
              </span>

              <span className="text-[11px] text-neutral-400 font-mono hidden md:inline">
                ({current.timestamp})
              </span>
            </div>
          </div>

          {/* Quick Notification Opt-in & Dismiss */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            {/* Button: "تفعيل إشعارات الموقع" (Requirement 2-A) */}
            {!pushEnabled ? (
              <button
                type="button"
                onClick={onRequestPush}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                title="تلقي إشعارات فورية على جهازك عند نشر أي تنبيه جديد"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>تفعيل إشعارات الموقع</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>الإشعارات مفعلة</span>
              </span>
            )}

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => handleDismiss(current.id)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors cursor-pointer"
              title="إغلاق التنبيه"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
