// Add service record page

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getBikeById } from '@/lib/bikes';
import { addServiceRecord } from '@/lib/services';
import { Bike } from '@/types/bike';
import { ServiceHistoryCreate, SERVICE_CATEGORIES, ServiceCategory } from '@/types/service';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Select } from '@/components/ui/Input';

export default function NewServiceRecordPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const bikeId = params.id as string;

  const [bike, setBike] = useState<Bike | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceHistoryCreate>({
    bikeId: bikeId,
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: 'maintenance',
    description: '',
  });

  useEffect(() => {
    if (!authLoading && user && bikeId) {
      loadBike();
    }
  }, [user, authLoading, bikeId]);

  const loadBike = async () => {
    if (!user || !bikeId) return;

    const { bike: bikeData } = await getBikeById(bikeId, user.id);
    if (bikeData) {
      setBike(bikeData);
    } else {
      router.push('/bikes');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const { error } = await addServiceRecord(user.id, formData);

    if (error) {
      alert('Failed to add service record: ' + error);
      setSubmitting(false);
    } else {
      router.push(`/bikes/${bikeId}`);
    }
  };

  const handleChange = (field: keyof ServiceHistoryCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (authLoading || loading) {
    return <Loading fullPage text="Loading..." />;
  }

  if (!user || !bike) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Add Service Record</h1>
          <p className="mt-1 text-sm text-gray-500">
            {bike.year} {bike.make} {bike.model}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Service Date */}
              <Input
                label="Service Date"
                type="date"
                value={formData.serviceDate}
                onChange={(e) => handleChange('serviceDate', e.target.value)}
                required
              />

              {/* Service Type */}
              <Select
                label="Service Type"
                value={formData.serviceType}
                onChange={(e) => handleChange('serviceType', e.target.value)}
                options={[
                  { value: 'maintenance', label: 'Maintenance' },
                  { value: 'repair', label: 'Repair' },
                  { value: 'inspection', label: 'Inspection' },
                  { value: 'customization', label: 'Customization' },
                ]}
                required
              />

              {/* Service Category */}
              <Select
                label="Service Category"
                value={formData.serviceCategory || ''}
                onChange={(e) => handleChange('serviceCategory', e.target.value as ServiceCategory)}
                options={[
                  { value: '', label: 'Select category' },
                  ...Object.entries(SERVICE_CATEGORIES).map(([key, label]) => ({
                    value: key,
                    label,
                  })),
                ]}
              />

              {/* Cost */}
              <Input
                label="Cost"
                type="number"
                step="0.01"
                value={formData.cost || ''}
                onChange={(e) => handleChange('cost', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.00"
              />

              {/* Mileage at Service */}
              <Input
                label="Mileage at Service (km)"
                type="number"
                value={formData.mileageAtService || ''}
                onChange={(e) => handleChange('mileageAtService', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Current mileage"
              />

              {/* Next Service Due Mileage */}
              <Input
                label="Next Service Due Mileage (km)"
                type="number"
                value={formData.nextServiceDueMileage || ''}
                onChange={(e) => handleChange('nextServiceDueMileage', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
              />

              {/* Next Service Due Date */}
              <Input
                label="Next Service Due Date"
                type="date"
                value={formData.nextServiceDueDate || ''}
                onChange={(e) => handleChange('nextServiceDueDate', e.target.value)}
              />
            </div>

            {/* Description */}
            <TextArea
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the service performed..."
              rows={3}
              required
            />

            {/* Notes */}
            <TextArea
              label="Additional Notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional information..."
              rows={2}
            />

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/bikes/${bikeId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Add Service Record
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
