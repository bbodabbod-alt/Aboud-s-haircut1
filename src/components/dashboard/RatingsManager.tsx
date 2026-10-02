import { useState } from 'react';
import { ServiceRatingEntry, BarberService, ServiceRatingsMap } from '../../types';
import { deleteCustomerRating } from '../../utils/salonStore';
import { 
  Star, Trash2, Sparkles, TrendingUp, ThumbsUp, AlertCircle, 
  MessageSquareQuote, Clock, Calendar, User, Filter
} from 'lucide-react';

interface RatingsManagerProps {
  ratings: ServiceRatingEntry[];
  services: BarberService[];
  ratingsSummary: ServiceRatingsMap;
  onRatingsUpdated: () => void;
}

export default function RatingsManager({
  ratings,
  services,
  ratingsSummary,
  onRatingsUpdated,
}: RatingsManagerProps) {
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [onlyWithComments, setOnlyWithComments] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Filter individual ratings
  const filteredRatings = ratings.filter((r) => {
    const matchesService = selectedServiceFilter === 'all' || r.serviceId === selectedServiceFilter;
    const matchesComment = !onlyWithComments || (r.comment && r.comment.trim().length > 0);
    return matchesService && matchesComment;
  });

  // Overall Statistics Calculation
  const totalReviewsCount = ratings.length;
  const reviewsWithCommentsCount = ratings.filter((r) => r.comment && r.comment.trim().length > 0).length;
  const overallTotalScore = ratings.reduce((sum, r) => sum + r.stars, 0);
  const overallAverage = totalReviewsCount > 0 
    ? (Math.round((overallTotalScore / totalReviewsCount) * 10) / 10).toFixed(1) 
    : '0.0';

  // Find top-rated service with at least 1 rating
  const getTopRatedService = (): { name: string; avg: number; count: number } | null => {
    let top: { name: string; avg: number; count: number } | null = null;
    services.forEach((s) => {
      const summary = ratingsSummary[s.id];
      if (summary && summary.count > 0) {
        if (!top || summary.average > top.avg) {
          top = { name: s.name, avg: summary.average, count: summary.count };
        }
      }
    });
    return top;
  };

  const topRatedService = getTopRatedService();

  const handleDelete = (ratingId: string, serviceName: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف هذا التقييم لخدمة "${serviceName}"؟`)) {
      deleteCustomerRating(ratingId);
      onRatingsUpdated();
      setFeedbackMessage('تم حذف التقييم وإعادة احتساب المتوسط بنجاح');
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <span>تقييمات الخدمات وآراء الزبائن</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            قراءة آراء الزبائن، نصائحهم للحلاق، ومتابعة معدل الرضا الفعلي لكل خدمة.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setOnlyWithComments(!onlyWithComments)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
              onlyWithComments
                ? 'bg-amber-500 text-neutral-950 border-amber-400 font-bold'
                : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>آراء مكتوبة فقط ({reviewsWithCommentsCount})</span>
          </button>

          <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="bg-transparent text-neutral-200 text-xs py-1 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-neutral-900">جميع الخدمات ({ratings.length})</option>
              {services.map((s) => {
                const count = ratingsSummary[s.id]?.count || 0;
                return (
                  <option key={s.id} value={s.id} className="bg-neutral-900">
                    {s.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-in fade-in">
          <ThumbsUp className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Ratings Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121620] border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>إجمالي التقييمات الحقيقية</span>
            <MessageSquareQuote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {totalReviewsCount}
          </div>
          <p className="text-[11px] text-neutral-500">
            منها {reviewsWithCommentsCount} تتضمن آراء ونصائح مكتوبة
          </p>
        </div>

        {/* Overall Average Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121620] border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>متوسط التقييم العام</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {overallAverage}
            </span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${
                    s <= Math.round(Number(overallAverage))
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-[11px] text-neutral-500">
            محسوب من 5 نجوم لكافة خدمات الصالون
          </p>
        </div>

        {/* Top Rated Service */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121620] border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>الخدمة الأعلى تقييماً</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white truncate">
            {topRatedService ? topRatedService.name : 'لا يوجد تقييمات بعد'}
          </div>
          <p className="text-[11px] text-amber-400 font-mono font-medium">
            {topRatedService ? `${topRatedService.avg.toFixed(1)} / 5 (${topRatedService.count} تقييم)` : 'في انتظار أول تقييم'}
          </p>
        </div>

      </div>

      {/* Services Performance Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-3 border-b border-neutral-800">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>متوسط تقييم كل خدمة في الصالون (Service Averages)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service) => {
            const summary = ratingsSummary[service.id] || { totalScore: 0, count: 0, average: 0 };
            const hasReviews = summary.count > 0;

            return (
              <div
                key={service.id}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">
                    {service.name}
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-amber-400">
                      {hasReviews ? `${summary.average.toFixed(1)} / 5` : 'بدون تقييم'}
                    </span>
                    <span className="text-[10px] text-neutral-500">
                      ({summary.count} تقييم)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-3 h-3 ${
                        hasReviews && star <= Math.round(summary.average)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-neutral-700'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual Customer Ratings & Opinions Log (Requirement #2) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              سجل آراء وتقييمات الزبائن ({filteredRatings.length})
            </h3>
          </div>
          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            تظهر آراء الزبائن المكتوبة هنا لقراءتها والاستفادة من نصائحهم
          </span>
        </div>

        {filteredRatings.length === 0 ? (
          <div className="p-10 text-center text-neutral-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-neutral-600" />
            <p className="text-xs font-semibold text-neutral-300">
              لا توجد تقييمات مطابقة لخيارات التصفية
            </p>
            <p className="text-[11px] text-neutral-500 max-w-md mx-auto leading-relaxed">
              عندما يرسل الزبون تقييماً أو يكتب رأياً ونصيحة من الموقع الرئيسي، ستظهر رسالته هنا مباشرة ومفصلة.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRatings.map((rating) => (
              <div
                key={rating.id}
                className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-all space-y-3"
              >
                {/* Top Row: Service name, Stars, Author, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-black text-white bg-neutral-800 px-2.5 py-1 rounded-lg">
                      {rating.serviceName}
                    </span>

                    {/* Stars */}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rating.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-neutral-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        ({rating.stars}/5)
                      </span>
                    </div>

                    {/* Author */}
                    {rating.authorName && (
                      <span className="text-xs text-neutral-300 flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-neutral-500" />
                        <span>الزبون: {rating.authorName}</span>
                      </span>
                    )}
                  </div>

                  {/* Timing & Delete Action */}
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {rating.createdAt}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {rating.timestamp}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(rating.id, rating.serviceName)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="حذف هذا التقييم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prominent Customer Opinion / Advice Box (Requirement #2) */}
                {rating.comment ? (
                  <div className="p-3.5 rounded-xl bg-[#151a24] border-r-4 border-amber-400 border-t border-b border-l border-neutral-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                      <MessageSquareQuote className="w-3.5 h-3.5" />
                      <span>رأي الزبون / نصيحة للحلاق:</span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-sans pr-1">
                      "{rating.comment}"
                    </p>
                  </div>
                ) : (
                  <div className="text-[11px] text-neutral-500 italic">
                    تقييم سريع بالنجوم بدون تعليق مكتوب.
                  </div>
                )}

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
