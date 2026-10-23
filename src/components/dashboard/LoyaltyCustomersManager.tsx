import { useState, useEffect } from 'react';
import { CustomerLoyaltyData } from '../../types';
import { 
  subscribeToAllLoyaltyCustomers, 
  redeemFreeHaircutInFirebase, 
  adminAdjustLoyaltyStamps,
  normalizeLoyaltyPhone 
} from '../../utils/loyaltyService';
import { 
  Award, Sparkles, Gift, Search, Phone, ExternalLink, 
  CheckCircle2, Plus, Minus, Users, Scissors, Flame, LayoutList, LayoutGrid, Check
} from 'lucide-react';

export default function LoyaltyCustomersManager() {
  const [customers, setCustomers] = useState<CustomerLoyaltyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'nearing' | 'eligible' | 'active'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [redeemConfirmPhone, setRedeemConfirmPhone] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Subscribe to all loyalty customers in Firebase Realtime Database
  useEffect(() => {
    const unsubscribe = subscribeToAllLoyaltyCustomers((list) => {
      setCustomers(list);
    });
    return () => unsubscribe();
  }, []);

  const totalCustomers = customers.length;
  // Customers who reached 10 or have free haircut available
  const eligibleCustomers = customers.filter((c) => c.stampsCount >= 10 || c.freeHaircutAvailable);
  // Customers nearing completion (8 or 9 stamps)
  const nearingRewardCustomers = customers.filter((c) => c.stampsCount >= 8 && c.stampsCount < 10);
  // Total free haircuts already redeemed across all customers
  const totalFreeRedeemed = customers.reduce((acc, c) => acc + (c.freeHaircutsRedeemed || 0), 0);
  // Total completed visits tracked
  const totalCompletedVisits = customers.reduce((acc, c) => acc + (c.completedVisits || c.stampsCount || 0), 0);

  // Filter & Search
  const filteredCustomers = customers.filter((c) => {
    let matchesFilter = true;
    if (filter === 'eligible') {
      matchesFilter = c.stampsCount >= 10 || c.freeHaircutAvailable;
    } else if (filter === 'nearing') {
      matchesFilter = c.stampsCount >= 8 && c.stampsCount < 10;
    } else if (filter === 'active') {
      matchesFilter = c.stampsCount > 0 && c.stampsCount < 8;
    }

    const q = searchQuery.toLowerCase().trim();
    const cleanQ = normalizeLoyaltyPhone(q);
    const matchesSearch = !q || 
      c.customerName.toLowerCase().includes(q) ||
      c.phone.includes(cleanQ) ||
      c.phone.includes(q);

    return matchesFilter && matchesSearch;
  });

  const handleRedeem = async (phone: string) => {
    setIsProcessing(phone);
    try {
      await redeemFreeHaircutInFirebase(phone);
      setRedeemConfirmPhone(null);
    } catch (err) {
      console.error('Error redeeming free haircut:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAdjustStamps = async (phone: string, delta: number, current: number, name: string) => {
    const next = Math.max(0, Math.min(10, current + delta));
    setIsProcessing(phone);
    try {
      await adminAdjustLoyaltyStamps(phone, next, name);
    } catch (err) {
      console.error('Error adjusting stamps:', err);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header - سجل ولاء العملاء (Loyalty Progress) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-neutral-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                سجل ولاء العملاء (Loyalty Progress)
              </h2>
              <span className="text-[10px] text-amber-400 font-mono tracking-wider block">
                CUSTOMER REWARD TRACKING & VIP ADVANCEMENT
              </span>
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-2 max-w-2xl leading-relaxed">
            متابعة تقدم ولاء العملاء المجمعة بأرقام هواتفهم من Firebase، ورصد من اقترب من إكمال الـ 10 أختام لتقديم خدمة مميزة له، مع إدارة وصرف الحلاقات المجانية المستحقة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {nearingRewardCustomers.length > 0 && (
            <button
              onClick={() => setFilter('nearing')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{nearingRewardCustomers.length} اقتربوا من المكافأة!</span>
            </button>
          )}

          {eligibleCustomers.length > 0 && (
            <button
              onClick={() => setFilter('eligible')}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>{eligibleCustomers.length} حلاقة مجانية مستحقة</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Customers */}
        <div className="p-4 rounded-2xl bg-[#121620] border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">إجمالي الزبائن بالسجل</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalCustomers}</div>
          <p className="text-[10px] text-neutral-500">حسابات مجمعة برقم الهاتف</p>
        </div>

        {/* Nearing Completion (8-9 Stamps) */}
        <div 
          onClick={() => setFilter(filter === 'nearing' ? 'all' : 'nearing')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
            filter === 'nearing'
              ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
              : 'bg-[#121620] border-amber-500/30 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold">اقتربوا من المكافأة 🔥</span>
            <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{nearingRewardCustomers.length}</div>
          <p className="text-[10px] text-amber-300/80">يمتلكون 8 أو 9 أختام (VIP)</p>
        </div>

        {/* Eligible for Free Haircut (10/10) */}
        <div 
          onClick={() => setFilter(filter === 'eligible' ? 'all' : 'eligible')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-1 ${
            filter === 'eligible'
              ? 'bg-emerald-500/15 border-emerald-400 shadow-md shadow-emerald-500/10'
              : 'bg-[#121620] border-emerald-500/30 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold">مؤهلون لحلاقة مجانية</span>
            <Gift className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{eligibleCustomers.length}</div>
          <p className="text-[10px] text-emerald-300/80">أكملوا 10 أختام بنجاح</p>
        </div>

        {/* Total Free Redeemed */}
        <div className="p-4 rounded-2xl bg-[#121620] border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-semibold">هدايا مصروفة سابقاً</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 font-mono">{totalFreeRedeemed}</div>
          <p className="text-[10px] text-neutral-500">حلاقات مجانية منحت للزبائن</p>
        </div>
      </div>

      {/* Control Bar: Filters, Search & View Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[#121620] border border-neutral-800">
        
        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>الكل</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              filter === 'all' ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-800 text-neutral-300'
            }`}>
              {totalCustomers}
            </span>
          </button>

          <button
            onClick={() => setFilter('nearing')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'nearing'
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>اقترب من المكافأة (8-9 أختام)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              filter === 'nearing' ? 'bg-neutral-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {nearingRewardCustomers.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('eligible')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'eligible'
                ? 'bg-emerald-500 text-neutral-950 shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-emerald-400" />
            <span>مؤهل لحلاقة مجانية (10/10)</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              filter === 'eligible' ? 'bg-neutral-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {eligibleCustomers.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-amber-500 text-neutral-950 shadow-sm font-bold'
                : 'text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800'
            }`}
          >
            <span>قيد التجميع (1-7 أختام)</span>
          </button>
        </div>

        {/* Search and View Mode Buttons */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث باسم الزبون أو الهاتف..."
              className="w-full bg-neutral-900 border border-neutral-700/80 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* View Mode Toggle: Table vs Cards */}
          <div className="flex items-center bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-neutral-800 text-amber-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
              title="عرض جدول منظم"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">جدول</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-neutral-800 text-amber-400 shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
              title="عرض بطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">بطاقات</span>
            </button>
          </div>
        </div>

      </div>

      {/* Main Customers List: Empty state or Table / Cards */}
      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-[#121620] border border-neutral-800 space-y-3">
          <Award className="w-12 h-12 mx-auto text-neutral-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-white">لا توجد بيانات عملاء مطابقة</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {searchQuery 
              ? 'لم يتم العثور على أي زبون مطابق لعبارة البحث.'
              : 'يتم تسجيل وتجميع بطاقات الولاء للزبائن تلقائياً عند إتمام أول حلاقة بالصالون.'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* ================= ORGANIZED TABLE VIEW ================= */
        <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-[#121620] shadow-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">اسم الزبون</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">عدد الأختام الحالية</th>
                <th className="py-3 px-4">شريط التقدم</th>
                <th className="py-3 px-4">حالة المكافأة</th>
                <th className="py-3 px-4">إجمالي الزيارات</th>
                <th className="py-3 px-4 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredCustomers.map((c) => {
                const isEligible = c.stampsCount >= 10 || c.freeHaircutAvailable;
                const isNearing = c.stampsCount >= 8 && c.stampsCount < 10;
                const percentage = Math.min(100, (c.stampsCount / 10) * 100);

                return (
                  <tr 
                    key={c.phone} 
                    className={`hover:bg-neutral-900/50 transition-colors ${
                      isEligible 
                        ? 'bg-emerald-500/5' 
                        : isNearing 
                        ? 'bg-amber-500/5' 
                        : ''
                    }`}
                  >
                    {/* Customer Name */}
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{c.customerName || 'زبون الصالون'}</span>
                        {isNearing && (
                          <span className="p-0.5 rounded bg-amber-500/20 text-amber-400" title="اقترب من المكافأة">
                            <Flame className="w-3 h-3 animate-pulse" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer Phone */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <a
                        href={`tel:${c.phone}`}
                        dir="ltr"
                        className="font-mono text-neutral-300 hover:text-amber-400 flex items-center gap-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-neutral-500" />
                        <span>{c.phone}</span>
                      </a>
                    </td>

                    {/* Stamps Count (e.g. 7/10) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono font-black text-sm text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                        <Scissors className="w-3.5 h-3.5 rotate-90" />
                        <span>{c.stampsCount} / 10</span>
                      </div>
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 px-4 min-w-[140px]">
                      <div className="space-y-1">
                        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-neutral-800">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isEligible
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                                : isNearing
                                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300'
                                : 'bg-gradient-to-r from-neutral-600 to-amber-500/70'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          {isEligible ? 'مكتمل 100%' : `${percentage}% مكتمل`}
                        </span>
                      </div>
                    </td>

                    {/* Reward Eligibility Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isEligible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse">
                          <Gift className="w-3.5 h-3.5 text-emerald-400" />
                          <span>مؤهل لحلاقة مجانية! 🎉</span>
                        </span>
                      ) : isNearing ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span>اقترب من المكافأة (باقي {10 - c.stampsCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-neutral-400 bg-neutral-800/80 border border-neutral-700/60">
                          <span>قيد التجميع ({c.stampsCount}/10)</span>
                        </span>
                      )}
                    </td>

                    {/* Total Visits & Redeemed */}
                    <td className="py-3 px-4 font-mono text-neutral-300 whitespace-nowrap">
                      <span>{c.completedVisits || c.stampsCount || 0} زيارة</span>
                      {Boolean(c.freeHaircutsRedeemed) && (
                        <span className="text-[10px] text-emerald-400 block">
                          ({c.freeHaircutsRedeemed} مجانية سابقة)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* WhatsApp Message */}
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `مرحباً أخي ${c.customerName || ''} 💈 تحياتنا من صالون عبود!\n` +
                            (isEligible
                              ? `نهنئك بحرارة! 🎉 لقد أكملت 10 أختام في بطاقة ولائك، وحلاقتك القادمة بالكامل مجانية هدية منا! نتشرف بحضورك بأي وقت.`
                              : isNearing
                              ? `يسعدنا إعلامك بأنك اقتربت من الحصول على الحلاقة المجانية! رصيدك الحالي هو ${c.stampsCount} أختام (باقي لك ${10 - c.stampsCount} فقط). بانتظار تشريفك!`
                              : `رصيد بطاقة ولائك الحالية هو: ${c.stampsCount} من 10 أختام. كل حلاقة تقربك من هديتك المجانية!`)
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-emerald-950/60 text-neutral-400 hover:text-emerald-300 border border-neutral-800 hover:border-emerald-500/30 transition-colors"
                          title="مراسلة عبر واتساب"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Adjust + / - */}
                        <div className="flex items-center bg-neutral-900 rounded-lg border border-neutral-800 p-0.5">
                          <button
                            onClick={() => handleAdjustStamps(c.phone, -1, c.stampsCount, c.customerName)}
                            disabled={c.stampsCount <= 0 || isProcessing === c.phone}
                            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                            title="إنقاص ختم (-1)"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-1.5 font-mono text-[11px] font-bold text-amber-400">
                            {c.stampsCount}
                          </span>
                          <button
                            onClick={() => handleAdjustStamps(c.phone, 1, c.stampsCount, c.customerName)}
                            disabled={c.stampsCount >= 10 || isProcessing === c.phone}
                            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                            title="إضافة ختم (+1)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Redeem Button if Eligible */}
                        {isEligible && (
                          redeemConfirmPhone === c.phone ? (
                            <div className="flex items-center gap-1 bg-amber-950/90 border border-amber-500/50 p-1 rounded-lg">
                              <span className="text-[10px] text-amber-300 font-bold px-1">صرف؟</span>
                              <button
                                onClick={() => handleRedeem(c.phone)}
                                disabled={isProcessing === c.phone}
                                className="px-1.5 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded text-[10px] font-black cursor-pointer"
                              >
                                نعم
                              </button>
                              <button
                                onClick={() => setRedeemConfirmPhone(null)}
                                className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded text-[10px] cursor-pointer"
                              >
                                لا
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setRedeemConfirmPhone(c.phone)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 font-bold text-[11px] flex items-center gap-1 shadow-sm hover:from-emerald-400 hover:to-teal-300 cursor-pointer active:scale-95 transition-all"
                              title="صرف وتأكيد الحلاقة المجانية"
                            >
                              <Gift className="w-3 h-3" />
                              <span>صرف الهدية</span>
                            </button>
                          )
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ================= CARDS VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCustomers.map((c) => {
            const isEligible = c.stampsCount >= 10 || c.freeHaircutAvailable;
            const isNearing = c.stampsCount >= 8 && c.stampsCount < 10;
            const percentage = Math.min(100, (c.stampsCount / 10) * 100);

            return (
              <div
                key={c.phone}
                className={`p-5 rounded-2xl bg-[#121620] border transition-all duration-200 space-y-4 ${
                  isEligible
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10 bg-gradient-to-br from-emerald-500/10 via-[#121620] to-[#121620]'
                    : isNearing
                    ? 'border-amber-500/60 shadow-lg shadow-amber-500/10 bg-gradient-to-br from-amber-500/10 via-[#121620] to-[#121620]'
                    : 'border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Header Info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{c.customerName || 'زبون الصالون'}</h4>
                      {isEligible ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-emerald-400 to-teal-300 text-neutral-950 flex items-center gap-1 shadow-sm">
                          <Gift className="w-3 h-3" />
                          <span>مؤهل لحلاقة مجانية!</span>
                        </span>
                      ) : isNearing ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>اقترب من المكافأة 🔥</span>
                        </span>
                      ) : null}
                    </div>

                    <a
                      href={`tel:${c.phone}`}
                      dir="ltr"
                      className="text-xs text-neutral-400 hover:text-amber-400 flex items-center gap-1 font-mono mt-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{c.phone}</span>
                    </a>
                  </div>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `مرحباً أخي ${c.customerName || ''} 💈 تحياتنا من صالون عبود!\n` +
                      (isEligible
                        ? `نهنئك بحرارة! 🎉 لقد أكملت 10 أختام في بطاقة ولائك، وحلاقتك القادمة بالكامل مجانية هدية منا! نتشرف بحضورك بأي وقت.`
                        : isNearing
                        ? `يسعدنا إعلامك بأنك اقتربت من الحصول على الحلاقة المجانية! رصيدك الحالي هو ${c.stampsCount} أختام (باقي لك ${10 - c.stampsCount} فقط). بانتظار تشريفك!`
                        : `رصيد بطاقة ولائك الحالية هو: ${c.stampsCount} من 10 أختام. كل حلاقة تقربك من هديتك المجانية!`)
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-emerald-950/60 text-neutral-300 hover:text-emerald-300 border border-neutral-800 hover:border-emerald-500/30 text-xs flex items-center gap-1 transition-colors"
                    title="مراسلة الزبون بخصوص بطاقة الولاء عبر واتساب"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">واتساب</span>
                  </a>
                </div>

                {/* 10 Visual Stamp Circles */}
                <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>الأختام المكتسبة:</span>
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {c.stampsCount} / 10
                    </span>
                  </div>

                  {/* Stamp Nodes 1 to 10 */}
                  <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const isStamped = idx < c.stampsCount;
                      const isTenth = idx === 9;

                      return (
                        <div
                          key={idx}
                          className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                            isStamped
                              ? isTenth
                                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-neutral-950 ring-2 ring-amber-400 shadow-md shadow-amber-500/30'
                                : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-neutral-950 shadow-sm'
                              : isTenth
                              ? 'bg-neutral-900 border border-dashed border-amber-500/40 text-amber-500/60'
                              : 'bg-neutral-900 border border-dashed border-neutral-700 text-neutral-600'
                          }`}
                          title={`الختم رقم ${idx + 1}${isTenth ? ' (حلاقة مجانية)' : ''}`}
                        >
                          {isStamped ? (
                            isTenth ? <Gift className="w-3 h-3 text-neutral-950" /> : <Scissors className="w-2.5 h-2.5 text-neutral-950" />
                          ) : (
                            isTenth ? <Gift className="w-2.5 h-2.5 text-amber-500/50" /> : <span>{idx + 1}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Line */}
                  <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        isEligible
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                          : isNearing
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          : 'bg-neutral-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Lifetime Stats & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-3 text-neutral-400">
                    <span>
                      الزيارات: <strong className="text-white font-mono">{c.completedVisits || c.stampsCount || 0}</strong>
                    </span>
                    {Boolean(c.freeHaircutsRedeemed) && (
                      <span>
                        هدايا مصروفة: <strong className="text-emerald-400 font-mono">{c.freeHaircutsRedeemed}</strong>
                      </span>
                    )}
                  </div>

                  {/* Manual adjustment or Redeem button */}
                  <div className="flex items-center gap-2">
                    {/* Manual + / - buttons */}
                    <div className="flex items-center bg-neutral-900 rounded-xl border border-neutral-800 p-0.5">
                      <button
                        onClick={() => handleAdjustStamps(c.phone, -1, c.stampsCount, c.customerName)}
                        disabled={c.stampsCount <= 0 || isProcessing === c.phone}
                        className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer"
                        title="إنقاص ختم (-1)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono text-[11px] font-bold text-amber-400">
                        {c.stampsCount}
                      </span>
                      <button
                        onClick={() => handleAdjustStamps(c.phone, 1, c.stampsCount, c.customerName)}
                        disabled={c.stampsCount >= 10 || isProcessing === c.phone}
                        className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg disabled:opacity-30 cursor-pointer"
                        title="إضافة ختم يدوي (+1)"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Redeem Button if Eligible */}
                    {isEligible && (
                      redeemConfirmPhone === c.phone ? (
                        <div className="flex items-center gap-1.5 bg-amber-950/90 border border-amber-500/50 p-1 rounded-xl">
                          <span className="text-[10px] text-amber-300 font-bold px-1">صرف الحلاقة المجانية؟</span>
                          <button
                            onClick={() => handleRedeem(c.phone)}
                            disabled={isProcessing === c.phone}
                            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                          >
                            نعم، صرف
                          </button>
                          <button
                            onClick={() => setRedeemConfirmPhone(null)}
                            className="px-1.5 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[10px] cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRedeemConfirmPhone(c.phone)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-neutral-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                          title="صرف وتأكيد الحلاقة المجانية وتصفير العداد إلى 0"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>صرف الحلاقة المجانية</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
