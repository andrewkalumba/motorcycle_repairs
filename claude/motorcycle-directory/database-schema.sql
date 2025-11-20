-- Database Schema for Bike Service and Repair Management System
-- This schema extends the existing motorcycle_repairs table with user management,
-- bike profiles, service history, and appointment booking features

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =============================================
-- USER SESSIONS TABLE (for JWT token management)
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token);

-- =============================================
-- BIKES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year BIGINT NOT NULL,
  vin TEXT, -- Vehicle Identification Number
  color TEXT,
  engine_size BIGINT, -- in cc
  license_plate TEXT,
  purchase_date DATE,
  current_mileage BIGINT,
  photo_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bikes_user_id ON bikes(user_id);
CREATE INDEX idx_bikes_vin ON bikes(vin);

-- =============================================
-- SERVICE HISTORY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS service_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID NOT NULL,
  user_id UUID NOT NULL,
  shop_id UUID,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL, -- 'repair', 'maintenance', 'inspection', 'customization'
  service_category TEXT, -- 'brake', 'tire', 'engine', 'electrical', 'chain', 'oil_change', etc.
  description TEXT NOT NULL,
  cost FLOAT8,
  mileage_at_service BIGINT,
  next_service_due_mileage BIGINT,
  next_service_due_date DATE,
  parts_replaced TEXT[], -- Array of parts
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_history_bike_id ON service_history(bike_id);
CREATE INDEX idx_service_history_user_id ON service_history(user_id);
CREATE INDEX idx_service_history_date ON service_history(service_date DESC);
CREATE INDEX idx_service_history_shop_id ON service_history(shop_id);

-- =============================================
-- APPOINTMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  bike_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  service_type TEXT NOT NULL,
  service_category TEXT,
  description TEXT,
  urgency TEXT DEFAULT 'routine', -- 'immediate', 'within_week', 'routine'
  estimated_cost FLOAT8,
  actual_cost FLOAT8,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_bike_id ON appointments(bike_id);
CREATE INDEX idx_appointments_shop_id ON appointments(shop_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- =============================================
-- MAINTENANCE REMINDERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bike_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- 'mileage', 'date', 'both'
  service_category TEXT NOT NULL,
  description TEXT NOT NULL,
  due_mileage BIGINT,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reminders_bike_id ON maintenance_reminders(bike_id);
CREATE INDEX idx_reminders_user_id ON maintenance_reminders(user_id);
CREATE INDEX idx_reminders_completed ON maintenance_reminders(is_completed);

-- =============================================
-- SHOP REVIEWS TABLE (extends existing shop data)
-- =============================================
CREATE TABLE IF NOT EXISTS shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  user_id UUID NOT NULL,
  appointment_id UUID,
  rating FLOAT8 NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  review_title TEXT,
  review_text TEXT,
  service_quality_rating BIGINT CHECK (service_quality_rating >= 1 AND service_quality_rating <= 5),
  price_rating BIGINT CHECK (price_rating >= 1 AND price_rating <= 5),
  communication_rating BIGINT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE, -- Verified if linked to an actual appointment
  UNIQUE(shop_id, user_id, appointment_id)
);

CREATE INDEX idx_reviews_shop_id ON shop_reviews(shop_id);
CREATE INDEX idx_reviews_user_id ON shop_reviews(user_id);
CREATE INDEX idx_reviews_rating ON shop_reviews(rating DESC);

-- =============================================
-- SHOP SPECIALIZATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS shop_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  specialization TEXT NOT NULL, -- 'brake_repair', 'engine_work', 'custom_builds', etc.
  is_certified BOOLEAN DEFAULT FALSE,
  certification_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_specializations_shop_id ON shop_specializations(shop_id);

-- =============================================
-- SHOP SERVICES TABLE (detailed services offered)
-- =============================================
CREATE TABLE IF NOT EXISTS shop_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL,
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  description TEXT,
  estimated_duration BIGINT, -- in minutes
  price_from FLOAT8,
  price_to FLOAT8,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_services_shop_id ON shop_services(shop_id);
CREATE INDEX idx_services_category ON shop_services(service_category);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON bikes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_history_updated_at BEFORE UPDATE ON service_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_reminders_updated_at BEFORE UPDATE ON maintenance_reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_reviews_updated_at BEFORE UPDATE ON shop_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Bikes policies
CREATE POLICY "Users can view own bikes" ON bikes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bikes" ON bikes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bikes" ON bikes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bikes" ON bikes FOR DELETE USING (auth.uid() = user_id);

-- Service history policies
CREATE POLICY "Users can view own service history" ON service_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service history" ON service_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service history" ON service_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own service history" ON service_history FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies (users can view all, but only modify their own)
CREATE POLICY "Anyone can view reviews" ON shop_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON shop_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON shop_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reviews" ON shop_reviews FOR DELETE USING (auth.uid() = user_id);

-- Shop data is public read
CREATE POLICY "Anyone can view shop specializations" ON shop_specializations FOR SELECT USING (true);
CREATE POLICY "Anyone can view shop services" ON shop_services FOR SELECT USING (true);

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- View for bikes with their latest service information
CREATE OR REPLACE VIEW bikes_with_latest_service AS
SELECT
  b.*,
  sh.service_date AS last_service_date,
  sh.service_type AS last_service_type,
  sh.mileage_at_service AS last_service_mileage,
  sh.next_service_due_date,
  sh.next_service_due_mileage
FROM bikes b
LEFT JOIN LATERAL (
  SELECT * FROM service_history
  WHERE bike_id = b.id
  ORDER BY service_date DESC
  LIMIT 1
) sh ON true;

-- View for upcoming appointments
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT
  a.*,
  b.make AS bike_make,
  b.model AS bike_model,
  ms.name AS shop_name,
  ms.address AS shop_address,
  ms.phone AS shop_phone
FROM appointments a
JOIN bikes b ON a.bike_id = b.id
JOIN motorcycle_repairs ms ON a.shop_id = ms.id
WHERE a.status IN ('pending', 'confirmed')
  AND a.appointment_date >= NOW()
ORDER BY a.appointment_date ASC;

-- View for shop ratings aggregate
CREATE OR REPLACE VIEW shop_ratings_aggregate AS
SELECT
  shop_id,
  COUNT(*) AS total_reviews,
  AVG(rating) AS average_rating,
  AVG(service_quality_rating) AS avg_service_quality,
  AVG(price_rating) AS avg_price_rating,
  AVG(communication_rating) AS avg_communication_rating,
  COUNT(*) FILTER (WHERE would_recommend = true) AS recommend_count
FROM shop_reviews
GROUP BY shop_id;

-- =============================================
-- SAMPLE DATA INSERTION HELPERS
-- =============================================

-- Function to calculate next service due date
CREATE OR REPLACE FUNCTION calculate_next_service_date(
  last_service_date DATE,
  service_interval_months INTEGER
) RETURNS DATE AS $$
BEGIN
  RETURN last_service_date + (service_interval_months || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Function to check if bike needs service
CREATE OR REPLACE FUNCTION bike_needs_service(
  bike_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
  latest_service_date DATE;
BEGIN
  SELECT service_date INTO latest_service_date
  FROM service_history
  WHERE bike_id = bike_uuid
  ORDER BY service_date DESC
  LIMIT 1;

  IF latest_service_date IS NULL THEN
    RETURN true; -- No service history
  END IF;

  -- Check if more than 6 months since last service
  RETURN (CURRENT_DATE - latest_service_date) > 180;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE users IS 'Stores user account information';
COMMENT ON TABLE bikes IS 'Stores bike/motorcycle profiles owned by users';
COMMENT ON TABLE service_history IS 'Complete service and repair history for bikes';
COMMENT ON TABLE appointments IS 'Scheduled appointments at repair shops';
COMMENT ON TABLE maintenance_reminders IS 'Automated reminders for upcoming maintenance';
COMMENT ON TABLE shop_reviews IS 'User reviews and ratings for repair shops';
COMMENT ON TABLE shop_specializations IS 'Specialized services offered by shops';
COMMENT ON TABLE shop_services IS 'Detailed service catalog for each shop';
