import { GenerationLoadingScreen } from '@/features/pattern-studio-wizard/ui/GenerationLoadingScreen';

// Shown immediately while the preview page loads, e.g. right after "Générer mon patron".
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#041329] text-white flex flex-col items-center justify-center">
      <GenerationLoadingScreen
        showStages={false}
        title="Ouverture de votre patron…"
        description="Préparation de l’aperçu, de la validation et de l’export."
      />
    </div>
  );
}
