/**
 * Haversine formula - calculate distance between two lat/lng points in km.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Estimate delivery time in minutes based on distance.
 */
export function estimateDeliveryTime(distanceKm) {
  const avgSpeedKmPerMin = 0.4;
  const prepTime = 5;
  const minutes = Math.ceil(distanceKm / avgSpeedKmPerMin) + prepTime;
  if (minutes < 15) return '10-15 min';
  if (minutes < 25) return '20-25 min';
  if (minutes < 35) return '30-35 min';
  return `${Math.round(minutes / 5) * 5} min`;
}

export function interpolateCoords(from, to, fraction) {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * fraction,
    longitude: from.longitude + (to.longitude - from.longitude) * fraction,
  };
}

/**
 * Maharashtra bounding box — covers the entire state.
 * Lat: 15.6 (south, near Kolhapur border) to 22.0 (north, near Nagpur/Chandrapur)
 * Lng: 72.6 (west, Dahanu/Palghar) to 80.9 (east, Gadchiroli)
 */
const MAHARASHTRA_BOUNDS = {
  minLat: 15.6,
  maxLat: 22.1,
  minLng: 72.6,
  maxLng: 80.9,
};

/**
 * City-level delivery zones with radius in km.
 * All major Maharashtra cities supported.
 */
const MAHARASHTRA_CITIES = [
  { name: 'Nagpur',     lat: 21.1458, lng: 79.0882, radius: 40 },
  { name: 'Mumbai',     lat: 19.0760, lng: 72.8777, radius: 60 },
  { name: 'Pune',       lat: 18.5204, lng: 73.8567, radius: 50 },
  { name: 'Nashik',     lat: 19.9975, lng: 73.7898, radius: 35 },
  { name: 'Aurangabad', lat: 19.8762, lng: 75.3433, radius: 30 },
  { name: 'Solapur',    lat: 17.6805, lng: 75.9064, radius: 25 },
  { name: 'Amravati',   lat: 20.9320, lng: 77.7523, radius: 25 },
  { name: 'Nanded',     lat: 19.1383, lng: 77.3210, radius: 20 },
  { name: 'Kolhapur',   lat: 16.7050, lng: 74.2433, radius: 25 },
  { name: 'Akola',      lat: 20.7002, lng: 77.0082, radius: 20 },
  { name: 'Latur',      lat: 18.4088, lng: 76.5604, radius: 20 },
  { name: 'Sangli',     lat: 16.8524, lng: 74.5815, radius: 20 },
  { name: 'Jalgaon',    lat: 21.0077, lng: 75.5626, radius: 20 },
  { name: 'Chandrapur', lat: 19.9615, lng: 79.2961, radius: 20 },
  { name: 'Dhule',      lat: 20.9042, lng: 74.7749, radius: 20 },
  { name: 'Yavatmal',   lat: 20.3888, lng: 78.1204, radius: 15 },
  { name: 'Wardha',     lat: 20.7453, lng: 78.5997, radius: 15 },
  { name: 'Washim',     lat: 20.1033, lng: 77.1492, radius: 15 },
  { name: 'Bhandara',   lat: 21.1667, lng: 79.6500, radius: 15 },
  { name: 'Gondia',     lat: 21.4625, lng: 80.1967, radius: 15 },
  { name: 'Gadchiroli', lat: 20.1756, lng: 80.0024, radius: 15 },
  { name: 'Palghar',    lat: 19.6967, lng: 72.7648, radius: 20 },
  { name: 'Raigad',     lat: 18.5142, lng: 73.1826, radius: 20 },
  { name: 'Satara',     lat: 17.6805, lng: 74.0183, radius: 20 },
  { name: 'Ratnagiri',  lat: 16.9902, lng: 73.3120, radius: 15 },
  { name: 'Sindhudurg', lat: 16.3500, lng: 73.6667, radius: 15 },
  { name: 'Osmanabad',  lat: 18.1819, lng: 76.0440, radius: 15 },
  { name: 'Parbhani',   lat: 19.2705, lng: 76.7740, radius: 15 },
  { name: 'Hingoli',    lat: 19.7175, lng: 77.1504, radius: 12 },
  { name: 'Beed',       lat: 18.9892, lng: 75.7563, radius: 15 },
  { name: 'Ahmednagar', lat: 19.0948, lng: 74.7480, radius: 25 },
  { name: 'Buldhana',   lat: 20.5292, lng: 76.1844, radius: 15 },
  { name: 'Nandurbar',  lat: 21.3666, lng: 74.2433, radius: 12 },
];

/**
 * Check if coordinates are within any supported Maharashtra city radius.
 * Also falls back to bounding-box check for the entire state.
 */
export function isInDeliveryZone(lat, lng) {
  // First: bounding-box sanity check
  if (
    lat < MAHARASHTRA_BOUNDS.minLat ||
    lat > MAHARASHTRA_BOUNDS.maxLat ||
    lng < MAHARASHTRA_BOUNDS.minLng ||
    lng > MAHARASHTRA_BOUNDS.maxLng
  ) {
    return false;
  }

  // Second: city-radius check
  return MAHARASHTRA_CITIES.some(city => {
    const dist = haversineDistance(lat, lng, city.lat, city.lng);
    return dist <= city.radius;
  });
}

/**
 * Get the nearest Maharashtra city name for a given lat/lng.
 */
export function getNearestCity(lat, lng) {
  let nearest = null;
  let minDist = Infinity;

  MAHARASHTRA_CITIES.forEach(city => {
    const dist = haversineDistance(lat, lng, city.lat, city.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = city.name;
    }
  });

  return nearest || 'Maharashtra';
}

/**
 * Get all supported Maharashtra cities list.
 */
export function getMaharashtraCities() {
  return MAHARASHTRA_CITIES.map(c => c.name);
}
