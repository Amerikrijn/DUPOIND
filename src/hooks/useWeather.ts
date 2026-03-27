import { useState, useEffect } from 'react';

export type WeatherData = {
  temp: number;
  weatherCode: number;
  loading: boolean;
};

// WMO Weather Code to description + emoji
function describeWeather(code: number): { desc: string; emoji: string } {
  if (code === 0) return { desc: 'Helder', emoji: '☀️' };
  if (code <= 3) return { desc: 'Bewolkt', emoji: '⛅' };
  if (code <= 49) return { desc: 'Mistig', emoji: '🌫️' };
  if (code <= 67) return { desc: 'Regen', emoji: '🌧️' };
  if (code <= 77) return { desc: 'Sneeuw', emoji: '❄️' };
  if (code <= 82) return { desc: 'Buien', emoji: '🌦️' };
  return { desc: 'Storm', emoji: '⛈️' };
}

const COORDS: Record<string, { lat: number; lon: number }> = {
  utrecht: { lat: 52.09, lon: 5.12 },
  lisbon:  { lat: 38.72, lon: -9.14 },
  chennai: { lat: 13.08, lon: 80.27 },
};

export function useWeather() {
  const [weather, setWeather] = useState<Record<string, WeatherData & { desc: string; emoji: string }>>({
    utrecht: { temp: 0, weatherCode: 0, loading: true, desc: '...', emoji: '⏳' },
    lisbon:  { temp: 0, weatherCode: 0, loading: true, desc: '...', emoji: '⏳' },
    chennai: { temp: 0, weatherCode: 0, loading: true, desc: '...', emoji: '⏳' },
  });

  useEffect(() => {
    Object.entries(COORDS).forEach(async ([city, { lat, lon }]) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json() as { current: { temperature_2m: number; weather_code: number } };
        const { desc, emoji } = describeWeather(data.current.weather_code);
        setWeather(prev => ({
          ...prev,
          [city]: { temp: Math.round(data.current.temperature_2m), weatherCode: data.current.weather_code, loading: false, desc, emoji },
        }));
      } catch {
        setWeather(prev => ({ ...prev, [city]: { ...prev[city], loading: false, desc: 'N/a', emoji: '❓' } }));
      }
    });
  }, []);

  return weather;
}
