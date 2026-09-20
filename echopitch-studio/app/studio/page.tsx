import StudioWorkspace from "./StudioWorkspace";

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run } = await searchParams;
  return <StudioWorkspace runId={run || ""}/>;
}
