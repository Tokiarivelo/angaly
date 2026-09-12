import { PersonnalisationCreationPage } from '@/features/personnalisation-creation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <PersonnalisationCreationPage slug={slug} />;
}
