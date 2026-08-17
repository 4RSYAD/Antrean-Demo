import { QueueItem, ServiceItem, PitItem, StoreSettings, AppUser } from '../types.ts';

export const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    nama_layanan: 'Cuci Salju Reguler + Semir Ban',
    deskripsi: 'Busa salju aktif, cuci kolong & sela-sela, bilas air tekanan tinggi, & semir ban wet-look',
    harga_kecil: 15000,
    harga_besar: 20000,
    harga_mobil: 45000,
    durasi_menit: 20,
    badge: 'Populer'
  },
  {
    id: 'srv-2',
    nama_layanan: 'Cuci Salju + Wax Pengilap Body',
    deskripsi: 'Cuci bersih salju tebal, pengeringan blower mikro, pengilap bodi wax proteksi kilau, & semir ban',
    harga_kecil: 25000,
    harga_besar: 35000,
    harga_mobil: 65000,
    durasi_menit: 30,
    badge: 'Best Value'
  },
  {
    id: 'srv-3',
    nama_layanan: 'Deep Clean Komplit + Hydro Wax',
    deskripsi: 'Cuci komplit, pembersih kerak mesin degreaser, pembersih velg & kolong, & hydro-coating bodi',
    harga_kecil: 45000,
    harga_besar: 60000,
    harga_mobil: 120000,
    durasi_menit: 45,
    badge: 'Premium'
  },
  {
    id: 'srv-4',
    nama_layanan: 'Quick Wash & Blower Kering',
    deskripsi: 'Cuci express, bilas cepat, pengeringan blower udara mikro & semir ban',
    harga_kecil: 12000,
    harga_besar: 17000,
    harga_mobil: 35000,
    durasi_menit: 15
  }
];

export const INITIAL_PITS: PitItem[] = [
  {
    id: 'pit-1',
    nama_pit: 'Pit Bay 1 (Hydraulic Lift)',
    tipe_pit: 'hydraulic',
    status: 'tersedia',
    keterangan: 'Lift hidrolik cuci kolong motor & mesin'
  },
  {
    id: 'pit-2',
    nama_pit: 'Pit Bay 2 (Wash & Snow Foam)',
    tipe_pit: 'foam',
    status: 'tersedia',
    keterangan: 'Penyemprotan salju tebal & bilas high-pressure'
  },
  {
    id: 'pit-3',
    nama_pit: 'Pit Bay 3 (Drying & Wax)',
    tipe_pit: 'drying',
    status: 'tersedia',
    keterangan: 'Area pengeringan blower & poles semir ban'
  }
];

export const INITIAL_QUEUES: QueueItem[] = [
  {
    id: 'q-101',
    nomor_antrian: 'A001',
    nama_pemohon: 'Budi Santoso',
    tipe_motor: 'kecil',
    layanan_id: 'srv-1',
    total_biaya: 15000,
    status: 'done',
    pit_id: 'pit-1',
    created_at: '09:15',
    washed_at: '09:35',
    completed_at: '09:40',
    is_paid: true,
    paid_at: '09:40',
    cashier_name: 'Kasir Utama'
  },
  {
    id: 'q-102',
    nomor_antrian: 'A002',
    nama_pemohon: 'Rian Pratama',
    tipe_motor: 'besar',
    layanan_id: 'srv-2',
    total_biaya: 35000,
    status: 'waiting_payment',
    pit_id: 'pit-2',
    created_at: '09:30',
    washed_at: '09:55',
    is_paid: false
  },
  {
    id: 'q-103',
    nomor_antrian: 'A003',
    nama_pemohon: 'Hendro Wijaya',
    tipe_motor: 'mobil',
    layanan_id: 'srv-1',
    total_biaya: 45000,
    status: 'washing',
    pit_id: 'pit-3',
    created_at: '09:45',
    is_paid: false
  },
  {
    id: 'q-104',
    nomor_antrian: 'A004',
    nama_pemohon: 'Dewi Lestari',
    tipe_motor: 'kecil',
    layanan_id: 'srv-1',
    total_biaya: 15000,
    status: 'waiting',
    pit_id: null,
    created_at: '10:00',
    is_paid: false
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  nama_usaha: 'ANTREAN',
  tagline: 'Sistem Cuci Kendaraan Modern, Bersih Mengkilap & Cepat',
  alamat: 'Jl. Otomotif Raya No. 88, Jakarta Selatan',
  telepon: '0812-3456-7890',
  footer_struk: 'Simpan struk ini untuk tanda bukti pengambilan kendaraan. Terima Kasih atas Kunjungan Anda!',
  auto_voice: true,
  resend_from_email: 'notif@antrean.online',
  email_notifications_enabled: true
};

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-admin-1',
    name: 'Administrator Utama',
    email: 'admin@antrean.com',
    password: 'admin',
    role: 'admin',
    status: 'aktif',
    phone: '0812-3456-7890',
    created_at: new Date().toISOString()
  },
  {
    id: 'usr-kasir-1',
    name: 'Petugas Kasir 1',
    email: 'kasir@antrean.com',
    password: 'kasir',
    role: 'kasir',
    status: 'aktif',
    phone: '0812-9876-5432',
    created_at: new Date().toISOString()
  },
  {
    id: 'usr-operator-1',
    name: 'Operator Pit Bay',
    email: 'operator@antrean.com',
    password: 'operator',
    role: 'operator',
    status: 'aktif',
    phone: '0813-1122-3344',
    created_at: new Date().toISOString()
  }
];

const STORAGE_KEYS = {
  QUEUES: 'antrean_cuci_queues_v5',
  SERVICES: 'antrean_cuci_services_v5',
  PITS: 'antrean_cuci_pits_v5',
  USERS: 'antrean_cuci_users_v5',
  SETTINGS: 'antrean_cuci_settings_v5',
  THEME: 'antrean_cuci_theme_v5',
  MUTED: 'antrean_cuci_muted_v5',
  AUTH_USER: 'antrean_cuci_auth_user_v5',
  CURRENT_VIEW: 'antrean_cuci_current_view_v5',
  ROLE: 'antrean_cuci_role_v5',
  SUPABASE_CONFIG: 'antrean_supabase_creds_v1'
};

export function loadStoredData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Error loading key ${key}`, e);
    return fallback;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error saving key ${key}`, e);
  }
}

export { STORAGE_KEYS };
