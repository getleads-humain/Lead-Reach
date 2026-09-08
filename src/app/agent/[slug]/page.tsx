import { AGENT_DETAILS_FULL } from '@/lib/agent-details';
import { notFound } from 'next/navigation';
import { AgentDetailPage } from './agent-detail-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgentSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const agent = AGENT_DETAILS_FULL[slug];

  if (!agent) {
    notFound();
  }

  return <AgentDetailPage agent={agent} />;
}

// Generate static params for all agents
export async function generateStaticParams() {
  return Object.keys(AGENT_DETAILS_FULL).map((slug) => ({ slug }));
}
