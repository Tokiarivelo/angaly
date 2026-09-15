import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EstimatedMeasurementsBanner } from '../ui/EstimatedMeasurementsBanner';

describe('EstimatedMeasurementsBanner', () => {
  it('renders nothing when no measurement was estimated', () => {
    const { container } = render(<EstimatedMeasurementsBanner estimatedKeys={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the estimated measurement keys and flags them as indicative', () => {
    render(<EstimatedMeasurementsBanner estimatedKeys={['TOUR_BASSIN', 'CARRURE_DOS']} />);

    expect(screen.getByText(/estimées par l'IA/i)).toBeInTheDocument();
    expect(screen.getByText(/TOUR_BASSIN, CARRURE_DOS/)).toBeInTheDocument();
  });
});
