import React, { useState } from 'react';
import {
  FileText,
  DollarSign,
  Printer,
  Clock,
  Bike,
  Car
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem } from '../types.ts';

interface AdminReportsViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({
  queues,
  services
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const paidQueues = queues.filter((q) => q.is_paid);
  const unpaidQueues = queues.filter((q) => !q.is_paid && q.status !== 'cancelled');

  const getItemAmount = (q: QueueItem) => {
    if (q.total_biaya) return q.total_biaya;
    const srv = services.find((s) => s.id === q.layanan_id);
    if (!srv) return 0;
    if (q.tipe_motor === 'mobil') {
      return srv.harga_mobil || srv.harga_besar || srv.harga || 0;
    }
    return q.tipe_motor === 'besar'
      ? srv.harga_besar || srv.harga || 0
      : srv.harga_kecil || srv.harga || 0;
  };

  const totalOmsetPaid = paidQueues.reduce((acc, q) => acc + getItemAmount(q), 0);
  const totalPendingPayment = unpaidQueues.reduce((acc, q) => acc + getItemAmount(q), 0);

  // Breakdown Motor Kecil vs Besar vs Mobil
  const kecilQueues = paidQueues.filter((q) => q.tipe_motor === 'kecil');
  const besarQueues = paidQueues.filter((q) => q.tipe_motor === 'besar');
  const mobilQueues = paidQueues.filter((q) => q.tipe_motor === 'mobil');

  const kecilTotalOmset = kecilQueues.reduce((acc, q) => acc + getItemAmount(q), 0);
  const besarTotalOmset = besarQueues.reduce((acc, q) => acc + getItemAmount(q), 0);
  const mobilTotalOmset = mobilQueues.reduce((acc, q) => acc + getItemAmount(q), 0);

  const filteredHistory = paidQueues.filter((q) => {
    if (filterType === 'all') return true;
    return q.tipe_motor === filterType;
  });

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
            <FileText className="w-4 h-4" />
            <span>LAPORAN & KEUANGAN KASIR CUCI KENDARAAN</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rekap Transaksi & Omset Harian
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Analisis pendapatan harian cuci kendaraan, rincian motor kecil, motor besar, dan mobil, serta rekap transaksi kasir
          </p>
        </div>

        <button
          id="btn-print-report-sheet"
          onClick={handlePrintReport}
          className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Rekap Laporan</span>
        </button>
      </div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Omset Lunas */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-lg space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-100 text-xs font-bold font-mono">
            <span>TOTAL OMSET LUNAS</span>
            <DollarSign className="w-5 h-5 text-lime-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            Rp {totalOmsetPaid.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-emerald-100 font-semibold">
            {paidQueues.length} transaksi selesai di kasir
          </span>
        </div>

        {/* Omset Motor Kecil */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
            <span>MOTOR KECIL</span>
            <Bike className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {kecilTotalOmset.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {kecilQueues.length} unit motor kecil
          </span>
        </div>

        {/* Omset Motor Besar */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 text-xs font-bold font-mono">
            <span>MOTOR BESAR</span>
            <Bike className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {besarTotalOmset.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {besarQueues.length} unit motor besar
          </span>
        </div>

        {/* Omset Mobil */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-blue-700 dark:text-blue-400 text-xs font-bold font-mono">
            <span>MOBIL</span>
            <Car className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {mobilTotalOmset.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {mobilQueues.length} unit mobil
          </span>
        </div>

        {/* Belum Bayar */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-orange-600 dark:text-orange-400 text-xs font-bold font-mono">
            <span>BELUM BAYAR (PENDING)</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {totalPendingPayment.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {unpaidQueues.length} kendaraan dalam antrean / cuci
          </span>
        </div>
      </div>

      {/* Transactions History Table */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#23293D] pb-4">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Riwayat Transaksi Lunas Kasir</span>
            <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
              {filteredHistory.length} Transaksi
            </span>
          </h3>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kategori Kendaraan:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] text-xs font-bold rounded-xl px-3 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Semua Kategori</option>
              <option value="kecil">Motor Kecil</option>
              <option value="besar">Motor Besar</option>
              <option value="mobil">Mobil</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#23293D] text-slate-600 dark:text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 px-3">No. Transaksi</th>
                <th className="pb-3 px-3">No. Antrean</th>
                <th className="pb-3 px-3">Pelanggan</th>
                <th className="pb-3 px-3">Jenis Kendaraan</th>
                <th className="pb-3 px-3">Layanan</th>
                <th className="pb-3 px-3">Waktu Bayar</th>
                <th className="pb-3 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#23293D]/60 text-slate-800 dark:text-slate-200">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                    Belum ada transaksi pembayaran yang tercatat.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const srv = services.find((s) => s.id === item.layanan_id);
                  const price = getItemAmount(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#161A28]/60 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                        TRX-{item.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-700 dark:text-emerald-400">
                        {item.nomor_antrian}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {item.nama_pemohon}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.tipe_motor === 'mobil'
                            ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300'
                            : item.tipe_motor === 'besar'
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                        }`}>
                          {item.tipe_motor === 'mobil' ? (
                            <Car className="w-3 h-3 inline" />
                          ) : (
                            <Bike className="w-3 h-3 inline" />
                          )}
                          <span>
                            {item.tipe_motor === 'mobil'
                              ? 'Mobil'
                              : item.tipe_motor === 'besar'
                              ? 'Motor Besar'
                              : 'Motor Kecil'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {srv ? srv.nama_layanan : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {item.paid_at || item.completed_at || item.created_at}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                        Rp {price.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
