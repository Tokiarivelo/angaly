import type { QuoteStatus } from '../value-objects/quote-status-transition.vo';
import { isQuoteStatus } from '../value-objects/quote-status-transition.vo';

/**
 * Money fields are decimal strings, never floats — mirrors
 * `products/domain/value-objects/price.vo.ts`: Prisma's `Decimal(12,2)`
 * columns are read as Decimal.js objects and converted to `.toString()` at
 * the repository boundary, so nothing here risks float precision loss.
 */
const DECIMAL_STRING_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isValidDecimalAmount(amount: string): boolean {
  return DECIMAL_STRING_PATTERN.test(amount);
}

export interface QuoteLineItem {
  label: string;
  quantity: number;
  /** Decimal string, e.g. "20.00" — see isValidDecimalAmount. */
  unitPrice: string;
}

export interface QuoteProps {
  id: string;
  quoteNumber: string;
  customerId: string;
  creationId: string | null;
  description: string;
  lineItems: QuoteLineItem[];
  subtotal: string;
  depositAmount: string;
  balanceAmount: string;
  total: string;
  status: string;
  validUntil: Date | null;
  estimatedDelayDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NormalizedQuoteProps extends Omit<QuoteProps, 'status'> {
  status: QuoteStatus;
}

const CENTS_EPSILON = 0.01;

function roughlyEquals(a: number, b: number): boolean {
  return Math.abs(a - b) < CENTS_EPSILON;
}

function sumLineItems(lineItems: QuoteLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
}

/**
 * Invariants (docs/features/quotes.md): subtotal = Σ lineItems, deposit +
 * balance = total. Holds trivially for a fresh DRAFT (empty lineItems, every
 * amount at "0"/"0.00") and is re-checked whenever `send-quote` prices the quote.
 */
export class QuoteEntity {
  private constructor(private readonly props: NormalizedQuoteProps) {}

  static create(props: QuoteProps): QuoteEntity {
    if (!props.quoteNumber.trim()) {
      throw new Error('Quote.quoteNumber must not be empty');
    }
    if (!props.customerId.trim()) {
      throw new Error('Quote.customerId must not be empty');
    }
    if (!props.description.trim()) {
      throw new Error('Quote.description must not be empty');
    }
    if (!isQuoteStatus(props.status)) {
      throw new Error(`Quote.status must be a recognized QuoteStatus, got "${props.status}"`);
    }
    for (const item of props.lineItems) {
      if (!item.label.trim()) {
        throw new Error('QuoteLineItem.label must not be empty');
      }
      if (item.quantity <= 0) {
        throw new Error('QuoteLineItem.quantity must be > 0');
      }
      if (!isValidDecimalAmount(item.unitPrice)) {
        throw new Error('QuoteLineItem.unitPrice must be a non-negative decimal string with at most 2 decimal places');
      }
    }
    for (const [field, value] of Object.entries({
      subtotal: props.subtotal,
      depositAmount: props.depositAmount,
      balanceAmount: props.balanceAmount,
      total: props.total,
    })) {
      if (!isValidDecimalAmount(value)) {
        throw new Error(`Quote.${field} must be a non-negative decimal string with at most 2 decimal places`);
      }
    }
    if (props.lineItems.length > 0 && !roughlyEquals(sumLineItems(props.lineItems), Number(props.subtotal))) {
      throw new Error('Quote.subtotal must equal the sum of lineItems (quantity × unitPrice)');
    }
    if (!roughlyEquals(Number(props.depositAmount) + Number(props.balanceAmount), Number(props.total))) {
      throw new Error('Quote.depositAmount + Quote.balanceAmount must equal Quote.total');
    }
    return new QuoteEntity({ ...props, status: props.status });
  }

  get id(): string {
    return this.props.id;
  }

  get quoteNumber(): string {
    return this.props.quoteNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get creationId(): string | null {
    return this.props.creationId;
  }

  get description(): string {
    return this.props.description;
  }

  get lineItems(): QuoteLineItem[] {
    return this.props.lineItems;
  }

  get subtotal(): string {
    return this.props.subtotal;
  }

  get depositAmount(): string {
    return this.props.depositAmount;
  }

  get balanceAmount(): string {
    return this.props.balanceAmount;
  }

  get total(): string {
    return this.props.total;
  }

  get status(): QuoteStatus {
    return this.props.status;
  }

  get validUntil(): Date | null {
    return this.props.validUntil;
  }

  get estimatedDelayDays(): number | null {
    return this.props.estimatedDelayDays;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
