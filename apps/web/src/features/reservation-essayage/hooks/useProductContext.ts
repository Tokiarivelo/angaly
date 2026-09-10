'use client';

import { useSearchParams } from 'next/navigation';
import type { ProductDto } from '@angaly/types';

import { useProductSummaryQuery } from '../api/products.api';

export interface UseProductContextResult {
  productId: string;
  sizeFromUrl: string;
  product: ProductDto | null;
  isLoading: boolean;
}

/** Reads `?productId=&size=` (the real query params `fiche-produit`'s "Réserver pour essayage" link sends) and loads the product summary. */
export function useProductContext(): UseProductContextResult {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const sizeFromUrl = searchParams.get('size') ?? '';

  const query = useProductSummaryQuery(productId);

  return {
    productId,
    sizeFromUrl,
    product: query.data ?? null,
    isLoading: query.isLoading,
  };
}
