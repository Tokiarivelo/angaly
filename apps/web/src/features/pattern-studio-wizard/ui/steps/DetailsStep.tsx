import React, { useState } from 'react';
import { Info, PenLine } from 'lucide-react';
import { NOTES_BOUNDS, type PatternNotes } from '@angaly/types';
import { GARMENT_TYPES } from '../../consts/garment-types.const';
import { detailGroupsFor, sketchGarmentFor, type DetailGroupView, type SketchGarment } from '../../consts/garment-details.const';
import { OptionSketch } from './OptionSketch';

interface DetailsStepProps {
  selectedDetails: Record<string, string>;
  onSelectDetail: (group: string, value: string) => void;
  /** The garment chosen on the « Vêtement » step: only its own details are offered, drawn on it. */
  garmentType?: string | undefined;
  /** The cut chosen on the « Coupe » step: trousers and skirts are drawn in it. */
  cutType?: string | undefined;
  /** What the choices do not cover, in the customer's words (« Autre / préciser », a general note). */
  notes?: PatternNotes | undefined;
  onChangeNotes?: ((notes: PatternNotes | null) => void) | undefined;
}

/** The notes with one detail note (or the general note) changed; empty texts are dropped, null when nothing is left. */
const withNote = (notes: PatternNotes | undefined, group: string | null, text: string): PatternNotes | null => {
  const details = { ...(notes?.details ?? {}) };
  let general = notes?.general;
  if (group) {
    if (text.trim()) details[group] = text;
    else delete details[group];
  } else {
    general = text.trim() ? text : undefined;
  }
  const next: PatternNotes = {
    ...(Object.keys(details).length > 0 ? { details } : {}),
    ...(general ? { general } : {}),
    ...(notes?.measurements?.length ? { measurements: notes.measurements } : {}),
  };
  return Object.keys(next).length > 0 ? next : null;
};

/** What the customer still sets elsewhere, when the garment has few details of its own. */
const FEW_DETAILS_NOTE: Partial<Record<SketchGarment, string>> = {
  trousers: 'La forme de la jambe se règle à l’étape « Coupe », les aisances à l’étape « Mesures ».',
  skirt: 'La forme de la jupe se règle à l’étape « Coupe », son ampleur à l’étape « Mesures ».',
};

interface DetailGroupCardProps {
  group: DetailGroupView;
  garment: SketchGarment;
  selected: string | undefined;
  cut: string | undefined;
  /** Every detail chosen so far: each drawing shows them, only its own option changes. */
  chosen: Record<string, string>;
  onSelect: (value: string) => void;
  /** The customer's own wording when none of the options fits. */
  note?: string | undefined;
  onNote?: ((text: string) => void) | undefined;
}

/** One detail group: a large view of the chosen (or hovered) option with what it does, then every option. */
const DetailGroupCard: React.FC<DetailGroupCardProps> = ({ group, garment, selected, cut, chosen, onSelect, note, onNote }) => {
  const [hovered, setHovered] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const noteOpen = writing || Boolean(note);
  const shown = group.options.find((o) => o.id === (hovered ?? selected)) ?? null;
  return (
    <section
      aria-labelledby={`detail-${group.id}`}
      className="bg-[#0C2650]/60 border border-[#C5B190]/20 rounded-xl p-5 flex flex-col md:flex-row gap-5"
    >
      <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-stretch gap-4">
        <div className="rounded-lg bg-[#F7F1E6] border border-[#C5B190]/40 p-2 flex justify-center w-32 md:w-full shrink-0">
          {shown ? (
            <OptionSketch
              group={group.id}
              optionId={shown.id}
              garment={garment}
              cut={cut}
              context={chosen}
              className="w-28 h-[168px] md:w-36 md:h-[216px]"
              title={`Aperçu : ${shown.label}`}
            />
          ) : (
            <div className="w-28 h-[168px] md:w-36 md:h-[216px] flex items-center justify-center text-center text-[11px] text-[#0C2650]/60 px-2">
              Choisissez une option pour la voir en détail
            </div>
          )}
        </div>
        <div aria-live="polite">
          <h3 id={`detail-${group.id}`} className="text-white font-medium text-sm">
            {group.label}
          </h3>
          {shown && (
            <>
              <p className="text-[#C5B190] text-xs font-semibold mt-1">{shown.label}</p>
              <p className="text-[#D8D3C8] text-xs font-light leading-snug mt-1">{shown.description}</p>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 content-start flex-1">
        {group.options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isSelected}
              title={opt.description}
              onClick={() => onSelect(opt.id)}
              onMouseEnter={() => setHovered(opt.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(opt.id)}
              onBlur={() => setHovered(null)}
              className={`flex flex-col items-center gap-2 px-2 pt-3 pb-2.5 rounded-lg text-xs transition-all border ${
                isSelected
                  ? 'bg-[#C5B190] text-[#041329] border-[#C5B190] font-semibold shadow-sm'
                  : 'bg-[#041329] text-[#D8D3C8] border-[#C5B190]/20 hover:border-[#C5B190]/50 hover:text-white'
              }`}
            >
              <span className="rounded-md bg-[#F7F1E6] p-1">
                <OptionSketch group={group.id} optionId={opt.id} garment={garment} cut={cut} context={chosen} className="w-16 h-24 shrink-0" />
              </span>
              <span className="text-center leading-tight">{opt.label}</span>
            </button>
          );
        })}
        {onNote && (
          <button
            type="button"
            aria-pressed={noteOpen}
            aria-controls={`note-${group.id}`}
            onClick={() => setWriting(!noteOpen)}
            className={`flex flex-col items-center justify-center gap-2 px-2 pt-3 pb-2.5 rounded-lg text-xs transition-all border border-dashed ${
              noteOpen ? 'border-[#C5B190] text-white' : 'border-[#C5B190]/30 text-[#D8D3C8] hover:border-[#C5B190]/60 hover:text-white'
            }`}
          >
            <PenLine className="h-6 w-6" aria-hidden="true" />
            <span className="text-center leading-tight">Autre / préciser</span>
          </button>
        )}
        {onNote && noteOpen && (
          <div className="col-span-full">
            <label htmlFor={`note-${group.id}`} className="block text-[11px] text-[#D8D3C8] mb-1">
              Décrivez ce que vous voulez ({group.label.toLowerCase()}) : l’atelier l’ajoutera au patron.
            </label>
            <input
              id={`note-${group.id}`}
              type="text"
              maxLength={NOTES_BOUNDS.detailChars}
              value={note ?? ''}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Ex. : poche ticket sur la poche droite"
              className="w-full rounded-md border border-[#C5B190]/30 bg-[#041329] px-3 py-2 text-sm text-white placeholder:text-[#D8D3C8]/40 focus:border-[#C5B190] focus:outline-none"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export const DetailsStep: React.FC<DetailsStepProps> = ({ selectedDetails, onSelectDetail, garmentType = 'ROBE', cutType, notes, onChangeNotes }) => {
  const groups = detailGroupsFor(garmentType);
  const garment = sketchGarmentFor(garmentType);
  const garmentLabel = GARMENT_TYPES.find((g) => g.id === garmentType)?.label ?? 'vêtement';
  const note = FEW_DETAILS_NOTE[garment];
  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">Personnalisez les détails</h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          Détails de confection pour votre {garmentLabel.toLowerCase()} : survolez une option pour la voir en grand.
        </p>
      </div>

      {note && (
        <p className="mb-6 flex items-start gap-2 rounded-lg border border-[#C5B190]/30 bg-[#C5B190]/10 px-4 py-3 text-xs text-[#D8D3C8]">
          <Info className="h-4 w-4 shrink-0 text-[#C5B190]" aria-hidden="true" />
          {note}
        </p>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <DetailGroupCard
            key={group.id}
            group={group}
            garment={garment}
            selected={selectedDetails[group.id]}
            cut={cutType}
            chosen={selectedDetails}
            onSelect={(value) => onSelectDetail(group.id, value)}
            note={notes?.details?.[group.id]}
            onNote={onChangeNotes ? (text) => onChangeNotes(withNote(notes, group.id, text)) : undefined}
          />
        ))}
      </div>

      {onChangeNotes && (
        <section className="mt-6 bg-[#0C2650]/60 border border-[#C5B190]/20 rounded-xl p-5">
          <label htmlFor="note-general" className="block text-white font-medium text-sm">
            Précisions pour l’atelier
          </label>
          <p className="text-[#D8D3C8] text-xs font-light mt-1 mb-2">
            Une subtilité qui n’est pas dans les choix ? Décrivez-la : elle est jointe au patron, l’atelier l’ajuste à la main.
          </p>
          <textarea
            id="note-general"
            rows={3}
            maxLength={NOTES_BOUNDS.generalChars}
            value={notes?.general ?? ''}
            onChange={(e) => onChangeNotes(withNote(notes, null, e.target.value))}
            placeholder="Ex. : ourlet à 2 cm du sol avec des talons de 7 cm, surpiqûres ton sur ton…"
            className="w-full rounded-md border border-[#C5B190]/30 bg-[#041329] px-3 py-2 text-sm text-white placeholder:text-[#D8D3C8]/40 focus:border-[#C5B190] focus:outline-none"
          />
        </section>
      )}
    </div>
  );
};
