import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './shared/health/health.controller';

// Domain modules (auth, users, customers, ateliers, appointments, creations,
// collections, products, orders, payments, quotes, measurements, patterns,
// pattern-engine, ai-inference, reviews, blog, notifications, media, search,
// i18n) are scaffolded as empty directories under src/ — see each module's
// docs/features/<slug>.md and .cursor/rules/006-phase-workflow.mdc. They are
// wired into this module's `imports` array as each is implemented, one phase
// at a time (docs/phases/).
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      cache: true,
    }),
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
