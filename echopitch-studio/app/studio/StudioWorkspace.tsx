"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PitchRun, RunStatus } from "../lib/runs/types";
import styles from "./studio.module.css";

const stages: Array<{ key: RunStatus; label: string }> = [
  { key: "understanding", label: "UNDERSTAND" }, { key: "verifying", label: "VERIFY" }, { key: "planning", label: "PLAN" },
  { key: "producing", label: "PRODUCE" }, { key: "reviewing", label: "REVIEW" }, { key: "delivered", label: "DELIVER" }
];
const rank: Record<RunStatus, number> = { idle: -1, collecting: 0, understanding: 0, verifying: 1, planning: 2, producing: 3, reviewing: 4, delivered: 5, failed: -1 };

export default function StudioWorkspace({ runId }: { runId: string }) {
  const [run, setRun] = useState<PitchRun>();
  const [error, setError] = useState("");
  const analysisStarted = useRef(false);
  const productionStarted = useRef(false);
  const load = useCallback(async () => {
    if (!runId) return;
    const response = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Run not found.");
    setRun(payload.run);
  }, [runId]);
  const invoke = useCallback(async (action: "analyze" | "produce") => {
    setError("");
    const response = await fetch(`/api/runs/${runId}/${action}`, { method: "POST" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `${action} failed.`);
    setRun(payload.run);
  }, [runId]);
  useEffect(() => { load().catch(cause => setError(cause instanceof Error ? cause.message : String(cause))); }, [load]);
  useEffect(() => {
    if (run?.status !== "collecting" || analysisStarted.current) return;
    analysisStarted.current = true;
    invoke("analyze").catch(cause => { setError(cause instanceof Error ? cause.message : String(cause)); load().catch(() => undefined); });
  }, [run, invoke, load]);
  useEffect(() => {
    if (!run || !["understanding", "verifying", "producing", "reviewing"].includes(run.status)) return;
    const interval = window.setInterval(() => load().catch(() => undefined), 1200);
    return () => window.clearInterval(interval);
  }, [run, load]);
  async function produce() {
    if (productionStarted.current) return;
    productionStarted.current = true;
    setRun(current => current ? { ...current, status: "producing" } : current);
    try { await invoke("produce"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); await load().catch(() => undefined); }
    finally { productionStarted.current = false; }
  }
  if (!runId) return <Empty title="No run selected" message="Submit a public GitHub repository from the landing page to begin."/>;
  if (!run && !error) return <Empty title="Opening production control room" message="Loading the persisted run…"/>;
  if (!run) return <Empty title="Run unavailable" message={error}/>;

  const result = run.intelligenceResult;
  const intel = result?.intelligence;
  const lock = result?.claimLock;
  const manifest = result?.storyManifest;
  const counts = lock?.claims.reduce((acc, claim) => ({ ...acc, [claim.status]: acc[claim.status] + 1 }), { SUPPORTED: 0, PARTIAL: 0, UNSUPPORTED: 0 }) ?? { SUPPORTED: 0, PARTIAL: 0, UNSUPPORTED: 0 };
  const repositorySceneCount = run.productionReceipt?.repositoryAssetCount ?? run.mediaPlan?.filter(item => item.preferredVisualSource !== "livepeer-generated").length ?? 0;
  const livepeerSceneCount = run.productionReceipt?.livepeerGeneratedAssetCount ?? run.mediaPlan?.filter(item => item.preferredVisualSource === "livepeer-generated").length ?? 0;
  const repairCount = run.productions?.reduce((sum, item) => sum + item.attempts.filter(attempt => attempt.repairPlan).length, 0) ?? 0;

  return <main className={styles.shell}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}><Image className={styles.brandLogo} src="/echopitch-logo.png" alt="" width={30} height={30} loading="eager"/><span>EchoPitch</span></Link>
      <div className={styles.runMeta}><span className={styles.liveDot}/><span>{runStatusLabel(run.status)}</span><code>{run.id.slice(0, 8)}</code></div>
    </header>
    <section className={styles.pipeline} aria-label="Production pipeline">{stages.map((stage, index) => <div key={stage.key} className={`${styles.stage} ${rank[run.status] >= index ? styles.complete : ""} ${run.status === stage.key ? styles.active : ""}`}><span>{String(index + 1).padStart(2, "0")}</span>{stage.label}</div>)}</section>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.eyebrow}>RUN CONFIGURATION</p>
        <a href={run.input.githubUrl} target="_blank" rel="noreferrer">{run.input.githubUrl.replace("https://github.com/", "")}</a>
        <dl><dt>Audience</dt><dd>{run.input.audience}</dd><dt>Goal</dt><dd>{run.input.pitchGoal}</dd><dt>Duration</dt><dd>{formatDuration(run.input.targetDuration)}</dd></dl>
        {run.status === "planning" ? <button className={styles.produceButton} type="button" onClick={produce}>Produce My Pitch</button> : null}
        <p className={styles.note}>Delivery completes only after a playable final artifact and its receipts are persisted.</p>
      </aside>
      <div className={styles.content}>
        {run.error || error ? <section className={`${styles.panel} ${styles.failure}`}><p className={styles.eyebrow}>ACTION NEEDED</p><h2>Run stopped honestly</h2><p>{run.error || error}</p></section> : null}

        <section className={styles.panel}>
          <PanelHead number="01" title="Understand" status={intel ? "COMPLETE" : runStatusLabel(run.status)}/>
          {intel ? <>
            <h2>{intel.productName}</h2>
            <p className={styles.lead}>EchoPitch inspected {intel.inspectedPaths.length} repository paths and identified {intel.capabilities.length} implemented {plural(intel.capabilities.length, "capability", "capabilities")} and {intel.technicalMechanisms.length} technical {plural(intel.technicalMechanisms.length, "mechanism", "mechanisms")}.</p>
            <p className={styles.summary}>{intel.summary}</p>
            <div className={styles.grid3}><Metric label="Capabilities" value={intel.capabilities.length}/><Metric label="Mechanisms" value={intel.technicalMechanisms.length}/><Metric label="Paths inspected" value={intel.inspectedPaths.length}/></div>
            <div className={styles.tags}>{intel.capabilities.length ? intel.capabilities.map(item => <span key={item.id}>{item.name}</span>) : <em>Insufficient evidence.</em>}</div>
            <details className={styles.auditDetails}><summary>Repository intelligence details</summary><h3>Technical mechanisms</h3>{intel.technicalMechanisms.length ? <ul>{intel.technicalMechanisms.map(item => <li key={item.id}>{item.name} — {item.description}</li>)}</ul> : <em>Insufficient evidence.</em>}<h3>Inspected paths</h3>{intel.inspectedPaths.map(path => <p key={path}><code>{path}</code></p>)}{intel.limitations.length ? <><h3>Evidence limitations</h3>{intel.limitations.map(item => <p key={item}>{item}</p>)}</> : null}</details>
          </> : <Working text="Collecting and inspecting prioritized repository files…"/>}
        </section>

        <section className={styles.panel}>
          <PanelHead number="02" title="Verify" status={lock ? "COMPLETE" : "WAITING"}/>
          {lock ? <>
            <p className={styles.lead}>{counts.SUPPORTED} supported, {counts.PARTIAL} partial, and {counts.UNSUPPORTED} unsupported {plural(lock.claims.length, "claim", "claims")}.</p>
            <p className={styles.truthNote}>Unsupported claims are excluded from pitch narration.</p>
            <div className={styles.grid3}><Metric label="Supported" value={counts.SUPPORTED}/><Metric label="Partial / rewritten" value={counts.PARTIAL}/><Metric label="Blocked" value={counts.UNSUPPORTED}/></div>
            <details className={styles.auditDetails}><summary>Verified claim and evidence details</summary><div className={styles.claims}>{lock.claims.map(claim => <details key={claim.id} className={styles.claim}><summary><span className={styles[claim.status.toLowerCase()]}>{claim.status}</span>{claim.claim}</summary><p>{claim.reason}</p>{claim.allowedNarration && claim.allowedNarration !== claim.claim ? <p>Allowed narration: {claim.allowedNarration}</p> : null}{claim.evidence.map(ev => <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer">{ev.path} — {ev.reason}</a>)}{claim.status !== "SUPPORTED" ? <strong>Excluded from narration</strong> : null}</details>)}</div></details>
          </> : <Working text="ClaimLock is waiting for repository evidence."/>}
        </section>

        <section className={styles.panel}>
          <PanelHead number="03" title="Plan" status={manifest ? (run.status === "planning" ? "PITCH PLAN READY" : "COMPLETE") : "WAITING"}/>
          {manifest ? <>
            <p className={styles.lead}>{manifest.scenes.length}-scene {formatDuration(manifest.targetDuration)} story for {manifest.audience.toLowerCase()}, framed as a {manifest.pitchGoal.toLowerCase()}.</p>
            <div className={styles.scenes}>{manifest.scenes.map(scene => <article key={scene.sceneId} className={styles.scene}><header><span>{scene.sceneId}</span><b>{scene.duration}s</b></header><h3>{scene.purpose}</h3><p>{scene.narration}</p><small>{scene.visualIntent}</small><footer><span>{scene.recommendedMediaType}</span><details><summary>Evidence</summary><code>{scene.claimIds.join(", ") || "No verified claim"}</code></details></footer></article>)}</div>
            {run.mediaPlan ? <details className={styles.auditDetails}><summary>Technical media plan</summary><div className={styles.receipt}>{run.mediaPlan.map(item => <article key={item.sceneId}><b>{item.sceneId} → {item.preferredVisualSource}</b><p>{item.productionRationale}</p><code>{item.livepeerCapability || item.repositoryAsset || "Rendered evidence card"}</code></article>)}</div></details> : null}
          </> : <Working text="Story Director is waiting for verified claims."/>}
        </section>

        <section className={styles.panel}>
          <PanelHead number="04" title="Produce" status={productionStatus(run)}/>
          {run.mediaPlan ? <>
            <p className={styles.lead}>{productionSummary(run, repositorySceneCount, livepeerSceneCount)}</p>
            <div className={styles.productionList}>{run.mediaPlan.map(item => { const production = run.productions?.find(candidate => candidate.sceneId === item.sceneId); return <article key={item.sceneId}><header><b>{item.sceneId}</b><span>{item.preferredVisualSource === "livepeer-generated" ? "LIVEPEER GENERATED" : "REPOSITORY EVIDENCE"}</span></header><p>{production ? verdictLabel(production.finalVerdict) : run.status === "planning" ? "Ready for production" : "Waiting or executing"}</p></article>; })}</div>
          </> : <Working text="Production becomes available when the pitch plan is ready."/>}
        </section>

        <section className={styles.panel}>
          <PanelHead number="05" title="Review" status={run.productions ? (run.status === "delivered" ? "COMPLETE" : runStatusLabel(run.status)) : "WAITING"}/>
          {run.productions ? <>
            <p className={styles.lead}>{reviewSummary(run.productions)}</p>
            <div className={styles.reviewGrid}>{run.productions.map(item => <article className={styles.review} key={item.sceneId}><b>{item.sceneId}</b><strong>{verdictLabel(item.finalVerdict)}</strong>{item.warning ? <p>{item.warning}</p> : null}</article>)}</div>
            {repairCount ? <details className={styles.auditDetails}><summary>{repairCount} bounded {plural(repairCount, "repair", "repairs")}</summary>{run.productions.flatMap(item => item.attempts.filter(attempt => attempt.repairPlan).map(attempt => <p key={`${item.sceneId}-${attempt.attempt}`}><b>{item.sceneId}</b>: {attempt.repairPlan?.problems.join(" ")}</p>))}</details> : <p className={styles.note}>No repairs were required.</p>}
          </> : <Working text="Critic results appear after real production attempts."/>}
        </section>

        <section className={`${styles.panel} ${styles.deliveryPanel}`}>
          <PanelHead number="06" title="Deliver" status={run.finalAssembly?.status === "completed" ? "COMPLETE" : "WAITING"}/>
          {run.productionReceipt && run.finalAssembly && result ? <>
            <iframe className={styles.finalPitch} src={run.finalAssembly.artifactReference} title="Final assembled EchoPitch" allow="autoplay"/>
            <div className={styles.deliveryActions}><a className={styles.primaryAction} href={run.finalAssembly.artifactReference} target="_blank" rel="noreferrer">Open final pitch</a><a href={run.finalAssembly.downloadReference}>Download HTML artifact</a></div>
            <div className={styles.grid4}><Metric label="Duration" value={run.finalAssembly.duration} suffix="s"/><Metric label="Scenes" value={run.finalAssembly.sceneCount}/><Metric label="Livepeer visuals" value={run.productionReceipt.livepeerGeneratedAssetCount}/><Metric label="Narration" text={run.finalAssembly.narrationAudioStatus === "livepeer-tts-embedded" ? "Livepeer" : "On-screen"}/></div>
            <details className={styles.receiptSection}><summary>Evidence Receipt</summary><div className={styles.receipt}>{result.storyManifest.scenes.map(scene => <article key={scene.sceneId}><b>{scene.narration}</b>{scene.evidenceReferences.map(reference => <div key={reference.claimId}><code>→ {reference.claimId}</code>{reference.evidenceIds.map(id => { const evidence = intel?.evidence.find(item => item.id === id); return <a key={id} href={evidence?.url} target="_blank" rel="noreferrer">→ {evidence?.path || id}</a>; })}</div>)}</article>)}</div></details>
            <details className={styles.receiptSection}><summary>Production Receipt</summary><div className={styles.receipt}>{run.productionReceipt.scenes.map(scene => <article key={scene.sceneId}><b>{scene.sceneId} → {scene.mediaSource}</b><code>Requested: {scene.requestedCapability || "Not required"}</code><code>Executed: {scene.executedCapability || "Not required"}</code><code>{scene.attempts} attempt(s) · {scene.finalVerdict}</code><code>Jobs: {scene.jobIds.length ? scene.jobIds.join(", ") : "Not provided"}</code>{scene.finalOutputReference ? <a href={scene.finalOutputReference} target="_blank" rel="noreferrer">→ scene artifact</a> : null}{scene.failuresAndFallbacks.map(item => <p key={item}>{item}</p>)}</article>)}<article><b>Narration → {run.productionReceipt.narration.provider}</b><code>{run.productionReceipt.narration.status} · {run.productionReceipt.narration.audioEmbedded ? "embedded" : "not embedded"}</code><code>{run.productionReceipt.narration.artifactReferences?.length || 0} scene audio artifact(s)</code></article><article><b>Final assembly → {run.productionReceipt.assembly.status}</b><code>{run.productionReceipt.assembly.sceneOrder.join(" → ")}</code><code>{run.productionReceipt.totalLivepeerGenerations} Livepeer generation(s) · {run.productionReceipt.repairAttempts} repair(s)</code></article></div></details>
          </> : <Working text="Delivery waits for successful final assembly. A failed assembly is never marked delivered."/>}
        </section>
      </div>
    </div>
  </main>;
}

function runStatusLabel(status: RunStatus): string {
  return ({ idle: "Ready", collecting: "Collecting repository", understanding: "Understanding repository", verifying: "Verifying claims", planning: "Pitch plan ready", producing: "Producing pitch", reviewing: "Reviewing pitch", delivered: "Pitch delivered", failed: "Run needs attention" } satisfies Record<RunStatus, string>)[status];
}
function productionStatus(run: PitchRun): string {
  if (run.status === "planning") return "READY TO PRODUCE";
  if (run.status === "delivered") return "COMPLETE";
  return run.instructions ? runStatusLabel(run.status) : "WAITING";
}
function productionSummary(run: PitchRun, repositoryScenes: number, livepeerScenes: number): string {
  const repositoryCopy = `${repositoryScenes} ${plural(repositoryScenes, "scene uses", "scenes use")} repository evidence.`;
  const livepeerCopy = run.productionReceipt
    ? `${livepeerScenes} ${plural(livepeerScenes, "visual was", "visuals were")} generated through Livepeer.`
    : `${livepeerScenes} ${plural(livepeerScenes, "visual is", "visuals are")} assigned to Livepeer Agent.`;
  return `${repositoryCopy} ${livepeerCopy}`;
}
function reviewSummary(productions: NonNullable<PitchRun["productions"]>): string {
  const passed = productions.filter(item => item.finalVerdict === "ACCEPT").length;
  const usableWithNote = productions.filter(item => item.finalVerdict === "WARNING").length;
  const failed = productions.filter(item => item.finalVerdict === "FAILED").length;
  if (passed === productions.length) return `All ${passed} ${plural(passed, "scene", "scenes")} passed review.`;
  const parts = [`${passed} passed review`];
  if (usableWithNote) parts.push(`${usableWithNote} ${plural(usableWithNote, "is", "are")} usable with a note`);
  if (failed) parts.push(`${failed} ${plural(failed, "is", "are")} not usable`);
  return `${parts.join(", ")}.`;
}
function verdictLabel(verdict: NonNullable<PitchRun["productions"]>[number]["finalVerdict"]): string {
  return verdict === "ACCEPT" ? "Passed review" : verdict === "WARNING" ? "Usable with note" : "Not usable";
}
function formatDuration(seconds: number): string { return seconds === 120 ? "2 minutes" : `${seconds} seconds`; }
function plural(count: number, singular: string, pluralValue: string): string { return count === 1 ? singular : pluralValue; }
function Empty({ title, message }: { title: string; message: string }) { return <main className={styles.empty}><Image className={styles.brandLogo} src="/echopitch-logo.png" alt="" width={30} height={30} loading="eager"/><h1>{title}</h1><p>{message}</p><Link href="/">Return to EchoPitch</Link></main>; }
function PanelHead({ number, title, status }: { number: string; title: string; status: string }) { return <header className={styles.panelHead}><div><span>{number}</span><h2>{title}</h2></div><code>{status}</code></header>; }
function Metric({ label, value, suffix, text }: { label: string; value?: number; suffix?: string; text?: string }) { return <div className={styles.metric}><b>{text ?? `${value}${suffix || ""}`}</b><span>{label}</span></div>; }
function Working({ text }: { text: string }) { return <p className={styles.working}>{text}</p>; }
