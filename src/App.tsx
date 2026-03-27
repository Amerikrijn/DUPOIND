import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Globe, Heart, MessageSquare, Sun, CloudRain, Coffee, Send } from 'lucide-react';
import './index.css';

// Types
type City = {
  id: string;
  name: string;
  timezone: string;
  weather: { icon: ReactNode; temp: string; desc: string };
  holiday?: string;
};

// Mock Data
const CITIES: City[] = [
  {
    id: 'utrecht',
    name: 'Utrecht',
    timezone: 'Europe/Amsterdam',
    weather: { icon: <CloudRain size={18} />, temp: '14°C', desc: 'Rain' },
    holiday: 'King\'s Day in 30 days',
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    timezone: 'Europe/Lisbon',
    weather: { icon: <Sun size={18} />, temp: '22°C', desc: 'Sunny' },
  },
  {
    id: 'chennai',
    name: 'Chennai',
    timezone: 'Asia/Kolkata',
    weather: { icon: <Sun size={18} />, temp: '34°C', desc: 'Hot' },
    holiday: 'Tamil New Year next week',
  }
];

const WOTD = [
  { lang: 'NL', word: 'Gezellig', translation: 'Cozy, fun, nice atmosphere', useCase: 'Dat was een gezellige meeting!' },
  { lang: 'PT', word: 'Desenrascanço', translation: 'Finding a way out of a problem', useCase: 'We need some desenrascanço for this bug.' },
  { lang: 'IN', word: 'Jugaad (Hindi) / Vēgama (Tamil)', translation: 'Innovative fix / Do it fast', useCase: 'Let\'s apply some jugaad here.' }
];

const KUDOS = [
  {
    id: 1,
    from: 'Sanjeev (Chennai)',
    to: 'Martijn (Utrecht)',
    message: 'Thanks for helping me debug the deployment pipeline yesterday! We saved hours.',
    translation: 'Bedankt voor het helpen debuggen van de deployment pipeline gisteren! We hebben uren bespaard.',
    targetLang: 'NL'
  },
  {
    id: 2,
    from: 'Joana (Lisbon)',
    to: 'Ananya (Chennai)',
    message: 'Great presentation on the new UX design patterns. Loved the glassmorphism approach.',
    translation: 'Pudhiya UX vadivamaippu muraigal pattriya sirandha presentation. (Tamil translation unavailable in pure React mockup)',
    targetLang: 'IN'
  }
];

export default function App() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const newTimes: Record<string, string> = {};
      
      CITIES.forEach(city => {
        newTimes[city.id] = now.toLocaleTimeString('en-US', {
          timeZone: city.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      });
      setTimes(newTimes);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-container">
      {/* Header */}
      <header>
        <div className="logo-container">
          <div className="logo-icon"><Globe color="white" size={24} /></div>
          <div className="logo-text">DUPO<span>IND</span></div>
        </div>
        <div className="user-profile">
          <span className="greeting">👋 Bom dia, User</span>
          <div className="avatar">U</div>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="dashboard-grid">
        
        {/* Left Column (Cities & WOTD) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Three Cities Widget */}
          <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <div className="panel-header">
              <Globe className="panel-icon" size={24} />
              <h2>Squad Hubs</h2>
            </div>
            
            <div className="cities-container">
              {CITIES.map((city) => (
                <div key={city.id} className={`city-card ${city.id}`}>
                  <div className="city-header">
                    <span className="city-name">{city.name}</span>
                    <Coffee size={20} color="var(--text-muted)" />
                  </div>
                  <div className="time-display">
                    {times[city.id] || '--:--'}
                  </div>
                  <div className="city-meta">
                    <div className="meta-item">
                      {city.weather.icon} {city.weather.temp}
                    </div>
                    {city.holiday && (
                      <div className="meta-item" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                        🎉 {city.holiday}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Word of the Day */}
          <div className="glass-panel">
            <div className="panel-header">
              <MessageSquare className="panel-icon" size={24} />
              <h2>Phrase of the Day</h2>
            </div>
            <div className="wotd-container">
              {WOTD.map((item, idx) => (
                <div key={idx} className="wotd-card">
                  <div className={`lang-badge ${item.lang.toLowerCase()}-badge`}>
                    {item.lang}
                  </div>
                  <div className="wotd-content">
                    <h3>"{item.word}"</h3>
                    <div className="wotd-translation">{item.translation}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.4rem', fontStyle: 'italic' }}>
                      Example: {item.useCase}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Right Column (Kudos / Wall) */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header">
            <Heart className="panel-icon" size={24} color="var(--accent)" fill="var(--accent)" />
            <h2>Squad Kudos</h2>
          </div>
          
          <div className="kudos-feed">
            {KUDOS.map((kudo) => (
              <div key={kudo.id} className="kudo-item">
                <div className="kudo-header">
                  <span className="kudo-author">{kudo.from}</span>
                  <span style={{color:'var(--text-muted)'}}>→</span>
                  <span className="kudo-target">{kudo.to}</span>
                </div>
                <div className="kudo-message">{kudo.message}</div>
                <div className="kudo-translation">
                  <Globe size={14} /> 
                  <span>{kudo.translation} <br/><small>(Translated to {kudo.targetLang})</small></span>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-kudos">
            <Send size={18} /> Send Kudos
          </button>
        </div>

      </div>
    </div>
  );
}
