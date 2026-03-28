import { useState, useEffect } from 'react';

export function useLocation() {
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detect() {
      try {
        const res = await fetch('https://freeipapi.com/api/json');
        const data = await res.json();
        
        const city = data.cityName.toLowerCase();
        const country = data.countryCode; // NL, PT, IN

        if (city.includes('utrecht') || country === 'NL') setDetectedCity('Utrecht');
        else if (city.includes('lisbon') || city.includes('lisboa') || country === 'PT') setDetectedCity('Lisbon');
        else if (city.includes('chennai') || city.includes('madras') || country === 'IN') setDetectedCity('Chennai');
        else setDetectedCity(null);
      } catch (e) {
        console.error('Location detection failed', e);
        setDetectedCity(null);
      } finally {
        setLoading(false);
      }
    }
    detect();
  }, []);

  return { detectedCity, loading };
}
