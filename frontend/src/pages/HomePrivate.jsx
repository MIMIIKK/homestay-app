import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import '../../public/styles/HomePrivate.css';

const HomePrivate = ({ user }) => {
  const [activeNotification, setActiveNotification] = useState(null);

  // Data
  const stats = [
    { id: 1, label: "Bookings", value: 3, icon: "calendar-week", color: "blue" },
    { id: 2, label: "Saved", value: 5, icon: "heart", color: "rose" },
    { id: 3, label: "Messages", value: 2, icon: "envelope", color: "indigo" },
    { id: 4, label: "Verified", value: user?.is_email_verified ? "✓" : "!", icon: user?.is_email_verified ? "check-circle" : "exclamation-circle", color: user?.is_email_verified ? "emerald" : "amber" }
  ];

  const notifications = [
    { id: 1, icon: "gift", title: "Welcome!", text: `Welcome to Homestay, ${user?.first_name || user?.username}!`, time: "Now" },
    { id: 2, icon: "envelope", title: "Complete Profile", text: `Your profile is ${user?.profile_completion || 0}% complete.`, time: "1h ago" },
    { id: 3, icon: "info-circle", title: "Email Verification", text: user?.is_email_verified ? "Your email is verified!" : "Please verify your email address.", time: "2h ago" }
  ];

  const destinations = [
    { name: 'Pokhara', image: 'pokhara.jpg' },
    { name: 'Bandipur', image: 'bandipur.jpg' },
    { name: 'Ghandruk', image: 'ghandruk.jpg' },
    { name: 'Ilam', image: 'ilam.jpg' },
    { name: 'Nagarkot', image: 'nagarkot.jpg' },
    { name: 'Mustang', image: 'mustang.jpg' }
  ];

  const upcomingTrip = {
    name: "Tranquil Homestay",
    location: "Ghandruk, Kaski",
    date: "Oct 12-15, 2025",
    image: "ghandruk-homestay.jpg"
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="private-homepage">
      <Navbar />
      
      {/* Main Content */}
      <main className="private-container">
        {/* Welcome Header */}
        <header className="welcome-header">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="welcome-title">Welcome back, {user?.first_name || user?.username}!</h1>
              <p className="welcome-subtitle">
                {user?.role === 'host' ? 'Manage your properties and bookings' : 'Discover your next peaceful escape'}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary" onClick={() => window.location.href = '/profile'}>
                Profile
              </button>
              <button className="btn btn-outline-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Email Verification Alert */}
        {!user?.is_email_verified && (
          <div className="alert alert-warning mb-4">
            <i className="bi bi-exclamation-triangle me-2"></i>
            Please verify your email address to access all features.
            <button className="btn btn-sm btn-outline-warning ms-2" onClick={() => window.location.href = '/verify-email'}>
              Verify Now
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon">
                <i className={`bi bi-${stat.icon}`}></i>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="home-layout">
          {/* Main Content Column */}
          <div className="main-column">
            {/* Role-specific content */}
            {user?.role === 'host' ? (
              <section className="section host-dashboard">
                <div className="section-header">
                  <h2 className="section-title">Host Dashboard</h2>
                  <a href="/host/properties" className="view-all-link">Manage Properties <i className="bi bi-chevron-right"></i></a>
                </div>
                
                <div className="row">
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-house fs-1 text-primary mb-3"></i>
                        <h4>My Properties</h4>
                        <p className="text-muted">Manage your listings</p>
                        <button className="btn btn-primary">View Properties</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-calendar-check fs-1 text-success mb-3"></i>
                        <h4>Bookings</h4>
                        <p className="text-muted">Track reservations</p>
                        <button className="btn btn-success">View Bookings</button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                      <div className="card-body text-center">
                        <i className="bi bi-bar-chart fs-1 text-info mb-3"></i>
                        <h4>Analytics</h4>
                        <p className="text-muted">View performance</p>
                        <button className="btn btn-info">View Stats</button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* Destinations Section for Guests */}
                <section className="section destinations-section">
                  <div className="section-header">
                    <h2 className="section-title">Explore destinations</h2>
                    <a href="/search" className="view-all-link">View all <i className="bi bi-chevron-right"></i></a>
                  </div>
                  
                  <div className="destinations-grid">
                    {destinations.map((place, i) => (
                      <div key={i} className="destination-card">
                        <div className="destination-image">
                          <img 
                            src={`/images/destinations/${place.image}`} 
                            alt={place.name}
                            className="destination-img"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=' + place.name;
                            }}
                          />
                          <div className="destination-overlay">
                            <h3 className="destination-name">{place.name}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Upcoming Trip Section */}
                <section className="section upcoming-trip">
                  <div className="section-header">
                    <h2 className="section-title">Upcoming trip</h2>
                  </div>
                  
                  <div className="trip-card">
                    <div className="trip-image">
                      <img 
                        src={`/images/trips/${upcomingTrip.image}`} 
                        alt={upcomingTrip.name}
                        className="trip-img"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Upcoming+Trip';
                        }}
                      />
                    </div>
                    <div className="trip-details">
                      <h3 className="trip-name">{upcomingTrip.name}</h3>
                      <p className="trip-location">{upcomingTrip.location}</p>
                      <div className="trip-date">
                        <i className="bi bi-calendar"></i>
                        <span>{upcomingTrip.date}</span>
                      </div>
                      <button className="trip-button">View Details</button>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="sidebar-column">
            {/* Notifications Section */}
            <section className="section notifications-section">
              <div className="section-header">
                <h2 className="section-title">Notifications</h2>
                <button className="mark-read">Mark all as read</button>
              </div>
              
              <div className="notifications-list">
                {notifications.map((note) => (
                  <div
                    key={note.id}
                    className={`notification-item ${activeNotification === note.id ? 'active' : ''}`}
                    onMouseEnter={() => setActiveNotification(note.id)}
                    onMouseLeave={() => setActiveNotification(null)}
                  >
                    <div className="notification-icon">
                      <i className={`bi bi-${note.icon}`}></i>
                    </div>
                    <div className="notification-content">
                      <h4 className="notification-title">{note.title}</h4>
                      <p className="notification-text">{note.text}</p>
                      <span className="notification-time">{note.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions Section */}
            <section className="section quick-actions">
              <h2 className="section-title">Quick actions</h2>
              
              <div className="actions-list">
                <button className="action-item" onClick={() => window.location.href = '/search'}>
                  <i className="bi bi-search"></i>
                  <span>Discover stays</span>
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button className="action-item" onClick={() => window.location.href = '/messages'}>
                  <i className="bi bi-envelope"></i>
                  <span>View messages</span>
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button className="action-item" onClick={() => window.location.href = '/profile'}>
                  <i className="bi bi-person"></i>
                  <span>Edit profile</span>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* CTA Section */}
        <section className="home-cta">
          <h2 className="cta-title">
            {user?.role === 'host' ? 'Add a new property?' : 'Ready for your next escape?'}
          </h2>
          <p className="cta-text">
            {user?.role === 'host' 
              ? 'List your property and start earning with our platform.' 
              : 'Find the perfect homestay for your next peaceful retreat.'}
          </p>
          <button 
            className="cta-button"
            onClick={() => window.location.href = user?.role === 'host' ? '/host/add-property' : '/search'}
          >
            {user?.role === 'host' ? 'Add Property' : 'Browse Homestays'}
          </button>
        </section>
      </main>
    </div>
  );
};

export default HomePrivate;