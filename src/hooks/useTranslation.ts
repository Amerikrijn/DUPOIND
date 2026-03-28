import { useState, useEffect, useCallback } from 'react';

export type Lang = 'NL' | 'EN' | 'PT' | 'TA';

const DICTIONARY: Record<Lang, Record<string, string>> = {
  NL: {
    dashboard: 'Dashboard',
    connect: 'Connectie',
    wall: 'Culture Wall',
    polls: 'Peilingen',
    quiz: 'Quiz',
    welcome: 'Welkom bij DUPOIND',
    squad_hubs: 'Squad Hubs',
    live_weather: '🌤️ Live weer & Events',
    phrase: 'Zin van de dag',
    fact: 'Wiki Weetje',
    inspiration: 'Global Inspiratie',
    radio: 'Squad Radio (Live)',
    kudos: 'Squad Kudos',
    status: 'Jouw Status',
    available: 'Beschikbaar voor een chat',
    unavailable: 'Niet beschikbaar',
    roulette: 'Squad Roulette',
    join: 'Join DUPOIND',
    name: 'Jouw naam',
    location: 'Jouw locatie',
    squad_code: 'Squad Code',
    continue: 'Doorgaan',
    loading: 'Laden...',
  },
  EN: {
    dashboard: 'Dashboard',
    connect: 'Connect',
    wall: 'Culture Wall',
    polls: 'Polls',
    quiz: 'Quiz',
    welcome: 'Welcome to DUPOIND',
    squad_hubs: 'Squad Hubs',
    live_weather: '🌤️ Live weather & Events',
    phrase: 'Phrase of the Day',
    fact: 'Wiki Fact',
    inspiration: 'Global Inspiration',
    radio: 'Squad Radio (Live)',
    kudos: 'Squad Kudos',
    status: 'Your Status',
    available: 'Available to chat',
    unavailable: 'Unavailable',
    roulette: 'Squad Roulette',
    join: 'Join DUPOIND',
    name: 'Your name',
    location: 'Your location',
    squad_code: 'Squad Code',
    continue: 'Continue',
    loading: 'Loading...',
  },
  PT: {
    dashboard: 'Painel',
    connect: 'Conectar',
    wall: 'Parede Cultural',
    polls: 'Enquetes',
    quiz: 'Quiz',
    welcome: 'Bem-vindo ao DUPOIND',
    squad_hubs: 'Hubs de Squad',
    live_weather: '🌤️ Clima e Eventos',
    phrase: 'Frase do Dia',
    fact: 'Fato Wiki',
    inspiration: 'Inspiração Global',
    radio: 'Rádio Squad (Ao vivo)',
    kudos: 'Elogios Squad',
    status: 'Seu Status',
    available: 'Disponível para chat',
    unavailable: 'Indisponível',
    roulette: 'Roleta Squad',
    join: 'Entrar no DUPOIND',
    name: 'Seu nome',
    location: 'Sua localização',
    squad_code: 'Código da Squad',
    continue: 'Continuar',
    loading: 'Carregando...',
  },
  TA: {
    dashboard: 'டாஷ்போர்டு',
    connect: 'இணைப்பு',
    wall: 'கலாச்சார சுவர்',
    polls: 'கருத்துக்கணிப்புகள்',
    quiz: 'வினாடி வினா',
    welcome: 'DUPOIND-க்கு வரவேற்கிறோம்',
    squad_hubs: 'குழு மையங்கள்',
    live_weather: '🌤️ தற்போதைய வானிலை',
    phrase: 'இன்றைய சொற்றொடர்',
    fact: 'விக்கி தகவல்',
    inspiration: 'உலகளாவிய உந்துதல்',
    radio: 'குழு வானொலி',
    kudos: 'குழு பாராட்டுக்கள்',
    status: 'உங்கள் நிலை',
    available: 'பேசத் தயார்',
    unavailable: 'கிடைக்கவில்லை',
    roulette: 'குழு ரவுலட்',
    join: 'DUPOIND-ல் சேருங்கள்',
    name: 'உங்கள் பெயர்',
    location: 'உங்கள் இருப்பிடம்',
    squad_code: 'குழு குறியீடு',
    continue: 'தொடரவும்',
    loading: 'ஏற்றப்படுகிறது...',
  }
};

export function useTranslation() {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('dupoind_lang');
    if (saved) return saved as Lang;
    
    const browserLang = navigator.language.split('-')[0].toUpperCase();
    if (browserLang === 'NL') return 'NL';
    if (browserLang === 'PT') return 'PT';
    return 'EN';
  });

  useEffect(() => {
    localStorage.setItem('dupoind_lang', lang);
  }, [lang]);

  const t = useCallback((key: string) => {
    return DICTIONARY[lang][key] || key;
  }, [lang]);

  return { lang, setLang, t };
}
