"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Tooltip } from "./Tooltip";
import { PitchDuration, ThemePreset, THEME_PRESETS } from "../lib/mockData";
import {
  Zap,
  Rocket,
  Layers,
  FileText,
  Cpu,
  Share2,
  Sun,
  Moon,
  Clock,
  Palette
} from "lucide-react";

export type TabType = "studio" | "script" | "asp";

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isExpertMode: boolean;
  onToggleExpertMode: () => void;
  onRunTestDefi: () => void;
  onRunTestMarketplace: () => void;
  onOpenExportModal: () => void;
  isProcessing: boolean;
  activePresetName: string;
  pitchDuration: PitchDuration;
  onSelectPitchDuration: (duration: PitchDuration) => void;
  themePreset: ThemePreset;
  onSelectThemePreset: (preset: ThemePreset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isExpertMode,
  onToggleExpertMode,
  onRunTestDefi,
  onRunTestMarketplace,
  onOpenExportModal,
  isProcessing,
  activePresetName,
  pitchDuration,
  onSelectPitchDuration,
  themePreset,
  onSelectThemePreset
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeThemeObj = THEME_PRESETS[themePreset] || THEME_PRESETS.matrix;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl transition-colors duration-300">
      {/* Quick Demo Presets Banner */}
      <div className="w-full bg-gradient-to-r from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900/60 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 px-4 py-2">
        <div className="mx-auto flex flex-wrap items-center justify-between gap-3 max-w-7xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase text-[11px]">
              ⚡ QUICK DEMO PRESETS:
            </span>
            <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400 text-xs">
              Test pre-loaded README files instantly without typing
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onRunTestDefi}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all border ${
                activePresetName === "DeFi Agent"
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
              <span>⚡ Test "DeFi Agent"</span>
            </button>

            <button
              onClick={onRunTestMarketplace}
              disabled={isProcessing}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all border ${
                activePresetName === "AI Marketplace"
                  ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Rocket className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>🚀 Test "AI Marketplace"</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Navigation Bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Far Left: Brand & Glowing Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
            {/* SVG Glowing Waveform Sparkle Logo */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-white drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"
            >
              <path d="M2 12h3l2-7 4 14 3-9 2 4h4" />
              <path d="M19 5l1.5 1.5L22 5l-1.5-1.5z" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-lg font-black tracking-tight text-transparent">
                EchoPitch Studio
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                OKX.AI ASP
              </span>
            </div>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Web3 AI Agent Pitch Generator & <Tooltip termKey="ASP Payload">ASP Skill Engine</Tooltip>
            </span>
          </div>
        </div>

        {/* Center: Essential Navigation Tabs */}
        <nav className="hidden md:flex items-center rounded-xl bg-zinc-100/90 dark:bg-zinc-900/90 p-1 border border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "studio"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/80"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Studio Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "script"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/80"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Pitch Deck</span>
          </button>

          <button
            onClick={() => setActiveTab("asp")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "asp"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700/80"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40"
            }`}
          >
            <Cpu className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>ASP Spec</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
          </button>
        </nav>

        {/* Far Right: Feature 1 Duration Selector, Feature 3 Theme Engine, Mode Toggle & Export Button */}
        <div className="flex items-center gap-2.5">
          {/* Feature 1: Dynamic Pitch Duration Selector */}
          <div className="hidden sm:flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
              <Clock className="h-3 w-3 text-emerald-400" />
              Duration:
            </span>
            <button
              onClick={() => onSelectPitchDuration(60)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                pitchDuration === 60
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              60s
            </button>
            <button
              onClick={() => onSelectPitchDuration(90)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                pitchDuration === 90
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              90s
            </button>
            <button
              onClick={() => onSelectPitchDuration(180)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                pitchDuration === 180
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              3-Min
            </button>
          </div>

          {/* Feature 3: Visual Theme Engine Dropdown */}
          <div className="flex items-center rounded-xl bg-zinc-100 dark:bg-zinc-900 px-2 py-1 border border-zinc-200 dark:border-zinc-800 text-xs">
            <Palette className="h-3.5 w-3.5 text-indigo-400 mr-1.5" />
            <select
              value={themePreset}
              onChange={(e) => onSelectThemePreset(e.target.value as ThemePreset)}
              className="bg-transparent text-xs font-semibold text-zinc-700 dark:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="matrix">OKX Matrix</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="gold">Web3 Gold</option>
              <option value="terminal">Dev Terminal</option>
            </select>
          </div>

          {/* Light / Dark Mode Toggle Button */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-600" />
              )}
            </button>
          )}

          {/* Progressive Disclosure Toggle (Simple vs Expert Mode) */}
          <div className="hidden lg:flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800">
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

          {/* Export Payload Modal Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white border border-zinc-800 dark:border-zinc-700/80 px-3.5 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all"
          >
            <Share2 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Assets</span>
          </button>
        </div>
      </div>
    </header>
  );
};
