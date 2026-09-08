import Image from 'next/image';
import Link from 'next/link';
import type { BlogPostDto } from '@angaly/types';

/**
 * Real screen's "Articles Populaires" — no view-count metric exists on `BlogPost`, so this
 * is simply the most recent articles after the featured one (see
 * docs/pages/journal-liste.md "Points d'attention"), not a real popularity ranking.
 */
export function PopularArticlesWidget({ articles }: { articles: BlogPostDto[] }) {
  if (articles.length === 0) return null;

  return (
    <div className="bg-angaly-warm-ivory/30 p-8">
      <h4 className="font-heading mb-8 border-b border-angaly-border pb-4 text-2xl text-angaly-navy">
        Articles Populaires
      </h4>
      <ul className="space-y-6">
        {articles.map((article) => {
          const photo = article.media[0];
          return (
            <li key={article.id}>
              <Link href={`/journal/${article.slug}`} className="group flex cursor-pointer gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-angaly-ivory">
                  {photo && (
                    <Image src={photo.url} alt={photo.altText} fill sizes="80px" className="object-cover" />
                  )}
                </div>
                <div>
                  <span className="mb-1 block text-[10px] tracking-widest text-angaly-slate uppercase">
                    {article.category.name}
                  </span>
                  <h5 className="font-heading text-base leading-tight text-angaly-navy transition-colors group-hover:text-angaly-gold">
                    {article.title}
                  </h5>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
