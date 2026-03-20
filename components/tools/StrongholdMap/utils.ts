import { V3_MAP_CONFIG, V3_HEX_DX, V3_HEX_DY, V1_HEX_DX, V1_HEX_DY, V2_HEX_DX, V2_HEX_DY } from './config';
import type { SharedMapState, MapVersion } from './types';

export const keyFor = (x: number, y: number) => `${x},${y}`;

export const normalizeHexColor = (hex: string) => {
  let formatted = String(hex || '').trim();
  if (!formatted.startsWith('#')) formatted = `#${formatted}`;
  if (formatted.length === 4) {
    formatted = `#${formatted.slice(1).split('').map((char) => char + char).join('')}`;
  }
  return formatted.length === 7 ? formatted.toLowerCase() : '#ff6961';
};

export const hexToRgba = (hex: string, alpha: number) => {
  const n = normalizeHexColor(hex);
  const bigint = parseInt(n.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const inBounds = (x: number, y: number, version?: MapVersion) => {
  if ((x + y) % 2 !== 0) return false;
  const cfg = version === 'v1' ? {
    maxEven: { x: 18, y: 32 },
    maxOdd: { x: 17, y: 33 },
  } : {
    maxEven: V3_MAP_CONFIG.maxEven,
    maxOdd: V3_MAP_CONFIG.maxOdd,
  };
  if (x % 2 === 0) return x >= 0 && x <= cfg.maxEven.x && y >= 0 && y <= cfg.maxEven.y;
  return x >= 1 && x <= cfg.maxOdd.x && y >= 1 && y <= cfg.maxOdd.y;
};

export const computeCenter = (x: number, y: number, version?: MapVersion) => {
  const dx = version === 'v1' ? V1_HEX_DX : version === 'v2' ? V2_HEX_DX : V3_HEX_DX;
  const dy = version === 'v1' ? V1_HEX_DY : version === 'v2' ? V2_HEX_DY : V3_HEX_DY;
  return { cx: x * dx, cy: y * (dy / 2) };
};

// --- Sharing helpers ---

const SHARE_PREFIX = 's:1:';

const toBase64Url = (input: string) => {
  // Encode UTF-8 safely before base64
  const utf8 = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  const b64 = btoa(utf8);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const fromBase64Url = (input: string) => {
  let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const utf8 = atob(b64);
  const percentEncoded = Array.from(utf8)
    .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  return decodeURIComponent(percentEncoded);
};

export const encodeMapShareState = (state: SharedMapState): string => {
  try {
    const json = JSON.stringify(state);
    return SHARE_PREFIX + toBase64Url(json);
  } catch (e) {
    console.warn('encodeMapShareState failed', e);
    return '';
  }
};

export const decodeMapShareState = (token: string): SharedMapState | null => {
  try {
    if (!token || !token.startsWith(SHARE_PREFIX)) return null;
    const raw = token.slice(SHARE_PREFIX.length);
    const json = fromBase64Url(raw);
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.marks) || !Array.isArray(parsed.annotations)) {
      return null;
    }
    return parsed as SharedMapState;
  } catch (e) {
    console.warn('decodeMapShareState failed', e);
    return null;
  }
};


