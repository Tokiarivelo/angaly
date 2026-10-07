'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowRight,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  CREATION_PROJECT_STAGES_ORDER,
  type CreationProjectStage,
  type CreationProjectStageMediaDto,
  type CreationProjectStageNoteDto,
  type GenerateCreationProjectAiPatternInput,
  type GenerateCreationProjectAiPatternResponseDto,
} from '@angaly/types';
import { formatDate, formatFileSize } from '@/lib/utils';
import { ADMIN_CREATION_STAGE_LABELS } from '../consts/stage-config.const';
import { CreationProjectAiPatternModal } from './CreationProjectAiPatternModal';

const STAGE_DESCRIPTIONS: Record<CreationProjectStage, string> = {
  CONSULTATION:
    'Prise de contact, écoute des souhaits, sélection des silhouettes de référence et orientation des matières.',
  CONCEPTION:
    'Recherche stylistique, esquisses d\'atelier, choix définitif des tissus et validations techniques.',
  PATRON:
    'Tracé du patronage sur mesure, découpe de la toile d\'essai et ajustements de conformation.',
  CONFECTION:
    'Coupe des étoffes nobles, montage à la main, entoilage traditionnel et finitions haute couture.',
  ESSAYAGE:
    'Rendez-vous d\'essayage en atelier, retouches de précision, vérification de l\'aisance et du tombé.',
  TERMINEE:
    'Contrôle qualité final, repassage à la vapeur douce, housse personnalisée et remise en main propre.',
};

interface CreationProjectStageWorkspaceProps {
  currentStage: CreationProjectStage;
  selectedStage: CreationProjectStage;
  onSelectStage: (stage: CreationProjectStage) => void;
  notes: CreationProjectStageNoteDto[];
  media: CreationProjectStageMediaDto[];
  onAddNote: (content: string) => Promise<unknown>;
  isAddingNote: boolean;
  onDeleteNote: (noteId: string) => Promise<unknown>;
  isDeletingNote: boolean;
  onUploadMedia: (file: File, title?: string) => Promise<unknown>;
  isUploadingMedia: boolean;
  onDeleteMedia: (mediaId: string) => Promise<unknown>;
  isDeletingMedia: boolean;
  nextStage: CreationProjectStage | null;
  onGoToNextStage: () => Promise<unknown>;
  isAdvancing: boolean;
  onGenerateAiPattern?: (
    input: GenerateCreationProjectAiPatternInput,
  ) => Promise<GenerateCreationProjectAiPatternResponseDto>;
  isGeneratingAiPattern?: boolean;
  projectReference?: string;
  projectTitle?: string;
}

export const CreationProjectStageWorkspace: React.FC<CreationProjectStageWorkspaceProps> = ({
  currentStage,
  selectedStage,
  onSelectStage,
  notes,
  media,
  onAddNote,
  isAddingNote,
  onDeleteNote,
  isDeletingNote,
  onUploadMedia,
  isUploadingMedia,
  onDeleteMedia,
  isDeletingMedia,
  nextStage,
  onGoToNextStage,
  isAdvancing,
  onGenerateAiPattern,
  isGeneratingAiPattern,
  projectReference,
  projectTitle,
}) => {
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [mediaTitle, setMediaTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageNotes = notes.filter((n) => n.stage === selectedStage);
  const stageMedia = media.filter((m) => m.stage === selectedStage);
  // Raster photos only: generated patterns are SVG data URIs and must never be sent to a vision model.
  const inspirationImages = media
    .filter((m) => m.mimeType?.startsWith('image/') && m.mimeType !== 'image/svg+xml' && /^https?:/.test(m.url))
    .map((m) => ({ id: m.id, url: m.url, title: m.title ?? m.fileName ?? 'Photo' }));

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || isAddingNote) return;
    try {
      await onAddNote(newNoteContent.trim());
      setNewNoteContent('');
    } catch {
      // Error handled by parent hook
    }
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    try {
      await onUploadMedia(file, mediaTitle.trim() || file.name);
      setMediaTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      // Error handled by parent hook
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileChange(e.dataTransfer.files);
    }
  };

  const isSelectedCurrentStage = selectedStage === currentStage;

  return (
    <section className="bg-white border border-[#D9D4CA] rounded-sm overflow-hidden">
      {/* Barre de navigation des 6 étapes */}
      <div
        role="tablist"
        aria-label="Étapes de travail atelier"
        className="border-b border-[#D9D4CA] bg-[#F6F2E9]/60 px-4 pt-3 flex items-center gap-1 overflow-x-auto scrollbar-none"
      >
        {CREATION_PROJECT_STAGES_ORDER.map((stage) => {
          const isSelected = stage === selectedStage;
          const isCurrent = stage === currentStage;
          const countNotes = notes.filter((n) => n.stage === stage).length;
          const countMedia = media.filter((m) => m.stage === stage).length;
          const totalAttachments = countNotes + countMedia;

          return (
            <button
              key={stage}
              role="tab"
              aria-selected={isSelected}
              type="button"
              onClick={() => onSelectStage(stage)}
              className={`px-3.5 py-2.5 text-xs font-headline tracking-wide uppercase transition-colors relative flex items-center gap-2 whitespace-nowrap rounded-t-sm ${
                isSelected
                  ? 'bg-white text-[#061938] font-semibold border-t-2 border-t-[#936C3E] border-x border-[#D9D4CA] shadow-sm -mb-px'
                  : 'text-[#5C697A] hover:text-[#061938] hover:bg-[#F6F2E9]'
              }`}
            >
              <span>{ADMIN_CREATION_STAGE_LABELS[stage]}</span>
              {isCurrent && (
                <span
                  title="Étape en cours"
                  className="w-2 h-2 rounded-full bg-[#936C3E]"
                  aria-label="Étape en cours"
                />
              )}
              {totalAttachments > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-[#061938] text-white' : 'bg-[#D9D4CA] text-[#5C697A]'
                  }`}
                >
                  {totalAttachments}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 space-y-6">
        {/* En-tête de l'étape active */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D9D4CA]/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-2xl text-[#061938]">
                {ADMIN_CREATION_STAGE_LABELS[selectedStage]}
              </h3>
              {isSelectedCurrentStage ? (
                <span className="text-[10px] font-headline uppercase tracking-wider px-2 py-0.5 bg-[#936C3E]/10 text-[#936C3E] border border-[#936C3E]/30 rounded-sm font-semibold">
                  Étape active du projet
                </span>
              ) : (
                <span className="text-[10px] font-headline uppercase tracking-wider px-2 py-0.5 bg-[#5C697A]/10 text-[#5C697A] border border-[#5C697A]/20 rounded-sm">
                  Consultation d&apos;étape
                </span>
              )}
            </div>
            <p className="text-xs text-[#5C697A] mt-1">{STAGE_DESCRIPTIONS[selectedStage]}</p>
          </div>

          {/* Actions d'étape : Génération IA de Patron et/ou Passage à l'étape suivante */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {selectedStage === 'PATRON' && onGenerateAiPattern && (
              <button
                type="button"
                onClick={() => setIsPatternModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-headline uppercase tracking-wider font-semibold bg-[#936C3E] text-white hover:bg-[#7D5A32] rounded-sm transition-colors shadow-sm"
              >
                <Sparkles size={14} aria-hidden="true" />
                <span>Générer le patron par IA</span>
              </button>
            )}

            {isSelectedCurrentStage && nextStage && (
              <button
                type="button"
                onClick={() => void onGoToNextStage()}
                disabled={isAdvancing}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-headline uppercase tracking-wider font-semibold bg-[#061938] text-white hover:bg-[#0C2650] rounded-sm border border-[#936C3E] transition-colors disabled:opacity-50 shadow-sm"
              >
                {isAdvancing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Validation…</span>
                  </>
                ) : (
                  <>
                    <span>Passer à l&apos;étape {ADMIN_CREATION_STAGE_LABELS[nextStage]}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Encadré d'atelier pour l'étape PATRON */}
        {selectedStage === 'PATRON' && (
          <div className="p-4 bg-[#F6F2E9]/70 border border-[#936C3E]/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-[#936C3E]/15 border border-[#936C3E]/40 flex items-center justify-center text-[#936C3E] shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#061938]">
                  Angaly Pattern Studio • Tracé géométrique assisté par IA
                </p>
                <p className="text-[11px] text-[#5C697A]">
                  Générez les pièces de patron haute précision aux mensurations de la cliente et intégrez le tracé vectoriel SVG à l&apos;atelier.
                </p>
              </div>
            </div>
            {onGenerateAiPattern && (
              <button
                type="button"
                onClick={() => setIsPatternModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-headline uppercase tracking-wider font-medium text-[#061938] hover:text-[#936C3E] underline decoration-dotted underline-offset-2 shrink-0 self-start sm:self-auto"
              >
                <span>Ouvrir l&apos;outil de génération</span>
                <ArrowRight size={12} />
              </button>
            )}
          </div>
        )}

        {/* Grille 2 colonnes : Notes d'atelier & Médias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne 1 : Notes d'atelier */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-headline uppercase text-xs tracking-widest text-[#061938] flex items-center gap-1.5">
                <FileText size={15} className="text-[#936C3E]" />
                Notes d&apos;atelier ({stageNotes.length})
              </h4>
            </div>

            {/* Formulaire d'ajout de note */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder={`Ajouter une note pour l'étape ${ADMIN_CREATION_STAGE_LABELS[selectedStage]} (ajustements, souhaits, tissu, retouches…)`}
                rows={3}
                disabled={isAddingNote}
                className="w-full bg-[#F6F2E9]/40 border border-[#D9D4CA] text-xs p-3 text-[#061938] placeholder-[#8A877F] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#936C3E] focus:bg-white resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newNoteContent.trim() || isAddingNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-headline uppercase tracking-wider rounded-sm bg-[#061938] text-white hover:bg-[#0C2650] disabled:bg-[#D9D4CA] disabled:text-[#8A877F] transition-colors"
                >
                  <Plus size={14} />
                  <span>{isAddingNote ? 'Ajout en cours…' : 'Ajouter la note'}</span>
                </button>
              </div>
            </form>

            {/* Liste des notes */}
            {stageNotes.length === 0 ? (
              <div className="p-6 border border-dashed border-[#D9D4CA] rounded-sm text-center bg-[#F6F2E9]/20">
                <p className="text-xs text-[#8A877F]">
                  Aucune note d&apos;atelier pour cette étape.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {stageNotes.map((note) => (
                  <li
                    key={note.id}
                    className="p-3.5 bg-[#F6F2E9]/40 border border-[#D9D4CA] rounded-sm space-y-1.5 group hover:border-[#936C3E]/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-[#061938] whitespace-pre-line leading-relaxed flex-1">
                        {note.content}
                      </p>
                      <button
                        type="button"
                        onClick={() => void onDeleteNote(note.id)}
                        disabled={isDeletingNote}
                        title="Supprimer la note"
                        className="text-[#8A877F] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="text-[10px] text-[#8A877F] flex items-center justify-between pt-1 border-t border-[#D9D4CA]/40">
                      <span>{note.authorEmail ? `Par ${note.authorEmail}` : 'Atelier'}</span>
                      <time dateTime={note.createdAt}>
                        {formatDate(note.createdAt, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Colonne 2 : Médias & Fichiers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-headline uppercase text-xs tracking-widest text-[#061938] flex items-center gap-1.5">
                <ImageIcon size={15} className="text-[#936C3E]" />
                Médias & Documents ({stageMedia.length})
              </h4>
            </div>

            {/* Zone de téléversement */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-sm p-4 text-center transition-colors ${
                isDragOver
                  ? 'border-[#936C3E] bg-[#F6F2E9]'
                  : 'border-[#D9D4CA] bg-[#F6F2E9]/20 hover:border-[#936C3E]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                id={`file-input-${selectedStage}`}
                onChange={(e) => void handleFileChange(e.target.files)}
                disabled={isUploadingMedia}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <Upload size={20} className="text-[#936C3E]" />
                <div className="space-y-0.5">
                  <label
                    htmlFor={`file-input-${selectedStage}`}
                    className="text-xs font-semibold text-[#061938] underline decoration-dotted cursor-pointer hover:text-[#936C3E]"
                  >
                    Sélectionner un fichier
                  </label>
                  <p className="text-[11px] text-[#8A877F]">
                    ou glissez-déposez ici (JPG, PNG, PDF)
                  </p>
                </div>
                {isUploadingMedia && (
                  <p className="text-[11px] text-[#936C3E] animate-pulse">
                    Téléversement en cours…
                  </p>
                )}
              </div>
            </div>

            {/* Liste / Grille des médias */}
            {stageMedia.length === 0 ? (
              <div className="p-6 border border-dashed border-[#D9D4CA] rounded-sm text-center bg-[#F6F2E9]/20">
                <p className="text-xs text-[#8A877F]">
                  Aucun média ou croquis attaché pour cette étape.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {stageMedia.map((item) => {
                  const isImage =
                    item.mimeType?.startsWith('image/') ||
                    item.url.match(/\.(jpg|jpeg|png|webp|gif)$/i);

                  return (
                    <div
                      key={item.id}
                      className="border border-[#D9D4CA] bg-white rounded-sm overflow-hidden group hover:border-[#936C3E] transition-colors relative flex flex-col justify-between"
                    >
                      {isImage ? (
                        <div className="h-28 bg-[#F6F2E9] overflow-hidden relative">
                          <img
                            src={item.url}
                            alt={item.title || item.fileName || 'Média d\'étape'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-28 bg-[#F6F2E9] flex flex-col items-center justify-center gap-1 text-[#5C697A]">
                          <Paperclip size={24} className="text-[#936C3E]" />
                          <span className="text-[10px] uppercase font-mono">Document</span>
                        </div>
                      )}

                      <div className="p-2 space-y-1 bg-white">
                        <p
                          className="text-xs text-[#061938] font-medium truncate"
                          title={item.title || item.fileName || 'Fichier'}
                        >
                          {item.title || item.fileName || 'Fichier sans titre'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-[#8A877F]">
                          <span>{item.sizeBytes ? formatFileSize(item.sizeBytes) : 'Fichier'}</span>
                          <div className="flex items-center gap-1">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#061938] hover:text-[#936C3E] p-0.5"
                              title="Ouvrir le fichier"
                            >
                              <ExternalLink size={12} />
                            </a>
                            <button
                              type="button"
                              onClick={() => void onDeleteMedia(item.id)}
                              disabled={isDeletingMedia}
                              title="Supprimer ce média"
                              className="text-[#8A877F] hover:text-red-600 p-0.5"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {onGenerateAiPattern && (
        <CreationProjectAiPatternModal
          isOpen={isPatternModalOpen}
          onClose={() => setIsPatternModalOpen(false)}
          projectReference={projectReference}
          projectTitle={projectTitle}
          onGeneratePattern={onGenerateAiPattern}
          isGenerating={Boolean(isGeneratingAiPattern)}
          inspirationImages={inspirationImages}
        />
      )}
    </section>
  );
};
