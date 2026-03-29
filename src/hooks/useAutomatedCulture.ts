import { useState, useEffect } from 'react';
import { getHubConfig } from '../config/appConfig';
import { fetchNextPublicHoliday, type Holiday } from '../services/nagerHolidays';
import {
  fetchOnThisDayHighlight,
  wikiLangFromUi,
  type OnThisDayHighlight,
} from '../services/wikipediaOnThisDay';
import type { Lang } from './useTranslation';

export type { Holiday };

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

export function useAutomatedCulture(uiLang: Lang = 'EN') {
  const [holidays, setHolidays] = useState<Record<string, Holiday | null>>({});
  const [facts, setFacts] = useState<Record<string, CityFact | null>>({});
  const [meal, setMeal] = useState<MealInspiration | null>(null);
  const [dayCycles, setDayCycles] = useState<Record<string, DayCycle | null>>({});
  const [radios, setRadios] = useState<Record<string, RadioStation | null>>({});
  const [onThisDay, setOnThisDay] = useState<OnThisDayHighlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cfg = getHubConfig();

    async function fetchData() {
      const fetchPromises = cfg.cities.map(async (city) => {
        const details = city;

        try {
          const h = await fetchNextPublicHoliday(details.countryCode);
          setHolidays((prev) => ({ ...prev, [city.id]: h }));
        } catch {
          setHolidays((prev) => ({ ...prev, [city.id]: null }));
        }

        try {
          const title = encodeURIComponent(details.wikipediaTitle);
          const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          setFacts((prev) => ({ ...prev, [city.id]: data }));
        } catch {
          setFacts((prev) => ({ ...prev, [city.id]: null }));
        }

        try {
          const res = await fetch(
            `https://api.sunrise-sunset.org/json?lat=${details.lat}&lng=${details.lng}&formatted=0`
          );
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const { results } = await res.json();
          if (results) {
            const now = new Date();
            const sunrise = new Date(results.sunrise);
            const sunset = new Date(results.sunset);

            let status: 'day' | 'night' | 'twilight' = 'day';
            if (now < sunrise || now > sunset) status = 'night';
            else if (
              now.getTime() - sunrise.getTime() < 3600000 ||
              sunset.getTime() - now.getTime() < 3600000
            )
              status = 'twilight';

            setDayCycles((prev) => ({
              ...prev,
              [city.id]: {
                sunrise: sunrise.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
                sunset: sunset.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
                status,
              },
            }));
          }
        } catch {
          setDayCycles((prev) => ({ ...prev, [city.id]: null }));
        }

      });

      const fetchMeal = async () => {
        try {
          const areas = cfg.mealDbAreas;
          const randomArea = areas[Math.floor(Math.random() * areas.length)];
          const filterRes = await fetch(
            `https://www.themealdb.com/api/json/v1/1/filter.php?a=${encodeURIComponent(randomArea)}`
          );
          if (filterRes.ok) {
            const filterData = await filterRes.json();
            if (filterData.meals && filterData.meals.length > 0) {
              const randomMeal = filterData.meals[Math.floor(Math.random() * filterData.meals.length)];
              const mealRes = await fetch(
                `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${randomMeal.idMeal}`
              );
              const mealData = await mealRes.json();
              if (mealData.meals && mealData.meals.length > 0) {
                setMeal(mealData.meals[0]);
              }
            }
          }
        } catch {
          /* meal optional */
        }
      };

      await Promise.all([...fetchPromises, fetchMeal()]);
      try {
        const otd = await fetchOnThisDayHighlight(wikiLangFromUi(uiLang));
        setOnThisDay(otd);
      } catch {
        setOnThisDay(null);
      }
      setLoading(false);
    }

    fetchData();
  }, [uiLang]);

  /** Radio: pick random stations from a larger pool; refresh on an interval so the row stays fresh. */
  useEffect(() => {
    const cfg = getHubConfig();
    let cancelled = false;
    const ROTATE_MS = 15 * 60 * 1000;

    async function refreshRadios() {
      await Promise.all(
        cfg.cities.map(async (city) => {
          const name = city.countryName;
          const offset = Math.floor(Math.random() * 8) * 10;
          try {
            const res = await fetch(
              `https://de1.api.radio-browser.info/json/stations/bycountry/${encodeURIComponent(name)}?limit=50&offset=${offset}&order=clickcount&reverse=true`
            );
            if (!res.ok) return;
            const data = (await res.json()) as {
              name?: string;
              url?: string;
              url_resolved?: string;
              favicon?: string;
            }[];
            if (!data?.length || cancelled) return;
            const usable = data.filter((s) => s.url_resolved || s.url);
            const pool = usable.length > 0 ? usable : data;
            const station = pool[Math.floor(Math.random() * pool.length)];
            setRadios((prev) => ({
              ...prev,
              [city.id]: {
                name: station.name || 'Radio',
                url: station.url_resolved || station.url || '',
                favicon: station.favicon || '',
              },
            }));
          } catch {
            /* optional */
          }
        })
      );
    }

    void refreshRadios();
    const id = window.setInterval(() => {
      void refreshRadios();
    }, ROTATE_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return { holidays, facts, meal, dayCycles, radios, loading, onThisDay };
}
