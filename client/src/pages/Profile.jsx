import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  User, MapPin, BookOpen, GraduationCap, Calendar, School,
  Upload, FileText, Award, ExternalLink, Loader2, CheckCircle,
  Phone, ShieldCheck, Clock, XCircle, Camera, Users,
} from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState('');

  const roleLabel = user?.role === 'student' ? 'طالب' : user?.role === 'admin' ? 'مدير' : 'معلم';
  const roleBg = user?.role === 'student' ? 'bg-emerald-100 text-emerald-700' : user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700';
  const genderLabel = user?.gender === 'male' ? 'ذكر' : user?.gender === 'female' ? 'أنثى' : '—';

  const handleProfilePicture = async (e) => {
    if (!e.target.files[0]) return;
    setUploading('picture');
    setError('');
    try {
      const fd = new FormData();
      fd.append('profilePicture', e.target.files[0]);
      const res = await api.post('/upload/profile-picture', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.put('/users/profile', { profilePicture: res.data.file });
      await refreshUser();
      setSuccess('تم تحديث الصورة الشخصية');
    } catch {
      setError('حدث خطأ في رفع الصورة');
    } finally {
      setUploading('');
    }
  };

  const handleUploadCerts = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading('certs');
    setError('');
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('certifications', f));
      const res = await api.post('/upload/certifications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newCerts = [...(user.certifications || []), ...res.data.files];
      await api.put('/users/profile', { certifications: newCerts });
      await refreshUser();
      setSuccess('تم رفع الشهادات بنجاح');
    } catch {
      setError('حدث خطأ في رفع الملفات');
    } finally {
      setUploading('');
    }
  };

  const handleUploadCv = async (e) => {
    if (!e.target.files[0]) return;
    setUploading('cv');
    setError('');
    try {
      const fd = new FormData();
      fd.append('cv', e.target.files[0]);
      const res = await api.post('/upload/cv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await api.put('/users/profile', { cvFile: res.data.file });
      await refreshUser();
      setSuccess('تم رفع السيرة الذاتية بنجاح');
    } catch {
      setError('حدث خطأ في رفع الملف');
    } finally {
      setUploading('');
    }
  };

  // Info row helper
  const InfoRow = ({ icon: Icon, label, value, iconColor = 'text-gray-400' }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Icon size={15} className={iconColor} />
        <span className="text-sm text-gray-500 font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-800">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <User size={22} className="text-emerald-500" />
        الملف الشخصي
      </h1>

      {/* Profile header with picture upload */}
      <div className="relative overflow-hidden bg-gradient-to-l from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute -top-4 -left-4 w-28 h-28 border-2 border-white rounded-full" />
          <div className="absolute bottom-2 right-8 w-16 h-16 border-2 border-white rounded-full" />
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative group">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/20" />
            ) : (
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-lg border border-white/20">
                {user?.name?.charAt(0)}
              </div>
            )}
            <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
              {uploading === 'picture' ? (
                <Loader2 size={20} className="text-white animate-spin" />
              ) : (
                <Camera size={20} className="text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicture}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h2 className="font-extrabold text-xl leading-tight">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/20">{roleLabel}</span>
              <span className="text-emerald-100 text-xs" dir="ltr">{user?.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher approval status */}
      {user?.role === 'teacher' && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          user.isProfileApproved
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          {user.isProfileApproved ? (
            <>
              <ShieldCheck size={20} className="text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-700">الملف معتمد من الإدارة</p>
                <p className="text-xs text-emerald-500">ملفك الشخصي ظاهر للطلاب</p>
              </div>
            </>
          ) : (
            <>
              <Clock size={20} className="text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-700">بانتظار اعتماد الإدارة</p>
                <p className="text-xs text-amber-500">ملفك الشخصي غير ظاهر للطلاب حتى تتم الموافقة</p>
              </div>
            </>
          )}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-xl text-sm font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle size={16} />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl text-sm font-medium animate-fade-in">{error}</div>
      )}

      {/* Basic info — read only */}
      <div className="edu-card p-5">
        <h3 className="font-extrabold text-gray-700 flex items-center gap-2 mb-3">
          <User size={16} className="text-emerald-500" />
          المعلومات الأساسية
        </h3>
        <InfoRow icon={User} label="الاسم" value={user?.name} iconColor="text-emerald-400" />
        <InfoRow icon={Phone} label="رقم الجوال" value={user?.phone} iconColor="text-blue-400" />
        <InfoRow icon={Users} label="الجنس" value={genderLabel} iconColor="text-teal-400" />
        {user?.age && <InfoRow icon={Calendar} label="العمر" value={user.age} iconColor="text-violet-400" />}
        {user?.location && <InfoRow icon={MapPin} label="الموقع" value={user.location} iconColor="text-orange-400" />}
      </div>

      {/* Student info — read only */}
      {user?.role === 'student' && (
        <div className="edu-card p-5">
          <h3 className="font-extrabold text-gray-700 flex items-center gap-2 mb-3">
            <School size={16} className="text-teal-500" />
            المعلومات الدراسية
          </h3>
          <InfoRow icon={School} label="المدرسة" value={user?.school} iconColor="text-teal-400" />
          <InfoRow icon={GraduationCap} label="المرحلة" value={user?.level} iconColor="text-violet-400" />
        </div>
      )}

      {/* Teacher info — read only */}
      {user?.role === 'teacher' && (
        <>
          {/* Subjects */}
          <div className="edu-card p-5">
            <h3 className="font-extrabold text-gray-700 flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-emerald-500" />
              المواد التي تدرّسها
            </h3>
            {user?.subjects?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.subjects.map((s) => (
                  <span key={s} className="bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-emerald-100">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">لم يتم تحديد المواد</p>
            )}
          </div>

          {/* Target levels */}
          <div className="edu-card p-5">
            <h3 className="font-extrabold text-gray-700 flex items-center gap-2 mb-3">
              <GraduationCap size={16} className="text-teal-500" />
              المراحل الدراسية المستهدفة
            </h3>
            {user?.targetLevels?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.targetLevels.map((l) => (
                  <span key={l} className="bg-teal-50 text-teal-700 text-sm font-bold px-3 py-1.5 rounded-lg border border-teal-100">
                    {l}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">لم يتم تحديد المراحل</p>
            )}
          </div>

          {/* Certifications — can upload more */}
          <div className="edu-card p-5 space-y-4">
            <h3 className="font-extrabold text-gray-700 flex items-center gap-2">
              <Award size={16} className="text-amber-500" />
              الشهادات والمؤهلات
            </h3>
            {user?.certifications?.length > 0 && (
              <div className="space-y-2">
                {user.certifications.map((cert, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-emerald-500" />
                      <span className="text-sm font-bold text-gray-700">شهادة {idx + 1}</span>
                    </div>
                    <a href={cert} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                      <ExternalLink size={12} />
                      عرض
                    </a>
                  </div>
                ))}
              </div>
            )}
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition group">
              {uploading === 'certs' ? (
                <Loader2 size={24} className="text-emerald-400 animate-spin" />
              ) : (
                <>
                  <Upload size={22} className="text-emerald-300 mb-1 group-hover:text-emerald-400 transition" />
                  <span className="text-xs font-bold text-gray-400 group-hover:text-emerald-500 transition">رفع شهادات جديدة</span>
                </>
              )}
              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUploadCerts} className="hidden" />
            </label>
          </div>

          {/* CV — can upload/replace */}
          <div className="edu-card p-5 space-y-4">
            <h3 className="font-extrabold text-gray-700 flex items-center gap-2">
              <FileText size={16} className="text-teal-500" />
              السيرة الذاتية (CV)
            </h3>
            {user?.cvFile ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700">تم رفع السيرة الذاتية</span>
                </div>
                <a href={user.cvFile} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">
                  <ExternalLink size={12} />
                  عرض
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-400 font-medium">لم يتم رفع سيرة ذاتية بعد</p>
            )}
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-teal-200 rounded-xl cursor-pointer hover:bg-teal-50/50 transition group">
              {uploading === 'cv' ? (
                <Loader2 size={24} className="text-teal-400 animate-spin" />
              ) : (
                <>
                  <Upload size={22} className="text-teal-300 mb-1 group-hover:text-teal-400 transition" />
                  <span className="text-xs font-bold text-gray-400 group-hover:text-teal-500 transition">
                    {user?.cvFile ? 'استبدال السيرة الذاتية' : 'رفع السيرة الذاتية'}
                  </span>
                </>
              )}
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleUploadCv} className="hidden" />
            </label>
          </div>
        </>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-400 text-center">
        لتعديل المعلومات الأساسية (الاسم، الجنس، المرحلة) يرجى التواصل مع الإدارة
      </div>
    </div>
  );
}
