import React from 'react';
import { ArrowPathIcon } from '../icons/ArrowPathIcon.jsx';

export const AppHeader = ({
  currentMode,
  onShowResetModal,
  showResetButton,
  resetButtonDisabled,
}) => {
  return (
    <header className="text-center mb-8 sm:mb-12">
      <div className="flex justify-between items-center mb-2">
        <div className="w-1/3"></div> {/* Spacer */}
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent w-auto text-center whitespace-nowrap px-4">
          AI CV Suite
        </h1>
        <div className="w-1/3 flex justify-end">
          {showResetButton && (
            <button
              onClick={onShowResetModal}
              title="Reset Form"
              className="p-2 rounded-md text-slate-400 hover:text-sky-400 hover:bg-slate-700 transition-colors"
              disabled={resetButtonDisabled}
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-slate-400 text-lg">
        {currentMode === 'reviewer' ? (
          <>
            Upload CV <code className="bg-slate-700 px-1 rounded text-sky-300">.pdf</code> lo, biar di-review &amp; di-upgrade sama AI!
          </>
        ) : (
          "Isi form di bawah buat bikin CV ATS-Friendly pake bantuan AI!"
        )}
      </p>
    </header>
  );
};