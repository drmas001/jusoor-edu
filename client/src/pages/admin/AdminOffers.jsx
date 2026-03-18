import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ShieldCheck,
  CreditCard,
  Loader2,
  Lock,
  Unlock,
  Send,
} from 'lucide-react';

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter && statusFilter !== 'held') params.status = statusFilter;
      const res = await api.get('/admin/offers', { params });
      let data = res.data;
      // Filter held payments (payment held but not released)
      if (statusFilter === 'held') {
        data = data.filter(o => o.isPaymentHeld && !o.isPaymentReleased);
      }
      setOffers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  const handleApprove = async (offerId) => {
    setActionLoading(offerId);
    try {
      await api.put(`/admin/offers/${offerId}/approve`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId) => {
    if (!confirm('هل أنت متأكد من رفض هذا العرض؟ سيتم إرجاع الرسوم للمعلم.')) return;
    setActionLoading(offerId);
    try {
      await api.put(`/admin/offers/${offerId}/reject`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReleasePayment = async (offerId) => {
    if (!confirm('هل أنت متأكد من تحرير الدفعة للمعلم؟')) return;
    setActionLoading(offerId);
    try {
      await api.put(`/admin/offers/${offerId}/release-payment`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig = {
    pending: { label: 'قيد التفاوض', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    admin_review: { label: 'بانتظار المراجعة', color: 'bg-violet-100 text-violet-700', icon: ShieldCheck },
    accepted: { label: 'مقبول', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-700', icon: XCircle },
    completed: { label: 'مكتمل', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  };

  // Count admin_review offers for alert badge
  const reviewCount = offers.filter(o => o.status === 'admin_review').length;
  const heldCount = offers.filter(o => o.isPaymentHeld && !o.isPaymentReleased).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">إدارة العروض</h1>
        {reviewCount > 0 && (
          <div className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 animate-pulse">
            <ShieldCheck size={16} />
            {reviewCount} عرض بانتظار المراجعة
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: '', label: 'الكل' },
          { value: 'admin_review', label: '⏳ بانتظار المراجعة' },
          { value: 'pending', label: 'قيد التفاوض' },
          { value: 'accepted', label: 'مقبولة' },
          { value: 'rejected', label: 'مرفوضة' },
          { value: 'completed', label: 'مكتملة' },
          { value: 'held', label: '🔒 دفعات محجوزة' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-400">{offers.length} عرض</p>

      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-12 text-gray-400">لا توجد عروض</div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => {
            const cfg = statusConfig[offer.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isAdminReview = offer.status === 'admin_review';
            return (
              <div
                key={offer._id}
                className={`bg-white rounded-xl p-4 shadow-sm border ${isAdminReview ? 'border-violet-300 ring-2 ring-violet-100' : 'border-gray-100'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <span className="font-medium text-gray-800">
                        {offer.studentId?.name || 'طالب محذوف'}
                      </span>
                      <span>←</span>
                      <span className="font-medium text-gray-800">
                        {offer.teacherId?.name || 'معلم محذوف'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {offer.subject} • {offer.mode === 'in-person' ? 'حضوري' : 'عن بُعد'}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.color}`}>
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">السعر الحالي</span>
                    <span className="text-lg font-bold text-blue-600">{offer.price} ر.س</span>
                  </div>
                  {offer.priceHistory?.length > 1 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <ArrowUpDown size={12} />
                      <span>تاريخ الأسعار: {offer.priceHistory.join(' → ')}</span>
                    </div>
                  )}
                </div>

                {/* Payment status */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                  <div className="flex flex-wrap gap-3">
                    <span className={`flex items-center gap-1 font-bold ${offer.isFeePaid ? 'text-green-600' : 'text-red-500'}`}>
                      <CreditCard size={11} />
                      الرسوم: {offer.isFeePaid ? '✓ مدفوعة' : '✗ غير مدفوعة'}
                    </span>
                    {offer.isPaymentHeld && (
                      <span className={`flex items-center gap-1 font-bold ${offer.isPaymentReleased ? 'text-emerald-600' : 'text-orange-600'}`}>
                        {offer.isPaymentReleased ? <Unlock size={11} /> : <Lock size={11} />}
                        الدفعة: {offer.isPaymentReleased ? '✓ محررة' : '🔒 محجوزة'} ({offer.price} ر.س)
                      </span>
                    )}
                    <span>آخر إجراء: {offer.lastActionBy === 'student' ? 'الطالب' : 'المعلم'}</span>
                  </div>
                  <span>{new Date(offer.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>

                {/* Admin Actions for admin_review offers */}
                {isAdminReview && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    {/* Student balance check */}
                    <div className={`rounded-lg p-2.5 text-xs font-bold flex items-center justify-between ${
                      (offer.studentId?.balance || 0) >= offer.price
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      <span>رصيد الطالب: {offer.studentId?.balance || 0} ر.س</span>
                      <span>المطلوب: {offer.price} ر.س</span>
                      <span>{(offer.studentId?.balance || 0) >= offer.price ? '✓ كافٍ' : '✗ غير كافٍ'}</span>
                    </div>
                    <p className="text-[11px] text-violet-500 font-medium">عند الموافقة سيتم حجز {offer.price} ر.س من رصيد الطالب حتى إكمال الجلسة</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(offer._id)}
                        disabled={actionLoading === offer._id || !offer.isFeePaid || (offer.studentId?.balance || 0) < offer.price}
                        className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === offer._id ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : (
                          <CheckCircle size={15} />
                        )}
                        {!offer.isFeePaid ? 'لم يتم دفع الرسوم' : (offer.studentId?.balance || 0) < offer.price ? 'رصيد الطالب غير كافٍ' : 'موافقة وحجز المبلغ'}
                      </button>
                      <button
                        onClick={() => handleReject(offer._id)}
                        disabled={actionLoading === offer._id}
                        className="px-6 py-2.5 border-2 border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                )}

                {/* Release payment for completed offers with held payment */}
                {offer.status === 'completed' && offer.isPaymentHeld && !offer.isPaymentReleased && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs font-bold text-orange-700 flex items-center gap-2">
                      <Lock size={13} />
                      مبلغ محجوز: {offer.price} ر.س — الجلسة مكتملة، بانتظار تحرير الدفعة للمعلم
                    </div>
                    {offer.mode === 'in-person' && (
                      <div className={`rounded-lg p-2.5 text-xs font-bold flex items-center gap-2 ${
                        offer.attendance?.studentConfirmed
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                        {offer.attendance?.studentConfirmed ? '✓ الطالب أكّد حضور المعلم' : '✗ الطالب لم يؤكد الحضور بعد'}
                      </div>
                    )}
                    <button
                      onClick={() => handleReleasePayment(offer._id)}
                      disabled={actionLoading === offer._id || (offer.mode === 'in-person' && !offer.attendance?.studentConfirmed)}
                      className="w-full bg-gradient-to-l from-violet-600 to-purple-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-violet-700 hover:to-purple-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-violet-200"
                    >
                      {actionLoading === offer._id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Send size={15} />
                      )}
                      تحرير {offer.price} ر.س للمعلم
                    </button>
                  </div>
                )}

                {/* Payment already released */}
                {offer.isPaymentReleased && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <Unlock size={13} />
                    تم تحرير {offer.price} ر.س للمعلم بنجاح
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
