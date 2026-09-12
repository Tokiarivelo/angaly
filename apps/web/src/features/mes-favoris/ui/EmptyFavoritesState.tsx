import Link from 'next/link';

export const EmptyFavoritesState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ivory-warm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-8 w-8 text-navy-soft"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </div>
      <h3 className="mb-4 font-serif text-2xl text-navy-deep">
        Vous n'avez pas encore de favoris
      </h3>
      <p className="mb-8 max-w-md text-gray-warm">
        Explorez nos collections et créations, et sauvegardez vos coups de cœur pour les retrouver
        ici et préparer votre rendez-vous.
      </p>
      <Link
        href="/nos-creations"
        className="inline-flex h-12 items-center justify-center border border-navy-deep px-8 font-medium text-navy-deep transition-colors hover:bg-navy-deep hover:text-white"
      >
        Découvrir nos créations
      </Link>
    </div>
  );
};
