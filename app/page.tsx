'use client';
import { useAuth } from '../context/AuthContext';
import RegistrationForm from '../components/RegistrationForm';
import LoginForm from '../components/LoginForm';
import { useState } from 'react';

export default function Home() {
    const { user, logout, loading } = useAuth();
    const [showLogin, setShowLogin] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
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
                    // Simple dashboard for logged-in users
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">Dashboard</h1>
                        <p className="text-gray-600 mb-8">
                            Welcome to your Recipe Hub dashboard! You have successfully logged in.
                        </p>
                        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                🎉 Login Successful!
                            </h2>
                            <p className="text-gray-600">
                                You are now logged in as <strong>{user.username}</strong>.
                            </p>
                        </div>
                    </div>
                ) : (
                    // Auth forms for non-logged-in users
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