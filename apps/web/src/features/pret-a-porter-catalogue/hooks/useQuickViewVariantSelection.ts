'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductDto, ProductMediaDto, ProductVariantDto } from '@angaly/types';

import { SIZE_SORT_ORDER } from '../consts/queryKeys';

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const indexA = SIZE_SORT_ORDER.indexOf(a as (typeof SIZE_SORT_ORDER)[number]);
    const indexB = SIZE_SORT_ORDER.indexOf(b as (typeof SIZE_SORT_ORDER)[number]);
    if (indexA === -1 || indexB === -1) return a.localeCompare(b);
    return indexA - indexB;
  });
}

function isVariantInStock(variant: ProductVariantDto): boolean {
  return variant.quantityAvailable - variant.quantityReserved > 0;
}

export interface UseQuickViewVariantSelectionResult {
  colors: string[];
  sizes: string[];
  selectedColor: string | null;
  selectedSize: string | null;
  selectedVariant: ProductVariantDto | null;
  media: ProductMediaDto[];
  activeImage: ProductMediaDto | null;
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  isSizeAvailable: (size: string) => boolean;
  selectColor: (color: string) => void;
  selectSize: (size: string) => void;
}

export function useQuickViewVariantSelection(
  product: ProductDto | null,
  initialColor?: string | null,
): UseQuickViewVariantSelectionResult {
  const variants = useMemo(() => product?.variants ?? [], [product]);

  const colors = useMemo(() => Array.from(new Set(variants.map((v) => v.color))), [variants]);

  const sizes = useMemo(
    () => sortSizes(Array.from(new Set(variants.map((v) => v.size)))),
    [variants],
  );

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Sync state when product or initialColor changes
  useEffect(() => {
    if (!product || variants.length === 0) {
      setSelectedColor(null);
      setSelectedSize(null);
      setActiveImageIndex(0);
      return;
    }

    const preferredColor =
      initialColor && colors.includes(initialColor) ? initialColor : (variants[0]?.color ?? null);

    const matchingVariants = variants.filter((v) => v.color === preferredColor);
    const inStock = matchingVariants.find(isVariantInStock);
    const firstMatch = inStock ?? matchingVariants[0] ?? variants[0];

    setSelectedColor(preferredColor);
    setSelectedSize(firstMatch?.size ?? null);
    setActiveImageIndex(0);
  }, [product, initialColor, colors, variants]);

  const selectedVariant = useMemo(() => {
    if (!selectedColor && !selectedSize) return variants[0] ?? null;
    return (
      variants.find((v) => v.color === selectedColor && v.size === selectedSize) ??
      variants.find((v) => v.color === selectedColor) ??
      variants[0] ??
      null
    );
  }, [variants, selectedColor, selectedSize]);

  // Dynamic visual: colorway-specific photos swap
  // 1. If selectedVariant has photos, use them.
  // 2. Otherwise if any variant with selectedColor has photos, use them.
  // 3. Otherwise fall back to product.media.
  const media = useMemo(() => {
    if (!product) return [];
    if (selectedVariant?.media && selectedVariant.media.length > 0) {
      return selectedVariant.media;
    }
    const colorVariantWithMedia = variants.find(
      (v) => v.color === selectedColor && v.media && v.media.length > 0,
    );
    if (colorVariantWithMedia?.media && colorVariantWithMedia.media.length > 0) {
      return colorVariantWithMedia.media;
    }
    return product.media ?? [];
  }, [product, variants, selectedColor, selectedVariant]);

  const activeImage = media[activeImageIndex] ?? media[0] ?? null;

  const isSizeAvailable = (size: string) =>
    variants.some(
      (v) => (selectedColor ? v.color === selectedColor : true) && v.size === size && isVariantInStock(v),
    );

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setActiveImageIndex(0);
    const hasCurrentSize = variants.some((v) => v.color === color && v.size === selectedSize);
    if (!hasCurrentSize) {
      const colorVariants = variants.filter((v) => v.color === color);
      const inStock = colorVariants.find(isVariantInStock);
      const fallback = inStock ?? colorVariants[0];
      if (fallback) {
        setSelectedSize(fallback.size);
      }
    }
  };

  const selectSize = (size: string) => {
    setSelectedSize(size);
    const hasCurrentColor = variants.some((v) => v.size === size && v.color === selectedColor);
    if (!hasCurrentColor) {
      const fallback = variants.find((v) => v.size === size);
      if (fallback) {
        setSelectedColor(fallback.color);
        setActiveImageIndex(0);
      }
    }
  };

  return {
    colors,
    sizes,
    selectedColor,
    selectedSize,
    selectedVariant,
    media,
    activeImage,
    activeImageIndex,
    setActiveImageIndex,
    isSizeAvailable,
    selectColor,
    selectSize,
  };
}
