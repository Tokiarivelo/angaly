/**
 * `BlogPost.content` is a single `String` (see docs/pages/journal-article.md "Points
 * d'attention") — split on blank lines into plain paragraphs. The real screen's pull-quotes,
 * H2 subheadings, and breakout inline images require either a markdown pipeline or richer
 * structured fields, neither of which exists yet; rendering plain paragraphs (React-escaped,
 * never `dangerouslySetInnerHTML`) is the safe Phase 1 baseline until real rich content is
 * authored — see "Points d'attention" for the deferred richer treatment.
 */
export function ArticleBody({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/).filter((paragraph) => paragraph.trim().length > 0);

  return (
    <div className="mx-auto max-w-[680px]">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          className={
            index === 0
              ? 'font-heading mb-12 text-xl leading-relaxed text-angaly-slate italic'
              : 'mb-6 text-base leading-loose font-light text-angaly-slate'
          }
        >
          {paragraph.trim()}
        </p>
      ))}
    </div>
  );
}
