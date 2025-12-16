'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Recipe {
    id: string;
    title: string;
    description: string;
    cooking_time: number;
    difficulty: string;
    servings: number;
    ingredients: { name: string; quantity: string; unit: string }[];
    instructions: string[];
    username: string;
    user_id: string;
}

interface Review {
    id: number;
    user_id: string;
    username: string;
    rating: number;
    comment: string;
    created_at: string;
}

export default function RecipeDetail() {
    const params = useParams();
    const router = useRouter();
    const { user, token } = useAuth();
    const recipeId = params.id as string;
    

    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        console.log('🔍 Recipe ID from params:', recipeId);
        if (recipeId) {
            fetchRecipe();
            fetchReviews();
        }
    }, [recipeId]);

    const fetchRecipe = async () => {
        try {
            console.log('🔍 Fetching recipe from API...');
            const response = await fetch(`/api/recipes/${recipeId}`);
            console.log('🔍 API Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('🔍 Recipe data received:', data);
                setRecipe(data);
            } else {
                const errorText = await response.text();
                console.error('❌ Failed to fetch recipe:', response.status, errorText);
            }
        } catch (error) {
            console.error('❌ Error fetching recipe:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await fetch(`/api/recipes/${recipeId}/reviews`);
            if (response.ok) {
                const reviewsData = await response.json();
                setReviews(reviewsData);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const handleSubmitReview = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Please log in to submit a review');
            return;
        }

        try {
            console.log('📝 Submitting review with data:', {
                user_id: user.id,
                rating: reviewForm.rating,
                comment: reviewForm.comment
            });

            const response = await fetch(`/api/recipes/${recipeId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    rating: reviewForm.rating,
                    comment: reviewForm.comment,
                    user_id: user.id
                })
            });

            const responseData = await response.json();
            console.log('📝 Review API response:', responseData);

            if (response.ok) {
                setReviewForm({ rating: 5, comment: '' });
                setShowReviewForm(false);
                fetchReviews();
                alert('Review submitted successfully!');
            } else {
                alert(responseData.error || 'Failed to submit review');
            }
        } catch (error) {
            console.error('❌ Review submission error:', error);
            alert('Failed to submit review. Please try again.');
        }
    };

    const handleBackToRecipes = () => {
        router.push('/');
    };

    const handleDeleteRecipe = async () => {
        if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Recipe deleted successfully');
                router.push('/');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete recipe');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete recipe');
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
    console.log('🔍 handleDeleteReview called with reviewId:', reviewId);
    
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }

    try {
        console.log(`🗑️ Deleting review ${reviewId}...`);
        console.log('Current user:', user);
        console.log('Token exists:', !!token);
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };


        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        } else {
            alert('You need to be logged in to delete reviews');
            return;
        }

        const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: headers
        });

        console.log('Response status:', response.status);
        
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {

            setReviews(reviews.filter(review => review.id !== reviewId));
            alert('Review deleted successfully!');
        } else {
            alert(data.error || 'Failed to delete review');
        }
    } catch (error: any) {
        console.error('❌ Error deleting review:', error);
        alert(`Failed to delete review: ${error.message}`);
    }
};

    const isRecipeOwner = user && recipe && recipe.user_id === user.id;

    if (loading) return (
        <div className="min-h-screen bg-recipe-light flex items-center justify-center">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-recipe-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading recipe...</p>
            </div>
        </div>
    );
    
    if (!recipe) return (
        <div className="min-h-screen bg-recipe-light flex items-center justify-center">
            <div className="text-center p-8">
                <div className="text-6xl mb-4">🍳</div>
                <h1 className="text-2xl font-display font-bold text-gray-800 mb-2">Recipe Not Found</h1>
                <p className="text-gray-600 mb-6">The recipe you're looking for doesn't exist or has been removed.</p>
                <button
                    onClick={handleBackToRecipes}
                    className="btn-primary px-6 py-3"
                >
                    Back to Recipes
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-recipe-light py-8 animate-fade-in">
            <div className="max-w-6xl mx-auto px-4">

                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 relative">
                    {isRecipeOwner && (
                        <div className="absolute top-6 right-6">
                            <button
                                onClick={handleDeleteRecipe}
                                disabled={deleting}
                                className="btn-red px-4 py-2 text-sm"
                                title="Delete Recipe"
                            >
                                {deleting ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Deleting...
                                    </div>
                                ) : 'Delete Recipe'}
                            </button>
                        </div>
                    )}

                    <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-800 mb-4 pr-32">
                        {recipe.title}
                    </h1>
                    
                    <p className="text-gray-600 text-lg mb-8 max-w-3xl">{recipe.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="bg-gradient-to-br from-recipe-primary/10 to-recipe-primary/5 p-6 rounded-xl border border-recipe-primary/20">
                            <div className="text-3xl font-display font-bold text-recipe-primary mb-2">
                                {recipe.cooking_time}
                            </div>
                            <div className="text-gray-700 font-medium">Minutes</div>
                        </div>
                        <div className="bg-gradient-to-br from-recipe-secondary/10 to-recipe-secondary/5 p-6 rounded-xl border border-recipe-secondary/20">
                            <div className="text-3xl font-display font-bold text-recipe-secondary mb-2 capitalize">
                                {recipe.difficulty}
                            </div>
                            <div className="text-gray-700 font-medium">Difficulty</div>
                        </div>
                        <div className="bg-gradient-to-br from-recipe-accent/10 to-recipe-accent/5 p-6 rounded-xl border border-recipe-accent/20">
                            <div className="text-3xl font-display font-bold text-recipe-dark mb-2">
                                {recipe.servings}
                            </div>
                            <div className="text-gray-700 font-medium">Servings</div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10">
                        <div className="bg-recipe-light rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-recipe-primary/20 flex items-center justify-center">
                                    <span className="text-recipe-primary text-xl">🥕</span>
                                </div>
                                <h2 className="text-2xl font-display font-bold text-gray-800">Ingredients</h2>
                            </div>
                            <ul className="space-y-4">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={index} className="flex justify-between items-center py-3 border-b border-gray-100 hover:bg-white/50 px-3 rounded-lg transition-colors">
                                        <span className="text-gray-800 font-medium">{ingredient.name}</span>
                                        <span className="text-recipe-primary font-semibold bg-recipe-primary/10 px-3 py-1 rounded-full">
                                            {ingredient.quantity} {ingredient.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-recipe-light rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-recipe-secondary/20 flex items-center justify-center">
                                    <span className="text-recipe-secondary text-xl">👨‍🍳</span>
                                </div>
                                <h2 className="text-2xl font-display font-bold text-gray-800">Instructions</h2>
                            </div>
                            <ol className="space-y-5">
                                {recipe.instructions.map((instruction, index) => (
                                    <li key={index} className="flex gap-5 group">
                                        <div className="flex-shrink-0">
                                            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-recipe-primary to-recipe-secondary text-white font-bold text-lg group-hover:scale-110 transition-transform">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <div className="bg-white p-5 rounded-lg border border-gray-200 flex-1 group-hover:border-recipe-primary/30 transition-colors">
                                            <p className="text-gray-800 leading-relaxed">{instruction}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-recipe-primary/20 to-recipe-secondary/20 flex items-center justify-center">
                                <span className="text-gray-700 font-bold text-lg">👤</span>
                            </div>
                            <div>
                                <p className="text-gray-600 text-sm">Created by</p>
                                <p className="text-gray-800 font-semibold text-lg">{recipe.username}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500 text-sm">Enjoy this recipe?</p>
                            <p className="text-recipe-primary font-medium">Leave a review below!</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-gray-800">Reviews</h2>
                            <p className="text-gray-600 mt-1">
                                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={() => setShowReviewForm(!showReviewForm)}
                            className="btn-primary px-6 py-3"
                        >
                            {showReviewForm ? (
                                <div className="flex items-center gap-2">
                                    <span>✕</span>
                                    Cancel Review
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span>⭐</span>
                                    Add Review
                                </div>
                            )}
                        </button>
                    </div>

                    {showReviewForm && (
                        <form onSubmit={handleSubmitReview} className="enhanced-form mb-8 animate-slide-up">
                            <h3 className="text-xl font-display font-bold text-gray-800 mb-6">Write Your Review</h3>
                            
                            <div className="mb-6">
                                <label className="form-label">Rating</label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setReviewForm({...reviewForm, rating: star})}
                                            className="text-3xl transition-transform hover:scale-110"
                                        >
                                            {star <= reviewForm.rating ? (
                                                <span className="text-yellow-500">★</span>
                                            ) : (
                                                <span className="text-gray-300">☆</span>
                                            )}
                                        </button>
                                    ))}
                                    <span className="ml-3 text-gray-700 font-medium">{reviewForm.rating} out of 5</span>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <label className="form-label">Your Comment</label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                    rows={4}
                                    className="form-input"
                                    placeholder="Share your thoughts about this recipe..."
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className="btn-secondary w-full py-3"
                            >
                                Submit Review
                            </button>
                        </form>
                    )}

                    <div className="space-y-6">
                        {reviews.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                                <div className="text-5xl mb-4">⭐</div>
                                <h3 className="text-xl font-display font-bold text-gray-800 mb-2">No Reviews Yet</h3>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    Be the first to share your experience with this recipe!
                                </p>
                                {!showReviewForm && (
                                    <button
                                        onClick={() => setShowReviewForm(true)}
                                        className="btn-outline px-6 py-3"
                                    >
                                        Write First Review
                                    </button>
                                )}
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review.id} className="bg-gray-50 rounded-xl p-6 hover:bg-white border border-gray-200 hover:border-recipe-primary/30 transition-all group">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-recipe-primary/20 to-recipe-secondary/20 flex items-center justify-center">
                                                <span className="text-gray-700 font-semibold">
                                                    {review.username.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{review.username}</p>
                                                <p className="text-gray-500 text-sm">
                                                    {new Date(review.created_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={i < review.rating ? 'text-yellow-500 text-lg' : 'text-gray-300 text-lg'}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            
                                            {user && review.user_id === user.id && (
                                                <button
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    className="text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete your review"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="mt-10 flex justify-center">
                    <button
                        onClick={handleBackToRecipes}
                        className="btn-outline px-8 py-3 text-lg"
                    >
                        ← Back to Recipes
                    </button>
                </div>
            </div>
        </div>
    );
}