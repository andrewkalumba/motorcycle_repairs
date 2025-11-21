// Shop search and matching utilities

import { supabase } from './supabase';
import { MotorcycleShop } from '@/types/shop';

export interface ShopSearchFilters {
  search?: string;
  city?: string;
  country?: string;
  minRating?: number;
  maxDistance?: number; // in kilometers
  serviceCategory?: string;
  userLatitude?: number;
  userLongitude?: number;
  limit?: number;
}

export interface ShopWithDistance extends MotorcycleShop {
  distance?: number; // in kilometers
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Normalize shop data by converting string numbers to actual numbers
 */
function normalizeShopData(shop: any): MotorcycleShop {
  return {
    ...shop,
    latitude: shop.latitude !== null ? parseFloat(shop.latitude) : null,
    longitude: shop.longitude !== null ? parseFloat(shop.longitude) : null,
    rating: shop.rating !== null ? parseFloat(shop.rating) : null,
    reviews_count: shop.reviews_count !== null ? parseInt(shop.reviews_count) : null,
  };
}

/**
 * Search shops with optional filters
 */
export async function searchShops(
  filters: ShopSearchFilters = {}
): Promise<{ shops: ShopWithDistance[]; error: string | null }> {
  try {
    let query = supabase
      .from('motorcycle_repairs')
      .select('*');

    // Apply text search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
    }

    // Apply city filter
    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    // Apply country filter
    if (filters.country) {
      query = query.ilike('country', `%${filters.country}%`);
    }

    // Apply rating filter
    if (filters.minRating) {
      query = query.gte('rating', filters.minRating);
    }

    // Apply limit
    const limit = filters.limit || 100;
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      return { shops: [], error: error.message };
    }

    // Normalize data to ensure numbers are numbers, not strings
    let shops: ShopWithDistance[] = (data || []).map(normalizeShopData);

    // Calculate distance if user coordinates provided
    if (filters.userLatitude !== undefined && filters.userLongitude !== undefined) {
      shops = shops
        .map(shop => {
          if (shop.latitude !== null && shop.longitude !== null) {
            const distance = calculateDistance(
              filters.userLatitude!,
              filters.userLongitude!,
              shop.latitude,
              shop.longitude
            );
            return { ...shop, distance };
          }
          return { ...shop, distance: undefined };
        })
        .filter(shop => {
          // Filter by max distance if specified
          if (filters.maxDistance && shop.distance !== undefined) {
            return shop.distance <= filters.maxDistance;
          }
          return true;
        })
        .sort((a, b) => {
          // Sort by distance (closest first)
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
    } else {
      // Sort by rating if no location provided
      shops.sort((a, b) => {
        if (a.rating === null) return 1;
        if (b.rating === null) return -1;
        return b.rating - a.rating;
      });
    }

    return { shops, error: null };
  } catch (error) {
    console.error('Error searching shops:', error);
    return { shops: [], error: 'Failed to search shops' };
  }
}

/**
 * Get shop by ID
 */
export async function getShopById(
  shopId: string
): Promise<{ shop: MotorcycleShop | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('motorcycle_repairs')
      .select('*')
      .eq('id', shopId)
      .single();

    if (error) {
      return { shop: null, error: error.message };
    }

    return { shop: data ? normalizeShopData(data) : null, error: null };
  } catch (error) {
    console.error('Error fetching shop:', error);
    return { shop: null, error: 'Failed to fetch shop' };
  }
}

/**
 * Get nearby shops based on user location
 */
export async function getNearbyShops(
  latitude: number,
  longitude: number,
  radiusKm: number = 50,
  limit: number = 20
): Promise<{ shops: ShopWithDistance[]; error: string | null }> {
  return searchShops({
    userLatitude: latitude,
    userLongitude: longitude,
    maxDistance: radiusKm,
    limit,
  });
}

/**
 * Get shops by city
 */
export async function getShopsByCity(
  city: string
): Promise<{ shops: MotorcycleShop[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('motorcycle_repairs')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('rating', { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) {
      return { shops: [], error: error.message };
    }

    return { shops: (data || []).map(normalizeShopData), error: null };
  } catch (error) {
    console.error('Error fetching shops by city:', error);
    return { shops: [], error: 'Failed to fetch shops' };
  }
}

/**
 * Get all unique cities from shops
 */
export async function getShopCities(): Promise<{ cities: string[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('motorcycle_repairs')
      .select('city')
      .not('city', 'is', null)
      .order('city');

    if (error) {
      return { cities: [], error: error.message };
    }

    // Get unique cities
    const cities = [...new Set(data.map(item => item.city))].filter(Boolean) as string[];

    return { cities, error: null };
  } catch (error) {
    console.error('Error fetching cities:', error);
    return { cities: [], error: 'Failed to fetch cities' };
  }
}

/**
 * Get user's current location using browser geolocation API
 */
export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Properly extract error details from GeolocationPositionError
        let errorMessage = 'Unknown error';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            break;
        }

        console.error('Error getting user location:', {
          code: error.code,
          message: error.message || errorMessage,
        });
        resolve(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache location for 5 minutes
      }
    );
  });
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined) return 'N/A';

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Get shop specializations
 */
export async function getShopSpecializations(
  shopId: string
): Promise<{ specializations: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_specializations')
      .select('*')
      .eq('shop_id', shopId);

    if (error) {
      return { specializations: [], error: error.message };
    }

    return { specializations: data || [], error: null };
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return { specializations: [], error: 'Failed to fetch specializations' };
  }
}

/**
 * Get shop services
 */
export async function getShopServices(
  shopId: string
): Promise<{ services: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_services')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_available', true)
      .order('service_category');

    if (error) {
      return { services: [], error: error.message };
    }

    return { services: data || [], error: null };
  } catch (error) {
    console.error('Error fetching services:', error);
    return { services: [], error: 'Failed to fetch services' };
  }
}
