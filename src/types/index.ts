export interface BarberService {
  id: string;
  name: string;
  price: number;
  priceFormatted: string;
  description?: string;
  note?: string;
  category: 'cleaning' | 'haircut' | 'beard';
  durationMinutes: number;
  image?: string;
  imageUrl?: string;
  highlighted?: boolean;
}

export type BookingStatus = 'pending' | 'accepted' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export interface BookingSubmission {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  date: string;
  timeSlot: string;
  notes?: string;
  createdAt: string;
  status: BookingStatus;
}

export type DayKey = 'today' | 'tomorrow' | 'after_tomorrow';

export interface DayTimeSlot {
  id: string;
  dayKey?: DayKey;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  isAvailable: boolean;
  bookedCustomerName?: string;
  bookedBookingId?: string;
  isCustomAdded?: boolean;
}

export type DayTimeSlotsMap = Record<DayKey, DayTimeSlot[]>;

export interface TimeSlot {
  id: string;
  timeLabel: string;
  period: 'morning' | 'afternoon' | 'evening';
  isAvailable: boolean;
}

export interface ShopHours {
  openHour: number;
  openMinute: number;
  closeHour: number;
  closeMinute: number;
}

export interface DaySchedule {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  note: string;
}

export interface SalonStatsHighlights {
  experienceYearsValue: string;
  experienceYearsLabel: string;
  sterilizationPercentValue: string;
  sterilizationPercentLabel: string;
}

export interface WorkingHoursConfig {
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  updatedAt?: string;
}

export interface SalonSettings {
  salonName: string;
  // Hero / Brand Section
  welcomeTitle: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroBadge: string;
  heroImageUrl: string;
  // Timing & Manual Status
  manualShopStatus: 'auto' | 'open' | 'closed';
  openTime: string;
  closeTime: string;
  slotDurationMinutes?: number;
  workingHours?: WorkingHoursConfig;
  // Contact & Social & Location
  phone: string;
  whatsapp: string;
  location: string;
  googleMapsUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
  // About Us Section
  aboutTitle: string;
  aboutSubtitle: string;
  aboutDescription: string;
  aboutDescriptionSecondary: string;
  aboutImageUrl: string;
  aboutExperienceYears: string;
  aboutMasterBarberName: string;
  // Schedules & Stats
  weeklySchedule?: DaySchedule[];
  statsHighlights?: SalonStatsHighlights;
}

export interface ManagerAccount {
  username: string;
  passwordHash: string;
  setupDate: string;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  bookingId?: string;
  timestamp: string;
  read: boolean;
}

export interface ServiceRatingInfo {
  totalScore: number;
  count: number;
  average: number;
  userRating?: number;
}

export type ServiceRatingsMap = Record<string, ServiceRatingInfo>;

export interface ServiceRatingEntry {
  id: string;
  serviceId: string;
  serviceName: string;
  stars: number;
  authorName?: string;
  comment?: string;
  timestamp: string;
  createdAt: string;
}

export interface SalonAnnouncement {
  id: string;
  title: string;
  content: string;
  type: 'alert' | 'info' | 'offer' | 'closure';
  timestamp: string;
  createdAt: string;
  isActive: boolean;
}

export type AdminRole = 'owner' | 'superadmin' | 'moderator';

export interface AdminUser {
  id: string;
  username: string;
  passwordPlain: string;
  role: AdminRole;
  displayName: string;
  createdAt: string;
  isOwner?: boolean;
}


