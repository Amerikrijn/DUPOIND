import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  Globe, Heart, MessageSquare, Send, MessageCircle,
  Shuffle, Camera, Home, LayoutGrid, Lock, ArrowRight, X, Check,
  Lightbulb, Image, Zap, Trophy
} from 'lucide-react';
import './index.css';

import { useWallPosts, useKudos, usePresence, useCultureData, useSquadCodes, useGlobalChat, useMyPresenceDoc } from './hooks/useFirestore';
import { useQuizPool } from './hooks/useQuizPool';
import { useWeather } from './hooks/useWeather';
import { useAutomatedCulture } from './hooks/useAutomatedCulture';
import type { Holiday, DayCycle, RadioStation, CityFact, MealInspiration } from './hooks/useAutomatedCulture';
import type { OnThisDayHighlight } from './services/wikipediaOnThisDay';
import { useTranslation } from './hooks/useTranslation';
import type { Lang } from './hooks/useTranslation';
import { useAdminAuth } from './hooks/useAdminAuth';
import { getFullTranslation, translateText, uiLangToTarget } from './utils/translate';
import { UpdateAvailableBanner } from './components/UpdateAvailableBanner';
import type { UserStatus, Dish } from './types';
import { QUIZ_QUESTIONS, getMoods, seedDefaults } from './data';
import { getHubConfig, getCityById } from './config/appConfig';

import { QuizTab } from './components/QuizTab';
import { GlobalChat } from './components/GlobalChat';
import { IdeasTab } from './components/IdeasTab';
import { useLivingApp } from './hooks/useLivingApp';

// ─────────────────────────────────────────
// Constants & Helpers (Lazy/Safe)
// ─────────────────────────────────────────
type Tab = 'dashboard' | 'connect' | 'wall' | 'quiz' | 'chat' | 'ideas';

function getHubCities() {
  const cfg = getHubConfig();
  return (cfg.cities || []).map((c) => ({
    id: c.id,
    name: c.displayName,
    flag: c.flag,
    timezone: c.timezone,
  }));
}

function getCityFlag(cityId: string) {
  return getCityById(cityId)?.flag ?? '🌍';
}
function getCityName(cityId: string) {
  return getCityById(cityId)?.displayName ?? cityId;
}

const HOLIDAY_POSTED_LS = 'dupoind_posted_holidays_v1';
/** Name + hub city — localStorage so users stay signed in after refresh/new tab (not sessionStorage). */
const USER_PROFILE_LS = 'dupoind_user';

function loadPersistedUserProfile(): { name: string; city: string } | null {
  try {
    const fromLs = localStorage.getItem(USER_PROFILE_LS);
    if (fromLs) return JSON.parse(fromLs) as { name: string; city: string };
    const fromSs = sessionStorage.getItem(USER_PROFILE_LS);
    if (fromSs) {
      localStorage.setItem(USER_PROFILE_LS, fromSs);
      sessionStorage.removeItem(USER_PROFILE_LS);
      return JSON.parse(fromSs) as { name: string; city: string };
    }
  } catch {
    /* ignore corrupt */
  }
  return null;
}

function readPostedHolidayKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(HOLIDAY_POSTED_LS);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writePostedHolidayKeys(keys: Set<string>) {
  try {
    localStorage.setItem(HOLIDAY_POSTED_LS, JSON.stringify([...keys]));
  } catch {
    /* ignore quota */
  }
}

// ─────────────────────────────────────────
// Auth Screen
// ─────────────────────────────────────────
function AuthScreen({ onLogin, setLang, t, adminAuth }: { 
  onLogin: (name: string, city: string) => void, 
  setLang: (l: Lang) => void,
  t: (k: string) => string,
  adminAuth: ReturnType<typeof useAdminAuth>
}) {
  const hub = getHubConfig();
  const namePrefix = hub.appName.slice(0, hub.appName.length - hub.appNameAccentPart.length);
  const { codes, loading: codesLoading } = useSquadCodes();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState(hub.cities[0]?.displayName ?? '');
  const [step, setStep] = useState<'code' | 'profile' | 'admin'>('code');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  // Admin fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // IP Detection for Smart Language & Location
  useEffect(() => {
    const detect = async () => {
      const hub = getHubConfig();
      try {
        const res = await fetch(hub.ipDetectionUrl);
        const data = await res.json();
        const cc = data.country_code as string;
        const cityId = hub.ipCountryToDefaultCity[cc as keyof typeof hub.ipCountryToDefaultCity];
        if (cityId) {
          const c = getCityById(cityId);
          if (c) setCity(c.displayName);
        }
        const langPick = hub.ipCountryToLang[cc as keyof typeof hub.ipCountryToLang];
        if (langPick) setLang(langPick as Lang);
        else setLang('EN');
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
          <h1 className="auth-title">{namePrefix}<span>{hub.appNameAccentPart}</span></h1>
          <p className="auth-subtitle">{hub.tagline}</p>
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
                {hub.cities.map((c) => (
                  <option key={c.id} value={c.displayName}>{c.displayName}</option>
                ))}
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
function CitiesHub({
  holidays,
  dayCycles,
  t,
  compact = false,
}: {
  holidays: Record<string, Holiday | null>;
  dayCycles: Record<string, DayCycle | null>;
  t: (k: string, obj?: Record<string, string | number>) => string;
  compact?: boolean;
}) {
  const [times, setTimes] = useState<Record<string, string>>({});
  const weather = useWeather();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tObjs: Record<string, string> = {};
      getHubCities().forEach((c) => {
        tObjs[c.id] = compact
          ? now.toLocaleTimeString('nl-NL', {
              timeZone: c.timezone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            })
          : now.toLocaleTimeString('nl-NL', {
              timeZone: c.timezone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            });
      });
      setTimes(tObjs);
    };
    update(); const iv = setInterval(update, 1000); return () => clearInterval(iv);
  }, [compact]);

  return (
    <div className={`glass-panel ${compact ? 'cities-hub--compact' : ''}`}>
      <div className="panel-header">
        <Globe className="panel-icon" size={compact ? 18 : 22} />
        <h2>{t('squad_hubs')}</h2>
        <span className="live-badge">{t('live_weather')}</span>
      </div>
      <div className={`cities-container ${compact ? 'cities-container--compact' : ''}`}>
        {getHubCities().map(city => {
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
    <div className="glass-panel squad-radio-panel" style={{ marginTop: '1rem' }}>
      <div className="panel-header squad-radio-header">
        <Zap className="panel-icon" size={22} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2>{t('radio')}</h2>
          <p className="squad-radio-hint">{t('radio_rotates')}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0.5rem' }}>
        {getHubCities().map(city => {
          const r = radios[city.id];
          if (!r) return null;
          return (
            <a key={`${city.id}-${r.url}`} href={r.url} target="_blank" rel="noreferrer" className={`radio-card ${city.id}`} 
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
// Dashboard Tab (“Vandaag” — mobile-first daily culture)
// ─────────────────────────────────────────
interface DashboardProps { 
  userName: string; 
  userCity: string;
  userCityId: string;
  wotd: { lang: string; word: string; translation: string; useCase: string }[]; 
  icebreakers: string[];
  autoCulture: ReturnType<typeof useAutomatedCulture>;
  t: (k: string, params?: Record<string, string | number>) => string;
  lang: Lang;
}

function resolveTodayHero(
  daySlot: number,
  ontd: OnThisDayHighlight | null,
  meal: MealInspiration | null,
  phrase: { word: string; translation: string } | undefined,
  fact: CityFact | null | undefined,
  t: (k: string, params?: Record<string, string | number>) => string,
  wikipediaLinkLabel: string,
): { heroSlot: number; heroContent: ReactNode } {
  const tryCalendar = () =>
    ontd ? (
      <>
        <p className="today-readable">{ontd.text}</p>
        <a className="today-link" href={ontd.url} target="_blank" rel="noreferrer">
          {wikipediaLinkLabel}
        </a>
      </>
    ) : null;
  const tryFood = () =>
    meal ? (
      <div className="today-meal-row">
        {meal.strMealThumb && (
          <img src={meal.strMealThumb} alt="" className="today-meal-thumb" />
        )}
        <div>
          <p className="today-meal-title">{meal.strMeal}</p>
          <a className="today-link" href={meal.strSource || '#'} target="_blank" rel="noreferrer">
            {t('inspiration')} →
          </a>
        </div>
      </div>
    ) : null;
  const tryPhrase = () =>
    phrase ? (
      <div>
        <p className="today-readable today-phrase-word">“{phrase.word}”</p>
        <p className="today-muted">{phrase.translation}</p>
      </div>
    ) : null;
  const tryCity = () =>
    fact ? (
      <div className="today-meal-row">
        {fact.thumbnail && (
          <img src={fact.thumbnail.source} alt="" className="today-meal-thumb" />
        )}
        <div>
          <p className="today-readable" style={{ marginBottom: '0.5rem' }}>
            {fact.extract}
          </p>
          {fact.content_urls && (
            <a className="today-link" href={fact.content_urls.desktop.page} target="_blank" rel="noreferrer">
              {wikipediaLinkLabel}
            </a>
          )}
        </div>
      </div>
    ) : null;

  const order = [tryCalendar, tryFood, tryPhrase, tryCity];
  const primary = order[daySlot]();
  if (primary) return { heroSlot: daySlot, heroContent: primary };
  for (let i = 0; i < 4; i++) {
    if (i === daySlot) continue;
    const alt = order[i]();
    if (alt) return { heroSlot: i, heroContent: alt };
  }
  return { heroSlot: daySlot, heroContent: <p className="auth-hint">{t('loading')}</p> };
}

function DashboardTab({ userName, userCity, userCityId, wotd, icebreakers, autoCulture, t, lang }: DashboardProps) {
  const { kudos, addKudo } = useKudos();
  const [showForm, setShowForm] = useState(false);
  const [newKudo, setNewKudo] = useState({ to: '', message: '' });
  const [isTranslating, setIsTranslating] = useState(false);

  const daySlot = useMemo(() => {
    const d = new Date();
    return (d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate()) % 4;
  }, []);

  const ontd = autoCulture.onThisDay;
  const meal = autoCulture.meal;
  const targetLang = uiLangToTarget(lang);

  const ontdFetchId = `${ontd?.text ?? ''}|${targetLang}`;
  const mealFetchId = `${meal?.strMeal ?? ''}|${targetLang}`;

  const [onThisDayResult, setOnThisDayResult] = useState<{ id: string; text: string } | null>(null);
  const [mealTitleResult, setMealTitleResult] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (!ontd?.text || targetLang === 'en') return;
    let cancelled = false;
    const id = ontdFetchId;
    void translateText(ontd.text, targetLang, 'en').then((x) => {
      if (!cancelled) setOnThisDayResult({ id, text: x });
    });
    return () => {
      cancelled = true;
    };
  }, [ontd?.text, targetLang, ontdFetchId]);

  useEffect(() => {
    if (!meal?.strMeal || targetLang === 'en') return;
    let cancelled = false;
    const id = mealFetchId;
    void translateText(meal.strMeal, targetLang, 'en').then((x) => {
      if (!cancelled) setMealTitleResult({ id, text: x });
    });
    return () => {
      cancelled = true;
    };
  }, [meal?.strMeal, targetLang, mealFetchId]);

  const onThisDayLine = !ontd?.text
    ? undefined
    : targetLang === 'en'
      ? ontd.text
      : onThisDayResult?.id === ontdFetchId
        ? onThisDayResult.text
        : ontd.text;

  const mealTitleLine = !meal?.strMeal
    ? undefined
    : targetLang === 'en'
      ? meal.strMeal
      : mealTitleResult?.id === mealFetchId
        ? mealTitleResult.text
        : meal.strMeal;

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

  const fact = autoCulture.facts[userCityId];
  const phrase = wotd[0];

  const ontdForHero = ontd ? { ...ontd, text: onThisDayLine ?? ontd.text } : null;
  const mealForHero = meal ? { ...meal, strMeal: mealTitleLine ?? meal.strMeal } : null;

  const slotTitles = [t('today_slot_calendar'), t('today_slot_food'), t('today_slot_phrase'), t('today_slot_city')];
  const { heroSlot, heroContent } = resolveTodayHero(
    daySlot,
    ontdForHero,
    mealForHero,
    phrase,
    fact,
    t,
    t('wikipedia_link'),
  );

  const todayTalkPrompt = useMemo(() => {
    const extras = [t('today_talk_extra_1'), t('today_talk_extra_2'), t('today_talk_extra_3')];
    const merged = [...new Set([...icebreakers, t('icebreaker_default'), ...extras])];
    const d = new Date();
    const dayKey = d.getUTCFullYear() * 400 + (d.getUTCMonth() + 1) * 40 + d.getUTCDate();
    return merged[dayKey % merged.length] ?? t('icebreaker_default');
  }, [icebreakers, t]);

  return (
    <div className="today-page">
      <section className="today-hero glass-panel" aria-labelledby="today-heading">
        <p className="today-date-line">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 id="today-heading" className="today-hero-title">
          {t('today_tab')}
        </h1>
        <p className="today-tagline">{t('today_tagline')}</p>
        <div className="today-primary-label">{slotTitles[heroSlot]}</div>
        <div className="today-primary-body">{heroContent}</div>
      </section>

      <section className="today-talk-starter glass-panel" aria-labelledby="today-talk-heading">
        <div className="today-talk-head">
          <MessageCircle className="today-talk-icon" size={22} aria-hidden />
          <div>
            <h2 id="today-talk-heading" className="today-talk-title">{t('today_talk_title')}</h2>
            <p className="today-talk-sub">{t('today_talk_sub')}</p>
          </div>
        </div>
        <p className="today-talk-prompt">“{todayTalkPrompt}”</p>
      </section>

      <CitiesHub holidays={autoCulture.holidays} dayCycles={autoCulture.dayCycles} t={t} compact />

      <SquadRadio radios={autoCulture.radios} t={t} />

      <div className="glass-panel kudos-panel today-kudos">
        <div className="panel-header">
          <Heart size={22} color="var(--accent)" fill="var(--accent)" /><h2>{t('kudos')}</h2>
          <button type="button" className="btn-icon-sm" onClick={() => setShowForm(!showForm)}>{showForm ? <X size={16} /> : <Send size={16} />}</button>
        </div>
        {showForm && (
          <div className="kudo-form">
            <input className="kudo-input" placeholder={t('kudo_placeholder_to')} value={newKudo.to} onChange={e => setNewKudo({ ...newKudo, to: e.target.value })} />
            <textarea className="kudo-input kudo-textarea" placeholder={t('kudo_placeholder_message')} value={newKudo.message} onChange={e => setNewKudo({ ...newKudo, message: e.target.value })} />
            <button type="button" className="btn-kudos" onClick={send} disabled={isTranslating}>
              {isTranslating ? t('kudo_translating') : <><Send size={16} /> {t('kudo_submit_btn')}</>}
            </button>
          </div>
        )}
        <div className="kudos-feed kudos-feed--today">
          {kudos.length === 0 && <div className="empty-state">{t('empty_kudos')}</div>}
          {kudos.map(k => (
            <div key={k.id} className="kudo-item">
              <div className="kudo-header"><span className="kudo-author">{k.emoji} {k.from}</span><span className="kudo-to">{t('kudo_to_arrow', { to: k.to })}</span></div>
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
  const moods = getMoods();
  const [userId] = useState(() => {
    let id = localStorage.getItem('dupoind_userId');
    if (!id) { id = Math.random().toString(36).substr(2, 9); localStorage.setItem('dupoind_userId', id); }
    return id;
  });
  const [available, setAvailable] = useState(false);
  const [mood, setMood] = useState(moods[0] ?? '😄');
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
    void updatePresence(available, mood);
  }, [available, mood, updatePresence]);

  const toggleAvailable = async () => {
    const next = !available; setAvailable(next);
    await updatePresence(next, mood);
  };

  const iceList = useMemo(
    () => (icebreakers.length > 0 ? icebreakers : [t('icebreaker_default')]),
    [icebreakers, t]
  );

  const spin = async () => {
    setSpinning(true); setDone(false); setCrew([]); setIcebreaker(''); setAnswer(''); setAnswered(false);

    setTimeout(() => {
      const others = squad.filter(s => s.name !== userName);
      const shuffled = [...others].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 2);

      setCrew([{ name: t('roulette_you_self'), cityId: userCityId }, ...selected.map(s => ({ name: s.name, cityId: s.cityId }))]);
      setIcebreaker(iceList[Math.floor(Math.random() * iceList.length)]);
      setSpinning(false); setDone(true);
    }, 1500);
  };

  const postAnswer = async () => {
    if (!answer.trim()) return;
    await onPostToWall(`${t('roulette_wall_prefix')} "${answer}"`, '🎲');
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
          <div className="mood-picker">
            <span className="mood-label">{t('status_prompt')}</span>
            <div className="mood-options">
              {moods.map((m) => (
                <button key={m} type="button" className={`mood-btn ${mood === m ? 'active' : ''}`} onClick={() => setMood(m)}>{m}</button>
              ))}
            </div>
          </div>
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
        <p className="roulette-desc">{t('roulette_desc')}</p>
        <div style={{ textAlign: 'center' }}>
          <button className={`btn-spin ${spinning ? 'spinning' : ''}`} onClick={spin} disabled={spinning}>
            <Shuffle size={20} /> {spinning ? t('roulette_connecting') : t('roulette_spin')}
          </button>
        </div>
        {done && crew.length > 0 && (
          <div className="roulette-result">
            <h3>☕ {t('roulette_crew_title')}</h3>
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
              <div className="icebreaker-label">💬 {t('icebreaker_today_label')}</div>
              <div className="icebreaker-text">"{icebreaker}"</div>
            </div>
            {!answered ? (
              <div className="answer-box">
                <p className="answer-label">✍️ {t('roulette_answer_label')}</p>
                <textarea className="kudo-input kudo-textarea" placeholder={t('roulette_answer_placeholder')} value={answer} onChange={e => setAnswer(e.target.value)} />
                <button className="btn-kudos" onClick={postAnswer}><Image size={16} /> {t('roulette_post_wall')}</button>
              </div>
            ) : (
              <div className="answered-confirm"><Check size={20} /><span>{t('roulette_posted_confirm')}</span></div>
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
function CultureWallTab({
  userName,
  userCityId,
  t,
}: {
  userName: string;
  userCityId: string;
  t: (k: string, params?: Record<string, string | number>) => string;
}) {
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
        <div className="panel-header"><Camera className="panel-icon" size={22} /><h2>{t('wall')}</h2><span className="translate-badge">{t('wall_api_badge')}</span></div>
        <div className="new-post-form">
          <div className="post-form-row">
            <select className="auth-input auth-select" style={{ width: 'auto' }} value={newEmoji} onChange={e => setNewEmoji(e.target.value)}>
              {['📸','☕','🍕','🎉','💻','🌅','🏙️','🎊','🌶️','🥐','🧀','🎶','🏏','🐘','⛵'].map(e => <option key={e}>{e}</option>)}
            </select>
            <textarea className="kudo-input kudo-textarea" style={{ flex: 1 }} placeholder={t('wall_share_placeholder')} value={newPost} onChange={e => setNewPost(e.target.value)} />
          </div>
          <button className="btn-kudos" onClick={handlePost} disabled={isTranslating}>
            {isTranslating ? t('wall_post_translating') : <><Image size={16} /> {t('wall_post_button')}</>}
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
  const [user, setUser] = useState<{ name: string; city: string } | null>(() => loadPersistedUserProfile());
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { codes } = useSquadCodes();
  const { questions: quizQuestions, loading: quizPoolLoading } = useQuizPool();
  const { wotd, icebreakers, seed } = useCultureData();
  const { lang, setLang, t } = useTranslation();
  const autoCulture = useAutomatedCulture();
  const adminAuth = useAdminAuth();
  const { squad, setStatus } = usePresence();
  const { sendMsg } = useGlobalChat();
  const myPresenceDoc = useMyPresenceDoc(!!user, activeTab);

  useEffect(() => {
    const html = document.documentElement;
    const langMap: Record<Lang, string> = { EN: 'en', NL: 'nl', PT: 'pt', TA: 'ta' };
    html.lang = langMap[lang] ?? 'en';
    html.dir = 'ltr';
    html.classList.remove('lang-en', 'lang-nl', 'lang-pt', 'lang-ta');
    html.classList.add(`lang-${lang.toLowerCase()}` as 'lang-en' | 'lang-nl' | 'lang-pt' | 'lang-ta');
  }, [lang]);

  // Initialize the Living App Brain
  useLivingApp();
  
  // Self-Feeding Alert System: Auto-post holidays (once per holiday/city, persisted; varied copy)
  useEffect(() => {
    if (!user) return;
    const assistant = getHubConfig().systemAssistantName;
    const tplKeys = ['holiday_alert_a', 'holiday_alert_b', 'holiday_alert_c'] as const;
    const wallEmojis = ['🎉', '🎊', '🥳', '✨', '🌟'];
    let cancelled = false;
    void (async () => {
      const posted = readPostedHolidayKeys();
      for (const [city, holiday] of Object.entries(autoCulture.holidays)) {
        if (!holiday || cancelled) continue;
        const key = `${holiday.date}_${city}`;
        if (posted.has(key)) continue;

        const hDate = new Date(holiday.date);
        const diff = Math.ceil((hDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (diff < -1 || diff > 45) continue;

        const cityLabel = getCityById(city)?.displayName ?? city;
        const timing = diff === 0 ? t('today') : t('in_days', { n: String(diff) });
        const variant =
          (city.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0) + (holiday.date?.length ?? 0)) %
          tplKeys.length;
        const tpl = tplKeys[variant];
        const content = t(tpl, {
          name: holiday.localName,
          when: timing,
          city: cityLabel,
        });
        const trans = await getFullTranslation(content, lang.toLowerCase());

        await sendMsg(assistant, content, lang);

        const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
        const { db: firestore } = await import('./firebase');
        await addDoc(collection(firestore, 'wallPosts'), {
          author: assistant,
          city: 'System',
          cityId: 'system',
          content,
          emoji: wallEmojis[variant % wallEmojis.length],
          likes: [],
          time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
          translations: trans,
          createdAt: serverTimestamp(),
        });

        posted.add(key);
        writePostedHolidayKeys(posted);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoCulture.holidays, user, t, sendMsg, lang]);

  const handleLogin = (name: string, city: string) => {
    const u = { name, city };
    setUser(u);
    try {
      localStorage.setItem(USER_PROFILE_LS, JSON.stringify(u));
    } catch {
      /* quota / private mode */
    }
  };

  const handleSeed = async () => {
    if (!confirm('Dit voegt standaard data toe aan Firestore. Doorgaan?')) return;

    await seed({
      facts: seedDefaults.seedFacts,
      wotd: seedDefaults.seedWotd,
      icebreakers: seedDefaults.seedIcebreakers,
      squadCodes: seedDefaults.seedSquadCodes,
      dishes: seedDefaults.seedDishes as Dish[],
      quiz: QUIZ_QUESTIONS,
    });

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
        const hb = getHubConfig();
        const logoPrefix = hb.appName.slice(0, hb.appName.length - hb.appNameAccentPart.length);
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
          <div className="app-layout-root">
          <div className="app-body-scroll">
          <header className="app-header-bar">
            <div className="logo-container"><div className="logo-icon"><Globe color="white" size={22} /></div><div className="logo-text">{logoPrefix}<span>{hb.appNameAccentPart}</span></div></div>
            <nav className="tab-nav desktop-only" aria-label="Main">
          <button type="button" className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} title={t('today_tab')} onClick={() => setActiveTab('dashboard')}><Home size={18} aria-hidden /> <span className="tab-label">{t('today_tab')}</span></button>
          <button type="button" className={`tab-btn ${activeTab === 'connect' ? 'active' : ''}`} title={t('connect')} onClick={() => setActiveTab('connect')}><Shuffle size={18} aria-hidden /> <span className="tab-label">{t('connect')}</span></button>
          <button type="button" className={`tab-btn ${activeTab === 'wall' ? 'active' : ''}`} title={t('wall')} onClick={() => setActiveTab('wall')}><LayoutGrid size={18} aria-hidden /> <span className="tab-label">{t('wall')}</span></button>
          <button type="button" className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`} title={t('quiz')} onClick={() => setActiveTab('quiz')}><Trophy size={18} aria-hidden /> <span className="tab-label">{t('quiz')}</span></button>
          <button type="button" className={`tab-btn ${activeTab === 'ideas' ? 'active' : ''}`} title={t('ideas')} onClick={() => setActiveTab('ideas')}><Lightbulb size={18} aria-hidden /> <span className="tab-label">{t('ideas')}</span></button>
          <button type="button" className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`} title={t('global_chat')} onClick={() => setActiveTab('chat')}><MessageSquare size={18} aria-hidden /> <span className="tab-label">{t('global_chat')}</span></button>
        </nav>
        <div className="header-actions">
          <select className="lang-select" value={lang} onChange={e => setLang(e.target.value as Lang)} aria-label="Language">
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
              const mood =
                myPresence?.mood ??
                (myPresenceDoc?.name === user.name ? myPresenceDoc.mood : undefined);
              const moodGlow =
                mood === '🔥' ? 'glow-fire' :
                mood === '😊' ? 'glow-gold' :
                mood === '🫠' ? 'glow-chill' : '';
              return (
                <div className={`avatar ${cityId} ${moodGlow}`} title={mood || 'Vibe'}>
                  {user.name[0]}
                </div>
              );
            })()}
            <span className="user-name-label">{user.name}</span>
          </div>
        </div>
      </header>
      <UpdateAvailableBanner lang={lang} />
      <div className={`app-main-scroll ${activeTab === 'chat' ? 'app-main-scroll--chat' : ''}`}>
        <main className={activeTab === 'chat' ? 'app-main-inner app-main-inner--chat' : 'app-main-inner'} lang={lang === 'TA' ? 'ta' : lang === 'NL' ? 'nl' : lang === 'PT' ? 'pt' : 'en'}>
          {activeTab === 'dashboard' && (
            <DashboardTab
              userName={user.name}
              userCity={user.city}
              userCityId={cityId}
              wotd={wotd}
              icebreakers={icebreakers}
              autoCulture={autoCulture}
              t={t}
              lang={lang}
            />
          )}
          {activeTab === 'connect' && (
            <ConnectTab
              userName={user.name}
              userCityId={cityId}
              icebreakers={icebreakers}
              onPostToWall={postToWall}
              t={t}
              squad={squad}
              setStatus={setStatus}
            />
          )}
          {activeTab === 'wall' && <CultureWallTab userName={user.name} userCityId={cityId} t={t} />}
          {activeTab === 'quiz' && (
            <QuizTab
              questions={quizQuestions}
              loading={quizPoolLoading}
              userName={user.name}
              userCityId={cityId}
            />
          )}
          {activeTab === 'ideas' && <IdeasTab userName={user.name} userCityId={cityId} />}
          {activeTab === 'chat' && <GlobalChat userName={user.name} />}
        </main>
      </div>
          </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile">
        <button type="button" className={`nav-item-mobile ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <Home className="nav-icon" size={20} />
          <span>{t('today_tab')}</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'connect' ? 'active' : ''}`} onClick={() => setActiveTab('connect')}>
          <Shuffle className="nav-icon" size={20} />
          <span>{t('connect')}</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'wall' ? 'active' : ''}`} onClick={() => setActiveTab('wall')}>
          <Camera className="nav-icon" size={20} />
          <span>{t('wall')}</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
          <MessageSquare className="nav-icon" size={20} />
          <span>{t('global_chat')}</span>
        </button>
        <button className={`nav-item-mobile ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>
          <Trophy className="nav-icon" size={20} />
          <span>{t('quiz')}</span>
        </button>
      </nav>
          </div>
        );
      })()}
    </>
  );
}
