'use client';

export function LoadMoreButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center border-t border-angaly-border pt-8">
      <button
        type="button"
        onClick={onClick}
        className="border border-angaly-navy bg-transparent px-8 py-3 text-sm font-medium tracking-wider text-angaly-navy uppercase transition-colors duration-300 hover:bg-angaly-navy hover:text-white"
      >
        Voir plus d&apos;articles
      </button>
    </div>
  );
}
