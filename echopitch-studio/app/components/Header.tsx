"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
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
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-zinc-950/80 backdrop-blur-2xl transition-colors duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Custom Cyan Logo & EchoPitch Brand Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 shadow-[0_0_16px_rgba(6,182,212,0.6)] ring-1 ring-cyan-400/60 overflow-hidden group">
            <Image
              src="/logo.jpg"
              alt="EchoPitch Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            {/* Subtle Overlay Cyan Wave Glow */}
            <div className="absolute inset-0 bg-cyan-400/10 mix-blend-overlay pointer-events-none" />
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-base font-extrabold tracking-tight text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              EchoPitch Studio
            </span>
          </div>
        </div>

        {/* Center: Glassmorphic Segmented Navigation Tabs */}
        <nav className="hidden md:flex items-center rounded-xl bg-zinc-900/80 p-1 border border-cyan-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.4)]">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "studio"
                ? "bg-cyan-950/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/40"
                : "text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/50"
            }`}
          >
            <Layers className={`h-3.5 w-3.5 ${activeTab === "studio" ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" : "text-zinc-400"}`} />
            <span>Studio Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab("script")}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "script"
                ? "bg-cyan-950/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/40"
                : "text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/50"
            }`}
          >
            <FileText className={`h-3.5 w-3.5 ${activeTab === "script" ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" : "text-zinc-400"}`} />
            <span>Pitch Deck</span>
          </button>

          <button
            onClick={() => setActiveTab("asp")}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "asp"
                ? "bg-cyan-950/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-400/40"
                : "text-zinc-400 hover:text-cyan-200 hover:bg-zinc-800/50"
            }`}
          >
            <Cpu className={`h-3.5 w-3.5 ${activeTab === "asp" ? "text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" : "text-zinc-400"}`} />
            <span>ASP Spec</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.9)] animate-pulse"></span>
          </button>
        </nav>

        {/* Right: Theme Dropdown Selector + Light/Dark Toggle + Export Assets CTA */}
        <div className="flex items-center gap-3">
          {/* Theme Preset Selector */}
          <div className="flex items-center rounded-xl bg-zinc-900/80 px-2.5 py-1.5 border border-cyan-500/20 text-xs">
            <Palette className="h-3.5 w-3.5 text-cyan-400 mr-1.5" />
            <select
              value={themePreset}
              onChange={(e) => onSelectThemePreset(e.target.value as ThemePreset)}
              className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="matrix" className="bg-zinc-900 text-zinc-200">OKX Matrix</option>
              <option value="cyberpunk" className="bg-zinc-900 text-zinc-200">Cyberpunk Neon</option>
              <option value="gold" className="bg-zinc-900 text-zinc-200">Web3 Gold</option>
              <option value="terminal" className="bg-zinc-900 text-zinc-200">Dev Terminal</option>
            </select>
          </div>

          {/* Light / Dark Mode Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-900/80 border border-cyan-500/20 text-zinc-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all cursor-pointer"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-cyan-400" />
              ) : (
                <Moon className="h-4 w-4 text-cyan-400" />
              )}
            </button>
          )}

          {/* Cyberpunk Glowing CTA Button */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400/50 px-3.5 py-1.5 text-xs font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_22px_rgba(6,182,212,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5 text-cyan-100" />
            <span className="hidden sm:inline">Export Assets</span>
          </button>
        </div>
      </div>
    </header>
  );
};

