import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Edit2, Check, Clock, Bike, Car } from 'lucide-react';
import { ServiceItem } from '../types.ts';

interface AdminServicesViewProps {
  services: ServiceItem[];
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const AdminServicesView: React.FC<AdminServicesViewProps> = ({
  services,
  setServices,
  showToast
}) => {
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [hargaKecil, setHargaKecil] = useState('');
  const [hargaBesar, setHargaBesar] = useState('');
  const [hargaMobil, setHargaMobil] = useState('');
  const [durasi, setDurasi] = useState('20');
  const [badge, setBadge] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editHargaKecil, setEditHargaKecil] = useState('');
  const [editHargaBesar, setEditHargaBesar] = useState('');
  const [editHargaMobil, setEditHargaMobil] = useState('');
  const [editDurasi, setEditDurasi] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !hargaKecil || !hargaBesar) return;

    const parsedKecil = parseInt(hargaKecil.replace(/\D/g, ''), 10);
    const parsedBesar = parseInt(hargaBesar.replace(/\D/g, ''), 10);
    const parsedMobil = hargaMobil ? parseInt(hargaMobil.replace(/\D/g, ''), 10) : parsedBesar * 2;

    if (isNaN(parsedKecil) || parsedKecil <= 0 || isNaN(parsedBesar) || parsedBesar <= 0) {
      showToast('Mohon masukkan nominal tarif yang valid untuk Motor Kecil & Motor Besar.', 'warning');
      return;
    }

    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      nama_layanan: nama.trim(),
      deskripsi: deskripsi.trim() || 'Layanan pembersihan dan perawatan kendaraan',
      harga_kecil: parsedKecil,
      harga_besar: parsedBesar,
      harga_mobil: parsedMobil,
      harga: parsedKecil, // legacy fallback
      durasi_menit: parseInt(durasi, 10) || 20,
      badge: badge.trim() || undefined
    };

    setServices((prev) => [...prev, newSrv]);
    setNama('');
    setDeskripsi('');
    setHargaKecil('');
    setHargaBesar('');
    setHargaMobil('');
    setDurasi('20');
    setBadge('');
    showToast(`Paket layanan "${newSrv.nama_layanan}" berhasil ditambahkan!`, 'success');
  };

  const handleStartEdit = (srv: ServiceItem) => {
    setEditingId(srv.id);
    setEditNama(srv.nama_layanan);
    setEditHargaKecil((srv.harga_kecil || srv.harga || 0).toString());
    setEditHargaBesar((srv.harga_besar || srv.harga || 0).toString());
    setEditHargaMobil((srv.harga_mobil || (srv.harga_besar ? srv.harga_besar * 2 : 40000)).toString());
    setEditDurasi(srv.durasi_menit.toString());
    setEditDeskripsi(srv.deskripsi);
  };

  const handleSaveEdit = (id: string) => {
    const parsedKecil = parseInt(editHargaKecil.replace(/\D/g, ''), 10);
    const parsedBesar = parseInt(editHargaBesar.replace(/\D/g, ''), 10);
    const parsedMobil = editHargaMobil ? parseInt(editHargaMobil.replace(/\D/g, ''), 10) : parsedBesar * 2;

    if (isNaN(parsedKecil) || parsedKecil <= 0 || isNaN(parsedBesar) || parsedBesar <= 0) {
      showToast('Mohon masukkan harga yang valid.', 'warning');
      return;
    }

    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            nama_layanan: editNama.trim(),
            harga_kecil: parsedKecil,
            harga_besar: parsedBesar,
            harga_mobil: parsedMobil,
            harga: parsedKecil,
            durasi_menit: parseInt(editDurasi, 10) || s.durasi_menit,
            deskripsi: editDeskripsi.trim()
          };
        }
        return s;
      })
    );

    setEditingId(null);
    showToast('Perubahan paket layanan berhasil disimpan!', 'success');
  };

  const handleDeleteService = (id: string, name: string) => {
    if (services.length <= 1) {
      showToast('Minimal harus ada satu paket layanan aktif.', 'warning');
      return;
    }
    setServices((prev) => prev.filter((s) => s.id !== id));
    showToast(`Paket "${name}" telah dihapus.`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Add New Service */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-[#23293D] pb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Tambah Paket Cuci Kendaraan</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Atur tarif terpisah untuk Motor Kecil, Motor Besar, & Mobil</p>
            </div>
          </div>

          <form onSubmit={handleAddService} className="space-y-4 text-xs font-semibold">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Nama Paket Layanan *</label>
              <input
                id="input-service-name"
                type="text"
                required
                placeholder="Contoh: Cuci Salju + Pengilap Body"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Tiga Input Harga: Motor Kecil, Motor Besar, Mobil */}
            <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D]">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Pengaturan Tarif Berdasarkan Jenis:</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold flex items-center space-x-1">
                    <Bike className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Motor Kecil (Rp)*</span>
                  </label>
                  <input
                    id="input-service-price-kecil"
                    type="number"
                    required
                    placeholder="15000"
                    value={hargaKecil}
                    onChange={(e) => setHargaKecil(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">Beat, Vario, Mio</span>
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold flex items-center space-x-1">
                    <Bike className="w-3.5 h-3.5 text-amber-600" />
                    <span>Motor Besar (Rp)*</span>
                  </label>
                  <input
                    id="input-service-price-besar"
                    type="number"
                    required
                    placeholder="20000"
                    value={hargaBesar}
                    onChange={(e) => setHargaBesar(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">NMAX, PCX, Moge</span>
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 mb-1 font-bold flex items-center space-x-1">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>Mobil (Rp) *</span>
                  </label>
                  <input
                    id="input-service-price-mobil"
                    type="number"
                    required
                    placeholder="45000"
                    value={hargaMobil}
                    onChange={(e) => setHargaMobil(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500 transition"
                  />
                  <span className="text-[9px] text-blue-600 dark:text-blue-400 mt-0.5 block">Avanza, Brio, SUV</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Durasi (Menit)</label>
                <input
                  id="input-service-duration"
                  type="number"
                  placeholder="20"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Badge / Tag (Opsional)</label>
                <input
                  id="input-service-badge"
                  type="text"
                  placeholder="Populer, Hemat, Promo"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Deskripsi Pengerjaan</label>
              <textarea
                id="input-service-desc"
                rows={2}
                placeholder="Rincian fitur: busa salju, kolong, pengeringan blower..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              id="btn-save-new-service"
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3.5 rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Simpan Paket Layanan</span>
            </button>
          </form>
        </div>

        {/* Existing Services List */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Daftar Tarif & Paket Aktif</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Tarif paket yang berlaku untuk antrean mandiri & kasir
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
              {services.length} Paket
            </span>
          </div>

          <div className="space-y-3">
            {services.map((srv) => {
              const isEditing = editingId === srv.id;
              const hKecil = srv.harga_kecil || srv.harga || 0;
              const hBesar = srv.harga_besar || srv.harga || 0;
              const hMobil = srv.harga_mobil || (hBesar ? hBesar * 2 : 40000);

              return (
                <div
                  key={srv.id}
                  id={`service-card-${srv.id}`}
                  className="p-4 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-3 hover:border-emerald-500/40 transition"
                >
                  {isEditing ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Nama Layanan</label>
                        <input
                          type="text"
                          value={editNama}
                          onChange={(e) => setEditNama(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Motor Kecil (Rp)</label>
                          <input
                            type="number"
                            value={editHargaKecil}
                            onChange={(e) => setEditHargaKecil(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Motor Besar (Rp)</label>
                          <input
                            type="number"
                            value={editHargaBesar}
                            onChange={(e) => setEditHargaBesar(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Mobil (Rp)</label>
                          <input
                            type="number"
                            value={editHargaMobil}
                            onChange={(e) => setEditHargaMobil(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Durasi (Mnt)</label>
                          <input
                            type="number"
                            value={editDurasi}
                            onChange={(e) => setEditDurasi(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">Deskripsi</label>
                          <input
                            type="text"
                            value={editDeskripsi}
                            onChange={(e) => setEditDeskripsi(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-200 dark:bg-[#23293D] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => handleSaveEdit(srv.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Simpan</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {srv.nama_layanan}
                          </h4>
                          {srv.badge && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[10px] font-bold font-mono">
                              {srv.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {srv.deskripsi}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                          {/* Harga Motor Kecil */}
                          <div className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-xl">
                            <Bike className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans font-bold">Kecil:</span>
                            <span className="font-black text-emerald-700 dark:text-emerald-400">
                              Rp {hKecil.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Harga Motor Besar */}
                          <div className="flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-1 rounded-xl">
                            <Bike className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans font-bold">Besar:</span>
                            <span className="font-black text-amber-700 dark:text-amber-400">
                              Rp {hBesar.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Harga Mobil */}
                          <div className="flex items-center space-x-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-xl">
                            <Car className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-sans font-bold">Mobil:</span>
                            <span className="font-black text-blue-700 dark:text-blue-400">
                              Rp {hMobil.toLocaleString('id-ID')}
                            </span>
                          </div>

                          <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1 pl-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{srv.durasi_menit} Menit</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(srv)}
                          className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#23293D] text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
                          title="Edit Layanan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(srv.id, srv.nama_layanan)}
                          className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition cursor-pointer"
                          title="Hapus Layanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
