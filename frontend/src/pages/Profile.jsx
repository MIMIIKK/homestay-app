import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';
import Navbar from '../components/Navbar';
import '../../public/styles/profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: ''
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await api.get('/user/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data);
        setFormData({
          username: response.data.username,
          email: response.data.email,
          phone: response.data.phone || '',
          address: response.data.address || ''
        });
        if (response.data.avatar) {
          // Add the base URL if it's not already included
          const avatarUrl = response.data.avatar.startsWith('http') 
            ? response.data.avatar 
            : `http://localhost:8000${response.data.avatar}`;
          setAvatarPreview(avatarUrl);
        }
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    if (editMode && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type and size
    if (!file.type.match('image.*')) {
      alert('Please select an image file (JPEG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await axios.patch(
        'http://localhost:8000/api/user/avatar/', 
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      // Update avatar preview with the new URL from server
      const avatarUrl = response.data.avatar_url.startsWith('http')
        ? response.data.avatar_url
        : `http://localhost:8000${response.data.avatar_url}`;
      
      setAvatarPreview(avatarUrl);
      setUser(prev => ({ ...prev, avatar: avatarUrl }));

    } catch (error) {
      console.error('Avatar upload failed:', error);
      alert(`Failed to upload avatar: ${error.response?.data?.error || error.message}`);
      // Revert to previous avatar if upload fails
      if (user?.avatar) {
        setAvatarPreview(user.avatar);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.patch('/user/', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(prev => ({ ...prev, ...formData }));
      setEditMode(false);
    } catch (error) {
      console.error('Update failed:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <Navbar />
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />
      
      <main className="profile-container">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        
        {/* Profile Header */}
        <header className="profile-header">
          <div className="profile-avatar-container">
            <div 
              className="profile-avatar"
              onClick={handleAvatarClick}
              style={{ cursor: editMode ? 'pointer' : 'default' }}
            >
              <img 
                src={avatarPreview || '/images/default-avatar.png'} 
                alt={`${user.username}'s avatar`}
                className="avatar-image"
                onError={(e) => {
                  e.target.src = '/images/default-avatar.png';
                }}
              />
              {editMode && (
                <div className="avatar-edit-overlay">
                  <i className="bi bi-camera"></i>
                  <span>Change Photo</span>
                </div>
              )}
              {isUploading && (
                <div className="upload-progress">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          <h1 className="profile-username">{user.username}</h1>
          <div className="profile-actions">
            {editMode ? (
              <>
                <button 
                  className="btn-outline" 
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSubmit}
                  disabled={isUploading}
                >
                  {isUploading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn-outline" 
                  onClick={() => setEditMode(true)}
                >
                  Edit Profile
                </button>
                <button 
                  className="btn-logout" 
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </header>

        {/* Profile Details */}
        <section className="profile-details">
          <div className="details-card">
            <h2 className="details-title">Personal Information</h2>
            
            {editMode ? (
              <form className="profile-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Add phone number"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Add your address"
                    rows="3"
                  />
                </div>
              </form>
            ) : (
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Username</span>
                  <span className="info-value">{user.username}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">
                    {user.phone || <span className="text-muted">Not provided</span>}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address</span>
                  <span className="info-value">
                    {user.address || <span className="text-muted">Not provided</span>}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;