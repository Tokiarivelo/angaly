import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { serveCmsPage } from '@/lib/msw/cms-test-utils';
import { withQueryClient } from '@/lib/test-utils';

import { HEADER_NAV_LINKS } from '../consts/nav-links.const';
import { useNavigationLinks } from '../hooks/useNavigationLinks';

describe('useNavigationLinks', () => {
  it('falls back to the built-in menus when the CMS has none', () => {
    const { result } = renderHook(() => useNavigationLinks(), { wrapper: withQueryClient() });

    expect(result.current.header).toEqual(HEADER_NAV_LINKS);
    expect(result.current.drawer.some((link) => link.href === '/pattern-studio')).toBe(true);
  });

  it('uses a CMS menu (dropping malformed links, keeping the optional badge), other menus stay default', async () => {
    serveCmsPage('navigation', [
      { sectionKey: 'drawer', dataJson: { links: [{ label: 'Accueil', href: '/' }, { label: 'Studio', href: '/pattern-studio', badge: 'Pro' }, { label: 'cassé' }] } },
    ]);

    const { result } = renderHook(() => useNavigationLinks(), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.drawer).toHaveLength(2));
    expect(result.current.drawer[1]).toEqual({ label: 'Studio', href: '/pattern-studio', badge: 'Pro' });
    expect(result.current.header).toEqual(HEADER_NAV_LINKS);
  });
});
