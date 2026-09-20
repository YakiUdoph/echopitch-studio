"use client";

import React, { useState } from "react";
import { Slide } from "../lib/mockData";
import { Tooltip } from "./Tooltip";
import { X, Download, FileText, Video, Layers, Share2 } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  scriptText: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, slides, scriptText }) => {
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const download = (content: BlobPart, type: string, filename: string) => {
    const element = document.createElement("a");
    const objectUrl = URL.createObjectURL(new Blob([content], { type }));
    element.href = objectUrl;
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(objectUrl);
  };

  const handleDownloadScriptMd = () => download(
    `# EchoPitch Studio - Pitch Script & Telemetry\n\n${scriptText}`,
    "text/markdown",
    "echopitch-script-telemetry.md"
  );

  const handleDownloadSlidesJson = () => download(
    JSON.stringify(slides, null, 2),
    "application/json",
    "echopitch-slides-deck.json"
  );

  const handleSimulateVideoExport = () => {
    setIsExportingVideo(true);
    setExportProgress(10);
    const interval = window.setInterval(() => {
      setExportProgress((previous) => {
        if (previous >= 100) {
          window.clearInterval(interval);
          setIsExportingVideo(false);
          download(`EchoPitch Studio Video Export\n\n${scriptText}`, "text/plain", "echopitch-demo-video.webm");
          return 100;
        }
        return previous + 18;
      });
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4 animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl glass-panel p-6 shadow-[0_0_40px_rgba(6,182,212,0.15)] border-cyan-500/30 overflow-hidden">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-cyan-100">Tangible Export Center</h3>
              <p className="text-xs text-zinc-400">Download pitch scripts, slide decks, or a local preview artifact.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-cyan-300 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-between rounded-xl glass-panel glass-panel-hover p-6">
            <div>
              <Video className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <h4 className="mt-3 text-xs font-bold text-cyan-100">Render Demo Video</h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">
                Local preview export using <Tooltip termKey="FFmpeg WASM">FFmpeg WASM</Tooltip> canvas stitching.
              </span>
              {isExportingVideo && (
                <div className="mt-3 flex flex-col gap-1">
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div style={{ width: `${exportProgress}%` }} className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300" />
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Stitching Canvas Frames... {exportProgress}%</span>
                </div>
              )}
            </div>
            <button onClick={handleSimulateVideoExport} disabled={isExportingVideo} className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-zinc-900 border border-cyan-500/30 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-zinc-800 hover:border-cyan-400/50 disabled:opacity-50 transition-all cursor-pointer">
              <Download className="h-4 w-4 text-cyan-400" />
              <span>{isExportingVideo ? "Stitching Video..." : "Download Pitch Video"}</span>
            </button>
          </div>

          <div className="flex flex-col justify-between rounded-xl glass-panel glass-panel-hover p-6">
            <div>
              <Layers className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              <h4 className="mt-3 text-xs font-bold text-cyan-100">Export Deck Assets & Script</h4>
              <span className="mt-1 text-[11px] text-zinc-400 leading-relaxed block">Download structured slides (.json) or pitch script telemetry (.md).</span>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={handleDownloadSlidesJson} className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-zinc-800 transition-all cursor-pointer">
                <Download className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download Slides (.json)</span>
              </button>
              <button onClick={handleDownloadScriptMd} className="flex items-center justify-center gap-1.5 rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-zinc-800 transition-all cursor-pointer">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                <span>Download Script (.md)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
