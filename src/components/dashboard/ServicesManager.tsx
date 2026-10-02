import { useState, useRef } from 'react';
import { BarberService } from '../../types';
import { updateSalonService, deleteSalonService, saveSalonServices } from '../../utils/salonStore';
import { 
  Sparkles, Plus, Edit2, Trash2, Upload, Image as ImageIcon, 
  X, Check, AlertCircle, Clock
} from 'lucide-react';

interface ServicesManagerProps {
  services: BarberService[];
  onServicesUpdated: () => void;
}

export default function ServicesManager({ services, onServicesUpdated }: ServicesManagerProps) {
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(10000);
  const [formCategory, setFormCategory] = useState<'cleaning' | 'haircut' | 'beard'>('haircut');
  const [formDuration, setFormDuration] = useState<number>(25);
  const [formDescription, setFormDescription] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formImage, setFormImage] = useState<string>('');
  const [imageError, setImageError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEditModal = (service: BarberService) => {
    setIsAddingNew(false);
    setEditingService(service);
    setFormName(service.name);
    setFormPrice(service.price);
    setFormCategory(service.category);
    setFormDuration(service.durationMinutes);
    setFormDescription(service.description || '');
    setFormNote(service.note || '');
    setFormImage(service.image || '');
    setImageError('');
  };

  const openAddModal = () => {
    setIsAddingNew(true);
    setEditingService(null);
    setFormName('');
    setFormPrice(10000);
    setFormCategory('haircut');
    setFormDuration(25);
    setFormDescription('');
    setFormNote('');
    setFormImage('');
    setImageError('');
  };

  const closeModal = () => {
    setEditingService(null);
    setIsAddingNew(false);
  };

  // Image Upload Handler using FileReader (converts to Base64 data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setImageError('حجم الصورة كبير جداً (يُفضل أقل من 4 ميجابايت)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImage(reader.result);
        setImageError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const priceNum = Number(formPrice) || 0;
    const priceFormatted = `${priceNum.toLocaleString('en-US')} د.ع`;

    if (isAddingNew) {
      const newService: BarberService = {
        id: `srv_${Date.now()}`,
        name: formName.trim(),
        price: priceNum,
        priceFormatted,
        category: formCategory,
        durationMinutes: Number(formDuration) || 20,
        description: formDescription.trim(),
        note: formNote.trim(),
        image: formImage || undefined,
      };
      updateSalonService(newService);
    } else if (editingService) {
      const updated: BarberService = {
        ...editingService,
        name: formName.trim(),
        price: priceNum,
        priceFormatted,
        category: formCategory,
        durationMinutes: Number(formDuration) || 20,
        description: formDescription.trim(),
        note: formNote.trim(),
        image: formImage || undefined,
      };
      updateSalonService(updated);
    }

    onServicesUpdated();
    closeModal();
  };

  const handleDelete = (serviceId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة نهائياً من الموقع؟')) {
      deleteSalonService(serviceId);
      onServicesUpdated();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>إدارة العروض والخدمات</span>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
              {services.length} خدمة
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            عدّل أسماء الخدمات، الأسعار، والملاحظات، وقم بتحميل وتغيير الصور لتنعكس فوراً على موقع الزبائن.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عرض أو خدمة جديدة</span>
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-2xl bg-[#121620] border border-neutral-800 hover:border-neutral-700 overflow-hidden flex flex-col justify-between transition-all group"
          >
            {/* Service Image / Preview */}
            <div className="relative h-44 w-full bg-neutral-950 overflow-hidden border-b border-neutral-800">
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 space-y-1">
                  <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-xs">بدون صورة</span>
                </div>
              )}

              {/* Price Tag Overlay */}
              <div className="absolute top-3 right-3 bg-neutral-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-neutral-700/80">
                <span className="text-sm font-bold text-amber-400 font-mono">
                  {service.price.toLocaleString('en-US')} د.ع
                </span>
              </div>

              {/* Duration Tag */}
              <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-neutral-800 text-[11px] text-neutral-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{service.durationMinutes} دقيقة</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  {service.name}
                </h3>

                {service.description && (
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                )}

                {service.note && (
                  <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-2 leading-relaxed">
                    💡 <strong>ملاحظة:</strong> {service.note}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => openEditModal(service)}
                  className="flex-1 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-700/60"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>تعديل الخدمة والصورة</span>
                </button>

                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer border border-neutral-700/60"
                  title="حذف الخدمة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {(editingService || isAddingNew) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-xl bg-[#121620] border border-neutral-700 rounded-2xl shadow-2xl overflow-hidden my-6 text-right"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#161a26]">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isAddingNew ? 'إضافة عرض أو خدمة جديدة' : `تعديل خدمة: ${formName}`}</span>
              </h3>

              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Service Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  اسم الخدمة أو العرض:
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: عرض التنظيف العميق"
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    السعر (د.ع):
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    المدة التقديرية (بالدقائق):
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  التصنيف:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                >
                  <option value="cleaning">عروض التنظيف والعناية بالبشرة</option>
                  <option value="haircut">حلاقة وقص الشعر</option>
                  <option value="beard">تحديد وعناية اللحية</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  وصف الخدمة:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="مع أجهزة متطورة للتنظيف ونظافة عامة..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  ملاحظة نصية إضافية (تظهر داخل بطاقة الخدمة):
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="مثال: يتغير السعر للأقل عندما أعرف نوع الشعر والعمل..."
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Image Upload & Management (Core Requirement) */}
              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-semibold text-neutral-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>صورة العرض / الخدمة:</span>
                  </span>
                  <span className="text-[11px] text-amber-400">تنعكس فوراً على موقع الزبائن</span>
                </label>

                {imageError && (
                  <p className="text-xs text-rose-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{imageError}</span>
                  </p>
                )}

                {/* Image Preview Box */}
                {formImage && (
                  <div className="relative mb-3 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-950 h-36 w-full">
                    <img
                      src={formImage}
                      alt="معاينة الصورة"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-neutral-950/80 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                      title="إزالة الصورة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl border border-neutral-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>{formImage ? 'تغيير الصورة (تحميل ملف جديد)' : 'تحميل صورة من الجهاز'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-amber-500/10 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ التعديلات ونشرها</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
