import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QueueItem, ServiceItem, PitItem, StoreSettings, AppUser } from '../types.ts';
import { INITIAL_SERVICES, INITIAL_PITS, INITIAL_SETTINGS, INITIAL_USERS } from './storage.ts';

const SUPABASE_STORAGE_KEY = 'antrean_supabase_creds_v1';

export interface StoredSupabaseCreds {
  url: string;
  anonKey: string;
}

export function getSupabaseCredentials(): StoredSupabaseCreds {
  const metaEnv = (import.meta as any).env || {};
  const envUrl = (metaEnv.VITE_SUPABASE_URL as string) || '';
  const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || '';

  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey
      };
    }
  } catch (err) {
    console.warn('Gagal membaca kredensial Supabase dari local storage', err);
  }

  return { url: envUrl, anonKey: envKey };
}

export function saveSupabaseCredentials(creds: StoredSupabaseCreds) {
  try {
    localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(creds));
    cachedClient = null; // reset client cache
  } catch (err) {
    console.error('Gagal menyimpan kredensial Supabase', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.anonKey) {
    return null;
  }

  let sanitizedUrl = creds.url.trim();
  if (!sanitizedUrl.startsWith('http://') && !sanitizedUrl.startsWith('https://')) {
    sanitizedUrl = `https://${sanitizedUrl}`;
  }

  if (cachedClient && lastClientUrl === sanitizedUrl && lastClientKey === creds.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(sanitizedUrl, creds.anonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    lastClientUrl = sanitizedUrl;
    lastClientKey = creds.anonKey;
    return cachedClient;
  } catch (err) {
    console.warn('Gagal inisialisasi Supabase client:', err);
    return null;
  }
}

export interface SupabaseHealthCheck {
  success: boolean;
  message: string;
  tables: {
    queues: boolean;
    services: boolean;
    pits: boolean;
    store_settings: boolean;
    users: boolean;
  };
}

export async function testSupabaseConnection(): Promise<SupabaseHealthCheck> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'URL atau Anon Key Supabase belum diisi. Masukkan kredensial Supabase di Pengaturan.',
      tables: { queues: false, services: false, pits: false, store_settings: false, users: false }
    };
  }

  const tableStatus = {
    queues: false,
    services: false,
    pits: false,
    store_settings: false,
    users: false
  };

  try {
    // 1. Test queues table
    const { error: qErr } = await client.from('queues').select('id').limit(1);
    tableStatus.queues = !qErr;

    // 2. Test services table
    const { error: sErr } = await client.from('services').select('id').limit(1);
    tableStatus.services = !sErr;

    // 3. Test pits table
    const { error: pErr } = await client.from('pits').select('id').limit(1);
    tableStatus.pits = !pErr;

    // 4. Test store_settings table
    const { error: stErr } = await client.from('store_settings').select('id').limit(1);
    tableStatus.store_settings = !stErr;

    // 5. Test users table
    const { error: uErr } = await client.from('users').select('id').limit(1);
    tableStatus.users = !uErr;

    const allTablesExist =
      tableStatus.queues &&
      tableStatus.services &&
      tableStatus.pits &&
      tableStatus.store_settings &&
      tableStatus.users;

    if (!allTablesExist) {
      const missing = [];
      if (!tableStatus.queues) missing.push('queues');
      if (!tableStatus.services) missing.push('services');
      if (!tableStatus.pits) missing.push('pits');
      if (!tableStatus.store_settings) missing.push('store_settings');
      if (!tableStatus.users) missing.push('users');

      return {
        success: false,
        message: `Terhubung ke Supabase, namun tabel (${missing.join(', ')}) belum dibuat. Silakan jalankan script SQL Schema di SQL Editor Supabase.`,
        tables: tableStatus
      };
    }

    return {
      success: true,
      message: 'Koneksi ke database Supabase Realtime aktif & seluruh tabel siap!',
      tables: tableStatus
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung: ${err?.message || 'Periksa koneksi internet / kredensial'}`,
      tables: tableStatus
    };
  }
}

// ----------------- AUTOMATED DATABASE SEEDER -----------------

export async function seedInitialSupabaseData(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client belum terkonfigurasi.' };
  }

  try {
    // 1. Seed store_settings
    const settingsPayload = {
      id: 'main_settings',
      ...INITIAL_SETTINGS
    };
    await client.from('store_settings').upsert(settingsPayload, { onConflict: 'id' });

    // 2. Seed services
    for (const service of INITIAL_SERVICES) {
      await client.from('services').upsert(service, { onConflict: 'id' });
    }

    // 3. Seed pits
    for (const pit of INITIAL_PITS) {
      await client.from('pits').upsert(pit, { onConflict: 'id' });
    }

    // 4. Seed users
    for (const user of INITIAL_USERS) {
      await client.from('users').upsert(user, { onConflict: 'id' });
    }

    return {
      success: true,
      message: 'Berhasil menginisialisasi dan mengisi data awal (Layanan, Pit, Pengguna, & Pengaturan) ke Supabase!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menginisialisasi data: ${err?.message || 'Error saat seeding'}`
    };
  }
}

// ----------------- DATA SYNC APIS (FULL SUPABASE) -----------------

export async function syncQueuesFromSupabase(): Promise<QueueItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('queues')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      // Fallback in case created_at is stored differently
      const { data: fbData, error: fbErr } = await client.from('queues').select('*');
      if (fbErr) throw fbErr;
      return (fbData as QueueItem[]) || [];
    }
    return (data as QueueItem[]) || [];
  } catch (err) {
    console.warn('Sync queues from Supabase error:', err);
    return null;
  }
}

export async function upsertQueueToSupabase(item: QueueItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload: any = {
      id: item.id,
      nomor_antrian: item.nomor_antrian,
      nama_pemohon: item.nama_pemohon,
      email: item.email || null,
      phone: item.phone || null,
      tipe_motor: item.tipe_motor || 'kecil',
      layanan_id: item.layanan_id,
      total_biaya: item.total_biaya || 0,
      status: item.status || 'waiting',
      pit_id: item.pit_id || null,
      notes: item.notes || '',
      is_paid: !!item.is_paid,
      paid_at: item.paid_at || null,
      cashier_name: item.cashier_name || null,
      created_at: item.created_at || new Date().toISOString(),
      washed_at: item.washed_at || null,
      completed_at: item.completed_at || null
    };

    const { error } = await client.from('queues').upsert(payload, { onConflict: 'id' });
    if (error) {
      // If error is about missing columns (e.g. email or phone in older tables), retry without optional columns
      if (error.message?.includes('email') || error.message?.includes('phone')) {
        const fallback = { ...payload };
        delete fallback.email;
        delete fallback.phone;
        const { error: fbErr } = await client.from('queues').upsert(fallback, { onConflict: 'id' });
        if (fbErr) throw fbErr;
        return true;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.warn('Upsert queue to Supabase error:', err);
    return false;
  }
}

export async function deleteQueueFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('queues').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete queue from Supabase error:', err);
    return false;
  }
}

export async function syncServicesFromSupabase(): Promise<ServiceItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('services').select('*');
    if (error) throw error;
    return (data as ServiceItem[]) || [];
  } catch (err) {
    console.warn('Sync services from Supabase error:', err);
    return null;
  }
}

export async function upsertServiceToSupabase(item: ServiceItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('services').upsert(item, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Upsert service to Supabase error:', err);
    return false;
  }
}

export async function deleteServiceFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('services').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete service from Supabase error:', err);
    return false;
  }
}

export async function syncPitsFromSupabase(): Promise<PitItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('pits').select('*');
    if (error) throw error;
    return (data as PitItem[]) || [];
  } catch (err) {
    console.warn('Sync pits from Supabase error:', err);
    return null;
  }
}

export async function upsertPitToSupabase(item: PitItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('pits').upsert(item, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Upsert pit to Supabase error:', err);
    return false;
  }
}

export async function deletePitFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('pits').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete pit from Supabase error:', err);
    return false;
  }
}

export async function syncSettingsFromSupabase(): Promise<StoreSettings | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('store_settings')
      .select('*')
      .eq('id', 'main_settings')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) {
      return {
        nama_usaha: data.nama_usaha,
        tagline: data.tagline,
        alamat: data.alamat,
        telepon: data.telepon,
        footer_struk: data.footer_struk,
        auto_voice: data.auto_voice ?? true,
        resend_api_key: data.resend_api_key || '',
        resend_from_email: data.resend_from_email || 'notif@antrean.online',
        email_notifications_enabled: data.email_notifications_enabled ?? true
      };
    }
    return null;
  } catch (err) {
    console.warn('Sync settings from Supabase error:', err);
    return null;
  }
}

export async function upsertSettingsToSupabase(settings: StoreSettings): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload: any = {
      id: 'main_settings',
      nama_usaha: settings.nama_usaha,
      tagline: settings.tagline,
      alamat: settings.alamat,
      telepon: settings.telepon,
      footer_struk: settings.footer_struk,
      auto_voice: settings.auto_voice,
      resend_api_key: settings.resend_api_key || '',
      resend_from_email: settings.resend_from_email || 'notif@antrean.online',
      email_notifications_enabled: settings.email_notifications_enabled ?? true
    };
    const { error } = await client.from('store_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Fallback for older schemas without resend columns
      if (error.message?.includes('resend') || error.message?.includes('email')) {
        const fallback = {
          id: 'main_settings',
          nama_usaha: settings.nama_usaha,
          tagline: settings.tagline,
          alamat: settings.alamat,
          telepon: settings.telepon,
          footer_struk: settings.footer_struk,
          auto_voice: settings.auto_voice
        };
        const { error: fbErr } = await client.from('store_settings').upsert(fallback, { onConflict: 'id' });
        if (fbErr) throw fbErr;
        return true;
      }
      throw error;
    }
    return true;
  } catch (err) {
    console.warn('Upsert settings to Supabase error:', err);
    return false;
  }
}

// ----------------- USER MANAGEMENT SUPABASE APIS -----------------

export async function syncUsersFromSupabase(): Promise<AppUser[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      // Fallback query without order in case created_at format or column differences
      const { data: fbData, error: fbErr } = await client.from('users').select('*');
      if (fbErr) throw fbErr;
      return (fbData as AppUser[]) || [];
    }
    return (data as AppUser[]) || [];
  } catch (err) {
    console.warn('Sync users from Supabase error:', err);
    return null;
  }
}

export async function upsertUserToSupabase(user: AppUser): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const payload: any = {
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase().trim(),
      password: user.password || 'admin123',
      role: user.role || 'pengguna',
      status: user.status || 'aktif',
      phone: user.phone || null,
      is_email_verified: user.is_email_verified ?? true,
      created_at: user.created_at || new Date().toISOString()
    };
    if (user.last_login) {
      payload.last_login = user.last_login;
    }
    const { error } = await client.from('users').upsert(payload, { onConflict: 'id' });
    if (error) {
      // Retry with onConflict email if id conflict failed
      const { error: err2 } = await client.from('users').upsert(payload, { onConflict: 'email' });
      if (err2) throw err2;
    }
    return true;
  } catch (err) {
    console.warn('Upsert user to Supabase error:', err);
    return false;
  }
}

export async function deleteUserFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Delete user from Supabase error:', err);
    return false;
  }
}

export async function authenticateWithSupabaseUsers(
  emailOrUsername: string,
  passwordInput: string
): Promise<AppUser | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const clean = emailOrUsername.trim().toLowerCase();
    const { data, error } = await client
      .from('users')
      .select('*')
      .or(`email.ilike.${clean},name.ilike.${clean}`)
      .limit(1);

    if (error || !data || data.length === 0) return null;

    const matchedUser = data[0] as AppUser;
    if (matchedUser.status === 'nonaktif') {
      throw new Error('Akun ini telah dinonaktifkan oleh Administrator.');
    }

    if (matchedUser.password && matchedUser.password !== passwordInput) {
      throw new Error('Kata sandi salah.');
    }

    // Update last login
    await client
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', matchedUser.id);

    return matchedUser;
  } catch (err: any) {
    if (err.message && err.message.includes('dinonaktifkan')) throw err;
    if (err.message && err.message.includes('Kata sandi salah')) throw err;
    return null;
  }
}

// ----------------- SUPABASE NATIVE AUTH & EMAIL CONFIRMATION -----------------

export interface SupabaseSignUpResult {
  success: boolean;
  needsEmailConfirmation: boolean;
  user?: any;
  session?: any;
  message: string;
}

export async function signUpWithSupabaseAuth(
  email: string,
  password: string,
  metadata: { name: string; phone?: string }
): Promise<SupabaseSignUpResult> {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  if (!client) {
    return {
      success: true,
      needsEmailConfirmation: true,
      message: 'Supabase client belum terhubung. Menggunakan mode simulasi konfirmasi email.'
    };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: password.trim(),
      options: {
        data: {
          name: metadata.name.trim(),
          phone: metadata.phone?.trim() || ''
        },
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      throw error;
    }

    // Check if Supabase auto-confirmed or requires link confirmation
    const isConfirmed = !!(data.user?.email_confirmed_at || data.user?.confirmed_at || data.session);

    // Also pre-insert into users table with status if needed
    if (data.user) {
      const newUserRecord: AppUser = {
        id: data.user.id,
        name: metadata.name.trim(),
        email: cleanEmail,
        password: password.trim(),
        role: 'pengguna',
        status: 'aktif',
        phone: metadata.phone?.trim(),
        is_email_verified: isConfirmed,
        created_at: new Date().toISOString()
      };
      await upsertUserToSupabase(newUserRecord);
    }

    return {
      success: true,
      needsEmailConfirmation: !isConfirmed,
      user: data.user,
      session: data.session,
      message: !isConfirmed
        ? `Tautan konfirmasi pendaftaran telah dikirimkan ke email ${cleanEmail}. Buka email Anda dan klik tautan konfirmasi untuk mengaktifkan akun.`
        : 'Akun berhasil didaftarkan dan langsung aktif.'
    };
  } catch (err: any) {
    console.error('Supabase SignUp Error:', err);
    throw new Error(err?.message || 'Gagal mendaftar melalui Supabase Auth.');
  }
}

export async function resendSupabaseConfirmationLink(email: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  const cleanEmail = email.trim().toLowerCase();

  if (!client) {
    return {
      success: true,
      message: `Tautan konfirmasi baru telah dikirimkan ke ${cleanEmail}.`
    };
  }

  try {
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await client.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) throw error;

    return {
      success: true,
      message: `Tautan konfirmasi pendaftaran baru berhasil dikirim ke ${cleanEmail}. Periksa folder Inbox / Spam Anda.`
    };
  } catch (err: any) {
    console.error('Resend Confirmation Error:', err);
    throw new Error(err?.message || 'Gagal mengirim ulang email konfirmasi.');
  }
}

// ----------------- COMPLETE SQL SCHEMA SCRIPT -----------------
export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- SKRIP SETUP DATABASE SUPABASE LENGKAP: SISTEM ANTREAN CUCI
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New query -> RUN
-- ==========================================================

-- 1. Buat Tabel Antrean (Queues)
CREATE TABLE IF NOT EXISTS queues (
  id TEXT PRIMARY KEY,
  nomor_antrian TEXT NOT NULL,
  nama_pemohon TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tipe_motor TEXT NOT NULL DEFAULT 'kecil',
  layanan_id TEXT NOT NULL,
  total_biaya NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  pit_id TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS'),
  washed_at TEXT,
  completed_at TEXT,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TEXT,
  cashier_name TEXT,
  created_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Migration safety for queues
ALTER TABLE queues ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS paid_at TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS washed_at TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS completed_at TEXT;
ALTER TABLE queues ADD COLUMN IF NOT EXISTS created_timestamp TIMESTAMPTZ DEFAULT NOW();

-- 2. Buat Tabel Layanan & Tarif (Services)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  nama_layanan TEXT NOT NULL,
  deskripsi TEXT,
  harga_kecil NUMERIC NOT NULL DEFAULT 0,
  harga_besar NUMERIC NOT NULL DEFAULT 0,
  harga_mobil NUMERIC NOT NULL DEFAULT 0,
  harga NUMERIC DEFAULT 0,
  durasi_menit INT NOT NULL DEFAULT 20,
  icon TEXT,
  badge TEXT
);

-- Migration safety for services
ALTER TABLE services ADD COLUMN IF NOT EXISTS harga_mobil NUMERIC DEFAULT 0;

-- 3. Buat Tabel Pit Cuci (Pits)
CREATE TABLE IF NOT EXISTS pits (
  id TEXT PRIMARY KEY,
  nama_pit TEXT NOT NULL,
  tipe_pit TEXT DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'tersedia',
  keterangan TEXT
);

-- 4. Buat Tabel Manajemen Pengguna (Users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin123',
  role TEXT NOT NULL DEFAULT 'pengguna',
  status TEXT NOT NULL DEFAULT 'aktif',
  phone TEXT,
  is_email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- Migration safety for users
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT TRUE;

-- 5. Buat Tabel Pengaturan Toko & Struk (Store Settings)
CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  nama_usaha TEXT NOT NULL DEFAULT 'ANTREAN',
  tagline TEXT DEFAULT 'Sistem Cuci Kendaraan Modern, Bersih Mengkilap & Cepat',
  alamat TEXT DEFAULT 'Jl. Otomotif Raya No. 88, Jakarta Selatan',
  telepon TEXT DEFAULT '0812-3456-7890',
  footer_struk TEXT DEFAULT 'Simpan struk ini untuk tanda bukti pengambilan kendaraan. Terima Kasih atas Kunjungan Anda!',
  auto_voice BOOLEAN DEFAULT TRUE,
  resend_api_key TEXT,
  resend_from_email TEXT DEFAULT 'notif@antrean.online',
  email_notifications_enabled BOOLEAN DEFAULT TRUE
);

-- Migration safety for store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS resend_from_email TEXT DEFAULT 'notif@antrean.online';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;

-- ==========================================================
-- 6. Data Awal (Seed Data)
-- ==========================================================

-- Data Layanan
INSERT INTO services (id, nama_layanan, deskripsi, harga_kecil, harga_besar, harga_mobil, durasi_menit, badge)
VALUES
('srv-1', 'Cuci Salju Reguler + Semir Ban', 'Busa salju aktif, cuci kolong & sela-sela, bilas air tekanan tinggi, & semir ban wet-look', 15000, 20000, 45000, 20, 'Populer'),
('srv-2', 'Cuci Salju + Wax Pengilap Body', 'Cuci bersih salju tebal, pengeringan blower mikro, pengilap bodi wax proteksi kilau, & semir ban', 25000, 35000, 65000, 30, 'Best Value'),
('srv-3', 'Deep Clean Komplit + Hydro Wax', 'Cuci komplit, pembersih kerak mesin degreaser, pembersih velg & kolong, & hydro-coating bodi', 45000, 60000, 120000, 45, 'Premium'),
('srv-4', 'Quick Wash & Blower Kering', 'Cuci express, bilas cepat, pengeringan blower udara mikro & semir ban', 12000, 17000, 35000, 15, NULL)
ON CONFLICT (id) DO NOTHING;

-- Data Pit Bay
INSERT INTO pits (id, nama_pit, tipe_pit, status, keterangan)
VALUES
('pit-1', 'Pit Bay 1 (Hydraulic Lift)', 'hydraulic', 'tersedia', 'Lift hidrolik cuci kolong motor & mesin'),
('pit-2', 'Pit Bay 2 (Wash & Snow Foam)', 'foam', 'tersedia', 'Penyemprotan salju tebal & bilas high-pressure'),
('pit-3', 'Pit Bay 3 (Drying & Wax)', 'drying', 'tersedia', 'Area pengeringan blower & poles semir ban')
ON CONFLICT (id) DO NOTHING;

-- Data Pengguna Awal (Users)
INSERT INTO users (id, name, email, password, role, status, phone)
VALUES
('usr-admin-1', 'Administrator Utama', 'admin@antrean.com', 'admin', 'admin', 'aktif', '0812-3456-7890'),
('usr-kasir-1', 'Petugas Kasir 1', 'kasir@antrean.com', 'kasir', 'kasir', 'aktif', '0812-9876-5432'),
('usr-operator-1', 'Operator Pit Bay', 'operator@antrean.com', 'operator', 'operator', 'aktif', '0813-1122-3344')
ON CONFLICT (id) DO NOTHING;

-- Data Pengaturan Toko
INSERT INTO store_settings (id, nama_usaha, tagline, alamat, telepon, footer_struk, auto_voice)
VALUES
('main_settings', 'ANTREAN', 'Sistem Cuci Kendaraan Modern, Bersih Mengkilap & Cepat', 'Jl. Otomotif Raya No. 88, Jakarta Selatan', '0812-3456-7890', 'Simpan struk ini untuk tanda bukti pengambilan kendaraan. Terima Kasih atas Kunjungan Anda!', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ==========================================================
-- 7. Row Level Security (RLS) & Kebijakan Akses
-- ==========================================================
ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE pits ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access queues" ON queues;
CREATE POLICY "Public access queues" ON queues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access services" ON services;
CREATE POLICY "Public access services" ON services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access pits" ON pits;
CREATE POLICY "Public access pits" ON pits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access users" ON users;
CREATE POLICY "Public access users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access store_settings" ON store_settings;
CREATE POLICY "Public access store_settings" ON store_settings FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================
-- 8. Supabase Realtime Replication (Pub/Sub)
-- ==========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE queues;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE pits;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE store_settings;

-- ==========================================================
-- 9. Sinkronisasi Otomatis Supabase Auth (auth.users) -> Tabel Users (public.users)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, password, role, status, phone, is_email_verified, created_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'admin123',
    'pengguna',
    'aktif',
    new.raw_user_meta_data->>'phone',
    (new.email_confirmed_at IS NOT NULL),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    phone = COALESCE(EXCLUDED.phone, public.users.phone),
    is_email_verified = (new.email_confirmed_at IS NOT NULL);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_auth_user();

-- Salin seluruh user terdaftar dari auth.users yang belum masuk ke public.users
INSERT INTO public.users (id, name, email, password, role, status, phone, is_email_verified, created_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  email,
  'admin123',
  'pengguna',
  'aktif',
  raw_user_meta_data->>'phone',
  (email_confirmed_at IS NOT NULL),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
`;

