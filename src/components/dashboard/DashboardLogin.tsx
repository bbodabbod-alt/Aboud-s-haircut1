import { useState } from 'react';
import { verifyManagerLogin } from '../../utils/salonStore';
import { Scissors, Lock, User, Shield, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardLoginProps {
  onLoginSuccess: () => void;
  onExitToCustomerSite: () => void;
}

export default function DashboardLogin({ onLoginSuccess, onExitToCustomerSite }: DashboardLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);

    const result = verifyManagerLogin(username.trim(), password.trim());
    
    if (result.success) {
      setSuccessMessage('تم التحقق بنجاح، جاري فتح لوحة التحكم...');
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
    } else {
      setLoading(false);
      setError('بيانات الدخول غير صحيحة، يرجى التأكد من اسم المستخدم وكلمة المرور');
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0e] text-neutral-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -right-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Button: "العودة للموقع" */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={onExitToCustomerSite}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors text-xs font-semibold cursor-pointer shadow-md"
        >
          <ArrowRight className="w-4 h-4 rotate-180 text-amber-400" />
          <span>العودة للموقع</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-[#121620] border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 relative z-10 text-right">
        
        {/* Header Icon & Brand */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-neutral-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Scissors className="w-7 h-7 rotate-90" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              لوحة تحكم صالون عبود
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wider mt-1">
              SALON MANAGEMENT DASHBOARD
            </p>
          </div>

          <p className="text-xs text-neutral-400">
            أدخل بيانات الإدارة المصرح لها للوصول إلى لوحة التحكم
          </p>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form (تسجيل الدخول فقط بدون أي خيار لإنشاء حساب) */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>اسم المستخدم:</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="اسم المستخدم..."
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>كلمة المرور:</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-neutral-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            <span>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</span>
          </button>
        </form>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-neutral-800 text-center text-[11px] text-neutral-500">
          صالون حلاقة عبود · منطقة الإدارة الآمنة
        </div>

      </div>
    </div>
  );
}
