import { api } from "@/lib/api";
import { WorkAreaEntryData } from "@/components/onboarding/WorkAreaEntry";

interface SaveArgs {
  entries: WorkAreaEntryData[];
  allServiceIds: string[];
  isSpecialistUser: boolean;
}

interface SaveResult {
  user?: {
    isSpecialist: boolean;
    specialistProfileCompletedAt: string | null;
  };
}

/**
 * Persist the work-area entries.
 * - Non-specialists: POST /api/user/become-specialist (flips role + saves).
 * - Specialists: PUT /api/onboarding/work-area (updates only).
 *
 * "Не знаю" / any-service entries get expanded to ALL service ids so the API
 * (which skips empty serviceIds) still persists the row.
 */
export async function saveWorkArea({
  entries,
  allServiceIds,
  isSpecialistUser,
}: SaveArgs): Promise<SaveResult> {
  const cityIdSet = new Set<string>();
  const fnsIds: string[] = [];
  const fnsServices: { fnsId: string; serviceIds: string[] }[] = [];

  for (const e of entries) {
    cityIdSet.add(e.cityId);
    fnsIds.push(e.fnsId);
    const sids = e.isAnyService ? allServiceIds : e.serviceIds;
    fnsServices.push({ fnsId: e.fnsId, serviceIds: sids });
  }
  const cityIds = Array.from(cityIdSet);

  if (!isSpecialistUser) {
    const res = await api<{
      user: {
        isSpecialist: boolean;
        specialistProfileCompletedAt: string | null;
      };
    }>("/api/user/become-specialist", {
      method: "POST",
      body: {
        cities: cityIds,
        fns: fnsIds,
        services: fnsServices,
      },
    });
    return { user: res.user };
  }

  await api("/api/onboarding/work-area", {
    method: "PUT",
    body: {
      cities: cityIds,
      fns: fnsIds,
      fnsServices,
      specialist_services: fnsServices.flatMap((f) =>
        f.serviceIds.map((sid) => ({
          fns_id: f.fnsId,
          service_id: sid,
        }))
      ),
    },
  });
  return {};
}
