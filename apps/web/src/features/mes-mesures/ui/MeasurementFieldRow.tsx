import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import { HelpCircle } from 'lucide-react';
import type { MeasurementProfileFormValues } from '../schemas/measurement-profile.schema';

interface MeasurementFieldRowProps {
  fieldKey: string;
  label: string;
  help: string;
  register: UseFormRegister<MeasurementProfileFormValues>;
}

export const MeasurementFieldRow = ({
  fieldKey,
  label,
  help,
  register,
}: MeasurementFieldRowProps) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 group">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-angaly-primary" htmlFor={`val-${fieldKey}`}>
          {label}
        </label>
        <div className="relative flex items-center justify-center w-5 h-5 text-angaly-slate cursor-help hover:text-angaly-primary">
          <HelpCircle className="w-4 h-4" />
          <div className="absolute left-full ml-2 w-48 p-2 text-xs text-white bg-angaly-primary rounded opacity-0 pointer-events-none group-hover:opacity-100 z-10">
            {help}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`val-${fieldKey}`}
          type="number"
          step="0.1"
          {...register(`values.${fieldKey}`, { valueAsNumber: true })}
          className="w-24 p-2 text-right border border-border rounded focus:outline-none focus:border-angaly-primary"
          placeholder="0.0"
        />
      </div>
    </div>
  );
};
