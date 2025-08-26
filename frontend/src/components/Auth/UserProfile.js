// frontend/src/components/Auth/UserProfile.js
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setMessage(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
    });
    setIsEditing(false);
    setMessage('');
  };

  const handleLogout = async () => {
    await logout();
    // Navigation will be handled by the auth context
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return '#e53e3e';
      case 'operator':
        return '#dd6b20';
      case 'viewer':
        return '#38a169';
      default:
        return '#718096';
    }
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <i className="fas fa-exclamation-triangle"></i>
          <p>User information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="fas fa-user"></i>
          </div>
          <h2>User Profile</h2>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            <i className={`fas ${message.includes('success') ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={!isEditing || loading}
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <div className="role-display">
              <span 
                className="role-badge" 
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                {user.role}
              </span>
              <small>Role cannot be changed</small>
            </div>
          </div>

          <div className="form-group">
            <label>User ID</label>
            <input
              type="text"
              value={user.id}
              disabled
              className="readonly-field"
            />
          </div>

          <div className="form-actions">
            {!isEditing ? (
              <div className="button-group">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="edit-button"
                >
                  <i className="fas fa-edit"></i>
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="logout-button"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  Logout
                </button>
              </div>
            ) : (
              <div className="button-group">
                <button
                  type="submit"
                  disabled={loading}
                  className="save-button"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="cancel-button"
                >
                  <i className="fas fa-times"></i>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
