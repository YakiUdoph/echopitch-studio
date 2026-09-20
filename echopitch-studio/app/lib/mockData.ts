export interface Slide {
  id: string;
  number: number;
  timeRange: string;
  timeMsRange: string;
  title: string;
  category: "Problem" | "Solution" | "Architecture" | "Impact";
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
  emotion: "confident" | "enthusiastic" | "focused" | "empathetic" | "analytical";
  targetPaceWpm: number;
  targetPitchHz: number;
  isKeyTakeaway?: boolean;
}

export interface VoiceProfile {
  id: string;
  name: string;
  gender: "Male" | "Female" | "Neural";
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

export type PitchDuration = 60 | 90 | 180;
export type ThemePreset = "matrix" | "cyberpunk" | "gold" | "terminal";

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
    id: "matrix", name: "Matrix Green", badge: "Matrix", bgClass: "bg-zinc-950 text-zinc-100",
    cardClass: "bg-zinc-900/60 border-zinc-800/80", accentText: "text-emerald-400",
    accentBg: "bg-emerald-500/10", accentBorder: "border-emerald-500/20",
    buttonClass: "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    glowColor: "rgba(16,185,129,0.15)"
  },
  cyberpunk: {
    id: "cyberpunk", name: "Cyberpunk Neon", badge: "Neon", bgClass: "bg-slate-950 text-purple-100",
    cardClass: "bg-slate-900/60 border-purple-800/40", accentText: "text-cyan-400",
    accentBg: "bg-cyan-500/10", accentBorder: "border-cyan-500/30",
    buttonClass: "bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    glowColor: "rgba(168,85,247,0.2)"
  },
  gold: {
    id: "gold", name: "Studio Gold", badge: "Gold", bgClass: "bg-zinc-950 text-amber-100",
    cardClass: "bg-zinc-900/80 border-amber-900/40", accentText: "text-amber-400",
    accentBg: "bg-amber-500/10", accentBorder: "border-amber-500/30",
    buttonClass: "bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-zinc-950 font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)]",
    glowColor: "rgba(245,158,11,0.15)"
  },
  terminal: {
    id: "terminal", name: "Developer Terminal", badge: "Terminal", bgClass: "bg-black text-green-400 font-mono",
    cardClass: "bg-zinc-950 border-green-900/60", accentText: "text-green-400 font-mono",
    accentBg: "bg-green-950/60", accentBorder: "border-green-800/80",
    buttonClass: "bg-green-950 text-green-400 border border-green-700 hover:bg-green-900 font-mono shadow-[0_0_15px_rgba(34,197,94,0.3)]",
    glowColor: "rgba(34,197,94,0.15)", fontFamily: "font-mono"
  }
};

export const JargonTooltipsMap: Record<string, JargonTooltip> = {
  "Web Audio Sync": {
    term: "Web Audio Sync",
    plainEnglish: "Links voiceover timing directly to visual slide animations.",
    technicalDetails: "Web Speech boundary events map the spoken character index to slide progression."
  },
  "FFmpeg WASM": {
    term: "FFmpeg WASM",
    plainEnglish: "An in-browser media rendering engine.",
    technicalDetails: "A WebAssembly build can stitch slide frames and audio streams into a downloadable media file."
  },
  SpeechSynthesis: {
    term: "SpeechSynthesis",
    plainEnglish: "The browser text-to-speech engine.",
    technicalDetails: "The Web Speech API produces speech locally with configurable rate and pitch."
  },
  "Slide Timestamps": {
    term: "Slide Timestamps",
    plainEnglish: "Audio-visual synchronization markers.",
    technicalDetails: "Cue points map elapsed narration time to slide transitions."
  }
};

export const DEFI_AGENT_README = `# StreamForge: AI Video Production Assistant

## Problem Statement
Small teams struggle to turn technical repositories into clear, polished demo videos under hackathon deadlines.

## Solution & Key Features
StreamForge extracts a product narrative, generates a timed storyboard, and prepares media prompts for an AI video workflow.
- Repository-to-storyboard planning
- Timestamped narration and slide cues
- Exportable scripts and deck data

## Technical Architecture
- Next.js studio interface
- Browser speech preview
- Isolated media-generation adapters

## Call to Action
Turn a working codebase into a concise pitch that judges can understand quickly.`;

export const AI_MARKETPLACE_README = `# SceneFlow: Collaborative Demo Storyboarding

## Problem Statement
Product teams lose time coordinating scripts, visuals, and timing across disconnected tools.

## Solution & Key Features
SceneFlow keeps narrative structure, visual direction, and narration timing in one editable workspace.
- Editable story beats
- Synchronized script cues
- Portable deck and narration exports

## Technical Architecture
- React editing workspace
- Typed scene data
- Pluggable generation adapters

## Call to Action
Create a coherent product demo from one shared source of truth.`;

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
};

export const generateDynamicPitchDeck = (
  duration: PitchDuration,
  repoTitle = "StreamForge",
  readmeContent = DEFI_AGENT_README
): Slide[] => {
  const sceneCount = duration === 60 ? 3 : duration === 180 ? 6 : 4;
  const weights = sceneCount === 3 ? [15, 25, 20] : sceneCount === 6 ? [25, 30, 30, 30, 35, 30] : [20, 25, 25, 20];
  const categories: Slide["category"][] = ["Problem", "Solution", "Architecture", "Impact", "Architecture", "Impact"];
  const titles = [
    `${repoTitle}: Problem & Opportunity`,
    "The Product Story",
    "Live Studio Workflow",
    "Technical Architecture",
    "Generation & Delivery",
    "Vision & Call to Action"
  ];
  const sourceHint = readmeContent.split("\n").find((line) => line.trim() && !line.startsWith("#")) ?? "Complex products deserve a clear story.";
  let elapsed = 0;

  return Array.from({ length: sceneCount }, (_, index) => {
    const sceneDuration = weights[index];
    const start = elapsed;
    const end = elapsed + sceneDuration;
    elapsed = end;
    const category = categories[index];
    const isLast = index === sceneCount - 1;
    return {
      id: `slide-${index + 1}`,
      number: index + 1,
      timeRange: `${formatSeconds(start)} - ${formatSeconds(end)}`,
      timeMsRange: `${start * 1000}ms - ${end * 1000}ms`,
      category,
      title: titles[index],
      subtitle: isLast ? "Make the product memorable" : "Repository context transformed into a focused narrative",
      content: isLast
        ? ["Summarize the measurable value", "Show the generated media artifact", "End with one specific next step"]
        : [sourceHint, "Keep each scene focused on one idea", "Synchronize narration, visuals, and timing"],
      scriptText: isLast
        ? `${repoTitle} turns technical work into a clear, memorable demo. Generate the story, verify the media, and share the result.`
        : `${repoTitle} uses repository context to shape scene ${index + 1} into a concise ${category.toLowerCase()} beat with synchronized narration.`,
      notes: isLast ? "Close with a concrete invitation." : "Keep the delivery clear and direct.",
      durationSeconds: sceneDuration,
      keyPoints: isLast ? ["Clear Value", "Real Artifact", "Next Step"] : ["Focused Story", "Timed Narration", "Visual Clarity"],
      themeColor: ["from-rose-600 to-orange-600", "from-emerald-600 to-teal-600", "from-cyan-600 to-blue-600", "from-indigo-600 to-purple-600", "from-purple-600 to-pink-600", "from-amber-600 to-emerald-600"][index]
    };
  });
};

export const generateDynamicScriptItems = (slides: Slide[]): ScriptItem[] => {
  let elapsed = 0;
  return slides.map((slide, index) => {
    const startTimeSec = elapsed;
    const endTimeSec = elapsed + slide.durationSeconds;
    elapsed = endTimeSec;
    const words = slide.scriptText.trim().split(/\s+/).length;
    return {
      id: `script-${index + 1}`,
      slideId: slide.id,
      timeRange: `${formatSeconds(startTimeSec)} - ${formatSeconds(endTimeSec)}`,
      startTimeMs: startTimeSec * 1000,
      endTimeMs: endTimeSec * 1000,
      startTimeSec,
      endTimeSec,
      speaker: index % 2 === 0 ? "AI Host" : "Technical Presenter",
      text: slide.scriptText,
      emotion: index === 0 ? "confident" : index === slides.length - 1 ? "enthusiastic" : "analytical",
      targetPaceWpm: Math.round(words / (slide.durationSeconds / 60)),
      targetPitchHz: 120 + index * 10,
      isKeyTakeaway: index === 1 || index === slides.length - 1
    };
  });
};

export const MOCK_SLIDES_DEFI = generateDynamicPitchDeck(90, "StreamForge", DEFI_AGENT_README);
export const MOCK_SLIDES_MARKETPLACE = generateDynamicPitchDeck(90, "SceneFlow", AI_MARKETPLACE_README);
export const MOCK_SCRIPT_ITEMS_DEFI = generateDynamicScriptItems(MOCK_SLIDES_DEFI);
export const MOCK_SCRIPT_ITEMS_MARKETPLACE = generateDynamicScriptItems(MOCK_SLIDES_MARKETPLACE);

export const MOCK_VOICE_PROFILES: VoiceProfile[] = [
  { id: "voice-1", name: "Marcus Steele", gender: "Male", accent: "US Professional", description: "Confident presenter voice for concise product demos.", pitchRate: 1, speechRate: 1 },
  { id: "voice-2", name: "Sarah Sterling", gender: "Female", accent: "UK Technical", description: "Measured voice for architecture and implementation details.", pitchRate: 0.95, speechRate: 0.95 },
  { id: "voice-3", name: "Rachel Vance", gender: "Female", accent: "Global Conversational", description: "Smooth voice for product walkthroughs and short pitch clips.", pitchRate: 1.05, speechRate: 1.1 }
];
