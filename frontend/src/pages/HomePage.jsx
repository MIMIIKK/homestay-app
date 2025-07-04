import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import HomePublic from './HomePublic';
import HomePrivate from './HomePrivate';
import Navbar from '../components/Navbar';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, show public homepage
        setLoading(false);
        return;
      }

      // Set authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Try to fetch user data
      const response = await api.get('/user/');
      setUser(response.data);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.data));
      
    } catch (err) {
      console.error('Auth check failed:', err);
      
      // Clear invalid token and show public homepage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '70vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="text-muted">Loading...</h4>
            <p className="text-muted">Please wait while we set up your experience</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mt-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="alert alert-warning text-center">
                <i className="bi bi-exclamation-triangle fs-1 text-warning mb-3"></i>
                <h4>Session Issue</h4>
                <p>{error}</p>
                <button 
                  className="btn btn-primary me-2"
                  onClick={() => navigate('/login')}
                >
                  Log In
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setError('');
                    setUser(null);
                  }}
                >
                  Continue as Guest
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Render appropriate homepage based on authentication status
  if (user) {
    // User is logged in - show private homepage
    return <HomePrivate user={user} />;
  } else {
    // No user - show public homepage
    return <HomePublic />;
  }
};

export default HomePage;