import React, { useState } from 'react';
import {
  Clock,
  Droplets,
  CheckCircle,
  CreditCard,
  Printer,
  Trash2,
  Volume2,
  PlusCircle,
  Play,
  AlertCircle,
  Check,
  Bike,
  Car
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, AdminView, QueueStatus } from '../types.ts';
import { announceQueueVoice } from '../utils/audio.ts';

interface DashboardAdminViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
  onDeleteQueue: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus, pitId?: string | null) => void;
  onOpenPaymentModal: (item: QueueItem) => void;
  onPrintReceipt: (item: QueueItem) => void;
  searchQuery: string;
  setCurrentView: (view: AdminView) => void;
  onOpenQuickAddModal: () => void;
}

export const DashboardAdminView: React.FC<DashboardAdminViewProps> = ({
  queues,
  services,
  pits,
  onDeleteQueue,
  onUpdateStatus,
  onOpenPaymentModal,
  onPrintReceipt,
  searchQuery,
  setCurrentView,
  onOpenQuickAddModal
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredQueues = queues.filter((q) => {
    const qName = q.nama_pemohon.toLowerCase();
    const qNum = q.nomor_antrian.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = qName.includes(query) || qNum.includes(query);
    const matchesFilter = filterStatus === 'all' ? true : q.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const washingCount = queues.filter((q) => q.status === 'washing').length;
  const waitingPaymentCount = queues.filter((q) => q.status === 'waiting_payment').length;
  const doneCount = queues.filter((q) => q.status === 'done').length;

  const totalOmsetPaid = queues
    .filter((q) => q.is_paid)
    .reduce((acc, q) => {
      const srv = services.find((s) => s.id === q.layanan_id);
      let amount = q.total_biaya || 0;
      if (!amount && srv) {
        if (q.tipe_motor === 'mobil') {
          amount = srv.harga_mobil || srv.harga_besar || srv.harga || 0;
        } else if (q.tipe_motor === 'besar') {
          amount = srv.harga_besar || srv.harga || 0;
        } else {
          amount = srv.harga_kecil || srv.harga || 0;
        }
      }
      return acc + amount;
    }, 0);

  const handleCallVoice = (item: QueueItem) => {
    const vehicleLabel = item.tipe_motor === 'mobil' ? 'mobil' : item.tipe_motor === 'besar' ? 'motor besar' : 'motor';
    if (item.status === 'waiting_payment') {
      announceQueueVoice(
        `Pengumuman selesai cuci: Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, ${vehicleLabel} Anda telah selesai dicuci. Silakan menuju ke kasir untuk proses pembayaran.`,
        'wash_done'
      );
    } else if (item.status === 'done') {
      announceQueueVoice(
        `Terima kasih. Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, pembayaran lunas dan ${vehicleLabel} Anda siap diambil.`,
        'paid_pickup'
      );
    } else {
      const pit = pits.find((p) => p.id === item.pit_id);
      const pitName = pit ? pit.nama_pit : 'Area Pit Cuci';
      announceQueueVoice(
        `Perhatian. Panggilan nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, silakan membawa ${vehicleLabel} Anda menuju ke ${pitName}.`,
        'call_pit'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hero Card */}
        <div
          id="hero-omset-card"
          className="lg:col-span-7 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-2 relative z-10">
            <span className="text-[11px] font-black uppercase tracking-wider bg-black/50 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-mono inline-block">
              TOTAL PENDAPATAN LUNAS HARI INI
            </span>
            <div className="text-3xl sm:text-5xl font-black font-mono tracking-tight pt-2 text-white">
              Rp {totalOmsetPaid.toLocaleString('id-ID')}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-emerald-100 pt-1">
              Dari {queues.filter((q) => q.is_paid).length} kendaraan lunas ({queues.length} total antrean terdaftar).
            </p>
          </div>

          <div className="pt-6 flex flex-wrap gap-3 relative z-10">
            <button
              id="btn-quick-add-queue"
              onClick={onOpenQuickAddModal}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-5 py-2.5 rounded-full text-xs transition shadow-lg flex items-center space-x-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Tambah Antrean Baru</span>
            </button>
            <button
              id="btn-goto-queues-menu"
              onClick={() => setCurrentView('queues')}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2.5 rounded-full text-xs transition backdrop-blur-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-emerald-200" />
              <span>Menu Antrean Kasir</span>
            </button>
            <button
              id="btn-goto-pit-control"
              onClick={() => setCurrentView('pit')}
              className="bg-black/50 hover:bg-black/70 text-white font-bold px-4 py-2.5 rounded-full text-xs transition backdrop-blur-sm border border-white/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Operator Pit Bay</span>
            </button>
          </div>

          {/* Background decoration */}
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <Droplets className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Live Counters */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div
            id="card-counter-waiting"
            className="bg-white dark:bg-[#0F121C] p-5 rounded-3xl border border-slate-200 dark:border-[#23293D] flex flex-col justify-between shadow-sm hover:border-amber-400/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono uppercase text-amber-700 dark:text-amber-400">
                Menunggu Cuci
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-3">
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{waitingCount}</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Kendaraan dalam antrean</p>
            </div>
          </div>

          <div
            id="card-counter-washing"
            className="bg-white dark:bg-[#0F121C] p-5 rounded-3xl border border-slate-200 dark:border-[#23293D] flex flex-col justify-between shadow-sm hover:border-teal-400/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono uppercase text-teal-700 dark:text-teal-400">
                Sedang Cuci
              </span>
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-3">
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{washingCount}</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Aktif di dalam Pit Bay</p>
            </div>
          </div>

          <div
            id="card-counter-waiting-payment"
            className="bg-white dark:bg-[#0F121C] p-5 rounded-3xl border border-slate-200 dark:border-[#23293D] flex flex-col justify-between shadow-sm hover:border-orange-400/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono uppercase text-orange-700 dark:text-orange-400">
                Menunggu Bayar
              </span>
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-3">
              <div className="text-3xl font-black font-mono text-orange-600 dark:text-orange-400">
                {waitingPaymentCount}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Siap ditagih kasir</p>
            </div>
          </div>

          <div
            id="card-counter-done"
            className="bg-white dark:bg-[#0F121C] p-5 rounded-3xl border border-slate-200 dark:border-[#23293D] flex flex-col justify-between shadow-sm hover:border-blue-400/50 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono uppercase text-blue-700 dark:text-blue-400">
                Selesai & Lunas
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-3">
              <div className="text-3xl font-black font-mono text-slate-900 dark:text-white">{doneCount}</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Kendaraan selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue Management Section */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl shadow-sm overflow-hidden">
        {/* Filters and Search Bar */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#23293D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Semua Status', count: queues.length },
              { id: 'waiting', label: 'Menunggu', count: waitingCount },
              { id: 'washing', label: 'Sedang Cuci', count: washingCount },
              { id: 'waiting_payment', label: 'Perlu Bayar', count: waitingPaymentCount },
              { id: 'done', label: 'Selesai & Lunas', count: doneCount }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#1E2336]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    filterStatus === tab.id
                      ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            id="btn-add-ticket-table"
            onClick={onOpenQuickAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-sm flex items-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Tambah Antrean</span>
          </button>
        </div>

        {/* Queues Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#161A28]/60 text-slate-600 dark:text-slate-400 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-[#23293D]">
              <tr>
                <th className="py-3.5 px-4">No. Antrean</th>
                <th className="py-3.5 px-3">Nama Pelanggan</th>
                <th className="py-3.5 px-3">Jenis Kendaraan</th>
                <th className="py-3.5 px-3">Paket Layanan</th>
                <th className="py-3.5 px-3">Lokasi Pit Bay</th>
                <th className="py-3.5 px-3">Status Cuci</th>
                <th className="py-3.5 px-3">Pembayaran Kasir</th>
                <th className="py-3.5 px-4 text-right">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2336]">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-semibold">Tidak ada data antrean pada kategori ini.</p>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((item) => {
                  const srv = services.find((s) => s.id === item.layanan_id);
                  const pit = pits.find((p) => p.id === item.pit_id);
                  let totalBiaya = item.total_biaya || 0;
                  if (!totalBiaya && srv) {
                    if (item.tipe_motor === 'mobil') {
                      totalBiaya = srv.harga_mobil || srv.harga_besar || srv.harga || 0;
                    } else if (item.tipe_motor === 'besar') {
                      totalBiaya = srv.harga_besar || srv.harga || 0;
                    } else {
                      totalBiaya = srv.harga_kecil || srv.harga || 0;
                    }
                  }

                  return (
                    <tr
                      key={item.id}
                      id={`queue-row-${item.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#161A28]/50 transition font-medium text-slate-800 dark:text-slate-200"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                            {item.nomor_antrian}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {item.created_at}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{item.nama_pemohon}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.tipe_motor === 'mobil'
                              ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                              : item.tipe_motor === 'besar'
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}
                        >
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
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {srv ? srv.nama_layanan : 'Layanan'}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          Rp {totalBiaya.toLocaleString('id-ID')}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {item.pit_id ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {pit ? pit.nama_pit : 'Pit Terpilih'}
                          </span>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => {
                              const newPitId = e.target.value || null;
                              onUpdateStatus(item.id, newPitId ? 'washing' : 'waiting', newPitId);
                            }}
                            className="bg-slate-100 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] text-[11px] font-medium text-slate-800 dark:text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="">-- Pilih Pit --</option>
                            {pits.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nama_pit}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono inline-block ${
                            item.status === 'washing'
                              ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 animate-pulse'
                              : item.status === 'waiting_payment'
                              ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                              : item.status === 'done'
                              ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                              : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          }`}
                        >
                          {item.status === 'washing'
                            ? 'SEDANG CUCI'
                            : item.status === 'waiting_payment'
                            ? 'SELESAI CUCI (MENUNGGU BAYAR)'
                            : item.status === 'done'
                            ? 'SELESAI'
                            : 'MENUNGGU'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {item.is_paid ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>LUNAS</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenPaymentModal(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[10px] font-extrabold font-mono bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-200 dark:hover:bg-rose-900/60 transition cursor-pointer"
                            title="Klik untuk Bayar di Kasir & Cetak Struk"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>BELUM BAYAR (BAYAR & STRUK)</span>
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Quick Voice Call */}
                        <button
                          id={`btn-voice-call-${item.id}`}
                          onClick={() => handleCallVoice(item)}
                          className="p-1.5 sm:p-2 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                          title="Panggil Suara Pengumuman"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Action: waiting -> start wash */}
                        {item.status === 'waiting' && (
                          <button
                            id={`btn-advance-wash-${item.id}`}
                            onClick={() => onUpdateStatus(item.id, 'washing', pits[0]?.id || null)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Mulai Cuci"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Mulai Cuci</span>
                          </button>
                        )}

                        {/* Action: washing -> finish wash */}
                        {item.status === 'washing' && (
                          <button
                            id={`btn-advance-finish-wash-${item.id}`}
                            onClick={() => {
                              onUpdateStatus(item.id, 'waiting_payment');
                              handleCallVoice(item);
                            }}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Selesai Cuci (Panggil ke Kasir)"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                            <span>Selesai Cuci</span>
                          </button>
                        )}

                        {/* Action: Process Payment & Print Receipt */}
                        {!item.is_paid ? (
                          <button
                            id={`btn-dashboard-pay-${item.id}`}
                            onClick={() => onOpenPaymentModal(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[11px] transition shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
                            title="Bayar di Kasir & Cetak Struk"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-white" />
                            <span>Bayar & Struk</span>
                          </button>
                        ) : (
                          <button
                            id={`btn-print-receipt-${item.id}`}
                            onClick={() => onPrintReceipt(item)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#161A28] dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#23293D] font-bold rounded-xl text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Cetak Faktur Struk"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          id={`btn-delete-queue-${item.id}`}
                          onClick={() => onDeleteQueue(item.id)}
                          className="p-1.5 sm:p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition cursor-pointer"
                          title="Hapus Antrean"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
