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
  Search,
  Check,
  AlertCircle,
  Bike,
  Car,
  Mail,
  BellRing
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, QueueStatus, EmailNotificationType } from '../types.ts';
import { announceQueueVoice } from '../utils/audio.ts';
import { getEmailTypeLabel } from '../utils/emailTemplates.ts';

interface AdminQueuesViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
  onOpenQuickAddModal: () => void;
  onOpenPaymentModal: (queue: QueueItem) => void;
  onPrintReceipt: (queue: QueueItem) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus, pitId?: string | null) => void;
  onDeleteQueue: (id: string) => void;
  onSendEmailNotification?: (type: EmailNotificationType, queue: QueueItem) => void;
  onUpdateQueueContact?: (id: string, email: string, phone?: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const AdminQueuesView: React.FC<AdminQueuesViewProps> = ({
  queues,
  services,
  pits,
  onOpenQuickAddModal,
  onOpenPaymentModal,
  onPrintReceipt,
  onUpdateStatus,
  onDeleteQueue,
  onSendEmailNotification,
  onUpdateQueueContact,
  searchQuery,
  setSearchQuery
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [activeEmailMenuId, setActiveEmailMenuId] = useState<string | null>(null);
  const [editingEmailQueueId, setEditingEmailQueueId] = useState<string | null>(null);
  const [tempEmailValue, setTempEmailValue] = useState<string>('');

  const filteredQueues = queues.filter((q) => {
    const qName = q.nama_pemohon.toLowerCase();
    const qNum = q.nomor_antrian.toLowerCase();
    const qEmail = (q.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = qName.includes(query) || qNum.includes(query) || qEmail.includes(query);
    const matchesFilter = selectedStatusTab === 'all' ? true : q.status === selectedStatusTab;
    return matchesSearch && matchesFilter;
  });

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const washingCount = queues.filter((q) => q.status === 'washing').length;
  const waitingPaymentCount = queues.filter((q) => q.status === 'waiting_payment').length;
  const doneCount = queues.filter((q) => q.status === 'done').length;

  const handleCallCustomVoice = (item: QueueItem, type: 'pit' | 'kasir' | 'ambil') => {
    const veh = item.tipe_motor === 'mobil' ? 'mobil' : item.tipe_motor === 'besar' ? 'motor besar' : 'motor';
    if (type === 'pit') {
      const pit = pits.find((p) => p.id === item.pit_id);
      const pitName = pit ? pit.nama_pit : 'Area Pit';
      announceQueueVoice(
        `Perhatian. Panggilan nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, silakan membawa ${veh} Anda menuju ke ${pitName}.`,
        'call_pit'
      );
      if (item.email && onSendEmailNotification) {
        onSendEmailNotification('calling_pit', item);
      }
    } else if (type === 'kasir') {
      announceQueueVoice(
        `Pengumuman selesai cuci: Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, ${veh} Anda telah selesai dicuci. Silakan menuju kasir untuk proses pembayaran.`,
        'wash_done'
      );
      if (item.email && onSendEmailNotification) {
        onSendEmailNotification(item.is_paid ? 'completed_paid' : 'wash_finished', item);
      }
    } else {
      announceQueueVoice(
        `Terima kasih. Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, kendaraan Anda telah selesai dan siap diambil.`,
        'paid_pickup'
      );
      if (item.email && onSendEmailNotification) {
        onSendEmailNotification('completed_paid', { ...item, is_paid: true });
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            Daftar Antrean & Kontrol Kasir
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Kelola antrean kendaraan, panggilan suara, notifikasi email, dan pembayaran kasir.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            id="btn-add-queue-menu"
            onClick={onOpenQuickAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer w-full sm:w-auto"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>+ Antrean Baru</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setSelectedStatusTab('waiting')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'waiting'
              ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300 hover:border-amber-400/50'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="truncate">1. MENUNGGU</span>
            <Clock className="w-4 h-4 text-amber-500 shrink-0 ml-1" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white leading-none">
            {waitingCount}
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('washing')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'washing'
              ? 'bg-teal-500/10 border-teal-500 text-teal-900 dark:text-teal-300 ring-2 ring-teal-500/20'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300 hover:border-teal-400/50'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="truncate">2. SEDANG CUCI</span>
            <Droplets className="w-4 h-4 text-teal-500 shrink-0 ml-1" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white leading-none">
            {washingCount}
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('waiting_payment')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'waiting_payment'
              ? 'bg-orange-500/10 border-orange-500 text-orange-900 dark:text-orange-300 ring-2 ring-orange-500/20'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300 hover:border-orange-400/50'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="truncate">3. PERLU BAYAR</span>
            <CreditCard className="w-4 h-4 text-orange-500 shrink-0 ml-1" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-orange-600 dark:text-orange-400 leading-none">
            {waitingPaymentCount}
          </div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('done')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'done'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300 hover:border-emerald-400/50'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span className="truncate">4. SELESAI</span>
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white leading-none">
            {doneCount}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl overflow-hidden shadow-sm">
        {/* Table Filter Tabs and Search Bar */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-[#23293D] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Semua', count: queues.length },
              { id: 'waiting', label: 'Menunggu', count: waitingCount },
              { id: 'washing', label: 'Sedang Cuci', count: washingCount },
              { id: 'waiting_payment', label: 'Perlu Bayar', count: waitingPaymentCount },
              { id: 'done', label: 'Selesai', count: doneCount }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatusTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer shrink-0 ${
                  selectedStatusTab === tab.id
                    ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#23293D]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                    selectedStatusTab === tab.id
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, tiket, atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW: Cards for Smartphone / Small Screens                         */}
        {/* ========================================================================= */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-[#1E2336] p-3 sm:p-4 space-y-3">
          {filteredQueues.length === 0 ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 opacity-60" />
              <p className="font-semibold text-xs">Tidak ada antrean yang sesuai filter.</p>
            </div>
          ) : (
            filteredQueues.map((item) => {
              const service = services.find((s) => s.id === item.layanan_id);
              const pit = pits.find((p) => p.id === item.pit_id);
              let totalBiaya = item.total_biaya || 0;
              if (!totalBiaya && service) {
                if (item.tipe_motor === 'mobil') {
                  totalBiaya = service.harga_mobil || service.harga_besar || service.harga || 0;
                } else if (item.tipe_motor === 'besar') {
                  totalBiaya = service.harga_besar || service.harga || 0;
                } else {
                  totalBiaya = service.harga_kecil || service.harga || 0;
                }
              }

              return (
                <div
                  key={item.id}
                  id={`queue-card-full-mobile-${item.id}`}
                  className="bg-slate-50/70 dark:bg-[#161A28]/80 border border-slate-200 dark:border-[#23293D] rounded-2xl p-3.5 space-y-3 shadow-xs"
                >
                  {/* Top Row: Ticket & Vehicle & Time */}
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

                    <div className="text-slate-600 dark:text-slate-400 text-[11px] flex justify-between items-center">
                      <span>{service?.nama_layanan || 'Paket Layanan'}</span>
                      {item.last_email_sent && (
                        <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400">
                          ✉ {getEmailTypeLabel(item.last_email_sent)}
                        </span>
                      )}
                    </div>

                    {/* Email inline */}
                    <div className="pt-0.5">
                      {editingEmailQueueId === item.id ? (
                        <div className="flex items-center space-x-1">
                          <input
                            type="email"
                            value={tempEmailValue}
                            onChange={(e) => setTempEmailValue(e.target.value)}
                            placeholder="email@gmail.com"
                            className="px-2 py-1 text-xs font-mono border border-emerald-500 rounded-lg bg-white dark:bg-[#161A28] text-slate-900 dark:text-white focus:outline-none flex-1"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateQueueContact) onUpdateQueueContact(item.id, tempEmailValue);
                              setEditingEmailQueueId(null);
                            }}
                            className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingEmailQueueId(null)}
                            className="px-2 py-1 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : item.email ? (
                        <div
                          onClick={() => {
                            setEditingEmailQueueId(item.id);
                            setTempEmailValue(item.email || '');
                          }}
                          className="flex items-center space-x-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-mono truncate">{item.email}</span>
                          <span className="text-[9px] text-slate-400">(edit)</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingEmailQueueId(item.id);
                            setTempEmailValue('');
                          }}
                          className="text-[10px] text-emerald-800 dark:text-emerald-400 flex items-center space-x-1 cursor-pointer font-bold"
                        >
                          <Mail className="w-3 h-3" />
                          <span>+ Tambahkan Email</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status, Pit & Payment */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-[#23293D]/60 text-xs">
                    <div className="flex items-center space-x-1.5">
                      {getStatusBadge(item.status)}
                      {pit ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {pit.nama_pit}
                        </span>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => {
                            const newPit = e.target.value || null;
                            onUpdateStatus(item.id, item.status, newPit);
                          }}
                          className="bg-slate-100 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-lg text-[10px] px-1.5 py-0.5"
                        >
                          <option value="">Pilih Pit</option>
                          {pits.map((p) => (
                            <option key={p.id} value={p.id}>{p.nama_pit}</option>
                          ))}
                        </select>
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
                          <span>Belum Lunas</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                    {item.status === 'waiting' && (
                      <button
                        onClick={() => onUpdateStatus(item.id, 'washing', pits[0]?.id || null)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Mulai Cuci</span>
                      </button>
                    )}

                    {item.status === 'washing' && (
                      <button
                        onClick={() => {
                          onUpdateStatus(item.id, 'waiting_payment');
                          handleCallCustomVoice(item, 'kasir');
                        }}
                        className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Selesai Cuci</span>
                      </button>
                    )}

                    {!item.is_paid ? (
                      <button
                        onClick={() => onOpenPaymentModal(item)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs inline-flex items-center space-x-1 cursor-pointer shadow-xs"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar & Struk</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onPrintReceipt(item)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Struk</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (item.status === 'waiting') handleCallCustomVoice(item, 'pit');
                        else if (item.status === 'washing' || item.status === 'waiting_payment') handleCallCustomVoice(item, 'kasir');
                        else handleCallCustomVoice(item, 'ambil');
                      }}
                      className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
                      title="Panggil Suara"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

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
        {/* DESKTOP VIEW: High-Contrast Table                                        */}
        {/* ========================================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-[#161A28]/80 text-slate-600 dark:text-slate-400 font-mono text-[11px] uppercase border-b border-slate-200 dark:border-[#23293D]">
              <tr>
                <th className="py-3.5 px-4">Tiket</th>
                <th className="py-3.5 px-3">Nama Pelanggan</th>
                <th className="py-3.5 px-3">Jenis Kendaraan</th>
                <th className="py-3.5 px-3">Layanan & Biaya</th>
                <th className="py-3.5 px-3">Pit Cuci</th>
                <th className="py-3.5 px-3">Status Cuci</th>
                <th className="py-3.5 px-3">Pembayaran</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1E2336] text-slate-800 dark:text-slate-200 font-medium">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold text-xs">Tidak ada antrean yang sesuai filter.</p>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((item) => {
                  const service = services.find((s) => s.id === item.layanan_id);
                  const pit = pits.find((p) => p.id === item.pit_id);
                  let totalBiaya = item.total_biaya || 0;
                  if (!totalBiaya && service) {
                    if (item.tipe_motor === 'mobil') {
                      totalBiaya = service.harga_mobil || service.harga_besar || service.harga || 0;
                    } else if (item.tipe_motor === 'besar') {
                      totalBiaya = service.harga_besar || service.harga || 0;
                    } else {
                      totalBiaya = service.harga_kecil || service.harga || 0;
                    }
                  }

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#161A28]/50 transition font-medium ${
                        item.status === 'washing' ? 'bg-teal-500/5' : ''
                      }`}
                    >
                      {/* Ticket Number */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {item.nomor_antrian}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            {item.created_at}
                          </span>
                        </div>
                      </td>

                      {/* Customer Name & Email */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white text-xs truncate max-w-[140px]">
                            {item.nama_pemohon}
                          </span>

                          {editingEmailQueueId === item.id ? (
                            <div className="flex items-center space-x-1 mt-1 z-20">
                              <input
                                type="email"
                                value={tempEmailValue}
                                onChange={(e) => setTempEmailValue(e.target.value)}
                                placeholder="email@gmail.com"
                                className="px-2 py-0.5 text-[11px] font-mono border border-emerald-500 rounded bg-white dark:bg-[#161A28] text-slate-900 dark:text-white focus:outline-none w-36"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (onUpdateQueueContact) onUpdateQueueContact(item.id, tempEmailValue);
                                    setEditingEmailQueueId(null);
                                  } else if (e.key === 'Escape') {
                                    setEditingEmailQueueId(null);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateQueueContact) onUpdateQueueContact(item.id, tempEmailValue);
                                  setEditingEmailQueueId(null);
                                }}
                                className="px-1.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                              >
                                ✓
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingEmailQueueId(null)}
                                className="px-1.5 py-0.5 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : item.email ? (
                            <div
                              onClick={() => {
                                setEditingEmailQueueId(item.id);
                                setTempEmailValue(item.email || '');
                              }}
                              className="flex items-center space-x-1 mt-0.5 text-[10px] text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer group"
                              title="Klik untuk ubah email pelanggan"
                            >
                              <Mail className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[130px] font-mono group-hover:underline">
                                {item.email}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingEmailQueueId(item.id);
                                setTempEmailValue('');
                              }}
                              className="text-left text-[9px] text-emerald-800 dark:text-emerald-400 hover:underline flex items-center space-x-1 mt-0.5 cursor-pointer font-semibold"
                            >
                              <span>+ Isi Email</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Vehicle Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getVehicleBadge(item.tipe_motor)}
                      </td>

                      {/* Service & Price */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]">
                          {service?.nama_layanan || 'Paket Layanan'}
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-xs">
                          Rp {totalBiaya.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Pit Assignment */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <select
                          value={item.pit_id || ''}
                          onChange={(e) => {
                            const newPit = e.target.value || null;
                            onUpdateStatus(item.id, item.status, newPit);
                          }}
                          className="px-2 py-1 bg-slate-100 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl text-[11px] text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="" className="dark:bg-[#0F121C]">-- Tanpa Pit --</option>
                          {pits.map((p) => (
                            <option key={p.id} value={p.id} className="dark:bg-[#0F121C]">
                              {p.nama_pit}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {getStatusBadge(item.status)}
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const newSt = e.target.value as QueueStatus;
                              if (newSt === 'done' && !item.is_paid) {
                                onOpenPaymentModal(item);
                              } else {
                                onUpdateStatus(item.id, newSt);
                              }
                            }}
                            className="bg-transparent text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border-none p-0 cursor-pointer focus:outline-none font-semibold"
                          >
                            <option value="waiting" className="dark:bg-[#0F121C]">Set: Menunggu</option>
                            <option value="washing" className="dark:bg-[#0F121C]">Set: Sedang Cuci</option>
                            <option value="waiting_payment" className="dark:bg-[#0F121C]">Set: Siap Bayar</option>
                            <option value="done" className="dark:bg-[#0F121C]">Set: Selesai</option>
                          </select>
                        </div>
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

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {item.status === 'waiting' && (
                          <button
                            onClick={() => onUpdateStatus(item.id, 'washing', pits[0]?.id || null)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Mulai Cuci"
                          >
                            <Play className="w-3 h-3" />
                            <span>Mulai</span>
                          </button>
                        )}

                        {item.status === 'washing' && (
                          <button
                            onClick={() => {
                              onUpdateStatus(item.id, 'waiting_payment');
                              handleCallCustomVoice(item, 'kasir');
                            }}
                            className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Selesai Cuci"
                          >
                            <CheckCircle className="w-3 h-3 text-white" />
                            <span>Selesai</span>
                          </button>
                        )}

                        {!item.is_paid ? (
                          <button
                            onClick={() => onOpenPaymentModal(item)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Bayar di Kasir & Cetak Struk"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Bayar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onPrintReceipt(item)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-[#161A28] dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#23293D] font-bold rounded-xl text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Cetak Struk"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Struk</span>
                          </button>
                        )}

                        {/* Email Menu */}
                        {item.email && onSendEmailNotification && (
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActiveEmailMenuId(activeEmailMenuId === item.id ? null : item.id)}
                              className="p-1.5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                              title={`Kirim Notifikasi Email ke ${item.email}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {activeEmailMenuId === item.id && (
                              <div className="absolute right-0 bottom-full mb-2 w-52 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl shadow-xl z-30 p-1.5 space-y-0.5 text-left">
                                <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-500 border-b border-slate-100 dark:border-[#23293D] truncate">
                                  {item.email}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSendEmailNotification('ticket_created', item);
                                    setActiveEmailMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-[#161A28] rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                >
                                  1. Tiket Antrean
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSendEmailNotification('upcoming_call', item);
                                    setActiveEmailMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-[#161A28] rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                >
                                  2. Siap-siap Dipanggil
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSendEmailNotification('calling_pit', item);
                                    setActiveEmailMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-[#161A28] rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                >
                                  3. Panggilan ke Pit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSendEmailNotification('wash_finished', item);
                                    setActiveEmailMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-[#161A28] rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                >
                                  4. Selesai Cuci (Kasir)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSendEmailNotification('completed_paid', item);
                                    setActiveEmailMenuId(null);
                                  }}
                                  className="w-full text-left px-2 py-1 hover:bg-slate-100 dark:hover:bg-[#161A28] rounded-lg text-[11px] font-medium text-slate-800 dark:text-slate-200"
                                >
                                  5. Selesai & Lunas
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Voice Call */}
                        <button
                          onClick={() => {
                            if (item.status === 'waiting') handleCallCustomVoice(item, 'pit');
                            else if (item.status === 'washing' || item.status === 'waiting_payment') handleCallCustomVoice(item, 'kasir');
                            else handleCallCustomVoice(item, 'ambil');
                          }}
                          className="p-1.5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                          title="Panggil Suara"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteQueue(item.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
