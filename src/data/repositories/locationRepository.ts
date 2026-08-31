import type { GeoPoint, ID } from '@/domain';
import { distanceInKm } from '@/rules';
import { request } from '../client';
import { districts, type DistrictRecord, type TalukaRecord, type VillageRecord } from '../fixtures';

/**
 * ADMINISTRATIVE LOCATION MASTER — district → taluka → village.
 *
 * Two jobs, and they are opposites of each other:
 *
 *   TYPING DOWN   the applicant picks a district, then a taluka, then a
 *                 village. Each level narrows the next.
 *   POINTING      the applicant drops a pin on the map and the administrative
 *                 units are resolved FROM the coordinates.
 *
 * The second is why this is a repository and not three arrays imported into a
 * screen: `resolveNearest()` is a lookup a real build performs on the server
 * against the survey-number master, and the call site must not change when it
 * does.
 */

export interface LocationOption {
  code: string;
  name: string;
  geo: GeoPoint;
}

/** What a dropped pin resolves to. Any level may be null off the known map. */
export interface ResolvedLocation {
  district: LocationOption | null;
  taluka: LocationOption | null;
  village: LocationOption | null;
  /** Distance from the pin to the matched village centroid, in km. */
  distanceKm: number;
}

const toOption = (
  record: DistrictRecord | TalukaRecord | VillageRecord,
): LocationOption => ({ code: record.code, name: record.name, geo: record.geo });

function findDistrict(code: ID): DistrictRecord | undefined {
  return districts.find((district) => district.code === code);
}

function findTaluka(code: ID): { district: DistrictRecord; taluka: TalukaRecord } | undefined {
  for (const district of districts) {
    const taluka = district.talukas.find((candidate) => candidate.code === code);
    if (taluka) return { district, taluka };
  }
  return undefined;
}

export const locationRepository = {
  listDistricts: (): Promise<LocationOption[]> =>
    request(() => districts.map(toOption).sort((a, b) => a.name.localeCompare(b.name))),

  listTalukas: (districtCode: ID): Promise<LocationOption[]> =>
    request(() =>
      (findDistrict(districtCode)?.talukas ?? [])
        .map(toOption)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),

  listVillages: (talukaCode: ID): Promise<LocationOption[]> =>
    request(() =>
      (findTaluka(talukaCode)?.taluka.villages ?? [])
        .map(toOption)
        .sort((a, b) => a.name.localeCompare(b.name)),
    ),

  /**
   * Reverse lookup for a dropped pin: the nearest village, and the taluka and
   * district that contain it.
   *
   * PROVISIONAL: nearest-centroid is an approximation, not a boundary test. A
   * real build resolves the pin against actual village polygons, which is why
   * the resolved values are SUGGESTED to the applicant rather than locked in —
   * a pin near a boundary must remain correctable.
   */
  resolveNearest: (point: GeoPoint): Promise<ResolvedLocation> =>
    request(() => {
      let best: ResolvedLocation = {
        district: null,
        taluka: null,
        village: null,
        distanceKm: Number.POSITIVE_INFINITY,
      };

      for (const district of districts) {
        for (const taluka of district.talukas) {
          for (const village of taluka.villages) {
            const distanceKm = distanceInKm(point, village.geo);
            if (distanceKm < best.distanceKm) {
              best = {
                district: toOption(district),
                taluka: toOption(taluka),
                village: toOption(village),
                distanceKm: Math.round(distanceKm * 10) / 10,
              };
            }
          }
        }
      }

      return best;
    }),
};
