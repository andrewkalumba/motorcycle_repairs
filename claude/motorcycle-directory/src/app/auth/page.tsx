'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

export default function AuthPage() {
  const [showLogin, setShowLogin] = useState(true);
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block bg-white/10 backdrop-blur-md rounded-full px-6 py-3 mb-6">
            <span className="text-6xl">🏍️</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            EU Motorcycle Directory
          </h1>
          <p className="text-xl text-gray-200">
            Manage your bikes, track service history, and find trusted repair shops
          </p>
        </div>

        {/* Auth Forms */}
        <div className="mt-8">
          {showLogin ? (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToRegister={() => setShowLogin(false)}
            />
          ) : (
            <RegisterForm
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setShowLogin(true)}
            />
          )}
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🏍️</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Your Bikes</h3>
            <p className="text-gray-200">
              Keep track of all your motorcycles with photos, specs, and maintenance records
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-white mb-2">Service History</h3>
            <p className="text-gray-200">
              Track all repairs and maintenance with receipts, costs, and reminders
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-white mb-2">Book Appointments</h3>
            <p className="text-gray-200">
              Find nearby repair shops, read reviews, and schedule service appointments
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
