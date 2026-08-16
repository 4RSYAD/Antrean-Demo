import React from 'react';
import { Printer, X, Droplets, CheckCircle2, Bike, Car } from 'lucide-react';
import { QueueItem, ServiceItem, PitItem, StoreSettings } from '../types.ts';

interface ReceiptModalProps {
  data: QueueItem | null;
  services: ServiceItem[];
  pits: PitItem[];
  settings?: StoreSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  data,
  services,
  pits,
  settings,
  onClose
}) => {
  if (!data) return null;

  const service = services.find((s) => s.id === data.layanan_id);
  const pit = pits.find((p) => p.id === data.pit_id);
  
  // Calculate total price accurately
  const totalAmount = data.total_biaya || (service
    ? data.tipe_motor === 'mobil'
      ? service.harga_mobil || service.harga_besar || service.harga || 0
      : data.tipe_motor === 'besar'
      ? service.harga_besar || service.harga || 0
      : service.harga_kecil || service.harga || 0
    : 0);

  const getVehicleLabel = () => {
    if (data.tipe_motor === 'mobil') return 'Mobil';
    if (data.tipe_motor === 'besar') return 'Motor Besar';
    return 'Motor Kecil';
  };

  const dateStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const timeStr = data.paid_at || data.completed_at || data.created_at || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  const storeName = settings?.nama_usaha || 'ANTREAN CUCI MOTOR & MOBIL';
  const storeTagline = settings?.tagline || 'Sistem Cuci Kendaraan Modern & Cepat';
  const storeAddress = settings?.alamat || 'Jl. Otomotif Raya No. 88, Jakarta';
  const storePhone = settings?.telepon || '0812-3456-7890';
  const storeFooter = settings?.footer_struk || 'Simpan struk ini untuk bukti pengambilan kendaraan. Terima Kasih!';

  return (
    <div
      id="receipt-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="thermal-receipt-container"
        className="bg-white text-slate-900 p-6 sm:p-7 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl font-mono text-xs print-area border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close button at top right */}
        <button
          id="btn-close-receipt-modal-x"
          onClick={onClose}
          className="no-print absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 transition cursor-pointer"
          title="Tutup Struk"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Thermal Header */}
        <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-slate-950 font-black text-lg tracking-tight uppercase">
            <Droplets className="w-5 h-5 text-emerald-600 inline" />
            <span>{storeName}</span>
          </div>
          <p className="text-[10px] text-slate-600 font-sans">{storeTagline}</p>
          <p className="text-[9px] text-slate-500 font-sans">{storeAddress}</p>
          <p className="text-[9px] text-slate-500 font-sans">Telp: {storePhone}</p>
          <div className="pt-1">
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase font-mono ${
                data.is_paid
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {data.is_paid ? 'STRUK PEMBAYARAN LUNAS' : 'TIKET TANDA MASUK ANTREAN'}
            </span>
          </div>
        </div>

        {/* Transaction Meta */}
        <div className="space-y-1.5 py-1 text-slate-800 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Waktu Cetak:</span>
            <span className="font-medium text-slate-900">
              {dateStr} - {timeStr}
            </span>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center">
            <span className="font-bold text-slate-900">No. Antrean:</span>
            <span className="font-black text-2xl text-emerald-700 font-mono tracking-wider">
              {data.nomor_antrian}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Nama Pelanggan:</span>
            <span className="font-bold text-slate-900 text-xs">{data.nama_pemohon}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Jenis Kendaraan:</span>
            <span className="font-bold text-slate-900 flex items-center space-x-1">
              {data.tipe_motor === 'mobil' ? (
                <Car className="w-3.5 h-3.5 text-blue-600 inline" />
              ) : (
                <Bike className="w-3.5 h-3.5 text-emerald-600 inline" />
              )}
              <span>{getVehicleLabel()}</span>
            </span>
          </div>
          {pit && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Lokasi Pit:</span>
              <span className="font-bold text-emerald-800">{pit.nama_pit}</span>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-b border-dashed border-slate-400 py-3 space-y-1.5">
          <div className="flex justify-between font-bold text-slate-900 text-xs">
            <span className="truncate pr-2">{service ? service.nama_layanan : 'Paket Cuci'}</span>
            <span className="shrink-0 font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-sans">
            <span>Kategori: {getVehicleLabel()}</span>
            {service?.durasi_menit && <span>Est: ~{service.durasi_menit} Mnt</span>}
          </div>
        </div>

        {/* Total Calculation */}
        <div className="space-y-1.5 py-1">
          <div className="flex justify-between items-center">
            <span className="font-bold uppercase text-[11px] text-slate-900">TOTAL BIAYA:</span>
            <span className="text-lg font-black text-slate-950 font-mono">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Stamp / Status */}
        <div
          className={`p-2.5 rounded-xl text-center font-bold text-[11px] flex items-center justify-center space-x-1.5 ${
            data.is_paid
              ? 'bg-emerald-100 border border-emerald-400 text-emerald-900'
              : 'bg-amber-100 border border-amber-400 text-amber-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>STATUS: {data.is_paid ? 'LUNAS (KASIR)' : 'BELUM BAYAR'}</span>
        </div>

        <div className="text-center text-[10px] text-slate-600 pt-2 border-t border-dashed border-slate-300 font-sans">
          {storeFooter}
        </div>

        {/* Interactive Buttons (Hidden in Print) */}
        <div className="flex space-x-2 pt-2 no-print font-sans">
          <button
            id="btn-print-thermal-receipt"
            onClick={handlePrint}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 px-4 rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Struk (Print)</span>
          </button>
          <button
            id="btn-close-receipt-modal"
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
