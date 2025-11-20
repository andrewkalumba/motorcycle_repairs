'use client';

import { ShopFilters } from '@/types/shop';

interface FiltersProps {
  filters: ShopFilters;
  onFilterChange: (filters: ShopFilters) => void;
  countries: string[];
  cities: string[];
  totalShops: number;
  filteredCount: number;
}

export default function Filters({
  filters,
  onFilterChange,
  countries,
  cities,
  totalShops,
  filteredCount,
}: FiltersProps) {
  const handleInputChange = (field: keyof ShopFilters, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const resetFilters = () => {
    onFilterChange({
      search: '',
      country: '',
      city: '',
      minRating: '',
    });
  };

  return (
    <div className="bg-[rgb(247,246,246)] rounded-[20px] p-8 mb-8 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-white/50 animate-slide-up">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        {/* Search */}
        <div className="flex flex-col relative">
          <label
            htmlFor="search"
            className="font-bold mb-2.5 text-[#333] text-[0.95em] flex items-center gap-1.5"
          >
            🔍 Search by name or address
          </label>
          <input
            type="text"
            id="search"
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            placeholder="e.g., Bike care motors"
            className="px-4 py-3.5 border-2 border-[#e0e0e0] rounded-xl text-base transition-all duration-300 bg-[#fafafa] hover:border-[#667eea] hover:bg-white focus:outline-none focus:border-[#667eea] focus:bg-white focus:shadow-[0_0_0_4px_rgba(102,126,234,0.1)] focus:-translate-y-0.5"
          />
        </div>

        {/* Country */}
        <div className="flex flex-col relative">
          <label
            htmlFor="country"
            className="font-bold mb-2.5 text-[#333] text-[0.95em] flex items-center gap-1.5"
          >
            🌍 Country
          </label>
          <select
            id="country"
            value={filters.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            className="px-4 py-3.5 border-2 border-[#e0e0e0] rounded-xl text-base transition-all duration-300 bg-[#fafafa] hover:border-[#667eea] hover:bg-white focus:outline-none focus:border-[#667eea] focus:bg-white focus:shadow-[0_0_0_4px_rgba(102,126,234,0.1)] focus:-translate-y-0.5"
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
        <div className="flex flex-col relative">
          <label
            htmlFor="city"
            className="font-bold mb-2.5 text-[#333] text-[0.95em] flex items-center gap-1.5"
          >
            🏙️ City
          </label>
          <select
            id="city"
            value={filters.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="px-4 py-3.5 border-2 border-[#e0e0e0] rounded-xl text-base transition-all duration-300 bg-[#fafafa] hover:border-[#667eea] hover:bg-white focus:outline-none focus:border-[#667eea] focus:bg-white focus:shadow-[0_0_0_4px_rgba(102,126,234,0.1)] focus:-translate-y-0.5"
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
        <div className="flex flex-col relative">
          <label
            htmlFor="minRating"
            className="font-bold mb-2.5 text-[#333] text-[0.95em] flex items-center gap-1.5"
          >
            ⭐ Minimum Rating
          </label>
          <select
            id="minRating"
            value={filters.minRating}
            onChange={(e) => handleInputChange('minRating', e.target.value)}
            className="px-4 py-3.5 border-2 border-[#e0e0e0] rounded-xl text-base transition-all duration-300 bg-[#fafafa] hover:border-[#667eea] hover:bg-white focus:outline-none focus:border-[#667eea] focus:bg-white focus:shadow-[0_0_0_4px_rgba(102,126,234,0.1)] focus:-translate-y-0.5"
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5+ Stars</option>
            <option value="4.0">4.0+ Stars</option>
            <option value="3.5">3.5+ Stars</option>
            <option value="3.0">3.0+ Stars</option>
          </select>
        </div>
      </div>

      {/* Stats and Clear Button */}
      <div className="flex justify-between items-center pt-5 border-t-2 border-[#f0f0f0]">
        <div className="text-[#666] font-semibold">
          Showing {filteredCount} of {totalShops} repair shops
        </div>
        <button
          onClick={resetFilters}
          className="bg-gradient-to-br from-[#ff6b6b] to-[#ee5a6f] text-white px-6 py-3 rounded-xl font-bold cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(255,107,107,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,107,107,0.4)]"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
