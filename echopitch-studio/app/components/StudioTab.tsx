"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Code2,
  Disc,
  Edit3,
  Check
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
  pitchDuration?: number;
  onFetchGithubRepo?: (url: string) => void;
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
  speechCharTotal = 140,
  pitchDuration = 90,
  onFetchGithubRepo
}) => {
  const [inputMode, setInputMode] = useState<"github" | "paste">("paste");
  const [isSourceMarkdownOpen, setIsSourceMarkdownOpen] = useState<boolean>(false);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState<boolean>(false);
  const [isInlineEditing, setIsInlineEditing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const currentSlide = slides[activeSlideIndex] || slides[0];

  // Feature 3: Canvas stream & MediaRecorder video recorder
  useEffect(() => {
    if (isPlaying && isRecordingEnabled && canvasRef.current) {
      try {
        const stream = canvasRef.current.captureStream(30);
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        recordedChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordedChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `echopitch_${currentSlide.title.replace(/[^a-zA-Z0-9]/g, "_")}.webm`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      } catch (e) {
        console.error("MediaRecorder capture error:", e);
      }
    } else if (!isPlaying && mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [isPlaying, isRecordingEnabled]);

  // Render live slide frame onto canvasRef for recording
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header badge
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`SLIDE 0${currentSlide.number} | ${currentSlide.category.toUpperCase()}`, 30, 45);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(currentSlide.title, 30, 85);

    // Subtitle
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "14px sans-serif";
    ctx.fillText(currentSlide.subtitle, 30, 115);

    // Bullet points
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "14px sans-serif";
    currentSlide.content.forEach((bullet, idx) => {
      ctx.fillText(`• ${bullet}`, 40, 160 + idx * 35);
    });

    // Draw audio visualizer bars at the bottom
    const barCount = 30;
    const barWidth = 12;
    ctx.fillStyle = "#10b981";
    for (let i = 0; i < barCount; i++) {
      const h = Math.abs(Math.sin(currentTimeSeconds * 2 + i * 0.3)) * 40 + 10;
      ctx.fillRect(30 + i * (barWidth + 4), canvas.height - 30 - h, barWidth, h);
    }
  }, [currentSlide, currentTimeSeconds, isPlaying]);

  // Feature 2: Inline Script & Slide Title/Bullet Edit handlers
  const handleScriptChange = (slideIndex: number, newScript: string) => {
    const updated = slides.map((s, idx) =>
      idx === slideIndex ? { ...s, scriptText: newScript } : s
    );
    onUpdateSlides(updated);
  };

  const handleTitleChange = (slideIndex: number, newTitle: string) => {
    const updated = slides.map((s, idx) =>
      idx === slideIndex ? { ...s, title: newTitle } : s
    );
    onUpdateSlides(updated);
  };

  const handleBulletChange = (slideIndex: number, bulletIdx: number, newBullet: string) => {
    const updated = slides.map((s, idx) => {
      if (idx !== slideIndex) return s;
      const content = [...s.content];
      content[bulletIdx] = newBullet;
      return { ...s, content };
    });
    onUpdateSlides(updated);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto">
      {/* Hidden HTML5 Canvas for Stream Recording */}
      <canvas ref={canvasRef} width={800} height={450} className="hidden" />

      {/* Step-by-Step Processing Overlay when parsing */}
      {isProcessing && (
        <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-5 w-5 animate-spin" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                Processing GitHub README with LLM Reasoner...
              </h4>
              <p className="text-xs text-emerald-400 font-mono mt-0.5">
                {processingStep || "Extracting Problem, Solution & Architecture..."}
              </p>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse w-3/4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature 1: Collapsible Ingestion & Markdown AI Parser Panel */}
      <div className="flex flex-col rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-black text-cyan-100">
                1. Ingestion & Markdown AI Parser
              </h2>
              <span className="text-xs font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                LLM Parser
              </span>
            </div>
            <span className="text-xs text-zinc-400 mt-1 block">
              Extracts problem statement, solution & architecture from repository Markdown
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Collapse / Expand Source Markdown Panel Button */}
            <button
              onClick={() => setIsSourceMarkdownOpen(!isSourceMarkdownOpen)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/90 border border-cyan-500/30 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-zinc-800 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer"
            >
              <Code2 className="h-4 w-4 text-cyan-400" />
              <span>{isSourceMarkdownOpen ? "Hide Markdown Editor" : "Source Markdown Editor"}</span>
              {isSourceMarkdownOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Glowing Gradient Action Button */}
            <button
              onClick={onRunAiParser}
              disabled={isProcessing}
              className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_28px_rgba(6,182,212,0.6)] disabled:opacity-50 transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-cyan-100" />
              <span>Parse & Generate Deck</span>
            </button>
          </div>
        </div>

        {/* Prominent Hero Input Bar */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => onUpdateGithubUrl(e.target.value)}
                placeholder="Enter GitHub Repo URL (e.g. https://github.com/echopitch/x-vault-ai)"
                className="w-full rounded-xl border border-cyan-500/30 bg-zinc-950/90 px-4 py-3 font-mono text-xs text-cyan-100 placeholder-zinc-500 focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)] focus:outline-none transition-all shadow-inner"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
                GitHub API
              </span>
            </div>

            <button
              onClick={() => {
                if (onFetchGithubRepo) {
                  onFetchGithubRepo(githubUrl);
                } else {
                  onRunAiParser();
                }
              }}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-6 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.65)] disabled:opacity-50 transition-all duration-300 hover:scale-105 shrink-0 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Fetch & Parse Repo ({pitchDuration}s)</span>
            </button>
          </div>

          {/* Quick-Select Demo Presets Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Try:
            </span>
            <button
              onClick={() => {
                onUpdateGithubUrl("https://github.com/echopitch/x-vault-ai");
                if (onFetchGithubRepo) onFetchGithubRepo("https://github.com/echopitch/x-vault-ai");
              }}
              className="rounded-lg bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              ⚡ X-Vault AI
            </button>
            <button
              onClick={() => {
                onUpdateGithubUrl("https://github.com/echopitch/neurogrid-asp");
                if (onFetchGithubRepo) onFetchGithubRepo("https://github.com/echopitch/neurogrid-asp");
              }}
              className="rounded-lg bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              🚀 NeuroGrid ASP
            </button>
            <button
              onClick={() => {
                onUpdateGithubUrl("https://github.com/echopitch/defi-yield-engine");
                if (onFetchGithubRepo) onFetchGithubRepo("https://github.com/echopitch/defi-yield-engine");
              }}
              className="rounded-lg bg-zinc-900 px-2.5 py-1 font-mono text-[11px] font-semibold text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
            >
              🔥 YieldPulse Engine
            </button>
          </div>
        </div>

        {/* Collapsible Input Drawer Body */}
        {isSourceMarkdownOpen && (
          <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col gap-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Direct Source Markdown Editor
              </span>
            </div>

            <textarea
              value={readmeText}
              onChange={(e) => onUpdateReadmeText(e.target.value)}
              placeholder="Paste raw README markdown text here..."
              className="h-36 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 p-4 font-mono text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>
        )}
      </div>

      {/* Main Workspace Split: Live Video Simulator + Pitch Storyboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Feature 3: Browser-Native Audio & Slide Preview Canvas Stage */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl overflow-hidden relative">
          {/* Stage Header */}
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <h3 className="text-xs font-extrabold text-cyan-100">
                Live Visual Slide Render Stage
              </h3>
              <span className="text-[10px] italic text-zinc-400">
                *(Canvas, <Tooltip termKey="Web Audio Sync">Web Audio Sync</Tooltip> & <Tooltip termKey="FFmpeg WASM">FFmpeg WASM</Tooltip>)*
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsInlineEditing(!isInlineEditing)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isInlineEditing
                    ? "bg-cyan-950/80 text-cyan-300 border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "bg-zinc-900 text-zinc-300 border-cyan-500/20 hover:bg-zinc-800 hover:text-cyan-200"
                }`}
              >
                {isInlineEditing ? <Check className="h-3.5 w-3.5" /> : <Edit3 className="h-3.5 w-3.5" />}
                <span>{isInlineEditing ? "Done Editing" : "Inline Edit Slide"}</span>
              </button>

              <span className="font-mono text-xs text-cyan-300 font-bold bg-zinc-950 px-2.5 py-1 rounded border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                {Math.floor(currentTimeSeconds / 60)}:
                {(currentTimeSeconds % 60).toString().padStart(2, "0")} / {Math.floor(pitchDuration / 60)}:{(pitchDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Live Slide Stage Canvas Box */}
          <div className="relative mt-5 flex-1 min-h-[380px] rounded-xl border border-cyan-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 flex flex-col justify-center items-center overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
            {/* Background Glow */}
            <div
              className={`absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/20 opacity-25 blur-3xl pointer-events-none transition-all duration-700`}
            />

            {/* Slide Content Box */}
            <div className="relative z-10 w-full max-w-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-cyan-950/80 border border-cyan-500/40 px-3 py-0.5 text-xs font-bold text-cyan-300 uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  Slide 0{currentSlide.number} | {currentSlide.category} ({currentSlide.timeRange})
                </span>
                {isExpertMode && (
                  <span className="font-mono text-[10px] text-amber-400 bg-zinc-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    MS Range: {currentSlide.timeMsRange}
                  </span>
                )}
              </div>

              <div>
                {isInlineEditing ? (
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => handleTitleChange(activeSlideIndex, e.target.value)}
                    className="w-full text-2xl font-extrabold bg-zinc-950 text-cyan-100 border border-cyan-400/50 rounded p-1 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  />
                ) : (
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    {currentSlide.title}
                  </h2>
                )}
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-300">
                  {currentSlide.subtitle}
                </p>
              </div>

              {/* Bullet Points */}
              <div className="flex flex-col gap-2.5 rounded-xl border border-cyan-500/20 bg-zinc-950/80 p-5 backdrop-blur-md">
                {currentSlide.content.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-400 font-mono text-[10px] font-bold border border-cyan-500/40 shadow-[0_0_6px_rgba(6,182,212,0.4)]">
                      {i + 1}
                    </span>
                    {isInlineEditing ? (
                      <input
                        type="text"
                        value={bullet}
                        onChange={(e) => handleBulletChange(activeSlideIndex, i, e.target.value)}
                        className="flex-1 bg-zinc-950 text-xs text-cyan-200 border border-cyan-500/40 rounded px-2 py-1"
                      />
                    ) : (
                      <span>{bullet}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audio Waveform Scrubber & Controls */}
          <div className="mt-5 flex flex-col gap-3.5 rounded-xl border border-cyan-500/20 bg-zinc-950 p-4">
            {/* Feature 4: Dynamic Web Audio Frequency Waveform Visualizer */}
            <div className="flex h-8 items-end gap-1 px-1">
              {Array.from({ length: 40 }).map((_, i) => {
                const heightPct = isPlaying
                  ? Math.min(100, Math.max(20, Math.sin(currentTimeSeconds * 3 + i * 0.4) * 45 + Math.cos(i * 0.8) * 35 + 50))
                  : Math.max(15, Math.sin(i * 0.4) * 25 + 30);
                const isActive = (i / 40) * pitchDuration <= currentTimeSeconds;
                return (
                  <div
                    key={i}
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all duration-300 ${
                      isActive
                        ? isPlaying
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"
                          : "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
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
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all duration-300 hover:scale-105 cursor-pointer ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]"
                      : "bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.65)]"
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
                  className="rounded-xl border border-cyan-500/20 bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-cyan-300 transition-all duration-200 hover:scale-105 cursor-pointer"
                  title="Rewind to 00:00"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                {/* Feature 3: MediaRecorder Recording Toggle Button */}
                <button
                  onClick={() => setIsRecordingEnabled(!isRecordingEnabled)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isRecordingEnabled
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                      : "bg-zinc-900 text-zinc-400 border-cyan-500/20 hover:text-zinc-200"
                  }`}
                  title="Capture live stream into downloadable .webm video"
                >
                  <Disc className={`h-4 w-4 ${isRecordingEnabled ? "text-rose-400" : "text-zinc-400"}`} />
                  <span>{isRecordingEnabled ? "Recording .webm" : "Record Video"}</span>
                </button>
              </div>

              {/* Speed & Voice Selectors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span>Speed:</span>
                  <select
                    value={playbackSpeed}
                    onChange={(e) => onChangeSpeed(Number(e.target.value))}
                    className="rounded-lg border border-cyan-500/20 bg-zinc-900 px-2 py-1 font-mono text-xs text-zinc-200 focus:outline-none cursor-pointer"
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
                    className="rounded-lg border border-cyan-500/20 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 focus:outline-none cursor-pointer"
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

        {/* Feature 2: Auto-Script & Slide Storyboard Engine with Inline Editable Text */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
            <div>
              <h3 className="text-xs font-extrabold text-cyan-100">
                2. Pitch Storyboard & Voice Script
              </h3>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Inline edit script text below (updates Web Speech API in real-time)
              </span>
            </div>
            <span className="font-mono text-[10px] bg-cyan-950 px-2 py-0.5 rounded text-cyan-300 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
              {slides.length} Slides
            </span>
          </div>

          {/* Slides Storyboard Stack with Inline Script Textarea */}
          <div className="mt-5 flex flex-col gap-4 flex-1 overflow-y-auto max-h-[520px] pr-1">
            {slides.map((s, idx) => {
              const isSelected = activeSlideIndex === idx;
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`flex flex-col gap-2 rounded-xl border p-4 transition-all duration-300 cursor-pointer hover:scale-[1.01] ${
                    isSelected
                      ? "border-cyan-400/70 bg-cyan-950/40 ring-1 ring-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                      : "border-cyan-500/20 bg-zinc-950/60 hover:border-cyan-400/40 hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded transition-all duration-300 ${
                          isSelected ? "bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        0{s.number}
                      </span>
                      <span className="text-xs font-bold text-zinc-200">{s.category} Slide</span>
                    </div>

                    <span className="font-mono text-[11px] text-cyan-400 font-semibold">
                      {s.timeRange}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-zinc-100 leading-tight">
                    {s.title}
                  </h4>

                  {/* Inline Editable Script Textarea */}
                  <div className="mt-1 flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Editable Voice Speech Text:
                    </span>
                    <textarea
                      value={s.scriptText}
                      onChange={(e) => handleScriptChange(idx, e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-sans text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
