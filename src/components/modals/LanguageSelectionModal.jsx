import React from 'react';
import { GlobeAltIcon } from '../icons/GlobeAltIcon.jsx'; 

export const LanguageSelectionModal = ({
  show,
  onClose,
  onSelectLanguage,
  triggerContext,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog">
      <div className="bg-slate-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md border border-slate-700">
        <div className="flex items-center mb-4">
          <GlobeAltIcon className="w-8 h-8 mr-3 text-sky-400" />
          <h3 className="text-2xl font-semibold text-sky-300">Pilih Bahasa Output</h3>
        </div>
        <p className="text-slate-300 mb-2">
          CV untuk <strong className="text-slate-100">{triggerContext}</strong> akan dibuat dalam bahasa yang Anda pilih:
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Jika memilih Bahasa Inggris untuk CV dari Form, data form akan diterjemahkan terlebih dahulu.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => onSelectLanguage('id')}
            className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-white bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 transition-all font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75"
            aria-label="Pilih Bahasa Indonesia Formal"
          >
            🇮🇩 Bahasa Indonesia (Formal)
          </button>
          <button
            onClick={() => onSelectLanguage('en')}
            className="w-full flex items-center justify-center px-6 py-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
            aria-label="Pilih English (Formal)"
          >
            🇬🇧 English (Formal)
          </button>
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            aria-label="Batal dan tutup modal"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};