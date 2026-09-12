import { DevisPage } from '@/features/devis';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ quoteNumber: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { quoteNumber } = await params;
  return {
    title: `Devis ${quoteNumber} | ANGALY`,
    description: `Consultez votre devis ${quoteNumber}`,
  };
}

export default async function Page({ params }: Props) {
  const { quoteNumber } = await params;
  
  return (
    <main className="min-h-screen bg-gray-50">
      <DevisPage quoteNumber={quoteNumber} />
    </main>
  );
}
