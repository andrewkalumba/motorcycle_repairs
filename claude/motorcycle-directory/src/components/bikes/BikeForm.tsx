// Bike Form component for adding/editing bikes

'use client';

import React, { useState } from 'react';
import { BikeRegistration, BIKE_MAKES, BIKE_COLORS } from '@/types/bike';
import { Input, TextArea, Select } from '../ui/Input';
import { Button } from '../ui/Button';

export interface BikeFormProps {
  initialData?: Partial<BikeRegistration>;
  onSubmit: (data: BikeRegistration) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function BikeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Bike',
}: BikeFormProps) {
  const [formData, setFormData] = useState<BikeRegistration>({
    make: initialData?.make || '',
    model: initialData?.model || '',
    year: initialData?.year || new Date().getFullYear(),
    vin: initialData?.vin || '',
    color: initialData?.color || '',
    engineSize: initialData?.engineSize || undefined,
    licensePlate: initialData?.licensePlate || '',
    purchaseDate: initialData?.purchaseDate || '',
    currentMileage: initialData?.currentMileage || undefined,
    photoUrl: initialData?.photoUrl || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.make.trim()) {
      newErrors.make = 'Make is required';
    }
    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
    }
    if (!formData.year) {
      newErrors.year = 'Year is required';
    } else if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Invalid year';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof BikeRegistration, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Make */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            list="bike-makes"
            value={formData.make}
            onChange={(e) => handleChange('make', e.target.value)}
            placeholder="e.g., Honda, Yamaha"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <datalist id="bike-makes">
            {BIKE_MAKES.map(make => (
              <option key={make} value={make} />
            ))}
          </datalist>
          {errors.make && <p className="mt-1 text-sm text-red-600">{errors.make}</p>}
        </div>

        {/* Model */}
        <Input
          label="Model"
          value={formData.model}
          onChange={(e) => handleChange('model', e.target.value)}
          placeholder="e.g., CBR1000RR, YZF-R1"
          error={errors.model}
          required
        />

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.year}
            onChange={(e) => handleChange('year', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year}</p>}
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            list="bike-colors"
            value={formData.color}
            onChange={(e) => handleChange('color', e.target.value)}
            placeholder="Select or type color"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <datalist id="bike-colors">
            {BIKE_COLORS.map(color => (
              <option key={color} value={color} />
            ))}
          </datalist>
        </div>

        {/* Engine Size */}
        <Input
          label="Engine Size (cc)"
          type="number"
          value={formData.engineSize || ''}
          onChange={(e) => handleChange('engineSize', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="e.g., 1000"
        />

        {/* License Plate */}
        <Input
          label="License Plate"
          value={formData.licensePlate}
          onChange={(e) => handleChange('licensePlate', e.target.value)}
          placeholder="e.g., ABC 123"
        />

        {/* VIN */}
        <Input
          label="VIN"
          value={formData.vin}
          onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
          placeholder="Vehicle Identification Number"
          className="uppercase"
        />

        {/* Current Mileage */}
        <Input
          label="Current Mileage (km)"
          type="number"
          value={formData.currentMileage || ''}
          onChange={(e) => handleChange('currentMileage', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="e.g., 15000"
        />

        {/* Purchase Date */}
        <Input
          label="Purchase Date"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => handleChange('purchaseDate', e.target.value)}
        />

        {/* Photo URL */}
        <Input
          label="Photo URL"
          value={formData.photoUrl}
          onChange={(e) => handleChange('photoUrl', e.target.value)}
          placeholder="https://example.com/bike-photo.jpg"
          className="md:col-span-2"
        />
      </div>

      {/* Notes */}
      <TextArea
        label="Notes"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="Additional notes about this bike..."
        rows={3}
      />

      {/* Form Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
