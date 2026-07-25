"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { JargonTooltipsMap, JargonTooltip } from "../lib/mockData";

interface TooltipProps {
  termKey: keyof typeof JargonTooltipsMap | string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ termKey, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data: JargonTooltip | undefined = JargonTooltipsMap[termKey as keyof typeof JargonTooltipsMap] || {
    term: String(termKey),
    plainEnglish: "OKX.AI Technical Concept",
    technicalDetails: "Standardized specification component for X Layer agent execution."
  };

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <span className="cursor-help border-b border-dashed border-zinc-500/60 font-medium text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1">
        {children || data.term}
        <HelpCircle className="h-3 w-3 text-emerald-400/80 inline" />
      </span>

      {isOpen && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-zinc-700/80 bg-zinc-900/95 p-3.5 shadow-2xl backdrop-blur-xl transition-all animate-in fade-in zoom-in-95 block">
          <span className="flex items-center justify-between border-b border-zinc-800 pb-2 block">
            <span className="text-xs font-extrabold text-emerald-400">
              💡 {data.term}
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 border border-zinc-700">
              Jargon Tooltip
            </span>
          </span>

          <span className="mt-2 flex flex-col gap-1.5 text-xs block">
            <span className="block">
              <strong className="font-semibold text-zinc-200">Plain English: </strong>
              <span className="text-zinc-300">{data.plainEnglish}</span>
            </span>
            <span className="rounded-lg bg-zinc-950 p-2 font-mono text-[11px] text-emerald-300 border border-zinc-800 block">
              <strong className="text-zinc-500 font-sans block text-[10px] uppercase font-bold">
                Technical Details:
              </strong>
              {data.technicalDetails}
            </span>
          </span>
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -ml-2 border-4 border-transparent border-t-zinc-900/95 block" />
        </span>
      )}
    </span>
  );
};
