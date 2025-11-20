// Appointment Booking Modal Component

'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { MotorcycleShop } from '@/types/shop';
import { Bike } from '@/types/bike';
import { createAppointment } from '@/lib/appointments';
import { SERVICE_CATEGORIES } from '@/lib/shopFinder';

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: MotorcycleShop;
  bikes: Bike[];
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  preSelectedServiceCategory?: string;
  preSelectedBikeId?: string;
  onSuccess?: () => void;
}

export function AppointmentBookingModal({
  isOpen,
  onClose,
  shop,
  bikes,
  userId,
  userName,
  userEmail,
  userPhone,
  preSelectedServiceCategory,
  preSelectedBikeId,
  onSuccess,
}: AppointmentBookingModalProps) {
  const [bikeId, setBikeId] = useState(preSelectedBikeId || (bikes[0]?.id || ''));
  const [serviceCategory, setServiceCategory] = useState(preSelectedServiceCategory || '');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'immediate' | 'within_week' | 'routine'>('routine');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [notes, setNotes] = useState('');
  const [contactPhone, setContactPhone] = useState(userPhone || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update service type when category changes
  useEffect(() => {
    if (serviceCategory) {
      const category = SERVICE_CATEGORIES.find((c) => c.value === serviceCategory);
      if (category) {
        setServiceType(category.label);
      }
    }
  }, [serviceCategory]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setBikeId(preSelectedBikeId || (bikes[0]?.id || ''));
      setServiceCategory(preSelectedServiceCategory || '');
      setDescription('');
      setUrgency('routine');
      setAppointmentDate('');
      setAppointmentTime('');
      setNotes('');
      setError(null);
    }
  }, [isOpen, preSelectedBikeId, preSelectedServiceCategory, bikes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!bikeId) {
      setError('Please select a bike');
      return;
    }

    if (!serviceCategory || !serviceType) {
      setError('Please select a service type');
      return;
    }

    if (!description.trim()) {
      setError('Please describe the service needed');
      return;
    }

    if (!appointmentDate) {
      setError('Please select a preferred date');
      return;
    }

    if (!appointmentTime) {
      setError('Please select a preferred time');
      return;
    }

    // Combine date and time
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);

    // Validate date is in future
    if (appointmentDateTime < new Date()) {
      setError('Appointment date must be in the future');
      return;
    }

    setLoading(true);

    try {
      const { appointment, error: createError } = await createAppointment(userId, {
        bikeId,
        shopId: shop.id,
        appointmentDate: appointmentDateTime.toISOString(),
        serviceType,
        serviceCategory,
        description,
        urgency,
        notes: notes || undefined,
      });

      if (createError) {
        setError(createError);
        setLoading(false);
        return;
      }

      // Success
      alert(
        `Appointment request created successfully!\n\n` +
        `Shop: ${shop.name}\n` +
        `Date: ${appointmentDateTime.toLocaleDateString()} at ${appointmentDateTime.toLocaleTimeString()}\n` +
        `Service: ${serviceType}\n\n` +
        `The shop will be notified and will contact you to confirm the appointment.`
      );

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err) {
      setError('Failed to create appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedBike = bikes.find((b) => b.id === bikeId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Appointment" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Shop Info */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-bold text-indigo-900 mb-1">{shop.name}</h3>
            <p className="text-sm text-indigo-700">{shop.address}</p>
            <p className="text-sm text-indigo-700">
              {shop.city}, {shop.country}
            </p>
            {shop.phone && (
              <p className="text-sm text-indigo-700 mt-1">Phone: {shop.phone}</p>
            )}
            {shop.rating && (
              <p className="text-sm text-indigo-700">Rating: {shop.rating.toFixed(1)} / 5.0</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Bike Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Bike *
            </label>
            <Select
              value={bikeId}
              onChange={(e) => setBikeId(e.target.value)}
              options={bikes.map((bike) => ({
                value: bike.id,
                label: `${bike.year} ${bike.make} ${bike.model}`,
              }))}
              required
            />
            {selectedBike && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedBike.engineSize && `${selectedBike.engineSize}cc`}
                {selectedBike.color && ` - ${selectedBike.color}`}
              </p>
            )}
          </div>

          {/* Service Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Type *
            </label>
            <Select
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              options={[
                { value: '', label: 'Select service type...' },
                ...SERVICE_CATEGORIES.map((cat) => ({
                  value: cat.value,
                  label: cat.label,
                })),
              ]}
              required
            />
            {serviceCategory && (
              <p className="text-xs text-gray-500 mt-1">
                {SERVICE_CATEGORIES.find((c) => c.value === serviceCategory)?.description}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe the Service Needed *
            </label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue or service you need in detail..."
              rows={4}
              required
            />
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Urgency Level *
            </label>
            <Select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as 'immediate' | 'within_week' | 'routine')}
              options={[
                { value: 'routine', label: 'Routine - Not urgent' },
                { value: 'within_week', label: 'Within this week' },
                { value: 'immediate', label: 'Immediate - URGENT' },
              ]}
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date *
              </label>
              <Input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time *
              </label>
              <Input
                type="time"
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Phone Number
            </label>
            <Input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+46 70 123 4567"
            />
            <p className="text-xs text-gray-500 mt-1">
              The shop will use this number to contact you to confirm the appointment
            </p>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes (Optional)
            </label>
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information or special requests..."
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is a preliminary appointment request. The shop will
              review your request and contact you to confirm availability and provide an
              estimated cost.
            </p>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Request Appointment
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
