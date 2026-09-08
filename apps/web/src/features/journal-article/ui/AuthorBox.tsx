import Image from 'next/image';

import type { AuthorProfile } from '@/lib/author-profiles';

/** Real screen's author box, inside the ~680px body column, not a separate full-width section. */
export function AuthorBox({ author }: { author: AuthorProfile }) {
  if (!author.bio) return null;

  return (
    <div className="mx-auto mt-24 mb-16 flex max-w-[680px] flex-col items-start gap-8 border border-angaly-border bg-white/50 p-8 md:flex-row">
      {author.photoUrl && (
        <Image
          src={author.photoUrl}
          alt={author.displayName}
          width={96}
          height={96}
          className="h-24 w-24 object-cover"
        />
      )}
      <div>
        <h3 className="font-heading mb-1 text-xl text-angaly-navy">{author.displayName}</h3>
        {author.role && <p className="mb-4 text-xs tracking-widest text-angaly-champagne uppercase">{author.role}</p>}
        <p className="mb-4 text-sm leading-relaxed font-light text-angaly-slate">{author.bio}</p>
        <a
          href="#"
          className="text-sm tracking-widest text-angaly-navy uppercase underline underline-offset-4 transition-colors hover:text-angaly-champagne"
        >
          Voir tous ses articles
        </a>
      </div>
    </div>
  );
}
