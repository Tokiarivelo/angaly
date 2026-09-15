import { GetSizeChartsUseCase } from '../../application/use-cases/get-size-charts.use-case';

describe('GetSizeChartsUseCase', () => {
  let useCase: GetSizeChartsUseCase;

  beforeEach(() => {
    useCase = new GetSizeChartsUseCase();
  });

  it('returns both charts when no gender is given', () => {
    const result = useCase.execute() as Record<string, unknown[]>;
    expect(Object.keys(result).sort()).toEqual(['FEMME', 'HOMME']);
    expect(result.FEMME?.length).toBeGreaterThan(0);
    expect(result.HOMME?.length).toBeGreaterThan(0);
  });

  it('returns only the FEMME chart, with XS through XL sizes present', () => {
    const result = useCase.execute('FEMME') as Array<{ label: string }>;
    const labels = result.map((entry) => entry.label);
    expect(labels).toEqual(expect.arrayContaining(['XS', 'S', 'M', 'L', 'XL']));
  });

  it('returns each entry with all six canonical measurement keys', () => {
    const result = useCase.execute('HOMME') as Array<{ measurements: Record<string, number> }>;
    for (const entry of result) {
      expect(Object.keys(entry.measurements).sort()).toEqual(
        ['CARRURE_DOS', 'LONGUEUR_DOS', 'TOUR_BASSIN', 'TOUR_COU', 'TOUR_POITRINE', 'TOUR_TAILLE'].sort(),
      );
    }
  });
});
