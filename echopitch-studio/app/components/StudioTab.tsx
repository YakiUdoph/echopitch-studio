"use client";

import React, { useState } from "react";
import { Slide, ScriptItem, VoiceProfile, MOCK_VOICE_PROFILES } from "../lib/mockData";
import { Tooltip } from "./Tooltip";
import {
  FileCode,
  GitBranch,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Zap,
  Video,
  ChevronDown,
  ChevronUp,
  Cpu,
  Code2
} from "lucide-react";

interface StudioTabProps {
  slides: Slide[];
  onUpdateSlides: (slides: Slide[]) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTimeSeconds: number;
  onSeekTime: (seconds: number) => void;
  readmeText: string;
  onUpdateReadmeText: (text: string) => void;
  githubUrl: string;
  onUpdateGithubUrl: (url: string) => void;
  onRunAiParser: () => void;
  isProcessing: boolean;
  processingStep: string;
  isExpertMode: boolean;
  selectedVoice: VoiceProfile;
  onSelectVoice: (voice: VoiceProfile) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  speechCharIndex?: number;
  speechCharTotal?: number;
}

export const StudioTab: React.FC<StudioTabProps> = ({
  slides,
  onUpdateSlides,
  activeSlideIndex,
  setActiveSlideIndex,
  isPlaying,
  onTogglePlay,
  currentTimeSeconds,
  onSeekTime,
  readmeText,
  onUpdateReadmeText,
  githubUrl,
  onUpdateGithubUrl,
  onRunAiParser,
  isProcessing,
  processingStep,
  isExpertMode,
  selectedVoice,
  onSelectVoice,
  playbackSpeed,
  onChangeSpeed,
  speechCharIndex = 0,
  speechCharTotal = 140
}) => {
  const [inputMode, setInputMode] = useState<"github" | "paste">("paste");
  const [isSourceMarkdownOpen, setIsSourceMarkdownOpen] = useState<boolean>(false);
  const currentSlide = slides[activeSlideIndex] || slides[0];

  const handleSlideContentEdit = (slideIndex: number, newScript: string) => {
    const updated = slides.map((s, idx) =>
      idx === slideIndex ? { ...s, scriptText: newScript } : s
    );
    onUpdateSlides(updated);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto">
      {/* Step-by-Step Processing Overlay when parsing */}
      {isProcessing && (
        <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Cpu className="h-6 w-6 animate-spin" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-emerald-300">
                  OKX.AI Agent Processing Pipeline Active...
                </h3>
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  {processingStep}
                </span>
              </div>
              <div className="mt-2.5 h-2 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Collapsible Ingestion & Markdown AI Parser Panel */}
      <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:scale-[1.005]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                1. Ingestion & Markdown AI Parser
              </h2>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                LLM Parser
              </span>
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 block">
              Extracts problem statement, solution & architecture from repository Markdown
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Collapse / Expand Source Markdown Panel Button */}
            <button
              onClick={() => setIsSourceMarkdownOpen(!isSourceMarkdownOpen)}
              className="flex items-center gap-2 rounded-xl bg-zinc-800/90 border border-zinc-700/80 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-all duration-300 hover:scale-105"
            >
              <Code2 className="h-4 w-4 text-emerald-400" />
              <span>{isSourceMarkdownOpen ? "Hide Markdown Editor" : "Source Markdown Editor"}</span>
              {isSourceMarkdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Glowing Gradient Action Button */}
            <button
              onClick={onRunAiParser}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:opacity-50 transition-all duration-300 hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              <span>Parse & Generate 90s Pitch</span>
            </button>
          </div>
        </div>

        {/* Collapsible Input Drawer Body */}
        {isSourceMarkdownOpen && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                Select Input Mode
              </span>
              <div className="flex items-center rounded-xl bg-zinc-950 p-1 border border-zinc-800 text-xs">
                <button
                  onClick={() => setInputMode("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold ${
                    inputMode === "paste"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  Paste README Text
                </button>
                <button
                  onClick={() => setInputMode("github")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-semibold ${
                    inputMode === "github"
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  GitHub Repository URL
                </button>
              </div>
            </div>

            {inputMode === "github" ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => onUpdateGithubUrl(e.target.value)}
                  placeholder="https://github.com/org/repo (e.g. https://github.com/echopitch/x-vault-ai)"
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 font-mono text-xs text-zinc-200 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            ) : (
              <textarea
                value={readmeText}
                onChange={(e) => onUpdateReadmeText(e.target.value)}
                placeholder="Paste raw README markdown text here..."
                className="h-36 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
              />
            )}
          </div>
        )}

        {/* Extracted Tags Summary Badge Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-4 mt-2 border-t border-zinc-800/60">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Detected Tags:
          </span>
          {["#DeFi", "#XLayer", "#AutonomousAgent", "#NextJS15", "#OKB-Gas", "#OKX-ASP"].map((tag, idx) => (
            <span
              key={idx}
              className="rounded-md bg-zinc-950 px-2.5 py-0.5 font-mono text-[11px] text-zinc-300 border border-zinc-800"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Expert Mode Overlay Panel for Card 1 */}
        {isExpertMode && (
          <div className="mt-4 rounded-xl bg-zinc-950 p-3.5 font-mono text-[11px] text-emerald-400 border border-zinc-800 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
              <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">
                ⚡ [EXPERT MODE OVERLAY] Card 1 LLM Parser Payload
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">Latency: 142ms</span>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-zinc-300">
              <div className="flex justify-between">
                <span>Speech Char Index: <strong className="text-emerald-400">0..{speechCharIndex}</strong> (Total: {speechCharTotal})</span>
                <span>Input Mode: {inputMode}</span>
              </div>
              <div className="overflow-x-auto text-[10px] text-zinc-400">
                Raw JSON: {JSON.stringify({ inputMode, githubUrl, textLength: readmeText.length, tags: ["#DeFi", "#XLayer", "#OKX-ASP"], step: processingStep || "Idle" })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace Split: Feature 3 Live Video Simulator + Feature 2 Storyboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Feature 3: Browser-Native Audio & Slide Preview Canvas (Live Pitch Simulator) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-2xl overflow-hidden relative transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:scale-[1.005]">
          {/* Stage Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                Live Visual Slide Render Stage
              </h3>
              <span className="text-[10px] italic text-zinc-500 dark:text-zinc-400">
                *(Canvas, <Tooltip termKey="Web Audio Sync">Web Audio Sync</Tooltip> & <Tooltip termKey="FFmpeg WASM">FFmpeg WASM</Tooltip>)*
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-emerald-400 font-bold bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                {Math.floor(currentTimeSeconds / 60)}:
                {(currentTimeSeconds % 60).toString().padStart(2, "0")} / 01:30
              </span>
            </div>
          </div>

          {/* Live Slide Stage Canvas Box */}
          <div className="relative mt-5 flex-1 min-h-[380px] rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 flex flex-col justify-center items-center overflow-hidden">
            {/* Background Glow */}
            <div
              className={`absolute -top-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-tr ${currentSlide.themeColor} opacity-15 blur-3xl pointer-events-none transition-all duration-700`}
            />

            {/* Slide Category Header Badge */}
            <div className="relative z-10 w-full max-w-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-zinc-800/90 border border-zinc-700 px-3 py-0.5 text-xs font-bold text-emerald-400 uppercase tracking-wider shadow-sm transition-all duration-300">
                  Slide 0{currentSlide.number} | {currentSlide.category} ({currentSlide.timeRange})
                </span>
                {isExpertMode && (
                  <span className="font-mono text-[10px] text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    MS Range: {currentSlide.timeMsRange}
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  {currentSlide.title}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-400">
                  {currentSlide.subtitle}
                </p>
              </div>

              {/* Bullet Points */}
              <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/90 p-5 backdrop-blur-md">
                {currentSlide.content.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/20">
                      {i + 1}
                    </span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>

              {/* Key Takeaways */}
              <div className="flex flex-wrap gap-2">
                {currentSlide.keyPoints.map((pt, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-[11px] font-mono text-zinc-300"
                  >
                    ⚡ {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Expert Mode JSON Debug Overlay */}
            {isExpertMode && (
              <div className="absolute bottom-2 left-2 right-2 rounded-lg bg-zinc-950 p-3 font-mono text-[10px] text-emerald-400 border border-zinc-800 backdrop-blur-md max-h-28 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1 mb-1">
                  <span className="text-zinc-400 font-bold uppercase text-[9px]">
                    [EXPERT MODE OVERLAY] Render Stage Payload
                  </span>
                  <span className="text-amber-400 font-semibold">Latency: 142ms</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Char Index: <strong className="text-emerald-400">{speechCharIndex}..{speechCharTotal}</strong></span>
                  <span>Audio Sync: WebAudio Active</span>
                </div>
                <div className="text-zinc-400 truncate mt-1">
                  Live JSON: {JSON.stringify({ id: currentSlide.id, category: currentSlide.category, timeMsRange: currentSlide.timeMsRange, durationSec: currentSlide.durationSeconds })}
                </div>
              </div>
            )}
          </div>

          {/* Audio Waveform Scrubber & Controls */}
          <div className="mt-5 flex flex-col gap-3.5 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            {/* Fluid Audio Visualizer Bars */}
            <div className="flex h-8 items-end gap-1 px-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const heightPct = Math.min(
                  100,
                  Math.max(15, Math.sin(i * 0.4) * 45 + Math.cos(i * 0.8) * 35 + 50)
                );
                const isActive = (i / 40) * 90 <= currentTimeSeconds;
                return (
                  <div
                    key={i}
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      isActive
                        ? isPlaying
                          ? "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm animate-pulse"
                          : "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm"
                        : "bg-zinc-800"
                    }`}
                  />
                );
              })}
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={onTogglePlay}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
                      : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                  }`}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 fill-current" />
                      <span>Pause Pitch Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Play Pitch Video</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onSeekTime(0)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 transition-all duration-200 hover:scale-105"
                  title="Rewind to 00:00"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              {/* Speed & Voice Selectors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>Speed:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => onChangeSpeed(Number(e.target.value))}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200 focus:outline-none"
                  >
                    <option value={1.0}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>Voice:</span>
                  <select
                    value={selectedVoice.id}
                    onChange={(e) => {
                      const found = MOCK_VOICE_PROFILES.find((v) => v.id === e.target.value);
                      if (found) onSelectVoice(found);
                    }}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none"
                  >
                    {MOCK_VOICE_PROFILES.map((vp) => (
                      <option key={vp.id} value={vp.id}>
                        {vp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2: Auto-Script & Slide Storyboard Engine */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 p-6 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700/80 hover:scale-[1.005]">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                2. Pitch Storyboard
              </h3>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                4 core timestamped sections (90s structure)
              </span>
            </div>
            <span className="font-mono text-[10px] bg-zinc-950 px-2 py-0.5 rounded text-zinc-300 border border-zinc-800">
              4 Slides
            </span>
          </div>

          {/* 4 Core Slides Selector Stack */}
          <div className="mt-5 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[480px] pr-1">
            {slides.map((s, idx) => {
              const isSelected = activeSlideIndex === idx;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                    isSelected
                      ? "border-zinc-700 bg-zinc-950 ring-1 ring-zinc-700 shadow-md"
                      : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded transition-all duration-300 ${
                          isSelected ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        0{s.number}
                      </span>
                      <span className="text-xs font-bold text-zinc-200">{s.category} Slide</span>
                    </div>

                    <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                      {s.timeRange}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-zinc-100 leading-tight">
                    {s.title}
                  </h4>

                  {/* Editable Script snippet */}
                  <textarea
                    value={s.scriptText}
                    onChange={(e) => handleSlideContentEdit(idx, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    rows={2}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 font-sans text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none resize-none"
                  />

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>
                      Est. {Math.round((s.scriptText.split(/\s+/).length / 145) * 60)}s reading time
                    </span>
                    <span>{s.scriptText.split(/\s+/).length} Words</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expert Mode Overlay Panel for Card 3 */}
          {isExpertMode && (
            <div className="mt-4 rounded-xl bg-zinc-950 p-3.5 font-mono text-[11px] text-emerald-400 border border-zinc-800 backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
                <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">
                  ⚡ [EXPERT MODE OVERLAY] Card 3 Storyboard Telemetry
                </span>
                <span className="text-[10px] text-amber-400 font-semibold">Latency: 142ms</span>
              </div>
              <div className="flex flex-col gap-1 text-[10px] text-zinc-300">
                <div className="flex justify-between">
                  <span>Speech Char Index: <strong className="text-emerald-400">{speechCharIndex}..{speechCharTotal}</strong></span>
                  <span>Active Index: {activeSlideIndex + 1}/{slides.length}</span>
                </div>
                <div className="overflow-x-auto text-[10px] text-zinc-400 truncate">
                  Raw JSON: {JSON.stringify({ activeSlideIndex, totalSlides: slides.length, currentScriptWords: currentSlide.scriptText.split(/\s+/).length })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
