// Add new bike page

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { registerBike } from '@/lib/bikes';
import { BikeRegistration } from '@/types/bike';
import { BikeForm } from '@/components/bikes/BikeForm';
import { Loading } from '@/components/ui/Loading';

export default function NewBikePage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

  const handleSubmit = async (data: BikeRegistration) => {
    if (!user) return;

    const { bike, error } = await registerBike(user.id, data);

    if (error) {
      alert('Failed to add bike: ' + error);
      throw new Error(error);
    }

    if (bike) {
      router.push(`/bikes/${bike.id}`);
    }
  };

  if (loading) {
    return <Loading fullPage text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Add New Bike</h1>
          <p className="mt-1 text-sm text-gray-500">
            Register a new motorcycle to your collection
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <BikeForm
            onSubmit={handleSubmit}
            onCancel={() => router.push('/bikes')}
            submitLabel="Add Bike"
          />
        </div>
      </div>
    </div>
  );
}
