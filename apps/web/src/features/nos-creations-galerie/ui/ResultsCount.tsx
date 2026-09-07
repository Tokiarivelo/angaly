export function ResultsCount({ total }: { total: number }) {
  return (
    <div className="flex w-full items-center justify-between px-8 py-8 md:px-16">
      <span className="text-sm text-angaly-slate">
        {total} {total === 1 ? 'création' : 'créations'}
      </span>
    </div>
  );
}
