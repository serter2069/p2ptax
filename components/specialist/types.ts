export interface FnsServiceGroup {
  fns: { id: string; name: string; code: string };
  city: { id: string; name: string };
  services: { id: string; name: string }[];
}

export interface SpecialistProfile {
  description: string | null;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  officeAddress: string | null;
  workingHours: string | null;
  // Iteration 5 — credibility fields
  exFnsStartYear?: number | null;
  exFnsEndYear?: number | null;
  yearsOfExperience?: number | null;
  specializations?: string[] | null;
  certifications?: string[] | null;
}

export interface SpecialistCaseItem {
  id: string;
  title: string;
  category: string;
  amount: number | null;
  resolvedAmount: number | null;
  days: number | null;
  status: string;
  description: string;
  year: number | null;
}

export interface ContactMethodItem {
  id: string;
  type: string;
  value: string;
  label: string | null;
  order: number;
}

export interface SpecialistDetail {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  profile: SpecialistProfile | null;
  fnsServices: FnsServiceGroup[];
  requestsCount?: number;
  // Iteration 5
  cases?: SpecialistCaseItem[];
}

export interface SimilarSpecialist {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  services: { id: string; name: string }[];
  cities: { id: string; name: string }[];
}
