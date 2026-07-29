import { reverseGeocode } from '../services/api';

/**
 * Format native reverse geocoding address object into a clean, complete address string.
 */
export function formatNativeGeocodedAddress(place: any): string {
  if (!place) return '';

  const name = place.name ? String(place.name).trim() : '';
  const streetNumber = place.streetNumber ? String(place.streetNumber).trim() : '';
  const street = place.street ? String(place.street).trim() : '';
  const subLocality = place.subLocality ? String(place.subLocality).trim() : '';
  const district = place.district ? String(place.district).trim() : '';
  const city = place.city ? String(place.city).trim() : '';
  const region = place.region ? String(place.region).trim() : '';
  const postalCode = place.postalCode ? String(place.postalCode).trim() : '';

  let streetAddress = '';
  if (street) {
    if (name) {
      if (name.toLowerCase() === street.toLowerCase() || street.toLowerCase().startsWith(name.toLowerCase())) {
        streetAddress = street;
      } else if (/^\d+[\w-]*$/.test(name) || name === streetNumber) {
        streetAddress = `${name} ${street}`;
      } else {
        streetAddress = `${name}, ${street}`;
      }
    } else if (streetNumber && !street.toLowerCase().startsWith(streetNumber.toLowerCase())) {
      streetAddress = `${streetNumber} ${street}`;
    } else {
      streetAddress = street;
    }
  } else {
    streetAddress = name;
  }

  const area = subLocality || district || '';

  const rawParts = [streetAddress, area, city, region, postalCode];
  const parts: string[] = [];

  for (const p of rawParts) {
    const trimmed = p ? p.trim() : '';
    if (trimmed && !parts.some(existing => existing.toLowerCase() === trimmed.toLowerCase())) {
      parts.push(trimmed);
    }
  }

  return parts.join(', ');
}

/**
 * Robustly fetch the full detailed address string given coordinates and optional native geocode results.
 * Falls back to the backend reverse geocode (Google Maps API) if native geocoding is brief or incomplete.
 */
export async function fetchFullAddress(
  latitude: number,
  longitude: number,
  nativeResults?: any[]
): Promise<string> {
  let address = '';

  if (nativeResults && nativeResults.length > 0) {
    address = formatNativeGeocodedAddress(nativeResults[0]);
  }

  // If address is missing, too short, or lacks detail, invoke backend reverse geocode API
  if (!address || address.length < 15 || !address.includes(',')) {
    try {
      const res = await reverseGeocode(latitude, longitude);
      if (res?.data) {
        const backendAddr = res.data.display_name || 
          [res.data.area, res.data.city, res.data.state, res.data.country].filter(Boolean).join(', ');
        if (backendAddr && backendAddr.length > address.length) {
          address = backendAddr;
        }
      }
    } catch (e) {
      console.warn('[LocationHelper] Backend reverse geocode fallback error:', e);
    }
  }

  return address;
}
