// User-related TypeScript types for bike service management system

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserRegistration {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface UserLogin {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserProfile {
  user: User;
  totalBikes: number;
  totalServices: number;
  upcomingAppointments: number;
  memberSince: string;
}

export interface PasswordReset {
  email: string;
  resetToken?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  profileImageUrl?: string;
}
