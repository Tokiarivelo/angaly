import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/lib/msw/server';
import { withQueryClient } from '@/lib/test-utils';

import { useCmsPage } from '../use-cms-page';

const API = 'http://localhost:3003/api';

describe('useCmsPage', () => {
  it('exposes published sections by key, requesting the page in the visitor locale', async () => {
    const seenLocales: (string | null)[] = [];
    server.use(
      http.get(`${API}/content/public/footer`, ({ request }) => {
        seenLocales.push(new URL(request.url).searchParams.get('locale'));
        return HttpResponse.json({ success: true, data: [{ page: 'footer', sectionKey: 'brand', locale: 'FR', titleText: 'ANGALY' }] });
      }),
    );

    const { result } = renderHook(() => useCmsPage('footer'), { wrapper: withQueryClient() });

    await waitFor(() => expect(result.current.section('brand')?.titleText).toBe('ANGALY'));
    expect(result.current.section('missing')).toBeUndefined();
    expect(seenLocales).toContain('FR');
  });

  it('returns no sections (defaults stay in charge) while loading or when the request fails', async () => {
    server.use(http.get(`${API}/content/public/footer`, () => HttpResponse.json({ success: false }, { status: 500 })));

    const { result } = renderHook(() => useCmsPage('footer'), { wrapper: withQueryClient() });

    expect(result.current.section('brand')).toBeUndefined();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.section('brand')).toBeUndefined();
  });
});
