import type { Request } from 'express';

import type { Locale } from '../../domain/value-objects/locale.vo';

export interface RequestWithLocale extends Request {
  locale?: Locale;
}
