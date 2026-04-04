import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Character } from '../../../types';
import { translations, charactersData } from '../../../constants';
import { TierlistToolProps, TierRow, TierSlot, Team, FilterState, DragContext } from './types';
import { loadState, saveState, defaultTiers, generateId, exportTierlist } from './utils';
import { FilterBar } from './components/FilterBar';
import { TierRow as TierRowComponent } from './components/TierRow';
import { CharacterPool } from './components/CharacterPool';
import { TeamBuilder } from './components/TeamBuilder';
import { Plus, Download, X, RotateCcw, Users } from 'lucide-react';

function applyFilter(chars: Character[], filter: FilterState): Character[] {
  if (filter.category === 'ALL') return chars;
  return chars.filter((c) => {
    switch (filter.category) {
      case 'organization': return c.organization === filter.value;
      case 'attribute': return c.attribute === filter.value;
      case 'rarity': return c.rarity === filter.value;
      case 'tactic': return c.tactic === filter.value;
      default: return true;
    }
  });
}

// Migrate legacy charIds to slots
function migrateRow(row: TierRow): TierRow {
  if (row.slots) return row;
  return { ...row, slots: row.charIds.map((id) => ({ charId: id })) };
}

export const TierlistTool: React.FC<TierlistToolProps> = ({ lang, onClose }) => {
  const t = translations[lang].tools.tierlist;
  const saved = loadState();

  const [tiers, setTiers] = useState<TierRow[]>(
    (saved?.tiers ?? defaultTiers()).map(migrateRow)
  );
  const [bgColor, setBgColor] = useState(saved?.bgColor ?? '#18181b');
  const [teams, setTeams] = useState<Team[]>(saved?.teams ?? []);
  const [filterState, setFilterState] = useState<FilterState>({ category: 'ALL', value: 'ALL' });
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false);

  const tierlistRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragContext | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // Sync charIds from slots before saving
      const tiersToSave = tiers.map((r) => ({
        ...r,
        charIds: (r.slots ?? []).map((s) => s.charId),
      }));
      saveState({ version: 1, tiers: tiersToSave, bgColor, teams });
    }, 300);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [tiers, bgColor, teams]);

  const allChars = charactersData as Character[];

  // Only individually-placed chars are hidden from pool (team chars can still appear)
  const assignedIds = new Set(
    tiers.flatMap((r) => (r.slots ?? []).filter((s) => !s.teamId).map((s) => s.charId))
  );
  const filteredChars = applyFilter(allChars, filterState);
  const poolChars = filteredChars.filter((c) => !assignedIds.has(c.id));

  const handleDrop = useCallback((targetTierId: string, insertBeforeCharId?: string) => {
    const ctx = dragRef.current;
    if (!ctx) return;
    dragRef.current = null;

    setTiers((prev) => {
      const next = prev.map((row) => ({ ...row, slots: [...(row.slots ?? [])] }));

      // Remove from source tier if dragging from tier
      if (ctx.source === 'tier' && ctx.sourceTierId) {
        const src = next.find((r) => r.id === ctx.sourceTierId);
        if (src) {
          if (ctx.sourceSlotTeamId) {
            // Remove entire team group
            src.slots = src.slots!.filter((s) => s.teamId !== ctx.sourceSlotTeamId);
          } else if (ctx.charId) {
            src.slots = src.slots!.filter((s) => !(s.charId === ctx.charId && !s.teamId));
          }
        }
      }

      const target = next.find((r) => r.id === targetTierId);
      if (!target) return next;

      // Build new slots to insert
      let newSlots: TierSlot[];
      if (ctx.source === 'team' && ctx.teamId) {
        const team = teams.find((t) => t.id === ctx.teamId);
        if (!team) return next;
        // Remove any existing slots for this team in target
        target.slots = target.slots!.filter((s) => s.teamId !== ctx.teamId);
        newSlots = team.charIds.map((id) => ({ charId: id, teamId: ctx.teamId }));
      } else if (ctx.charId) {
        // Individual char — skip if already present as individual
        if (target.slots!.some((s) => s.charId === ctx.charId && !s.teamId)) return next;
        newSlots = [{ charId: ctx.charId }];
      } else {
        return next;
      }

      // Insert at position
      if (insertBeforeCharId) {
        const idx = target.slots!.findIndex((s) => s.charId === insertBeforeCharId && !s.teamId);
        if (idx >= 0) {
          target.slots!.splice(idx, 0, ...newSlots);
        } else {
          target.slots!.push(...newSlots);
        }
      } else {
        target.slots!.push(...newSlots);
      }

      return next;
    });
  }, [teams]);

  const handleDropToPool = useCallback(() => {
    const ctx = dragRef.current;
    if (!ctx || ctx.source !== 'tier') return;
    dragRef.current = null;
    setTiers((prev) =>
      prev.map((row) => {
        if (row.id !== ctx.sourceTierId) return row;
        if (ctx.sourceSlotTeamId) {
          return { ...row, slots: (row.slots ?? []).filter((s) => s.teamId !== ctx.sourceSlotTeamId) };
        }
        if (ctx.charId) {
          return { ...row, slots: (row.slots ?? []).filter((s) => !(s.charId === ctx.charId && !s.teamId)) };
        }
        return row;
      })
    );
  }, []);

  const addTier = () => setTiers((prev) => [...prev, { id: generateId(), label: '?', labelBg: '#6b7280', charIds: [], slots: [] }]);
  const deleteTier = (id: string) => setTiers((prev) => prev.filter((r) => r.id !== id));
  const moveRow = (id: string, dir: -1 | 1) => {
    setTiers((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };
  const saveRowSettings = (id: string, label: string, labelBg: string) => {
    setTiers((prev) => prev.map((r) => (r.id === id ? { ...r, label, labelBg } : r)));
    setEditingRowId(null);
  };
  const resetTiers = () => setTiers((prev) => prev.map((r) => ({ ...r, slots: [], charIds: [] })));

  const handleExport = () => {
    const exportData = tiers.map((row) => ({
      label: row.label,
      labelBg: row.labelBg,
      chars: (row.slots ?? [])
        .map((s) => allChars.find((c) => c.id === s.charId))
        .filter(Boolean)
        .map((c) => ({ id: c!.id, rarity: c!.rarity })),
    }));
    exportTierlist(exportData, bgColor, () => setIsExporting(true), () => setIsExporting(false));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <FilterBar
          lang={lang}
          filterState={filterState}
          onChange={setFilterState}
          rightSlot={
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-tech text-gray-400 uppercase tracking-wider hidden lg:block">{t.bgColor}</span>
                <div className="relative w-7 h-7 rounded-sm border border-gray-600 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0" style={{ backgroundColor: bgColor }} />
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                </div>
              </div>
              <button onClick={addTier} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-300 hover:border-ghoul-red hover:text-white transition-colors rounded-sm">
                <Plus size={12} /> {t.addTier}
              </button>
              <button onClick={() => setTeamBuilderOpen(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-300 hover:border-blue-400 hover:text-blue-300 transition-colors rounded-sm">
                <Users size={12} /> {t.addTeam}
              </button>
              <button onClick={resetTiers} title="重置所有評級" className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-tech font-bold border border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 transition-colors rounded-sm">
                <RotateCcw size={12} />
              </button>
              <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-tech font-bold bg-ghoul-red text-white hover:bg-red-700 disabled:opacity-50 transition-colors rounded-sm">
                <Download size={12} /> {isExporting ? t.exporting : t.exportImage}
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto" style={{ backgroundColor: bgColor }}>
        <div ref={tierlistRef} className="max-w-4xl mx-auto px-4 py-4">
          <div className="border border-gray-700 overflow-hidden">
            {tiers.map((row, idx) => {
              const slots = row.slots ?? [];
              return (
                <TierRowComponent
                  key={row.id}
                  lang={lang}
                  row={row}
                  slots={slots}
                  allChars={allChars}
                  teams={teams}
                  dragRef={dragRef}
                  isFirst={idx === 0}
                  isLast={idx === tiers.length - 1}
                  isEditing={editingRowId === row.id}
                  onDrop={handleDrop}
                  onRemoveTeamFromTier={(tierId, teamId) =>
                    setTiers((prev) => prev.map((r) =>
                      r.id === tierId ? { ...r, slots: (r.slots ?? []).filter((s) => s.teamId !== teamId) } : r
                    ))
                  }
                  onMoveUp={() => moveRow(row.id, -1)}
                  onMoveDown={() => moveRow(row.id, 1)}
                  onEdit={() => setEditingRowId(editingRowId === row.id ? null : row.id)}
                  onDelete={() => deleteTier(row.id)}
                  onSaveSettings={(label, labelBg) => saveRowSettings(row.id, label, labelBg)}
                  onCancelEdit={() => setEditingRowId(null)}
                />
              );
            })}
          </div>

          <CharacterPool
            lang={lang}
            chars={poolChars}
            allChars={allChars}
            teams={teams}
            dragRef={dragRef}
            onDrop={handleDropToPool}
            onDeleteTeam={(id) => setTeams((prev) => prev.filter((t) => t.id !== id))}
          />
        </div>
      </div>

      {teamBuilderOpen && (
        <TeamBuilder
          lang={lang}
          allChars={allChars}
          onSave={(team) => { setTeams((prev) => [...prev, team]); setTeamBuilderOpen(false); }}
          onCancel={() => setTeamBuilderOpen(false)}
        />
      )}
    </div>
  );
};
