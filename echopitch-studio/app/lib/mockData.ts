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

// Preset 1: DeFi Agent README
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
- AI Model: DeepSeek-R1 / Llama-3-70B for strategy evaluation

## Target Audience & Impact
Targeting Web3 traders, DAO treasuries, and yield farmers looking for enterprise-grade automated treasury management with sub-cent gas fees.
`;

// Preset 2: AI Marketplace README
export const AI_MARKETPLACE_README = `# NeuroGrid: Decentralized B2B AI Agent Skill Marketplace

## Problem Statement
AI Agent developers struggle to monetize modular skills, while enterprise dApps lack a trustless registry to discover and chain verifiable Web3 AI microservices.

## Solution & Key Features
NeuroGrid provides an open-source OKX ASP (Agentic Skill Package) protocol. Developers publish AI skills as Web3 micro-endpoints, earning instant OKB micropayments on X Layer every time an agent executes their workflow.
- 1-Click ASP Skill Specification Generator
- Real-time API telemetry & on-chain OKB revenue sharing
- Autonomous agent-to-agent skill orchestration

## Technical Architecture
- Framework: Next.js 15 App Router, React 19, TypeScript
- Protocol: OKX ASP v1.2 JSON Schema & X Layer Smart Contracts
- Storage: Supabase & IPFS decentralized metadata

## Target Audience & Impact
Targeting AI engineers, Web3 protocols, and autonomous agent builders aiming to monetize LLM pipelines and specialized task agents.
`;

export const MOCK_SLIDES_DEFI: Slide[] = [
  {
    id: "slide-1",
    number: 1,
    timeRange: "0:00 - 0:20",
    timeMsRange: "0ms - 20000ms",
    category: "Problem",
    title: "The Hook & Pain Point",
    subtitle: "30%+ Yield Loss & Manual Rebalancing Friction",
    content: [
      "DeFi liquidity providers lose over 30% potential yield due to delayed manual rebalancing",
      "High L1 gas fees make frequent position updates economically unviable",
      "Unhedged impermanent loss severely impacts liquidity during market volatility spikes"
    ],
    scriptText: "DeFi users lose over thirty percent in potential yield due to manual rebalancing friction and high L1 gas fees. Presenting X-Vault AI, the autonomous yield agent on X Layer.",
    notes: "Start with high urgency. Highlight the 30% yield loss statistic.",
    durationSeconds: 20,
    keyPoints: ["30% Yield Loss", "L1 Gas Friction", "Impermanent Loss Risk"],
    themeColor: "from-rose-600 to-orange-600"
  },
  {
    id: "slide-2",
    number: 2,
    timeRange: "0:20 - 0:45",
    timeMsRange: "20000ms - 45000ms",
    category: "Solution",
    title: "The Solution & Live Demo",
    subtitle: "Zero-Click Autonomous Yield Optimization on X Layer",
    content: [
      "Sub-second automated DEX pool rebalancing powered by X Layer scalability",
      "Micro-monetization via OKB gas optimizations and OKX.AI skill packages",
      "Automated risk scoring with real-time stop-loss impermanent loss protection"
    ],
    scriptText: "X-Vault AI continuously monitors X Layer liquidity pools, executing sub-second rebalancing transactions automatically with ultra-low OKB gas fees and automated risk hedging.",
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
    scriptText: "Architecturally, X-Vault AI connects Solidity contracts on X Layer directly to OKX ASP skill schemas, providing sub-20ms WebSocket telemetry and zero-server client execution.",
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
    scriptText: "With X-Vault AI, we are empowering DAO treasuries and retail traders to maximize yield on X Layer. Try the ASP skill on OKX.AI Marketplace today!",
    notes: "Strong closing. High energy finish.",
    durationSeconds: 20,
    keyPoints: ["$1B Treasury Target", "OKX.AI Marketplace", "Join Testnet"],
    themeColor: "from-purple-600 to-pink-600"
  }
];

export const MOCK_SLIDES_MARKETPLACE: Slide[] = [
  {
    id: "slide-1",
    number: 1,
    timeRange: "0:00 - 0:20",
    timeMsRange: "0ms - 20000ms",
    category: "Problem",
    title: "The Hook & Pain Point",
    subtitle: "Fragmented AI Skills & Friction in Web3 Agent Monetization",
    content: [
      "AI developers struggle to monetize modular agent skills without complex Web2 paywalls",
      "Web3 dApps lack a unified, trustless registry to chain verifiable AI microservices",
      "High integration overhead prevents real-time agent-to-agent micropayments"
    ],
    scriptText: "AI developers struggle to monetize microservices, while Web3 dApps lack a decentralized skill registry. Introducing NeuroGrid, the OKX ASP Marketplace protocol.",
    notes: "Hook the judges immediately with developer pain points.",
    durationSeconds: 20,
    keyPoints: ["Monetization Gap", "No Unified Registry", "Agent Micropayments"],
    themeColor: "from-rose-600 to-orange-600"
  },
  {
    id: "slide-2",
    number: 2,
    timeRange: "0:20 - 0:45",
    timeMsRange: "20000ms - 45000ms",
    category: "Solution",
    title: "The Solution & Live Demo",
    subtitle: "Standardized OKX ASP Skill Protocol & On-Chain OKB Revenue",
    content: [
      "1-Click ASP Skill Specification generator for any LLM pipeline or Web3 tool",
      "Instant OKB micropayment settlement on X Layer every time a skill is invoked",
      "Visual API request/response test bench for autonomous agent orchestration"
    ],
    scriptText: "NeuroGrid turns raw AI code into standardized OKX ASP skill packages. Developers earn OKB micropayments automatically whenever autonomous agents call their endpoints.",
    notes: "Show ASP JSON config and OKB payment flow.",
    durationSeconds: 25,
    keyPoints: ["OKX ASP Standard", "OKB Micropayments", "1-Click Config"],
    themeColor: "from-emerald-600 to-teal-600"
  },
  {
    id: "slide-3",
    number: 3,
    timeRange: "0:45 - 1:10",
    timeMsRange: "45000ms - 70000ms",
    category: "Architecture",
    title: "Technical Architecture",
    subtitle: "Next.js 15, WebAudio DSP & X Layer Smart Contracts",
    content: [
      "Next.js 15 App Router with React 19 Client-side Hydration",
      "Compliant OKX ASP v1.2 JSON Schema validator and test bench",
      "Decentralized IPFS metadata storage & Supabase telemetry logging"
    ],
    scriptText: "Our architecture leverages Next.js 15 and X Layer smart contracts to validate ASP payloads in sub-15ms, making agent skill execution fast and transparent.",
    notes: "Highlight technical compliance with OKX.AI standards.",
    durationSeconds: 25,
    keyPoints: ["Next.js 15 Core", "ASP v1.2 Schema", "Sub-15ms Validation"],
    themeColor: "from-indigo-600 to-cyan-600"
  },
  {
    id: "slide-4",
    number: 4,
    timeRange: "1:10 - 1:30",
    timeMsRange: "70000ms - 90000ms",
    category: "Impact",
    title: "Vision & Call to Action",
    subtitle: "Powering the Decentralized AI Economy on X Layer",
    content: [
      "Building the foundational skill registry for thousands of Web3 AI agents",
      "Monetize your AI model or tool directly on OKX.AI Marketplace",
      "Deploy your first ASP skill package in under 60 seconds"
    ],
    scriptText: "NeuroGrid is building the decentralized skill backbone for the AI economy. Deploy your ASP package on OKX.AI today!",
    notes: "Strong call to action for developers and judges.",
    durationSeconds: 20,
    keyPoints: ["AI Economy", "Deploy in 60s", "OKX.AI Integration"],
    themeColor: "from-purple-600 to-pink-600"
  }
];

export const MOCK_SCRIPT_ITEMS_DEFI: ScriptItem[] = [
  {
    id: "script-1",
    slideId: "slide-1",
    timeRange: "0:00 - 0:20",
    startTimeMs: 0,
    endTimeMs: 20000,
    startTimeSec: 0,
    endTimeSec: 20,
    speaker: "Presenter",
    text: "DeFi users lose over thirty percent in potential yield due to manual rebalancing friction and high L1 gas fees. Presenting X-Vault AI, the autonomous yield agent on X Layer.",
    emotion: "enthusiastic",
    targetPaceWpm: 150,
    targetPitchHz: 215,
    isKeyTakeaway: true
  },
  {
    id: "script-2",
    slideId: "slide-2",
    timeRange: "0:20 - 0:45",
    startTimeMs: 20000,
    endTimeMs: 45000,
    startTimeSec: 20,
    endTimeSec: 45,
    speaker: "Presenter",
    text: "X-Vault AI continuously monitors X Layer liquidity pools, executing sub-second rebalancing transactions automatically with ultra-low OKB gas fees and automated risk hedging.",
    emotion: "confident",
    targetPaceWpm: 145,
    targetPitchHz: 205,
    isKeyTakeaway: true
  },
  {
    id: "script-3",
    slideId: "slide-3",
    timeRange: "0:45 - 1:10",
    startTimeMs: 45000,
    endTimeMs: 70000,
    startTimeSec: 45,
    endTimeSec: 70,
    speaker: "Presenter",
    text: "Architecturally, X-Vault AI connects Solidity contracts on X Layer directly to OKX ASP skill schemas, providing sub-20ms WebSocket telemetry and zero-server client execution.",
    emotion: "analytical",
    targetPaceWpm: 140,
    targetPitchHz: 195
  },
  {
    id: "script-4",
    slideId: "slide-4",
    timeRange: "1:10 - 1:30",
    startTimeMs: 70000,
    endTimeMs: 90000,
    startTimeSec: 70,
    endTimeSec: 90,
    speaker: "Presenter",
    text: "With X-Vault AI, we are empowering DAO treasuries and retail traders to maximize yield on X Layer. Try the ASP skill on OKX.AI Marketplace today!",
    emotion: "enthusiastic",
    targetPaceWpm: 155,
    targetPitchHz: 225,
    isKeyTakeaway: true
  }
];

export const MOCK_SCRIPT_ITEMS_MARKETPLACE: ScriptItem[] = [
  {
    id: "script-1",
    slideId: "slide-1",
    timeRange: "0:00 - 0:20",
    startTimeMs: 0,
    endTimeMs: 20000,
    startTimeSec: 0,
    endTimeSec: 20,
    speaker: "Presenter",
    text: "AI developers struggle to monetize microservices, while Web3 dApps lack a decentralized skill registry. Introducing NeuroGrid, the OKX ASP Marketplace protocol.",
    emotion: "enthusiastic",
    targetPaceWpm: 150,
    targetPitchHz: 215,
    isKeyTakeaway: true
  },
  {
    id: "script-2",
    slideId: "slide-2",
    timeRange: "0:20 - 0:45",
    startTimeMs: 20000,
    endTimeMs: 45000,
    startTimeSec: 20,
    endTimeSec: 45,
    speaker: "Presenter",
    text: "NeuroGrid turns raw AI code into standardized OKX ASP skill packages. Developers earn OKB micropayments automatically whenever autonomous agents call their endpoints.",
    emotion: "confident",
    targetPaceWpm: 145,
    targetPitchHz: 205,
    isKeyTakeaway: true
  },
  {
    id: "script-3",
    slideId: "slide-3",
    timeRange: "0:45 - 1:10",
    startTimeMs: 45000,
    endTimeMs: 70000,
    startTimeSec: 45,
    endTimeSec: 70,
    speaker: "Presenter",
    text: "Our architecture leverages Next.js 15 and X Layer smart contracts to validate ASP payloads in sub-15ms, making agent skill execution fast and transparent.",
    emotion: "analytical",
    targetPaceWpm: 140,
    targetPitchHz: 195
  },
  {
    id: "script-4",
    slideId: "slide-4",
    timeRange: "1:10 - 1:30",
    startTimeMs: 70000,
    endTimeMs: 90000,
    startTimeSec: 70,
    endTimeSec: 90,
    speaker: "Presenter",
    text: "NeuroGrid is building the decentralized skill backbone for the AI economy. Deploy your ASP package on OKX.AI today!",
    emotion: "enthusiastic",
    targetPaceWpm: 155,
    targetPitchHz: 225,
    isKeyTakeaway: true
  }
];

export const MOCK_VOICE_PROFILES: VoiceProfile[] = [
  {
    id: "voice-1",
    name: "Elena Rostova (AI Founder)",
    gender: "Female",
    accent: "US High-Tech Executive",
    description: "Vibrant, high-pitch executive vocal profile with crisp articulation for pitch keynotes.",
    pitchRate: 1.1,
    speechRate: 1.0
  },
  {
    id: "voice-2",
    name: "Marcus Thorne (DeFi Architect)",
    gender: "Male",
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
