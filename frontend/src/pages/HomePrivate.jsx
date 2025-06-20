import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import '../../public/styles/HomePrivate.css';

const HomePrivate = () => {
  const [activeNotification, setActiveNotification] = useState(null);

  // Data
  const stats = [
    { id: 1, label: "Bookings", value: 3, icon: "calendar-week", color: "blue" },
    { id: 2, label: "Saved", value: 5, icon: "heart", color: "rose" },
    { id: 3, label: "Messages", value: 2, icon: "envelope", color: "indigo" },
    { id: 4, label: "Verified", value: "✓", icon: "check-circle", color: "emerald" }
  ];

  const notifications = [
    { id: 1, icon: "gift", title: "Booking Confirmed", text: "Your booking at 'Peaceful Village Stay' is confirmed.", time: "2h ago" },
    { id: 2, icon: "suitcase", title: "Packing Tip", text: "Bring warm layers — cool evenings ahead!", time: "5h ago" },
    { id: 3, icon: "chat", title: "New Message", text: "Host Anita replied to your inquiry.", time: "1d ago" }
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

  return (
    <div className="private-homepage">
      <Navbar />
      
      {/* Main Content */}
      <main className="private-container">
        {/* Welcome Header */}
        <header className="welcome-header">
          <h1 className="welcome-title">Welcome back</h1>
          <p className="welcome-subtitle">Discover your next peaceful escape</p>
        </header>

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
            {/* Destinations Section */}
            <section className="section destinations-section">
              <div className="section-header">
                <h2 className="section-title">Explore destinations</h2>
                <a href="#" className="view-all-link">View all <i className="bi bi-chevron-right"></i></a>
              </div>
              
              <div className="destinations-grid">
                {destinations.map((place, i) => (
                  <div key={i} className="destination-card">
                    <div className="destination-image">
                      <img 
                        src={`/images/destinations/${place.image}`} 
                        alt={place.name}
                        className="destination-img"
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
                <button className="action-item">
                  <i className="bi bi-search"></i>
                  <span>Discover stays</span>
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button className="action-item">
                  <i className="bi bi-envelope"></i>
                  <span>View messages</span>
                  <i className="bi bi-chevron-right"></i>
                </button>
                <button className="action-item">
                  <i className="bi bi-pencil"></i>
                  <span>Write review</span>
                  <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* CTA Section */}
        <section className="home-cta">
          <h2 className="cta-title">Ready for your next escape?</h2>
          <p className="cta-text">Find the perfect homestay for your next peaceful retreat.</p>
          <button className="cta-button">Browse Homestays</button>
        </section>
      </main>
    </div>
  );
};

export default HomePrivate;