import React, { useState } from 'react';
import { PlusCircle, X, Bike, Car, Check } from 'lucide-react';
import { ServiceItem, PitItem, MotorType } from '../types.ts';

interface CashierAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceItem[];
  pits: PitItem[];
  onAddQueue: (data: {
    nama_pemohon: string;
    tipe_motor: MotorType;
    layanan_id: string;
    pit_id?: string | null;
  }) => void;
}

export const CashierAddModal: React.FC<CashierAddModalProps> = ({
  isOpen,
  onClose,
  services,
  pits,
  onAddQueue
}) => {
  const [nama, setNama] = useState('');
  const [tipeMotor, setTipeMotor] = useState<MotorType>('kecil');
  const [layananId, setLayananId] = useState(services[0]?.id || '');
  const [pitId, setPitId] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !layananId) return;

    onAddQueue({
      nama_pemohon: nama.trim(),
      tipe_motor: tipeMotor,
      layanan_id: layananId,
      pit_id: pitId || null
    });

    setNama('');
    setTipeMotor('kecil');
    setPitId('');
    onClose();
  };

  return (
    <div
      id="cashier-add-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        id="cashier-add-modal-box"
        className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Tambah Antrean Kasir</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Input antrean motor/mobil pelanggan langsung</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Nama Pelanggan */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold">Nama Pelanggan *</label>
            <input
              id="input-cashier-customer-name"
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Pilihan Tipe Kendaraan */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold">Jenis Kendaraan *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                id="cashier-btn-motor-kecil"
                onClick={() => setTipeMotor('kecil')}
                className={`p-2.5 rounded-2xl border-2 transition text-left flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  tipeMotor === 'kecil'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[11px]">Motor Kecil</div>
                  <div className="text-[9px] text-slate-500 truncate">Beat/Mio</div>
                </div>
              </button>

              <button
                type="button"
                id="cashier-btn-motor-besar"
                onClick={() => setTipeMotor('besar')}
                className={`p-2.5 rounded-2xl border-2 transition text-left flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  tipeMotor === 'besar'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Bike className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[11px]">Motor Besar</div>
                  <div className="text-[9px] text-slate-500 truncate">NMAX/PCX</div>
                </div>
              </button>

              <button
                type="button"
                id="cashier-btn-mobil"
                onClick={() => setTipeMotor('mobil')}
                className={`p-2.5 rounded-2xl border-2 transition text-left flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                  tipeMotor === 'mobil'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161A28] border-slate-200 dark:border-[#23293D] text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[11px]">Mobil</div>
                  <div className="text-[9px] text-blue-600 dark:text-blue-400 font-bold truncate">Tarif Mobil</div>
                </div>
              </button>
            </div>
          </div>

          {/* Paket Layanan */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold">Paket Layanan *</label>
            <select
              id="select-cashier-service"
              value={layananId}
              onChange={(e) => setLayananId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-bold"
            >
              {services.map((s) => {
                const price = tipeMotor === 'mobil'
                  ? s.harga_mobil || s.harga_besar || s.harga || 0
                  : tipeMotor === 'besar'
                  ? s.harga_besar || s.harga || 0
                  : s.harga_kecil || s.harga || 0;
                return (
                  <option key={s.id} value={s.id}>
                    {s.nama_layanan} - Rp {price.toLocaleString('id-ID')} ({s.durasi_menit} mnt)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Pit Assignment */}
          <div>
            <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold">Tugaskan ke Pit (Opsional)</label>
            <select
              id="select-cashier-pit"
              value={pitId}
              onChange={(e) => setPitId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">-- Masuk Antrean Tunggu (Tanpa Pit) --</option>
              {pits.map((p) => (
                <option key={p.id} value={p.id}>
                  Langsung ke {p.nama_pit}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 dark:bg-[#161A28] text-slate-800 dark:text-slate-200 rounded-2xl text-xs font-semibold hover:bg-slate-300 dark:hover:bg-[#23293D] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>Simpan & Buat Antrean</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
