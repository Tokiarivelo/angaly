'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePatternWizard } from '../hooks/usePatternWizard';
import { useGeneratePattern } from '../hooks/useGeneratePattern';
import { WizardProgressBar } from './WizardProgressBar';
import { WizardFooterNav } from './WizardFooterNav';
import { GenerationLoadingScreen } from './GenerationLoadingScreen';
import { GarmentTypeStep } from './steps/GarmentTypeStep';
import { OccasionStep } from './steps/OccasionStep';
import { StyleStep } from './steps/StyleStep';
import { CutStep } from './steps/CutStep';
import { DetailsStep } from './steps/DetailsStep';
import { InspirationStep } from './steps/InspirationStep';
import { MeasurementsStep } from './steps/MeasurementsStep';

interface PatternStudioWizardProps {
  projectId: string;
}

export const PatternStudioWizard: React.FC<PatternStudioWizardProps> = ({ projectId }) => {
  const {
    currentStep,
    formData,
    projectRef,
    updateField,
    updateDetail,
    isStepValid,
    goToNextStep,
    goToPreviousStep,
    goToStep,
  } = usePatternWizard(projectId);

  const { mutate: generate, isPending: isGenerating } = useGeneratePattern(projectId);

  const handleNextOrGenerate = () => {
    if (currentStep === 7) {
      generate({ measurements: formData.measurements });
    } else {
      goToNextStep();
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#041329] text-white flex flex-col items-center justify-center">
        <GenerationLoadingScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#041329] text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="w-full bg-[#041329] border-b border-[#C5B190]/20 py-4 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/pattern-studio"
            className="text-[#D8D3C8] hover:text-[#C5B190] transition-colors p-1 rounded-full hover:bg-[#0C2650]"
            aria-label="Quitter le studio"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xl tracking-wider text-white">ANGALY</span>
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-[#0C2650] text-[#C5B190] border border-[#C5B190]/30 font-medium">
              Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-[#C5B190] bg-[#0C2650] px-3 py-1 rounded-full border border-[#C5B190]/30">
            {projectRef}
          </span>
        </div>
      </header>

      {/* Persistent Progress Bar */}
      <WizardProgressBar currentStep={currentStep} onSelectStep={goToStep} />

      {/* Main Wizard Form Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center my-6">
        <div className="bg-[#0C2650] border border-[#C5B190]/30 rounded-2xl p-6 sm:p-10 shadow-2xl">
          {currentStep === 1 && (
            <GarmentTypeStep
              selectedType={formData.garmentType}
              onSelect={(type) => updateField('garmentType', type)}
            />
          )}

          {currentStep === 2 && (
            <OccasionStep
              selectedOccasion={formData.occasion}
              onSelect={(occ) => updateField('occasion', occ)}
            />
          )}

          {currentStep === 3 && (
            <StyleStep
              selectedStyle={formData.style}
              onSelect={(st) => updateField('style', st)}
            />
          )}

          {currentStep === 4 && (
            <CutStep
              selectedCut={formData.cutType}
              onSelect={(cut) => updateField('cutType', cut)}
              garmentType={formData.garmentType}
              occasion={formData.occasion || null}
              style={formData.style || null}
            />
          )}

          {currentStep === 5 && (
            <DetailsStep
              selectedDetails={formData.details}
              onSelectDetail={updateDetail}
            />
          )}

          {currentStep === 6 && (
            <InspirationStep
              inspirationImageUrl={formData.inspirationImageUrl}
              detectedFeatures={formData.detectedFeatures}
              onInspirationProcessed={({ mediaId, url, detectedFeatures, suggestedCutType }) => {
                updateField('inspirationMediaId', mediaId);
                updateField('inspirationImageUrl', url);
                updateField('detectedFeatures', detectedFeatures);
                if (suggestedCutType && !formData.cutType) {
                  updateField('cutType', suggestedCutType);
                }
              }}
            />
          )}

          {currentStep === 7 && (
            <MeasurementsStep
              selectedProfileId={formData.measurementProfileId}
              measurements={formData.measurements}
              onSelectProfile={(id) => updateField('measurementProfileId', id)}
              onUpdateMeasurement={(k, v) => {
                const current = formData.measurements ?? {};
                updateField('measurements', { ...current, [k]: v });
              }}
              onApplyMeasurements={(values) => {
                const current = formData.measurements ?? {};
                updateField('measurements', { ...current, ...values });
              }}
            />
          )}

          <WizardFooterNav
            currentStep={currentStep}
            isValid={isStepValid(currentStep)}
            isSubmitting={isGenerating}
            onPrevious={goToPreviousStep}
            onNext={handleNextOrGenerate}
          />
        </div>
      </main>
    </div>
  );
};
