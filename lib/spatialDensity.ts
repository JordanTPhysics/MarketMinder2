// utils/spatialDensity.ts
export type LatLng = { lat: number; lng: number };

function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

export function computeLocalDensityScores(
  coords: LatLng[],
  k = 3
): { meanDist: number; densityScore: number }[] {
  const n = coords.length;
  if (n === 0) return [];

  // Precompute all distances
  const distMatrix = coords.map((a, i) =>
    coords.map((b, j) => (i === j ? Infinity : haversineDistance(a, b)))
  );

  // For each point, get mean distance to k nearest neighbours
  const meanDistances = distMatrix.map((row) => {
    const sorted = [...row].sort((a, b) => a - b);
    const kUsed = Math.min(k, sorted.length - 1);
    const mean = sorted.slice(0, kUsed).reduce((sum, d) => sum + d, 0) / kUsed;
    return mean;
  });

  // Convert to inverse (smaller distance → higher score)
  const inv = meanDistances.map((d) => 1 / (d + 1e-6));

  // Normalise to 0–1
  const min = Math.min(...inv);
  const max = Math.max(...inv);
  const scores = inv.map((v) => (v - min) / (max - min || 1));

  return coords.map((_, i) => ({
    meanDist: meanDistances[i],
    densityScore: scores[i], // 0–1 range
  }));
}
