import type { ExecutionContext } from '@nestjs/common';

import { currentLocaleFactory } from '../../presentation/decorators/current-locale.decorator';
import type { RequestWithLocale } from '../../presentation/types/request-with-locale.type';

function buildContext(request: Partial<RequestWithLocale>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('currentLocaleFactory', () => {
  it('returns the locale attached to the request by LocaleMiddleware', () => {
    const ctx = buildContext({ locale: 'MG' });
    expect(currentLocaleFactory(undefined, ctx)).toBe('MG');
  });

  it('falls back to FR when the request has no resolved locale', () => {
    const ctx = buildContext({});
    expect(currentLocaleFactory(undefined, ctx)).toBe('FR');
  });
});
