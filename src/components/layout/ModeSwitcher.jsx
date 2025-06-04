import React from "react";
import { EyeIcon } from "../icons/EyeIcon.jsx";
import { BriefcaseIcon } from "../icons/BriefcaseIcon.jsx";

export const ModeSwitcher = ({ currentMode, onModeChange, disabled }) => {
  return (
    <div className="mt-6 flex justify-center space-x-3 sm:space-x-4">
      <button
        onClick={() => onModeChange("reviewer")}
        disabled={disabled}
        className={`px-4 py-2.5 sm:px-6 rounded-lg font-medium transition-all duration-200 ease-in-out flex items-center
          ${
            currentMode === "reviewer"
              ? "bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg scale-105"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
          }`}
      >
        <EyeIcon className="w-5 h-5 mr-2" /> CV Reviewer
      </button>
      <button
        onClick={() => onModeChange("generator")}
        disabled={disabled}
        className={`px-4 py-2.5 sm:px-6 rounded-lg font-medium transition-all duration-200 ease-in-out flex items-center
          ${
            currentMode === "generator"
              ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg scale-105"
              : "bg-slate-700 hover:bg-slate-600 text-slate-300"
          }`}
      >
        <BriefcaseIcon className="w-5 h-5 mr-2" /> CV Generator
      </button>
    </div>
  );
};
