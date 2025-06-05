import React from "react";

export const ProgressBar = ({ progress }) => {
  const cappedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full bg-slate-800/50 rounded-full h-4 shadow-inner backdrop-blur-sm border border-slate-600/30">
      <div
        className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
        style={{ width: `${cappedProgress}%` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-pink-400 opacity-50 blur-sm"></div>
      </div>
    </div>
  );
};
