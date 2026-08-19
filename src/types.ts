export type QueueStatus = 'waiting' | 'washing' | 'waiting_payment' | 'done' | 'cancelled';

export type VehicleType = 'kecil' | 'besar' | 'mobil';
export type MotorType = VehicleType;

export interface QueueItem {
  id: string;
  nomor_antrian: string;
  nama_pemohon: string;
  email?: string;
  phone?: string;
  tipe_motor: VehicleType;
  layanan_id: string;
  total_biaya: number;
  status: QueueStatus;
  pit_id: string | null;
  created_at: string;
  washed_at?: string;
  completed_at?: string;
  notes?: string;
  // Payment tracking
  is_paid: boolean;
  paid_at?: string;
  cashier_name?: string;
  last_email_sent?: EmailNotificationType;
  last_email_sent_at?: string;
}

export interface ServiceItem {
  id: string;
  nama_layanan: string;
  deskripsi: string;
  harga_kecil: number;
  harga_besar: number;
  harga_mobil?: number;
  harga?: number; // legacy fallback
  durasi_menit: number;
  icon?: string;
  badge?: string;
}

export type PitType = 'hydraulic' | 'foam' | 'drying' | 'detailing' | 'standard';

export interface PitItem {
  id: string;
  nama_pit: string;
  tipe_pit?: PitType;
  status: 'tersedia' | 'sibuk' | 'maintenance';
  keterangan?: string;
}

export interface StoreSettings {
  nama_usaha: string;
  tagline: string;
  alamat: string;
  telepon: string;
  footer_struk: string;
  auto_voice: boolean;
  // Resend Email notification settings
  resend_api_key?: string;
  resend_from_email?: string;
  email_notifications_enabled?: boolean;
}

export type EmailNotificationType =
  | 'ticket_created'    // 1. Berhasil ambil antrean
  | 'upcoming_call'      // 2. Antrean mau dipanggil (peringatan persiapan)
  | 'calling_pit'        // 3. Antrean sedang dipanggil masuk ke pit
  | 'wash_finished'     // 4. Pencucian selesai (pemberitahuan menuju kasir)
  | 'completed_paid';    // 5. Antrean selesai & pembayaran lunas (kwitansi)

export interface EmailNotificationPayload {
  to: string;
  type: EmailNotificationType;
  queue: QueueItem;
  service?: ServiceItem;
  pit?: PitItem;
  storeSettings?: StoreSettings;
  customNotes?: string;
}

export type UserRole = 'admin' | 'pelanggan';

export type AppUserRole = 'admin' | 'kasir' | 'operator' | 'pengguna';
export type AppUserStatus = 'aktif' | 'nonaktif';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: AppUserRole;
  status: AppUserStatus;
  phone?: string;
  is_email_verified?: boolean;
  verification_code?: string;
  created_at?: string;
  last_login?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'kasir' | 'operator' | 'pengguna';
  is_logged_in: boolean;
  logged_at?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  isRealtimeActive: boolean;
  lastSync?: string;
}

export type AdminView =
  | 'dashboard'
  | 'queues'
  | 'pit'
  | 'pit_manage'
  | 'services'
  | 'reports'
  | 'users'
  | 'settings'
  | 'tv'
  | 'login';

export type CustomerView = 'check' | 'register' | 'tv' | 'login';

export interface ToastNotification {
  id: string;
  msg: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

export interface ConfirmModalData {
  isOpen: boolean;
  title: string;
  message: string;
  action: (() => void) | null;
}
