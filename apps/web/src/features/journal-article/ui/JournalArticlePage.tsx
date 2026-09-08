'use client';

import Link from 'next/link';

import { getAuthorProfile } from '@/lib/author-profiles';
import { ROUTES } from '@/lib/routes';

import { useJournalArticle } from '../hooks/useJournalArticle';
import { useRelatedArticles } from '../hooks/useRelatedArticles';
import { AppointmentCtaBand } from './AppointmentCtaBand';
import { ArticleBody } from './ArticleBody';
import { ArticleHeader } from './ArticleHeader';
import { AuthorBox } from './AuthorBox';
import { RelatedArticlesRow } from './RelatedArticlesRow';
import { SocialShareBar } from './SocialShareBar';

/** Orchestrates the real Stitch "Article : Choisir sa robe de mariée" screen — JSX + hooks only. */
export function JournalArticlePage({ slug }: { slug: string }) {
  const { data: article, isLoading, error } = useJournalArticle(slug);
  const { articles: related } = useRelatedArticles(slug);

  if (isLoading) {
    return null;
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-angaly-slate">Cet article est introuvable.</p>
        <Link href={ROUTES.journal} className="mt-4 inline-block text-sm text-angaly-navy underline">
          Retour au journal
        </Link>
      </div>
    );
  }

  const author = getAuthorProfile(article.author);

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mx-auto max-w-5xl px-8 pt-8 text-xs tracking-widest text-angaly-slate uppercase">
        <ol className="inline-flex items-center space-x-2">
          <li>
            <Link href={ROUTES.home} className="transition-colors hover:text-angaly-navy">
              Accueil
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <Link href={ROUTES.journal} className="transition-colors hover:text-angaly-navy">
              Journal
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <span>/</span>
            <span>{article.category.name}</span>
          </li>
          <li aria-current="page" className="flex items-center gap-2 font-medium text-angaly-navy">
            <span>/</span>
            <span>{article.title}</span>
          </li>
        </ol>
      </nav>

      <article>
        <ArticleHeader article={article} />

        <div className="relative mx-auto max-w-5xl px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="relative hidden lg:col-span-2 lg:block">
              <SocialShareBar article={article} />
            </div>
            <div className="col-span-1 lg:col-start-4 lg:col-span-8">
              <ArticleBody content={article.content} />
              <AuthorBox author={author} />
            </div>
          </div>
        </div>
      </article>

      <RelatedArticlesRow articles={related} />
      <AppointmentCtaBand />
    </>
  );
}
