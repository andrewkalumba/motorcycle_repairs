// Service and maintenance related TypeScript types

export type ServiceType = 'repair' | 'maintenance' | 'inspection' | 'customization';
export type ServiceCategory =
  | 'brake'
  | 'tire'
  | 'engine'
  | 'electrical'
  | 'chain'
  | 'oil_change'
  | 'suspension'
  | 'carburetor'
  | 'fuel_system'
  | 'exhaust'
  | 'cooling_system'
  | 'transmission'
  | 'clutch'
  | 'battery'
  | 'lights'
  | 'body_work'
  | 'paint'
  | 'other';

export interface ServiceHistory {
  id: string;
  bikeId: string;
  userId: string;
  shopId?: string; // UUID in database
  serviceDate: string;
  serviceType: ServiceType;
  serviceCategory?: ServiceCategory;
  description: string;
  cost?: number; // FLOAT8 in database
  mileageAtService?: number; // BIGINT in database
  nextServiceDueMileage?: number; // BIGINT in database
  nextServiceDueDate?: string;
  partsReplaced?: string[];
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceHistoryCreate {
  bikeId: string;
  shopId?: string; // UUID in database
  serviceDate: string;
  serviceType: ServiceType;
  serviceCategory?: ServiceCategory;
  description: string;
  cost?: number; // FLOAT8 in database
  mileageAtService?: number; // BIGINT in database
  nextServiceDueMileage?: number; // BIGINT in database
  nextServiceDueDate?: string;
  partsReplaced?: string[];
  receiptUrl?: string;
  notes?: string;
}

export interface ServiceHistoryWithShop extends ServiceHistory {
  shopName?: string;
  shopAddress?: string;
  shopCity?: string;
  shopPhone?: string;
}

export interface MaintenanceReminder {
  id: string;
  bikeId: string;
  userId: string;
  reminderType: 'mileage' | 'date' | 'both';
  serviceCategory: ServiceCategory;
  description: string;
  dueMileage?: number; // BIGINT in database
  dueDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceReminderCreate {
  bikeId: string;
  reminderType: 'mileage' | 'date' | 'both';
  serviceCategory: ServiceCategory;
  description: string;
  dueMileage?: number; // BIGINT in database
  dueDate?: string;
}

export interface MaintenanceReminderWithBike extends MaintenanceReminder {
  bikeMake: string;
  bikeModel: string;
  bikeYear: number; // BIGINT in database
  bikeCurrentMileage?: number; // BIGINT in database
}

// Service categories with descriptions
export const SERVICE_CATEGORIES: Record<ServiceCategory, string> = {
  brake: 'Brake System',
  tire: 'Tire Service',
  engine: 'Engine Work',
  electrical: 'Electrical System',
  chain: 'Chain & Sprockets',
  oil_change: 'Oil Change',
  suspension: 'Suspension',
  carburetor: 'Carburetor',
  fuel_system: 'Fuel System',
  exhaust: 'Exhaust System',
  cooling_system: 'Cooling System',
  transmission: 'Transmission',
  clutch: 'Clutch',
  battery: 'Battery',
  lights: 'Lights & Signals',
  body_work: 'Body Work',
  paint: 'Paint & Finish',
  other: 'Other Services'
};

// Common maintenance intervals (in miles)
export const MAINTENANCE_INTERVALS = {
  oil_change: 3000,
  tire_rotation: 5000,
  brake_inspection: 6000,
  chain_adjustment: 500,
  air_filter: 12000,
  spark_plugs: 8000,
  coolant_change: 24000,
  brake_fluid: 24000,
  fork_oil: 12000
} as const;

// Service timeline entry for history display
export interface ServiceTimelineEntry {
  id: string;
  date: string;
  type: 'service' | 'reminder' | 'appointment';
  title: string;
  description: string;
  cost?: number; // FLOAT8 in database
  shopName?: string;
  category?: ServiceCategory;
  status?: string;
}
