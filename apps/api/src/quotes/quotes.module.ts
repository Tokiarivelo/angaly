import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { CreationsModule } from '../creations/creations.module';
import { CustomersModule } from '../customers/customers.module';
import { MediaModule } from '../media/media.module';
import { AcceptQuoteUseCase } from './application/use-cases/accept-quote.use-case';
import { CreateQuoteFromDesignBriefUseCase } from './application/use-cases/create-quote-from-design-brief.use-case';
import { CreateQuoteFromSurMesureRequestUseCase } from './application/use-cases/create-quote-from-sur-mesure-request.use-case';
import { ExportQuotePdfUseCase } from './application/use-cases/export-quote-pdf.use-case';
import { GetQuoteByNumberUseCase } from './application/use-cases/get-quote-by-number.use-case';
import { RejectQuoteUseCase } from './application/use-cases/reject-quote.use-case';
import { RequestQuoteChangeUseCase } from './application/use-cases/request-quote-change.use-case';
import { SendQuoteUseCase } from './application/use-cases/send-quote.use-case';
import { UpdateQuoteDraftUseCase } from './application/use-cases/update-quote-draft.use-case';
import { QUOTE_PDF_RENDERER } from './domain/repositories/quote-pdf-renderer.gateway';
import { QUOTE_REPOSITORY } from './domain/repositories/quote.repository';
import { PrismaQuoteRepository } from './infrastructure/repositories/prisma-quote.repository';
import { QuotePdfService } from './infrastructure/services/quote-pdf.service';
import { QuotesController } from './presentation/controllers/quotes.controller';

@Module({
  // AuthModule: JwtAuthGuard/RolesGuard (all routes) + ACCESS_TOKEN_SERVICE indirectly via guards.
  // CustomersModule: CUSTOMER_REPOSITORY (resolves the caller's Customer.id from the JWT userId).
  // CreationsModule: CREATION_REPOSITORY (validates Quote.creationId on a design-brief intake).
  // MediaModule: UploadMediaBufferUseCase (export-quote-pdf uploads the generated PDF).
  imports: [AuthModule, CustomersModule, CreationsModule, MediaModule],
  controllers: [QuotesController],
  providers: [
    CreateQuoteFromSurMesureRequestUseCase,
    CreateQuoteFromDesignBriefUseCase,
    UpdateQuoteDraftUseCase,
    SendQuoteUseCase,
    GetQuoteByNumberUseCase,
    AcceptQuoteUseCase,
    RejectQuoteUseCase,
    RequestQuoteChangeUseCase,
    ExportQuotePdfUseCase,
    { provide: QUOTE_REPOSITORY, useClass: PrismaQuoteRepository },
    { provide: QUOTE_PDF_RENDERER, useClass: QuotePdfService },
  ],
})
export class QuotesModule {}
