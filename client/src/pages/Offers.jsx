import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  MapPin,
  CreditCard,
  ArrowUpDown,
  Lock,
  Unlock,
  MessageSquare,
  Loader2,
  ShieldCheck,
  X,
  Star,
  Navigation,
  UserCheck,
  CheckCheck,
  Video,
  Timer,
  ExternalLink,
} from 'lucide-react';

const ApplePayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M7.076 7.907c-.39.463-.966.822-1.553.77-.074-.588.213-1.217.55-1.604.39-.463 1.058-.78 1.508-.803.062.6-.176 1.187-.505 1.637zm.503.885c-.86-.05-1.594.49-2.003.49s-1.04-.464-1.716-.452c-.883.013-1.7.516-2.153 1.305-.922 1.585-.238 3.935.657 5.226.437.638.96 1.343 1.648 1.318.657-.025.909-.426 1.703-.426.795 0 1.022.426 1.716.413.713-.013 1.16-.638 1.597-1.28.496-.73.7-1.436.713-1.473-.013-.013-1.372-.53-1.384-2.1-.013-1.318 1.072-1.95 1.122-1.975-.613-.91-1.565-1.01-1.9-1.046zm5.79-1.795v11h1.56V13.1h2.16c1.974 0 3.362-1.356 3.362-3.35 0-1.995-1.362-3.352-3.31-3.352H13.37zm1.56 1.332h1.8c1.355 0 2.128.723 2.128 1.996 0 1.272-.773 2.003-2.136 2.003h-1.792V8.33z"/>
  </svg>
);

const GooglePayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#4285F4" d="M11.99 13.9v-3.72h7.18c.07.39.11.84.11 1.33 0 1.62-.44 3.63-1.87 5.06-1.38 1.45-3.14 2.23-5.42 2.23-4.28 0-7.89-3.49-7.89-7.77s3.61-7.77 7.89-7.77c2.15 0 3.68.84 4.82 1.93l-2.03 2.03c-.82-.77-1.93-1.37-2.79-1.37-2.4 0-4.27 1.92-4.27 5.18s1.87 5.18 4.27 5.18c2.17 0 3.22-1.37 3.55-2.31h-3.55z"/>
  </svg>
);

export default function Offers() {
  const { user, refreshUser } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [negotiateId, setNegotiateId] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [feeModal, setFeeModal] = useState(null);
  const [feeMethod, setFeeMethod] = useState(null);
  const [feeStep, setFeeStep] = useState(1);
  const [feeError, setFeeError] = useState('');
  // Review state
  const [reviewModal, setReviewModal] = useState(null); // offerId
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  // Meeting timer state
  const [meetingTimers, setMeetingTimers] = useState({}); // { offerId: remainingSeconds }
  const timerIntervals = useRef({});

  const fetchOffers = async () => {
    try {
      const res = await api.get('/offers');
      setOffers(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Meeting timer effect: calculate remaining time for active meetings
  useEffect(() => {
    // Clear old intervals
    Object.values(timerIntervals.current).forEach(clearInterval);
    timerIntervals.current = {};

    offers.forEach((offer) => {
      if (
        offer.mode === 'online' &&
        offer.status === 'accepted' &&
        offer.meeting?.startedAt &&
        offer.meeting?.link
      ) {
        const updateTimer = () => {
          const startedAt = new Date(offer.meeting.startedAt).getTime();
          const duration = (offer.meeting.duration || 45) * 60 * 1000;
          const endTime = startedAt + duration;
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setMeetingTimers((prev) => ({ ...prev, [offer._id]: remaining }));
        };
        updateTimer();
        timerIntervals.current[offer._id] = setInterval(updateTimer, 1000);
      }
    });

    return () => {
      Object.values(timerIntervals.current).forEach(clearInterval);
    };
  }, [offers]);

  const handleNegotiate = async (offerId) => {
    if (!newPrice || Number(newPrice) <= 0) return;
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/negotiate`, { price: Number(newPrice) });
      setNegotiateId(null);
      setNewPrice('');
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (offerId) => {
    // For teacher: check if fee is paid first
    const offer = offers.find(o => o._id === offerId);
    if (user?.role === 'teacher' && offer && !offer.isFeePaid) {
      // Open fee payment modal first
      handlePayFee(offerId);
      return;
    }
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/accept`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (offerId) => {
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/reject`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePayFee = (offerId) => {
    setFeeModal(offerId);
    setFeeMethod(null);
    setFeeStep(1);
    setFeeError('');
  };

  const handleFeePayment = async () => {
    if (!feeMethod || !feeModal) return;
    setFeeError('');
    setFeeStep(2);

    try {
      // Use new payment gateway for fee
      await api.post('/payments/create-charge', {
        amount: 15,
        method: feeMethod,
        type: 'platform_fee',
        offerId: feeModal,
      });

      // Mark fee as paid on the offer
      await api.post(`/offers/${feeModal}/pay-fee`);
      // If offer is still pending, auto-accept (sends to admin_review)
      const currentOffer = offers.find(o => o._id === feeModal);
      if (currentOffer && currentOffer.status === 'pending') {
        await api.put(`/offers/${feeModal}/accept`);
      }
      setFeeStep(3);
      await fetchOffers();
      await refreshUser();
    } catch (err) {
      setFeeError(err.response?.data?.message || 'فشل في معالجة الدفع');
      setFeeStep(1);
    }
  };

  // Complete session
  // Start online meeting
  const handleStartMeeting = async (offerId) => {
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/start-meeting`);
      await fetchOffers();
      // Open meeting link in new tab
      const offer = offers.find((o) => o._id === offerId);
      if (offer?.meeting?.link) {
        window.open(offer.meeting.link, '_blank');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  // Join existing meeting (just open link)
  const handleJoinMeeting = (offer) => {
    if (offer?.meeting?.link) {
      window.open(offer.meeting.link, '_blank');
    }
  };

  const handleComplete = async (offerId) => {
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/complete`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  // Teacher signals arrival
  const handleTeacherArrived = async (offerId) => {
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/teacher-arrived`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  // Student confirms attendance
  const handleStudentConfirm = async (offerId) => {
    setActionLoading(offerId);
    try {
      await api.put(`/offers/${offerId}/student-confirm`);
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading(null);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewModal) return;
    setReviewLoading(true);
    try {
      await api.post('/reviews', {
        offerId: reviewModal,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewModal(null);
      setReviewRating(0);
      setReviewComment('');
      await fetchOffers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setReviewLoading(false);
    }
  };

  const closeFeeModal = () => {
    setFeeModal(null);
    setFeeMethod(null);
    setFeeStep(1);
    setFeeError('');
  };

  const feePaymentMethods = [
    { id: 'apple_pay', name: 'Apple Pay', icon: ApplePayIcon, bg: 'bg-black', text: 'text-white', border: 'border-black' },
    { id: 'google_pay', name: 'Google Pay', icon: GooglePayIcon, bg: 'bg-white', text: 'text-gray-800', border: 'border-blue-500' },
    { id: 'credit_card', name: 'بطاقة ائتمانية', icon: () => <CreditCard size={18} />, bg: 'bg-gradient-to-r from-violet-500 to-purple-600', text: 'text-white', border: 'border-violet-500' },
  ];

  const statusConfig = {
    pending: { label: 'قيد التفاوض', color: 'bg-amber-50 text-amber-600 border border-amber-200', icon: Clock },
    admin_review: { label: 'بانتظار موافقة الإدارة', color: 'bg-violet-50 text-violet-600 border border-violet-200', icon: ShieldCheck },
    accepted: { label: 'مقبول', color: 'bg-emerald-50 text-emerald-600 border border-emerald-200', icon: CheckCircle },
    rejected: { label: 'مرفوض', color: 'bg-red-50 text-red-600 border border-red-200', icon: XCircle },
    completed: { label: 'مكتمل', color: 'bg-teal-50 text-teal-600 border border-teal-200', icon: CheckCircle },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <MessageSquare size={22} className="text-emerald-500" />
        العروض والتفاوض
      </h1>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={36} className="text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 font-medium">جاري التحميل...</p>
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-emerald-400" />
          </div>
          <p className="text-gray-500 font-bold text-lg">لا توجد عروض حالياً</p>
          <p className="text-gray-400 text-sm mt-1">ستظهر العروض هنا عند إرسالها أو استقبالها</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const other =
              user?.role === 'student' ? offer.teacherId : offer.studentId;
            const cfg = statusConfig[offer.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const canRespond =
              offer.status === 'pending' && offer.lastActionBy !== user?.role;
            const isTeacherView = user?.role === 'teacher';
            const showContact =
              isTeacherView && offer.status === 'accepted' && offer.isFeePaid;

            return (
              <div
                key={offer._id}
                className="edu-card p-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">
                      {other?.name?.charAt(0) || '؟'}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{other?.name}</h3>
                      <p className="text-xs text-gray-400">
                        {offer.subject} •{' '}
                        {offer.mode === 'in-person' ? 'حضوري' : 'عن بُعد'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 ${cfg.color}`}
                  >
                    <StatusIcon size={12} />
                    {cfg.label}
                  </span>
                </div>

                {/* Price */}
                <div className="bg-gradient-to-l from-emerald-50 to-teal-50 rounded-xl p-4 mb-4 border border-emerald-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">السعر الحالي</span>
                    <span className="text-xl font-extrabold text-emerald-700">
                      {offer.price} ر.س
                    </span>
                  </div>
                  {offer.priceHistory?.length > 1 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <ArrowUpDown size={12} />
                      <span>تاريخ الأسعار: {offer.priceHistory.join(' → ')}</span>
                    </div>
                  )}
                </div>

                {/* Student contact for teacher (after fee payment) */}
                {showContact && (
                  <div className="bg-emerald-50 rounded-xl p-4 mb-4 space-y-2 border border-emerald-200">
                    <p className="text-sm font-bold text-emerald-700">معلومات التواصل:</p>
                    {offer.studentId?.phone && (
                      <a href={`tel:${offer.studentId.phone}`} className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 transition no-underline">
                        <Phone size={14} />
                        <span dir="ltr">{offer.studentId.phone}</span>
                      </a>
                    )}
                    {offer.studentId?.location && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.studentId.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-800 transition no-underline">
                        <MapPin size={14} />
                        <span>{offer.studentId.location}</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                )}

                {/* Teacher: fee paid indicator */}
                {isTeacherView && offer.isFeePaid && offer.status !== 'rejected' && (
                  <div className="bg-emerald-50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2 text-emerald-600 text-xs border border-emerald-200">
                    <CheckCircle size={12} />
                    <span className="font-bold">تم دفع رسوم المنصة</span>
                  </div>
                )}

                {/* Payment held notice */}
                {offer.isPaymentHeld && !offer.isPaymentReleased && (
                  <div className="bg-orange-50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2 text-orange-600 text-xs border border-orange-200">
                    <Lock size={12} />
                    <span className="font-bold">
                      {isTeacherView
                        ? `مبلغ ${offer.price} ر.س محجوز — سيتم تحويله لك بعد إكمال الجلسة وتأكيد الحضور`
                        : `تم حجز ${offer.price} ر.س من رصيدك حتى إكمال الجلسة`}
                    </span>
                  </div>
                )}

                {/* Payment released notice */}
                {offer.isPaymentReleased && (
                  <div className="bg-emerald-50 rounded-xl px-3 py-2 mb-4 flex items-center gap-2 text-emerald-600 text-xs border border-emerald-200">
                    <Unlock size={12} />
                    <span className="font-bold">
                      {isTeacherView
                        ? `تم تحويل ${offer.price} ر.س إلى محفظتك`
                        : `تم تحرير الدفعة ${offer.price} ر.س للمعلم`}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {/* Negotiate */}
                  {canRespond && negotiateId !== offer._id && (
                    <>
                      <button
                        onClick={() => setNegotiateId(offer._id)}
                        className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 py-2.5 rounded-xl font-bold hover:bg-amber-100 transition cursor-pointer text-sm"
                      >
                        تفاوض
                      </button>
                      <button
                        onClick={() => handleAccept(offer._id)}
                        disabled={actionLoading === offer._id}
                        className="flex-1 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-2.5 rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-600 transition disabled:opacity-50 cursor-pointer text-sm shadow-md shadow-emerald-200"
                      >
                        قبول
                      </button>
                      <button
                        onClick={() => handleReject(offer._id)}
                        disabled={actionLoading === offer._id}
                        className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition cursor-pointer text-sm font-bold"
                      >
                        رفض
                      </button>
                    </>
                  )}

                  {/* Negotiate input */}
                  {negotiateId === offer._id && (
                    <div className="w-full flex gap-2">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="السعر الجديد"
                        className="flex-1 edu-input"
                        min="1"
                        dir="ltr"
                      />
                      <button
                        onClick={() => handleNegotiate(offer._id)}
                        disabled={actionLoading === offer._id}
                        className="px-5 btn-primary text-sm"
                      >
                        إرسال
                      </button>
                      <button
                        onClick={() => {
                          setNegotiateId(null);
                          setNewPrice('');
                        }}
                        className="px-4 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition cursor-pointer text-sm font-medium"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}

                  {/* Waiting message */}
                  {offer.status === 'pending' &&
                    offer.lastActionBy === user?.role && (
                      <div className="w-full text-center py-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-400 font-medium">
                          بانتظار رد الطرف الآخر...
                        </p>
                      </div>
                    )}

                  {/* Admin review notice */}
                  {offer.status === 'admin_review' && offer.isFeePaid && (
                    <div className="w-full bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm text-violet-700 font-medium flex items-center gap-2">
                      <ShieldCheck size={14} />
                      <span>تم إرسال العرض لمراجعة الإدارة. سيتم إخطارك عند الموافقة.</span>
                    </div>
                  )}

                  {/* Admin review but teacher hasn't paid fee yet */}
                  {offer.status === 'admin_review' && !offer.isFeePaid && isTeacherView && (
                    <>
                      <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-medium flex items-center gap-2">
                        <CreditCard size={14} />
                        <span>الطالب وافق على العرض. يجب دفع رسوم المنصة لإتمام المراجعة.</span>
                      </div>
                      <button
                        onClick={() => handlePayFee(offer._id)}
                        disabled={actionLoading === offer._id}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm"
                      >
                        <CreditCard size={16} />
                        دفع رسوم المنصة (15 ر.س)
                      </button>
                    </>
                  )}

                  {/* Admin review, fee not paid, student view */}
                  {offer.status === 'admin_review' && !offer.isFeePaid && !isTeacherView && (
                    <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700 font-medium flex items-center gap-2">
                      <Clock size={14} />
                      <span>بانتظار دفع المعلم لرسوم المنصة قبل مراجعة الإدارة</span>
                    </div>
                  )}

                  {/* === ATTENDANCE SYSTEM (in-person, accepted, fee paid) === */}
                  {offer.status === 'accepted' &&
                    offer.isFeePaid &&
                    offer.mode === 'in-person' && (
                      <div className="w-full space-y-2 mt-1">
                        {/* Teacher: show student location + arrival button */}
                        {isTeacherView && !offer.attendance?.teacherArrived && (
                          <>
                            {offer.studentId?.location && (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.studentId.location)}`} target="_blank" rel="noopener noreferrer" className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-sm text-teal-700 flex items-center gap-2 no-underline hover:bg-teal-100 transition">
                                <MapPin size={14} />
                                <span>موقع الطالب: {offer.studentId.location}</span>
                                <ExternalLink size={10} className="mr-auto" />
                              </a>
                            )}
                            <button
                              onClick={() => handleTeacherArrived(offer._id)}
                              disabled={actionLoading === offer._id}
                              className="w-full bg-teal-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-700 transition cursor-pointer"
                            >
                              <Navigation size={15} />
                              وصلت إلى الموقع
                            </button>
                          </>
                        )}

                        {/* Teacher arrived - waiting for student confirmation */}
                        {offer.attendance?.teacherArrived && !offer.attendance?.studentConfirmed && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm font-medium flex items-center gap-2">
                            <Clock size={14} className="text-amber-600" />
                            <span className="text-amber-700">
                              {isTeacherView
                                ? 'بانتظار تأكيد الطالب للحضور...'
                                : 'المعلم وصل إلى موقعك!'}
                            </span>
                          </div>
                        )}

                        {/* Student: confirm attendance button */}
                        {!isTeacherView && offer.attendance?.teacherArrived && !offer.attendance?.studentConfirmed && (
                          <button
                            onClick={() => handleStudentConfirm(offer._id)}
                            disabled={actionLoading === offer._id}
                            className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition cursor-pointer"
                          >
                            <UserCheck size={15} />
                            تأكيد حضور المعلم
                          </button>
                        )}

                        {/* Attendance confirmed */}
                        {offer.attendance?.studentConfirmed && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm font-bold flex items-center gap-2 text-emerald-700">
                            <CheckCheck size={14} />
                            تم تأكيد الحضور بنجاح
                          </div>
                        )}
                      </div>
                    )}

                  {/* === ONLINE MEETING SYSTEM (online, accepted, fee paid) === */}
                  {offer.status === 'accepted' &&
                    offer.isFeePaid &&
                    offer.mode === 'online' &&
                    offer.meeting?.link && (
                      <div className="w-full space-y-2 mt-1">
                        {/* Meeting not started yet */}
                        {!offer.meeting.startedAt && (
                          <>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                              <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <Video size={22} className="text-white" />
                              </div>
                              <p className="text-sm font-bold text-blue-700 mb-1">جلسة عن بُعد جاهزة</p>
                              <p className="text-xs text-blue-500">مدة الجلسة: 45 دقيقة</p>
                            </div>
                            <button
                              onClick={() => handleStartMeeting(offer._id)}
                              disabled={actionLoading === offer._id}
                              className="w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer shadow-md shadow-blue-200"
                            >
                              {actionLoading === offer._id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Video size={16} />
                              )}
                              بدء الجلسة والانضمام للمكالمة
                            </button>
                          </>
                        )}

                        {/* Meeting in progress */}
                        {offer.meeting.startedAt && (() => {
                          const remaining = meetingTimers[offer._id] ?? 0;
                          const mins = Math.floor(remaining / 60);
                          const secs = remaining % 60;
                          const isExpired = remaining <= 0;
                          const isWarning = remaining > 0 && remaining <= 300;
                          return (
                            <>
                              <div className={`rounded-xl p-4 border ${
                                isExpired
                                  ? 'bg-red-50 border-red-200'
                                  : isWarning
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Video size={16} className={isExpired ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-blue-600'} />
                                    <span className={`text-sm font-bold ${isExpired ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-blue-700'}`}>
                                      {isExpired ? 'انتهى وقت الجلسة' : 'جلسة جارية'}
                                    </span>
                                  </div>
                                  {!isExpired && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-lg font-extrabold ${
                                      isWarning ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      <Timer size={14} />
                                      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                                    </div>
                                  )}
                                </div>
                                {/* Progress bar */}
                                {!isExpired && (
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${isWarning ? 'bg-amber-500' : 'bg-blue-500'}`}
                                      style={{ width: `${Math.min(100, (remaining / ((offer.meeting.duration || 45) * 60)) * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => handleJoinMeeting(offer)}
                                className="w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition cursor-pointer shadow-md shadow-blue-200"
                              >
                                <ExternalLink size={15} />
                                الانضمام للمكالمة
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    )}

                  {/* Complete session button */}
                  {offer.status === 'accepted' && offer.isFeePaid && (
                    <button
                      onClick={() => handleComplete(offer._id)}
                      disabled={actionLoading === offer._id}
                      className="w-full bg-gradient-to-l from-emerald-600 to-teal-600 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer mt-1 shadow-md shadow-emerald-200"
                    >
                      <CheckCircle size={15} />
                      إنهاء الجلسة
                    </button>
                  )}

                  {/* Completed: Review button for student */}
                  {offer.status === 'completed' && !isTeacherView && !offer.isReviewed && (
                    <button
                      onClick={() => {
                        setReviewModal(offer._id);
                        setReviewRating(0);
                        setReviewComment('');
                      }}
                      className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition cursor-pointer"
                    >
                      <Star size={15} />
                      قيّم المعلم
                    </button>
                  )}

                  {/* Already reviewed */}
                  {offer.status === 'completed' && offer.isReviewed && (
                    <div className="w-full text-center py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <p className="text-sm text-emerald-600 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle size={14} />
                        تم التقييم
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fee Payment Modal */}
      {feeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={closeFeeModal}
              className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Step 1: Select Payment Method */}
            {feeStep === 1 && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-800">دفع رسوم المنصة</h2>
                    <p className="text-xs text-gray-400">المبلغ: <span className="font-bold text-amber-600">15 ر.س</span></p>
                  </div>
                </div>

                {feeError && (
                  <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-3 text-sm font-medium">
                    {feeError}
                  </div>
                )}

                <div className="space-y-2.5">
                  {feePaymentMethods.map((pm) => {
                    const Icon = pm.icon;
                    const isSelected = feeMethod === pm.id;
                    return (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setFeeMethod(pm.id)}
                        className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition cursor-pointer ${
                          isSelected ? `${pm.border} bg-gray-50` : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg ${pm.bg} flex items-center justify-center ${pm.text} shadow-sm`}>
                          <Icon />
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{pm.name}</span>
                        <div className={`mr-auto w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleFeePayment}
                  disabled={!feeMethod}
                  className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2 mt-4"
                >
                  <ShieldCheck size={15} />
                  ادفع 15 ر.س
                </button>

                <p className="text-center text-[11px] text-gray-400 mt-2 flex items-center justify-center gap-1">
                  <ShieldCheck size={11} />
                  دفع آمن ومشفر
                </p>
              </div>
            )}

            {/* Step 2: Processing */}
            {feeStep === 2 && (
              <div className="animate-fade-in text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-amber-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-2.5 rounded-full bg-amber-50 flex items-center justify-center">
                    <CreditCard size={18} className="text-amber-600" />
                  </div>
                </div>
                <h3 className="font-extrabold text-gray-800 mb-1">جاري معالجة الدفع</h3>
                <p className="text-sm text-gray-400">يرجى الانتظار...</p>
              </div>
            )}

            {/* Step 3: Success */}
            {feeStep === 3 && (
              <div className="animate-fade-in text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                  <CheckCircle size={32} className="text-white" />
                </div>
                <h3 className="text-lg font-extrabold text-gray-800 mb-1">تم الدفع والقبول بنجاح!</h3>
                <p className="text-sm text-gray-400 mb-4">العرض الآن بانتظار موافقة إدارة المنصة</p>
                <button
                  onClick={closeFeeModal}
                  className="w-full btn-primary py-3 text-sm"
                >
                  تم
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm relative">
            <button
              onClick={() => { setReviewModal(null); setReviewRating(0); setReviewComment(''); }}
              className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-5">
              <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Star size={24} className="text-white" />
              </div>
              <h2 className="text-lg font-extrabold text-gray-800">تقييم المعلم</h2>
              <p className="text-xs text-gray-400">شاركنا رأيك في تجربة الجلسة</p>
            </div>

            {/* Star Rating */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  onMouseEnter={() => setReviewHover(s)}
                  onMouseLeave={() => setReviewHover(0)}
                  className="cursor-pointer transition-transform hover:scale-125"
                >
                  <Star
                    size={32}
                    className={
                      s <= (reviewHover || reviewRating)
                        ? 'text-amber-400 drop-shadow-md'
                        : 'text-gray-200'
                    }
                    fill={s <= (reviewHover || reviewRating) ? 'currentColor' : 'none'}
                  />
                </button>
              ))}
            </div>

            {reviewRating > 0 && (
              <p className="text-center text-sm font-bold text-amber-600 mb-3">
                {reviewRating === 1 ? 'ضعيف' : reviewRating === 2 ? 'مقبول' : reviewRating === 3 ? 'جيد' : reviewRating === 4 ? 'جيد جداً' : 'ممتاز!'}
              </p>
            )}

            {/* Comment */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-600 mb-2">تعليق (اختياري)</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="اكتب تعليقك هنا..."
                className="edu-input resize-none h-20"
                maxLength={500}
              />
            </div>

            <button
              onClick={handleSubmitReview}
              disabled={!reviewRating || reviewLoading}
              className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
            >
              {reviewLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <Star size={15} />
                  إرسال التقييم
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
