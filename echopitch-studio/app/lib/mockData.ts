export interface Slide {
  id: string;
  number: number;
  timeRange: string; // e.g. "0:00 - 0:20"
  timeMsRange: string; // e.g. "0ms - 20000ms"
  title: string;
  category: 'Problem' | 'Solution' | 'Architecture' | 'Impact';
  subtitle: string;
  content: string[];
  notes: string;
  scriptText: string;
  durationSeconds: number;
  keyPoints: string[];
  themeColor: string;
  codeSnippet?: string;
}

export interface ScriptItem {
  id: string;
  slideId: string;
  timeRange: string;
  startTimeMs: number;
  endTimeMs: number;
  startTimeSec: number;
  endTimeSec: number;
  speaker: string;
  text: string;
  emotion: 'confident' | 'enthusiastic' | 'focused' | 'empathetic' | 'analytical';
  targetPaceWpm: number;
  targetPitchHz: number;
  isKeyTakeaway?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Neural';
  accent: string;
  description: string;
  pitchRate: number;
  speechRate: number;
}

export interface JargonTooltip {
  term: string;
  plainEnglish: string;
  technicalDetails: string;
}

export interface OkxAspPayload {
  skill_id: string;
  name: string;
  version: string;
  author: string;
  network: string; // "X Layer Testnet / Mainnet"
  category: string;
  subCategory: string;
  awardCategories: string[];
  maxDemoDuration: string;
  compatibleChains: string[];
  description: string;
  endpoint: string;
  monetization: {
    price_per_call_okb: number;
    revenue_split_pct: number;
  };
  input_schema: Record<string, any>;
  output_schema: Record<string, any>;
  sample_request: Record<string, any>;
  sample_response: Record<string, any>;
}

export type PitchDuration = 60 | 90 | 180;

export type ThemePreset = 'matrix' | 'cyberpunk' | 'gold' | 'terminal';

export interface ThemeStyle {
  id: ThemePreset;
  name: string;
  badge: string;
  bgClass: string;
  cardClass: string;
  accentText: string;
  accentBg: string;
  accentBorder: string;
  buttonClass: string;
  glowColor: string;
  fontFamily?: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeStyle> = {
  matrix: {
    id: 'matrix',
    name: 'OKX Matrix Green',
    badge: 'Matrix',
    bgClass: 'bg-zinc-950 text-zinc-100',
    cardClass: 'bg-zinc-900/60 border-zinc-800/80',
    accentText: 'text-emerald-400',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/20',
    buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    glowColor: 'rgba(16,185,129,0.15)'
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: 'Neon',
    bgClass: 'bg-slate-950 text-purple-100',
    cardClass: 'bg-slate-900/60 border-purple-800/40',
    accentText: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10',
    accentBorder: 'border-cyan-500/30',
    buttonClass: 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    glowColor: 'rgba(168,85,247,0.2)'
  },
  gold: {
    id: 'gold',
    name: 'Web3 Gold',
    badge: 'Gold',
    bgClass: 'bg-zinc-950 text-amber-100',
    cardClass: 'bg-zinc-900/80 border-amber-900/40',
    accentText: 'text-amber-400',
    accentBg: 'bg-amber-500/10',
    accentBorder: 'border-amber-500/30',
    buttonClass: 'bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-zinc-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    glowColor: 'rgba(245,158,11,0.15)'
  },
  terminal: {
    id: 'terminal',
    name: 'Developer Terminal',
    badge: 'Terminal',
    bgClass: 'bg-black text-green-400 font-mono',
    cardClass: 'bg-zinc-950 border-green-900/60',
    accentText: 'text-green-400 font-mono',
    accentBg: 'bg-green-950/60',
    accentBorder: 'border-green-800/80',
    buttonClass: 'bg-green-950 text-green-400 border border-green-700 hover:bg-green-900 font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)]',
    glowColor: 'rgba(34,197,94,0.15)',
    fontFamily: 'font-mono'
  }
};

// Jargon tooltips map
export const JargonTooltipsMap: Record<string, JargonTooltip> = {
  "ASP Payload": {
    term: "ASP Payload",
    plainEnglish: "The standardized configuration file that registers this AI tool on the OKX.AI Marketplace.",
    technicalDetails: "JSON specification schema detailing input parameters, Web3 execution endpoints, and OKB gas micro-monetization rates."
  },
  "Web Audio Sync": {
    term: "Web Audio Sync",
    plainEnglish: "Links voiceover timing directly to visual slide animations.",
    technicalDetails: "WebAudio API / WebSpeech boundary event listener mapping vocal character index to slide progression."
  },
  "FFmpeg WASM": {
    term: "FFmpeg WASM",
    plainEnglish: "In-browser video rendering engine that processes slides without a server.",
    technicalDetails: "WebAssembly-compiled FFmpeg binary operating inside Web Worker threads to stitch PNG slide frames and WebAudio PCM streams into MP4/WebM files."
  },
  "SpeechSynthesis": {
    term: "SpeechSynthesis",
    plainEnglish: "Browser Text-to-Speech Engine",
    technicalDetails: "HTML5 Web Speech API interface synthesizing natural vocal speech directly in the client browser with rate/pitch modulation."
  },
  "Slide Timestamps": {
    term: "Slide Timestamps",
    plainEnglish: "Audio-Visual Synchronization Markers",
    technicalDetails: "Millisecond-precise cue points mapping audio stream delta time to slide DOM element transitions."
  },
  "OKX.AI Marketplace": {
    term: "OKX.AI Marketplace",
    plainEnglish: "Decentralized AI Skill Registry",
    technicalDetails: "X Layer-powered smart contract marketplace allowing autonomous AI agents to discover, invoke, and pay for ASP skills in OKB."
  }
};

// Preset READMEs
export const DEFI_AGENT_README = `# X-Vault AI: Autonomous Liquidity & Yield Optimization Agent on X Layer

## Problem Statement
DeFi users lose 30%+ annual yield due to manual rebalancing friction, high gas fees on Layer 1, and impermanent loss risk during sudden volatility spikes.

## Solution & Key Features
X-Vault AI is a zero-click autonomous agent deployed on OKX X Layer. It dynamically monitors DEX liquidity pools, executes sub-second cross-vault rebalancing, and enforces stop-loss protections using OKX.AI skill packages.
- Real-time yield monitoring across X Layer DEXs
- Micro-monetization via OKB gas optimizations
- Automated risk scoring and impermanent loss hedging

## Technical Architecture
- Smart Contracts: Solidity 0.8.24 deployed on X Layer Testnet
- Agent Engine: Next.js 15, WebSockets, OKX ASP SDK
- Telemetry: Sub-20ms audio-visual slide telemetry player

## Call to Action
Deploy X-Vault AI on OKX.AI Marketplace and automate yield harvesting across Web3 treasuries.`;

export const AI_MARKETPLACE_README = `# NeuroGrid: Decentralized OKX ASP Marketplace & Skill Protocol

## Problem Statement
AI developers struggle to monetize modular agent skills without Web2 paywalls. Web3 dApps lack a unified, trustless registry to chain verifiable AI microservices with instant agent-to-agent payments.

## Solution & Key Features
NeuroGrid provides an open-source OKX ASP (Agentic Skill Package) protocol. Developers publish AI skills as Web3 micro-endpoints, earning instant OKB micropayments on X Layer every time an agent executes their workflow.
- 1-Click ASP Skill Package deployment
- Transparent OKB micro-revenue sharing (95% to creator)
- Verified JSON schema validator for OKX.AI Marketplace

## Technical Architecture
- Protocol: OKX ASP v1.2 JSON Schema & X Layer Smart Contracts
- Frontend & Player: EchoPitch Studio Next.js 15 App
- Execution: Decentralized Web3 Micro-Endpoints

## Call to Action
List your AI agent skill on NeuroGrid today and monetize every API execution on X Layer!`;

export const DEFI_YIELD_ENGINE_README = `# YieldPulse: Real-Time Algorithmic Yield Harvester on X Layer

## Problem Statement
Yield farming opportunities on layer-2 networks decay rapidly. Institutional liquidity providers face slippage and execution delays when rebalancing liquidity pools manually across multiple protocols.

## Solution & Key Features
YieldPulse runs automated algorithmic trading strategies directly on OKX X Layer. It scans high-yield pools, optimizes trade routing to minimize slippage, and auto-compounds rewards 24/7 using OKX ASP triggers.
- Sub-second pool analytics and automated re-entry
- High-frequency slippage reduction algorithms
- Integrated OKX ASP payload endpoint for agentic callers

## Technical Architecture
- Execution Engine: Rust WASM & WebSockets
- Smart Contracts: Solidity on X Layer Mainnet
- Signal Layer: OKX ASP Schema Event Stream`;

// Generator for dynamic pitch slides based on duration (60s, 90s, 180s)
export const generateDynamicPitchDeck = (
  duration: PitchDuration,
  repoTitle: string = "X-Vault AI",
  readmeContent: string = DEFI_AGENT_README
): Slide[] => {
  const isDeFi = readmeContent.toLowerCase().includes("yield") || readmeContent.toLowerCase().includes("defi");

  if (duration === 60) {
    // 60s Elevator Pitch (3 core slides)
    return [
      {
        id: "slide-1",
        number: 1,
        timeRange: "0:00 - 0:15",
        timeMsRange: "0ms - 15000ms",
        category: "Problem",
        title: `${repoTitle}: Core Pain Point`,
        subtitle: isDeFi ? "30%+ Yield Loss & Manual Rebalancing Friction" : "High Overhead & Friction in Web3 Agent Operations",
        content: [
          "Manual operations create massive yield loss and execution delays across Web3 protocols",
          "High gas costs and slow response times limit real-time autonomous decision making",
          "Lack of standardized agent interfaces causes fragmentation across decentralized apps"
        ],
        scriptText: `${repoTitle} addresses critical friction in Web3. Manual processes cost users over thirty percent in performance losses and delayed execution.`,
        notes: "Elevator pitch hook. High energy opening.",
        durationSeconds: 15,
        keyPoints: ["High Friction", "Execution Delay", "Performance Loss"],
        themeColor: "from-rose-600 to-orange-600"
      },
      {
        id: "slide-2",
        number: 2,
        timeRange: "0:15 - 0:40",
        timeMsRange: "15000ms - 40000ms",
        category: "Solution",
        title: "Autonomous Agent Solution",
        subtitle: "Zero-Click AI Automation Deployed on OKX X Layer",
        content: [
          "Sub-second automated execution powered by X Layer scalability",
          "Standardized OKX Agentic Skill Package (ASP) JSON protocol integration",
          "Instant OKB micro-monetization for autonomous agent-to-agent interactions"
        ],
        scriptText: `Our solution executes sub-second autonomous workflows on OKX X Layer, utilizing standardized ASP skill packages for zero-click automation and instant OKB micro-settlement.`,
        notes: "Demonstrate core solution and OKX ASP integration.",
        durationSeconds: 25,
        keyPoints: ["Sub-second Speed", "OKX ASP Protocol", "OKB Micro-Settlement"],
        themeColor: "from-emerald-600 to-teal-600"
      },
      {
        id: "slide-3",
        number: 3,
        timeRange: "0:40 - 1:00",
        timeMsRange: "40000ms - 60000ms",
        category: "Impact",
        title: "Market Impact & Call to Action",
        subtitle: "Unlocking Autonomous Scale on OKX.AI Marketplace",
        content: [
          "Ready for immediate deployment on OKX.AI Marketplace",
          "Empowering Web3 treasuries and autonomous AI agents worldwide",
          "Join our developer ecosystem on X Layer Testnet today"
        ],
        scriptText: `${repoTitle} is live and ready for deployment on OKX.AI Marketplace. Join us in building the autonomous future on X Layer!`,
        notes: "Strong closing call to action.",
        durationSeconds: 20,
        keyPoints: ["OKX.AI Deployment", "X Layer Mainnet", "Join Testnet"],
        themeColor: "from-indigo-600 to-purple-600"
      }
    ];
  }

  if (duration === 180) {
    // 180s 3-Min Deep Dive Pitch (6 slides)
    return [
      {
        id: "slide-1",
        number: 1,
        timeRange: "0:00 - 0:25",
        timeMsRange: "0ms - 25000ms",
        category: "Problem",
        title: `${repoTitle}: Market Pain Point`,
        subtitle: isDeFi ? "30%+ Yield Loss & Manual Rebalancing Friction" : "Fragmented Agent Microservices & High Friction",
        content: [
          "Web3 protocols lose significant efficiency due to slow, manual intervention",
          "Cross-chain execution friction and high Layer-1 gas fees erode user margins",
          "Unhedged risk and delayed response times cause major impermanent loss"
        ],
        scriptText: `Welcome to the ${repoTitle} presentation. Current Web3 operations suffer from severe manual friction, costing users over thirty percent in lost efficiency and delayed execution.`,
        notes: "Comprehensive problem breakdown. Establish market urgency.",
        durationSeconds: 25,
        keyPoints: ["Market Friction", "30% Efficiency Loss", "Delayed Execution"],
        themeColor: "from-rose-600 to-orange-600"
      },
      {
        id: "slide-2",
        number: 2,
        timeRange: "0:25 - 0:55",
        timeMsRange: "25000ms - 55000ms",
        category: "Solution",
        title: "Autonomous Agent Solution",
        subtitle: "Zero-Click AI Automation Deployed on OKX X Layer",
        content: [
          "Sub-second automated execution powered by X Layer scalability",
          "Continuous pool telemetry and algorithmic risk management",
          "Seamless OKB gas optimizations and automated stop-loss protection"
        ],
        scriptText: `${repoTitle} solves this by deploying autonomous AI agents directly on X Layer, executing sub-second strategies with automated risk management and sub-cent OKB gas fees.`,
        notes: "Highlight core technology advantages and zero-click UX.",
        durationSeconds: 30,
        keyPoints: ["Zero-Click AI", "Sub-second Rebalance", "OKB Micro-Gas"],
        themeColor: "from-emerald-600 to-teal-600"
      },
      {
        id: "slide-3",
        number: 3,
        timeRange: "0:55 - 1:25",
        timeMsRange: "55000ms - 85000ms",
        category: "Solution",
        title: "Live Product Architecture & Demo",
        subtitle: "Real-Time Telemetry & Client-Side Execution",
        content: [
          "Interactive 90s visual slide canvas with millisecond timecode sync",
          "Browser-native WebSpeech audio playback & FFmpeg WASM video renderer",
          "Live execution feedback with zero-server client telemetry"
        ],
        scriptText: `Here in our live dashboard, EchoPitch Studio renders high-definition slides synchronized directly to synthesized audio waveforms in real-time.`,
        notes: "Product demo walk-through. Show live rendering player.",
        durationSeconds: 30,
        keyPoints: ["Live Telemetry", "WebAudio Sync", "FFmpeg WASM"],
        themeColor: "from-cyan-600 to-blue-600"
      },
      {
        id: "slide-4",
        number: 4,
        timeRange: "1:25 - 1:55",
        timeMsRange: "85000ms - 115000ms",
        category: "Architecture",
        title: "Technical Architecture & Smart Contracts",
        subtitle: "Next.js 15, Solidity 0.8.24 & OKX ASP Protocol",
        content: [
          "Solidity 0.8.24 smart contracts deployed on OKX X Layer Testnet",
          "Standardized OKX Agentic Skill Package (ASP) JSON specification interface",
          "Real-time WebSocket telemetry with client-side WebAudio risk monitoring"
        ],
        scriptText: `Architecturally, ${repoTitle} bridges Solidity contracts on X Layer to OKX ASP schemas, allowing autonomous AI agents to invoke standardized endpoints seamlessly.`,
        notes: "Technical deep dive for judges and engineers.",
        durationSeconds: 30,
        keyPoints: ["Solidity 0.8.24", "OKX ASP Spec", "20ms Telemetry"],
        themeColor: "from-indigo-600 to-purple-600"
      },
      {
        id: "slide-5",
        number: 5,
        timeRange: "1:55 - 2:30",
        timeMsRange: "115000ms - 150000ms",
        category: "Architecture",
        title: "OKX ASP Micro-Monetization Engine",
        subtitle: "On-Chain Micro-Revenue & OKB Micropayments",
        content: [
          "Direct smart contract revenue split (95% to developer)",
          "Sub-cent OKB micropayments per agentic execution call",
          "Pre-validated JSON payload ready for OKX.AI Marketplace listing"
        ],
        scriptText: `Every skill call generates on-chain OKB revenue settled automatically via X Layer smart contracts, creating a sustainable economy for Web3 AI developers.`,
        notes: "Monetization model & OKB economics focus.",
        durationSeconds: 35,
        keyPoints: ["95% Dev Revenue", "OKB Micropayments", "OKX.AI Listing"],
        themeColor: "from-purple-600 to-pink-600"
      },
      {
        id: "slide-6",
        number: 6,
        timeRange: "2:30 - 3:00",
        timeMsRange: "150000ms - 180000ms",
        category: "Impact",
        title: "Roadmap, Traction & Call to Action",
        subtitle: "Scaling Autonomous Web3 AI Agents Everywhere",
        content: [
          "Scaling strategy across X Layer ecosystem DEXs and AI agent hubs",
          "Available on OKX.AI Marketplace as a plug-and-play ASP skill",
          "Test our live ASP endpoint and join the OKX hackathon ecosystem today!"
        ],
        scriptText: `${repoTitle} is building the future of autonomous agentic skills on OKX X Layer. Try our ASP skill package on OKX.AI Marketplace today!`,
        notes: "Inspiring closing call to action.",
        durationSeconds: 30,
        keyPoints: ["OKX.AI Marketplace", "X Layer Mainnet", "Join Testnet"],
        themeColor: "from-amber-600 to-emerald-600"
      }
    ];
  }

  // Default 90s Standard Pitch (4 slides)
  return [
    {
      id: "slide-1",
      number: 1,
      timeRange: "0:00 - 0:20",
      timeMsRange: "0ms - 20000ms",
      category: "Problem",
      title: `${repoTitle}: Problem & Opportunity`,
      subtitle: isDeFi ? "30%+ Yield Loss & Manual Rebalancing Friction" : "High Overhead & Friction in Web3 Agent Operations",
      content: [
        "Manual operations create massive yield loss and execution delays across Web3 protocols",
        "High gas costs and slow response times limit real-time autonomous decision making",
        "Lack of standardized agent interfaces causes fragmentation across decentralized apps"
      ],
      scriptText: `DeFi users lose over thirty percent in potential yield due to manual rebalancing friction and high L1 gas fees. Presenting ${repoTitle}, the autonomous agent on X Layer.`,
      notes: "Start with high urgency. Highlight core statistics.",
      durationSeconds: 20,
      keyPoints: ["High Friction", "Execution Delay", "Performance Loss"],
      themeColor: "from-rose-600 to-orange-600"
    },
    {
      id: "slide-2",
      number: 2,
      timeRange: "0:20 - 0:45",
      timeMsRange: "20000ms - 45000ms",
      category: "Solution",
      title: "The Solution & Autonomous Agent",
      subtitle: "Zero-Click Autonomous Optimization on OKX X Layer",
      content: [
        "Sub-second automated DEX pool rebalancing powered by X Layer scalability",
        "Micro-monetization via OKB gas optimizations and OKX.AI skill packages",
        "Automated risk scoring with real-time stop-loss impermanent loss protection"
      ],
      scriptText: `${repoTitle} continuously monitors X Layer liquidity pools, executing sub-second rebalancing transactions automatically with ultra-low OKB gas fees and automated risk hedging.`,
      notes: "Demonstrate live vault dashboard. Keep voice tone energetic and confident.",
      durationSeconds: 25,
      keyPoints: ["Sub-second Rebalance", "OKB Micro-Gas", "Automated Hedging"],
      themeColor: "from-emerald-600 to-teal-600"
    },
    {
      id: "slide-3",
      number: 3,
      timeRange: "0:45 - 1:10",
      timeMsRange: "45000ms - 70000ms",
      category: "Architecture",
      title: "Technical Architecture",
      subtitle: "Next.js 15, Solidity 0.8.24 & OKX ASP Protocol",
      content: [
        "Solidity 0.8.24 Smart Contracts deployed on OKX X Layer Testnet",
        "OKX Agentic Skill Package (ASP) JSON specification interface",
        "Real-time WebSocket telemetry with client-side WebAudio risk monitoring"
      ],
      scriptText: `Architecturally, ${repoTitle} connects Solidity contracts on X Layer directly to OKX ASP skill schemas, providing sub-20ms WebSocket telemetry and zero-server client execution.`,
      notes: "Technical depth focus. Speak at 145 WPM cadence.",
      durationSeconds: 25,
      keyPoints: ["X Layer Contracts", "OKX ASP Spec", "20ms Telemetry"],
      themeColor: "from-indigo-600 to-cyan-600"
    },
    {
      id: "slide-4",
      number: 4,
      timeRange: "1:10 - 1:30",
      timeMsRange: "70000ms - 90000ms",
      category: "Impact",
      title: "Vision & Call to Action",
      subtitle: "Empowering $1B+ in Autonomous Web3 Treasuries",
      content: [
        "Scaling autonomous yield strategies across X Layer ecosystem DEXs",
        "Available on OKX.AI Marketplace as a plug-and-play ASP skill",
        "Join our developer testnet and unlock zero-click yield optimization today"
      ],
      scriptText: `With ${repoTitle}, we are empowering DAO treasuries and retail traders to maximize yield on X Layer. Try the ASP skill on OKX.AI Marketplace today!`,
      notes: "Strong closing. High energy finish.",
      durationSeconds: 20,
      keyPoints: ["$1B Treasury Target", "OKX.AI Marketplace", "Join Testnet"],
      themeColor: "from-purple-600 to-pink-600"
    }
  ];
};

export const generateDynamicScriptItems = (slides: Slide[]): ScriptItem[] => {
  let accumulatedTimeSec = 0;
  return slides.map((slide, idx) => {
    const startTimeSec = accumulatedTimeSec;
    const endTimeSec = accumulatedTimeSec + slide.durationSeconds;
    accumulatedTimeSec = endTimeSec;

    const formatSec = (s: number) => {
      const mins = Math.floor(s / 60);
      const secs = Math.floor(s % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const wordCount = slide.scriptText.split(/\s+/).length;
    const durationMin = slide.durationSeconds / 60;
    const wpm = Math.round(wordCount / (durationMin || 0.33));

    return {
      id: `script-${idx + 1}`,
      slideId: slide.id,
      timeRange: `${formatSec(startTimeSec)} - ${formatSec(endTimeSec)}`,
      startTimeMs: startTimeSec * 1000,
      endTimeMs: endTimeSec * 1000,
      startTimeSec,
      endTimeSec,
      speaker: idx % 2 === 0 ? "AI Agent Host (Marcus)" : "Technical Presenter (Sarah)",
      text: slide.scriptText,
      emotion: idx === 0 ? "confident" : idx === slides.length - 1 ? "enthusiastic" : "analytical",
      targetPaceWpm: wpm || 148,
      targetPitchHz: 120 + idx * 10,
      isKeyTakeaway: idx === 1 || idx === slides.length - 1
    };
  });
};

export const MOCK_SLIDES_DEFI = generateDynamicPitchDeck(90, "X-Vault AI", DEFI_AGENT_README);
export const MOCK_SLIDES_MARKETPLACE = generateDynamicPitchDeck(90, "NeuroGrid ASP", AI_MARKETPLACE_README);

export const MOCK_SCRIPT_ITEMS_DEFI = generateDynamicScriptItems(MOCK_SLIDES_DEFI);
export const MOCK_SCRIPT_ITEMS_MARKETPLACE = generateDynamicScriptItems(MOCK_SLIDES_MARKETPLACE);

export const MOCK_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "voice-1",
    name: "Marcus Steele (Agentic Male)",
    gender: "Male",
    accent: "US Professional Tech",
    description: "High-impact, confident Silicon Valley presenter voice tuned for hackathon pitch decks.",
    pitchRate: 1.0,
    speechRate: 1.0
  },
  {
    id: "voice-2",
    name: "Sarah Sterling (Executive Female)",
    gender: "Female",
    accent: "UK Technical Lead",
    description: "Deep, authoritative voice for technical architecture breakdown and VC presentations.",
    pitchRate: 0.95,
    speechRate: 0.95
  },
  {
    id: "voice-3",
    name: "Rachel Vance (Neural Synthetic)",
    gender: "Female",
    accent: "Global Conversational",
    description: "Ultra-smooth neural voice ideal for product demo videos and 90s pitch clips.",
    pitchRate: 1.05,
    speechRate: 1.1
  }
];

export const MOCK_OKX_ASP_PAYLOAD_DEFI: OkxAspPayload = {
  skill_id: "asp_okx_xlayer_yield_v1",
  name: "EchoPitch X-Vault AI Skill Package",
  version: "1.2.0-hackathon",
  author: "EchoPitch Studio / OKX Hackathon Team",
  network: "OKX X Layer Mainnet / Testnet",
  category: "Software Services",
  subCategory: "AI Video & Script Automation",
  awardCategories: ["Creative Genius", "Best Product", "Software Utility"],
  maxDemoDuration: "90s",
  compatibleChains: ["X Layer Mainnet (196)", "X Layer Testnet (195)"],
  description: "Autonomous Agentic Skill Package for automated DEX yield optimization, timestamped pitch synthesis, and OKB gas micro-settlement.",
  endpoint: "https://api.echopitch.ai/v1/asp/execute",
  monetization: {
    price_per_call_okb: 0.0005,
    revenue_split_pct: 95.0
  },
  input_schema: {
    type: "object",
    properties: {
      github_url: { type: "string", example: "https://github.com/echopitch/x-vault-ai" },
      readme_text: { type: "string", description: "Raw Markdown content of project README" },
      duration_seconds: { type: "integer", default: 90 },
      target_audience: { type: "string", enum: ["Investors", "Judges", "Users", "Developers"] }
    },
    required: ["readme_text"]
  },
  output_schema: {
    type: "object",
    properties: {
      pitch_title: { type: "string" },
      slides: { type: "array", items: { type: "object" } },
      script_text: { type: "string" },
      audio_waveform_pcm: { type: "array" },
      asp_execution_time_ms: { type: "number" }
    }
  },
  sample_request: {
    github_url: "https://github.com/echopitch/x-vault-ai",
    readme_text: "# X-Vault AI: Autonomous Liquidity Agent on X Layer...",
    target_audience: "Judges"
  },
  sample_response: {
    status: "SUCCESS",
    asp_execution_time_ms: 14.2,
    parsed_tags: ["DeFi", "XLayer", "AutonomousAgent", "OKB"],
    generated_slides_count: 4,
    total_pitch_duration_seconds: 90,
    video_render_ready: true
  }
};
