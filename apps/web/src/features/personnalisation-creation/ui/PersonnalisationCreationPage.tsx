'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useCreationReference } from '../hooks/useCreationReference';
import { useCustomizationForm } from '../hooks/useCustomizationForm';
import { useInspirationUpload } from '../hooks/useInspirationUpload';
import { useSubmitDesignBrief } from '../hooks/useSubmitDesignBrief';
import { OPTION_CHOICES } from '../consts/option-choices.const';
import { ReferencePreview } from './ReferencePreview';
import { OptionGroup } from './OptionGroup';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { FabricSwatchPicker } from './FabricSwatchPicker';
import { InspirationUploadDropzone } from './InspirationUploadDropzone';
import { NotesField } from './NotesField';
import { SelectionSummaryBar } from './SelectionSummaryBar';
import { ConfirmationCard } from './ConfirmationCard';

interface PersonnalisationCreationPageProps {
  slug: string;
}

export const PersonnalisationCreationPage: React.FC<PersonnalisationCreationPageProps> = ({ slug }) => {
  const { data: creation, isLoading, error } = useCreationReference(slug);
  const {
    options,
    notes,
    setNotes,
    detailsDecoratifs,
    setDetailsDecoratifs,
    handleOptionChange,
    isValid,
  } = useCustomizationForm();
  
  const { uploadedMediaIds, previews, isUploading, handleUpload, removeUpload } = useInspirationUpload();
  const { handleSaveDraft, handleSubmit, isSavingDraft, isSubmitting, draftId } = useSubmitDesignBrief(slug);

  const [isConfirmed, setIsConfirmed] = useState(false);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  if (error || !creation) return <div className="min-h-screen flex items-center justify-center">Création introuvable</div>;

  if (isConfirmed) {
    return <ConfirmationCard creation={creation} options={options} previews={previews} draftId={draftId} />;
  }

  const onSaveDraft = async () => {
    try {
      await handleSaveDraft({
        options: { ...options, notes, detailsDecoratifs },
        inspirationMediaIds: uploadedMediaIds,
      });
      // maybe show a toast
    } catch (_err) {
      // maybe show a toast
    }
  };

  const onSubmit = async () => {
    try {
      await handleSubmit({
        options: { ...options, notes, detailsDecoratifs },
        inspirationMediaIds: uploadedMediaIds,
      });
      setIsConfirmed(true);
    } catch (_err) {
      // maybe show a toast
    }
  };

  return (
    <div className="bg-ivory min-h-screen pb-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-xs text-slate mb-8">
          <Link href="/" className="hover:text-primary-deep-navy">Accueil</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href="/creations" className="hover:text-primary-deep-navy">Nos Créations</Link>
          <ChevronRight size={14} className="mx-2" />
          <Link href={`/creations/${slug}`} className="hover:text-primary-deep-navy">{creation.name}</Link>
          <ChevronRight size={14} className="mx-2" />
          <span className="text-primary-deep-navy font-medium">Personnaliser</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          {creation.media?.[0]?.url && (
            <div className="relative w-16 h-20 rounded overflow-hidden border border-border hidden md:block">
              <Image src={creation.media[0].url} alt={creation.name} fill className="object-cover" />
            </div>
          )}
          <div>
            <h1 className="font-serif text-3xl md:text-5xl text-primary-deep-navy mb-3">Personnalisez votre Robe Éternelle</h1>
            <p className="text-slate max-w-2xl text-sm md:text-base">
              Ajustez les détails selon vos envies. Notre équipe affinera chaque choix avec vous lors de votre rendez-vous.
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 relative">
          {/* Left Column - Preview */}
          <div className="w-full lg:w-5/12">
            <ReferencePreview creation={creation} />
          </div>

          {/* Right Column - Form */}
          <div className="w-full lg:w-7/12 max-w-3xl">
            <OptionGroup title="1. Coupe" options={OPTION_CHOICES.coupe} selectedValue={options.coupe} onSelect={(val) => handleOptionChange('coupe', val)} />
            <OptionGroup title="2. Longueur" options={OPTION_CHOICES.longueur} selectedValue={options.longueur} onSelect={(val) => handleOptionChange('longueur', val)} />
            <OptionGroup title="3. Manches" options={OPTION_CHOICES.manches} selectedValue={options.manches} onSelect={(val) => handleOptionChange('manches', val)} />
            <OptionGroup title="4. Décolleté" options={OPTION_CHOICES.decollete} selectedValue={options.decollete} onSelect={(val) => handleOptionChange('decollete', val)} />
            <OptionGroup title="5. Dos" options={OPTION_CHOICES.dos} selectedValue={options.dos} onSelect={(val) => handleOptionChange('dos', val)} />
            
            <ColorSwatchPicker title="6. Couleur" options={OPTION_CHOICES.couleur} selectedValue={options.couleur} onSelect={(val) => handleOptionChange('couleur', val)} />
            <FabricSwatchPicker title="7. Tissu" options={OPTION_CHOICES.tissu} selectedValue={options.tissu} onSelect={(val) => handleOptionChange('tissu', val)} />
            
            <OptionGroup title="8. Broderies" options={OPTION_CHOICES.broderies} selectedValue={options.broderies} onSelect={(val) => handleOptionChange('broderies', val)} />
            <OptionGroup title="9. Boutons" options={OPTION_CHOICES.boutons} selectedValue={options.boutons} onSelect={(val) => handleOptionChange('boutons', val)} />
            <OptionGroup title="10. Ceinture" options={OPTION_CHOICES.ceinture} selectedValue={options.ceinture} onSelect={(val) => handleOptionChange('ceinture', val)} />
            <OptionGroup title="11. Traîne" options={OPTION_CHOICES.traine} selectedValue={options.traine} onSelect={(val) => handleOptionChange('traine', val)} />

            <NotesField
              label="12. Détails décoratifs"
              value={detailsDecoratifs}
              onChange={setDetailsDecoratifs}
              placeholder="Précisez vos envies (optionnel)"
            />

            <InspirationUploadDropzone
              previews={previews}
              isUploading={isUploading}
              onUpload={handleUpload}
              onRemove={removeUpload}
            />

            <NotesField
              label="Notes pour votre couturière (optionnel)"
              value={notes}
              onChange={setNotes}
              placeholder="Ex: J'aimerais que la dentelle soit très fine..."
            />
          </div>
        </div>
      </div>

      <SelectionSummaryBar
        options={{ ...options, notes, detailsDecoratifs }}
        isValid={isValid}
        isSavingDraft={isSavingDraft}
        isSubmitting={isSubmitting}
        onSaveDraft={onSaveDraft}
        onSubmit={onSubmit}
      />
    </div>
  );
};
