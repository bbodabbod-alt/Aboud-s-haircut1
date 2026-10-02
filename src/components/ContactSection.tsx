import { useState } from 'react';
import { Phone, MapPin, MessageSquare, Clock, Send, CheckCircle2, ExternalLink, Instagram, Facebook } from 'lucide-react';
import { SalonSettings } from '../types';

interface ContactSectionProps {
  settings?: SalonSettings;
}

export default function ContactSection({ settings }: ContactSectionProps) {
  const [messageSent, setMessageSent] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  // 100% Dynamic from Settings (LocalStorage)
  const displayPhone = settings?.phone || '07712818522';
  const whatsappNum = (settings?.whatsapp || '9647712818522').replace(/\D/g, '');
  const displayLocation = settings?.location || 'الشارع العام - مقابل السوق التجاري';
  const mapsUrl = settings?.googleMapsUrl || 'https://maps.google.com/?q=Baghdad';
  const openTime = settings?.openTime || '10:00 ص';
  const closeTime = settings?.closeTime || '11:30 م';

  const instagramUrl = settings?.instagramUrl;
  const tiktokUrl = settings?.tiktokUrl;
  const facebookUrl = settings?.facebookUrl;

  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;
    
    // Dynamic WhatsApp redirect for direct contact using the salon's configured number
    const text = encodeURIComponent(`مرحباً صالون عبود، أنا ${name} (${phone}):\n${message}`);
    window.open(`https://wa.me/${whatsappNum}?text=${text}`, '_blank');
    setMessageSent(true);
    setTimeout(() => setMessageSent(false), 5000);
  };

  return (
    <section id="contact" className="py-20 bg-[#0e1117] border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <MapPin className="w-4 h-4" />
            <span>الموقع والتواصل المباشر</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            يسعدنا استقبالك وتواصلك معنا
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base">
            تفضل بزيارة صالون عبود أو تواصل معنا هاتفياً أو عبر واتساب للاستفسار وحجز المواعيد.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Contact Details Cards */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Phone Card (Dynamic) */}
            <a
              href={`tel:${displayPhone.replace(/\s+/g, '')}`}
              className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">الاتصال المباشر</p>
                <p className="text-base font-bold text-white group-hover:text-amber-300 font-mono tracking-wide" dir="ltr">
                  {displayPhone}
                </p>
                <p className="text-[11px] text-emerald-400 mt-0.5">متاح طوال ساعات الدوام</p>
              </div>
            </a>

            {/* WhatsApp Card (Dynamic) */}
            <a
              href={`https://wa.me/${whatsappNum}?text=${encodeURIComponent('مرحباً صالون عبود، أود الاستفسار عن المواعيد والخدمات')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-emerald-500/50 transition-all flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">محادثة واتساب سريعة</p>
                <p className="text-base font-bold text-white group-hover:text-emerald-300">
                  تواصل عبر الواتساب مباشرة
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">رد فوري وسريع على الاستفسارات</p>
              </div>
            </a>

            {/* Location Card with Google Maps link (Dynamic) */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400">العنوان وموقع المحل</p>
                  <p className="text-base font-bold text-white group-hover:text-amber-300">
                    {displayLocation}
                  </p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">اضغط لفتح الموقع في خرائط Google</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors" />
            </a>

            {/* Hours card (Dynamic from Settings) */}
            <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">أوقات وساعات الدوام</p>
                <p className="text-base font-bold text-white font-mono">
                  {openTime} - {closeTime}
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">طيلة أيام الأسبوع</p>
              </div>
            </div>

            {/* Social Media Links (Dynamic from Settings) */}
            {(instagramUrl || tiktokUrl || facebookUrl) && (
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-neutral-300">تابعنا على السوشيال ميديا:</span>
                <div className="flex items-center gap-2">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
                      title="إنستغرام"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {tiktokUrl && (
                    <a
                      href={tiktokUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
                      title="تيك توك"
                    >
                      <span className="font-bold text-xs">TikTok</span>
                    </a>
                  )}
                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 transition-colors"
                      title="فيسبوك"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Direct WhatsApp Query Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-2">
                أرسل استفسارك أو طلبك الخاص
              </h3>
              <p className="text-xs text-neutral-400 mb-6">
                لديك استفسار عن نوع تسريحة معينة، جلسات العناية بالبشرة، أو طلب موعد مخصص؟ أرسل رسالتك وسنرد عليك مباشرة.
              </p>

              {messageSent && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>تم تحويل رسالتك إلى واتساب الصالون بنجاح!</span>
                </div>
              )}

              <form onSubmit={handleSendQuery} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      اسمك الكريم:
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: يوسف محمد"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      رقم هاتفك:
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07XXXXXXXX"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    رسالتك أو استفسارك:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب استفسارك هنا وسيقوم عبود بالرد عليك فوراً..."
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10 active:scale-98"
                >
                  <Send className="w-4 h-4 rotate-180" />
                  <span>إرسال الاستفسار عبر واتساب</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
