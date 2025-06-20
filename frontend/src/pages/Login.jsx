import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = e => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const res = await api.post('/token/', form);
            localStorage.setItem('token', res.data.access);
            setMessage('Login successful!');
            setTimeout(() => navigate('/'), 1000); // optional delay

        } catch {
            setMessage('Invalid credentials.');
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5 col-md-4">
                <h2 className="mb-4">Login</h2>
                {message && <div className="alert alert-info">{message}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label>Username</label>
                        <input type="text" name="username" className="form-control" onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input type="password" name="password" className="form-control" onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-success w-100">Login</button>
                    <p className="mt-3">
                        Don't have an account? <a href="/register">Register here</a>
                    </p>
                </form>
            </div>
        </>
    );
};

export default Login;
