import { useEffect, useState } from 'react';
import { translateStatic, type Lang } from '../hooks/useTranslation';

type Props = { lang: Lang };

export function UpdateAvailableBanner({ lang }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const bundled = import.meta.env.VITE_BUILD_ID;
    if (import.meta.env.DEV || !bundled || bundled === 'dev') return;

    let cancelled = false;

    const check = async () => {
      try {
        const r = await fetch(`/version.json?${Date.now()}`, { cache: 'no-store' });
        if (!r.ok || cancelled) return;
        const j = (await r.json()) as { build?: string };
        if (cancelled || !j.build || j.build === bundled) return;
        setVisible(true);
      } catch {
        /* offline or no file */
      }
    };

    void check();
    const id = window.setInterval(() => void check(), 5 * 60 * 1000);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="update-available-banner" role="status">
      <span className="update-available-banner__text">{translateStatic(lang, 'update_available')}</span>
      <button type="button" className="update-available-banner__btn" onClick={() => window.location.reload()}>
        {translateStatic(lang, 'update_refresh')}
      </button>
    </div>
  );
}
