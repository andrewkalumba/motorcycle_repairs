// Bike detail page with service history

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getBikeById } from '@/lib/bikes';
import { getBikeServiceHistory, getBikeReminders } from '@/lib/services';
import { Bike } from '@/types/bike';
import { ServiceHistoryWithShop } from '@/types/service';
import { MaintenanceReminder } from '@/types/service';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function BikeDetailPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const bikeId = params.id as string;

  const [bike, setBike] = useState<Bike | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryWithShop[]>([]);
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && bikeId) {
      loadBikeData();
    }
  }, [user, authLoading, bikeId]);

  const loadBikeData = async () => {
    if (!user || !bikeId) return;

    setLoading(true);

    const [bikeResult, servicesResult, remindersResult] = await Promise.all([
      getBikeById(bikeId, user.id),
      getBikeServiceHistory(bikeId),
      getBikeReminders(bikeId),
    ]);

    if (bikeResult.bike) {
      setBike(bikeResult.bike);
    } else {
      router.push('/bikes');
    }

    setServiceHistory(servicesResult.services);
    setReminders(remindersResult.reminders);
    setLoading(false);
  };

  if (authLoading || loading) {
    return <Loading fullPage text="Loading bike details..." />;
  }

  if (!user || !bike) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {bike.year} {bike.make} {bike.model}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{bike.licensePlate || 'No license plate'}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/bikes')}>
                Back to Bikes
              </Button>
              <Button onClick={() => router.push(`/bikes/${bikeId}/edit`)}>
                Edit Bike
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Bike Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Bike Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bike.photoUrl && (
                    <img
                      src={bike.photoUrl}
                      alt={`${bike.make} ${bike.model}`}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <p className="font-medium">{bike.year}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Make:</span>
                      <p className="font-medium">{bike.make}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Model:</span>
                      <p className="font-medium">{bike.model}</p>
                    </div>
                    {bike.color && (
                      <div>
                        <span className="text-gray-600">Color:</span>
                        <p className="font-medium">{bike.color}</p>
                      </div>
                    )}
                    {bike.engineSize && (
                      <div>
                        <span className="text-gray-600">Engine:</span>
                        <p className="font-medium">{bike.engineSize}cc</p>
                      </div>
                    )}
                    {bike.currentMileage !== undefined && (
                      <div>
                        <span className="text-gray-600">Mileage:</span>
                        <p className="font-medium">{bike.currentMileage.toLocaleString()} km</p>
                      </div>
                    )}
                    {bike.vin && (
                      <div className="col-span-2">
                        <span className="text-gray-600">VIN:</span>
                        <p className="font-medium text-xs break-all">{bike.vin}</p>
                      </div>
                    )}
                  </div>

                  {bike.notes && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="text-gray-600 text-sm">Notes:</span>
                      <p className="text-sm mt-1">{bike.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reminders */}
            {reminders.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Maintenance Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reminders.map((reminder) => (
                      <div
                        key={reminder.id}
                        className="border-l-4 border-yellow-500 bg-yellow-50 p-3 rounded-r-lg"
                      >
                        <p className="font-medium text-gray-900">{reminder.description}</p>
                        {reminder.dueDate && (
                          <p className="text-sm text-gray-600">
                            Due: {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {reminder.dueMileage && (
                          <p className="text-sm text-gray-600">
                            Due at: {reminder.dueMileage.toLocaleString()} km
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Service History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Service History</CardTitle>
                  <Button
                    size="sm"
                    onClick={() => router.push(`/bikes/${bikeId}/service/new`)}
                  >
                    Add Service Record
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {serviceHistory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-5xl mb-4">🔧</div>
                    <p className="text-lg font-semibold mb-2">No service history</p>
                    <p className="text-sm mb-4">Start tracking maintenance and repairs</p>
                    <Button onClick={() => router.push(`/bikes/${bikeId}/service/new`)}>
                      Add First Service
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceHistory.map((service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="info">
                                {service.serviceType}
                              </Badge>
                              {service.serviceCategory && (
                                <Badge variant="default">
                                  {service.serviceCategory}
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-bold text-gray-900">{service.description}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(service.serviceDate).toLocaleDateString()}
                            </p>
                            {service.cost && (
                              <p className="text-sm text-gray-600">${service.cost.toFixed(2)}</p>
                            )}
                          </div>
                        </div>

                        {service.shopName && (
                          <p className="text-sm text-gray-600 mb-2">
                            Shop: {service.shopName}
                            {service.shopCity && `, ${service.shopCity}`}
                          </p>
                        )}

                        {service.mileageAtService && (
                          <p className="text-sm text-gray-600">
                            Mileage: {service.mileageAtService.toLocaleString()} km
                          </p>
                        )}

                        {service.partsReplaced && service.partsReplaced.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 font-medium">Parts Replaced:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {service.partsReplaced.map((part, idx) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {part}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {service.notes && (
                          <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-200">
                            {service.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
