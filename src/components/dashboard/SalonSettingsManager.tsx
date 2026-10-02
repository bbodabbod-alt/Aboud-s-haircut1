import { useState, useEffect } from 'react';
import { SalonSettings, DaySchedule, SalonStatsHighlights } from '../../types';
import { 
  saveSalonSettings, getWeeklySchedule, saveWeeklySchedule, 
  getStatsHighlights, saveStatsHighlights, DEFAULT_WEEKLY_SCHEDULE, DEFAULT_STATS_HIGHLIGHTS 
} from '../../utils/salonStore';
import { 
  Settings, Save, CheckCircle2, Scissors, Power, Phone, 
  Clock, Calendar, Award, ShieldCheck, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';

interface SalonSettingsManagerProps {
  settings: SalonSettings;
  onSettingsUpdated: () => void;
}

export default function SalonSettingsManager({ settings, onSettingsUpdated }: SalonSettingsManagerProps) {
  // Basic Settings
  const [salonName, setSalonName] = useState(settings.salonName);
  const [welcomeTitle, setWelcomeTitle] = useState(settings.welcomeTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle);
  const [manualShopStatus, setManualShopStatus] = useState<'auto' | 'open' | 'closed'>(settings.manualShopStatus || 'auto');
  const [openTime, setOpenTime] = useState(settings.openTime || '10:00 ص');
  const [closeTime, setCloseTime] = useState(settings.closeTime || '11:30 م');
  const [phone, setPhone] = useState(settings.phone || '+964 780 000 0000');
  const [location, setLocation] = useState(settings.location || 'الشارع العام - مقابل السوق التجاري');
  
  // Requirement 1: Weekly Schedule (7 Days)
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(() => {
    return getWeeklySchedule();
  });

  // Requirement 2: Stats & Visual Highlights
  const [statsHighlights, setStatsHighlights] = useState<SalonStatsHighlights>(() => {
    return getStatsHighlights();
  });

  // Notification feedbacks
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hoursSavedSuccess, setHoursSavedSuccess] = useState(false);
  const [scheduleSavedSuccess, setScheduleSavedSuccess] = useState(false);
  const [statsSavedSuccess, setStatsSavedSuccess] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setWeeklySchedule(getWeeklySchedule());
    setStatsHighlights(getStatsHighlights());
  }, [settings]);

  // Update specific day in schedule
  const handleDayChange = (index: number, field: keyof DaySchedule, value: string | boolean) => {
    setWeeklySchedule((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Dedicated Save: Weekly Schedule (Requirement 1)
  const handleSaveWeeklySchedule = () => {
    saveWeeklySchedule(weeklySchedule);
    setScheduleSavedSuccess(true);
    onSettingsUpdated();
    setTimeout(() => setScheduleSavedSuccess(false), 3500);
  };

  // Dedicated Save: Stats & Highlights (Requirement 2)
  const handleSaveStatsHighlights = () => {
    saveStatsHighlights(statsHighlights);
    setStatsSavedSuccess(true);
    onSettingsUpdated();
    setTimeout(() => setStatsSavedSuccess(false), 3500);
  };

  // Dedicated Save for General Working Hours
  const handleSaveWorkingHoursOnly = () => {
    saveSalonSettings({
      openTime: openTime.trim(),
      closeTime: closeTime.trim(),
    });
    setHoursSavedSuccess(true);
    onSettingsUpdated();
    setTimeout(() => setHoursSavedSuccess(false), 3500);
  };

  // General All Save
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    saveSalonSettings({
      salonName: salonName.trim(),
      welcomeTitle: welcomeTitle.trim(),
      heroSubtitle: heroSubtitle.trim(),
      manualShopStatus,
      openTime: openTime.trim(),
      closeTime: closeTime.trim(),
      phone: phone.trim(),
      location: location.trim(),
      weeklySchedule,
      statsHighlights,
    });
    saveWeeklySchedule(weeklySchedule);
    saveStatsHighlights(statsHighlights);

    setSavedSuccess(true);
    onSettingsUpdated();
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-400" />
          <span>إعدادات الواجهة والمحل</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          تحكم كامل بجدول الدوام الأسبوعي، الإحصائيات البصرية، النصوص الترحيبية، وحالة المحل الحية.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>تم حفظ جميع التعديلات بنجاح وتحديث موقع الزبائن فوراً بدون إعادة تحميل!</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* =========================================================================
            القسم 1: تعديل "جدول أوقات العمل الأسبوعي" (7 أيام) - Requirement 1
            ========================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-amber-500/30 space-y-5 shadow-lg shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">جدول أوقات العمل الأسبوعي (السبت - الجمعة)</h3>
                <p className="text-[11px] text-neutral-400">تحديد أوقات فتح وإغلاق الصالون لكل يوم، أو تعيين اليوم كـ "مغلق / عطلة"</p>
              </div>
            </div>

            {scheduleSavedSuccess && (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم حفظ جدول العمل الأسبوعي!</span>
              </span>
            )}
          </div>

          {/* Days Table List */}
          <div className="space-y-3">
            {weeklySchedule.map((dayItem, idx) => (
              <div 
                key={dayItem.day}
                className={`p-3.5 rounded-xl border transition-all ${
                  dayItem.isClosed 
                    ? 'bg-neutral-950/60 border-neutral-800/80 opacity-75' 
                    : 'bg-neutral-900 border-neutral-700/80'
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  
                  {/* Day Name & Toggle Closed */}
                  <div className="md:col-span-3 flex items-center justify-between md:justify-start gap-3">
                    <span className="text-sm font-bold text-white min-w-[70px]">
                      {dayItem.day}
                    </span>

                    {/* Closed Switch Button */}
                    <button
                      type="button"
                      onClick={() => handleDayChange(idx, 'isClosed', !dayItem.isClosed)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        dayItem.isClosed
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {dayItem.isClosed ? 'عطلة (مغلق)' : 'متاح للعمل'}
                    </button>
                  </div>

                  {/* Open & Close Time Inputs */}
                  <div className="md:col-span-5 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-neutral-400 block mb-0.5">وقت البدء:</label>
                      <input
                        type="text"
                        disabled={dayItem.isClosed}
                        value={dayItem.openTime}
                        onChange={(e) => handleDayChange(idx, 'openTime', e.target.value)}
                        placeholder="10:00 ص"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-white border transition-colors ${
                          dayItem.isClosed 
                            ? 'bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-950 border-neutral-700 focus:border-amber-400 focus:outline-none'
                        }`}
                      />
                    </div>

                    <span className="text-neutral-500 text-xs mt-3.5">-</span>

                    <div className="flex-1">
                      <label className="text-[10px] text-neutral-400 block mb-0.5">وقت الانتهاء:</label>
                      <input
                        type="text"
                        disabled={dayItem.isClosed}
                        value={dayItem.closeTime}
                        onChange={(e) => handleDayChange(idx, 'closeTime', e.target.value)}
                        placeholder="11:30 م"
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-white border transition-colors ${
                          dayItem.isClosed 
                            ? 'bg-neutral-950 border-neutral-800 text-neutral-600 cursor-not-allowed'
                            : 'bg-neutral-950 border-neutral-700 focus:border-amber-400 focus:outline-none'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Day Note / Status Text */}
                  <div className="md:col-span-4">
                    <label className="text-[10px] text-neutral-400 block mb-0.5">ملاحظة اليوم (تظهر بجانب الوقت):</label>
                    <input
                      type="text"
                      value={dayItem.note}
                      onChange={(e) => handleDayChange(idx, 'note', e.target.value)}
                      placeholder="مثال: متاح للعمل أو بعد صلاة الجمعة"
                      className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none transition-colors"
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* Action Row: Save Schedule Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveWeeklySchedule}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ جدول العمل الأسبوعي</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            القسم 2: تعديل "الإحصائيات والمميزات البصرية" - Requirement 2
            ========================================================================= */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-amber-500/30 space-y-5 shadow-lg shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">الإحصائيات والمميزات البصرية (بطاقات الخبرة والتعقيم)</h3>
                <p className="text-[11px] text-neutral-400">تعديل الأرقام والشعارات البارزة في قسم "عن الصالون" بواجهة الزبائن</p>
              </div>
            </div>

            {statsSavedSuccess && (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم حفظ الإحصائيات والمميزات!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* أ) عداد سنوات الخبرة */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>أ) عداد سنوات الخبرة والاحتراف:</span>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  الرقم / القيمة المعروضة (مثال: +10 أو 12+):
                </label>
                <input
                  type="text"
                  required
                  value={statsHighlights.experienceYearsValue}
                  onChange={(e) => setStatsHighlights({ ...statsHighlights, experienceYearsValue: e.target.value })}
                  placeholder="10+"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  العنوان / الوصف أسفل الرقم:
                </label>
                <input
                  type="text"
                  required
                  value={statsHighlights.experienceYearsLabel}
                  onChange={(e) => setStatsHighlights({ ...statsHighlights, experienceYearsLabel: e.target.value })}
                  placeholder="سنوات من الخبرة والاحتراف"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* ب) نسبة أو نص التعقيم الطبي */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ب) نسبة ومستوى التعقيم الطبي:</span>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  النسبة / القيمة المعروضة (مثال: 100%):
                </label>
                <input
                  type="text"
                  required
                  value={statsHighlights.sterilizationPercentValue}
                  onChange={(e) => setStatsHighlights({ ...statsHighlights, sterilizationPercentValue: e.target.value })}
                  placeholder="100%"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">
                  العنوان / الوصف أسفل النسبة:
                </label>
                <input
                  type="text"
                  required
                  value={statsHighlights.sterilizationPercentLabel}
                  onChange={(e) => setStatsHighlights({ ...statsHighlights, sterilizationPercentLabel: e.target.value })}
                  placeholder="تعقيم طبي للأدوات قبل كل استخدام"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center p-2 rounded-lg bg-neutral-900 border border-neutral-800 min-w-[120px]">
                <span className="text-lg font-black text-amber-400 font-mono block">
                  {statsHighlights.experienceYearsValue || '10+'}
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  {statsHighlights.experienceYearsLabel || 'سنوات من الخبرة والاحتراف'}
                </span>
              </div>

              <div className="text-center p-2 rounded-lg bg-neutral-900 border border-neutral-800 min-w-[120px]">
                <span className="text-lg font-black text-amber-400 font-mono block">
                  {statsHighlights.sterilizationPercentValue || '100%'}
                </span>
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  {statsHighlights.sterilizationPercentLabel || 'تعقيم طبي للأدوات قبل كل استخدام'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveStatsHighlights}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ الإحصائيات والمميزات</span>
            </button>
          </div>
        </div>

        {/* Section 3: General Working Hours baseline */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">النص العام لأوقات الدوام (الواجهة الرئيسية والفوتر)</h3>
                <p className="text-[11px] text-neutral-400">النص المختصر الذي يظهر تحت صورة الصالون وفي أسفل الموقع</p>
              </div>
            </div>

            {hoursSavedSuccess && (
              <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم حفظ أوقات العمل!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>توقيت فتح المحل:</span>
              </label>
              <input
                type="text"
                required
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                placeholder="10:00 ص"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>توقيت إغلاق المحل:</span>
              </label>
              <input
                type="text"
                required
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                placeholder="11:30 م"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[11px] text-neutral-400 block">معاينة النص المعروض:</span>
              <strong className="text-sm text-amber-300 font-mono">
                دوام العمل: {openTime || '10:00 ص'} - {closeTime || '11:30 م'}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleSaveWorkingHoursOnly}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ أوقات العمل</span>
            </button>
          </div>
        </div>

        {/* Section 4: Manual Shop Status Control */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Power className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">التحكم اليدوي بحالة المحل</h3>
              <p className="text-[11px] text-neutral-400">تغيير المؤشر الحي في أعلى موقع الزبائن</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setManualShopStatus('auto')}
              className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                manualShopStatus === 'auto'
                  ? 'bg-amber-500/15 border-amber-400 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">تلقائي (حسب الوقت)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <p className="text-[11px] text-neutral-400">
                يحسب حالة المحل تلقائياً من الساعة {openTime} حتى {closeTime}.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setManualShopStatus('open')}
              className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                manualShopStatus === 'open'
                  ? 'bg-emerald-500/15 border-emerald-400 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-400">مفتوح الآن دائماً</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-neutral-400">
                إظهار المحل كمفتوح الآن للزبائن متجاوزاً ساعات الدوام.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setManualShopStatus('closed')}
              className={`p-4 rounded-xl border text-right transition-all cursor-pointer ${
                manualShopStatus === 'closed'
                  ? 'bg-rose-500/15 border-rose-400 shadow-md'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-rose-400">مغلق مؤقتاً</span>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              </div>
              <p className="text-[11px] text-neutral-400">
                إظهار تنبيه للزبائن بأن المحل مغلق مؤقتاً لأمر طارئ أو استراحة.
              </p>
            </button>
          </div>
        </div>

        {/* Section 5: Salon Branding & Texts */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Scissors className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">النصوص الترحيبية وهوية الواجهة</h3>
              <p className="text-[11px] text-neutral-400">تعديل اسم الصالون والعبارات المعروضة في الصفحة الرئيسية</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                اسم الصالون (Brand Name):
              </label>
              <input
                type="text"
                required
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                placeholder="حلاقة عبود"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                <span>الرسالة الترحيبية المتحركة في أعلى الصفحة (Hero Welcome Text):</span>
                <span className="text-amber-400 text-[11px]">تظهر بتأثير بصري فور الدخول</span>
              </label>
              <input
                type="text"
                required
                value={welcomeTitle}
                onChange={(e) => setWelcomeTitle(e.target.value)}
                placeholder="مرحباً بك ايها الزبون عند حلاقة عبود"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                الوصف الترحيبي (Hero Subtitle):
              </label>
              <textarea
                rows={3}
                required
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="نقدم لك تجربة حلاقة وعناية استثنائية..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Contact & Location */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Phone className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">معلومات الاتصال والموقع</h3>
              <p className="text-[11px] text-neutral-400">تظهر في أعلى وأسفل موقع الزبائن</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                رقم الهاتف / الواتساب:
              </label>
              <input
                type="text"
                required
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+964 780 000 0000"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white text-right focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                العنوان المعروض للزبائن:
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="الشارع العام - مقابل السوق التجاري"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Save All Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-7 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتطبيق جميع التغييرات فوراً</span>
          </button>
        </div>

      </form>

    </div>
  );
}
