import { useState } from 'react';
import { SalonSettings, BarberService } from '../../types';
import { saveSalonSettings } from '../../utils/salonStore';
import ServicesManager from './ServicesManager';
import { 
  Globe, Layout, Info, Phone, Sparkles, Save, CheckCircle2, 
  MapPin, Instagram, Facebook, Image as ImageIcon, Scissors, 
  ExternalLink, Eye, RefreshCw 
} from 'lucide-react';

interface WebsiteContentManagerProps {
  settings: SalonSettings;
  services: BarberService[];
  onSettingsUpdated: () => void;
  onServicesUpdated: () => void;
}

export default function WebsiteContentManager({
  settings,
  services,
  onSettingsUpdated,
  onServicesUpdated,
}: WebsiteContentManagerProps) {
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'about' | 'contact' | 'services'>('hero');

  // 1. Hero & Brand Form State
  const [salonName, setSalonName] = useState(settings.salonName || 'حلاقة عبود');
  const [welcomeTitle, setWelcomeTitle] = useState(settings.welcomeTitle || 'مرحباً بك ايها الزبون عند حلاقة عبود');
  const [heroBadge, setHeroBadge] = useState(settings.heroBadge || 'صالون الحلاقة الرجالية الأول');
  const [heroHeadline, setHeroHeadline] = useState(settings.heroHeadline || 'أناقة لا تضاهى، وحلاقة تليق بحضورك');
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle || 'نقدم لك تجربة حلاقة وعناية استثنائية...');
  const [heroImageUrl, setHeroImageUrl] = useState(settings.heroImageUrl || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200');

  // 2. About Section Form State
  const [aboutTitle, setAboutTitle] = useState(settings.aboutTitle || 'عن صالون حلاقة عبود');
  const [aboutSubtitle, setAboutSubtitle] = useState(settings.aboutSubtitle || 'لمسة احترافية تعتني بأدق التفاصيل لمظهرك');
  const [aboutDescription, setAboutDescription] = useState(settings.aboutDescription || 'في صالون حلاقة عبود، لا تقتصر التجربة على مجرد قص الشعر أو اللحية...');
  const [aboutDescriptionSecondary, setAboutDescriptionSecondary] = useState(settings.aboutDescriptionSecondary || 'فريقنا مؤلف من حلاقين محترفين شغوفين بمهنتهم...');
  const [aboutImageUrl, setAboutImageUrl] = useState(settings.aboutImageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200');
  const [aboutExperienceYears, setAboutExperienceYears] = useState(settings.aboutExperienceYears || '10+');
  const [aboutMasterBarberName, setAboutMasterBarberName] = useState(settings.aboutMasterBarberName || 'الكابتن عبود');

  // 3. Contact & Social State
  const [phone, setPhone] = useState(settings.phone || '07712818522');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || '9647712818522');
  const [location, setLocation] = useState(settings.location || 'الشارع العام - مقابل السوق التجاري');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(settings.googleMapsUrl || 'https://maps.google.com/?q=Baghdad');
  const [instagramUrl, setInstagramUrl] = useState(settings.instagramUrl || 'https://instagram.com');
  const [tiktokUrl, setTiktokUrl] = useState(settings.tiktokUrl || 'https://tiktok.com');
  const [facebookUrl, setFacebookUrl] = useState(settings.facebookUrl || 'https://facebook.com');

  // Notification feedbacks
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick preset image choices
  const presetHeroImages = [
    { label: 'صالون فاخر مودرن', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200' },
    { label: 'حلاقة احترافية وسشوار', url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200' },
    { label: 'أدوات حلاقة كلاسيكية', url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=1200' },
    { label: 'كرسي الحلاقة الملكي', url: 'https://images.unsplash.com/photo-1512690459411-b9245aed614b?auto=format&fit=crop&q=80&w=1200' },
  ];

  const handleSaveContent = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    saveSalonSettings({
      salonName: salonName.trim(),
      welcomeTitle: welcomeTitle.trim(),
      heroBadge: heroBadge.trim(),
      heroHeadline: heroHeadline.trim(),
      heroSubtitle: heroSubtitle.trim(),
      heroImageUrl: heroImageUrl.trim(),
      aboutTitle: aboutTitle.trim(),
      aboutSubtitle: aboutSubtitle.trim(),
      aboutDescription: aboutDescription.trim(),
      aboutDescriptionSecondary: aboutDescriptionSecondary.trim(),
      aboutImageUrl: aboutImageUrl.trim(),
      aboutExperienceYears: aboutExperienceYears.trim(),
      aboutMasterBarberName: aboutMasterBarberName.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      location: location.trim(),
      googleMapsUrl: googleMapsUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      tiktokUrl: tiktokUrl.trim(),
      facebookUrl: facebookUrl.trim(),
    });

    onSettingsUpdated();
    setSuccessMsg('تم حفظ وتحديث محتوى الموقع بنجاح ومزامنته مع واجهة الزبائن فوراً!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-amber-400" />
            <span>إدارة محتوى الموقع (Website Content Management)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            التحكم الكامل بجميع نصوص، صور، أرقام هواتف، وروابط موقع الزبائن بدون أي كود ثابت (100% Dynamic).
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveContent()}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات فوراً</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#121620] p-1.5 rounded-2xl border border-neutral-800">
        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'hero'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>الهوية والواجهة (Hero)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('about')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'about'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Info className="w-4 h-4" />
          <span>عن الصالون (About Us)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('contact')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'contact'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>التواصل والسوشيال</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('services')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'services'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>العروض والخدمات ({services.length})</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={(e) => handleSaveContent(e)} className="space-y-6">
        
        {/* =========================================================================
            TAB 1: الهوية والواجهة الرئيسية (Hero & Brand)
            ========================================================================= */}
        {activeSubTab === 'hero' && (
          <div className="p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Layout className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">إدارة الهوية والواجهة (Hero Section)</h3>
                <p className="text-[11px] text-neutral-400">تعديل اسم الصالون، النصوص الترحيبية، ورابط الصورة الرئيسية</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  شارة التميز في الواجهة (Hero Badge):
                </label>
                <input
                  type="text"
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  placeholder="صالون الحلاقة الرجالية الأول"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                الرسالة الترحيبية المتحركة في الصندوق الذهبي (Welcome Text):
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
                العنوان الرئيسي الكبير (Headline):
              </label>
              <input
                type="text"
                required
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                placeholder="أناقة لا تضاهى، وحلاقة تليق بحضورك"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                الوصف الفرعي للواجهة (Hero Subtitle):
              </label>
              <textarea
                rows={3}
                required
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="نقدم لك تجربة حلاقة وعناية استثنائية تجمع بين الحرفية الدقيقة..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Hero Image URL & Preset Selection */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300">
                رابط الصورة الرئيسية المعروضة في الواجهة (Hero Image URL):
              </label>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <a
                  href={heroImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl flex items-center justify-center transition-colors"
                  title="معاينة الرابط في صفحة جديدة"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-neutral-400">خيارات سريعة للصور الفاخرة:</span>
                {presetHeroImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setHeroImageUrl(img.url)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-amber-300 transition-colors cursor-pointer"
                  >
                    {img.label}
                  </button>
                ))}
              </div>

              {/* Image Preview Card */}
              {heroImageUrl && (
                <div className="mt-3 p-2 bg-neutral-950 rounded-xl border border-neutral-800 max-w-sm">
                  <span className="text-[10px] text-neutral-500 block mb-1">معاينة الصورة الحية:</span>
                  <img
                    src={heroImageUrl}
                    alt="معاينة الصورة الرئيسية"
                    className="w-full h-36 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: قسم "عن الصالون" (About Us)
            ========================================================================= */}
        {activeSubTab === 'about' && (
          <div className="p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Info className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">إدارة قسم "عن الصالون" (About Us)</h3>
                <p className="text-[11px] text-neutral-400">تعديل النبذة التعريفية، الصورة المرفقة، وبيانات الكابتن والخبرة</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  عنوان قسم عن الصالون:
                </label>
                <input
                  type="text"
                  required
                  value={aboutTitle}
                  onChange={(e) => setAboutTitle(e.target.value)}
                  placeholder="عن صالون حلاقة عبود"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  العنوان الفرعي للقسم:
                </label>
                <input
                  type="text"
                  required
                  value={aboutSubtitle}
                  onChange={(e) => setAboutSubtitle(e.target.value)}
                  placeholder="لمسة احترافية تعتني بأدق التفاصيل لمظهرك"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                النبذة التعريفية الرئيسية عن الصالون (Textarea):
              </label>
              <textarea
                rows={4}
                required
                value={aboutDescription}
                onChange={(e) => setAboutDescription(e.target.value)}
                placeholder="اكتب النبذة التعريفية هنا..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                النبذة التكميلية (خدمات VIP والعناية بالبشرة):
              </label>
              <textarea
                rows={3}
                value={aboutDescriptionSecondary}
                onChange={(e) => setAboutDescriptionSecondary(e.target.value)}
                placeholder="فريقنا مؤلف من حلاقين محترفين..."
                className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  اسم الحلاق الرئيسي / المؤسس:
                </label>
                <input
                  type="text"
                  value={aboutMasterBarberName}
                  onChange={(e) => setAboutMasterBarberName(e.target.value)}
                  placeholder="الكابتن عبود"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  سنوات الخبرة المعروضة:
                </label>
                <input
                  type="text"
                  value={aboutExperienceYears}
                  onChange={(e) => setAboutExperienceYears(e.target.value)}
                  placeholder="10+"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* About Image URL */}
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-semibold text-neutral-300">
                رابط الصورة المرفقة في قسم "عن الصالون" (About Image URL):
              </label>
              
              <div className="flex gap-2">
                <input
                  type="url"
                  required
                  value={aboutImageUrl}
                  onChange={(e) => setAboutImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {aboutImageUrl && (
                <div className="mt-2 p-2 bg-neutral-950 rounded-xl border border-neutral-800 max-w-sm">
                  <span className="text-[10px] text-neutral-500 block mb-1">معاينة صورة الصالون:</span>
                  <img
                    src={aboutImageUrl}
                    alt="معاينة صورة عن الصالون"
                    className="w-full h-36 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: بيانات التواصل والموقع والسوشيال ميديا
            ========================================================================= */}
        {activeSubTab === 'contact' && (
          <div className="p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-5 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
              <Phone className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">إدارة بيانات التواصل والموقع (Contact & Social)</h3>
                <p className="text-[11px] text-neutral-400">تعديل أرقام الهواتف، رابط الواتساب المباشر، خرائط جوجل، وروابط السوشيال ميديا</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  رقم الهاتف للاتصال المباشر (Phone):
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07712818522"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white text-right focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  رقم الواتساب لاستقبال الحجوزات والمحادثة (WhatsApp):
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="9647712818522"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm text-white text-right focus:outline-none focus:border-amber-400 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">يكتب بالصيغة الدولية بدون إشارة + (مثلاً: 9647712818522)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  العنوان وموقع المحل المكتوب:
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

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  رابط موقع المحل على خرائط جوجل (Google Maps Link):
                </label>
                <input
                  type="url"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Social Media Links */}
            <div className="pt-3 border-t border-neutral-800 space-y-3">
              <h4 className="text-xs font-bold text-amber-400">حسابات التواصل الاجتماعي (Social Media Links):</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    رابط إنستغرام (Instagram):
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    رابط تيك توك (TikTok):
                  </label>
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://tiktok.com/@..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    رابط فيسبوك (Facebook):
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: إدارة العروض والخدمات (Services & Pricing)
            ========================================================================= */}
        {activeSubTab === 'services' && (
          <div className="space-y-4 animate-in fade-in">
            <ServicesManager
              services={services}
              onServicesUpdated={onServicesUpdated}
            />
          </div>
        )}

        {/* Global Save Button at bottom of form */}
        {activeSubTab !== 'services' && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-7 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتطبيق جميع التعديلات فوراً على الموقع</span>
            </button>
          </div>
        )}

      </form>

    </div>
  );
}
