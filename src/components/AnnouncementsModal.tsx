import { useEffect } from 'react';
import { SalonAnnouncement } from '../types';
import { 
  Megaphone, X, Clock, Calendar, AlertTriangle, 
  Sparkles, Info, BellRing, Check, Bell
} from 'lucide-react';

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: SalonAnnouncement[];
  pushEnabled?: boolean;
  onRequestPush?: () => void;
}

export default function AnnouncementsModal({
  isOpen,
  onClose,
  announcements,
  pushEnabled = false,
  onRequestPush = () => {},
}: AnnouncementsModalProps) {
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

  // Filter only active announcements (or all if all are active)
  const displayList = announcements;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-[#0e1117] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-[#151922]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>الملاحظات والتنبيهات المهمة</span>
                {displayList.filter(a => a.isActive).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-black">
                    {displayList.filter(a => a.isActive).length} تنبيه
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400">
                سجل الإعلانات والملاحظات الفورية المنشورة من إدارة الصالون
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
          
          {displayList.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-500 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-neutral-600" />
              </div>
              <h4 className="text-sm font-bold text-white">لا توجد ملاحظات أو إعلانات حالياً</h4>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
                صالون حلاقة عبود يعمل وفق المواعيد الرسمية المعتادة. سيتم نشر أي تنبيه طارئ أو إغلاق أو عروض جديدة هنا فوراً.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayList.map((ann) => {
                const isClosure = ann.type === 'closure';
                const isOffer = ann.type === 'offer';
                const isInfo = ann.type === 'info';

                return (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isClosure
                        ? 'bg-gradient-to-r from-rose-950/40 via-neutral-900/90 to-rose-950/20 border-rose-500/40 shadow-lg shadow-rose-950/20'
                        : isOffer
                        ? 'bg-gradient-to-r from-emerald-950/40 via-neutral-900/90 to-emerald-950/20 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : isInfo
                        ? 'bg-gradient-to-r from-blue-950/40 via-neutral-900/90 to-blue-950/20 border-blue-500/40 shadow-lg shadow-blue-950/20'
                        : 'bg-gradient-to-r from-amber-950/40 via-neutral-900/90 to-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                    }`}
                  >
                    {/* Badge & Title & Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black tracking-wide flex items-center gap-1 ${
                          isClosure
                            ? 'bg-rose-500 text-neutral-950'
                            : isOffer
                            ? 'bg-emerald-500 text-neutral-950'
                            : isInfo
                            ? 'bg-blue-500 text-neutral-950'
                            : 'bg-amber-400 text-neutral-950'
                        }`}>
                          {isClosure ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>إغلاق طارئ</span>
                            </>
                          ) : isOffer ? (
                            <>
                              <Sparkles className="w-3 h-3" />
                              <span>عرض جديد</span>
                            </>
                          ) : isInfo ? (
                            <>
                              <Info className="w-3 h-3" />
                              <span>ملاحظة</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>تنبيه هام</span>
                            </>
                          )}
                        </span>

                        <h4 className="text-sm font-bold text-white">
                          {ann.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono self-start sm:self-auto">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-500" />
                          <span>{ann.createdAt}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Clock className="w-3 h-3" />
                          <span>{ann.timestamp}</span>
                        </span>
                      </div>
                    </div>

                    {/* Announcement Content */}
                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100 font-medium leading-relaxed">
                      {ann.content}
                    </div>

                    {/* Footer tags */}
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>معتمد ومباشر من الإدارة</span>
                      </span>
                      <span className="text-neutral-500">
                        صالون حلاقة عبود
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Push Notification Banner inside Modal */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-neutral-300">
                {pushEnabled ? 'الإشعارات الفورية مفعلة على جهازك لتلقي أي إعلان' : 'ترغب بتلقي أي ملاحظة أو تنبيه فور نشره؟'}
              </span>
            </div>

            {!pushEnabled ? (
              <button
                type="button"
                onClick={onRequestPush}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold rounded-lg transition-colors cursor-pointer shrink-0 text-xs flex items-center gap-1"
              >
                <span>تفعيل</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3" />
                <span>مفعلة</span>
              </span>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-[#151922] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-neutral-700"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
