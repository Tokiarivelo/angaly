import Image from 'next/image';
import Link from 'next/link';

import { formatDate } from '@/lib/utils';

import { useJournalTeaser } from '../hooks/useJournalTeaser';
import type { HomeContent } from '../hooks/useHomeContent';

/** stitch-prompts/01-home.md "SECTION 9 — JOURNAL". Wired to real GET /api/blog-posts. */
export function JournalTeaser({ content }: { content: HomeContent['journalTeaser'] }) {
  const { data, isLoading } = useJournalTeaser();

  if (isLoading || data.length === 0) {
    return null;
  }

  return (
    <section className="bg-angaly-ivory">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="font-heading text-4xl text-angaly-navy">{content.headline}</h2>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((post) => (
            <Link key={post.id} href={`/journal/${post.slug}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-angaly-warm-ivory">
                {post.media[0] ? (
                  <Image
                    src={post.media[0].url}
                    alt={post.media[0].altText || post.title}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="h-full w-full bg-gradient-to-br from-angaly-champagne to-angaly-warm-ivory"
                  />
                )}
              </div>
              <span className="mt-3 inline-block bg-angaly-champagne/30 px-2 py-0.5 text-xs text-angaly-navy">
                {post.category.name}
              </span>
              <p className="font-heading mt-2 text-lg text-angaly-navy group-hover:text-angaly-gold">
                {post.title}
              </p>
              {post.publishedAt && (
                <p className="mt-1 text-xs text-angaly-slate">{formatDate(post.publishedAt)}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
