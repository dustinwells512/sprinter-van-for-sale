export default function Hero() {
  return (
    <section id="hero" className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">2020 Mercedes Sprinter</h1>
        <p className="hero-description">
          Your next adventure starts the moment you turn the key. Camp off-grid
          for weeks, tackle remote trails with confidence, and stay connected
          from anywhere. Professionally built, meticulously upgraded, and ready
          for the road less traveled.
        </p>
        <p className="hero-tagline">
          Sleeps 2 &bull; Rides 2 &bull; Turn-key and trail-ready.
        </p>
        <div className="hero-price">$149,500</div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">2020</span>
            <span className="stat-label">Year</span>
          </div>
          <div className="stat">
            <span className="stat-number">68,743</span>
            <span className="stat-label">Miles</span>
          </div>
          <div className="stat">
            <span className="stat-number">170&quot;</span>
            <span className="stat-label">Extended WB</span>
          </div>
          <div className="stat">
            <span className="stat-number">3.0L</span>
            <span className="stat-label">Diesel</span>
          </div>
        </div>
        <p className="hero-features">
          High Roof &bull; 170&quot; Extended WB &bull; ARB Air Locker &bull;
          Onboard Air Compressor &bull; 800Ah Lithium &bull; Agile Offroad
          Suspension & Wheels &bull; Starlink &bull; Roof A/C & Diesel Heat
          &bull; Full OWL Exterior
        </p>
        <a href="#gallery" className="cta-button">
          View Gallery
        </a>
      </div>
    </section>
  );
}
