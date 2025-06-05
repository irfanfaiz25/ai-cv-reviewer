import React from "react";
import { ArrowPathIcon } from "../icons/ArrowPathIcon";
import { ModeSwitcher } from "./ModeSwitcher";

export const AppHeader = ({
  currentMode,
  onShowResetModal,
  showResetButton,
  resetButtonDisabled,
  onModeChange,
}) => {
  return (
    <header className="text-center mb-8 sm:mb-12 mt-8 md:mt-0 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl floating-animation"></div>
        <div
          className="absolute top-10 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl floating-animation"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="w-1/3"></div>
        <div className="relative">
          <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent w-auto text-center whitespace-nowrap px-4 floating-animation">
            ✨ AI CV Reviewer
          </h1>
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-pink-600 to-cyan-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        </div>
        <div className="w-1/3 flex justify-end">
          {showResetButton && (
            <button
              onClick={onShowResetModal}
              title="Reset Form"
              className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 transition-all duration-300 transform hover:scale-110 glow-effect"
              disabled={resetButtonDisabled}
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-6 mx-auto max-w-2xl">
        <p className="text-slate-300 text-sm md:text-lg leading-relaxed">
          {currentMode === "reviewer" ? (
            <>
              🚀 Upload CV{" "}
              <code className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-2 py-1 rounded-lg text-cyan-300 font-semibold">
                .pdf
              </code>{" "}
              lo, biar di-review &amp; di-upgrade sama AI!
            </>
          ) : (
            "🎯 Isi form di bawah buat bikin CV ATS-Friendly pake bantuan AI!"
          )}
        </p>
      </div>

      <ModeSwitcher
        currentMode={currentMode}
        onModeChange={onModeChange}
        disabled={resetButtonDisabled}
      />
    </header>
  );
};
