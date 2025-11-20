// Appointments page

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getUserAppointments, cancelAppointment } from '@/lib/appointments';
import { AppointmentWithDetails } from '@/types/appointment';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { TextArea } from '@/components/ui/Input';

export default function AppointmentsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState<{
    isOpen: boolean;
    appointment: AppointmentWithDetails | null;
  }>({ isOpen: false, appointment: null });
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadAppointments();
    }
  }, [user, authLoading]);

  const loadAppointments = async () => {
    if (!user) return;

    setLoading(true);
    const { appointments: userAppointments } = await getUserAppointments(user.id);
    setAppointments(userAppointments);
    setLoading(false);
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
      await loadAppointments();
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
            <Button onClick={() => router.push('/shops')}>
              Book New Appointment
            </Button>
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
