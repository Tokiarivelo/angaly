import Link from 'next/link';

interface AuthFormFooterLinkProps {
  prompt: string;
  linkLabel: string;
  href: string;
}

/** Bottom-of-form link toggling between Connexion/Inscription — see docs/pages/authentification.md. */
export function AuthFormFooterLink({ prompt, linkLabel, href }: AuthFormFooterLinkProps) {
  return (
    <p className="mt-8 text-center text-sm text-angaly-slate">
      {prompt}{' '}
      <Link href={href} className="text-angaly-champagne hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
