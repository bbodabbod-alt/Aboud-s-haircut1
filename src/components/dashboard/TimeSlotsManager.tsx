import { useState, useEffect } from 'react';
import { DayKey, DayTimeSlot, DayTimeSlotsMap } from '../../types';
import { 
  getAllDayTimeSlotsMap, saveAllDayTimeSlotsMap, toggleTimeSlotAvailability, 
  addCustomTimeSlot, updateTimeSlotLabel, deleteTimeSlot, resetTimeSlotsForDay,
  getSalonSettings, saveSalonSettings, syncDynamicTimeSlotsWithSettings
} from '../../utils/salonStore';
import { toggleSlotInFirebase, subscribeToFirebaseTimeSlots, saveWorkingHoursToFirebase } from '../../utils/firebaseBookingService';
import { 
  Clock, Plus, CheckCircle2, AlertCircle, Trash2, Edit2, 
  Calendar, RotateCcw, Power, Check, X, User, Sparkles, RefreshCw
} from 'lucide-react';

interface TimeSlotsManagerProps {
  onSlotsUpdated?: () => void;
}

export default function TimeSlotsManager({ onSlotsUpdated }: TimeSlotsManagerProps) {
  const [slotsMap, setSlotsMap] = useState<DayTimeSlotsMap>(() => getAllDayTimeSlotsMap());
  const [selectedDay, setSelectedDay] = useState<DayKey>('today');

  // Dynamic Generation Settings State
  const initialSettings = getSalonSettings();
  const [genOpenTime, setGenOpenTime] = useState<string>(initialSettings.openTime || '03:30 م');
  const [genCloseTime, setGenCloseTime] = useState<string>(initialSettings.closeTime || '03:30 ص');
  const [genDuration, setGenDuration] = useState<number>(
    initialSettings.slotDurationMinutes || initialSettings.workingHours?.slotDurationMinutes || 90
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // New Slot Form State
  const [newTimeLabel, setNewTimeLabel] = useState('');
  const [newPeriod, setNewPeriod] = useState<'morning' | 'afternoon' | 'evening'>('afternoon');
  const [newIsAvailable, setNewIsAvailable] = useState<boolean>(true);
  const [applyToAllDays, setApplyToAllDays] = useState<boolean>(false);

  // Edit Slot State
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [editTimeLabel, setEditTimeLabel] = useState('');

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshSlots = () => {
    const updated = getAllDayTimeSlotsMap();
    setSlotsMap(updated);
    if (onSlotsUpdated) onSlotsUpdated();
  };

  const currentSlots = slotsMap[selectedDay] || [];
  const availableCount = currentSlots.filter((s) => s.isAvailable).length;
  const bookedCount = currentSlots.filter((s) => !s.isAvailable).length;

  // Real-time synchronization from Firebase
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseTimeSlots((updatedMap) => {
      if (updatedMap && Object.keys(updatedMap).length > 0) {
        setSlotsMap(updatedMap);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handler for Automatic Dynamic Slots Generation (Requirement 2 & 1)
  const handleRegenerateDynamicSlots = async () => {
    setIsGenerating(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const duration = Math.max(15, Math.min(240, Number(genDuration) || 90));

      // 1. حفظ في LocalStorage وتحديث الذاكرة
      saveSalonSettings({
        openTime: genOpenTime.trim(),
        closeTime: genCloseTime.trim(),
        slotDurationMinutes: duration,
        workingHours: {
          openTime: genOpenTime.trim(),
          closeTime: genCloseTime.trim(),
          slotDurationMinutes: duration,
        },
      });

      // 2. تحديث المسار settings/workingHours فوراً في Firebase Realtime Database
      await saveWorkingHoursToFirebase({
        openTime: genOpenTime.trim(),
        closeTime: genCloseTime.trim(),
        slotDurationMinutes: duration,
      });

      // 3. إعادة توليد المواعيد الديناميكية بزيادة duration دقيقة ومزامنتها
      const newMap = syncDynamicTimeSlotsWithSettings({
        ...getSalonSettings(),
        openTime: genOpenTime.trim(),
        closeTime: genCloseTime.trim(),
        slotDurationMinutes: duration,
      });

      setSlotsMap(newMap);
      if (onSlotsUpdated) onSlotsUpdated();

      setSuccessMsg(
        `تم بنجاح توليد المواعيد وتقسيمها بفارق ${duration} دقيقة (من ${genOpenTime} إلى ${genCloseTime}) ومزامنتها مع Firebase!`
      );
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err) {
      console.error('Error generating dynamic slots:', err);
      setErrorMsg('حدث خطأ أثناء حفظ وتوليد المواعيد، يرجى المحاولة ثانية');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle Availability (Local & Firebase)
  const handleToggleSlot = (slotId: string) => {
    const targetSlot = currentSlots.find((s) => s.id === slotId);
    const updated = toggleTimeSlotAvailability(selectedDay, slotId);
    setSlotsMap(updated);
    if (targetSlot) {
      toggleSlotInFirebase(selectedDay, targetSlot).catch((err) => {
        console.error('Failed to sync slot toggle to Firebase:', err);
      });
    }
    if (onSlotsUpdated) onSlotsUpdated();
  };

  // Add New Slot
  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = addCustomTimeSlot(
      selectedDay,
      newTimeLabel,
      newPeriod,
      newIsAvailable,
      applyToAllDays
    );

    if (res.success) {
      setSuccessMsg(res.message);
      setNewTimeLabel('');
      refreshSlots();
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Save Edit Slot
  const handleSaveEdit = (slotId: string) => {
    if (!editTimeLabel.trim()) return;
    const res = updateTimeSlotLabel(selectedDay, slotId, editTimeLabel.trim());
    if (res.success) {
      setEditingSlotId(null);
      setEditTimeLabel('');
      refreshSlots();
      setSuccessMsg(res.message);
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Delete Slot
  const handleDeleteSlot = (slotId: string, label: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف التوقيت "${label}" من جدول ${getDayLabel(selectedDay)}؟`)) {
      const res = deleteTimeSlot(selectedDay, slotId);
      if (res.success) {
        refreshSlots();
        setSuccessMsg(res.message);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  // Reset to default
  const handleResetDay = () => {
    if (window.confirm(`هل أنت متأكد من إعادة تعيين أوقات ${getDayLabel(selectedDay)} إلى الجدول الافتراضي؟`)) {
      const updated = resetTimeSlotsForDay(selectedDay);
      setSlotsMap(updated);
      if (onSlotsUpdated) onSlotsUpdated();
      setSuccessMsg(`تمت إعادة تعيين أوقات ${getDayLabel(selectedDay)} بنجاح`);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Make all available
  const handleMakeAllAvailable = () => {
    const updated = { ...slotsMap };
    updated[selectedDay] = updated[selectedDay].map((s) => ({
      ...s,
      isAvailable: true,
      bookedCustomerName: undefined,
    }));
    saveAllDayTimeSlotsMap(updated);
    setSlotsMap(updated);
    if (onSlotsUpdated) onSlotsUpdated();
    setSuccessMsg(`تم تعيين كافة أوقات ${getDayLabel(selectedDay)} كمتاحة للحجز`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  function getDayLabel(key: DayKey): string {
    switch (key) {
      case 'today': return 'اليوم';
      case 'tomorrow': return 'غداً';
      case 'after_tomorrow': return 'بعد غد';
    }
  }

  // Quick suggestion chips for new time
  const quickTimeSuggestions = [
    '12:30 ظهراً', '01:45 ظهراً', '04:00 عصراً', '05:15 عصراً', '07:45 مساءً', '11:15 مساءً'
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            <span>إدارة المواعيد والتوقيتات (Time Slots Management)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            التحكم بالأوقات المتاحة للحجز لكل يوم (اليوم، غداً، بعد غد)، إضافة وحذف أوقات جديدة، وتحديد حالة الحجز (متاح / محجوز).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMakeAllAvailable}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="إتاحة كافة أوقات اليوم المختار للحجز"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>إتاحة الكل</span>
          </button>

          <button
            type="button"
            onClick={handleResetDay}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="استعادة الأوقات الافتراضية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Days Tabs (اليوم، غداً، بعد غد) */}
      <div className="grid grid-cols-3 gap-3">
        {(['today', 'tomorrow', 'after_tomorrow'] as DayKey[]).map((dayKey) => {
          const isSelected = selectedDay === dayKey;
          const slots = slotsMap[dayKey] || [];
          const avail = slots.filter((s) => s.isAvailable).length;
          const booked = slots.filter((s) => !s.isAvailable).length;

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => setSelectedDay(dayKey)}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-400 shadow-lg shadow-amber-500/5'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Calendar className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-neutral-400'}`} />
                <span className={`text-sm font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                  {getDayLabel(dayKey)}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">{avail} متاح</span>
                <span className="text-neutral-600">·</span>
                <span className={booked > 0 ? 'text-rose-400 font-bold' : 'text-neutral-500'}>
                  {booked} محجوز
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add New Slot Form */}
      <form onSubmit={handleAddSlot} className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-amber-500/30 space-y-4 shadow-lg shadow-amber-500/5">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <Plus className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">إضافة توقيت جديد لـ ({getDayLabel(selectedDay)})</h3>
            <p className="text-[11px] text-neutral-400">إضافة ساعة أو موعد حجز جديد يظهر للزبون في نافذة الحجز</p>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div>
          <span className="text-[11px] text-neutral-400 block mb-1.5">اقتراحات سريعة:</span>
          <div className="flex flex-wrap gap-2">
            {quickTimeSuggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setNewTimeLabel(sug)}
                className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] text-neutral-300 hover:text-amber-300 transition-colors cursor-pointer"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              نص التوقيت:
            </label>
            <input
              type="text"
              required
              value={newTimeLabel}
              onChange={(e) => setNewTimeLabel(e.target.value)}
              placeholder="مثال: 05:15 عصراً أو 01:30 ظهراً"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              الفترة:
            </label>
            <select
              value={newPeriod}
              onChange={(e) => setNewPeriod(e.target.value as 'morning' | 'afternoon' | 'evening')}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
            >
              <option value="morning">صباحاً (Morning)</option>
              <option value="afternoon">ظهراً وعصراً (Afternoon)</option>
              <option value="evening">مساءً وليلاً (Evening)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              الحالة المبدئية:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNewIsAvailable(true)}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  newIsAvailable 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
              >
                متاح
              </button>
              <button
                type="button"
                onClick={() => setNewIsAvailable(false)}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  !newIsAvailable 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                }`}
              >
                محجوز
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAllDays}
              onChange={(e) => setApplyToAllDays(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-neutral-900 border-neutral-700"
            />
            <span>تطبيق وإضافة هذا التوقيت على كافة الأيام (اليوم، غداً، بعد غد)</span>
          </label>

          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة التوقيت</span>
          </button>
        </div>
      </form>

      {/* Current Slots List & Status Switchers */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              أوقات جدول ({getDayLabel(selectedDay)}) - إجمالي {currentSlots.length} توقيت
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            اضغط على زر الحالة للتبديل بين "متاح" و"محجوز" فوراً
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentSlots.map((slot) => {
            const isBooked = !slot.isAvailable;

            return (
              <div
                key={slot.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isBooked
                    ? 'bg-neutral-950/70 border-rose-500/30 text-neutral-400'
                    : 'bg-neutral-900 border-neutral-700/80 hover:border-neutral-600 text-neutral-100'
                }`}
              >
                {/* Time & Booked Customer info */}
                <div className="space-y-1 min-w-0">
                  {editingSlotId === slot.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in">
                      <input
                        type="text"
                        value={editTimeLabel}
                        onChange={(e) => setEditTimeLabel(e.target.value)}
                        className="bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-amber-400 w-32"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(slot.id)}
                        className="p-1 bg-amber-500 text-neutral-950 rounded text-[11px] font-bold"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlotId(null)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold font-mono ${isBooked ? 'line-through text-neutral-400' : 'text-white'}`}>
                        {slot.timeLabel}
                      </span>

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBooked
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isBooked ? 'محجوز / غير متاح' : 'متاح للحجز'}
                      </span>
                    </div>
                  )}

                  {/* Booking details if booked by a customer */}
                  {isBooked && slot.bookedCustomerName && (
                    <div className="text-[11px] text-rose-400/90 flex items-center gap-1">
                      <User className="w-3 h-3 text-rose-400" />
                      <span>{slot.bookedCustomerName}</span>
                    </div>
                  )}
                </div>

                {/* Actions: Toggle Status, Edit, Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Switcher Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSlot(slot.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isBooked
                        ? 'bg-neutral-800 hover:bg-emerald-500/20 text-neutral-300 hover:text-emerald-300 border border-neutral-700'
                        : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                    }`}
                    title={isBooked ? 'إعادة التوقيت ليصبح متاحاً للزبائن' : 'إغلاق هذا التوقيت وتعيينه كمحجوز'}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isBooked ? 'جعله متاحاً' : 'تعيين كمحجوز'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlotId(slot.id);
                      setEditTimeLabel(slot.timeLabel);
                    }}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                    title="تعديل وقت الموعد"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id, slot.timeLabel)}
                    className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="حذف هذا التوقيت"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
