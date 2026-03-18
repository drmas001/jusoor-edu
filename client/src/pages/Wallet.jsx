import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  DollarSign,
  Loader2,
  Receipt,
  X,
  Coins,
  CheckCircle,
  Smartphone,
  ShieldCheck,
  ChevronLeft,
  Landmark,
  Send,
  BadgeCheck,
  Pencil,
} from 'lucide-react';

// Apple Pay SVG icon
const ApplePayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M7.076 7.907c-.39.463-.966.822-1.553.77-.074-.588.213-1.217.55-1.604.39-.463 1.058-.78 1.508-.803.062.6-.176 1.187-.505 1.637zm.503.885c-.86-.05-1.594.49-2.003.49s-1.04-.464-1.716-.452c-.883.013-1.7.516-2.153 1.305-.922 1.585-.238 3.935.657 5.226.437.638.96 1.343 1.648 1.318.657-.025.909-.426 1.703-.426.795 0 1.022.426 1.716.413.713-.013 1.16-.638 1.597-1.28.496-.73.7-1.436.713-1.473-.013-.013-1.372-.53-1.384-2.1-.013-1.318 1.072-1.95 1.122-1.975-.613-.91-1.565-1.01-1.9-1.046zm5.79-1.795v11h1.56V13.1h2.16c1.974 0 3.362-1.356 3.362-3.35 0-1.995-1.362-3.352-3.31-3.352H13.37zm1.56 1.332h1.8c1.355 0 2.128.723 2.128 1.996 0 1.272-.773 2.003-2.136 2.003h-1.792V8.33z"/>
  </svg>
);

// Google Pay SVG icon  
const GooglePayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M11.99 13.9v-3.72h7.18c.07.39.11.84.11 1.33 0 1.62-.44 3.63-1.87 5.06-1.38 1.45-3.14 2.23-5.42 2.23-4.28 0-7.89-3.49-7.89-7.77s3.61-7.77 7.89-7.77c2.15 0 3.68.84 4.82 1.93l-2.03 2.03c-.82-.77-1.93-1.37-2.79-1.37-2.4 0-4.27 1.92-4.27 5.18s1.87 5.18 4.27 5.18c2.17 0 3.22-1.37 3.55-2.31h-3.55z"/>
  </svg>
);

export default function Wallet() {
  const { user, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositStep, setDepositStep] = useState(1); // 1=amount, 2=method, 3=processing, 4=success
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState('');

  // Teacher bank account & withdraw
  const [bankName, setBankName] = useState(user?.bankAccount?.bankName || '');
  const [iban, setIban] = useState(user?.bankAccount?.iban || '');
  const [accountHolder, setAccountHolder] = useState(user?.bankAccount?.accountHolder || '');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState('');
  const [editingBank, setEditingBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    api
      .get('/wallet/transactions')
      .then((res) => setTransactions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const resetDeposit = () => {
    setShowDeposit(false);
    setDepositStep(1);
    setAmount('');
    setPaymentMethod(null);
    setPaymentResult(null);
    setError('');
    setProcessing(false);
  };

  const handlePayment = async () => {
    if (!amount || Number(amount) <= 0 || !paymentMethod) return;
    setError('');
    setProcessing(true);
    setDepositStep(3);

    try {
      const res = await api.post('/payments/create-charge', {
        amount: Number(amount),
        method: paymentMethod,
        type: 'wallet_deposit',
      });

      if (res.data.success) {
        setPaymentResult(res.data.payment);
        setDepositStep(4);
        await refreshUser();
        const txRes = await api.get('/wallet/transactions');
        setTransactions(txRes.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في معالجة الدفع');
      setDepositStep(2);
    } finally {
      setProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      icon: ApplePayIcon,
      bg: 'bg-black',
      textColor: 'text-white',
      borderActive: 'border-black',
      desc: 'ادفع بسرعة عبر Apple Pay',
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      icon: GooglePayIcon,
      bg: 'bg-white',
      textColor: 'text-gray-800',
      borderActive: 'border-blue-500',
      desc: 'ادفع عبر حساب Google',
    },
    {
      id: 'credit_card',
      name: 'بطاقة ائتمانية',
      icon: () => <CreditCard size={20} />,
      bg: 'bg-gradient-to-r from-violet-500 to-purple-600',
      textColor: 'text-white',
      borderActive: 'border-violet-500',
      desc: 'Visa, Mastercard, مدى',
    },
  ];

  const handleSaveBank = async () => {
    setBankSaving(true);
    setBankMsg('');
    try {
      await api.put('/wallet/bank-account', { bankName, iban, accountHolder });
      await refreshUser();
      setBankMsg('تم حفظ الحساب البنكي بنجاح');
      setEditingBank(false);
    } catch (err) {
      setBankMsg(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setBankSaving(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawMsg('');
    try {
      const res = await api.post('/wallet/withdraw', { amount: Number(withdrawAmount) });
      setWithdrawMsg(res.data.message);
      setWithdrawAmount('');
      await refreshUser();
      const txRes = await api.get('/wallet/transactions');
      setTransactions(txRes.data);
    } catch (err) {
      setWithdrawMsg(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setWithdrawing(false);
    }
  };

  const hasBankAccount = user?.bankAccount?.iban && user?.bankAccount?.bankName;

  const typeConfig = {
    deposit: { label: 'إيداع', icon: ArrowDownCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    withdrawal: { label: 'سحب للبنك', icon: ArrowUpCircle, color: 'text-red-500', bg: 'bg-red-50' },
    platform_fee: { label: 'رسوم المنصة', icon: CreditCard, color: 'text-amber-600', bg: 'bg-amber-50' },
    session_payment: { label: 'دفع جلسة', icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-50' },
    session_earning: { label: 'أرباح جلسة', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    refund: { label: 'استرداد', icon: ArrowDownCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <WalletIcon size={22} className="text-emerald-500" />
        المحفظة
      </h1>

      {/* Balance Card */}
      <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute -top-4 -left-4 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute bottom-2 right-8 w-20 h-20 border-2 border-white rounded-full" />
          <div className="absolute top-6 right-1/4 w-6 h-6 border-2 border-white rounded-lg rotate-45" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Coins size={20} className="text-amber-300" />
            </div>
            <span className="text-emerald-100 font-medium">الرصيد الحالي</span>
          </div>
          <p className="text-4xl font-extrabold mb-4">{user?.balance || 0} ر.س</p>
          <button
            onClick={() => setShowDeposit(true)}
            className="bg-white/20 backdrop-blur text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white/30 transition flex items-center gap-2 cursor-pointer border border-white/20"
          >
            <Plus size={18} />
            إيداع رصيد
          </button>
        </div>
      </div>

      {/* Teacher: Bank Account & Withdraw */}
      {user?.role === 'teacher' && (
        <>
          {/* Bank Account Card */}
          <div className="edu-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark size={18} className="text-blue-600" />
                <span className="font-extrabold text-gray-800">الحساب البنكي</span>
              </div>
              {hasBankAccount && !editingBank && (
                <button
                  onClick={() => setEditingBank(true)}
                  className="text-xs text-blue-500 font-bold flex items-center gap-1 hover:text-blue-700 transition cursor-pointer"
                >
                  <Pencil size={12} />
                  تعديل
                </button>
              )}
            </div>

            {hasBankAccount && !editingBank ? (
              <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">البنك</span>
                  <span className="font-bold text-gray-800">{user.bankAccount.bankName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">IBAN</span>
                  <span className="font-mono text-xs text-gray-700 font-bold" dir="ltr">{user.bankAccount.iban}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">اسم صاحب الحساب</span>
                  <span className="font-bold text-gray-800">{user.bankAccount.accountHolder}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <BadgeCheck size={12} />
                  <span className="font-bold">حساب بنكي مُسجّل</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">اسم البنك</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="edu-input text-sm"
                  >
                    <option value="">اختر البنك</option>
                    <option value="الراجحي">مصرف الراجحي</option>
                    <option value="الأهلي">البنك الأهلي السعودي</option>
                    <option value="الإنماء">مصرف الإنماء</option>
                    <option value="الرياض">بنك الرياض</option>
                    <option value="البلاد">بنك البلاد</option>
                    <option value="الجزيرة">بنك الجزيرة</option>
                    <option value="العربي">البنك العربي الوطني</option>
                    <option value="سامبا">بنك سامبا</option>
                    <option value="الفرنسي">البنك السعودي الفرنسي</option>
                    <option value="ساب">بنك ساب</option>
                    <option value="stc pay">STC Pay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">رقم IBAN</label>
                  <input
                    type="text"
                    value={iban}
                    onChange={(e) => setIban(e.target.value)}
                    placeholder="SA0000000000000000000000"
                    className="edu-input text-sm font-mono"
                    dir="ltr"
                    maxLength={24}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">يبدأ بـ SA ويتكون من 24 حرف</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">اسم صاحب الحساب</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="الاسم كما في البطاقة البنكية"
                    className="edu-input text-sm"
                  />
                </div>

                {bankMsg && (
                  <div className={`text-xs font-bold p-2.5 rounded-lg ${bankMsg.includes('بنجاح') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {bankMsg}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBank}
                    disabled={bankSaving || !bankName || !iban || !accountHolder}
                    className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                  >
                    {bankSaving ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                    حفظ الحساب البنكي
                  </button>
                  {editingBank && (
                    <button
                      onClick={() => {
                        setEditingBank(false);
                        setBankName(user?.bankAccount?.bankName || '');
                        setIban(user?.bankAccount?.iban || '');
                        setAccountHolder(user?.bankAccount?.accountHolder || '');
                        setBankMsg('');
                      }}
                      className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 font-bold hover:bg-gray-50 transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Withdraw to Bank */}
          {hasBankAccount && (
            <div className="edu-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-violet-600" />
                  <span className="font-extrabold text-gray-800">تحويل للحساب البنكي</span>
                </div>
                <span className="text-xs text-gray-400">الحد الأدنى 100 ر.س</span>
              </div>

              {(user?.balance || 0) >= 100 ? (
                !showWithdraw ? (
                  <button
                    onClick={() => setShowWithdraw(true)}
                    className="w-full bg-gradient-to-l from-violet-600 to-purple-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-violet-700 hover:to-purple-700 transition cursor-pointer shadow-md shadow-violet-200"
                  >
                    <Send size={16} />
                    تحويل الرصيد إلى {user.bankAccount.bankName}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">مبلغ التحويل (ر.س)</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="100"
                        className="edu-input text-xl font-extrabold text-center"
                        min="100"
                        max={user?.balance || 0}
                        dir="ltr"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 200, user?.balance || 0].filter(v => v >= 100 && v <= (user?.balance || 0)).map((val, i) => (
                        <button
                          key={i}
                          onClick={() => setWithdrawAmount(String(val))}
                          className={`py-2 rounded-xl text-sm font-bold transition cursor-pointer border-2 ${
                            Number(withdrawAmount) === val
                              ? 'border-violet-500 bg-violet-50 text-violet-700'
                              : 'border-gray-200 text-gray-500 hover:border-violet-200'
                          }`}
                        >
                          {val === (user?.balance || 0) ? `الكل (${val})` : val}
                        </button>
                      ))}
                    </div>

                    {withdrawMsg && (
                      <div className={`text-xs font-bold p-2.5 rounded-lg ${withdrawMsg.includes('بنجاح') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {withdrawMsg}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < 100}
                        className="flex-1 bg-gradient-to-l from-violet-600 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {withdrawing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        تحويل {withdrawAmount || 0} ر.س
                      </button>
                      <button
                        onClick={() => { setShowWithdraw(false); setWithdrawAmount(''); setWithdrawMsg(''); }}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 font-bold hover:bg-gray-50 transition cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-400 font-bold">رصيدك الحالي {user?.balance || 0} ر.س</p>
                  <p className="text-xs text-gray-400 mt-1">تحتاج على الأقل 100 ر.س للتحويل</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Payment Methods Info */}
      <div className="edu-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-sm font-bold text-gray-700">طرق الدفع المتاحة</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black rounded-lg px-3 py-1.5">
            <ApplePayIcon />
            <span className="text-white text-xs font-bold">Apple Pay</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <GooglePayIcon />
            <span className="text-gray-700 text-xs font-bold">Google Pay</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg px-3 py-1.5">
            <CreditCard size={14} className="text-white" />
            <span className="text-white text-xs font-bold">بطاقة</span>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md relative">
            <button
              onClick={resetDeposit}
              className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Step 1: Amount Selection */}
            {depositStep === 1 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                    <Plus size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-800">إيداع رصيد</h2>
                    <p className="text-xs text-gray-400">اختر المبلغ المراد إيداعه</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">المبلغ (ر.س)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="أدخل المبلغ"
                      className="edu-input text-2xl font-extrabold text-center"
                      min="1"
                      dir="ltr"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[25, 50, 100, 200].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(String(val))}
                        className={`py-3 rounded-xl text-sm font-bold transition cursor-pointer border-2 ${
                          Number(amount) === val
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-500 hover:border-emerald-200'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (amount && Number(amount) > 0) setDepositStep(2);
                    }}
                    disabled={!amount || Number(amount) <= 0}
                    className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 mt-2"
                  >
                    متابعة للدفع
                    <ChevronLeft size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method Selection */}
            {depositStep === 2 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => setDepositStep(1)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition cursor-pointer"
                  >
                    <ChevronLeft size={18} className="rotate-180" />
                  </button>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">اختر طريقة الدفع</h2>
                    <p className="text-xs text-gray-400">المبلغ: <span className="font-bold text-emerald-600">{amount} ر.س</span></p>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-3 mt-4">
                  {paymentMethods.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = paymentMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition cursor-pointer ${
                          isSelected
                            ? `${pm.borderActive} bg-gray-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl ${pm.bg} flex items-center justify-center ${pm.textColor} shadow-md`}>
                          <Icon />
                        </div>
                        <div className="text-right flex-1">
                          <p className="font-bold text-gray-800">{pm.name}</p>
                          <p className="text-xs text-gray-400">{pm.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={!paymentMethod}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mt-4 transition cursor-pointer disabled:opacity-40 ${
                    paymentMethod === 'apple_pay'
                      ? 'bg-black text-white hover:bg-gray-900'
                      : paymentMethod === 'google_pay'
                      ? 'bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-50'
                      : 'btn-primary'
                  }`}
                >
                  <ShieldCheck size={16} />
                  {paymentMethod === 'apple_pay'
                    ? `ادفع ${amount} ر.س عبر Apple Pay`
                    : paymentMethod === 'google_pay'
                    ? `ادفع ${amount} ر.س عبر Google Pay`
                    : `ادفع ${amount} ر.س بالبطاقة`}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-gray-400">
                  <ShieldCheck size={12} />
                  <span>جميع المعاملات مشفرة وآمنة</span>
                </div>
              </div>
            )}

            {/* Step 3: Processing */}
            {depositStep === 3 && (
              <div className="animate-fade-in text-center py-8">
                <div className="w-20 h-20 mx-auto mb-5 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-3 rounded-full bg-emerald-50 flex items-center justify-center">
                    {paymentMethod === 'apple_pay' ? (
                      <ApplePayIcon />
                    ) : paymentMethod === 'google_pay' ? (
                      <GooglePayIcon />
                    ) : (
                      <CreditCard size={20} className="text-violet-500" />
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-extrabold text-gray-800 mb-1">جاري معالجة الدفع</h3>
                <p className="text-sm text-gray-400">يرجى الانتظار...</p>
                <div className="mt-4 bg-gray-50 rounded-xl p-3 inline-flex items-center gap-2">
                  <span className="text-xs text-gray-400">المبلغ:</span>
                  <span className="text-sm font-extrabold text-emerald-600">{amount} ر.س</span>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {depositStep === 4 && paymentResult && (
              <div className="animate-fade-in text-center py-6">
                <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle size={40} className="text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-800 mb-1">تمت العملية بنجاح!</h3>
                <p className="text-sm text-gray-400 mb-4">تم إيداع الرصيد في محفظتك</p>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">المبلغ</span>
                    <span className="font-extrabold text-emerald-700">{paymentResult.amount} ر.س</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">طريقة الدفع</span>
                    <span className="font-bold text-gray-700">{paymentResult.cardInfo?.brand}</span>
                  </div>
                  {paymentResult.cardInfo?.last4 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">البطاقة</span>
                      <span className="font-bold text-gray-700" dir="ltr">•••• {paymentResult.cardInfo.last4}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">رقم العملية</span>
                    <span className="font-mono text-[11px] text-gray-400" dir="ltr">{paymentResult.chargeId?.slice(0, 16)}...</span>
                  </div>
                </div>

                <button
                  onClick={resetDeposit}
                  className="w-full btn-primary py-3 text-sm"
                >
                  تم
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
          <Receipt size={18} className="text-teal-500" />
          سجل المعاملات
        </h2>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 size={36} className="text-emerald-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-medium">جاري التحميل...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Receipt size={28} className="text-emerald-400" />
            </div>
            <p className="text-gray-500 font-bold">لا توجد معاملات بعد</p>
            <p className="text-gray-400 text-xs mt-1">ستظهر المعاملات هنا بعد أول عملية</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const cfg = typeConfig[tx.type] || typeConfig.deposit;
            const Icon = cfg.icon;
            return (
              <div
                key={tx._id}
                className="edu-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center ${cfg.color}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{cfg.label}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-extrabold text-sm ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
                >
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount} ر.س
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
