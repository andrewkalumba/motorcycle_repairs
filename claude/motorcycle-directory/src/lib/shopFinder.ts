// Enhanced shop finder with service filtering and email capabilities

import { supabase } from './supabase';
import { MotorcycleShop } from '@/types/shop';

export interface ServiceRequest {
  userId: string;
  bikeId: string;
  shopIds: string[];
  serviceType: string;
  serviceCategory?: string;
  description: string;
  urgency: 'immediate' | 'within_week' | 'routine';
  userLocation?: string;
  preferredDate?: string;
  bikeMake: string;
  bikeModel: string;
  bikeYear: number;
  userEmail: string;
  userName: string;
  userPhone?: string;
}

export interface ShopWithServiceMatch extends MotorcycleShop {
  distance?: number;
  offersService: boolean;
}

export interface ServiceCategory {
  value: string;
  label: string;
  description: string;
}

// Common service categories for motorcycle repair
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { value: 'oil_change', label: 'Oil Change', description: 'Engine oil and filter replacement' },
  { value: 'brake', label: 'Brake Service', description: 'Brake pad/rotor replacement, brake fluid service' },
  { value: 'tire', label: 'Tire Service', description: 'Tire replacement, repair, balancing, alignment' },
  { value: 'engine', label: 'Engine Repair', description: 'Engine diagnostics, repair, rebuild' },
  { value: 'electrical', label: 'Electrical', description: 'Wiring, battery, alternator, lights' },
  { value: 'chain', label: 'Chain & Sprocket', description: 'Chain adjustment, lubrication, replacement' },
  { value: 'suspension', label: 'Suspension', description: 'Fork service, shock replacement, adjustment' },
  { value: 'transmission', label: 'Transmission', description: 'Clutch, gearbox, transmission repair' },
  { value: 'cooling', label: 'Cooling System', description: 'Radiator, coolant, hoses' },
  { value: 'exhaust', label: 'Exhaust System', description: 'Muffler, pipes, catalytic converter' },
  { value: 'fuel', label: 'Fuel System', description: 'Carburetor, fuel injection, tank' },
  { value: 'bodywork', label: 'Bodywork', description: 'Fairings, panels, paint, dent repair' },
  { value: 'inspection', label: 'Inspection', description: 'Safety inspection, pre-purchase inspection' },
  { value: 'custom', label: 'Custom Work', description: 'Modifications, custom builds, upgrades' },
  { value: 'diagnostic', label: 'Diagnostics', description: 'Computer diagnostics, troubleshooting' },
  { value: 'maintenance', label: 'General Maintenance', description: 'Routine service, tune-ups' },
];

/**
 * Find nearby shops that offer a specific service
 */
export async function findShopsByService(
  latitude: number,
  longitude: number,
  serviceCategory?: string,
  radiusKm: number = 50,
  limit: number = 20,
  userCountry?: string
): Promise<{ shops: ShopWithServiceMatch[]; error: string | null }> {
  try {
    // Use the PostgreSQL function for efficient search
    const { data, error } = await supabase.rpc('find_nearby_shops_by_service', {
      user_lat: latitude,
      user_lon: longitude,
      service_cat: serviceCategory || null,
      max_distance_km: radiusKm,
      result_limit: limit,
      user_country: userCountry || null,
    });

    if (error) {
      console.error('Error finding shops by service:', error);
      return { shops: [], error: error.message };
    }

    const shops: ShopWithServiceMatch[] = (data || []).map((shop: any) => ({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      city: shop.city,
      country: shop.country,
      phone: shop.phone,
      email: shop.email,
      website: shop.website,
      rating: shop.rating,
      latitude: shop.latitude,
      longitude: shop.longitude,
      distance: shop.distance_km,
      offersService: shop.offers_service,
    }));

    return { shops, error: null };
  } catch (error) {
    console.error('Error in findShopsByService:', error);
    return { shops: [], error: 'Failed to find shops' };
  }
}

/**
 * Get shops by service category (no location filter)
 */
export async function getShopsByServiceCategory(
  serviceCategory: string,
  limit: number = 50
): Promise<{ shops: ShopWithServiceMatch[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_services')
      .select(`
        shop_id,
        motorcycle_repairs (
          id,
          name,
          address,
          city,
          country,
          phone,
          email,
          website,
          rating,
          latitude,
          longitude,
          hours,
          reviews_count
        )
      `)
      .eq('service_category', serviceCategory)
      .eq('is_available', true)
      .limit(limit);

    if (error) {
      return { shops: [], error: error.message };
    }

    // Extract unique shops with offersService flag
    const shopsMap = new Map<string, ShopWithServiceMatch>();
    (data || []).forEach((item: any) => {
      const shop = item.motorcycle_repairs;
      if (shop && !shopsMap.has(shop.id)) {
        shopsMap.set(shop.id, {
          ...shop,
          offersService: true,
        });
      }
    });

    const shops = Array.from(shopsMap.values());
    return { shops, error: null };
  } catch (error) {
    console.error('Error fetching shops by category:', error);
    return { shops: [], error: 'Failed to fetch shops' };
  }
}

/**
 * Create a service request record
 */
export async function createServiceRequest(
  request: ServiceRequest
): Promise<{ requestId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('service_request_emails')
      .insert([
        {
          user_id: request.userId,
          bike_id: request.bikeId,
          shop_ids: request.shopIds,
          service_type: request.serviceType,
          service_category: request.serviceCategory,
          description: request.description,
          urgency: request.urgency,
          user_location: request.userLocation,
          preferred_date: request.preferredDate,
          status: 'sent',
        },
      ])
      .select()
      .single();

    if (error) {
      return { requestId: null, error: error.message };
    }

    return { requestId: data.id, error: null };
  } catch (error) {
    console.error('Error creating service request:', error);
    return { requestId: null, error: 'Failed to create service request' };
  }
}

/**
 * Get user's service requests
 */
export async function getUserServiceRequests(userId: string): Promise<{
  requests: any[];
  error: string | null;
}> {
  try {
    const { data, error } = await supabase
      .from('service_request_emails')
      .select(`
        *,
        bikes (
          make,
          model,
          year
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { requests: [], error: error.message };
    }

    return { requests: data || [], error: null };
  } catch (error) {
    console.error('Error fetching service requests:', error);
    return { requests: [], error: 'Failed to fetch service requests' };
  }
}

/**
 * Generate email content for service request
 */
export function generateServiceRequestEmail(
  request: ServiceRequest,
  shop: MotorcycleShop
): { subject: string; body: string } {
  const urgencyText = {
    immediate: 'URGENT - Immediate service needed',
    within_week: 'Needed within this week',
    routine: 'Routine service request',
  };

  const subject = `Motorcycle Service Request - ${request.serviceType}${
    request.urgency === 'immediate' ? ' (URGENT)' : ''
  }`;

  const body = `Dear ${shop.name} Team,

I am reaching out to request service for my motorcycle. Below are the details:

CUSTOMER INFORMATION:
Name: ${request.userName}
Email: ${request.userEmail}
Phone: ${request.userPhone || 'Not provided'}
${request.userLocation ? `Location: ${request.userLocation}` : ''}

MOTORCYCLE DETAILS:
Make: ${request.bikeMake}
Model: ${request.bikeModel}
Year: ${request.bikeYear}

SERVICE REQUEST:
Type: ${request.serviceType}
${request.serviceCategory ? `Category: ${SERVICE_CATEGORIES.find(c => c.value === request.serviceCategory)?.label || request.serviceCategory}` : ''}
Urgency: ${urgencyText[request.urgency]}
${request.preferredDate ? `Preferred Date: ${new Date(request.preferredDate).toLocaleDateString()}` : ''}

DESCRIPTION:
${request.description}

Please let me know:
1. Your availability for this service
2. Estimated cost and timeframe
3. Any additional information you need from me

I look forward to hearing from you soon.

Best regards,
${request.userName}

---
This email was sent through the Motorcycle Service Directory platform.
${shop.distance ? `Shop distance from customer: ${shop.distance.toFixed(1)} km` : ''}
`;

  return { subject, body };
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined) return 'Distance unknown';

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Get service category by value
 */
export function getServiceCategory(value: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((cat) => cat.value === value);
}

/**
 * Validate shop has email for contact
 */
export function validateShopEmail(shop: MotorcycleShop): boolean {
  return !!(shop.email && shop.email.includes('@'));
}

/**
 * Filter shops with valid email addresses
 */
export function filterShopsWithEmail(
  shops: ShopWithServiceMatch[]
): ShopWithServiceMatch[] {
  return shops.filter((shop) => validateShopEmail(shop));
}
