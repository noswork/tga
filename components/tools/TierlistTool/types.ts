import { Lang } from '../../../types';

export interface TierSlot {
  charId: string;
  teamId?: string; // if part of a team group
}

export interface TierRow {
  id: string;
  label: string;
  labelBg: string;
  charIds: string[];       // legacy / individual chars
  slots?: TierSlot[];      // new: supports team grouping
}

export interface Team {
  id: string;
  name: string;
  charIds: string[];
}

export type FilterCategory = 'ALL' | 'organization' | 'attribute' | 'rarity' | 'tactic';

export interface FilterState {
  category: FilterCategory;
  value: string;
}

export interface DragContext {
  charId?: string;
  teamId?: string;
  source: 'pool' | 'tier' | 'team';
  sourceTierId?: string;
  sourceSlotTeamId?: string; // when dragging a team group out of a tier
}

export interface TierlistSaveState {
  version: 1;
  tiers: TierRow[];
  bgColor: string;
  teams: Team[];
}

export interface TierlistToolProps {
  lang: Lang;
  onClose: () => void;
}
