'use client';
import { useAuth } from '../context/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import LoginForm from '../components/LoginForm';
import RecipeForm from '../components/RecipeForm';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  servings: number;
  username: string;
  user_id: string; 
  recipe_image?: string; 
}

export default function Home() {
    const { user, logout, loading, token } = useAuth();
    const pathname = usePathname();

    console.log('Home Page - Current pathname:', pathname); 

    const [showLogin, setShowLogin] = useState(false);
    const [activeTab, setActiveTab] = useState('browse');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [recipesLoading, setRecipesLoading] = useState(true);

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
            <div className="min-h-screen bg-recipe-light flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-recipe-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Recipe Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-recipe-light">
            <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center py-4">
                        <Link href="/" className="flex items-center space-x-3 group">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-recipe-primary to-recipe-secondary flex items-center justify-center shadow-md">
                                <span className="text-white font-bold text-lg">🍳</span>
                            </div>
                            <h1 className="text-2xl font-display font-bold text-gray-800">
                                Recipe<span className="text-recipe-primary">Hub</span>
                            </h1>
                        </Link>
                        
                        {user && (
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-3">
                                    <Link 
                                        href="/profile" 
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${
                                            pathname.startsWith('/profile')
                                                ? 'bg-recipe-primary text-white font-semibold shadow-md' 
                                                : 'bg-recipe-primary text-white opacity-90 hover:opacity-100 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-semibold">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <span>Profile</span>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="btn-red px-4 py-2 text-sm"
                                    >
                                        Logout
                                    </button>
                                </div> 
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                {user ? (
                    <div className="animate-fade-in">
                        <div className="text-center mb-12 bg-gradient-to-r from-recipe-light to-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                            <h1 className="text-4xl font-display font-bold text-gray-800 mb-4">
                                Welcome Back, <span className="text-recipe-primary">{user.username}</span>!
                            </h1>
                            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                                Ready to discover new recipes or share your culinary creations?
                            </p>
                        </div>

                        <div className="max-w-4xl mx-auto mb-10">
                            <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-inner">
                                <button
                                    onClick={() => setActiveTab('browse')}
                                    className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                        activeTab === 'browse' 
                                            ? 'tab-active shadow-md' 
                                            : 'tab-inactive hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg">📖</span>
                                        Browse Recipes
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('create')}
                                    className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                        activeTab === 'create' 
                                            ? 'tab-active shadow-md' 
                                            : 'tab-inactive hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-lg">✨</span>
                                        Create Recipe
                                    </div>
                                </button>
                            </div>
                        </div>

                        {activeTab === 'browse' ? (
                            <div className="max-w-6xl mx-auto">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-display font-bold text-gray-800 mb-3">
                                        Discover Amazing Recipes
                                    </h2>
                                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                                        Browse through community recipes or create your own!
                                    </p>
                                    
                                    {recipesLoading ? (
                                        <div className="py-12">
                                            <div className="w-12 h-12 border-3 border-recipe-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                            <p className="text-gray-500">Loading delicious recipes...</p>
                                        </div>
                                    ) : recipes.length === 0 ? (
                                        <div className="alert-warning max-w-2xl mx-auto p-6">
                                            <p className="text-lg font-medium mb-2">🍽️ No recipes yet!</p>
                                            <p className="text-gray-700">
                                                Recipe browsing coming soon! Start by creating your first recipe in the "Create Recipe" tab.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="max-w-6xl mx-auto">
                                            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                                                {recipes.map((recipe) => (
                                                    <div key={recipe.id} className="recipe-card recipe-card-hover relative group">
                                                        {recipe.user_id === user.userId && (
                                                            <button
                                                                onClick={() => handleDeleteRecipe(recipe.id)}
                                                                className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-red-500 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-lg z-10"
                                                                title="Delete recipe"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        
                                                        <Link href={`/recipes/${recipe.id}`}>
                                                            <div className="cursor-pointer">
                                                                {recipe.recipe_image ? (
                                                                    <div className="w-full h-56 overflow-hidden rounded-t-xl">
                                                                        <img 
                                                                            src={recipe.recipe_image} 
                                                                            alt={recipe.title}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full h-56 bg-gradient-to-br from-recipe-primary/10 to-recipe-secondary/10 flex items-center justify-center rounded-t-xl">
                                                                        <div className="text-center">
                                                                            <span className="text-4xl">🍳</span>
                                                                            <p className="text-gray-500 text-sm mt-2">No Image</p>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                <div className="p-6">
                                                                    <h3 className="text-xl font-display font-bold text-gray-800 mb-3 group-hover:text-recipe-primary transition-colors line-clamp-1">
                                                                        {recipe.title}
                                                                    </h3>
                                                                    <p className="text-gray-600 text-sm mb-5 line-clamp-2">
                                                                        {recipe.description}
                                                                    </p>
                                                                    
                                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                                        <span className={`tag-${recipe.difficulty} capitalize`}>
                                                                            {recipe.difficulty}
                                                                        </span>
                                                                        <span className="tag-time">
                                                                            ⏱️ {recipe.cooking_time} min
                                                                        </span>
                                                                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                                                                            👥 Serves {recipe.servings}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className="w-8 h-8 rounded-full bg-recipe-accent/20 flex items-center justify-center">
                                                                                <span className="text-sm font-medium text-gray-700">👤</span>
                                                                            </div>
                                                                            <span className="text-sm text-gray-600">By {recipe.username}</span>
                                                                        </div>
                                                                        <span className="text-recipe-primary font-medium text-sm group-hover:underline">
                                                                            View Recipe →
                                                                        </span>
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
                            <RecipeForm onSuccess={handleRecipeSuccess} initialData={{}} />
                        )}
                    </div>
                ) : (
                    <div className="min-h-[calc(100vh-80px)] flex items-center">
                        <div className="w-full">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="text-center lg:text-left animate-fade-in">
                                    <div className="mb-8">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-recipe-primary to-recipe-secondary flex items-center justify-center shadow-xl mx-auto lg:mx-0 mb-6">
                                            <span className="text-white text-3xl">🍳</span>
                                        </div>
                                        <h1 className="text-4xl lg:text-5xl font-display font-bold text-gray-800 mb-4">
                                            Recipe<span className="text-recipe-primary">Hub</span>
                                        </h1>
                                        <p className="text-xl text-gray-600 mb-6 max-w-md mx-auto lg:mx-0">
                                            Share, discover, and organize your favorite recipes with food lovers worldwide.
                                        </p>
                                        
                                        <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                                            <div className="flex items-center gap-2 bg-recipe-light px-4 py-2 rounded-lg">
                                                <span className="text-recipe-primary text-lg">📖</span>
                                                <span className="text-gray-700 font-medium">Hundreds of Recipes</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-recipe-light px-4 py-2 rounded-lg">
                                                <span className="text-recipe-secondary text-lg">👨‍🍳</span>
                                                <span className="text-gray-700 font-medium">Food Enthusiasts</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-recipe-light px-4 py-2 rounded-lg">
                                                <span className="text-recipe-accent text-lg">⭐</span>
                                                <span className="text-gray-700 font-medium">Ratings & Reviews</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden lg:block">
                                        <h3 className="text-lg font-semibold text-gray-700 mb-3">Why join RecipeHub?</h3>
                                        <ul className="space-y-2 text-gray-600">
                                            <li className="flex items-center gap-2">
                                                <span className="text-recipe-success">✓</span>
                                                Save and organize your favorite recipes
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-recipe-success">✓</span>
                                                Share your culinary creations with others
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-recipe-success">✓</span>
                                                Discover recipes from home cooks worldwide
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className="text-recipe-success">✓</span>
                                                Get personalized recipe recommendations
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Right Side - Auth Forms */}
                                <div className="animate-slide-up">
                                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                                        {/* Auth Tabs */}
                                        <div className="flex mb-8 bg-gray-100 rounded-xl p-1.5">
                                            <button
                                                onClick={() => setShowLogin(false)}
                                                className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                                    !showLogin 
                                                        ? 'tab-active shadow-md' 
                                                        : 'tab-inactive hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-lg">📝</span>
                                                    Register
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setShowLogin(true)}
                                                className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                                    showLogin 
                                                        ? 'tab-active shadow-md' 
                                                        : 'tab-inactive hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-lg">🔐</span>
                                                    Login
                                                </div>
                                            </button>
                                        </div>

                                        {/* Form */}
                                        <div className="max-w-md mx-auto">
                                            {showLogin ? <LoginForm /> : <RegistrationForm />}
                                        </div>

                                        {/* Divider */}
                                        <div className="relative my-8">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-4 bg-white text-gray-500">Or continue with</span>
                                            </div>
                                        </div>

                                        {/* Social Login (Placeholder) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors">
                                                <span className="text-blue-600">f</span>
                                                <span className="text-gray-700 font-medium">Facebook</span>
                                            </button>
                                            <button className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors">
                                                <span className="text-red-600">G</span>
                                                <span className="text-gray-700 font-medium">Google</span>
                                            </button>
                                        </div>

                                        {/* Terms */}
                                        <p className="text-center text-gray-500 text-sm mt-8">
                                            By signing up, you agree to our{' '}
                                            <a href="#" className="text-recipe-primary hover:underline">Terms</a>{' '}
                                            and{' '}
                                            <a href="#" className="text-recipe-primary hover:underline">Privacy Policy</a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}