import { cmsList, readString } from '@/lib/cms/cms-values';
import { useCmsPage } from '@/lib/cms/use-cms-page';

import { DRAWER_NAV_LINKS, DRAWER_SECONDARY_LINKS, HEADER_NAV_LINKS } from '../consts/nav-links.const';

export interface NavLink {
  label: string;
  href: string;
  badge?: string | undefined;
}

function parseLink(item: Record<string, unknown>): NavLink | undefined {
  const label = readString(item['label']);
  const href = readString(item['href']);
  if (!label || !href) return undefined;
  const badge = readString(item['badge']);
  return badge ? { label, href, badge } : { label, href };
}

/**
 * Menu links (desktop header, mobile drawer, drawer secondary group) from the CMS
 * (`page="navigation"`, sections `header` / `drawer` / `drawer-secondary`, `dataJson.links`), each list falling
 * back to its built-in default (`nav-links.const.ts`) when the CMS has none.
 */
export function useNavigationLinks(): { header: readonly NavLink[]; drawer: readonly NavLink[]; secondary: readonly NavLink[] } {
  const cms = useCmsPage('navigation');

  return {
    header: cmsList(cms.section('header')?.dataJson, 'links', parseLink) ?? HEADER_NAV_LINKS,
    drawer: cmsList(cms.section('drawer')?.dataJson, 'links', parseLink) ?? DRAWER_NAV_LINKS,
    secondary: cmsList(cms.section('drawer-secondary')?.dataJson, 'links', parseLink) ?? DRAWER_SECONDARY_LINKS,
  };
}
