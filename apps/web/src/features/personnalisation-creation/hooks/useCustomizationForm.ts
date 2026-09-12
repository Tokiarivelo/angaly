import { useState, useCallback } from 'react';
import type { CustomizationOptions } from '../schemas/customization-options.schema';

export function useCustomizationForm(initialData?: Partial<CustomizationOptions>) {
  const [options, setOptions] = useState<CustomizationOptions>({
    ...initialData,
  });

  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [detailsDecoratifs, setDetailsDecoratifs] = useState(initialData?.detailsDecoratifs ?? '');

  const handleOptionChange = useCallback((key: keyof CustomizationOptions, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [key]: prev[key] === value ? undefined : value, // allow toggle off
    }));
  }, []);

  const isValid = Boolean(options.coupe);

  return {
    options: { ...options, notes, detailsDecoratifs },
    setOptions,
    notes,
    setNotes,
    detailsDecoratifs,
    setDetailsDecoratifs,
    handleOptionChange,
    isValid,
  };
}
