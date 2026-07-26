"use client";

import React, { useState } from "react";
import { OkxAspPayload, Slide } from "../lib/mockData";
import { Tooltip } from "./Tooltip";
import {
  X,
  Copy,
  Check,
  Download,
  FileText,
  Video,
  Layers,
  Cpu,
  Share2
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  aspPayload: OkxAspPayload;
  slides: Slide[];
  scriptText: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  aspPayload,
  slides,
  scriptText
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(aspPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleDownloadAspJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(aspPayload, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `${aspPayload.skill_id}_okx_asp_spec.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadScriptMd = () => {
    const element = document.createElement("a");
    const content = `# EchoPitch AI Studio - Pitch Script & Telemetry\n\n` +
      `**Skill ID:** ${aspPayload.skill_id}\n` +
      `**Total Duration:** 90 Seconds\n\n` +
      `---\n\n` +
      scriptText;
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${aspPayload.skill_id}_script_telemetry.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadSlidesJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(slides, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `${aspPayload.skill_id}_slides_deck.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSimulateVideoExport = () => {
    setIsExportingVideo(true);
    setExportProgress(10);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExportingVideo(false);

          const element = document.createElement("a");
          const file = new Blob([`EchoPitch Studio Video Export - ${aspPayload.name}\n\n` + scriptText], {
            type: "text/plain"
          });
          element.href = URL.createObjectURL(file);
          element.download = `${aspPayload.skill_id}_demo_video.webm`;
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);

          return 100;
        }
        return prev + 18;
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] border-cyan-500/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-cyan-100 flex items-center gap-2">
                OKX.AI Skill Package (ASP) & Tangible Export Center
              </h3>
              <p className="text-xs text-zinc-400">
                Download pitch scripts (.md), slides deck (.json), or copy standardized OKX ASP payload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option 1: Copy & Download OKX ASP Payload */}
          <div className="flex flex-col justify-between rounded-xl glass-panel glass-panel-hover p-6">
            <div>
              <div className="flex items-center justify-between">
                <Cpu className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  OKX.AI Spec
                </span>
              </div>
              <h4 className="mt-3 text-xs font-bold text-cyan-100">
                OKX ASP JSON Payload
              </h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Standardized agentic skill payload for listing on <Tooltip termKey="OKX.AI Marketplace">OKX.AI</Tooltip>
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleDownloadAspJson}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:bg-cyan-500 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download ASP Spec (.json)</span>
              </button>
              <button
                onClick={handleCopyPayload}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                {copiedPayload ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedPayload ? "Copied JSON!" : "Copy ASP JSON"}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Render Demo Video */}
          <div className="flex flex-col justify-between rounded-xl glass-panel glass-panel-hover p-6">
            <div>
              <div className="flex items-center justify-between">
                <Video className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  WebM / MP4
                </span>
              </div>
              <h4 className="mt-3 text-xs font-bold text-cyan-100">
                Render Demo Video
              </h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Client-side video render using <Tooltip termKey="FFmpeg WASM">FFmpeg WASM</Tooltip> canvas stitching
              </span>

              {isExportingVideo && (
                <div className="mt-3 flex flex-col gap-1">
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${exportProgress}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Stitching Canvas Frames... {exportProgress}%
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateVideoExport}
              disabled={isExportingVideo}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-cyan-500/30 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-zinc-800 hover:border-cyan-400/50 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 text-cyan-400" />
              <span>{isExportingVideo ? "Stitching Video..." : "Download Pitch Video"}</span>
            </button>
          </div>

          {/* Option 3: Export Deck Slides & Script */}
          <div className="flex flex-col justify-between rounded-xl glass-panel glass-panel-hover p-6">
            <div>
              <div className="flex items-center justify-between">
                <Layers className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                  JSON & MD
                </span>
              </div>
              <h4 className="mt-3 text-xs font-bold text-cyan-100">
                Export Deck Assets & Script
              </h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Download structured slides (.json) or pitch script telemetry (.md)
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleDownloadSlidesJson}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download Slides (.json)</span>
              </button>
              <button
                onClick={handleDownloadScriptMd}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download Script (.md)</span>
              </button>
            </div>
          </div>
        </div>

        {/* JSON Preview Drawer */}
        <div className="mt-6 rounded-xl border border-cyan-500/20 bg-zinc-950 p-4">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
            <span className="font-mono text-xs font-bold text-cyan-400">
              Raw ASP JSON Definition (okx_asp_v1.2.json)
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">OKB Fee: 0.0005 OKB / execution</span>
          </div>
          <pre className="mt-2 max-h-40 overflow-y-auto font-mono text-[11px] leading-relaxed text-cyan-100">
            {JSON.stringify(aspPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

