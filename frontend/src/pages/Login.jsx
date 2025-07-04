import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Login = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ 
    username: '', 
    password: '',
    otp_code: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [inputFocus, setInputFocus] = useState({});
  
  const navigate = useNavigate();

  // OTP Timer effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && step === 2) {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [otpTimer, step]);

  // Floating particles animation effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.opacity = Math.random() * 0.5 + 0.2;
      document.body.appendChild(particle);
      
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 5000);
    };

    const interval = setInterval(createParticle, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleFocus = (field) => {
    setInputFocus(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setInputFocus(prev => ({ ...prev, [field]: false }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/login/', {
        username: form.username,
        password: form.password
      });

      if (response.data.otp_required) {
        setPendingUserId(response.data.user_id);
        setStep(2);
        setMessage(response.data.message);
        setOtpTimer(600);
        setCanResendOtp(false);
      } else {
        if (response.data.access) {
          localStorage.setItem('token', response.data.access);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          navigate('/');
        }
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData) {
        if (err.response.status === 423) {
          setError('Account temporarily locked due to multiple failed attempts. Please try again later.');
        } else {
          setError(errData.error || 'Login failed. Please check your credentials.');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/otp/verify/', {
        user_id: pendingUserId,
        otp_code: form.otp_code,
        otp_type: 'login'
      });

      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setMessage('Login successful! Redirecting...');
        
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.error || 'Invalid OTP. Please try again.');
      setForm(prev => ({ ...prev, otp_code: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOtp) return;
    
    setLoading(true);
    setError('');

    try {
      await api.post('/otp/resend/', {
        user_id: pendingUserId,
        otp_type: 'login'
      });

      setMessage('New OTP sent to your email!');
      setOtpTimer(600);
      setCanResendOtp(false);
    } catch (err) {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderLoginForm = () => (
    <div className="login-form-container">
      <div className="text-center mb-5">
        <div className="login-header-icon">
          <div className="icon-pulse"></div>
          <i className="bi bi-house-heart"></i>
        </div>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Sign in to your sanctuary</p>
      </div>

      <form onSubmit={handleLogin} className="modern-form">
        <div className="form-group">
          <div className={`input-container ${inputFocus.username ? 'focused' : ''} ${form.username ? 'filled' : ''}`}>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              onFocus={() => handleFocus('username')}
              onBlur={() => handleBlur('username')}
              required
              autoComplete="username"
            />
            <label>Username or Email</label>
            <div className="input-highlight"></div>
            <i className="bi bi-person input-icon"></i>
          </div>
        </div>

        <div className="form-group">
          <div className={`input-container ${inputFocus.password ? 'focused' : ''} ${form.password ? 'filled' : ''}`}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
              required
              autoComplete="current-password"
            />
            <label>Password</label>
            <div className="input-highlight"></div>
            <i className="bi bi-lock input-icon"></i>
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>
        </div>

        <div className="form-options">
          <label className="checkbox-container">
            <input type="checkbox" />
            <span className="checkmark"></span>
            Remember me
          </label>
        </div>

        <button
          type="submit"
          className={`submit-btn ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          <span className="btn-text">
            {loading ? 'Signing in...' : 'Sign In'}
          </span>
          <div className="btn-ripple"></div>
          {loading && <div className="loading-spinner"></div>}
        </button>
      </form>

      <div className="form-footer">
        <p>
          Don't have an account?{' '}
          <Link to="/register" className="signup-link">
            Create one here
          </Link>
        </p>
      </div>
    </div>
  );

  const renderOTPForm = () => (
    <div className="otp-form-container">
      <div className="text-center mb-5">
        <div className="otp-header-icon">
          <div className="icon-ripple"></div>
          <i className="bi bi-shield-check"></i>
        </div>
        <h1 className="otp-title">Verify Identity</h1>
        <p className="otp-subtitle">
          Enter the 6-digit code sent to your email
        </p>
      </div>

      <form onSubmit={handleOTPVerification} className="otp-form">
        <div className="otp-input-container">
          <input
            type="text"
            name="otp_code"
            className="otp-input"
            value={form.otp_code}
            onChange={handleChange}
            required
            maxLength={6}
            placeholder="000000"
            autoComplete="one-time-code"
          />
          <div className="otp-input-decoration"></div>
        </div>

        <div className="otp-timer">
          {otpTimer > 0 ? (
            <div className="timer-active">
              <i className="bi bi-clock"></i>
              <span>Code expires in {formatTimer(otpTimer)}</span>
            </div>
          ) : (
            <div className="timer-expired">
              <i className="bi bi-exclamation-triangle"></i>
              <span>Your code has expired</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`submit-btn ${loading ? 'loading' : ''}`}
          disabled={loading || form.otp_code.length !== 6}
        >
          <span className="btn-text">
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </span>
          <div className="btn-ripple"></div>
          {loading && <div className="loading-spinner"></div>}
        </button>

        <div className="otp-actions">
          <button
            type="button"
            className={`resend-btn ${!canResendOtp ? 'disabled' : ''}`}
            onClick={handleResendOTP}
            disabled={!canResendOtp || loading}
          >
            <i className="bi bi-arrow-clockwise"></i>
            Send New Code
          </button>

          <button
            type="button"
            className="back-btn"
            onClick={() => {
              setStep(1);
              setForm({ username: '', password: '', otp_code: '' });
              setError('');
              setMessage('');
              setPendingUserId(null);
            }}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <Navbar />
      
      {/* Background with gradient and effects */}
      <div className="login-background">
        <div className="gradient-overlay"></div>
        <div className="geometric-pattern"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          {/* Message alerts */}
          {message && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle"></i>
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? renderLoginForm() : renderOTPForm()}
        </div>
      </div>

      <style jsx>{`
        /* Global Styles */
        .floating-particle {
          position: fixed;
          width: 4px;
          height: 4px;
          background: linear-gradient(45deg, #60a5fa, #3b82f6);
          border-radius: 50%;
          pointer-events: none;
          animation: float-up linear forwards;
          z-index: 1;
        }

        @keyframes float-up {
          to {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }

        /* Background */
        .login-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            135deg,
            #0f172a 0%,
            #1e293b 25%,
            #334155 50%,
            #475569 75%,
            #64748b 100%
          );
          z-index: -2;
        }

        .gradient-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at center,
            rgba(59, 130, 246, 0.1) 0%,
            rgba(15, 23, 42, 0.8) 70%
          );
          z-index: -1;
        }

        .geometric-pattern {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            radial-gradient(circle at 75% 75%, rgba(147, 197, 253, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: 0 0, 25px 25px;
          animation: drift 20s linear infinite;
        }

        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        /* Container */
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          z-index: 10;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem 2.5rem;
          width: 100%;
          max-width: 480px;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
        }

        /* Header Icons */
        .login-header-icon, .otp-header-icon {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          color: white;
          font-size: 2rem;
        }

        .icon-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #3b82f6;
          animation: pulse 2s infinite;
        }

        .icon-ripple {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #22c55e;
          animation: ripple 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }

        /* Typography */
        .login-title, .otp-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.5rem;
          letter-spacing: -0.025em;
        }

        .login-subtitle, .otp-subtitle {
          color: rgba(255, 255, 255, 0.7);
          font-size: 1.1rem;
          font-weight: 400;
        }

        /* Form Styles */
        .modern-form, .otp-form {
          margin-top: 2rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-container input {
          width: 100%;
          height: 60px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 0 60px 0 50px;
          color: white;
          font-size: 1rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .input-container input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .input-container label {
          position: absolute;
          left: 50px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.6);
          transition: all 0.3s ease;
          pointer-events: none;
          font-size: 1rem;
        }

        .input-container.focused label,
        .input-container.filled label {
          top: 8px;
          font-size: 0.75rem;
          color: #3b82f6;
        }

        .input-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.2rem;
        }

        .password-toggle {
          position: absolute;
          right: 18px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .password-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .input-highlight {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 1px;
          transition: width 0.3s ease;
        }

        .input-container.focused .input-highlight {
          width: 100%;
        }

        /* Form Options */
        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          font-size: 0.9rem;
        }

        .checkbox-container input {
          display: none;
        }

        .checkmark {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          margin-right: 8px;
          position: relative;
          transition: all 0.3s ease;
        }

        .checkbox-container input:checked + .checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .checkbox-container input:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
        }

        .forgot-link {
          color: #60a5fa;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.3s ease;
        }

        .forgot-link:hover {
          color: #3b82f6;
        }

        /* Buttons */
        .submit-btn {
          width: 100%;
          height: 60px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-text {
          position: relative;
          z-index: 2;
        }

        .btn-ripple {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          transform: scale(0);
          transition: transform 0.6s ease;
        }

        .submit-btn:active .btn-ripple {
          transform: scale(1);
        }

        .loading-spinner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* OTP Specific Styles */
        .otp-input-container {
          position: relative;
          margin-bottom: 2rem;
        }

        .otp-input {
          width: 100%;
          height: 80px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          text-align: center;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 0.5em;
          color: white;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .otp-input:focus {
          outline: none;
          border-color: #22c55e;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
        }

        .otp-timer {
          text-align: center;
          margin-bottom: 2rem;
        }

        .timer-active {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
        }

        .timer-expired {
          color: #fbbf24;
          font-size: 0.9rem;
        }

        .timer-active i, .timer-expired i {
          margin-right: 0.5rem;
        }

        .otp-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .resend-btn, .back-btn {
          flex: 1;
          height: 50px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
        }

        .resend-btn:hover:not(.disabled), .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .resend-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Footer */
        .form-footer {
          text-align: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .form-footer p {
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .signup-link {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .signup-link:hover {
          color: #3b82f6;
        }

        /* Alerts */
        .alert {
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          backdrop-filter: blur(10px);
        }

        .alert-success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        /* Responsive Design */
        @media (max-width: 640px) {
          .login-card {
            padding: 2rem 1.5rem;
            margin: 1rem;
            border-radius: 20px;
          }

          .login-title, .otp-title {
            font-size: 2rem;
          }

          .input-container input {
            height: 56px;
            padding: 0 50px 0 45px;
          }

          .submit-btn {
            height: 56px;
          }

          .otp-input {
            height: 70px;
            font-size: 1.75rem;
          }

          .otp-actions {
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .login-container {
            padding: 1rem 0.5rem;
          }

          .login-card {
            padding: 1.5rem 1rem;
          }

          .login-header-icon, .otp-header-icon {
            width: 60px;
            height: 60px;
            font-size: 1.5rem;
          }

          .login-title, .otp-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </>
  );
};

export default Login;