import { ResolveRequestLocaleUseCase } from '../../application/use-cases/resolve-request-locale.use-case';
import { LocaleMiddleware } from '../../presentation/middlewares/locale.middleware';
import type { RequestWithLocale } from '../../presentation/types/request-with-locale.type';

describe('LocaleMiddleware', () => {
  it('resolves the locale from query/cookie/header and attaches it to the request, then calls next()', () => {
    const middleware = new LocaleMiddleware(new ResolveRequestLocaleUseCase());
    const req = {
      query: { locale: 'mg' },
      cookies: { locale: 'FR' },
      headers: { 'accept-language': 'fr-FR' },
    } as unknown as RequestWithLocale;
    const next = jest.fn();

    middleware.use(req, {} as never, next);

    expect(req.locale).toBe('MG');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignores a non-string query value and falls through to the default', () => {
    const middleware = new LocaleMiddleware(new ResolveRequestLocaleUseCase());
    const req = {
      query: { locale: ['mg', 'fr'] },
      cookies: undefined,
      headers: {},
    } as unknown as RequestWithLocale;
    const next = jest.fn();

    middleware.use(req, {} as never, next);

    expect(req.locale).toBe('FR');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
