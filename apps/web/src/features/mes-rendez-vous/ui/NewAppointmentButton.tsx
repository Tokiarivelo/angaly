import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const NewAppointmentButton = () => {
  return (
    <Link
      href="/prendre-rendez-vous"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-deep-navy text-white rounded-full font-medium hover:bg-primary-dark transition-colors shrink-0"
    >
      <Plus size={18} />
      Prendre un rendez-vous
    </Link>
  );
};
