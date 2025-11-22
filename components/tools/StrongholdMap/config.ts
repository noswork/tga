// Icon Image URLs - Import images using Vite's asset handling
import cityIcon from '../../../assets/tools/StrongholdMap/city.png';
import buildingIcon from '../../../assets/tools/StrongholdMap/building.png';
import houseIcon from '../../../assets/tools/StrongholdMap/house.png';
import hospitalIcon from '../../../assets/tools/StrongholdMap/hospital.png';
import fortressIcon from '../../../assets/tools/StrongholdMap/fortress.png';
import orgIcon from '../../../assets/tools/StrongholdMap/org.png';
import blockIcon from '../../../assets/tools/StrongholdMap/block.png';

// --- MAP CONFIGURATION ---
export const MAP_CONFIG = {
  r: 40,
  maxEven: { x: 60, y: 100 },
  maxOdd: { x: 59, y: 101 },
  padding: 120,
  minScale: 0.225,
  maxScale: 3,
  panConstraint: 0.9,
};

export const HEX_DX = 1.5 * MAP_CONFIG.r;
export const HEX_DY = Math.sqrt(3) * MAP_CONFIG.r;
export const HEX_H = HEX_DY;

// Main City Group Definition
export const MAIN_CITY_CENTER = { x: 30, y: 50 };
export const MAIN_CITY_CELLS = new Set([
  "29,49", "29,51",
  "30,48", "30,50", "30,52",
  "31,49", "31,51"
]);

// Building Locations
export const BUILDING_DATA: Record<string, number[][]> = {
  mainCity: [[30, 50]],
  building: [[26, 60], [34, 60], [37, 45], [30, 36], [23, 45]],
  house: [
    [18, 74], [12, 56], [12, 44], [12, 32], [18, 26], 
    [24, 20], [36, 20], [42, 26], [48, 32], [48, 44], 
    [48, 56], [42, 74], [36, 80], [30, 86], [24, 80]
  ],
  hospital: [
    [23, 79], [12, 58], [18, 38], [23, 21], [41, 25], 
    [42, 38], [43, 73], [30, 74], [35, 61], [28, 48], [30, 34]
  ],
  fortress: [[41, 39], [19, 39], [30, 72]],
  organization: [
    [33, 99], [13, 85], [7, 67], [4, 58], [7, 21], 
    [14, 14], [21, 7], [27, 7], [39, 7], [46, 14], 
    [53, 21], [56, 44], [53, 67], [50, 76], [47, 85], [40, 92]
  ],
  block: [
    [31, 71], [32, 70], [33, 69], [34, 68], [35, 67], [36, 66], [37, 65], [38, 64], 
    [39, 63], [40, 62], [41, 61], [41, 59], [41, 57], [41, 55], [41, 53], [41, 51], 
    [41, 49], [41, 47], [41, 45], [41, 43], [41, 41], [40, 38], [39, 37], [38, 36], 
    [37, 35], [36, 34], [35, 33], [34, 32], [33, 31], [32, 30], [31, 29], [30, 28], 
    [20, 38], [21, 37], [22, 36], [23, 35], [24, 34], [25, 33], [26, 32], [27, 31], 
    [28, 30], [29, 29], [19, 41], [19, 43], [19, 45], [19, 47], [19, 49], [19, 51], 
    [19, 53], [19, 55], [19, 57], [19, 59], [19, 61], [20, 62], [21, 63], [22, 64], 
    [23, 65], [24, 66], [25, 67], [26, 68], [27, 69], [28, 70], [29, 71]
  ]
};

export const ICON_IMAGES: Record<string, string> = {
  mainCity: cityIcon,
  building: buildingIcon,
  house: houseIcon,
  hospital: hospitalIcon,
  fortress: fortressIcon,
  organization: orgIcon,
  block: blockIcon
};

export const WATERMARK_TILES = Array.from({ length: 300 });
export const SIZE_OPTIONS = [8, 12, 24, 48, 96];
export const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

