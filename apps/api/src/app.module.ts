import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppointmentsModule } from './appointments/appointments.module';
import { AteliersModule } from './ateliers/ateliers.module';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { CategoriesModule } from './categories/categories.module';
import { CollectionsModule } from './collections/collections.module';
import { CreationsModule } from './creations/creations.module';
import { CustomersModule } from './customers/customers.module';
import { I18nModule } from './i18n/i18n.module';
import { MediaModule } from './media/media.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { QuotesModule } from './quotes/quotes.module';
import { SearchModule } from './search/search.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { AiInferenceModule } from './ai-inference/ai-inference.module';
import { ReviewsModule } from './reviews/reviews.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PatternsModule } from './patterns/patterns.module';
import { HealthController } from './shared/health/health.controller';

// Remaining domain modules (users, orders, payments, measurements,
// patterns, pattern-engine, ai-inference, reviews, notifications) are
// scaffolded as empty directories under src/ —
// see each module's docs/features/<slug>.md and
// .cursor/rules/006-phase-workflow.mdc. They are wired into this module's
// `imports` array as each is implemented, one phase at a time
// (docs/phases/). `Customer` row creation at registration still goes
// through AuthModule/PrismaUserRepository.createWithCustomer (a single
// Prisma transaction with `User` — see docs/features/auth.md "Points
// d'attention"); `customers` below covers everything else (profile reads/
// updates, favorites).
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
    AuthModule,
    CategoriesModule,
    CreationsModule,
    CollectionsModule,
    CustomersModule,
    ProductsModule,
    AteliersModule,
    AppointmentsModule,
    BlogModule,
    SearchModule,
    QuotesModule,
    MeasurementsModule,
    AiInferenceModule,
    ReviewsModule,
    OrdersModule,
    PaymentsModule,
    PatternsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
