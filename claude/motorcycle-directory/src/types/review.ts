// Review and rating related TypeScript types

export interface ShopReview {
  id: string;
  shopId: string; // UUID in database
  userId: string;
  appointmentId?: string;
  rating: number; // FLOAT8 in database - 1.0 to 5.0
  reviewTitle?: string;
  reviewText?: string;
  serviceQualityRating?: number; // BIGINT in database - 1 to 5
  priceRating?: number; // BIGINT in database - 1 to 5
  communicationRating?: number; // BIGINT in database - 1 to 5
  wouldRecommend?: boolean;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

export interface ShopReviewCreate {
  shopId: string; // UUID in database
  appointmentId?: string;
  rating: number; // FLOAT8 in database
  reviewTitle?: string;
  reviewText?: string;
  serviceQualityRating?: number; // BIGINT in database
  priceRating?: number; // BIGINT in database
  communicationRating?: number; // BIGINT in database
  wouldRecommend?: boolean;
}

export interface ShopReviewWithUser extends ShopReview {
  userName: string;
  userInitials: string;
  userProfileImage?: string;
}

export interface ShopRatingAggregate {
  shopId: string; // UUID in database
  totalReviews: number;
  averageRating: number; // FLOAT8 in database
  avgServiceQuality?: number; // Average of BIGINT ratings
  avgPriceRating?: number; // Average of BIGINT ratings
  avgCommunicationRating?: number; // Average of BIGINT ratings
  recommendCount: number;
  recommendPercentage: number;
}

export interface RatingDistribution {
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

// Helper function to calculate rating distribution
export function calculateRatingDistribution(reviews: ShopReview[]): RatingDistribution {
  const distribution: RatingDistribution = {
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  };

  reviews.forEach(review => {
    const rating = Math.round(review.rating);
    switch (rating) {
      case 5:
        distribution.fiveStars++;
        break;
      case 4:
        distribution.fourStars++;
        break;
      case 3:
        distribution.threeStars++;
        break;
      case 2:
        distribution.twoStars++;
        break;
      case 1:
        distribution.oneStar++;
        break;
    }
  });

  return distribution;
}

// Review form validation
export interface ReviewFormErrors {
  rating?: string;
  reviewTitle?: string;
  reviewText?: string;
  serviceQualityRating?: string;
  priceRating?: string;
  communicationRating?: string;
}

export function validateReviewForm(review: Partial<ShopReviewCreate>): ReviewFormErrors {
  const errors: ReviewFormErrors = {};

  if (!review.rating || review.rating < 1 || review.rating > 5) {
    errors.rating = 'Please provide a rating between 1 and 5';
  }

  if (review.reviewTitle && review.reviewTitle.length > 200) {
    errors.reviewTitle = 'Title must be 200 characters or less';
  }

  if (review.reviewText && review.reviewText.length < 10) {
    errors.reviewText = 'Review text must be at least 10 characters';
  }

  if (review.serviceQualityRating && (review.serviceQualityRating < 1 || review.serviceQualityRating > 5)) {
    errors.serviceQualityRating = 'Rating must be between 1 and 5';
  }

  if (review.priceRating && (review.priceRating < 1 || review.priceRating > 5)) {
    errors.priceRating = 'Rating must be between 1 and 5';
  }

  if (review.communicationRating && (review.communicationRating < 1 || review.communicationRating > 5)) {
    errors.communicationRating = 'Rating must be between 1 and 5';
  }

  return errors;
}
