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
  Car,
  Mail,
  ArrowRight
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, AdminView, QueueStatus, EmailNotificationType } from '../types.ts';
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
  onSendEmailNotification?: (type: EmailNotificationType, queue: QueueItem) => void;
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
  onOpenQuickAddModal,
  onSendEmailNotification
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
      if (item.email && onSendEmailNotification) {
        onSendEmailNotification(item.is_paid ? 'completed_paid' : 'wash_finished', item);
      }
    } else if (item.status === 'done') {
      announceQueueVoice(
        `Terima kasih. Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, pembayaran lunas dan ${vehicleLabel} Anda siap diambil.`,
        'paid_pickup'
      );
      if (item.email && onSendEmailNotification) {
        onSendEmailNotification('completed_paid', { ...item, is_paid: true });
      }
    } else {
      const pit = pits.find((p) => p.id === item.pit_id);
      const pitName = pit ? pit.nama_pit : 'Area Pit Cuci';
      announceQueueVoice(
        `Perhatian. Panggilan nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, silakan membawa ${vehicleLabel} Anda menuju ke ${pitName}.`,
        'call_pit'
      );
      if (item.email && onSendEmailNotification) {
        onSendEmailNotification('calling_pit', item);
      }
    }
  };

  const getStatusBadge = (status: QueueStatus) => {
    switch (status) {
      case 'washing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 animate-pulse whitespace-nowrap">
            Sedang Cuci
          </span>
        );
      case 'waiting_payment':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700 whitespace-nowrap">
            Siap Bayar Kasir
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 whitespace-nowrap">
            Selesai & Lunas
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 whitespace-nowrap">
            Menunggu
          </span>
        );
    }
  };

  const getVehicleBadge = (tipe: string) => {
    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
          tipe === 'mobil'
            ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
            : tipe === 'besar'
            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
            : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
        }`}
      >
        {tipe === 'mobil' ? <Car className="w-3 h-3 inline shrink-0" /> : <Bike className="w-3 h-3 inline shrink-0" />}
        <span>{tipe === 'mobil' ? 'Mobil' : tipe === 'besar' ? 'Motor Besar' : 'Motor Kecil'}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner & Quick Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Hero Card */}
        <div
          id="hero-omset-card"
          className="lg:col-span-7 bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 p-5 sm:p-7 rounded-3xl text-white shadow-xl flex flex-col justify-between relative overflow-hidden"
        >
          <div className="space-y-1.5 relative z-10">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-black/40 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-mono inline-block">
              TOTAL PENDAPATAN LUNAS HARI INI
            </span>
            <div className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight pt-1 text-white">
              Rp {totalOmsetPaid.toLocaleString('id-ID')}
            </div>
            <p className="text-xs sm:text-sm font-medium text-emerald-100/90 pt-0.5">
              Dari {queues.filter((q) => q.is_paid).length} transaksi lunas ({queues.length} total antrean terdaftar).
            </p>
          </div>

          <div className="pt-5 sm:pt-6 flex flex-wrap gap-2.5 relative z-10">
            <button
              id="btn-quick-add-queue"
              onClick={onOpenQuickAddModal}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Antrean Baru</span>
            </button>
            <button
              id="btn-goto-queues-menu"
              onClick={() => setCurrentView('queues')}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-3.5 py-2.5 rounded-2xl text-xs transition backdrop-blur-sm flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Clock className="w-4 h-4 text-emerald-200" />
              <span>Kasir Antrean</span>
            </button>
            <button
              id="btn-goto-pit-control"
              onClick={() => setCurrentView('pit')}
              className="bg-black/40 hover:bg-black/60 text-white font-bold px-3.5 py-2.5 rounded-2xl text-xs transition backdrop-blur-sm border border-white/20 flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Operator Pit</span>
            </button>
          </div>

          {/* Background decoration */}
          <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
            <Droplets className="w-56 h-56 text-white" />
          </div>
        </div>

        {/* Live Counters */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
          <div
            id="card-counter-waiting"
            onClick={() => setFilterStatus('waiting')}
            className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col justify-between shadow-xs cursor-pointer ${
              filterStatus === 'waiting'
                ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] hover:border-amber-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold font-mono uppercase text-amber-700 dark:text-amber-400 truncate">
                Menunggu
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-2 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">{waitingCount}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1">Dalam antrean</p>
            </div>
          </div>

          <div
            id="card-counter-washing"
            onClick={() => setFilterStatus('washing')}
            className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col justify-between shadow-xs cursor-pointer ${
              filterStatus === 'washing'
                ? 'bg-teal-500/10 border-teal-500 text-teal-900 dark:text-teal-300 ring-2 ring-teal-500/20'
                : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] hover:border-teal-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold font-mono uppercase text-teal-700 dark:text-teal-400 truncate">
                Sedang Cuci
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-2 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">{washingCount}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1">Di dalam Pit Bay</p>
            </div>
          </div>

          <div
            id="card-counter-waiting-payment"
            onClick={() => setFilterStatus('waiting_payment')}
            className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col justify-between shadow-xs cursor-pointer ${
              filterStatus === 'waiting_payment'
                ? 'bg-orange-500/10 border-orange-500 text-orange-900 dark:text-orange-300 ring-2 ring-orange-500/20'
                : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] hover:border-orange-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold font-mono uppercase text-orange-700 dark:text-orange-400 truncate">
                Perlu Bayar
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-2 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-orange-600 dark:text-orange-400 leading-none">
                {waitingPaymentCount}
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1">Siap ditagih kasir</p>
            </div>
          </div>

          <div
            id="card-counter-done"
            onClick={() => setFilterStatus('done')}
            className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col justify-between shadow-xs cursor-pointer ${
              filterStatus === 'done'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] hover:border-emerald-400/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold font-mono uppercase text-emerald-700 dark:text-emerald-400 truncate">
                Selesai
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="pt-2 sm:pt-3">
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">{doneCount}</div>
              <p className="text-[10px] sm:text-[11px] text-slate-600 dark:text-slate-400 font-medium pt-1">Lunas & selesai</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue Management Section */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl shadow-sm overflow-hidden">
        {/* Filters and Action Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#23293D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Semua', count: queues.length },
              { id: 'waiting', label: 'Menunggu', count: waitingCount },
              { id: 'washing', label: 'Sedang Cuci', count: washingCount },
              { id: 'waiting_payment', label: 'Perlu Bayar', count: waitingPaymentCount },
              { id: 'done', label: 'Selesai', count: doneCount }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`filter-tab-${tab.id}`}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-xs'
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
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2 rounded-2xl shadow-xs flex items-center space-x-1.5 shrink-0 cursor-pointer w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>+ Antrean Baru</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW: Responsive Card List (Visible on screens smaller than md) */}
        {/* ========================================================================= */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#1E2336] p-3 sm:p-4 space-y-3">
          {filteredQueues.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
              <p className="font-semibold text-xs">Tidak ada antrean dalam filter ini.</p>
            </div>
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
                <div
                  key={item.id}
                  id={`queue-card-mobile-${item.id}`}
                  className="bg-slate-50/70 dark:bg-[#161A28]/80 border border-slate-200 dark:border-[#23293D] rounded-2xl p-3.5 space-y-3 shadow-xs"
                >
                  {/* Top Row: Ticket No, Vehicle Badge & Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400">
                        {item.nomor_antrian}
                      </span>
                      {getVehicleBadge(item.tipe_motor)}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {item.created_at}
                    </span>
                  </div>

                  {/* Customer Info & Service */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {item.nama_pemohon}
                      </span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                        Rp {totalBiaya.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-400 text-[11px]">
                      <span>{srv ? srv.nama_layanan : 'Paket Cuci'}</span>
                      {item.email && (
                        <span className="flex items-center space-x-1 font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                          <Mail className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{item.email}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status & Pit Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-[#23293D]/60 text-xs">
                    <div className="flex items-center space-x-1.5">
                      {getStatusBadge(item.status)}
                      {pit && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {pit.nama_pit}
                        </span>
                      )}
                    </div>

                    <div>
                      {item.is_paid ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Lunas</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenPaymentModal(item)}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-200 transition cursor-pointer"
                        >
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Belum Bayar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      onClick={() => handleCallVoice(item)}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      title="Panggil Suara"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Panggil</span>
                    </button>

                    {!item.is_paid ? (
                      <button
                        onClick={() => onOpenPaymentModal(item)}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar & Struk</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onPrintReceipt(item)}
                        className="px-3 py-2 bg-slate-100 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteQueue(item.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW: High-Contrast Table (Visible on md and larger screens)     */}
        {/* ========================================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#161A28]/80 text-slate-600 dark:text-slate-400 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-[#23293D]">
              <tr>
                <th className="py-3.5 px-4">No. Antrean</th>
                <th className="py-3.5 px-3">Nama Pelanggan</th>
                <th className="py-3.5 px-3">Jenis Kendaraan</th>
                <th className="py-3.5 px-3">Paket Layanan</th>
                <th className="py-3.5 px-3">Pit Bay</th>
                <th className="py-3.5 px-3">Status Cuci</th>
                <th className="py-3.5 px-3">Pembayaran</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2336] text-slate-800 dark:text-slate-200 font-medium">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 opacity-60 mb-2" />
                    <p className="font-semibold text-xs">Tidak ada data antrean pada kategori ini.</p>
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
                      className="hover:bg-slate-50/80 dark:hover:bg-[#161A28]/50 transition font-medium"
                    >
                      {/* Ticket Number */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-400">
                            {item.nomor_antrian}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {item.created_at}
                          </span>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[140px]">
                          {item.nama_pemohon}
                        </div>
                        {item.email && (
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[140px]">
                            {item.email}
                          </div>
                        )}
                      </td>

                      {/* Vehicle Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getVehicleBadge(item.tipe_motor)}
                      </td>

                      {/* Service & Price */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]">
                          {srv ? srv.nama_layanan : 'Layanan'}
                        </div>
                        <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          Rp {totalBiaya.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Pit Bay */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.pit_id ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
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

                      {/* Wash Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.is_paid ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Lunas</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenPaymentModal(item)}
                            className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-200 transition cursor-pointer"
                            title="Klik untuk Bayar di Kasir & Cetak Struk"
                          >
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Belum Lunas</span>
                          </button>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Voice Call */}
                        <button
                          id={`btn-voice-call-${item.id}`}
                          onClick={() => handleCallVoice(item)}
                          className="p-1.5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                          title="Panggil Suara Pengumuman"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Pay / Receipt */}
                        {!item.is_paid ? (
                          <button
                            id={`btn-pay-direct-${item.id}`}
                            onClick={() => onOpenPaymentModal(item)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Bayar di Kasir & Cetak Struk"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        ) : (
                          <button
                            id={`btn-print-direct-${item.id}`}
                            onClick={() => onPrintReceipt(item)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#161A28] dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#23293D] font-bold rounded-xl text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Cetak Struk Pembayaran"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          id={`btn-delete-queue-${item.id}`}
                          onClick={() => onDeleteQueue(item.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
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
