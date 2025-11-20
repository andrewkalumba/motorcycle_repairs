// Authentication utilities using Supabase Auth

import { supabase } from './supabase';
import { User, UserLogin, UserRegistration } from '@/types/user';

/**
 * Register a new user
 */
export async function registerUser(userData: UserRegistration): Promise<{ user: User | null; error: string | null }> {
  try {
    // Validate password match
    if (userData.password !== userData.confirmPassword) {
      return { user: null, error: 'Passwords do not match' };
    }

    // Validate password strength
    if (userData.password.length < 8) {
      return { user: null, error: 'Password must be at least 8 characters long' };
    }

    // Register with Supabase Auth
    // The trigger will automatically create the profile in the users table
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone || '',
          address: userData.address || '',
          city: userData.city || '',
          country: userData.country || '',
          postal_code: userData.postalCode || '',
        }
      }
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Registration failed' };
    }

    // Wait a moment for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the profile with additional data if trigger only created basic profile
    const updateData: any = {};
    if (userData.phone) updateData.phone = userData.phone;
    if (userData.address) updateData.address = userData.address;
    if (userData.city) updateData.city = userData.city;
    if (userData.country) updateData.country = userData.country;
    if (userData.postalCode) updateData.postal_code = userData.postalCode;

    // Only update if there's additional data
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Don't fail registration if update fails - profile was still created
      }
    }

    // Fetch the complete user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      console.error('Profile fetch error:', profileError);
      return { user: null, error: 'Registration succeeded but failed to fetch profile. Please try logging in.' };
    }

    return {
      user: {
        id: profileData.id,
        email: profileData.email,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        country: profileData.country,
        postalCode: profileData.postal_code,
        profileImageUrl: profileData.profile_image_url,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
        lastLogin: profileData.last_login,
        isActive: profileData.is_active,
      },
      error: null
    };
  } catch (error) {
    console.error('Registration error:', error);
    return { user: null, error: 'An unexpected error occurred during registration' };
  }
}

/**
 * Login user
 */
export async function loginUser(credentials: UserLogin): Promise<{ user: User | null; error: string | null }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'Login failed' };
    }

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', authData.user.id);

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profileData) {
      return { user: null, error: 'Failed to fetch user profile' };
    }

    return {
      user: {
        id: profileData.id,
        email: profileData.email,
        firstName: profileData.first_name,
        lastName: profileData.last_name,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        country: profileData.country,
        postalCode: profileData.postal_code,
        profileImageUrl: profileData.profile_image_url,
        createdAt: profileData.created_at,
        updatedAt: profileData.updated_at,
        lastLogin: profileData.last_login,
        isActive: profileData.is_active,
      },
      error: null
    };
  } catch (error) {
    console.error('Login error:', error);
    return { user: null, error: 'An unexpected error occurred during login' };
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (error) {
    console.error('Logout error:', error);
    return { error: 'An unexpected error occurred during logout' };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return null;
    }

    const { data: profileData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (error || !profileData) {
      return null;
    }

    return {
      id: profileData.id,
      email: profileData.email,
      firstName: profileData.first_name,
      lastName: profileData.last_name,
      phone: profileData.phone,
      address: profileData.address,
      city: profileData.city,
      country: profileData.country,
      postalCode: profileData.postal_code,
      profileImageUrl: profileData.profile_image_url,
      createdAt: profileData.created_at,
      updatedAt: profileData.updated_at,
      lastLogin: profileData.last_login,
      isActive: profileData.is_active,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Reset password
 */
export async function resetPassword(email: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
  try {
    if (newPassword.length < 8) {
      return { error: 'Password must be at least 8 characters long' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Update password error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
