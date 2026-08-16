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
  Car
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, QueueStatus } from '../types.ts';
import { announceQueueVoice } from '../utils/audio.ts';

interface AdminQueuesViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
  onOpenQuickAddModal: () => void;
  onOpenPaymentModal: (queue: QueueItem) => void;
  onPrintReceipt: (queue: QueueItem) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus, pitId?: string | null) => void;
  onDeleteQueue: (id: string) => void;
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
  searchQuery,
  setSearchQuery
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');

  const filteredQueues = queues.filter((q) => {
    const qName = q.nama_pemohon.toLowerCase();
    const qNum = q.nomor_antrian.toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesQuery = qName.includes(query) || qNum.includes(query);
    const matchesTab =
      selectedStatusTab === 'all'
        ? true
        : selectedStatusTab === 'unpaid'
        ? !q.is_paid
        : q.status === selectedStatusTab;

    return matchesQuery && matchesTab;
  });

  const waitingCount = queues.filter((q) => q.status === 'waiting').length;
  const washingCount = queues.filter((q) => q.status === 'washing').length;
  const waitingPaymentCount = queues.filter((q) => q.status === 'waiting_payment').length;
  const doneCount = queues.filter((q) => q.status === 'done').length;

  const handleCallCustomVoice = (item: QueueItem, type: 'pit' | 'kasir' | 'ambil') => {
    const vehicleLabel = item.tipe_motor === 'mobil' ? 'mobil' : item.tipe_motor === 'besar' ? 'motor besar' : 'motor';
    if (type === 'pit') {
      const pitObj = pits.find((p) => p.id === item.pit_id);
      const pitName = pitObj ? pitObj.nama_pit : 'Area Pit';
      announceQueueVoice(
        `Perhatian. Panggilan nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, silakan membawa ${vehicleLabel} Anda menuju ke ${pitName}.`,
        'call_pit'
      );
    } else if (type === 'kasir') {
      announceQueueVoice(
        `Pengumuman selesai cuci: Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, ${vehicleLabel} Anda telah selesai dicuci. Silakan menuju kasir untuk proses pembayaran.`,
        'wash_done'
      );
    } else {
      announceQueueVoice(
        `Terima kasih. Nomor antrean ${item.nomor_antrian}, atas nama ${item.nama_pemohon}, pembayaran lunas dan ${vehicleLabel} Anda siap diambil. Selamat jalan.`,
        'paid_pickup'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
            <Clock className="w-4 h-4" />
            <span>MANAJEMEN ANTREAN & KASIR</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Daftar Antrean & Kontrol Status Pelanggan
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Ubah status pengerjaan cuci kendaraan, proses pembayaran kasir langsung, panggil suara, hingga cetak struk thermal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            id="btn-add-queue-menu"
            onClick={onOpenQuickAddModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>+ Antrean Baru</span>
          </button>
        </div>
      </div>

      {/* Quick Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedStatusTab('waiting')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'waiting'
              ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span>1. MENUNGGU CUCI</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white">{waitingCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('washing')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'washing'
              ? 'bg-teal-500/10 border-teal-500 text-teal-700 dark:text-teal-300 shadow-sm'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span>2. SEDANG CUCI</span>
            <Droplets className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white">{washingCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('waiting_payment')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'waiting_payment'
              ? 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-300 shadow-sm'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span>3. PERLU BAYAR KASIR</span>
            <CreditCard className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white">{waitingPaymentCount}</div>
        </div>

        <div
          onClick={() => setSelectedStatusTab('done')}
          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
            selectedStatusTab === 'done'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
              : 'bg-white dark:bg-[#0F121C] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex justify-between items-center text-xs font-bold font-mono">
            <span>4. SELESAI & LUNAS</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono pt-2 text-slate-900 dark:text-white">{doneCount}</div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl overflow-hidden shadow-sm">
        {/* Table Filter Tabs and Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#23293D] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedStatusTab === 'all'
                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#23293D]'
              }`}
            >
              Semua ({queues.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('waiting')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedStatusTab === 'waiting'
                  ? 'bg-amber-600 text-white font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#23293D]'
              }`}
            >
              Menunggu ({waitingCount})
            </button>
            <button
              onClick={() => setSelectedStatusTab('washing')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedStatusTab === 'washing'
                  ? 'bg-teal-600 text-white font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#23293D]'
              }`}
            >
              Sedang Cuci ({washingCount})
            </button>
            <button
              onClick={() => setSelectedStatusTab('waiting_payment')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedStatusTab === 'waiting_payment'
                  ? 'bg-orange-600 text-white font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#23293D]'
              }`}
            >
              Perlu Bayar ({waitingPaymentCount})
            </button>
            <button
              onClick={() => setSelectedStatusTab('done')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedStatusTab === 'done'
                  ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#23293D]'
              }`}
            >
              Selesai ({doneCount})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau tiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100/75 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 font-extrabold uppercase font-mono text-[11px] border-b border-slate-200 dark:border-[#23293D]">
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
            <tbody className="divide-y divide-slate-200 dark:divide-[#23293D] font-medium text-slate-800 dark:text-slate-200">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600 opacity-60" />
                    <p className="font-semibold text-sm">Tidak ada antrean yang sesuai filter.</p>
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
                      className={`hover:bg-slate-50/80 dark:hover:bg-[#161A28]/50 transition ${
                        item.status === 'washing' ? 'bg-teal-500/5' : ''
                      }`}
                    >
                      {/* Ticket Number */}
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm tracking-wide">
                          {item.nomor_antrian}
                        </span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {item.created_at}
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs">
                          {item.nama_pemohon}
                        </span>
                      </td>

                      {/* Vehicle Type */}
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

                      {/* Service & Price */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate">
                          {service?.nama_layanan || 'Paket Layanan'}
                        </div>
                        <div className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-xs">
                          Rp {totalBiaya.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Pit Assignment */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
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
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono w-fit ${
                              item.status === 'washing'
                                ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 animate-pulse'
                                : item.status === 'waiting_payment'
                                ? 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                                : item.status === 'done'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
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

                          {/* Quick Status Selector */}
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
                            title="Ubah Status Antrean"
                          >
                            <option value="waiting" className="dark:bg-[#0F121C]">Set: Menunggu</option>
                            <option value="washing" className="dark:bg-[#0F121C]">Set: Sedang Cuci</option>
                            <option value="waiting_payment" className="dark:bg-[#0F121C]">Set: Selesai Cuci (Perlu Bayar)</option>
                            <option value="done" className="dark:bg-[#0F121C]">Set: Selesai (Lunas)</option>
                          </select>
                        </div>
                      </td>

                      {/* Payment Status */}
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

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {/* Workflow Step 1: Start Wash */}
                        {item.status === 'waiting' && (
                          <button
                            id={`btn-start-wash-${item.id}`}
                            onClick={() => onUpdateStatus(item.id, 'washing', pits[0]?.id || null)}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Mulai Cuci"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Mulai Cuci</span>
                          </button>
                        )}

                        {/* Workflow Step 2: Mark Finished Washing */}
                        {item.status === 'washing' && (
                          <button
                            id={`btn-finish-wash-${item.id}`}
                            onClick={() => {
                              onUpdateStatus(item.id, 'waiting_payment');
                              handleCallCustomVoice(item, 'kasir');
                            }}
                            className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl text-[11px] transition shadow-xs inline-flex items-center space-x-1 cursor-pointer"
                            title="Selesai Cuci (Panggil ke Kasir)"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                            <span>Selesai Cuci</span>
                          </button>
                        )}

                        {/* Workflow Step 3: Process Payment & Print Receipt */}
                        {!item.is_paid ? (
                          <button
                            id={`btn-pay-now-${item.id}`}
                            onClick={() => onOpenPaymentModal(item)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-[11px] transition shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
                            title="Bayar di Kasir & Cetak Struk"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-white" />
                            <span>Bayar & Struk</span>
                          </button>
                        ) : (
                          <button
                            id={`btn-print-receipt-paid-${item.id}`}
                            onClick={() => onPrintReceipt(item)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#161A28] dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#23293D] font-bold rounded-xl text-[11px] transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Cetak Struk Pembayaran"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Struk</span>
                          </button>
                        )}

                        {/* Voice Announcement button */}
                        <button
                          id={`btn-voice-${item.id}`}
                          onClick={() => {
                            if (item.status === 'waiting') handleCallCustomVoice(item, 'pit');
                            else if (item.status === 'washing' || item.status === 'waiting_payment') handleCallCustomVoice(item, 'kasir');
                            else handleCallCustomVoice(item, 'ambil');
                          }}
                          className="p-1.5 hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                          title="Panggil Suara Pengumuman"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          id={`btn-delete-queue-page-${item.id}`}
                          onClick={() => onDeleteQueue(item.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition cursor-pointer"
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
