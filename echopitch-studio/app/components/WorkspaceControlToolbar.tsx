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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl glass-panel px-6 py-3.5 shadow-[0_4px_25px_rgba(0,0,0,0.4)]">
        {/* Left: Pitch Duration Selector Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-200">
            <Clock className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            <span>Pitch Duration:</span>
          </div>

          <div className="flex items-center rounded-xl bg-zinc-950/80 p-1 border border-cyan-500/20 text-xs">
            <button
              onClick={() => onSelectPitchDuration(60)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pitchDuration === 60
                  ? "bg-cyan-950/80 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/50"
                  : "text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/50"
              }`}
            >
              60s (Elevator)
            </button>
            <button
              onClick={() => onSelectPitchDuration(90)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pitchDuration === 90
                  ? "bg-cyan-950/80 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/50"
                  : "text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/50"
              }`}
            >
              90s (Standard)
            </button>
            <button
              onClick={() => onSelectPitchDuration(180)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                pitchDuration === 180
                  ? "bg-cyan-950/80 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/50"
                  : "text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/50"
              }`}
            >
              3-Min (Deep Dive)
            </button>
          </div>
        </div>

        {/* Right: Progressive Disclosure Mode Toggle (Simple / Expert Mode) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-cyan-200">
            <Sliders className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            <span>View Mode:</span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-zinc-950/80 px-3.5 py-1.5 border border-cyan-500/20 text-xs">
            <span className={`text-[11px] font-bold ${!isExpertMode ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" : "text-zinc-500"}`}>
              Simple
            </span>
            <button
              onClick={onToggleExpertMode}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isExpertMode ? "bg-cyan-600 shadow-[0_0_10px_rgba(6,182,212,0.6)]" : "bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isExpertMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span className={`text-[11px] font-bold ${isExpertMode ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" : "text-zinc-500"}`}>
              Expert Mode
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

