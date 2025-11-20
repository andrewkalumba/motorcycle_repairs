export interface MotorcycleShop {
  id: string; // UUID in database (changed from BIGINT)
  name: string; // TEXT in database
  address: string; // TEXT in database
  city: string; // TEXT in database
  country?: string; // TEXT in database (optional)
  latitude: number | null; // FLOAT8 in database
  longitude: number | null; // FLOAT8 in database
  phone: string | null; // TEXT in database
  email?: string | null; // TEXT in database (optional)
  website: string | null; // TEXT in database
  rating: number | null; // FLOAT8 in database
  reviews_count: number | null; // BIGINT in database
  hours: string | null; // TEXT in database
  distance?: number; // Calculated field for distance from user (optional)
}

export interface ShopFilters {
  search: string;
  country: string;
  city: string;
  minRating: string;
}
