-- ==============================================================================
-- SKRIP SETUP DATABASE SUPABASE LENGKAP - SISTEM ANTREAN CUCI KENDARAAN
-- ==============================================================================
-- CARA PENGGUNAAN:
-- 1. Buka dashboard Supabase Anda di https://supabase.com/dashboard
-- 2. Pilih Project Anda -> Klik menu "SQL Editor" di sidebar kiri
-- 3. Klik "+ New query"
-- 4. Salin seluruh isi file ini (Ctrl+A / Cmd+A lalu Ctrl+C / Cmd+C)
-- 5. Tempel (Paste) ke dalam SQL Editor Supabase
-- 6. Klik tombol "RUN" (atau tekan Ctrl+Enter / Cmd+Enter)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABEL ANTREAN (queues)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.queues (
  id TEXT PRIMARY KEY,
  nomor_antrian TEXT NOT NULL,
  nama_pemohon TEXT NOT NULL,
  tipe_motor TEXT NOT NULL DEFAULT 'kecil', -- 'kecil', 'besar', 'mobil'
  layanan_id TEXT NOT NULL,
  total_biaya NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',   -- 'waiting', 'washing', 'waiting_payment', 'done', 'cancelled'
  pit_id TEXT,
  created_at TEXT NOT NULL DEFAULT to_char(now(), 'HH24:MI'),
  washed_at TEXT,
  completed_at TEXT,
  notes TEXT,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TEXT,
  cashier_name TEXT,
  created_timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. TABEL LAYANAN & TARIF (services)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
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

-- ------------------------------------------------------------------------------
-- 3. TABEL PIT BAY / AREA CUCI (pits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pits (
  id TEXT PRIMARY KEY,
  nama_pit TEXT NOT NULL,
  tipe_pit TEXT DEFAULT 'standard',       -- 'hydraulic', 'foam', 'drying', 'detailing', 'standard'
  status TEXT NOT NULL DEFAULT 'tersedia', -- 'tersedia', 'sibuk', 'maintenance'
  keterangan TEXT
);

-- ------------------------------------------------------------------------------
-- 4. TABEL PENGGUNA & STAF (users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL DEFAULT 'admin123',
  role TEXT NOT NULL DEFAULT 'pengguna',  -- 'admin', 'kasir', 'operator', 'pengguna'
  status TEXT NOT NULL DEFAULT 'aktif',    -- 'aktif', 'nonaktif'
  phone TEXT,
  is_email_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ------------------------------------------------------------------------------
-- 5. TABEL PENGATURAN TOKO & STRUK (store_settings)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  nama_usaha TEXT NOT NULL DEFAULT 'ANTREAN',
  tagline TEXT DEFAULT 'Sistem Cuci Kendaraan Modern, Bersih Mengkilap & Cepat',
  alamat TEXT DEFAULT 'Jl. Otomotif Raya No. 88, Jakarta Selatan',
  telepon TEXT DEFAULT '0812-3456-7890',
  footer_struk TEXT DEFAULT 'Simpan struk ini untuk tanda bukti pengambilan kendaraan. Terima Kasih atas Kunjungan Anda!',
  auto_voice BOOLEAN DEFAULT TRUE
);

-- ------------------------------------------------------------------------------
-- 6. DATA AWAL (SEED DATA)
-- ------------------------------------------------------------------------------

-- 6.1 Data Master Layanan
INSERT INTO public.services (id, nama_layanan, deskripsi, harga_kecil, harga_besar, harga_mobil, durasi_menit, badge)
VALUES
('srv-1', 'Cuci Salju Reguler + Semir Ban', 'Busa salju aktif, cuci kolong & sela-sela, bilas air tekanan tinggi, & semir ban wet-look', 15000, 20000, 45000, 20, 'Populer'),
('srv-2', 'Cuci Salju + Wax Pengilap Body', 'Cuci bersih salju tebal, pengeringan blower mikro, pengilap bodi wax proteksi kilau, & semir ban', 25000, 35000, 65000, 30, 'Best Value'),
('srv-3', 'Deep Clean Komplit + Hydro Wax', 'Cuci komplit, pembersih kerak mesin degreaser, pembersih velg & kolong, & hydro-coating bodi', 45000, 60000, 120000, 45, 'Premium'),
('srv-4', 'Quick Wash & Blower Kering', 'Cuci express, bilas cepat, pengeringan blower udara mikro & semir ban', 12000, 17000, 35000, 15, NULL)
ON CONFLICT (id) DO UPDATE SET
  nama_layanan = EXCLUDED.nama_layanan,
  deskripsi = EXCLUDED.deskripsi,
  harga_kecil = EXCLUDED.harga_kecil,
  harga_besar = EXCLUDED.harga_besar,
  harga_mobil = EXCLUDED.harga_mobil,
  durasi_menit = EXCLUDED.durasi_menit,
  badge = EXCLUDED.badge;

-- 6.2 Data Master Pit Bay
INSERT INTO public.pits (id, nama_pit, tipe_pit, status, keterangan)
VALUES
('pit-1', 'Pit Bay 1 (Hydraulic Lift)', 'hydraulic', 'tersedia', 'Lift hidrolik cuci kolong motor & mesin'),
('pit-2', 'Pit Bay 2 (Wash & Snow Foam)', 'foam', 'tersedia', 'Penyemprotan salju tebal & bilas high-pressure'),
('pit-3', 'Pit Bay 3 (Drying & Wax)', 'drying', 'tersedia', 'Area pengeringan blower & poles semir ban')
ON CONFLICT (id) DO UPDATE SET
  nama_pit = EXCLUDED.nama_pit,
  tipe_pit = EXCLUDED.tipe_pit,
  keterangan = EXCLUDED.keterangan;

-- 6.3 Data Pengguna Default (Users)
-- Catatan login default:
--   Admin: admin@antrean.com / admin
--   Kasir: kasir@antrean.com / kasir
--   Operator: operator@antrean.com / operator
INSERT INTO public.users (id, name, email, password, role, status, phone)
VALUES
('usr-admin-1', 'Administrator Utama', 'admin@antrean.com', 'admin', 'admin', 'aktif', '0812-3456-7890'),
('usr-kasir-1', 'Petugas Kasir 1', 'kasir@antrean.com', 'kasir', 'kasir', 'aktif', '0812-9876-5432'),
('usr-operator-1', 'Operator Pit Bay', 'operator@antrean.com', 'operator', 'operator', 'aktif', '0813-1122-3344')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 6.4 Data Pengaturan Toko (Store Settings)
INSERT INTO public.store_settings (id, nama_usaha, tagline, alamat, telepon, footer_struk, auto_voice)
VALUES
('main_settings', 'ANTREAN', 'Sistem Cuci Kendaraan Modern, Bersih Mengkilap & Cepat', 'Jl. Otomotif Raya No. 88, Jakarta Selatan', '0812-3456-7890', 'Simpan struk ini untuk tanda bukti pengambilan kendaraan. Terima Kasih atas Kunjungan Anda!', TRUE)
ON CONFLICT (id) DO UPDATE SET
  nama_usaha = EXCLUDED.nama_usaha,
  tagline = EXCLUDED.tagline,
  alamat = EXCLUDED.alamat,
  telepon = EXCLUDED.telepon,
  footer_struk = EXCLUDED.footer_struk,
  auto_voice = EXCLUDED.auto_voice;

-- ------------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
-- ------------------------------------------------------------------------------
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access queues" ON public.queues;
CREATE POLICY "Public access queues" ON public.queues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access services" ON public.services;
CREATE POLICY "Public access services" ON public.services FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access pits" ON public.pits;
CREATE POLICY "Public access pits" ON public.pits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access users" ON public.users;
CREATE POLICY "Public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access store_settings" ON public.store_settings;
CREATE POLICY "Public access store_settings" ON public.store_settings FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 8. AKTIFKAN REPLIKASI REAL-TIME (SUPABASE REALTIME PUB/SUB)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.queues;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- Selesai! Database siap digunakan oleh aplikasi Antrean.
