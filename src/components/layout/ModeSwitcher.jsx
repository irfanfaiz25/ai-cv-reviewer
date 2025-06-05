import React from "react";
import { EyeIcon } from "../icons/EyeIcon.jsx";
import { BriefcaseIcon } from "../icons/BriefcaseIcon.jsx";

export const ModeSwitcher = ({ currentMode, onModeChange, disabled }) => {
  return (
    <div className="mt-8 flex justify-center space-x-4 sm:space-x-6">
      <button
        onClick={() => onModeChange("reviewer")}
        disabled={disabled}
        className={`group relative px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-semibold transition-all duration-300 ease-in-out flex items-center transform hover:scale-105 ${
          currentMode === "reviewer"
            ? "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white shadow-2xl shadow-purple-500/25 scale-105"
            : "bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white backdrop-blur-sm border border-slate-600/50"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
        {/* <EyeIcon className="w-5 h-5 mr-3 relative z-10" /> */}
        <span className="mr-3">🔍</span>
        <span className="relative z-10 text-sm md:text-base">CV Reviewer</span>
      </button>

      <button
        onClick={() => onModeChange("generator")}
        disabled={disabled}
        className={`group relative px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-semibold transition-all duration-300 ease-in-out flex items-center transform hover:scale-105 ${
          currentMode === "generator"
            ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-2xl shadow-emerald-500/25 scale-105"
            : "bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 hover:text-white backdrop-blur-sm border border-slate-600/50"
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
        {/* <BriefcaseIcon className="w-5 h-5 mr-3 relative z-10" /> */}
        <span className="mr-3">⚡</span>
        <span className="relative z-10 text-sm md:text-base">CV Generator</span>
      </button>
    </div>
  );
};
