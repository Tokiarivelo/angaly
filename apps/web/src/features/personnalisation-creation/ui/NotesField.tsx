import React from 'react';

interface NotesFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const NotesField: React.FC<NotesFieldProps> = ({ label, value, onChange, placeholder }) => {
  return (
    <div className="mb-8 flex flex-col">
      <label className="font-serif text-xl text-primary-deep-navy mb-4">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 border border-border rounded-md bg-ivory focus:outline-none focus:ring-1 focus:ring-primary-deep-navy resize-y min-h-[120px] text-primary-deep-navy placeholder:text-slate/60"
      />
    </div>
  );
};
