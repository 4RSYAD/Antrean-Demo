import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  Database,
  CheckCircle2,
  User,
  Phone,
  UserPlus,
  LogIn,
  Info
} from 'lucide-react';
import { AuthUser, AppUser } from '../types.ts';
import {
  getSupabaseClient,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  authenticateWithSupabaseUsers,
  signUpWithSupabaseAuth
} from '../utils/supabase.ts';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onBackToCustomer: () => void;
  isSupabaseConnected: boolean;
  onOpenSettings?: () => void;
  users: AppUser[];
  onRegisterUser: (newUser: AppUser) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigateToTv?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  users,
  onRegisterUser
}) => {
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // UI Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Supabase Drawer
  const [showDbConfig, setShowDbConfig] = useState(false);
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [isSavingDb, setIsSavingDb] = useState(false);
  const [dbStatusMsg, setDbStatusMsg] = useState('');

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSbUrl(creds.url || '');
    setSbKey(creds.anonKey || '');
  }, []);

  // Step 1: Submit Register Form via Supabase Auth
  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Harap lengkapi semua bidang yang wajib diisi (Nama, Email, Kata Sandi).');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();

    // Check if email already exists in local list
    const existingLocal = users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (existingLocal) {
      setErrorMessage('Email ini sudah terdaftar. Silakan login langsung menggunakan akun Anda.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call native Supabase Auth SignUp
      const signUpRes = await signUpWithSupabaseAuth(cleanEmail, regPassword, {
        name: regName.trim(),
        phone: regPhone.trim() || undefined
      });

      // 2. Also register in local app state
      const newPendingUser: AppUser = {
        id: signUpRes.user?.id || `usr-${Date.now()}`,
        name: regName.trim(),
        email: cleanEmail,
        password: regPassword.trim(),
        role: 'pengguna',
        status: 'aktif',
        phone: regPhone.trim() || undefined,
        is_email_verified: true,
        created_at: new Date().toISOString()
      };
      onRegisterUser(newPendingUser);

      setIsLoading(false);
      setLoginEmail(cleanEmail);
      setLoginPassword('');
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setAuthMode('login');
      setSuccessMessage('Pendaftaran berhasil! Akun Anda telah terdaftar. Silakan masuk menggunakan email dan kata sandi Anda.');
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Gagal mendaftar. Silakan coba lagi.');
    }
  };

  // Handle User Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanInput = loginEmail.trim().toLowerCase();
    const passwordInput = loginPassword.trim();

    if (!cleanInput || !passwordInput) {
      setErrorMessage('Harap masukkan email dan kata sandi.');
      return;
    }

    setIsLoading(true);

    try {
      let matchedUser: AppUser | null = null;

      // 1. Try Supabase Auth signInWithPassword
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanInput,
            password: passwordInput
          });

          if (!error && data.user) {
            // Sync user details
            matchedUser = {
              id: data.user.id,
              email: data.user.email || cleanInput,
              name:
                data.user.user_metadata?.name ||
                data.user.email?.split('@')[0]?.toUpperCase() ||
                'Pengguna',
              role: 'pengguna',
              status: 'aktif',
              is_email_verified: true,
              created_at: new Date().toISOString()
            };
          }
        } catch (authErr) {
          console.warn('Supabase Auth error', authErr);
        }
      }

      // 2. Check Supabase users table
      if (!matchedUser) {
        try {
          const dbUser = await authenticateWithSupabaseUsers(cleanInput, passwordInput);
          if (dbUser) {
            matchedUser = dbUser;
          }
        } catch (userErr: any) {
          setIsLoading(false);
          setErrorMessage(userErr?.message || 'Gagal login dari database Supabase.');
          return;
        }
      }

      // 3. Check local users state
      if (!matchedUser) {
        const found = users.find(
          (u) =>
            u.email.toLowerCase() === cleanInput ||
            u.name.toLowerCase() === cleanInput
        );

        if (found) {
          if (found.status === 'nonaktif') {
            setIsLoading(false);
            setErrorMessage('Akun Anda sedang dinonaktifkan oleh Administrator.');
            return;
          }

          if (found.password && found.password !== passwordInput) {
            setIsLoading(false);
            setErrorMessage('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
            return;
          }

          matchedUser = found;
        }
      }

      // 4. Strict Validation: User MUST be registered!
      if (!matchedUser) {
        setIsLoading(false);
        setErrorMessage(
          'Akun tidak ditemukan atau kata sandi salah. Anda harus mendaftar (Register) terlebih dahulu sebelum dapat login.'
        );
        return;
      }

      // Successful login payload
      const authPayload: AuthUser = {
        id: matchedUser.id,
        email: matchedUser.email,
        name: matchedUser.name,
        role: matchedUser.role,
        is_logged_in: true,
        logged_at: new Date().toISOString()
      };

      setSuccessMessage(`Login berhasil! Selamat datang kembali, ${matchedUser.name}...`);
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess(authPayload);
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Gagal login. Silakan coba lagi.');
    }
  };

  const handleSaveDbCreds = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDb(true);
    setDbStatusMsg('');

    saveSupabaseCredentials({
      url: sbUrl.trim(),
      anonKey: sbKey.trim()
    });

    const res = await testSupabaseConnection();
    setIsSavingDb(false);
    setDbStatusMsg(res.message);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-100 dark:bg-[#08090E] transition-colors duration-200">
      {/* Main Authentication Grid */}
      <main className="max-w-5xl w-full mx-auto my-auto py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Side: Brand & Value Prop Info */}
          <div className="lg:col-span-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 dark:from-emerald-950 dark:via-[#0c1520] dark:to-[#0F121C] border border-emerald-500/30 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 text-white border border-white/20 shadow-inner">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>

              <span className="text-[11px] font-mono font-black uppercase tracking-widest text-emerald-200">
                PORTAL AUTENTIKASI PENGGUNA
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 mb-3 text-white leading-tight">
                {authMode === 'login'
                  ? 'Masuk ke Sistem Antrean'
                  : authMode === 'confirm_email'
                  ? 'Konfirmasi Email Supabase'
                  : 'Registrasi Akun Pengguna'}
              </h2>
              <p className="text-xs text-emerald-100 dark:text-slate-300 leading-relaxed mb-6">
                {authMode === 'login'
                  ? 'Gunakan akun yang telah didaftarkan dan dikonfirmasi untuk masuk ke sistem antrean cuci kendaraan.'
                  : authMode === 'confirm_email'
                  ? 'Buka email Anda dan klik tautan konfirmasi pendaftaran resmi dari Supabase untuk mengaktifkan akun.'
                  : 'Pendaftaran akun baru otomatis terdaftar sebagai Pengguna. Peran staf (Kasir, Operator, Administrator) akan diberikan oleh Admin melalui Manajemen Pengguna.'}
              </p>

              <div className="space-y-3.5 pt-4 border-t border-white/10">
                <div className="flex items-start space-x-3 text-xs text-emerald-50 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Verifikasi link email bawaan Supabase untuk keamanan & keaslian akun pengguna.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-emerald-50 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Pemberian hak akses petugas (Kasir/Operator) dikelola langsung oleh Administrator.</span>
                </div>
                <div className="flex items-start space-x-3 text-xs text-emerald-50 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                  <span>Penyimpanan tersinkronisasi langsung dengan database Supabase Realtime.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Card */}
          <div className="lg:col-span-7 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 sm:p-8 rounded-3xl shadow-sm space-y-6 flex flex-col justify-between">
            <div>
              {/* Tab Selector (Hidden if confirming email) */}
              {authMode !== 'confirm_email' && (
                <div className="flex items-center p-1 bg-slate-100 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] mb-6">
                  <button
                    type="button"
                    id="tab-login"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-white dark:bg-[#0F121C] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Masuk (Login)</span>
                  </button>

                  <button
                    type="button"
                    id="tab-register"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-white dark:bg-[#0F121C] text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Daftar (Pengguna)</span>
                  </button>
                </div>
              )}

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 space-y-2">
                  <div className="flex items-start space-x-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                  {authMode === 'login' && errorMessage.includes('mendaftar') && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setRegEmail(loginEmail);
                        setErrorMessage('');
                      }}
                      className="text-xs font-black text-emerald-700 dark:text-emerald-400 underline hover:no-underline ml-6 cursor-pointer"
                    >
                      Daftar Akun Pengguna Baru Sekarang &rarr;
                    </button>
                  )}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs text-emerald-700 dark:text-emerald-300 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* MODE 1: LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Email / Nama Pengguna Terdaftar
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="input-login-email"
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="pengguna@antrean.com"
                        className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kata Sandi (Password)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="input-login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    id="btn-submit-login"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Sistem'}</span>
                  </button>
                </form>
              )}

              {/* MODE 2: REGISTER FORM (PENGGUNA ONLY - NO ROLE SELECTION) */}
              {authMode === 'register' && (
                <form onSubmit={handleInitiateRegister} className="space-y-3.5">
                  {/* Role Notice Pill */}
                  <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-2xl flex items-start space-x-2.5 text-xs text-indigo-700 dark:text-indigo-300">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
                    <p className="leading-relaxed">
                      Pendaftaran akun baru otomatis terdaftar sebagai <b>Pengguna</b>. Tautan konfirmasi email akan dikirimkan langsung oleh Supabase.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="input-reg-name"
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Nama lengkap Anda"
                          className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Email Pengguna <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="input-reg-email"
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="nama@email.com"
                          className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      No. HP / WhatsApp (Opsional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="input-reg-phone"
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="0812-3456-7890"
                        className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="input-reg-password"
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ulangi Kata Sandi <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="input-reg-confirm-password"
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Konfirmasi sandi"
                          className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    id="btn-submit-register"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 mt-3"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun Pengguna'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Bottom Toggle Note */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#1E2337] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {authMode === 'login' ? 'Belum memiliki akun pengguna?' : 'Sudah memiliki akun?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setErrorMessage('');
                }}
                className="font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {authMode === 'login' ? 'Daftar Pengguna Baru' : 'Masuk di Sini'}
              </button>
            </div>
          </div>
        </div>

        {/* Supabase Connection Setup Box (Collapsible) */}
        {showDbConfig && (
          <div className="mt-6 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-[#1E2337]">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Pengaturan Koneksi Supabase
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Masukkan Project URL & Public Anon Key dari dashboard Supabase Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDbConfig(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <form onSubmit={handleSaveDbCreds} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="https://xyzproject.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supabase Public Anon Key
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={sbKey}
                    onChange={(e) => setSbKey(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {dbStatusMsg && (
                <div className="p-3 bg-slate-100 dark:bg-[#161A28] rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  {dbStatusMsg}
                </div>
              )}

              <div className="flex items-center justify-end space-x-2">
                <button
                  type="submit"
                  disabled={isSavingDb}
                  className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {isSavingDb ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi Database'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center pt-6 text-[11px] text-slate-400 dark:text-slate-600">
        &copy; {new Date().getFullYear()} Sistem Manajemen Antrean Cuci Kendaraan. Seluruh hak cipta dilindungi.
      </footer>
    </div>
  );
};
