import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { ResolveRequestLocaleUseCase } from './application/use-cases/resolve-request-locale.use-case';
import { I18nController } from './presentation/controllers/i18n.controller';
import { LocaleMiddleware } from './presentation/middlewares/locale.middleware';

@Module({
  controllers: [I18nController],
  providers: [ResolveRequestLocaleUseCase],
})
export class I18nModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LocaleMiddleware).forRoutes('*');
  }
}
