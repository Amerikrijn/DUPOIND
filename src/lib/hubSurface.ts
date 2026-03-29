import type { CSSProperties } from 'react';
import { hubAccentVar } from '../config/appConfig';

export function hubBorderLeft(cityId: string): CSSProperties {
  return { borderLeftColor: hubAccentVar(cityId) };
}

export function hubBorderTop(cityId: string): CSSProperties {
  return { borderTopColor: hubAccentVar(cityId) };
}

export function hubAvatarSurface(cityId: string): CSSProperties {
  return {
    background: `color-mix(in srgb, ${hubAccentVar(cityId)} 25%, transparent)`,
    color: hubAccentVar(cityId),
  };
}
