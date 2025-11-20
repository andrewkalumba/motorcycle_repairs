'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getUserBikesWithService } from '@/lib/bikes';
import { getUpcomingAppointments } from '@/lib/appointments';
import { getUserReminders } from '@/lib/services';
import { BikeWithService } from '@/types/bike';
import { UpcomingAppointment } from '@/types/appointment';
import { MaintenanceReminderWithBike } from '@/types/service';

export default function DashboardPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [bikes, setBikes] = useState<BikeWithService[]>([]);
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [reminders, setReminders] = useState<MaintenanceReminderWithBike[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    if (!user) return;

    setLoading(true);

    // Load bikes
    const { bikes: userBikes } = await getUserBikesWithService(user.id);
    setBikes(userBikes);

    // Load upcoming appointments
    const { appointments: upcomingAppts } = await getUpcomingAppointments(user.id);
    setAppointments(upcomingAppts);

    // Load reminders
    const { reminders: activeReminders } = await getUserReminders(user.id);
    setReminders(activeReminders);

    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white">
          <div className="animate-pulse text-center">
            <div className="text-4xl mb-4">🏍️</div>
            <p className="text-xl">Loading your dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏍️</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-sm text-gray-300">Welcome back, {user.firstName}!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Browse Shops
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Profile
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Total Bikes</p>
                <p className="text-3xl font-bold text-indigo-600">{bikes.length}</p>
              </div>
              <div className="text-4xl">🏍️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Upcoming</p>
                <p className="text-3xl font-bold text-purple-600">{appointments.length}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Reminders</p>
                <p className="text-3xl font-bold text-pink-600">{reminders.length}</p>
              </div>
              <div className="text-4xl">🔔</div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Services</p>
                <p className="text-3xl font-bold text-green-600">
                  {bikes.reduce((sum, bike) => sum + (bike.lastServiceDate ? 1 : 0), 0)}
                </p>
              </div>
              <div className="text-4xl">🔧</div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Your Bikes */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Your Bikes</h2>
                <button
                  onClick={() => router.push('/bikes/new')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-semibold"
                >
                  + Add Bike
                </button>
              </div>
            </div>
            <div className="p-6">
              {bikes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🏍️</div>
                  <p className="text-lg font-semibold mb-2">No bikes yet</p>
                  <p className="text-sm">Add your first bike to start tracking services</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bikes.map((bike) => (
                    <div
                      key={bike.id}
                      onClick={() => router.push(`/bikes/${bike.id}`)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl">
                          🏍️
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">
                            {bike.make} {bike.model}
                          </h3>
                          <p className="text-sm text-gray-600">Year: {bike.year}</p>
                          {bike.currentMileage && (
                            <p className="text-sm text-gray-600">Mileage: {bike.currentMileage.toLocaleString()} miles</p>
                          )}
                          {bike.lastServiceDate && (
                            <p className="text-xs text-green-600 mt-1">
                              Last service: {new Date(bike.lastServiceDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Upcoming Appointments</h2>
                <button
                  onClick={() => router.push('/appointments/new')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all text-sm font-semibold"
                >
                  + Book
                </button>
              </div>
            </div>
            <div className="p-6">
              {appointments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-lg font-semibold mb-2">No upcoming appointments</p>
                  <p className="text-sm">Book a service appointment at a repair shop</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => router.push(`/appointments/${appt.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-gray-800">{appt.shopName}</h3>
                          <p className="text-sm text-gray-600">{appt.bikeMake} {appt.bikeModel}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(appt.appointmentDate).toLocaleDateString()} at{' '}
                            {new Date(appt.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            appt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {appt.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {appt.daysUntil === 0 ? 'Today' :
                             appt.daysUntil === 1 ? 'Tomorrow' :
                             `In ${appt.daysUntil} days`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Maintenance Reminders */}
        {reminders.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Maintenance Reminders</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className="border-l-4 border-pink-500 bg-pink-50 p-4 rounded-r-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800">{reminder.description}</h3>
                        <p className="text-sm text-gray-600">
                          {reminder.bikeMake} {reminder.bikeModel} ({reminder.bikeYear})
                        </p>
                        {reminder.dueDate && (
                          <p className="text-sm text-gray-600 mt-1">
                            Due: {new Date(reminder.dueDate).toLocaleDateString()}
                          </p>
                        )}
                        {reminder.dueMileage && (
                          <p className="text-sm text-gray-600">
                            Due at: {reminder.dueMileage.toLocaleString()} miles
                          </p>
                        )}
                      </div>
                      <div className="text-2xl">🔔</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
