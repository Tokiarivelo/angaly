'use client';

import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import type { DataFieldDefinition, ItemFieldDefinition } from '../consts/section-catalog.const';
import { SHARED_ITEM_KEYS } from '../utils/merge-translation';
import { MediaPickerDialog } from './MediaPickerDialog';

type DataValue = Record<string, unknown>;
type Item = Record<string, unknown>;

const INPUT_CLASSES = 'w-full p-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-angaly-navy';

interface DataFieldsEditorProps {
  fields: readonly DataFieldDefinition[];
  /** Whole `dataJson` object; keys the catalogue doesn't describe are preserved untouched. */
  value: DataValue;
  onChange: (next: DataValue) => void;
  /**
   * The base-locale (FR) `dataJson` when editing a translation. Switches the editor to translation mode:
   * list structure (count/order) and images are inherited from it and locked, only the copy is editable,
   * and the base text is shown as placeholder.
   */
  baseValue?: DataValue | undefined;
}

function asItems(value: unknown): Item[] {
  return Array.isArray(value) ? value.filter((item): item is Item => item !== null && typeof item === 'object') : [];
}

function emptyItem(fields: readonly ItemFieldDefinition[]): Item {
  return Object.fromEntries(
    fields.map((field) => [field.key, field.nullable ? null : field.type === 'select' ? (field.options?.[0] ?? '') : '']),
  );
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function ItemField({
  field,
  value,
  onChange,
  id,
  placeholder,
}: {
  field: ItemFieldDefinition;
  value: unknown;
  onChange: (next: string | null) => void;
  id: string;
  placeholder?: string | undefined;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const text = textOf(value);
  const emit = (next: string) => onChange(next === '' && field.nullable ? null : next);

  if (field.type === 'select') {
    return (
      <select id={id} value={text} onChange={(event) => emit(event.target.value)} className={INPUT_CLASSES}>
        {field.nullable && <option value="">—</option>}
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return <textarea id={id} rows={3} value={text} placeholder={placeholder} onChange={(event) => emit(event.target.value)} className={INPUT_CLASSES} />;
  }
  if (field.type === 'image') {
    return (
      <div className="flex items-center gap-2">
        {text && (
          // eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail of an arbitrary URL
          <img src={text} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
        )}
        <input id={id} value={text} onChange={(event) => emit(event.target.value)} placeholder="URL de l’image" className={INPUT_CLASSES} />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-angaly-navy hover:bg-angaly-ivory"
        >
          Choisir
        </button>
        {pickerOpen && (
          <MediaPickerDialog
            isOpen
            onClose={() => setPickerOpen(false)}
            onSelect={(media) => {
              emit(media.url);
              setPickerOpen(false);
            }}
          />
        )}
      </div>
    );
  }
  return <input id={id} value={text} placeholder={placeholder} onChange={(event) => emit(event.target.value)} className={INPUT_CLASSES} />;
}

/** Read-only view of an image shared with the base locale. */
function SharedImage({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-angaly-slate">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny admin thumbnail of an arbitrary URL
        <img src={url} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-dashed border-border">—</span>
      )}
      <span>Image partagée avec le français — à modifier dans l’onglet Français.</span>
    </div>
  );
}

/** Structured editor for the catalogue-described `dataJson` keys (single text values and ordered lists of items). */
export const DataFieldsEditor: React.FC<DataFieldsEditorProps> = ({ fields, value, onChange, baseValue }) => {
  const translating = baseValue !== undefined;
  const setKey = (key: string, next: unknown) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-5">
      {fields.map((field) => {
        if (field.kind === 'text') {
          const id = `data-${field.key}`;
          return (
            <div key={field.key}>
              <label htmlFor={id} className="mb-1 block text-xs font-medium text-angaly-slate">
                {field.label}
              </label>
              <input
                id={id}
                value={textOf(value[field.key])}
                placeholder={translating ? textOf(baseValue[field.key]) : undefined}
                onChange={(event) => setKey(field.key, event.target.value)}
                className={INPUT_CLASSES}
              />
              {field.hint && <p className="mt-1 text-xs text-angaly-slate">{field.hint}</p>}
            </div>
          );
        }

        // Media and choice fields (icon, phase, …) are not copy: a translation inherits them from the base item.
        const sharedKeys = [...SHARED_ITEM_KEYS, ...field.itemFields.filter((itemField) => itemField.type === 'select').map((itemField) => itemField.key)];
        const baseItems = translating ? asItems(baseValue[field.key]) : [];
        const stored = asItems(value[field.key]);
        // In translation mode the list mirrors the base: same length/order, each entry the translated overlay.
        const items = translating ? baseItems.map((_, index) => stored[index] ?? {}) : stored;
        const update = (next: Item[]) => setKey(field.key, next);
        const move = (from: number, to: number) => {
          if (to < 0 || to >= items.length) return;
          const next = [...items];
          const [moved] = next.splice(from, 1);
          next.splice(to, 0, moved!);
          update(next);
        };
        const updateItem = (index: number, key: string, next: string | null) =>
          update(
            items.map((current, i) => {
              if (i !== index) return translating ? withoutShared(current, sharedKeys) : current;
              const updated = { ...(translating ? withoutShared(current, sharedKeys) : current), [key]: next };
              // A translation stores only what was actually translated — blanks fall back to the base.
              if (translating && (next === null || next === '')) delete updated[key];
              return updated;
            }),
          );

        return (
          <fieldset key={field.key} className="rounded-lg border border-border p-4">
            <legend className="px-2 text-xs font-medium text-angaly-slate">{field.label}</legend>
            {translating && (
              <p className="mb-3 text-xs text-angaly-slate">
                La liste (nombre, ordre, images) suit le français : ajoutez, supprimez ou réordonnez dans l’onglet Français.
              </p>
            )}
            {items.length === 0 && (
              <p className="mb-2 text-xs text-angaly-slate">Aucun élément — le site affiche le contenu par défaut.</p>
            )}
            <ol className="space-y-4">
              {items.map((item, index) => (
                <li key={index} className="rounded-lg bg-angaly-ivory/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-angaly-navy">
                      {field.itemLabel} {index + 1}
                    </span>
                    {!translating && (
                      <span className="flex items-center gap-1">
                        <button type="button" aria-label={`Monter ${field.itemLabel} ${index + 1}`} onClick={() => move(index, index - 1)} disabled={index === 0} className="p-1 text-angaly-slate hover:text-angaly-navy disabled:opacity-30">
                          <ArrowUp size={14} />
                        </button>
                        <button type="button" aria-label={`Descendre ${field.itemLabel} ${index + 1}`} onClick={() => move(index, index + 1)} disabled={index === items.length - 1} className="p-1 text-angaly-slate hover:text-angaly-navy disabled:opacity-30">
                          <ArrowDown size={14} />
                        </button>
                        <button type="button" aria-label={`Supprimer ${field.itemLabel} ${index + 1}`} onClick={() => update(items.filter((_, i) => i !== index))} className="p-1 text-angaly-slate hover:text-angaly-error">
                          <Trash2 size={14} />
                        </button>
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field.itemFields.map((itemField) => {
                      const id = `data-${field.key}-${index}-${itemField.key}`;
                      const wide = itemField.type === 'textarea' || itemField.type === 'image';
                      const baseItem = baseItems[index];
                      return (
                        <div key={itemField.key} className={wide ? 'sm:col-span-2' : undefined}>
                          <label htmlFor={id} className="mb-1 block text-xs text-angaly-slate">
                            {itemField.label}
                          </label>
                          {translating && sharedKeys.includes(itemField.key) ? (
                            itemField.type === 'image' ? (
                              <SharedImage url={textOf(baseItem?.[itemField.key])} />
                            ) : (
                              <p className="text-sm text-angaly-slate">
                                {textOf(baseItem?.[itemField.key]) || '—'} <span className="text-xs">(hérité du français)</span>
                              </p>
                            )
                          ) : (
                            <ItemField
                              id={id}
                              field={itemField}
                              value={item[itemField.key]}
                              placeholder={translating ? textOf(baseItem?.[itemField.key]) : undefined}
                              onChange={(next) => updateItem(index, itemField.key, next)}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </li>
              ))}
            </ol>
            {!translating && (
              <button
                type="button"
                onClick={() => update([...items, emptyItem(field.itemFields)])}
                className="mt-3 inline-flex items-center gap-1 text-sm text-angaly-navy hover:underline"
              >
                <Plus size={14} /> Ajouter — {field.itemLabel.toLowerCase()}
              </button>
            )}
          </fieldset>
        );
      })}
    </div>
  );
};

function withoutShared(item: Item, sharedKeys: readonly string[]): Item {
  return Object.fromEntries(Object.entries(item).filter(([key]) => !sharedKeys.includes(key)));
}
