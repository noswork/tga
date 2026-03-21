/**
 * Combat Power calculations derived from strategicArenaCP + base stats.
 * baseCp  = arenaCP - statsBonus(1x)
 * cellCp3x = baseCp + statsBonus(3x)
 * cellCp4x = baseCp + statsBonus(4x)  === arenaCP
 */

function statsBonus1x(atk: number, def: number, hp: number) {
  return (
    (800 + (atk * 0.06 + 5000) * 1.1) +
    (800 + (0.06 * def + 3600) * 1.3) +
    (800 + (0.06 * hp + 78600) * 0.07)
  );
}

function statsBonus3x(atk: number, def: number, hp: number) {
  return (
    (890 + (atk * 0.045 + 5000) * 1.1) +
    (890 + (0.045 * def + 3600) * 1.3) +
    (880 + (0.045 * hp + 78600) * 0.07)
  );
}

export function calcBaseCp(arenaCP: number, atk: number, def: number, hp: number): number {
  return Math.round(arenaCP - statsBonus1x(atk, def, hp));
}

export function calcCellCp3x(arenaCP: number, atk: number, def: number, hp: number): number {
  const base = calcBaseCp(arenaCP, atk, def, hp);
  return Math.round(base + statsBonus3x(atk, def, hp));
}

export function calcCellCp4x(arenaCP: number, atk: number, def: number, hp: number): number {
  // base + statsBonus1x = arenaCP
  return arenaCP;
}
