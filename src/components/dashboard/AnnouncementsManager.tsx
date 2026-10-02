import { useState } from 'react';
import { SalonAnnouncement } from '../../types';
import { publishAnnouncement, toggleAnnouncementActive, deleteAnnouncement } from '../../utils/salonStore';
import { 
  Megaphone, Send, BellRing, AlertTriangle, Info, 
  Sparkles, CheckCircle2, Clock, Calendar, Trash2, Power, Eye
} from 'lucide-react';

interface AnnouncementsManagerProps {
  announcements: SalonAnnouncement[];
  onAnnouncementsUpdated: () => void;
}

export default function AnnouncementsManager({
  announcements,
  onAnnouncementsUpdated,
}: AnnouncementsManagerProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'alert' | 'info' | 'offer' | 'closure'>('closure');
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Quick suggestions for the barber
  const quickTemplates = [
    {
      title: 'إشعار إغلاق طارئ',
      content: 'حبايب اليوم ماراح افتح المحل لظرف طارئ، ونلتقي باجر في موعدنا المعتاد بإذن الله.',
      type: 'closure' as const,
    },
    {
      title: 'استراحة مؤقتة',
      content: 'زبائننا الكرام، المحل في استراحة قصيرة وسنعاود استقبالكم بعد ساعة من الآن.',
      type: 'alert' as const,
    },
    {
      title: 'عرض وتجهيزات جديدة',
      content: 'تم توفير أجهزة وماسكات عناية وتنظيف مسام جديدة اليوم، حياكم الله وبأفضل الأسعار!',
      type: 'offer' as const,
    },
  ];

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    publishAnnouncement(
      title.trim() || (type === 'closure' ? 'إشعار إغلاق اليوم' : 'تنبيه من صالون عبود'),
      content.trim(),
      type
    );

    setPublishedSuccess(true);
    setTitle('');
    setContent('');
    onAnnouncementsUpdated();
    setTimeout(() => setPublishedSuccess(false), 4500);
  };

  const handleToggle = (id: string) => {
    toggleAnnouncementActive(id);
    onAnnouncementsUpdated();
  };

  const handleDelete = (id: string, annTitle: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف إعلان "${annTitle}"؟`)) {
      deleteAnnouncement(id);
      onAnnouncementsUpdated();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-amber-400" />
          <span>الملاحظات والإعلانات الفورية (Instant Announcements)</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          نشر تنبيهات سريعة، إعلانات الإغلاق المفاجئ، أو الملاحظات الطارئة التي تظهر للزبائن كشريط بارز وإشعار فوري.
        </p>
      </div>

      {publishedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong className="block text-emerald-300">تم نشر الملاحظة وإرسال الإشعار بنجاح! 🚀</strong>
            <span className="text-[11px] text-emerald-400/90">
              تظهر الملاحظة الآن في الشريط البارز بموقع الزبون، وتم إرسال تنبيه مباشر إلى أجهزتهم.
            </span>
          </div>
        </div>
      )}

      {/* Publishing Form */}
      <form onSubmit={handlePublish} className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-amber-500/30 space-y-4 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <BellRing className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">كتابة ونشر ملاحظة جديدة</h3>
            <p className="text-[11px] text-neutral-400">ستصل لجميع زبائن الصالون في الوقت الفعلي</p>
          </div>
        </div>

        {/* Quick Suggestion Buttons */}
        <div>
          <span className="text-[11px] text-neutral-400 block mb-1.5 font-medium">نماذج سريعة جاهزة للاستخدام:</span>
          <div className="flex flex-wrap gap-2">
            {quickTemplates.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTitle(item.title);
                  setContent(item.content);
                  setType(item.type);
                }}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] text-neutral-300 hover:text-amber-300 transition-colors cursor-pointer"
              >
                + {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            عنوان الملاحظة (اختياري):
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: تنبيه لزبائن عبود الكرام، إشعار إغلاق اليوم..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Notice Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            نوع الملاحظة (يحدد لون وأيقونة التنبيه):
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setType('closure')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'closure'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>إغلاق طارئ</span>
            </button>

            <button
              type="button"
              onClick={() => setType('alert')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'alert'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>تنبيه هام</span>
            </button>

            <button
              type="button"
              onClick={() => setType('info')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'info'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span>ملاحظة عامة</span>
            </button>

            <button
              type="button"
              onClick={() => setType('offer')}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                type === 'offer'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>عرض جديد</span>
            </button>
          </div>
        </div>

        {/* Content Textarea */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1">
            نص الملاحظة أو الإعلان (يظهر للزبون):
          </label>
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="اكتب رسالتك مثل: حبايب اليوم ماراح افتح المحل لظرف طارئ ونلتقي باجر بإذن الله..."
            className="w-full bg-neutral-900 border border-neutral-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Publish Action Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Send className="w-4 h-4 rotate-180" />
            <span>نشر وإرسال إشعار</span>
          </button>
        </div>
      </form>

      {/* Previously Published Announcements List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>سجل الملاحظات والإعلانات السابقة ({announcements.length})</span>
          </h3>
          <span className="text-[11px] text-neutral-400">
            يمكنك تعطيل أو تفعيل أي إعلان ليظهر أو يختفي من موقع الزبون
          </span>
        </div>

        {announcements.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 space-y-1">
            <Info className="w-7 h-7 mx-auto text-neutral-600 mb-2" />
            <p className="text-xs font-semibold text-neutral-300">لا توجد إعلانات سابقة</p>
            <p className="text-[11px] text-neutral-500">
              استخدم النموذج أعلاه لنشر أول ملاحظة لزبائن الصالون.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                  ann.isActive
                    ? 'bg-neutral-900/90 border-neutral-700/80 shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800/60 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ann.type === 'closure'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : ann.type === 'offer'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : ann.type === 'info'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {ann.type === 'closure' ? 'إغلاق طارئ' : ann.type === 'offer' ? 'عرض' : ann.type === 'info' ? 'ملاحظة' : 'تنبيه'}
                    </span>

                    <h4 className="text-xs font-bold text-white">
                      {ann.title}
                    </h4>

                    {ann.isActive && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>معروض حالياً للزبائن</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto text-neutral-400 text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-neutral-500" />
                      {ann.createdAt}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      {ann.timestamp}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-200 leading-relaxed font-sans bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                  {ann.content}
                </p>

                {/* Actions: Toggle Active / Delete */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggle(ann.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      ann.isActive
                        ? 'bg-neutral-800 text-amber-300 hover:bg-neutral-700'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{ann.isActive ? 'إيقاف العرض من الموقع' : 'تفعيل وإظهار في الموقع'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(ann.id, ann.title)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="حذف الإعلان"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
