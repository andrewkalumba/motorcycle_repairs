import { MotorcycleShop } from '@/types/shop';

interface ShopCardProps {
  shop: MotorcycleShop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl p-4 shadow-lg transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-[1.02] hover:shadow-2xl hover:-translate-y-2 border-2 border-[#3d3b3c] hover:border-[#3d3b3c] group bg-white">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-5 -z-10"
        style={{ backgroundImage: 'url(/motor.jpg)' }}
      />

      {/* Top accent line that animates on hover */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-400 transform scale-x-0 transition-transform duration-400 group-hover:scale-x-100 z-10" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-2.5">
          <h3 className="text-lg font-semibold text-gray-800 leading-tight tracking-tight mb-1">
            {shop.name}
          </h3>
          <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-wide border border-purple-200">
            {shop.city}
          </div>
        </div>

        {shop.rating && (
          <div className="flex items-center gap-2 mb-2.5 bg-amber-50 px-2.5 py-1.5 rounded-lg w-fit border border-amber-200">
            <span className="text-amber-600 font-bold text-sm">
              ⭐ {shop.rating}
            </span>
            {shop.reviews_count && (
              <span className="text-gray-700 text-xs font-semibold">
                ({shop.reviews_count})
              </span>
            )}
          </div>
        )}

        <div className="space-y-1.5 mb-3">
          <div className="flex items-start text-gray-700 text-xs leading-snug">
            <span className="mr-1.5 text-purple-600 min-w-[16px] text-sm">📍</span>
            <span className="font-medium">{shop.address}</span>
          </div>

          {shop.phone && shop.phone !== 'N/A' && (
            <div className="flex items-start text-gray-700 text-xs leading-snug">
              <span className="mr-1.5 text-purple-600 min-w-[16px] text-sm">📞</span>
              <span className="font-medium">{shop.phone}</span>
            </div>
          )}

          {shop.hours && shop.hours !== 'N/A' && (
            <div className="flex items-start text-gray-700 text-xs leading-snug">
              <span className="mr-1.5 text-purple-600 min-w-[16px] text-sm">🕐</span>
              <span className="font-medium">{shop.hours}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2.5 border-t border-gray-200">
          {shop.website && shop.website !== 'N/A' && (
            <a
              href={shop.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#3d3b3c] text-white rounded-lg font-bold text-xs shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:bg-gray-500"
            >
              Website
            </a>
          )}
          {shop.latitude && shop.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name}, ${shop.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white text-[#3d3b3c] rounded-lg font-bold text-xs border-2 border-[#3d3b3c] transition-all duration-300 hover:bg-gray-300 hover:-translate-y-0.5"
              title={`View ${shop.name} on Google Maps`}
            >
              Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
