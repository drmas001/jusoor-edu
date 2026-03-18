import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Headphones, MessageCircle, Mail, Phone, Send, CheckCircle,
  Loader2, AlertCircle, ChevronDown, HelpCircle, FileText,
} from 'lucide-react';

const FAQ = [
  { q: 'كيف أشحن محفظتي؟', a: 'اذهب إلى صفحة المحفظة واختر طريقة الدفع المناسبة (Apple Pay، Google Pay، أو بطاقة ائتمانية) ثم أدخل المبلغ واتبع التعليمات.' },
  { q: 'كيف أرسل عرض لمعلم؟', a: 'من صفحة المعلمين، اختر المعلم المناسب واضغط "أرسل عرض"، ثم حدد المادة ونوع الدرس والسعر المقترح.' },
  { q: 'ماذا يحدث بعد قبول العرض؟', a: 'يتم إرسال العرض لمراجعة الإدارة. بعد الموافقة، يتم حجز المبلغ من محفظة الطالب ويمكن بدء الجلسة.' },
  { q: 'كيف أسترجع أموالي؟', a: 'في حال رفض العرض أو إلغائه قبل بدء الجلسة، يتم إرجاع المبلغ تلقائياً إلى محفظتك.' },
  { q: 'كيف أصبح معلماً على المنصة؟', a: 'سجّل حساب جديد كمعلم، أكمل بياناتك وارفع شهاداتك. سيتم مراجعة ملفك من الإدارة قبل الظهور للطلاب.' },
  { q: 'هل بياناتي آمنة؟', a: 'نعم، نلتزم بنظام حماية البيانات الشخصية في المملكة العربية السعودية ونستخدم تشفير SSL لحماية جميع البيانات.' },
];

const CATEGORIES = [
  { value: 'technical', label: 'مشكلة تقنية' },
  { value: 'payment', label: 'مشكلة في الدفع أو المحفظة' },
  { value: 'offer', label: 'مشكلة في العروض أو الجلسات' },
  { value: 'account', label: 'مشكلة في الحساب' },
  { value: 'suggestion', label: 'اقتراح أو ملاحظة' },
  { value: 'other', label: 'أخرى' },
];

export default function Support() {
  const { user } = useAuth();
  const [form, setForm] = useState({ category: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post('/support', {
        category: form.category,
        subject: form.subject,
        message: form.message,
      });
      setSent(true);
      setForm({ category: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
        <Headphones size={22} className="text-emerald-500" />
        الدعم الفني
      </h1>

      {/* Quick Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <a
          href="https://wa.me/966500000000"
          target="_blank"
          rel="noopener noreferrer"
          className="edu-card p-4 flex flex-col items-center gap-2 no-underline hover:shadow-lg transition group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <MessageCircle size={22} className="text-green-600" />
          </div>
          <span className="text-sm font-bold text-gray-700">واتساب</span>
          <span className="text-[11px] text-gray-400">رد سريع</span>
        </a>

        <a
          href="mailto:support@jusoor-edu.sa"
          className="edu-card p-4 flex flex-col items-center gap-2 no-underline hover:shadow-lg transition group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Mail size={22} className="text-blue-600" />
          </div>
          <span className="text-sm font-bold text-gray-700">البريد الإلكتروني</span>
          <span className="text-[11px] text-gray-400">support@jusoor-edu.sa</span>
        </a>

        <a
          href="tel:920000000"
          className="edu-card p-4 flex flex-col items-center gap-2 no-underline hover:shadow-lg transition group"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Phone size={22} className="text-amber-600" />
          </div>
          <span className="text-sm font-bold text-gray-700">اتصل بنا</span>
          <span className="text-[11px] text-gray-400" dir="ltr">920000000</span>
        </a>
      </div>

      {/* FAQ Section */}
      <div className="edu-card p-5">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2 mb-4">
          <HelpCircle size={18} className="text-emerald-500" />
          الأسئلة الشائعة
        </h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-3.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer text-right"
              >
                <span>{item.q}</span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-3.5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3 animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="edu-card p-5">
        <h2 className="text-lg font-extrabold text-gray-800 flex items-center gap-2 mb-4">
          <FileText size={18} className="text-emerald-500" />
          أرسل رسالة للدعم الفني
        </h2>

        {sent ? (
          <div className="text-center py-8 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <p className="text-lg font-extrabold text-gray-800 mb-1">تم إرسال رسالتك بنجاح</p>
            <p className="text-sm text-gray-400 mb-4">سيتم الرد عليك في أقرب وقت ممكن</p>
            <button
              onClick={() => setSent(false)}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              إرسال رسالة أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <AlertCircle size={15} />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">نوع المشكلة</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="edu-input"
                required
              >
                <option value="">اختر نوع المشكلة</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">عنوان الرسالة</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="صف مشكلتك باختصار"
                className="edu-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">تفاصيل المشكلة</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="اشرح مشكلتك بالتفصيل..."
                className="edu-input min-h-[120px] resize-none"
                required
                rows={5}
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-400">
              <p><strong className="text-gray-500">ملاحظة:</strong> سيتم إرسال الرسالة مع بيانات حسابك ({user?.name} - {user?.phone}) لتسريع حل المشكلة.</p>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full btn-primary py-3 text-sm flex items-center justify-center gap-2"
            >
              {sending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {sending ? 'جاري الإرسال...' : 'إرسال الرسالة'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
