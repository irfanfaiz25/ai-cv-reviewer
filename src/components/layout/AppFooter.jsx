import React from "react";

export const AppFooter = () => {
  return (
    <footer className="w-full text-center mt-12 sm:mt-16 relative">
      <div className="glass-effect rounded-2xl p-6 mx-auto max-w-md">
        <p className="text-slate-400 text-sm leading-relaxed">
          Made with{" "}
          <span className="text-red-400 animate-pulse text-lg">♥</span> by{" "}
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent font-semibold">
            Irfan Faiz
          </span>
          <br />
          <span className="text-xs text-slate-500">
            Powered by{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">
              ✨ Gemini AI
            </span>
          </span>
        </p>
      </div>
    </footer>
  );
};
