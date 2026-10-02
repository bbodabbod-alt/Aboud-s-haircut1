import fallbackToolsImg from '../assets/images/barber_tools_1790806008904.jpg';
import fallbackFacialImg from '../assets/images/facial_cleansing_1790806021159.jpg';
import { Sparkles, ShieldCheck, HeartHandshake, Scissors } from 'lucide-react';
import { SalonStatsHighlights, SalonSettings } from '../types';
import { getStatsHighlights, DEFAULT_STATS_HIGHLIGHTS } from '../utils/salonStore';

interface AboutSectionProps {
  statsHighlights?: SalonStatsHighlights;
  settings?: SalonSettings;
}

export default function AboutSection({ statsHighlights, settings }: AboutSectionProps) {
  const currentStats = statsHighlights || getStatsHighlights() || DEFAULT_STATS_HIGHLIGHTS;

  // 100% Dynamic Content from Settings (LocalStorage)
  const title = settings?.aboutTitle || 'عن صالون حلاقة عبود';
  const subtitle = settings?.aboutSubtitle || 'لمسة احترافية تعتني بأدق التفاصيل لمظهرك';
  const description = settings?.aboutDescription || 
    'في صالون حلاقة عبود، لا تقتصر التجربة على مجرد قص الشعر أو اللحية؛ بل هي عناية رجالية متكاملة تشمل تقييم نوع الشعر، اختيار القَصة الأنسب لملامح وجهك، واستخدام أحدث أجهزة البخار والتقشير للعناية الفائقة بالبشرة.';
  const secondaryDescription = settings?.aboutDescriptionSecondary ||
    'فريقنا مؤلف من حلاقين محترفين شغوفين بمهنتهم، نحرص على تقديم خدمات VIP تتضمن تنظيف البشرة بأجهزة البخار والألتراسونيك، وسشوار احترافي، ومساج للرأس والوجه لتغادر الصالون بكامل انتعاشك وجاذبيتك.';
  
  const aboutImage = settings?.aboutImageUrl || fallbackToolsImg;
  const expYears = settings?.aboutExperienceYears || currentStats.experienceYearsValue || '10+';
  const captainName = settings?.aboutMasterBarberName || 'الكابتن عبود';

  return (
    <section id="about" className="py-20 bg-[#0c0e12] border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Photos Collage & Dynamic Stats Cards (Dynamic from LocalStorage) */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-lg">
                <img
                  src={aboutImage}
                  alt={title}
                  className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = fallbackToolsImg;
                  }}
                />
              </div>
              
              {/* بطاقة التعقيم الطبي - Dynamic from LocalStorage */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {currentStats.sterilizationPercentValue || '100%'}
                </p>
                <p className="text-xs text-neutral-400 mt-1 leading-normal">
                  {currentStats.sterilizationPercentLabel || 'تعقيم طبي للأدوات قبل كل استخدام'}
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-6">
              {/* بطاقة سنوات الخبرة - Dynamic from LocalStorage */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800 text-center">
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {expYears}
                </p>
                <p className="text-xs text-neutral-400 mt-1 leading-normal">
                  {currentStats.experienceYearsLabel || 'سنوات من الخبرة والاحتراف'}
                </p>
                <span className="text-[10px] text-amber-400/90 font-bold block mt-1">
                  إشراف: {captainName}
                </span>
              </div>

              <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-lg">
                <img
                  src={fallbackFacialImg}
                  alt="أجهزة العناية المتقدمة"
                  className="w-full h-56 object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>

          {/* Text Information (100% Dynamic) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Scissors className="w-4 h-4" />
              <span>{title}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              {subtitle}
            </h2>

            <p className="text-neutral-300 text-base leading-relaxed">
              {description}
            </p>

            {secondaryDescription && (
              <p className="text-neutral-400 text-sm leading-relaxed border-r-2 border-amber-400 pr-3">
                {secondaryDescription}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <ShieldCheck className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">أدوات معقمة لكل زبون</h4>
                <p className="text-xs text-neutral-400 leading-normal">
                  نولي النظافة الأولوية القصوى، حيث يتم تعقيم الموس والمشط والمكائن بمواد طبية متخصصة.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <Sparkles className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">أجهزة تنظيف متطورة</h4>
                <p className="text-xs text-neutral-400 leading-normal">
                  جلسات تنظيف عميق وعادي باستخدام أجهزة بخار وماسكات مهدئة تمنح وجهك نضارة وانتعاشاً فورياً.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <HeartHandshake className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">مرونة وشفافية بالأسعار</h4>
                <p className="text-xs text-neutral-400 leading-normal">
                  أسعار عادلة ومدروسة، مع مرونة خاصة لتخفيض السعر حسب طبيعة الشعر ونوع العمل المطلوب.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <Scissors className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="text-sm font-bold text-white mb-1">تدريج وتحديد فائق الدقة</h4>
                <p className="text-xs text-neutral-400 leading-normal">
                  رسم خطوط اللحية وتدريج الشعر بمقاسات دقيقة تتناسب تماماً مع ستايلك الخاص.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
