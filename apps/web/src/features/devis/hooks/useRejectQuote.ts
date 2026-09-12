import { useRejectQuoteMutation } from '../api/quotes.api';

export const useRejectQuote = () => {
  return useRejectQuoteMutation();
};
