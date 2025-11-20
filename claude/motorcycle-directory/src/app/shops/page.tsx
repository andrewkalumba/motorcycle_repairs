// Shop search page with filtering and geolocation

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { searchShops, getUserLocation, formatDistance, ShopWithDistance, getShopCities } from '@/lib/shops';
import ShopCard from '@/components/ShopCard';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Badge } from '@/components/ui/Badge';

export default function ShopsPage() {
  const router = useRouter();
  const [shops, setShops] = useState<ShopWithDistance[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    city: '',
    minRating: '',
    maxDistance: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    performSearch();
  }, [filters, userLocation]);

  const loadInitialData = async () => {
    setLoading(true);

    // Get user location
    const location = await getUserLocation();
    setUserLocation(location);

    // Get cities
    const { cities: shopCities } = await getShopCities();
    setCities(shopCities);

    // Perform initial search
    await performSearch(location);
    setLoading(false);
  };

  const performSearch = async (location?: { latitude: number; longitude: number } | null) => {
    const loc = location !== undefined ? location : userLocation;

    const { shops: results } = await searchShops({
      search: filters.search || undefined,
      city: filters.city || undefined,
      minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
      maxDistance: filters.maxDistance ? parseFloat(filters.maxDistance) : undefined,
      userLatitude: loc?.latitude,
      userLongitude: loc?.longitude,
      limit: 50,
    });

    setShops(results);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      city: '',
      minRating: '',
      maxDistance: '',
    });
  };

  if (loading) {
    return <Loading fullPage text="Finding repair shops near you..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">Find Repair Shops</h1>
          <p className="text-blue-100 text-lg">
            {userLocation
              ? `Showing shops sorted by distance from your location`
              : 'Browse motorcycle repair shops across Europe'}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Search by name or location..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />

            <Select
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              options={[
                { value: '', label: 'All Cities' },
                ...cities.map(city => ({ value: city, label: city })),
              ]}
            />

            <Select
              value={filters.minRating}
              onChange={(e) => handleFilterChange('minRating', e.target.value)}
              options={[
                { value: '', label: 'Any Rating' },
                { value: '4.5', label: '4.5+ Stars' },
                { value: '4.0', label: '4.0+ Stars' },
                { value: '3.5', label: '3.5+ Stars' },
                { value: '3.0', label: '3.0+ Stars' },
              ]}
            />

            {userLocation && (
              <Select
                value={filters.maxDistance}
                onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
                options={[
                  { value: '', label: 'Any Distance' },
                  { value: '10', label: 'Within 10 km' },
                  { value: '25', label: 'Within 25 km' },
                  { value: '50', label: 'Within 50 km' },
                  { value: '100', label: 'Within 100 km' },
                ]}
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Found {shops.length} shops
              </span>
              {userLocation && (
                <Badge variant="success" size="sm">
                  Using your location
                </Badge>
              )}
            </div>
            {(filters.search || filters.city || filters.minRating || filters.maxDistance) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Shop Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {shops.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No shops found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={clearFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="relative cursor-pointer"
                onClick={() => router.push(`/shops/${shop.id}`)}
              >
                {shop.distance !== undefined && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="info">
                      {formatDistance(shop.distance)}
                    </Badge>
                  </div>
                )}
                <ShopCard shop={shop} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
