"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { normalizeGitHubRepositoryUrl, pitchAudiences, pitchDurations, pitchGoals } from "../../lib/runs/validation";
import styles from "./LandingPage.module.css";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4";
const LIVEPEER_URL = "https://livepeer.org/";
const navItems = ["How It Works", "Architecture", "Livepeer"] as const;
type OverlayName = "How It Works" | "Architecture";

function BrandMark() { return <Image className={styles.brandMark} src="/echopitch-logo.png" alt="" width={34} height={34} loading="eager"/>; }
function Paperclip() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.62 17.35a4.42 4.42 0 0 1-3.13-7.55l6.86-6.86a3.24 3.24 0 0 1 4.58 4.58l-6.7 6.7a2.1 2.1 0 0 1-2.97-2.97l6.2-6.2 1.06 1.06-6.2 6.2a.6.6 0 0 0 .85.85l6.7-6.7a1.74 1.74 0 1 0-2.46-2.46L5.55 10.86a2.92 2.92 0 1 0 4.13 4.13l5.83-5.83 1.06 1.06-5.83 5.83a4.4 4.4 0 0 1-3.12 1.3Z" fill="currentColor"/></svg>; }
function SendArrow() { return <svg viewBox="0 0 12 13" aria-hidden="true"><path d="M6 12.2V2.9M2.35 6.55 6 2.9l3.65 3.65" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChipIcon({ type }: { type: "audience" | "duration" | "goal" }) {
  if (type === "audience") return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.25" cy="5" r="2.55" fill="currentColor"/><circle cx="11.15" cy="6.15" r="2.05" fill="currentColor" opacity=".84"/><path d="M1.65 13.15c.26-2.08 1.56-3.27 3.6-3.27 2.07 0 3.38 1.19 3.63 3.27H1.65Zm7.14 0c.1-1.37-.33-2.43-1.15-3.1 2.61-.63 4.55.47 4.84 3.1H8.79Z" fill="currentColor"/></svg>;
  if (type === "duration") return <svg viewBox="0 0 13 13" aria-hidden="true"><path d="M6.5 1.1a5.4 5.4 0 1 0 5.4 5.4 5.4 5.4 0 0 0-5.4-5.4Zm.72 5.17 2.1 1.4-.7 1.04-2.68-1.8V3.4h1.28v2.87Z" fill="currentColor"/></svg>;
  return <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.05a5.95 5.95 0 1 0 5.95 5.95A5.96 5.96 0 0 0 7 1.05Zm0 1.3a4.65 4.65 0 1 1-4.65 4.65A4.66 4.66 0 0 1 7 2.35Zm0 2.05a2.6 2.6 0 1 0 2.6 2.6A2.6 2.6 0 0 0 7 4.4Zm0 1.3a1.3 1.3 0 1 1-1.3 1.3A1.3 1.3 0 0 1 7 5.7Z" fill="currentColor"/></svg>;
}

export default function LandingPage() {
  const router = useRouter();
  const repositoryInput = useRef<HTMLInputElement>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [audience, setAudience] = useState<(typeof pitchAudiences)[number]>("Hackathon judges");
  const [duration, setDuration] = useState<(typeof pitchDurations)[number]>(60);
  const [pitchGoal, setPitchGoal] = useState<(typeof pitchGoals)[number]>("Product overview");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [activeOverlay, setActiveOverlay] = useState<OverlayName>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function focusComposer(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById("composer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    repositoryInput.current?.focus({ preventScroll: true });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const normalizedUrl = normalizeGitHubRepositoryUrl(githubUrl);
    if (!normalizedUrl) { setError("Enter a canonical public GitHub repository URL."); repositoryInput.current?.focus(); return; }
    setPending(true);
    try {
      const response = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ githubUrl: normalizedUrl, audience, targetDuration: duration, pitchGoal }) });
      const payload = await response.json() as { run?: { id: string }; error?: string };
      if (!response.ok || !payload.run) throw new Error(payload.error || "Could not create the run.");
      router.push(`/studio?run=${encodeURIComponent(payload.run.id)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setPending(false);
    }
  }

  const navItem = (item: (typeof navItems)[number]) => item === "How It Works" || item === "Architecture"
    ? <button key={item} type="button" onClick={() => setActiveOverlay(item)}>{item}</button>
    : <a key={item} href={LIVEPEER_URL} target="_blank" rel="noreferrer">{item}</a>;

  return <div className={styles.stage}>
    <video className={styles.stageVideo} autoPlay muted loop playsInline preload="auto" src={VIDEO_URL} aria-hidden="true" tabIndex={-1}/>
    <div className={styles.frame} aria-hidden={Boolean(activeOverlay)}>
      <header className={styles.nav}>
        <a className={styles.brand} href="#composer" onClick={focusComposer} aria-label="EchoPitch home"><BrandMark/><span>EchoPitch</span></a>
        <nav className={styles.links} aria-label="Primary navigation">{navItems.map(navItem)}</nav>
        <a className={styles.navCta} href="#composer" onClick={focusComposer}>Direct My Pitch</a>
        <button className={styles.burger} type="button" aria-label="Toggle navigation menu" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" onClick={() => setMobileMenuOpen(open => !open)}><span/><span/></button>
      </header>
      {mobileMenuOpen ? <nav id="mobile-navigation" className={`${styles.sheet} ${styles.sheetOpen}`} aria-label="Mobile navigation">{navItems.map(navItem)}<a href="#composer" onClick={focusComposer}>Direct My Pitch</a></nav> : null}
      <main className={styles.hero}>
        <h1>Your software already tells a story.</h1>
        <form className={styles.card} id="composer" onSubmit={submit}>
          <label className={styles.srOnly} htmlFor="github-url">GitHub repository URL</label>
          <input ref={repositoryInput} id="github-url" className={styles.repoInput} type="url" inputMode="url" value={githubUrl} onChange={event => setGithubUrl(event.target.value)} placeholder="Paste a GitHub repository..." autoComplete="url" aria-invalid={Boolean(error)} aria-describedby={error ? "composer-error" : undefined}/>
          <div className={styles.tools}>
            <div className={styles.chips} role="group" aria-label="Pitch settings">
              <label className={styles.chip}><ChipIcon type="audience"/><span className={styles.srOnly}>Audience</span><select aria-label="Audience" value={audience} onChange={event => setAudience(event.target.value as (typeof pitchAudiences)[number])}>{pitchAudiences.map(value => <option key={value}>{value}</option>)}</select></label>
              <label className={styles.chip}><ChipIcon type="duration"/><span className={styles.srOnly}>Duration</span><select aria-label="Duration" value={duration} onChange={event => setDuration(Number(event.target.value) as (typeof pitchDurations)[number])}>{pitchDurations.map(value => <option key={value} value={value}>{value === 120 ? "2 minutes" : `${value} seconds`}</option>)}</select></label>
              <label className={styles.chip}><ChipIcon type="goal"/><span className={styles.srOnly}>Pitch goal</span><select aria-label="Pitch goal" value={pitchGoal} onChange={event => setPitchGoal(event.target.value as (typeof pitchGoals)[number])}>{pitchGoals.map(value => <option key={value}>{value}</option>)}</select></label>
            </div>
            <div className={styles.right}>
              <button className={styles.attach} type="button" title="Focus repository URL" aria-label="Focus repository URL" onClick={() => repositoryInput.current?.focus()}><Paperclip/></button>
              <button className={styles.send} type="submit" title="Create and direct this pitch" aria-label="Create and direct this pitch" disabled={pending}><SendArrow/></button>
            </div>
          </div>
          {error ? <p className={styles.error} id="composer-error" role="alert">{error}</p> : null}
          {pending ? <p className={styles.pending} role="status">Creating run…</p> : null}
        </form>
      </main>
      <div className={styles.proofSpace} aria-hidden="true"/>
    </div>
    {activeOverlay ? <InfoOverlay name={activeOverlay} onClose={() => setActiveOverlay(undefined)}/> : null}
  </div>;
}

function InfoOverlay({ name, onClose }: { name: OverlayName; onClose: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    return () => previousFocus?.focus();
  }, []);
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") { onClose(); return; }
    if (event.key !== "Tab" || !dialog.current) return;
    const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button,a[href],select,input,[tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1)!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  return <div className={styles.overlay} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="landing-dialog-title" onKeyDown={handleKeyDown}>
      <header><span>ECHOPITCH / {name.toUpperCase()}</span><button ref={closeButton} type="button" onClick={onClose} aria-label="Close overlay">×</button></header>
      <h2 id="landing-dialog-title">{name}</h2>
      {name === "How It Works" ? <ol>
        <li><b>Understand</b><span>Inspect the submitted repository and identify implemented capabilities.</span></li>
        <li><b>Verify</b><span>ClaimLock excludes unsupported claims from narration.</span></li>
        <li><b>Plan</b><span>Build an audience-, goal-, and duration-aware Story Manifest.</span></li>
        <li><b>Produce</b><span>Use repository evidence and Livepeer Agent where generated media is warranted.</span></li>
        <li><b>Review</b><span>Critique real outputs and apply at most one bounded repair.</span></li>
        <li><b>Deliver</b><span>Assemble the pitch with Evidence and Production Receipts.</span></li>
      </ol> : <ArchitectureFlow/>}
      <p>No private reasoning is exposed—only operational state, verified evidence, and production provenance.</p>
    </section>
  </div>;
}

function ArchitectureFlow() {
  const phases = [
    { phase: "UNDERSTAND", title: "GitHub Repository", detail: "Repository Intelligence" },
    { phase: "VERIFY", title: "ClaimLock Verification", detail: "Supported claims only" },
    { phase: "PLAN", title: "Story Director", detail: "Audience, objective, timing" },
    { phase: "PRODUCE", title: "Production Director", detail: "Repository Evidence + Livepeer Agent" },
    { phase: "REVIEW", title: "Pitch Critic", detail: "Bounded repair when required" },
    { phase: "DELIVER", title: "Final Pitch Assembly", detail: "Evidence Receipt + Production Receipt" }
  ];
  return <div className={styles.architectureWrap}>
    <ol className={styles.architectureFlow}>{phases.map((item, index) => <li key={item.phase}>
      <span className={styles.phase}>{item.phase}</span><b>{item.title}</b><small>{item.detail}</small>{index < phases.length - 1 ? <i aria-hidden="true">↓</i> : null}
    </li>)}</ol>
    <aside className={styles.persistence}><span>Durable run state</span><b>Upstash Redis</b><small>Persists operational state and final artifacts across requests.</small></aside>
  </div>;
}
