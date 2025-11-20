// Bike management utilities

import { supabase } from './supabase';
import { Bike, BikeRegistration, BikeUpdate, BikeWithService } from '@/types/bike';

/**
 * Get all bikes for a user
 */
export async function getUserBikes(userId: string): Promise<{ bikes: Bike[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { bikes: [], error: error.message };
    }

    const bikes: Bike[] = (data || []).map(bike => ({
      id: bike.id,
      userId: bike.user_id,
      make: bike.make,
      model: bike.model,
      year: bike.year,
      vin: bike.vin,
      color: bike.color,
      engineSize: bike.engine_size,
      licensePlate: bike.license_plate,
      purchaseDate: bike.purchase_date,
      currentMileage: bike.current_mileage,
      photoUrl: bike.photo_url,
      notes: bike.notes,
      isActive: bike.is_active,
      createdAt: bike.created_at,
      updatedAt: bike.updated_at,
    }));

    return { bikes, error: null };
  } catch (error) {
    console.error('Error fetching bikes:', error);
    return { bikes: [], error: 'Failed to fetch bikes' };
  }
}

/**
 * Get bikes with service information
 */
export async function getUserBikesWithService(userId: string): Promise<{ bikes: BikeWithService[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bikes_with_latest_service')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return { bikes: [], error: error.message };
    }

    const bikes: BikeWithService[] = (data || []).map(bike => ({
      id: bike.id,
      userId: bike.user_id,
      make: bike.make,
      model: bike.model,
      year: bike.year,
      vin: bike.vin,
      color: bike.color,
      engineSize: bike.engine_size,
      licensePlate: bike.license_plate,
      purchaseDate: bike.purchase_date,
      currentMileage: bike.current_mileage,
      photoUrl: bike.photo_url,
      notes: bike.notes,
      isActive: bike.is_active,
      createdAt: bike.created_at,
      updatedAt: bike.updated_at,
      lastServiceDate: bike.last_service_date,
      lastServiceType: bike.last_service_type,
      lastServiceMileage: bike.last_service_mileage,
      nextServiceDueDate: bike.next_service_due_date,
      nextServiceDueMileage: bike.next_service_due_mileage,
    }));

    return { bikes, error: null };
  } catch (error) {
    console.error('Error fetching bikes with service:', error);
    return { bikes: [], error: 'Failed to fetch bikes' };
  }
}

/**
 * Get a single bike by ID
 */
export async function getBikeById(bikeId: string, userId: string): Promise<{ bike: Bike | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('bikes')
      .select('*')
      .eq('id', bikeId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { bike: null, error: error.message };
    }

    if (!data) {
      return { bike: null, error: 'Bike not found' };
    }

    const bike: Bike = {
      id: data.id,
      userId: data.user_id,
      make: data.make,
      model: data.model,
      year: data.year,
      vin: data.vin,
      color: data.color,
      engineSize: data.engine_size,
      licensePlate: data.license_plate,
      purchaseDate: data.purchase_date,
      currentMileage: data.current_mileage,
      photoUrl: data.photo_url,
      notes: data.notes,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { bike, error: null };
  } catch (error) {
    console.error('Error fetching bike:', error);
    return { bike: null, error: 'Failed to fetch bike' };
  }
}

/**
 * Register a new bike
 */
export async function registerBike(userId: string, bikeData: BikeRegistration): Promise<{ bike: Bike | null; error: string | null }> {
  try {
    // Validate required fields
    if (!bikeData.make || !bikeData.model || !bikeData.year) {
      return { bike: null, error: 'Make, model, and year are required' };
    }

    if (bikeData.year < 1900 || bikeData.year > new Date().getFullYear() + 1) {
      return { bike: null, error: 'Invalid year' };
    }

    const { data, error } = await supabase
      .from('bikes')
      .insert([{
        user_id: userId,
        make: bikeData.make,
        model: bikeData.model,
        year: bikeData.year,
        vin: bikeData.vin,
        color: bikeData.color,
        engine_size: bikeData.engineSize,
        license_plate: bikeData.licensePlate,
        purchase_date: bikeData.purchaseDate,
        current_mileage: bikeData.currentMileage,
        photo_url: bikeData.photoUrl,
        notes: bikeData.notes,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      return { bike: null, error: error.message };
    }

    const bike: Bike = {
      id: data.id,
      userId: data.user_id,
      make: data.make,
      model: data.model,
      year: data.year,
      vin: data.vin,
      color: data.color,
      engineSize: data.engine_size,
      licensePlate: data.license_plate,
      purchaseDate: data.purchase_date,
      currentMileage: data.current_mileage,
      photoUrl: data.photo_url,
      notes: data.notes,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { bike, error: null };
  } catch (error) {
    console.error('Error registering bike:', error);
    return { bike: null, error: 'Failed to register bike' };
  }
}

/**
 * Update a bike
 */
export async function updateBike(bikeId: string, userId: string, updates: BikeUpdate): Promise<{ bike: Bike | null; error: string | null }> {
  try {
    const updateData: any = {};

    if (updates.make !== undefined) updateData.make = updates.make;
    if (updates.model !== undefined) updateData.model = updates.model;
    if (updates.year !== undefined) updateData.year = updates.year;
    if (updates.vin !== undefined) updateData.vin = updates.vin;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.engineSize !== undefined) updateData.engine_size = updates.engineSize;
    if (updates.licensePlate !== undefined) updateData.license_plate = updates.licensePlate;
    if (updates.purchaseDate !== undefined) updateData.purchase_date = updates.purchaseDate;
    if (updates.currentMileage !== undefined) updateData.current_mileage = updates.currentMileage;
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('bikes')
      .update(updateData)
      .eq('id', bikeId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { bike: null, error: error.message };
    }

    const bike: Bike = {
      id: data.id,
      userId: data.user_id,
      make: data.make,
      model: data.model,
      year: data.year,
      vin: data.vin,
      color: data.color,
      engineSize: data.engine_size,
      licensePlate: data.license_plate,
      purchaseDate: data.purchase_date,
      currentMileage: data.current_mileage,
      photoUrl: data.photo_url,
      notes: data.notes,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { bike, error: null };
  } catch (error) {
    console.error('Error updating bike:', error);
    return { bike: null, error: 'Failed to update bike' };
  }
}

/**
 * Delete a bike (soft delete)
 */
export async function deleteBike(bikeId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('bikes')
      .update({ is_active: false })
      .eq('id', bikeId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting bike:', error);
    return { error: 'Failed to delete bike' };
  }
}

/**
 * Upload bike photo
 */
export async function uploadBikePhoto(file: File, bikeId: string): Promise<{ url: string | null; error: string | null }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${bikeId}-${Date.now()}.${fileExt}`;
    const filePath = `bike-photos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('bikes')
      .upload(filePath, file);

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data } = supabase.storage
      .from('bikes')
      .getPublicUrl(filePath);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { url: null, error: 'Failed to upload photo' };
  }
}
