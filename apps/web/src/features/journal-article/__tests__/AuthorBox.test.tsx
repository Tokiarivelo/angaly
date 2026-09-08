import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { AuthorProfile } from '@/lib/author-profiles';

import { AuthorBox } from '../ui/AuthorBox';

describe('AuthorBox', () => {
  it('renders the name, role, bio, and "Voir tous ses articles" link when a bio exists', () => {
    const author: AuthorProfile = {
      displayName: 'Mme. Fanja',
      role: 'Maître Tailleur, ANGALY',
      bio: 'Bio courte.',
      photoUrl: null,
    };
    render(<AuthorBox author={author} />);

    expect(screen.getByRole('heading', { name: 'Mme. Fanja' })).toBeInTheDocument();
    expect(screen.getByText('Maître Tailleur, ANGALY')).toBeInTheDocument();
    expect(screen.getByText('Bio courte.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir tous ses articles' })).toBeInTheDocument();
  });

  it('renders nothing for the generic fallback profile (no bio)', () => {
    const author: AuthorProfile = { displayName: 'La Rédaction ANGALY', role: null, bio: null, photoUrl: null };
    const { container } = render(<AuthorBox author={author} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the portrait when the profile has a photo', () => {
    const author: AuthorProfile = {
      displayName: 'Mme. Fanja',
      role: 'Maître Tailleur, ANGALY',
      bio: 'Bio courte.',
      photoUrl: 'https://cdn.example/fanja.jpg',
    };
    render(<AuthorBox author={author} />);
    expect(screen.getByRole('img', { name: 'Mme. Fanja' })).toBeInTheDocument();
  });
});
