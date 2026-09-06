import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AteliersModule } from './ateliers/ateliers.module';
import { BlogModule } from './blog/blog.module';
import { CollectionsModule } from './collections/collections.module';
import { CreationsModule } from './creations/creations.module';
import { I18nModule } from './i18n/i18n.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { HealthController } from './shared/health/health.controller';

// Remaining domain modules (auth, users, customers, appointments, products,
// orders, payments, quotes, measurements, patterns, pattern-engine,
// ai-inference, reviews, notifications) are scaffolded as empty directories
// under src/ — see each module's docs/features/<slug>.md and
// .cursor/rules/006-phase-workflow.mdc. They are wired into this module's
// `imports` array as each is implemented, one phase at a time
// (docs/phases/).
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      cache: true,
    }),
    PrismaModule,
    MediaModule,
    I18nModule,
    CreationsModule,
    CollectionsModule,
    AteliersModule,
    BlogModule,
    SearchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
