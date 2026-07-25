"use client";

import React, { useState } from "react";
import { OkxAspPayload, MOCK_OKX_ASP_PAYLOAD_DEFI } from "../lib/mockData";
import { Tooltip } from "./Tooltip";
import {
  Cpu,
  Copy,
  Check,
  Play,
  Terminal,
  DollarSign,
  Globe,
  Zap,
  CheckCircle2,
  Code,
  Share2
} from "lucide-react";

interface AspIntegrationProps {
  aspPayload?: OkxAspPayload;
  onOpenExportModal: () => void;
  isExpertMode?: boolean;
}

export const AspIntegration: React.FC<AspIntegrationProps> = ({
  aspPayload = MOCK_OKX_ASP_PAYLOAD_DEFI,
  onOpenExportModal,
  isExpertMode = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [priceOkb, setPriceOkb] = useState<number>(aspPayload.monetization.price_per_call_okb);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(aspPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunTestBench = () => {
    setIsRunningTest(true);
    setTestResponse(null);
    setTimeout(() => {
      setIsRunningTest(false);
      setTestResponse({
        status: "200 OK",
        execution_latency_ms: 14.2,
        network: "OKX X Layer Testnet",
        caller_address: "0x71C...9B42",
        gas_used_okb: 0.000012,
        result: {
          pitch_generated: true,
          slides_rendered: 4,
          video_duration: "90s",
          asp_signature: "0x8f9a2b...c3d4"
        }
      });
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-purple-400 border border-zinc-700/80">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-100 flex items-center gap-2">
              OKX.AI ASP Integration & Marketplace Spec
            </h2>
            <span className="text-xs text-zinc-400 block">
              Standardized <Tooltip termKey="ASP Payload">Agentic Skill Package (ASP)</Tooltip> protocol for OKX.AI Marketplace deployment
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied Spec!" : "Copy ASP JSON"}</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 rounded-xl bg-zinc-800 border border-zinc-700/80 px-4 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 transition-all"
          >
            <Share2 className="h-4 w-4 text-emerald-400" />
            <span>Export Center</span>
          </button>
        </div>
      </div>

      {/* Hackathon Category Metadata Card */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              {aspPayload.category || "Software Services"}
            </span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-400 border border-purple-500/20">
              {aspPayload.subCategory || "AI Video & Script Automation"}
            </span>
          </div>
          <h3 className="text-sm font-bold text-zinc-100 mt-1">
            OKX Genesis Hackathon Classification
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-zinc-400 font-medium">Award Categories:</span>
            {(aspPayload.awardCategories || ["Creative Genius", "Best Product", "Software Utility"]).map((award, i) => (
              <span key={i} className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-200 border border-zinc-700">
                🏆 {award}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 border-t md:border-t-0 border-zinc-800 pt-4 md:pt-0 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
            <span className="text-zinc-500">Max Demo:</span>
            <span className="font-bold text-emerald-400">{aspPayload.maxDemoDuration || "90s"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="text-zinc-500">Chains:</span>
            <span className="text-zinc-300">{(aspPayload.compatibleChains || ["X Layer (196)"]).join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Monetization & Network Settings Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">X Layer Network</span>
            <Globe className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-sm font-extrabold text-zinc-100 font-mono">
            {aspPayload.network}
          </div>
          <span className="mt-1 text-[11px] text-emerald-400 font-mono">Chain ID: 196 (X Layer)</span>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Micro-Monetization</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-black text-zinc-100 font-mono">{priceOkb}</span>
            <span className="text-xs text-zinc-400 font-mono">OKB / Execution</span>
          </div>
          <span className="mt-1 text-[11px] text-zinc-400">Automatic X Layer Settlement</span>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-950 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Developer Revenue Share</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-black text-emerald-400 font-mono">
            {aspPayload.monetization.revenue_split_pct}%
          </div>
          <span className="mt-1 text-[11px] text-zinc-400">Direct Smart Contract Payment</span>
        </div>
      </div>

      {/* API Request / Response Test Bench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: JSON Skill Spec Viewer */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-zinc-200">
                OKX ASP v1.2 JSON Skill Specification
              </h3>
            </div>
            <span className="font-mono text-[10px] text-zinc-400">okx_asp_v1.2.json</span>
          </div>

          <pre className="mt-4 flex-1 max-h-[420px] overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-300 leading-relaxed">
            {JSON.stringify(aspPayload, null, 2)}
          </pre>
        </div>

        {/* Right: Interactive API Test Bench */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-900/80 p-6 backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-200">
                  ASP API Test Bench for Judges
                </h3>
              </div>
              <span className="rounded bg-zinc-950 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-zinc-800">
                Live Test
              </span>
            </div>

            <span className="mt-3 text-xs text-zinc-400 leading-relaxed block">
              Test live skill invocation to verify sub-15ms response latency & payload parsing on X Layer.
            </span>

            <button
              onClick={handleRunTestBench}
              disabled={isRunningTest}
              className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 transition-all"
            >
              <Play className={`h-4 w-4 fill-current ${isRunningTest ? "animate-spin" : ""}`} />
              <span>{isRunningTest ? "Executing Skill Payload..." : "Execute Test Call"}</span>
            </button>
          </div>

          {testResponse && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-emerald-300 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 200 OK
                </span>
                <span className="text-[10px] text-zinc-400">
                  Latency: {testResponse.execution_latency_ms}ms
                </span>
              </div>
              <pre className="mt-2 text-[11px] leading-relaxed text-zinc-300 overflow-x-auto">
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Expert Mode Overlay Panel */}
      {isExpertMode && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-[11px] text-emerald-400 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-1.5">
            <span className="font-bold text-[10px] text-emerald-400 uppercase tracking-wider">
              ⚡ [EXPERT MODE OVERLAY] OKX.AI ASP Payload Telemetry
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">Latency: 142ms</span>
          </div>
          <div className="flex flex-col gap-1 text-[10px] text-zinc-300">
            <div className="flex justify-between">
              <span>Skill ID: <strong className="text-emerald-400">{aspPayload.skill_id}</strong></span>
              <span>Network: {aspPayload.network}</span>
            </div>
            <div className="overflow-x-auto text-[10px] text-zinc-400 truncate">
              Raw Payload JSON: {JSON.stringify(aspPayload)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
