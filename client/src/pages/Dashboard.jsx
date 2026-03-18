import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  MessageSquare,
  Wallet,
  GraduationCap,
  Clock,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  BookOpen,
  Trophy,
  CalendarClock,
  MapPin,
  Monitor,
  Users,
  Bell,
  ShieldCheck,
  Video,
  CreditCard,
  UserCheck,
  Star,
  Navigation,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/offers')
      .then((res) => setOffers(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pending = offers.filter((o) => o.status === 'pending').length;
  const accepted = offers.filter((o) => o.status === 'accepted').length;
  const adminReview = offers.filter((o) => o.status === 'admin_review').length;

  // Active sessions = accepted offers with fee paid
  const activeSessions = offers.filter(
    (o) => o.status === 'accepted' && o.isFeePaid
  );

  // Build smart notifications per offer
  const notifications = [];
  offers.forEach((o) => {
    const other = user?.role === 'student' ? o.teacherId : o.studentId;
    const name = other?.name || 'غير معروف';

    // 1. Pending: waiting for YOUR response
    if (o.status === 'pending' && o.lastActionBy !== user?.role) {
      notifications.push({
        id: o._id + '-respond',
        icon: MessageSquare,
        color: 'amber',
        title: `عرض جديد من ${name} بانتظار ردك`,
        desc: `${o.subject} • ${o.price} ر.س — قبول أو تفاوض`,
        action: 'الرد على العرض',
        link: '/offers',
        priority: 1,
      });
    }

    // 2. Teacher: fee not paid in admin_review
    if (o.status === 'admin_review' && !o.isFeePaid && user?.role === 'teacher') {
      notifications.push({
        id: o._id + '-fee',
        icon: CreditCard,
        color: 'red',
        title: `ادفع رسوم المنصة لإتمام العرض مع ${name}`,
        desc: `${o.subject} • ${o.price} ر.س — يجب دفع 15 ر.س`,
        action: 'ادفع الآن',
        link: '/offers',
        priority: 0,
      });
    }

    // 3. Admin review: waiting for admin
    if (o.status === 'admin_review' && o.isFeePaid) {
      notifications.push({
        id: o._id + '-review',
        icon: ShieldCheck,
        color: 'violet',
        title: `عرض ${o.subject} مع ${name} بانتظار موافقة الإدارة`,
        desc: 'سيتم إخطارك فور المراجعة',
        action: 'عرض التفاصيل',
        link: '/offers',
        priority: 3,
      });
    }

    // 4. Payment held notice
    if (o.status === 'accepted' && o.isPaymentHeld && !o.isPaymentReleased) {
      if (user?.role === 'student') {
        notifications.push({
          id: o._id + '-held',
          icon: Lock,
          color: 'orange',
          title: `تم حجز ${o.price} ر.س لجلسة ${o.subject}`,
          desc: `سيتم تحرير المبلغ للمعلم بعد إكمال الجلسة`,
          action: 'عرض الجلسة',
          link: '/offers',
          priority: 4,
        });
      }
    }

    // 5. Online meeting ready but not started
    if (o.status === 'accepted' && o.mode === 'online' && o.meeting?.link && !o.meeting?.startedAt) {
      notifications.push({
        id: o._id + '-meeting',
        icon: Video,
        color: 'blue',
        title: `جلسة أونلاين جاهزة مع ${name}`,
        desc: `${o.subject} • 45 دقيقة — ابدأ المكالمة الآن`,
        action: 'ابدأ الجلسة',
        link: '/offers',
        priority: 0,
      });
    }

    // 6. Online meeting in progress
    if (o.status === 'accepted' && o.mode === 'online' && o.meeting?.startedAt) {
      const endTime = new Date(o.meeting.startedAt).getTime() + (o.meeting.duration || 45) * 60000;
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      if (remaining > 0) {
        const mins = Math.floor(remaining / 60);
        notifications.push({
          id: o._id + '-live',
          icon: Video,
          color: 'blue',
          title: `جلسة جارية مع ${name}`,
          desc: `متبقي ${mins} دقيقة — انضم للمكالمة`,
          action: 'انضم الآن',
          link: '/offers',
          priority: 0,
        });
      }
    }

    // 7. In-person: teacher arrived, student must confirm
    if (o.status === 'accepted' && o.mode === 'in-person' && o.attendance?.teacherArrived && !o.attendance?.studentConfirmed && user?.role === 'student') {
      notifications.push({
        id: o._id + '-confirm',
        icon: UserCheck,
        color: 'teal',
        title: `المعلم ${name} وصل إلى موقعك!`,
        desc: `${o.subject} — أكّد حضور المعلم الآن`,
        action: 'تأكيد الحضور',
        link: '/offers',
        priority: 0,
      });
    }

    // 8. In-person accepted: teacher needs to go
    if (o.status === 'accepted' && o.mode === 'in-person' && !o.attendance?.teacherArrived && user?.role === 'teacher') {
      notifications.push({
        id: o._id + '-go',
        icon: Navigation,
        color: 'teal',
        title: `توجّه لموقع الطالب ${name}`,
        desc: `${o.subject} • حضوري — سجّل وصولك عند الوصول`,
        action: 'عرض الموقع',
        link: '/offers',
        priority: 1,
      });
    }

    // 9. Completed: student needs to review
    if (o.status === 'completed' && !o.isReviewed && user?.role === 'student') {
      notifications.push({
        id: o._id + '-review-teacher',
        icon: Star,
        color: 'amber',
        title: `قيّم المعلم ${name}`,
        desc: `جلسة ${o.subject} مكتملة — شاركنا رأيك`,
        action: 'قيّم الآن',
        link: '/offers',
        priority: 2,
      });
    }
  });

  // Sort by priority (0 = urgent first)
  notifications.sort((a, b) => a.priority - b.priority);

  const colorMap = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-600', title: 'text-amber-700', desc: 'text-amber-500', btn: 'bg-amber-600 hover:bg-amber-700 text-white', badge: 'bg-amber-500' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'bg-red-100 text-red-600', title: 'text-red-700', desc: 'text-red-400', btn: 'bg-red-600 hover:bg-red-700 text-white', badge: 'bg-red-500' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', icon: 'bg-violet-100 text-violet-600', title: 'text-violet-700', desc: 'text-violet-400', btn: 'bg-violet-600 hover:bg-violet-700 text-white', badge: 'bg-violet-500' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'bg-blue-100 text-blue-600', title: 'text-blue-700', desc: 'text-blue-400', btn: 'bg-blue-600 hover:bg-blue-700 text-white', badge: 'bg-blue-500' },
    teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'bg-teal-100 text-teal-600', title: 'text-teal-700', desc: 'text-teal-400', btn: 'bg-teal-600 hover:bg-teal-700 text-white', badge: 'bg-teal-500' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', title: 'text-emerald-700', desc: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white', badge: 'bg-emerald-500' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-100 text-orange-600', title: 'text-orange-700', desc: 'text-orange-400', btn: 'bg-orange-600 hover:bg-orange-700 text-white', badge: 'bg-orange-500' },
  };

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-4 left-8 w-16 h-16 border-2 border-white rounded-full" />
          <div className="absolute bottom-4 right-12 w-24 h-24 border-2 border-white rounded-full" />
          <div className="absolute top-8 right-1/3 w-8 h-8 border-2 border-white rounded-lg rotate-45" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-amber-300" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">
                مرحباً، {user?.name}
              </h1>
              <p className="text-emerald-100 text-sm">
                {user?.role === 'student'
                  ? 'ابحث عن معلم مناسب وابدأ رحلتك التعليمية'
                  : 'تابع طلبات الطلاب وقدّم عروضك'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'قيد التفاوض', value: pending, icon: Clock, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'مقبولة', value: accepted, icon: CheckCircle, color: 'from-emerald-400 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: 'الرصيد', value: `${user?.balance || 0} ر.س`, icon: Wallet, color: 'from-teal-400 to-cyan-500', bg: 'bg-teal-50', text: 'text-teal-700' },
          { label: 'إجمالي العروض', value: offers.length, icon: TrendingUp, color: 'from-violet-400 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-700' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="edu-card p-4 group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-extrabold text-gray-800 animate-count">{stat.value}</p>
              <p className="text-xs font-medium text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Smart Notifications */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
              <Bell size={18} className="text-red-500" />
              تنبيهات تحتاج انتباهك
              <span className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {notifications.length}
              </span>
            </h2>
          </div>
          <div className="space-y-2">
            {notifications.map((notif) => {
              const c = colorMap[notif.color] || colorMap.amber;
              const Icon = notif.icon;
              return (
                <Link
                  key={notif.id}
                  to={notif.link}
                  className={`flex items-center gap-3 ${c.bg} border ${c.border} rounded-xl p-3.5 no-underline group hover:shadow-md transition-all duration-200`}
                >
                  <div className={`w-11 h-11 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${c.title} leading-tight`}>{notif.title}</p>
                    <p className={`text-xs ${c.desc} mt-0.5 truncate`}>{notif.desc}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${c.btn} shadow-sm whitespace-nowrap`}>
                      {notif.action}
                    </span>
                    <ArrowLeft size={14} className={`${c.title} opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all`} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      {!loading && activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
            <CalendarClock size={18} className="text-teal-500" />
            الجلسات النشطة ({activeSessions.length})
          </h2>
          {activeSessions.map((session) => {
            const other =
              user?.role === 'student' ? session.teacherId : session.studentId;
            return (
              <Link
                key={session._id}
                to="/offers"
                className="edu-card p-4 no-underline block group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
                      {other?.name?.charAt(0) || '؟'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{other?.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                        <span>{session.subject}</span>
                        <span className="text-gray-300">•</span>
                        {session.mode === 'in-person' ? (
                          <span className="flex items-center gap-0.5 text-teal-500"><MapPin size={10} />حضوري</span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-blue-500"><Monitor size={10} />عن بُعد</span>
                        )}
                        <span className="text-gray-300">•</span>
                        <span className="font-bold text-emerald-600">{session.price} ر.س</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {session.mode === 'online' && session.meeting?.link && !session.meeting?.startedAt && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-bold flex items-center gap-1">
                        <Video size={10} />
                        جاهزة للبدء
                      </span>
                    )}
                    {session.mode === 'online' && session.meeting?.startedAt && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500 text-white font-bold flex items-center gap-1 animate-pulse">
                        <Video size={10} />
                        جلسة جارية
                      </span>
                    )}
                    {session.mode === 'in-person' && !session.attendance?.teacherArrived && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-bold">
                        بانتظار الوصول
                      </span>
                    )}
                    {session.mode === 'in-person' && session.attendance?.teacherArrived && !session.attendance?.studentConfirmed && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500 text-white font-bold flex items-center gap-1 animate-pulse">
                        <UserCheck size={10} />
                        بانتظار التأكيد
                      </span>
                    )}
                    {session.mode === 'in-person' && session.attendance?.studentConfirmed && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold flex items-center gap-1">
                        <CheckCircle size={10} />
                        حضور مؤكد
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-500" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {user?.role === 'student' && (
            <Link
              to="/teachers"
              className="edu-card flex items-center justify-between p-4 no-underline group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap size={22} className="text-emerald-600" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">ابحث عن معلم</p>
                  <p className="text-xs text-gray-400">تصفّح قائمة المعلمين المتاحين</p>
                </div>
              </div>
              <ArrowLeft size={18} className="text-emerald-300 group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all" />
            </Link>
          )}
          <Link
            to="/offers"
            className="edu-card flex items-center justify-between p-4 no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <MessageSquare size={22} className="text-amber-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">العروض والتفاوض</p>
                <p className="text-xs text-gray-400">تابع حالة عروضك</p>
              </div>
            </div>
            <ArrowLeft size={18} className="text-amber-300 group-hover:text-amber-500 group-hover:-translate-x-1 transition-all" />
          </Link>
          <Link
            to="/wallet"
            className="edu-card flex items-center justify-between p-4 no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet size={22} className="text-violet-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">المحفظة</p>
                <p className="text-xs text-gray-400">إدارة رصيدك المالي</p>
              </div>
            </div>
            <ArrowLeft size={18} className="text-violet-300 group-hover:text-violet-500 group-hover:-translate-x-1 transition-all" />
          </Link>
        </div>
      </div>

      {/* Recent offers */}
      {!loading && offers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            آخر العروض
          </h2>
          {offers.slice(0, 3).map((offer) => {
            const other =
              user?.role === 'student' ? offer.teacherId : offer.studentId;
            return (
              <div
                key={offer._id}
                className="edu-card p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                      {other?.name?.charAt(0) || '؟'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{other?.name}</p>
                      <p className="text-xs text-gray-400">
                        {offer.subject} • {offer.price} ر.س
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      offer.status === 'pending'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : offer.status === 'admin_review'
                        ? 'bg-violet-50 text-violet-600 border border-violet-200'
                        : offer.status === 'accepted'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : offer.status === 'completed'
                        ? 'bg-teal-50 text-teal-600 border border-teal-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    {offer.status === 'pending'
                      ? 'قيد التفاوض'
                      : offer.status === 'admin_review'
                      ? 'بانتظار الإدارة'
                      : offer.status === 'accepted'
                      ? 'مقبول'
                      : offer.status === 'completed'
                      ? 'مكتمل'
                      : 'مرفوض'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
