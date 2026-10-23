import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatternStatus } from '@angaly/types';
import { ProjectStatusHeader } from '../ui/ProjectStatusHeader';

describe('ProjectStatusHeader', () => {
  it('takes the arrow back to the customer’s pattern projects', () => {
    render(
      <ProjectStatusHeader projectRef="ANG-PAT-2026-8E665279" status={PatternStatus.GENERATED} garmentType="ROBE" onOpenHistory={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: /Projet ANG-PAT-2026-8E665279/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour à mes projets de patron' })).toHaveAttribute('href', '/mes-projets-patron');
  });
});
