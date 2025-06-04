import React from 'react';

export const ResetConfirmationModal = ({
  show,
  onClose,
  onConfirm,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <h3 className="text-2xl font-semibold text-sky-300 mb-4">Konfirmasi Reset</h3>
        <p className="text-slate-300 mb-6">
          Yakin mau reset semua input dan hasil di mode ini? Data yang udah lo masukin bakal ilang lho.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors font-semibold"
          >
            Ya, Reset Aja!
          </button>
        </div>
      </div>
    </div>
  );
};