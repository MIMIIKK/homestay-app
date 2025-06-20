import React, { useEffect } from 'react';
import Navbar from '../../src/components/Navbar';
import { Link } from 'react-router-dom';
import '../../public/styles/HomePublic.css';

const HomePublic = () => {
  // Sample property data with image names matching your public/images/properties directory
  const properties = [
    { id: 1, name: 'Alpine Retreat', image: 'alpine-retreat.jpg', price: 120 },
    { id: 2, name: 'Nordic Cabin', image: 'nordic-cabin.jpg', price: 150 },
    { id: 3, name: 'Minimal Loft', image: 'minimal-loft.jpg', price: 180 }
  ];

  const testimonials = [
    { id: 1, name: 'Alex Johnson', role: 'Designer, Berlin', image: 'testimonial-1.jpg' },
    { id: 2, name: 'Sarah Miller', role: 'Photographer, Oslo', image: 'testimonial-2.jpg' },
    { id: 3, name: 'Thomas Chen', role: 'Architect, Tokyo', image: 'testimonial-3.jpg' }
  ];

  useEffect(() => {
    const animateOnScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      elements.forEach(el => {
        const elementPosition = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
          el.classList.add('animate-active');
        }
      });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll();
    
    return () => window.removeEventListener('scroll', animateOnScroll);
  }, []);

  return (
    <div className="homepage-wrapper">
      <Navbar />
      {/* Hero Section */}
      <section className="hero-section position-relative overflow-hidden">
        <div className="hero-background"></div>
        <div className="container position-relative vh-100 d-flex align-items-center z-index-1">
          <div className="row">
            <div className="col-lg-8">
              <h1 className="hero-title text-white mb-4">
                <span className="text-stroke">Discover</span> 
                <span className="d-block mt-2">Minimal Living</span>
              </h1>
              <p className="hero-subtitle text-white-50 mb-5">
                Experience the perfect blend of comfort and minimalist design in our carefully curated spaces.
              </p>
              <div className="d-flex gap-3">
                <Link to="/properties" className="btn btn-light btn-lg px-4 py-3 hover-lift">
                  Explore Stays
                </Link>
                <Link to="/about" className="btn btn-outline-light btn-lg px-4 py-3 hover-lift">
                  Our Philosophy
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-indicator position-absolute bottom-0 start-50 translate-middle-x mb-5">
          <div className="mouse"></div>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section className="py-7 py-lg-9 bg-light">
        <div className="container">
          <div className="row mb-5 scroll-animate">
            <div className="col-lg-6">
              <h2 className="display-5 fw-light mb-3">Curated Spaces</h2>
              <p className="lead text-muted">Selected for their exceptional design and comfort.</p>
            </div>
          </div>
          
          <div className="row g-4">
            {properties.map((property, index) => (
              <div className="col-md-4 scroll-animate" key={property.id} style={{ transitionDelay: `${index * 0.1}s` }}>
                <div className="destination-card overflow-hidden rounded-4 position-relative hover-scale">
                  <div className="destination-card-inner h-100">
                    <img 
                      src={`/images/properties/${property.image}`}
                      alt={property.name}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                      className="placeholder-img"
                    />
                    <div className="position-absolute bottom-0 start-0 w-100 p-4 bg-dark-gradient text-white">
                      <h3 className="h4 mb-1">{property.name}</h3>
                      <p className="small mb-2 opacity-75">From ${property.price}/night</p>
                      <button className="btn btn-sm btn-outline-light mt-2 hover-action">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-7 py-lg-9 bg-white position-relative">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0 scroll-animate">
              <div className="philosophy-image-container position-relative">
                <div className="floating-animation">
                  <img 
                    src="/images/philosophy.jpg" 
                    alt="Minimal design" 
                    style={{ objectFit: 'cover', width: '70%', height: 'auto' }}
                    className="img-fluid rounded-4 shadow-lg hover-cool-shadow"
                  />
                </div>
                <div className="position-absolute top-0 start-0 translate-middle z-index--1">
                  <div className="bg-primary bg-opacity-10 rounded-circle" style={{ width: '300px', height: '300px' }}></div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 scroll-animate">
              <h2 className="display-5 fw-light mb-4">Our Design Philosophy</h2>
              <p className="lead text-muted mb-4">
                We believe in spaces that breathe, with nothing superfluous and everything essential.
              </p>
              <ul className="list-unstyled">
                <li className="mb-3 d-flex">
                  <span className="me-3 text-primary">✓</span>
                  <span>Thoughtfully curated minimalist interiors</span>
                </li>
                <li className="mb-3 d-flex">
                  <span className="me-3 text-primary">✓</span>
                  <span>Premium materials with sustainability in mind</span>
                </li>
                <li className="mb-3 d-flex">
                  <span className="me-3 text-primary">✓</span>
                  <span>Spaces designed for both productivity and relaxation</span>
                </li>
              </ul>
              <button className="btn btn-outline-dark btn-lg mt-3 px-4 hover-lift">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="py-7 py-lg-9 bg-dark text-white position-relative overflow-hidden">
        <div className="bg-blur"></div>
        <div className="container position-relative">
          <div className="row justify-content-center text-center scroll-animate">
            <div className="col-lg-8">
              <h2 className="display-5 fw-light mb-4">Ready to Experience Minimal Living?</h2>
              <p className="lead text-white-50 mb-5">
                Join our community of design-conscious travelers today.
              </p>
              <div className="d-flex gap-3 justify-content-center">
                <Link to="/properties" className="btn btn-light btn-lg px-4 py-3 hover-lift">
                  Browse Properties
                </Link>
                <Link to="/contact" className="btn btn-outline-light btn-lg px-4 py-3 hover-lift">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePublic;