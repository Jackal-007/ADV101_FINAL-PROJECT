'use client';
import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('🔐 Checking auth status, token exists:', !!token);
            
            if (token) {
                const userData = JSON.parse(localStorage.getItem('userData'));
                console.log('🔐 User data from localStorage:', userData);
                console.log('🔐 User ID from localStorage:', userData?.id);
                setUser(userData);
            }
        } catch (error) {
            console.error('Auth check error:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                

                console.log('🔐 Login successful, token received:', data.token);
                console.log('🔐 User data received:', data.user);
                console.log('🔐 User ID:', data.user?.id);
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                setUser(data.user);
                return { success: true, data };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                return { success: true, message: 'Registration successful' };
            } else {
                const error = await response.json();
                return { success: false, message: error.message };
            }
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    };

    const logout = () => {
        console.log('🔐 Logging out, clearing token');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setUser(null);
    };


    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loading,
            token: getToken() 
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);