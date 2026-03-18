import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  Search,
  Trash2,
  User,
  GraduationCap,
  BookOpen,
  Phone,
  MapPin,
  Wallet,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Award,
  Loader2,
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users'); // 'users' | 'pending'
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/users', { params });
      setUsers(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/teachers/pending');
      setPendingTeachers(res.data);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
    fetchPending();
  }, [roleFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    }
  };

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/teachers/${id}/approve`);
      setPendingTeachers((prev) => prev.filter((t) => t._id !== id));
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading('');
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      await api.put(`/admin/teachers/${id}/reject`);
      // Keep in pending list but refresh
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setActionLoading('');
    }
  };

  const roleLabel = (role) => {
    switch (role) {
      case 'student': return 'طالب';
      case 'teacher': return 'معلم';
      case 'admin': return 'مدير';
      default: return role;
    }
  };

  const roleBadge = (role) => {
    switch (role) {
      case 'student': return 'bg-green-100 text-green-700';
      case 'teacher': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">إدارة المستخدمين</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('users')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
            tab === 'users' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          جميع المستخدمين
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            tab === 'pending' ? 'bg-amber-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <ShieldCheck size={16} />
          مراجعة المعلمين
          {pendingTeachers.length > 0 && (
            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
              tab === 'pending' ? 'bg-white text-amber-600' : 'bg-amber-500 text-white'
            }`}>
              {pendingTeachers.length}
            </span>
          )}
        </button>
      </div>

      {/* ===== TAB: Pending Teacher Profiles ===== */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {pendingTeachers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle size={36} className="text-emerald-300 mx-auto mb-3" />
              <p className="text-gray-400 font-bold">لا يوجد معلمين بانتظار المراجعة</p>
            </div>
          ) : (
            pendingTeachers.map((t) => (
              <div key={t._id} className="bg-white rounded-xl p-5 shadow-sm border border-amber-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {t.profilePicture ? (
                      <img src={t.profilePicture} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-amber-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                        {t.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{t.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400" dir="ltr">{t.phone}</span>
                        {t.gender && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            t.gender === 'male' ? 'bg-teal-100 text-teal-700' : 'bg-pink-100 text-pink-700'
                          }`}>
                            {t.gender === 'male' ? 'ذكر' : 'أنثى'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                    <Clock size={12} />
                    بانتظار المراجعة
                  </span>
                </div>

                {/* Location */}
                {t.location && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
                    <MapPin size={13} />
                    <span>{t.location}</span>
                  </div>
                )}

                {/* Subjects */}
                {t.subjects?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-500 mb-1">المواد:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.subjects.map((s) => (
                        <span key={s} className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target levels */}
                {t.targetLevels?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-500 mb-1">المراحل المستهدفة:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.targetLevels.map((l) => (
                        <span key={l} className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-teal-100">
                          {l}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {t.certifications?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-gray-500 mb-1">الشهادات ({t.certifications.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {t.certifications.map((cert, idx) => (
                        <a key={idx} href={cert} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg transition">
                          <FileText size={12} />
                          شهادة {idx + 1}
                          <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* CV */}
                {t.cvFile && (
                  <div className="mb-3">
                    <a href={t.cvFile} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1.5 rounded-lg transition">
                      <Award size={12} />
                      عرض السيرة الذاتية
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}

                <div className="text-xs text-gray-300 mb-3">
                  تسجيل: {new Date(t.createdAt).toLocaleDateString('ar-SA')}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(t._id)}
                    disabled={actionLoading === t._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === t._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    اعتماد الملف
                  </button>
                  <button
                    onClick={() => handleReject(t._id)}
                    disabled={actionLoading === t._id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border-2 border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    رفض
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ===== TAB: All Users ===== */}
      {tab === 'users' && (
        <>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث بالاسم أو رقم الجوال..."
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
              >
                بحث
              </button>
            </form>

            <div className="flex gap-2">
              {[
                { value: '', label: 'الكل' },
                { value: 'student', label: 'طلاب' },
                { value: 'teacher', label: 'معلمون' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setRoleFilter(f.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                    roleFilter === f.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users count */}
          <p className="text-sm text-gray-400">{users.length} مستخدم</p>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا يوجد مستخدمون</div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-800">{u.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadge(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                        {u.gender && (
                          <span className="text-xs text-gray-400">
                            {u.gender === 'male' ? 'ذكر' : 'أنثى'}
                          </span>
                        )}
                        {u.role === 'teacher' && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            u.isProfileApproved
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {u.isProfileApproved ? '✓ معتمد' : '⏳ غير معتمد'}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Phone size={13} />
                          <span dir="ltr">{u.phone}</span>
                        </div>
                        {u.location && (
                          <div className="flex items-center gap-1">
                            <MapPin size={13} />
                            <span>{u.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Wallet size={13} />
                          <span>{u.balance} ر.س</span>
                        </div>
                      </div>

                      {u.role === 'student' && u.level && (
                        <div className="mt-1 text-xs text-gray-400">المرحلة: {u.level}</div>
                      )}
                      {u.role === 'teacher' && u.subjects?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {u.subjects.map((s) => (
                            <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-lg">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {u.role === 'teacher' && u.targetLevels?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.targetLevels.map((l) => (
                            <span key={l} className="bg-teal-50 text-teal-600 text-xs px-2 py-0.5 rounded-lg border border-teal-100">
                              {l}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-xs text-gray-300 mt-2">
                        تسجيل: {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {u.role === 'teacher' && !u.isProfileApproved && (
                        <button
                          onClick={() => handleApprove(u._id)}
                          disabled={actionLoading === u._id}
                          className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="اعتماد الملف"
                        >
                          {actionLoading === u._id ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                        </button>
                      )}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          className="p-2 text-gray-300 hover:text-red-500 transition cursor-pointer"
                          title="حذف المستخدم"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
