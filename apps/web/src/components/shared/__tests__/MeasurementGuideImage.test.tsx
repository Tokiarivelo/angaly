import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { MEASUREMENT_KEYS } from '@angaly/types';
import { MeasurementGuideImage, measurementGuideSrc } from '../MeasurementGuideImage';

describe('MeasurementGuideImage', () => {
  it('has a picture for every measurement of the catalogue', () => {
    for (const key of MEASUREMENT_KEYS) {
      const src = measurementGuideSrc(key);
      expect(src, key).toBe(`/images/measurement-guide/${key}.webp`);
      expect(existsSync(resolve(__dirname, '../../../../public', src!.slice(1))), key).toBe(true);
    }
  });

  it('renders nothing for an unknown key', () => {
    expect(measurementGuideSrc('INCONNUE')).toBeNull();
    const { container } = render(<MeasurementGuideImage measurementKey="INCONNUE" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('describes the picture with the measurement label', () => {
    render(<MeasurementGuideImage measurementKey="TOUR_TAILLE" />);
    expect(screen.getByAltText('Où prendre la mesure : Tour de taille')).toBeInTheDocument();
  });
});
