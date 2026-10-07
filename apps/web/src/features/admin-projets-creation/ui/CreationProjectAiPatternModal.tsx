'use client';

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Sparkles,
  X,
  Scissors,
  Download,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Layers,
  FileCheck,
  Ruler,
} from 'lucide-react';
import type {
  CreationProjectGarmentType,
  GenerateCreationProjectAiPatternInput,
  GenerateCreationProjectAiPatternResponseDto,
} from '@angaly/types';

export interface CreationProjectAiPatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectReference?: string | undefined;
  projectTitle?: string | undefined;
  onGeneratePattern: (
    input: GenerateCreationProjectAiPatternInput,
  ) => Promise<GenerateCreationProjectAiPatternResponseDto>;
  isGenerating: boolean;
  /** Photos déjà rattachées au projet, proposables comme inspiration (lues une seule fois par l'IA). */
  inspirationImages?: InspirationImageOption[] | undefined;
}

export interface InspirationImageOption {
  id: string;
  url: string;
  title: string;
}

interface StandardMeasurements {
  bust: number;
  waist: number;
  hips: number;
  length: number;
  backWidth: number;
  sleeveLength?: number;
}

const STANDARD_SIZES: Record<string, StandardMeasurements> = {
  '34': { bust: 80, waist: 62, hips: 86, length: 98, backWidth: 35, sleeveLength: 58 },
  '36': { bust: 84, waist: 66, hips: 90, length: 100, backWidth: 36, sleeveLength: 59 },
  '38': { bust: 88, waist: 70, hips: 94, length: 102, backWidth: 37, sleeveLength: 60 },
  '40': { bust: 92, waist: 74, hips: 98, length: 104, backWidth: 38, sleeveLength: 60 },
  '42': { bust: 96, waist: 78, hips: 102, length: 106, backWidth: 39, sleeveLength: 61 },
  '44': { bust: 102, waist: 84, hips: 108, length: 108, backWidth: 40, sleeveLength: 61 },
  '46': { bust: 108, waist: 90, hips: 114, length: 110, backWidth: 41, sleeveLength: 62 },
  '48': { bust: 114, waist: 96, hips: 120, length: 112, backWidth: 42, sleeveLength: 62 },
};

const GARMENT_OPTIONS: {
  value: CreationProjectGarmentType;
  label: string;
  cutOptions: { value: string; label: string }[];
}[] = [
  {
    value: 'ROBE',
    label: 'Robe de Haute Couture',
    cutOptions: [
      { value: 'EVASEE', label: 'Évasée atelier' },
      { value: 'DROITE', label: 'Droite classique' },
      { value: 'FOURREAU', label: 'Fourreau cintré' },
      { value: 'PRINCESSE', label: 'Découpe princesse' },
      { value: 'EMPIRE', label: 'Taille empire' },
    ],
  },
  {
    value: 'ROBE_MARIEE',
    label: 'Robe de mariée',
    cutOptions: [
      { value: 'SIRENE', label: 'Sirène d\'apparat' },
      { value: 'PRINCESSE', label: 'Princesse volumineuse' },
      { value: 'TRAPEZE', label: 'Trapèze moderne' },
      { value: 'BOHEME', label: 'Bohème fluide' },
    ],
  },
  {
    value: 'JUPE',
    label: 'Jupe d\'atelier',
    cutOptions: [
      { value: 'DROITE', label: 'Droite tailleur' },
      { value: 'EVASEE', label: 'Évasée corolle' },
      { value: 'PLISSEE', label: 'Plissée soleil' },
      { value: 'CRAYON', label: 'Crayon haute' },
    ],
  },
  {
    value: 'PANTALON',
    label: 'Pantalon tailleur',
    cutOptions: [
      { value: 'DROIT', label: 'Droit classique' },
      { value: 'PINCES', label: 'À plis d\'aisance' },
      { value: 'LARGE', label: 'Palazzo fluide' },
      { value: 'CIGARETTE', label: 'Cigarette 7/8' },
    ],
  },
  {
    value: 'VESTE',
    label: 'Veste tailleur',
    cutOptions: [
      { value: 'CINTREE', label: 'Cintrée bar jacket' },
      { value: 'DROITE', label: 'Droite masculine' },
      { value: 'CROISEE', label: 'Croisée double boutonnage' },
      { value: 'SMOKING', label: 'Smoking col châle' },
    ],
  },
  {
    value: 'CHEMISE',
    label: 'Chemise sur mesure',
    cutOptions: [
      { value: 'AJUSTEE', label: 'Ajustée avec pinces' },
      { value: 'CLASSIQUE', label: 'Classique française' },
      { value: 'COL_OFFICIER', label: 'Col officier épuré' },
    ],
  },
  {
    value: 'COSTUME',
    label: 'Costume complet',
    cutOptions: [
      { value: 'DEUX_PIECES', label: 'Deux pièces sur mesure' },
      { value: 'TROIS_PIECES', label: 'Trois pièces avec gilet' },
      { value: 'SMOKING', label: 'Smoking de cérémonie' },
    ],
  },
  {
    value: 'AUTRE',
    label: 'Pièce d\'exception',
    cutOptions: [
      { value: 'SUR_MESURE', label: 'Création libre d\'atelier' },
      { value: 'DRAPE', label: 'Drapé asymétrique' },
      { value: 'CAPE', label: 'Cape brodée' },
    ],
  },
];

export const CreationProjectAiPatternModal: React.FC<CreationProjectAiPatternModalProps> = ({
  isOpen,
  onClose,
  projectReference,
  projectTitle,
  onGeneratePattern,
  isGenerating,
  inspirationImages = [],
}) => {
  const [garmentType, setGarmentType] = useState<CreationProjectGarmentType>('ROBE');
  const [cutType, setCutType] = useState<string>('EVASEE');
  const [styleDescription, setStyleDescription] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('38');
  const [measurements, setMeasurements] = useState<StandardMeasurements>(STANDARD_SIZES['38']!);
  const [requestAiSuggestion, setRequestAiSuggestion] = useState<boolean>(true);
  const [saveMedia, setSaveMedia] = useState<boolean>(true);
  const [addNote, setAddNote] = useState<boolean>(true);
  const [inspirationImageUrl, setInspirationImageUrl] = useState<string | null>(null);

  const [generatedResult, setGeneratedResult] =
    useState<GenerateCreationProjectAiPatternResponseDto | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const currentGarmentConfig =
    GARMENT_OPTIONS.find((g) => g.value === garmentType) ?? GARMENT_OPTIONS[0]!;

  const handleGarmentTypeChange = (type: CreationProjectGarmentType) => {
    setGarmentType(type);
    const config = GARMENT_OPTIONS.find((g) => g.value === type);
    if (config && config.cutOptions[0]) {
      setCutType(config.cutOptions[0].value);
    }
  };

  const handleSizeChange = (sizeKey: string) => {
    setSelectedSize(sizeKey);
    const defaultM = STANDARD_SIZES[sizeKey];
    if (defaultM) {
      setMeasurements({ ...defaultM });
    }
  };

  const handleMeasurementChange = (field: keyof StandardMeasurements, val: number) => {
    setMeasurements((prev) => ({ ...prev, [field]: Number.isNaN(val) ? 0 : val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerationError(null);
    try {
      const input: GenerateCreationProjectAiPatternInput = {
        garmentType,
        cutType,
        style: styleDescription.trim() || undefined,
        requestAiSuggestion,
        ...(requestAiSuggestion && inspirationImageUrl ? { inspirationImageUrl } : {}),
        saveMedia,
        addNote,
        measurements: {
          bust: measurements.bust,
          waist: measurements.waist,
          hips: measurements.hips,
          length: measurements.length,
          backWidth: measurements.backWidth,
          ...(measurements.sleeveLength ? { sleeveLength: measurements.sleeveLength } : {}),
        },
      };

      const res = await onGeneratePattern(input);
      setGeneratedResult(res);
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'Erreur lors de la génération du patronage géométrique.',
      );
    }
  };

  const handleDownloadSvg = () => {
    if (!generatedResult?.svgContent) return;
    const blob = new Blob([generatedResult.svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patron-${garmentType.toLowerCase()}-${projectReference ?? 'projet'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setGeneratedResult(null);
    setGenerationError(null);
    setZoomLevel(1);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-[#061938]/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in" />
        <Dialog.Content
          aria-describedby="ai-pattern-modal-desc"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[92vh] bg-white border border-[#D9D4CA] shadow-2xl z-50 rounded-sm flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* En-tête Modal Haute Couture */}
          <div className="bg-[#061938] text-white p-5 border-b border-[#936C3E]/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#936C3E]/20 border border-[#936C3E] flex items-center justify-center text-[#936C3E]">
                <Sparkles size={20} />
              </div>
              <div>
                <Dialog.Title className="font-serif text-xl sm:text-2xl text-[#F6F2E9] tracking-tight">
                  Génération de Patron par IA
                </Dialog.Title>
                <p id="ai-pattern-modal-desc" className="text-[11px] text-[#C5B190] tracking-wide font-headline uppercase">
                  Studio Angaly Haute Couture • Moteur géométrique déterministe
                  {projectReference && ` • ${projectReference}`}
                  {projectTitle && ` (${projectTitle})`}
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onClose}
                className="text-[#F6F2E9]/70 hover:text-white p-1.5 rounded-sm hover:bg-white/10 transition-colors"
                aria-label="Fermer la fenêtre"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          {/* Contenu Défilant */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFCFB]">
            {generationError && (
              <div
                role="alert"
                className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 flex items-start gap-3 text-xs"
              >
                <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Échec de la génération de patron</p>
                  <p className="mt-1">{generationError}</p>
                </div>
              </div>
            )}

            {!generatedResult ? (
              /* FORMULAIRE DE CONFIGURATION */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Type de Vêtement */}
                <div className="space-y-2">
                  <label className="block text-xs font-headline uppercase tracking-widest text-[#061938] font-semibold">
                    1. Type de vêtement
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {GARMENT_OPTIONS.map((opt) => {
                      const isSelected = opt.value === garmentType;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleGarmentTypeChange(opt.value)}
                          className={`p-3 text-left border rounded-sm text-xs transition-all flex flex-col justify-between h-20 ${
                            isSelected
                              ? 'bg-[#061938] text-white border-[#936C3E] shadow-sm'
                              : 'bg-white text-[#061938] border-[#D9D4CA] hover:border-[#936C3E]/60'
                          }`}
                        >
                          <span className="font-medium">{opt.label}</span>
                          <span
                            className={`text-[10px] uppercase font-mono ${
                              isSelected ? 'text-[#C5B190]' : 'text-[#8A877F]'
                            }`}
                          >
                            {opt.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Coupe & Style */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline uppercase tracking-widest text-[#061938] font-semibold">
                      2. Découpe technique
                    </label>
                    <select
                      value={cutType}
                      onChange={(e) => setCutType(e.target.value)}
                      className="w-full bg-white border border-[#D9D4CA] text-xs p-2.5 rounded-sm text-[#061938] focus:ring-1 focus:ring-[#936C3E] focus:outline-none"
                    >
                      {currentGarmentConfig.cutOptions.map((co) => (
                        <option key={co.value} value={co.value}>
                          {co.label} ({co.value})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-headline uppercase tracking-widest text-[#061938] font-semibold">
                      Précisions stylistiques d&apos;atelier
                    </label>
                    <input
                      type="text"
                      value={styleDescription}
                      onChange={(e) => setStyleDescription(e.target.value)}
                      placeholder="Ex: Robe de gala encolure bateau, découpes princesse"
                      className="w-full bg-white border border-[#D9D4CA] text-xs p-2.5 rounded-sm text-[#061938] placeholder-[#8A877F] focus:ring-1 focus:ring-[#936C3E] focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Mensurations */}
                <div className="space-y-3 p-4 bg-[#F6F2E9]/50 border border-[#D9D4CA] rounded-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Ruler size={16} className="text-[#936C3E]" />
                      <span className="text-xs font-headline uppercase tracking-widest text-[#061938] font-semibold">
                        3. Mensurations et Conformation
                      </span>
                    </div>

                    {/* Sélecteur de tailles standards */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                      <span className="text-[10px] uppercase font-mono text-[#8A877F] mr-1">Taille :</span>
                      {Object.keys(STANDARD_SIZES).map((sizeKey) => {
                        const isSizeActive = selectedSize === sizeKey;
                        return (
                          <button
                            key={sizeKey}
                            type="button"
                            onClick={() => handleSizeChange(sizeKey)}
                            className={`px-2 py-0.5 text-[11px] font-mono rounded-xs border transition-colors ${
                              isSizeActive
                                ? 'bg-[#936C3E] text-white border-[#936C3E]'
                                : 'bg-white text-[#061938] border-[#D9D4CA] hover:border-[#936C3E]'
                            }`}
                          >
                            T{sizeKey}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                    <div>
                      <label htmlFor="meas-bust" className="block text-[11px] text-[#5C697A] mb-1">
                        Poitrine (cm)
                      </label>
                      <input
                        id="meas-bust"
                        type="number"
                        min="50"
                        max="180"
                        value={measurements.bust}
                        onChange={(e) => handleMeasurementChange('bust', parseFloat(e.target.value))}
                        className="w-full bg-white border border-[#D9D4CA] text-xs p-2 rounded-sm font-mono text-[#061938]"
                      />
                    </div>
                    <div>
                      <label htmlFor="meas-waist" className="block text-[11px] text-[#5C697A] mb-1">
                        Taille (cm)
                      </label>
                      <input
                        id="meas-waist"
                        type="number"
                        min="40"
                        max="160"
                        value={measurements.waist}
                        onChange={(e) => handleMeasurementChange('waist', parseFloat(e.target.value))}
                        className="w-full bg-white border border-[#D9D4CA] text-xs p-2 rounded-sm font-mono text-[#061938]"
                      />
                    </div>
                    <div>
                      <label htmlFor="meas-hips" className="block text-[11px] text-[#5C697A] mb-1">
                        Hanches (cm)
                      </label>
                      <input
                        id="meas-hips"
                        type="number"
                        min="50"
                        max="200"
                        value={measurements.hips}
                        onChange={(e) => handleMeasurementChange('hips', parseFloat(e.target.value))}
                        className="w-full bg-white border border-[#D9D4CA] text-xs p-2 rounded-sm font-mono text-[#061938]"
                      />
                    </div>
                    <div>
                      <label htmlFor="meas-length" className="block text-[11px] text-[#5C697A] mb-1">
                        Longueur (cm)
                      </label>
                      <input
                        id="meas-length"
                        type="number"
                        min="30"
                        max="250"
                        value={measurements.length}
                        onChange={(e) => handleMeasurementChange('length', parseFloat(e.target.value))}
                        className="w-full bg-white border border-[#D9D4CA] text-xs p-2 rounded-sm font-mono text-[#061938]"
                      />
                    </div>
                    <div>
                      <label htmlFor="meas-back" className="block text-[11px] text-[#5C697A] mb-1">
                        Carrure dos (cm)
                      </label>
                      <input
                        id="meas-back"
                        type="number"
                        min="25"
                        max="70"
                        value={measurements.backWidth}
                        onChange={(e) => handleMeasurementChange('backWidth', parseFloat(e.target.value))}
                        className="w-full bg-white border border-[#D9D4CA] text-xs p-2 rounded-sm font-mono text-[#061938]"
                      />
                    </div>
                  </div>
                </div>

                {/* Photo d'inspiration (optionnelle) */}
                {requestAiSuggestion && inspirationImages.length > 0 && (
                  <fieldset className="space-y-2.5 p-3.5 bg-white border border-[#D9D4CA] rounded-sm">
                    <legend className="sr-only">Photo d&apos;inspiration</legend>
                    <span className="block text-xs font-headline uppercase tracking-widest text-[#061938] font-semibold">
                      Photo d&apos;inspiration (optionnel)
                    </span>
                    <p className="text-[11px] text-[#5C697A]">
                      L&apos;IA lit la photo une seule fois ; ses caractéristiques sont ensuite mémorisées.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inspirationImages.map((img) => {
                        const selected = inspirationImageUrl === img.url;
                        return (
                          <button
                            key={img.id}
                            type="button"
                            aria-pressed={selected}
                            aria-label={img.title}
                            onClick={() => setInspirationImageUrl(selected ? null : img.url)}
                            className={`w-16 h-16 rounded-sm overflow-hidden border-2 transition-colors ${
                              selected ? 'border-[#936C3E]' : 'border-[#D9D4CA] hover:border-[#061938]'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* 4. Options d'Atelier */}
                <div className="space-y-2.5 p-3.5 bg-white border border-[#D9D4CA] rounded-sm">
                  <span className="block text-xs font-headline uppercase tracking-widest text-[#061938] font-semibold mb-2">
                    4. Intégration à l&apos;espace de travail
                  </span>

                  <label className="flex items-center gap-2.5 text-xs text-[#061938] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestAiSuggestion}
                      onChange={(e) => setRequestAiSuggestion(e.target.checked)}
                      className="rounded-xs border-[#D9D4CA] text-[#061938] focus:ring-[#936C3E]"
                    />
                    <span>
                      Solliciter les recommandations stylistiques & aisance IA (Pattern Studio)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-[#061938] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveMedia}
                      onChange={(e) => setSaveMedia(e.target.checked)}
                      className="rounded-xs border-[#D9D4CA] text-[#061938] focus:ring-[#936C3E]"
                    />
                    <span>
                      Rattacher automatiquement le fichier vectoriel SVG aux{' '}
                      <strong>Médias de l&apos;étape Patron</strong>
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 text-xs text-[#061938] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addNote}
                      onChange={(e) => setAddNote(e.target.checked)}
                      className="rounded-xs border-[#D9D4CA] text-[#061938] focus:ring-[#936C3E]"
                    />
                    <span>
                      Inscrire une synthèse technique dans les{' '}
                      <strong>Notes d&apos;atelier de l&apos;étape Patron</strong>
                    </span>
                  </label>
                </div>

                {/* Bouton d'action */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D9D4CA]">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-[#5C697A] hover:text-[#061938] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#061938] hover:bg-[#0C2650] text-[#F6F2E9] rounded-sm border border-[#936C3E] text-xs font-headline uppercase tracking-wider font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Calcul géométrique en cours…</span>
                      </>
                    ) : (
                      <>
                        <Scissors size={15} className="text-[#936C3E]" />
                        <span>Générer le patron par IA</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* AFFICHAGE DU RÉSULTAT DU PATRON */
              <div className="space-y-6">
                {/* Bandeau de succès */}
                <div className="p-4 bg-[#F6F2E9] border border-[#936C3E]/40 rounded-sm flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[#936C3E] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif text-lg text-[#061938] font-normal">
                        Patronage géométrique calculé avec succès
                      </h4>
                      <p className="text-xs text-[#5C697A] mt-0.5">
                        Le tracé SVG de haute précision et les pièces d&apos;atelier ont été
                        générés selon les normes du moteur Angaly Pattern Studio.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#061938] text-[#F6F2E9] rounded-sm text-xs font-headline uppercase tracking-wider hover:bg-[#0C2650] transition-colors border border-[#936C3E]/50"
                    >
                      <Download size={13} className="text-[#936C3E]" />
                      <span>Télécharger SVG</span>
                    </button>
                  </div>
                </div>

                {/* Métriques clés */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white border border-[#D9D4CA] rounded-sm">
                    <span className="text-[10px] uppercase font-headline text-[#8A877F] tracking-widest block">
                      Type de pièce
                    </span>
                    <span className="text-sm font-semibold text-[#061938] mt-1 block">
                      {generatedResult.parameters.garmentType}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-[#D9D4CA] rounded-sm">
                    <span className="text-[10px] uppercase font-headline text-[#8A877F] tracking-widest block">
                      Coupe appliquée
                    </span>
                    <span className="text-sm font-semibold text-[#061938] mt-1 block">
                      {generatedResult.parameters.cutType}
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-[#D9D4CA] rounded-sm">
                    <span className="text-[10px] uppercase font-headline text-[#8A877F] tracking-widest block">
                      Nombre de pièces
                    </span>
                    <span className="text-sm font-semibold text-[#061938] mt-1 block">
                      {generatedResult.pieces.length} pièces
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-[#D9D4CA] rounded-sm">
                    <span className="text-[10px] uppercase font-headline text-[#8A877F] tracking-widest block">
                      Surface estimée
                    </span>
                    <span className="text-sm font-semibold text-[#061938] mt-1 block">
                      {(
                        generatedResult.pieces.reduce(
                          (acc, p) => acc + (p.widthMm * p.heightMm) / 1_000_000,
                          0,
                        ) * 1.3
                      ).toFixed(2)}{' '}
                      m²
                    </span>
                  </div>
                </div>

                {/* Recommandations IA */}
                {generatedResult.aiSuggestion && (
                  <div className="p-4 bg-white border border-[#D9D4CA] rounded-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-headline uppercase text-xs tracking-widest text-[#061938] flex items-center gap-1.5 font-semibold">
                        <Sparkles size={14} className="text-[#936C3E]" />
                        Recommandations du Studio IA
                      </h5>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#936C3E]/10 text-[#936C3E] rounded-full">
                        Indice confiance : {Math.round(generatedResult.aiSuggestion.confidence * 100)}% ({generatedResult.aiSuggestion.modelVersion})
                      </span>
                    </div>
                    <div className="text-xs text-[#5C697A] leading-relaxed space-y-1">
                      <p>
                        Coupe suggérée :{' '}
                        <strong className="text-[#061938]">
                          {generatedResult.aiSuggestion.suggestedCutType}
                        </strong>
                      </p>
                      {Object.keys(generatedResult.aiSuggestion.suggestedDetails).length > 0 && (
                        <p>
                          Aisance & finitions :{' '}
                          {Object.entries(generatedResult.aiSuggestion.suggestedDetails)
                            .map(([k, v]) => `${k} : ${v}`)
                            .join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Aperçu du Tracé Vectoriel (SVG Canvas) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-headline uppercase text-xs tracking-widest text-[#061938] flex items-center gap-1.5 font-semibold">
                      <Layers size={14} className="text-[#936C3E]" />
                      Planche de Patronage Vectorielle
                    </h5>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                        className="p-1 border border-[#D9D4CA] bg-white rounded-xs text-[#061938] hover:bg-[#F6F2E9]"
                        title="Zoom arrière"
                      >
                        <ZoomOut size={13} />
                      </button>
                      <span className="text-[11px] font-mono px-1.5 text-[#5C697A]">
                        {Math.round(zoomLevel * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
                        className="p-1 border border-[#D9D4CA] bg-white rounded-xs text-[#061938] hover:bg-[#F6F2E9]"
                        title="Zoom avant"
                      >
                        <ZoomIn size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="border border-[#D9D4CA] bg-[#F6F2E9]/40 rounded-sm p-4 overflow-auto max-h-80 flex items-center justify-center">
                    <div
                      style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                      className="transition-transform duration-150 max-w-full"
                      dangerouslySetInnerHTML={{ __html: generatedResult.svgContent }}
                    />
                  </div>
                </div>

                {/* Nomenclature des pièces */}
                <div className="space-y-2">
                  <h5 className="font-headline uppercase text-xs tracking-widest text-[#061938] flex items-center gap-1.5 font-semibold">
                    <FileCheck size={14} className="text-[#936C3E]" />
                    Nomenclature des pièces ({generatedResult.pieces.length})
                  </h5>
                  <div className="border border-[#D9D4CA] bg-white rounded-sm overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#F6F2E9]/60 border-b border-[#D9D4CA] text-[#5C697A] font-headline uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Nom de la pièce</th>
                          <th className="p-2.5">Valeur couture</th>
                          <th className="p-2.5">Dimensions (mm)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9D4CA]/40">
                        {generatedResult.pieces.map((piece, i) => (
                          <tr key={i} className="hover:bg-[#F6F2E9]/30">
                            <td className="p-2.5 font-medium text-[#061938]">{piece.name}</td>
                            <td className="p-2.5 text-[#5C697A] font-mono">{piece.seamAllowanceMm} mm</td>
                            <td className="p-2.5 text-[#5C697A] font-mono">
                              {Math.round(piece.widthMm)} × {Math.round(piece.heightMm)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions de clôture */}
                <div className="flex items-center justify-between pt-4 border-t border-[#D9D4CA]">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs uppercase tracking-wider text-[#936C3E] hover:underline"
                  >
                    ← Modifier les paramètres et régénérer
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-[#061938] hover:bg-[#0C2650] text-[#F6F2E9] rounded-sm text-xs font-headline uppercase tracking-wider font-semibold transition-colors"
                  >
                    Terminer & Voir dans l&apos;atelier
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
