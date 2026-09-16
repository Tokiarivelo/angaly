export const SECTION_GROUPS_KEY = ['admin', 'content', 'sections'] as const;

export const sectionKey = (page: string, sectionKey: string) =>
  ['admin', 'content', 'section', page, sectionKey] as const;

export const sectionVersionsKey = (pageSectionId: string) =>
  ['admin', 'content', 'section-versions', pageSectionId] as const;
