// Enhanced geolocation utilities with reverse geocoding

export interface UserLocation {
  latitude: number;
  longitude: number;
  country?: string;
  countryCode?: string;
  city?: string;
  accuracy?: number;
}

export interface ReverseGeocodeResult {
  country: string;
  countryCode: string;
  city?: string;
  state?: string;
  address?: string;
}

/**
 * Get user's current location using browser geolocation API
 * with optional reverse geocoding to determine country
 */
export async function getUserLocationWithCountry(
  includeCountry: boolean = true
): Promise<UserLocation | null> {
  try {
    const position = await getCurrentPosition();

    if (!position) {
      return null;
    }

    const location: UserLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };

    // Perform reverse geocoding to get country
    if (includeCountry) {
      const geocodeResult = await reverseGeocode(
        location.latitude,
        location.longitude
      );

      if (geocodeResult) {
        location.country = geocodeResult.country;
        location.countryCode = geocodeResult.countryCode;
        location.city = geocodeResult.city;
      }
    }

    return location;
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
}

/**
 * Get current position from browser geolocation API
 */
function getCurrentPosition(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(position);
      },
      (error) => {
        console.error('Error getting position:', error.message);

        // Provide user-friendly error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('User denied the request for Geolocation.');
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            console.error('The request to get user location timed out.');
            break;
        }

        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocode coordinates to get country and address information
 * Using Nominatim (OpenStreetMap) - free and no API key required
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    // Using Nominatim (OpenStreetMap) reverse geocoding API
    // Free tier, no API key required, but please be respectful with rate limits
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'MotorcycleServiceDirectory/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data || !data.address) {
      console.error('Invalid reverse geocoding response');
      return null;
    }

    const address = data.address;

    return {
      country: address.country || 'Unknown',
      countryCode: address.country_code?.toUpperCase() || 'XX',
      city: address.city || address.town || address.village || undefined,
      state: address.state || undefined,
      address: data.display_name || undefined,
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || distanceKm === null) {
    return 'Distance unknown';
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`;
  }

  return `${Math.round(distanceKm)} km`;
}

/**
 * Get list of European countries for filtering
 * Helps users manually select their country if GPS is unavailable
 */
export const COUNTRIES = [
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'IE', name: 'Ireland' },
];

/**
 * Validate coordinates are within reasonable bounds
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const country = COUNTRIES.find(
    (c) => c.code.toUpperCase() === countryCode.toUpperCase()
  );
  return country ? country.name : countryCode;
}
