'use client';
import { useAuth } from '../context/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import LoginForm from '../components/LoginForm';
import RecipeForm from '../components/RecipeForm';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Add this interface for recipe data
interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  servings: number;
  username: string;
  user_id: string; // Add this to check ownership
  recipe_image?: string; // ADD THIS LINE
}

export default function Home() {
    const { user, logout, loading, token } = useAuth(); // Make sure token is available
    const [showLogin, setShowLogin] = useState(false);
    const [showRecipeForm, setShowRecipeForm] = useState(false);
    const [activeTab, setActiveTab] = useState('browse');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [recipesLoading, setRecipesLoading] = useState(true);

    // Fetch recipes when user is logged in and on browse tab
    useEffect(() => {
        if (user && activeTab === 'browse') {
            fetchRecipes();
        }
    }, [user, activeTab]);

    const fetchRecipes = async () => {
        try {
            setRecipesLoading(true);
            const res = await fetch('/api/recipes');
            if (res.ok) {
                const data = await res.json();
                setRecipes(data);
            }
        } catch (error) {
            console.error('Error fetching recipes:', error);
        } finally {
            setRecipesLoading(false);
        }
    };

    const handleRecipeSuccess = (recipeId: string) => {
        setActiveTab('browse');
        fetchRecipes();
    };

    // Add delete function
    const handleDeleteRecipe = async (recipeId: string) => {
        if (!confirm('Are you sure you want to delete this recipe?')) {
            return;
        }

        try {
            const res = await fetch(`/api/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Remove the recipe from the local state
                setRecipes(recipes.filter(recipe => recipe.id !== recipeId));
                alert('Recipe deleted successfully');
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to delete recipe');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete recipe');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation - Keep exactly as is */}
            <nav className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">🍳</span>
                            <h1 className="text-xl font-bold text-orange-600">Recipe Hub</h1>
                        </div>
                        
                        {user && (
                            <div className="flex items-center space-x-4">
                                <span className="text-gray-700">Welcome, {user.username}!</span>
                                <button
                                    onClick={logout}
                                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                {user ? (
                    // User is logged in - show recipe features
                    <div>
                        {/* Tab Navigation - Keep exactly as is */}
                        <div className="max-w-4xl mx-auto mb-8">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setActiveTab('browse')}
                                    className={`flex-1 py-3 px-6 rounded-md transition-colors text-center ${
                                        activeTab === 'browse' 
                                            ? 'bg-white text-orange-600 shadow-sm font-semibold' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Browse Recipes
                                </button>
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className={`flex-1 py-3 px-6 rounded-md transition-colors text-center ${
                                        activeTab === 'create' 
                                            ? 'bg-white text-orange-600 shadow-sm font-semibold' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Create Recipe
                                </button>
                            </div>
                        </div>

                        {/* Tab Content - Add delete button to recipe cards */}
                        {activeTab === 'browse' ? (
                            <div className="max-w-4xl mx-auto">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                                        Discover Amazing Recipes
                                    </h2>
                                    <p className="text-gray-600 mb-8">
                                        Browse through community recipes or create your own!
                                    </p>
                                    
                                    {recipesLoading ? (
                                        <div className="text-gray-600">Loading recipes...</div>
                                    ) : recipes.length === 0 ? (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
                                            <p className="text-yellow-800">
                                                Recipe browsing coming soon! For now, start by creating your first recipe.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-w-4xl mx-auto">
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {recipes.map((recipe) => (
    <div key={recipe.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden relative">
      {/* Delete button - only show if user owns the recipe */}
      {recipe.user_id === user.userId && (
        <button
          onClick={() => handleDeleteRecipe(recipe.id)}
          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors z-10"
          title="Delete recipe"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <Link href={`/recipes/${recipe.id}`}>
        <div className="cursor-pointer">
          {/* ADD IMAGE SECTION HERE */}
          {recipe.recipe_image ? (
            <div className="w-full h-48 overflow-hidden">
              <img 
                src={recipe.recipe_image} 
                alt={recipe.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
          
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {recipe.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {recipe.description}
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <span>⏱️</span>
                <span>{recipe.cooking_time} min</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🟢</span>
                <span className="capitalize">{recipe.difficulty}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>👥</span>
                <span>Serves {recipe.servings}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>👤</span>
                <span>By {recipe.username}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  ))}
</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <RecipeForm onSuccess={handleRecipeSuccess} />
                        )}
                    </div>
                ) : (
                    // User is not logged in - show auth forms (keep exactly as is)
                    <div>
                        <header className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-orange-600">🍳 Recipe Hub</h1>
                            <p className="text-gray-600 mt-2">
                                Share, discover, and organize your favorite recipes
                            </p>
                        </header>

                        {/* Toggle between Login and Register */}
                        <div className="max-w-md mx-auto mb-6">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setShowLogin(false)}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        !showLogin 
                                            ? 'bg-white text-orange-600 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Register
                                </button>
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                                        showLogin 
                                            ? 'bg-white text-orange-600 shadow-sm' 
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Login
                                </button>
                            </div>
                        </div>

                        {/* Show appropriate form */}
                        {showLogin ? <LoginForm /> : <RegistrationForm />}
                    </div>
                )}
            </div>
        </div>
    );
}