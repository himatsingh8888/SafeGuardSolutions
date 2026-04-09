import "./Home.css";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import navLogo from "../assets/nav-logo.png";
import safeguardLogo from "../assets/safeguard-logo.png";
import securitySystemsIcon from "../assets/security-systems-icon.png";
import securityCamerasIcon from "../assets/security-cameras-icon.png";
import accessControlIcon from "../assets/access-control-icon.png";

const reviews = [
  {
    id: 1,
    name: "Sarah Johnson",
    location: "Vancouver, BC",
    date: "March 2026",
    rating: 5,
    shortReview: "Excellent service and professional installation. Our new security system works perfectly!"
  },
  {
    id: 2,
    name: "Mike Chen",
    location: "Burnaby, BC",
    date: "February 2026",
    rating: 5,
    shortReview: "Very responsive team and high-quality equipment. Highly recommend for home security."
  },
  {
    id: 3,
    name: "Lisa Thompson",
    location: "Surrey, BC",
    date: "January 2026",
    rating: 5,
    shortReview: "Great experience from start to finish. The cameras provide excellent coverage."
  },
  {
    id: 4,
    name: "David Rodriguez",
    location: "Richmond, BC",
    date: "December 2025",
    rating: 5,
    shortReview: "Professional installation and excellent customer service. Our business feels much safer."
  },
  {
    id: 5,
    name: "Emma Wilson",
    location: "Langley, BC",
    date: "November 2025",
    rating: 5,
    shortReview: "Top-notch security system with easy-to-use interface. Very satisfied with the results."
  }
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="home">
      <nav className={`home-nav${scrolled ? " nav-scrolled" : ""}`}>
        <div className="home-nav-inner">
          <Link to="/" className="home-nav-brand" onClick={() => setMenuOpen(false)}>
            <img src={navLogo} alt="" className="nav-logo" />
            <span className="nav-brand-text">SafeGuard Solutions</span>
          </Link>

          <button
            className={`nav-hamburger${menuOpen ? " open" : ""}`}
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>

          <div className={`home-nav-links${menuOpen ? " nav-open" : ""}`}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
            <Link to="/client/dashboard" onClick={() => setMenuOpen(false)}>Client Portal</Link>
            <Link to="/employee/login" className="nav-link-pill" onClick={() => setMenuOpen(false)}>Employee Portal</Link>
            <Link to="/login" className="nav-link-pill nav-link-pill-dark" onClick={() => setMenuOpen(false)}>Admin</Link>
          </div>
        </div>
      </nav>

      {/* ----- HERO SECTION ----- */}
      <header className="home-hero">
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-brand">
              <img src={logo} alt="Safeguard Solutions Logo" className="hero-logo" />
              <div className="hero-brand-text">
                <div className="hero-brand-name">SafeGuard Solutions</div>
                <div className="hero-brand-tagline">Security you can trust.</div>
              </div>
            </div>

            <div className="hero-copy">
              <h1 className="hero-title">
                Reliable Security Solutions
                <br />for Homes and Businesses
              </h1>
              <p className="hero-subtitle">
                Professional installation of camera systems, alarm systems, and access control solutions across the Lower Mainland.
              </p>
              <div className="hero-actions">
                <Link to="/quote-request" className="btn primary">Request a Quote</Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ----- SERVICES ----- */}
      <section id="services" className="home-section">
        <h2>Our Security Solutions</h2>
        <p className="services-tagline">Protect your home and business with modern security technology.</p>
        <div className="service-grid">
          <div className="service-box">
            <img src={securitySystemsIcon} alt="" className="service-icon-img" />
            <h3>Security Systems</h3>
            <ul className="service-features">
              <li>Protection from theft and break-ins</li>
              <li>Motion sensors and real-time alerts</li>
              <li>Staff duress protection systems</li>
              <li>Instant emergency alarm response</li>
            </ul>
          </div>
          <div className="service-box">
            <img src={securityCamerasIcon} alt="" className="service-icon-img" />
            <h3>Security Cameras</h3>
            <ul className="service-features">
              <li>Live HD monitoring from anywhere</li>
              <li>Recorded footage of important events</li>
              <li>Two-way audio communication</li>
              <li>Helps prevent vandalism and theft</li>
            </ul>
          </div>
          <div className="service-box">
            <img src={accessControlIcon} alt="" className="service-icon-img" />
            <h3>Access Control</h3>
            <ul className="service-features">
              <li>Control and monitor building access</li>
              <li>Secure employee and visitor entry</li>
              <li>Track and document movement within facilities</li>
              <li>Eliminate traditional key management</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ----- ABOUT / COMPANY DESCRIPTION ----- */}
      <section id="about" className="home-section home-section-about">
        <h2>About</h2>
        <p className="about-subtitle">Our Commitment to You</p>
        <p className="about-paragraph">
          Our comprehensive security solutions provide peace of mind and safeGuard what matters most.
          We specialize in modern security systems, camera systems, and automation technologies.
          As technology continues to advance, SafeGuard Solutions stays at the forefront by offering the latest equipment and high-quality service.
          We are based in the Lower Mainland and serve that region every day; we can also arrange installations and service anywhere in Canada or the United States—just ask and we can discuss your needs.
          Whether you are securing a business or protecting your home, we work with you to deliver a solution that makes you feel safe and in control.
        </p>
      </section>

      {/* ----- WHY CHOOSE US ----- */}
      <section id="why-choose" className="home-section home-section-alt">
        <h2>Why Choose Us</h2>
        <ul className="why-choose-list">
          <li>Professional installation</li>
          <li>Latest security technology</li>
          <li>Fast service in the Lower Mainland; Canada & US by request</li>
          <li>Residential and commercial protection</li>
        </ul>
      </section>

      {/* ----- REVIEWS SECTION ----- */}
      <section id="reviews" className="home-section home-section-reviews">
        <h2>Trusted by Homeowners and Businesses</h2>
        <p className="reviews-subtitle">
          Real feedback from clients who trusted SafeGuard Solutions with their home and business security.
        </p>
        
        <div className="reviews-carousel-container">
          <button className="carousel-arrow carousel-arrow-left" onClick={() => {
            const carousel = document.querySelector('.reviews-carousel');
            carousel.scrollBy({ left: -300, behavior: 'smooth' });
          }}>
            {'<'}
          </button>
          <div className="reviews-carousel">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-name">{review.name}</div>
                  <div className="review-rating">
                    {"★".repeat(review.rating)}
                    <span className="rating-text">{review.rating}.0</span>
                  </div>
                </div>
                <div className="review-location-date">
                  <span className="review-location">{review.location}</span>
                  <span className="review-date">{review.date}</span>
                </div>
                <div className="review-content">
                  "{review.shortReview}"
                </div>
              </div>
            ))}
          </div>
          <button className="carousel-arrow carousel-arrow-right" onClick={() => {
            const carousel = document.querySelector('.reviews-carousel');
            carousel.scrollBy({ left: 300, behavior: 'smooth' });
          }}>
            {'>'}
          </button>
        </div>

        <div className="reviews-actions">
          <a 
            href="https://www.google.com/search?sca_esv=a3cc233b7532eb26&rlz=1C1UEAD_enCA1086CA1086&sxsrf=ANbL-n4gzSeQtku3NpKbOjlvT50Z_0VTIw:1770703415141&si=AL3DRZEsmMGCryMMFSHJ3StBhOdZ2-6yYkXd_doETEE1OR-qOYS3KNZSXLWjYIDaWHiStLAeXFKlLLjcPrA0Oy-zE5ItSWCKtonzYWcZo1a-qt9e4TEMHY0eLx-O_-vjpUyw389B1WKBMTxLcgS6-wp_jPTwjsLxgw%3D%3D&q=SafeGuard+Solutions+Reviews&sa=X&ved=2ahUKEwivn7-goM6SAxUUHTQIHZQyFiEQ0bkNegQILxAD&biw=1440&bih=731&dpr=2" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn primary"
          >
            See More Reviews on Google
          </a>
          <p className="reviews-note">
            See our Google Reviews for more feedback from satisfied customers.
          </p>
        </div>
      </section>

      {/* ----- SERVING THE LOWER MAINLAND (with map) ----- */}
      <section className="home-section home-section-areas">
        <h2>Serving the Lower Mainland</h2>
        <p className="areas-intro">
          We mainly serve the Lower Mainland. Installations and service elsewhere in Canada or the United States are available by request—contact us to discuss your location and needs.
        </p>
        <ul className="areas-list">
          <li>Vancouver</li>
          <li>Burnaby</li>
          <li>Surrey</li>
          <li>Richmond</li>
          <li>Langley</li>
        </ul>
        <div className="map-wrap">
          <iframe
            title="Lower Mainland area map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-123.4%2C49.0%2C-122.2%2C49.5&layer=mapnik&marker=49.19%2C-122.85"
            className="areas-map"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      {/* ----- FOOTER ----- */}
      <footer id="contact" className="home-footer">
        <div className="footer-brand">
          <img src={safeguardLogo} alt="Safeguard Solutions" className="footer-logo" />
          <p className="footer-tagline">Security you can trust.</p>
        </div>
        <div className="footer-contact">
          <p>Phone: (236) 808-4666</p>
          <p>Email: info@safeGuardsolutions.ca</p>
        </div>
        <div className="footer-social">
          <a href="https://www.instagram.com/_safeguardsolutions/?hl=en" target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="https://www.facebook.com/profile.php?id=61568178293508" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
        <p className="footer-copy">© 2026 SafeGuard Solutions</p>
      </footer>
    </div>
  );
}
