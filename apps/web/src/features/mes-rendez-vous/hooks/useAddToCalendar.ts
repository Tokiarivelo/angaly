import type { Appointment } from './useMyAppointments';

export const useAddToCalendar = () => {
  const generateICS = (appointment: Appointment) => {
    console.log(`Generating .ics for ${appointment.reference}`);
    // Mock logic: just download a dummy file or return true
    return true;
  };

  return { generateICS };
};
