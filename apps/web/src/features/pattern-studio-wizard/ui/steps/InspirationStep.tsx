'use client';

import React, { useRef } from 'react';
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import type { AiProviderId, GarmentProfile } from '@angaly/types';
import { GARMENT_TYPES } from '../../consts/garment-types.const';
import { OCCASIONS } from '../../consts/occasions.const';
import { STYLES } from '../../consts/styles.const';
import { CUTS } from '../../consts/cuts.const';
import { DETAIL_GROUPS } from '../../consts/details.const';
import { useUploadInspirationPhoto } from '../../hooks/useUploadInspirationPhoto';

interface InspirationStepProps {
  inspirationImageUrl?: string | undefined;
  inspirationMediaId?: string | undefined;
  detectedFeatures?: Record<string, string> | undefined;
  /** undefined = no photo analysed yet; false = the photo is not a garment. */
  isGarment?: boolean | undefined;
  /** Full classification of the uploaded photo. */
  profile?: GarmentProfile | undefined;
  /** Model picked in the wizard; undefined = the atelier's setting. */
  aiProvider?: AiProviderId | undefined;
  onInspirationProcessed: (data: {
    mediaId: string;
    url: string;
    detectedFeatures: Record<string, string>;
    profile: GarmentProfile | null;
    suggestedCutType: string | null;
  }) => void;
}

const FEATURE_LABELS: Record<string, string> = {
  garmentType: 'Type',
  neckline: 'Encolure',
  encolure: 'Encolure',
  sleeves: 'Manches',
  manches: 'Manches',
  length: 'Longueur',
  longueur: 'Longueur',
  silhouette: 'Silhouette',
  waist: 'Taille',
  fabricLook: 'Aspect du tissu',
  tissu: 'Tissu',
  details: 'Détails',
};

const CONSTRUCTION_LABELS: Record<string, string> = {
  FLAT_PATTERN: 'Patron à plat',
  DRAPING: 'Moulage / drapé sur mannequin',
  MIXED: 'Mixte : base à plat + drapé sur mannequin',
};

const PRESENTATION_LABELS: Record<string, string> = {
  WORN: 'Portée par une personne',
  MANNEQUIN: 'Sur mannequin',
  FLAT: 'À plat / sur cintre',
  SKETCH: 'Croquis',
};

const labelOf = (
  options: ReadonlyArray<{ id: string; label: string }>,
  id: string | null | undefined,
): string | null => (id ? (options.find((option) => option.id === id)?.label ?? id) : null);

/** Every recognised attribute of the photographed garment, as label/value rows. */
const buildProfileRows = (profile: GarmentProfile): { label: string; value: string }[] => {
  const rows: { label: string; value: string | null }[] = [
    { label: 'Vêtement', value: labelOf(GARMENT_TYPES, profile.garmentType) },
    { label: 'Occasion', value: labelOf(OCCASIONS, profile.occasion) },
    { label: 'Style', value: labelOf(STYLES, profile.style) },
    { label: 'Coupe', value: labelOf(CUTS, profile.cutType) },
    {
      label: 'Construction',
      value: profile.constructionMethod ? (CONSTRUCTION_LABELS[profile.constructionMethod] ?? null) : null,
    },
    {
      label: 'Présentation',
      value: profile.presentation ? (PRESENTATION_LABELS[profile.presentation] ?? null) : null,
    },
    ...DETAIL_GROUPS.map((group) => ({
      label: group.label,
      value: labelOf(group.options, profile.details[group.id]),
    })),
  ];
  return rows.filter((row): row is { label: string; value: string } => row.value !== null);
};

export const InspirationStep: React.FC<InspirationStepProps> = ({
  inspirationImageUrl,
  inspirationMediaId,
  detectedFeatures,
  isGarment,
  profile,
  aiProvider,
  onInspirationProcessed,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAndAnalyze, reanalyze, isUploading, isAnalyzing, error } =
    useUploadInspirationPhoto(onInspirationProcessed, aiProvider);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAndAnalyze(file);
    }
  };

  return (
    <div>
      <div className="mb-8 text-center sm:text-left">
        <h2 className="font-serif text-2xl sm:text-3xl text-white font-light mb-2">
          Commencez par une photo d’inspiration (optionnel)
        </h2>
        <p className="text-[#D8D3C8] text-sm font-light">
          Si la photo montre un vêtement, nous pré-remplissons les étapes suivantes (vêtement,
          occasion, style, coupe, détails) — vous gardez la main pour tout ajuster. Notre système
          identifie des caractéristiques générales : il ne reproduit pas une photo à l’identique.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#C5B190]/40 hover:border-[#C5B190] rounded-2xl p-8 bg-[#0C2650]/40 text-center cursor-pointer transition-all flex flex-col items-center justify-center group relative overflow-hidden"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {isUploading || isAnalyzing ? (
          <div className="py-8 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-[#C5B190] animate-spin" />
            <p className="text-white text-sm font-medium">
              {isUploading ? 'Téléversement de votre image…' : 'Analyse stylistique des lignes en cours…'}
            </p>
            <p className="text-[#D8D3C8] text-xs font-light">
              Extraction des proportions et volumes
            </p>
          </div>
        ) : inspirationImageUrl ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-xl overflow-hidden border border-[#C5B190] relative shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspirationImageUrl}
                alt="Inspiration"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-[#C5B190] hover:underline flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Changer la photo d’inspiration
            </p>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#041329] border border-[#C5B190]/30 flex items-center justify-center text-[#C5B190] group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                Glissez une image ici ou cliquez pour parcourir
              </p>
              <p className="text-[#D8D3C8]/60 text-xs mt-1">
                Formats acceptés : PNG, JPG, WebP jusqu’à 10 Mo
              </p>
            </div>
          </div>
        )}
      </div>

      {inspirationImageUrl && inspirationMediaId && !isUploading && (
        <button
          type="button"
          onClick={() => void reanalyze(inspirationMediaId, inspirationImageUrl)}
          disabled={isAnalyzing}
          className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190] transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing
            ? 'Analyse en cours…'
            : isGarment === undefined
              ? 'Réessayer l’analyse IA'
              : 'Relancer l’analyse IA'}
        </button>
      )}

      {error && (
        <p className="text-xs text-amber-300 mt-2 italic">{error}</p>
      )}

      {inspirationImageUrl && isGarment === undefined && !isUploading && !isAnalyzing && (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-200 text-xs"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            L’analyse IA n’a pas pu être réalisée pour cette photo (modèle IA sélectionné non
            configuré ou service indisponible). Aucune étape n’a été pré-remplie : poursuivez manuellement ou
            choisissez un autre modèle IA ci-dessous puis changez la photo.
          </span>
        </div>
      )}

      {isGarment === false && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 p-4 rounded-xl bg-amber-500/10 border border-amber-300/30 text-amber-200 text-xs"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Cette image ne semble pas représenter un vêtement : aucune étape n’a été pré-remplie.
            Choisissez une autre photo ou continuez manuellement.
          </span>
        </div>
      )}

      {isGarment === true && (
        <p className="mt-4 flex items-center gap-2 text-xs text-[#C5B190]">
          <CheckCircle2 className="w-4 h-4" />
          Étapes suivantes pré-remplies d’après votre photo — vérifiez-les et corrigez si besoin.
        </p>
      )}

      {/* Garment sheet: everything the analysis recognised, right under the preview */}
      {inspirationImageUrl && profile?.isGarment && (
        <section
          aria-label="Fiche du vêtement"
          className="mt-6 p-5 rounded-xl bg-[#0C2650] border border-[#C5B190]/30"
        >
          <div className="flex items-center gap-2 mb-4 text-white text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-[#C5B190]" />
            <span>Fiche du vêtement (suggestions indicatives)</span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {buildProfileRows(profile).map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-2 text-xs bg-[#041329]/80 px-3 py-2 rounded-lg border border-[#C5B190]/10"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C5B190] shrink-0" />
                <dt className="font-medium text-white">{row.label} :</dt>
                <dd className="text-[#D8D3C8] truncate">{row.value}</dd>
              </div>
            ))}
          </dl>

          {profile.constructionNotes && (
            <p
              role="note"
              className="mt-4 text-xs text-[#D8D3C8] bg-[#C5B190]/10 border border-[#C5B190]/30 rounded-lg px-3 py-2"
            >
              <span className="text-white font-medium">Conseil de construction :</span>{' '}
              {profile.constructionNotes}
            </p>
          )}

          {detectedFeatures && Object.keys(detectedFeatures).length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-wider text-[#C5B190] mb-2">
                Observations
              </p>
              <ul className="flex flex-wrap gap-2">
                {Object.entries(detectedFeatures).map(([key, value]) => (
                  <li
                    key={key}
                    className="text-xs bg-[#041329]/80 px-3 py-1.5 rounded-full border border-[#C5B190]/10 text-[#D8D3C8]"
                  >
                    <span className="text-white font-medium">{FEATURE_LABELS[key] ?? key} :</span>{' '}
                    {value}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
