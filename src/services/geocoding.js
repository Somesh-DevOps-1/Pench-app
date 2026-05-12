/**
 * OpenStreetMap Nominatim geocoding service.
 */

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const DEFAULT_CITY = 'Nagpur';
const DEFAULT_STATE = 'Maharashtra';
const DEFAULT_COUNTRY = 'India';
const MIN_NOMINATIM_INTERVAL_MS = 1100;
const SEARCH_CACHE = new Map();
const REVERSE_CACHE = new Map();

let nominatimQueue = Promise.resolve();
let lastNominatimRequestAt = 0;

function pickFirst(...values) {
  return values.find(value => typeof value === 'string' && value.trim()) || '';
}

function uniqueParts(parts) {
  const seen = new Set();
  return parts.filter(part => {
    const normalized = part?.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function buildAddressFromNominatim(item) {
  const address = item?.address || {};
  const houseNumber = pickFirst(address.house_number, address.houseName);
  const road = pickFirst(address.road, address.pedestrian, address.footway);
  const locality = pickFirst(
    address.suburb,
    address.quarter,
    address.neighbourhood,
    address.residential,
    address.hamlet,
    address.village,
  );
  const city = pickFirst(
    address.city,
    address.town,
    address.municipality,
    address.county,
    DEFAULT_CITY,
  );
  const state = pickFirst(address.state, DEFAULT_STATE);
  const postcode = pickFirst(address.postcode);
  const country = pickFirst(address.country, DEFAULT_COUNTRY);
  const landmark = pickFirst(address.amenity, address.building, address.shop, address.office);

  const addressLine1 = uniqueParts([
    [houseNumber, road].filter(Boolean).join(', '),
    road && !houseNumber ? road : '',
    landmark && landmark !== road ? landmark : '',
  ])[0] || pickFirst(item?.name, city);

  const addressLine2 = uniqueParts([locality, city, state]).join(', ');
  const shortAddress = uniqueParts([addressLine1, locality, city]).join(', ');
  const fullAddress = pickFirst(
    item?.display_name,
    uniqueParts([addressLine1, addressLine2, postcode, country]).join(', '),
  );

  return {
    latitude: item?.lat ? parseFloat(item.lat) : null,
    longitude: item?.lon ? parseFloat(item.lon) : null,
    displayName: fullAddress,
    fullAddress,
    addressLine1,
    addressLine2,
    houseNumber,
    road,
    locality,
    suburb: locality,
    city,
    state,
    postcode,
    country,
    landmark,
    shortAddress,
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function roundCoordinate(value) {
  return Number.parseFloat(Number(value).toFixed(5));
}

function getReverseCacheKey(latitude, longitude) {
  return `${roundCoordinate(latitude)},${roundCoordinate(longitude)}`;
}

function getSearchCacheKey(query) {
  return query.trim().toLowerCase();
}

function parseRetryAfter(headerValue) {
  if (!headerValue) {
    return MIN_NOMINATIM_INTERVAL_MS;
  }

  const seconds = Number.parseInt(headerValue, 10);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const retryAt = Date.parse(headerValue);
  if (Number.isNaN(retryAt)) {
    return MIN_NOMINATIM_INTERVAL_MS;
  }

  return Math.max(retryAt - Date.now(), MIN_NOMINATIM_INTERVAL_MS);
}

async function queueNominatimRequest(request) {
  const run = async () => {
    const waitMs = Math.max(0, MIN_NOMINATIM_INTERVAL_MS - (Date.now() - lastNominatimRequestAt));
    if (waitMs > 0) {
      await delay(waitMs);
    }

    try {
      return await request();
    } finally {
      lastNominatimRequestAt = Date.now();
    }
  };

  const nextRequest = nominatimQueue.then(run, run);
  nominatimQueue = nextRequest.catch(() => undefined);
  return nextRequest;
}

async function fetchNominatimJson(url) {
  return queueNominatimRequest(async () => {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'PenchFoodsApp/1.0 (OpenStreetMap Nominatim client)',
      },
    });

    if (res.status === 429) {
      const retryAfterMs = parseRetryAfter(res.headers.get('Retry-After'));
      lastNominatimRequestAt = Date.now() + retryAfterMs - MIN_NOMINATIM_INTERVAL_MS;
    }

    if (!res.ok) {
      const error = new Error(`Nominatim request failed with status ${res.status}`);
      error.status = res.status;
      throw error;
    }

    return res.json();
  });
}

export async function reverseGeocode(latitude, longitude) {
  const cacheKey = getReverseCacheKey(latitude, longitude);
  if (REVERSE_CACHE.has(cacheKey)) {
    return REVERSE_CACHE.get(cacheKey);
  }

  try {
    const url = `${NOMINATIM_BASE}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    const data = await fetchNominatimJson(url);
    const normalized = buildAddressFromNominatim({
      ...data,
      lat: String(latitude),
      lon: String(longitude),
    });
    REVERSE_CACHE.set(cacheKey, normalized);
    return normalized;
  } catch (error) {
    if (error?.status !== 429) {
      console.error('Reverse geocoding failed:', error);
    }
    return null;
  }
}

export async function searchAddress(query) {
  const cacheKey = getSearchCacheKey(query);
  if (!cacheKey) {
    return [];
  }

  if (SEARCH_CACHE.has(cacheKey)) {
    return SEARCH_CACHE.get(cacheKey);
  }

  try {
    const encoded = encodeURIComponent(query + ', Maharashtra, India');
    const url = `${NOMINATIM_BASE}/search?q=${encoded}&format=json&addressdetails=1&limit=5&countrycodes=in`;
    const data = await fetchNominatimJson(url);
    const normalizedResults = data.map(item => {
      const normalized = buildAddressFromNominatim(item);
      return {
        id: item.place_id,
        displayName: normalized.fullAddress,
        shortName: normalized.shortAddress || item.name || normalized.addressLine1,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        type: item.type,
        address: normalized,
      };
    });
    SEARCH_CACHE.set(cacheKey, normalizedResults);
    return normalizedResults;
  } catch (error) {
    if (error?.status !== 429) {
      console.error('Forward geocoding failed:', error);
    }
    return [];
  }
}
