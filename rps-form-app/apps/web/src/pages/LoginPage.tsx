import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, UserProfile } from '../services/auth.service';
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck2, 
  Bot, 
  Layers, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Harap isi email dan kata sandi.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
      
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');

      if (redirectUrl) {
        navigate(decodeURIComponent(redirectUrl));
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredential = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-xl mb-4">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dunia Kampus</h2>
        <p className="mt-1 text-sm text-slate-600 font-medium">Portal Dosen — Rencana Pembelajaran Semester (RPS)</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl px-4 sm:px-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200/80">
          
          {/* Kolom Kiri: Form Login */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Masuk ke Akun Anda</h3>
                <p className="text-xs text-slate-500 mt-1">Silakan masukkan email dan kata sandi terdaftar.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@kampus.ac.id"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 active:scale-[0.99] transition shadow-md disabled:opacity-60"
                >
                  {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="relative mt-4 mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-500">Belum punya akun?</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Fitur pendaftaran dengan Google (Gmail) sedang dalam tahap integrasi.')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 active:scale-[0.99] transition shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                    <path d="M1 1h22v22H1z" fill="none" />
                  </svg>
                  Daftar dengan Google
                </button>
              </form>
            </div>

            {/* Quick Demo Credentials Autofill */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                ⚡ Kredensial Demo Cepat (1-Klik):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillCredential('admin@kampus.rumahku.web.id', '11jTKLM0sa')}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 transition text-left group"
                >
                  <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Akun Admin
                  </span>
                  <span className="text-[10px] text-purple-700 truncate w-full mt-0.5">admin@kampus...</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredential('dosen1@uncm.ac.id', 'password123')}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition text-left group"
                >
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Dosen 1 (UNCM)
                  </span>
                  <span className="text-[10px] text-blue-700 truncate w-full mt-0.5">dosen1@uncm.ac.id</span>
                </button>

                <button
                  type="button"
                  onClick={() => fillCredential('dosen2@itb.ac.id', 'password123')}
                  className="flex flex-col items-start p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 transition text-left group"
                >
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Dosen 2 (ITB)
                  </span>
                  <span className="text-[10px] text-emerald-700 truncate w-full mt-0.5">dosen2@itb.ac.id</span>
                </button>
              </div>
            </div>

          </div>

          {/* Kolom Kanan: Penjelasan Fitur & Ekosistem */}
          <div className="md:col-span-5 bg-gradient-to-br from-blue-900 to-indigo-950 p-8 sm:p-10 text-white flex flex-col justify-between">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-800 text-blue-200 inline-block mb-4">
                OBE & SN-Dikti Compliant
              </span>
              <h3 className="text-xl font-bold leading-snug">Fitur & Kemampuan Sistem Dunia Kampus</h3>
              <p className="text-xs text-blue-200/90 mt-2 leading-relaxed">
                Platform terintegrasi bagi dosen untuk menyusun dokumen akademik secara akurat dan terstandarisasi.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-800/80 text-blue-300 shrink-0 mt-0.5">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">RPS Wizard Otomatis</h4>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      Penyusunan matriks 16 minggu, pemetaan CPL-CPMK, dan kalkulasi bobot evaluasi 100%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-800/80 text-blue-300 shrink-0 mt-0.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Ekspor DOCX & PDF Presisi</h4>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      Menghasilkan dokumen cetak resmi berstandar universitas tanpa layout bergeser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-800/80 text-blue-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Sistem BVS & AI Telemetry</h4>
                    <p className="text-xs text-blue-200/80 mt-0.5">
                      Tombol feedback otomatis merekam network breadcrumb & log untuk debugging instan bagi admin.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-800/60 flex items-center justify-between text-[11px] text-blue-300">
              <span>Versi 1.0.0 (Production)</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Server Terisolasi
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
