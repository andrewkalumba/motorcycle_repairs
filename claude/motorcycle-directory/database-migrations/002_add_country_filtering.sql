-- Migration: Add country filtering to shop search
-- Date: 2025-11-20
-- Description: Updates find_nearby_shops_by_service function to filter by country first

-- =============================================
-- FUNCTION: Find nearby shops by service with country filtering
-- =============================================
CREATE OR REPLACE FUNCTION find_nearby_shops_by_service(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  service_cat TEXT DEFAULT NULL,
  max_distance_km DOUBLE PRECISION DEFAULT 50,
  result_limit INTEGER DEFAULT 20,
  user_country TEXT DEFAULT NULL
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
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(user_lat)) *
            cos(radians(ms.latitude)) *
            cos(radians(ms.longitude) - radians(user_lon)) +
            sin(radians(user_lat)) *
            sin(radians(ms.latitude))
          ))
        )
      ) AS distance_km
    FROM motorcycle_repairs ms
    WHERE ms.latitude IS NOT NULL
      AND ms.longitude IS NOT NULL
      -- Filter by country if provided (case-insensitive)
      AND (
        user_country IS NULL
        OR LOWER(ms.country) = LOWER(user_country)
        OR LOWER(ms.country) LIKE LOWER(user_country || '%')
      )
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

COMMENT ON FUNCTION find_nearby_shops_by_service IS
  'Finds nearby shops offering specific services, filtered by country and sorted by distance and service availability';

-- =============================================
-- FUNCTION: Get available countries from shops
-- =============================================
CREATE OR REPLACE FUNCTION get_shop_countries()
RETURNS TABLE (
  country TEXT,
  shop_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.country,
    COUNT(*)::BIGINT as shop_count
  FROM motorcycle_repairs ms
  WHERE ms.country IS NOT NULL
  GROUP BY ms.country
  ORDER BY shop_count DESC, ms.country ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_shop_countries IS
  'Returns list of countries with motorcycle repair shops and their counts';
