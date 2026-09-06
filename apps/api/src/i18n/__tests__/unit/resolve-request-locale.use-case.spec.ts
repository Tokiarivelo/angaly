import { ResolveRequestLocaleUseCase } from '../../application/use-cases/resolve-request-locale.use-case';

describe('ResolveRequestLocaleUseCase', () => {
  const useCase = new ResolveRequestLocaleUseCase();

  it('prefers the explicit query locale over everything else', () => {
    expect(
      useCase.execute({ queryLocale: 'mg', cookieLocale: 'FR', acceptLanguageHeader: 'fr-FR' }),
    ).toBe('MG');
  });

  it('falls back to the cookie when there is no valid query locale', () => {
    expect(useCase.execute({ cookieLocale: 'MG', acceptLanguageHeader: 'fr-FR' })).toBe('MG');
  });

  it('falls back to the Accept-Language header when there is no query or cookie locale', () => {
    expect(useCase.execute({ acceptLanguageHeader: 'mg,fr;q=0.5' })).toBe('MG');
  });

  it('falls back to FR when nothing resolves', () => {
    expect(useCase.execute({})).toBe('FR');
    expect(useCase.execute({ queryLocale: 'en', acceptLanguageHeader: 'de-DE' })).toBe('FR');
  });

  it('ignores an invalid query locale and falls through to the cookie', () => {
    expect(useCase.execute({ queryLocale: 'xx', cookieLocale: 'MG' })).toBe('MG');
  });
});
