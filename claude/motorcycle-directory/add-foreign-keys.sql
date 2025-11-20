-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================
-- Run this script AFTER creating all tables from database-schema.sql
-- This adds foreign key relationships between tables

-- =============================================
-- USER SESSIONS - Foreign Keys
-- =============================================
ALTER TABLE user_sessions
  ADD CONSTRAINT fk_user_sessions_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- =============================================
-- BIKES - Foreign Keys
-- =============================================
ALTER TABLE bikes
  ADD CONSTRAINT fk_bikes_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- =============================================
-- SERVICE HISTORY - Foreign Keys
-- =============================================
ALTER TABLE service_history
  ADD CONSTRAINT fk_service_history_bike_id
  FOREIGN KEY (bike_id)
  REFERENCES bikes(id)
  ON DELETE CASCADE;

ALTER TABLE service_history
  ADD CONSTRAINT fk_service_history_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE service_history
  ADD CONSTRAINT fk_service_history_shop_id
  FOREIGN KEY (shop_id)
  REFERENCES motorcycle_repairs(id)
  ON DELETE SET NULL;

-- =============================================
-- APPOINTMENTS - Foreign Keys
-- =============================================
ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_bike_id
  FOREIGN KEY (bike_id)
  REFERENCES bikes(id)
  ON DELETE CASCADE;

ALTER TABLE appointments
  ADD CONSTRAINT fk_appointments_shop_id
  FOREIGN KEY (shop_id)
  REFERENCES motorcycle_repairs(id)
  ON DELETE CASCADE;

-- =============================================
-- MAINTENANCE REMINDERS - Foreign Keys
-- =============================================
ALTER TABLE maintenance_reminders
  ADD CONSTRAINT fk_maintenance_reminders_bike_id
  FOREIGN KEY (bike_id)
  REFERENCES bikes(id)
  ON DELETE CASCADE;

ALTER TABLE maintenance_reminders
  ADD CONSTRAINT fk_maintenance_reminders_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- =============================================
-- SHOP REVIEWS - Foreign Keys
-- =============================================
ALTER TABLE shop_reviews
  ADD CONSTRAINT fk_shop_reviews_shop_id
  FOREIGN KEY (shop_id)
  REFERENCES motorcycle_repairs(id)
  ON DELETE CASCADE;

ALTER TABLE shop_reviews
  ADD CONSTRAINT fk_shop_reviews_user_id
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE shop_reviews
  ADD CONSTRAINT fk_shop_reviews_appointment_id
  FOREIGN KEY (appointment_id)
  REFERENCES appointments(id)
  ON DELETE SET NULL;

-- =============================================
-- SHOP SPECIALIZATIONS - Foreign Keys
-- =============================================
ALTER TABLE shop_specializations
  ADD CONSTRAINT fk_shop_specializations_shop_id
  FOREIGN KEY (shop_id)
  REFERENCES motorcycle_repairs(id)
  ON DELETE CASCADE;

-- =============================================
-- SHOP SERVICES - Foreign Keys
-- =============================================
ALTER TABLE shop_services
  ADD CONSTRAINT fk_shop_services_shop_id
  FOREIGN KEY (shop_id)
  REFERENCES motorcycle_repairs(id)
  ON DELETE CASCADE;

-- =============================================
-- VERIFICATION QUERY
-- =============================================
-- Run this to verify all foreign keys were created successfully:
-- SELECT
--   tc.table_name,
--   tc.constraint_name,
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
-- ORDER BY tc.table_name;
