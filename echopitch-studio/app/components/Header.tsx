"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { ThemePreset } from "../lib/mockData";
import {
  Layers,
  FileText,
  Cpu,
  Share2,
  Sun,
  Moon,
  Palette
} from "lucide-react";

export type TabType = "studio" | "script" | "asp";

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenExportModal: () => void;
  themePreset: ThemePreset;
  onSelectThemePreset: (preset: ThemePreset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  themePreset,
  onSelectThemePreset
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl transition-colors duration-300">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Compact Logo & OKX Badge (No Tagline) */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 shadow-md shadow-emerald-500/20 ring-1 ring-white/20">
            {/* SVG Glowing Waveform Sparkle Logo */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"
            >
              <path d="M2 12h3l2-7 4 14 3-9 2 4h4" />
              <path d="M19 5l1.5 1.5L22 5l-1.5-1.5z" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-100 dark:to-zinc-300 bg-clip-text text-base font-black tracking-tight text-transparent">
              EchoPitch Studio
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              OKX.AI
            </span>
          </div>
        </div>

        {/* Center: Segmented Navigation Tabs */}
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

        {/* Right: Theme Dropdown Selector + Light/Dark Toggle + Export Assets CTA */}
        <div className="flex items-center gap-2.5">
          {/* Theme Preset Selector */}
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

          {/* Light / Dark Mode Toggle */}
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

          {/* Primary CTA Button */}
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
