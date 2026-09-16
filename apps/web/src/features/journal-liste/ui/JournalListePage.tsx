'use client';

import { useCategoryFilter } from '../hooks/useCategoryFilter';
import { useJournalArticles } from '../hooks/useJournalArticles';
import { useJournalListeContent } from '../hooks/useJournalListeContent';
import { ArticlesGrid } from './ArticlesGrid';
import { CategoryFilterPills } from './CategoryFilterPills';
import { FeaturedArticleCard } from './FeaturedArticleCard';
import { JournalHeader } from './JournalHeader';
import { LoadMoreButton } from './LoadMoreButton';
import { NewsletterSignupCard } from './NewsletterSignupCard';
import { PopularArticlesWidget } from './PopularArticlesWidget';

/** Orchestrates the real Stitch "Le Journal (Editorial Listing)" screen — JSX + hooks only. */
export function JournalListePage() {
  const { activeSlug, setActiveSlug } = useCategoryFilter();
  const { featured, popular, grid, hasMore, isLoading, loadMore } = useJournalArticles(activeSlug);
  const { data: content } = useJournalListeContent();

  if (isLoading) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
      <JournalHeader content={content.header} />
      <CategoryFilterPills active={activeSlug} onChange={setActiveSlug} />
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="space-y-24 lg:col-span-8">
          {activeSlug === null && featured && <FeaturedArticleCard article={featured} />}
          <ArticlesGrid articles={grid} />
          {hasMore && <LoadMoreButton onClick={loadMore} />}
        </div>
        <aside className="space-y-16 lg:col-span-4">
          <PopularArticlesWidget articles={popular} />
          <NewsletterSignupCard />
        </aside>
      </div>
    </main>
  );
}
