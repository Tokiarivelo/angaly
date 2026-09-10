import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import { QuoteEntity } from '../../domain/entities/quote.entity';
import { IQuotePdfRenderer } from '../../domain/repositories/quote-pdf-renderer.gateway';

const PAGE_MARGIN = 50;
const LINE_HEIGHT = 18;

/** Minimal single-page text rendering — see docs/features/quotes.md "export-quote-pdf". */
@Injectable()
export class QuotePdfService implements IQuotePdfRenderer {
  async render(quote: QuoteEntity): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let cursorY = page.getHeight() - PAGE_MARGIN;
    const drawLine = (text: string, options: { bold?: boolean; size?: number } = {}) => {
      page.drawText(text, {
        x: PAGE_MARGIN,
        y: cursorY,
        size: options.size ?? 11,
        font: options.bold ? boldFont : font,
        color: rgb(0.1, 0.1, 0.1),
      });
      cursorY -= LINE_HEIGHT;
    };

    drawLine(`Devis ${quote.quoteNumber}`, { bold: true, size: 16 });
    cursorY -= LINE_HEIGHT / 2;
    drawLine(`Statut : ${quote.status}`);
    if (quote.validUntil) {
      drawLine(`Valide jusqu'au : ${quote.validUntil.toISOString().slice(0, 10)}`);
    }
    if (quote.estimatedDelayDays !== null) {
      drawLine(`Délai estimé : ${quote.estimatedDelayDays} jours`);
    }
    cursorY -= LINE_HEIGHT / 2;

    drawLine('Description', { bold: true });
    for (const descriptionLine of quote.description.split('\n')) {
      drawLine(descriptionLine);
    }
    cursorY -= LINE_HEIGHT / 2;

    if (quote.lineItems.length > 0) {
      drawLine('Détail', { bold: true });
      for (const item of quote.lineItems) {
        drawLine(`${item.label} — ${item.quantity} x ${item.unitPrice} €`);
      }
      cursorY -= LINE_HEIGHT / 2;
    }

    drawLine(`Sous-total : ${quote.subtotal} €`);
    drawLine(`Acompte : ${quote.depositAmount} €`);
    drawLine(`Solde : ${quote.balanceAmount} €`);
    drawLine(`Total : ${quote.total} €`, { bold: true });

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}
