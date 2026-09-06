import { Injectable } from '@nestjs/common';

import {
  DEFAULT_LOCALE,
  Locale,
  normalizeLocale,
  parseAcceptLanguage,
} from '../../domain/value-objects/locale.vo';

export interface ResolveRequestLocaleInput {
  queryLocale?: string;
  cookieLocale?: string;
  acceptLanguageHeader?: string;
}

/** Priority: explicit ?locale= query > cookie preference > Accept-Language header > FR fallback. */
@Injectable()
export class ResolveRequestLocaleUseCase {
  execute(input: ResolveRequestLocaleInput): Locale {
    return (
      normalizeLocale(input.queryLocale) ??
      normalizeLocale(input.cookieLocale) ??
      parseAcceptLanguage(input.acceptLanguageHeader) ??
      DEFAULT_LOCALE
    );
  }
}
