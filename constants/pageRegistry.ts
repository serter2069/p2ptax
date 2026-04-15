export type PageGroup = 'Overview' | 'Brand' | 'Auth' | 'Onboarding' | 'Dashboard' | 'Specialist' | 'Public' | 'Admin';
export type NavVariant = 'none' | 'public' | 'auth' | 'client' | 'specialist' | 'admin';

export interface PageNote {
  date: string;
  state?: string;
  text: string;
}

export interface TestScenario {
  name: string;
  steps: string[];
}

export interface PageEntry {
  id: string;
  title: string;
  group: PageGroup;
  route: string;
  stateCount: number;
  nav: NavVariant;
  activeTab?: string;
  notes?: PageNote[];
  api?: string[];
  /** IDs of pages this page can navigate TO (outbound transitions) */
  navTo?: string[];
  /** IDs of pages that can navigate to this page (inbound transitions) */
  navFrom?: string[];
  /** Last QC score (0–22), updated after each proto-check pass */
  qaScore?: number;
  /** How many proto+proto-check cycles completed (target: 5 before review) */
  qaCycles?: number;
  /** Test scenarios for QA validation (min 2 per page) */
  testScenarios?: TestScenario[];
}

export const PAGE_GROUPS: PageGroup[] = [
  'Overview',
  'Brand',
  'Auth',
  'Onboarding',
  'Dashboard',
  'Specialist',
  'Public',
  'Admin',
];

export const pageRegistry: PageEntry[] = [
  // Brand
  { id: 'brand', title: 'Бренд и стили', group: 'Brand', route: '/brand', stateCount: 1, nav: 'none' },
  { id: 'nav-components', title: 'Navigation Components', group: 'Brand', route: '/proto/nav', stateCount: 1, nav: 'none' },
];

export const PAGE_TRANSITIONS: Record<string, { to: string; action: string }[]> = {
  'brand': [],
  'nav-components': [],
};

export const ROLE_PAGES: Record<string, string[]> = {
  public: ['brand', 'nav-components'],
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getPageById(id: string): PageEntry | undefined {
  return pageRegistry.find((p) => p.id === id);
}

export function getPagesByGroup(group: PageGroup): PageEntry[] {
  return pageRegistry.filter((p) => p.group === group);
}

export function getPageNotes(id: string): PageNote[] {
  return getPageById(id)?.notes || [];
}

export function getNotesForState(id: string, state: string): PageNote[] {
  return getPageNotes(id).filter((n) => n.state === state);
}

/** Pages this page can navigate TO (computed from PAGE_TRANSITIONS) */
export function getNavTo(id: string): string[] {
  return (PAGE_TRANSITIONS[id] || []).map((t) => t.to);
}

/** Pages that can navigate TO this page (computed from PAGE_TRANSITIONS) */
export function getNavFrom(id: string): string[] {
  return Object.entries(PAGE_TRANSITIONS)
    .filter(([, transitions]) => transitions.some((t) => t.to === id))
    .map(([fromId]) => fromId);
}

/** pageRegistry enriched with computed navTo/navFrom fields */
export const pageRegistryWithNav: PageEntry[] = pageRegistry.map((p) => ({
  ...p,
  navTo: getNavTo(p.id),
  navFrom: getNavFrom(p.id),
}));
// ci-speed-test Fri Apr 10 22:51:33 PDT 2026
