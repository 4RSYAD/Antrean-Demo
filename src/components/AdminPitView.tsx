import React, { useState } from 'react';
import {
  Wrench,
  Volume2,
  CheckCircle,
  Play,
  Printer,
  Trash2,
  Clock,
  Sparkles,
  ArrowRight,
  Bike,
  Car
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, QueueStatus } from '../types.ts';
import { announceQueueVoice } from '../utils/audio.ts';

interface AdminPitViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
  onCallNext: (pitId: string) => void;
  onUpdateStatus: (id: string, newStatus: QueueStatus, pitId?: string | null) => void;
  onDeleteQueue: (id: string) => void;
  onPrintReceipt: (item: QueueItem) => void;
}

export const AdminPitView: React.FC<AdminPitViewProps> = ({
  queues,
  services,
  pits,
  onCallNext,
  onUpdateStatus,
  onDeleteQueue,
  onPrintReceipt
}) => {
  const [selectedPitId, setSelectedPitId] = useState<string>(pits[0]?.id || '');
  const selectedPit = pits.find((p) => p.id === selectedPitId) || pits[0];

  const activeInPit = queues.find((q) => q.pit_id === selectedPit?.id && q.status === 'washing');
  const activeService = activeInPit ? services.find((s) => s.id === activeInPit.layanan_id) : null;
  const waitingQueues = queues.filter((q) => q.status === 'waiting');

  const getVehicleName = (item: QueueItem) => {
    if (item.tipe_motor === 'mobil') return 'mobil';
    if (item.tipe_motor === 'besar') return 'motor besar';
    return 'motor';
  };

  const handleReAnnounce = () => {
    if (activeInPit) {
      const pitName = selectedPit ? selectedPit.nama_pit : 'Area Pit';
      const vehName = getVehicleName(activeInPit);
      const msg = `Perhatian. Panggilan nomor antrean ${activeInPit.nomor_antrian}, atas nama ${activeInPit.nama_pemohon}, silakan membawa ${vehName} Anda menuju ke ${pitName}.`;
      announceQueueVoice(msg, 'call_pit');
    }
  };

  const handleFinishWashing = (queueId: string) => {
    onUpdateStatus(queueId, 'waiting_payment');
    const target = queues.find((q) => q.id === queueId);
    if (target) {
      const vehName = getVehicleName(target);
      announceQueueVoice(
        `Pengumuman selesai cuci: Nomor antrean ${target.nomor_antrian}, atas nama ${target.nama_pemohon}, ${vehName} Anda telah selesai dicuci. Silakan menuju kasir untuk proses pembayaran.`,
        'wash_done'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Pit Selection Bar */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
            <Wrench className="w-4 h-4" />
            <span>KONTROL OPERASIONAL PIT BAY</span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white">
            Pengelolaan Jalur Cuci & Panggilan Suara
          </h2>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            Pilih Pit Aktif:
          </label>
          <select
            id="select-active-pit-bay"
            value={selectedPit?.id || ''}
            onChange={(e) => setSelectedPitId(e.target.value)}
            className="w-full md:w-auto bg-slate-100 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] text-slate-900 dark:text-slate-100 text-xs font-bold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 shadow-sm cursor-pointer"
          >
            {pits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama_pit}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Pit Bay Control + Waiting Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Pit Bay Stage */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm flex flex-col justify-between">
          <div className="p-6 sm:p-8 bg-slate-50 dark:bg-[#161A28] rounded-3xl border border-slate-200 dark:border-[#23293D] space-y-4 text-center relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              <span>{selectedPit?.nama_pit.toUpperCase()}</span>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold font-mono ${
                  activeInPit?.status === 'waiting_payment'
                    ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                    : activeInPit
                    ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                    : 'bg-slate-200 dark:bg-[#23293D] text-slate-700 dark:text-slate-300'
                }`}
              >
                {activeInPit?.status === 'waiting_payment'
                  ? 'SELESAI CUCI (MENUNGGU BAYAR)'
                  : activeInPit
                  ? 'SEDANG CUCI AKTIF'
                  : 'STANDBY KOSONG'}
              </span>
            </div>

            {activeInPit ? (
              <div className="space-y-4 py-4">
                <div className="text-6xl sm:text-8xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {activeInPit.nomor_antrian}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {activeInPit.nama_pemohon}
                  </h3>
                  <div>
                    <span
                      className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        activeInPit.tipe_motor === 'mobil'
                          ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                          : activeInPit.tipe_motor === 'besar'
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      }`}
                    >
                      {activeInPit.tipe_motor === 'mobil' ? (
                        <Car className="w-3.5 h-3.5 inline" />
                      ) : (
                        <Bike className="w-3.5 h-3.5 inline" />
                      )}
                      <span>
                        {activeInPit.tipe_motor === 'mobil'
                          ? 'Mobil'
                          : activeInPit.tipe_motor === 'besar'
                          ? 'Motor Besar'
                          : 'Motor Kecil'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] text-xs">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {activeService?.nama_layanan}
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    (~{activeService?.durasi_menit} Mnt)
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 sm:py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-slate-200 dark:bg-[#23293D] flex items-center justify-center mx-auto text-slate-500">
                  <Bike className="w-8 h-8" />
                </div>
                <div className="text-slate-600 dark:text-slate-400 text-sm font-semibold max-w-sm mx-auto">
                  Pit Bay ini saat ini kosong. Panggil antrean berikutnya untuk memulai proses pencucian kendaraan.
                </div>
              </div>
            )}
          </div>

          {/* Action Control Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              id="btn-call-next-in-pit"
              onClick={() => onCallNext(selectedPit?.id || '')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 px-4 rounded-2xl transition shadow-md text-xs flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4 text-white" />
              <span>Panggil Antrean Berikutnya</span>
            </button>

            {activeInPit && (
              <>
                <button
                  id="btn-re-announce-voice"
                  onClick={handleReAnnounce}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl transition shadow-md text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-slate-950" />
                  <span>Panggil Ulang Suara</span>
                </button>

                <button
                  id="btn-mark-wash-done"
                  onClick={() => handleFinishWashing(activeInPit.id)}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-black py-3.5 px-4 rounded-2xl transition shadow-md text-xs flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Selesai Cuci (Ke Kasir)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Next In Line Drawer */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 rounded-3xl space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Menunggu Giliran ({waitingQueues.length})</span>
              </h3>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {waitingQueues.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tidak ada antrean kendaraan yang sedang menunggu saat ini.
                </div>
              ) : (
                waitingQueues.map((q) => {
                  const s = services.find((srv) => srv.id === q.layanan_id);
                  return (
                    <div
                      key={q.id}
                      id={`waiting-card-${q.id}`}
                      className="p-3.5 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] flex items-center justify-between text-xs hover:border-emerald-500/40 transition"
                    >
                      <div className="min-w-0 pr-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                            {q.nomor_antrian}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {q.nama_pemohon}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            q.tipe_motor === 'mobil'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-300'
                              : q.tipe_motor === 'besar'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300'
                          }`}>
                            {q.tipe_motor === 'mobil' ? 'Mobil' : q.tipe_motor === 'besar' ? 'Besar' : 'Kecil'}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            {s?.nama_layanan}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          id={`btn-assign-pit-${q.id}`}
                          onClick={() => onUpdateStatus(q.id, 'washing', selectedPit?.id)}
                          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-[10px] transition flex items-center space-x-1 cursor-pointer"
                          title="Tugaskan ke Pit Terpilih"
                        >
                          <span>Masuk</span>
                          <ArrowRight className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={() => onPrintReceipt(q)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#23293D] text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                          title="Cetak Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteQueue(q.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="Hapus Antrean"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            💡 Alur: Setelah kendaraan selesai dicuci, klik <b>Selesai Cuci</b>. Sistem otomatis mengumumkan pelanggan menuju kasir untuk proses pembayaran & cetak struk lunas.
          </div>
        </div>
      </div>
    </div>
  );
};
