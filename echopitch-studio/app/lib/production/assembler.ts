import type { MediaPlanItem, NarrationProduction, FinalAssembly, ProductionContext, SceneProduction } from "./types.ts";

export interface AssemblyResult { assembly: FinalAssembly; html: string }

export function assemblePitch(context: ProductionContext, mediaPlan: MediaPlanItem[], productions: SceneProduction[], narration: NarrationProduction, artifactReference: string): AssemblyResult {
  const { scenes, duration } = preparePitch(context, mediaPlan, productions);
  const narrationAssets = resolveNarrationAssets(scenes, narration);
  const assembly: FinalAssembly = {
    artifactReference, downloadReference: `${artifactReference}?download=1`, format: "interactive-html", duration,
    sceneCount: scenes.length, sceneOrder: scenes.map((scene) => scene.id), status: "completed",
    narrationAudioStatus: narrationAssets.complete ? "livepeer-tts-embedded" : "on-screen-copy-only",
    assembledAt: new Date().toISOString()
  };
  return { assembly, html: renderPitchHtml(context, scenes, narration, duration) };
}

export function renderPitchArtifact(context: ProductionContext, mediaPlan: MediaPlanItem[], productions: SceneProduction[], narration: NarrationProduction): string {
  const { scenes, duration } = preparePitch(context, mediaPlan, productions);
  return renderPitchHtml(context, scenes, narration, duration);
}

function preparePitch(context: ProductionContext, mediaPlan: MediaPlanItem[], productions: SceneProduction[]): { scenes: AssembledScene[]; duration: number } {
  const scenes = context.manifest.scenes.map((scene) => {
    const plan = mediaPlan.find((item) => item.sceneId === scene.sceneId);
    const production = productions.find((item) => item.sceneId === scene.sceneId);
    if (!plan || !production) throw new Error(`Final assembly is missing production data for ${scene.sceneId}.`);
    if (production.finalVerdict === "FAILED") throw new Error(`Final assembly rejected ${scene.sceneId}: no usable visual artifact.`);
    if (plan.preferredVisualSource === "livepeer-generated" && !production.finalOutputReference) throw new Error(`Final assembly cannot use ${scene.sceneId}: Livepeer returned no artifact.`);
    const evidence = plan.evidenceIds.map((id) => context.intelligence.evidence.find((item) => item.id === id)).filter((item) => Boolean(item));
    return {
      id: scene.sceneId, purpose: scene.purpose, narration: scene.narration, duration: scene.duration,
      source: plan.preferredVisualSource, mediaType: plan.mediaType, mediaUrl: production.finalOutputReference,
      evidence: evidence.map((item) => ({ path: item!.path, excerpt: item!.excerpt.slice(0, 360), url: item!.url }))
    };
  });
  const duration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  return { scenes, duration };
}

type AssembledScene = {
  id: string; purpose: string; narration: string; duration: number; source: MediaPlanItem["preferredVisualSource"];
  mediaType: MediaPlanItem["mediaType"]; mediaUrl?: string; evidence: Array<{ path: string; excerpt: string; url: string }>;
};

function renderPitchHtml(context: ProductionContext, scenes: AssembledScene[], narration: NarrationProduction, duration: number): string {
  const narrationAssets = resolveNarrationAssets(scenes, narration);
  const payloadScenes = scenes.map((scene) => ({ ...scene, audio: narrationAssets.sceneAudio.get(scene.id) }));
  const payload = safeJson({ title: context.manifest.title, repository: context.intelligence.repository.url, scenes: payloadScenes, duration, audio: narrationAssets.legacyAudio });
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(context.manifest.title)}</title><style>
  :root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#050708;color:#f4f7f7}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 0,#123533 0,transparent 38%),#050708}.player{width:min(1120px,100vw);padding:20px}.stage{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid #284540;border-radius:20px;background:#09100f;box-shadow:0 30px 100px #000}.scene{position:absolute;inset:0;display:grid;grid-template-columns:1.35fr 1fr;opacity:0;transition:opacity .6s ease;pointer-events:none}.scene.active{opacity:1;pointer-events:auto}.visual{position:relative;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#091311,#142622)}.visual img,.visual video{width:100%;height:100%;object-fit:cover}.evidence{width:82%;padding:28px;border:1px solid #2e5a51;border-radius:16px;background:#07100edb;box-shadow:0 20px 60px #0009}.evidence small{color:#56e0bd;text-transform:uppercase;letter-spacing:.12em}.evidence h3{font:600 18px ui-monospace,monospace;overflow-wrap:anywhere}.evidence pre{white-space:pre-wrap;color:#aab8b5;font:14px/1.55 ui-monospace,monospace;max-height:220px;overflow:hidden}.copy{padding:clamp(24px,5vw,64px);display:flex;flex-direction:column;justify-content:center;background:linear-gradient(90deg,#07100fee,#07100f)}.kicker{color:#56e0bd;text-transform:uppercase;letter-spacing:.14em;font-size:12px}.copy h1{font-size:clamp(28px,4vw,52px);line-height:1.04;margin:14px 0}.copy p{font-size:clamp(16px,2vw,23px);line-height:1.5;color:#d4dcda}.source{margin-top:auto;color:#81918d;font-size:12px}.controls{display:grid;grid-template-columns:auto auto 1fr auto;gap:12px;align-items:center;margin-top:14px}.controls button{border:1px solid #2e5a51;background:#0b1815;color:#ecfffa;border-radius:10px;padding:10px 16px;cursor:pointer}.track{height:6px;border-radius:9px;background:#182521;overflow:hidden}.bar{height:100%;width:0;background:#56e0bd}.time{font:12px ui-monospace,monospace;color:#9aaca8}@media(max-width:760px){.scene{grid-template-columns:1fr}.visual{min-height:48%}.copy{position:absolute;inset:auto 0 0;background:linear-gradient(transparent,#07100f 22%);padding-top:90px}.copy h1{font-size:26px}.copy p{font-size:15px}.evidence{padding:16px}.evidence pre{max-height:100px}}
  </style></head><body><main class="player"><section class="stage" id="stage" aria-label="EchoPitch final pitch"></section><div class="controls"><button id="play">Play</button><button id="restart">Restart</button><div class="track"><div class="bar" id="bar"></div></div><span class="time" id="time">0:00 / ${formatTime(duration)}</span></div></main><script>
  const pitch=${payload};const stage=document.getElementById('stage');const bar=document.getElementById('bar');const time=document.getElementById('time');const play=document.getElementById('play');let elapsed=0,started=0,timer=0,playing=false;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function visual(s){if(s.source==='repository-evidence-card'){const e=s.evidence[0]||{};return '<div class="evidence"><small>Verified repository evidence</small><h3>'+esc(e.path||'Repository metadata')+'</h3><pre>'+esc(e.excerpt||'Evidence recorded in the production receipt.')+'</pre></div>'}if(s.mediaType==='video')return '<video muted loop playsinline src="'+esc(s.mediaUrl)+'"></video>';return '<img src="'+esc(s.mediaUrl)+'" alt="Generated visual for '+esc(s.id)+'">'}
  stage.innerHTML=pitch.scenes.map((s,i)=>'<article class="scene" data-i="'+i+'"><div class="visual">'+visual(s)+'</div><div class="copy"><span class="kicker">'+esc(s.id)+' · '+esc(s.purpose)+'</span><h1>'+esc(pitch.title)+'</h1><p>'+esc(s.narration)+'</p><span class="source">'+esc(s.source.replaceAll('-',' '))+'</span></div></article>').join('');const nodes=[...stage.querySelectorAll('.scene')];const legacyAudio=pitch.audio?new Audio(pitch.audio):null;const sceneAudios=pitch.scenes.map(s=>s.audio?new Audio(s.audio):null);let activeAudio=-1;
  function sceneState(t){let start=0;for(let i=0;i<pitch.scenes.length;i++){const end=start+pitch.scenes[i].duration;if(t<end||i===pitch.scenes.length-1)return {index:i,start};start=end}return {index:pitch.scenes.length-1,start:0}}function pauseAudio(){if(legacyAudio)legacyAudio.pause();sceneAudios.forEach(a=>a&&a.pause())}function syncAudio(t,state,force=false){if(legacyAudio){if(force)legacyAudio.currentTime=t;if(playing)legacyAudio.play().catch(()=>{});return}if(force||activeAudio!==state.index){sceneAudios.forEach(a=>a&&a.pause());activeAudio=state.index;const audio=sceneAudios[state.index];if(audio){try{audio.currentTime=Math.max(0,t-state.start)}catch{}if(playing)audio.play().catch(()=>{})}}}
  function draw(){const t=playing?Math.min(pitch.duration,elapsed+(performance.now()-started)/1000):elapsed;const state=sceneState(t);syncAudio(t,state);nodes.forEach((n,i)=>{n.classList.toggle('active',i===state.index);const v=n.querySelector('video');if(v){if(i===state.index&&playing)v.play().catch(()=>{});else v.pause()}});bar.style.width=(t/pitch.duration*100)+'%';time.textContent=Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')+' / ${formatTime(duration)}';if(t>=pitch.duration){playing=false;elapsed=pitch.duration;play.textContent='Replay';pauseAudio();cancelAnimationFrame(timer);return}if(playing)timer=requestAnimationFrame(draw)}
  function start(){if(elapsed>=pitch.duration)elapsed=0;playing=true;started=performance.now();play.textContent='Pause';syncAudio(elapsed,sceneState(elapsed),true);draw()}play.onclick=()=>{if(playing){elapsed=Math.min(pitch.duration,elapsed+(performance.now()-started)/1000);playing=false;play.textContent='Play';pauseAudio();cancelAnimationFrame(timer)}else start()};document.getElementById('restart').onclick=()=>{playing=false;elapsed=0;pauseAudio();activeAudio=-1;if(legacyAudio)legacyAudio.currentTime=0;sceneAudios.forEach(a=>{if(a)a.currentTime=0});play.textContent='Play';draw()};draw();
  </script></body></html>`;
}

function resolveNarrationAssets(scenes: AssembledScene[], narration: NarrationProduction): { complete: boolean; sceneAudio: Map<string, string>; legacyAudio?: string } {
  if (narration.status !== "generated") return { complete: false, sceneAudio: new Map() };
  if (narration.segments) {
    const narratedScenes = scenes.filter((scene) => Boolean(scene.narration.trim()));
    const segmentsByScene = new Map(narration.segments.map((segment) => [segment.sceneId, segment]));
    const complete = narratedScenes.length > 0 && narratedScenes.every((scene) => {
      const segment = segmentsByScene.get(scene.id);
      return segment?.status === "generated" && segment.narration === scene.narration.trim() && Boolean(segment.outputReference);
    });
    if (!complete) return { complete: false, sceneAudio: new Map() };
    return { complete: true, sceneAudio: new Map(narratedScenes.map((scene) => [scene.id, segmentsByScene.get(scene.id)!.outputReference!])) };
  }
  return narration.outputReference
    ? { complete: true, sceneAudio: new Map(), legacyAudio: narration.outputReference }
    : { complete: false, sceneAudio: new Map() };
}

function safeJson(value: unknown): string { return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"); }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!); }
function formatTime(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
