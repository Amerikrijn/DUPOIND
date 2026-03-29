import { useState, useEffect } from 'react';
import { getHubConfig } from '../config/appConfig';

export type WeatherData = {
  temp: number;
  weatherCode: number;
  loading: boolean;
};

function describeWeather(code: number): { desc: string; emoji: string } {
  if (code === 0) return { desc: 'Helder', emoji: '☀️' };
  if (code <= 3) return { desc: 'Bewolkt', emoji: '⛅' };
  if (code <= 49) return { desc: 'Mistig', emoji: '🌫️' };
  if (code <= 67) return { desc: 'Regen', emoji: '🌧️' };
  if (code <= 77) return { desc: 'Sneeuw', emoji: '❄️' };
  if (code <= 82) return { desc: 'Buien', emoji: '🌦️' };
  return { desc: 'Storm', emoji: '⛈️' };
}

export function useWeather() {
  const initial: Record<string, WeatherData & { desc: string; emoji: string }> = {};
  for (const c of getHubConfig().cities) {
    initial[c.id] = { temp: 0, weatherCode: 0, loading: true, desc: '...', emoji: '⏳' };
  }

  const [weather, setWeather] = useState(initial);

  useEffect(() => {
    const cities = getHubConfig().cities;
    cities.forEach((city) => {
      const lat = city.lat;
      const lon = city.lng;
      void (async () => {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
          const res = await fetch(url);
          const data = (await res.json()) as {
            current: { temperature_2m: number; weather_code: number };
          };
          const { desc, emoji } = describeWeather(data.current.weather_code);
          setWeather((prev) => ({
            ...prev,
            [city.id]: {
              temp: Math.round(data.current.temperature_2m),
              weatherCode: data.current.weather_code,
              loading: false,
              desc,
              emoji,
            },
          }));
        } catch {
          setWeather((prev) => ({
            ...prev,
            [city.id]: {
              ...prev[city.id],
              loading: false,
              desc: 'N/a',
              emoji: '❓',
            },
          }));
        }
      })();
    });
  }, []);

  return weather;
}
