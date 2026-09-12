import { PatternPreviewValidationPage } from '@/features/pattern-studio-preview-validation-export';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: PageProps) {
  const { projectId } = await params;
  return <PatternPreviewValidationPage projectId={projectId} />;
}
