// Service history and maintenance utilities

import { supabase } from './supabase';
import {
  ServiceHistory,
  ServiceHistoryCreate,
  ServiceHistoryWithShop,
  MaintenanceReminder,
  MaintenanceReminderCreate,
  MaintenanceReminderWithBike,
  ServiceTimelineEntry
} from '@/types/service';

/**
 * Get service history for a bike
 */
export async function getBikeServiceHistory(bikeId: string): Promise<{ services: ServiceHistoryWithShop[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('service_history')
      .select(`
        *,
        motorcycle_repairs (
          name,
          address,
          city,
          phone
        )
      `)
      .eq('bike_id', bikeId)
      .order('service_date', { ascending: false });

    if (error) {
      return { services: [], error: error.message };
    }

    const services: ServiceHistoryWithShop[] = (data || []).map(service => ({
      id: service.id,
      bikeId: service.bike_id,
      userId: service.user_id,
      shopId: service.shop_id,
      serviceDate: service.service_date,
      serviceType: service.service_type,
      serviceCategory: service.service_category,
      description: service.description,
      cost: service.cost,
      mileageAtService: service.mileage_at_service,
      nextServiceDueMileage: service.next_service_due_mileage,
      nextServiceDueDate: service.next_service_due_date,
      partsReplaced: service.parts_replaced,
      receiptUrl: service.receipt_url,
      notes: service.notes,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
      shopName: service.motorcycle_repairs?.name,
      shopAddress: service.motorcycle_repairs?.address,
      shopCity: service.motorcycle_repairs?.city,
      shopPhone: service.motorcycle_repairs?.phone,
    }));

    return { services, error: null };
  } catch (error) {
    console.error('Error fetching service history:', error);
    return { services: [], error: 'Failed to fetch service history' };
  }
}

/**
 * Get all service history for a user
 */
export async function getUserServiceHistory(userId: string): Promise<{ services: ServiceHistoryWithShop[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('service_history')
      .select(`
        *,
        motorcycle_repairs (
          name,
          address,
          city,
          phone
        ),
        bikes (
          make,
          model,
          year
        )
      `)
      .eq('user_id', userId)
      .order('service_date', { ascending: false });

    if (error) {
      return { services: [], error: error.message };
    }

    const services: ServiceHistoryWithShop[] = (data || []).map(service => ({
      id: service.id,
      bikeId: service.bike_id,
      userId: service.user_id,
      shopId: service.shop_id,
      serviceDate: service.service_date,
      serviceType: service.service_type,
      serviceCategory: service.service_category,
      description: service.description,
      cost: service.cost,
      mileageAtService: service.mileage_at_service,
      nextServiceDueMileage: service.next_service_due_mileage,
      nextServiceDueDate: service.next_service_due_date,
      partsReplaced: service.parts_replaced,
      receiptUrl: service.receipt_url,
      notes: service.notes,
      createdAt: service.created_at,
      updatedAt: service.updated_at,
      shopName: service.motorcycle_repairs?.name,
      shopAddress: service.motorcycle_repairs?.address,
      shopCity: service.motorcycle_repairs?.city,
      shopPhone: service.motorcycle_repairs?.phone,
    }));

    return { services, error: null };
  } catch (error) {
    console.error('Error fetching service history:', error);
    return { services: [], error: 'Failed to fetch service history' };
  }
}

/**
 * Add service record
 */
export async function addServiceRecord(userId: string, serviceData: ServiceHistoryCreate): Promise<{ service: ServiceHistory | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('service_history')
      .insert([{
        user_id: userId,
        bike_id: serviceData.bikeId,
        shop_id: serviceData.shopId,
        service_date: serviceData.serviceDate,
        service_type: serviceData.serviceType,
        service_category: serviceData.serviceCategory,
        description: serviceData.description,
        cost: serviceData.cost,
        mileage_at_service: serviceData.mileageAtService,
        next_service_due_mileage: serviceData.nextServiceDueMileage,
        next_service_due_date: serviceData.nextServiceDueDate,
        parts_replaced: serviceData.partsReplaced,
        receipt_url: serviceData.receiptUrl,
        notes: serviceData.notes,
      }])
      .select()
      .single();

    if (error) {
      return { service: null, error: error.message };
    }

    // Update bike's current mileage if service mileage is higher
    if (serviceData.mileageAtService) {
      await supabase
        .from('bikes')
        .update({ current_mileage: serviceData.mileageAtService })
        .eq('id', serviceData.bikeId)
        .gte('current_mileage', serviceData.mileageAtService);
    }

    const service: ServiceHistory = {
      id: data.id,
      bikeId: data.bike_id,
      userId: data.user_id,
      shopId: data.shop_id,
      serviceDate: data.service_date,
      serviceType: data.service_type,
      serviceCategory: data.service_category,
      description: data.description,
      cost: data.cost,
      mileageAtService: data.mileage_at_service,
      nextServiceDueMileage: data.next_service_due_mileage,
      nextServiceDueDate: data.next_service_due_date,
      partsReplaced: data.parts_replaced,
      receiptUrl: data.receipt_url,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { service, error: null };
  } catch (error) {
    console.error('Error adding service record:', error);
    return { service: null, error: 'Failed to add service record' };
  }
}

/**
 * Get maintenance reminders for a bike
 */
export async function getBikeReminders(bikeId: string): Promise<{ reminders: MaintenanceReminder[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('maintenance_reminders')
      .select('*')
      .eq('bike_id', bikeId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      return { reminders: [], error: error.message };
    }

    const reminders: MaintenanceReminder[] = (data || []).map(reminder => ({
      id: reminder.id,
      bikeId: reminder.bike_id,
      userId: reminder.user_id,
      reminderType: reminder.reminder_type,
      serviceCategory: reminder.service_category,
      description: reminder.description,
      dueMileage: reminder.due_mileage,
      dueDate: reminder.due_date,
      isCompleted: reminder.is_completed,
      completedAt: reminder.completed_at,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
    }));

    return { reminders, error: null };
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return { reminders: [], error: 'Failed to fetch reminders' };
  }
}

/**
 * Get all reminders for a user
 */
export async function getUserReminders(userId: string): Promise<{ reminders: MaintenanceReminderWithBike[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('maintenance_reminders')
      .select(`
        *,
        bikes (
          make,
          model,
          year,
          current_mileage
        )
      `)
      .eq('user_id', userId)
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      return { reminders: [], error: error.message };
    }

    const reminders: MaintenanceReminderWithBike[] = (data || []).map(reminder => ({
      id: reminder.id,
      bikeId: reminder.bike_id,
      userId: reminder.user_id,
      reminderType: reminder.reminder_type,
      serviceCategory: reminder.service_category,
      description: reminder.description,
      dueMileage: reminder.due_mileage,
      dueDate: reminder.due_date,
      isCompleted: reminder.is_completed,
      completedAt: reminder.completed_at,
      notificationSent: reminder.notification_sent,
      createdAt: reminder.created_at,
      updatedAt: reminder.updated_at,
      bikeMake: reminder.bikes.make,
      bikeModel: reminder.bikes.model,
      bikeYear: reminder.bikes.year,
      bikeCurrentMileage: reminder.bikes.current_mileage,
    }));

    return { reminders, error: null };
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return { reminders: [], error: 'Failed to fetch reminders' };
  }
}

/**
 * Create maintenance reminder
 */
export async function createReminder(userId: string, reminderData: MaintenanceReminderCreate): Promise<{ reminder: MaintenanceReminder | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('maintenance_reminders')
      .insert([{
        user_id: userId,
        bike_id: reminderData.bikeId,
        reminder_type: reminderData.reminderType,
        service_category: reminderData.serviceCategory,
        description: reminderData.description,
        due_mileage: reminderData.dueMileage,
        due_date: reminderData.dueDate,
        is_completed: false,
        notification_sent: false,
      }])
      .select()
      .single();

    if (error) {
      return { reminder: null, error: error.message };
    }

    const reminder: MaintenanceReminder = {
      id: data.id,
      bikeId: data.bike_id,
      userId: data.user_id,
      reminderType: data.reminder_type,
      serviceCategory: data.service_category,
      description: data.description,
      dueMileage: data.due_mileage,
      dueDate: data.due_date,
      isCompleted: data.is_completed,
      completedAt: data.completed_at,
      notificationSent: data.notification_sent,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { reminder, error: null };
  } catch (error) {
    console.error('Error creating reminder:', error);
    return { reminder: null, error: 'Failed to create reminder' };
  }
}

/**
 * Complete a maintenance reminder
 */
export async function completeReminder(reminderId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('maintenance_reminders')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', reminderId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error completing reminder:', error);
    return { error: 'Failed to complete reminder' };
  }
}

/**
 * Get service timeline (combines services, reminders, appointments)
 */
export async function getServiceTimeline(bikeId: string): Promise<{ timeline: ServiceTimelineEntry[]; error: string | null }> {
  try {
    const timeline: ServiceTimelineEntry[] = [];

    // Fetch service history
    const { services, error: servicesError } = await getBikeServiceHistory(bikeId);
    if (servicesError) {
      return { timeline: [], error: servicesError };
    }

    services.forEach(service => {
      timeline.push({
        id: service.id,
        date: service.serviceDate,
        type: 'service',
        title: `${service.serviceType.charAt(0).toUpperCase() + service.serviceType.slice(1)} - ${service.description}`,
        description: service.notes || '',
        cost: service.cost,
        shopName: service.shopName,
        category: service.serviceCategory,
      });
    });

    // Fetch reminders
    const { reminders, error: remindersError } = await getBikeReminders(bikeId);
    if (remindersError) {
      return { timeline: [], error: remindersError };
    }

    reminders.forEach(reminder => {
      if (reminder.dueDate) {
        timeline.push({
          id: reminder.id,
          date: reminder.dueDate,
          type: 'reminder',
          title: `Upcoming: ${reminder.description}`,
          description: reminder.reminderType === 'mileage' ? `Due at ${reminder.dueMileage} miles` : '',
          category: reminder.serviceCategory,
        });
      }
    });

    // Sort by date descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { timeline, error: null };
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return { timeline: [], error: 'Failed to fetch timeline' };
  }
}

/**
 * Calculate service statistics
 */
export async function getServiceStats(bikeId: string): Promise<{
  stats: {
    totalServices: number;
    totalCost: number;
    averageCost: number;
    lastServiceDate: string | null;
  };
  error: string | null;
}> {
  try {
    const { services, error } = await getBikeServiceHistory(bikeId);

    if (error) {
      return {
        stats: { totalServices: 0, totalCost: 0, averageCost: 0, lastServiceDate: null },
        error
      };
    }

    const totalServices = services.length;
    const totalCost = services.reduce((sum, s) => sum + (s.cost || 0), 0);
    const averageCost = totalServices > 0 ? totalCost / totalServices : 0;
    const lastServiceDate = totalServices > 0 ? services[0].serviceDate : null;

    return {
      stats: {
        totalServices,
        totalCost,
        averageCost,
        lastServiceDate,
      },
      error: null
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      stats: { totalServices: 0, totalCost: 0, averageCost: 0, lastServiceDate: null },
      error: 'Failed to calculate statistics'
    };
  }
}
