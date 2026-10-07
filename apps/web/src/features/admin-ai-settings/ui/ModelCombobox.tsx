'use client';

import React, { useId, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface ModelComboboxProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string | undefined;
  isLoading?: boolean | undefined;
  /** Shown under the list, e.g. fallback notice or "test the connection first". */
  hint?: string | undefined;
}

/** Presentational autocomplete: free text stays allowed, options are filtered upstream. */
export const ModelCombobox: React.FC<ModelComboboxProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  isLoading = false,
  hint,
}) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open && active >= 0 && options[active]) {
      e.preventDefault();
      select(options[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="w-full bg-white border border-[#D9D4CA] focus:border-[#061938] text-xs font-mono text-[#061938] py-2.5 pl-3 pr-9 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#061938] transition-colors"
      />
      <span className="absolute right-3 top-3 text-[#5C697A] pointer-events-none">
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </span>

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-[#D9D4CA] rounded-sm shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-[#8A877F]">
              {isLoading ? 'Recherche…' : 'Aucun modèle correspondant'}
            </li>
          ) : (
            options.map((option, index) => (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option === value}
                // mousedown fires before the input's blur, so the selection is not lost.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(option);
                }}
                className={`px-3 py-1.5 text-xs font-mono cursor-pointer ${
                  index === active ? 'bg-[#F6F2E9]' : ''
                } ${option === value ? 'text-[#936C3E] font-semibold' : 'text-[#061938]'} hover:bg-[#F6F2E9]`}
              >
                {option}
              </li>
            ))
          )}
          {hint && <li className="px-3 py-1.5 text-[10px] text-[#8A877F] border-t border-[#D9D4CA]/60">{hint}</li>}
        </ul>
      )}
    </div>
  );
};
