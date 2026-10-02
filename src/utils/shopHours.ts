export interface ShopStatusResult {
  isOpen: boolean;
  statusText: string;
  subText: string;
  currentTimeFormatted: string;
  openingHoursLabel: string;
  closesAtLabel: string;
  mode: 'auto' | 'open' | 'closed';
}

// Default baseline hours: 10:00 AM to 11:30 PM
export const SHOP_HOURS = {
  openHour: 10,
  openMinute: 0,
  closeHour: 23,
  closeMinute: 30,
};

export function getShopStatus(
  overrideMode: 'auto' | 'open' | 'closed' = 'auto',
  customOpenTime: string = '10:00 ص',
  customCloseTime: string = '11:30 م',
  date: Date = new Date()
): ShopStatusResult {
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const totalCurrentMinutes = currentHour * 60 + currentMinute;

  const totalOpenMinutes = SHOP_HOURS.openHour * 60 + SHOP_HOURS.openMinute;
  const totalCloseMinutes = SHOP_HOURS.closeHour * 60 + SHOP_HOURS.closeMinute;

  // Format current time in 12-hour format with Arabic AM/PM
  const hour12 = currentHour % 12 || 12;
  const period = currentHour >= 12 ? 'مساءً' : 'صباحاً';
  const minPad = currentMinute.toString().padStart(2, '0');
  const currentTimeFormatted = `${hour12}:${minPad} ${period}`;

  const formattedWorkingHours = `يومياً: ${customOpenTime} - ${customCloseTime}`;

  // Check manual override mode from control panel
  if (overrideMode === 'open') {
    return {
      isOpen: true,
      statusText: 'المحل مفتوح الآن',
      subText: `نستقبلكم ونسعد بخدمتكم في صالون عبود (${formattedWorkingHours})`,
      currentTimeFormatted,
      openingHoursLabel: formattedWorkingHours,
      closesAtLabel: customCloseTime,
      mode: 'open',
    };
  }

  if (overrideMode === 'closed') {
    return {
      isOpen: false,
      statusText: 'المحل مغلق مؤقتاً',
      subText: 'المحل غير متاح حالياً لاستقبال الزبائن، وسنعاود الافتتاح قريباً',
      currentTimeFormatted,
      openingHoursLabel: formattedWorkingHours,
      closesAtLabel: customCloseTime,
      mode: 'closed',
    };
  }

  // Auto calculate based on current time
  const isOpen = totalCurrentMinutes >= totalOpenMinutes && totalCurrentMinutes < totalCloseMinutes;
  let statusText = '';
  let subText = '';

  if (isOpen) {
    statusText = 'المحل مفتوح الآن';
    const minutesLeft = totalCloseMinutes - totalCurrentMinutes;
    if (minutesLeft <= 60 && minutesLeft > 0) {
      subText = `يغلق قريباً خلال ${minutesLeft} دقيقة (الساعة ${customCloseTime})`;
    } else {
      subText = `نستقبلكم ونسعد بخدمتكم حتى الساعة ${customCloseTime}`;
    }
  } else {
    statusText = 'المحل مغلق حالياً';
    if (totalCurrentMinutes < totalOpenMinutes) {
      const minutesUntilOpen = totalOpenMinutes - totalCurrentMinutes;
      const hoursUntilOpen = Math.floor(minutesUntilOpen / 60);
      const remainingMins = minutesUntilOpen % 60;
      subText = `يفتح أبوابه اليوم في تمام الساعة ${customOpenTime} (بعد ${hoursUntilOpen > 0 ? `${hoursUntilOpen} ساعة و ` : ''}${remainingMins} دقيقة)`;
    } else {
      subText = `ينتهي دوام اليوم، نتشرف باستقبالكم غداً الساعة ${customOpenTime}`;
    }
  }

  return {
    isOpen,
    statusText,
    subText,
    currentTimeFormatted,
    openingHoursLabel: formattedWorkingHours,
    closesAtLabel: customCloseTime,
    mode: 'auto',
  };
}
