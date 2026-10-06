import { useState, useEffect } from 'react';
import { BookingSubmission, BookingStatus } from '../../types';
import { updateBookingStatus, deleteBooking } from '../../utils/salonStore';
import { completeBooking } from '../../utils/bookingApi';
import { updateBookingStatusInFirebase, deleteBookingFromFirebase } from '../../utils/firebaseBookingService';
import { 
  Calendar, Clock, User, Phone, CheckCircle, XCircle, 
  CheckCheck, AlertCircle, Search, ExternalLink, Trash2, Filter
} from 'lucide-react';

interface BookingsManagerProps {
  bookings: BookingSubmission[];
  onBookingsUpdated: () => void;
}

export default function BookingsManager({ bookings, onBookingsUpdated }: BookingsManagerProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBookings, setCurrentBookings] = useState<BookingSubmission[]>(bookings);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync with prop updates from Firebase onValue
  useEffect(() => {
    setCurrentBookings(bookings);
  }, [bookings]);

  // Handle status update (Firebase & Local real-time sync for isolated bookingId)
  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    const cleanId = String(bookingId || '').trim();
    if (!cleanId || cleanId === 'bookings') return;

    // 1. تحديث الحالة فوراً وبشكل سلس في الواجهة لنقل الحجز مباشرة إلى التبويب المقابل بدون ريفريش
    setCurrentBookings((prev) =>
      prev.map((b) => (b.id === cleanId ? { ...b, status: newStatus } : b))
    );

    const target = currentBookings.find((b) => b.id === cleanId) || bookings.find((b) => b.id === cleanId);

    // 2. تحديث الحالة محلياً في LocalStorage
    updateBookingStatus(cleanId, newStatus);

    // 3. تحديث حالة الحجز المحدد فقط بنفس المعرف bookingId في Firebase Realtime Database
    try {
      if (newStatus === 'completed' && target) {
        await completeBooking(target);
      } else {
        await updateBookingStatusInFirebase(cleanId, newStatus, target);
      }
    } catch (err) {
      console.error(`Error updating status for booking ${cleanId}:`, err);
    }

    onBookingsUpdated();
  };

  // حذف الحجز المحدد فقط من Firebase Realtime Database
  const handleConfirmDelete = async (bookingId: string) => {
    const cleanId = String(bookingId || '').trim();
    if (!cleanId || cleanId === 'bookings') return;

    const target = currentBookings.find((b) => b.id === cleanId) || bookings.find((b) => b.id === cleanId);

    // 1. إزالة الحجز فوراً من الواجهة المحلية
    setCurrentBookings((prev) => prev.filter((b) => b.id !== cleanId));
    setDeleteConfirmId(null);

    // 2. استدعاء دالة الحذف على المسار المخصص للـ ID المحدد فقط:
    // ref(database, `bookings/${selectedBookingId}`)
    // وتجنب مسح أي حجز آخر إطلاقاً
    try {
      await deleteBookingFromFirebase(cleanId, target);
    } catch (err) {
      console.error(`Error deleting booking ${cleanId} from Firebase:`, err);
    }

    // 3. حذف الحجز من LocalStorage
    deleteBooking(cleanId);

    onBookingsUpdated();
  };

  // Filter and search using currentBookings state
  const pendingCount = currentBookings.filter((b) => b.status === 'pending').length;
  const acceptedCount = currentBookings.filter((b) => b.status === 'accepted' || b.status === 'approved').length;
  const completedCount = currentBookings.filter((b) => b.status === 'completed').length;
  const rejectedCount = currentBookings.filter((b) => b.status === 'rejected').length;

  const filteredBookings = currentBookings.filter((b) => {
    let matchesFilter = true;
    if (filter === 'pending') {
      matchesFilter = b.status === 'pending';
    } else if (filter === 'accepted') {
      matchesFilter = b.status === 'accepted' || b.status === 'approved';
    } else if (filter === 'completed') {
      matchesFilter = b.status === 'completed';
    } else if (filter === 'rejected') {
      matchesFilter = b.status === 'rejected';
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      b.customerName.toLowerCase().includes(q) ||
      b.customerPhone.includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.serviceName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد الانتظار</span>
          </span>
        );
      case 'accepted':
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>تم القبول</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>مرفوض</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <CheckCheck className="w-3.5 h-3.5" />
            <span>تم الإنجاز</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-800 text-neutral-400 border border-neutral-700">
            <span>ملغي من الزبون</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>استقبال وإدارة الحجوزات</span>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
              {currentBookings.length} موعد
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            استقبل حجوزات الزبائن الواردة من الموقع، واقبلها أو ارفضها أو أنجزها لتنعكس الحالة لديهم فوراً.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
            {pendingCount} قيد الانتظار
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
            {acceptedCount} مقبولة
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold">
            {completedCount} منجزة
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
            {rejectedCount} مرفوضة
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121620] border border-neutral-800">
        
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>الكل</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'all' ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {currentBookings.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-amber-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>قيد الانتظار</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'pending' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'accepted'
                ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>المقبولة</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'accepted' ? 'bg-neutral-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {acceptedCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'completed'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>المنجزة</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'completed' ? 'bg-neutral-950 text-sky-400' : 'bg-sky-500/20 text-sky-300'
            }`}>
              {completedCount}
            </span>
          </button>

          <button
            onClick={() => setFilter('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'rejected'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>المرفوضة</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              filter === 'rejected' ? 'bg-neutral-950 text-rose-400' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، أو الرمز..."
            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

      </div>

      {/* Bookings List Cards */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#121620] border border-neutral-800 space-y-3">
          <Calendar className="w-12 h-12 mx-auto text-neutral-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-white">لا توجد حجوزات مطابقة</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            لم يتم العثور على أي حجز وفق التصنيف أو البحث المحدد حالياً.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl bg-[#121620] border transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                b.status === 'pending'
                  ? 'border-amber-500/50 shadow-md shadow-amber-500/5'
                  : b.status === 'accepted' || b.status === 'approved'
                  ? 'border-emerald-500/30'
                  : b.status === 'completed'
                  ? 'border-sky-500/30'
                  : 'border-neutral-800 hover:border-neutral-700'
              }`}
            >
              {/* Left/Main Details */}
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(b.status)}

                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-lg border border-amber-400/20">
                    {b.bookingCode}
                  </span>

                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-neutral-400" />
                    <span>{b.customerName}</span>
                  </h3>

                  <span className="text-neutral-600 hidden sm:inline">·</span>

                  <a
                    href={`tel:${b.customerPhone}`}
                    dir="ltr"
                    className="text-xs text-neutral-300 hover:text-amber-400 flex items-center gap-1 font-mono transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{b.customerPhone}</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-neutral-300">
                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <span className="text-[11px] text-neutral-400 block">الخدمة:</span>
                    <strong className="text-amber-300 font-semibold">{b.serviceName}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <span className="text-[11px] text-neutral-400 block">الموعد والتوقيت:</span>
                    <strong className="text-white flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{b.date} - {b.timeSlot}</span>
                    </strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <span className="text-[11px] text-neutral-400 block">السعر:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{b.servicePrice.toLocaleString('en-US')} د.ع</strong>
                  </div>
                </div>

                {b.notes && (
                  <p className="text-xs text-neutral-400 bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800">
                    <span className="text-amber-400 font-semibold">ملاحظة الزبون: </span>
                    <span>{b.notes}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons Zone */}
              <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-800 shrink-0">
                
                {/* Decision Actions - Render strictly according to booking status */}
                <div className="flex items-center gap-2">
                  {/* 1. إذا كانت الحالة قيد الانتظار: إظهار زر قبول وزر رفض فقط */}
                  {b.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(b.id, 'accepted')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="قبول الحجز ونقله للمقبولة"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>قبول</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(b.id, 'rejected')}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="رفض الحجز ونقله للمرفوضة"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </>
                  )}

                  {/* 2. إذا كانت الحالة مقبولة: إخفاء أزرار القبول والرفض وإظهار زر تم الإنجاز فقط */}
                  {(b.status === 'accepted' || b.status === 'approved') && (
                    <button
                      onClick={() => handleStatusChange(b.id, 'completed')}
                      className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="تحديد الحجز كمنجز ونقله للمنجزة"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>تم الإنجاز</span>
                    </button>
                  )}

                  {/* 3. إذا كانت الحالة منجزة أو مرفوضة أو ملغية: لا تظهر أزرار الإجراءات إطلاقاً */}
                </div>

                {/* Secondary Actions & Safe Deletion Confirmation */}
                <div className="flex items-center gap-2">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `مرحباً أخي ${b.customerName} 💈\nبخصوص حجزك (${b.serviceName}) لموعد ${b.timeSlot} بتأريخ ${b.date}:\n` +
                      (b.status === 'accepted' || b.status === 'approved'
                        ? 'يسعدنا إبلاغك بأنه تم قبول وتأكيد حجزك، نتشرف بحضورك بالموعد المحدد!'
                        : b.status === 'completed'
                        ? 'شكراً لزيارتك لنا اليوم في الصالون! نتمنى أن تكون الخدمة نالت رضاك ونسعد بخدمتك دائماً.'
                        : b.status === 'rejected'
                        ? 'نعتذر منك لعدم إمكانية استقبال الحجز في هذا التوقيت، يرجى اختيار موعد آخر مناسب.'
                        : 'نحن نتواصل معك لتأكيد حجزك.')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>مراسلة واتساب</span>
                  </a>

                  {deleteConfirmId === b.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-950/90 border border-rose-600/50 p-1 rounded-xl animate-in fade-in">
                      <span className="text-[10px] text-rose-300 px-1 font-semibold">تأكيد الحذف؟</span>
                      <button
                        onClick={() => handleConfirmDelete(b.id)}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        نعم، احذف
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] cursor-pointer transition-colors"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(b.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="حذف هذا الموعد المحدد فقط"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
