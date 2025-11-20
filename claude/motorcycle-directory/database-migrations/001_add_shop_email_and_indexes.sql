-- Migration: Add shop email and performance indexes
-- Date: 2025-11-19
-- Description: Adds email field to shops and creates performance indexes

-- =============================================
-- ADD EMAIL TO MOTORCYCLE_REPAIRS TABLE
-- =============================================
-- Check if email column exists, add if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'motorcycle_repairs' AND column_name = 'email'
  ) THEN
    ALTER TABLE motorcycle_repairs ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_motorcycle_repairs_email ON motorcycle_repairs(email);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Appointments indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_user_date
  ON appointments(user_id, appointment_date DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_user_status_date
  ON appointments(user_id, status, appointment_date DESC);

-- Service history indexes
CREATE INDEX IF NOT EXISTS idx_service_history_bike_date
  ON service_history(bike_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_service_history_user_date
  ON service_history(user_id, service_date DESC);

-- Bikes indexes for active bikes
CREATE INDEX IF NOT EXISTS idx_bikes_user_active
  ON bikes(user_id, is_active) WHERE is_active = true;

-- Shop specializations for service filtering
CREATE INDEX IF NOT EXISTS idx_specializations_type
  ON shop_specializations(specialization);

CREATE INDEX IF NOT EXISTS idx_services_category_available
  ON shop_services(service_category, is_available) WHERE is_available = true;

-- Composite index for shop search
CREATE INDEX IF NOT EXISTS idx_motorcycle_repairs_city_rating
  ON motorcycle_repairs(city, rating DESC NULLS LAST);

-- Index for geolocation queries
CREATE INDEX IF NOT EXISTS idx_motorcycle_repairs_location
  ON motorcycle_repairs(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =============================================
-- ADD SERVICE REQUEST EMAILS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS service_request_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  bike_id UUID NOT NULL REFERENCES bikes(id),
  shop_ids UUID[] NOT NULL, -- Array of shop IDs contacted
  service_type TEXT NOT NULL,
  service_category TEXT,
  description TEXT NOT NULL,
  urgency TEXT DEFAULT 'routine', -- 'immediate', 'within_week', 'routine'
  user_location TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent', -- 'sent', 'responded', 'scheduled', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for service request tracking
CREATE INDEX IF NOT EXISTS idx_service_requests_user
  ON service_request_emails(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_requests_status
  ON service_request_emails(status, created_at DESC);

-- Enable RLS
ALTER TABLE service_request_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own service requests"
  ON service_request_emails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own service requests"
  ON service_request_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service requests"
  ON service_request_emails FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_service_request_emails_updated_at
  BEFORE UPDATE ON service_request_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTION: Find nearby shops by service
-- =============================================
CREATE OR REPLACE FUNCTION find_nearby_shops_by_service(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  service_cat TEXT DEFAULT NULL,
  max_distance_km DOUBLE PRECISION DEFAULT 50,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  rating DOUBLE PRECISION,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  offers_service BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH shop_distances AS (
    SELECT
      ms.id,
      ms.name,
      ms.address,
      ms.city,
      ms.country,
      ms.phone,
      ms.email,
      ms.website,
      ms.rating,
      ms.latitude,
      ms.longitude,
      -- Haversine formula for distance calculation
      (
        6371 * acos(
          cos(radians(user_lat)) *
          cos(radians(ms.latitude)) *
          cos(radians(ms.longitude) - radians(user_lon)) +
          sin(radians(user_lat)) *
          sin(radians(ms.latitude))
        )
      ) AS distance_km
    FROM motorcycle_repairs ms
    WHERE ms.latitude IS NOT NULL
      AND ms.longitude IS NOT NULL
  ),
  shop_services_check AS (
    SELECT
      sd.*,
      CASE
        WHEN service_cat IS NULL THEN true
        ELSE EXISTS (
          SELECT 1
          FROM shop_services ss
          WHERE ss.shop_id = sd.id
            AND ss.service_category = service_cat
            AND ss.is_available = true
        )
      END AS offers_service
    FROM shop_distances sd
    WHERE sd.distance_km <= max_distance_km
  )
  SELECT
    ssc.id,
    ssc.name,
    ssc.address,
    ssc.city,
    ssc.country,
    ssc.phone,
    ssc.email,
    ssc.website,
    ssc.rating,
    ssc.latitude,
    ssc.longitude,
    ssc.distance_km,
    ssc.offers_service
  FROM shop_services_check ssc
  WHERE ssc.offers_service = true OR service_cat IS NULL
  ORDER BY
    ssc.offers_service DESC,
    ssc.distance_km ASC,
    ssc.rating DESC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS
-- =============================================
COMMENT ON TABLE service_request_emails IS 'Tracks service requests sent via email to shops';
COMMENT ON FUNCTION find_nearby_shops_by_service IS 'Finds nearby shops offering specific services, sorted by distance and service availability';

-- =============================================
-- GRANT PERMISSIONS (if using specific roles)
-- =============================================
-- GRANT SELECT ON motorcycle_repairs TO authenticated;
-- GRANT ALL ON service_request_emails TO authenticated;
