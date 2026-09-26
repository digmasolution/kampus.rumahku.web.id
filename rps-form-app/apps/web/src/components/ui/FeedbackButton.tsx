/**
 * FeedbackButton.tsx
 * Komponen floating feedback button dengan modal pelaporan.
 * Tanggung jawab: HANYA UI/UX rendering dan state form lokal.
 */

import { useState } from 'react';
import {
  MessageSquarePlus, X, Bug, Lightbulb, MessageCircle,
  Send, CheckCircle, Loader2, ChevronDown,
} from 'lucide-react';
import { useFeedbackContext } from '../../hooks/useFeedbackContext';
import { submitFeedback, FeedbackType, BugSeverity } from '../../services/feedbackApi';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'bug',
    label: 'Laporkan Bug',
    icon: <Bug className="w-4 h-4 text-red-500" />,
    desc: 'Sesuatu tidak berjalan seperti seharusnya',
  },
  {
    value: 'feature_request',
    label: 'Usulkan Fitur',
    icon: <Lightbulb className="w-4 h-4 text-yellow-500" />,
    desc: 'Saya punya ide untuk fitur baru',
  },
  {
    value: 'general',
    label: 'Masukan Umum',
    icon: <MessageCircle className="w-4 h-4 text-blue-500" />,
    desc: 'Saran, kritik, atau pertanyaan lainnya',
  },
];

export default function FeedbackButton() {
  const [isOpen, setIsOpen]           = useState(false);
  const [type, setType]               = useState<FeedbackType>('bug');
  const [severity, setSeverity]       = useState<BugSeverity>('MAJOR');
  const [message, setMessage]         = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg]       = useState('');
  const getContext                    = useFeedbackContext();

  function handleOpen() {
    setIsOpen(true);
    setSubmitState('idle');
    setMessage('');
    setErrorMsg('');
  }

  function handleClose() {
    if (submitState === 'loading') return;
    setIsOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || submitState === 'loading') return;

    setSubmitState('loading');
    setErrorMsg('');

    // Ambil snapshot konteks cerdas saat tombol Submit ditekan
    const context = getContext();

    try {
      await submitFeedback({ type, severity, message: message.trim(), context });
      setSubmitState('success');
      setTimeout(() => { setIsOpen(false); setSubmitState('idle'); }, 2500);
    } catch (err: unknown) {
      setSubmitState('error');
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorMsg(msg ?? 'Gagal mengirim. Coba lagi.');
    }
  }

  const placeholder: Record<FeedbackType, string> = {
    bug:             'Jelaskan apa yang terjadi. Langkah apa yang Anda lakukan sebelum bug muncul?',
    feature_request: 'Fitur apa yang ingin Anda tambahkan? Mengapa fitur ini penting?',
    general:         'Tulis masukan, saran, atau pertanyaan Anda di sini...',
  };

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <button
        onClick={handleOpen}
        title="Laporkan masalah atau beri masukan"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white rounded-2xl shadow-xl transition-all duration-200"
        aria-label="Buka form feedback"
      >
        <MessageSquarePlus className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Feedback</span>
      </button>

      {/* ── Backdrop ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-blue-900" />
                <h2 className="font-bold text-gray-900 text-base">Kirim Feedback</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={submitState === 'loading'}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Success State ── */}
            {submitState === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                <CheckCircle className="w-14 h-14 text-green-500" />
                <p className="text-gray-800 font-semibold text-lg text-center">Terima kasih!</p>
                <p className="text-gray-500 text-sm text-center">
                  Feedback beserta konteks halaman telah dicatat oleh sistem AI.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">

                {/* Jenis Feedback */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Jenis Laporan
                  </label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as FeedbackType)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer pr-10"
                    >
                      {FEEDBACK_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Tingkat Keparahan (Jika Bug) */}
                {type === 'bug' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Tingkat Keparahan (BVS Severity)
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { val: 'CRITICAL', label: 'Critical', bg: 'bg-red-50 text-red-700 border-red-200' },
                        { val: 'MAJOR', label: 'Major', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
                        { val: 'MINOR', label: 'Minor', bg: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                        { val: 'TRIVIAL', label: 'Trivial', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
                      ].map((s) => (
                        <button
                          key={s.val}
                          type="button"
                          onClick={() => setSeverity(s.val as BugSeverity)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition ${
                            severity === s.val
                              ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                              : `${s.bg} hover:brightness-95`
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pesan */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Pesan Anda
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={placeholder[type]}
                    rows={5}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-gray-400"
                  />
                </div>

                {/* Info Konteks Cerdas */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-blue-800 mb-1">
                    Konteks yang akan otomatis dikirim:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
                    <li>Semua <strong>network error</strong> (4xx/5xx) dari sesi ini</li>
                    <li>Semua <strong>console.error & warn</strong> dari sesi ini</li>
                    <li>Jejak navigasi halaman (route history)</li>
                    <li>Waktu di halaman saat ini & memory usage</li>
                    <li>Info browser & viewport</li>
                  </ul>
                  <p className="text-xs text-blue-500 mt-1.5 italic">
                    * Log sukses & console.log biasa <strong>tidak</strong> dikirim (noise).
                  </p>
                </div>

                {/* Error */}
                {submitState === 'error' && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    ⚠ {errorMsg}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!message.trim() || submitState === 'loading'}
                  className="flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {submitState === 'loading' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Kirim + Konteks Otomatis</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
