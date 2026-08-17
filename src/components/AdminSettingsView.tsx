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
  FileText,
  Mail,
  Send,
  BellRing,
  Info,
  CheckSquare,
  Globe
} from 'lucide-react';
import { StoreSettings, QueueItem, ServiceItem, PitItem, AppUser, EmailNotificationType } from '../types.ts';
import { announceQueueVoice } from '../utils/audio.ts';
import { triggerQueueEmail, sendEmailNotification, checkEmailStatus } from '../utils/resendClient.ts';
import { generateEmailHtml, getEmailTypeLabel } from '../utils/emailTemplates.ts';
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
  const [activeTab, setActiveTab] = useState<'store' | 'email' | 'supabase'>('store');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });

  // Email test & preview states
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailType, setTestEmailType] = useState<EmailNotificationType>('ticket_created');
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailServerStatus, setEmailServerStatus] = useState<{ configured: boolean; fromEmail: string } | null>(null);
  const [previewEmailType, setPreviewEmailType] = useState<EmailNotificationType>('ticket_created');

  // Supabase Form States
  const [sbUrl, setSbUrl] = useState('');
  const [sbKey, setSbKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedDnsKey, setCopiedDnsKey] = useState<string | null>(null);
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

    // Check Resend Email Server Status
    checkEmailStatus().then((status) => {
      setEmailServerStatus(status);
    });
  }, [setIsSupabaseConnected]);

  const handleChange = (field: keyof StoreSettings, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDnsKey(key);
    setTimeout(() => setCopiedDnsKey(null), 2000);
    showToast('Teks DNS berhasil disalin ke clipboard!', 'info');
  };

  const handleSaveStoreSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    if (isSupabaseConnected) {
      upsertSettingsToSupabase(formData);
    }
    showToast('Pengaturan toko & format struk berhasil disimpan!', 'success');
  };

  const handleSaveEmailSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    if (isSupabaseConnected) {
      upsertSettingsToSupabase(formData);
    }
    showToast('Pengaturan Notifikasi Email Resend berhasil disimpan!', 'success');
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      showToast('Masukkan alamat email tujuan pengujian yang valid.', 'warning');
      return;
    }

    setIsSendingTestEmail(true);
    // Create dummy sample queue item for testing
    const sampleQueue: QueueItem = {
      id: 'test-q-123',
      nomor_antrian: 'A-012',
      nama_pemohon: 'Budi Santoso',
      email: testEmailAddress.trim(),
      phone: '081234567890',
      tipe_motor: 'mobil',
      layanan_id: services[0]?.id || 's-1',
      total_biaya: 45000,
      status: testEmailType === 'completed_paid' ? 'done' : testEmailType === 'calling_pit' ? 'washing' : 'waiting',
      pit_id: pits[0]?.id || null,
      created_at: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      is_paid: testEmailType === 'completed_paid',
      paid_at: testEmailType === 'completed_paid' ? new Date().toLocaleTimeString('id-ID') : undefined,
      cashier_name: 'Kasir Utama'
    };

    const sampleService = services[0] || {
      id: 's-1',
      nama_layanan: 'Cuci Salju Hidrolik + Wax',
      deskripsi: 'Pencucian detail body & kolong mesin',
      harga_kecil: 25000,
      harga_besar: 35000,
      harga_mobil: 45000,
      durasi_menit: 25
    };

    const samplePit = pits[0] || {
      id: 'p-1',
      nama_pit: 'Pit Bay 1 (Hydraulic Lift)',
      status: 'sibuk'
    };

    const res = await sendEmailNotification({
      to: testEmailAddress.trim(),
      type: testEmailType,
      queue: sampleQueue,
      service: sampleService,
      pit: samplePit,
      storeSettings: formData
    });

    setIsSendingTestEmail(false);
    if (res.success) {
      showToast(`Email ${getEmailTypeLabel(testEmailType)} berhasil terkirim ke ${testEmailAddress}!`, 'success');
      // Refresh email server status
      checkEmailStatus().then(setEmailServerStatus);
    } else {
      showToast(`Gagal mengirim email: ${res.message}`, 'error');
    }
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
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-[#23293D] pb-2">
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
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'email'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-[#0F121C] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161A28] border border-slate-200 dark:border-[#23293D]'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Notifikasi Email Resend (4 Tahap)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
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

      {/* Tab Content 2: Resend Email Integration (4 Stages) */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Email Server Status & Info Banner */}
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#23293D] pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
                  <Mail className="w-4 h-4" />
                  <span>INTEGRASI NOTIFIKASI EMAIL RESEND</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Otomasi Notifikasi Email 4 Tahap Antrean
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Kirim email otomatis ke pelanggan saat berhasil ambil tiket, giliran mau dipanggil, sedang dipanggil ke pit, dan selesai cuci (lunas).
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <div
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
                    emailServerStatus?.configured
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      emailServerStatus?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  ></span>
                  <span>
                    {emailServerStatus?.configured
                      ? 'Resend API Aktif'
                      : 'Server API Siap (Kredensial Default)'}
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Stages Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {/* Stage 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    ticket_created
                  </span>
                </div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Berhasil Ambil Antrean
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dikirim saat pelanggan mendaftar di Kiosk atau Kasir dengan nomor tiket, estimasi, dan paket layanan.
                </p>
              </div>

              {/* Stage 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center font-mono">
                    2
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                    upcoming_call
                  </span>
                </div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Antrean Mau Dipanggil
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Peringatan agar pelanggan segera bersiap menuju area pencucian saat 1 antrean sebelum dipanggil.
                </p>
              </div>

              {/* Stage 3 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400">
                    calling_pit
                  </span>
                </div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Sedang Dipanggil ke Pit
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Panggilan resmi memasukkan kendaraan ke Pit Bay pencucian tertentu untuk mulai proses cuci.
                </p>
              </div>

              {/* Stage 4 */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-bold text-xs flex items-center justify-center font-mono">
                    4
                  </span>
                  <span className="text-[10px] font-mono font-bold text-teal-700 dark:text-teal-400">
                    completed_paid
                  </span>
                </div>
                <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                  Selesai & Pembayaran Lunas
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Kwitansi digital resmi dikirim ke email setelah pelanggan menyelesaikan pembayaran di kasir.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Email Config & Live Tester */}
            <div className="lg:col-span-6 space-y-6">
              {/* Config Form */}
              <form
                onSubmit={handleSaveEmailSettings}
                className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-5 shadow-sm"
              >
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2 border-b border-slate-200 dark:border-[#23293D] pb-3">
                  <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Pengaturan Pengiriman Email</span>
                </h3>

                <div className="space-y-4 text-xs">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D]">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 dark:text-white">
                        Aktifkan Otomasi Email
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Kirim email secara otomatis pada 4 tahap antrean
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.email_notifications_enabled !== false}
                        onChange={(e) => handleChange('email_notifications_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* Sender Email (From) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 dark:text-slate-200">
                        Email Pengirim (Sender From):
                      </label>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/60 flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>antrean.online</span>
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formData.resend_from_email || ''}
                      onChange={(e) => handleChange('resend_from_email', e.target.value)}
                      placeholder="notif@antrean.online"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold font-mono focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    {/* Quick domain presets */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 font-medium">Pilih preset alamat domain antrean.online:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'notif@antrean.online',
                          'cs@antrean.online',
                          'noreply@antrean.online',
                          'info@antrean.online',
                          'onboarding@resend.dev'
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleChange('resend_from_email', preset)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition cursor-pointer border ${
                              formData.resend_from_email === preset
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:border-emerald-500'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Resend API Key (Optional Override) */}
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span>Resend API Key:</span>
                      <span className="text-[10px] text-slate-400 font-normal">Opsional (bisa via .env)</span>
                    </label>
                    <input
                      type="password"
                      value={formData.resend_api_key || ''}
                      onChange={(e) => handleChange('resend_api_key', e.target.value)}
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold font-mono focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <p className="text-[10px] text-slate-500">
                      Dapatkan API key di <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="text-emerald-600 underline">resend.com/api-keys</a>.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-2xl transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Simpan Pengaturan Email</span>
                  </button>
                </div>
              </form>

              {/* Live Email Tester Form */}
              <form
                onSubmit={handleSendTestEmail}
                className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Uji Coba Pengiriman Email Nyata</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                    Live Resend API
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Email Tujuan Uji Coba:
                    </label>
                    <input
                      type="email"
                      required
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="nama@emailanda.com"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Pilih Tahap Notifikasi:
                    </label>
                    <select
                      value={testEmailType}
                      onChange={(e) => setTestEmailType(e.target.value as EmailNotificationType)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-2xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ticket_created">1. Berhasil Ambil Antrean (Tiket Baru)</option>
                      <option value="upcoming_call">2. Antrean Mau Dipanggil (Peringatan)</option>
                      <option value="calling_pit">3. Sedang Dipanggil Masuk Pit Bay</option>
                      <option value="completed_paid">4. Antrean Selesai & Pembayaran Lunas (Kwitansi)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isSendingTestEmail}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-extrabold py-3 px-4 rounded-2xl transition shadow flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingTestEmail ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengirim via Resend...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Email Uji Coba Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right: Visual Template Previewer */}
            <div className="lg:col-span-6 bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[#23293D] pb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Pratinjau Tampilan Template Email</span>
                  </h3>

                  <div className="flex space-x-1 overflow-x-auto pb-1 sm:pb-0">
                    {(['ticket_created', 'upcoming_call', 'calling_pit', 'completed_paid'] as EmailNotificationType[]).map((t, idx) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPreviewEmailType(t)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 ${
                          previewEmailType === t
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-[#161A28] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        Tahap {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Preview Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-4 max-h-[460px] overflow-y-auto">
                  {/* Header preview */}
                  <div className="text-center pb-3 border-b border-slate-200 dark:border-[#23293D] space-y-1">
                    <div className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
                      {formData.nama_usaha || 'SISTEM CUCI KENDARAAN'}
                    </div>
                    <div className="text-base font-black text-slate-900 dark:text-white">
                      {previewEmailType === 'ticket_created' && 'Nomor Antrean Anda Berhasil Terdaftar!'}
                      {previewEmailType === 'upcoming_call' && 'Peringatan: Antrean Anda Segera Dipanggil!'}
                      {previewEmailType === 'calling_pit' && 'Nomor Antrean Anda Sedang Dipanggil!'}
                      {previewEmailType === 'completed_paid' && 'Pencucian Selesai & Pembayaran Berhasil'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Halo <b>Budi Santoso</b>, berikut adalah pembaruan status antrean cuci kendaraan Anda.
                    </div>
                  </div>

                  {/* Big Number Pill */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] text-center space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Nomor Antrean</div>
                    <div className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      A-012
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Cuci Salju Hidrolik + Wax (Mobil)
                    </div>
                  </div>

                  {/* Dynamic detail box */}
                  <div className="space-y-2 text-xs">
                    {previewEmailType === 'ticket_created' && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-300 space-y-1">
                        <div className="font-bold">Estimasi Waktu Tunggu: ~15 - 20 Menit</div>
                        <p className="text-[11px]">Silakan menikmati fasilitas ruang tunggu ber-AC kami yang nyaman.</p>
                      </div>
                    )}

                    {previewEmailType === 'upcoming_call' && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 space-y-1">
                        <div className="font-bold">Sisa 1 Antrean Sebelum Giliran Anda!</div>
                        <p className="text-[11px]">Harap bersiap-siap menuju kendaraan Anda untuk persiapan masuk ke Pit Bay pencucian.</p>
                      </div>
                    )}

                    {previewEmailType === 'calling_pit' && (
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-900 dark:text-blue-300 space-y-1">
                        <div className="font-bold">Silakan Masuk ke: Pit Bay 1 (Hydraulic Lift)</div>
                        <p className="text-[11px]">Petugas cuci kami siap melayani kendaraan Anda.</p>
                      </div>
                    )}

                    {previewEmailType === 'completed_paid' && (
                      <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-teal-900 dark:text-teal-300 space-y-1">
                        <div className="font-bold">Status Pembayaran: LUNAS (Rp 45.000)</div>
                        <p className="text-[11px]">Terima kasih telah mempercayakan kebersihan kendaraan Anda kepada kami!</p>
                      </div>
                    )}
                  </div>

                  {/* Footer note */}
                  <div className="text-center text-[10px] text-slate-400 border-t border-slate-200 dark:border-[#23293D] pt-3">
                    {formData.nama_usaha || 'Sistem Antrean Cuci'} &bull; {formData.alamat || 'Jl. Otomotif Raya No. 88'} &bull; Telp: {formData.telepon || '-'}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                ⚡ Template email didesain dengan format HTML responsif yang kompatibel di Gmail, Apple Mail, Outlook, dan aplikasi email seluler.
              </div>
            </div>
          </div>

          {/* Dedicated Custom Domain Guide for antrean.online */}
          <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-6 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#23293D] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Panduan Konfigurasi Domain: <span className="text-emerald-600 dark:text-emerald-400">antrean.online</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      Custom Domain
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kirim email notifikasi profesional dari <code className="font-bold text-emerald-600">notif@antrean.online</code> langsung ke seluruh pelanggan tanpa batasan sandbox.
                  </p>
                </div>
              </div>

              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer shadow-sm"
              >
                <span>Buka Resend Domains</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* 4-Step Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                  <span>Tambah Domain</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Buka Resend Dashboard, klik <b>Add Domain</b>, dan ketik <code>antrean.online</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                  <span>Buka DNS Manager</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Buka Cloudflare, Niagahoster, Domainesia, atau provider tempat beli domain.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">3</span>
                  <span>Input Record DNS</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tambahkan DNS Record (DKIM, SPF, MX, DMARC) seperti pada tabel di bawah.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] space-y-1">
                <div className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">4</span>
                  <span>Klik Verify</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Klik <b>Verify Domain</b> di Resend. Status akan aktif (Verified) dalam beberapa menit.
                </p>
              </div>
            </div>

            {/* DNS Records Reference Table */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Daftar DNS Records untuk domain antrean.online:</span>
                <span className="text-[10px] text-slate-400 font-normal">Klik tombol salin untuk menyalin nilai host/value</span>
              </div>

              <div className="border border-slate-200 dark:border-[#23293D] rounded-2xl overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-[#161A28] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-[#23293D]">
                      <tr>
                        <th className="px-4 py-3">Tipe</th>
                        <th className="px-4 py-3">Name / Host</th>
                        <th className="px-4 py-3">Value / Target</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#23293D] text-slate-800 dark:text-slate-200 font-mono">
                      {/* DKIM */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-[#161A28]/50">
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">TXT (DKIM)</td>
                        <td className="px-4 py-3 text-[11px]">resend._domainkey</td>
                        <td className="px-4 py-3 text-[11px] max-w-xs truncate text-slate-500">
                          (Dapatkan kunci unik DKIM dari menu Domain di Resend Dashboard)
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyText('resend._domainkey', 'host_dkim')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#23293D] hover:bg-emerald-600 hover:text-white transition cursor-pointer text-[10px] font-sans font-bold"
                          >
                            {copiedDnsKey === 'host_dkim' ? 'Tersalin ✓' : 'Salin Host'}
                          </button>
                        </td>
                      </tr>

                      {/* SPF */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-[#161A28]/50">
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">TXT (SPF)</td>
                        <td className="px-4 py-3 text-[11px]">bounces</td>
                        <td className="px-4 py-3 text-[11px] text-slate-700 dark:text-slate-300">
                          v=spf1 include:amazonses.com ~all
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyText('v=spf1 include:amazonses.com ~all', 'val_spf')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#23293D] hover:bg-emerald-600 hover:text-white transition cursor-pointer text-[10px] font-sans font-bold"
                          >
                            {copiedDnsKey === 'val_spf' ? 'Tersalin ✓' : 'Salin Value'}
                          </button>
                        </td>
                      </tr>

                      {/* MX */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-[#161A28]/50">
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">MX (Bounces)</td>
                        <td className="px-4 py-3 text-[11px]">bounces (Priority 10)</td>
                        <td className="px-4 py-3 text-[11px] text-slate-700 dark:text-slate-300">
                          feedback-smtp.us-east-1.amazonses.com
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyText('feedback-smtp.us-east-1.amazonses.com', 'val_mx')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#23293D] hover:bg-emerald-600 hover:text-white transition cursor-pointer text-[10px] font-sans font-bold"
                          >
                            {copiedDnsKey === 'val_mx' ? 'Tersalin ✓' : 'Salin Value'}
                          </button>
                        </td>
                      </tr>

                      {/* DMARC */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-[#161A28]/50">
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">TXT (DMARC)</td>
                        <td className="px-4 py-3 text-[11px]">_dmarc</td>
                        <td className="px-4 py-3 text-[11px] text-slate-700 dark:text-slate-300">
                          v=DMARC1; p=none;
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyText('v=DMARC1; p=none;', 'val_dmarc')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#23293D] hover:bg-emerald-600 hover:text-white transition cursor-pointer text-[10px] font-sans font-bold"
                          >
                            {copiedDnsKey === 'val_dmarc' ? 'Tersalin ✓' : 'Salin Value'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center space-x-3 text-xs text-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>
                Setelah diverifikasi di Resend, pengirim email Anda akan otomatis menggunakan <b>notif@antrean.online</b> dengan reputasi inbox 100% tinggi dan anti-spam.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Supabase Real-Time Integration */}
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
