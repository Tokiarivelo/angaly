export function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-8 py-24 text-center">
      <div aria-hidden="true" className="mb-6 h-16 w-16 rounded-full bg-angaly-champagne/20" />
      <p className="text-angaly-slate">Aucune création ne correspond à ces filtres pour le moment.</p>
    </div>
  );
}
