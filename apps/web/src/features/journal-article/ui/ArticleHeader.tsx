import Image from 'next/image';
import type { BlogPostDetailDto } from '@angaly/types';

import { getAuthorProfile } from '@/lib/author-profiles';

import { formatArticleDate } from '../utils/formatArticleDate';
import { estimateReadingTime } from '../utils/reading-time.util';

/** Real screen's 70vh cover header: category tag, title, and an author/date/reading-time row. */
export function ArticleHeader({ article }: { article: BlogPostDetailDto }) {
  const photo = article.media[0];
  const author = getAuthorProfile(article.author);
  const readingTime = estimateReadingTime(article.content);

  return (
    <header className="relative mb-16 h-[70vh] min-h-[600px] w-full overflow-hidden bg-angaly-warm-ivory">
      {photo ? (
        <Image src={photo.url} alt="" fill sizes="100vw" className="object-cover" priority />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-angaly-royal-navy to-angaly-navy-blue" />
      )}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-angaly-navy/80 via-angaly-navy/30 to-transparent" />
      <div className="absolute bottom-0 left-0 z-10 flex h-full w-full max-w-5xl flex-col justify-end p-8 text-white md:p-16">
        <span className="mb-6 block w-fit bg-angaly-champagne px-3 py-1 text-xs tracking-widest text-white uppercase">
          {article.category.name}
        </span>
        <h1 className="font-heading mb-8 max-w-3xl text-4xl leading-tight md:text-6xl lg:text-7xl">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm font-light">
          {author.photoUrl && (
            <Image
              src={author.photoUrl}
              alt={author.displayName}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full border border-white/30 object-cover"
            />
          )}
          <div>
            <p className="font-medium text-white">Par {author.displayName}</p>
            <p className="text-white/80">
              {[author.role, article.publishedAt && formatArticleDate(article.publishedAt), `${readingTime} min de lecture`]
                .filter(Boolean)
                .join(' • ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
