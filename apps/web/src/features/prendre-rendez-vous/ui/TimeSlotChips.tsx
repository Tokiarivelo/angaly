'use client';

interface TimeSlotChipsProps {
  slots: string[];
  selectedSlot: string;
  isLoading: boolean;
  onSelect: (scheduledAt: string) => void;
}

function formatSlotTime(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(iso));
}

/** Section 4 — "4. Heure" chip group, dynamically derived from the selected atelier + date (never a static list). */
export function TimeSlotChips({ slots, selectedSlot, isLoading, onSelect }: TimeSlotChipsProps) {
  if (isLoading) {
    return (
      <p role="status" className="text-sm text-angaly-slate">
        Chargement des créneaux…
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p role="status" className="text-sm text-angaly-slate">
        Aucun créneau disponible pour cette date — choisissez un autre jour dans le calendrier.
      </p>
    );
  }

  return (
    <div role="radiogroup" aria-label="Heure du rendez-vous" className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = slot === selectedSlot;
        return (
          <button
            key={slot}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(slot)}
            className={`border px-3 py-2 text-sm transition-colors duration-300 ${
              isSelected
                ? 'border-angaly-navy bg-angaly-navy text-white'
                : 'border-angaly-border bg-transparent text-angaly-navy hover:border-angaly-gold'
            }`}
          >
            {formatSlotTime(slot)}
          </button>
        );
      })}
    </div>
  );
}
