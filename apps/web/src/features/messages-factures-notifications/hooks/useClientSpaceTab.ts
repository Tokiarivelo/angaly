import { useSearchParams, useRouter } from 'next/navigation';

export type TabValue = 'messages' | 'factures' | 'notifications';

export const useClientSpaceTab = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tab = searchParams.get('tab') as TabValue | null;
  const currentTab: TabValue = tab === 'factures' || tab === 'notifications' ? tab : 'messages';

  const setTab = (newTab: TabValue) => {
    router.replace(`/mes-messages?tab=${newTab}`);
  };

  return { currentTab, setTab };
};
