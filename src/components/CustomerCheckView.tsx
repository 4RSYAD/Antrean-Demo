import React, { useState } from 'react';
import {
  Search,
  Printer,
  PlusCircle,
  AlertCircle,
  Banknote,
  Check,
  Bike,
  Car
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, CustomerView } from '../types.ts';

interface CustomerCheckViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
  setCurrentView: (view: CustomerView) => void;
  onPrintReceipt: (item: QueueItem) => void;
}

export const CustomerCheckView: React.FC<CustomerCheckViewProps> = ({
  queues,
  services,
  pits,
  setCurrentView,
  onPrintReceipt
}) => {
  const [searchKey, setSearchKey] = useState('');

  const result = searchKey.trim()
    ? queues.find(
        (q) =>
          q.nama_pemohon.toLowerCase().includes(searchKey.toLowerCase()) ||
          q.nomor_antrian.toLowerCase() === searchKey.toLowerCase()
      )
    : null;

  const resultService = result ? services.find((s) => s.id === result.layanan_id) : null;
  const resultPit = result ? pits.find((p) => p.id === result.pit_id) : null;
  const resultPrice = result
    ? result.total_biaya || (resultService
      ? result.tipe_motor === 'mobil'
        ? resultService.harga_mobil || resultService.harga_besar || resultService.harga || 0
        : result.tipe_motor === 'besar'
        ? resultService.harga_besar || resultService.harga || 0
        : resultService.harga_kecil || resultService.harga || 0
      : 0)
    : 0;

  const waitingList = queues.filter((q) => q.status === 'waiting');
  const positionInLine =
    result && result.status === 'waiting'
      ? waitingList.findIndex((q) => q.id === result.id) + 1
      : null;

  const getVehicleLabel = () => {
    if (result?.tipe_motor === 'mobil') return 'Mobil';
    if (result?.tipe_motor === 'besar') return 'Motor Besar';
    return 'Motor Kecil';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Search Header Card */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 sm:p-8 rounded-3xl space-y-6 text-center shadow-lg">
        <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Search className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Cek Status & Progres Antrean Kendaraan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Ketik Nama Pemohon atau Nomor Antrean (contoh: A001)
          </p>
        </div>

        <div className="relative max-w-lg mx-auto">
          <input
            id="input-customer-check-queue"
            type="text"
            placeholder="Masukkan Nama atau No. Antrean..."
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="w-full px-6 py-4 bg-slate-50 dark:bg-[#161A28] border-2 border-slate-300 dark:border-[#23293D] rounded-full text-center text-base sm:text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 tracking-wide transition shadow-inner"
          />
        </div>

        {/* Search Results Display */}
        {searchKey.trim() && (
          <div className="pt-4 border-t border-slate-200 dark:border-[#23293D] animate-in fade-in zoom-in-95 duration-200">
            {result ? (
              <div className="p-6 bg-slate-50 dark:bg-[#161A28] rounded-3xl space-y-4 border-2 border-emerald-500/40 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    TIKET DITEMUKAN
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-black ${
                      result.status === 'washing'
                        ? 'bg-teal-600 text-white animate-pulse'
                        : result.status === 'waiting_payment'
                        ? 'bg-orange-600 text-white'
                        : result.status === 'done'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 text-slate-950 font-black'
                    }`}
                  >
                    {result.status === 'washing'
                      ? 'SEDANG DICUCI'
                      : result.status === 'waiting_payment'
                      ? 'SELESAI CUCI • SILAKAN MENUJU KASIR'
                      : result.status === 'done'
                      ? 'SELESAI & LUNAS'
                      : `MENUNGGU (ANTREAN KE-${positionInLine})`}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 dark:border-[#23293D] pb-3">
                  <div>
                    <span className="text-4xl sm:text-6xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {result.nomor_antrian}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white space-y-0.5">
                    <div>
                      Nama: <span className="text-emerald-700 dark:text-emerald-400">{result.nama_pemohon}</span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          result.tipe_motor === 'mobil'
                            ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300'
                            : result.tipe_motor === 'besar'
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                        }`}
                      >
                        {result.tipe_motor === 'mobil' ? (
                          <Car className="w-3 h-3 inline" />
                        ) : (
                          <Bike className="w-3 h-3 inline" />
                        )}
                        <span>{getVehicleLabel()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-bold">Paket Layanan:</span>
                    <div className="font-extrabold text-slate-900 dark:text-white">{resultService?.nama_layanan}</div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-mono font-bold text-sm">
                      Rp {resultPrice.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400 font-bold">Posisi Pengerjaan:</span>
                    <div className="font-extrabold text-slate-900 dark:text-white">
                      {resultPit ? resultPit.nama_pit : 'Menunggu Alokasi Pit Bay'}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">Waktu Masuk: {result.created_at}</div>
                  </div>
                </div>

                {/* Payment notice for customer */}
                {result.status === 'waiting_payment' && (
                  <div className="p-3.5 bg-orange-100 dark:bg-orange-950/60 border border-orange-300 dark:border-orange-700 rounded-2xl text-xs text-orange-900 dark:text-orange-300 font-semibold flex items-center space-x-2">
                    <Banknote className="w-4 h-4 shrink-0 text-orange-700 dark:text-orange-400" />
                    <span>
                      {result.tipe_motor === 'mobil' ? 'Mobil' : 'Motor'} Anda telah selesai dicuci! Silakan menuju meja kasir untuk menyelesaikan pembayaran senilai <b>Rp {resultPrice.toLocaleString('id-ID')}</b>.
                    </span>
                  </div>
                )}

                {result.is_paid && (
                  <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs text-emerald-900 dark:text-emerald-300 font-semibold flex items-center space-x-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <span>
                      Pembayaran lunas terverifikasi kasir. {result.tipe_motor === 'mobil' ? 'Mobil' : 'Motor'} siap untuk diambil. Terima kasih!
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    id="btn-print-from-check"
                    onClick={() => onPrintReceipt(result)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-1.5 shadow cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-white" />
                    <span>Cetak Struk Tiket</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Nomor antrean atau nama tidak ditemukan dalam daftar aktif hari ini.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Switch to Register */}
      <div className="text-center p-6 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Belum Memiliki Tiket Antrean?</h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Daftarkan kendaraan Anda secara mandiri untuk mendapatkan nomor antrean digital seketika.
        </p>
        <button
          id="btn-goto-register"
          onClick={() => setCurrentView('register')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition shadow-md inline-flex items-center space-x-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>Ambil Nomor Antrean Baru Sekarang</span>
        </button>
      </div>
    </div>
  );
};
