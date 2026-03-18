import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Star, MapPin, BookOpen, Send, Monitor, Users, GraduationCap, Loader2, Award, X, Wallet, Clock, AlertCircle } from 'lucide-react';

export default function Teachers() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [offerForm, setOfferForm] = useState({
    subject: '',
    mode: 'in-person',
    price: '',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pendingTeacherIds, setPendingTeacherIds] = useState(new Set());

  useEffect(() => {
    api
      .get('/users/teachers')
      .then((res) => setTeachers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch existing offers to find teachers with pending/admin_review offers
    api.get('/offers').then((res) => {
      const ids = new Set();
      res.data.forEach((o) => {
        if (o.status === 'pending' || o.status === 'admin_review') {
          ids.add(o.teacherId?._id || o.teacherId);
        }
      });
      setPendingTeacherIds(ids);
    }).catch(() => {});
  }, []);

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSending(true);
    try {
      await api.post('/offers', {
        teacherId: selectedTeacher._id,
        subject: offerForm.subject,
        mode: offerForm.mode,
        price: Number(offerForm.price),
      });
      setSuccess('تم إرسال العرض بنجاح!');
      setPendingTeacherIds((prev) => new Set([...prev, selectedTeacher._id]));
      setSelectedTeacher(null);
      setOfferForm({ subject: '', mode: 'in-person', price: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSending(false);
    }
  };

  if (user?.role !== 'student') {
    return (
      <div className="text-center py-16 text-gray-400">
        هذه الصفحة متاحة للطلاب فقط
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <GraduationCap size={22} className="text-emerald-500" />
        المعلمون المتاحون
      </h1>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2">
          <Award size={16} />
          {success}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <Loader2 size={36} className="text-emerald-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 font-medium">جاري تحميل المعلمين...</p>
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-emerald-400" />
          </div>
          <p className="text-gray-500 font-bold text-lg">لا يوجد معلمون حالياً</p>
          <p className="text-gray-400 text-sm mt-1">سيظهر المعلمون هنا عند تسجيلهم</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map((teacher) => (
            <div
              key={teacher._id}
              className="edu-card p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-105 transition-transform">
                    {teacher.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{teacher.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={s <= Math.round(teacher.rating || 0) ? 'text-amber-400' : 'text-gray-200'}
                            fill={s <= Math.round(teacher.rating || 0) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-600">{teacher.rating ? teacher.rating.toFixed(1) : 'جديد'}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400">
                        {teacher.completedSessions || 0} جلسة
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  teacher.gender === 'male' ? 'bg-teal-100 text-teal-700' : teacher.gender === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {teacher.gender === 'male' ? 'ذكر' : teacher.gender === 'female' ? 'أنثى' : '—'}
                </span>
              </div>

              {teacher.location && (
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-3">
                  <MapPin size={13} />
                  <span>{teacher.location}</span>
                </div>
              )}

              {teacher.subjects?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {teacher.subjects.map((s) => (
                    <span
                      key={s}
                      className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {teacher.targetLevels?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {teacher.targetLevels.map((l) => (
                    <span
                      key={l}
                      className="bg-teal-50 text-teal-600 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-teal-100"
                    >
                      {l}
                    </span>
                  ))}
                </div>
              )}

              {pendingTeacherIds.has(teacher._id) ? (
                <div className="w-full py-2.5 text-sm flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl font-bold">
                  <Clock size={15} />
                  يوجد عرض قائم
                </div>
              ) : (
                <button
                  onClick={() => setSelectedTeacher(teacher)}
                  className="w-full btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  أرسل عرض
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Offer Modal */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md relative">
            <button
              onClick={() => { setSelectedTeacher(null); setError(''); }}
              className="absolute top-4 left-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {selectedTeacher.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800">
                  إرسال عرض لـ {selectedTeacher.name}
                </h2>
                <p className="text-xs text-gray-400">حدد المادة ونوع الدرس والسعر المقترح</p>
              </div>
            </div>

            {/* Wallet balance notice */}
            <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-sm font-bold ${
              user?.balance > 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <Wallet size={15} />
              <span>رصيدك الحالي: {user?.balance || 0} ر.س</span>
              {user?.balance <= 0 && (
                <span className="text-xs font-medium mr-auto">يرجى شحن المحفظة أولاً</span>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">المادة</label>
                <select
                  value={offerForm.subject}
                  onChange={(e) => setOfferForm({ ...offerForm, subject: e.target.value })}
                  className="edu-input"
                  required
                >
                  <option value="">اختر المادة</option>
                  {selectedTeacher.subjects?.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">نوع الدرس</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOfferForm({ ...offerForm, mode: 'in-person' })}
                    className={`py-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 cursor-pointer text-sm ${
                      offerForm.mode === 'in-person'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Users size={16} />
                    حضوري
                  </button>
                  <button
                    type="button"
                    onClick={() => setOfferForm({ ...offerForm, mode: 'online' })}
                    className={`py-3 rounded-xl border-2 font-bold transition flex items-center justify-center gap-2 cursor-pointer text-sm ${
                      offerForm.mode === 'online'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <Monitor size={16} />
                    عن بُعد
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  السعر المقترح (ر.س)
                </label>
                <input
                  type="number"
                  value={offerForm.price}
                  onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
                  placeholder="مثال: 100"
                  className="edu-input"
                  required
                  min="1"
                  dir="ltr"
                />
                {offerForm.price && Number(offerForm.price) > (user?.balance || 0) && (
                  <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1">
                    <AlertCircle size={12} />
                    السعر أكبر من رصيدك ({user?.balance || 0} ر.س)
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={sending || (offerForm.price && Number(offerForm.price) > (user?.balance || 0))}
                  className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} />
                  {sending ? 'جاري الإرسال...' : 'إرسال العرض'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeacher(null);
                    setError('');
                  }}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition cursor-pointer text-sm font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
