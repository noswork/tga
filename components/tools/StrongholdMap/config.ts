export const STORAGE_KEYS = {
  marks: 'stronghold-marks',
  annotations: 'stronghold-annotations',
  mapVersion: 'stronghold-map-version',
} as const;

// --- MAP CONFIGURATION ---
export const V3_MAP_CONFIG = {
  r: 40,
  maxEven: { x: 60, y: 100 },
  maxOdd: { x: 59, y: 101 },
  padding: 120,
  minScale: 0.225,
  maxScale: 3,
  panConstraint: 0.9,
};

export const V3_HEX_DX = 1.5 * V3_MAP_CONFIG.r;
export const V3_HEX_DY = Math.sqrt(3) * V3_MAP_CONFIG.r;
export const V3_HEX_H = V3_HEX_DY;

// Main City Group Definition
export const V3_MAIN_CITY_CENTER = { x: 30, y: 50 };
export const V3_MAIN_CITY_CELLS = new Set([
  "29,49", "29,51",
  "30,48", "30,50", "30,52",
  "31,49", "31,51"
]);

// Building Locations
export const V3_BUILDING_DATA: Record<string, number[][]> = {
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

export const V3_ICON_IMAGES: Record<string, string> = {
  mainCity: '/assets/tools/StrongholdMap/city.png',
  building: '/assets/tools/StrongholdMap/building.png',
  house: '/assets/tools/StrongholdMap/house.png',
  hospital: '/assets/tools/StrongholdMap/hospital.png',
  fortress: '/assets/tools/StrongholdMap/fortress.png',
  organization: '/assets/tools/StrongholdMap/org.png',
  block: '/assets/tools/StrongholdMap/block.png',
};

export const WATERMARK_TILES = Array.from({ length: 300 });
export const SIZE_OPTIONS = [8, 12, 24, 48, 96];
export const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

// ============================================================
// v1 地圖配置
// 寬度: 18 格，高度: 33 格，起始點: (0, 0) 左上角
// ============================================================
export const V1_MAP_CONFIG = {
  r: 40,
  maxEven: { x: 18, y: 32 },
  maxOdd: { x: 17, y: 33 },
  padding: 80,
  minScale: 0.5,
  maxScale: 3,
  panConstraint: 0.9,
};

export const V1_HEX_DX = 1.5 * V1_MAP_CONFIG.r;
export const V1_HEX_DY = Math.sqrt(3) * V1_MAP_CONFIG.r;
export const V1_HEX_H = V1_HEX_DY;

// v1 主城（皇冠）
export const V1_MAIN_CITY_CENTER = { x: 9, y: 17 };
export const V1_MAIN_CITY_CELLS = new Set(["9,17"]);

// v1 建築位置數據
export const V1_BUILDING_DATA: Record<string, number[][]> = {
  city: [[9, 17]],
  org: [
    [0, 18], [1, 5], [1, 29], [7, 1], [11, 1],
    [17, 5], [17, 29], [18, 24]
  ],
  house: [
    [4, 14], [4, 20], [5, 9], [5, 25],
    [9, 7], [9, 27],
    [13, 9], [13, 25], [14, 14], [14, 20]
  ],
  building: [
    [7, 19], [9, 13], [11, 19]
  ],
};

// v1 圖標映射
export const V1_ICON_IMAGES: Record<string, string> = {
  city: '/assets/tools/StrongholdMap/city.png',
  org: '/assets/tools/StrongholdMap/org.png',
  house: '/assets/tools/StrongholdMap/house.png',
  building: '/assets/tools/StrongholdMap/building.png',
};

// ============================================================
// v2 地圖配置
// 寬度: 50 格，高度: 81 格，起始點: (0, 0) 左上角
// ============================================================
export const V2_MAP_CONFIG = {
  r: 40,
  maxEven: { x: 50, y: 80 },
  maxOdd: { x: 49, y: 81 },
  padding: 100,
  minScale: 0.25,
  maxScale: 3,
  panConstraint: 0.9,
};

export const V2_HEX_DX = 1.5 * V2_MAP_CONFIG.r;
export const V2_HEX_DY = Math.sqrt(3) * V2_MAP_CONFIG.r;
export const V2_HEX_H = V2_HEX_DY;

// v2 主城
export const V2_MAIN_CITY_CENTER = { x: 25, y: 41 };
export const V2_MAIN_CITY_CELLS = new Set(["25,41"]);

// v2 建築位置數據
export const V2_BUILDING_DATA: Record<string, number[][]> = {
  city: [[25, 41]],
  org: [
    [9, 11], [21, 1], [36, 6], [46, 20], [48, 28],
    [48, 38], [49, 49], [44, 66], [34, 76], [21, 79],
    [15, 75], [9, 73], [5, 67], [1, 47], [2, 26], [5, 17]
  ],
  house: [
    [11, 27], [16, 22], [22, 16], [28, 16], [34, 22],
    [39, 27], [39, 37], [39, 49], [36, 58], [30, 64],
    [25, 69], [20, 64], [14, 58], [11, 49], [11, 37]
  ],
  building: [
    [19, 37], [25, 29], [31, 37], [29, 49], [21, 49]
  ],
};

// v2 圖標映射
export const V2_ICON_IMAGES: Record<string, string> = {
  city: '/assets/tools/StrongholdMap/city.png',
  org: '/assets/tools/StrongholdMap/org.png',
  house: '/assets/tools/StrongholdMap/house.png',
  building: '/assets/tools/StrongholdMap/building.png',
};

