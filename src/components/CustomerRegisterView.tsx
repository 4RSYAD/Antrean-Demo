import React, { useState } from 'react';
import { PlusCircle, Sparkles, X, Clock, Bike, Car, Check } from 'lucide-react';
import { ServiceItem, MotorType } from '../types.ts';

interface CustomerRegisterViewProps {
  services: ServiceItem[];
  onAddQueue: (data: { nama_pemohon: string; tipe_motor: MotorType; layanan_id: string }) => void;
}

export const CustomerRegisterView: React.FC<CustomerRegisterViewProps> = ({
  services,
  onAddQueue
}) => {
  const [namaPemohon, setNamaPemohon] = useState('');
  const [tipeMotor, setTipeMotor] = useState<MotorType>('kecil');
  const [layananId, setLayananId] = useState(services[0]?.id || '');
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPemohon.trim() || !layananId) return;

    onAddQueue({
      nama_pemohon: namaPemohon.trim(),
      tipe_motor: tipeMotor,
      layanan_id: layananId
    });

    setNamaPemohon('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 sm:p-8 rounded-3xl space-y-6 shadow-lg">
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

          {/* Selected Service Box */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">
              Paket Layanan Terpilih *
            </label>

            <div className="p-4 bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-2xl flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                  <span className="truncate">{selectedService?.nama_layanan}</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-md font-mono shrink-0">
                    ~{selectedService?.durasi_menit} Mnt
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                  {selectedService?.deskripsi}
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-black text-base">
                    Rp {currentPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#23293D] text-slate-800 dark:text-slate-200">
                    Tarif {getVehicleLabel(tipeMotor)}
                  </span>
                </div>
              </div>

              <button
                id="btn-open-service-modal"
                type="button"
                onClick={() => setIsServiceModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shrink-0 cursor-pointer shadow-sm"
              >
                Ganti Paket
              </button>
            </div>
          </div>

          <button
            id="btn-submit-new-ticket"
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition shadow-lg text-sm mt-4 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-white" />
            <span>Ambil Tiket Antrean Sekarang</span>
          </button>
        </form>
      </div>

      {/* Service Selection Modal */}
      {isServiceModalOpen && (
        <div
          id="modal-select-service"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] max-w-lg w-full p-6 rounded-3xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Pilih Paket Layanan Cuci</h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Menampilkan tarif untuk: <strong className="text-emerald-600 dark:text-emerald-400 uppercase">{getVehicleLabel(tipeMotor)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
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
                    id={`service-option-${s.id}`}
                    onClick={() => {
                      setLayananId(s.id);
                      setIsServiceModalOpen(false);
                    }}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 dark:border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] hover:border-emerald-500/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{s.nama_layanan}</h4>
                          {s.badge && (
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black rounded-md">
                              {s.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{s.deskripsi}</p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-200 dark:bg-[#23293D] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full shrink-0 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{s.durasi_menit} Mnt</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-[#23293D]">
                      <div className="space-y-0.5">
                        <span className="text-base font-mono font-black text-emerald-700 dark:text-emerald-400">
                          Rp {itemPrice.toLocaleString('id-ID')}
                        </span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                          Tarif {getVehicleLabel(tipeMotor)}
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`px-4 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-black'
                            : 'bg-slate-200 dark:bg-[#23293D] text-slate-800 dark:text-slate-200 hover:bg-emerald-600 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Terpilih' : 'Pilih Paket'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
