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
      // 1-4. Parallel fetch for all cities
      const fetchPromises = Object.entries(CITY_DETAILS).map(async ([city, details]) => {
        // --- Holidays ---
        try {
          const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${details.countryCode}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setHolidays(prev => ({ ...prev, [city]: data[0] }));
          }
        } catch (e) { 
          console.warn(`Holidays: Skipping ${city} due to fetch error.`, e); 
          setHolidays(prev => ({ ...prev, [city]: null }));
        }

        // --- Facts ---
        try {
          const name = city.charAt(0).toUpperCase() + city.slice(1);
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${name}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setFacts(prev => ({ ...prev, [city]: data }));
        } catch (e) { 
          console.warn(`Facts: Skipping ${city} fetch.`, e);
          setFacts(prev => ({ ...prev, [city]: null }));
        }

        // --- Day Cycle ---
        try {
          const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${details.lat}&lng=${details.lng}&formatted=0`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { results } = await res.json();
          if (results) {
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
          }
        } catch (e) { 
          console.warn(`DayCycle: Skipping ${city} fetch.`, e);
          setDayCycles(prev => ({ ...prev, [city]: null }));
        }

        // --- Radio ---
        try {
          const res = await fetch(`https://de1.api.radio-browser.info/json/stations/bycountry/${details.country}?limit=5&order=clickcount&reverse=true`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const station = data.find((s: any) => s.favicon) || data[0];
              setRadios(prev => ({ ...prev, [city]: { name: station.name, url: station.url_resolved, favicon: station.favicon } }));
            }
          }
        } catch (e) { console.warn(`Radio: Skipping ${city} fetch.`, e); }
      });

      // 5. Daily Meal Inspiration (Filtered for Squad locations)
      const fetchMeal = async () => {
        try {
          const areas = ['Dutch', 'Portuguese', 'Indian'];
          const randomArea = areas[Math.floor(Math.random() * areas.length)];
          const filterRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${randomArea}`);
          if (filterRes.ok) {
            const filterData = await filterRes.json();
            if (filterData.meals && filterData.meals.length > 0) {
              const randomMeal = filterData.meals[Math.floor(Math.random() * filterData.meals.length)];
              const mealRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${randomMeal.idMeal}`);
              const mealData = await mealRes.json();
              if (mealData.meals && mealData.meals.length > 0) {
                setMeal(mealData.meals[0]);
              }
            }
          }
        } catch (e) { console.warn('Meal: Skipping fetch.', e); }
      };

      await Promise.all([...fetchPromises, fetchMeal()]);
      setLoading(false);
    }

    fetchData();
  }, []);

  return { holidays, facts, meal, dayCycles, radios, loading };
}
