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

    if (loading) return <div className="text-center p-8">Loading...</div>;
    if (!recipe) return <div className="text-center p-8">Recipe not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto p-6">

                <div className="bg-white rounded-lg shadow-md p-8 relative">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4 pr-32">{recipe.title}</h1>
                    <p className="text-gray-600 text-lg mb-6">{recipe.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8 text-center">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{recipe.cooking_time}</div>
                            <div className="text-gray-600">minutes</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600 capitalize">{recipe.difficulty}</div>
                            <div className="text-gray-600">difficulty</div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">{recipe.servings}</div>
                            <div className="text-gray-600">servings</div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Ingredients</h2>
                            <ul className="space-y-3">
                                {recipe.ingredients.map((ingredient, index) => (
                                    <li key={index} className="flex justify-between border-b pb-2">
                                        <span className="text-gray-800">{ingredient.name}</span>
                                        <span className="text-gray-600">
                                            {ingredient.quantity} {ingredient.unit}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Instructions</h2>
                            <ol className="space-y-4">
                                {recipe.instructions.map((instruction, index) => (
                                    <li key={index} className="flex">
                                        <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">
                                            {index + 1}
                                        </span>
                                        <span className="text-gray-800">{instruction}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>


                    <div className="mt-12 border-t pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800">Reviews</h2>
                            <button
                                onClick={() => setShowReviewForm(!showReviewForm)}
                                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                {showReviewForm ? 'Cancel' : 'Add Review'}
                            </button>
                        </div>


                        {showReviewForm && (
                            <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-lg mb-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Rating
                                    </label>
                                    <select
                                        value={reviewForm.rating}
                                        onChange={(e) => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})}
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900"
                                    >
                                        {[5, 4, 3, 2, 1].map(num => (
                                            <option key={num} value={num}>{num} Stars</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Comment
                                    </label>
                                    <textarea
                                        value={reviewForm.comment}
                                        onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900"
                                        placeholder="Share your thoughts about this recipe..."
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    Submit Review
                                </button>
                            </form>
                        )}


                        <div className="space-y-6">
                            {reviews.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
                            ) : (
                                reviews.map((review) => (
                                    <div key={review.id} className="border-b pb-4 group hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-gray-800">{review.username}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span
                                                            key={i}
                                                            className={i < review.rating ? 'text-yellow-500' : 'text-gray-300 text-lg'}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                                
                                                {user && review.user_id === user.id && (
                                                    <button
                                                        onClick={() => handleDeleteReview(review.id)}
                                                        className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                                                        title="Delete your review"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-gray-700 mb-2">{review.comment}</p>
                                        <p className="text-gray-500 text-sm">
                                            {new Date(review.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t">
                        <p className="text-gray-600">By {recipe.username}</p>
                    </div>
                </div>


                <div className="mt-8 flex justify-center gap-4">
                    <button
                        onClick={handleBackToRecipes}
                        className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                    >
                        Back to Recipes
                    </button>
                    
                    {isRecipeOwner && (
                        <button
                            onClick={handleDeleteRecipe}
                            disabled={deleting}
                            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 disabled:bg-red-300 transition-colors font-semibold"
                        >
                            {deleting ? 'Deleting...' : 'Delete Recipe'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}