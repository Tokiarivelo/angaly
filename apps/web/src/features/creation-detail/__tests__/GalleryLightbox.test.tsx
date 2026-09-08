import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { CreationMediaDto } from '@angaly/types';

import { GalleryLightbox } from '../ui/GalleryLightbox';

const MEDIA: CreationMediaDto[] = [
  { id: 'm1', url: 'https://cdn.example/1.jpg', altText: 'Vue de face', sortOrder: 0 },
  { id: 'm2', url: 'https://cdn.example/2.jpg', altText: 'Vue arrière', sortOrder: 1 },
];

describe('GalleryLightbox', () => {
  it('renders nothing when there is no active media', () => {
    const { container } = render(
      <GalleryLightbox
        media={[]}
        activeIndex={0}
        isOpen
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        altFallback="Robe Éternelle"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('is not in the document when closed', () => {
    render(
      <GalleryLightbox
        media={MEDIA}
        activeIndex={0}
        isOpen={false}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        altFallback="Robe Éternelle"
      />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the active image and no arrows for a single-media gallery', () => {
    render(
      <GalleryLightbox
        media={[MEDIA[0]!]}
        activeIndex={0}
        isOpen
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        altFallback="Robe Éternelle"
      />,
    );
    expect(screen.getByAltText('Vue de face')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Image suivante' })).not.toBeInTheDocument();
  });

  it('calls onNext/onPrevious from the arrow buttons and shows a position counter', async () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const user = userEvent.setup();
    render(
      <GalleryLightbox
        media={MEDIA}
        activeIndex={0}
        isOpen
        onClose={vi.fn()}
        onNext={onNext}
        onPrevious={onPrevious}
        altFallback="Robe Éternelle"
      />,
    );

    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Image suivante' }));
    expect(onNext).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'Image précédente' }));
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('navigates with the arrow keys', async () => {
    const onNext = vi.fn();
    const onPrevious = vi.fn();
    const user = userEvent.setup();
    render(
      <GalleryLightbox
        media={MEDIA}
        activeIndex={0}
        isOpen
        onClose={vi.fn()}
        onNext={onNext}
        onPrevious={onPrevious}
        altFallback="Robe Éternelle"
      />,
    );

    await user.keyboard('{ArrowRight}');
    expect(onNext).toHaveBeenCalledTimes(1);

    await user.keyboard('{ArrowLeft}');
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('closes on the close button and on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <GalleryLightbox
        media={MEDIA}
        activeIndex={0}
        isOpen
        onClose={onClose}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        altFallback="Robe Éternelle"
      />,
    );

    await user.click(screen.getByRole('button', { name: "Fermer l'aperçu" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    render(
      <GalleryLightbox
        media={MEDIA}
        activeIndex={0}
        isOpen
        onClose={onClose}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        altFallback="Robe Éternelle"
      />,
    );
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('falls back to the creation name for alt text when the media has none', () => {
    render(
      <GalleryLightbox
        media={[{ id: 'm3', url: 'https://cdn.example/3.jpg', altText: '', sortOrder: 0 }]}
        activeIndex={0}
        isOpen
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrevious={vi.fn()}
        altFallback="Robe Éternelle"
      />,
    );
    expect(screen.getByAltText('Robe Éternelle')).toBeInTheDocument();
  });
});
