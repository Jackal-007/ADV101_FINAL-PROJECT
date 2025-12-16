'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import RecipeForm from '../../../../components/RecipeForm';

export default function EditRecipePage() {
    const router = useRouter();
    const params = useParams();
    const { user, token } = useAuth();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const recipeId = params.id as string;

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        
        fetchRecipe();
    }, [user, recipeId]);

    const fetchRecipe = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/recipes/${recipeId}`);
            
            if (res.ok) {
                const recipeData = await res.json();
                
                if (recipeData.user_id !== user.id) {
                    setError('You are not authorized to edit this recipe');
                    return;
                }
                
                setRecipe(recipeData);
            } else {
                setError('Recipe not found');
            }
        } catch (error) {
            console.error('Error fetching recipe:', error);
            setError('Failed to load recipe');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccess = (updatedRecipeId: string) => {
        alert('Recipe updated successfully!');
        router.push(`/recipes/${updatedRecipeId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-recipe-light flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-recipe-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading recipe...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-recipe-light flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.back()}
                        className="btn-primary px-6 py-3"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!recipe) {
        return null;
    }

    return (
        <div className="min-h-screen bg-recipe-light py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-recipe-primary mb-4"
                    >
                        ← Back to Recipe
                    </button>
                </div>
                
                <RecipeForm
                    editing={true}
                    recipeId={recipeId}
                    initialData={recipe}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    );
}