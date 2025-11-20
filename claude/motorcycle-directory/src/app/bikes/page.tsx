// Bikes list page

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/contexts/AuthContext';
import { getUserBikesWithService, deleteBike } from '@/lib/bikes';
import { BikeWithService } from '@/types/bike';
import { BikeCard } from '@/components/bikes/BikeCard';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';

export default function BikesPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const router = useRouter();
  const [bikes, setBikes] = useState<BikeWithService[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; bike: BikeWithService | null }>({
    isOpen: false,
    bike: null,
  });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadBikes();
    }
  }, [user, authLoading]);

  const loadBikes = async () => {
    if (!user) return;

    setLoading(true);
    const { bikes: userBikes } = await getUserBikesWithService(user.id);
    setBikes(userBikes);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!user || !deleteModal.bike) return;

    setDeleting(true);
    const { error } = await deleteBike(deleteModal.bike.id, user.id);

    if (error) {
      alert('Failed to delete bike: ' + error);
    } else {
      await loadBikes();
      setDeleteModal({ isOpen: false, bike: null });
    }
    setDeleting(false);
  };

  if (authLoading || loading) {
    return <Loading fullPage text="Loading your bikes..." />;
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
              <h1 className="text-3xl font-bold text-gray-900">My Bikes</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your motorcycle collection
              </p>
            </div>
            <Button onClick={() => router.push('/bikes/new')}>
              Add New Bike
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {bikes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏍️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No bikes yet</h2>
            <p className="text-gray-600 mb-6">
              Add your first bike to start tracking service history and appointments
            </p>
            <Button onClick={() => router.push('/bikes/new')}>
              Add Your First Bike
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map((bike) => (
              <BikeCard
                key={bike.id}
                bike={bike}
                onView={() => router.push(`/bikes/${bike.id}`)}
                onEdit={() => router.push(`/bikes/${bike.id}/edit`)}
                onDelete={() => setDeleteModal({ isOpen: true, bike })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, bike: null })}
        title="Delete Bike"
        size="sm"
      >
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete{' '}
          <strong>
            {deleteModal.bike?.year} {deleteModal.bike?.make} {deleteModal.bike?.model}
          </strong>
          ? This action cannot be undone.
        </p>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setDeleteModal({ isOpen: false, bike: null })}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Bike
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
