import { createClient } from '@supabase/supabase-js';
import { MotorcycleShop } from '@/types/shop';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export async function fetchMotorcycleShops(limit?: number): Promise<MotorcycleShop[]> {
  let query = supabase
    .from('motorcycle_repairs')
    .select('*')
    .order('rating', { ascending: false, nullsFirst: false });

  // Add limit if provided for performance
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching shops:', error);
    throw error;
  }

  return (data || []).map(normalizeShopData);
}

// Fetch shops with pagination for performance
export async function fetchMotorcycleShopsPaginated(
  page: number = 1,
  pageSize: number = 50
): Promise<{ shops: MotorcycleShop[]; totalCount: number }> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get total count
  const { count } = await supabase
    .from('motorcycle_repairs')
    .select('*', { count: 'exact', head: true });

  // Get paginated data
  const { data, error } = await supabase
    .from('motorcycle_repairs')
    .select('*')
    .order('rating', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching shops:', error);
    throw error;
  }

  return {
    shops: (data || []).map(normalizeShopData),
    totalCount: count || 0,
  };
}
