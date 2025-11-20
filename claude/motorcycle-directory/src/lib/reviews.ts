// Shop reviews and ratings utilities

import { supabase } from './supabase';
import {
  ShopReview,
  ShopReviewCreate,
  ShopReviewWithUser,
  ShopRatingAggregate,
  RatingDistribution,
  calculateRatingDistribution,
} from '@/types/review';

/**
 * Get reviews for a shop
 */
export async function getShopReviews(shopId: number): Promise<{ reviews: ShopReviewWithUser[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_reviews')
      .select(`
        *,
        users (
          first_name,
          last_name,
          profile_image_url
        )
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      return { reviews: [], error: error.message };
    }

    const reviews: ShopReviewWithUser[] = (data || []).map(review => {
      const firstName = review.users?.first_name || 'Anonymous';
      const lastName = review.users?.last_name || 'User';
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

      return {
        id: review.id,
        shopId: review.shop_id,
        userId: review.user_id,
        appointmentId: review.appointment_id,
        rating: review.rating,
        reviewTitle: review.review_title,
        reviewText: review.review_text,
        serviceQualityRating: review.service_quality_rating,
        priceRating: review.price_rating,
        communicationRating: review.communication_rating,
        wouldRecommend: review.would_recommend,
        createdAt: review.created_at,
        updatedAt: review.updated_at,
        isVerified: review.is_verified,
        userName: `${firstName} ${lastName}`,
        userInitials: initials,
        userProfileImage: review.users?.profile_image_url,
      };
    });

    return { reviews, error: null };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], error: 'Failed to fetch reviews' };
  }
}

/**
 * Get shop rating aggregate
 */
export async function getShopRatingAggregate(shopId: string): Promise<{ aggregate: ShopRatingAggregate | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_ratings_aggregate')
      .select('*')
      .eq('shop_id', shopId)
      .single();

    if (error) {
      // If no reviews exist, return default aggregate
      if (error.code === 'PGRST116') {
        return {
          aggregate: {
            shopId: shopId,
            totalReviews: 0,
            averageRating: 0,
            avgServiceQuality: 0,
            avgPriceRating: 0,
            avgCommunicationRating: 0,
            recommendCount: 0,
            recommendPercentage: 0,
          },
          error: null
        };
      }
      return { aggregate: null, error: error.message };
    }

    const aggregate: ShopRatingAggregate = {
      shopId: data.shop_id,
      totalReviews: data.total_reviews,
      averageRating: data.average_rating,
      avgServiceQuality: data.avg_service_quality,
      avgPriceRating: data.avg_price_rating,
      avgCommunicationRating: data.avg_communication_rating,
      recommendCount: data.recommend_count,
      recommendPercentage: data.total_reviews > 0 ? (data.recommend_count / data.total_reviews) * 100 : 0,
    };

    return { aggregate, error: null };
  } catch (error) {
    console.error('Error fetching rating aggregate:', error);
    return { aggregate: null, error: 'Failed to fetch rating aggregate' };
  }
}

/**
 * Get rating distribution for a shop
 */
export async function getShopRatingDistribution(shopId: number): Promise<{ distribution: RatingDistribution | null; error: string | null }> {
  try {
    const { reviews, error } = await getShopReviews(shopId);

    if (error) {
      return { distribution: null, error };
    }

    const distribution = calculateRatingDistribution(reviews);
    return { distribution, error: null };
  } catch (error) {
    console.error('Error calculating rating distribution:', error);
    return { distribution: null, error: 'Failed to calculate rating distribution' };
  }
}

/**
 * Create a review
 */
export async function createReview(userId: string, reviewData: ShopReviewCreate): Promise<{ review: ShopReview | null; error: string | null }> {
  try {
    // Validate rating is between 1 and 5
    if (reviewData.rating < 1 || reviewData.rating > 5) {
      return { review: null, error: 'Rating must be between 1 and 5' };
    }

    // Check if user has already reviewed this shop for this appointment
    if (reviewData.appointmentId) {
      const { data: existingReview } = await supabase
        .from('shop_reviews')
        .select('id')
        .eq('shop_id', reviewData.shopId)
        .eq('user_id', userId)
        .eq('appointment_id', reviewData.appointmentId)
        .single();

      if (existingReview) {
        return { review: null, error: 'You have already reviewed this appointment' };
      }
    }

    const { data, error } = await supabase
      .from('shop_reviews')
      .insert([{
        shop_id: reviewData.shopId,
        user_id: userId,
        appointment_id: reviewData.appointmentId,
        rating: reviewData.rating,
        review_title: reviewData.reviewTitle,
        review_text: reviewData.reviewText,
        service_quality_rating: reviewData.serviceQualityRating,
        price_rating: reviewData.priceRating,
        communication_rating: reviewData.communicationRating,
        would_recommend: reviewData.wouldRecommend,
        is_verified: !!reviewData.appointmentId, // Verified if linked to appointment
      }])
      .select()
      .single();

    if (error) {
      return { review: null, error: error.message };
    }

    const review: ShopReview = {
      id: data.id,
      shopId: data.shop_id,
      userId: data.user_id,
      appointmentId: data.appointment_id,
      rating: data.rating,
      reviewTitle: data.review_title,
      reviewText: data.review_text,
      serviceQualityRating: data.service_quality_rating,
      priceRating: data.price_rating,
      communicationRating: data.communication_rating,
      wouldRecommend: data.would_recommend,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isVerified: data.is_verified,
    };

    return { review, error: null };
  } catch (error) {
    console.error('Error creating review:', error);
    return { review: null, error: 'Failed to create review' };
  }
}

/**
 * Update a review
 */
export async function updateReview(reviewId: string, userId: string, updates: Partial<ShopReviewCreate>): Promise<{ review: ShopReview | null; error: string | null }> {
  try {
    const updateData: any = {};

    if (updates.rating !== undefined) {
      if (updates.rating < 1 || updates.rating > 5) {
        return { review: null, error: 'Rating must be between 1 and 5' };
      }
      updateData.rating = updates.rating;
    }
    if (updates.reviewTitle !== undefined) updateData.review_title = updates.reviewTitle;
    if (updates.reviewText !== undefined) updateData.review_text = updates.reviewText;
    if (updates.serviceQualityRating !== undefined) updateData.service_quality_rating = updates.serviceQualityRating;
    if (updates.priceRating !== undefined) updateData.price_rating = updates.priceRating;
    if (updates.communicationRating !== undefined) updateData.communication_rating = updates.communicationRating;
    if (updates.wouldRecommend !== undefined) updateData.would_recommend = updates.wouldRecommend;

    const { data, error } = await supabase
      .from('shop_reviews')
      .update(updateData)
      .eq('id', reviewId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { review: null, error: error.message };
    }

    const review: ShopReview = {
      id: data.id,
      shopId: data.shop_id,
      userId: data.user_id,
      appointmentId: data.appointment_id,
      rating: data.rating,
      reviewTitle: data.review_title,
      reviewText: data.review_text,
      serviceQualityRating: data.service_quality_rating,
      priceRating: data.price_rating,
      communicationRating: data.communication_rating,
      wouldRecommend: data.would_recommend,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isVerified: data.is_verified,
    };

    return { review, error: null };
  } catch (error) {
    console.error('Error updating review:', error);
    return { review: null, error: 'Failed to update review' };
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('shop_reviews')
      .delete()
      .eq('id', reviewId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { error: 'Failed to delete review' };
  }
}

/**
 * Get user's reviews
 */
export async function getUserReviews(userId: string): Promise<{ reviews: ShopReview[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('shop_reviews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { reviews: [], error: error.message };
    }

    const reviews: ShopReview[] = (data || []).map(review => ({
      id: review.id,
      shopId: review.shop_id,
      userId: review.user_id,
      appointmentId: review.appointment_id,
      rating: review.rating,
      reviewTitle: review.review_title,
      reviewText: review.review_text,
      serviceQualityRating: review.service_quality_rating,
      priceRating: review.price_rating,
      communicationRating: review.communication_rating,
      wouldRecommend: review.would_recommend,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      isVerified: review.is_verified,
    }));

    return { reviews, error: null };
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return { reviews: [], error: 'Failed to fetch reviews' };
  }
}
