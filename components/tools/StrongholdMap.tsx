
import React, { useState, useEffect, useRef } from 'react';
import { Lang } from '../../types';
import { translations } from '../../constants';
import { X, Target, Settings, Download, CheckCircle, Trash2, Activity, Eraser, Monitor, Layers, Image as ImageIcon } from 'lucide-react';

interface StrongholdMapProps {
  lang: Lang;
  onClose: () => void;
}

// --- MAP CONFIGURATION ---
const MAP_CONFIG = {
  r: 40,
  maxEven: { x: 60, y: 100 },
  maxOdd: { x: 59, y: 101 },
  padding: 120,
  minScale: 0.225,
  maxScale: 3,
  panConstraint: 0.9,
};

const HEX_DX = 1.5 * MAP_CONFIG.r;
const HEX_DY = Math.sqrt(3) * MAP_CONFIG.r;
const HEX_H = HEX_DY;

// Main City Group Definition
const MAIN_CITY_CENTER = { x: 30, y: 50 };
const MAIN_CITY_CELLS = new Set([
  "29,49", "29,51",
  "30,48", "30,50", "30,52",
  "31,49", "31,51"
]);

// Building Locations
const BUILDING_DATA: Record<string, number[][]> = {
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

// Icon Image URLs
const iconPath = (filename: string) => `../../assets/tools/StrongholdMap/${filename}`;

const ICON_IMAGES: Record<string, string> = {
  mainCity: iconPath('city.png'),
  building: iconPath('building.png'),
  house: iconPath('house.png'),
  hospital: iconPath('hospital.png'),
  fortress: iconPath('fortress.png'),
  organization: iconPath('org.png'),
  block: iconPath('block.png')
};

const keyFor = (x: number, y: number) => `${x},${y}`;
const normalizeHexColor = (hex: string) => {
  let formatted = String(hex || '').trim();
  if (!formatted.startsWith('#')) formatted = `#${formatted}`;
  if (formatted.length === 4) {
    formatted = `#${formatted.slice(1).split('').map((char) => char + char).join('')}`;
  }
  return formatted.length === 7 ? formatted.toLowerCase() : '#ff6961';
};
const hexToRgba = (hex: string, alpha: number) => {
  const n = normalizeHexColor(hex);
  const bigint = parseInt(n.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const inBounds = (x: number, y: number) => {
  if ((x + y) % 2 !== 0) return false;
  if (x % 2 === 0) return x >= 0 && x <= MAP_CONFIG.maxEven.x && y >= 0 && y <= MAP_CONFIG.maxEven.y;
  return x >= 1 && x <= MAP_CONFIG.maxOdd.x && y >= 1 && y <= MAP_CONFIG.maxOdd.y;
};
const computeCenter = (x: number, y: number) => ({ cx: x * HEX_DX, cy: y * (HEX_DY / 2) });

const WATERMARK_TILES = Array.from({ length: 300 });

export const StrongholdMap: React.FC<StrongholdMapProps> = ({ lang, onClose }) => {
  const t = translations[lang].tools.map;
  const qT = t.quality;
  const svgRef = useRef<SVGSVGElement>(null);
  const [markMode, setMarkMode] = useState<'add' | 'remove'>('add');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [isExporting, setIsExporting] = useState(false);
  const [exportQuality, setExportQuality] = useState(2); // Default to 2x (High)

  const state = useRef({
    scale: 0.5,
    translate: { x: 0, y: 0 },
    isPanning: false,
    dragging: false,
    startPointer: { x: 0, y: 0 }, 
    lastPointer: { x: 0, y: 0 },
    pointers: new Map<number, {x: number, y: number}>(),
    cellMap: new Map<string, any>(),
    markedCells: new Map<string, any>(),
    lastHoveredKey: null as string | null,
  });

  const applyTransform = () => {
    const { scale, translate, lastHoveredKey } = state.current;
    const matrix = `matrix(${scale}, 0, 0, ${scale}, ${translate.x}, ${translate.y})`;
    if (!svgRef.current) return;
    
    ['hex-layer', 'mark-layer', 'highlight-layer', 'building-layer', 'label-layer'].forEach(id => {
      const el = svgRef.current!.querySelector(`#${id}`);
      if(el) el.setAttribute("transform", matrix);
    });
    
    if (lastHoveredKey) {
       const cell = state.current.cellMap.get(lastHoveredKey);
       const labelGroup = svgRef.current.querySelector('#hover-label');
       if (cell && labelGroup) {
         labelGroup.setAttribute("transform", `translate(${cell.cx}, ${cell.cy}) scale(${1/scale})`);
       }
    }
  };

  // Attach non-passive wheel listener to strictly prevent page scroll
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = state.current;
      const intensity = 1.1;
      const direction = e.deltaY < 0 ? intensity : 1 / intensity;
      const targetScale = Math.min(Math.max(s.scale * direction, MAP_CONFIG.minScale), MAP_CONFIG.maxScale);
      
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      
      const wx = (mx - s.translate.x) / s.scale;
      const wy = (my - s.translate.y) / s.scale;
      
      s.scale = targetScale;
      s.translate.x = mx - wx * s.scale;
      s.translate.y = my - wy * s.scale;
      
      requestAnimationFrame(applyTransform);
    };

    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const hexLayer = svg.querySelector('#hex-layer') as SVGGElement;
    const markLayer = svg.querySelector('#mark-layer') as SVGGElement;
    const buildingLayer = svg.querySelector('#building-layer') as SVGGElement;
    const highlightLayer = svg.querySelector('#highlight-layer') as SVGGElement;
    const labelLayer = svg.querySelector('#label-layer') as SVGGElement;

    hexLayer.innerHTML = '';
    markLayer.innerHTML = '';
    buildingLayer.innerHTML = '';
    highlightLayer.innerHTML = '';
    labelLayer.innerHTML = '';
    state.current.cellMap.clear();

    const halfH = HEX_H / 2;
    const halfR = MAP_CONFIG.r / 2;
    const points = `${MAP_CONFIG.r},0 ${halfR},${halfH} ${-halfR},${halfH} ${-MAP_CONFIG.r},0 ${-halfR},${-halfH} ${halfR},${-halfH}`;
    const hexFragment = document.createDocumentFragment();

    for (let y = 0; y <= MAP_CONFIG.maxOdd.y; y++) {
      const startX = y % 2 === 0 ? 0 : 1;
      const maxX = y % 2 === 0 ? MAP_CONFIG.maxEven.x : MAP_CONFIG.maxOdd.x;
      
      for (let x = startX; x <= maxX; x += 2) {
        if (!inBounds(x, y)) continue;
        const { cx, cy } = computeCenter(x, y);
        
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute("class", "hex-group");
        group.setAttribute("data-x", String(x));
        group.setAttribute("data-y", String(y));
        group.setAttribute("transform", `translate(${cx}, ${cy})`);

        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("class", "hex-polygon");
        polygon.setAttribute("points", points);
        group.appendChild(polygon);
        hexFragment.appendChild(group);

        state.current.cellMap.set(keyFor(x, y), {
          group, polygon, cx, cy, points
        });
      }
    }
    hexLayer.appendChild(hexFragment);

    // Place Buildings with Images
    for (const [type, coords] of Object.entries(BUILDING_DATA)) {
      const imageUrl = ICON_IMAGES[type];
      if (!imageUrl) continue;

      coords.forEach(([x, y]) => {
        if (!inBounds(x, y)) return;
        const cell = state.current.cellMap.get(keyFor(x, y));
        if (!cell) return;

        let size = 60;
        if (type === 'mainCity') size = 90;
        if (type === 'block') size = 50;

        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("href", imageUrl);
        image.setAttribute("class", "hex-icon");
        image.setAttribute("x", String(-size / 2));
        image.setAttribute("y", String(-size / 2));
        image.setAttribute("width", String(size));
        image.setAttribute("height", String(size));
        image.setAttribute("transform", `translate(${cell.cx}, ${cell.cy})`);
        
        buildingLayer.appendChild(image);
      });
    }

    const hoverLabelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    hoverLabelGroup.setAttribute("id", "hover-label");
    hoverLabelGroup.style.pointerEvents = "none";
    hoverLabelGroup.style.display = "none"; 
    
    const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    labelBg.setAttribute("class", "map-label-bg");
    labelBg.setAttribute("height", "26");
    
    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelText.setAttribute("class", "map-label-text");
    labelText.setAttribute("y", "1");

    hoverLabelGroup.appendChild(labelBg);
    hoverLabelGroup.appendChild(labelText);
    labelLayer.appendChild(hoverLabelGroup);

    try {
      const saved = localStorage.getItem('stronghold-marks');
      if (saved) {
        JSON.parse(saved).forEach((m: any) => createMark(m.x, m.y, m.color));
      }
    } catch (e) {}

    applyTransform();
  }, []);

  const createMark = (x: number, y: number, color: string) => {
    const key = keyFor(x, y);
    const cell = state.current.cellMap.get(key);
    if (!cell) return;
    
    if (state.current.markedCells.has(key)) {
      const existing = state.current.markedCells.get(key).el;
      existing.style.fill = hexToRgba(color, 0.32);
      existing.style.stroke = hexToRgba(color, 0.94);
      state.current.markedCells.set(key, {x,y,color, el: existing});
      return;
    }

    const markPoly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    markPoly.setAttribute("points", cell.points);
    markPoly.setAttribute("transform", `translate(${cell.cx}, ${cell.cy})`);
    markPoly.style.fill = hexToRgba(color, 0.32);
    markPoly.style.stroke = hexToRgba(color, 0.94);
    markPoly.setAttribute("class", "hex-mark marked");
    
    const markLayer = svgRef.current!.querySelector('#mark-layer');
    markLayer?.appendChild(markPoly);
    
    state.current.markedCells.set(key, { x, y, color, el: markPoly });
  };

  const removeMark = (x: number, y: number) => {
    const key = keyFor(x, y);
    const data = state.current.markedCells.get(key);
    if (data) {
      data.el.remove();
      state.current.markedCells.delete(key);
    }
  };

  const saveMarks = () => {
    const arr = Array.from(state.current.markedCells.values()).map(v => ({x: v.x, y: v.y, color: v.color}));
    localStorage.setItem('stronghold-marks', JSON.stringify(arr));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const s = state.current;
    (e.target as Element).setPointerCapture(e.pointerId);
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (s.pointers.size === 1) {
      s.isPanning = true;
      s.dragging = false;
      s.startPointer = { x: e.clientX, y: e.clientY };
      s.lastPointer = { x: e.clientX, y: e.clientY };
      
      if (svgRef.current) {
         svgRef.current.classList.add('hex-map', 'panning');
         
         const highlightLayer = svgRef.current.querySelector('#highlight-layer');
         if (highlightLayer) highlightLayer.innerHTML = '';
         const hoverLabel = svgRef.current.querySelector('#hover-label') as HTMLElement;
         if (hoverLabel) hoverLabel.style.display = 'none';
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const s = state.current;
    if (!svgRef.current) return;

    if (s.pointers.has(e.pointerId)) {
      s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (s.pointers.size === 1 && s.isPanning) {
        const dx = e.clientX - s.lastPointer.x;
        const dy = e.clientY - s.lastPointer.y;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) s.dragging = true;
        s.translate.x += dx;
        s.translate.y += dy;
        s.lastPointer = { x: e.clientX, y: e.clientY };
        requestAnimationFrame(applyTransform);
      }
    }

    // 只有在沒有指針按下（沒有拖拽或平移）時才顯示高亮
    if (s.pointers.size === 0 && !s.dragging && !s.isPanning) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const group = target?.closest('.hex-group') as HTMLElement;
      
      const highlightLayer = svgRef.current.querySelector('#highlight-layer') as SVGGElement;
      const hoverLabel = svgRef.current.querySelector('#hover-label') as SVGGElement;
      const labelText = hoverLabel?.querySelector('text');
      const labelBg = hoverLabel?.querySelector('rect');
      
      if (highlightLayer) highlightLayer.innerHTML = '';

      if (group) {
        let x = Number(group.dataset.x);
        let y = Number(group.dataset.y);
        const key = keyFor(x, y);
        
        const isMainCity = MAIN_CITY_CELLS.has(key);
        let displayKey = key;
        let highlightKeys = [key];

        if (isMainCity) {
          displayKey = keyFor(MAIN_CITY_CENTER.x, MAIN_CITY_CENTER.y);
          highlightKeys = Array.from(MAIN_CITY_CELLS);
        }

        s.lastHoveredKey = displayKey;

        highlightKeys.forEach(k => {
          const cell = s.cellMap.get(k);
          if (cell) {
            const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            poly.setAttribute("points", cell.points);
            poly.setAttribute("transform", `translate(${cell.cx}, ${cell.cy})`);
            poly.setAttribute("fill", "none");
            poly.setAttribute("stroke", "#ef4444"); 
            poly.setAttribute("stroke-width", "3");
            poly.style.pointerEvents = "none";
            if (highlightLayer) highlightLayer.appendChild(poly);
          }
        });

        if (hoverLabel && labelText && labelBg) {
          const displayCell = s.cellMap.get(displayKey);
          if (displayCell) {
             hoverLabel.setAttribute("transform", `translate(${displayCell.cx}, ${displayCell.cy}) scale(${1/s.scale})`);
             hoverLabel.style.display = "block";
             labelText.textContent = displayKey;
             
             const width = displayKey.length * 9 + 24;
             labelBg.setAttribute("width", String(width));
             labelBg.setAttribute("x", String(-width/2));
             labelBg.setAttribute("y", "-13");
          }
        }
      } else {
        s.lastHoveredKey = null;
        if (hoverLabel) hoverLabel.style.display = "none";
      }
    } else {
       const highlightLayer = svgRef.current.querySelector('#highlight-layer');
       if (highlightLayer) highlightLayer.innerHTML = '';
       const hoverLabel = svgRef.current.querySelector('#hover-label') as HTMLElement;
       if (hoverLabel) hoverLabel.style.display = "none";
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const s = state.current;
    s.pointers.delete(e.pointerId);
    if (s.pointers.size === 0) {
      s.isPanning = false;
      if (svgRef.current) {
         svgRef.current.classList.remove('panning');
      }
      setTimeout(() => { s.dragging = false; }, 50);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (state.current.dragging) return;
    const target = e.target as Element;
    const group = target.closest('.hex-group') as HTMLElement;
    if (!group) return;

    let x = Number(group.dataset.x);
    let y = Number(group.dataset.y);
    let keysToProcess = [keyFor(x, y)];

    if (MAIN_CITY_CELLS.has(keyFor(x, y))) {
      keysToProcess = Array.from(MAIN_CITY_CELLS);
    }

    keysToProcess.forEach(k => {
      const [kx, ky] = k.split(',').map(Number);
      if (markMode === 'add') {
        createMark(kx, ky, selectedColor);
      } else {
        removeMark(kx, ky);
      }
    });
    
    saveMarks();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); 
    const s = state.current;
    const dist = Math.hypot(e.clientX - s.startPointer.x, e.clientY - s.startPointer.y);
    if (dist > 10) return;

    const processRemoval = (x: number, y: number) => {
      const key = keyFor(x, y);
      let keysToProcess = [key];
      if (MAIN_CITY_CELLS.has(key)) keysToProcess = Array.from(MAIN_CITY_CELLS);
      let removedAny = false;
      keysToProcess.forEach(k => {
        const [kx, ky] = k.split(',').map(Number);
        if (s.markedCells.has(k)) {
          removeMark(kx, ky);
          removedAny = true;
        }
      });
      if (removedAny) saveMarks();
    };

    const domTarget = document.elementFromPoint(e.clientX, e.clientY);
    const group = domTarget?.closest('.hex-group') as HTMLElement;

    if (group) {
      const x = Number(group.dataset.x);
      const y = Number(group.dataset.y);
      processRemoval(x, y);
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = (mx - s.translate.x) / s.scale;
    const wy = (my - s.translate.y) / s.scale;
    let closest = null;
    let minDst = Infinity;
    const HIT_RADIUS = MAP_CONFIG.r * 2.0; 

    for (const mark of s.markedCells.values()) {
        const cell = s.cellMap.get(keyFor(mark.x, mark.y));
        if (cell) {
            const dist = Math.sqrt((wx - cell.cx) ** 2 + (wy - cell.cy) ** 2);
            if (dist < minDst) {
                minDst = dist;
                closest = mark;
            }
        }
    }

    if (closest && minDst < HIT_RADIUS) {
        processRemoval(closest.x, closest.y);
    }
  };

  const handleExport = async () => {
    if (!svgRef.current) return;
    setIsExporting(true);
    // Allow UI to update
    await new Promise(r => setTimeout(r, 100));

    try {
      const svg = svgRef.current;
      const serializer = new XMLSerializer();
      const clone = svg.cloneNode(true) as SVGElement;
      const isDark = document.documentElement.classList.contains('dark');
      
      // Reset transforms for export so the whole map is visible
      ['hex-layer', 'mark-layer', 'building-layer'].forEach(id => 
        clone.querySelector(`#${id}`)?.removeAttribute('transform')
      );
      
      // Remove UI helpers
      clone.querySelector('#label-layer')?.remove(); 
      clone.querySelector('#highlight-layer')?.remove(); 
      
      // --- Embed images as Base64 ---
      const images = clone.querySelectorAll('image');
      if (images.length > 0) {
         await Promise.all(Array.from(images).map(async (img) => {
             const href = img.getAttribute('href');
             if (href) {
                 try {
                     const response = await fetch(href);
                     const blob = await response.blob();
                     await new Promise<void>((resolve) => {
                         const reader = new FileReader();
                         reader.onloadend = () => {
                             if (reader.result) {
                                 img.setAttribute('href', reader.result as string);
                             }
                             resolve();
                         };
                         reader.readAsDataURL(blob);
                     });
                 } catch (e) {
                     console.warn('Failed to embed image for export:', href);
                 }
             }
         }));
      }

      // High Resolution Logic
      const scale = exportQuality; 
      const w = (MAP_CONFIG.maxEven.x + 4) * HEX_DX;
      const h = (MAP_CONFIG.maxOdd.y + 4) * (HEX_DY/2);
      
      // Set viewBox to original logical size
      clone.setAttribute("viewBox", `-100 -100 ${w} ${h}`);
      // Set absolute width/height to SCALED size to force browser to rasterize at high res
      clone.setAttribute("width", String(w * scale));
      clone.setAttribute("height", String(h * scale));
      
      const style = document.createElement("style");
      const polyFill = isDark ? 'rgba(24, 24, 27, 0.5)' : '#ffffff';
      const polyStroke = isDark ? '#3f3f46' : '#e4e4e7';
      
      style.textContent = `
        .hex-polygon { fill: ${polyFill}; stroke: ${polyStroke}; stroke-width: 2; }
        .hex-mark { opacity: 0.5; }
        .hex-icon { opacity: 1; }
      `;
      clone.insertBefore(style, clone.firstChild);

      const blob = new Blob([serializer.serializeToString(clone)], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Canvas matches the scaled size
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = isDark ? '#09090b' : '#f4f4f5';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the pre-scaled SVG image onto the canvas
          ctx.drawImage(img, 0, 0, w * scale, h * scale);

          // --- WATERMARK START ---
          ctx.save();
          // Scale the context so we can use the original logical coordinates for positioning
          ctx.scale(scale, scale); 
          
          ctx.font = '700 32px "Rajdhani", monospace';
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const stepX = 300; 
          const stepY = 200; 
          const angle = -30 * (Math.PI / 180); 

          // Loop based on logical dimensions (w, h) since we applied ctx.scale
          for (let y = 0; y < h; y += stepY) {
            for (let x = -200; x < w; x += stepX) {
              ctx.save();
              const offsetX = (y / stepY) % 2 === 0 ? 0 : stepX / 2;
              ctx.translate(x + offsetX, y);
              ctx.rotate(angle);
              ctx.fillText("noswork", 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
          // --- WATERMARK END ---

          const link = document.createElement('a');
          link.download = `stronghold-map-${scale}x-${Date.now()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
        }
        setIsExporting(false);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
          console.error("Failed to load SVG blob as image");
          setIsExporting(false);
          URL.revokeObjectURL(url);
      }
      img.src = url;
    } catch (e) {
      console.error("Export failed", e);
      setIsExporting(false);
    }
  };

  const handleClearAll = () => {
    state.current.markedCells.forEach(v => removeMark(v.x, v.y));
    saveMarks();
  };

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

  return (
    <div className="w-full h-full bg-ccg-light dark:bg-ghoul-black text-gray-900 dark:text-white flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-300 relative z-10 overscroll-none">
      
      {/* LEFT PANEL (Controls) */}
      <div className="w-full lg:w-80 bg-white dark:bg-[#18181b] border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-zinc-800 flex flex-col z-20 shadow-2xl relative transition-colors duration-300 order-2 lg:order-1 h-auto max-h-[45%] lg:max-h-full lg:h-full shrink-0">
        <div className="p-2 lg:p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-gray-50 dark:bg-[#202023]">
          <div className="flex items-center gap-2 lg:gap-3">
             <Target className="text-ghoul-red animate-pulse" size={18} />
             <h2 className="font-serif font-bold tracking-widest text-sm lg:text-base">{t.panelTitle}</h2>
          </div>
          <button onClick={onClose} className="hover:text-ghoul-red transition-colors flex items-center gap-1 text-[10px] lg:text-xs font-bold border border-gray-300 dark:border-zinc-700 px-2 py-1 rounded">
            <X size={12}/> {t.close}
          </button>
        </div>

        <div className="flex-grow p-2 lg:p-4 overflow-y-auto space-y-3 lg:space-y-5 overscroll-contain">
           <div>
             <h3 className="text-[10px] lg:text-[11px] font-mono text-gray-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">{t.blockMarking}</h3>
             <div className="flex gap-2 bg-gray-100 dark:bg-black/30 p-1 rounded-lg border border-gray-200 dark:border-transparent">
                <button onClick={() => setMarkMode('add')} className={`flex-1 py-1 lg:py-2 px-1 lg:px-2 rounded text-[10px] lg:text-xs font-bold font-tech transition-all ${markMode === 'add' ? 'bg-ghoul-red text-white shadow-md' : 'text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  <CheckCircle size={10} className="inline mr-1" /> {t.markingMode}
                </button>
                <button onClick={() => setMarkMode('remove')} className={`flex-1 py-1 lg:py-2 px-1 lg:px-2 rounded text-[10px] lg:text-xs font-bold font-tech transition-all ${markMode === 'remove' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  <Eraser size={10} className="inline mr-1" /> {t.clearMode}
                </button>
             </div>
           </div>

           <div className={`transition-opacity duration-300 ${markMode === 'remove' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
             <h3 className="text-[10px] lg:text-[11px] font-mono text-gray-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wider">{t.markerColor}</h3>
             <div className="grid grid-cols-6 lg:grid-cols-4 gap-1.5 lg:gap-2">
               {COLORS.map(c => (
                 <button key={c} onClick={() => setSelectedColor(c)} className={`w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 transition-all transform hover:scale-110 ${selectedColor === c ? 'border-gray-500 dark:border-white shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`} style={{ backgroundColor: c }} />
               ))}
               <div className="relative w-5 h-5 lg:w-8 lg:h-8 rounded-full border-2 border-gray-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center hover:border-gray-400 dark:hover:border-zinc-500">
                 <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 opacity-50"></div>
                 <input type="color" className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" onChange={(e) => setSelectedColor(e.target.value)} />
                 <Settings size={12} className="relative z-10 pointer-events-none text-gray-600 dark:text-gray-400"/>
               </div>
             </div>
           </div>

           {/* Export Quality Selector */}
           <div className="pt-2 lg:pt-5 border-t border-gray-200 dark:border-zinc-800">
              <h3 className="text-[10px] lg:text-[11px] font-mono text-gray-500 dark:text-zinc-500 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                <Monitor size={10} /> {qT.title}
              </h3>
              <div className="flex gap-1.5">
                <button onClick={() => setExportQuality(1)} className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-all border ${exportQuality === 1 ? 'bg-gray-800 text-white border-gray-600' : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  1x
                </button>
                <button onClick={() => setExportQuality(2)} className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-all border ${exportQuality === 2 ? 'bg-ghoul-red text-white border-red-500' : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  2x
                </button>
                <button onClick={() => setExportQuality(4)} className={`flex-1 py-1 rounded text-[10px] font-bold font-mono transition-all border ${exportQuality === 4 ? 'bg-purple-600 text-white border-purple-500' : 'bg-transparent text-gray-500 border-gray-300 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5'}`}>
                  4x
                </button>
              </div>
              <div className="text-[9px] text-gray-400 dark:text-zinc-600 mt-1 text-right font-mono">
                {exportQuality === 1 ? qT.q1 : exportQuality === 2 ? qT.q2 : qT.q3}
              </div>
           </div>

           <div className="pt-2 lg:pt-3 space-y-2 lg:space-y-3">
             <button onClick={handleClearAll} className="w-full py-1.5 lg:py-2.5 rounded border border-red-500/30 dark:border-red-900/50 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-[10px] lg:text-xs font-bold font-tech flex items-center justify-center gap-2">
               <Trash2 size={12} /> {t.clearAll}
             </button>
             
             <button onClick={handleExport} disabled={isExporting} className="w-full py-2 lg:py-3 bg-ghoul-red text-white font-bold font-tech tracking-[0.2em] clip-button hover:bg-gray-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20 text-[10px] lg:text-sm">
               {isExporting ? <span className="animate-pulse">{t.exporting}</span> : <><Download size={14} /> {t.exportMap}</>}
             </button>
           </div>
        </div>
      </div>

      {/* RIGHT MAP AREA */}
      <div className="flex-1 relative bg-[var(--map-bg)] transition-colors duration-300 overflow-hidden cursor-crosshair select-none z-10 order-1 lg:order-2 min-h-0 overscroll-none">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(var(--grid-line-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line-color)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        {/* Anti-Screenshot Watermark Overlay - Obfuscated */}
        <div className="atmospheric-layer absolute inset-0 z-[5] pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.06] select-none" style={{ mixBlendMode: 'overlay' }} aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] flex flex-wrap content-center justify-center rotate-[-20deg] gap-24">
               {WATERMARK_TILES.map((_, i) => (
                 <div key={i} className="w-48 flex justify-center items-center">
                    <span className="text-4xl font-black font-ghoul text-black dark:text-white uppercase tracking-[0.2em]">noswork</span>
                 </div>
               ))}
            </div>
        </div>

        <div className="absolute top-4 left-4 z-10 pointer-events-none bg-black/50 backdrop-blur-sm p-2 rounded border border-white/10">
           <div className="flex items-center gap-2 text-ghoul-red font-mono text-xs mb-1 animate-pulse">
             <Activity size={12} /> {t.liveFeed}
           </div>
           <div className="text-white/70 font-mono text-[10px] whitespace-pre-line">{t.sectorInfo}</div>
        </div>

        <svg 
          ref={svgRef}
          id="hex-map"
          className="w-full h-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
        >
          <g id="hex-layer"></g>
          <g id="mark-layer"></g>
          <g id="highlight-layer"></g>
          <g id="building-layer"></g>
          <g id="label-layer"></g>
        </svg>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(transparent_50%,var(--map-bg)_100%)] opacity-50"></div>
      </div>
    </div>
  );
};
