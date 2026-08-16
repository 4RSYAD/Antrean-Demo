import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Clock,
  CheckCircle,
  Maximize2,
  Minimize2,
  Banknote,
  Bike,
  Car
} from 'lucide-react';
import { QueueItem, PitItem, ServiceItem } from '../types.ts';

interface TVDisplayViewProps {
  queues: QueueItem[];
  pits: PitItem[];
  services: ServiceItem[];
}

export const TVDisplayView: React.FC<TVDisplayViewProps> = ({
  queues,
  pits,
  services
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const timeString = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateString = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const waitingQueues = queues.filter((q) => q.status === 'waiting');
  const waitingPaymentQueues = queues.filter((q) => q.status === 'waiting_payment');
  const doneQueues = queues.filter((q) => q.status === 'done');

  const getVehicleLabel = (type: string) => {
    if (type === 'mobil') return 'Mobil';
    if (type === 'besar') return 'Motor Besar';
    return 'Motor Kecil';
  };

  return (
    <div id="tv-display-container" className="space-y-6">
      {/* TV Header Banner */}
      <div className="bg-gradient-to-r from-[#0F121C] via-[#161A28] to-[#0F121C] border border-[#23293D] p-4 sm:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl relative">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-lime-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
            <Droplets className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>ANTREAN</span>
            </h1>
            <p className="text-xs text-emerald-400 font-mono font-bold uppercase tracking-widest">
              DISPLAY INFORMASI STATUS CUCI KENDARAAN RUANG TUNGGU
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-center md:text-right font-mono">
            <div className="text-2xl sm:text-4xl font-black text-lime-400 tracking-tight">
              {timeString}
            </div>
            <div className="text-xs text-slate-400 font-sans font-semibold">
              {dateString}
            </div>
          </div>

          <button
            id="btn-toggle-fullscreen"
            onClick={toggleFullscreen}
            className="p-3 rounded-2xl bg-[#1E2336] hover:bg-[#23293D] text-slate-300 transition cursor-pointer"
            title="Toggle Layar Penuh (Fullscreen)"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Pit Bays Active Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pits.map((pit) => {
          const activeQueue = queues.find((q) => q.pit_id === pit.id && (q.status === 'washing' || q.status === 'waiting_payment'));
          const service = activeQueue ? services.find((s) => s.id === activeQueue.layanan_id) : null;

          return (
            <div
              key={pit.id}
              id={`tv-pit-bay-${pit.id}`}
              className={`bg-[#0F121C] border-2 rounded-3xl p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden transition ${
                activeQueue?.status === 'waiting_payment'
                  ? 'border-orange-500/60'
                  : activeQueue
                  ? 'border-emerald-500/60'
                  : 'border-[#23293D]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#23293D] pb-3">
                  <span className="text-xs font-mono font-extrabold text-slate-400 uppercase tracking-wider">
                    {pit.nama_pit}
                  </span>
                  <span
                    className={`w-3.5 h-3.5 rounded-full ${
                      activeQueue?.status === 'waiting_payment'
                        ? 'bg-orange-500'
                        : activeQueue
                        ? 'bg-emerald-500 animate-ping'
                        : 'bg-slate-700'
                    }`}
                  />
                </div>

                {activeQueue ? (
                  <div className="text-center py-3 space-y-2">
                    <span
                      className={`text-[10px] font-mono font-extrabold border px-3 py-1 rounded-full uppercase tracking-wider inline-block ${
                        activeQueue.status === 'waiting_payment'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {activeQueue.status === 'waiting_payment' ? 'SELESAI CUCI • KE KASIR' : 'SEDANG DICUCI'}
                    </span>
                    <div className="text-6xl sm:text-7xl font-black font-mono text-emerald-400 tracking-tight pt-2">
                      {activeQueue.nomor_antrian}
                    </div>
                    <div className="text-xl font-bold text-white truncate px-2">
                      {activeQueue.nama_pemohon}
                    </div>
                    <div className="flex justify-center">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        activeQueue.tipe_motor === 'mobil'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : activeQueue.tipe_motor === 'besar'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {activeQueue.tipe_motor === 'mobil' ? (
                          <Car className="w-3 h-3 inline" />
                        ) : (
                          <Bike className="w-3 h-3 inline" />
                        )}
                        <span>{getVehicleLabel(activeQueue.tipe_motor)}</span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium truncate pt-1">
                      <span className="text-emerald-400 font-semibold">{service?.nama_layanan}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-500 text-sm font-bold font-mono">
                    <Bike className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-500" />
                    PIT BAY STANDBY / SIAP
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#23293D]/80 text-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Status:{' '}
                  {activeQueue?.status === 'waiting_payment'
                    ? 'Menunggu Kasir'
                    : activeQueue
                    ? 'Aktif Pengerjaan'
                    : 'Siap Dipanggil'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Waiting List, Waiting Payment & Completed Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Waiting Queue List */}
        <div className="lg:col-span-5 bg-[#0F121C] border border-[#23293D] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#23293D] pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Menunggu Giliran Cuci</h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
              {waitingQueues.length} Antrean
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
            {waitingQueues.length === 0 ? (
              <div className="col-span-full py-10 text-center text-slate-500 text-xs font-semibold">
                Tidak ada antrean kendaraan yang sedang menunggu.
              </div>
            ) : (
              waitingQueues.map((q) => (
                <div
                  key={q.id}
                  id={`tv-waiting-card-${q.id}`}
                  className="p-3 bg-[#161A28] border border-[#23293D] rounded-2xl space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-black text-amber-400 text-lg">
                      {q.nomor_antrian}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                      q.tipe_motor === 'mobil'
                        ? 'bg-blue-500/20 text-blue-300'
                        : q.tipe_motor === 'besar'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {q.tipe_motor === 'mobil' ? 'Mobil' : q.tipe_motor === 'besar' ? 'Besar' : 'Kecil'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate">{q.nama_pemohon}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Waiting Payment List */}
        <div className="lg:col-span-4 bg-[#0F121C] border border-[#23293D] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#23293D] pb-3">
            <div className="flex items-center space-x-2">
              <Banknote className="w-5 h-5 text-orange-400" />
              <h3 className="font-extrabold text-sm text-white">Selesai Cuci (Silakan ke Kasir)</h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {waitingPaymentQueues.length}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {waitingPaymentQueues.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                Tidak ada kendaraan menunggu bayar.
              </div>
            ) : (
              waitingPaymentQueues.map((q) => (
                <div
                  key={q.id}
                  id={`tv-waiting-payment-card-${q.id}`}
                  className="p-3 bg-[#161A28] border border-orange-500/30 rounded-2xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-black text-orange-400 text-base mr-2">
                      {q.nomor_antrian}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">{q.nama_pemohon}</span>
                    <span className="block text-[10px] text-slate-400 font-sans">
                      {getVehicleLabel(q.tipe_motor)}
                    </span>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                    KASIR
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed & Paid List */}
        <div className="lg:col-span-3 bg-[#0F121C] border border-[#23293D] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#23293D] pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Selesai & Lunas</h3>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {doneQueues.length}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {doneQueues.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs font-semibold">
                Belum ada antrean selesai.
              </div>
            ) : (
              doneQueues.map((q) => (
                <div
                  key={q.id}
                  id={`tv-done-card-${q.id}`}
                  className="p-3 bg-[#161A28] border border-[#23293D] rounded-2xl flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono font-black text-emerald-400 text-base mr-2">
                      {q.nomor_antrian}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">{q.nama_pemohon}</span>
                  </div>
                  <span className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    LUNAS
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Running Information Ticker */}
      <div className="bg-[#0F121C] border border-[#23293D] rounded-2xl p-3 flex items-center space-x-3 overflow-hidden shadow-lg">
        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black font-mono uppercase px-3 py-1 rounded-xl shrink-0">
          INFORMASI
        </span>
        <div className="whitespace-nowrap overflow-hidden text-xs font-mono text-slate-300">
          <span>
            Selamat datang di Antrean Wash Digital • Harap perhatikan nomor antrean yang terpampang pada layar dan panggilan speaker • Kendaraan yang telah selesai dicuci silakan menuju ke kasir untuk pembayaran dan pengambilan • Terima kasih!
          </span>
        </div>
      </div>
    </div>
  );
};
