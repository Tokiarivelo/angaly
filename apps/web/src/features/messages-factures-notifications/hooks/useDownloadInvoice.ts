export const useDownloadInvoice = () => {
  const download = async (invoiceId: string) => {
    console.log(`Downloading PDF for invoice ${invoiceId}`);
    // Mock download
    return new Promise(resolve => setTimeout(resolve, 500));
  };
  return { download };
};
