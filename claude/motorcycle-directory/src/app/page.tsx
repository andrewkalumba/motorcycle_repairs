'use client';

import { useState, useEffect, useMemo } from 'react';
import { MotorcycleShop, ShopFilters } from '@/types/shop';
import { fetchMotorcycleShops } from '@/lib/supabase';
import ShopCard from '@/components/ShopCard';
import BackToTop from '@/components/BackToTop';

// Fisher-Yates shuffle algorithm for true randomization
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Home() {
  const [shops, setShops] = useState<MotorcycleShop[]>([]);
  const [filters, setFilters] = useState<ShopFilters>({
    search: '',
    country: '',
    city: '',
    minRating: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShops() {
      try {
        // Load only 100 shops initially for better performance
        // Users can load more if needed
        const data = await fetchMotorcycleShops(100);
        // Shuffle the shops array for random order on each page load
        const shuffledData = shuffleArray(data);
        setShops(shuffledData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data. Please check your Supabase configuration.');
        setLoading(false);
      }
    }

    loadShops();
  }, []);

  // Get unique countries from shops
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    shops.forEach((shop) => {
      const parts = shop.city.split(', ');
      if (parts.length > 0) {
        countrySet.add(parts[parts.length - 1]);
      }
    });
    return Array.from(countrySet).sort();
  }, [shops]);

  // Get cities filtered by selected country
  const cities = useMemo(() => {
    let filteredShops = shops;
    if (filters.country) {
      filteredShops = shops.filter((shop) => shop.city.endsWith(filters.country));
    }
    const citySet = new Set(filteredShops.map((shop) => shop.city));
    return Array.from(citySet).sort();
  }, [shops, filters.country]);

  // Filter shops based on all criteria
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      // Search filter
      const matchesSearch =
        !filters.search ||
        shop.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        shop.address.toLowerCase().includes(filters.search.toLowerCase());

      // Country filter
      const matchesCountry = !filters.country || shop.city.endsWith(filters.country);

      // City filter
      const matchesCity = !filters.city || shop.city === filters.city;

      // Rating filter
      const minRating = parseFloat(filters.minRating) || 0;
      const matchesRating = !shop.rating || shop.rating >= minRating;

      return matchesSearch && matchesCountry && matchesCity && matchesRating;
    });
  }, [shops, filters]);

  // Group filtered shops by country
  const shopsByCountry = useMemo(() => {
    const grouped = new Map<string, MotorcycleShop[]>();

    filteredShops.forEach((shop) => {
      const parts = shop.city.split(', ');
      const country = parts[parts.length - 1];

      if (!grouped.has(country)) {
        grouped.set(country, []);
      }
      grouped.get(country)!.push(shop);
    });

    // Sort countries alphabetically
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredShops]);

  // Get country flag emoji (basic mapping)
  const getCountryFlag = (country: string): string => {
    const flagMap: { [key: string]: string } = {
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Netherlands': '🇳🇱',
      'Belgium': '🇧🇪',
      'Austria': '🇦🇹',
      'Switzerland': '🇨🇭',
      'Poland': '🇵🇱',
      'Czech Republic': '🇨🇿',
      'Portugal': '🇵🇹',
      'Sweden': '🇸🇪',
      'Denmark': '🇩🇰',
      'Norway': '🇳🇴',
      'Finland': '🇫🇮',
      'Greece': '🇬🇷',
      'Ireland': '🇮🇪',
      'Croatia': '🇭🇷',
      'Hungary': '🇭🇺',
      'Romania': '🇷🇴',
      'Slovakia': '🇸🇰',
      'Slovenia': '🇸🇮',
      'Bulgaria': '🇧🇬',
      'Luxembourg': '🇱🇺',
      'Malta': '🇲🇹',
      'Cyprus': '🇨🇾',
      'Estonia': '🇪🇪',
      'Latvia': '🇱🇻',
      'Lithuania': '🇱🇹',
    };
    return flagMap[country] || '🏴';
  };

  // Update city filter when country changes
  useEffect(() => {
    if (filters.country && filters.city) {
      // Check if the selected city still belongs to the selected country
      const cityBelongsToCountry = filters.city.endsWith(filters.country);
      if (!cityBelongsToCountry) {
        setFilters((prev) => ({ ...prev, city: '' }));
      }
    }
  }, [filters.country, filters.city]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-0 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        <div className="max-w-full mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-5 bg-black/30 backdrop-blur-lg border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-5xl">🏍️</div>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-2xl md:text-3xl text-white drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)] font-bold tracking-tight">
                EU Motorcycle Repair Directory
              </h1>
            </div>
            <div className="w-16"></div>
          </header>

          {/* Loading Message */}
          <div className="flex items-center justify-center h-[calc(100vh-100px)]">
            <div className="text-center p-20 text-white text-xl bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 font-semibold shadow-2xl">
              <div className="animate-pulse">Loading motorcycle repair shops...</div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 p-0 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      <div className="max-w-full mx-auto animate-fade-in">
        {/* Header with Logo and Title */}
        <header className="flex items-center justify-between px-8 py-5 bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
          {/* Logo - Extreme Left */}
          <div className="flex items-center gap-3">
            <div className="text-5xl">🏍️</div>
          </div>

          {/* Title - Center */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
            <h1 className="text-2xl md:text-3xl text-white drop-shadow-[2px_2px_8px_rgba(0,0,0,0.3)] font-bold tracking-tight">
              EU Motorcycle Repair Directory
            </h1>
          </div>

          {/* Spacer for balance */}
          <div className="w-16"></div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6 bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f] text-white p-6 rounded-2xl text-center font-semibold shadow-[0_10px_30px_rgba(255,107,107,0.3)]">
            {error}
          </div>
        )}

        {/* Main Content Area with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-[1600px] mx-auto">
          {/* Sidebar - Left */}
          <aside className="w-full lg:w-80 flex-shrink-0 h-fit lg:sticky lg:top-24">
            <div className="bg-[#3d3b3c] backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-2xl border border-[#3d3b3c]">
              <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/20">
                🔍 Filter Shops
              </h2>

              <div className="space-y-4">
                {/* Search */}
                <div className="flex flex-col">
                  <label htmlFor="search" className="font-semibold mb-2 text-white text-sm">
                    Search
                  </label>
                  <input
                    type="text"
                    id="search"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Name or address..."
                    className="px-4 py-2.5 border-2 border-[#3d3b3c] rounded-lg text-sm transition-all duration-300 bg-white hover:border-[#2a2829] focus:outline-none focus:border-[#2a2829] focus:ring-2 focus:ring-[#3d3b3c]"
                  />
                </div>

                {/* Country */}
                <div className="flex flex-col">
                  <label htmlFor="country" className="font-semibold mb-2 text-white text-sm">
                    Country
                  </label>
                  <select
                    id="country"
                    value={filters.country}
                    onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    className="px-4 py-2.5 border-2 border-[#3d3b3c] rounded-lg text-sm transition-all duration-300 bg-white hover:border-[#2a2829] focus:outline-none focus:border-[#2a2829] focus:ring-2 focus:ring-[#3d3b3c]"
                  >
                    <option value="">All Countries</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div className="flex flex-col">
                  <label htmlFor="city" className="font-semibold mb-2 text-white text-sm">
                    City
                  </label>
                  <select
                    id="city"
                    value={filters.city}
                    onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                    className="px-4 py-2.5 border-2 border-[#3d3b3c] rounded-lg text-sm transition-all duration-300 bg-white hover:border-[#2a2829] focus:outline-none focus:border-[#2a2829] focus:ring-2 focus:ring-[#3d3b3c]"
                  >
                    <option value="">All Cities</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Minimum Rating */}
                <div className="flex flex-col">
                  <label htmlFor="minRating" className="font-semibold mb-2 text-white text-sm">
                    Minimum Rating
                  </label>
                  <select
                    id="minRating"
                    value={filters.minRating}
                    onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                    className="px-4 py-2.5 border-2 border-[#3d3b3c] rounded-lg text-sm transition-all duration-300 bg-white hover:border-[#2a2829] focus:outline-none focus:border-[#2a2829] focus:ring-2 focus:ring-[#3d3b3c]"
                  >
                    <option value="">Any Rating</option>
                    <option value="4.5">4.5+ Stars</option>
                    <option value="4.0">4.0+ Stars</option>
                    <option value="3.5">3.5+ Stars</option>
                    <option value="3.0">3.0+ Stars</option>
                  </select>
                </div>

                {/* Stats */}
                <div className="pt-4 border-t border-white/20">
                  <div className="text-sm text-white font-medium mb-3">
                    Showing {filteredShops.length} of {shops.length} shops
                  </div>
                  <button
                    onClick={() => setFilters({ search: '', country: '', city: '', minRating: '' })}
                    className="w-full bg-white text-[#3d3b3c] px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 hover:bg-zinc-800 hover:text-white hover:shadow-lg border-2 border-white"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - Most Recent Shops */}
          <div className="flex-1 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:pr-2">
            <div className="mb-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 lg:sticky lg:top-0 lg:z-10">
              <h2 className="text-xl font-bold text-white">
                📍 Most Recent Repair Shops
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Discover the latest motorcycle repair shops in your area
              </p>
            </div>

            {/* Results */}
            {filteredShops.length === 0 ? (
              <div className="text-center p-20 bg-white/95 backdrop-blur-md rounded-2xl text-gray-600 shadow-2xl">
                <h3 className="text-3xl mb-4 text-gray-800 font-bold">No results found</h3>
                <p className="text-xl text-gray-500">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {Array.from(shopsByCountry.entries()).map(([country, countryShops], countryIndex) => (
                  <div
                    key={country}
                    className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border-2 border-white/50"
                    style={{
                      animation: `fadeIn 0.6s ease-out ${countryIndex * 0.1}s both`,
                    }}
                  >
                    {/* Country Header */}
                    <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 border-b-4 border-indigo-800/30">
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-5xl drop-shadow-lg">{getCountryFlag(country)}</span>
                          <div>
                            <h3 className="text-3xl font-bold text-white drop-shadow-lg tracking-tight">
                              {country}
                            </h3>
                            <p className="text-white/90 text-sm mt-1 font-medium">
                              {countryShops.length} {countryShops.length === 1 ? 'shop' : 'shops'} available
                            </p>
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-white/40">
                            <span className="text-white font-bold text-lg">
                              {countryShops.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Country Shops Grid */}
                    <div className="p-6 md:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {countryShops.map((shop, shopIndex) => (
                          <div
                            key={shop.id}
                            style={{
                              animation: `fadeIn 0.5s ease-out ${(countryIndex * 0.1) + (shopIndex * 0.05)}s both`,
                            }}
                          >
                            <ShopCard shop={shop} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Top Button */}
        <BackToTop />
      </div>
    </main>
  );
}
