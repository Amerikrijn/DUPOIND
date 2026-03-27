import { useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Globe, Heart, MessageSquare, Sun, CloudRain, Coffee, Send, Shuffle, Camera, Home, LayoutGrid, Lock, ArrowRight, X, Check, Lightbulb, Image } from 'lucide-react';
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
  translations: { nl: string; pt: string; ta: string };
};

// ─────────────────────────────────────────
// Mock Translation Engine
// (In production: replace with DeepL / Azure Translate API)
// ─────────────────────────────────────────

function mockTranslate(text: string, targetLang: 'nl' | 'pt' | 'ta'): string {
  const prefixes: Record<string, string> = {
    nl: 'Vertaald naar NL: ',
    pt: 'Traduzido para PT: ',
    ta: 'தமிழில் மொழிபெயர்க்கப்பட்டது: ',
  };
  // In a real app this would call a translation API
  return prefixes[targetLang] + '"' + text + '"';
}

function getTranslations(text: string) {
  return {
    nl: mockTranslate(text, 'nl'),
    pt: mockTranslate(text, 'pt'),
    ta: mockTranslate(text, 'ta'),
  };
}

// ─────────────────────────────────────────
// Data
// ─────────────────────────────────────────
const SQUAD = [
  { name: 'Martijn', city: 'Utrecht', avatar: 'MV', cityId: 'utrecht' },
  { name: 'Ananya',  city: 'Chennai', avatar: 'AS', cityId: 'chennai' },
  { name: 'Joana',   city: 'Lisbon',  avatar: 'JF', cityId: 'lisbon'  },
  { name: 'Sanjeev', city: 'Chennai', avatar: 'SK', cityId: 'chennai' },
  { name: 'Sophie',  city: 'Utrecht', avatar: 'ST', cityId: 'utrecht' },
  { name: 'Carlos',  city: 'Lisbon',  avatar: 'CM', cityId: 'lisbon'  },
  { name: 'Priya',   city: 'Chennai', avatar: 'PK', cityId: 'chennai' },
  { name: 'Lars',    city: 'Utrecht', avatar: 'LV', cityId: 'utrecht' },
];

const CITIES: City[] = [
  { id: 'utrecht', name: 'Utrecht', flag: '🇳🇱', timezone: 'Europe/Amsterdam', weather: { icon: <CloudRain size={16}/>, temp: '14°C', desc: 'Buiig' }, holiday: "King's Day in 30 dagen" },
  { id: 'lisbon',  name: 'Lisbon',  flag: '🇵🇹', timezone: 'Europe/Lisbon',    weather: { icon: <Sun size={16}/>,      temp: '22°C', desc: 'Soleado' } },
  { id: 'chennai', name: 'Chennai', flag: '🇮🇳', timezone: 'Asia/Kolkata',      weather: { icon: <Sun size={16}/>,      temp: '34°C', desc: 'Veyil'  }, holiday: 'Tamil New Year volgende week' },
];

const WOTD = [
  { lang: 'NL', word: 'Gezellig',        translation: 'Cozy, fun, warm atmosphere',        useCase: '"Zondag borrelen met vrienden — zo gezellig! 🍺"' },
  { lang: 'PT', word: 'Saudade',         translation: 'A deep longing or nostalgia',        useCase: '"Ik heb saudade naar die zomer in Lisbon... 🌊"' },
  { lang: 'IN', word: 'Nalla Neram (Tamil)', translation: 'A beautiful, lucky moment in time', useCase: '"Dit weekend was echt nalla neram! 🌅"' },
];

const CULTURAL_FACTS = [
  { city: 'Utrecht',  cityId: 'utrecht', flag: '🇳🇱', fact: 'Utrecht heeft meer fietspaden per inwoner dan welke andere stad ter wereld dan ook. Er zijn zelfs fietsparkeergarages! 🚲' },
  { city: 'Lisbon',   cityId: 'lisbon',  flag: '🇵🇹', fact: 'Lissabon is de op twee na oudste Europese hoofdstad ter wereld — ouder dan Rome. De stad ligt op 7 heuvels! ⛰️' },
  { city: 'Chennai',  cityId: 'chennai', flag: '🇮🇳', fact: 'Chennai heeft de op één na langste stadsstranden van Azië (Marina Beach). Je ziet er altijd kriket-spelende kinderen! 🏏' },
  { city: 'Utrecht',  cityId: 'utrecht', flag: '🇳🇱', fact: 'Stroopwafels zijn uitgevonden in Utrecht in 1810 door bakker Gerard Kamphuisen. Het originele recept is nog steeds geheim! 🍪' },
  { city: 'Lisbon',   cityId: 'lisbon',  flag: '🇵🇹', fact: 'Fado-muziek is door UNESCO erkend als immaterieel werelderfgoed. Het woord betekent letterlijk "lot" of "noodlot". 🎶' },
  { city: 'Chennai',  cityId: 'chennai', flag: '🇮🇳', fact: 'Tamil is een van de oudste nog levende talen ter wereld — meer dan 2.000 jaar oud. Sommige woorden zijn bijna onveranderd! 📜' },
];

const ICEBREAKERS = [
  'Welke lokale snack is een absolute must-try in jouw stad? 🍿',
  'Als je één film kon kiezen die jouw cultuur beschrijft, welke dan? 🎬',
  'Wat is de meest grappige misvatting die mensen over jouw stad hebben? 😂',
  'Beschrijf het perfecte weekend in jouw stad in 3 emoji\'s.',
  'Welk lokaal festival verdient een wereldwijde fanbase? 🎉',
  'Wat is jouw favoriete lokale restaurant-tip die toeristen nooit vinden? 🍽️',
  'Als je één woord uit jouw taal aan de wereld kon geven, welk is het? 💬',
  'Wat is de meest Instagrammable plek in jouw stad? 📸',
];

const INITIAL_KUDOS: KudoEntry[] = [
  { id: 1, from: 'Sanjeev', fromCity: 'Chennai', to: 'Martijn (Utrecht)', message: 'Jouw Stroopwafel-pakketje is aangekomen! Beste snack van mijn jaar 🍪', translation: '🇳🇱 Jouw Stroopwafels zijn fantastisch! Bedankt, vriend!', targetLang: 'NL', emoji: '🍪' },
  { id: 2, from: 'Joana',   fromCity: 'Lisbon',  to: 'Ananya (Chennai)',  message: 'Je Biryani-recept was amazing! Mijn hele familie was onder de indruk 🍛',       translation: '🇮🇳 உங்கள் Biryani recipe அருமை! என் family மிகவும் impressed!', targetLang: 'IN', emoji: '🍛' },
  { id: 3, from: 'Lars',    fromCity: 'Utrecht', to: 'Carlos (Lisbon)',   message: 'Die Fado-playlist — op repeat de hele week. Pure magie 🎶',                       translation: '🇵🇹 Essa playlist — de repetição a semana inteira. Fado é magia pura!', targetLang: 'PT', emoji: '🎶' },
];

const INITIAL_WALL: WallPost[] = [
  { id: 1, author: 'Martijn', city: 'Utrecht', cityId: 'utrecht', content: 'Goedemorgen van de Oudegracht! ☀️ Vandaag 14°C en de kaasmarkt is op z\'n mooist. Wie wil er een online brunch? 🧀🥐', emoji: '🌧️', likes: 4, liked: false, time: '09:15', translations: { nl: '🇳🇱 Goedemorgen van de Oudegracht!', pt: '🇵🇹 Traduzido para PT: "Bom dia da Oudegracht! O mercado de queijos está incrível.🧀"', ta: '🇮🇳 தமிழில்: "காலை வணக்கம்! பாலாடைக்கட்டி சந்தை அழகாக இருக்கிறது. 🧀"' }},
  { id: 2, author: 'Ananya', city: 'Chennai',  cityId: 'chennai',  content: 'Vanmiddag: 36°C, beste Masala Chai, en een koe die nonchalant de markt doorkruist 🌶️☕. Chennai is nooit saai!', emoji: '☕', likes: 12, liked: false, time: '13:05', translations: { nl: '🇳🇱 Vertaald: "36 graden, beste Masala Chai, en een koe op de markt. Chennai is nooit saai!"', pt: '🇵🇹 Traduzido: "36°C, o melhor Masala Chai, e uma vaca no mercado. Chennai nunca é aborrecido!"', ta: '🇮🇳 மூலமொழி: "36°C, சிறந்த மசாலா சாய், சந்தையில் ஒரு பசு. சென்னை எப்போதும் சுவாரஸ்யமானது!"' }},
  { id: 3, author: 'Joana',   city: 'Lisbon',   cityId: 'lisbon',   content: 'Zojuist Pastel de Nata gegeten recht van de oven bij Pastéis de Belém 🥐🇵🇹. De rij was 45 min — élke minuut waard!', emoji: '🥐', likes: 18, liked: false, time: '14:20', translations: { nl: '🇳🇱 Vertaald: "Net Pastel de Nata gegeten van de oven bij Pastéis de Belém. Elke rij-minuut waard!"', pt: '🇵🇹 Original: "Acabei de comer Pastel de Nata no Pastéis de Belém. A fila era 45 min — valeu cada minuto!"', ta: '🇮🇳 தமிழில்: "Pastéis de Belém-ல் Pastel de Nata சாப்பிட்டேன். 45 நிமிட வரிசை — ஒவ்வொரு நிமிடமும் மதிப்புமிக்கது!"' }},
];

const VALID_CODES = ['DUPOIND', 'UTRECHT', 'LISBON1', 'CHENNAI'];

// ─────────────────────────────────────────
// Auth Screen
// ─────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (name: string, city: string) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Utrecht');
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);

  const checkCode = () => {
    if (VALID_CODES.includes(code.trim().toUpperCase())) {
      setStep('profile'); setError('');
    } else {
      setError('Ongeldige uitnodigingscode. Vraag je team lead om de code.');
      setShaking(true); setTimeout(() => setShaking(false), 500);
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
              <input type="text" placeholder="Bijv. DUPOIND" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkCode()} className="auth-input" />
              {error && <p className="auth-error">{error}</p>}
            </div>
            <p className="auth-hint">Geen account nodig. Vraag je team lead om de Squad Code.<br />💡 Tip: probeer <strong>DUPOIND</strong></p>
            <button className="btn-auth" onClick={checkCode}>Doorgaan <ArrowRight size={18} /></button>
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
                <option>Utrecht</option><option>Lisbon</option><option>Chennai</option>
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
// Cities Hub
// ─────────────────────────────────────────
function CitiesHub() {
  const [times, setTimes] = useState<Record<string, string>>({});
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t: Record<string, string> = {};
      CITIES.forEach(c => { t[c.id] = now.toLocaleTimeString('nl-NL', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); });
      setTimes(t);
    };
    update(); const iv = setInterval(update, 1000); return () => clearInterval(iv);
  }, []);
  return (
    <div className="glass-panel">
      <div className="panel-header"><Globe className="panel-icon" size={22} /><h2>Squad Hubs</h2></div>
      <div className="cities-container">
        {CITIES.map(city => (
          <div key={city.id} className={`city-card ${city.id}`}>
            <div className="city-header"><span>{city.flag} {city.name}</span><Coffee size={16} color="var(--text-muted)" /></div>
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
// Cultural Weetje van de Dag
// ─────────────────────────────────────────
function CulturalFact() {
  const fact = CULTURAL_FACTS[new Date().getDate() % CULTURAL_FACTS.length];
  return (
    <div className={`glass-panel cultural-fact-panel ${fact.cityId}`}>
      <div className="panel-header"><Lightbulb className="panel-icon" size={22} /><h2>Cultureel Weetje</h2><span className="fact-city-badge">{fact.flag} {fact.city}</span></div>
      <blockquote className="fact-text">"{fact.fact}"</blockquote>
    </div>
  );
}

// ─────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────
function DashboardTab({ userName }: { userName: string }) {
  const [kudos, setKudos] = useState<KudoEntry[]>(INITIAL_KUDOS);
  const [showKudoForm, setShowKudoForm] = useState(false);
  const [newKudo, setNewKudo] = useState({ to: '', message: '' });

  const sendKudo = () => {
    if (!newKudo.to.trim() || !newKudo.message.trim()) return;
    const entry: KudoEntry = { id: Date.now(), from: userName, fromCity: 'Jouw locatie', to: newKudo.to, message: newKudo.message, translation: '🌐 Vertaling beschikbaar in de live versie met een echte API.', targetLang: 'AUTO', emoji: '🙌' };
    setKudos([entry, ...kudos]);
    setNewKudo({ to: '', message: '' }); setShowKudoForm(false);
  };

  return (
    <div className="dashboard-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <CitiesHub />
        <CulturalFact />
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
      <div className="glass-panel kudos-panel">
        <div className="panel-header">
          <Heart size={22} color="var(--accent)" fill="var(--accent)" /><h2>Squad Kudos</h2>
          <button className="btn-icon-sm" onClick={() => setShowKudoForm(!showKudoForm)}>{showKudoForm ? <X size={16} /> : <Send size={16} />}</button>
        </div>
        {showKudoForm && (
          <div className="kudo-form">
            <input className="kudo-input" placeholder="Naar wie? (bijv. Ananya – Chennai)" value={newKudo.to} onChange={e => setNewKudo({ ...newKudo, to: e.target.value })} />
            <textarea className="kudo-input kudo-textarea" placeholder="Schrijf in jouw eigen taal — het wordt automatisch vertaald! 🌐" value={newKudo.message} onChange={e => setNewKudo({ ...newKudo, message: e.target.value })} />
            <button className="btn-kudos" onClick={sendKudo}><Send size={16} /> Verstuur &amp; Vertaal</button>
          </div>
        )}
        <div className="kudos-feed">
          {kudos.map(kudo => (
            <div key={kudo.id} className="kudo-item">
              <div className="kudo-header"><span className="kudo-author">{kudo.emoji} {kudo.from} ({kudo.fromCity})</span><span style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>→ {kudo.to}</span></div>
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
// Squad Roulette Tab (fully in-app!)
// ─────────────────────────────────────────
function RouletteTab({ userName, onPostToWall }: { userName: string; onPostToWall: (post: WallPost) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [selectedSquad, setSelectedSquad] = useState<typeof SQUAD>([]);
  const [icebreaker, setIcebreaker] = useState('');
  const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState(false);

  const spin = useCallback(() => {
    setSpinning(true); setDone(false); setSelectedSquad([]); setIcebreaker(''); setAnswer(''); setAnswered(false);
    setTimeout(() => {
      const shuffled = [...SQUAD].sort(() => Math.random() - 0.5);
      setSelectedSquad(shuffled.slice(0, 3));
      setIcebreaker(ICEBREAKERS[Math.floor(Math.random() * ICEBREAKERS.length)]);
      setSpinning(false); setDone(true);
    }, 2000);
  }, []);

  const postAnswer = () => {
    if (!answer.trim()) return;
    const post: WallPost = {
      id: Date.now(), author: userName, city: 'Jouw locatie', cityId: 'utrecht',
      content: `💬 Roulette-antwoord: "${answer}"`, emoji: '🎲',
      likes: 0, liked: false, time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      translations: getTranslations(answer),
    };
    onPostToWall(post); setAnswered(true);
  };

  return (
    <div className="roulette-container">
      <div className="glass-panel roulette-panel">
        <div className="panel-header"><Shuffle className="panel-icon" size={22} /><h2>Squad Roulette</h2></div>
        <p className="roulette-desc">Verbind willekeurig 3 collega's voor een leuke culturele uitwisseling — volledig in de app, geen email of agenda nodig!</p>
        <button className={`btn-spin ${spinning ? 'spinning' : ''}`} onClick={spin} disabled={spinning}>
          <Shuffle size={20} />{spinning ? 'Verbinden...' : 'Draai de Roulette!'}
        </button>
        {spinning && (
          <div className="spin-animation">
            {SQUAD.map((m, i) => <div key={i} className="spin-card">{m.avatar}</div>)}
          </div>
        )}
        {done && selectedSquad.length > 0 && (
          <div className="roulette-result">
            <h3>☕ Jouw Culture Crew</h3>
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
              <div className="icebreaker-label">💬 De vraag van vandaag</div>
              <div className="icebreaker-text">"{icebreaker}"</div>
            </div>
            {!answered ? (
              <div className="answer-box">
                <p className="answer-label">✍️ Beantwoord in jouw eigen taal — wordt gepost op de Culture Wall!</p>
                <textarea className="kudo-input kudo-textarea" placeholder="Typ jouw antwoord hier..." value={answer} onChange={e => setAnswer(e.target.value)} />
                <button className="btn-kudos" onClick={postAnswer}><Image size={16} /> Post op Culture Wall + Vertaal</button>
              </div>
            ) : (
              <div className="answered-confirm">
                <Check size={20} color="var(--chennai-color)" />
                <span>Gepost op de Culture Wall in 🇳🇱 NL, 🇵🇹 PT en 🇮🇳 Tamil!</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Culture Wall Tab
// ─────────────────────────────────────────
function CultureWallTab({ posts, setPosts, userName }: { posts: WallPost[]; setPosts: React.Dispatch<React.SetStateAction<WallPost[]>>; userName: string }) {
  const [newPost, setNewPost] = useState('');
  const [newEmoji, setNewEmoji] = useState('📸');
  const [showTranslations, setShowTranslations] = useState<Record<number, boolean>>({});

  const toggleLike = (id: number) => setPosts(posts.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));

  const addPost = () => {
    if (!newPost.trim()) return;
    const post: WallPost = {
      id: Date.now(), author: userName, city: 'Jouw locatie', cityId: 'utrecht',
      content: newPost, emoji: newEmoji, likes: 0, liked: false,
      time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      translations: getTranslations(newPost),
    };
    setPosts([post, ...posts]); setNewPost('');
  };

  const toggleTranslation = (id: number) => setShowTranslations(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="wall-container">
      <div className="glass-panel">
        <div className="panel-header"><Camera className="panel-icon" size={22} /><h2>Culture Wall</h2><span className="translate-badge">🌐 Auto-vertaling</span></div>
        <div className="new-post-form">
          <div className="post-form-row">
            <select className="auth-input auth-select" style={{ width: 'auto' }} value={newEmoji} onChange={e => setNewEmoji(e.target.value)}>
              {['📸','☕','🍕','🎉','💻','🌅','🏙️','🎊','🌶️','🥐','🧀','🎶','🏏'].map(e => <option key={e}>{e}</option>)}
            </select>
            <textarea className="kudo-input kudo-textarea" style={{ flex: 1 }} placeholder="Schrijf in jouw eigen taal — wordt vertaald naar NL, PT en Tamil! 🌐" value={newPost} onChange={e => setNewPost(e.target.value)} />
          </div>
          <button className="btn-kudos" onClick={addPost}><Image size={16} /> Post &amp; Vertaal naar alle talen</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {posts.map(post => (
          <div key={post.id} className={`wall-post ${post.cityId}`}>
            <div className="wall-post-header">
              <div className="wall-author-info">
                <div className={`squad-avatar ${post.cityId}`} style={{ width: 36, height: 36, fontSize: '.85rem' }}>{post.author[0]}{post.author[1] || ''}</div>
                <div><div className="wall-author">{post.author}</div><div className="wall-location">{CITIES.find(c => c.id === post.cityId)?.flag ?? '🌍'} {post.city} · {post.time}</div></div>
              </div>
              <span style={{ fontSize: '2rem' }}>{post.emoji}</span>
            </div>
            <div className="wall-content">{post.content}</div>
            {showTranslations[post.id] && (
              <div className="translation-block">
                <div className="trans-line">{post.translations.nl}</div>
                <div className="trans-line">{post.translations.pt}</div>
                <div className="trans-line">{post.translations.ta}</div>
                <p className="trans-note">⚡ Live vertaling via DeepL/Azure API in productie</p>
              </div>
            )}
            <div className="wall-actions">
              <button className={`like-btn ${post.liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id)}>
                <Heart size={16} fill={post.liked ? 'var(--accent)' : 'none'} color={post.liked ? 'var(--accent)' : 'var(--text-muted)'} /> {post.likes}
              </button>
              <button className="translate-btn" onClick={() => toggleTranslation(post.id)}>
                <Globe size={14} /> {showTranslations[post.id] ? 'Verberg vertalingen' : 'Bekijk in NL · PT · Tamil'}
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
  const [wallPosts, setWallPosts] = useState<WallPost[]>(INITIAL_WALL);

  if (!user) return <AuthScreen onLogin={(name, city) => setUser({ name, city })} />;

  const cityId = user.city.toLowerCase();
  const cityFlag = CITIES.find(c => c.id === cityId)?.flag ?? '🌍';

  const tabs: { id: Tab; icon: ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <Home size={18} />, label: 'Dashboard' },
    { id: 'roulette',  icon: <Shuffle size={18} />, label: 'Roulette' },
    { id: 'wall',      icon: <LayoutGrid size={18} />, label: 'Culture Wall' },
  ];

  const addToWall = (post: WallPost) => { setWallPosts(prev => [post, ...prev]); setActiveTab('wall'); };

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
        {activeTab === 'dashboard' && <DashboardTab userName={user.name} />}
        {activeTab === 'roulette'  && <RouletteTab userName={user.name} onPostToWall={addToWall} />}
        {activeTab === 'wall'      && <CultureWallTab posts={wallPosts} setPosts={setWallPosts} userName={user.name} />}
      </main>
    </div>
  );
}
