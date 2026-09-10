import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { Roles } from '../../../auth/presentation/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/presentation/guards/roles.guard';
import type { AccessTokenPayload } from '../../../auth/domain/services/access-token.service';
import { DesignBriefDto } from '../../application/dtos/design-brief.dto';
import { QuoteResponseDto } from '../../application/dtos/quote-response.dto';
import { RequestQuoteChangeDto } from '../../application/dtos/request-quote-change.dto';
import { SendQuoteDto } from '../../application/dtos/send-quote.dto';
import { SurMesureRequestDto } from '../../application/dtos/sur-mesure-request.dto';
import { UpdateQuoteDraftDto } from '../../application/dtos/update-quote-draft.dto';
import { AcceptQuoteUseCase } from '../../application/use-cases/accept-quote.use-case';
import { CreateQuoteFromDesignBriefUseCase } from '../../application/use-cases/create-quote-from-design-brief.use-case';
import { CreateQuoteFromSurMesureRequestUseCase } from '../../application/use-cases/create-quote-from-sur-mesure-request.use-case';
import { ExportQuotePdfUseCase } from '../../application/use-cases/export-quote-pdf.use-case';
import { GetQuoteByNumberUseCase } from '../../application/use-cases/get-quote-by-number.use-case';
import { RejectQuoteUseCase } from '../../application/use-cases/reject-quote.use-case';
import { RequestQuoteChangeUseCase } from '../../application/use-cases/request-quote-change.use-case';
import { SendQuoteUseCase } from '../../application/use-cases/send-quote.use-case';
import { UpdateQuoteDraftUseCase } from '../../application/use-cases/update-quote-draft.use-case';
import { QuoteMapper } from '../../infrastructure/mappers/quote.mapper';

/**
 * All routes require an authenticated `CLIENT` (or staff for `/send`) —
 * `Quote.customerId` is a mandatory FK (see docs/features/quotes.md "Points
 * d'attention"), so `demande-sur-mesure`/`personnalisation-creation` require
 * sign-in before submission rather than supporting an anonymous visitor.
 * Each use-case resolves `Customer.id` from the JWT `sub` (userId) itself —
 * same pattern as `customers`.`get-customer-profile.use-case.ts` — so this
 * controller never touches a repository directly (rule absolue #15).
 */
@ApiTags('Quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(
    private readonly createQuoteFromSurMesureRequestUseCase: CreateQuoteFromSurMesureRequestUseCase,
    private readonly createQuoteFromDesignBriefUseCase: CreateQuoteFromDesignBriefUseCase,
    private readonly updateQuoteDraftUseCase: UpdateQuoteDraftUseCase,
    private readonly sendQuoteUseCase: SendQuoteUseCase,
    private readonly getQuoteByNumberUseCase: GetQuoteByNumberUseCase,
    private readonly acceptQuoteUseCase: AcceptQuoteUseCase,
    private readonly rejectQuoteUseCase: RejectQuoteUseCase,
    private readonly requestQuoteChangeUseCase: RequestQuoteChangeUseCase,
    private readonly exportQuotePdfUseCase: ExportQuotePdfUseCase,
  ) {}

  @Post('requests')
  @ApiOperation({ summary: 'Submit a sur-mesure request (demande-sur-mesure, 3-step form) — creates a DRAFT quote' })
  @ApiResponse({ status: 201, type: QuoteResponseDto })
  async createFromSurMesureRequest(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SurMesureRequestDto,
  ): Promise<QuoteResponseDto> {
    const quote = await this.createQuoteFromSurMesureRequestUseCase.execute({
      userId: user.sub,
      garmentType: dto.garmentType,
      occasion: dto.occasion ?? null,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
      budgetRange: dto.budgetRange ?? null,
      fabricPreference: dto.fabricPreference ?? null,
      message: dto.message ?? null,
      inspirationMediaIds: dto.inspirationMediaIds ?? [],
    });
    return QuoteMapper.toResponseDto(quote);
  }

  @Post('design-briefs')
  @ApiOperation({ summary: 'Submit a design brief (personnalisation-creation) — creates a DRAFT quote' })
  @ApiResponse({ status: 201, type: QuoteResponseDto })
  async createFromDesignBrief(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: DesignBriefDto,
  ): Promise<QuoteResponseDto> {
    const quote = await this.createQuoteFromDesignBriefUseCase.execute({
      userId: user.sub,
      creationId: dto.creationId,
      options: dto.options,
      notes: dto.notes ?? null,
      inspirationMediaIds: dto.inspirationMediaIds ?? [],
    });
    return QuoteMapper.toResponseDto(quote);
  }

  @Patch('design-briefs/:id')
  @ApiOperation({ summary: 'Incrementally save a design-brief draft (DRAFT only, owner only)' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  async updateDraft(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDraftDto,
  ): Promise<QuoteResponseDto> {
    const quote = await this.updateQuoteDraftUseCase.execute({
      quoteId: id,
      userId: user.sub,
      options: dto.options ?? null,
      notes: dto.notes ?? null,
      inspirationMediaIds: dto.inspirationMediaIds ?? null,
    });
    return QuoteMapper.toResponseDto(quote);
  }

  @Post(':quoteNumber/send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Staff: price a DRAFT quote and send it to the customer (DRAFT -> SENT)' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  async send(@Param('quoteNumber') quoteNumber: string, @Body() dto: SendQuoteDto): Promise<QuoteResponseDto> {
    const quote = await this.sendQuoteUseCase.execute({
      quoteNumber,
      lineItems: dto.lineItems,
      depositAmount: dto.depositAmount,
      total: dto.total,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      estimatedDelayDays: dto.estimatedDelayDays ?? null,
    });
    return QuoteMapper.toResponseDto(quote);
  }

  @Get(':quoteNumber')
  @ApiOperation({ summary: 'Consult a quote by number (owner only) — transitions SENT -> VIEWED on first read' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  async getByNumber(
    @CurrentUser() user: AccessTokenPayload,
    @Param('quoteNumber') quoteNumber: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.getQuoteByNumberUseCase.execute(quoteNumber, user.sub);
    return QuoteMapper.toResponseDto(quote);
  }

  @Post(':quoteNumber/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a SENT/VIEWED quote (owner only)' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  async accept(
    @CurrentUser() user: AccessTokenPayload,
    @Param('quoteNumber') quoteNumber: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.acceptQuoteUseCase.execute(quoteNumber, user.sub);
    return QuoteMapper.toResponseDto(quote);
  }

  @Post(':quoteNumber/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a SENT/VIEWED quote (owner only)' })
  @ApiResponse({ status: 200, type: QuoteResponseDto })
  async reject(
    @CurrentUser() user: AccessTokenPayload,
    @Param('quoteNumber') quoteNumber: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.rejectQuoteUseCase.execute(quoteNumber, user.sub);
    return QuoteMapper.toResponseDto(quote);
  }

  @Post(':quoteNumber/request-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a free-text change request to staff (owner only, does not change status)' })
  @ApiResponse({ status: 200 })
  async requestChange(
    @CurrentUser() user: AccessTokenPayload,
    @Param('quoteNumber') quoteNumber: string,
    @Body() dto: RequestQuoteChangeDto,
  ): Promise<void> {
    await this.requestQuoteChangeUseCase.execute(quoteNumber, user.sub, dto.message);
  }

  @Get(':quoteNumber/pdf')
  @ApiOperation({ summary: 'Export the quote as a PDF, uploaded via `media` (owner only)' })
  @ApiResponse({ status: 200, description: 'Public URL of the generated PDF' })
  async exportPdf(
    @CurrentUser() user: AccessTokenPayload,
    @Param('quoteNumber') quoteNumber: string,
  ): Promise<{ url: string }> {
    const url = await this.exportQuotePdfUseCase.execute(quoteNumber, user.sub);
    return { url };
  }
}
