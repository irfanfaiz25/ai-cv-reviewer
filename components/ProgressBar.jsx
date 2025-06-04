import React from 'react';

export const ProgressBar = ({ progress }) => {
  const cappedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className="w-full bg-slate-700 rounded-full h-2.5 shadow-inner">
      <div
        className="bg-gradient-to-r from-sky-500 to-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${cappedProgress}%` }}
      ></div>
    </div>
  );
};