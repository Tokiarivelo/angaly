import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Locale as SharedLocale } from '@angaly/types';

import { SupportedLocalesResponseDto } from '../../application/dtos/supported-locales.dto';
import { Locale, SUPPORTED_LOCALES } from '../../domain/value-objects/locale.vo';
import { CurrentLocale } from '../decorators/current-locale.decorator';

@ApiTags('I18n')
@Controller('i18n')
export class I18nController {
  @Get('locales')
  @ApiOperation({
    summary: 'List supported locales and the locale resolved for this request',
    description: 'Resolution order: ?locale= query > cookie > Accept-Language header > FR fallback.',
  })
  @ApiResponse({ status: 200, type: SupportedLocalesResponseDto })
  getLocales(@CurrentLocale() current: Locale): SupportedLocalesResponseDto {
    return {
      locales: SUPPORTED_LOCALES.map((locale) => locale as SharedLocale),
      current: current as SharedLocale,
    };
  }
}
