import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LEGAL_PAGES, LEGAL_PAGE_SLUGS } from '../consts/legal-pages.const';
import { LegalPage } from '../ui/LegalPage';

describe('LegalPage', () => {
  it.each(LEGAL_PAGE_SLUGS)('renders the title and every section of %s', (slug) => {
    const content = LEGAL_PAGES[slug];
    render(<LegalPage content={content} />);

    expect(screen.getByRole('heading', { level: 1, name: content.title })).toBeInTheDocument();
    for (const section of content.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument();
    }
  });

  it('has content keyed by its own slug', () => {
    for (const slug of LEGAL_PAGE_SLUGS) {
      expect(LEGAL_PAGES[slug].slug).toBe(slug);
    }
  });
});
