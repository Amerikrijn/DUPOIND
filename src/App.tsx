import { useState, useEffect, useCallback } from 'react';
import {
  Globe, Heart, MessageSquare, Coffee, Send,
  Shuffle, Camera, Home, LayoutGrid, Lock, ArrowRight, X, Check,
  Lightbulb, Image, BarChart2, Zap, Trophy, Database, Trash2, Plus, Utensils
} from 'lucide-react';
import './index.css';

import { 
  useWallPosts, useKudos, usePresence, useCultureData, useSquadCodes, useQuiz 
} from './hooks/useFirestore';
import { useWeather } from './hooks/useWeather';
import { getFullTranslation } from './utils/translate';
import type { UserStatus, Dish, QuizQuestion } from './types';
import { QUIZ_QUESTIONS, INITIAL_POLLS } from './data';

import { PollsTab } from './components/PollsTab';
import { QuizTab } from './components/QuizTab';

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
type Tab = 'dashboard' | 'connect' | 'wall' | 'quiz' | 'polls';

const CITIES = [
  { id: 'utrecht', name: 'Utrecht', flag: '🇳🇱', timezone: 'Europe/Amsterdam', holiday: "King's Day in 30 dagen" },
  { id: 'lisbon',  name: 'Lisbon',  flag: '🇵🇹', timezone: 'Europe/Lisbon' },
  { id: 'chennai', name: 'Chennai', flag: '🇮🇳', timezone: 'Asia/Kolkata', holiday: 'Tamil New Year volgende week' },
];

const MOODS = ['😄 Top dag!', '😊 Gewoon goed', '😐 Rustig', '🫠 Beetje moe', '🔥 Vol energie', '🎉 Feestmodus'];

function getCityFlag(cityId: string) { return CITIES.find(c => c.id === cityId)?.flag ?? '🌍'; }
function getCityName(cityId: string) { return CITIES.find(c => c.id === cityId)?.name ?? cityId; }

// ─────────────────────────────────────────
// Auth Screen
// ─────────────────────────────────────────
function AuthScreen({ onLogin }: { onLogin: (name: string, city: string) => void }) {
  const { codes, addCode, removeCode, loading: codesLoading } = useSquadCodes();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Utrecht');
  const [step, setStep] = useState<'code' | 'profile'>('code');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newAdminCode, setNewAdminCode] = useState('');

  const checkCode = () => {
    const input = code.trim().toUpperCase();
    if (codes.includes(input)) { 
      setStep('profile'); 
      setError(''); 
    } else if (codes.length === 0 && !codesLoading) {
      setError('Geen codes in database. Gebruik de Seed tool.');
      setShake(true);
    } else { 
      setError('Ongeldige code. Vraag je team lead.'); 
      setShake(true); 
      setTimeout(() => setShake(false), 500); 
    }
  };

  const handleAddCode = async () => {
    if (!newAdminCode.trim()) return;
    await addCode(newAdminCode);
    setNewAdminCode('');
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        <div className="auth-logo" onClick={() => setShowAdmin(!showAdmin)} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-large"><Globe size={32} color="white" /></div>
          <h1 className="auth-title">DUPO<span>IND</span></h1>
          <p className="auth-subtitle">Utrecht · Lisbon · Chennai</p>
        </div>

        {showAdmin ? (
          <div className="auth-form admin-panel">
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent)' }}>SQUAD CODE BEHEER</h3>
            <div className="admin-list" style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '1rem' }}>
              {codes.map(c => (
                <div key={c} className="admin-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <span>{c}</span>
                  <button onClick={() => removeCode(c)} className="btn-icon-sm" style={{ color: 'var(--error)' }}><Trash2 size={14} /></button>
                </div>
              ))}
              {codes.length === 0 && <p className="auth-hint">Geen codes. Voeg er een toe!</p>}
            </div>
            <div className="auth-field">
              <input className="auth-input" type="text" placeholder="Nieuwe code..." value={newAdminCode} onChange={e => setNewAdminCode(e.target.value)} />
              <button className="btn-auth" style={{ marginTop: '0.5rem' }} onClick={handleAddCode}><Plus size={16} /> Toevoegen</button>
            </div>
            <button className="btn-icon-sm" onClick={() => setShowAdmin(false)} style={{ marginTop: '1rem', width: '100%' }}>Sluiten</button>
          </div>
        ) : step === 'code' ? (
          <div className="auth-form">
            <div className="auth-field">
              <label><Lock size={14} /> Squad Code</label>
              <input className="auth-input" type="text" placeholder="bijv. DUPOIND" value={code}
                onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkCode()} />
              {error && <p className="auth-error">{error}</p>}
            </div>
            <p className="auth-hint">Geen wachtwoord of email nodig.<br />💡 Vraag je team lead om de code.</p>
            <button className="btn-auth" onClick={checkCode} disabled={codesLoading}>
              {codesLoading ? 'Codes laden...' : 'Doorgaan'} <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="auth-field"><label>Jouw naam</label>
              <input className="auth-input" type="text" placeholder="bijv. Martijn" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="auth-field"><label>Jouw locatie</label>
              <select className="auth-input auth-select" value={city} onChange={e => setCity(e.target.value)}>
                <option>Utrecht</option><option>Lisbon</option><option>Chennai</option>
              </select></div>
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
// Cities Hub (real weather)
// ─────────────────────────────────────────
function CitiesHub() {
  const [times, setTimes] = useState<Record<string, string>>({});
  const weather = useWeather();

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
      <div className="panel-header"><Globe className="panel-icon" size={22} /><h2>Squad Hubs</h2><span className="live-badge">🌤️ Live weer</span></div>
      <div className="cities-container">
        {CITIES.map(city => {
          const w = weather[city.id];
          return (
            <div key={city.id} className={`city-card ${city.id}`}>
              <div className="city-header"><span>{city.flag} {city.name}</span><Coffee size={16} color="var(--text-muted)" /></div>
              <div className="time-display">{times[city.id] || '--:--:--'}</div>
              <div className="city-meta">
                <span className="meta-item">
                  {w?.loading ? '⏳' : `${w?.emoji} ${w?.temp}°C – ${w?.desc}`}
                </span>
                {city.holiday && <span className="city-holiday">🎉 {city.holiday}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Cultural Fact 
// ─────────────────────────────────────────
interface CultureFactProps { facts: { cityId: string; flag: string; city: string; fact: string }[] }
function CulturalFact({ facts }: CultureFactProps) {
  const fact = facts.length > 0
    ? facts[new Date().getDate() % facts.length]
    : { cityId: 'world', flag: '🌍', city: 'DUPOIND', fact: 'Laden van de leukste weetjes...' };

  return (
    <div className={`glass-panel cultural-fact-panel ${fact.cityId}`}>
      <div className="panel-header"><Lightbulb className="panel-icon" size={22} /><h2>Cultureel Weetje</h2><span className="fact-city-badge">{fact.flag} {fact.city}</span></div>
      <blockquote className="fact-text">"{fact.fact}"</blockquote>
    </div>
  );
}

// ─────────────────────────────────────────
// Local Flavors 
// ─────────────────────────────────────────
function LocalFlavors({ dishes }: { dishes: Dish[] }) {
  return (
    <div className="glass-panel">
      <div className="panel-header"><Utensils className="panel-icon" size={22} /><h2>Local Flavors</h2></div>
      <div className="dishes-scroll-container">
        {dishes.length === 0 && <p className="auth-hint">Gerechten worden geladen...</p>}
        <div className="dishes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
          {dishes.map((d, i) => (
            <div key={i} className={`dish-card ${d.cityId}`} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{d.image}</div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{d.name}</h4>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, lineHeight: 1.3 }}>{d.description}</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>{d.flag} {d.cityId.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────
interface DashboardProps { 
  userName: string; 
  userCity: string;
  wotd: { lang: string; word: string; translation: string; useCase: string }[]; 
  facts: { cityId: string; flag: string; city: string; fact: string }[];
  dishes: Dish[];
}
function DashboardTab({ userName, userCity, wotd, facts, dishes }: DashboardProps) {
  const { kudos, addKudo } = useKudos();
  const [showForm, setShowForm] = useState(false);
  const [newKudo, setNewKudo] = useState({ to: '', message: '' });
  const [isTranslating, setIsTranslating] = useState(false);

  const send = async () => {
    if (!newKudo.to.trim() || !newKudo.message.trim()) return;
    setIsTranslating(true);
    const trans = await getFullTranslation(newKudo.message);
    await addKudo({
      from: userName, fromCity: userCity, to: newKudo.to,
      message: newKudo.message, translation: trans.nl + ' / ' + trans.pt,
      emoji: '🙌', time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
    });
    setNewKudo({ to: '', message: '' }); setShowForm(false); setIsTranslating(false);
  };

  return (
    <div className="dashboard-grid">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <CitiesHub />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CulturalFact facts={facts} />
          <div className="glass-panel">
            <div className="panel-header"><MessageSquare className="panel-icon" size={22} /><h2>Phrase</h2></div>
            <div className="wotd-container" style={{ padding: '0.5rem' }}>
              {wotd.slice(0, 2).map((item, idx) => (
                <div key={idx} className="wotd-card" style={{ marginBottom: '0.5rem' }}>
                  <div className={`lang-badge ${item.lang.toLowerCase()}-badge`}>{item.lang}</div>
                  <div className="wotd-content">
                    <h3 style={{ fontSize: '1rem' }}>"{item.word}"</h3>
                    <div className="wotd-translation" style={{ fontSize: '0.8rem' }}>{item.translation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <LocalFlavors dishes={dishes} />
      </div>
      <div className="glass-panel kudos-panel">
        <div className="panel-header">
          <Heart size={22} color="var(--accent)" fill="var(--accent)" /><h2>Squad Kudos</h2>
          <button className="btn-icon-sm" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={16} /> : <Send size={16} />}</button>
        </div>
        {showForm && (
          <div className="kudo-form">
            <input className="kudo-input" placeholder="Naar wie? (bijv. Ananya – Chennai)" value={newKudo.to} onChange={e => setNewKudo({ ...newKudo, to: e.target.value })} />
            <textarea className="kudo-input kudo-textarea" placeholder="Schrijf in jouw eigen taal 🌐" value={newKudo.message} onChange={e => setNewKudo({ ...newKudo, message: e.target.value })} />
            <button className="btn-kudos" onClick={send} disabled={isTranslating}>
              {isTranslating ? 'Vertalen...' : <><Send size={16} /> Verstuur en Vertaal</>}
            </button>
          </div>
        )}
        <div className="kudos-feed">
          {kudos.length === 0 && <div className="empty-state">Nog geen kudos. Stuur de eerste! 🚀</div>}
          {kudos.map(k => (
            <div key={k.id} className="kudo-item">
              <div className="kudo-header"><span className="kudo-author">{k.emoji} {k.from}</span><span className="kudo-to">→ {k.to}</span></div>
              <div className="kudo-city-label" style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem' }}>{k.fromCity} · {k.time}</div>
              <div className="kudo-message">{k.message}</div>
              <div className="kudo-translation"><Globe size={12} /> {k.translation}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Connect Tab (Roulette + Presence)
// ─────────────────────────────────────────
interface ConnectProps { 
  userName: string; 
  userCityId: string; 
  icebreakers: string[]; 
  onPostToWall: (content: string, emoji: string) => void 
}
function ConnectTab({ userName, userCityId, icebreakers, onPostToWall }: ConnectProps) {
  const [userId] = useState(() => {
    let id = localStorage.getItem('dupoind_userId');
    if (!id) { id = Math.random().toString(36).substr(2, 9); localStorage.setItem('dupoind_userId', id); }
    return id;
  });
  const { squad, setStatus } = usePresence();
  const [available, setAvailable] = useState(false);
  const [mood, setMood] = useState(MOODS[0]);
  const [spinning, setSpinning] = useState(false);
  const [crew, setCrew] = useState<{name: string, cityId: string}[]>([]);
  const [icebreaker, setIcebreaker] = useState('');
  const [done, setDone] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answered, setAnswered] = useState(false);

  const updatePresence = useCallback(async (avail: boolean, m: string) => {
    const status: UserStatus = { name: userName, city: getCityName(userCityId), cityId: userCityId, available: avail, mood: m, lastSeen: new Date().toISOString() };
    await setStatus(userId, status);
  }, [userId, userName, userCityId, setStatus]);

  useEffect(() => {
    if (available) updatePresence(available, mood);
  }, [available, mood, updatePresence]);

  const toggleAvailable = async () => {
    const next = !available; setAvailable(next);
    await updatePresence(next, mood);
  };

  const spin = useCallback(async () => {
    setSpinning(true); setDone(false); setCrew([]); setIcebreaker(''); setAnswer(''); setAnswered(false);
    
    try {
      const res = await fetch('https://randomuser.me/api/?results=2&nat=nl,pt,in');
      const data = await res.json();
      const randoms = data.results.map((r: any) => ({
        name: r.name.first,
        cityId: r.location.country === 'Netherlands' ? 'utrecht' : r.location.country === 'Portugal' ? 'lisbon' : 'chennai'
      }));
      
      setTimeout(() => {
        setCrew([{ name: 'Jij', cityId: userCityId }, ...randoms]);
        const iceList = icebreakers.length > 0 ? icebreakers : ['Wat is je favoriete lokale lunch? 🥪'];
        setIcebreaker(iceList[Math.floor(Math.random() * iceList.length)]);
        setSpinning(false); setDone(true);
      }, 2000);
    } catch {
      setSpinning(false);
    }
  }, [userCityId, icebreakers]);

  const postAnswer = async () => {
    if (!answer.trim()) return;
    await onPostToWall(`🎲 Roulette-antwoord: "${answer}"`, '🎲');
    setAnswered(true);
  };

  const availableSquad = squad.filter(s => s.available && s.id !== userId);

  return (
    <div className="connect-container">
      <div className="glass-panel">
        <div className="panel-header"><Zap className="panel-icon" size={22} /><h2>Jouw Status</h2></div>
        <div className="presence-controls">
          <button className={`availability-btn ${available ? 'available' : ''}`} onClick={toggleAvailable}>
            <span className={`presence-dot ${available ? 'green' : 'grey'}`} />
            {available ? 'Beschikbaar voor een chat 🟢' : 'Niet beschikbaar ⚫'}
          </button>
          {available && (
            <div className="mood-picker">
              <span className="mood-label">Hoe voel je je?</span>
              <div className="mood-options">
                {MOODS.map(m => (
                  <button key={m} className={`mood-btn ${mood === m ? 'active' : ''}`} onClick={() => setMood(m)}>{m}</button>
                ))}
              </div>
            </div>
          )}
        </div>
        {availableSquad.length > 0 && (
          <div className="available-squad">
            <div className="available-label">🟢 Nu beschikbaar</div>
            <div className="available-list">
              {availableSquad.map(s => (
                <div key={s.id} className={`available-member ${s.cityId}`}>
                  <span className="presence-dot green" />
                  <span className="av-name">{s.name}</span>
                  <span className="av-city">{getCityFlag(s.cityId)} {s.city}</span>
                  <span className="av-mood">{s.mood}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel roulette-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header"><Shuffle className="panel-icon" size={22} /><h2>Squad Roulette</h2></div>
        <p className="roulette-desc">Verbind willekeurig 3 collega's uit de drie locaties voor een leuke culturele uitwisseling!</p>
        <div style={{ textAlign: 'center' }}>
          <button className={`btn-spin ${spinning ? 'spinning' : ''}`} onClick={spin} disabled={spinning}>
            <Shuffle size={20} /> {spinning ? 'Verbinden...' : 'Draai de Roulette!'}
          </button>
        </div>
        {done && crew.length > 0 && (
          <div className="roulette-result">
            <h3>☕ Jouw Culture Crew</h3>
            <div className="squad-cards">
              {crew.map((m, i) => (
                <div key={i} className={`squad-member-card ${m.cityId}`}>
                  <div className={`squad-avatar ${m.cityId}`}>{m.name[0]}</div>
                  <div className="squad-name">{m.name}</div>
                  <div className="squad-city">{getCityFlag(m.cityId)} {getCityName(m.cityId)}</div>
                </div>
              ))}
            </div>
            <div className="icebreaker-box">
              <div className="icebreaker-label">💬 Icebreaker van vandaag</div>
              <div className="icebreaker-text">"{icebreaker}"</div>
            </div>
            {!answered ? (
              <div className="answer-box">
                <p className="answer-label">✍️ Schrijf jouw antwoord — wordt gepost op de Culture Wall!</p>
                <textarea className="kudo-input kudo-textarea" placeholder="Jouw antwoord..." value={answer} onChange={e => setAnswer(e.target.value)} />
                <button className="btn-kudos" onClick={postAnswer}><Image size={16} /> Post op Culture Wall</button>
              </div>
            ) : (
              <div className="answered-confirm"><Check size={20} /><span>Gepost via Firestore! 🌍</span></div>
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
function CultureWallTab({ userName, userCityId }: { userName: string; userCityId: string }) {
  const { posts, addPost, toggleLike } = useWallPosts();
  const [newPost, setNewPost] = useState('');
  const [newEmoji, setNewEmoji] = useState('📸');
  const [isTranslating, setIsTranslating] = useState(false);
  const [expandedTranslations, setExpandedTranslations] = useState<Set<string>>(new Set());

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsTranslating(true);
    const translations = await getFullTranslation(newPost);
    
    await addPost({
      author: userName, city: getCityName(userCityId), cityId: userCityId,
      content: newPost, emoji: newEmoji,
      time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      translations,
    });
    setNewPost(''); setIsTranslating(false);
  };

  const toggleTrans = (id: string) => {
    setExpandedTranslations(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  return (
    <div className="wall-container">
      <div className="glass-panel">
        <div className="panel-header"><Camera className="panel-icon" size={22} /><h2>Culture Wall</h2><span className="translate-badge">🌐 API Live</span></div>
        <div className="new-post-form">
          <div className="post-form-row">
            <select className="auth-input auth-select" style={{ width: 'auto' }} value={newEmoji} onChange={e => setNewEmoji(e.target.value)}>
              {['📸','☕','🍕','🎉','💻','🌅','🏙️','🎊','🌶️','🥐','🧀','🎶','🏏','🐘','⛵'].map(e => <option key={e}>{e}</option>)}
            </select>
            <textarea className="kudo-input kudo-textarea" style={{ flex: 1 }} placeholder="Deel een moment — schrijf in jouw eigen taal! 🌐" value={newPost} onChange={e => setNewPost(e.target.value)} />
          </div>
          <button className="btn-kudos" onClick={handlePost} disabled={isTranslating}>
            {isTranslating ? 'Echte vertaling bezig...' : <><Image size={16} /> Post &amp; Vertaal naar alle talen</>}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {posts.map(post => {
          const liked = Array.isArray(post.likes) && post.likes.includes(userName);
          return (
            <div key={post.id} className={`wall-post ${post.cityId}`}>
              <div className="wall-post-header">
                <div className="wall-author-info">
                  <div className={`squad-avatar ${post.cityId}`} style={{ width: 36, height: 36, fontSize: '.85rem' }}>{post.author[0]}</div>
                  <div><div className="wall-author">{post.author}</div><div className="wall-location">{getCityFlag(post.cityId)} {post.city} · {post.time}</div></div>
                </div>
                <span style={{ fontSize: '2rem' }}>{post.emoji}</span>
              </div>
              <div className="wall-content">{post.content}</div>
              {expandedTranslations.has(post.id) && post.translations && (
                <div className="translation-block">
                  <div className="trans-line">{post.translations.nl}</div>
                  <div className="trans-line">{post.translations.pt}</div>
                  <div className="trans-line">{post.translations.ta}</div>
                </div>
              )}
              <div className="wall-actions">
                <button className={`like-btn ${liked ? 'liked' : ''}`} onClick={() => toggleLike(post.id, userName, liked)}>
                  <Heart size={16} fill={liked ? 'var(--accent)' : 'none'} color={liked ? 'var(--accent)' : 'var(--text-muted)'} />
                  {Array.isArray(post.likes) ? post.likes.length : 0}
                </button>
                <button className="translate-btn" onClick={() => toggleTrans(post.id)}>
                  <Globe size={14} /> {expandedTranslations.has(post.id) ? 'Verberg' : 'Vertaal (Live API)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Seed Button (Helper)
// ─────────────────────────────────────────
function SeedHelper({ onSeed }: { onSeed: () => void }) {
  return (
    <div style={{ padding: '0.5rem', opacity: 0.3, position: 'fixed', bottom: 0, right: 0 }}>
      <button className="btn-icon-sm" onClick={onSeed} title="Seed database met initiële data"><Database size={12} /></button>
    </div>
  );
}

// ─────────────────────────────────────────
// Main App
// ─────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<{ name: string; city: string } | null>(() => {
    const saved = sessionStorage.getItem('dupoind_user');
    return saved ? JSON.parse(saved) as { name: string; city: string } : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { facts, wotd, icebreakers, dishes, seed } = useCultureData();
  const { questions: quizQuestions } = useQuiz();

  const handleLogin = (name: string, city: string) => {
    const u = { name, city }; setUser(u);
    sessionStorage.setItem('dupoind_user', JSON.stringify(u));
  };

  const handleSeed = async () => {
    if (!confirm('Dit voegt standaard data toe aan Firestore. Doorgaan?')) return;
    const initialFacts = [
      { cityId: 'utrecht', flag: '🇳🇱', city: 'Utrecht', fact: 'Utrecht heeft de grootste fietsenstalling ter wereld! 🚲' },
      { cityId: 'lisbon', flag: '🇵🇹', city: 'Lisbon', fact: 'Lissabon is ouder dan Rome. 🏛️' },
      { cityId: 'chennai', flag: '🇮🇳', city: 'Chennai', fact: 'Chennai is de "Detroit van Zuid-Azië" door de auto-industrie. 🚗' }
    ];
    const initialWotd = [
      { lang: 'NL', word: 'Gezellig', translation: 'Cozy atmosphere', useCase: '"Echt gezellig!"' },
      { lang: 'PT', word: 'Saudade', translation: 'Deep longing', useCase: '"Saudade de Lisbon."' }
    ];
    const initialIce = ['Wat is je favoriete vakantiebestemming?', 'Bier of Wijn?', 'Koffie of Thee?'];
    const initialCodes = ['DUPOIND', 'UTRECHT', 'LISBON1', 'CHENNAI'];
    const initialDishes: Dish[] = [
      { cityId: 'utrecht', name: 'Stamppot', description: 'Traditioneel Hollands prakkie.', image: '🍲', flag: '🇳🇱' },
      { cityId: 'lisbon', name: 'Pastel de Nata', description: 'Heerlijk bladerdeeggebakje met room.', image: '🧁', flag: '🇵🇹' },
      { cityId: 'chennai', name: 'Masala Dosa', description: 'Knapperige rijstpannenkoek met aardappel.', image: '🌯', flag: '🇮🇳' }
    ];
    const initialPolls = INITIAL_POLLS.map(p => ({ ...p, createdAt: new Date().toISOString() }));
    
    await seed({ 
      facts: initialFacts, wotd: initialWotd, icebreakers: initialIce, 
      squadCodes: initialCodes, dishes: initialDishes, quiz: QUIZ_QUESTIONS 
    });

    // Also seed initial polls if needed
    const { addDoc, collection } = await import('firebase/firestore');
    const { db } = await import('./firebase');
    for (const poll of initialPolls) {
      await addDoc(collection(db, 'polls'), poll);
    }

    alert('Database gevuld! Ververs de app.');
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;
  const cityId = user.city.toLowerCase();

  const postToWall = async (content: string, emoji: string) => {
    const trans = await getFullTranslation(content);
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const { db: firestore } = await import('./firebase');
    await addDoc(collection(firestore, 'wallPosts'), {
      author: user.name, city: user.city, cityId, content, emoji, likes: [],
      time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      translations: trans, createdAt: serverTimestamp(),
    });
    setActiveTab('wall');
  };

  return (
    <div className="app-container">
      <header>
        <div className="logo-container"><div className="logo-icon"><Globe color="white" size={22} /></div><div className="logo-text">DUPO<span>IND</span></div></div>
        <nav className="tab-nav">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Home size={18} /> <span className="tab-label">Dashboard</span></button>
          <button className={`tab-btn ${activeTab === 'connect' ? 'active' : ''}`} onClick={() => setActiveTab('connect')}><Shuffle size={18} /> <span className="tab-label">Connect</span></button>
          <button className={`tab-btn ${activeTab === 'wall' ? 'active' : ''}`} onClick={() => setActiveTab('wall')}><LayoutGrid size={18} /> <span className="tab-label">Wall</span></button>
          <button className={`tab-btn ${activeTab === 'polls' ? 'active' : ''}`} onClick={() => setActiveTab('polls')}><BarChart2 size={18} /> <span className="tab-label">Polls</span></button>
          <button className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}><Trophy size={18} /> <span className="tab-label">Quiz</span></button>
        </nav>
        <div className="user-profile"><span>{getCityFlag(cityId)}</span><div className={`avatar ${cityId}`}>{user.name[0]}</div><span style={{ fontSize: '0.9rem' }} className="user-name-label">{user.name}</span></div>
      </header>
      <main>
        {activeTab === 'dashboard' && <DashboardTab userName={user.name} userCity={user.city} facts={facts} wotd={wotd} dishes={dishes} />}
        {activeTab === 'connect' && <ConnectTab userName={user.name} userCityId={cityId} icebreakers={icebreakers} onPostToWall={postToWall} />}
        {activeTab === 'wall' && <CultureWallTab userName={user.name} userCityId={cityId} />}
        {activeTab === 'polls' && <PollsTab userName={user.name} userCityId={cityId} />}
        {activeTab === 'quiz' && <QuizTab questions={quizQuestions} />}
      </main>
      <SeedHelper onSeed={handleSeed} />
    </div>
  );
}
