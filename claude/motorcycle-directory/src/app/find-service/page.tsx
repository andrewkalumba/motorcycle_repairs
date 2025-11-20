// Service Finder Page - Find shops by service type and send email requests

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getUserBikes } from '@/lib/bikes';
import {
  getUserLocationWithCountry,
  COUNTRIES,
  formatDistance as formatDistanceGeo,
  type UserLocation,
} from '@/lib/geolocation';
import {
  findShopsByService,
  getShopsByServiceCategory,
  SERVICE_CATEGORIES,
  ShopWithServiceMatch,
  filterShopsWithEmail,
  formatDistance,
  generateServiceRequestEmail,
  createServiceRequest,
  type ServiceRequest,
} from '@/lib/shopFinder';
import { Bike } from '@/types/bike';
import { Button } from '@/components/ui/Button';
import { Input, Select, TextArea } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { AppointmentBookingModal } from '@/components/appointments/AppointmentBookingModal';

export default function FindServicePage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();

  // Form state
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState('');
  const [serviceCategory, setServiceCategory] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [urgency, setUrgency] = useState<'immediate' | 'within_week' | 'routine'>('routine');
  const [preferredDate, setPreferredDate] = useState('');
  const [searchRadius, setSearchRadius] = useState(50);
  const [userPhone, setUserPhone] = useState('');

  // Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');

  // Shops state
  const [shops, setShops] = useState<ShopWithServiceMatch[]>([]);
  const [selectedShopIds, setSelectedShopIds] = useState<Set<string>>(new Set());
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsError, setShopsError] = useState<string | null>(null);

  // Email preview modal
  const [emailPreviewModal, setEmailPreviewModal] = useState(false);
  const [emailPreviews, setEmailPreviews] = useState<
    Array<{ shop: ShopWithServiceMatch; email: { subject: string; body: string } }>
  >([]);
  const [sending, setSending] = useState(false);

  // Appointment booking modal
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [selectedShopForAppointment, setSelectedShopForAppointment] =
    useState<ShopWithServiceMatch | null>(null);

  // Load user's bikes
  useEffect(() => {
    if (user) {
      loadBikes();
      loadUserPhone();
    }
  }, [user]);

  const loadBikes = async () => {
    if (!user) return;
    const { bikes: userBikes } = await getUserBikes(user.id);
    setBikes(userBikes);
    if (userBikes.length > 0) {
      setSelectedBikeId(userBikes[0].id);
    }
  };

  const loadUserPhone = () => {
    if (user?.phone) {
      setUserPhone(user.phone);
    }
  };

  // Get user location with country detection
  const handleGetLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    const location = await getUserLocationWithCountry(true);

    if (location) {
      setUserLocation(location);
      setLocationError(null);

      // Set country if detected
      if (location.country) {
        setSelectedCountry(location.country);
      }
    } else {
      setLocationError(
        'Could not get your location. Please enable location services or manually select your country.'
      );
    }

    setLocationLoading(false);
  };

  // Search for shops
  const handleSearchShops = async () => {
    if (!serviceCategory) {
      alert('Please select a service type');
      return;
    }

    setShopsLoading(true);
    setShopsError(null);
    setShops([]);

    try {
      let result;

      if (userLocation) {
        // Search with location and country filtering
        result = await findShopsByService(
          userLocation.latitude,
          userLocation.longitude,
          serviceCategory,
          searchRadius,
          50,
          selectedCountry || userLocation.country
        );
      } else if (selectedCountry) {
        // Search by country without GPS location
        // This will need a different approach - for now just search all and filter by country
        result = await getShopsByServiceCategory(serviceCategory, 200);
        // Filter by country
        if (result.shops) {
          result.shops = result.shops.filter(
            (shop) =>
              shop.country &&
              shop.country.toLowerCase() === selectedCountry.toLowerCase()
          );
        }
      } else {
        // Search without location or country
        result = await getShopsByServiceCategory(serviceCategory, 50);
      }

      if (result.error) {
        setShopsError(result.error);
      } else {
        // Filter shops with email
        const shopsWithEmail = filterShopsWithEmail(result.shops);

        if (shopsWithEmail.length === 0) {
          setShopsError(
            selectedCountry
              ? `No shops found in ${selectedCountry} for this service. Try selecting a different country or expanding your search radius.`
              : 'No shops found with email addresses for this service. Try expanding your search radius.'
          );
        } else {
          setShops(shopsWithEmail);
        }
      }
    } catch (error) {
      setShopsError('Failed to search for shops. Please try again.');
    }

    setShopsLoading(false);
  };

  // Handle appointment booking
  const handleBookAppointment = (shop: ShopWithServiceMatch) => {
    setSelectedShopForAppointment(shop);
    setAppointmentModalOpen(true);
  };

  const handleAppointmentSuccess = () => {
    // Optionally refresh shops or show success message
    router.push('/appointments');
  };

  // Toggle shop selection
  const toggleShopSelection = (shopId: string) => {
    const newSelection = new Set(selectedShopIds);
    if (newSelection.has(shopId)) {
      newSelection.delete(shopId);
    } else {
      newSelection.add(shopId);
    }
    setSelectedShopIds(newSelection);
  };

  // Select all shops
  const selectAllShops = () => {
    setSelectedShopIds(new Set(shops.map((s) => s.id)));
  };

  // Deselect all shops
  const deselectAllShops = () => {
    setSelectedShopIds(new Set());
  };

  // Preview emails
  const handlePreviewEmails = () => {
    if (!user || !selectedBikeId || selectedShopIds.size === 0) {
      alert('Please select at least one shop');
      return;
    }

    if (!serviceDescription.trim()) {
      alert('Please describe the service you need');
      return;
    }

    const selectedBike = bikes.find((b) => b.id === selectedBikeId);
    if (!selectedBike) return;

    const previews = shops
      .filter((shop) => selectedShopIds.has(shop.id))
      .map((shop) => {
        const request: ServiceRequest = {
          userId: user.id,
          bikeId: selectedBikeId,
          shopIds: [shop.id],
          serviceType: SERVICE_CATEGORIES.find((c) => c.value === serviceCategory)?.label || serviceCategory,
          serviceCategory,
          description: serviceDescription,
          urgency,
          preferredDate,
          bikeMake: selectedBike.make,
          bikeModel: selectedBike.model,
          bikeYear: selectedBike.year,
          userEmail: user.email,
          userName: `${user.firstName} ${user.lastName}`,
          userPhone: userPhone || undefined,
          userLocation: userLocation
            ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
            : undefined,
        };

        return {
          shop,
          email: generateServiceRequestEmail(request, shop),
        };
      });

    setEmailPreviews(previews);
    setEmailPreviewModal(true);
  };

  // Send service requests
  const handleSendRequests = async () => {
    if (!user || !selectedBikeId) return;

    const selectedBike = bikes.find((b) => b.id === selectedBikeId);
    if (!selectedBike) return;

    setSending(true);

    // Create service request record
    const request: ServiceRequest = {
      userId: user.id,
      bikeId: selectedBikeId,
      shopIds: Array.from(selectedShopIds),
      serviceType: SERVICE_CATEGORIES.find((c) => c.value === serviceCategory)?.label || serviceCategory,
      serviceCategory,
      description: serviceDescription,
      urgency,
      preferredDate,
      bikeMake: selectedBike.make,
      bikeModel: selectedBike.model,
      bikeYear: selectedBike.year,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      userPhone: userPhone || undefined,
      userLocation: userLocation
        ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`
        : undefined,
    };

    const { requestId, error } = await createServiceRequest(request);

    if (error) {
      alert('Failed to create service request: ' + error);
      setSending(false);
      return;
    }

    // In a real application, you would send emails here
    // For now, we'll just show the email previews and allow users to copy them
    alert(
      `Service request created successfully!\n\nPlease copy the email content below and send it to the selected shops.\n\nIn a production environment, these emails would be sent automatically.`
    );

    setSending(false);
    // Keep modal open so user can copy emails
  };

  // Copy email to clipboard
  const copyEmailToClipboard = (email: { subject: string; body: string }) => {
    const emailText = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard.writeText(emailText);
    alert('Email copied to clipboard!');
  };

  if (authLoading) {
    return <Loading fullPage text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  if (bikes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏍️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No bikes registered</h2>
          <p className="text-gray-600 mb-6">
            You need to register a bike before requesting services
          </p>
          <Button onClick={() => router.push('/bikes/new')}>Add Your First Bike</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-2">Find Service & Request Quotes</h1>
          <p className="text-purple-100 text-lg">
            Find nearby shops that offer the service you need and contact multiple shops at once
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Service Request Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Service Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Bike Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Bike
                    </label>
                    <Select
                      value={selectedBikeId}
                      onChange={(e) => setSelectedBikeId(e.target.value)}
                      options={bikes.map((bike) => ({
                        value: bike.id,
                        label: `${bike.year} ${bike.make} ${bike.model}`,
                      }))}
                    />
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
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder="Describe the issue or service you need..."
                      rows={4}
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urgency
                    </label>
                    <Select
                      value={urgency}
                      onChange={(e) =>
                        setUrgency(e.target.value as 'immediate' | 'within_week' | 'routine')
                      }
                      options={[
                        { value: 'routine', label: 'Routine - Not urgent' },
                        { value: 'within_week', label: 'Within this week' },
                        { value: 'immediate', label: 'Immediate - URGENT' },
                      ]}
                    />
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Date (Optional)
                    </label>
                    <Input
                      type="date"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  {/* Location */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Location
                    </label>
                    {userLocation ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              Location detected
                            </p>
                            <p className="text-xs text-green-700">
                              Lat: {userLocation.latitude.toFixed(4)}, Lon:{' '}
                              {userLocation.longitude.toFixed(4)}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setUserLocation(null)}
                          >
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={handleGetLocation}
                        loading={locationLoading}
                      >
                        Get My Location
                      </Button>
                    )}
                    {locationError && (
                      <p className="text-sm text-red-600 mt-2">{locationError}</p>
                    )}
                  </div>

                  {/* Search Radius */}
                  {userLocation && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search Radius: {searchRadius} km
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="200"
                        step="5"
                        value={searchRadius}
                        onChange={(e) => setSearchRadius(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>5 km</span>
                        <span>200 km</span>
                      </div>
                    </div>
                  )}

                  {/* Search Button */}
                  <Button
                    fullWidth
                    onClick={handleSearchShops}
                    loading={shopsLoading}
                    disabled={!serviceCategory}
                  >
                    Find Shops
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Shop Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Available Shops
                    {shops.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({shops.length} found)
                      </span>
                    )}
                  </CardTitle>
                  {shops.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllShops}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={deselectAllShops}>
                        Deselect All
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {shopsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-800">{shopsError}</p>
                  </div>
                )}

                {shopsLoading && (
                  <div className="text-center py-12">
                    <Loading text="Searching for shops..." />
                  </div>
                )}

                {!shopsLoading && shops.length === 0 && !shopsError && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-lg font-semibold mb-2">No shops found yet</p>
                    <p className="text-sm">
                      Select a service type and click "Find Shops" to search
                    </p>
                  </div>
                )}

                {shops.length > 0 && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {shops.map((shop) => (
                      <div
                        key={shop.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedShopIds.has(shop.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => toggleShopSelection(shop.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="checkbox"
                                checked={selectedShopIds.has(shop.id)}
                                onChange={() => toggleShopSelection(shop.id)}
                                className="h-4 w-4 text-indigo-600 rounded"
                              />
                              <h3 className="font-bold text-gray-900">{shop.name}</h3>
                            </div>
                            <p className="text-sm text-gray-600">{shop.address}</p>
                            <p className="text-sm text-gray-600">
                              {shop.city}, {shop.country}
                            </p>
                            {shop.phone && (
                              <p className="text-sm text-gray-600">Phone: {shop.phone}</p>
                            )}
                            {shop.email && (
                              <p className="text-sm text-gray-600">Email: {shop.email}</p>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            {shop.distance !== undefined && (
                              <Badge variant="info" size="sm">
                                {formatDistance(shop.distance)}
                              </Badge>
                            )}
                            {shop.rating && (
                              <div className="text-sm text-yellow-600">
                                ⭐ {shop.rating.toFixed(1)}
                              </div>
                            )}
                            {shop.offersService && (
                              <Badge variant="success" size="sm">
                                Offers Service
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {shops.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        {selectedShopIds.size} shop{selectedShopIds.size !== 1 ? 's' : ''}{' '}
                        selected
                      </p>
                      <Button
                        onClick={handlePreviewEmails}
                        disabled={selectedShopIds.size === 0 || !serviceDescription.trim()}
                      >
                        Preview Email Requests
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      <Modal
        isOpen={emailPreviewModal}
        onClose={() => setEmailPreviewModal(false)}
        title="Email Request Preview"
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {emailPreviews.map((preview, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900">{preview.shop.name}</h3>
                  <p className="text-sm text-gray-600">{preview.shop.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyEmailToClipboard(preview.email)}
                >
                  Copy Email
                </Button>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div>
                  <p className="text-xs font-semibold text-gray-700">Subject:</p>
                  <p className="text-sm text-gray-900">{preview.email.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Message:</p>
                  <pre className="text-sm text-gray-900 whitespace-pre-wrap font-sans">
                    {preview.email.body}
                  </pre>
                </div>
              </div>

              {index === 0 && (
                <div className="mt-3 text-center">
                  <a
                    href={`mailto:${preview.shop.email}?subject=${encodeURIComponent(
                      preview.email.subject
                    )}&body=${encodeURIComponent(preview.email.body)}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Open in email client
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <ModalFooter>
          <div className="text-sm text-gray-600 text-center mb-4 w-full">
            Copy the email content above and send it to your selected shops via email.
            <br />
            In production, these would be sent automatically.
          </div>
          <Button variant="secondary" onClick={() => setEmailPreviewModal(false)}>
            Close
          </Button>
          <Button onClick={handleSendRequests} loading={sending}>
            Save Request Record
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
