import { getActiveAdminUser, MASTER_OWNER_ACCOUNT } from '../../utils/salonStore';
import { KeyRound, ShieldCheck, User, Crown, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AccountSettingsManager() {
  const activeUser = getActiveAdminUser();
  const isMaster = activeUser.username.toLowerCase() === MASTER_OWNER_ACCOUNT.username.toLowerCase();

  return (
    <div className="space-y-6 max-w-xl">
      
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
          <KeyRound className="w-6 h-6 text-amber-400" />
          <span>إعدادات الحساب والمصادقة</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          معلومات الحساب الإداري وصلاحيات الوصول إلى لوحة تحكم صالون عبود.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="p-5 rounded-2xl bg-[#121620] border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              {isMaster ? <Crown className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-xs text-neutral-400">اسم المستخدم المسجل حالياً:</p>
              <p className="text-base font-black text-white font-mono">{activeUser.username}</p>
            </div>
          </div>

          <span className="text-xs px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isMaster ? 'المالك الأساسي' : activeUser.displayName}</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs text-neutral-300">
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">الاسم المعروض:</span>
            <strong className="text-white">{activeUser.displayName || 'مالك الصالون'}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">مستوى الصلاحية:</span>
            <span className="text-amber-400 font-bold">صلاحيات إدارة كاملة ومطلقة</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-400">حالة الحماية:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>محمي ومؤمن 100%</span>
            </span>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>نظام الحماية الثابت:</span>
          </div>
          <p>
            حساب المالك الأساسي مسجل بـ <code className="bg-neutral-900 px-1.5 py-0.5 rounded text-amber-300 font-mono font-bold">7aw12005</code> وهو معتمد بشكل دائم وحصري لمنع أي محاولة تجاوز أو دخول خارجي.
          </p>
          <p className="text-[11px] text-neutral-400 pt-1">
            لإضافة مشرفين مساعدين أو تحديد صلاحيات لأشخاص آخرين، يرجى الانتقال إلى قسم <strong>"إدارة الآدمنية والصلاحيات"</strong> من القائمة الجانبية.
          </p>
        </div>
      </div>

    </div>
  );
}
