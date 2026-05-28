import BatchDetailClient from "./BatchDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function BatchDetailPage({ params }: Props): Promise<React.ReactNode> {
  const { id } = await params;
  return <BatchDetailClient id={id} />;
}
