'use client';

import * as React from 'react';
import { Star, ThumbsUp, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Review, BookRating } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy, getDoc } from 'firebase/firestore';

interface BookReviewsProps {
  bookId: string;
  initialRating?: BookRating;
  onRatingUpdate?: (rating: BookRating) => void;
}

export function BookReviews({ bookId, initialRating, onRatingUpdate }: BookReviewsProps) {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userReview, setUserReview] = React.useState({
    rating: 0,
    title: '',
    comment: '',
    email: '',
    name: ''
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<'recent' | 'helpful'>('recent');
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('bookId', '==', bookId),
        orderBy(sortBy === 'recent' ? 'createdAt' : 'helpful', 'desc')
      );
      const snapshot = await getDocs(reviewsQuery);
      const reviewsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Review[];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load reviews. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReviews();
  }, [bookId, sortBy]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userReview.rating === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a rating.',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (!userReview.email) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter your email address.',
        });
        return;
      }

      // Check if the user has already reviewed this book
      const existingReviewQuery = query(
        collection(db, 'reviews'),
        where('bookId', '==', bookId),
        where('email', '==', userReview.email)
      );
      const existingReviewSnap = await getDocs(existingReviewQuery);
      
      if (!existingReviewSnap.empty) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You have already reviewed this book.',
        });
        return;
      }

      const reviewData = {
        bookId,
        email: userReview.email,
        name: userReview.name || 'Anonymous',
        rating: userReview.rating,
        title: userReview.title,
        comment: userReview.comment,
        createdAt: new Date().toISOString(),
        helpful: 0,
      };

      await addDoc(collection(db, 'reviews'), reviewData);

      // Update book rating in Firestore
      const bookRef = doc(db, 'books', bookId);
      const bookDoc = await getDoc(bookRef);
      
      if (bookDoc.exists()) {
        const currentRating = bookDoc.data().rating || {
          average: 0,
          total: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };

        const newTotal = currentRating.total + 1;
        const newDistribution = {
          ...currentRating.distribution,
          [userReview.rating]: (currentRating.distribution[userReview.rating] || 0) + 1
        };
        
        const newAverage = (
          (currentRating.average * currentRating.total + userReview.rating) / newTotal
        );

        const updatedRating = {
          average: Number(newAverage.toFixed(1)),
          total: newTotal,
          distribution: newDistribution
        };

        await updateDoc(bookRef, {
          rating: updatedRating,
          reviewCount: newTotal
        });

        if (onRatingUpdate) {
          onRatingUpdate(updatedRating);
        }
      }

      // Reset form and refresh reviews
      setUserReview({ rating: 0, title: '', comment: '', email: '', name: '' });
      fetchReviews();

      toast({
        title: 'Success',
        description: 'Your review has been submitted.',
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit review. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      const reviewRef = doc(db, 'reviews', reviewId);
      const reviewDoc = await getDoc(reviewRef);
      
      if (reviewDoc.exists()) {
        await updateDoc(reviewRef, {
          helpful: (reviewDoc.data().helpful || 0) + 1
        });
        fetchReviews();
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark review as helpful.',
      });
    }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange?: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onChange?.(rating)}
          className={`text-lg ${
            rating <= value ? 'text-yellow-400' : 'text-gray-300'
          } focus:outline-none transition-colors`}
        >
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      {initialRating && (
        <div className="flex items-start gap-8 p-6 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-4xl font-bold">{initialRating.average}</div>
            <StarRating value={Math.round(initialRating.average)} />
            <div className="text-sm text-muted-foreground mt-1">
              {initialRating.total} {initialRating.total === 1 ? 'review' : 'reviews'}
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {Object.entries(initialRating.distribution)
              .sort((a, b) => Number(b[0]) - Number(a[0]))
              .map(([rating, count]) => (
                <div key={rating} className="flex items-center gap-2">
                  <div className="w-12 text-sm">{rating} stars</div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${(count / initialRating.total) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="w-12 text-sm text-right">{count}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={submitReview} className="space-y-6">
        <h3 className="text-lg font-semibold">Write a Review</h3>
        
        <div className="grid gap-6 p-6 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Rating*</label>
            <StarRating
              value={userReview.rating}
              onChange={(rating) => setUserReview((prev) => ({ ...prev, rating }))}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email*</label>
              <Input
                type="email"
                required
                value={userReview.email}
                onChange={(e) => setUserReview((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
              <p className="text-xs text-muted-foreground">Required for review submission</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name (Optional)</label>
              <Input
                value={userReview.name}
                onChange={(e) => setUserReview((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
              <p className="text-xs text-muted-foreground">Will show as 'Anonymous' if left empty</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Review Title*</label>
            <Input
              required
              value={userReview.title}
              onChange={(e) => setUserReview((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Summarize your thoughts"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Review*</label>
            <Textarea
              required
              value={userReview.comment}
              onChange={(e) => setUserReview((prev) => ({ ...prev, comment: e.target.value }))}
              placeholder="What did you like or dislike? What did you use this product for?"
              rows={4}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </div>
      </form>

      {/* Reviews List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
          <select
            className="text-sm border rounded-md p-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'helpful')}
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No reviews yet. Be the first to review!</div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StarRating value={review.rating} />
                      <span className="text-sm font-medium">{review.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      By {review.name} on {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markHelpful(review.id)}
                    className="text-sm"
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    Helpful ({review.helpful})
                  </Button>
                </div>
                <p className="mt-3 text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
