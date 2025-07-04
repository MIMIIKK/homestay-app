import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const EmailVerification = () => {
  const [form, setForm] = useState({
    otp_code: ''
  });
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [otpTimer, setOtpTimer] = useState(600); // 10 minutes
  const [canResendOtp, setCanResendOtp] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    // Get user ID from localStorage (set during registration)
    const pendingUserId = localStorage.getItem('pendingUserId');
    if (pendingUserId) {
      setUserId(pendingUserId);
    } else {
      navigate('/register');
    }
  }, [navigate]);

  // OTP Timer effect
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResendOtp(true);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleChange = e => {
    const { name, value } = e.target;
    // Only allow digits and limit to 6 characters
    if (name === 'otp_code' && (/^\d*$/.test(value) && value.length <= 6)) {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear errors when user starts typing
    if (error) setError('');
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/otp/verify/', {
        user_id: userId,
        otp_code: form.otp_code,
        otp_type: 'email'
      });

      setMessage('Email verified successfully! You can now log in.');
      localStorage.removeItem('pendingUserId');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      const errData = err.response?.data;
      setError(errData?.error || 'Invalid verification code. Please try again.');
      
      // Clear OTP field on error
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
        user_id: userId,
        otp_type: 'email'
      });

      setMessage('New verification code sent to your email!');
      setOtpTimer(600); // 10 minutes
      setCanResendOtp(false);
      
      // Clear the message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
    } catch (err) {
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Navbar />
      <div className="container d-flex justify-content-center align-items-center py-5">
        <div className="p-4 shadow rounded bg-white" style={{ width: '100%', maxWidth: '500px' }}>
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px' }}>
              <i className="bi bi-envelope-check fs-1 text-primary"></i>
            </div>
            <h2 className="fw-bold text-primary">Verify Your Email</h2>
            <p className="text-muted">
              We've sent a 6-digit verification code to your email address.
              Please enter it below to activate your account.
            </p>
          </div>

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
            <div className="mb-4">
              <label className="form-label text-center d-block">Verification Code</label>
              <input
                type="text"
                name="otp_code"
                className="form-control form-control-lg text-center fs-3"
                value={form.otp_code}
                onChange={handleChange}
                required
                maxLength={6}
                placeholder="000000"
                autoComplete="one-time-code"
                style={{ letterSpacing: '0.5em' }}
              />
              <div className="form-text text-center">
                Enter the 6-digit code sent to your email
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100"
              disabled={loading || form.otp_code.length !== 6}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <div className="mb-3">
              {otpTimer > 0 ? (
                <p className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  Code expires in {formatTimer(otpTimer)}
                </p>
              ) : (
                <p className="text-warning">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Your code has expired
                </p>
              )}
            </div>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleResendOTP}
              disabled={!canResendOtp || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Sending...
                </>
              ) : (
                'Send New Code'
              )}
            </button>

            <div className="mt-4 pt-3 border-top">
              <p className="text-muted text-center">
                Need help?{' '}
                <Link to="/contact" className="text-primary">
                  Contact Support
                </Link>
              </p>
              <p className="text-center">
                <Link to="/login" className="text-muted">
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmailVerification;