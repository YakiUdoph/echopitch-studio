"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { normalizeGitHubRepositoryUrl, pitchAudiences, pitchDurations, pitchGoals } from "../../lib/runs/validation";
import styles from "./LandingPage.module.css";

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_124724_bc041163-d651-425f-aea3-2acc1efc2c96.mp4";
const navItems = ["How It Works", "Architecture", "Livepeer", "GitHub"] as const;
type OverlayName = "How It Works" | "Architecture";

function BrandMark() { return <svg className={styles.brandMark} viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="17" fill="#9C86CE"/><circle cx="17" cy="17" r="8.6" fill="#fff"/><circle cx="17" cy="17" r="3.7" fill="#151519"/></svg>; }
function Paperclip() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.62 17.35a4.42 4.42 0 0 1-3.13-7.55l6.86-6.86a3.24 3.24 0 0 1 4.58 4.58l-6.7 6.7a2.1 2.1 0 0 1-2.97-2.97l6.2-6.2 1.06 1.06-6.2 6.2a.6.6 0 0 0 .85.85l6.7-6.7a1.74 1.74 0 1 0-2.46-2.46L5.55 10.86a2.92 2.92 0 1 0 4.13 4.13l5.83-5.83 1.06 1.06-5.83 5.83a4.4 4.4 0 0 1-3.12 1.3Z" fill="currentColor"/></svg>; }
function SendArrow() { return <svg viewBox="0 0 12 13" aria-hidden="true"><path d="M6 12.2V2.9M2.35 6.55 6 2.9l3.65 3.65" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ChipIcon({ type }: { type: "audience" | "duration" | "goal" }) {
  if (type === "audience") return <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="5.25" cy="5" r="2.55" fill="currentColor"/><circle cx="11.15" cy="6.15" r="2.05" fill="currentColor" opacity=".84"/><path d="M1.65 13.15c.26-2.08 1.56-3.27 3.6-3.27 2.07 0 3.38 1.19 3.63 3.27H1.65Zm7.14 0c.1-1.37-.33-2.43-1.15-3.1 2.61-.63 4.55.47 4.84 3.1H8.79Z" fill="currentColor"/></svg>;
  if (type === "duration") return <svg viewBox="0 0 13 13" aria-hidden="true"><path d="M6.5 1.1a5.4 5.4 0 1 0 5.4 5.4 5.4 5.4 0 0 0-5.4-5.4Zm.72 5.17 2.1 1.4-.7 1.04-2.68-1.8V3.4h1.28v2.87Z" fill="currentColor"/></svg>;
  return <svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.05a5.95 5.95 0 1 0 5.95 5.95A5.96 5.96 0 0 0 7 1.05Zm0 1.3a4.65 4.65 0 1 1-4.65 4.65A4.66 4.66 0 0 1 7 2.35Zm0 2.05a2.6 2.6 0 1 0 2.6 2.6A2.6 2.6 0 0 0 7 4.4Zm0 1.3a1.3 1.3 0 1 1-1.3 1.3A1.3 1.3 0 0 1 7 5.7Z" fill="currentColor"/></svg>;
}

export default function LandingPage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("");
  const [audience, setAudience] = useState<(typeof pitchAudiences)[number]>(pitchAudiences[0]);
  const [duration, setDuration] = useState<(typeof pitchDurations)[number]>(60);
  const [pitchGoal, setPitchGoal] = useState<(typeof pitchGoals)[number]>(pitchGoals[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [activeOverlay, setActiveOverlay] = useState<OverlayName>();

  useEffect(() => {
    document.documentElement.classList.add("manus-entrance");
    const timer = window.setTimeout(() => document.documentElement.classList.remove("manus-entrance"), 2600);
    return () => { window.clearTimeout(timer); document.documentElement.classList.remove("manus-entrance"); };
  }, []);

  useEffect(() => {
    if (!activeOverlay) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setActiveOverlay(undefined); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [activeOverlay]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const normalizedUrl = normalizeGitHubRepositoryUrl(githubUrl);
    if (!normalizedUrl) { setError("Enter a canonical public GitHub repository URL."); return; }
    setPending(true);
    try {
      const response = await fetch("/api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ githubUrl: normalizedUrl, audience, targetDuration: duration, pitchGoal }) });
      const payload = await response.json() as { run?: { id: string }; error?: string };
      if (!response.ok || !payload.run) throw new Error(payload.error || "Could not create the run.");
      router.push(`/studio?run=${encodeURIComponent(payload.run.id)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setPending(false); }
  }

  const externalHref = (item: (typeof navItems)[number]) => item === "Livepeer" ? "https://livepeer.org/" : "https://github.com/YakiUdoph/echopitch-studio";
  const navItem = (item: (typeof navItems)[number]) => item === "How It Works" || item === "Architecture"
    ? <button key={item} type="button" onClick={() => setActiveOverlay(item)}>{item}</button>
    : <a key={item} href={externalHref(item)} target="_blank" rel="noreferrer">{item}</a>;
  return <div className={styles.stage}><video className={styles.stageVideo} autoPlay muted loop playsInline preload="auto" src={VIDEO_URL}/><div className={styles.frame}>
    <input className={styles.menuInput} type="checkbox" id="menu" aria-label="Toggle navigation menu"/><header className={styles.nav}><a className={styles.brand} href="#composer" aria-label="EchoPitch home"><BrandMark/><span>EchoPitch</span></a><nav className={styles.links} aria-label="Primary navigation">{navItems.map(navItem)}</nav><a className={styles.navCta} href="#composer">Direct My Pitch</a><label className={styles.burger} htmlFor="menu" aria-label="Open navigation menu"><span/><span/></label></header>
    <div className={styles.sheet} aria-label="Mobile navigation">{navItems.map(navItem)}</div>
    <main className={styles.hero}><h1>Your software already tells a story.</h1><form className={styles.card} id="composer" onSubmit={submit}><label className={styles.srOnly} htmlFor="github-url">GitHub repository URL</label><input id="github-url" className={styles.repoInput} type="url" inputMode="url" value={githubUrl} onChange={event => setGithubUrl(event.target.value)} placeholder="Paste a GitHub repository..." autoComplete="url" aria-invalid={Boolean(error)}/>
      <div className={styles.tools}><div className={styles.chips} aria-label="Pitch settings"><label className={styles.chip}><ChipIcon type="audience"/><select aria-label="Audience" value={audience} onChange={event => setAudience(event.target.value as (typeof pitchAudiences)[number])}>{pitchAudiences.map(value => <option key={value}>{value}</option>)}</select></label><label className={styles.chip}><ChipIcon type="duration"/><select aria-label="Duration" value={duration} onChange={event => setDuration(Number(event.target.value) as (typeof pitchDurations)[number])}>{pitchDurations.map(value => <option key={value} value={value}>{value} seconds</option>)}</select></label><label className={styles.chip}><ChipIcon type="goal"/><select aria-label="Pitch goal" value={pitchGoal} onChange={event => setPitchGoal(event.target.value as (typeof pitchGoals)[number])}>{pitchGoals.map(value => <option key={value}>{value}</option>)}</select></label></div>
      <div className={styles.right}><button className={styles.attach} type="button" aria-label="Focus repository URL" onClick={() => document.getElementById("github-url")?.focus()}><Paperclip/></button><button className={styles.send} type="submit" aria-label="Direct My Pitch" disabled={pending}><SendArrow/></button></div></div>{error && <p className={styles.error} role="alert">{error}</p>}{pending && <p className={styles.pending} role="status">Creating run…</p>}</form></main><div className={styles.proofSpace} aria-hidden="true"/>
  </div>{activeOverlay && <InfoOverlay name={activeOverlay} onClose={() => setActiveOverlay(undefined)}/>}</div>;
}

function InfoOverlay({ name, onClose }: { name: OverlayName; onClose: () => void }) {
  return <div className={styles.overlay} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="landing-dialog-title"><header><span>ECHOPITCH / {name.toUpperCase()}</span><button type="button" onClick={onClose} aria-label="Close overlay">×</button></header><h2 id="landing-dialog-title">{name}</h2>{name === "How It Works" ? <ol><li><b>Understand</b><span>Inspect the submitted repository and identify implemented product capabilities.</span></li><li><b>Verify + Plan</b><span>ClaimLock excludes unsupported claims, then creates an evidence-backed Story Manifest.</span></li><li><b>Produce + Review</b><span>The Production Director selects repository evidence or Livepeer media and the critic evaluates real results.</span></li><li><b>Deliver</b><span>Review the scene sequence with Evidence and Production Receipts.</span></li></ol> : <div className={styles.architecture}><span>Manus hero</span><i>→</i><span>Next.js run APIs</span><i>→</i><span>GitHub Repository Intelligence</span><i>→</i><span>ClaimLock + Story Manifest</span><i>→</i><span>Production Director + Livepeer</span><i>→</i><span>Pitch Critic + Receipts</span></div>}<p>No private reasoning is exposed—only operational state, verified evidence, and production provenance.</p></section></div>;
}
