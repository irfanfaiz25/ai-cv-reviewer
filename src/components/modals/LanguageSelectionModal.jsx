import React from "react";
import { GlobeAltIcon } from "../icons/GlobeAltIcon.jsx";

export const LanguageSelectionModal = ({
  show,
  onClose,
  onSelectLanguage,
  triggerContext,
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
    >
      <div className="glass-effect p-8 rounded-3xl shadow-2xl w-full max-w-md border border-slate-600/30 transform transition-all duration-300 scale-100">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl mr-4">
            <GlobeAltIcon className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🌍 Pilih Bahasa Output
          </h3>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-4 mb-6">
          <p className="text-slate-300 mb-2">
            CV untuk <strong className="text-white">{triggerContext}</strong>{" "}
            akan dibuat dalam bahasa yang Anda pilih:
          </p>
          <p className="text-xs text-slate-400">
            💡 Jika memilih Bahasa Inggris untuk CV dari Form, data form akan
            diterjemahkan terlebih dahulu.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => onSelectLanguage("id")}
            className="w-full group relative flex items-center justify-center px-6 py-4 rounded-2xl text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Pilih Bahasa Indonesia Formal"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <span className="relative z-10">🇮🇩 Bahasa Indonesia (Formal)</span>
          </button>

          <button
            onClick={() => onSelectLanguage("en")}
            className="w-full group relative flex items-center justify-center px-6 py-4 rounded-2xl text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
            aria-label="Pilih English (Formal)"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <span className="relative z-10">🇬🇧 English (Formal)</span>
          </button>
        </div>

        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-slate-300 bg-slate-700/50 hover:bg-slate-600/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-500 backdrop-blur-sm border border-slate-600/30"
            aria-label="Batal dan tutup modal"
          >
            ❌ Batal
          </button>
        </div>
      </div>
    </div>
  );
};
