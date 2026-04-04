import React, { useState } from 'react';
import { Lang, Character } from '../../../../types';
import { TierRow as TierRowType, TierSlot, Team, DragContext } from '../types';
import { translations } from '../../../../constants';
import { ChevronUp, ChevronDown, Pencil, Trash2, X } from 'lucide-react';
import { TierSettings } from './TierSettings';

// ── Individual char chip ──────────────────────────────────────────────────────

interface CharChipProps {
  char: Character;
  dragRef: React.RefObject<DragContext | null>;
  tierId: string;
  onDropBefore: (insertBeforeCharId: string) => void;
}

const CharChip: React.FC<CharChipProps> = ({ char, dragRef, tierId, onDropBefore }) => {
  const [dropSide, setDropSide] = useState<'left' | 'right' | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setDropSide(e.clientX < rect.left + rect.width / 2 ? 'left' : 'right');
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    onDropBefore(e.clientX < rect.left + rect.width / 2 ? char.id : `__after__${char.id}`);
    setDropSide(null);
  };

  return (
    <div
      className="relative flex-shrink-0"
      onDragOver={handleDragOver}
      onDragLeave={() => setDropSide(null)}
      onDrop={handleDrop}
    >
      {dropSide === 'left' && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-ghoul-red z-10 pointer-events-none" />}
      {dropSide === 'right' && <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-ghoul-red z-10 pointer-events-none" />}
      <div
        draggable
        title={char.name}
        onDragStart={(e) => {
          e.stopPropagation();
          dragRef.current = { charId: char.id, source: 'tier', sourceTierId: tierId };
        }}
        className="relative w-[68px] h-[68px] cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
      >
        <img src={`/assets/heroes/bg/TYJS_bg_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" alt="" draggable={false} />
        <img src={`/assets/heroes/head/${char.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" alt={char.name} draggable={false} />
        <img src={`/assets/heroes/frame/TYJS_frame_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" draggable={false} />
      </div>
    </div>
  );
};

// ── Team group block ──────────────────────────────────────────────────────────

interface TeamGroupProps {
  teamId: string;
  teamName: string;
  chars: Character[];
  dragRef: React.RefObject<DragContext | null>;
  tierId: string;
  onRemove: () => void;
}

const TeamGroup: React.FC<TeamGroupProps> = ({ teamId, teamName, chars, dragRef, tierId, onRemove }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative flex-shrink-0 flex flex-col items-center gap-0.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="text-[9px] font-tech text-blue-300 uppercase tracking-wider truncate max-w-[140px] px-1 leading-tight">
        {teamName}
      </div>
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          dragRef.current = { source: 'tier', sourceTierId: tierId, teamId, sourceSlotTeamId: teamId };
        }}
        className="flex gap-0.5 cursor-grab active:cursor-grabbing border border-blue-500/40 bg-blue-900/20 p-0.5 hover:border-blue-400/70 transition-colors"
      >
        {chars.map((char) => (
          <div key={char.id} className="relative w-[52px] h-[52px] flex-shrink-0">
            <img src={`/assets/heroes/bg/TYJS_bg_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover" alt="" draggable={false} />
            <img src={`/assets/heroes/head/${char.id}_head.png`} className="absolute inset-0 w-full h-full object-cover" alt={char.name} draggable={false} />
            <img src={`/assets/heroes/frame/TYJS_frame_head_${char.rarity}.png`} className="absolute inset-0 w-full h-full object-cover pointer-events-none" alt="" draggable={false} />
          </div>
        ))}
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 flex items-center justify-center z-20 hover:bg-red-500"
        >
          <X size={8} className="text-white" />
        </button>
      )}
    </div>
  );
};

// ── TierRow ───────────────────────────────────────────────────────────────────

interface TierRowProps {
  lang: Lang;
  row: TierRowType;
  slots: TierSlot[];
  allChars: Character[];
  teams: Team[];
  dragRef: React.RefObject<DragContext | null>;
  isFirst: boolean;
  isLast: boolean;
  isEditing: boolean;
  onDrop: (targetTierId: string, insertBeforeCharId?: string) => void;
  onRemoveTeamFromTier: (tierId: string, teamId: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSaveSettings: (label: string, labelBg: string) => void;
  onCancelEdit: () => void;
}

export const TierRow: React.FC<TierRowProps> = ({
  lang, row, slots, allChars, teams, dragRef, isFirst, isLast, isEditing,
  onDrop, onRemoveTeamFromTier, onMoveUp, onMoveDown, onEdit, onDelete, onSaveSettings, onCancelEdit,
}) => {
  const t = translations[lang].tools.tierlist;
  const [isOver, setIsOver] = useState(false);

  const handleZoneDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsOver(true); };
  const handleZoneDragLeave = () => setIsOver(false);
  const handleZoneDrop = (e: React.DragEvent) => { e.preventDefault(); setIsOver(false); onDrop(row.id); };

  const handleChipDropBefore = (insertId: string) => {
    if (insertId.startsWith('__after__')) {
      const afterId = insertId.replace('__after__', '');
      const idx = slots.findIndex((s) => s.charId === afterId && !s.teamId);
      const nextSlot = slots.slice(idx + 1).find((s) => !s.teamId);
      onDrop(row.id, nextSlot?.charId);
    } else {
      onDrop(row.id, insertId);
    }
  };

  // Build render items: group slots by teamId, individual slots stay as chars
  type RenderItem =
    | { kind: 'char'; slot: TierSlot; char: Character }
    | { kind: 'team'; teamId: string; teamName: string; chars: Character[] };

  const renderItems: RenderItem[] = [];
  const seenTeams = new Set<string>();

  for (const slot of slots) {
    if (slot.teamId) {
      if (!seenTeams.has(slot.teamId)) {
        seenTeams.add(slot.teamId);
        const team = teams.find((t) => t.id === slot.teamId);
        const teamSlots = slots.filter((s) => s.teamId === slot.teamId);
        const chars = teamSlots
          .map((s) => allChars.find((c) => c.id === s.charId))
          .filter(Boolean) as Character[];
        renderItems.push({ kind: 'team', teamId: slot.teamId, teamName: team?.name ?? slot.teamId, chars });
      }
    } else {
      const char = allChars.find((c) => c.id === slot.charId);
      if (char) renderItems.push({ kind: 'char', slot, char });
    }
  }

  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <div className="flex items-stretch min-h-[80px]">
        {/* Label */}
        <div
          className="flex-shrink-0 w-[60px] flex items-center justify-center font-bold text-white text-lg font-serif select-none"
          style={{ backgroundColor: row.labelBg }}
        >
          {row.label}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={handleZoneDragOver}
          onDragLeave={handleZoneDragLeave}
          onDrop={handleZoneDrop}
          className={`flex-1 flex flex-wrap gap-1.5 p-2 min-h-[80px] border-l border-gray-700 transition-colors items-start content-start ${isOver ? 'bg-ghoul-red/10' : 'bg-black/20'}`}
        >
          {renderItems.map((item, idx) =>
            item.kind === 'char' ? (
              <CharChip
                key={`${item.char.id}-${idx}`}
                char={item.char}
                dragRef={dragRef}
                tierId={row.id}
                onDropBefore={handleChipDropBefore}
              />
            ) : (
              <TeamGroup
                key={item.teamId}
                teamId={item.teamId}
                teamName={item.teamName}
                chars={item.chars}
                dragRef={dragRef}
                tierId={row.id}
                onRemove={() => onRemoveTeamFromTier(row.id, item.teamId)}
              />
            )
          )}
          {renderItems.length === 0 && (
            <div className="flex items-center justify-center w-full text-xs font-tech text-gray-600 select-none pointer-events-none">
              — drop here —
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-2 border-l border-gray-800 bg-black/30">
          <button onClick={onMoveUp} disabled={isFirst} title={t.moveUp} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors">
            <ChevronUp size={14} />
          </button>
          <button onClick={onEdit} title={t.editRow} className="p-1 text-gray-500 hover:text-ghoul-red transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} title={t.deleteRow} className="p-1 text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
          <button onClick={onMoveDown} disabled={isLast} title={t.moveDown} className="p-1 text-gray-500 hover:text-white disabled:opacity-20 transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {isEditing && (
        <TierSettings lang={lang} row={row} onSave={onSaveSettings} onCancel={onCancelEdit} />
      )}
    </div>
  );
};
