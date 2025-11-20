// Skeleton loading component for better perceived performance

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-gray-200';
  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantStyles = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%'),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
    />
  );
}

export function BikeCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton variant="rectangular" width={64} height={64} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="50%" height={16} />
        </div>
      </div>
    </div>
  );
}

export function AppointmentCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="50%" height={18} />
          <Skeleton variant="text" width="40%" height={14} />
          <Skeleton variant="text" width="60%" height={14} />
        </div>
        <Skeleton variant="rectangular" width={60} height={24} className="rounded-full" />
      </div>
    </div>
  );
}

export function ShopCardSkeleton() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4">
      <div className="space-y-3">
        <Skeleton variant="text" width="70%" height={20} />
        <Skeleton variant="text" width="90%" height={16} />
        <Skeleton variant="text" width="80%" height={16} />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
      <div className="flex gap-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-lg">
            <Skeleton variant="text" width="60%" height={14} className="mb-2" />
            <Skeleton variant="text" width="40%" height={32} />
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <Skeleton variant="text" width="40%" height={24} className="mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <BikeCardSkeleton key={i} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <Skeleton variant="text" width="50%" height={24} className="mb-4" />
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <AppointmentCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <Skeleton variant="text" width="80%" height={18} className="mb-2" />
          <Skeleton variant="text" width="60%" height={14} className="mb-2" />
          <Skeleton variant="text" width="70%" height={14} />
        </div>
      ))}
    </div>
  );
}

// Add shimmer animation to tailwind if not already present
// In your tailwind.config.js, add:
// animation: {
//   shimmer: 'shimmer 2s linear infinite',
// },
// keyframes: {
//   shimmer: {
//     '0%': { backgroundPosition: '-1000px 0' },
//     '100%': { backgroundPosition: '1000px 0' },
//   },
// },
