// Appointment and booking utilities

import { supabase } from './supabase';
import {
  Appointment,
  AppointmentCreate,
  AppointmentUpdate,
  AppointmentWithDetails,
  UpcomingAppointment,
} from '@/types/appointment';

/**
 * Get all appointments for a user
 */
export async function getUserAppointments(userId: string): Promise<{ appointments: AppointmentWithDetails[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        bikes (
          make,
          model,
          year
        ),
        motorcycle_repairs (
          name,
          address,
          phone,
          city,
          rating
        )
      `)
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false });

    if (error) {
      return { appointments: [], error: error.message };
    }

    const appointments: AppointmentWithDetails[] = (data || []).map(appt => ({
      id: appt.id,
      userId: appt.user_id,
      bikeId: appt.bike_id,
      shopId: appt.shop_id,
      appointmentDate: appt.appointment_date,
      status: appt.status,
      serviceType: appt.service_type,
      serviceCategory: appt.service_category,
      description: appt.description,
      urgency: appt.urgency,
      estimatedCost: appt.estimated_cost,
      actualCost: appt.actual_cost,
      notes: appt.notes,
      createdAt: appt.created_at,
      updatedAt: appt.updated_at,
      cancelledAt: appt.cancelled_at,
      cancellationReason: appt.cancellation_reason,
      bikeMake: appt.bikes.make,
      bikeModel: appt.bikes.model,
      bikeYear: appt.bikes.year,
      shopName: appt.motorcycle_repairs.name,
      shopAddress: appt.motorcycle_repairs.address,
      shopPhone: appt.motorcycle_repairs.phone,
      shopCity: appt.motorcycle_repairs.city,
      shopRating: appt.motorcycle_repairs.rating,
    }));

    return { appointments, error: null };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return { appointments: [], error: 'Failed to fetch appointments' };
  }
}

/**
 * Get upcoming appointments
 */
export async function getUpcomingAppointments(userId: string): Promise<{ appointments: UpcomingAppointment[]; error: string | null }> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('upcoming_appointments')
      .select('*')
      .eq('user_id', userId)
      .gte('appointment_date', now)
      .in('status', ['pending', 'confirmed'])
      .order('appointment_date', { ascending: true })
      .limit(10);

    if (error) {
      return { appointments: [], error: error.message };
    }

    const appointments: UpcomingAppointment[] = (data || []).map(appt => {
      const appointmentDate = new Date(appt.appointment_date);
      const today = new Date();
      const daysUntil = Math.ceil((appointmentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: appt.id,
        appointmentDate: appt.appointment_date,
        shopName: appt.shop_name,
        shopAddress: appt.shop_address,
        bikeMake: appt.bike_make,
        bikeModel: appt.bike_model,
        serviceType: appt.service_type,
        status: appt.status,
        daysUntil,
      };
    });

    return { appointments, error: null };
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return { appointments: [], error: 'Failed to fetch upcoming appointments' };
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(appointmentId: string, userId: string): Promise<{ appointment: AppointmentWithDetails | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        bikes (
          make,
          model,
          year
        ),
        motorcycle_repairs (
          name,
          address,
          phone,
          city,
          rating
        )
      `)
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return { appointment: null, error: error.message };
    }

    if (!data) {
      return { appointment: null, error: 'Appointment not found' };
    }

    const appointment: AppointmentWithDetails = {
      id: data.id,
      userId: data.user_id,
      bikeId: data.bike_id,
      shopId: data.shop_id,
      appointmentDate: data.appointment_date,
      status: data.status,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      description: data.description,
      urgency: data.urgency,
      estimatedCost: data.estimated_cost,
      actualCost: data.actual_cost,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      cancelledAt: data.cancelled_at,
      cancellationReason: data.cancellation_reason,
      bikeMake: data.bikes.make,
      bikeModel: data.bikes.model,
      bikeYear: data.bikes.year,
      shopName: data.motorcycle_repairs.name,
      shopAddress: data.motorcycle_repairs.address,
      shopPhone: data.motorcycle_repairs.phone,
      shopCity: data.motorcycle_repairs.city,
      shopRating: data.motorcycle_repairs.rating,
    };

    return { appointment, error: null };
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return { appointment: null, error: 'Failed to fetch appointment' };
  }
}

/**
 * Create appointment
 */
export async function createAppointment(userId: string, appointmentData: AppointmentCreate): Promise<{ appointment: Appointment | null; error: string | null }> {
  try {
    // Validate appointment date is in the future
    const appointmentDate = new Date(appointmentData.appointmentDate);
    if (appointmentDate < new Date()) {
      return { appointment: null, error: 'Appointment date must be in the future' };
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        user_id: userId,
        bike_id: appointmentData.bikeId,
        shop_id: appointmentData.shopId,
        appointment_date: appointmentData.appointmentDate,
        service_type: appointmentData.serviceType,
        service_category: appointmentData.serviceCategory,
        description: appointmentData.description,
        urgency: appointmentData.urgency,
        estimated_cost: appointmentData.estimatedCost,
        notes: appointmentData.notes,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) {
      return { appointment: null, error: error.message };
    }

    const appointment: Appointment = {
      id: data.id,
      userId: data.user_id,
      bikeId: data.bike_id,
      shopId: data.shop_id,
      appointmentDate: data.appointment_date,
      status: data.status,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      description: data.description,
      urgency: data.urgency,
      estimatedCost: data.estimated_cost,
      actualCost: data.actual_cost,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      cancelledAt: data.cancelled_at,
      cancellationReason: data.cancellation_reason,
    };

    return { appointment, error: null };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return { appointment: null, error: 'Failed to create appointment' };
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(appointmentId: string, userId: string, updates: AppointmentUpdate): Promise<{ appointment: Appointment | null; error: string | null }> {
  try {
    const updateData: any = {};

    if (updates.appointmentDate !== undefined) updateData.appointment_date = updates.appointmentDate;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.serviceType !== undefined) updateData.service_type = updates.serviceType;
    if (updates.serviceCategory !== undefined) updateData.service_category = updates.serviceCategory;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.urgency !== undefined) updateData.urgency = updates.urgency;
    if (updates.estimatedCost !== undefined) updateData.estimated_cost = updates.estimatedCost;
    if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.cancellationReason !== undefined) updateData.cancellation_reason = updates.cancellationReason;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { appointment: null, error: error.message };
    }

    const appointment: Appointment = {
      id: data.id,
      userId: data.user_id,
      bikeId: data.bike_id,
      shopId: data.shop_id,
      appointmentDate: data.appointment_date,
      status: data.status,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      description: data.description,
      urgency: data.urgency,
      estimatedCost: data.estimated_cost,
      actualCost: data.actual_cost,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      cancelledAt: data.cancelled_at,
      cancellationReason: data.cancellation_reason,
    };

    return { appointment, error: null };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { appointment: null, error: 'Failed to update appointment' };
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(appointmentId: string, userId: string, reason?: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
      })
      .eq('id', appointmentId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return { error: 'Failed to cancel appointment' };
  }
}

/**
 * Confirm appointment
 */
export async function confirmAppointment(appointmentId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointmentId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return { error: 'Failed to confirm appointment' };
  }
}

/**
 * Complete appointment
 */
export async function completeAppointment(appointmentId: string, userId: string, actualCost?: number): Promise<{ error: string | null }> {
  try {
    const updateData: any = { status: 'completed' };
    if (actualCost !== undefined) {
      updateData.actual_cost = actualCost;
    }

    const { error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error completing appointment:', error);
    return { error: 'Failed to complete appointment' };
  }
}
