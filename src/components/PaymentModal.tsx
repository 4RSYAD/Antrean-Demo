import React from 'react';
import {
  X,
  ArrowRight,
  Receipt,
  Bike,
  Car
} from 'lucide-react';
import { QueueItem, ServiceItem } from '../types.ts';

interface PaymentModalProps {
  queue: QueueItem | null;
  services: ServiceItem[];
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (queueId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  queue,
  services,
  isOpen,
  onClose,
  onConfirmPayment
}) => {
  if (!isOpen || !queue) return null;

  const service = services.find((s) => s.id === queue.layanan_id);
  let totalAmount = queue.total_biaya || 0;
  if (!totalAmount && service) {
    if (queue.tipe_motor === 'mobil') {
      totalAmount = service.harga_mobil || service.harga_besar || service.harga || 0;
    } else if (queue.tipe_motor === 'besar') {
      totalAmount = service.harga_besar || service.harga || 0;
    } else {
      totalAmount = service.harga_kecil || service.harga || 0;
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmPayment(queue.id);
  };

  return (
    <div
      id="payment-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print"
    >
      <div
        id="payment-modal-card"
        className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#23293D] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <span>Pembayaran Kasir</span>
                <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full">
                  Tiket {queue.nomor_antrian}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Konfirmasi transaksi cuci untuk menyelesaikan antrean
              </p>
            </div>
          </div>

          <button
            id="btn-close-payment-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161A28] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer & Bill Summary */}
        <div className="p-4 bg-slate-50 dark:bg-[#161A28] rounded-2xl border border-slate-200 dark:border-[#23293D] space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Nama Pelanggan:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{queue.nama_pemohon}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Jenis Kendaraan:</span>
            <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1">
              {queue.tipe_motor === 'mobil' ? (
                <Car className="w-3.5 h-3.5 text-blue-600 inline" />
              ) : (
                <Bike className="w-3.5 h-3.5 text-emerald-600 inline" />
              )}
              <span>
                {queue.tipe_motor === 'mobil'
                  ? 'Mobil'
                  : queue.tipe_motor === 'besar'
                  ? 'Motor Besar'
                  : 'Motor Kecil'}
              </span>
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-slate-200 dark:border-[#23293D] pt-2">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Paket Layanan:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {service?.nama_layanan || 'Paket Cuci'}
            </span>
          </div>

          <div className="flex justify-between items-center border-t border-dashed border-slate-300 dark:border-[#23293D] pt-3">
            <span className="font-extrabold text-slate-900 dark:text-white uppercase">
              TOTAL BIAYA:
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              Rp {totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              id="btn-cancel-payment"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-200 dark:bg-[#161A28] hover:bg-slate-300 dark:hover:bg-[#1E2336] text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="btn-confirm-payment-submit"
              className="flex-[2] py-3.5 px-4 font-black rounded-2xl text-xs transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
            >
              <span>Bayar Lunas & Cetak Struk</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
