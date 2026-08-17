import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  DollarSign,
  Clock,
  Bike,
  Car,
  Calendar,
  Filter,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Download,
  CalendarDays,
  CalendarRange,
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, StoreSettings } from '../types.ts';
import { exportQueuesToExcel, formatDateTimeIndo } from '../utils/excelExport.ts';

interface AdminReportsViewProps {
  queues: QueueItem[];
  services: ServiceItem[];
  pits: PitItem[];
  storeSettings?: StoreSettings;
}

type PeriodFilterMode = 'daily' | 'monthly' | 'yearly' | 'custom' | 'all';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function parseItemDate(dateStr?: string): Date {
  if (!dateStr) return new Date();
  if (/^\d{2}:\d{2}$/.test(dateStr)) {
    const today = new Date();
    const [h, m] = dateStr.split(':').map(Number);
    today.setHours(h, m, 0, 0);
    return today;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({
  queues,
  services,
  pits,
  storeSettings
}) => {
  // Precompute reference dates
  const today = useMemo(() => new Date(), []);
  const todayYMD = useMemo(() => formatDateToYMD(today), [today]);

  const yesterdayYMD = useMemo(() => {
    const yest = new Date(today);
    yest.setDate(yest.getDate() - 1);
    return formatDateToYMD(yest);
  }, [today]);

  const last7DaysYMD = useMemo(() => {
    const d7 = new Date(today);
    d7.setDate(d7.getDate() - 6);
    return formatDateToYMD(d7);
  }, [today]);

  const last30DaysYMD = useMemo(() => {
    const d30 = new Date(today);
    d30.setDate(d30.getDate() - 29);
    return formatDateToYMD(d30);
  }, [today]);

  const firstDayOfThisMonthYMD = useMemo(() => {
    const dMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatDateToYMD(dMonth);
  }, [today]);

  // Filter States
  const [periodMode, setPeriodMode] = useState<PeriodFilterMode>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [startDate, setStartDate] = useState<string>(todayYMD);
  const [endDate, setEndDate] = useState<string>(todayYMD);

  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract available years from queues + current year
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(today.getFullYear());
    yearsSet.add(today.getFullYear() - 1);
    queues.forEach((q) => {
      const d = parseItemDate(q.paid_at || q.completed_at || q.created_at);
      yearsSet.add(d.getFullYear());
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [queues, today]);

  const getItemAmount = (q: QueueItem) => {
    if (q.total_biaya) return q.total_biaya;
    const srv = services.find((s) => s.id === q.layanan_id);
    if (!srv) return 0;
    if (q.tipe_motor === 'mobil') {
      return srv.harga_mobil || srv.harga_besar || srv.harga || 0;
    }
    return q.tipe_motor === 'besar'
      ? srv.harga_besar || srv.harga || 0
      : srv.harga_kecil || srv.harga || 0;
  };

  // Filtered Queues Logic
  const filteredQueues = useMemo(() => {
    return queues.filter((item) => {
      const itemDate = parseItemDate(item.paid_at || item.completed_at || item.created_at);
      const itemYMD = formatDateToYMD(itemDate);

      // 1. Period Mode Filter
      if (periodMode === 'daily') {
        if (itemYMD !== selectedDate) return false;
      } else if (periodMode === 'monthly') {
        if (
          itemDate.getMonth() !== selectedMonth ||
          itemDate.getFullYear() !== selectedYear
        ) {
          return false;
        }
      } else if (periodMode === 'yearly') {
        if (itemDate.getFullYear() !== selectedYear) return false;
      } else if (periodMode === 'custom') {
        if (itemYMD < startDate || itemYMD > endDate) return false;
      }

      // 2. Payment Status Filter
      if (paymentStatusFilter === 'paid' && !item.is_paid) return false;
      if (paymentStatusFilter === 'unpaid' && item.is_paid) return false;

      // 3. Vehicle Type Filter
      if (vehicleTypeFilter !== 'all' && item.tipe_motor !== vehicleTypeFilter) {
        return false;
      }

      // 4. Service Filter
      if (serviceFilter !== 'all' && item.layanan_id !== serviceFilter) {
        return false;
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.nama_pemohon.toLowerCase().includes(query);
        const matchesQueue = item.nomor_antrian.toLowerCase().includes(query);
        if (!matchesName && !matchesQueue) return false;
      }

      return true;
    });
  }, [
    queues,
    periodMode,
    selectedDate,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
    paymentStatusFilter,
    vehicleTypeFilter,
    serviceFilter,
    searchQuery
  ]);

  // Statistics from filtered data
  const paidQueues = useMemo(
    () => filteredQueues.filter((q) => q.is_paid),
    [filteredQueues]
  );
  const unpaidQueues = useMemo(
    () => filteredQueues.filter((q) => !q.is_paid && q.status !== 'cancelled'),
    [filteredQueues]
  );

  const totalOmsetPaid = useMemo(
    () => paidQueues.reduce((acc, q) => acc + getItemAmount(q), 0),
    [paidQueues, services]
  );
  const totalPendingPayment = useMemo(
    () => unpaidQueues.reduce((acc, q) => acc + getItemAmount(q), 0),
    [unpaidQueues, services]
  );

  const kecilQueues = useMemo(
    () => paidQueues.filter((q) => q.tipe_motor === 'kecil'),
    [paidQueues]
  );
  const besarQueues = useMemo(
    () => paidQueues.filter((q) => q.tipe_motor === 'besar'),
    [paidQueues]
  );
  const mobilQueues = useMemo(
    () => paidQueues.filter((q) => q.tipe_motor === 'mobil'),
    [paidQueues]
  );

  const kecilTotalOmset = useMemo(
    () => kecilQueues.reduce((acc, q) => acc + getItemAmount(q), 0),
    [kecilQueues, services]
  );
  const besarTotalOmset = useMemo(
    () => besarQueues.reduce((acc, q) => acc + getItemAmount(q), 0),
    [besarQueues, services]
  );
  const mobilTotalOmset = useMemo(
    () => mobilQueues.reduce((acc, q) => acc + getItemAmount(q), 0),
    [mobilQueues, services]
  );

  // Period Text for Display & Excel
  const periodLabel = useMemo(() => {
    if (periodMode === 'daily') {
      const d = parseItemDate(selectedDate);
      return `Harian: ${d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`;
    }
    if (periodMode === 'monthly') {
      return `Bulanan: ${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
    }
    if (periodMode === 'yearly') {
      return `Tahunan: Tahun ${selectedYear}`;
    }
    if (periodMode === 'custom') {
      const s = parseItemDate(startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const e = parseItemDate(endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      return `Rentang Tanggal: ${s} s/d ${e}`;
    }
    return 'Semua Waktu (All History)';
  }, [periodMode, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (paymentStatusFilter === 'paid') parts.push('Status: Lunas');
    if (paymentStatusFilter === 'unpaid') parts.push('Status: Belum Bayar');
    if (vehicleTypeFilter === 'kecil') parts.push('Kendaraan: Motor Kecil');
    if (vehicleTypeFilter === 'besar') parts.push('Kendaraan: Motor Besar');
    if (vehicleTypeFilter === 'mobil') parts.push('Kendaraan: Mobil');
    if (serviceFilter !== 'all') {
      const srv = services.find((s) => s.id === serviceFilter);
      if (srv) parts.push(`Layanan: ${srv.nama_layanan}`);
    }
    if (searchQuery.trim()) parts.push(`Pencarian: "${searchQuery.trim()}"`);
    return parts.length > 0 ? parts.join(' | ') : 'Semua Status & Kategori';
  }, [paymentStatusFilter, vehicleTypeFilter, serviceFilter, services, searchQuery]);

  // Handle Export to Excel
  const handleExportExcel = () => {
    let filename = 'Laporan_Cuci_Kendaraan';
    if (periodMode === 'daily') {
      filename = `Laporan_Cuci_Harian_${selectedDate}`;
    } else if (periodMode === 'monthly') {
      filename = `Laporan_Cuci_Bulanan_${MONTH_NAMES[selectedMonth]}_${selectedYear}`;
    } else if (periodMode === 'yearly') {
      filename = `Laporan_Cuci_Tahunan_${selectedYear}`;
    } else if (periodMode === 'custom') {
      filename = `Laporan_Cuci_Periode_${startDate}_sd_${endDate}`;
    } else {
      filename = `Laporan_Cuci_Semua_Data_${todayYMD}`;
    }

    exportQueuesToExcel(
      filteredQueues,
      services,
      pits,
      {
        storeSettings,
        periodLabel,
        filterDescription,
        totalOmsetPaid,
        totalPendingPayment,
        kecilTotalOmset,
        besarTotalOmset,
        mobilTotalOmset,
        paidCount: paidQueues.length,
        pendingCount: unpaidQueues.length
      },
      `${filename}.xls`
    );
  };

  const handleResetFilter = () => {
    setPeriodMode('daily');
    setSelectedDate(todayYMD);
    setSelectedMonth(today.getMonth());
    setSelectedYear(today.getFullYear());
    setStartDate(todayYMD);
    setEndDate(todayYMD);
    setPaymentStatusFilter('all');
    setVehicleTypeFilter('all');
    setServiceFilter('all');
    setSearchQuery('');
  };

  // Helper boolean flags for quick buttons active states
  const isDailyToday = selectedDate === todayYMD;
  const isDailyYesterday = selectedDate === yesterdayYMD;

  const isMonthlyThisMonth =
    selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
  const lastMonthDate = useMemo(() => {
    const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { month: lm.getMonth(), year: lm.getFullYear() };
  }, [today]);
  const isMonthlyLastMonth =
    selectedMonth === lastMonthDate.month && selectedYear === lastMonthDate.year;

  const isYearlyThisYear = selectedYear === today.getFullYear();
  const isYearlyLastYear = selectedYear === today.getFullYear() - 1;

  const isCustomToday = startDate === todayYMD && endDate === todayYMD;
  const isCustom7Days = startDate === last7DaysYMD && endDate === todayYMD;
  const isCustom30Days = startDate === last30DaysYMD && endDate === todayYMD;
  const isCustomThisMonth = startDate === firstDayOfThisMonthYMD && endDate === todayYMD;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 sm:p-6 rounded-3xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2 text-xs font-mono uppercase text-emerald-700 dark:text-emerald-400 font-bold">
            <FileSpreadsheet className="w-4 h-4" />
            <span>LAPORAN &amp; REKAP TRANSAKSI EXCEL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Rekap Keuangan &amp; Transaksi Kasir
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Filter transaksi berdasarkan harian, bulanan, tahunan, atau rentang tanggal kustom, lalu unduh laporan ke format <b>Microsoft Excel (.xlsx/.xls)</b> yang rapi dan terstruktur.
          </p>
        </div>

        {/* Action Button: Export to Excel */}
        <div className="flex items-center space-x-3 w-full sm:w-auto shrink-0">
          <button
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-5 py-3 rounded-2xl text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2.5 cursor-pointer transform active:scale-95"
            title="Download Laporan Terfilter ke Format Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export ke Excel (.xlsx / .xls)</span>
          </button>
        </div>
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1E2337] pb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Filter Periode &amp; Kategori Laporan
            </h3>
          </div>

          <button
            type="button"
            onClick={handleResetFilter}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto bg-slate-100 dark:bg-[#161A28] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#23293D]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filter</span>
          </button>
        </div>

        {/* 1. Period Selector Tabs */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            1. Mode Periode Waktu:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              type="button"
              id="filter-mode-daily"
              onClick={() => setPeriodMode('daily')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border cursor-pointer ${
                periodMode === 'daily'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Harian</span>
            </button>

            <button
              type="button"
              id="filter-mode-monthly"
              onClick={() => setPeriodMode('monthly')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border cursor-pointer ${
                periodMode === 'monthly'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Bulanan</span>
            </button>

            <button
              type="button"
              id="filter-mode-yearly"
              onClick={() => setPeriodMode('yearly')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border cursor-pointer ${
                periodMode === 'yearly'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Tahunan</span>
            </button>

            <button
              type="button"
              id="filter-mode-custom"
              onClick={() => setPeriodMode('custom')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border cursor-pointer ${
                periodMode === 'custom'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Rentang Tanggal</span>
            </button>

            <button
              type="button"
              id="filter-mode-all"
              onClick={() => setPeriodMode('all')}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 border cursor-pointer col-span-2 sm:col-span-1 ${
                periodMode === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Semua Waktu</span>
            </button>
          </div>
        </div>

        {/* 2. Specific Dynamic Date Inputs Based on Mode */}
        <div className="p-4 bg-slate-50 dark:bg-[#161A28] border border-slate-200 dark:border-[#23293D] rounded-2xl">
          {/* DAILY */}
          {periodMode === 'daily' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Tanggal Laporan:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 sm:mt-5">
                <button
                  type="button"
                  id="btn-quick-today"
                  onClick={() => setSelectedDate(todayYMD)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isDailyToday
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDailyToday ? 'inline' : 'hidden'}`} />
                  <span>Hari Ini</span>
                </button>
                <button
                  type="button"
                  id="btn-quick-yesterday"
                  onClick={() => setSelectedDate(yesterdayYMD)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isDailyYesterday
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isDailyYesterday ? 'inline' : 'hidden'}`} />
                  <span>Kemarin</span>
                </button>
              </div>
            </div>
          )}

          {/* MONTHLY */}
          {periodMode === 'monthly' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Bulan:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={mName} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Tahun:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 mt-5">
                <button
                  type="button"
                  id="btn-quick-this-month"
                  onClick={() => {
                    setSelectedMonth(today.getMonth());
                    setSelectedYear(today.getFullYear());
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isMonthlyThisMonth
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isMonthlyThisMonth ? 'inline' : 'hidden'}`} />
                  <span>Bulan Ini ({MONTH_NAMES[today.getMonth()]})</span>
                </button>
                <button
                  type="button"
                  id="btn-quick-last-month"
                  onClick={() => {
                    setSelectedMonth(lastMonthDate.month);
                    setSelectedYear(lastMonthDate.year);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isMonthlyLastMonth
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isMonthlyLastMonth ? 'inline' : 'hidden'}`} />
                  <span>Bulan Lalu ({MONTH_NAMES[lastMonthDate.month]})</span>
                </button>
              </div>
            </div>
          )}

          {/* YEARLY */}
          {periodMode === 'yearly' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Pilih Tahun Laporan:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl px-4 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      Tahun {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 mt-5">
                <button
                  type="button"
                  id="btn-quick-this-year"
                  onClick={() => setSelectedYear(today.getFullYear())}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isYearlyThisYear
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isYearlyThisYear ? 'inline' : 'hidden'}`} />
                  <span>Tahun Ini ({today.getFullYear()})</span>
                </button>
                <button
                  type="button"
                  id="btn-quick-last-year"
                  onClick={() => setSelectedYear(today.getFullYear() - 1)}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isYearlyLastYear
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isYearlyLastYear ? 'inline' : 'hidden'}`} />
                  <span>Tahun Lalu ({today.getFullYear() - 1})</span>
                </button>
              </div>
            </div>
          )}

          {/* CUSTOM RANGE */}
          {periodMode === 'custom' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Dari Tanggal:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sampai Tanggal:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white dark:bg-[#0F121C] border border-slate-300 dark:border-[#23293D] rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-5">
                <button
                  type="button"
                  id="btn-custom-today"
                  onClick={() => {
                    setStartDate(todayYMD);
                    setEndDate(todayYMD);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isCustomToday
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCustomToday ? 'inline' : 'hidden'}`} />
                  <span>Hari Ini</span>
                </button>
                <button
                  type="button"
                  id="btn-custom-7days"
                  onClick={() => {
                    setStartDate(last7DaysYMD);
                    setEndDate(todayYMD);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isCustom7Days
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCustom7Days ? 'inline' : 'hidden'}`} />
                  <span>7 Hari Terakhir</span>
                </button>
                <button
                  type="button"
                  id="btn-custom-30days"
                  onClick={() => {
                    setStartDate(last30DaysYMD);
                    setEndDate(todayYMD);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isCustom30Days
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCustom30Days ? 'inline' : 'hidden'}`} />
                  <span>30 Hari Terakhir</span>
                </button>
                <button
                  type="button"
                  id="btn-custom-thismonth"
                  onClick={() => {
                    setStartDate(firstDayOfThisMonthYMD);
                    setEndDate(todayYMD);
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition cursor-pointer flex items-center space-x-1.5 ${
                    isCustomThisMonth
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                      : 'bg-white dark:bg-[#0F121C] hover:bg-slate-100 dark:hover:bg-[#1E2337] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-[#23293D]'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isCustomThisMonth ? 'inline' : 'hidden'}`} />
                  <span>Bulan Ini (s/d Hari Ini)</span>
                </button>
              </div>
            </div>
          )}

          {/* ALL TIME */}
          {periodMode === 'all' && (
            <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Menampilkan seluruh riwayat transaksi antrean cuci kendaraan tanpa pembatasan waktu.</span>
            </div>
          )}
        </div>

        {/* 3. Secondary Filters: Status, Vehicle Type, Service, Search */}
        <div className="space-y-4 pt-2">
          {/* Quick Filter Chips for Payment Status & Vehicle Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Pembayaran */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Status Pembayaran:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    paymentStatusFilter === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <span>Semua Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('paid')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    paymentStatusFilter === 'paid'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hanya Lunas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentStatusFilter('unpaid')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    paymentStatusFilter === 'unpaid'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Belum Bayar (Pending)</span>
                </button>
              </div>
            </div>

            {/* Jenis Kendaraan */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Jenis Kendaraan:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleTypeFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    vehicleTypeFilter === 'all'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <span>Semua Kendaraan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleTypeFilter('kecil')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    vehicleTypeFilter === 'kecil'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motor Kecil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleTypeFilter('besar')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    vehicleTypeFilter === 'besar'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Motor Besar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVehicleTypeFilter('mobil')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
                    vehicleTypeFilter === 'mobil'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#23293D] hover:bg-slate-100 dark:hover:bg-[#1E2337]'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Mobil</span>
                </button>
              </div>
            </div>
          </div>

          {/* Service and Search Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Layanan Cuci */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                4. Paket Layanan Cuci:
              </label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] text-xs font-bold rounded-xl px-3 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Semua Paket Layanan ({services.length} Paket)</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama_layanan}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Query */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                5. Cari Nama Pelanggan / Nomor Antrean:
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik nama pelanggan atau nomor antrean..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#161A28] border border-slate-300 dark:border-[#23293D] rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards Based on Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Omset Lunas */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-3xl text-white shadow-lg space-y-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-100 text-xs font-bold font-mono">
            <span>TOTAL OMSET LUNAS</span>
            <DollarSign className="w-5 h-5 text-lime-300" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            Rp {totalOmsetPaid.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-emerald-100 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{paidQueues.length} transaksi selesai di kasir</span>
          </span>
        </div>

        {/* Omset Motor Kecil */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
            <span>MOTOR KECIL</span>
            <Bike className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {kecilTotalOmset.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {kecilQueues.length} unit motor kecil lunas
          </span>
        </div>

        {/* Omset Motor Besar */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 text-xs font-bold font-mono">
            <span>MOTOR BESAR</span>
            <Bike className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {besarTotalOmset.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {besarQueues.length} unit motor besar lunas
          </span>
        </div>

        {/* Omset Mobil */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-blue-700 dark:text-blue-400 text-xs font-bold font-mono">
            <span>MOBIL</span>
            <Car className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {mobilTotalOmset.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
            {mobilQueues.length} unit mobil lunas
          </span>
        </div>

        {/* Belum Bayar */}
        <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] p-5 rounded-3xl space-y-2 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-orange-600 dark:text-orange-400 text-xs font-bold font-mono">
            <span>BELUM BAYAR (PENDING)</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
            Rp {totalPendingPayment.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center space-x-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{unpaidQueues.length} kendaraan dalam antrean/cuci</span>
          </span>
        </div>
      </div>

      {/* Transactions History Table */}
      <div className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#23293D] pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Data Transaksi Terfilter</span>
              <span className="text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">
                {filteredQueues.length} Transaksi
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {periodLabel} &bull; {filterDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="self-start sm:self-auto py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center space-x-2 cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Excel Tabel Ini</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#23293D] text-slate-600 dark:text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 px-3">No</th>
                <th className="pb-3 px-3">ID Transaksi</th>
                <th className="pb-3 px-3">No. Antrean</th>
                <th className="pb-3 px-3">Nama Pelanggan</th>
                <th className="pb-3 px-3">Kendaraan</th>
                <th className="pb-3 px-3">Paket Layanan</th>
                <th className="pb-3 px-3">Pit Bay</th>
                <th className="pb-3 px-3">Waktu Masuk</th>
                <th className="pb-3 px-3">Waktu Selesai</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#23293D]/60 text-slate-800 dark:text-slate-200">
              {filteredQueues.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-500">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-bold text-xs">Tidak ada data transaksi pada periode filter yang dipilih.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan tanggal atau ubah pilihan filter di atas.</p>
                  </td>
                </tr>
              ) : (
                filteredQueues.map((item, idx) => {
                  const srv = services.find((s) => s.id === item.layanan_id);
                  const pit = pits.find((p) => p.id === item.pit_id);
                  const price = getItemAmount(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#161A28]/60 transition">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                        TRX-{item.id.replace('q-', '').slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                        {item.nomor_antrian}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {item.nama_pemohon}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.tipe_motor === 'mobil'
                              ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-300'
                              : item.tipe_motor === 'besar'
                              ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300'
                          }`}
                        >
                          {item.tipe_motor === 'mobil' ? (
                            <Car className="w-3 h-3 inline" />
                          ) : (
                            <Bike className="w-3 h-3 inline" />
                          )}
                          <span>
                            {item.tipe_motor === 'mobil'
                              ? 'Mobil'
                              : item.tipe_motor === 'besar'
                              ? 'Motor Besar'
                              : 'Motor Kecil'}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                        {srv ? srv.nama_layanan : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {pit ? pit.nama_pit : '-'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {formatDateTimeIndo(item.created_at)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {formatDateTimeIndo(item.paid_at || item.completed_at)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.is_paid
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : item.status === 'cancelled'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.is_paid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>LUNAS</span>
                            </>
                          ) : item.status === 'cancelled' ? (
                            <>
                              <X className="w-3 h-3 text-rose-600" />
                              <span>BATAL</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>PENDING</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                        Rp {price.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredQueues.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 dark:border-[#23293D] font-bold bg-slate-50 dark:bg-[#161A28]/80 text-xs">
                  <td colSpan={10} className="py-3 px-3 text-right font-mono uppercase text-slate-700 dark:text-slate-300">
                    Total Keseluruhan Terfilter:
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                    Rp{' '}
                    {filteredQueues
                      .reduce((acc, q) => acc + getItemAmount(q), 0)
                      .toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
