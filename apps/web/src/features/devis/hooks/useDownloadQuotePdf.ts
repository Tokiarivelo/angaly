import { useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

export const useDownloadQuotePdf = () => {
  const downloadPdf = useCallback(async (quoteNumber: string) => {
    try {
      const blob = await apiClient.getBlob(`/quotes/${quoteNumber}/pdf`);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Devis_${quoteNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: Just open the URL directly if blob failed
      // window.open(`${apiClient.defaults.baseURL || ''}/api/quotes/${quoteNumber}/pdf`, '_blank');
    }
  }, []);

  return { downloadPdf };
};
