import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PasswordStrengthBar from '../components/PasswordStrengthBar';
import Captcha from '../components/Captcha';
import Navbar from '../components/Navbar';
import './Register.css'; // Add this CSS file

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
    
    if (error) setError('');
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9]/.test(password)
    ];
    
    score = checks.filter(check => check).length;
    
    if (password.length >= 12) score += 0.5;
    if (password.length >= 16) score += 0.5;
    
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
      if (passwordScore < 3) {
        setError('Password is too weak. Please choose a stronger password.');
        return;
      }
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
      console.log('Form data before submit:', form);
      console.log('Session ID:', sessionId);
      console.log('CAPTCHA answer:', form.captcha);
      
      const payload = { 
        ...form, 
        session_id: sessionId 
      };
      
      console.log('Payload being sent:', payload);

      const res = await api.post('/register/', payload);
      
      setMessage(res.data.message);
      
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
      
      if (currentStep === 4) {
        await fetchCaptcha();
        setForm(prev => ({ ...prev, captcha: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="modern-step-indicator mb-5">
      <div className="step-progress-line"></div>
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="step-item">
          <div className={`step-circle ${step <= currentStep ? 'active' : ''}`}>
            {step < currentStep ? '✨' : step}
          </div>
          <small className={`step-label ${step <= currentStep ? 'active' : ''}`}>
            {['Account', 'Personal', 'Security', 'Verify'][step - 1]}
          </small>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <div className="step-header">
        <h4 className="step-title">✨ Account Information</h4>
        <p className="step-subtitle">Let's start with the basics</p>
      </div>
      
      <div className="mb-4">
        <label className="modern-label">I want to join as:</label>
        <div className="row g-3">
          {roles.map(role => (
            <div key={role.value} className="col-md-6">
              <div 
                className={`role-card ${form.role === role.value ? 'selected' : ''}`}
                onClick={() => setForm(prev => ({ ...prev, role: role.value }))}
              >
                <div className="role-icon">{role.icon}</div>
                <h5 className="role-title">{role.label}</h5>
                <p className="role-description">{role.description}</p>
                {form.role === role.value && (
                  <div className="role-badge">
                    <span className="selected-badge">Selected ✨</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="modern-label">Username *</label>
        <div className="modern-input-group">
          <input 
            type="text" 
            name="username" 
            className="modern-input" 
            value={form.username}
            onChange={handleChange} 
            required 
            minLength={3}
            placeholder="Choose a unique username"
          />
          <div className="input-icon">👤</div>
        </div>
        <div className="input-help">At least 3 characters, letters and numbers only</div>
      </div>

      <div className="mb-4">
        <label className="modern-label">Email Address *</label>
        <div className="modern-input-group">
          <input 
            type="email" 
            name="email" 
            className="modern-input" 
            value={form.email}
            onChange={handleChange} 
            required 
            placeholder="your@email.com"
          />
          <div className="input-icon">📧</div>
        </div>
        <div className="input-help">We'll send you a verification code</div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="step-header">
        <h4 className="step-title">👤 Personal Information</h4>
        <p className="step-subtitle">Tell us a bit about yourself</p>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <label className="modern-label">First Name *</label>
          <div className="modern-input-group">
            <input 
              type="text" 
              name="first_name" 
              className="modern-input" 
              value={form.first_name}
              onChange={handleChange} 
              required 
              placeholder="John"
            />
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <label className="modern-label">Last Name *</label>
          <div className="modern-input-group">
            <input 
              type="text" 
              name="last_name" 
              className="modern-input" 
              value={form.last_name}
              onChange={handleChange} 
              required 
              placeholder="Doe"
            />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="modern-label">Phone Number *</label>
        <div className="modern-input-group">
          <input 
            type="tel" 
            name="phone" 
            className="modern-input" 
            value={form.phone}
            onChange={handleChange} 
            required 
            placeholder="+1234567890"
          />
          <div className="input-icon">📱</div>
        </div>
        <div className="input-help">Include country code</div>
      </div>

      <div className="mb-4">
        <label className="modern-label">Address *</label>
        <div className="modern-input-group">
          <textarea 
            name="address" 
            className="modern-input modern-textarea" 
            rows="3"
            value={form.address}
            onChange={handleChange} 
            required 
            placeholder="Your full address"
          />
          <div className="input-icon">🏠</div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <div className="step-header">
        <h4 className="step-title">🔒 Security</h4>
        <p className="step-subtitle">Keep your account safe</p>
      </div>
      
      <div className="mb-4">
        <label className="modern-label">Password *</label>
        <div className="modern-input-group">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            className="modern-input"
            value={form.password}
            onChange={handleChange}
            required
            minLength={8}
            placeholder="Create a strong password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
        <PasswordStrengthBar password={form.password} />
      </div>

      <div className="mb-4">
        <label className="modern-label">Confirm Password *</label>
        <div className="modern-input-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirm_password"
            className={`modern-input ${!passwordsMatch ? 'error' : ''}`}
            value={form.confirm_password}
            onChange={handleChange}
            required
            placeholder="Confirm your password"
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
          </button>
        </div>
        {!passwordsMatch && (
          <div className="error-message">
            Passwords do not match
          </div>
        )}
      </div>

      <div className="password-requirements">
        <div className="requirements-header">
          <i className="requirements-icon">🛡️</i>
          <strong>Password Requirements</strong>
        </div>
        <ul className="requirements-list">
          <li className={`requirement-item ${form.password.length >= 8 ? 'valid' : ''}`}>
            <span className="requirement-check">{form.password.length >= 8 ? '✅' : '⭕'}</span>
            At least 8 characters
          </li>
          <li className={`requirement-item ${/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? 'valid' : ''}`}>
            <span className="requirement-check">{/[A-Z]/.test(form.password) && /[a-z]/.test(form.password) ? '✅' : '⭕'}</span>
            Upper & lowercase letters
          </li>
          <li className={`requirement-item ${/[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? 'valid' : ''}`}>
            <span className="requirement-check">{/[0-9]/.test(form.password) && /[^A-Za-z0-9]/.test(form.password) ? '✅' : '⭕'}</span>
            Numbers & special characters
          </li>
        </ul>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <div className="step-header">
        <h4 className="step-title">🔐 Verification</h4>
        <p className="step-subtitle">One last step to secure your account</p>
      </div>
      
      <div className="verification-info">
        <i className="info-icon">ℹ️</i>
        Please complete the security verification to finish registration.
      </div>

      {captcha && (
        <>
          <div className="captcha-container">
            <Captcha captcha={captcha} onRefresh={fetchCaptcha} />
          </div>
          <div className="mb-4">
            <label className="modern-label">Enter CAPTCHA Code *</label>
            <div className="modern-input-group">
              <input
                type="text"
                name="captcha"
                className="modern-input"
                value={form.captcha}
                onChange={handleChange}
                required
                placeholder="Enter the code above"
                autoComplete="off"
              />
              <div className="input-icon">🔑</div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="modern-register-container">
        <div className="register-background"></div>
        <div className="container d-flex justify-content-center align-items-center py-5">
          <div className="modern-register-card">
            <div className="register-header">
              <h2 className="register-title">✨ Join Homestay</h2>
              <p className="register-subtitle">Create your account in just a few steps</p>
            </div>

            {renderStepIndicator()}

            {message && (
              <div className="modern-alert success">
                <i className="alert-icon">✅</i>
                {message}
              </div>
            )}

            {error && (
              <div className="modern-alert error">
                <i className="alert-icon">⚠️</i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-form">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}

              <div className="form-navigation">
                {currentStep > 1 && (
                  <button
                    type="button"
                    className="nav-btn prev-btn"
                    onClick={handlePrevStep}
                    disabled={loading}
                  >
                    ← Previous
                  </button>
                )}
                
                <div className="nav-btn-spacer"></div>
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    className="nav-btn next-btn"
                    onClick={handleNextStep}
                    disabled={loading || !validateStep(currentStep)}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="nav-btn submit-btn"
                    disabled={loading || !validateStep(currentStep)}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Creating Account...
                      </>
                    ) : (
                      <>Create Account ✨</>
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="register-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="footer-link">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;