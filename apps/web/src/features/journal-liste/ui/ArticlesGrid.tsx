import type { BlogPostDto } from '@angaly/types';

import { ArticleCard } from './ArticleCard';

export function ArticlesGrid({ articles }: { articles: BlogPostDto[] }) {
  if (articles.length === 0) {
    return <p className="text-angaly-slate">Aucun article dans cette catégorie pour le moment.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} isWide={index % 3 === 2} />
      ))}
    </div>
  );
}
