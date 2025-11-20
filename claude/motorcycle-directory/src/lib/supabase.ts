import { createClient } from '@supabase/supabase-js';
import { MotorcycleShop } from '@/types/shop';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchMotorcycleShops(): Promise<MotorcycleShop[]> {
  const { data, error } = await supabase
    .from('motorcycle_repairs')
    .select('*')
    .order('rating', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Error fetching shops:', error);
    throw error;
  }

  return data || [];
}
