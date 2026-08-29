/**
 * Pages an admin can hide or unhide per account.
 *
 * The key is the route path; hidden keys are stored on `premium_access.hidden_pages`.
 * Settings, Auth, Admin and the admin Market page are never hideable.
 */
export interface AppPage {
  key: string;
  label: string;
}

export const HIDEABLE_PAGES: AppPage[] = [
  { key: "/", label: "Analyze" },
  { key: "/learn", label: "Academy" },
  { key: "/journal", label: "Journal" },
];


const KEYS = new Set(HIDEABLE_PAGES.map((page) => page.key));

export function sanitizeHiddenPages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => KEYS.has(item));
}

export function isPageHidden(hiddenPages: string[] | undefined, key: string): boolean {
  return Boolean(hiddenPages?.includes(key));
}

export function pageLabel(key: string): string {
  return HIDEABLE_PAGES.find((page) => page.key === key)?.label ?? key;
}
