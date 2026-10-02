import { useState } from 'react';
import { AdminUser, AdminRole } from '../../types';
import { 
  getAllAdminUsers, addAdminUser, updateAdminUser, 
  deleteAdminUser, transferOwnership, getActiveAdminUser, MASTER_OWNER_ACCOUNT 
} from '../../utils/salonStore';
import { 
  ShieldCheck, UserPlus, Trash2, KeyRound, Crown, 
  User, CheckCircle2, AlertCircle, ShieldAlert, Eye, EyeOff, Sparkles, RefreshCw
} from 'lucide-react';

interface AdminsPermissionsManagerProps {
  onAdminsUpdated?: () => void;
}

export default function AdminsPermissionsManager({ onAdminsUpdated }: AdminsPermissionsManagerProps) {
  const [admins, setAdmins] = useState<AdminUser[]>(() => getAllAdminUsers());
  const activeUser = getActiveAdminUser();

  // New Admin Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('moderator');

  // Edit State
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');

  // Password visibility map
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});

  // Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshList = () => {
    setAdmins(getAllAdminUsers());
    if (onAdminsUpdated) onAdminsUpdated();
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = addAdminUser(newUsername, newPassword, newRole, newDisplayName);
    if (res.success) {
      setSuccessMsg(res.message);
      setNewUsername('');
      setNewPassword('');
      setNewDisplayName('');
      setNewRole('moderator');
      refreshList();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDeleteAdmin = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من رغبتك في حذف المشرف "${name}"؟`)) {
      const res = deleteAdminUser(id);
      if (res.success) {
        setSuccessMsg(res.message);
        refreshList();
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleTransferOwnership = (id: string, name: string) => {
    if (
      window.confirm(
        `هل أنت متأكد من رغبتك في منح صلاحيات الإدارة الكاملة للمشرف "${name}"؟`
      )
    ) {
      const res = transferOwnership(id);
      if (res.success) {
        setSuccessMsg(res.message);
        refreshList();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const handleUpdatePassword = (id: string) => {
    if (!editPassword.trim() || editPassword.trim().length < 4) {
      setErrorMsg('كلمة المرور يجب أن تكون من 4 خانات على الأقل');
      return;
    }
    const res = updateAdminUser(id, { passwordPlain: editPassword.trim() });
    if (res.success) {
      setSuccessMsg('تم تحديث كلمة مرور المشرف بنجاح');
      setEditingAdminId(null);
      setEditPassword('');
      refreshList();
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(res.message);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            <span>إدارة الآدمنية والصلاحيات (Admin Management)</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            إضافة مشرفين إضافيين، تحديد وتعديل الصلاحيات، وخيار تحويل الملكية بأمان مع حماية حساب المالك الأساسي.
          </p>
        </div>

        {/* Current Active User Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs self-start sm:self-auto font-mono">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>المسجل حالياً: {activeUser.username}</span>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Master Owner Permanent Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#121620] to-[#121620] border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-neutral-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {MASTER_OWNER_ACCOUNT.displayName}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 uppercase tracking-wider">
                  المالك الأساسي (صلاحية مطلقة)
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                حساب المالك الأساسي دائم الحماية وغير قابل للحذف، ويملك الصلاحية الكاملة لإدارة كافة المشرفين.
              </p>
            </div>
          </div>

          <div className="text-right sm:text-left self-start sm:self-auto font-mono text-xs">
            <div className="text-neutral-400 text-[11px]">اسم المستخدم:</div>
            <strong className="text-amber-300 font-bold">{MASTER_OWNER_ACCOUNT.username}</strong>
          </div>
        </div>

        {/* Credentials detail preview */}
        <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span>كلمة المرور الحالية للمالك:</span>
            <span className="font-mono text-neutral-200 bg-neutral-900 px-2.5 py-1 rounded-lg border border-neutral-800">
              {showPasswords[MASTER_OWNER_ACCOUNT.id] ? MASTER_OWNER_ACCOUNT.passwordPlain : '•••••••••••••••••'}
            </span>
            <button
              type="button"
              onClick={() => togglePasswordVisibility(MASTER_OWNER_ACCOUNT.id)}
              className="text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
              title="إظهار / إخفاء كلمة المرور"
            >
              {showPasswords[MASTER_OWNER_ACCOUNT.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <span className="text-[11px] text-amber-400/80">
            ★ معتمد حصرياً لشاشة تسجيل الدخول
          </span>
        </div>
      </div>

      {/* 2. Add New Admin Form */}
      <form onSubmit={handleCreateAdmin} className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
          <UserPlus className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">إضافة مشرف أو آدمن جديد</h3>
            <p className="text-[11px] text-neutral-400">إنشاء حساب إضافي لشخص آخر لإدارة الحجوزات والمواعيد أو بصلاحيات كاملة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              اسم المستخدم (Username):
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="مثال: assistant_ali"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              كلمة المرور الخاصة به:
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              الاسم المعروض / اللقب (اختياري):
            </label>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="مثال: علي الحلاق / كاشير الصالون"
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              مستوى الصلاحية:
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as AdminRole)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
            >
              <option value="moderator">مشرف إدارة حجوزات وعروض (Moderator)</option>
              <option value="superadmin">مدير كامل الصلاحيات (Super Admin)</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة المشرف الجديد</span>
          </button>
        </div>
      </form>

      {/* 3. Secondary Admins List */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#121620] border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>قائمة المشرفين المعتمدين ({admins.length})</span>
          </h3>
          <span className="text-[11px] text-neutral-400">
            يتم تخزين بياناتهم بأمان في LocalStorage
          </span>
        </div>

        <div className="space-y-3">
          {admins.map((admin) => {
            const isMaster = admin.id === MASTER_OWNER_ACCOUNT.id;

            return (
              <div
                key={admin.id}
                className={`p-4 rounded-xl border transition-all ${
                  isMaster 
                    ? 'bg-amber-500/5 border-amber-500/30' 
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {admin.displayName || admin.username}
                      </span>

                      {isMaster ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-neutral-950">
                          المالك الأساسي
                        </span>
                      ) : admin.role === 'superadmin' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          مدير كامل الصلاحيات
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          مشرف محتوى وحجوزات
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 font-mono">
                      <span>اسم الدخول: <strong className="text-neutral-200">{admin.username}</strong></span>
                      <span>·</span>
                      <div className="flex items-center gap-1.5">
                        <span>كلمة المرور:</span>
                        <strong className="text-neutral-200">
                          {showPasswords[admin.id] ? admin.passwordPlain : '••••••••'}
                        </strong>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(admin.id)}
                          className="text-neutral-500 hover:text-amber-400"
                        >
                          {showPasswords[admin.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span>·</span>
                      <span className="text-[11px] text-neutral-500">أُضيف: {admin.createdAt}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {!isMaster ? (
                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
                      {/* Change Password Button */}
                      {editingAdminId === admin.id ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in">
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder="كلمة مرور جديدة..."
                            className="bg-neutral-950 border border-neutral-700 px-2 py-1 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdatePassword(admin.id)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg cursor-pointer"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAdminId(null)}
                            className="px-2 py-1 text-neutral-400 hover:text-white text-xs cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAdminId(admin.id);
                            setEditPassword(admin.passwordPlain);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="تعديل كلمة المرور"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>تعديل الرمز</span>
                        </button>
                      )}

                      {/* Transfer Ownership / Full Access Button (Requirement 3-C) */}
                      {admin.role !== 'superadmin' && (
                        <button
                          type="button"
                          onClick={() => handleTransferOwnership(admin.id, admin.displayName)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="منح المشرف صلاحيات إدارة كاملة"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>ترقية لمدير كامل</span>
                        </button>
                      )}

                      {/* Delete Button (Requirement 3-B) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(admin.id, admin.displayName)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="حذف هذا المشرف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400/90 font-bold px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      محمي ضد الحذف أو التعديل
                    </span>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
