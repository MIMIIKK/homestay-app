import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import PasswordStrengthBar from '../components/PasswordStrengthBar';
import Captcha from '../components/Captcha';
import Navbar from '../components/Navbar';

const Register = () => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
    address: '',
    captcha: ''
  });

  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [captcha, setCaptcha] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false); // 👈 NEW
  const [passwordScore, setPasswordScore] = useState(0);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = form.password === form.confirm_password || form.confirm_password === '';

  const fetchCaptcha = async () => {
    try {
      const res = await api.get('/captcha/');
      setCaptcha(res.data);
      setSessionId(res.data.session_id);
    } catch (error) {
      setMessage("Failed to load CAPTCHA. Please refresh.");
    }
  };

  const checkStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPasswordScore(score);
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === 'password') checkStrength(value);
  };

  const handleFirstSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      setMessage("Passwords do not match.");
      return;
    }

    // All fields filled? (light check)
    for (let key of ['username', 'email', 'password', 'confirm_password', 'phone', 'address']) {
      if (!form[key]) {
        setMessage("Please fill out all fields.");
        return;
      }
    }

    // Now trigger CAPTCHA
    await fetchCaptcha();
    setShowCaptcha(true);
    setMessage("Please solve the CAPTCHA to finish registration.");
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, session_id: sessionId };
      delete payload.confirm_password;

      const res = await api.post('/register/', payload);
      setMessage(res.data.message);
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      const errMsg = err.response?.data;
      setMessage(errMsg?.non_field_errors?.[0] || Object.values(errMsg)[0]?.[0] || "Registration failed.");
      fetchCaptcha(); // reload captcha
    }
  };

  return (
    <>
      <Navbar />
      <div className="container d-flex justify-content-center align-items-center py-5">
        <div className="p-4 shadow rounded bg-white" style={{ width: '100%', maxWidth: '500px' }}>
          <h3 className="mb-3 text-center fw-bold">Create an Account</h3>
          <p className="text-muted text-center mb-4">Join our community homestay platform today</p>

          {message && <div className="alert alert-info">{message}</div>}

          <form onSubmit={showCaptcha ? handleFinalSubmit : handleFirstSubmit}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input type="text" name="username" className="form-control" onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input type="text" name="phone" className="form-control" onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Address</label>
              <textarea name="address" className="form-control" onChange={handleChange} required />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  onChange={handleChange}
                  required
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

            {/* Confirm Password */}
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  className={`form-control ${!passwordsMatch ? 'is-invalid' : ''}`}
                  onChange={handleChange}
                  required
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
                  Passwords do not match.
                </div>
              )}
            </div>

            {/* Show CAPTCHA only after first submit */}
            {showCaptcha && (
              <>
                <Captcha captcha={captcha} onRefresh={fetchCaptcha} />
                <div className="mb-3">
                  <input
                    type="text"
                    name="captcha"
                    className="form-control"
                    placeholder="Enter CAPTCHA"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary w-100">
              {showCaptcha ? "Finish Registration" : "Register"}
            </button>

            <p className="text-center mt-3 mb-0 text-muted">
              Already have an account? <Link to="/login" className="fw-semibold text-primary">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;
