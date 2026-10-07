import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreationProjectAiPatternModal } from '../ui/CreationProjectAiPatternModal';
import type { GenerateCreationProjectAiPatternResponseDto } from '@angaly/types';

const MOCK_RESPONSE: GenerateCreationProjectAiPatternResponseDto = {
  pieces: [
    {
      name: 'Corsage Devant',
      outlineMm: [{ x: 0, y: 0 }, { x: 200, y: 0 }],
      seamAllowanceMm: 15,
      grainline: { angleDegrees: 90, originX: 100, originY: 200 },
      notches: [],
      widthMm: 200,
      heightMm: 400,
    },
    {
      name: 'Jupe Évasée',
      outlineMm: [{ x: 0, y: 0 }, { x: 300, y: 0 }],
      seamAllowanceMm: 15,
      grainline: { angleDegrees: 90, originX: 150, originY: 300 },
      notches: [],
      widthMm: 450,
      heightMm: 700,
    },
  ],
  parameters: {
    garmentType: 'ROBE',
    cutType: 'EVASEE',
    details: { encolure: 'bateau', manches: 'courtes' },
  },
  measurements: { bust: 88, waist: 70, hips: 94 },
  aiSuggestion: {
    suggestedCutType: 'EVASEE',
    suggestedDetails: { aisancePoitrine: '4cm', finitions: 'ourlet invisible' },
    confidence: 0.94,
    modelVersion: 'gemini-1.5-pro',
    isIndicativeOnly: false,
  },
  svgContent: '<svg id="test-pattern-svg"><g id="pieces"><rect width="100" height="100" /></g></svg>',
  svgDataUri: 'data:image/svg+xml;utf8,<svg></svg>',
};

describe('CreationProjectAiPatternModal', () => {
  const onGeneratePattern = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <CreationProjectAiPatternModal
        isOpen={false}
        onClose={onClose}
        projectReference="CRP-2026-TEST"
        onGeneratePattern={onGeneratePattern}
        isGenerating={false}
      />,
    );

    expect(screen.queryByText('Génération de Patron par IA')).not.toBeInTheDocument();
  });

  it('renders modal with Haute Couture title and project reference when open', () => {
    render(
      <CreationProjectAiPatternModal
        isOpen={true}
        onClose={onClose}
        projectReference="CRP-2026-TEST"
        projectTitle="Robe de bal"
        onGeneratePattern={onGeneratePattern}
        isGenerating={false}
      />,
    );

    expect(screen.getByText('Génération de Patron par IA')).toBeInTheDocument();
    expect(screen.getByText(/CRP-2026-TEST/)).toBeInTheDocument();
    expect(screen.getByText(/Robe de bal/)).toBeInTheDocument();
  });

  it('allows selecting standard sizes and updates measurements', async () => {
    const user = userEvent.setup();
    render(
      <CreationProjectAiPatternModal
        isOpen={true}
        onClose={onClose}
        projectReference="CRP-2026-TEST"
        onGeneratePattern={onGeneratePattern}
        isGenerating={false}
      />,
    );

    // Initial size is T38 (Poitrine 88)
    const bustInput = screen.getByLabelText(/Poitrine \(cm\)/i) as HTMLInputElement;
    expect(bustInput.value).toBe('88');

    // Click on size T42
    const size42Button = screen.getByRole('button', { name: 'T42' });
    await user.click(size42Button);

    // Size 42 has bust 96
    expect(bustInput.value).toBe('96');
  });

  it('submits pattern generation with expected payload and displays results', async () => {
    const user = userEvent.setup();
    onGeneratePattern.mockResolvedValueOnce(MOCK_RESPONSE);

    render(
      <CreationProjectAiPatternModal
        isOpen={true}
        onClose={onClose}
        projectReference="CRP-2026-TEST"
        onGeneratePattern={onGeneratePattern}
        isGenerating={false}
      />,
    );

    // Select garment type 'JUPE'
    const jupeButton = screen.getByRole('button', { name: /Jupe d'atelier/i });
    await user.click(jupeButton);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Générer le patron par IA/i });
    await user.click(submitButton);

    expect(onGeneratePattern).toHaveBeenCalledWith(
      expect.objectContaining({
        garmentType: 'JUPE',
        requestAiSuggestion: true,
        saveMedia: true,
        addNote: true,
      }),
    );

    // Verify result view is rendered
    await waitFor(() => {
      expect(screen.getByText('Patronage géométrique calculé avec succès')).toBeInTheDocument();
    });

    expect(screen.getByText('2 pièces')).toBeInTheDocument();
    expect(screen.getByText(/Indice confiance : 94%/i)).toBeInTheDocument();
    expect(screen.getByText('Corsage Devant')).toBeInTheDocument();
    expect(screen.getByText('Jupe Évasée')).toBeInTheDocument();
    expect(screen.getByText('Télécharger SVG')).toBeInTheDocument();
  });

  it('handles download SVG button click in result view', async () => {
    const user = userEvent.setup();
    onGeneratePattern.mockResolvedValueOnce(MOCK_RESPONSE);

    // Mock createObjectURL & revokeObjectURL
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/test');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    render(
      <CreationProjectAiPatternModal
        isOpen={true}
        onClose={onClose}
        projectReference="CRP-2026-TEST"
        onGeneratePattern={onGeneratePattern}
        isGenerating={false}
      />,
    );

    const submitButton = screen.getByRole('button', { name: /Générer le patron par IA/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Télécharger SVG')).toBeInTheDocument();
    });

    const downloadButton = screen.getByRole('button', { name: /Télécharger SVG/i });
    await user.click(downloadButton);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/test');
  });

  it('shows error alert when generation fails', async () => {
    const user = userEvent.setup();
    onGeneratePattern.mockRejectedValueOnce(new Error('Moteur indisponible'));

    render(
      <CreationProjectAiPatternModal
        isOpen={true}
        onClose={onClose}
        projectReference="CRP-2026-TEST"
        onGeneratePattern={onGeneratePattern}
        isGenerating={false}
      />,
    );

    const submitButton = screen.getByRole('button', { name: /Générer le patron par IA/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText('Moteur indisponible')).toBeInTheDocument();
  });
});
