import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { JournalArticleContent } from '../hooks/useJournalArticleContent';
import { AppointmentCtaBand } from '../ui/AppointmentCtaBand';

const CONTENT: JournalArticleContent['closingCta'] = {
  headline: 'Envie de concrétiser votre projet ?',
  body: "Nos maîtres tailleurs vous reçoivent pour une consultation privée dans notre atelier d'Antananarivo.",
  ctaPrimaryLabel: 'Prendre rendez-vous',
};

describe('AppointmentCtaBand', () => {
  it('renders the heading and a rendez-vous CTA link', () => {
    render(<AppointmentCtaBand content={CONTENT} />);
    expect(screen.getByRole('heading', { name: 'Envie de concrétiser votre projet ?' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prendre rendez-vous' })).toHaveAttribute(
      'href',
      '/prendre-rendez-vous',
    );
  });
});
