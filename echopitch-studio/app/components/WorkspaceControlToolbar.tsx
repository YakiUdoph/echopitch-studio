"use client";

import React from "react";
import { PitchDuration } from "../lib/mockData";
import { Clock, Sliders } from "lucide-react";

interface WorkspaceControlToolbarProps {
  pitchDuration: PitchDuration;
  onSelectPitchDuration: (duration: PitchDuration) => void;
  isExpertMode: boolean;
  onToggleExpertMode: () => void;
}

export const WorkspaceControlToolbar: React.FC<WorkspaceControlToolbarProps> = ({
  pitchDuration,
  onSelectPitchDuration,
  isExpertMode,
  onToggleExpertMode
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/60 px-5 py-3 backdrop-blur-xl shadow-md">
        {/* Left: Pitch Duration Selector Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <Clock className="h-4 w-4 text-emerald-500" />
            <span>Pitch Duration:</span>
          </div>

          <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-200 dark:border-zinc-800 text-xs">
            <button
              onClick={() => onSelectPitchDuration(60)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                pitchDuration === 60
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              60s (Elevator)
            </button>
            <button
              onClick={() => onSelectPitchDuration(90)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                pitchDuration === 90
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              90s (Standard)
            </button>
            <button
              onClick={() => onSelectPitchDuration(180)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                pitchDuration === 180
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              3-Min (Deep Dive)
            </button>
          </div>
        </div>

        {/* Right: Progressive Disclosure Mode Toggle (Simple / Expert Mode) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
            <Sliders className="h-4 w-4 text-indigo-500" />
            <span>View Mode:</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-950 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-xs">
            <span className={`text-[11px] font-semibold ${!isExpertMode ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}`}>
              Simple
            </span>
            <button
              onClick={onToggleExpertMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isExpertMode ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isExpertMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-[11px] font-semibold ${isExpertMode ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}`}>
              Expert Mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
