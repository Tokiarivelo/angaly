import React from 'react';
import type { PatternDetailGroup } from '@angaly/types';
import type { SketchGarment } from '../../consts/garment-details.const';
import { sketchForOption } from '../../utils/option-sketch';
import type { Sketch, SketchRole } from '../../utils/sketch-geometry';

const ROLE_STYLE: Record<SketchRole, React.SVGProps<SVGPathElement>> = {
  garment: { fill: '#EFE6D6', stroke: '#0C2650', strokeWidth: 0.8 },
  contrast: { fill: '#C9B79A', stroke: '#0C2650', strokeWidth: 0.6 },
  detail: { fill: 'none', stroke: '#B8893A', strokeWidth: 1.4 },
  detailFill: { fill: '#E2C48A', stroke: '#8A6526', strokeWidth: 0.9 },
  line: { fill: 'none', stroke: '#0C2650', strokeWidth: 0.5 },
  dash: { fill: 'none', stroke: '#0C2650', strokeWidth: 0.5, strokeDasharray: '1.5 1.2' },
};

interface SketchImageProps {
  sketch: Sketch;
  className?: string | undefined;
  /** Accessible name; without it the drawing is decorative (its button or caption names it). */
  title?: string | undefined;
}

/** Renders a technical flat (garment in ivory, the option shown in gold). */
export const SketchImage: React.FC<SketchImageProps> = ({ sketch, className, title }) => (
  <svg
    viewBox="0 0 100 150"
    className={className}
    {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    data-view={sketch.view}
    strokeLinejoin="round"
    strokeLinecap="round"
  >
    {sketch.parts.map((part, i) => (
      <path key={i} d={part.d} {...ROLE_STYLE[part.role]} />
    ))}
  </svg>
);

interface OptionSketchProps {
  group: PatternDetailGroup;
  optionId: string;
  garment?: SketchGarment | undefined;
  /** The cut chosen (trousers and skirts are drawn in it). */
  cut?: string | undefined;
  className?: string | undefined;
  title?: string | undefined;
  /** The other details already chosen: the drawing shows them (a short stays a short on the pocket options). */
  context?: Partial<Record<string, string>> | undefined;
}

/** Technical flat of a detail option on the garment chosen (back view for the back options). */
export const OptionSketch: React.FC<OptionSketchProps> = ({ group, optionId, garment, cut, className, title, context }) => (
  <SketchImage sketch={sketchForOption(group, optionId, garment, cut, context ?? {})} className={className} title={title} />
);
