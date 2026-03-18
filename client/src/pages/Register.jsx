import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MapPin,
  School,
  Phone,
  User,
  Calendar,
  Users,
  Upload,
  FileText,
  Award,
  X,
  CheckCircle,
  BookOpen,
  GraduationCap,
} from 'lucide-react';
import api from '../api/axios';

const SUBJECTS_LIST = [
  'رياضيات', 'فيزياء', 'كيمياء', 'أحياء',
  'لغة عربية', 'لغة إنجليزية', 'تاريخ', 'جغرافيا',
  'حاسب آلي', 'قرآن كريم',
];

const LEVELS_LIST = [
  { value: 'ابتدائي', label: 'ابتدائي' },
  { value: 'متوسط', label: 'متوسط' },
  { value: 'ثانوي', label: 'ثانوي' },
  { value: 'جامعي', label: 'جامعي' },
];

const STUDENT_STEPS = 4;
const TEACHER_STEPS = 5;

function LocationPicker({ location, locationCoords, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = locationCoords?.lat
      ? { lat: locationCoords.lat, lng: locationCoords.lng }
      : { lat: 24.7136, lng: 46.6753 }; // Riyadh default

    const map = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
    });

    const marker = new window.google.maps.Marker({
      position: defaultCenter,
      map,
      draggable: true,
    });

    const geocoder = new window.google.maps.Geocoder();

    const updateFromLatLng = (latLng) => {
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          onChange({
            location: results[0].formatted_address,
            locationCoords: { lat: latLng.lat(), lng: latLng.lng() },
          });
        } else {
          onChange({
            location: `${latLng.lat().toFixed(6)}, ${latLng.lng().toFixed(6)}`,
            locationCoords: { lat: latLng.lat(), lng: latLng.lng() },
          });
        }
      });
    };

    map.addListener('click', (e) => {
      marker.setPosition(e.latLng);
      updateFromLatLng(e.latLng);
    });

    marker.addListener('dragend', () => {
      updateFromLatLng(marker.getPosition());
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
  }, []);

  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      initMap();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setMapLoaded(true);
        initMap();
      });
      return;
    }

    // Load Google Maps script — replace YOUR_API_KEY with a real key
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=&libraries=places&language=ar`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
      initMap();
    };
    document.head.appendChild(script);
  }, [initMap]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        if (mapInstanceRef.current && markerRef.current) {
          const gLatLng = new window.google.maps.LatLng(latLng.lat, latLng.lng);
          mapInstanceRef.current.setCenter(gLatLng);
          mapInstanceRef.current.setZoom(15);
          markerRef.current.setPosition(gLatLng);

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: gLatLng }, (results, status) => {
            if (status === 'OK' && results[0]) {
              onChange({
                location: results[0].formatted_address,
                locationCoords: latLng,
              });
            } else {
              onChange({
                location: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`,
                locationCoords: latLng,
              });
            }
          });
        }
      },
      () => alert('لم نتمكن من تحديد موقعك. تأكد من تفعيل خدمات الموقع.')
    );
  };

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className="w-full h-56 rounded-xl border-2 border-emerald-200 bg-gray-100"
        style={{ minHeight: '220px' }}
      />
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 text-sm font-bold hover:bg-emerald-50 transition cursor-pointer"
      >
        <MapPin size={16} />
        تحديد موقعي الحالي
      </button>
      {location && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700 flex items-start gap-2">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          <span>{location}</span>
        </div>
      )}
    </div>
  );
}

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    role: 'student',
    name: '',
    age: '',
    gender: '',
    // Student
    school: '',
    level: '',
    location: '',
    locationCoords: { lat: null, lng: null },
    // Teacher
    subjects: [],
    targetLevels: [],
    certifications: [],
    certFiles: [],
    cvFile: '',
    cvFileObj: null,
    // Shared
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const totalSteps = form.role === 'student' ? STUDENT_STEPS : TEACHER_STEPS;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoleSwitch = (role) => {
    setStep(1);
    setError('');
    setForm({ ...form, role });
  };

  const canProceed = () => {
    if (form.role === 'student') {
      switch (step) {
        case 1: return form.name.trim() && form.age && form.gender;
        case 2: return form.school.trim() && form.level;
        case 3: return form.location.trim();
        case 4: return form.phone.trim() && form.password.length >= 6;
        default: return false;
      }
    } else {
      switch (step) {
        case 1: return form.name.trim() && form.age && form.gender;
        case 2: return form.subjects.length > 0 && form.targetLevels.length > 0;
        case 3: return form.certFiles.length > 0;
        case 4: return form.cvFileObj !== null;
        case 5: return form.phone.trim() && form.password.length >= 6;
        default: return false;
      }
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      setError('');
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setError('');
      setStep(step - 1);
    }
  };

  const uploadFiles = async (token) => {
    let certPaths = [];
    let cvPath = '';

    if (form.certFiles.length > 0) {
      const fd = new FormData();
      form.certFiles.forEach((f) => fd.append('certifications', f));
      const res = await api.post('/upload/certifications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      certPaths = res.data.files;
    }

    if (form.cvFileObj) {
      const fd = new FormData();
      fd.append('cv', form.cvFileObj);
      const res = await api.post('/upload/cv', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      cvPath = res.data.file;
    }

    return { certPaths, cvPath };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canProceed()) return;

    setError('');
    setLoading(true);
    try {
      // Register user first
      const payload = {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone,
        password: form.password,
        role: form.role,
      };

      if (form.role === 'student') {
        payload.school = form.school;
        payload.level = form.level;
        payload.location = form.location;
        payload.locationCoords = form.locationCoords;
      }

      if (form.role === 'teacher') {
        payload.subjects = form.subjects;
        payload.targetLevels = form.targetLevels;
      }

      const user = await register(payload);

      // Upload files for teacher after registration (now we have a token)
      if (form.role === 'teacher' && (form.certFiles.length > 0 || form.cvFileObj)) {
        setUploading(true);
        try {
          const { certPaths, cvPath } = await uploadFiles();
          await api.put('/users/profile', {
            certifications: certPaths,
            cvFile: cvPath,
          });
        } catch {
          // Files can be uploaded later from profile
        }
        setUploading(false);
      }

      navigate(form.role === 'teacher' ? '/profile' : '/');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'حدث خطأ في التسجيل'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCertFilesChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((prev) => ({
      ...prev,
      certFiles: [...prev.certFiles, ...files],
    }));
  };

  const removeCertFile = (index) => {
    setForm((prev) => ({
      ...prev,
      certFiles: prev.certFiles.filter((_, i) => i !== index),
    }));
  };

  const handleCvFileChange = (e) => {
    if (e.target.files[0]) {
      setForm((prev) => ({ ...prev, cvFileObj: e.target.files[0] }));
    }
  };

  const studentStepLabels = [
    'المعلومات الشخصية',
    'المدرسة والمرحلة',
    'الموقع',
    'رقم الجوال وكلمة المرور',
  ];

  const teacherStepLabels = [
    'المعلومات الشخصية',
    'المواد والمراحل المستهدفة',
    'الشهادات والمؤهلات',
    'السيرة الذاتية',
    'رقم الجوال وكلمة المرور',
  ];

  const stepLabels = form.role === 'student' ? studentStepLabels : teacherStepLabels;

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center px-4 py-8">
      <div className="glass-card rounded-3xl p-8 w-full max-w-lg relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200/40 pulse-glow">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            {form.role === 'student' ? 'تسجيل طالب جديد' : 'تسجيل معلم جديد'}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">انضم لمنصة جسور التعليمية</p>
        </div>

        {/* Role toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
              form.role === 'student'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            طالب
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('teacher')}
            className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
              form.role === 'teacher'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            معلم
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600">
              الخطوة {step} من {totalSteps}
            </span>
            <span className="text-xs font-medium text-gray-400">{stepLabels[step - 1]}</span>
          </div>
          <div className="w-full bg-emerald-100 rounded-full h-2.5">
            <div
              className="bg-gradient-to-l from-emerald-500 to-teal-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl mb-4 text-sm font-medium animate-fade-in">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ===== SHARED STEP 1: Name, Age, Gender ===== */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <User size={14} className="text-emerald-500" />
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="محمد أحمد"
                  className="edu-input"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <Calendar size={14} className="text-teal-500" />
                  العمر
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="مثال: 15"
                  min="5"
                  max="80"
                  className="edu-input"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <Users size={14} className="text-emerald-500" />
                  الجنس
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gender: 'male' })}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
                      form.gender === 'male'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    ذكر
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, gender: 'female' })}
                    className={`py-3 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
                      form.gender === 'female'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    أنثى
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ===== STUDENT STEP 2: School & Level ===== */}
          {form.role === 'student' && step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <School size={14} className="text-teal-500" />
                  اسم المدرسة
                </label>
                <input
                  type="text"
                  name="school"
                  value={form.school}
                  onChange={handleChange}
                  placeholder="مثال: مدرسة الأمير سلطان"
                  className="edu-input"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">المرحلة الدراسية</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'ابتدائي', label: 'ابتدائي' },
                    { value: 'متوسط', label: 'متوسط' },
                    { value: 'ثانوي', label: 'ثانوي' },
                    { value: 'جامعي', label: 'جامعي' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, level: opt.value })}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
                        form.level === opt.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== STUDENT STEP 3: Location ===== */}
          {form.role === 'student' && step === 3 && (
            <div className="space-y-4">
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <MapPin size={14} className="text-emerald-500" />
                حدد موقعك على الخريطة
              </label>
              <LocationPicker
                location={form.location}
                locationCoords={form.locationCoords}
                onChange={({ location, locationCoords }) =>
                  setForm((prev) => ({ ...prev, location, locationCoords }))
                }
              />
              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">أو أدخل العنوان يدوياً</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="مثال: الرياض - حي النرجس"
                  className="edu-input"
                />
              </div>
            </div>
          )}

          {/* ===== TEACHER STEP 2: Subjects & Target Levels ===== */}
          {form.role === 'teacher' && step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <BookOpen size={14} className="text-emerald-500" />
                  المواد التي تدرّسها
                </label>
                <p className="text-xs text-gray-400 mb-2">اختر مادة واحدة على الأقل</p>
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS_LIST.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          subjects: prev.subjects.includes(subject)
                            ? prev.subjects.filter((s) => s !== subject)
                            : [...prev.subjects, subject],
                        }))
                      }
                      className={`px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                        form.subjects.includes(subject)
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200'
                          : 'bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <GraduationCap size={14} className="text-teal-500" />
                  المراحل الدراسية المستهدفة
                </label>
                <p className="text-xs text-gray-400 mb-2">اختر المراحل التي ترغب بتدريسها (يمكنك اختيار أكثر من مرحلة)</p>
                <div className="grid grid-cols-2 gap-3">
                  {LEVELS_LIST.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          targetLevels: prev.targetLevels.includes(lvl.value)
                            ? prev.targetLevels.filter((l) => l !== lvl.value)
                            : [...prev.targetLevels, lvl.value],
                        }))
                      }
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition cursor-pointer ${
                        form.targetLevels.includes(lvl.value)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== TEACHER STEP 3: Certifications Upload ===== */}
          {form.role === 'teacher' && step === 3 && (
            <div className="space-y-4">
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <Award size={14} className="text-amber-500" />
                الشهادات والمؤهلات
              </label>
              <p className="text-xs text-gray-400">
                ارفع صور أو ملفات الشهادات (PDF, JPG, PNG) — حتى 5 ملفات
              </p>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-emerald-300 rounded-xl cursor-pointer hover:bg-emerald-50/50 transition group">
                <Upload size={28} className="text-emerald-300 mb-2 group-hover:text-emerald-400 transition" />
                <span className="text-sm text-emerald-600 font-bold">اضغط لاختيار الملفات</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleCertFilesChange}
                  className="hidden"
                />
              </label>

              {form.certFiles.length > 0 && (
                <div className="space-y-2">
                  {form.certFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={16} className="text-emerald-500 shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-400 shrink-0">
                          ({(file.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertFile(idx)}
                        className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== TEACHER STEP 4: CV Upload ===== */}
          {form.role === 'teacher' && step === 4 && (
            <div className="space-y-4">
              <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600">
                <FileText size={14} className="text-teal-500" />
                السيرة الذاتية (CV)
              </label>
              <p className="text-xs text-gray-400">
                ارفع ملف السيرة الذاتية (PDF, DOC, DOCX)
              </p>

              {!form.cvFileObj ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer hover:bg-teal-50/50 transition group">
                  <Upload size={32} className="text-teal-300 mb-2 group-hover:text-teal-400 transition" />
                  <span className="text-sm text-teal-600 font-bold">اضغط لاختيار ملف CV</span>
                  <span className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX — حتى 10 MB</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCvFileChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <CheckCircle size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-emerald-800">{form.cvFileObj.name}</p>
                        <p className="text-xs text-emerald-600">
                          {(form.cvFileObj.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, cvFileObj: null }))}
                      className="p-1 text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== SHARED STEP 4: Phone & Password ===== */}
          {step === totalSteps && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-600 mb-2">
                  <Phone size={14} className="text-emerald-500" />
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="05xxxxxxxx"
                  className="edu-input"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-gray-600 mb-2 block">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="6 أحرف على الأقل"
                    className="edu-input"
                    required
                    minLength={6}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 flex items-center justify-center gap-1 py-3 border-2 border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                <ChevronRight size={18} />
                السابق
              </button>
            )}
            {step < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 flex items-center justify-center gap-1 py-3 btn-primary disabled:opacity-40"
              >
                التالي
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || uploading || !canProceed()}
                className="flex-1 flex items-center justify-center gap-2 py-3 btn-primary disabled:opacity-40"
              >
                <UserPlus size={18} />
                {uploading ? 'جاري رفع الملفات...' : loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition">
            سجّل دخولك
          </Link>
        </p>
      </div>
    </div>
  );
}
