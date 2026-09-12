import { PatternStudioWizard } from '@/features/pattern-studio-wizard';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;
  return <PatternStudioWizard projectId={projectId} />;
}
