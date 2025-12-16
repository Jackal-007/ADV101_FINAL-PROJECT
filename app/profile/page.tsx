'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation'; 
import Link from 'next/link';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    profile_picture: string | null;
    bio: string | null;
    created_at: string;
    total_recipes: number;
    avg_rating: number;
    five_star_reviews: number;
}

interface UserRecipe {
    id: number;
    title: string;
    description: string;
    cooking_time: number;
    difficulty: string;
    servings: number;
    recipe_image: string | null;
    created_at: string;
    review_count: number;
    avg_rating: number;
    five_star_count: number;
    ingredients: any[];  
    instructions: any[]; 
}

interface EditProfileModalProps {
    profile: UserProfile | null;
    token: string;
    onClose: () => void;
    onUpdate: (updatedProfile: UserProfile) => void;
}

interface ChangePasswordModalProps {
    token: string;
    onClose: () => void;
}

export default function ProfilePage() {
    const { user, token, logout, updateUserData } = useAuth();
    const router = useRouter();
    const pathname = usePathname(); 

    console.log('Profile Page - Current pathname:', pathname); 
    
    const [activeTab, setActiveTab] = useState('overview');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [recipes, setRecipes] = useState<UserRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/');
            return;
        }
        fetchProfileData();
    }, [user]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            
            const profileRes = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                setProfile(profileData.user);
            } else {
                console.error('Profile fetch failed:', profileRes.status);
            }

            try {
                const recipesRes = await fetch('/api/users/me/recipes', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (recipesRes.ok) {
                    const recipesData = await recipesRes.json();
                    setRecipes(recipesData.recipes || []); 
                } else {
                    console.error('Recipes fetch failed:', recipesRes.status);
                    setRecipes([]); 
                }
            } catch (recipeError) {
                console.error('Recipes API error:', recipeError);
                setRecipes([]); 
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-recipe-light flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-recipe-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-recipe-light">

                <nav className="bg-white shadow-lg border-b border-gray-200">
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
                            
                            <div className="flex items-center space-x-4">
                                <Link 
                                    href="/" 
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                                        pathname === '/' || pathname === ''
                                            ? 'bg-recipe-primary text-white font-semibold shadow-md' 
                                            : 'bg-recipe-primary text-white opacity-90 hover:opacity-100 hover:shadow-md'
                                    }`}
                                >
                                    Home
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn-red px-4 py-2 text-sm rounded-lg hover:scale-105 transition-all duration-200"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                {profile?.profile_picture ? (
                                    <img 
                                        src={profile.profile_picture} 
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-recipe-primary to-recipe-secondary flex items-center justify-center">
                                        <span className="text-white text-4xl font-bold">
                                            {profile?.username?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="absolute bottom-2 right-2 bg-recipe-primary text-white p-2 rounded-full hover:bg-[#e55a2b] transition-colors shadow-lg"
                                title="Edit Profile"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl font-display font-bold text-gray-800 mb-2">
                                {profile?.username}
                            </h1>
                            <p className="text-gray-600 mb-4">{profile?.email}</p>
                            
                            {profile?.bio && (
                                <p className="text-gray-700 mb-6 max-w-2xl">{profile.bio}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4">
                                <div className="bg-recipe-light px-4 py-2 rounded-lg">
                                    <div className="text-2xl font-bold text-recipe-primary text-center">
                                        {profile?.total_recipes || 0}
                                    </div>
                                    <div className="text-gray-600 text-sm">Recipes</div>
                                </div>
                                
                                <div className="bg-recipe-light px-4 py-2 rounded-lg">
                                    <div className="text-2xl font-bold text-recipe-secondary text-center">
                                        {profile?.five_star_reviews || 0}
                                    </div>
                                    <div className="text-gray-600 text-sm">5★ Reviews</div>
                                </div>
                                
                                <div className="bg-recipe-light px-4 py-2 rounded-lg">
                                    <div className="text-2xl font-bold text-recipe-accent text-center">
                                        {profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : '0.0'}
                                    </div>
                                    <div className="text-gray-600 text-sm">Avg Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex bg-gray-100 rounded-xl p-1.5 shadow-inner">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                activeTab === 'overview' 
                                    ? 'tab-active shadow-md' 
                                    : 'tab-inactive hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">📊</span>
                                Overview
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('recipes')}
                            className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                activeTab === 'recipes' 
                                    ? 'tab-active shadow-md' 
                                    : 'tab-inactive hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">📖</span>
                                My Recipes ({recipes.length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 text-center font-medium ${
                                activeTab === 'settings' 
                                    ? 'tab-active shadow-md' 
                                    : 'tab-inactive hover:bg-gray-50'
                            }`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-lg">⚙️</span>
                                Settings
                            </div>
                        </button>
                    </div>
                </div>

                <div className="animate-fade-in">
                    {activeTab === 'overview' && (
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-display font-bold text-gray-800 mb-4">
                                    Recent Activity
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 bg-recipe-light rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <span className="text-green-600">📝</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Joined RecipeHub</p>
                                            <p className="text-sm text-gray-600">
                                                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-recipe-light rounded-lg">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <span className="text-blue-600">🍳</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Created {profile?.total_recipes || 0} recipes</p>
                                            <p className="text-sm text-gray-600">Keep cooking!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h3 className="text-xl font-display font-bold text-gray-800 mb-4">
                                    Your Stats
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                                        <span className="text-gray-700">Total Recipes</span>
                                        <span className="font-bold text-recipe-primary">{profile?.total_recipes || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                                        <span className="text-gray-700">Average Rating</span>
                                        <span className="font-bold text-recipe-secondary">
                                            {profile?.avg_rating ? Number(profile.avg_rating).toFixed(1) : '0.0'} ★
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 border-b border-gray-100">
                                        <span className="text-gray-700">5-Star Reviews</span>
                                        <span className="font-bold text-yellow-500">{profile?.five_star_reviews || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3">
                                        <span className="text-gray-700">Member Since</span>
                                        <span className="font-bold text-gray-800">
                                            {profile?.created_at ? new Date(profile.created_at).getFullYear() : '2024'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'recipes' && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-display font-bold text-gray-800">
                                    My Recipes ({recipes.length})
                                </h3>
                                <Link
                                    href="/"
                                    className="btn-primary px-4 py-2"
                                >
                                    + Create New Recipe
                                </Link>
                            </div>

                            {recipes.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                                    <div className="text-5xl mb-4">🍳</div>
                                    <h3 className="text-xl font-display font-bold text-gray-800 mb-2">No Recipes Yet</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                        Start sharing your culinary creations with the community!
                                    </p>
                                    <Link
                                        href="/"
                                        className="btn-primary px-6 py-3"
                                    >
                                        Create Your First Recipe
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {recipes.map((recipe) => (
                                        <div key={recipe.id} className="recipe-card recipe-card-hover">
                                            <Link href={`/recipes/${recipe.id}`}>
                                                <div className="cursor-pointer">
                                                    {recipe.recipe_image ? (
                                                        <div className="w-full h-48 overflow-hidden rounded-t-xl">
                                                            <img 
                                                                src={recipe.recipe_image} 
                                                                alt={recipe.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-48 bg-gradient-to-br from-recipe-primary/10 to-recipe-secondary/10 flex items-center justify-center rounded-t-xl">
                                                            <div className="text-center">
                                                                <span className="text-4xl">🍳</span>
                                                                <p className="text-gray-500 text-sm mt-2">No Image</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    

                                                    <div className="p-5">
                                                        <h3 className="text-lg font-display font-bold text-gray-800 mb-2 line-clamp-1">
                                                            {recipe.title}
                                                        </h3>
                                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                            {recipe.description}
                                                        </p>
                                                        
                                                        <div className="flex flex-wrap gap-2 mb-4">
                                                            <span className={`tag-${recipe.difficulty.toLowerCase()} capitalize`}>
                                                                {recipe.difficulty}
                                                            </span>
                                                            <span className="tag-time">
                                                                ⏱️ {recipe.cooking_time} min
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                            
                                            <div className="p-5 pt-0 mt-4">
                                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-500">★</span>
                                                        <span className="text-sm text-gray-700 font-medium">
                                                            {recipe.avg_rating ? Number(recipe.avg_rating).toFixed(1) : '0.0'}
                                                        </span>
                                                        <span className="text-gray-500 text-sm">
                                                            ({recipe.review_count})
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/recipes/${recipe.id}/edit`}
                                                        className="text-recipe-primary text-sm font-medium hover:underline"
                                                    >
                                                        Edit →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 max-w-2xl mx-auto">
                            <h3 className="text-2xl font-display font-bold text-gray-800 mb-6">
                                Account Settings
                            </h3>
                            
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Profile Picture
                                    </h4>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                                            {profile?.profile_picture ? (
                                                <img 
                                                    src={profile.profile_picture} 
                                                    alt={profile.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-r from-recipe-primary to-recipe-secondary flex items-center justify-center">
                                                    <span className="text-white text-2xl font-bold">
                                                        {profile?.username?.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    id="profile-picture"
                                                    className="hidden"
                                                        onChange={async (e) => {;
                                                        
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const formData = new FormData();
                                                            formData.append('profile_picture', file);
                                                            
                                                            try {
                                                                const res = await fetch('/api/users/profile/picture', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Authorization': `Bearer ${token}`
                                                                    },
                                                                    body: formData
                                                                });
                                                                
                                                                if (res.ok) {
                                                                    const data = await res.json();
                                                                    setProfile({...profile, ...data.user});
                                                                    updateUserData(data.user);
                                                                    alert('Profile picture updated!');
                                                                }
                                                            } catch (error) {
                                                                console.error('Upload error:', error);
                                                            }
                                                        }
                                                    }}
                                                />
                                                <label 
                                                    htmlFor="profile-picture"
                                                    className="btn-outline px-4 py-2 cursor-pointer inline-block text-sm"
                                                >
                                                    Change Picture
                                                </label>
                                                
                                                {profile?.profile_picture && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Are you sure you want to remove your profile picture?')) {
                                                                try {
                                                                    const res = await fetch('/api/users/profile/picture', {
                                                                        method: 'DELETE',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${token}`
                                                                        }
                                                                    });
                                                                    
                                                                    if (res.ok) {
                                                                        const data = await res.json();
                                                                        setProfile({...profile, ...data.user});
                                                                        alert('Profile picture removed!');
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Remove error:', error);
                                                                }
                                                            }
                                                        }}
                                                        className="btn-red px-4 py-2 text-sm"
                                                    >
                                                        Remove Picture
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-gray-500 text-sm">
                                                JPG, PNG or GIF • Max 5MB
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Username
                                    </h4>
                                    <p className="text-gray-600 mb-2">Current: {profile?.username}</p>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="btn-outline px-4 py-2"
                                    >
                                        Change Username
                                    </button>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Email Address
                                    </h4>
                                    <p className="text-gray-600 mb-2">Current: {profile?.email}</p>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="btn-outline px-4 py-2"
                                    >
                                        Change Email
                                    </button>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Password
                                    </h4>
                                    <button
                                        onClick={() => setShowChangePassword(true)}
                                        className="btn-outline px-4 py-2"
                                    >
                                        Change Password
                                    </button>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                        Bio
                                    </h4>
                                    <p className="text-gray-600 mb-2">
                                        {profile?.bio || 'No bio added yet.'}
                                    </p>
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="btn-outline px-4 py-2"
                                    >
                                        {profile?.bio ? 'Edit Bio' : 'Add Bio'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showEditModal && (
                <EditProfileModal 
                    profile={profile}
                    token={token}
                    onClose={() => setShowEditModal(false)}
                    onUpdate={(updatedProfile: UserProfile) => {
                        setProfile(updatedProfile);
                        setShowEditModal(false);
                    }}
                />
            )}

            {showChangePassword && (
                <ChangePasswordModal 
                    token={token}
                    onClose={() => setShowChangePassword(false)}
                />
            )}
        </div>
    );
}

function ChangePasswordModal({ token, onClose }: ChangePasswordModalProps) {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSuccess('Password changed successfully!');
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => onClose(), 2000);
            } else {
                setError(data.error || 'Password change failed');
            }
        } catch (error) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-display font-bold text-gray-800">
                            Change Password
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="alert-error">
                                {error}
                            </div>
                        )}
                        
                        {success && (
                            <div className="alert-success">
                                {success}
                            </div>
                        )}

                        <div>
                            <label className="form-label">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                                    className="form-input pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="form-label">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                                    className="form-input pr-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    className="form-input pr-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="showPassword"
                                checked={showPassword}
                                onChange={(e) => setShowPassword(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <label htmlFor="showPassword" className="text-sm text-gray-600">
                                Show passwords
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-outline flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function EditProfileModal({ profile, token, onClose, onUpdate }: EditProfileModalProps) {
    const { updateUserData } = useAuth();
    
    const [formData, setFormData] = useState({
        username: profile?.username || '',
        email: profile?.email || '',
        bio: profile?.bio || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters');
            setLoading(false);
            return;
        }

        if (formData.username.length > 50) {
            setError('Username must be less than 50 characters');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                onUpdate(data.user);
                
                updateUserData(data.user);
                
                setTimeout(() => {
                    window.location.reload();
                }, 500);
                
            } else {
                setError(data.error || 'Update failed');
            }
        } catch (error) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-display font-bold text-gray-800">
                            Edit Profile
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="alert-error">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="form-label">Username *</label>
                            <input
                                type="text"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                                className="form-input"
                                required
                                minLength={3}
                                maxLength={50}
                                placeholder="Enter new username"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Must be 3-50 characters
                            </p>
                        </div>

                        <div>
                            <label className="form-label">Email Address *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="form-input"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                className="form-input"
                                rows={3}
                                placeholder="Tell us about yourself..."
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.bio?.length || 0}/500 characters
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-outline flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 
