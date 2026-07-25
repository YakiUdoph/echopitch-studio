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

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSimulateVideoExport = () => {
    setIsExportingVideo(true);
    setExportProgress(10);
    const interval = setInterval(() => {
      setExportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExportingVideo(false);

          // Create dummy webm text file download
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

  const handleExportSlidesPng = () => {
    // Generate text blob for slides PNG manifest
    const element = document.createElement("a");
    const content = slides
      .map((s) => `SLIDE ${s.number}: ${s.title}\nCategory: ${s.category}\n${s.content.join("\n")}`)
      .join("\n\n---\n\n");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${aspPayload.skill_id}_slides_deck.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400 border border-zinc-700/80">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
                OKX.AI Skill Package (ASP) & Export Center
              </h3>
              <p className="text-xs text-zinc-400">
                Export pitch video, slide PNG bundle, or copy standardized marketplace JSON payload
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Option 1: Copy OKX ASP Payload */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-zinc-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <Cpu className="h-5 w-5 text-emerald-400" />
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-zinc-800">
                  OKX.AI Spec
                </span>
              </div>
              <h4 className="mt-3 text-xs font-bold text-zinc-200">
                OKX ASP JSON Payload
              </h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Standardized agentic skill payload for listing on <Tooltip termKey="OKX.AI Marketplace">OKX.AI</Tooltip>
              </span>
            </div>

            <button
              onClick={handleCopyPayload}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
            >
              {copiedPayload ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Copied OKX Payload!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy OKX ASP Payload</span>
                </>
              )}
            </button>
          </div>

          {/* Option 2: Render Demo Video */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-zinc-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <Video className="h-5 w-5 text-indigo-400" />
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-indigo-400 border border-zinc-800">
                  WebM / MP4
                </span>
              </div>
              <h4 className="mt-3 text-xs font-bold text-zinc-200">
                Render 90s Pitch Video
              </h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Client-side video render using <Tooltip termKey="FFmpeg WASM">FFmpeg WASM</Tooltip> canvas stitching
              </span>

              {isExportingVideo && (
                <div className="mt-3 flex flex-col gap-1">
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${exportProgress}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-300"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Stitching Canvas Frames... {exportProgress}%
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateVideoExport}
              disabled={isExportingVideo}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 disabled:opacity-50 transition-all"
            >
              <Download className="h-4 w-4 text-emerald-400" />
              <span>{isExportingVideo ? "Stitching Video..." : "Download 90s Video"}</span>
            </button>
          </div>

          {/* Option 3: Export Deck Slides & Script */}
          <div className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 hover:border-zinc-700 transition-all">
            <div>
              <div className="flex items-center justify-between">
                <Layers className="h-5 w-5 text-purple-400" />
                <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-purple-400 border border-zinc-800">
                  PNG & Script
                </span>
              </div>
              <h4 className="mt-3 text-xs font-bold text-zinc-200">
                Export Deck Assets & Script
              </h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Download 4 high-res slide deck images or copy raw 90-second pitch text
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={handleExportSlidesPng}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Slide PNGs</span>
              </button>
              <button
                onClick={handleCopyScript}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all"
              >
                {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <FileText className="h-3.5 w-3.5" />}
                <span>{copiedScript ? "Copied Script!" : "Copy Pitch Script Text"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* JSON Preview Drawer */}
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="font-mono text-xs font-bold text-emerald-400">
              Raw ASP JSON Definition (okx_asp_v1.2.json)
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">OKB Fee: 0.0005 OKB / execution</span>
          </div>
          <pre className="mt-2 max-h-40 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-300">
            {JSON.stringify(aspPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
