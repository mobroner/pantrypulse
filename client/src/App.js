import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import api from './api';

// Components
import Header from './components/layout/Header';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import PrivateRoute from './components/routing/PrivateRoute';
import GroupManager from './components/groups/GroupManager';

function App() {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setAuthToken(null);
        setUser(null);
        navigate('/login');
    }, [navigate]);

    // Effect to handle token on initial load and from Google OAuth redirect
    useEffect(() => {
        const token = new URLSearchParams(location.search).get('token');
        if (token) {
            localStorage.setItem('token', token);
            setAuthToken(token);
            const decoded = jwt_decode(token);
            setUser(decoded);
            navigate('/'); // Navigate to dashboard after Google login
        } else {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setAuthToken(storedToken);
                const decoded = jwt_decode(storedToken);
                // Check if token is expired
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    logout();
                } else {
                    setUser(decoded);
                }
            }
        }
    }, [location, navigate, logout]);

    const setAuthToken = token => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Header user={user} logout={logout} />
            <main className="container mx-auto p-4">
                <Routes>
                    <Route path="/login" element={<Login setUser={setUser} />} />
                    <Route path="/register" element={<Register setUser={setUser} />} />
                    <Route path="/" element={
                        <PrivateRoute user={user}>
                            <Dashboard user={user} />
                        </PrivateRoute>
                    } />
                    <Route path="/manage-groups" element={
                        <PrivateRoute user={user}>
                            <GroupManager user={user} />
                        </PrivateRoute>
                    } />
                </Routes>
            </main>
        </div>
    );
}

export default App;
