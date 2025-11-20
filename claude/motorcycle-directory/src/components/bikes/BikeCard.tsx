// Bike Card component for displaying bike information

'use client';

import React from 'react';
import { BikeWithService } from '@/types/bike';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface BikeCardProps {
  bike: BikeWithService;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function BikeCard({ bike, onView, onEdit, onDelete }: BikeCardProps) {
  const needsService = bike.nextServiceDueDate && new Date(bike.nextServiceDueDate) < new Date();

  return (
    <Card hover>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>
              {bike.year} {bike.make} {bike.model}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">{bike.licensePlate || 'No plate'}</p>
          </div>
          {bike.photoUrl && (
            <img
              src={bike.photoUrl}
              alt={`${bike.make} ${bike.model}`}
              className="w-20 h-20 rounded-lg object-cover ml-4"
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {/* Bike Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {bike.color && (
              <div>
                <span className="text-gray-600">Color:</span>
                <span className="ml-2 font-medium">{bike.color}</span>
              </div>
            )}
            {bike.engineSize && (
              <div>
                <span className="text-gray-600">Engine:</span>
                <span className="ml-2 font-medium">{bike.engineSize}cc</span>
              </div>
            )}
            {bike.currentMileage !== undefined && (
              <div>
                <span className="text-gray-600">Mileage:</span>
                <span className="ml-2 font-medium">{bike.currentMileage.toLocaleString()} km</span>
              </div>
            )}
            {bike.vin && (
              <div className="col-span-2">
                <span className="text-gray-600">VIN:</span>
                <span className="ml-2 font-medium text-xs">{bike.vin}</span>
              </div>
            )}
          </div>

          {/* Service Status */}
          <div className="pt-3 border-t border-gray-200">
            {bike.lastServiceDate ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Service:</span>
                  <span className="text-sm font-medium">
                    {new Date(bike.lastServiceDate).toLocaleDateString()}
                  </span>
                </div>
                {bike.lastServiceType && (
                  <div className="text-xs text-gray-500">
                    {bike.lastServiceType.charAt(0).toUpperCase() + bike.lastServiceType.slice(1)}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No service history</p>
            )}

            {bike.nextServiceDueDate && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-600">Next Service:</span>
                <Badge variant={needsService ? 'danger' : 'success'} size="sm">
                  {needsService ? 'Overdue' : new Date(bike.nextServiceDueDate).toLocaleDateString()}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {(onView || onEdit || onDelete) && (
        <CardFooter>
          <div className="flex gap-2 w-full">
            {onView && (
              <Button onClick={onView} variant="outline" size="sm" className="flex-1">
                View Details
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit} variant="secondary" size="sm" className="flex-1">
                Edit
              </Button>
            )}
            {onDelete && (
              <Button onClick={onDelete} variant="danger" size="sm">
                Delete
              </Button>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
