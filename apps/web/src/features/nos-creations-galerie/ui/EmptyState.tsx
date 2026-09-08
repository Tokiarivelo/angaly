/** Real Stitch prompt's EMPTY STATE: illustration + message + secondary "Réinitialiser les filtres" button. */
export function EmptyState({ onResetFilters }: { onResetFilters: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-8 py-24 text-center">
      <div aria-hidden="true" className="mb-6 h-16 w-16 rounded-full bg-angaly-champagne/20" />
      <p className="text-angaly-slate">Aucune création ne correspond à ces filtres pour le moment.</p>
      <button
        type="button"
        onClick={onResetFilters}
        className="mt-6 rounded-sm border border-angaly-navy px-6 py-3 text-sm tracking-wider text-angaly-navy uppercase transition-colors hover:bg-angaly-navy hover:text-white"
      >
        Réinitialiser les filtres
      </button>
    </div>
  );
}
