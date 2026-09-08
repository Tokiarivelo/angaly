import Link from 'next/link';
import type { BlogPostDto } from '@angaly/types';

import { ArticleCard } from '@/features/journal-liste';
import { ROUTES } from '@/lib/routes';

/** Real screen's "À lire aussi" — reuses `journal-liste`'s ArticleCard (identical DTO/shape, no page-specific coupling). */
export function RelatedArticlesRow({ articles }: { articles: BlogPostDto[] }) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-16 bg-angaly-warm-ivory py-24">
      <div className="mx-auto max-w-5xl px-8">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-heading text-4xl text-angaly-navy">À lire aussi</h2>
          <Link
            href={ROUTES.journal}
            className="hidden text-sm tracking-widest text-angaly-navy uppercase transition-colors md:inline-block hover:text-angaly-champagne"
          >
            Explorer le Journal
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} isWide={false} />
          ))}
        </div>
      </div>
    </section>
  );
}
