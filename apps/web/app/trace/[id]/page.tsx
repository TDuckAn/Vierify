import { getTraceTimeline } from "./data";

type TracePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TracePage({
  params
}: TracePageProps): Promise<React.ReactNode> {
  const { id } = await params;
  const timeline = await getTraceTimeline(id);

  return (
    <main>
      <h1>Trace {id}</h1>
      <pre>{JSON.stringify(timeline, null, 2)}</pre>
    </main>
  );
}
