import Link from 'next/link';

interface FavoriteTypeFilterTabsProps {
  currentType: string;
}

const TABS = [
  { label: 'Toutes', value: 'ALL' },
  { label: 'Créations', value: 'CREATION' },
  { label: 'Produits', value: 'PRODUCT' },
  { label: 'Collections', value: 'COLLECTION' },
];

export const FavoriteTypeFilterTabs = ({ currentType }: FavoriteTypeFilterTabsProps) => {
  return (
    <div className="mb-8 flex space-x-6 border-b border-border overflow-x-auto pb-[-1px]">
      {TABS.map((tab) => {
        const isActive = currentType === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.value === 'ALL' ? '/mes-favoris' : `/mes-favoris?type=${tab.value}`}
            className={`whitespace-nowrap pb-3 text-sm font-medium transition-colors ${
              isActive
                ? 'border-b-2 border-navy-deep text-navy-deep'
                : 'border-b-2 border-transparent text-gray-warm hover:text-navy-deep'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
