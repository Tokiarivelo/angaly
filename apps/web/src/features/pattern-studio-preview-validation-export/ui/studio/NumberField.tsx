import React, { useEffect, useId, useState } from 'react';

interface NumberFieldProps {
  label: string;
  value: number;
  /** Called on blur / Enter only, so one edit = one undo step. */
  onCommit: (value: number) => void;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  decimals?: number | undefined;
  suffix?: string | undefined;
  compact?: boolean | undefined;
}

const format = (v: number, decimals: number): string => String(Math.round(v * 10 ** decimals) / 10 ** decimals);

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onCommit,
  min,
  max,
  step = 0.1,
  decimals = 1,
  suffix,
  compact = false,
}) => {
  const id = useId();
  const [text, setText] = useState(format(value, decimals));

  useEffect(() => {
    setText(format(value, decimals));
  }, [value, decimals]);

  const commit = (): void => {
    const parsed = Number(text.replace(',', '.'));
    if (!Number.isFinite(parsed) || text.trim() === '') {
      setText(format(value, decimals));
      return;
    }
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, parsed));
    setText(format(clamped, decimals));
    if (Math.abs(clamped - value) > 10 ** -(decimals + 1)) onCommit(clamped);
  };

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-col gap-1'}>
      <label htmlFor={id} className={compact ? 'sr-only' : 'text-[11px] text-[#D8D3C8]/80'}>
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          data-step={step}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              setText(format(value, decimals));
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              const delta = (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
              const next = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, (Number(text.replace(',', '.')) || value) + delta));
              setText(format(next, decimals));
            }
          }}
          className="w-full min-w-0 rounded-md border border-[#C5B190]/25 bg-[#041329] px-2 py-1 font-mono text-xs text-white outline-none focus:border-[#C5B190]"
        />
        {suffix && <span className="text-[11px] text-[#C5B190]/80">{suffix}</span>}
      </div>
    </div>
  );
};
