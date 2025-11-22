import { MAP_CONFIG, HEX_DX, HEX_DY } from './config';

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

export const inBounds = (x: number, y: number) => {
  if ((x + y) % 2 !== 0) return false;
  if (x % 2 === 0) return x >= 0 && x <= MAP_CONFIG.maxEven.x && y >= 0 && y <= MAP_CONFIG.maxEven.y;
  return x >= 1 && x <= MAP_CONFIG.maxOdd.x && y >= 1 && y <= MAP_CONFIG.maxOdd.y;
};

export const computeCenter = (x: number, y: number) => ({ cx: x * HEX_DX, cy: y * (HEX_DY / 2) });

