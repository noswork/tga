import React, { useState, useCallback, useMemo } from 'react';
import { X, Activity } from 'lucide-react';
import heroCalcData from '../../gamedata/hero_calc_data.json';
import heroNamesZh from '../../gamedata/hero_names_zh.json';

// ── Constants ───────────────────────────────────────────────────────────────

const CPW = { Atk: 1.1, Def: 1.3, Hp: 0.07 };
const ATTR_MAX: Record<string, number> = {
  AtkFixed: 700, DefFixed: 550, HpFixed: 11000,
  AtkRate: 0.016, DefRate: 0.016, HpRate: 0.016,
  Crit: 0.035, Uncrit: 0.035, CritDeepen: 0.04, UncritDeepen: 0.04,
  Block: 0.04, Unblock: 0.04, Suck: 0.03, Regeneration: 0.03, GetCured: 0.03,
};
const START_FLAT = { Atk: 30, Def: 25, Hp: 160 };
const NUM_SLOTS = 4;
const NUM_OPTS = 3;
const TOTAL_ROUNDS = 30;

interface StatDef { id: string; label: string; kind: 'flat' | 'rate' | 'sec'; base?: 'Atk'|'Def'|'Hp'; w?: number; thr?: number; }
const STAT_DEFS: StatDef[] = [
  { id: 'AtkFixed', label: 'ATK（固定）', kind: 'flat', base: 'Atk' },
  { id: 'DefFixed', label: 'DEF（固定）', kind: 'flat', base: 'Def' },
  { id: 'HpFixed',  label: 'HP（固定）',  kind: 'flat', base: 'Hp'  },
  { id: 'AtkRate', label: 'ATK 因子', kind: 'rate', base: 'Atk' },
  { id: 'DefRate', label: 'DEF 因子', kind: 'rate', base: 'Def' },
  { id: 'HpRate',  label: 'HP 因子',  kind: 'rate', base: 'Hp'  },
  { id: 'Crit',         label: '暴擊率',     kind: 'sec', w: 3500 },
  { id: 'Uncrit',       label: '暴擊抵抗',   kind: 'sec', w: 3500 },
  { id: 'CritDeepen',   label: '暴擊傷害',   kind: 'sec', w: 3000, thr: 1.5 },
  { id: 'UncritDeepen', label: '暴擊防禦',   kind: 'sec', w: 3000 },
  { id: 'Block',        label: '格擋',       kind: 'sec', w: 3000 },
  { id: 'Unblock',      label: '穿透',       kind: 'sec', w: 3000 },
  { id: 'Suck',         label: '吸血',       kind: 'sec', w: 4000 },
  { id: 'Regeneration', label: '再生',       kind: 'sec', w: 4000 },
  { id: 'GetCured',     label: '治療效果',   kind: 'sec', w: 4000, thr: 1.0 },
];
const STAT_BY = Object.fromEntries(STAT_DEFS.map(s => [s.id, s]));
const FLAT_STATS = STAT_DEFS.filter(s => s.kind === 'flat');
const FACTOR_STATS = STAT_DEFS.filter(s => s.kind !== 'flat');

// ── Types ───────────────────────────────────────────────────────────────────

interface Slot { stat: string; val: number; }
type OptKind = '' | 'flat' | 'factor' | 'boost';
interface Opt { kind: OptKind; stat: string; valStr: string; slotIdx: number; }
interface Props { onClose: () => void; }

const emptyOpt = (): Opt => ({ kind: 'flat', stat: 'AtkFixed', valStr: '', slotIdx: 0 });
const emptySlot = (): Slot => ({ stat: '', val: 0 });
const fmt = (n: number) => n >= 10000 ? (n/10000).toFixed(2)+'萬' : Math.round(n).toLocaleString();

// ── Hero base stat computation (from xbyj.html) ────────────────────────────

interface HeroData { n: string; t?: string; r: number; af: number; df: number; hf: number; aa: number; ad: number; ah: number; grp: string; caps: number[]; rup: number[]; }
const HEROES = heroCalcData.heroes as Record<string, HeroData>;
const HERO_NAMES_ZH = heroNamesZh as Record<string, { name: string; title: string }>;
const RANKS = heroCalcData.ranks as any;
const BOND = heroCalcData.bond as { Atk: number; Def: number; Hp: number; max: number };
const GROW = heroCalcData.grow as { growF1: number; growF2: number; growMax: number };
const RARITY = heroCalcData.rarity as { raritySeq: number[]; rarityGrow: Record<string, number> };
const POTENTIAL = heroCalcData.potential as { '6': { Atk: number; Def: number; Hp: number }; '7': { Atk: number; Def: number; Hp: number } };
const POT_SLOTS = heroCalcData.potSlots as number;

function computeBase(
  heroId: string, lv: number, star: number,
  bondAtk: number, bondDef: number, bondHp: number,
  pot6: number, pot7: number
): { Atk: number; Def: number; Hp: number } | null {
  const h = HEROES[heroId];
  if (!h) return null;
  const rk = RANKS[h.grp]?.[String(star)];
  if (!rk) return null;

  const cap = h.caps.find(c => c >= lv) ?? Math.max(...h.caps);
  const promoteMul = (Math.min(cap, GROW.growMax) - GROW.growF1) / GROW.growF2;

  let effRarity = h.r;
  if (h.r !== 55) {
    const rareLv = h.rup.filter(c => c <= cap).length;
    const i0 = RARITY.raritySeq.indexOf(h.r);
    if (i0 >= 0) effRarity = RARITY.raritySeq[Math.min(i0 + rareLv, RARITY.raritySeq.length - 1)];
  }
  const rg = RARITY.rarityGrow[String(effRarity)] ?? 1;

  const potAtk = pot7 * POTENTIAL['7'].Atk + pot6 * POTENTIAL['6'].Atk;
  const potDef = pot7 * POTENTIAL['7'].Def + pot6 * POTENTIAL['6'].Def;
  const potHp  = pot7 * POTENTIAL['7'].Hp  + pot6 * POTENTIAL['6'].Hp;

  const spec: [string, string, string, string, string, number][] = [
    ['Atk', 'ab', 'ag', 'af', 'aa', bondAtk * BOND.Atk + potAtk],
    ['Def', 'db', 'dg', 'df', 'ad', bondDef * BOND.Def + potDef],
    ['Hp',  'hb', 'hg', 'hf', 'ah', bondHp  * BOND.Hp  + potHp],
  ];
  const out: any = {};
  spec.forEach(([s, bk, gk, fk, ak, bond]) => {
    const lvlPart = (rk[bk] + rk[gk] * (lv - 1)) * (h as any)[fk] * rg;
    const attrPart = (h as any)[ak];
    const promo = promoteMul * attrPart;
    out[s] = lvlPart + attrPart + promo + bond;
  });
  return out;
}

// ── Component ───────────────────────────────────────────────────────────────

export const ActiveCellHelper: React.FC<Props> = ({ onClose }) => {
  // Hero selection
  const [heroId, setHeroId] = useState('');
  const [heroLv, setHeroLv] = useState(350);
  const [heroStar, setHeroStar] = useState(6);
  const [bondAtk, setBondAtk] = useState(30);
  const [bondDef, setBondDef] = useState(30);
  const [bondHp, setBondHp] = useState(30);
  const [pot6, setPot6] = useState(9);
  const [pot7, setPot7] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [manualAtk, setManualAtk] = useState('');
  const [manualDef, setManualDef] = useState('');
  const [manualHp, setManualHp] = useState('');

  // Run state
  const [round, setRound] = useState(1);
  const [flatAtk, setFlatAtk] = useState(START_FLAT.Atk);
  const [flatDef, setFlatDef] = useState(START_FLAT.Def);
  const [flatHp, setFlatHp] = useState(START_FLAT.Hp);
  const [slots, setSlots] = useState<Slot[]>(Array.from({ length: NUM_SLOTS }, emptySlot));
  const [opts, setOpts] = useState<Opt[]>(Array.from({ length: NUM_OPTS }, emptyOpt));

  // ── Computed base stats ─────────────────────────────────────────────────

  const baseStats = useMemo(() => {
    if (manualMode) {
      const a = parseFloat(manualAtk), d = parseFloat(manualDef), h = parseFloat(manualHp);
      return isFinite(a) && isFinite(d) && isFinite(h) ? { Atk: a, Def: d, Hp: h } : null;
    }
    if (!heroId) return null;
    return computeBase(heroId, heroLv, heroStar, bondAtk, bondDef, bondHp, pot6, pot7);
  }, [heroId, heroLv, heroStar, bondAtk, bondDef, bondHp, pot6, pot7, manualMode, manualAtk, manualDef, manualHp]);

  const numBase = useCallback((key: 'Atk'|'Def'|'Hp') => baseStats?.[key] ?? 0, [baseStats]);

  // ── CP helpers ──────────────────────────────────────────────────────────

  const statCP = useCallback((statId: string, val: number): number => {
    if (!statId || !val) return 0;
    const d = STAT_BY[statId];
    if (!d) return 0;
    if (d.kind === 'flat') {
      const w = d.base === 'Atk' ? CPW.Atk : d.base === 'Def' ? CPW.Def : CPW.Hp;
      return val * w;
    }
    if (d.kind === 'rate') {
      const base = numBase(d.base!);
      const w = d.base === 'Atk' ? CPW.Atk : d.base === 'Def' ? CPW.Def : CPW.Hp;
      return base * val * w;
    }
    // sec stat - simplified: no threshold handling for now
    return val * (d.w ?? 0);
  }, [numBase]);

  // ── Compute CP gain for each option ─────────────────────────────────────

  const computeResults = useCallback(() => {
    return opts.map((o, i) => {
      const raw = parseFloat(o.valStr);

      // Allow empty kind with valid value to default to 'flat'
      const kind = o.kind || (isFinite(raw) && raw > 0 ? 'flat' : '');

      if (!kind) return { i, gain: 0, why: '未選擇或技能 — 無數值評分。', ok: false };
      if (!isFinite(raw) || raw === 0) return { i, gain: 0, why: '請輸入數值。', ok: false };

      if (kind === 'flat') {
        const d = STAT_BY[o.stat];
        if (!d || d.kind !== 'flat') return { i, gain: 0, why: '無效的固定值屬性。', ok: false };
        const maxV = ATTR_MAX[o.stat];
        const cur = o.stat === 'AtkFixed' ? flatAtk : o.stat === 'DefFixed' ? flatDef : flatHp;
        let eff = raw;
        let clamped = '';
        if (maxV !== undefined && cur + raw > maxV) {
          eff = Math.max(0, maxV - cur);
          clamped = eff <= 0 ? ` 已達上限 ${maxV} — 無增益。` : ` 限制至 +${eff.toFixed(0)}（上限 ${maxV}）。`;
        }
        const gain = statCP(o.stat, eff);
        return { i, gain, why: `+${raw} ${d.label}${clamped} → +${fmt(gain)} CP。`, ok: eff > 0 };
      }

      if (kind === 'factor') {
        const d = STAT_BY[o.stat];
        if (!d || d.kind === 'flat') return { i, gain: 0, why: '請選擇因子屬性。', ok: false };
        let v = raw / 100;
        const mx = ATTR_MAX[o.stat];
        let clamp = '';
        if (mx !== undefined && v > mx) { v = mx; clamp = `（限制至 ${(mx*100).toFixed(2)}% 上限）`; }
        const si = o.slotIdx;
        const old = slots[si];
        const newCP = statCP(o.stat, v);
        const oldCP = old.stat ? statCP(old.stat, old.val) : 0;
        const gain = newCP - oldCP;
        const oldDesc = old.stat
          ? `取代槽位 ${si+1} 的 ${STAT_BY[old.stat]?.label??old.stat} ${(old.val*100).toFixed(2)}%（+${fmt(oldCP)} CP）`
          : `槽位 ${si+1} 空`;
        return { i, gain, why: `${d.label} ${(v*100).toFixed(2)}%${clamp} — ${oldDesc}。淨增：+${fmt(gain)} CP。`, ok: true };
      }

      if (kind === 'boost') {
        const si = o.slotIdx;
        const s = slots[si];
        if (!s.stat) return { i, gain: 0, why: `槽位 ${si+1} 空 — 無法提升。`, ok: false };
        const inc = raw / 100;
        const mx = ATTR_MAX[s.stat];
        let eff = inc;
        let note = '';
        if (mx !== undefined && s.val + inc > mx) {
          eff = Math.max(0, mx - s.val);
          note = eff <= 0 ? ` 槽位 ${si+1} 已達上限 — 無增益。` : ` 限制：僅 +${(eff*100).toFixed(2)}% 生效。`;
        }
        const gain = statCP(s.stat, eff);
        return { i, gain, why: `提升槽位 ${si+1} 的 ${STAT_BY[s.stat]?.label??s.stat} +${(eff*100).toFixed(2)}%${note} → +${fmt(gain)} CP。`, ok: eff > 0 };
      }

      return { i, gain: 0, why: '', ok: false };
    });
  }, [opts, slots, flatAtk, flatDef, flatHp, statCP]);

  const results = computeResults();
  const bestIdx = results.filter(r => r.ok && r.gain > 0).sort((a,b) => b.gain - a.gain)[0]?.i ?? -1;

  // ── Actions ─────────────────────────────────────────────────────────────

  const applyOpt = (i: number) => {
    const o = opts[i];
    const r = results[i];
    if (!r.ok && r.gain <= 0) return;
    const raw = parseFloat(o.valStr);
    if (!isFinite(raw)) return;

    const kind = o.kind || 'flat';  // Default to flat if not set

    if (kind === 'flat') {
      const mx = ATTR_MAX[o.stat];
      if (o.stat === 'AtkFixed') setFlatAtk(v => Math.min(mx??Infinity, v+raw));
      if (o.stat === 'DefFixed') setFlatDef(v => Math.min(mx??Infinity, v+raw));
      if (o.stat === 'HpFixed')  setFlatHp(v =>  Math.min(mx??Infinity, v+raw));
    } else if (kind === 'factor') {
      let v = raw / 100;
      const mx = ATTR_MAX[o.stat];
      if (mx !== undefined && v > mx) v = mx;
      setSlots(prev => prev.map((s, si) => si === o.slotIdx ? { stat: o.stat, val: v } : s));
    } else if (kind === 'boost') {
      const si = o.slotIdx;
      setSlots(prev => prev.map((s, idx) => {
        if (idx !== si || !s.stat) return s;
        const mx = ATTR_MAX[s.stat];
        const nv = mx !== undefined ? Math.min(mx, s.val + raw/100) : s.val + raw/100;
        return { ...s, val: nv };
      }));
    }
    advanceRound();
  };

  const advanceRound = () => {
    setOpts(Array.from({ length: NUM_OPTS }, emptyOpt));
    setRound(r => r + 1);
  };

  const resetRun = () => {
    setRound(1);
    setFlatAtk(START_FLAT.Atk); setFlatDef(START_FLAT.Def); setFlatHp(START_FLAT.Hp);
    setSlots(Array.from({ length: NUM_SLOTS }, emptySlot));
    setOpts(Array.from({ length: NUM_OPTS }, emptyOpt));
  };

  const updateOpt = (i: number, patch: Partial<Opt>) =>
    setOpts(prev => prev.map((o, idx) => idx === i ? { ...o, ...patch } : o));

  // ── Rendering helpers ───────────────────────────────────────────────────

  const currentFlatCP = statCP('AtkFixed', flatAtk) + statCP('DefFixed', flatDef) + statCP('HpFixed', flatHp);
  const currentSlotCP = slots.reduce((acc, s) => acc + (s.stat ? statCP(s.stat, s.val) : 0), 0);
  const totalCP = currentFlatCP + currentSlotCP;

  const heroOptions = useMemo(() =>
    Object.entries(HEROES).map(([id, h]) => {
      const zh = HERO_NAMES_ZH[id];
      const zhName = zh?.name || h.n;
      const zhTitle = zh?.title || h.t || '';
      const label = zhTitle ? `${zhName} [${zhTitle}]` : zhName;
      return { id, label, zhName };
    }).sort((a,b) => a.zhName.localeCompare(b.zhName, 'zh-TW'))
  , []);

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 pt-14 md:pt-24 bg-ccg-light dark:bg-ghoul-black flex flex-col">
      <div className="flex-grow overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-5 text-sm">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-ghoul-red" size={28} />
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-ghoul-red">深淵戰域</p>
                <h2 className="text-2xl font-bold">活性細胞戰力計算器</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  回合 {Math.min(round, TOTAL_ROUNDS)} / {TOTAL_ROUNDS}
                </div>
                <button onClick={resetRun} className="mt-1 px-3 py-1 text-xs rounded border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  新回合
                </button>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Hero Base */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">角色基礎屬性</h3>
              <label className="ml-auto flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={manualMode} onChange={e => setManualMode(e.target.checked)} className="rounded" />
                手動輸入
              </label>
            </div>

            {!manualMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">角色（輸入搜尋）</span>
                    <select value={heroId} onChange={e => setHeroId(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm">
                      <option value="">-- 請選擇角色 --</option>
                      {heroOptions.map(h => <option key={h.id} value={h.id}>{h.label}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">等級</span>
                      <input type="number" min="1" max="500" value={heroLv} onChange={e => setHeroLv(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">星級突破</span>
                      <select value={heroStar} onChange={e => setHeroStar(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm">
                        {[0,1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">協同 ATK (0-30)</span>
                    <input type="number" min="0" max="30" value={bondAtk} onChange={e => setBondAtk(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">協同 DEF (0-30)</span>
                    <input type="number" min="0" max="30" value={bondDef} onChange={e => setBondDef(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">協同 HP (0-30)</span>
                    <input type="number" min="0" max="30" value={bondHp} onChange={e => setBondHp(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">彩虹潛能 Lv7 (0-9)</span>
                    <input type="number" min="0" max="9" value={pot7} onChange={e => setPot7(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">彩虹潛能 Lv6 (0-9)</span>
                    <input type="number" min="0" max="9" value={pot6} onChange={e => setPot6(+e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                  </label>
                </div>
                {baseStats && (
                  <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-900/50 rounded p-2">
                    計算基礎值：ATK <b className="text-orange-400">{Math.round(baseStats.Atk)}</b> / DEF <b className="text-blue-400">{Math.round(baseStats.Def)}</b> / HP <b className="text-green-400">{Math.round(baseStats.Hp)}</b>
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-orange-400">ATK Base</span>
                  <input type="number" min="0" placeholder="30000" value={manualAtk} onChange={e => setManualAtk(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-blue-400">DEF Base</span>
                  <input type="number" min="0" placeholder="25000" value={manualDef} onChange={e => setManualDef(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-green-400">HP Base</span>
                  <input type="number" min="0" placeholder="500000" value={manualHp} onChange={e => setManualHp(e.target.value)} className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm" />
                </label>
              </div>
            )}
          </div>

          {/* Current Cell State */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/40 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">當前活性細胞狀態</h3>
              {totalCP > 0 && <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">≈ <b className="text-black dark:text-white">{fmt(totalCP)}</b> CP</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['Atk','Def','Hp'] as const).map(s => {
                const id = `${s}Fixed` as const;
                const val = s==='Atk'?flatAtk:s==='Def'?flatDef:flatHp;
                const mx = ATTR_MAX[id];
                const pct = mx ? Math.min(100, (val/mx)*100) : 0;
                return (
                  <div key={s} className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs">
                      <span className={s==='Atk'?'text-orange-400':s==='Def'?'text-blue-400':'text-green-400'}>{s} 固定</span>
                      <span className="text-gray-400">{val} / {mx}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div className={`h-full rounded-full transition-all ${pct>=100?'bg-red-500':s==='Atk'?'bg-orange-400':s==='Def'?'bg-blue-400':'bg-green-400'}`} style={{width:`${pct}%`}} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s,i) => {
                const d = s.stat ? STAT_BY[s.stat] : null;
                const mx = s.stat ? ATTR_MAX[s.stat] : undefined;
                const maxed = mx !== undefined && s.val >= mx - 1e-9;
                return (
                  <div key={i} className={`rounded border px-2 py-1.5 text-center text-xs transition-colors ${
                    s.stat ? maxed ? 'border-red-500/60 bg-red-900/20 text-red-300' : 'border-emerald-500/50 bg-emerald-900/20 text-emerald-300' : 'border-gray-600 bg-gray-900/30 text-gray-500'
                  }`}>
                    <div className="text-gray-400 mb-0.5">槽位 {i+1}</div>
                    {s.stat ? <><div className="font-medium leading-tight">{d?.label??s.stat}</div><div className="font-bold tabular-nums">{(s.val*100).toFixed(2)}%{maxed?' ⚠':''}</div></> : <div className="text-gray-600">空</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Round Options */}
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/40 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">回合 {Math.min(round, TOTAL_ROUNDS)} 選項</h3>
              <span className="text-xs text-gray-500 ml-auto">輸入遊戲提供的 3 個選擇</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded p-2">
              <b>固定</b> = 加到固定值，純增益。<b>因子</b> = 佔槽位（取代原內容）。<b>提升</b> = 加到槽位現有屬性，有上限。
            </div>
            {opts.map((o,i) => {
              const r = results[i];
              const isBest = i === bestIdx;
              return (
                <div key={i} className={`rounded-lg border p-3 transition-all ${isBest?'border-emerald-500 bg-emerald-900/20 shadow shadow-emerald-900/30':!r.ok&&o.kind?'border-gray-600 opacity-60':'border-gray-300 dark:border-gray-700'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-400 w-16">選項 {i+1}</span>
                    <select value={o.kind} onChange={e => updateOpt(i, {kind: e.target.value as OptKind, valStr:''})} className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs">
                      <option value="flat">固定值</option>
                      <option value="factor">因子入槽</option>
                      <option value="boost">提升槽位</option>
                      <option value="">無/技能</option>
                    </select>
                    {o.kind && <span className={`ml-auto text-base font-bold tabular-nums ${isBest?'text-emerald-400':r.gain>0?'text-emerald-300':r.gain<0?'text-red-400':'text-gray-500'}`}>
                      {r.ok||r.gain?(r.gain>=0?'+':'')+fmt(r.gain)+' CP':'n/a'}
                    </span>}
                  </div>
                  {o.kind && (
                    <div className="flex flex-wrap items-center gap-2">
                      {(o.kind==='flat'||o.kind==='factor') && (
                        <select value={o.stat} onChange={e => updateOpt(i, {stat:e.target.value})} className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs">
                          {o.kind==='flat' ? FLAT_STATS.map(s => <option key={s.id} value={s.id}>{s.label}</option>) : FACTOR_STATS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                      )}
                      <div className="flex items-center gap-1">
                        <input type="number" step="any" min="0" placeholder={o.kind==='flat'?'50':'1.6'} value={o.valStr} onChange={e => updateOpt(i, {valStr:e.target.value})} className="w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs" />
                        {o.kind!=='flat' && <span className="text-xs text-gray-500">%</span>}
                      </div>
                      {(o.kind==='factor'||o.kind==='boost') && (
                        <select value={o.slotIdx} onChange={e => updateOpt(i, {slotIdx:+e.target.value})} className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs">
                          {Array.from({length:NUM_SLOTS},(_,si) => <option key={si} value={si}>槽位 {si+1}</option>)}
                        </select>
                      )}
                      <button onClick={() => applyOpt(i)} disabled={!r.ok&&r.gain<=0} className="ml-auto px-3 py-1 text-xs rounded bg-ghoul-red text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">套用</button>
                    </div>
                  )}
                  {o.kind && r.why && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-1">
                      {isBest && <span className="text-emerald-400 font-bold shrink-0">最佳</span>}
                      <span>{r.why}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {results.some(r => r.ok && r.gain>0) && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                本回合最佳：選項 {bestIdx+1}，+{fmt(results[bestIdx].gain)} CP
              </div>
            )}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-gray-500">套用後失敗？</span>
              <button onClick={advanceRound} className="ml-auto px-3 py-1 text-xs rounded border border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">失敗 → 下一回合</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
