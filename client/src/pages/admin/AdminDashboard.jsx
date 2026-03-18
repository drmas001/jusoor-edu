import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Users,
  GraduationCap,
  BookOpen,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Receipt,
  DollarSign,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">جاري التحميل...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-red-400">حدث خطأ في تحميل البيانات</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم المدير</h1>

      {/* Users Stats */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">المستخدمون</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">إجمالي المستخدمين</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.users.total}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap size={20} className="text-green-600" />
              </div>
              <span className="text-sm text-gray-500">الطلاب</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.users.students}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen size={20} className="text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">المعلمون</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.users.teachers}</p>
          </div>
          {stats.users.pendingTeacherProfiles > 0 && (
            <Link to="/admin/users" className="bg-amber-50 rounded-xl p-5 shadow-sm border-2 border-amber-300 ring-2 ring-amber-100 no-underline">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck size={20} className="text-amber-600" />
                </div>
                <span className="text-sm text-amber-600 font-bold">معلمون بانتظار الاعتماد</span>
              </div>
              <p className="text-3xl font-bold text-amber-700">{stats.users.pendingTeacherProfiles}</p>
            </Link>
          )}
        </div>
      </div>

      {/* Offers Stats */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">العروض</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <MessageSquare size={18} />
              <span className="text-sm text-gray-500">الإجمالي</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.offers.total}</p>
          </div>
          {stats.offers.adminReview > 0 && (
            <Link to="/admin/offers" className="bg-violet-50 rounded-xl p-4 shadow-sm border-2 border-violet-300 ring-2 ring-violet-100 no-underline animate-pulse">
              <div className="flex items-center gap-2 text-violet-600 mb-2">
                <ShieldCheck size={18} />
                <span className="text-sm text-violet-600 font-bold">بانتظار المراجعة</span>
              </div>
              <p className="text-2xl font-bold text-violet-700">{stats.offers.adminReview}</p>
            </Link>
          )}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-yellow-500 mb-2">
              <Clock size={18} />
              <span className="text-sm text-gray-500">قيد التفاوض</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.offers.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-green-500 mb-2">
              <CheckCircle size={18} />
              <span className="text-sm text-gray-500">مقبولة</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.offers.accepted}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <XCircle size={18} />
              <span className="text-sm text-gray-500">مرفوضة</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.offers.rejected}</p>
          </div>
        </div>
      </div>

      {/* Revenue */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">الإيرادات</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-l from-emerald-600 to-emerald-800 rounded-xl p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign size={22} />
              <span className="text-emerald-200">إيرادات رسوم المنصة</span>
            </div>
            <p className="text-3xl font-bold">{stats.transactions.platformRevenue} ر.س</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <Receipt size={22} className="text-gray-400" />
              <span className="text-sm text-gray-500">إجمالي المعاملات</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.transactions.total}</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { to: '/admin/users', label: 'إدارة المستخدمين', icon: Users, color: 'blue' },
          { to: '/admin/offers', label: 'إدارة العروض', icon: MessageSquare, color: 'green' },
          { to: '/admin/transactions', label: 'سجل المعاملات', icon: Receipt, color: 'purple' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 transition no-underline"
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={`text-${item.color}-600`} />
                <span className="font-medium text-gray-800">{item.label}</span>
              </div>
              <ArrowLeft size={16} className="text-gray-300" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
