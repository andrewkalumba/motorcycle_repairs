// Shop detail page with booking

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getShopById } from '@/lib/shops';
import { getUserBikes } from '@/lib/bikes';
import { createAppointment } from '@/lib/appointments';
import { MotorcycleShop } from '@/types/shop';
import { Bike } from '@/types/bike';
import { AppointmentCreate } from '@/types/appointment';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';

export default function ShopDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<MotorcycleShop | null>(null);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [appointmentData, setAppointmentData] = useState<Partial<AppointmentCreate>>({
    serviceType: 'maintenance',
    urgency: 'routine',
  });

  useEffect(() => {
    loadData();
  }, [shopId, user]);

  const loadData = async () => {
    setLoading(true);

    // Load shop and bikes in parallel for better performance
    if (user) {
      const [{ shop: shopData }, { bikes: userBikes }] = await Promise.all([
        getShopById(shopId),
        getUserBikes(user.id)
      ]);
      setShop(shopData);
      setBikes(userBikes);
    } else {
      const { shop: shopData } = await getShopById(shopId);
      setShop(shopData);
    }

    setLoading(false);
  };

  const handleBookAppointment = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!appointmentData.bikeId || !appointmentData.appointmentDate || !appointmentData.description) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    const appointmentToCreate: AppointmentCreate = {
      bikeId: appointmentData.bikeId!,
      shopId: shopId,
      appointmentDate: appointmentData.appointmentDate!,
      serviceType: appointmentData.serviceType || 'maintenance',
      serviceCategory: appointmentData.serviceCategory,
      description: appointmentData.description!,
      urgency: appointmentData.urgency || 'routine',
      estimatedCost: appointmentData.estimatedCost,
      notes: appointmentData.notes,
    };

    const { appointment, error } = await createAppointment(user.id, appointmentToCreate);

    if (error) {
      alert('Failed to book appointment: ' + error);
      setSubmitting(false);
    } else {
      setBookingModal(false);
      router.push(`/appointments/${appointment?.id}`);
    }
  };

  if (loading) {
    return <Loading fullPage text="Loading shop details..." />;
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop not found</h2>
          <Button onClick={() => router.push('/shops')}>Back to Shops</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/shops')}
            className="mb-4 text-white border-white hover:bg-white/20"
          >
            Back to Shops
          </Button>
          <h1 className="text-4xl font-bold mb-2">{shop.name}</h1>
          <p className="text-blue-100 text-lg">{shop.address}</p>
          {shop.city && <p className="text-blue-100">{shop.city}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shop Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Shop Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shop.rating && (
                    <div>
                      <span className="text-sm text-gray-600">Rating</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="success" size="lg">
                          {shop.rating.toFixed(1)} / 5.0
                        </Badge>
                      </div>
                    </div>
                  )}

                  {shop.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Phone</span>
                      <p className="font-medium mt-1">{shop.phone}</p>
                      <a
                        href={`tel:${shop.phone}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Call now
                      </a>
                    </div>
                  )}

                  {shop.website && (
                    <div>
                      <span className="text-sm text-gray-600">Website</span>
                      <p className="mt-1">
                        <a
                          href={shop.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all"
                        >
                          {shop.website}
                        </a>
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-sm text-gray-600">Address</span>
                    <p className="font-medium mt-1">{shop.address}</p>
                    {shop.city && <p className="text-sm text-gray-600">{shop.city}</p>}
                  </div>

                  {shop.latitude && shop.longitude && (
                    <div>
                      <Button
                        fullWidth
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`,
                            '_blank'
                          );
                        }}
                      >
                        View on Google Maps
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Book an Appointment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Schedule Your Service
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Book an appointment with {shop.name} for your motorcycle service
                  </p>
                  <Button onClick={() => {
                    if (!user) {
                      router.push('/auth');
                    } else {
                      setBookingModal(true);
                    }
                  }}>
                    {user ? 'Book Appointment' : 'Login to Book'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        isOpen={bookingModal}
        onClose={() => setBookingModal(false)}
        title="Book Appointment"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleBookAppointment(); }} className="space-y-4">
          {/* Select Bike */}
          <Select
            label="Select Bike"
            value={appointmentData.bikeId || ''}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, bikeId: e.target.value }))}
            options={[
              { value: '', label: 'Choose a bike' },
              ...bikes.map(bike => ({
                value: bike.id,
                label: `${bike.year} ${bike.make} ${bike.model}`,
              })),
            ]}
            required
          />

          {/* Appointment Date & Time */}
          <Input
            label="Appointment Date & Time"
            type="datetime-local"
            value={appointmentData.appointmentDate || ''}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, appointmentDate: e.target.value }))}
            min={new Date().toISOString().slice(0, 16)}
            required
          />

          {/* Service Type */}
          <Select
            label="Service Type"
            value={appointmentData.serviceType || 'maintenance'}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, serviceType: e.target.value as any }))}
            options={[
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'repair', label: 'Repair' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'customization', label: 'Customization' },
            ]}
            required
          />

          {/* Urgency */}
          <Select
            label="Urgency"
            value={appointmentData.urgency || 'routine'}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, urgency: e.target.value as any }))}
            options={[
              { value: 'routine', label: 'Routine' },
              { value: 'within_week', label: 'Within a Week' },
              { value: 'immediate', label: 'Immediate' },
            ]}
          />

          {/* Description */}
          <TextArea
            label="Description"
            value={appointmentData.description || ''}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the service you need..."
            rows={3}
            required
          />

          {/* Estimated Cost */}
          <Input
            label="Estimated Cost (optional)"
            type="number"
            step="0.01"
            value={appointmentData.estimatedCost || ''}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, estimatedCost: e.target.value ? parseFloat(e.target.value) : undefined }))}
            placeholder="0.00"
          />

          {/* Notes */}
          <TextArea
            label="Additional Notes"
            value={appointmentData.notes || ''}
            onChange={(e) => setAppointmentData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional information..."
            rows={2}
          />

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setBookingModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Confirm Booking
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
