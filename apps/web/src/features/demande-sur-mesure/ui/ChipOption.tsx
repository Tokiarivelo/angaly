/** Reused for the garmentType/occasion/fabric chip selectors — no harsh red required markers (Stitch AVOID note). */
export function ChipOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-full border px-4 py-2 text-sm transition-colors duration-200 ${
        selected
          ? 'border-angaly-navy bg-angaly-navy text-white'
          : 'border-angaly-border bg-transparent text-angaly-navy hover:border-angaly-navy'
      }`}
    >
      {label}
    </button>
  );
}
