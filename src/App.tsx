import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Globe, Heart, MessageSquare, Sun, CloudRain, Coffee, Send, Shuffle, Camera, Home, LayoutGrid, Image, Lock, ArrowRight, X, Check } from 'lucide-react';
import './index.css';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
type Tab = 'dashboard' | 'roulette' | 'wall';

type City = {
  id: string;
  name: string;
  timezone: string;
  weather: { icon: ReactNode; temp: string; desc: string };
  flag: string;
  holiday?: string;
};

type KudoEntry = {
  id: number;
  from: string;
  fromCity: string;
  to: string;
  message: string;
  translation: string;
  targetLang: string;
  emoji: string;
};

type WallPost = {
  id: number;
  author: string;
  city: string;
  cityId: string;
  content: string;
  emoji: string;
  likes: number;
  liked: boolean;
  time: string;
};

// ─────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────
const SQUAD = [
  { name: 'Martijn', city: 'Utrecht', avatar: 'MV', cityId: 'utrecht' },
  { name: 'Ananya', city: 'Chennai', avatar: 'AS', cityId: 'chennai' },
  { name: 'Joana', city: 'Lisbon', avatar: 'JF', cityId: 'lisbon' },
  { name: 'Sanjeev', city: 'Chennai', avatar: 'SK', cityId: 'chennai' },
  { name: 'Sophie', city: 'Utrecht', avatar: 'ST', cityId: 'utrecht' },
  { name: 'Carlos', city: 'Lisbon', avatar: 'CM', cityId: 'lisbon' },
  { name: 'Priya', city: 'Chennai', avatar: 'PK', cityId: 'chennai' },
  { name: 'Lars', city: 'Utrecht', avatar: 'LV', cityId: 'utrecht' },
];

const CITIES: City[] = [
  { id: 'utrecht', name: 'Utrecht', timezone: 'Europe/Amsterdam', flag: '🇳🇱', weather: { icon: <CloudRain size={16} />, temp: '14°C', desc: 'Buiig' }, holiday: "King's Day in 30 dagen" },
  { id: 'lisbon', name: 'Lisbon', timezone: 'Europe/Lisbon', flag: '🇵🇹', weather: { icon: <Sun size={16} />, temp: '22°C', desc: 'Sonnig / Soleado' } },
  { id: 'chennai', name: 'Chennai', timezone: 'Asia/Kolkata', flag: '🇮🇳', weather: { icon: <Sun size={16} />, temp: '34°C', desc: 'Hot / Veyil' }, holiday: 'Tamil New Year volgende week' },
];

const WOTD = [
  { lang: 'NL', word: 'Gezellig', translation: 'Cozy, fun, warm atmosphere', useCase: '"Zondag borrelen met vrienden — zo gezellig! 🍺"' },
  { lang: 'PT', word: 'Saudade', translation: 'A deep longing or nostalgia', useCase: '"Ik heb saudade naar die zomer in Lisbon... 🌊"' },
  { lang: 'IN', word: 'Nalla Neram (Tamil)', translation: 'A beautiful, lucky moment in time', useCase: '"Dit weekend was echt nalla neram! 🌅"' },
];

const ICEBREAKERS = [
  "Welke lokale snack is een absolute must-try in jouw stad? 🍿",
  "Als je één film kon kiezen die jouw cultuur perfectly beschrijft, welke dan? 🎬",
  "Wat is de meest grappige misvatting die mensen over jouw stad hebben? 😂",
  "Beschrijf het perfecte weekend in jouw stad in 3 emoji's.",
  "Welk lokaal festival of feest verdient een wereldwijde fanbase? 🎉",
  "Wat is jouw favoriete lokale restaurant-tip die toeristen nooit vinden? 🍽️",
  "Als je één woord uit jouw taal aan de wereld kon geven, welk is het? 💬",
  "Wat is de meest Instagrammable plek in jouw stad? 📸",
];

const INITIAL_KUDOS: KudoEntry[] = [
  { id: 1, from: 'Sanjeev', fromCity: 'Chennai', to: 'Martijn (Utrecht)', message: 'Jouw Stroopwafel-pakketje is aangekomen! Beste snack van mijn jaar. Echt vriendelijk! 🍪', translation: '(NL) Jouw Stroopwafels zijn fantastisch! Bedankt, vriend!', targetLang: 'NL', emoji: '🍪' },
  { id: 2, from: 'Joana', fromCity: 'Lisbon', to: 'Ananya (Chennai)', message: 'Je Biryani-recept dat je stuurde was amazing! Mijn hele familie was onder de indruk! 🍛', translation: '(IN) உங்கள் Biryani recipe அருமை! என் family மிகவும் impressed!', targetLang: 'IN', emoji: '🍛' },
  { id: 3, from: 'Lars', fromCity: 'Utrecht', to: 'Carlos (Lisbon)', message: 'Die playlist die je aanraadde — op repeat de hele week. Fado is pure magie. 🎶', translation: '(PT) Essa playlist que tu recomendaste — de repetição a semana inteira. Fado é magia pura!', targetLang: 'PT', emoji: '🎶' },
];

const INITIAL_WALL: WallPost[] = [
  { id: 1, author: 'Martijn', city: 'Utrecht', cityId: 'utrecht', content: 'Goedemorgen van de Oudegracht! ☀️ Vandaag 14°C, typische Utrecht-regen, maar de kaasmarkt in de oude stad is op zijn mooist. Wie wil er een online brunch? 🧀🥐', emoji: '🌧️', likes: 4, liked: false, time: '09:15' },
  { id: 2, author: 'Ananya', city: 'Chennai', cityId: 'chennai', content: 'Vanmiddag spotted: 3 papastaarten, een koe die nonchalant een marktdaar doorkruist, en de beste Masala Chai van de hele wereld 🌶️☕. Chennai is nooit saai! Geniet van jullie milde temperaturen 😂', emoji: '☕', likes: 12, liked: false, time: '13:05' },
  { id: 3, author: 'Joana', city: 'Lisbon', cityId: 'lisbon', content: 'Zojuist Pastel de Nata gegeten recht van de oven bij Pastéis de Belém 🥐🇵🇹. De rij buiten was 45 minuten, élke minuut waard. Foto hieronder. Dit is de definitie van saudade in gebaksvorm!', emoji: '🥐', likes: 18, liked: false, time: '14:20' },
];

// ─────────────────────────────────────────
// Auth Screen
// ─────────────────────────────────────────
const VALID_CODES = ['DUPOIND', 'UTRECHT', 'LISBON1', 'CHENNAI'];

function AuthScreen({ onLogin }: { onLogin: (name: string, city: string) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Utrecht');
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const checkCode = () => {
    if (VALID_CODES.includes(code.trim().toUpperCase())) {
      setStep('profile');
      setError('');
    } else {
      setError('Ongeldige uitnodigingscode. Vraag je manager om de code.');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${shaking ? 'shake' : ''}`}>
        <div className="auth-logo">
          <div className="logo-icon-large"><Globe size={32} color="white" /></div>
          <h1 className="auth-title">DUPO<span>IND</span></h1>
          <p className="auth-subtitle">Verbinding over Utrecht · Lisbon · Chennai</p>
        </div>

        {step === 'code' ? (
          <div className="auth-form">
            <div className="auth-field">
              <label><Lock size={14} /> Uitnodigingscode</label>
              <input
                type="text"
                placeholder="Bijv. DUPOIND"
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && checkCode()}
                className="auth-input"
              />
              {error && <p className="auth-error">{error}</p>}
            </div>
            <p className="auth-hint">Geen account nodig. Vraag je team lead om de Squad Code.<br/>💡 Tip: probeer <strong>DUPOIND</strong></p>
            <button className="btn-auth" onClick={checkCode}>
              Doorgaan <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="auth-field">
              <label>Jouw naam</label>
              <input type="text" placeholder="bijv. Martijn" value={name} onChange={e => setName(e.target.value)} className="auth-input" />
            </div>
            <div className="auth-field">
              <label>Jouw locatie</label>
              <select value={city} onChange={e => setCity(e.target.value)} className="auth-input auth-select">
                <option>Utrecht</option>
                <option>Lisbon</option>
                <option>Chennai</option>
              </select>
            </div>
            <button className="btn-auth" onClick={() => name.trim() && onLogin(name.trim(), city)} disabled={!name.trim()}>
              Join DUPOIND <Check size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Three Cities Widget
// ─────────────────────────────────────────
function CitiesHub() {
  const [times, setTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t: Record<string, string> = {};
      CITIES.forEach(c => {
        t[c.id] = now.toLocaleTimeString('nl-NL', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      });
      setTimes(t);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass-panel">
      <div className="panel-header"><Globe className="panel-icon" size={22} /><h2>Squad Hubs</h2></div>
      <div className="cities-container">
        {CITIES.map(city => (
          <div key={city.id} className={`city-card ${city.id}`}>
            <div className="city-header">
              <span>{city.flag} {city.name}</span>
              <Coffee size={16} color="var(--text-muted)" />
            </div>
            <div className="time-display">{times[city.id] || '--:--:--'}</div>
            <div className="city-meta">
              <span className="meta-item">{city.weather.icon} {city.weather.temp}</span>
              {city.holiday && <span className="city-holiday">🎉 {city.holiday}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────
function DashboardTab() {
  const [kudos, setKudos] = useState<KudoEntry[]>(INITIAL_KUDOS);
  const [showKudoForm, setShowKudoForm] = useState(false);
  const [newKudo, setNewKudo] = useState({ to: '', message: '' });

  const sendKudo = () => {
    if (!newKudo.to.trim() || !newKudo.message.trim()) return;
    const entry: KudoEntry = {
      id: Date.now(), from: 'Jij', fromCity: 'Jouw locatie',
      to: newKudo.to, message: newKudo.message,
      translation: '(Vertaling beschikbaar in de live versie)', targetLang: 'AUTO', emoji: '🙌',
    };
    setKudos([entry, ...kudos]);
    setNewKudo({ to: '', message: '' });
    setShowKudoForm(false);
  };

  return (
    <div className="dashboard-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <CitiesHub />
        {/* Word of the Day */}
        <div className="glass-panel">
          <div className="panel-header"><MessageSquare className="panel-icon" size={22} /><h2>Phrase of the Day</h2></div>
          <div className="wotd-container">
            {WOTD.map((item, idx) => (
              <div key={idx} className="wotd-card">
                <div className={`lang-badge ${item.lang.toLowerCase()}-badge`}>{item.lang}</div>
                <div className="wotd-content">
                  <h3>"{item.word}"</h3>
                  <div className="wotd-translation">{item.translation}</div>
                  <div className="wotd-example">{item.useCase}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kudos Panel */}
      <div className="glass-panel kudos-panel">
        <div className="panel-header">
          <Heart size={22} color="var(--accent)" fill="var(--accent)" />
          <h2>Squad Kudos</h2>
          <button className="btn-icon-sm" onClick={() => setShowKudoForm(!showKudoForm)} title="Stuur kudos">
            {showKudoForm ? <X size={16} /> : <Send size={16} />}
          </button>
        </div>

        {showKudoForm && (
          <div className="kudo-form">
            <input className="kudo-input" placeholder="Naar wie? (bijv. Ananya in Chennai)" value={newKudo.to} onChange={e => setNewKudo({ ...newKudo, to: e.target.value })} />
            <textarea className="kudo-input kudo-textarea" placeholder="Jouw boodschap..." value={newKudo.message} onChange={e => setNewKudo({ ...newKudo, message: e.target.value })} />
            <button className="btn-kudos" onClick={sendKudo}><Send size={16} /> Verstuur Kudos</button>
          </div>
        )}

        <div className="kudos-feed">
          {kudos.map(kudo => (
            <div key={kudo.id} className="kudo-item">
              <div className="kudo-header">
                <span className="kudo-author">{kudo.emoji} {kudo.from} ({kudo.fromCity})</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>→ {kudo.to}</span>
              </div>
              <div className="kudo-message">{kudo.message}</div>
              <div className="kudo-translation"><Globe size={12} /> {kudo.translation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Squad Roulette Tab
// ─────────────────────────────────────────
function RouletteTab() {
  const [spinning, setSpinning] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<typeof SQUAD>([]);
  const [icebreaker, setIcebreaker] = useState('');
  const [done, setDone] = useState(false);

  const spin = useCallback(() => {
    setSpinning(true);
    setDone(false);
    setSelectedSquad([]);
    setIcebreaker('');
    setTimeout(() => {
      const shuffled = [...SQUAD].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, 3);
      setSelectedSquad(picked);
      setIcebreaker(ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]);
      setSpinning(false);
      setDone(true);
    }, 2000);
  }, []);

  return (
    <div className="roulette-container">
      <div className="glass-panel roulette-panel">
        <div className="panel-header"><Shuffle className="panel-icon" size={22} /><h2>Squad Roulette</h2></div>
        <p className="roulette-desc">Verbind willekeurig 3 collega's uit verschillende locaties voor een 15-minuten virtuele koffiepauze. Opt-in, laagdrempelig, en altijd met een icebreaker!</p>

        <button className={`btn-spin ${spinning ? 'spinning' : ''}`} onClick={spin} disabled={spinning}>
          <Shuffle size={20} />
          {spinning ? 'Verbinden...' : 'Draai de Roulette!'}
        </button>

        {spinning && (
          <div className="spin-animation">
            {SQUAD.map((m, i) => (
              <div key={i} className="spin-card shimmer">{m.avatar}</div>
            ))}
          </div>
        )}

        {done && selectedSquad.length > 0 && (
          <div className="roulette-result">
            <h3>☕ Jouw Coffee Crew</h3>
            <div className="squad-cards">
              {selectedSquad.map((member, i) => (
                <div key={i} className={`squad-member-card ${member.cityId}`}>
                  <div className={`squad-avatar ${member.cityId}`}>{member.avatar}</div>
                  <div className="squad-name">{member.name}</div>
                  <div className="squad-city">{CITIES.find(c => c.id === member.cityId)?.flag} {member.city}</div>
                </div>
              ))}
            </div>
            <div className="icebreaker-box">
              <div className="icebreaker-label">💬 Icebreaker van de dag</div>
              <div className="icebreaker-text">"{icebreaker}"</div>
            </div>
            <button className="btn-kudos" style={{ marginTop: '1rem' }}>
              📅 Plan de Coffee Break
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Culture Wall Tab
// ─────────────────────────────────────────
function CultureWallTab() {
  const [posts, setPosts] = useState<WallPost[]>(INITIAL_WALL);
  const [newPost, setNewPost] = useState('');
  const [newEmoji, setNewEmoji] = useState('📸');
  const userCity = 'Utrecht';

  const toggleLike = (id: number) => {
    setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const addPost = () => {
    if (!newPost.trim()) return;
    const post: WallPost = {
      id: Date.now(), author: 'Jij', city: userCity,
      cityId: userCity.toLowerCase().replace('é', 'e'),
      content: newPost, emoji: newEmoji, likes: 0, liked: false,
      time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <div className="wall-container">
      {/* New Post Form */}
      <div className="glass-panel">
        <div className="panel-header"><Camera className="panel-icon" size={22} /><h2>Culture Wall</h2></div>
        <div className="new-post-form">
          <div className="post-form-row">
            <select className="auth-input auth-select" style={{ width: 'auto' }} value={newEmoji} onChange={e => setNewEmoji(e.target.value)}>
              {['📸', '☕', '🍕', '🎉', '💻', '🌅', '🏙️', '🎊', '🌶️', '🥐', '🧀'].map(e => <option key={e}>{e}</option>)}
            </select>
            <textarea
              className="kudo-input kudo-textarea"
              style={{ flex: 1 }}
              placeholder="Deel een moment vanuit jouw locatie..."
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
            />
          </div>
          <button className="btn-kudos" onClick={addPost} style={{ marginTop: '0.75rem' }}>
            <Image size={16} /> Post op de Wall
          </button>
        </div>
      </div>

      {/* Posts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {posts.map(post => (
          <div key={post.id} className={`wall-post ${post.cityId}`}>
            <div className="wall-post-header">
              <div className="wall-author-info">
                <div className={`squad-avatar ${post.cityId}`} style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                  {post.author[0]}{post.author[1] || ''}
                </div>
                <div>
                  <div className="wall-author">{post.author}</div>
                  <div className="wall-location">{CITIES.find(c => c.id === post.cityId)?.flag} {post.city} · {post.time}</div>
                </div>
              </div>
              <span style={{ fontSize: '2rem' }}>{post.emoji}</span>
            </div>
            <div className="wall-content">{post.content}</div>
            <div className="wall-actions">
              <button className={`like-btn ${post.liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                <Heart size={16} fill={post.liked ? 'var(--accent)' : 'none'} color={post.liked ? 'var(--accent)' : 'var(--text-muted)'} />
                {post.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Main App
// ─────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<{ name: string; city: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!user) {
    return <AuthScreen onLogin={(name, city) => setUser({ name, city })} />;
  }

  const cityId = user.city.toLowerCase().replace('é', 'e').replace('ó', 'o');
  const cityFlag = CITIES.find(c => c.id === cityId)?.flag ?? '🌍';

  const tabs: { id: Tab; icon: ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <Home size={18} />, label: 'Dashboard' },
    { id: 'roulette', icon: <Shuffle size={18} />, label: 'Roulette' },
    { id: 'wall', icon: <LayoutGrid size={18} />, label: 'Culture Wall' },
  ];

  return (
    <div className="app-container">
      <header>
        <div className="logo-container">
          <div className="logo-icon"><Globe color="white" size={22} /></div>
          <div className="logo-text">DUPO<span>IND</span></div>
        </div>
        <nav className="tab-nav">
          {tabs.map(tab => (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.icon} <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="user-profile">
          <span>{cityFlag}</span>
          <div className={`avatar ${cityId}`}>{user.name[0]}</div>
          <span style={{ fontSize: '0.9rem' }}>{user.name}</span>
        </div>
      </header>

      <main>
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'roulette' && <RouletteTab />}
        {activeTab === 'wall' && <CultureWallTab />}
      </main>
    </div>
  );
}
