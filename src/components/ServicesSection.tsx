import { useState, useMemo } from 'react';
import { BarberService, ServiceRatingsMap } from '../types';
import { SERVICES as DEFAULT_SERVICES } from '../data/services';
import { Sparkles, Calendar, AlertCircle, Check, Star, MessageSquare, Send, ThumbsUp } from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (service: BarberService) => void;
  services?: BarberService[];
  ratings?: ServiceRatingsMap;
  onRateService?: (
    serviceId: string, 
    rating: number, 
    serviceName?: string, 
    comment?: string, 
    authorName?: string
  ) => void;
}

// Fallback صور بديلة فائقة الدقة والجمال عند غياب رابط الصورة أو انكساره
export const DEFAULT_SERVICE_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80';

export const getCategoryFallbackImage = (category?: string): string => {
  switch (category) {
    case 'cleaning':
      return 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80';
    case 'beard':
      return 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80';
    case 'haircut':
    default:
      return 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80';
  }
};

export default function ServicesSection({
  onSelectService,
  services = DEFAULT_SERVICES,
  ratings = {},
  onRateService,
}: ServicesSectionProps) {
  const [filter, setFilter] = useState<'all' | 'cleaning' | 'haircut' | 'beard'>('all');
  const [hoveredRating, setHoveredRating] = useState<{ [serviceId: string]: number }>({});
  
  // Rating Form States per Service
  const [activeRatingServiceId, setActiveRatingServiceId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState<{ [serviceId: string]: number }>({});
  const [commentText, setCommentText] = useState<{ [serviceId: string]: string }>({});
  const [authorNameText, setAuthorNameText] = useState<{ [serviceId: string]: string }>({});
  const [justRatedId, setJustRatedId] = useState<string | null>(null);

  const availableServices = services && services.length > 0 ? services : DEFAULT_SERVICES;

  // 1. ترتيب الخدمات تنازلياً حسب السعر (من الأعلى سعراً إلى الأقل سعراً - From Highest to Lowest Price)
  const sortedServices = useMemo(() => {
    return [...availableServices].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  }, [availableServices]);

  // 2. تصفية الخدمات حسب التبويب المحدد
  const filteredServices = useMemo(() => {
    if (filter === 'all') return sortedServices;
    return sortedServices.filter((s) => s.category === filter);
  }, [sortedServices, filter]);

  // When a customer clicks on a star
  const handleStarSelect = (service: BarberService, starIndex: number) => {
    setSelectedStars((prev) => ({ ...prev, [service.id]: starIndex }));
    setActiveRatingServiceId(service.id);
  };

  // Submit Rating with Opinion / Comment (Requirement #1)
  const handleSubmitRatingWithOpinion = (service: BarberService) => {
    const stars = selectedStars[service.id] || 5;
    const comment = commentText[service.id] || '';
    const author = authorNameText[service.id] || '';

    if (onRateService) {
      onRateService(service.id, stars, service.name, comment, author);
      setJustRatedId(service.id);
      setActiveRatingServiceId(null);
      // Clear form for this service
      setCommentText((prev) => ({ ...prev, [service.id]: '' }));
      setAuthorNameText((prev) => ({ ...prev, [service.id]: '' }));

      setTimeout(() => setJustRatedId(null), 3500);
    }
  };

  return (
    <section id="services" className="py-20 bg-[#0c0e12] border-t border-neutral-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>قائمة الأسعار والخدمات المتاحة (مرتبة حسب السعر)</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              العروض والخدمات المتميزة
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base max-w-xl">
              اختر الخدمة المناسبة لك واضغط على زر <span className="text-amber-400 font-semibold">"احجز هنا"</span> لتأكيد موعدك، كما يمكنك تقييم الخدمة وكتابة رأيك أو نصائحك للحلاق.
            </p>
          </div>

          {/* Interactive Category Filter Tabs */}
          <div className="inline-flex p-1 bg-neutral-900 border border-neutral-800 rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              جميع الخدمات ({sortedServices.length})
            </button>
            <button
              onClick={() => setFilter('cleaning')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'cleaning'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              عروض التنظيف
            </button>
            <button
              onClick={() => setFilter('haircut')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'haircut'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              قص وتحديد
            </button>
            <button
              onClick={() => setFilter('beard')}
              className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'beard'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              عناية اللحية
            </button>
          </div>
        </div>

        {/* Services Cards Grid (Ordered Highest to Lowest Price) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => {
            const isDeepClean = service.id === 'deep-cleanse';
            const isHaircut = service.id === 'haircut-only';

            // Real Rating calculations (100% genuine data)
            const ratingData = ratings[service.id] || { totalScore: 0, count: 0, average: 0 };
            const currentHover = hoveredRating[service.id] || 0;
            const currentFormStars = selectedStars[service.id] || (ratingData.count > 0 ? Math.round(ratingData.average) : 5);
            const isFormOpen = activeRatingServiceId === service.id;
            const hasReviews = ratingData.count > 0;

            // 2. التحقق من رابط الصورة مع دعم service.image و service.imageUrl وجميع التسميات البديلة
            const fallbackImg = getCategoryFallbackImage(service.category);
            const rawImageSrc = (
              service.image || 
              service.imageUrl || 
              (service as any).img || 
              (service as any).photo || 
              (service as any).picture || 
              (service as any).url || 
              ''
            ).trim();
            const displayImageSrc = rawImageSrc || fallbackImg;

            return (
              <div
                key={service.id}
                className={`relative rounded-2xl bg-neutral-900/90 border transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60 ${
                  isDeepClean
                    ? 'border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Visual Thumbnail مع دعم Fallback Image عند الروابط الفارغة أو المكسورة */}
                <div className="relative h-48 w-full overflow-hidden bg-neutral-950 border-b border-neutral-800/80">
                  <img
                    src={displayImageSrc}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      // Fallback تلقائي لمنع ظهور روابط مكسورة
                      const target = e.currentTarget;
                      if (target.src !== fallbackImg) {
                        target.src = fallbackImg;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/30 to-transparent" />
                  
                  {/* Top Tag */}
                  <div className="absolute top-3 right-3">
                    {isDeepClean && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-neutral-950 shadow-md">
                        <Sparkles className="w-3 h-3" />
                        العرض الأكثر طلباً
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Header: Title and Price */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors">
                        {service.name}
                      </h3>
                      <div className="text-left shrink-0">
                        <span className="text-2xl font-extrabold text-amber-400 font-mono tabular-nums">
                          {service.price.toLocaleString('en-US')}
                        </span>
                        <span className="text-xs text-neutral-400 block -mt-1 font-sans">
                          د.ع
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-neutral-300 text-sm mt-3 leading-relaxed">
                        {service.description}
                      </p>
                    )}

                    {/* Special Note */}
                    {service.note && (
                      <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs font-semibold text-amber-200 leading-normal">
                          ملاحظة: {service.note}
                        </p>
                      </div>
                    )}

                    {/* Extra Features Points */}
                    <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-1.5">
                      {isDeepClean && (
                        <>
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>أجهزة بخار وتقشير مسام عميق</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-400">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>نظافة عامة وتعقيم فائق</span>
                          </div>
                        </>
                      )}
                      {service.id === 'beard-fade' && (
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>نضارة وتغذية لبشرة الوجه</span>
                        </div>
                      )}
                      {isHaircut && (
                        <div className="flex items-center gap-2 text-xs text-neutral-400">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>غسيل الشعر وتصفيف سشوار</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 5-Star Interactive Rating & Feedback System (Requirement #1) */}
                  <div className="pt-3 border-t border-neutral-800/80">
                    <div className="p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                          <span>تقييم الزبائن:</span>
                        </span>

                        <div className="flex items-center gap-1.5">
                          {hasReviews ? (
                            <>
                              <span className="text-xs font-extrabold text-amber-400 font-mono">
                                {ratingData.average.toFixed(1)} / 5
                              </span>
                              <span className="text-[10px] text-neutral-500 font-sans">
                                ({ratingData.count} تقييم)
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] text-amber-400/80 font-medium">
                              جديد (كن أول من يقيّم!)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Interactive Stars Row */}
                      <div className="flex items-center justify-between pt-0.5">
                        <div 
                          className="flex items-center gap-1"
                          onMouseLeave={() => setHoveredRating((prev) => ({ ...prev, [service.id]: 0 }))}
                        >
                          {[1, 2, 3, 4, 5].map((starNum) => {
                            const isFilled = currentHover 
                              ? starNum <= currentHover 
                              : isFormOpen 
                              ? starNum <= currentFormStars
                              : starNum <= Math.round(ratingData.average);

                            return (
                              <button
                                key={starNum}
                                type="button"
                                onClick={() => handleStarSelect(service, starNum)}
                                onMouseEnter={() => setHoveredRating((prev) => ({ ...prev, [service.id]: starNum }))}
                                className="p-0.5 transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                                title={`اختر ${starNum} من 5 نجوم`}
                                aria-label={`تقييم ${starNum} من 5`}
                              >
                                <Star
                                  className={`w-4 h-4 transition-colors ${
                                    isFilled
                                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                                      : 'text-neutral-700 hover:text-amber-300'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Button to toggle feedback form */}
                        <div className="text-[10px]">
                          {justRatedId === service.id ? (
                            <span className="text-emerald-400 font-bold animate-in fade-in flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              <span>شكراً لتقييمك ورأيك! ✓</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (isFormOpen) {
                                  setActiveRatingServiceId(null);
                                } else {
                                  setSelectedStars((prev) => ({ ...prev, [service.id]: prev[service.id] || 5 }));
                                  setActiveRatingServiceId(service.id);
                                }
                              }}
                              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 font-medium"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>{isFormOpen ? 'إلغاء' : 'اكتب رأيك'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Textarea & Opinion Form (Requirement #1) */}
                      {isFormOpen && (
                        <div className="pt-2 border-t border-neutral-800 space-y-2.5 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-[11px] text-amber-300">
                            <span>التقييم المحدد: <strong>{currentFormStars} من 5 نجوم</strong></span>
                            <span className="text-neutral-400 text-[10px]">شارك الحلاق انطباعك</span>
                          </div>

                          {/* Optional Name */}
                          <input
                            type="text"
                            value={authorNameText[service.id] || ''}
                            onChange={(e) => setAuthorNameText((prev) => ({ ...prev, [service.id]: e.target.value }))}
                            placeholder="اسمك الكريم (اختياري)..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                          />

                          {/* Textarea for customer personal opinion and tips (Requirement #1) */}
                          <textarea
                            rows={3}
                            value={commentText[service.id] || ''}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [service.id]: e.target.value }))}
                            placeholder="اكتب رأيك الشخصي في الحلاقة أو أي نصائح تود توجيهها للحلاق عبود..."
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
                          />

                          {/* Action Buttons: "إرسال التقييم والرأي" */}
                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveRatingServiceId(null)}
                              className="px-3 py-1.5 text-[11px] text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            >
                              إلغاء
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSubmitRatingWithOpinion(service)}
                              className="px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                              <Send className="w-3 h-3 rotate-180" />
                              <span>إرسال التقييم والرأي</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Card Action Button (زر "احجز هنا") */}
                  <div className="pt-2 border-t border-neutral-800/60">
                    <button
                      onClick={() => onSelectService(service)}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                        isDeepClean
                          ? 'bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-md shadow-amber-500/20 active:scale-98'
                          : 'bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-neutral-100 border border-neutral-700/80 hover:border-amber-400 active:scale-98'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span>احجز هنا</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
