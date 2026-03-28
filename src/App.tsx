import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe, Heart, MessageSquare, Send,
  Shuffle, Camera, Home, LayoutGrid, Lock, ArrowRight, X, Check,
  Lightbulb, Image, BarChart2, Zap, Trophy, Utensils
} from 'lucide-react';
import './index.css';

import { useWallPosts, useKudos, usePresence, useCultureData, useSquadCodes, useQuiz, useGlobalChat } from './hooks/useFirestore';
import { useWeather } from './hooks/useWeather';
import { useAutomatedCulture } from './hooks/useAutomatedCulture';
import type { Holiday, DayCycle, CityFact, MealInspiration, RadioStation } from './hooks/useAutomatedCulture';
import { useTranslation } from './hooks/useTranslation';
import type { Lang } from './hooks/useTranslation';
import { useAdminAuth } from './hooks/useAdminAuth';
import { getFullTranslation } from './utils/translate';
import type { UserStatus, Dish } from './types';
import { QUIZ_QUESTIONS, INITIAL_POLLS, MOODS } from './data';

import { PollsTab } from './components/PollsTab';
import { QuizTab } from './components/QuizTab';
import { GlobalChat } from './components/GlobalChat';
import { IdeasTab } from './components/IdeasTab';
import { useLivingApp } from './hooks/useLivingApp';
import { SystemDashboard } from './components/SystemDashboard';

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
type Tab = 'dashboard' | 'connect' | 'wall' | 'quiz' | 'polls' | 'chat' | 'ideas';

const CITIES = [
  { id: 'utrecht', name: 'Utrecht', flag: '🇳🇱', timezone: 'Europe/Amsterdam' },
  { id: 'lisbon',  name: 'Lisbon',  flag: '🇵🇹', timezone: 'Europe/Lisbon' },
  { id: 'chennai', name: 'Chennai', flag: '🇮🇳', timezone: 'Asia/Kolkata' },
];

function getCityFlag(cityId: string) { return CITIES.find(c => c.id === cityId)?.flag ?? '🌍'; }
function getCityName(cityId: string) { return CITIES.find(c => c.id === cityId)?.name ?? cityId; }

// ─────────────────────────────────────────
// Auth Screen
// ─────────────────────────────────────────
function AuthScreen({ onLogin, setLang, t, adminAuth }: { 
  onLogin: (name: string, city: string) => void, 
  setLang: (l: Lang) => void,
  t: (k: string) => string,
  adminAuth: ReturnType<typeof useAdminAuth>
}) {
  const { codes, loading: codesLoading } = useSquadCodes();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('Utrecht');
  const [step, setStep] = useState<'code' | 'profile' | 'admin'>('code');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  // Admin fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // IP Detection for Smart Language & Location
  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_code === 'NL') { setLang('NL'); setCity('Utrecht'); }
        else if (data.country_code === 'PT') { setLang('PT'); setCity('Lisbon'); }
        else if (data.country_code === 'IN') { setLang('TA'); setCity('Chennai'); }
        else { setLang('EN'); }
      } catch {
        console.warn('IP Detection failed, using defaults.');
      }
    };
    detect();
  }, [setLang]);

  const checkCode = () => {
    const input = code.trim().toUpperCase();
    if (codes.includes(input)) { 
      setStep('profile');
      setError('');
    } else {
      setError(t('invalid_code') || 'Ongeldige code.');
      setShake(true); setTimeout(() => setShake(false), 500);
    }
  };
  const handleAdminLogin = async () => {
    try {
      setError('');
      await adminAuth.login(adminEmail, adminPass);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError('Admin login mislukt: ' + msg);
    }
  };

  return (
    <div className={`auth-container ${shake ? 'shake' : ''}`}>
      <div className="auth-card glass-panel">
        <div className="auth-logo">
          <div className="logo-icon-large"><Globe color="white" size={40} /></div>
          <h1 className="auth-title">DUPO<span>IND</span></h1>
          <p className="auth-subtitle">Utrecht · Lisbon · Chennai</p>
        </div>

        {step === 'admin' ? (
          <div className="auth-form">
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1rem' }}>Admin Access</h2>
            <div className="auth-field">
              <label>Email</label>
              <input className="auth-input" type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
            </div>
            <div className="auth-field">
              <label>Password</label>
              <input className="auth-input" type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            </div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-auth" onClick={handleAdminLogin}>Admin Login</button>
            <button className="btn-text" onClick={() => setStep('code')} style={{ marginTop: '1rem', width: '100%', fontSize: '0.8rem', opacity: 0.6 }}>Back</button>
          </div>
        ) : step === 'code' ? (
          <div className="auth-form">
            <div className="auth-field">
              <label><Lock size={14} /> {t('squad_code')}</label>
              <input className="auth-input" type="text" placeholder={t('squad_code_placeholder')} value={code}
                onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkCode()} />
              {error && <p className="auth-error">{error}</p>}
            </div>
            <p className="auth-hint">{t('squad_hint')}</p>
            <button className="btn-auth" onClick={checkCode} disabled={codesLoading}>
              {codesLoading ? t('loading') : t('continue')} <ArrowRight size={18} />
            </button>
            <button className="btn-text" onClick={() => setStep('admin')} style={{ marginTop: '1.5rem', width: '100%', fontSize: '0.7rem', opacity: 0.4 }}>Admin? Klik hier</button>
          </div>
        ) : (
          <div className="auth-form">
            <div className="auth-field"><label>{t('name')}</label>
              <input className="auth-input" type="text" placeholder={t('name_placeholder')} value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="auth-field"><label>{t('location')}</label>
              <select className="auth-input auth-select" value={city} onChange={e => setCity(e.target.value)}>
                <option value="Utrecht">Utrecht</option>
                <option value="Lisbon">Lisbon</option>
                <option value="Chennai">Chennai</option>
              </select></div>
            <button className="btn-auth" onClick={() => name.trim() && onLogin(name.trim(), city)} disabled={!name.trim()}>
              {t('join')} <Check size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Admin Dashboard
// ─────────────────────────────────────────
function AdminDashboard({ onSeed, onLogout, codes }: { onSeed: () => void, onLogout: () => void, codes: string[] }) {
  const [newCode, setNewCode] = useState('');
  const { addCode, removeCode } = useSquadCodes();

  return (
    <div className="app-container" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>🛡️ Admin Dashboard</h2>
          <button className="btn-auth" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem' }} onClick={onLogout}>Logout</button>
        </div>

        <div style={{ marginBottom: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px' }}>
          <h3>🚀 Database Initialization</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Initializes standard culture data in Firestore.</p>
          <button className="btn-auth" style={{ background: 'var(--accent)' }} onClick={onSeed}>Seed Database Now</button>
        </div>

        <div>
          <h3>🔑 Manage Squad Codes</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input className="auth-input" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="New code..." />
            <button className="btn-auth" style={{ width: 'auto' }} onClick={() => { if(newCode) { addCode(newCode.toUpperCase()); setNewCode(''); } }}>Add</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
            {codes.map(c => (
              <div key={c} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{c}</span>
                <button onClick={() => removeCode(c)} style={{ border: 'none', background: 'none', color: '#ff4b4b', cursor: 'pointer' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Cities Hub (real weather + holidays + sun)
// ─────────────────────────────────────────
function CitiesHub({ holidays, dayCycles, t }: { holidays: Record<string, Holiday | null>, dayCycles: Record<string, DayCycle | null>, t: (k: string, obj?: Record<string, string | number>) => string }) {
  const [times, setTimes] = useState<Record<string, string>>({});
  const weather = useWeather();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tObjs: Record<string, string> = {};
      CITIES.forEach(c => { tObjs[c.id] = now.toLocaleTimeString('nl-NL', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); });
      setTimes(tObjs);
    };
    update(); const iv = setInterval(update, 1000); return () => clearInterval(iv);
  }, []);

  return (
    <div className="glass-panel">
      <div className="panel-header"><Globe className="panel-icon" size={22} /><h2>{t('squad_hubs')}</h2><span className="live-badge">{t('live_weather')}</span></div>
      <div className="cities-container">
        {CITIES.map(city => {
          const w = weather[city.id];
          const h = holidays[city.id];
          const d = dayCycles[city.id];
          
          let holidayText = '';
          if (h) {
            const hDate = new Date(h.date);
            const now = new Date();
            const diff = Math.ceil((hDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            holidayText = diff === 0 ? t('today') : t('in_days').replace('{n}', diff.toString());
          }

          return (
            <div key={city.id} className={`city-card ${city.id} ${d?.status || ''}`}>
              <div className="city-header">
                <span>{city.flag} {city.name}</span>
                <span className="sun-status">
                  {d?.status === 'night' ? '🌙' : d?.status === 'twilight' ? '🌅' : '☀️'}
                </span>
              </div>
              <div className="time-display">{times[city.id] || '--:--:--'}</div>
              <div className="city-meta">
                <span className="meta-item">
                  {w?.loading ? '⏳' : `${w?.emoji} ${w?.temp}°C – ${w?.desc}`}
                </span>
                {h && <span className="city-holiday">🎉 {h.localName} ({holidayText})</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Squad Radio Widget
// ─────────────────────────────────────────
function SquadRadio({ radios, t }: { radios: Record<string, RadioStation | null>, t: (k: string) => string }) {
  return (
    <div className="glass-panel" style={{ marginTop: '1rem' }}>
      <div className="panel-header"><Zap className="panel-icon" size={22} /><h2>{t('radio')}</h2></div>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem' }}>
        {CITIES.map(city => {
          const r = radios[city.id];
          if (!r) return null;
          return (
            <a key={city.id} href={r.url} target="_blank" rel="noreferrer" className={`radio-card ${city.id}`} 
               style={{ flex: '1', minWidth: '120px', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              {r.favicon ? <img src={r.favicon} alt="" style={{ width: 32, height: 32, borderRadius: '4px' }} /> : <div style={{ fontSize: '1.5rem' }}>📻</div>}
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textAlign: 'center', color: 'white' }}>{r.name}</div>
              <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{city.flag} {city.name}</div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
/* Replaced CulturalFact following the api approach */
// ─────────────────────────────────────────
function CulturalFact({ facts, userCityId, t }: { facts: Record<string, CityFact | null>, userCityId: string, t: (k: string) => string }) {
  const fact = facts[userCityId];
  const cityName = getCityName(userCityId);

  return (
    <div className={`glass-panel cultural-fact-panel ${userCityId}`}>
      <div className="panel-header"><Lightbulb className="panel-icon" size={22} /><h2>{t('fact')}: {cityName}</h2><span className="fact-city-badge">Live API</span></div>
      {fact ? (
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          {fact.thumbnail && <img src={fact.thumbnail.source} alt="" style={{ width: 60, height: 60, borderRadius: '8px', objectFit: 'cover' }} />}
          <div style={{ flex: 1 }}>
            <blockquote className="fact-text" style={{ fontSize: '0.85rem', margin: 0 }}>"{fact.extract}"</blockquote>
            {fact.content_urls && <a href={fact.content_urls.desktop.page} target="_blank" rel="noreferrer" style={{ fontSize: '0.7rem', color: 'var(--accent)', textDecoration: 'none', marginTop: '0.5rem', display: 'inline-block' }}>Lees meer op Wikipedia →</a>}
          </div>
        </div>
      ) : (
        <p className="auth-hint">Laden van lokale geschiedenis...</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Local Flavors (featuring Global Inspiration)
// ─────────────────────────────────────────
function LocalFlavors({ meal, t }: { meal: MealInspiration | null, t: (k: string) => string }) {
  return (
    <div className="glass-panel">
      <div className="panel-header"><Utensils className="panel-icon" size={22} /><h2>{t('inspiration')}</h2><span className="live-badge">TheMealDB API</span></div>
      {meal ? (
        <div className="meal-insp-card" style={{ display: 'flex', gap: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1rem', overflow: 'hidden' }}>
          <img src={meal.strMealThumb} alt={meal.strMeal} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{meal.strMeal}</h3>
            <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem' }}>Vandaag een culinair uitstapje! Wat dacht je van dit heerlijke gerecht?</p>
            <a href={meal.strSource || '#'} target="_blank" rel="noreferrer" className="btn-auth" style={{ padding: '0.5rem 1rem', width: 'fit-content', fontSize: '0.8rem' }}>
              <Utensils size={14} /> Bekijk Recept
            </a>
          </div>
        </div>
      ) : (
        <p className="auth-hint">Vandaag even geen inspiratie... (Laden)</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Dashboard Tab
// ─────────────────────────────────────────
interface DashboardProps { 
  userName: string; 
  userCity: string;
  userCityId: string;
  wotd: { lang: string; word: string; translation: string; useCase: string }[]; 
  autoCulture: ReturnType<typeof useAutomatedCulture>;
  t: (k: string) => string;
}
function DashboardTab({ userName, userCity, userCityId, wotd, autoCulture, t }: DashboardProps) {
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
        <CitiesHub holidays={autoCulture.holidays} dayCycles={autoCulture.dayCycles} t={t} />
        <SquadRadio radios={autoCulture.radios} t={t} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <CulturalFact facts={autoCulture.facts} userCityId={userCityId} t={t} />
          <div className="glass-panel">
            <div className="panel-header"><MessageSquare className="panel-icon" size={22} /><h2>{t('phrase')}</h2></div>
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
        <LocalFlavors meal={autoCulture.meal} t={t} />
        <SystemDashboard />
      </div>
      <div className="glass-panel kudos-panel">
        <div className="panel-header">
          <Heart size={22} color="var(--accent)" fill="var(--accent)" /><h2>{t('kudos')}</h2>
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
  onPostToWall: (content: string, emoji: string) => void;
  t: (k: string) => string;
  squad: UserStatus[];
  setStatus: (userId: string, status: UserStatus) => Promise<void>;
}
function ConnectTab({ userName, userCityId, icebreakers, onPostToWall, t, squad, setStatus }: ConnectProps) {
  const [userId] = useState(() => {
    let id = localStorage.getItem('dupoind_userId');
    if (!id) { id = Math.random().toString(36).substr(2, 9); localStorage.setItem('dupoind_userId', id); }
    return id;
  });
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
    
    // Use real presence data instead of external API
    setTimeout(() => {
      const others = squad.filter(s => s.name !== userName);
      // Pick 2 random users from the squad (or fewer if not enough)
      const shuffled = [...others].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2);
      
      setCrew([{ name: 'Jij (You)', cityId: userCityId }, ...selected.map(s => ({ name: s.name, cityId: s.cityId }))]);
      const iceList = icebreakers.length > 0 ? icebreakers : ['Wat is je favoriete lokale lunch? 🥪'];
      setIcebreaker(iceList[Math.floor(Math.random() * iceList.length)]);
      setSpinning(false); setDone(true);
    }, 1500);
  }, [userName, userCityId, icebreakers, squad]);

  const postAnswer = async () => {
    if (!answer.trim()) return;
    await onPostToWall(`🎲 Roulette-antwoord: "${answer}"`, '🎲');
    setAnswered(true);
  };

  const availableSquad = squad.filter(s => s.available && s.id !== userId);

  return (
    <div className="connect-container">
      <div className="glass-panel">
        <div className="panel-header"><Zap className="panel-icon" size={22} /><h2>{t('status')}</h2></div>
        <div className="presence-controls">
          <button className={`availability-btn ${available ? 'available' : ''}`} onClick={toggleAvailable}>
            <span className={`presence-dot ${available ? 'green' : 'grey'}`} />
            {available ? `${t('available')} 🟢` : `${t('unavailable')} ⚫`}
          </button>
          {available && (
            <div className="mood-picker">
              <span className="mood-label">{t('status_prompt')}</span>
              <div className="mood-options">
                {['😄','😊','😐','🫠','🔥','🎉'].map(m => (
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
        <div className="panel-header"><Shuffle className="panel-icon" size={22} /><h2>{t('roulette')}</h2></div>
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
function CultureWallTab({ userName, userCityId, t }: { userName: string; userCityId: string, t: (k: string) => string }) {
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
        <div className="panel-header"><Camera className="panel-icon" size={22} /><h2>{t('wall')}</h2><span className="translate-badge">🌐 API Live</span></div>
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
                  <Globe size={14} /> {expandedTranslations.has(post.id) ? t('hide') : t('translate')}
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
// Main App
// ─────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<{ name: string; city: string } | null>(() => {
    const saved = sessionStorage.getItem('dupoind_user');
    return saved ? JSON.parse(saved) as { name: string; city: string } : null;
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { codes } = useSquadCodes();
  const { questions: quizQuestions } = useQuiz();
  const { wotd, icebreakers, seed } = useCultureData();
  const autoCulture = useAutomatedCulture();
  const { lang, setLang, t } = useTranslation();
  const adminAuth = useAdminAuth();
  const { squad, setStatus } = usePresence();
  const { sendMsg } = useGlobalChat();

  // Initialize the Living App Brain
  useLivingApp();
  
  // Self-Feeding Alert System: Auto-post holidays/stats to the Wall & Chat
  const hasPostedHoliday = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    Object.entries(autoCulture.holidays).forEach(async ([city, holiday]) => {
      if (holiday && !hasPostedHoliday.current.has(holiday.date + city)) {
        hasPostedHoliday.current.add(holiday.date + city);
        
        const hDate = new Date(holiday.date);
        const diff = Math.ceil((hDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const timing = diff === 0 ? t('today') : t('in_days').replace('{n}', diff.toString());
        
        const content = `📢 AUTO-ALERT: ${holiday.localName} (${timing}) in ${city.charAt(0).toUpperCase() + city.slice(1)}! 🎉`;
        const trans = await getFullTranslation(content, 'nl'); 
        
        await sendMsg('DUPOIND Assistant', content, 'NL');

        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db: firestore } = await import('./firebase');
        await addDoc(collection(firestore, 'wallPosts'), {
          author: 'DUPOIND Assistant', city: 'System', cityId: 'system',
          content, emoji: '🎉', likes: [],
          time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          translations: trans, createdAt: serverTimestamp(),
        });
      }
    });
  }, [autoCulture.holidays, user, t, sendMsg]);

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

  if (adminAuth.adminUser) return <AdminDashboard onSeed={handleSeed} onLogout={adminAuth.logout} codes={codes} />;

  return (
    <>
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
        <div className="aurora-blob blob-3"></div>
      </div>
      
      {!user ? (
        <AuthScreen onLogin={handleLogin} setLang={setLang} t={t} adminAuth={adminAuth} />
      ) : (() => {
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
            <nav className="tab-nav desktop-only">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><Home size={18} /> <span className="tab-label">{t('dashboard')}</span></button>
          <button className={`tab-btn ${activeTab === 'connect' ? 'active' : ''}`} onClick={() => setActiveTab('connect')}><Shuffle size={18} /> <span className="tab-label">{t('connect')}</span></button>
          <button className={`tab-btn ${activeTab === 'wall' ? 'active' : ''}`} onClick={() => setActiveTab('wall')}><LayoutGrid size={18} /> <span className="tab-label">{t('wall')}</span></button>
          <button className={`tab-btn ${activeTab === 'polls' ? 'active' : ''}`} onClick={() => setActiveTab('polls')}><BarChart2 size={18} /> <span className="tab-label">{t('polls')}</span></button>
          <button className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}><Trophy size={18} /> <span className="tab-label">{t('quiz')}</span></button>
          <button className={`tab-btn ${activeTab === 'ideas' ? 'active' : ''}`} onClick={() => setActiveTab('ideas')}><Lightbulb size={18} /> <span className="tab-label">{t('ideas')}</span></button>
          <button className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}><MessageSquare size={18} /> <span className="tab-label">{t('global_chat')}</span></button>
        </nav>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select className="lang-select" value={lang} onChange={e => setLang(e.target.value as Lang)}>
            <option value="EN">🇺🇸 EN</option>
            <option value="NL">🇳🇱 NL</option>
            <option value="PT">🇵🇹 PT</option>
            <option value="TA">🇮🇳 TA</option>
          </select>
          <div className="user-profile">
            <span>{getCityFlag(cityId)}</span>
            {/* Premium Mood Glow Implementation */}
            {(() => {
              const myPresence = squad.find(s => s.name === user.name);
              const moodGlow = myPresence?.mood === '🔥' ? 'glow-fire' : 
                               myPresence?.mood === '😊' ? 'glow-gold' : 
                               myPresence?.mood === '🫠' ? 'glow-chill' : '';
              return (
                <div className={`avatar ${cityId} ${moodGlow}`} title={myPresence?.mood || 'Vibe'}>
                  {user.name[0]}
                </div>
              );
            })()}
            <span style={{ fontSize: '0.9rem' }} className="user-name-label">{user.name}</span>
          </div>
        </div>
      </header>
      <main>
        {activeTab === 'dashboard' && <DashboardTab userName={user.name} userCity={user.city} userCityId={cityId} wotd={wotd} autoCulture={autoCulture} t={t} />}
        {activeTab === 'connect' && <ConnectTab userName={user.name} userCityId={cityId} icebreakers={icebreakers} onPostToWall={postToWall} t={t} squad={squad} setStatus={setStatus} />}
        {activeTab === 'wall' && <CultureWallTab userName={user.name} userCityId={cityId} t={t} />}
        {activeTab === 'polls' && <PollsTab userName={user.name} userCityId={cityId} />}
        {activeTab === 'quiz' && <QuizTab questions={quizQuestions} userName={user.name} userCityId={cityId} />}
        {activeTab === 'ideas' && <IdeasTab userName={user.name} userCityId={cityId} />}
        {activeTab === 'chat' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <GlobalChat userName={user.name} />
          </div>
        )}
      </main>

      <nav className="mobile-bottom-nav">
        <button className={`nav-item-mobile ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Home className="nav-icon" size={20} />
          <span>Home</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'connect' ? 'active' : ''}`} onClick={() => setActiveTab('connect')}>
          <Shuffle className="nav-icon" size={20} />
          <span>Connect</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'wall' ? 'active' : ''}`} onClick={() => setActiveTab('wall')}>
          <Camera className="nav-icon" size={20} />
          <span>Wall</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare className="nav-icon" size={20} />
          <span>Chat</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>
          <Trophy className="nav-icon" size={20} />
          <span>Quiz</span>
        </button>
      </nav>
          </div>
        );
      })()}
    </>
  );
}
