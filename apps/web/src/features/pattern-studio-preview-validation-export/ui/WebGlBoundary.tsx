import React from 'react';

interface WebGlBoundaryProps {
  children: React.ReactNode;
  /** Set when the GPU context was lost after a successful start. */
  forceError?: boolean | undefined;
  onRetry: () => void;
}

interface WebGlBoundaryState {
  message: string | null;
}

/**
 * Catches the error three.js throws when it cannot create a WebGL context, instead of guessing it up
 * front with a throw-away probe context (probes leak contexts and exhaust the browser's limit of ~16,
 * which made the 3D view report "unavailable" on browsers where WebGL works).
 */
export class WebGlBoundary extends React.Component<WebGlBoundaryProps, WebGlBoundaryState> {
  override state: WebGlBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): WebGlBoundaryState {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  private readonly retry = (): void => {
    this.setState({ message: null });
    this.props.onRetry();
  };

  override render(): React.ReactNode {
    const failed = this.state.message !== null || this.props.forceError === true;
    if (!failed) return this.props.children;

    return (
      <div
        role="alert"
        data-testid="webgl-fallback"
        className="h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-sm text-[#D8D3C8]"
      >
        <p className="text-white">
          {this.props.forceError === true
            ? 'Le contexte graphique 3D a été perdu.'
            : 'La vue 3D n’a pas pu démarrer sur ce navigateur.'}
        </p>
        <p className="max-w-md text-xs leading-relaxed">
          Vérifiez que l’accélération matérielle est activée (Chrome : Paramètres → Système), fermez les onglets 3D
          inutiles, et désactivez les extensions qui bloquent WebGL/canvas (ex. protection anti-pistage de Brave ou
          Firefox). Si l’erreur mentionne « GL_VENDOR = Disabled » : fermez Chrome complètement puis relancez-le ; sinon
          ouvrez chrome://flags, réglez « Choose ANGLE graphics backend » sur OpenGL et activez « Override software
          rendering list », puis relancez. Contrôle : chrome://gpu. La vue 2D reste disponible.
        </p>
        {this.state.message !== null && (
          <code className="max-w-md text-[10px] text-[#C5B190]/80 break-words">{this.state.message}</code>
        )}
        <button
          type="button"
          onClick={this.retry}
          className="px-3 py-1.5 rounded-lg bg-[#0C2650] border border-[#C5B190]/30 text-[#C5B190] hover:border-[#C5B190]"
        >
          Réessayer
        </button>
      </div>
    );
  }
}
