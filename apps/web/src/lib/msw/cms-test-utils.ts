import { HttpResponse, http } from 'msw';

import { server } from './server';

interface CmsSectionFixture {
  sectionKey: string;
  titleText?: string | null;
  subtitleText?: string | null;
  bodyText?: string | null;
  ctaPrimaryLabel?: string | null;
  ctaSecondaryLabel?: string | null;
  dataJson?: unknown;
  media?: { id: string; url: string; altText: string | null } | null;
}

/** Serves `sections` as the PUBLISHED CMS rows of `page` for the current test (`GET /content/public/:page`). */
export function serveCmsPage(page: string, sections: CmsSectionFixture[]): void {
  server.use(
    http.get(`http://localhost:3003/api/content/public/${page}`, () =>
      HttpResponse.json({
        success: true,
        data: sections.map((section) => ({
          page,
          locale: 'FR',
          titleText: null,
          subtitleText: null,
          bodyText: null,
          ctaPrimaryLabel: null,
          ctaSecondaryLabel: null,
          dataJson: null,
          mediaId: section.media?.id ?? null,
          media: null,
          updatedAt: '2026-01-01T00:00:00.000Z',
          ...section,
        })),
      }),
    ),
  );
}
