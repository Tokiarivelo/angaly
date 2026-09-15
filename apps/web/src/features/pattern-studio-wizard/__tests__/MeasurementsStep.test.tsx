import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { MeasurementsStep } from '../ui/steps/MeasurementsStep';
import * as useMeasurementProfilesModule from '../hooks/useMeasurementProfiles';
import * as useSizeChartsModule from '../hooks/useSizeCharts';

vi.mock('../hooks/useMeasurementProfiles');
vi.mock('../hooks/useSizeCharts');

describe('MeasurementsStep', () => {
  const onSelectProfile = vi.fn();
  const onUpdateMeasurement = vi.fn();
  const onApplyMeasurements = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMeasurementProfilesModule.useMeasurementProfiles).mockReturnValue({
      data: [],
    } as any);
    vi.mocked(useSizeChartsModule.useSizeCharts).mockReturnValue({
      data: [
        { label: 'S', frSize: '38', measurements: { TOUR_POITRINE: 88, TOUR_TAILLE: 70, TOUR_BASSIN: 94, LONGUEUR_DOS: 41.5, CARRURE_DOS: 36, TOUR_COU: 35 } },
        { label: 'M', frSize: '40', measurements: { TOUR_POITRINE: 92, TOUR_TAILLE: 74, TOUR_BASSIN: 98, LONGUEUR_DOS: 42, CARRURE_DOS: 37, TOUR_COU: 36 } },
      ],
      isLoading: false,
    } as any);
  });

  it('renders the six canonical measurement fields', () => {
    render(
      <MeasurementsStep
        onSelectProfile={onSelectProfile}
        onUpdateMeasurement={onUpdateMeasurement}
        onApplyMeasurements={onApplyMeasurements}
      />,
    );

    for (const label of ['Tour de poitrine', 'Tour de taille', 'Tour de bassin', 'Longueur dos', 'Carrure dos', 'Tour de cou']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('does not show the standard-size picker until that mode is selected', () => {
    render(
      <MeasurementsStep
        onSelectProfile={onSelectProfile}
        onUpdateMeasurement={onUpdateMeasurement}
        onApplyMeasurements={onApplyMeasurements}
      />,
    );

    expect(screen.queryByText('Choisir une taille standard')).not.toBeInTheDocument();
  });

  it('applies a saved profile\'s values and marks it selected', () => {
    vi.mocked(useMeasurementProfilesModule.useMeasurementProfiles).mockReturnValue({
      data: [
        { id: 'profile-1', label: 'Mesures 2026', unit: 'CM', values: { TOUR_POITRINE: 90 }, createdAt: '2026-01-01' },
      ],
    } as any);

    render(
      <MeasurementsStep
        onSelectProfile={onSelectProfile}
        onUpdateMeasurement={onUpdateMeasurement}
        onApplyMeasurements={onApplyMeasurements}
      />,
    );

    fireEvent.click(screen.getByText('Mesures 2026'));

    expect(onSelectProfile).toHaveBeenCalledWith('profile-1');
    expect(onApplyMeasurements).toHaveBeenCalledWith({ TOUR_POITRINE: 90 });
  });

  it('updates a manual field, converting from inches to centimeters', () => {
    const { container } = render(
      <MeasurementsStep
        onSelectProfile={onSelectProfile}
        onUpdateMeasurement={onUpdateMeasurement}
        onApplyMeasurements={onApplyMeasurements}
      />,
    );

    fireEvent.click(screen.getByText('pouces'));
    const input = container.querySelector('#TOUR_POITRINE');
    expect(input).not.toBeNull();
    fireEvent.change(input as Element, { target: { value: '35' } });

    expect(onUpdateMeasurement).toHaveBeenCalledWith('TOUR_POITRINE', 35 * 2.54);
  });

  it('toggles the measurement hint on demand', () => {
    render(
      <MeasurementsStep
        onSelectProfile={onSelectProfile}
        onUpdateMeasurement={onUpdateMeasurement}
        onApplyMeasurements={onApplyMeasurements}
      />,
    );

    expect(screen.queryByText(/point le plus fort de la poitrine/)).not.toBeInTheDocument();
    const hintButtons = screen.getAllByTitle(/Mesurez horizontalement au point le plus fort de la poitrine/);
    fireEvent.click(hintButtons[0]!);
    expect(screen.getByText(/point le plus fort de la poitrine/)).toBeInTheDocument();
  });

  it('applies the chart measurements for the selected standard size', () => {
    render(
      <MeasurementsStep
        onSelectProfile={onSelectProfile}
        onUpdateMeasurement={onUpdateMeasurement}
        onApplyMeasurements={onApplyMeasurements}
      />,
    );

    fireEvent.click(screen.getByText('Taille standard'));
    expect(screen.getByText('Choisir une taille standard')).toBeInTheDocument();

    fireEvent.click(screen.getByText('M'));

    expect(onApplyMeasurements).toHaveBeenCalledWith({
      TOUR_POITRINE: 92,
      TOUR_TAILLE: 74,
      TOUR_BASSIN: 98,
      LONGUEUR_DOS: 42,
      CARRURE_DOS: 37,
      TOUR_COU: 36,
    });
  });
});
