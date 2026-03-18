import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Home,
  User,
  MessageSquare,
  Wallet,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Users,
  BarChart3,
  Receipt,
  BookOpen,
  Sparkles,
  ChevronRight,
  Bell,
  Headphones,
  ScrollText,
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);

  // Fetch offers to compute notification count
  useEffect(() => {
    if (!user || user.role === 'admin') return;
    const fetchNotifs = () => {
      api.get('/offers').then((res) => {
        const offers = res.data;
        let count = 0;
        offers.forEach((o) => {
          // Pending offers waiting for YOUR response
          if (o.status === 'pending' && o.lastActionBy !== user.role) count++;
          // Teacher: fee not paid yet in admin_review
          if (o.status === 'admin_review' && !o.isFeePaid && user.role === 'teacher') count++;
          // Online meeting ready but not started
          if (o.status === 'accepted' && o.mode === 'online' && o.meeting?.link && !o.meeting?.startedAt) count++;
          // In-person: teacher arrived, student needs to confirm
          if (o.status === 'accepted' && o.mode === 'in-person' && o.attendance?.teacherArrived && !o.attendance?.studentConfirmed && user.role === 'student') count++;
          // Completed: student needs to review
          if (o.status === 'completed' && !o.isReviewed && user.role === 'student') count++;
        });
        setNotifCount(count);
      }).catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const navItems = isAdmin
    ? [
        { path: '/admin', label: 'لوحة التحكم', icon: BarChart3 },
        { path: '/admin/users', label: 'المستخدمين', icon: Users },
        { path: '/admin/offers', label: 'العروض', icon: MessageSquare },
        { path: '/admin/transactions', label: 'المعاملات', icon: Receipt },
      ]
    : [
        { path: '/', label: 'الرئيسية', icon: Home },
        { path: '/offers', label: 'العروض', icon: MessageSquare },
        { path: '/wallet', label: 'المحفظة', icon: Wallet },
        { path: '/profile', label: 'حسابي', icon: User },
      ];

  if (!isAdmin && user?.role === 'student') {
    navItems.splice(1, 0, {
      path: '/teachers',
      label: 'المعلمين',
      icon: GraduationCap,
    });
  }

  const roleLabel = user?.role === 'student' ? 'طالب' : user?.role === 'admin' ? 'مدير' : 'معلم';
  const roleBg = user?.role === 'student' ? 'bg-emerald-100 text-emerald-700' : user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-teal-50/40">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200/50 group-hover:shadow-emerald-300/60 transition-all duration-300 group-hover:scale-105">
              <BookOpen size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-gradient leading-tight">جسور</span>
              <span className="text-[10px] text-emerald-500 font-medium -mt-0.5 hidden sm:block">منصة التعليم الذكي</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            {!isAdmin && notifCount > 0 && (
              <Link
                to="/offers"
                className="relative p-2 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 no-underline"
                title="إشعارات"
              >
                <Bell size={20} className="animate-swing" />
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {notifCount > 9 ? '+9' : notifCount}
                </span>
              </Link>
            )}
            <Link to={isAdmin ? '/admin' : '/profile'} className="hidden sm:flex items-center gap-2 no-underline hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-gray-700 leading-tight">{user?.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBg}`}>{roleLabel}</span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer"
              title="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 animate-fade-in">
        {/* Back button for inner pages */}
        {location.pathname !== '/' && location.pathname !== '/admin' && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-emerald-600 transition mb-4 cursor-pointer"
          >
            <ChevronRight size={18} />
            رجوع
          </button>
        )}
        {children}
      </main>

      {/* Footer Links */}
      <div className="max-w-5xl mx-auto px-4 pb-32 md:pb-6 flex items-center justify-center gap-4">
        <Link to="/support" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition no-underline font-medium">
          <Headphones size={13} />
          الدعم الفني
        </Link>
        <span className="text-gray-200">|</span>
        <Link to="/terms" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition no-underline font-medium">
          <ScrollText size={13} />
          الشروط والأحكام
        </Link>
      </div>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-emerald-100 md:hidden z-50">
        <div className="flex justify-around py-1.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl no-underline transition-all duration-200 ${
                  active
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${active ? 'bg-emerald-100' : ''}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
