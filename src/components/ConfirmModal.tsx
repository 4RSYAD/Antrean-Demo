import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ConfirmModalData } from '../types.ts';

interface ConfirmModalProps {
  data: ConfirmModalData;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ data, onCancel }) => {
  if (!data.isOpen) return null;

  return (
    <div
      id="confirm-modal-overlay"
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-200"
    >
      <div
        id="confirm-modal-box"
        className="bg-white dark:bg-[#0F121C] border border-slate-200 dark:border-[#23293D] max-w-md w-full p-6 rounded-3xl space-y-4 shadow-2xl"
      >
        <div className="flex items-center space-x-3 text-rose-500">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{data.title}</h3>
        </div>

        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {data.message}
        </p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            id="btn-confirm-cancel"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-100 dark:bg-[#161A28] text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-full hover:bg-slate-200 dark:hover:bg-[#1E2336] transition"
          >
            Batal
          </button>
          <button
            id="btn-confirm-accept"
            onClick={() => {
              if (data.action) data.action();
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-full transition shadow-md"
          >
            Lanjutkan Hapus
          </button>
        </div>
      </div>
    </div>
  );
};
