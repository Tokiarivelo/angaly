import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GenerationNoticesPanel } from '../ui/GenerationNoticesPanel';
import { parseGenerationNotices } from '@/features/pattern-studio-wizard/utils/generation-notices';

const sheet = {
  approach: 'FLAT_BASE_PLUS_MANNEQUIN',
  title: 'Fiche de moulage — partie drapée sur mannequin',
  indicative: true,
  sections: [
    { id: 'ZONES', title: 'Zones à draper', body: 'Traîne à draper.' },
    { id: 'GRAIN', title: 'Sens du fil', body: 'Fil droit.' },
    { id: 'FABRIC', title: 'Quantité de tissu estimée', body: 'Environ 3,2 m.' },
    { id: 'STEPS', title: 'Étapes d’épinglage', body: '1. Régler le mannequin.' },
    { id: 'CAUTIONS', title: 'Précautions', body: 'Valider sur toile.' },
  ],
};

describe('parseGenerationNotices', () => {
  it('reads warnings, approach, sheet and yardage', () => {
    const n = parseGenerationNotices({
      warnings: ['Attention', '', 42],
      constructionApproach: 'FLAT_BASE_PLUS_MANNEQUIN',
      constructionApproachReason: 'Base à plat.',
      mannequinSheet: sheet,
      metadata: { yardage: { lengthMm: 3200 } },
    });
    expect(n.warnings).toEqual(['Attention']);
    expect(n.approach).toEqual({ id: 'FLAT_BASE_PLUS_MANNEQUIN', label: 'Base à plat + moulage sur mannequin', reason: 'Base à plat.' });
    expect(n.mannequinSheet?.sections).toHaveLength(5);
    expect(n.yardageMm).toBe(3200);
  });

  it('tolerates older versions and malformed data', () => {
    for (const input of [null, undefined, {}, { warnings: 'x', constructionApproach: 'NOPE', mannequinSheet: 'x', metadata: 3 }]) {
      expect(parseGenerationNotices(input as never)).toEqual({ warnings: [], approach: null, mannequinSheet: null, yardageMm: null });
    }
    expect(parseGenerationNotices({ mannequinSheet: { title: 't', sections: [{ id: 'HACK', title: 'x', body: 'y' }] } }).mannequinSheet).toBeNull();
  });
});

describe('GenerationNoticesPanel', () => {
  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<GenerationNoticesPanel notices={parseGenerationNotices({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the approach, the warnings as an alert, the yardage and the mannequin sheet', () => {
    render(
      <GenerationNoticesPanel
        notices={parseGenerationNotices({
          warnings: ['Ce vêtement est mixte : …', 'Pièce « Traîne » : tissu d’au moins 150 cm de large requis.'],
          constructionApproach: 'FLAT_BASE_PLUS_MANNEQUIN',
          constructionApproachReason: 'Base ajustée tracée à plat.',
          mannequinSheet: sheet,
          metadata: { yardage: { lengthMm: 3200 } },
        })}
      />,
    );
    expect(screen.getByText('Construction : Base à plat + moulage sur mannequin')).toBeInTheDocument();
    const alert = screen.getByRole('alert');
    expect(within(alert).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/environ 3,2 m en 140 cm/)).toBeInTheDocument();
    expect(screen.getByText('Fiche de moulage — partie drapée sur mannequin')).toBeInTheDocument();
    for (const title of ['Zones à draper', 'Sens du fil', 'Quantité de tissu estimée', 'Étapes d’épinglage', 'Précautions']) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('does not show a mannequin sheet for a fully flat construction', () => {
    render(
      <GenerationNoticesPanel
        notices={parseGenerationNotices({ constructionApproach: 'FLAT_FULL', constructionApproachReason: 'Structuré.', mannequinSheet: sheet })}
      />,
    );
    expect(screen.getByText('Construction : Patron à plat complet')).toBeInTheDocument();
    expect(screen.queryByText('Zones à draper')).not.toBeInTheDocument();
  });
});
