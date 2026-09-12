export const useCancelAppointment = () => {
  const cancel = async (reference: string) => {
    // Mock API call
    console.log(`Cancelling appointment ${reference}`);
    return new Promise((resolve) => setTimeout(resolve, 500));
  };

  return { cancel };
};
