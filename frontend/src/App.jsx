import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePublic from './pages/HomePublic';
import HomePrivate from './pages/HomePrivate';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';

const App = () => {
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  return (
    <Router>
      <Routes>
        <Route path="/" element={isLoggedIn ? <HomePrivate /> : <HomePublic />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
};

export default App;
