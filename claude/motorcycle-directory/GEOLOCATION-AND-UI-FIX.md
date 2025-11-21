# Geolocation Country Filtering & UI Animations - Complete Guide

## 🎯 Overview

This guide fixes the critical geolocation issue where users in Sweden were seeing shops in France, and adds smooth animations with Framer Motion.

---

## 🐛 Problem Identified

**Issue**: User in Sweden seeing shops in France

**Root Cause**:
The PostgreSQL function `find_nearby_shops_by_service` was missing the `user_country` parameter. The TypeScript code was trying to pass it, but the database function wasn't accepting or filtering by it.

**Files Affected**:
- `database-migrations/001_add_shop_email_and_indexes.sql` (original, incomplete)
- `src/lib/shopFinder.ts` (trying to pass country parameter)
- `src/lib/geolocation.ts` (working correctly)
- `src/app/find-service/page.tsx` (working correctly)

---

## ✅ Solution Implemented

### 1. **Fixed Database Function**

**File**: `database-migrations/002_fix_country_filtering.sql`

**Changes**:
- Added `user_country TEXT DEFAULT NULL` parameter
- Added country filtering in WHERE clause: `AND (user_country IS NULL OR LOWER(ms.country) = LOWER(user_country))`
- Function now properly filters shops by country before calculating distances

**Migration Script**:
```sql
CREATE OR REPLACE FUNCTION find_nearby_shops_by_service(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  service_cat TEXT DEFAULT NULL,
  max_distance_km DOUBLE PRECISION DEFAULT 50,
  result_limit INTEGER DEFAULT 20,
  user_country TEXT DEFAULT NULL  -- NEW!
)
```

### 2. **Installed Framer Motion**

**Package**: `framer-motion@latest`

**Command**: `npm install framer-motion`

**Purpose**: Add smooth animations to improve user experience

---

## 🚀 How to Apply the Fix

### Step 1: Run Database Migration (CRITICAL)

1. **Open Supabase SQL Editor**:
   ```
   https://app.supabase.com/project/mcfyffbyiohcsimzwhoh/sql/new
   ```

2. **Copy Migration Script**:
   - Open: `database-migrations/002_fix_country_filtering.sql`
   - Copy all contents

3. **Execute in Supabase**:
   - Paste into SQL Editor
   - Click "Run"
   - Expected: "Success. No rows returned"

4. **Verify it worked**:
   Run this test query:
   ```sql
   SELECT * FROM find_nearby_shops_by_service(
     59.3293,  -- Stockholm, Sweden latitude
     18.0686,  -- Stockholm, Sweden longitude
     'brake',  -- service category
     50,       -- radius in km
     20,       -- limit
     'Sweden'  -- COUNTRY FILTER (new!)
   );
   ```

   Should return ONLY Swedish shops now!

---

## 🧪 Testing the Geolocation Fix

### Test 1: GPS Location Detection

1. **Open your app**: `http://localhost:3000/find-service`
2. **Click "Get My Location"** button
3. **Allow browser location permission**
4. **Check console** for:
   ```
   User location detected: { latitude: XX.XX, longitude: XX.XX, country: "Sweden" }
   ```

### Test 2: Shop Search with Country Filter

1. After getting location, **select a service type** (e.g., "Brake Service")
2. **Click "Find Nearby Shops"**
3. **Verify**:
   - All shops shown are in YOUR COUNTRY
   - Distance is calculated from your location
   - Shops are sorted by distance

### Test 3: Manual Country Selection

If GPS is not available:
1. **Select country manually** from dropdown (Sweden, Norway, etc.)
2. **Enter city** or use default coordinates
3. **Search for shops**
4. **Verify** only shops from selected country appear

---

## 🎨 Adding Framer Motion Animations (Optional Enhancements)

Framer Motion is now installed. Here are some quick wins:

### Animation 1: Fade-in Shop Cards

**File to edit**: `src/app/find-service/page.tsx`

```typescript
import { motion } from 'framer-motion';

// Replace shop card div with:
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.1 }}
  key={shop.id}
>
  <ShopCard shop={shop} />
</motion.div>
```

### Animation 2: Slide-in Modal

**File to edit**: `src/components/ui/Modal.tsx`

```typescript
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="modal-content"
    >
      {/* Modal content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Animation 3: Button Hover Effects

**File to edit**: `src/components/ui/Button.tsx`

```typescript
import { motion } from 'framer-motion';

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  {children}
</motion.button>
```

---

## 📊 Expected Results After Fix

### Before Fix:
- ❌ User in Sweden sees French shops
- ❌ Distance calculated but country ignored
- ❌ No way to filter by country
- ❌ Confusing user experience

### After Fix:
- ✅ User in Sweden ONLY sees Swedish shops
- ✅ Country detected via GPS + reverse geocoding
- ✅ Distance calculated from user's actual location
- ✅ Manual country selection available
- ✅ Sorted by distance within country
- ✅ Smooth animations (if implemented)

---

## 🔍 How the Fix Works

### The Complete Flow:

1. **User clicks "Get My Location"**
   ```typescript
   // src/app/find-service/page.tsx
   const location = await getUserLocationWithCountry();
   // Returns: { latitude, longitude, country: "Sweden", countryCode: "SE" }
   ```

2. **GPS coordinates obtained**
   ```typescript
   // src/lib/geolocation.ts
   navigator.geolocation.getCurrentPosition(...)
   // Returns: position.coords.latitude, position.coords.longitude
   ```

3. **Reverse geocoding determines country**
   ```typescript
   // src/lib/geolocation.ts
   const geocode = await reverseGeocode(lat, lon);
   // Calls: Nominatim API (OpenStreetMap)
   // Returns: { country: "Sweden", countryCode: "SE", city: "Stockholm" }
   ```

4. **User searches for service**
   ```typescript
   // src/lib/shopFinder.ts
   const { shops } = await findShopsByService(
     latitude,
     longitude,
     serviceCategory,
     radius,
     limit,
     userCountry  // ← PASSED TO DATABASE
   );
   ```

5. **Database filters by country FIRST**
   ```sql
   -- database-migrations/002_fix_country_filtering.sql
   WHERE ms.latitude IS NOT NULL
     AND ms.longitude IS NOT NULL
     AND (user_country IS NULL OR LOWER(ms.country) = LOWER(user_country))
   ```

6. **Then calculates distance**
   ```sql
   -- Haversine formula
   6371 * acos(
     cos(radians(user_lat)) * cos(radians(ms.latitude)) *
     cos(radians(ms.longitude) - radians(user_lon)) +
     sin(radians(user_lat)) * sin(radians(ms.latitude))
   ) AS distance_km
   ```

7. **Results sorted by distance**
   ```sql
   ORDER BY
     ssc.offers_service DESC,  -- Service match first
     ssc.distance_km ASC,       -- Then closest
     ssc.rating DESC NULLS LAST -- Then highest rated
   ```

---

## 🛠️ Troubleshooting

### Issue: Still seeing wrong country shops

**Solutions**:
1. Verify migration was run: Check Supabase SQL Editor history
2. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Check shop data has correct country:
   ```sql
   SELECT id, name, country FROM motorcycle_repairs LIMIT 10;
   ```
4. Verify country detection working:
   - Check browser console for "User location detected: ..."
   - Should show correct country

### Issue: GPS not working

**Solutions**:
1. Check browser permissions: Settings → Privacy → Location
2. Try HTTPS (location API requires secure context)
3. Use manual country selection as fallback
4. Check browser console for geolocation errors

### Issue: No shops found

**Possible causes**:
1. **No shops in your country**: Check database
   ```sql
   SELECT COUNT(*) FROM motorcycle_repairs WHERE country = 'Sweden';
   ```
2. **Radius too small**: Increase from 50km to 100km or 200km
3. **Service not offered**: Try "General Maintenance" which most shops offer
4. **GPS coordinates incorrect**: Verify lat/long are reasonable

---

## 📦 Files Modified/Created

### Created:
- `/database-migrations/002_fix_country_filtering.sql` ⭐ (RUN THIS!)
- `/GEOLOCATION-AND-UI-FIX.md` (this file)

### Already Exist (working correctly):
- `/src/lib/geolocation.ts` ✅
- `/src/lib/shopFinder.ts` ✅
- `/src/app/find-service/page.tsx` ✅
- `/src/components/appointments/AppointmentBookingModal.tsx` ✅

### To be Enhanced (optional):
- Any UI components for animations

---

## 🎯 Quick Start Checklist

- [ ] Run `database-migrations/002_fix_country_filtering.sql` in Supabase
- [ ] Verify migration with test query
- [ ] Clear browser cache / hard refresh
- [ ] Navigate to `/find-service`
- [ ] Click "Get My Location"
- [ ] Allow location permission
- [ ] Select service type
- [ ] Click "Find Nearby Shops"
- [ ] Verify only shops from YOUR country appear
- [ ] Verify shops sorted by distance
- [ ] Test appointment booking
- [ ] (Optional) Add Framer Motion animations

---

## 🎊 Success Criteria

✅ GPS detects user's country correctly
✅ Only shops from user's country displayed
✅ Distance calculated accurately
✅ Shops sorted by proximity
✅ Manual country selection works
✅ Appointment booking functional
✅ (Optional) Smooth animations enhance UX

---

## 📞 Need Help?

If you encounter issues:

1. **Check browser console**: Look for errors or warnings
2. **Check Supabase logs**: View in Supabase Dashboard
3. **Verify database state**: Run diagnostic SQL queries
4. **Test with different countries**: Try Norway, Denmark, Germany
5. **Check shop data quality**: Ensure lat/long and country fields populated

---

**Migration Priority**: 🔴 **CRITICAL** - Run the database migration NOW to fix country filtering

**Framer Motion Priority**: 🟡 **OPTIONAL** - Nice to have, can be added incrementally

---

## 📅 Changelog

**2025-11-20**:
- Fixed PostgreSQL function to accept country parameter
- Added proper country filtering in database query
- Installed Framer Motion for animations
- Created comprehensive implementation guide
- Verified appointment booking modal exists and works

**Next Steps**:
- Run database migration
- Test geolocation with country filtering
- Optionally add animations to improve UX
- Consider adding map view for shop locations
