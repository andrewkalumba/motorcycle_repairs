// Appointments page with quick booking form

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getUserAppointments, cancelAppointment, createAppointment } from '@/lib/appointments';
import { getUserBikes } from '@/lib/bikes';
import { findShopsByService } from '@/lib/shopFinder';
import { getUserLocationWithCountry } from '@/lib/geolocation';
import { searchShops, getShopCities } from '@/lib/shops';
import { AppointmentWithDetails, AppointmentCreate } from '@/types/appointment';
import { Bike } from '@/types/bike';
import { MotorcycleShop } from '@/types/shop';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, TextArea, Select } from '@/components/ui/Input';

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    appointment: AppointmentWithDetails | null;
  }>({ isOpen: false, appointment: null });
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Quick booking form state
  const [quickBookModal, setQuickBookModal] = useState(false);
  const [nearbyShops, setNearbyShops] = useState<MotorcycleShop[]>([]);
  const [allShops, setAllShops] = useState<MotorcycleShop[]>([]); // Store all shops for search
  const [loadingShops, setLoadingShops] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [shopSearchCity, setShopSearchCity] = useState('');
  const [shopSearchText, setShopSearchText] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [selectedShopPreview, setSelectedShopPreview] = useState<MotorcycleShop | null>(null);
  const [bookingData, setBookingData] = useState<{
    phone: string;
    bikeId: string;
    shopId: string;
    serviceType: string;
    appointmentDate: string;
    description: string;
  }>({
    phone: '',
    bikeId: '',
    shopId: '',
    serviceType: 'maintenance',
    appointmentDate: '',
    description: '',
  });
  const [submittingBooking, setSubmittingBooking] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    // Load appointments and bikes in parallel
    const [{ appointments: userAppointments }, { bikes: userBikes }] = await Promise.all([
      getUserAppointments(user.id),
      getUserBikes(user.id),
    ]);
    setAppointments(userAppointments);
    setBikes(userBikes);
    setLoading(false);
  };

  const handleOpenQuickBook = async () => {
    if (!user) return;

    setQuickBookModal(true);
    setLoadingShops(true);
    setLocationError(null);

    // Load cities for fallback search
    const { cities } = await getShopCities();
    setAvailableCities(cities);

    // Try to get user location and find nearby shops
    try {
      const location = await getUserLocationWithCountry(true);

      if (location) {
        const { shops } = await findShopsByService(
          location.latitude,
          location.longitude,
          undefined, // No specific service filter
          50, // 50km radius
          20, // Top 20 shops
          location.country
        );
        setNearbyShops(shops);
        setLoadingShops(false);
      } else {
        // Location access denied or failed - load popular shops as fallback
        setLocationError('Location access denied. Showing popular shops instead.');
        await loadFallbackShops();
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to access location. Showing popular shops instead.');
      await loadFallbackShops();
    }
  };

  const loadFallbackShops = async () => {
    // Load top rated shops as fallback when geolocation fails
    const { shops } = await searchShops({
      minRating: 3.5,
      limit: 50,
    });
    setNearbyShops(shops);
    setAllShops(shops); // Store for search
    setLoadingShops(false);
  };

  const handleSearchShopsByCity = async (city: string) => {
    if (!city) {
      await loadFallbackShops();
      return;
    }

    setLoadingShops(true);
    setShopSearchCity(city);
    setShopSearchText(''); // Clear text search

    const { shops } = await searchShops({
      city,
      limit: 50,
    });
    setNearbyShops(shops);
    setAllShops(shops);
    setLoadingShops(false);
  };

  const handleSearchShopsByName = (searchText: string) => {
    setShopSearchText(searchText);

    if (!searchText.trim()) {
      // If search is empty, show all shops (or filtered by city)
      setNearbyShops(allShops);
      return;
    }

    // Filter shops by name or address
    const filtered = allShops.filter(shop =>
      shop.name.toLowerCase().includes(searchText.toLowerCase()) ||
      shop.address?.toLowerCase().includes(searchText.toLowerCase()) ||
      shop.city?.toLowerCase().includes(searchText.toLowerCase())
    );
    setNearbyShops(filtered);
  };

  const handleShopSelection = (shopId: string) => {
    setBookingData(prev => ({ ...prev, shopId }));
    const shop = nearbyShops.find(s => s.id === shopId);
    setSelectedShopPreview(shop || null);
  };

  // Popular cities for quick access
  const popularCities = ['Paris, France', 'London, UK', 'Berlin, Germany', 'Stockholm, Sweden', 'Amsterdam, Netherlands'];

  const handleQuickCityFilter = async (city: string) => {
    setShopSearchCity(city);
    setLoadingShops(true);
    setShopSearchText('');

    const { shops } = await searchShops({
      city,
      limit: 50,
    });
    setNearbyShops(shops);
    setAllShops(shops);
    setLoadingShops(false);
  };

  const handleQuickBook = async () => {
    if (!user) return;

    // Validate required fields
    if (!bookingData.phone || !bookingData.bikeId || !bookingData.shopId ||
        !bookingData.appointmentDate || !bookingData.description) {
      alert('Please fill in all required fields including phone number');
      return;
    }

    setSubmittingBooking(true);

    const appointmentToCreate: AppointmentCreate = {
      bikeId: bookingData.bikeId,
      shopId: bookingData.shopId,
      appointmentDate: bookingData.appointmentDate,
      serviceType: bookingData.serviceType as any,
      description: bookingData.description,
      urgency: 'routine',
      // Store phone in notes for now
      notes: `Contact Phone: ${bookingData.phone}`,
    };

    const { appointment, error } = await createAppointment(user.id, appointmentToCreate);

    if (error) {
      alert('Failed to book appointment: ' + error);
      setSubmittingBooking(false);
    } else {
      // Reset form and reload
      setQuickBookModal(false);
      setNearbyShops([]);
      setLocationError(null);
      setShopSearchCity('');
      setBookingData({
        phone: '',
        bikeId: '',
        shopId: '',
        serviceType: 'maintenance',
        appointmentDate: '',
        description: '',
      });
      await loadData();
      setSubmittingBooking(false);
      alert('Appointment booked successfully! The shop will contact you at the provided phone number.');
    }
  };

  const handleCancelAppointment = async () => {
    if (!user || !cancelModal.appointment) return;

    setCancelling(true);
    const { error } = await cancelAppointment(
      cancelModal.appointment.id,
      user.id,
      cancellationReason
    );

    if (error) {
      alert('Failed to cancel appointment: ' + error);
    } else {
      await loadData();
      setCancelModal({ isOpen: false, appointment: null });
      setCancellationReason('');
    }
    setCancelling(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const upcomingAppointments = appointments.filter(
    (a) =>
      (a.status === 'pending' || a.status === 'confirmed') &&
      new Date(a.appointmentDate) >= new Date()
  );

  const pastAppointments = appointments.filter(
    (a) =>
      a.status === 'completed' ||
      a.status === 'cancelled' ||
      new Date(a.appointmentDate) < new Date()
  );

  if (authLoading || loading) {
    return <Loading fullPage text="Loading appointments..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your service appointments
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleOpenQuickBook}>
                Quick Book with Phone
              </Button>
              <Button onClick={() => router.push('/shops')}>
                Browse Shops
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {appointments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No appointments yet</h2>
            <p className="text-gray-600 mb-6">
              Book your first service appointment at a repair shop
            </p>
            <Button onClick={() => router.push('/shops')}>
              Find Repair Shops
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Upcoming Appointments ({upcomingAppointments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingAppointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle>{appointment.shopName}</CardTitle>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">Date & Time</p>
                            <p className="font-medium">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at{' '}
                              {new Date(appointment.appointmentDate).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Bike</p>
                            <p className="font-medium">
                              {appointment.bikeYear} {appointment.bikeMake} {appointment.bikeModel}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-gray-600">Service Type</p>
                            <p className="font-medium capitalize">{appointment.serviceType}</p>
                          </div>

                          {appointment.description && (
                            <div>
                              <p className="text-sm text-gray-600">Description</p>
                              <p className="text-sm">{appointment.description}</p>
                            </div>
                          )}

                          {appointment.shopAddress && (
                            <div>
                              <p className="text-sm text-gray-600">Location</p>
                              <p className="text-sm">{appointment.shopAddress}</p>
                            </div>
                          )}

                          {appointment.shopPhone && (
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="text-sm">{appointment.shopPhone}</p>
                            </div>
                          )}

                          <div className="flex gap-2 pt-3 border-t border-gray-200">
                            <Button
                              variant="outline"
                              size="sm"
                              fullWidth
                              onClick={() => router.push(`/appointments/${appointment.id}`)}
                            >
                              View Details
                            </Button>
                            {appointment.status !== 'cancelled' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() =>
                                  setCancelModal({ isOpen: true, appointment })
                                }
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Past Appointments ({pastAppointments.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {pastAppointments.map((appointment) => (
                    <Card key={appointment.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle>{appointment.shopName}</CardTitle>
                          <Badge variant={getStatusVariant(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-900">
                            {appointment.bikeYear} {appointment.bikeMake} {appointment.bikeModel}
                          </p>
                          <p className="text-gray-600 capitalize">{appointment.serviceType}</p>

                          {appointment.actualCost && (
                            <p className="font-medium text-gray-900">
                              Cost: ${appointment.actualCost.toFixed(2)}
                            </p>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth
                            onClick={() => router.push(`/appointments/${appointment.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Book Modal */}
      <Modal
        isOpen={quickBookModal}
        onClose={() => {
          setQuickBookModal(false);
          setNearbyShops([]);
          setLocationError(null);
          setShopSearchCity('');
          setBookingData({
            phone: '',
            bikeId: '',
            shopId: '',
            serviceType: 'maintenance',
            appointmentDate: '',
            description: '',
          });
        }}
        title="Quick Book Appointment"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleQuickBook(); }} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Fill in your phone number to book a repair or service from shops.
              {!locationError && ' We will automatically find shops near your location.'}
            </p>
          </div>

          {/* Location Error Notice */}
          {locationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ {locationError}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Use the city search below to find shops in your area.
              </p>
            </div>
          )}

          {/* Phone Number - Required */}
          <Input
            label="Phone Number"
            type="tel"
            value={bookingData.phone}
            onChange={(e) => setBookingData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+46 70 123 4567"
            required
            helperText="We'll use this to contact you about your appointment"
          />

          {/* Select Bike */}
          <Select
            label="Select Your Bike"
            value={bookingData.bikeId}
            onChange={(e) => setBookingData(prev => ({ ...prev, bikeId: e.target.value }))}
            options={[
              { value: '', label: 'Choose a bike' },
              ...bikes.map(bike => ({
                value: bike.id,
                label: `${bike.year} ${bike.make} ${bike.model}`,
              })),
            ]}
            required
          />

          {/* Popular Cities Quick Filters */}
          {locationError && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Popular Cities
              </label>
              <div className="flex flex-wrap gap-2">
                {popularCities.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleQuickCityFilter(city)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      shopSearchCity === city
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {city.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* City Search Dropdown */}
          {(locationError || availableCities.length > 0) && (
            <Select
              label="Or Search by City"
              value={shopSearchCity}
              onChange={(e) => handleSearchShopsByCity(e.target.value)}
              options={[
                { value: '', label: locationError ? 'All shops (top rated)' : 'Use my location' },
                ...availableCities.map(city => ({
                  value: city,
                  label: city,
                })),
              ]}
            />
          )}

          {/* Shop Name Search */}
          {allShops.length > 0 && (
            <Input
              label="Search Shops by Name"
              type="text"
              value={shopSearchText}
              onChange={(e) => handleSearchShopsByName(e.target.value)}
              placeholder="Type shop name, address, or city..."
              helperText={`Searching ${allShops.length} shops`}
            />
          )}

          {/* Select Shop */}
          <div>
            <Select
              label="Select Shop"
              value={bookingData.shopId}
              onChange={(e) => handleShopSelection(e.target.value)}
              options={[
                { value: '', label: loadingShops ? 'Loading shops...' : 'Choose a shop' },
                ...nearbyShops.map(shop => ({
                  value: shop.id,
                  label: `${shop.name} - ${shop.city || shop.address}${shop.distance ? ` (${shop.distance.toFixed(1)} km)` : ''}${shop.rating ? ` ⭐ ${shop.rating.toFixed(1)}` : ''}`,
                })),
              ]}
              required
              disabled={loadingShops}
            />
            {!loadingShops && nearbyShops.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No shops found. Try selecting a different city or{' '}
                <button
                  type="button"
                  onClick={() => router.push('/shops')}
                  className="text-blue-600 hover:underline"
                >
                  browse all shops
                </button>
              </p>
            )}
            {nearbyShops.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Found {nearbyShops.length} shop{nearbyShops.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>

          {/* Shop Preview Card */}
          {selectedShopPreview && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg">{selectedShopPreview.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedShopPreview.address}</p>
                  <p className="text-sm text-gray-600">{selectedShopPreview.city}</p>

                  <div className="flex items-center gap-4 mt-3">
                    {selectedShopPreview.rating && (
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium text-gray-900">{selectedShopPreview.rating.toFixed(1)}</span>
                        {selectedShopPreview.reviews_count && (
                          <span className="text-xs text-gray-500">({selectedShopPreview.reviews_count} reviews)</span>
                        )}
                      </div>
                    )}
                    {selectedShopPreview.distance && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500">📍</span>
                        <span className="text-sm text-gray-700">{selectedShopPreview.distance.toFixed(1)} km away</span>
                      </div>
                    )}
                  </div>

                  {selectedShopPreview.phone && (
                    <p className="text-sm text-gray-600 mt-2">
                      📞 {selectedShopPreview.phone}
                    </p>
                  )}
                  {selectedShopPreview.website && (
                    <a
                      href={selectedShopPreview.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                    >
                      🌐 Visit website
                    </a>
                  )}
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
          )}

          {/* Service Type */}
          <Select
            label="Service Type"
            value={bookingData.serviceType}
            onChange={(e) => setBookingData(prev => ({ ...prev, serviceType: e.target.value }))}
            options={[
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'repair', label: 'Repair' },
              { value: 'inspection', label: 'Inspection' },
              { value: 'customization', label: 'Customization' },
            ]}
            required
          />

          {/* Appointment Date & Time */}
          <Input
            label="Preferred Date & Time"
            type="datetime-local"
            value={bookingData.appointmentDate}
            onChange={(e) => setBookingData(prev => ({ ...prev, appointmentDate: e.target.value }))}
            min={new Date().toISOString().slice(0, 16)}
            required
          />

          {/* Description */}
          <TextArea
            label="Service Description"
            value={bookingData.description}
            onChange={(e) => setBookingData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the service you need..."
            rows={3}
            required
          />

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuickBookModal(false);
                setBookingData({
                  phone: '',
                  bikeId: '',
                  shopId: '',
                  serviceType: 'maintenance',
                  appointmentDate: '',
                  description: '',
                });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submittingBooking}>
              Confirm Booking
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Cancel Appointment Modal */}
      <Modal
        isOpen={cancelModal.isOpen}
        onClose={() => {
          setCancelModal({ isOpen: false, appointment: null });
          setCancellationReason('');
        }}
        title="Cancel Appointment"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel your appointment at{' '}
            <strong>{cancelModal.appointment?.shopName}</strong> on{' '}
            <strong>
              {cancelModal.appointment?.appointmentDate &&
                new Date(cancelModal.appointment.appointmentDate).toLocaleDateString()}
            </strong>
            ?
          </p>

          <TextArea
            label="Reason for cancellation (optional)"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            placeholder="Let us know why you're cancelling..."
            rows={3}
          />

          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setCancelModal({ isOpen: false, appointment: null });
                setCancellationReason('');
              }}
            >
              Keep Appointment
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelAppointment}
              loading={cancelling}
            >
              Cancel Appointment
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
