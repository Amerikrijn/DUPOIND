import { useState, useEffect } from 'react';

export interface Holiday {
  date: string;
  localName: string;
  name: string;
}

export interface CityFact {
  title: string;
  extract: string;
  thumbnail?: { source: string };
  content_urls?: { desktop: { page: string } };
}

export interface MealInspiration {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
  strSource: string;
}

export interface DayCycle {
  sunrise: string;
  sunset: string;
  status: 'day' | 'night' | 'twilight';
}

export interface RadioStation {
  name: string;
  url: string;
  favicon: string;
}

const CITY_DETAILS: Record<string, { country: string; countryCode: string; lat: number; lng: number }> = {
  utrecht: { country: 'Netherlands', countryCode: 'NL', lat: 52.09, lng: 5.12 },
  lisbon:  { country: 'Portugal', countryCode: 'PT', lat: 38.72, lng: -9.14 },
  chennai: { country: 'India', countryCode: 'IN', lat: 13.08, lng: 80.27 },
};

export function useAutomatedCulture() {
  const [holidays, setHolidays] = useState<Record<string, Holiday | null>>({});
  const [facts, setFacts] = useState<Record<string, CityFact | null>>({});
  const [meal, setMeal] = useState<MealInspiration | null>(null);
  const [dayCycles, setDayCycles] = useState<Record<string, DayCycle | null>>({});
  const [radios, setRadios] = useState<Record<string, RadioStation | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // 1. Holidays (Next public holiday for each country)
      Object.entries(CITY_DETAILS).forEach(async ([city, details]) => {
        try {
          const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${details.countryCode}`);
          const data = await res.json();
          if (data && data.length > 0) {
            setHolidays(prev => ({ ...prev, [city]: data[0] }));
          }
        } catch (e) { console.error(`Holiday fetch failed for ${city}`, e); }
      });

      // 2. City Facts (Wikipedia Summary)
      Object.entries(CITY_DETAILS).forEach(async ([city]) => {
        try {
          // Capitalize first letter for Wikipedia
          const name = city.charAt(0).toUpperCase() + city.slice(1);
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${name}`);
          const data = await res.json();
          setFacts(prev => ({ ...prev, [city]: data }));
        } catch (e) { console.error(`Fact fetch failed for ${city}`, e); }
      });

      // 3. Day Cycles (Sunrise/Sunset)
      Object.entries(CITY_DETAILS).forEach(async ([city, details]) => {
        try {
          const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${details.lat}&lng=${details.lng}&formatted=0`);
          const { results } = await res.json();
          const now = new Date();
          const sunrise = new Date(results.sunrise);
          const sunset = new Date(results.sunset);
          
          let status: 'day' | 'night' | 'twilight' = 'day';
          if (now < sunrise || now > sunset) status = 'night';
          else if (now.getTime() - sunrise.getTime() < 3600000 || sunset.getTime() - now.getTime() < 3600000) status = 'twilight';

          setDayCycles(prev => ({ 
            ...prev, 
            [city]: { 
              sunrise: sunrise.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }), 
              sunset: sunset.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
              status 
            } 
          }));
        } catch (e) { console.error(`Day cycle fetch failed for ${city}`, e); }
      });

      // 4. Radio Stations (Top-rated per country)
      Object.entries(CITY_DETAILS).forEach(async ([city, details]) => {
        try {
          const res = await fetch(`https://de1.api.radio-browser.info/json/stations/bycountry/${details.country}?limit=5&order=clickcount&reverse=true`);
          const data = await res.json() as any[];
          if (data && data.length > 0) {
            // Pick first one with a favicon if possible
            const station = data.find((s) => s.favicon) || data[0];
            setRadios(prev => ({ ...prev, [city]: { name: station.name, url: station.url_resolved, favicon: station.favicon } }));
          }
        } catch (e) { console.error(`Radio fetch failed for ${city}`, e); }
      });

      // 5. Daily Meal Inspiration (Global)
      try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await res.json();
        if (data.meals && data.meals.length > 0) {
          setMeal(data.meals[0]);
        }
      } catch (e) { console.error('Meal fetch failed', e); }

      setLoading(false);
    }

    fetchData();
  }, []);

  return { holidays, facts, meal, dayCycles, radios, loading };
}
