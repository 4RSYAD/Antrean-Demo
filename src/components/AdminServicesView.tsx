import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Edit2, Check, Clock, Bike, Car, X, ShieldCheck, Tag } from 'lucide-react';
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
  // Add Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [hargaKecil, setHargaKecil] = useState('');
  const [hargaBesar, setHargaBesar] = useState('');
  const [hargaMobil, setHargaMobil] = useState('');
  const [durasi, setDurasi] = useState('20');
  const [badge, setBadge] = useState('');

  // Edit Modal/State
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editHargaKecil, setEditHargaKecil] = useState('');
  const [editHargaBesar, setEditHargaBesar] = useState('');
  const [editHargaMobil, setEditHargaMobil] = useState('');
  const [editDurasi, setEditDurasi] = useState('');
  const [editDeskripsi, setEditDeskripsi] = useState('');
  const [editBadge, setEditBadge] = useState('');

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !hargaKecil || !hargaBesar) {
      showToast('Mohon lengkapi nama layanan dan nominal tarif.', 'warning');
      return;
    }

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
      harga: parsedKecil,
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
    setIsAddFormOpen(false);
    showToast(`Paket layanan "${newSrv.nama_layanan}" berhasil ditambahkan!`, 'success');
  };

  const handleStartEdit = (srv: ServiceItem) => {
    setEditingService(srv);
    setEditNama(srv.nama_layanan);
    setEditHargaKecil((srv.harga_kecil || srv.harga || 0).toString());
    setEditHargaBesar((srv.harga_besar || srv.harga || 0).toString());
    setEditHargaMobil((srv.harga_mobil || (srv.harga_besar ? srv.harga_besar * 2 : 40000)).toString());
    setEditDurasi(srv.durasi_menit.toString());
    setEditDeskripsi(srv.deskripsi);
    setEditBadge(srv.badge || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const parsedKecil = parseInt(editHargaKecil.replace(/\D/g, ''), 10);
    const parsedBesar = parseInt(editHargaBesar.replace(/\D/g, ''), 10);
    const parsedMobil = editHargaMobil ? parseInt(editHargaMobil.replace(/\D/g, ''), 10) : parsedBesar * 2;

    if (isNaN(parsedKecil) || parsedKecil <= 0 || isNaN(parsedBesar) || parsedBesar <= 0) {
      showToast('Mohon masukkan harga yang valid.', 'warning');
      return;
    }

    setServices((prev) =>
      prev.map((s) => {
        if (s.id === editingService.id) {
          return {
            ...s,
            nama_layanan: editNama.trim(),
            harga_kecil: parsedKecil,
            harga_besar: parsedBesar,
            harga_mobil: parsedMobil,
            harga: parsedKecil,
            durasi_menit: parseInt(editDurasi, 10) || s.durasi_menit,
            deskripsi: editDeskripsi.trim(),
            badge: editBadge.trim() || undefined
          };
        }
        return s;
      })
    );

    setEditingService(null);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>KATALOG LAYANAN & PENGATURAN TARIF</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white">
            Paket Cuci & Tarif Kendaraan
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Kelola rincian harga per kategori kendaraan (Motor Kecil, Motor Besar, Mobil) dan durasi cuci.
          </p>
        </div>

        <button
          id="btn-toggle-add-service"
          onClick={() => setIsAddFormOpen(!isAddFormOpen)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer shrink-0 w-full sm:w-auto justify-center"
        >
          {isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAddFormOpen ? 'Tutup Formulir' : '+ Tambah Paket Baru'}</span>
        </button>
      </div>

      {/* Collapsible Add New Service Form Card */}
      {isAddFormOpen && (
        <div className="bg-white dark:bg-[#0F121C] border-2 border-emerald-500/40 p-5 sm:p-7 rounded-3xl shadow-lg space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Buat Paket Layanan Baru
              </h3>
            </div>
            <button
              onClick={() => setIsAddFormOpen(false)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddService} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Nama Layanan */}
              <div className="md:col-span-6">
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">
                  Nama Paket Layanan *
                </label>
                <input
                  id="input-service-name"
                  type="text"
                  required
                  placeholder="Contoh: Cuci Salju + Wax Pengilap"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition text-xs"
                />
              </div>

              {/* Durasi */}
              <div className="md:col-span-3">
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Durasi Cuci (Menit) *</span>
                </label>
                <input
                  id="input-service-duration"
                  type="number"
                  required
                  placeholder="20"
                  value={durasi}
                  onChange={(e) => setDurasi(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition text-xs"
                />
              </div>

              {/* Badge Tag */}
              <div className="md:col-span-3">
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold flex items-center space-x-1">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Badge / Label (Opsional)</span>
                </label>
                <input
                  id="input-service-badge"
                  type="text"
                  placeholder="Contoh: Populer, Hemat, Promo"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition text-xs"
                />
              </div>
            </div>

            {/* Matrix Tarif Per Jenis Kendaraan */}
            <div className="p-4 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-3">
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Pengaturan Tarif Berdasarkan Ukuran / Jenis Kendaraan:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Motor Kecil */}
                <div className="p-3 bg-white dark:bg-[#0F121C] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5 text-xs">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                      <Bike className="w-3.5 h-3.5" />
                    </div>
                    <span>Motor Kecil (Rp) *</span>
                  </label>
                  <input
                    id="input-service-price-kecil"
                    type="number"
                    required
                    placeholder="15000"
                    value={hargaKecil}
                    onChange={(e) => setHargaKecil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">Beat, Vario 125, Mio, Scoopy</p>
                </div>

                {/* Motor Besar */}
                <div className="p-3 bg-white dark:bg-[#0F121C] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5 text-xs">
                    <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center">
                      <Bike className="w-3.5 h-3.5" />
                    </div>
                    <span>Motor Besar (Rp) *</span>
                  </label>
                  <input
                    id="input-service-price-besar"
                    type="number"
                    required
                    placeholder="20000"
                    value={hargaBesar}
                    onChange={(e) => setHargaBesar(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">NMAX, PCX, ADV, Moge</p>
                </div>

                {/* Mobil */}
                <div className="p-3 bg-white dark:bg-[#0F121C] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-1.5">
                  <label className="block text-slate-800 dark:text-slate-200 font-bold flex items-center space-x-1.5 text-xs">
                    <div className="w-5 h-5 rounded-md bg-blue-500/15 text-blue-600 flex items-center justify-center">
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <span>Mobil (Rp) *</span>
                  </label>
                  <input
                    id="input-service-price-mobil"
                    type="number"
                    required
                    placeholder="45000"
                    value={hargaMobil}
                    onChange={(e) => setHargaMobil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-blue-500 text-xs"
                  />
                  <p className="text-[10px] text-slate-500">Avanza, Brio, Innova, SUV</p>
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">
                Deskripsi & Rincian Pengerjaan
              </label>
              <textarea
                id="input-service-desc"
                rows={2}
                placeholder="Rincian: sabun salju premium, pembersihan kolong roda, pengeringan blower, semir ban..."
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 transition text-xs"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="px-4 py-2.5 bg-slate-200 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-save-new-service"
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Simpan Paket Layanan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service Cards Grid (Daftar Tarif & Paket Aktif) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Daftar Paket Aktif</span>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              {services.length} Paket
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {services.map((srv) => {
            const hKecil = srv.harga_kecil || srv.harga || 0;
            const hBesar = srv.harga_besar || srv.harga || 0;
            const hMobil = srv.harga_mobil || (hBesar ? hBesar * 2 : 40000);

            return (
              <div
                key={srv.id}
                id={`service-card-${srv.id}`}
                className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs hover:border-emerald-500/50 hover:shadow-md transition space-y-4 relative group"
              >
                <div className="space-y-3">
                  {/* Top Header: Title, Badge, and Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="font-black text-base text-slate-900 dark:text-white truncate">
                          {srv.nama_layanan}
                        </h4>
                        {srv.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-black font-mono">
                            {srv.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Estimasi Pengerjaan: ~{srv.durasi_menit} Menit</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(srv)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-600 dark:text-slate-300 hover:text-emerald-600 rounded-xl transition cursor-pointer"
                        title="Edit Layanan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(srv.id, srv.nama_layanan)}
                        className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="Hapus Layanan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Deskripsi */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[36px]">
                    {srv.deskripsi}
                  </p>
                </div>

                {/* Structured Price Matrix: 3 Boxes */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#23293D]/60 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
                    Tarif Berdasarkan Kategori:
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Motor Kecil */}
                    <div className="p-2.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-center space-y-0.5">
                      <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        <Bike className="w-3 h-3 text-emerald-600 inline" />
                        <span>Kecil</span>
                      </div>
                      <div className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-400 truncate">
                        Rp {hKecil.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Motor Besar */}
                    <div className="p-2.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-center space-y-0.5">
                      <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        <Bike className="w-3 h-3 text-amber-600 inline" />
                        <span>Besar</span>
                      </div>
                      <div className="font-mono font-black text-xs text-amber-700 dark:text-amber-400 truncate">
                        Rp {hBesar.toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Mobil */}
                    <div className="p-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 text-center space-y-0.5">
                      <div className="flex items-center justify-center space-x-1 text-[10px] font-bold text-blue-800 dark:text-blue-300">
                        <Car className="w-3 h-3 text-blue-600 inline" />
                        <span>Mobil</span>
                      </div>
                      <div className="font-mono font-black text-xs text-blue-700 dark:text-blue-400 truncate">
                        Rp {hMobil.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Service Modal */}
      {editingService && (
        <div
          id="modal-edit-service-overlay"
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="modal-edit-service-box"
            className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] max-w-lg w-full p-6 rounded-3xl space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Ubah Paket Layanan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {editingService.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingService(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#161A28] text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">
                  Nama Layanan *
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Durasi (Menit)</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={editDurasi}
                    onChange={(e) => setEditDurasi(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    <span>Badge Tag</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Populer, Hemat"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Price Matrix for Edit */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-2.5">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Tarif Berdasarkan Jenis Kendaraan:
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold text-[11px] flex items-center space-x-1">
                      <Bike className="w-3 h-3 text-emerald-600" />
                      <span>Motor Kecil</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={editHargaKecil}
                      onChange={(e) => setEditHargaKecil(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold text-[11px] flex items-center space-x-1">
                      <Bike className="w-3 h-3 text-amber-600" />
                      <span>Motor Besar</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={editHargaBesar}
                      onChange={(e) => setEditHargaBesar(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold text-[11px] flex items-center space-x-1">
                      <Car className="w-3 h-3 text-blue-600" />
                      <span>Mobil</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={editHargaMobil}
                      onChange={(e) => setEditHargaMobil(e.target.value)}
                      className="w-full px-2.5 py-2 bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 mb-1.5 font-bold">
                  Deskripsi Pengerjaan
                </label>
                <textarea
                  rows={2}
                  value={editDeskripsi}
                  onChange={(e) => setEditDeskripsi(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-[#23293D]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4 text-white" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
