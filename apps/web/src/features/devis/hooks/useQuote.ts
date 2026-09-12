import { useQuoteQuery } from '../api/quotes.api';

export const useQuote = (quoteNumber: string) => {
  return useQuoteQuery(quoteNumber);
};
