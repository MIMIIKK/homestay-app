import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PasswordStrengthBar from '../components/PasswordStrengthBar';
import Captcha from '../components/Captcha';
import Navbar from '../components/Navbar';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    role: 'guest',
    captcha: ''
  });

  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [passwordScore, setPasswordScore] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roles = [
    {
      value: 'guest',
      label: 'Guest',
      description: 'I want to book homestays',
      icon: '🏠'
    },
    {
      value: 'host',
      label: 'Host',
      description: 'I want to list my property',
      icon: '🏡'
    }
  ];

  const passwordsMatch = form.password === form.confirm_password || form.confirm_password === '';

  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/captcha/');
      setCaptcha(res.data);
      setSessionId(res.data.session_id);
    } catch (error) {
      setError("Failed to load CAPTCHA. Please refresh.");
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return form.username && form.email && form.role;
      case 2:
        return form.first_name && form.last_name && form.phone && form.address;
      case 3:
        return form.password && form.confirm_password && passwordsMatch && passwordScore >= 3;
      case 4:
        return form.captcha;
      default:
        return false;
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (error) setError('');
    
    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    // Enhanced password strength calculation
    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ];
    
    score = checks.filter(check => check).length;
    
    // Additional checks for bonus points
    if (password.length >= 12) score += 0.5;
    if (password.length >= 16) score += 0.5;
    
    // Penalty for common patterns
    if (/(.)\1{2,}/.test(password)) score -= 0.5;
    if (/123|abc|qwerty/i.test(password)) score -= 0.5;
    
    setPasswordScore(Math.max(0, Math.min(5, score)));
  };

  const handleNextStep = async () => {
    if (!validateStep(currentStep)) {
      setError('Please fill in all required fields correctly.');
      return;
    }

    if (currentStep === 3) {
      // Before showing CAPTCHA, validate password strength
      if (passwordScore < 3) {
        setError('Password is too weak. Please choose a stronger password.');
        return;
      }
      
      // Load CAPTCHA for final step
      await fetchCaptcha();
    }

    setCurrentStep(currentStep + 1);
    setError('');
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Debug logging
      console.log('Form data before submit:', form);
      console.log('Session ID:', sessionId);
      console.log('CAPTCHA answer:', form.captcha);
      
      // Create payload with ALL form fields including confirm_password
      const payload = { 
        ...form, 
        session_id: sessionId 
      };
      
      // DO NOT remove confirm_password here - let the backend handle it
      console.log('Payload being sent:', payload);

      const res = await api.post('/register/', payload);
      
      setMessage(res.data.message);
      
      // Store user ID for OTP verification
      if (res.data.user_id) {
        localStorage.setItem('pendingUserId', res.data.user_id);
        setTimeout(() => navigate('/verify-email'), 2000);
      } else {
        setTimeout(() => navigate('/login'), 2000);
      }
      
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      
      const errData = err.response?.data;
      if (errData) {
        if (errData.password_errors) {
          setError(errData.password_errors.join(' '));
        } else if (errData.error) {
          setError(errData.error);
        } else if (errData.details) {
          setError(`${errData.error} - ${errData.details}`);
        } else {
          // Handle serializer errors
          const errorMessages = [];
          Object.keys(errData).forEach(field => {
            if (Array.isArray(errData[field])) {
              errorMessages.push(`${field}: ${errData[field].join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${errData[field]}`);
            }
          });
          setError(errorMessages.join('; '));
        }
      } else {
        setError('Registration failed. Please try again.');
      }
      
      // Reload CAPTCHA on error
      if (currentStep === 4) {
        await fetchCaptcha();
        setForm(prev => ({ ...prev, captcha: '' })); // Clear captcha field
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="d-flex justify-content-between mb-4">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="d-flex align-items-center">
          <div className={`rounded-circle d-flex align-items-center justify-content-center ${
            step <= currentStep ? 'bg-primary text-white' : 'bg-light text-muted'
          }`} style={{ width: '40px', height: '40px' }}>
            {step < currentStep ? '✓' : step}
          </div>
          {step < 4 && (
            <div className={`flex-fill mx-2 ${
              step < currentStep ? 'bg-primary' : 'bg-light'
            }`} style={{ height: '2px' }}></div>
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h4 className="mb-3">Account Information</h4>
      
      {/* Role Selection */}
      <div className="mb-4">
        <label className="form-label fw-bold">I want to join as:</label>
        <div className="row g-3">
          {roles.map(role => (
            <div key={role.value} className="col-md-6">
              <div 
                className={`card h-100 cursor-pointer border-2 ${
                  form.role === role.value ? 'border-primary bg-primary bg-opacity-10' : 'border-light'
                }`}
                onClick={() => setForm(prev => ({ ...prev, role: role.value }))}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-body text-center">
                  <div className="fs-1 mb-2">{role.icon}</div>
                  <h5 className="card-title">{role.label}</h5>
                  <p className="card-text text-muted small">{role.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Username *</label>
        <input 
          type="text" 
          name="username" 
          className="form-control" 
          value={form.username}
          onChange={handleChange} 
          required 
          minLength={3}
          placeholder="Choose a unique username"
        />
        <div className="form-text">At least 3 characters, letters and numbers only</div>
      </div>

      <div className="mb-3">
        <label className="form-label">Email Address *</label>
        <input 
          type="email" 
          name="email" 
          className="form-control" 
          value={form.email}
          onChange={handleChange} 
          required 
          placeholder="your@email.com"
        />
        <div className="form-text">We'll send you a verification code</div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h4 className="mb-3">Personal Information</h4>
      
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">First Name *</label>
          <input 
            type="text" 
            name="first_name" 
            className="form-control" 
            value={form.first_name}
            onChange={handleChange} 
            required 
            placeholder="John"
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Last Name *</label>
          <input 
            type="text" 
            name="last_name" 
            className="form-control" 
            value={form.last_name}
            onChange={handleChange} 
            required 
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Phone Number *</label>
        <input 
          type="tel" 
          name="phone" 
          className="form-control" 
          value={form.phone}
          onChange={handleChange} 
          required 
          placeholder="+1234567890"
        />
        <div className="form-text">Include country code</div>
      </div>

      <div className="mb-3">
        <label className="form-label">Address *</label>
        <textarea 
          name="address" 
          className="form-control" 
          rows="3"
          value={form.address}
          onChange={handleChange} 
          required 
          placeholder="Your full address"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h4 className="mb-3">Security</h4>
      
      <div className="mb-3">
        <label className="form-label">Password *</label>
        <div className="input-group">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <PasswordStrengthBar password={form.password} />
      </div>

      <div className="mb-3">
        <label className="form-label">Confirm Password *</label>
        <div className="input-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirm_password"
            className={`form-control ${!passwordsMatch ? 'is-invalid' : ''}`}
            value={form.confirm_password}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
        {!passwordsMatch && (
          <div className="invalid-feedback d-block">
            Passwords do not match
          </div>
        )}
      </div>

      <div className="alert alert-info">
        <small>
          <strong>Password Requirements:</strong>
          <ul className="mb-0 mt-1">
            <li>At least 8 characters long</li>
            <li>Include uppercase and lowercase letters</li>
            <li>Include numbers and special characters</li>
            <li>Avoid common words or personal information</li>
          </ul>
        </small>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h4 className="mb-3">Verification</h4>
      
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        Please complete the security verification to finish registration.
      </div>

      {captcha && (
        <>
          <Captcha captcha={captcha} onRefresh={fetchCaptcha} />
          <div className="mb-3">
            <label className="form-label">Enter CAPTCHA Code *</label>
            <input
              type="text"
              name="captcha"
              className="form-control"
              value={form.captcha}
              onChange={handleChange}
              required
              placeholder="Enter the code above"
              autoComplete="off"
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container d-flex justify-content-center align-items-center py-5">
        <div className="p-4 shadow rounded bg-white" style={{ width: '100%', maxWidth: '600px' }}>
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Join Homestay</h2>
            <p className="text-muted">Create your account in just a few steps</p>
          </div>

          {renderStepIndicator()}

          {message && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle me-2"></i>
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            <div className="d-flex justify-content-between mt-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handlePrevStep}
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              
              <div className="ms-auto">
                {currentStep < 4 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextStep}
                    disabled={loading || !validateStep(currentStep)}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading || !validateStep(currentStep)}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="text-center mt-4">
            <p className="text-muted">
              Already have an account?{' '}
              <Link to="/login" className="text-primary fw-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;