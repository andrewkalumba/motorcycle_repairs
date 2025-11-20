// Appointment and booking related TypeScript types

import { ServiceCategory, ServiceType } from './service';

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type UrgencyLevel = 'immediate' | 'within_week' | 'routine';

export interface Appointment {
  id: string;
  userId: string;
  bikeId: string;
  shopId: string; // UUID in database
  appointmentDate: string;
  status: AppointmentStatus;
  serviceType: ServiceType;
  serviceCategory?: ServiceCategory;
  description?: string;
  urgency: UrgencyLevel;
  estimatedCost?: number; // FLOAT8 in database
  actualCost?: number; // FLOAT8 in database
  notes?: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface AppointmentCreate {
  bikeId: string;
  shopId: string; // UUID in database
  appointmentDate: string;
  serviceType: ServiceType;
  serviceCategory?: ServiceCategory;
  description?: string;
  urgency: UrgencyLevel;
  estimatedCost?: number; // FLOAT8 in database
  notes?: string;
}

export interface AppointmentUpdate {
  appointmentDate?: string;
  status?: AppointmentStatus;
  serviceType?: ServiceType;
  serviceCategory?: ServiceCategory;
  description?: string;
  urgency?: UrgencyLevel;
  estimatedCost?: number; // FLOAT8 in database
  actualCost?: number; // FLOAT8 in database
  notes?: string;
  cancellationReason?: string;
}

export interface AppointmentWithDetails extends Appointment {
  bikeMake: string;
  bikeModel: string;
  bikeYear: number; // BIGINT in database
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  shopCity: string;
  shopRating?: number; // FLOAT8 in database
}

export interface UpcomingAppointment {
  id: string;
  appointmentDate: string;
  shopName: string;
  shopAddress: string;
  bikeMake: string;
  bikeModel: string;
  serviceType: ServiceType;
  status: AppointmentStatus;
  daysUntil: number;
}

// Booking form data
export interface BookingFormData {
  bikeId: string;
  shopId: string; // UUID in database
  preferredDate: string;
  preferredTime: string;
  serviceType: ServiceType;
  serviceCategory?: ServiceCategory;
  urgency: UrgencyLevel;
  description: string;
  contactPhone: string;
  contactEmail: string;
  notes?: string;
}

// Shop availability
export interface ShopAvailability {
  shopId: string; // UUID in database
  availableDates: string[];
  availableTimeSlots: TimeSlot[];
  blackoutDates: string[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  isBooked?: boolean;
}

// Common time slots for bookings
export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00'
] as const;

export type TimeSlotValue = typeof TIME_SLOTS[number];
