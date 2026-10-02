export interface CountdownInfo {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  formatted: string;
}

export interface ShopStatusResult {
  isOpen: boolean;
  statusText: string;
  subText: string;
  currentTimeFormatted: string;
  openingHoursLabel: string;
  closesAtLabel: string;
  mode: 'auto' | 'open' | 'closed';
  isOvernight: boolean;
  countdown: CountdownInfo;
  targetDateIso: string;
  targetAction: 'open' | 'close';
}

/**
 * دالة تحليل دقيقة ومرنة لأي نص وقت بنظام 12 أو 24 ساعة (مع دعم الأرقام العربية والإنجليزية)
 * يدعم مثلاً: "3:00 م", "03:00 م", "2:00 ص", "02:00 ص", "15:00", "02:00", "3:00 PM", "2:00 AM"
 */
export function parseTimeString(
  timeStr: string,
  defaultHour: number = 15,
  defaultMinute: number = 0
): { hour: number; minute: number; totalMinutes: number } {
  if (!timeStr || typeof timeStr !== 'string') {
    return {
      hour: defaultHour,
      minute: defaultMinute,
      totalMinutes: defaultHour * 60 + defaultMinute,
    };
  }

  // تحويل الأرقام العربية المشرقية (٠-٩) إلى أرقام قياسية (0-9)
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let cleanStr = timeStr.trim();
  arabicNumerals.forEach((num, idx) => {
    cleanStr = cleanStr.split(num).join(idx.toString());
  });

  const normalized = cleanStr.toLowerCase();
  const isPM = normalized.includes('م') || normalized.includes('مساء') || normalized.includes('pm');
  const isAM = normalized.includes('ص') || normalized.includes('صباح') || normalized.includes('am');

  let hour = defaultHour;
  let minute = defaultMinute;

  // استخراج الساعة والدقيقة بنمط HH:MM أو HH.MM
  const matchWithMin = normalized.match(/(\d{1,2})[:.](\d{1,2})/);
  if (matchWithMin) {
    hour = parseInt(matchWithMin[1], 10);
    minute = parseInt(matchWithMin[2], 10);
  } else {
    const matchHourOnly = normalized.match(/\d{1,2}/);
    if (matchHourOnly) {
      hour = parseInt(matchHourOnly[0], 10);
      minute = 0;
    }
  }

  // التحويل من نظام 12 ساعة إلى نظام 24 ساعة
  if (isPM && hour < 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }

  // ضبط الحدود
  hour = Math.max(0, Math.min(23, hour));
  minute = Math.max(0, Math.min(59, minute));

  return {
    hour,
    minute,
    totalMinutes: hour * 60 + minute,
  };
}

function formatHoursArabic(h: number): string {
  if (h === 1) return 'ساعة واحدة';
  if (h === 2) return 'ساعتين';
  if (h >= 3 && h <= 10) return `${h} ساعات`;
  return `${h} ساعة`;
}

function formatMinutesArabic(m: number): string {
  if (m === 1) return 'دقيقة واحدة';
  if (m === 2) return 'دقيقتين';
  if (m >= 3 && m <= 10) return `${m} دقائق`;
  return `${m} دقيقة`;
}

/**
 * حساب حالة الصالون (مفتوح / مغلق) والعد التنازلي بدقة تامة
 * مع المعالجة الكاملة لدوام منتصف الليل (Overnight Hours Spanning Across Midnight)
 * عندما يكون startTime (مثلاً 15:00 / 3:00 م) أكبر من endTime (مثلاً 02:00 / 2:00 ص اليوم التالي)
 */
export function getShopStatus(
  overrideMode: 'auto' | 'open' | 'closed' = 'auto',
  customOpenTime: string = '3:00 م',
  customCloseTime: string = '2:00 ص',
  date: Date = new Date()
): ShopStatusResult {
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentMinutes = currentHour * 60 + currentMinute;

  // تحليل أوقات الفتح والإغلاق
  const openParsed = parseTimeString(customOpenTime, 15, 0); // الافتراضي 3:00 م (15:00)
  const closeParsed = parseTimeString(customCloseTime, 2, 0); // الافتراضي 2:00 ص (02:00)

  const startMinutes = openParsed.totalMinutes;
  const endMinutes = closeParsed.totalMinutes;

  // دوام يمتد عبر منتصف الليل (Overnight Schedule)
  // مثال: من 15:00 إلى 02:00 (حيث 900 > 120)
  const isOvernight = startMinutes > endMinutes;

  // 1. حساب هل المحل مفتوح الآن
  let isOpen = false;
  if (overrideMode === 'open') {
    isOpen = true;
  } else if (overrideMode === 'closed') {
    isOpen = false;
  } else {
    // في الدوام الليلي (Overnight):
    // المحل مفتوح إذا كان الوقت الحالي: (currentTime >= startTime) OR (currentTime < endTime)
    // وفي الدوام النهاري المعتاد:
    // المحل مفتوح إذا كان: (currentTime >= startTime) AND (currentTime < endTime)
    isOpen = isOvernight
      ? (currentMinutes >= startMinutes || currentMinutes < endMinutes)
      : (currentMinutes >= startMinutes && currentMinutes < endMinutes);
  }

  // 2. حساب الهدف القادم ديناميكياً (Target Date):
  // إذا كان مفتوحاً: الهدف هو لحظة الإغلاق القادمة
  // إذا كان مغلقاً: الهدف هو لحظة الافتتاح القادمة
  const targetDate = new Date(date);
  targetDate.setSeconds(0, 0);
  targetDate.setMilliseconds(0);

  const targetAction: 'open' | 'close' = isOpen ? 'close' : 'open';

  if (isOpen) {
    targetDate.setHours(closeParsed.hour, closeParsed.minute, 0, 0);
    if (isOvernight && currentMinutes >= startMinutes) {
      // إذا كنا في دوام ليلي والوقت الحالي بعد وقت الفتح (مثلاً الساعة 20:00)، فإن موعد الإغلاق يقع غداً في 02:00 ص
      targetDate.setDate(targetDate.getDate() + 1);
    }
  } else {
    // المحل مغلق: نحدد موعد الافتتاح القادم
    targetDate.setHours(openParsed.hour, openParsed.minute, 0, 0);
    if (isOvernight) {
      // في الدوام الليلي (مثلاً 15:00 إلى 02:00):
      // عندما يكون المحل مغلقاً، فالوقت يقع بين 02:00 و 15:00.
      // وبالتالي موعد الافتتاح القادم يقع في نفس اليوم في تمام الساعة 15:00!
      if (currentMinutes >= startMinutes) {
        // حالة استثنائية (مثلاً إذا أُغلق المحل يدوياً بعد 15:00)، الافتتاح غداً
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else {
      // دوام نهاري معتاد: إذا فات وقت الإغلاق، فالافتتاح يقع غداً
      if (currentMinutes >= endMinutes) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    }
  }

  // 3. حساب الفارق الزمني الحقيقي والعد التنازلي بالثواني والدقائق والساعات
  const diffMs = Math.max(0, targetDate.getTime() - date.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formattedCountdown = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  // 4. تنسيق الوقت الحالي بنظام 12 ساعة مع AM/PM عربي
  const hour12 = currentHour % 12 || 12;
  const period = currentHour >= 12 ? 'مساءً' : 'صباحاً';
  const minPad = currentMinute.toString().padStart(2, '0');
  const currentTimeFormatted = `${hour12}:${minPad} ${period}`;

  const formattedWorkingHours = `يومياً: ${customOpenTime} - ${customCloseTime}`;

  // 5. صياغة النصوص الموجهة للزبائن
  let statusText = '';
  let subText = '';

  if (overrideMode === 'open') {
    statusText = 'المحل مفتوح الآن';
    subText = `مفتوح بقرار استثنائي من الإدارة (${formattedWorkingHours})`;
  } else if (overrideMode === 'closed') {
    statusText = 'المحل مغلق مؤقتاً';
    subText = 'المحل غير متاح حالياً لاستقبال الزبائن، وسنعاود الافتتاح قريباً';
  } else if (isOpen) {
    statusText = 'المحل مفتوح الآن';
    if (hours === 0 && minutes <= 60 && minutes > 0) {
      subText = `يغلق قريباً خلال ${formatMinutesArabic(minutes)} (الساعة ${customCloseTime})`;
    } else {
      const parts = [];
      if (hours > 0) parts.push(formatHoursArabic(hours));
      if (minutes > 0 || hours === 0) parts.push(formatMinutesArabic(minutes));
      subText = `نستقبلكم ونسعد بخدمتكم حتى الساعة ${customCloseTime} (متبقي ${parts.join(' و ')})`;
    }
  } else {
    statusText = 'المحل مغلق حالياً';
    const isToday = targetDate.getDate() === date.getDate();
    const dayWord = isToday ? 'اليوم' : 'غداً';
    
    const parts = [];
    if (hours > 0) parts.push(formatHoursArabic(hours));
    if (minutes > 0 || hours === 0) parts.push(formatMinutesArabic(minutes));
    const timeRemainingStr = parts.join(' و ');

    subText = `يفتح أبوابه ${dayWord} في تمام الساعة ${customOpenTime} (المتبقي للافتتاح: ${timeRemainingStr})`;
  }

  return {
    isOpen,
    statusText,
    subText,
    currentTimeFormatted,
    openingHoursLabel: formattedWorkingHours,
    closesAtLabel: customCloseTime,
    mode: overrideMode,
    isOvernight,
    countdown: {
      hours,
      minutes,
      seconds,
      totalSeconds,
      formatted: formattedCountdown,
    },
    targetDateIso: targetDate.toISOString(),
    targetAction,
  };
}
