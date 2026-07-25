"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header, TabType } from "./components/Header";
import { WorkspaceControlToolbar } from "./components/WorkspaceControlToolbar";
import { StudioTab } from "./components/StudioTab";
import { ScriptInspector } from "./components/ScriptInspector";
import { AspIntegration } from "./components/AspIntegration";
import { ExportModal } from "./components/ExportModal";
import {
  MOCK_SLIDES_DEFI,
  MOCK_SLIDES_MARKETPLACE,
  MOCK_SCRIPT_ITEMS_DEFI,
  MOCK_SCRIPT_ITEMS_MARKETPLACE,
  MOCK_VOICE_PROFILES,
  MOCK_OKX_ASP_PAYLOAD_DEFI,
  DEFI_AGENT_README,
  AI_MARKETPLACE_README,
  Slide,
  ScriptItem,
  VoiceProfile,
  PitchDuration,
  ThemePreset,
  THEME_PRESETS,
  generateDynamicPitchDeck,
  generateDynamicScriptItems
} from "./lib/mockData";
import { Zap } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("studio");
  const [isExpertMode, setIsExpertMode] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [activePresetName, setActivePresetName] = useState<string>("DeFi Agent");

  // Feature 1: Dynamic Pitch Duration state (60s, 90s, 180s)
  const [pitchDuration, setPitchDuration] = useState<PitchDuration>(90);

  // Feature 3: Visual Theme Engine Preset state
  const [themePreset, setThemePreset] = useState<ThemePreset>("matrix");

  const [slides, setSlides] = useState<Slide[]>(MOCK_SLIDES_DEFI);
  const [scriptItems, setScriptItems] = useState<ScriptItem[]>(MOCK_SCRIPT_ITEMS_DEFI);
  const [readmeText, setReadmeText] = useState<string>(DEFI_AGENT_README);
  const [githubUrl, setGithubUrl] = useState<string>("https://github.com/echopitch/x-vault-ai");

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState<number>(0);

  const [selectedVoice, setSelectedVoice] = useState<VoiceProfile>(MOCK_VOICE_PROFILES[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>("");

  const [speechCharIndex, setSpeechCharIndex] = useState<number>(0);
  const [speechCharTotal, setSpeechCharTotal] = useState<number>(140);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize SpeechSynthesis reference
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Web Speech API (window.speechSynthesis) voice preview playback & audio sync
  useEffect(() => {
    if (!isPlaying) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setSpeechCharIndex(0);
      return;
    }

    if (synthRef.current) {
      synthRef.current.cancel(); // Stop prior speech

      const fullText = scriptItems.map((item) => item.text).join(". ");
      setSpeechCharTotal(fullText.length || 140);
      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.rate = playbackSpeed * (selectedVoice.speechRate || 1.0);
      utterance.pitch = selectedVoice.pitchRate || 1.0;

      // Track live speech character boundary index
      utterance.onboundary = (event) => {
        if (event.name === "word" || event.charIndex !== undefined) {
          setSpeechCharIndex(event.charIndex);
          const progressRatio = event.charIndex / (fullText.length || 1);
          const totalSlides = slides.length || 4;
          const targetIndex = Math.min(
            totalSlides - 1,
            Math.floor(progressRatio * totalSlides)
          );
          setActiveSlideIndex(targetIndex);
        }
      };

      // Match system voices if available
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        const matched = voices.find((v) =>
          selectedVoice.gender === "Female"
            ? v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha")
            : v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("alex")
        );
        if (matched) utterance.voice = matched;
      }

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentTimeSeconds(0);
        setSpeechCharIndex(0);
      };

      synthRef.current.speak(utterance);
    }
  }, [isPlaying, scriptItems, selectedVoice, playbackSpeed, slides.length]);

  // Playback timer ticker effect for audio sync based on pitchDuration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSeconds((prev) => {
          if (prev >= pitchDuration) {
            setIsPlaying(false);
            if (synthRef.current) synthRef.current.cancel();
            return 0;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, pitchDuration]);

  // Sync current slide index automatically based on currentTimeSeconds audio elapsed time
  useEffect(() => {
    const totalSlides = slides.length || 4;
    const progressRatio = currentTimeSeconds / (pitchDuration || 90);
    const targetIdx = Math.min(totalSlides - 1, Math.floor(progressRatio * totalSlides));
    setActiveSlideIndex(targetIdx);
  }, [currentTimeSeconds, pitchDuration, slides.length]);

  // Feature 1 Handler: Duration toggle update
  const handleSelectPitchDuration = (newDuration: PitchDuration) => {
    setPitchDuration(newDuration);
    const newSlides = generateDynamicPitchDeck(newDuration, activePresetName, readmeText);
    const newScripts = generateDynamicScriptItems(newSlides);
    setSlides(newSlides);
    setScriptItems(newScripts);
    if (synthRef.current) synthRef.current.cancel();
    setIsPlaying(false);
    setCurrentTimeSeconds(0);
  };

  // Feature 2 Handler: Real-Time GitHub Ingestion API fetch
  const handleFetchGithubRepo = async (targetUrl: string) => {
    if (synthRef.current) synthRef.current.cancel();
    setIsProcessing(true);
    setIsPlaying(false);
    setCurrentTimeSeconds(0);
    setProcessingStep("Fetching raw README via GitHub API...");

    try {
      const res = await fetch("/api/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: targetUrl })
      });
      const data = await res.json();
      const text = data.readmeText || DEFI_AGENT_README;
      const repoTitle = data.repo ? String(data.repo).toUpperCase() : "Custom Repo";

      setProcessingStep("Parsing Problem, Solution & Architecture...");
      setTimeout(() => {
        setProcessingStep("Synthesizing Slide Deck & Speech Telemetry...");
        setTimeout(() => {
          setReadmeText(text);
          const newSlides = generateDynamicPitchDeck(pitchDuration, repoTitle, text);
          const newScripts = generateDynamicScriptItems(newSlides);
          setSlides(newSlides);
          setScriptItems(newScripts);
          setActivePresetName(repoTitle);
          setIsProcessing(false);
          setProcessingStep("Ready!");
        }, 500);
      }, 500);
    } catch {
      setIsProcessing(false);
      setProcessingStep("Error fetching repo");
    }
  };

  // Step-by-step loading pipeline simulation helper
  const runPipelineSimulation = (
    presetName: string,
    newReadme: string
  ) => {
    if (synthRef.current) synthRef.current.cancel();
    setIsProcessing(true);
    setIsPlaying(false);
    setCurrentTimeSeconds(0);
    setProcessingStep("Parsing README Markdown with LLM Reasoning...");

    setTimeout(() => {
      setProcessingStep("Structuring Slide Storyboard...");
      setTimeout(() => {
        setProcessingStep("Synthesizing WebSpeech TTS Audio Waveforms...");
        setTimeout(() => {
          setReadmeText(newReadme);
          const newSlides = generateDynamicPitchDeck(pitchDuration, presetName, newReadme);
          const newScripts = generateDynamicScriptItems(newSlides);
          setSlides(newSlides);
          setScriptItems(newScripts);
          setActivePresetName(presetName);
          setIsProcessing(false);
          setProcessingStep("Ready!");
        }, 600);
      }, 600);
    }, 600);
  };

  // Preset 1: DeFi Agent
  const handleRunTestDefi = () => {
    setGithubUrl("https://github.com/echopitch/x-vault-ai");
    runPipelineSimulation("DeFi Agent", DEFI_AGENT_README);
  };

  // Preset 2: AI Marketplace
  const handleRunTestMarketplace = () => {
    setGithubUrl("https://github.com/echopitch/neurogrid-asp");
    runPipelineSimulation("AI Marketplace", AI_MARKETPLACE_README);
  };

  // Custom AI Parser trigger
  const handleRunAiParser = () => {
    runPipelineSimulation("Custom Deck", readmeText);
  };

  const currentScriptItem = scriptItems.find(
    (item) => currentTimeSeconds >= item.startTimeSec && currentTimeSeconds < item.endTimeSec
  );

  const themeObj = THEME_PRESETS[themePreset] || THEME_PRESETS.matrix;

  return (
    <div className={`relative min-h-screen flex flex-col ${themeObj.bgClass} antialiased selection:bg-emerald-500 selection:text-white overflow-x-hidden transition-colors duration-300`}>
      {/* Ambient Lighting Background Radial Glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] pointer-events-none z-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% -20%, ${themeObj.glowColor}, rgba(255,255,255,0))`
        }}
      />

      {/* Tier 1: Global Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        themePreset={themePreset}
        onSelectThemePreset={setThemePreset}
      />

      {/* Hero Header Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-10 pb-4 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-zinc-200 dark:border-zinc-900/80">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-3 max-w-3xl"
        >
          <span className={`inline-flex items-center gap-1.5 rounded-full ${themeObj.accentBg} px-3.5 py-1 text-xs font-semibold ${themeObj.accentText} ${themeObj.accentBorder} border backdrop-blur-md shadow-sm`}>
            <Zap className="h-3.5 w-3.5" />
            ⚡ OKX ASP Ecosystem Engine ({pitchDuration}s Mode)
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
            Turn Repos into {pitchDuration}s Pitch Videos
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
            Auto-extract GitHub READMEs into interactive slide storyboards & valid OKX.AI Agent payloads.
          </p>
        </motion.div>
      </section>

      {/* Tier 2: Workspace Control Sub-Toolbar */}
      <WorkspaceControlToolbar
        pitchDuration={pitchDuration}
        onSelectPitchDuration={handleSelectPitchDuration}
        isExpertMode={isExpertMode}
        onToggleExpertMode={() => setIsExpertMode(!isExpertMode)}
      />

      {/* Main Workspace Body */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-10">
        <AnimatePresence mode="wait">
          {activeTab === "studio" && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <StudioTab
                slides={slides}
                onUpdateSlides={setSlides}
                activeSlideIndex={activeSlideIndex}
                setActiveSlideIndex={setActiveSlideIndex}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                currentTimeSeconds={currentTimeSeconds}
                onSeekTime={(t) => {
                  setCurrentTimeSeconds(t);
                  if (synthRef.current) synthRef.current.cancel();
                }}
                readmeText={readmeText}
                onUpdateReadmeText={setReadmeText}
                githubUrl={githubUrl}
                onUpdateGithubUrl={setGithubUrl}
                onRunAiParser={handleRunAiParser}
                isProcessing={isProcessing}
                processingStep={processingStep}
                isExpertMode={isExpertMode}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                playbackSpeed={playbackSpeed}
                onChangeSpeed={setPlaybackSpeed}
                speechCharIndex={speechCharIndex}
                speechCharTotal={speechCharTotal}
                pitchDuration={pitchDuration}
                onFetchGithubRepo={handleFetchGithubRepo}
              />
            </motion.div>
          )}

          {activeTab === "script" && (
            <motion.div
              key="script"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ScriptInspector
                scriptItems={scriptItems}
                onUpdateScriptItems={setScriptItems}
                activeScriptId={currentScriptItem?.id}
                onSelectScriptItem={(item) => {
                  const slideIdx = slides.findIndex((s) => s.id === item.slideId);
                  if (slideIdx !== -1) setActiveSlideIndex(slideIdx);
                }}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                currentTimeSeconds={currentTimeSeconds}
                onSeekTime={(t) => {
                  setCurrentTimeSeconds(t);
                  if (synthRef.current) synthRef.current.cancel();
                }}
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                isExpertMode={isExpertMode}
              />
            </motion.div>
          )}

          {activeTab === "asp" && (
            <motion.div
              key="asp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <AspIntegration
                aspPayload={MOCK_OKX_ASP_PAYLOAD_DEFI}
                onOpenExportModal={() => setIsExportModalOpen(true)}
                isExpertMode={isExpertMode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Feature 4: Tangible Export & Asset Download Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        aspPayload={MOCK_OKX_ASP_PAYLOAD_DEFI}
        slides={slides}
        scriptText={scriptItems.map((s) => `${s.timeRange} [${s.speaker}]: ${s.text}`).join("\n\n")}
      />

      {/* Minimalist Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-200 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 py-8 mt-12 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 EchoPitch Studio • Powered by OKX OnchainOS</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab("asp")}
              className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors font-medium cursor-pointer"
            >
              Docs
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
