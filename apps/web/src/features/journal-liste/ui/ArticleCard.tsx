import Image from 'next/image';
import Link from 'next/link';
import type { BlogPostDto } from '@angaly/types';

/**
 * Real screen's grid: 2 normal 3:4 cards, then every 3rd card goes "wide" (horizontal
 * image+text layout spanning both columns, with an explicit "Lire l'article" link) — cycled
 * by index, same rhythm pattern as `CreationCard`'s cycling aspect ratios elsewhere.
 */
export function ArticleCard({ article, isWide }: { article: BlogPostDto; isWide: boolean }) {
  const photo = article.media[0];

  const image = (
    <div className={`relative overflow-hidden ${isWide ? 'aspect-[4/3] w-full md:w-1/2' : 'mb-6 aspect-[3/4]'}`}>
      {photo ? (
        <Image
          src={photo.url}
          alt={photo.altText}
          fill
          sizes={isWide ? '(min-width: 768px) 50vw, 100vw' : '(min-width: 768px) 25vw, 50vw'}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue" />
      )}
    </div>
  );

  const text = (
    <div className={isWide ? 'w-full md:w-1/2' : ''}>
      <span className="mb-3 block text-xs font-bold tracking-widest text-angaly-gold uppercase">
        {article.category.name}
      </span>
      <h3
        className={`font-heading mb-3 leading-snug text-angaly-navy transition-colors group-hover:text-angaly-soft-navy ${
          isWide ? 'text-3xl' : 'text-2xl'
        }`}
      >
        {article.title}
      </h3>
      <p className={`text-angaly-slate ${isWide ? 'mb-4 text-base' : 'text-sm'} leading-relaxed`}>{article.excerpt}</p>
      {isWide && (
        <span className="inline-block border-b border-angaly-navy pb-1 text-sm font-medium tracking-wider text-angaly-navy uppercase transition-colors group-hover:border-angaly-gold group-hover:text-angaly-gold">
          Lire l&apos;article
        </span>
      )}
    </div>
  );

  return (
    <Link
      href={`/journal/${article.slug}`}
      className={`group block cursor-pointer ${isWide ? 'md:col-span-2' : ''}`}
    >
      {isWide ? (
        <div className="flex flex-col items-center gap-8 md:flex-row">
          {image}
          {text}
        </div>
      ) : (
        <>
          {image}
          {text}
        </>
      )}
    </Link>
  );
}
