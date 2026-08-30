import type { GeoPoint } from '@/domain';

/**
 * Great-circle distance in kilometres.
 *
 * Used to rank Stock Points against the user's operating destination.
 * In production this becomes a server-side query — kept here so the prototype
 * ranks realistically rather than showing invented distances.
 */
export function distanceInKm(from: GeoPoint, to: GeoPoint): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(dLon / 2) ** 2;

  const distance = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
  return Math.round(distance * 10) / 10;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
