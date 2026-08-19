import React, { useState, useEffect } from 'react';
import { PlusCircle, Sparkles, X, Clock, Bike, Car, Check, Mail, UserCheck, ShieldCheck } from 'lucide-react';
import { ServiceItem, MotorType, AuthUser } from '../types.ts';

interface CustomerRegisterViewProps {
  services: ServiceItem[];
  authUser?: AuthUser | null;
  onAddQueue: (data: {
    nama_pemohon: string;
    email?: string;
    tipe_motor: MotorType;
    layanan_id: string;
  }) => Promise<any> | void;
}

export const CustomerRegisterView: React.FC<CustomerRegisterViewProps> = ({
  services,
  authUser,
  onAddQueue
}) => {
  const [namaPemohon, setNamaPemohon] = useState(authUser?.name || '');
  const [email, setEmail] = useState(authUser?.email || '');
  const [tipeMotor, setTipeMotor] = useState<MotorType>('kecil');
  const [layananId, setLayananId] = useState(services[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with authUser whenever authUser changes
  useEffect(() => {
    if (authUser?.is_logged_in) {
      if (authUser.name && !namaPemohon) {
        setNamaPemohon(authUser.name);
      }
      if (authUser.email) {
        setEmail(authUser.email);
      }
    }
  }, [authUser]);

  const selectedService = services.find((s) => s.id === layananId) || services[0];
  const currentPrice = selectedService
    ? tipeMotor === 'mobil'
      ? selectedService.harga_mobil || selectedService.harga_besar || selectedService.harga || 0
      : tipeMotor === 'besar'
      ? selectedService.harga_besar || selectedService.harga || 0
      : selectedService.harga_kecil || selectedService.harga || 0
    : 0;

  const getVehicleLabel = (type: MotorType) => {
    if (type === 'mobil') return 'Mobil';
    if (type === 'besar') return 'Motor Besar';
    return 'Motor Kecil';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = namaPemohon.trim() || authUser?.name || 'Pelanggan';
    const finalEmail = (email.trim() || authUser?.email || '').trim() || undefined;

    if (!finalName || !layananId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddQueue({
        nama_pemohon: finalName,
        email: finalEmail,
        tipe_motor: tipeMotor,
        layanan_id: layananId
      });
      if (!authUser?.is_logged_in) {
        setNamaPemohon('');
        setEmail('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-4 sm:p-8 rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-[#23293D] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-inner">
            <PlusCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Pendaftaran Antrean Mandiri
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pilih jenis kendaraan (Motor / Mobil) dan paket cuci untuk mendapatkan nomor tiket antrean
            </p>
          </div>
        </div>

        {/* Logged in auto-sync banner */}
        {authUser?.is_logged_in && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-emerald-950 dark:text-emerald-300 flex items-center space-x-1.5 truncate">
                  <span>Terhubung Otomatis Akun Anda:</span>
                  <span className="underline truncate">{authUser.email}</span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                  Semua notifikasi email (tiket, panggilan pit bay, kwitansi lunas) otomatis dikirim ke alamat email ini.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-[10px] shrink-0 font-mono">
              ✓ AUTO-SYNC
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs font-semibold">
          {/* Input Nama Pelanggan */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">
              Nama Lengkap Pelanggan *
            </label>
            <input
              id="input-customer-name"
              type="text"
              required
              placeholder="Contoh: Budi Santoso / Mas Ryan"
              value={namaPemohon}
              onChange={(e) => setNamaPemohon(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm font-medium transition"
            />
          </div>

          {/* Input Email Pelanggan (Otomatis dari Akun) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Email Notifikasi Antrean {authUser?.is_logged_in ? '(Otomatis dari Akun)' : '(Opsional)'}</span>
              </label>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                {authUser?.is_logged_in ? '✓ Otomatis Aktif' : 'Kirim Tiket & Update'}
              </span>
            </div>
            <input
              id="input-customer-email"
              type="email"
              placeholder="contoh@gmail.com (untuk menerima status antrean via email)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs font-medium transition"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {authUser?.is_logged_in
                ? 'Email akun Anda terisi otomatis. Anda dapat mengubahnya jika ingin mengirimkan notifikasi ke email lain.'
                : 'Notifikasi otomatis saat: Ambil Tiket • Mau Dipanggil • Sedang Dipanggil ke Pit • Selesai Cuci & Pembayaran Lunas.'}
            </p>
          </div>

          {/* Pilihan Tipe Kendaraan: Motor Kecil, Motor Besar, Mobil */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-2 font-bold">
              Pilih Ukuran & Kategori Kendaraan *
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Motor Kecil */}
              <div
                id="btn-select-motor-kecil"
                onClick={() => setTipeMotor('kecil')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2.5 relative ${
                  tipeMotor === 'kecil'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] hover:border-emerald-500/40'
                }`}
              >
                {tipeMotor === 'kecil' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Motor Kecil</h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">Tarif Reguler</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Beat, Vario 125/150, Scoopy, Mio, Supra, Jupiter, Fazzio, Genio, dsb.
                </p>
              </div>

              {/* Motor Besar */}
              <div
                id="btn-select-motor-besar"
                onClick={() => setTipeMotor('besar')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2.5 relative ${
                  tipeMotor === 'besar'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 dark:border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] hover:border-amber-500/40'
                }`}
              >
                {tipeMotor === 'besar' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Motor Besar</h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Maxi / Moge</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  NMAX, PCX, Aerox, ADV, XMAX, Ninja, CBR, GSX, Harley, Vespa, dsb.
                </p>
              </div>

              {/* Mobil */}
              <div
                id="btn-select-mobil"
                onClick={() => setTipeMotor('mobil')}
                className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2.5 relative ${
                  tipeMotor === 'mobil'
                    ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-600 dark:border-blue-500 shadow-md ring-1 ring-blue-500'
                    : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] hover:border-blue-500/40'
                }`}
              >
                {tipeMotor === 'mobil' && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Mobil</h4>
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-bold">Tarif Mobil</p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  Avanza, Brio, Innova, Pajero, Fortuner, HRV, Sedan, SUV, dsb.
                </p>
              </div>
            </div>
          </div>

          {/* Service Selection Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-800 dark:text-slate-200 font-bold">
                Pilih Paket Layanan Cuci *
              </label>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                Tarif disesuaikan: {getVehicleLabel(tipeMotor)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((s) => {
                const isSelected = s.id === layananId;
                const itemPrice = tipeMotor === 'mobil'
                  ? s.harga_mobil || s.harga_besar || s.harga || 0
                  : tipeMotor === 'besar'
                  ? s.harga_besar || s.harga || 0
                  : s.harga_kecil || s.harga || 0;

                return (
                  <div
                    key={s.id}
                    id={`service-select-${s.id}`}
                    onClick={() => setLayananId(s.id)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 relative ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] hover:border-emerald-500/40'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}

                    <div className="space-y-1.5 pr-6">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {s.nama_layanan}
                        </h4>
                        {s.badge && (
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[9px] font-black rounded-md font-mono">
                            {s.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                        {s.deskripsi}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-[#23293D] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-base font-mono font-black text-emerald-700 dark:text-emerald-400">
                          Rp {itemPrice.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {getVehicleLabel(tipeMotor)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] px-2.5 py-1 rounded-xl">
                        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>~{s.durasi_menit} Mnt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              id="btn-submit-new-ticket"
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-black py-4 rounded-2xl transition shadow-lg text-sm flex items-center justify-center space-x-2 ${
                isSubmitting
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menyimpan ke Cloud Supabase...</span>
                </div>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5 text-white" />
                  <span>Ambil Tiket Antrean Sekarang</span>
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
              Setelah mendaftar, Anda akan langsung diarahkan ke <strong>Layar Ruang Tunggu</strong> untuk memantau status panggilan antrean secara langsung.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
