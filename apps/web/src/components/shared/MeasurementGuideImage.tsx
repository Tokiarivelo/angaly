import React from 'react';
import Image from 'next/image';
import { getMeasurementDefinition } from '@angaly/types';

/**
 * Where a measurement is taken: the mannequin with the tape's path in gold, rendered in Blender from the 3D body
 * (`apps/cloth-sim/scripts/render_measure_guide.py`, `make guide.cloth`). One picture per catalogue key.
 */
export const measurementGuideSrc = (key: string): string | null =>
  getMeasurementDefinition(key) ? `/images/measurement-guide/${key}.webp` : null;

interface MeasurementGuideImageProps {
  measurementKey: string;
  className?: string;
}

export const MeasurementGuideImage: React.FC<MeasurementGuideImageProps> = ({ measurementKey, className }) => {
  const src = measurementGuideSrc(measurementKey);
  const label = getMeasurementDefinition(measurementKey)?.label;
  if (!src || !label) return null;
  return (
    <Image
      src={src}
      alt={`Où prendre la mesure : ${label}`}
      width={480}
      height={720}
      className={className}
      data-testid="measurement-guide-image"
    />
  );
};
