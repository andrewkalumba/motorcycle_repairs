// Bike-related TypeScript types for bike service management system

export interface Bike {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number; // BIGINT in database
  vin?: string;
  color?: string;
  engineSize?: number; // BIGINT in database (in cc)
  licensePlate?: string;
  purchaseDate?: string;
  currentMileage?: number; // BIGINT in database
  photoUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BikeRegistration {
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  engineSize?: number;
  licensePlate?: string;
  purchaseDate?: string;
  currentMileage?: number;
  photoUrl?: string;
  notes?: string;
}

export interface BikeUpdate {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  color?: string;
  engineSize?: number;
  licensePlate?: string;
  purchaseDate?: string;
  currentMileage?: number;
  photoUrl?: string;
  notes?: string;
  isActive?: boolean;
}

export interface BikeWithService {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  engineSize?: number;
  licensePlate?: string;
  purchaseDate?: string;
  currentMileage?: number;
  photoUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastServiceDate?: string;
  lastServiceType?: string;
  lastServiceMileage?: number;
  nextServiceDueDate?: string;
  nextServiceDueMileage?: number;
}

export interface BikeStats {
  bikeId: string;
  totalServices: number;
  totalSpent: number;
  averageServiceCost: number;
  lastServiceDate?: string;
  nextServiceDue?: string;
  serviceHealthScore: number; // 0-100
}

// Popular bike makes for autocomplete
export const BIKE_MAKES = [
  'Harley-Davidson',
  'Honda',
  'Yamaha',
  'Kawasaki',
  'Suzuki',
  'Ducati',
  'BMW',
  'KTM',
  'Triumph',
  'Indian',
  'Aprilia',
  'Royal Enfield',
  'Moto Guzzi',
  'Husqvarna',
  'MV Agusta',
  'Benelli',
  'Can-Am',
  'Victory',
  'Norton',
  'BSA'
] as const;

export type BikeMake = typeof BIKE_MAKES[number];

export const BIKE_COLORS = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Orange',
  'Silver',
  'Gray',
  'Gold',
  'Bronze',
  'Purple',
  'Custom/Multi-color'
] as const;

export type BikeColor = typeof BIKE_COLORS[number];
