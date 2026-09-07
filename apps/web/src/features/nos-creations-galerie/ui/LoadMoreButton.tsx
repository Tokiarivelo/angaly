'use client';

/** Real Stitch screen: outlined "Voir plus de créations" — progressive loading, never a full page-reload pagination. */
export function LoadMoreButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <div className="border-angaly-border mt-12 flex w-full justify-center border-t px-8 pt-12 md:px-16">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="hover:bg-angaly-navy rounded-sm border border-angaly-navy px-8 py-3 text-sm tracking-wider text-angaly-navy uppercase transition-colors duration-300 hover:text-white disabled:opacity-50"
      >
        {isLoading ? 'Chargement…' : 'Voir plus de créations'}
      </button>
    </div>
  );
}
