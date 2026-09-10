'use client';

import { useMemo, useState } from 'react';
import type { ProductVariantDto } from '@angaly/types';

import { SIZE_SORT_ORDER } from '../consts/queryKeys';

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_SORT_ORDER.indexOf(a as (typeof SIZE_SORT_ORDER)[number]);
    const indexB = SIZE_SORT_ORDER.indexOf(b as (typeof SIZE_SORT_ORDER)[number]);
    if (indexA === -1 || indexB === -1) return a.localeCompare(b);
    return indexA - indexB;
  });
}

/** A variant is sellable once its real stock (available - reserved) is positive. */
function isVariantInStock(variant: ProductVariantDto): boolean {
  return variant.quantityAvailable - variant.quantityReserved > 0;
}

/**
 * Resolves the selected (size, color) pair to a real ProductVariant — a
 * product page always starts on the first in-stock variant, never a
 * combination that doesn't exist. Switching size/color that would produce a
 * non-existent pair falls back to the first variant sharing the newly
 * chosen dimension, rather than leaving the selection dangling.
 */
export function useProductVariantSelection(variants: ProductVariantDto[]): {
  sizes: string[];
  colors: string[];
  selectedSize: string | null;
  selectedColor: string | null;
  selectedVariant: ProductVariantDto | null;
  isSizeAvailable: (size: string) => boolean;
  selectSize: (size: string) => void;
  selectColor: (color: string) => void;
} {
  const firstVariant = variants[0] ?? null;
  const [selectedSize, setSelectedSize] = useState<string | null>(firstVariant?.size ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(firstVariant?.color ?? null);

  const sizes = useMemo(() => sortSizes(Array.from(new Set(variants.map((variant) => variant.size)))), [variants]);
  const colors = useMemo(() => Array.from(new Set(variants.map((variant) => variant.color))), [variants]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.size === selectedSize && variant.color === selectedColor) ?? null,
    [variants, selectedSize, selectedColor],
  );

  const isSizeAvailable = (size: string) => variants.some((variant) => variant.size === size && isVariantInStock(variant));

  const selectSize = (size: string) => {
    setSelectedSize(size);
    const hasCurrentColor = variants.some((variant) => variant.size === size && variant.color === selectedColor);
    if (!hasCurrentColor) {
      const fallback = variants.find((variant) => variant.size === size);
      setSelectedColor(fallback?.color ?? selectedColor);
    }
  };

  const selectColor = (color: string) => {
    setSelectedColor(color);
    const hasCurrentSize = variants.some((variant) => variant.color === color && variant.size === selectedSize);
    if (!hasCurrentSize) {
      const fallback = variants.find((variant) => variant.color === color);
      setSelectedSize(fallback?.size ?? selectedSize);
    }
  };

  return { sizes, colors, selectedSize, selectedColor, selectedVariant, isSizeAvailable, selectSize, selectColor };
}
