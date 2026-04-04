import { TierRow, TierlistSaveState } from './types';

const STORAGE_KEY = 'tga-tierlist-state';

export function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function defaultTiers(): TierRow[] {
  return [
    { id: generateId(), label: 'S', labelBg: '#e53e3e', charIds: [] },
    { id: generateId(), label: 'A', labelBg: '#dd6b20', charIds: [] },
    { id: generateId(), label: 'B', labelBg: '#d69e2e', charIds: [] },
    { id: generateId(), label: 'C', labelBg: '#38a169', charIds: [] },
    { id: generateId(), label: 'D', labelBg: '#3182ce', charIds: [] },
  ];
}

export function loadState(): TierlistSaveState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1) return { teams: [], ...parsed } as TierlistSaveState;
    return null;
  } catch {
    return null;
  }
}

export function saveState(state: TierlistSaveState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export interface ExportChar {
  id: string;
  rarity: string;
}

export interface ExportTier {
  label: string;
  labelBg: string;
  chars: ExportChar[];
}

export async function exportTierlist(
  tiers: ExportTier[],
  bgColor: string,
  onStart: () => void,
  onEnd: () => void
): Promise<void> {
  onStart();
  try {
    const CHIP = 72;
    const GAP = 6;
    const LABEL_W = 72;
    const PAD = 10;
    const CANVAS_W = 900;

    // Collect unique rarities and char ids
    const allChars = tiers.flatMap((t) => t.chars);
    const uniqueRarities = [...new Set(allChars.map((c) => c.rarity))];

    // Pre-load rarity bg/frame images
    const rarityBg = new Map<string, HTMLImageElement | null>();
    const rarityFrame = new Map<string, HTMLImageElement | null>();
    await Promise.all(
      uniqueRarities.map(async (r) => {
        const [bg, frame] = await Promise.all([
          loadImage(`/assets/heroes/bg/TYJS_bg_head_${r}.png`).catch(() => null),
          loadImage(`/assets/heroes/frame/TYJS_frame_head_${r}.png`).catch(() => null),
        ]);
        rarityBg.set(r, bg);
        rarityFrame.set(r, frame);
      })
    );

    // Pre-load head images
    const headImgs = new Map<string, HTMLImageElement | null>();
    await Promise.all(
      allChars.map(async (c) => {
        if (headImgs.has(c.id)) return;
        const img = await loadImage(`/assets/heroes/head/${c.id}_head.png`).catch(() => null);
        headImgs.set(c.id, img);
      })
    );

    // Calculate row heights
    const contentW = CANVAS_W - LABEL_W - PAD * 2;
    const perRow = Math.max(1, Math.floor((contentW + GAP) / (CHIP + GAP)));

    const rowHeights = tiers.map((tier) => {
      const count = tier.chars.length;
      if (count === 0) return CHIP + PAD * 2;
      const rows = Math.ceil(count / perRow);
      return Math.max(CHIP + PAD * 2, rows * CHIP + (rows - 1) * GAP + PAD * 2);
    });

    const totalH = rowHeights.reduce((a, b) => a + b, 0);
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_W;
    canvas.height = totalH;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, CANVAS_W, totalH);

    let y = 0;
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const rowH = rowHeights[i];

      // Row bg
      ctx.fillStyle = i % 2 === 0 ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.2)';
      ctx.fillRect(0, y, CANVAS_W, rowH);

      // Label box
      ctx.fillStyle = tier.labelBg;
      ctx.fillRect(0, y, LABEL_W, rowH);

      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(LABEL_W * 0.38)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tier.label, LABEL_W / 2, y + rowH / 2);

      // Row separator
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();

      // Chips
      let cx = LABEL_W + PAD;
      let cy = y + PAD;
      let col = 0;

      for (const char of tier.chars) {
        const bg = rarityBg.get(char.rarity);
        const frame = rarityFrame.get(char.rarity);
        const head = headImgs.get(char.id);
        if (bg) ctx.drawImage(bg, cx, cy, CHIP, CHIP);
        if (head) ctx.drawImage(head, cx, cy, CHIP, CHIP);
        if (frame) ctx.drawImage(frame, cx, cy, CHIP, CHIP);

        col++;
        if (col >= perRow) {
          col = 0;
          cx = LABEL_W + PAD;
          cy += CHIP + GAP;
        } else {
          cx += CHIP + GAP;
        }
      }

      y += rowH;
    }

    canvas.toBlob((blob) => {
      if (!blob) { onEnd(); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `tierlist-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      onEnd();
    }, 'image/png');
  } catch (e) {
    console.error('Export failed:', e);
    onEnd();
  }
}
