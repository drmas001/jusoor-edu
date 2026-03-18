import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  DollarSign,
} from 'lucide-react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/admin/transactions', { params });
      setTransactions(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter]);

  const typeConfig = {
    deposit: { label: 'إيداع', icon: ArrowDownCircle, color: 'text-green-600' },
    withdrawal: { label: 'سحب', icon: ArrowUpCircle, color: 'text-red-600' },
    platform_fee: { label: 'رسوم المنصة', icon: CreditCard, color: 'text-orange-600' },
    session_payment: { label: 'دفع جلسة', icon: DollarSign, color: 'text-blue-600' },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">سجل المعاملات</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: 'الكل' },
          { value: 'deposit', label: 'إيداع' },
          { value: 'platform_fee', label: 'رسوم المنصة' },
          { value: 'session_payment', label: 'دفع جلسات' },
          { value: 'withdrawal', label: 'سحب' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              typeFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-400">{transactions.length} معاملة</p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">لا توجد معاملات</div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const cfg = typeConfig[tx.type] || typeConfig.deposit;
            const Icon = cfg.icon;
            const roleLabel =
              tx.userId?.role === 'student'
                ? 'طالب'
                : tx.userId?.role === 'teacher'
                ? 'معلم'
                : '';
            return (
              <div
                key={tx._id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={cfg.color}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{cfg.label}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{tx.userId?.name || 'مستخدم محذوف'}</span>
                      {roleLabel && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                          {roleLabel}
                        </span>
                      )}
                      {tx.userId?.phone && <span dir="ltr">{tx.userId.phone}</span>}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
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
                  className={`font-bold text-lg ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount} ر.س
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
