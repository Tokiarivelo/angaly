import type { Metadata } from 'next';
import type { BlogPostDetailDto } from '@angaly/types';

import { apiClient } from '@/lib/api-client';
import { JournalArticlePage } from '@/features/journal-article';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await apiClient.get<BlogPostDetailDto>(`/blog-posts/${slug}`);
    return {
      title: article.title,
      description: article.excerpt,
    };
  } catch {
    return { title: 'Article' };
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <JournalArticlePage slug={slug} />;
}
