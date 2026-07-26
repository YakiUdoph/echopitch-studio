"use client";

import React, { useState } from "react";
import { ScriptItem, VoiceProfile, MOCK_VOICE_PROFILES } from "../lib/mockData";
import { Tooltip } from "./Tooltip";
import {
  FileText,
  Clock,
  Play,
  Pause,
  Edit3,
  Headphones,
  BarChart2
} from "lucide-react";

interface ScriptInspectorProps {
  scriptItems: ScriptItem[];
  onUpdateScriptItems: (items: ScriptItem[]) => void;
  activeScriptId?: string;
  onSelectScriptItem: (item: ScriptItem) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTimeSeconds: number;
  onSeekTime: (timeSeconds: number) => void;
  selectedVoice: VoiceProfile;
  onSelectVoice: (voice: VoiceProfile) => void;
  isExpertMode: boolean;
}

export const ScriptInspector: React.FC<ScriptInspectorProps> = ({
  scriptItems,
  onUpdateScriptItems,
  activeScriptId,
  onSelectScriptItem,
  isPlaying,
  onTogglePlay,
  currentTimeSeconds,
  onSeekTime,
  selectedVoice,
  onSelectVoice,
  isExpertMode
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartEdit = (item: ScriptItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const handleSaveEdit = (id: string) => {
    const updated = scriptItems.map((item) =>
      item.id === id ? { ...item, text: editText } : item
    );
    onUpdateScriptItems(updated);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-cyan-100 flex items-center gap-2">
              Script & Telemetry Inspector
            </h2>
            <span className="text-xs text-zinc-400 block">
              Side-by-side pitch script editor with <Tooltip termKey="Slide Timestamps">slide transition markers</Tooltip> & voice controls
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-cyan-300 font-bold bg-zinc-950 px-3 py-1.5 rounded-lg border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
            Playback: {formatTime(currentTimeSeconds)} / 01:30
          </span>
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]"
                : "bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_28px_rgba(6,182,212,0.65)]"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>Pause Speech</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Play Speech Synthesis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Controls Panel & Telemetry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Synthetic Voice Selector */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <h3 className="text-xs font-extrabold text-cyan-100">
                Synthetic Voice Model Settings
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-500/30">
              <Tooltip termKey="SpeechSynthesis">SpeechSynthesis API</Tooltip>
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-300">
                Selected Vocal Profile
              </label>
              <select
                value={selectedVoice.id}
                onChange={(e) => {
                  const found = MOCK_VOICE_PROFILES.find((v) => v.id === e.target.value);
                  if (found) onSelectVoice(found);
                }}
                className="w-full rounded-xl border border-cyan-500/30 bg-zinc-950 px-3 py-2 text-xs font-semibold text-cyan-100 focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                {MOCK_VOICE_PROFILES.map((vp) => (
                  <option key={vp.id} value={vp.id}>
                    {vp.name} ({vp.accent})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                {selectedVoice.description}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Metrics Card */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <h3 className="text-xs font-extrabold text-cyan-100">
                Pacing & Cadence Telemetry
              </h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 font-semibold">
              Standard WPM: 145 - 155
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="flex flex-col rounded-xl bg-zinc-950/80 p-3 border border-cyan-500/20">
              <span className="text-[10px] font-semibold text-zinc-400">Total Words</span>
              <span className="mt-1 text-lg font-black text-cyan-100">
                {scriptItems.reduce((acc, item) => acc + item.text.split(/\s+/).length, 0)}
              </span>
            </div>

            <div className="flex flex-col rounded-xl bg-zinc-950/80 p-3 border border-cyan-500/20">
              <span className="text-[10px] font-semibold text-zinc-400">Est. Duration</span>
              <span className="mt-1 text-lg font-black text-cyan-400">
                90s
              </span>
            </div>

            <div className="flex flex-col rounded-xl bg-zinc-950/80 p-3 border border-cyan-500/20">
              <span className="text-[10px] font-semibold text-zinc-400">Target Pace</span>
              <span className="mt-1 text-lg font-black text-cyan-400">
                148 WPM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Script Editor with Timecodes */}
      <div className="flex flex-col gap-4 rounded-2xl glass-panel glass-panel-hover p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <h3 className="text-xs font-extrabold text-cyan-100 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            Synchronized Timecode Script Blocks
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">
            Click block to seek audio timeline
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {scriptItems.map((item) => {
            const isCurrentlyActive =
              currentTimeSeconds >= item.startTimeSec && currentTimeSeconds < item.endTimeSec;

            return (
              <div
                key={item.id}
                onClick={() => {
                  onSeekTime(item.startTimeSec);
                  onSelectScriptItem(item);
                }}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.005] ${
                  isCurrentlyActive
                    ? "border-cyan-400/70 bg-cyan-950/40 ring-1 ring-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.25)]"
                    : "border-cyan-500/20 bg-zinc-950/60 hover:border-cyan-400/40 hover:bg-zinc-900/80"
                }`}
              >
                {/* Time & Emotion Badges */}
                <div className="flex items-center gap-3 shrink-0 mb-2 sm:mb-0">
                  <div
                    className={`flex flex-col items-center justify-center rounded-lg px-3 py-1 font-mono text-xs ${
                      isCurrentlyActive
                        ? "bg-cyan-600 text-white font-bold shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span>{item.timeRange}</span>
                    {isExpertMode && (
                      <span className="text-[9px] opacity-75">{item.startTimeMs}ms</span>
                    )}
                  </div>

                  <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase border border-cyan-500/30">
                    {item.emotion}
                  </span>
                </div>

                {/* Text Content */}
                <div className="flex-1 px-0 sm:px-4 w-full">
                  {editingId === item.id ? (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 rounded-lg border border-cyan-500/40 bg-zinc-900 px-3 py-1 text-xs text-cyan-100 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveEdit(item.id)}
                        className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isCurrentlyActive ? "text-cyan-100 font-bold" : "text-zinc-300"
                      }`}
                    >
                      {item.text}
                    </p>
                  )}
                </div>

                {/* Edit Action & Telemetry */}
                <div
                  className="flex items-center gap-3 shrink-0 mt-2 sm:mt-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="font-mono text-[11px] text-cyan-400/80">
                    {item.targetPaceWpm} WPM
                  </span>
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="p-1 text-zinc-400 hover:text-cyan-300 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expert Mode Overlay Panel */}
        {isExpertMode && (
          <div className="mt-4 rounded-xl bg-zinc-950 p-3.5 font-mono text-[11px] text-cyan-300 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5 mb-1.5">
              <span className="font-bold text-[10px] text-cyan-400 uppercase tracking-wider">
                ⚡ [EXPERT MODE OVERLAY] Script Telemetry Payload
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">Latency: 142ms</span>
            </div>
            <div className="flex flex-col gap-1 text-[10px] text-zinc-300">
              <div className="flex justify-between">
                <span>Active Voice: <strong className="text-cyan-400">{selectedVoice.name}</strong></span>
                <span>Script Blocks: {scriptItems.length}</span>
              </div>
              <div className="overflow-x-auto text-[10px] text-zinc-400 truncate">
                Raw JSON: {JSON.stringify({ voiceId: selectedVoice.id, activeScriptId, isPlaying })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

