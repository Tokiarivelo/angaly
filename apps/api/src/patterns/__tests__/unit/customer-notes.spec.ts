import { mergePatternExtParameters, validatePatternExtParameters } from '@angaly/types';
import { customerNoteWarnings } from '../../application/services/customer-notes';

describe('customer notes and fabric (what the choices do not cover)', () => {
  it('keeps notes (as typed) for known groups, a general note and bounded measurements; rejects the rest', () => {
    const { value, issues } = validatePatternExtParameters({
      fabric: 'STRETCH',
      notes: {
        details: { poches: '  Poche ticket sur la poche droite  ', inconnu: 'x' },
        general: 'Ourlet à 2 cm du sol avec talons de 7 cm',
        measurements: [{ label: 'Tour de mollet', cm: 36 }, { label: '', cm: 10 }, { label: 'Trop', cm: 900 }],
      },
    });
    expect(value.fabric).toBe('STRETCH');
    expect(value.notes).toEqual({
      details: { poches: '  Poche ticket sur la poche droite  ' },
      general: 'Ourlet à 2 cm du sol avec talons de 7 cm',
      measurements: [{ label: 'Tour de mollet', cm: 36 }],
    });
    expect(issues.map((i) => i.path)).toEqual(expect.arrayContaining(['notes.details.inconnu', 'notes.measurements.1', 'notes.measurements.2']));
    expect(validatePatternExtParameters({ fabric: 'CUIR' }).issues[0]?.path).toBe('fabric');
  });

  it('takes the customer’s fabric over the photo’s, and the notes only from the customer', () => {
    const merged = mergePatternExtParameters({ fabric: 'FLUIDE' }, { fabric: 'RIGIDE', notes: { general: 'from photo' } });
    expect(merged.value.fabric).toBe('FLUIDE');
    expect(merged.value.notes).toBeUndefined();
  });

  it('turns the notes into notices for the atelier', () => {
    const lines = customerNoteWarnings({ details: { poches_dos: ' Rabat boutonné ', poches: '   ' }, general: 'Doublure jusqu’au genou', measurements: [{ label: 'Tour de mollet', cm: 36 }] });
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Poches dos');
    expect(lines[0]).toContain('« Rabat boutonné »');
    expect(lines[2]).toContain('Tour de mollet 36 cm');
    expect(customerNoteWarnings(null)).toEqual([]);
  });
});
