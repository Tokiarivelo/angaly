import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CreationProjectStage } from '@angaly/types';
import { CreationProjectStageWorkspace } from '../ui/CreationProjectStageWorkspace';

describe('CreationProjectStageWorkspace', () => {
  const onSelectStage = vi.fn();
  const onAddNote = vi.fn();
  const onDeleteNote = vi.fn();
  const onUploadMedia = vi.fn();
  const onDeleteMedia = vi.fn();
  const onGoToNextStage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onAddNote.mockResolvedValue(undefined);
    onDeleteNote.mockResolvedValue(undefined);
    onUploadMedia.mockResolvedValue(undefined);
    onDeleteMedia.mockResolvedValue(undefined);
    onGoToNextStage.mockResolvedValue(undefined);
  });

  const sampleNotes = [
    {
      id: 'note-1',
      projectId: 'proj-1',
      stage: CreationProjectStage.PATRON,
      content: 'Aisance poitrine ajustée de 1.5cm sur la toile.',
      authorEmail: 'couture@angaly.mg',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
    },
    {
      id: 'note-2',
      projectId: 'proj-1',
      stage: CreationProjectStage.CONCEPTION,
      content: 'Croquis validé par la cliente.',
      authorEmail: 'styliste@angaly.mg',
      createdAt: '2026-01-20T10:00:00.000Z',
      updatedAt: '2026-01-20T10:00:00.000Z',
    },
  ];

  const sampleMedia = [
    {
      id: 'media-1',
      projectId: 'proj-1',
      stage: CreationProjectStage.PATRON,
      url: 'https://storage.angaly.mg/patron-trace.png',
      title: 'Tracé patron devant',
      fileName: 'patron-trace.png',
      mimeType: 'image/png',
      sizeBytes: 2048576,
      uploadedByEmail: 'couture@angaly.mg',
      createdAt: '2026-02-01T11:00:00.000Z',
    },
    {
      id: 'media-2',
      projectId: 'proj-1',
      stage: CreationProjectStage.PATRON,
      url: 'https://storage.angaly.mg/fiche-mesures.pdf',
      title: 'Fiche mesures client',
      fileName: 'fiche-mesures.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 154200,
      uploadedByEmail: null,
      createdAt: '2026-02-01T11:15:00.000Z',
    },
  ];

  const setup = (props: Partial<React.ComponentProps<typeof CreationProjectStageWorkspace>> = {}) => {
    const defaultProps: React.ComponentProps<typeof CreationProjectStageWorkspace> = {
      currentStage: CreationProjectStage.PATRON,
      selectedStage: CreationProjectStage.PATRON,
      onSelectStage,
      notes: sampleNotes,
      media: sampleMedia,
      onAddNote,
      isAddingNote: false,
      onDeleteNote,
      isDeletingNote: false,
      onUploadMedia,
      isUploadingMedia: false,
      onDeleteMedia,
      isDeletingMedia: false,
      nextStage: CreationProjectStage.CONFECTION,
      onGoToNextStage,
      isAdvancing: false,
      ...props,
    };
    return render(<CreationProjectStageWorkspace {...defaultProps} />);
  };

  it('renders all 6 stages and active indicators', () => {
    setup();

    expect(screen.getByRole('tab', { name: /Consultation/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Conception/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Patron/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Confection/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Essayage/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Terminée/i })).toBeInTheDocument();

    // Check header for selected stage
    expect(screen.getByRole('heading', { level: 3, name: 'Patron' })).toBeInTheDocument();
    expect(screen.getByText('Étape active du projet')).toBeInTheDocument();
  });

  it('calls onSelectStage when another stage tab is clicked', () => {
    setup();

    const essayageTab = screen.getByRole('tab', { name: /Essayage/i });
    fireEvent.click(essayageTab);

    expect(onSelectStage).toHaveBeenCalledWith(CreationProjectStage.ESSAYAGE);
  });

  it('displays stage notes and deletes a note', async () => {
    setup();

    expect(screen.getByText('Aisance poitrine ajustée de 1.5cm sur la toile.')).toBeInTheDocument();
    expect(screen.getByText('Par couture@angaly.mg')).toBeInTheDocument();

    const deleteButton = screen.getByTitle('Supprimer la note');
    fireEvent.click(deleteButton);

    await waitFor(() => expect(onDeleteNote).toHaveBeenCalledWith('note-1'));
  });

  it('submits a new note and resets form input', async () => {
    setup();

    const textarea = screen.getByPlaceholderText(/Ajouter une note pour l'étape Patron/i);
    const submitBtn = screen.getByRole('button', { name: 'Ajouter la note' });

    expect(submitBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'Mesures épaule validées' } });
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => expect(onAddNote).toHaveBeenCalledWith('Mesures épaule validées'));
  });

  it('displays stage media (image and pdf document) and deletes a media item', async () => {
    setup();

    expect(screen.getByText('Tracé patron devant')).toBeInTheDocument();
    expect(screen.getByText('Fiche mesures client')).toBeInTheDocument();
    expect(screen.getByText('Document')).toBeInTheDocument();

    const deleteMediaBtns = screen.getAllByTitle('Supprimer ce média');
    expect(deleteMediaBtns.length).toBe(2);

    fireEvent.click(deleteMediaBtns[0]!);
    await waitFor(() => expect(onDeleteMedia).toHaveBeenCalledWith('media-1'));
  });

  it('handles uploading a media file', async () => {
    setup();

    const file = new File(['mock content'], 'esquisse.png', { type: 'image/png' });
    const input = document.getElementById('file-input-PATRON') as HTMLInputElement;

    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(onUploadMedia).toHaveBeenCalledWith(file, 'esquisse.png'));
  });

  it('calls onGoToNextStage when clicking the advance button in the active stage', async () => {
    setup({
      selectedStage: CreationProjectStage.PATRON,
      currentStage: CreationProjectStage.PATRON,
      nextStage: CreationProjectStage.CONFECTION,
    });

    const advanceBtn = screen.getByRole('button', { name: /Passer à l'étape Confection/i });
    expect(advanceBtn).toBeInTheDocument();

    fireEvent.click(advanceBtn);
    await waitFor(() => expect(onGoToNextStage).toHaveBeenCalled());
  });

  it('does not display the advance button when consulting a different stage than currentStage', () => {
    setup({
      selectedStage: CreationProjectStage.CONSULTATION,
      currentStage: CreationProjectStage.PATRON,
      nextStage: CreationProjectStage.CONFECTION,
    });

    expect(screen.getByText("Consultation d'étape")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Passer à l'étape/i })).not.toBeInTheDocument();
  });

  it('shows empty states when no notes or media are present for the stage', () => {
    setup({
      notes: [],
      media: [],
    });

    expect(screen.getByText("Aucune note d'atelier pour cette étape.")).toBeInTheDocument();
    expect(screen.getByText('Aucun média ou croquis attaché pour cette étape.')).toBeInTheDocument();
  });

  it('displays "Générer le patron par IA" button when on PATRON stage and opens the AI pattern modal', async () => {
    const onGenerateAiPattern = vi.fn();
    setup({
      selectedStage: CreationProjectStage.PATRON,
      onGenerateAiPattern,
      projectReference: 'CRP-2026-0042',
    });

    const generateBtn = screen.getByRole('button', { name: /Générer le patron par IA/i });
    expect(generateBtn).toBeInTheDocument();

    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Génération de Patron par IA')).toBeInTheDocument();
      expect(screen.getByText(/CRP-2026-0042/)).toBeInTheDocument();
    });
  });

  it('does not display "Générer le patron par IA" button when on CONSULTATION stage', () => {
    const onGenerateAiPattern = vi.fn();
    setup({
      selectedStage: CreationProjectStage.CONSULTATION,
      onGenerateAiPattern,
    });

    expect(screen.queryByRole('button', { name: /Générer le patron par IA/i })).not.toBeInTheDocument();
  });
});
