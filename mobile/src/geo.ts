export interface LatLng {
  latitude: number;
  longitude: number;
}

const R = 6371000; // Earth radius in meters
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance between two coordinates, in meters (Haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const la1 = toRad(a.latitude);
  const la2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Initial great-circle bearing from `a` to `b`, in degrees (0 = north, clockwise). */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const la1 = toRad(a.latitude);
  const la2 = toRad(b.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Human-readable distance: cm under 1 m, m under 1 km, otherwise km. */
export function formatDistance(d: number): { value: string; unit: string } {
  if (d < 1) return { value: (d * 100).toFixed(0), unit: 'cm' };
  if (d < 1000) return { value: d.toFixed(1), unit: 'm' };
  return { value: (d / 1000).toFixed(2), unit: 'km' };
}
