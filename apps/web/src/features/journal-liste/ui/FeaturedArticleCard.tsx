import Image from 'next/image';
import Link from 'next/link';
import type { BlogPostDto } from '@angaly/types';

import { getAuthorProfile } from '@/lib/author-profiles';

import { formatArticleDate } from '../utils/formatArticleDate';

/** Real screen's featured article: 16:9 cover, category tag, title, excerpt, author • date. */
export function FeaturedArticleCard({ article }: { article: BlogPostDto }) {
  const photo = article.media[0];
  const author = getAuthorProfile(article.author);

  return (
    <Link href={`/journal/${article.slug}`} className="group block cursor-pointer">
      <div className="relative mb-8 aspect-video overflow-hidden">
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.altText}
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue" />
        )}
      </div>
      <div className="max-w-2xl">
        <span className="mb-4 block text-xs font-bold tracking-widest text-angaly-gold uppercase">
          {article.category.name}
        </span>
        <h2 className="font-heading mb-4 text-4xl leading-tight text-angaly-navy transition-colors group-hover:text-angaly-soft-navy">
          {article.title}
        </h2>
        <p className="mb-6 leading-relaxed text-angaly-slate">{article.excerpt}</p>
        <div className="text-sm font-medium text-angaly-warm-gray">
          <span>{author.displayName}</span>
          {article.publishedAt && (
            <>
              <span className="mx-2">•</span>
              <span>{formatArticleDate(article.publishedAt)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
