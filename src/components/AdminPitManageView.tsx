import React, { useState } from 'react';
import {
  Wrench,
  PlusCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Car,
  Sparkles,
  Droplets,
  Layers,
  Check,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { PitItem, QueueItem, ServiceItem, PitType } from '../types.ts';

interface AdminPitManageViewProps {
  pits: PitItem[];
  queues: QueueItem[];
  services: ServiceItem[];
  onAddPit: (newPit: Omit<PitItem, 'id'>) => void;
  onUpdatePit: (id: string, updated: Partial<PitItem>) => void;
  onDeletePit: (id: string) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const AdminPitManageView: React.FC<AdminPitManageViewProps> = ({
  pits,
  queues,
  services,
  onAddPit,
  onUpdatePit,
  onDeletePit,
  showToast
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingPit, setEditingPit] = useState<PitItem | null>(null);

  // Form State
  const [namaPit, setNamaPit] = useState('');
  const [tipePit, setTipePit] = useState<PitType>('hydraulic');
  const [statusPit, setStatusPit] = useState<'tersedia' | 'sibuk' | 'maintenance'>('tersedia');
  const [keterangan, setKeterangan] = useState('');

  const openAddModal = () => {
    setNamaPit(`Pit Bay ${pits.length + 1}`);
    setTipePit('standard');
    setStatusPit('tersedia');
    setKeterangan('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (pit: PitItem) => {
    setEditingPit(pit);
    setNamaPit(pit.nama_pit);
    setTipePit(pit.tipe_pit || 'standard');
    setStatusPit(pit.status);
    setKeterangan(pit.keterangan || '');
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPit.trim()) {
      showToast('Nama Pit Bay wajib diisi.', 'warning');
      return;
    }
    onAddPit({
      nama_pit: namaPit.trim(),
      tipe_pit: tipePit,
      status: statusPit,
      keterangan: keterangan.trim()
    });
    setIsAddModalOpen(false);
    showToast(`Pit Bay "${namaPit}" berhasil ditambahkan!`, 'success');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPit || !namaPit.trim()) return;

    onUpdatePit(editingPit.id, {
      nama_pit: namaPit.trim(),
      tipe_pit: tipePit,
      status: statusPit,
      keterangan: keterangan.trim()
    });
    setEditingPit(null);
    showToast(`Pit Bay "${namaPit}" berhasil diperbarui!`, 'success');
  };

  const handleDelete = (pit: PitItem) => {
    // Check if pit is currently used by washing queues
    const activeInPit = queues.find((q) => q.pit_id === pit.id && q.status === 'washing');
    if (activeInPit) {
      showToast(
        `Tidak dapat menghapus ${pit.nama_pit} karena sedang digunakan oleh antrean ${activeInPit.nomor_antrian} (${activeInPit.nama_pemohon}).`,
        'error'
      );
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus ${pit.nama_pit}?`)) {
      onDeletePit(pit.id);
      showToast(`${pit.nama_pit} berhasil dihapus.`, 'warning');
    }
  };

  const getPitTypeBadge = (type?: PitType) => {
    switch (type) {
      case 'hydraulic':
        return { label: 'Lift Hidrolik', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' };
      case 'foam':
        return { label: 'Snow Foam Wash', color: 'bg-teal-500/15 text-teal-700 dark:text-teal-400' };
      case 'drying':
        return { label: 'Drying & Polish', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' };
      case 'detailing':
        return { label: 'Deep Detailing', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' };
      default:
        return { label: 'Standard Wash', color: 'bg-slate-500/15 text-slate-700 dark:text-slate-400' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
            <Wrench className="w-4 h-4" />
            <span>MANAJEMEN PIT BAY & JALUR CUCI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Kelola Daftar Pit Bay Cuci Kendaraan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tambah pit baru, atur tipe fasilitas pengerjaan, status perbaikan (maintenance), dan hapus pit
          </p>
        </div>

        <button
          id="btn-add-new-pit"
          onClick={openAddModal}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs transition shadow-md flex items-center space-x-2 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-slate-950" />
          <span>Tambah Pit Bay Baru</span>
        </button>
      </div>

      {/* Grid of Pit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pits.map((pit) => {
          const typeInfo = getPitTypeBadge(pit.tipe_pit);
          const activeQueue = queues.find((q) => q.pit_id === pit.id && q.status === 'washing');
          const service = activeQueue ? services.find((s) => s.id === activeQueue.layanan_id) : null;

          return (
            <div
              key={pit.id}
              id={`pit-manage-card-${pit.id}`}
              className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 flex flex-col justify-between space-y-5 shadow-sm hover:border-emerald-500/40 transition"
            >
              <div className="space-y-3">
                {/* Card Top */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                      pit.status === 'maintenance'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                        : activeQueue
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 animate-pulse'
                        : 'bg-slate-100 dark:bg-[#161A28] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {pit.status === 'maintenance'
                      ? 'PERBAIKAN'
                      : activeQueue
                      ? 'SEDANG CUCI'
                      : 'TERSEDIA'}
                  </span>
                </div>

                {/* Pit Title */}
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {pit.nama_pit}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                    {pit.keterangan || 'Fasilitas cuci & detailing standar'}
                  </p>
                </div>

                {/* Live Occupancy Status */}
                <div className="p-3.5 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] text-xs">
                  {activeQueue ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Kendaraan Aktif:</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {activeQueue.nomor_antrian}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {activeQueue.nama_pemohon}
                      </div>
                      <div className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                        {activeQueue.tipe_motor === 'mobil' ? 'Mobil' : activeQueue.tipe_motor === 'besar' ? 'Motor Besar' : 'Motor Kecil'} • {service?.nama_layanan}
                      </div>
                    </div>
                  ) : pit.status === 'maintenance' ? (
                    <div className="flex items-center space-x-2 text-rose-500 text-xs font-semibold py-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Pit sedang dalam perbaikan / tidak aktif</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-slate-400 text-xs py-1">
                      <Car className="w-4 h-4 shrink-0" />
                      <span>Standby / Siap menerima antrean berikutnya</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-[#23293D] flex items-center justify-between">
                <button
                  id={`btn-edit-pit-${pit.id}`}
                  onClick={() => openEditModal(pit)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-[#161A28] hover:bg-slate-200 dark:hover:bg-[#1E2336] text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Pit</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    id={`btn-toggle-maintenance-${pit.id}`}
                    onClick={() => {
                      const nextStatus = pit.status === 'maintenance' ? 'tersedia' : 'maintenance';
                      onUpdatePit(pit.id, { status: nextStatus });
                      showToast(
                        `${pit.nama_pit} diubah ke ${nextStatus === 'maintenance' ? 'Perbaikan' : 'Tersedia'}.`,
                        'info'
                      );
                    }}
                    className={`p-2 rounded-xl transition text-xs font-bold ${
                      pit.status === 'maintenance'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                    }`}
                    title={pit.status === 'maintenance' ? 'Aktifkan Kembali Pit' : 'Set Perbaikan (Maintenance)'}
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>

                  <button
                    id={`btn-delete-pit-${pit.id}`}
                    onClick={() => handleDelete(pit)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition"
                    title="Hapus Pit Bay"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Pit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#23293D] pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                <span>Tambah Pit Bay Baru</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nama Pit Bay:
                </label>
                <input
                  id="input-pit-name-add"
                  type="text"
                  value={namaPit}
                  onChange={(e) => setNamaPit(e.target.value)}
                  placeholder="Contoh: Pit Bay 4 (Detailing)"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Tipe Fasilitas Pit:
                </label>
                <select
                  id="select-pit-type-add"
                  value={tipePit}
                  onChange={(e) => setTipePit(e.target.value as PitType)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="hydraulic">Hydraulic Lift (Cuci Kolong)</option>
                  <option value="foam">Snow Foam Wash & High Pressure</option>
                  <option value="drying">Drying & Blower Polish</option>
                  <option value="detailing">Deep Detailing & Engine Bay</option>
                  <option value="standard">Standard Wash Bay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Keterangan / Fasilitas:
                </label>
                <textarea
                  id="input-pit-desc-add"
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Contoh: Dilengkapi pompa hidrolik 4 ton & foam cannon"
                  className="w-full px-3.5 py-2 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-add-pit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow"
                >
                  Simpan Pit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pit Modal */}
      {editingPit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#23293D] pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-emerald-500" />
                <span>Edit Pit Bay</span>
              </h3>
              <button
                onClick={() => setEditingPit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Nama Pit Bay:
                </label>
                <input
                  id="input-pit-name-edit"
                  type="text"
                  value={namaPit}
                  onChange={(e) => setNamaPit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Tipe Fasilitas Pit:
                </label>
                <select
                  id="select-pit-type-edit"
                  value={tipePit}
                  onChange={(e) => setTipePit(e.target.value as PitType)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="hydraulic">Hydraulic Lift (Cuci Kolong)</option>
                  <option value="foam">Snow Foam Wash & High Pressure</option>
                  <option value="drying">Drying & Blower Polish</option>
                  <option value="detailing">Deep Detailing & Engine Bay</option>
                  <option value="standard">Standard Wash Bay</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Status Operasional:
                </label>
                <select
                  id="select-pit-status-edit"
                  value={statusPit}
                  onChange={(e) => setStatusPit(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                >
                  <option value="tersedia">Tersedia (Siap)</option>
                  <option value="sibuk">Sibuk</option>
                  <option value="maintenance">Perbaikan (Maintenance)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Keterangan / Fasilitas:
                </label>
                <textarea
                  id="input-pit-desc-edit"
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-100 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPit(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-edit-pit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow"
                >
                  Perbarui Pit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
