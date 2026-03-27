import React, { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-container">
      <header style={{ 
        boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.2)' : 'none',
        background: scrolled ? 'rgba(15, 23, 42, 0.85)' : 'transparent',
      }}>
        <div className="logo">DUPOIND</div>
        <nav>
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <button className="header-cta">Get Started</button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="badge">New Beta Access</div>
            <h1>Next-gen <span className="highlight">Digital Solutions</span> <br />for the Modern World</h1>
            <p>
              Experience a sleek, incredibly powerful platform designed to elevate your workflows and deliver breathtaking performance that users expect.
            </p>
            <div className="hero-actions">
              <a href="#" className="btn-primary">Start Your Journey</a>
              <button className="btn-secondary">View Demos</button>
            </div>
          </div>
        </section>

        <section id="features" className="features">
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3>Premium Aesthetics</h3>
            <p>Crafted with a modern, glassmorphic design system that ensures your application stands out from the crowd.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Blazing Fast</h3>
            <p>Built on top of Vite and React, offering unmatched speed during development and instantly loaded production builds.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Type Safe</h3>
            <p>Fully written in TypeScript, providing a robust developer experience with world-class tooling and stability.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
