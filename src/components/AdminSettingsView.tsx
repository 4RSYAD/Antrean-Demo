import React, { useState, useEffect } from 'react';
import {
  Settings,
  Store,
  Printer,
  Volume2,
  Save,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Code2,
  Radio,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Wrench,
  Clock,
  ExternalLink,
  ShieldCheck,
  Play,
  Users,
  Download,
  FileText
} from 'lucide-react';
import { StoreSettings, QueueItem, ServiceItem, PitItem, AppUser } from '../types.ts';
import { announceQueueVoice } from '../utils/audio.ts';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testSupabaseConnection,
  seedInitialSupabaseData,
  SUPABASE_SQL_SCHEMA,
  upsertQueueToSupabase,
  upsertServiceToSupabase,
  upsertPitToSupabase,
  upsertSettingsToSupabase,
  upsertUserToSupabase,
  syncQueuesFromSupabase,
  syncServicesFromSupabase,
  syncPitsFromSupabase,
  syncSettingsFromSupabase,
  syncUsersFromSupabase
} from '../utils/supabase.ts';

interface AdminSettingsViewProps {
  settings: StoreSettings;
  setSettings: React.Dispatch<React.SetStateAction<StoreSettings>>;
  queues: QueueItem[];
  setQueues: React.Dispatch<React.SetStateAction<QueueItem[]>>;
  services: ServiceItem[];
  setServices: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  pits: PitItem[];
  setPits: React.Dispatch<React.SetStateAction<PitItem[]>>;
  users?: AppUser[];
  setUsers?: React.Dispatch<React.SetStateAction<AppUser[]>>;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  isSupabaseConnected: boolean;
  setIsSupabaseConnected: (val: boolean) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  setSettings,
  queues,
  setQueues,
  services,
  setServices,
  pits,
  setPits,
  users = [],
  setUsers,
  showToast,
  isSupabaseConnected,
  setIsSupabaseConnected
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'supabase'>('store');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  // Supabase Form States
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [tableHealth, setTableHealth] = useState<{
    queues: boolean;
    services: boolean;
    pits: boolean;
    store_settings: boolean;
    users: boolean;
  }>({
    queues: false,
    services: false,
    pits: false,
    store_settings: false,
    users: false
  });

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setSbUrl(creds.url || '');
    setSbKey(creds.anonKey || '');

    // Check table health if credentials exist
    if (creds.url && creds.anonKey) {
      testSupabaseConnection().then((res) => {
        setTableHealth(res.tables);
        setIsSupabaseConnected(res.success);
      });
    }
  }, [setIsSupabaseConnected]);

  const handleChange = (field: keyof StoreSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    if (isSupabaseConnected) {
      upsertSettingsToSupabase(formData);
    }
    showToast('Pengaturan toko & format struk berhasil disimpan!', 'success');
  };

  const handleTestSpeaker = () => {
    announceQueueVoice(
      `Pemberitahuan dari ${formData.nama_usaha}. Uji coba panggilan speaker ruang tunggu cuci berhasil dilakukan.`
    );
    showToast('Memutar suara pengumuman speaker.', 'info');
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials({
      url: sbUrl.trim(),
      anonKey: sbKey.trim()
    });

    setIsTesting(true);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTableHealth(res.tables);

    if (res.success) {
      setIsSupabaseConnected(true);
      showToast('Kredensial Supabase tersimpan & seluruh tabel siap!', 'success');
    } else {
      setIsSupabaseConnected(false);
      showToast(res.message, 'warning');
    }
  };

  const handleManualTestConnection = async () => {
    setIsTesting(true);
    const res = await testSupabaseConnection();
    setIsTesting(false);
    setTableHealth(res.tables);
    setIsSupabaseConnected(res.success);
    showToast(res.message, res.success ? 'success' : 'error');
  };

  const handleAutoSeedDatabase = async () => {
    setIsSeeding(true);
    const res = await seedInitialSupabaseData();
    setIsSeeding(false);

    if (res.success) {
      showToast(res.message, 'success');
      // Refresh local state from Supabase
      const [remoteSettings, remoteServices, remotePits, remoteQueues, remoteUsers] = await Promise.all([
        syncSettingsFromSupabase(),
        syncServicesFromSupabase(),
        syncPitsFromSupabase(),
        syncQueuesFromSupabase(),
        syncUsersFromSupabase()
      ]);
      if (remoteSettings) {
        setSettings(remoteSettings);
        setFormData(remoteSettings);
      }
      if (remoteServices && remoteServices.length > 0) setServices(remoteServices);
      if (remotePits && remotePits.length > 0) setPits(remotePits);
      if (remoteQueues) setQueues(remoteQueues);
      if (remoteUsers && remoteUsers.length > 0 && setUsers) setUsers(remoteUsers);
    } else {
      showToast(res.message, 'error');
    }
  };

  const handlePushAllDataToSupabase = async () => {
    if (!isSupabaseConnected) {
      showToast('Harap hubungkan dan uji koneksi Supabase terlebih dahulu.', 'warning');
      return;
    }

    setIsSyncingAll(true);
    try {
      // 1. Push settings
      await upsertSettingsToSupabase(formData);
      // 2. Push services
      for (const s of services) {
        await upsertServiceToSupabase(s);
      }
      // 3. Push pits
      for (const p of pits) {
        await upsertPitToSupabase(p);
      }
      // 4. Push queues
      for (const q of queues) {
        await upsertQueueToSupabase(q);
      }
      // 5. Push users
      for (const u of users) {
        await upsertUserToSupabase(u);
      }
      setIsSyncingAll(false);
      showToast('Semua data (antrean, pit, layanan, pengguna, setting) berhasil di-upload ke Supabase!', 'success');
    } catch (err: any) {
      setIsSyncingAll(false);
      showToast(`Gagal sinkronisasi data: ${err?.message || 'Error'}`, 'error');
    }
  };

  const handlePullAllDataFromSupabase = async () => {
    if (!isSupabaseConnected) {
      showToast('Harap hubungkan dan uji koneksi Supabase terlebih dahulu.', 'warning');
      return;
    }

    setIsSyncingAll(true);
    try {
      const [remoteSettings, remoteServices, remotePits, remoteQueues, remoteUsers] = await Promise.all([
        syncSettingsFromSupabase(),
        syncServicesFromSupabase(),
        syncPitsFromSupabase(),
        syncQueuesFromSupabase(),
        syncUsersFromSupabase()
      ]);

      if (remoteSettings) {
        setSettings(remoteSettings);
        setFormData(remoteSettings);
      }
      if (remoteServices && remoteServices.length > 0) {
        setServices(remoteServices);
      }
      if (remotePits && remotePits.length > 0) {
        setPits(remotePits);
      }
      if (remoteQueues) {
        setQueues(remoteQueues);
      }
      if (remoteUsers && remoteUsers.length > 0 && setUsers) {
        setUsers(remoteUsers);
      }

      setIsSyncingAll(false);
      showToast('Data berhasil diperbarui secara real-time dari Supabase!', 'success');
    } catch (err: any) {
      setIsSyncingAll(false);
      showToast(`Gagal mengunduh data: ${err?.message || 'Error'}`, 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    showToast('SQL Schema Supabase berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadSql = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'supabase_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('File supabase_schema.sql berhasil diunduh!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
            <Settings className="w-4 h-4" />
            <span>PENGATURAN SISTEM & DATABASE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Konfigurasi Toko & Supabase Real-Time
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Kelola profil usaha, format cetak struk, dan integrasi penuh database Supabase PostgreSQL
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Supabase Status Indicator */}
          <div
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
              isSupabaseConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-[#161A28] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#23293D]'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isSupabaseConnected ? 'text-emerald-500 animate-pulse' : 'text-slate-400'
              }`}
            />
            <span>{isSupabaseConnected ? 'Supabase Real-Time Aktif' : 'Database Offline'}</span>
          </div>

          <button
            type="button"
            onClick={handleTestSpeaker}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-2xl text-xs transition shadow flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-slate-950" />
            <span>Tes Suara</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-[#23293D] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('store')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'store'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0F121C] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161A28] border border-slate-200 dark:border-[#23293D]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Profil Toko & Struk Kasir</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('supabase')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'supabase'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0F121C] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161A28] border border-slate-200 dark:border-[#23293D]'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Supabase (Full Cloud)</span>
          {isSupabaseConnected && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
          )}
        </button>
      </div>

      {/* Tab Content 1: Store & Receipt Profile */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-[#23293D] pb-3">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Identitas Usaha Cuci Kendaraan</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Nama Usaha / Brand Cuci:
                </label>
                <input
                  type="text"
                  value={formData.nama_usaha}
                  onChange={(e) => handleChange('nama_usaha', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Slogan / Tagline Usaha:
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    No. Telepon / WhatsApp:
                  </label>
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => handleChange('telepon', e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Suara Otomatis Pengumuman:
                  </label>
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="chk-auto-voice"
                      checked={formData.auto_voice}
                      onChange={(e) => handleChange('auto_voice', e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-400 cursor-pointer"
                    />
                    <label
                      htmlFor="chk-auto-voice"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Aktifkan suara Web Speech otomatis
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Alamat Lengkap Usaha:
                </label>
                <textarea
                  rows={2}
                  value={formData.alamat}
                  onChange={(e) => handleChange('alamat', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-slate-200">
                  Pesan Footer Struk Thermal (Catatan Bawah):
                </label>
                <textarea
                  rows={2}
                  value={formData.footer_struk}
                  onChange={(e) => handleChange('footer_struk', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-[#23293D]">
              <button
                type="submit"
                id="btn-save-settings"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition shadow-md flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>Simpan Perubahan Pengaturan</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-[#23293D] pb-3">
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pratinjau Format Struk</span>
            </h3>

            <div className="p-5 bg-slate-50 text-slate-900 rounded-2xl border border-dashed border-slate-300 space-y-3 font-mono text-[11px] shadow-inner">
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                <div className="font-black text-sm tracking-tight text-slate-950 uppercase">
                  {formData.nama_usaha || 'ANTREAN'}
                </div>
                <div className="text-[10px] text-slate-600 font-sans">
                  {formData.tagline || 'Sistem Antrean Cuci Modern'}
                </div>
                <div className="text-[9px] text-slate-500 font-sans">
                  {formData.alamat || 'Jl. Otomotif Raya No. 88'}
                </div>
                <div className="text-[9px] text-slate-500 font-sans">
                  Telp: {formData.telepon || '-'}
                </div>
              </div>

              <div className="space-y-1 text-[10px] text-slate-700">
                <div className="flex justify-between">
                  <span>Waktu Cetak:</span>
                  <span>{new Date().toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-800 text-xs">
                  <span>No. Antrean:</span>
                  <span className="text-base font-mono">A001</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">Budi Santoso</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Cuci Salju Reguler + Semir</span>
                  <span>Rp 15.000</span>
                </div>
              </div>

              <div className="flex justify-between font-black text-xs text-slate-950">
                <span>TOTAL (LUNAS):</span>
                <span>Rp 15.000</span>
              </div>

              <div className="text-center text-[9px] text-slate-500 pt-2 border-t border-dashed border-slate-300 font-sans">
                {formData.footer_struk || 'Terima kasih atas kunjungan Anda!'}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content 2: Supabase Real-Time Integration */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          {/* Table Diagnostics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  tableHealth.queues
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-400'
                }`}
              >
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  Tabel `queues`
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${
                    tableHealth.queues ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {tableHealth.queues ? 'TERSEDIA' : 'BELUM DIBUAT'}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  tableHealth.services
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-400'
                }`}
              >
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  Tabel `services`
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${
                    tableHealth.services ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {tableHealth.services ? 'TERSEDIA' : 'BELUM DIBUAT'}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  tableHealth.pits
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  Tabel `pits`
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${
                    tableHealth.pits ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {tableHealth.pits ? 'TERSEDIA' : 'BELUM DIBUAT'}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  tableHealth.users
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-400'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  Tabel `users`
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${
                    tableHealth.users ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {tableHealth.users ? 'TERSEDIA' : 'BELUM DIBUAT'}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-2xl flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  tableHealth.store_settings
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-[#161A28] text-slate-400'
                }`}
              >
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                  Tabel `settings`
                </div>
                <div
                  className={`text-[10px] font-mono font-bold ${
                    tableHealth.store_settings
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {tableHealth.store_settings ? 'TERSEDIA' : 'BELUM DIBUAT'}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Supabase Config Form */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kredensial Supabase Proyek</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  Realtime Postgres
                </span>
              </div>

              <form onSubmit={handleSaveSupabaseConfig} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Project URL Supabase:
                  </label>
                  <input
                    id="input-supabase-url"
                    type="text"
                    required
                    placeholder="https://xyzcompany.supabase.co"
                    value={sbUrl}
                    onChange={(e) => setSbUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    Dapat dilihat pada Dashboard Supabase &gt; Project Settings &gt; API &gt; Project
                    URL.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Supabase Anon Public API Key:
                  </label>
                  <div className="relative">
                    <input
                      id="input-supabase-key"
                      type={showKey ? 'text' : 'password'}
                      required
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={sbKey}
                      onChange={(e) => setSbKey(e.target.value)}
                      className="w-full px-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Kunci publik (anon key) untuk membaca dan memperbarui data secara real-time.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    id="btn-save-supabase"
                    disabled={isTesting}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition shadow flex items-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Simpan & Aktifkan</span>
                  </button>

                  <button
                    type="button"
                    id="btn-test-supabase"
                    onClick={handleManualTestConnection}
                    disabled={isTesting}
                    className="bg-slate-100 dark:bg-[#161A28] hover:bg-slate-200 dark:hover:bg-[#1F253A] border border-slate-300 dark:border-[#23293D] text-slate-800 dark:text-slate-200 font-extrabold px-4 py-2.5 rounded-2xl text-xs transition flex items-center space-x-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Uji Koneksi Supabase</span>
                  </button>
                </div>
              </form>

              {/* Data Sync & Seed Actions */}
              <div className="pt-5 border-t border-slate-200 dark:border-[#23293D] space-y-3">
                <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Alat Pengisian & Sinkronisasi Data Supabase</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAutoSeedDatabase}
                    disabled={isSeeding || !isSupabaseConnected}
                    className="py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-xs font-bold text-amber-800 dark:text-amber-300 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    title="Isi data awal layanan dan pit langsung ke Supabase"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                    <span>{isSeeding ? 'Mengisi Data...' : 'Isi Data Awal (Auto Seed)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePushAllDataToSupabase}
                    disabled={isSyncingAll || !isSupabaseConnected}
                    className="py-2.5 px-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Upload Semua ke Supabase</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullAllDataFromSupabase}
                    disabled={isSyncingAll || !isSupabaseConnected}
                    className="sm:col-span-2 py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-300 dark:border-blue-800 rounded-2xl text-xs font-bold text-blue-800 dark:text-blue-300 transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                    <span>Tarik Data Terbaru dari Supabase</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Supabase Schema & Realtime Setup Guide */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Setup Skrip SQL Database Supabase
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleDownloadSql}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-[#161A28] hover:bg-slate-200 dark:hover:bg-[#1F253A] border border-slate-300 dark:border-[#23293D] text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition"
                    title="Unduh file supabase_schema.sql ke komputer Anda"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unduh .SQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm transition"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="p-3.5 bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-2xl space-y-2 text-xs">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Langkah Cepat Setup Database di Supabase:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 font-medium pl-1 leading-relaxed">
                  <li>
                    Buka project Anda di <strong>supabase.com</strong> &gt; pilih menu <strong>SQL Editor</strong>.
                  </li>
                  <li>
                    Klik <strong>New Query</strong>, tempel (paste) skrip SQL di bawah, lalu klik <strong>RUN</strong>.
                  </li>
                  <li>
                    Buka menu <strong>Authentication</strong> &gt; <strong>URL Configuration</strong>:
                    <div className="mt-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1 text-[11px] text-amber-950 dark:text-amber-200 font-normal">
                      <p>
                        Ubah <b>Site URL</b> & tambahkan ke <b>Redirect URLs</b> dengan URL aplikasi web ini:
                      </p>
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-[#0F121C] border border-amber-300 dark:border-amber-800/80 font-mono text-[10px]">
                        <span className="truncate mr-2 select-all">
                          {typeof window !== 'undefined' ? window.location.origin : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              navigator.clipboard.writeText(window.location.origin);
                              showToast('URL Aplikasi berhasil disalin!', 'success');
                            }
                          }}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                        >
                          Salin URL
                        </button>
                      </div>
                    </div>
                  </li>
                  <li>
                    Masukkan <strong>Project URL</strong> & <strong>Anon Key</strong> di form sebelah kiri, lalu klik <strong>Simpan & Aktifkan</strong>.
                  </li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>SQL Schema DDL (Queues, Services, Pits, Settings, RLS & Realtime)</span>
                </div>
                <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-[11px] max-h-60 overflow-y-auto border border-slate-800 space-y-1">
                  <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCHEMA}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
