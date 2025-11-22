
import React, { useState, useEffect, useRef } from 'react';
import { Lang } from '../../types';
import { translations } from '../../constants';
import { X, Target, Settings, Download, CheckCircle, Trash2, Activity, Eraser, Monitor, Layers, Image as ImageIcon, ArrowRight, Square, Type, Pencil, Move, Palette, Undo2, RotateCcw, GripVertical } from 'lucide-react';

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

// Icon Image URLs - Import images using Vite's asset handling
import cityIcon from '../../assets/tools/StrongholdMap/city.png';
import buildingIcon from '../../assets/tools/StrongholdMap/building.png';
import houseIcon from '../../assets/tools/StrongholdMap/house.png';
import hospitalIcon from '../../assets/tools/StrongholdMap/hospital.png';
import fortressIcon from '../../assets/tools/StrongholdMap/fortress.png';
import orgIcon from '../../assets/tools/StrongholdMap/org.png';
import blockIcon from '../../assets/tools/StrongholdMap/block.png';

const ICON_IMAGES: Record<string, string> = {
  mainCity: cityIcon,
  building: buildingIcon,
  house: houseIcon,
  hospital: hospitalIcon,
  fortress: fortressIcon,
  organization: orgIcon,
  block: blockIcon
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
  const aT = t.annotation;
  const svgRef = useRef<SVGSVGElement>(null);
  const [markMode, setMarkMode] = useState<'add' | 'remove'>('add');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [isExporting, setIsExporting] = useState(false);
  const [exportQuality, setExportQuality] = useState(2); // Default to 2x (High)
  const [annotationMode, setAnnotationMode] = useState<'none' | 'arrow' | 'rectangle' | 'text' | 'sketch' | 'eraser'>('none');
  const [annotationColor, setAnnotationColor] = useState('#ef4444');
  const [annotationFontSize, setAnnotationFontSize] = useState(16);
  const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(3);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [annotationHistory, setAnnotationHistory] = useState<any[][]>([]);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [toolbarDragStart, setToolbarDragStart] = useState({ x: 0, y: 0 });
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const annotationLayerRef = useRef<SVGGElement>(null);
  const isDrawingRef = useRef(false);
  const currentAnnotationRef = useRef<any>(null);
  const sketchPathRef = useRef<SVGPathElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const     state = useRef<{
    scale: number;
    translate: { x: number; y: number };
    isPanning: boolean;
    dragging: boolean;
    startPointer: { x: number; y: number };
    lastPointer: { x: number; y: number };
    pointers: Map<number, {x: number, y: number}>;
    cellMap: Map<string, any>;
    markedCells: Map<string, any>;
    lastHoveredKey: string | null;
    annotationStart: { x: number; y: number };
  }>({
    scale: 0.5,
    translate: { x: 0, y: 0 },
    isPanning: false,
    dragging: false,
    startPointer: { x: 0, y: 0 }, 
    lastPointer: { x: 0, y: 0 },
    pointers: new Map<number, {x: number, y: number}>(),
    cellMap: new Map<string, any>(),
    markedCells: new Map<string, any>(),
    lastHoveredKey: null,
    annotationStart: { x: 0, y: 0 },
  });

  const applyTransform = () => {
    const { scale, translate, lastHoveredKey } = state.current;
    const matrix = `matrix(${scale}, 0, 0, ${scale}, ${translate.x}, ${translate.y})`;
    if (!svgRef.current) return;
    
    ['hex-layer', 'mark-layer', 'highlight-layer', 'building-layer', 'label-layer', 'annotation-layer'].forEach(id => {
      const el = svgRef.current!.querySelector(`#${id}`);
      if(el) el.setAttribute("transform", matrix);
    });
    
    if (lastHoveredKey && svgRef.current) {
       const cell = state.current.cellMap.get(lastHoveredKey);
       const labelGroup = svgRef.current.querySelector('#hover-label');
       if (cell && labelGroup && scale > 0) {
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
    const annotationLayer = svg.querySelector('#annotation-layer') as SVGGElement;

    hexLayer.innerHTML = '';
    markLayer.innerHTML = '';
    buildingLayer.innerHTML = '';
    highlightLayer.innerHTML = '';
    labelLayer.innerHTML = '';
    if (annotationLayer) annotationLayer.innerHTML = '';
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

    // Initialize annotation layer if it doesn't exist
    if (!annotationLayer) {
      const newAnnotationLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      newAnnotationLayer.setAttribute("id", "annotation-layer");
      svg.appendChild(newAnnotationLayer);
      annotationLayerRef.current = newAnnotationLayer;
    } else {
      annotationLayerRef.current = annotationLayer;
    }

    applyTransform();

    // Load saved marks after cellMap is fully initialized
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('stronghold-marks');
        if (saved) {
          const marks = JSON.parse(saved);
          marks.forEach((m: any) => {
            if (m && typeof m.x === 'number' && typeof m.y === 'number' && m.color) {
              createMark(m.x, m.y, m.color);
            }
          });
        }
      } catch (e) {
        console.warn('Failed to load saved marks:', e);
      }
    }, 0);
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
    
    // Prevent handling if clicking on text input or its container
    const target = e.target as Element;
    if (target.closest('input[type="text"]') || 
        (target as HTMLElement).tagName === 'INPUT' ||
        target.closest('[data-text-input-container]')) {
      return;
    }
    
    (e.target as Element).setPointerCapture(e.pointerId);
    s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    if (s.pointers.size === 1) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const wx = (mx - s.translate.x) / s.scale;
      const wy = (my - s.translate.y) / s.scale;
      
      // Handle annotation tools
      if (annotationMode !== 'none' && annotationMode !== 'eraser') {
        s.isPanning = false;
        s.dragging = false;
        s.annotationStart = { x: wx, y: wy };
        isDrawingRef.current = true;
        
        if (annotationMode === 'arrow' || annotationMode === 'rectangle' || annotationMode === 'text') {
          currentAnnotationRef.current = { type: annotationMode, start: { x: wx, y: wy }, end: { x: wx, y: wy }, color: annotationColor, strokeWidth: annotationStrokeWidth };
        } else if (annotationMode === 'sketch') {
          if (!annotationLayerRef.current) return;
          const sketchId = Date.now();
          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("data-annotation-id", String(sketchId));
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${wx} ${wy}`);
          path.setAttribute("stroke", annotationColor);
          path.setAttribute("stroke-width", String(annotationStrokeWidth));
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-linecap", "round");
          path.setAttribute("stroke-linejoin", "round");
          g.appendChild(path);
          annotationLayerRef.current.appendChild(g);
          sketchPathRef.current = path;
          currentAnnotationRef.current = { 
            type: 'sketch', 
            id: sketchId,
            pathData: `M ${wx} ${wy}`,
            color: annotationColor, 
            strokeWidth: annotationStrokeWidth 
          };
        }
        return;
      }
      
      
      // Normal panning
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
      
      const rect = svgRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const wx = (mx - s.translate.x) / s.scale;
      const wy = (my - s.translate.y) / s.scale;
      
      // Handle annotation drawing
      if (isDrawingRef.current && annotationMode !== 'none' && annotationMode !== 'eraser') {
        if (annotationMode === 'sketch' && sketchPathRef.current && currentAnnotationRef.current) {
          const path = sketchPathRef.current;
          const currentPath = path.getAttribute("d") || '';
          const newPathData = `${currentPath} L ${wx} ${wy}`;
          path.setAttribute("d", newPathData);
          currentAnnotationRef.current.pathData = newPathData;
        } else if (annotationMode === 'arrow' || annotationMode === 'rectangle' || annotationMode === 'text') {
          if (currentAnnotationRef.current) {
            currentAnnotationRef.current.end = { x: wx, y: wy };
            renderCurrentAnnotation();
          }
        }
        return;
      }
      
      
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

    // 只有在沒有指針按下（沒有拖拽或平移）且註釋模式為none時才顯示高亮
    if (s.pointers.size === 0 && !s.dragging && !s.isPanning && annotationMode === 'none') {
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
    
    if (isDrawingRef.current && annotationMode !== 'none' && annotationMode !== 'eraser') {
      if (annotationMode === 'arrow' || annotationMode === 'rectangle') {
        if (currentAnnotationRef.current) {
          const dist = Math.hypot(
            currentAnnotationRef.current.end.x - currentAnnotationRef.current.start.x,
            currentAnnotationRef.current.end.y - currentAnnotationRef.current.start.y
          );
          if (dist > 5) {
            addAnnotation(currentAnnotationRef.current);
          }
          currentAnnotationRef.current = null;
        }
      } else if (annotationMode === 'text') {
        if (currentAnnotationRef.current) {
          const dist = Math.hypot(
            currentAnnotationRef.current.end.x - currentAnnotationRef.current.start.x,
            currentAnnotationRef.current.end.y - currentAnnotationRef.current.start.y
          );
          if (dist > 5) {
            // Calculate the center bottom position of the selection box
            const start = currentAnnotationRef.current.start;
            const end = currentAnnotationRef.current.end;
            const centerX = (start.x + end.x) / 2;
            const bottomY = Math.max(start.y, end.y);
            const boxHeight = Math.abs(end.y - start.y);
            
            // Convert to screen coordinates
            if (svgRef.current) {
              const rect = svgRef.current.getBoundingClientRect();
              const screenX = centerX * s.scale + s.translate.x;
              const screenY = bottomY * s.scale + s.translate.y;
              
              // Calculate spacing based on box height and font size
              const spacing = Math.max(boxHeight * s.scale * 0.2, annotationFontSize * s.scale * 0.5, 20);
              
              // Store the selection box info for later use
              currentAnnotationRef.current.textBox = {
                start: { x: start.x, y: start.y },
                end: { x: end.x, y: end.y },
                centerX,
                bottomY
              };
              
              setTextInputPosition({ 
                x: screenX, 
                y: screenY + spacing // Position below the box with proper spacing
              });
              setTextInputValue('');
              setTextInputVisible(true);
              setTimeout(() => {
                textInputRef.current?.focus();
              }, 0);
            }
          } else {
            currentAnnotationRef.current = null;
          }
        }
      } else if (annotationMode === 'sketch') {
        if (currentAnnotationRef.current && sketchPathRef.current) {
          const pathData = sketchPathRef.current.getAttribute("d") || '';
          // Only save if path has more than just the initial move command
          if (pathData.length > 10) {
            addAnnotation(currentAnnotationRef.current);
          } else {
            // Remove the empty sketch group if path is too short
            const g = sketchPathRef.current.parentElement;
            if (g && g.getAttribute('data-annotation-id')) {
              g.remove();
            }
          }
          currentAnnotationRef.current = null;
        }
      }
      isDrawingRef.current = false;
      sketchPathRef.current = null;
    }
    
    if (s.pointers.size === 0) {
      s.isPanning = false;
      if (svgRef.current) {
         svgRef.current.classList.remove('panning');
      }
      setTimeout(() => { s.dragging = false; }, 50);
    }
  };

  // Ensure text input gets focus when visible
  useEffect(() => {
    if (textInputVisible && textInputRef.current) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
        }
      });
    }
  }, [textInputVisible]);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if clicking on text input or its container
    const target = e.target as Element;
    if (target.closest('input[type="text"]') || 
        (target as HTMLElement).tagName === 'INPUT' ||
        target.closest('[data-text-input-container]')) return;
    
    // Handle eraser mode - delete annotation on click
    if (annotationMode === 'eraser') {
      const annotationGroup = target.closest('[data-annotation-id]') as Element;
      if (annotationGroup) {
        const annotationId = Number(annotationGroup.getAttribute('data-annotation-id'));
        if (annotationId) {
          setAnnotations(prev => {
            setAnnotationHistory(history => [...history, [...prev]]);
            return prev.filter(a => a.id !== annotationId);
          });
          e.stopPropagation();
          return;
        }
      }
      // If clicking outside annotations in eraser mode, do nothing
      if (!target.closest('#annotation-layer')) {
        e.stopPropagation();
        return;
      }
    }
    
    // Disable marking when annotation mode is active (unless in eraser mode)
    if (annotationMode !== 'none' && annotationMode !== 'eraser') return;
    
    // Prevent click if we were dragging
    if (state.current.dragging) return;
    
    // Prevent click if clicking on annotation elements (unless in eraser mode)
    if (annotationMode !== 'eraser' && target.closest('#annotation-layer')) return;
    
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
    // Disable marking when annotation mode is active (unless in eraser mode)
    if (annotationMode !== 'none' && annotationMode !== 'eraser') return;
    
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
      ['hex-layer', 'mark-layer', 'building-layer', 'annotation-layer'].forEach(id => 
        clone.querySelector(`#${id}`)?.removeAttribute('transform')
      );
      
      // Remove UI helpers
      clone.querySelector('#label-layer')?.remove(); 
      clone.querySelector('#highlight-layer')?.remove();
      
      // Keep annotation layer for export 
      
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

  const addAnnotation = (annotation: any) => {
    setAnnotations(prev => {
      setAnnotationHistory(history => [...history, [...prev]]);
      const newAnnotation = { ...annotation, id: Date.now() };
      // Don't render here - let useEffect handle it to avoid duplicates
      return [...prev, newAnnotation];
    });
  };

  const renderAnnotation = (annotation: any) => {
    if (!annotationLayerRef.current) return;
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-annotation-id", String(annotation.id || Date.now()));
    
    if (annotation.type === 'arrow') {
      const { start, end, color, strokeWidth } = annotation;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const arrowLength = Math.hypot(dx, dy);
      const arrowHeadSize = Math.max(10, (strokeWidth || annotationStrokeWidth) * 5);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", String(strokeWidth || annotationStrokeWidth));
      g.appendChild(line);
      
      const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const points = [
        `${end.x},${end.y}`,
        `${end.x - arrowHeadSize * Math.cos(angle - Math.PI / 6)},${end.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)}`,
        `${end.x - arrowHeadSize * Math.cos(angle + Math.PI / 6)},${end.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)}`
      ].join(' ');
      arrowHead.setAttribute("points", points);
      arrowHead.setAttribute("fill", color);
      g.appendChild(arrowHead);
    } else if (annotation.type === 'rectangle') {
      const { start, end, color, strokeWidth } = annotation;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(width));
      rect.setAttribute("height", String(height));
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", color);
      rect.setAttribute("stroke-width", String(strokeWidth || annotationStrokeWidth));
      g.appendChild(rect);
    } else if (annotation.type === 'text') {
      const { x, y, text, color, fontSize, start, end, strokeWidth } = annotation;
      
      // Draw dashed selection box if start and end are provided
      if (start && end) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const rectX = Math.min(start.x, end.x);
        const rectY = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        rect.setAttribute("x", String(rectX));
        rect.setAttribute("y", String(rectY));
        rect.setAttribute("width", String(width));
        rect.setAttribute("height", String(height));
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", color);
        rect.setAttribute("stroke-width", String(strokeWidth || annotationStrokeWidth));
        g.appendChild(rect);
      }
      
      // Draw text below the selection box (or at the specified position for backward compatibility)
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      // Calculate text position: if we have start/end, position text below the box with proper spacing
      let textX = x || 0;
      let textY = y || 0;
      if (start && end) {
        textX = (Math.min(start.x, end.x) + Math.abs(end.x - start.x) / 2);
        const boxBottom = Math.max(start.y, end.y);
        const boxHeight = Math.abs(end.y - start.y);
        // Position text below the box with spacing based on box height and font size
        textY = boxBottom + Math.max(boxHeight * 0.2, (fontSize || annotationFontSize) * 0.5);
      }
      textEl.setAttribute("x", String(textX));
      textEl.setAttribute("y", String(textY));
      textEl.setAttribute("fill", color);
      textEl.setAttribute("font-size", String(fontSize || annotationFontSize));
      textEl.setAttribute("font-weight", "bold");
      textEl.setAttribute("font-family", "monospace");
      textEl.setAttribute("text-anchor", "middle"); // Center align
      textEl.setAttribute("dominant-baseline", "hanging"); // Align from top
      textEl.textContent = text;
      g.appendChild(textEl);
    } else if (annotation.type === 'sketch') {
      const { pathData, color, strokeWidth } = annotation;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData);
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", String(strokeWidth || annotationStrokeWidth));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      g.appendChild(path);
    }
    
    annotationLayerRef.current.appendChild(g);
  };


  const renderCurrentAnnotation = () => {
    if (!currentAnnotationRef.current || !annotationLayerRef.current) return;
    
    // Remove previous temporary annotation
    const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
    if (temp) temp.remove();
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-temp", "true");
    
    const annotation = currentAnnotationRef.current;
    if (annotation.type === 'arrow') {
      const { start, end, color, strokeWidth } = annotation;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const arrowHeadSize = Math.max(10, (strokeWidth || annotationStrokeWidth) * 5);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(end.x));
      line.setAttribute("y2", String(end.y));
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", String(annotationStrokeWidth));
      g.appendChild(line);
      
      const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const points = [
        `${end.x},${end.y}`,
        `${end.x - arrowHeadSize * Math.cos(angle - Math.PI / 6)},${end.y - arrowHeadSize * Math.sin(angle - Math.PI / 6)}`,
        `${end.x - arrowHeadSize * Math.cos(angle + Math.PI / 6)},${end.y - arrowHeadSize * Math.sin(angle + Math.PI / 6)}`
      ].join(' ');
      arrowHead.setAttribute("points", points);
      arrowHead.setAttribute("fill", color);
      g.appendChild(arrowHead);
    } else if (annotation.type === 'rectangle') {
      const { start, end, color } = annotation;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(width));
      rect.setAttribute("height", String(height));
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", color);
      rect.setAttribute("stroke-width", String(annotationStrokeWidth));
      g.appendChild(rect);
    } else if (annotation.type === 'text') {
      const { start, end, color } = annotation;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      rect.setAttribute("x", String(x));
      rect.setAttribute("y", String(y));
      rect.setAttribute("width", String(width));
      rect.setAttribute("height", String(height));
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", color);
      rect.setAttribute("stroke-width", String(annotationStrokeWidth));
      g.appendChild(rect);
    }
    
    annotationLayerRef.current.appendChild(g);
  };

  const handleUndo = () => {
    if (annotationHistory.length === 0) return;
    const previous = annotationHistory[annotationHistory.length - 1];
    setAnnotations(previous);
    setAnnotationHistory(prev => prev.slice(0, -1));
    
    // Re-render all annotations
    if (annotationLayerRef.current) {
      annotationLayerRef.current.innerHTML = '';
      previous.forEach(renderAnnotation);
    }
  };

  const handleClearAnnotations = () => {
    setAnnotations(prev => {
      setAnnotationHistory(history => [...history, [...prev]]);
      if (annotationLayerRef.current) {
        annotationLayerRef.current.innerHTML = '';
      }
      return [];
    });
  };

  const handleAnnotationDone = () => {
    handleExport();
  };

  const handleToolbarPointerDown = (e: React.PointerEvent) => {
    if (!toolbarRef.current) return;
    const target = e.target as HTMLElement;
    // Don't drag if clicking on interactive elements
    if (target.closest('button') || target.closest('input') || target.closest('select')) {
      return;
    }
    setIsDraggingToolbar(true);
    const rect = toolbarRef.current.getBoundingClientRect();
    const parentRect = toolbarRef.current.parentElement?.getBoundingClientRect();
    if (parentRect) {
      setToolbarDragStart({ 
        x: e.clientX - (parentRect.left + parentRect.width / 2) - toolbarPosition.x, 
        y: e.clientY - (parentRect.top + parentRect.height) - toolbarPosition.y
      });
    }
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handleToolbarPointerMove = (e: PointerEvent) => {
      if (isDraggingToolbar && toolbarRef.current) {
        const parentRect = toolbarRef.current.parentElement?.getBoundingClientRect();
        if (parentRect) {
          setToolbarPosition({
            x: e.clientX - (parentRect.left + parentRect.width / 2) - toolbarDragStart.x,
            y: e.clientY - (parentRect.top + parentRect.height) - toolbarDragStart.y
          });
        }
      }
    };

    const handleToolbarPointerUp = () => {
      setIsDraggingToolbar(false);
    };

    if (isDraggingToolbar) {
      window.addEventListener('pointermove', handleToolbarPointerMove);
      window.addEventListener('pointerup', handleToolbarPointerUp);
      return () => {
        window.removeEventListener('pointermove', handleToolbarPointerMove);
        window.removeEventListener('pointerup', handleToolbarPointerUp);
      };
    }
  }, [isDraggingToolbar, toolbarDragStart]);

  // Close text input when switching tools
  useEffect(() => {
    if (annotationMode !== 'text' && textInputVisible) {
      // Clear the temporary selection box
      if (annotationLayerRef.current) {
        const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
        if (temp) temp.remove();
      }
      if (currentAnnotationRef.current) {
        currentAnnotationRef.current = null;
      }
      setTextInputVisible(false);
      setTextInputValue('');
    }
  }, [annotationMode, textInputVisible]);

  // Re-render annotations when they change
  useEffect(() => {
    if (!annotationLayerRef.current) return;
    annotationLayerRef.current.innerHTML = '';
    annotations.forEach(ann => {
      renderAnnotation(ann);
    });
  }, [annotations]);

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
           <div className={`transition-opacity duration-300 ${annotationMode !== 'none' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
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

           <div className={`transition-opacity duration-300 ${annotationMode !== 'none' || markMode === 'remove' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
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
          <g id="annotation-layer"></g>
        </svg>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(transparent_50%,var(--map-bg)_100%)] opacity-50"></div>
        
        {/* Custom Text Input */}
        {textInputVisible && (
          <div
            data-text-input-container
            className="absolute z-40 bg-white dark:bg-[#18181b] rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-800 p-2 pointer-events-auto"
            style={{
              left: `${textInputPosition.x}px`,
              top: `${textInputPosition.y}px`,
              transform: 'translate(-50%, 0)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  if (textInputValue.trim() && currentAnnotationRef.current && currentAnnotationRef.current.textBox) {
                    const textBox = currentAnnotationRef.current.textBox;
                    addAnnotation({ 
                      type: 'text', 
                      start: textBox.start,
                      end: textBox.end,
                      x: textBox.centerX, 
                      y: textBox.bottomY, 
                      text: textInputValue.trim(), 
                      color: annotationColor, 
                      fontSize: annotationFontSize 
                    });
                    // Clear the temporary selection box
                    if (annotationLayerRef.current) {
                      const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
                      if (temp) temp.remove();
                    }
                    currentAnnotationRef.current = null;
                  }
                  setTextInputVisible(false);
                  setTextInputValue('');
                } else if (e.key === 'Escape') {
                  // Clear the temporary selection box
                  if (annotationLayerRef.current) {
                    const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
                    if (temp) temp.remove();
                  }
                  if (currentAnnotationRef.current) {
                    currentAnnotationRef.current = null;
                  }
                  setTextInputVisible(false);
                  setTextInputValue('');
                }
              }}
              onBlur={(e) => {
                // Use a longer delay to check if focus moved to another element
                setTimeout(() => {
                  // Check if the input or its container still has focus
                  const activeElement = document.activeElement;
                  const container = e.currentTarget.parentElement;
                  
                  // Only close if focus is not on the input or its container
                  if (activeElement !== e.currentTarget && 
                      (!container || !container.contains(activeElement))) {
                    // Double check that we're not in the middle of a click
                    if (!textInputRef.current?.matches(':focus')) {
                      // Clear the temporary selection box
                      if (annotationLayerRef.current) {
                        const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
                        if (temp) temp.remove();
                      }
                      if (currentAnnotationRef.current) {
                        currentAnnotationRef.current = null;
                      }
                      setTextInputVisible(false);
                      setTextInputValue('');
                    }
                  }
                }, 300);
              }}
              onFocus={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              className="px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-zinc-700 rounded text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-ghoul-red min-w-[200px]"
              placeholder="Enter text..."
              autoFocus
            />
          </div>
        )}

        {/* Draggable Annotation Toolbar */}
        <div
          ref={toolbarRef}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-[#18181b] rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-800 p-2 z-30 select-none"
          style={{
            transform: `translate(${toolbarPosition.x}px, ${toolbarPosition.y}px) translate(-50%, 0)`,
            touchAction: 'none'
          }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {/* Drag handle */}
            <div
              onPointerDown={handleToolbarPointerDown}
              className="cursor-grab active:cursor-grabbing p-1 text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <GripVertical size={16} />
            </div>
            
            {/* Divider */}
            <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700"></div>
            {/* Tool buttons */}
            <button 
              onClick={() => setAnnotationMode(annotationMode === 'arrow' ? 'none' : 'arrow')} 
              className={`p-2 rounded transition-all ${annotationMode === 'arrow' ? 'bg-ghoul-red text-white shadow-md' : 'bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              title={aT.addArrow}
            >
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => setAnnotationMode(annotationMode === 'rectangle' ? 'none' : 'rectangle')} 
              className={`p-2 rounded transition-all ${annotationMode === 'rectangle' ? 'bg-ghoul-red text-white shadow-md' : 'bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              title={aT.addRectangle}
            >
              <Square size={16} />
            </button>
            <button 
              onClick={() => setAnnotationMode(annotationMode === 'text' ? 'none' : 'text')} 
              className={`p-2 rounded transition-all ${annotationMode === 'text' ? 'bg-ghoul-red text-white shadow-md' : 'bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              title={aT.addText}
            >
              <Type size={16} />
            </button>
            <button 
              onClick={() => setAnnotationMode(annotationMode === 'sketch' ? 'none' : 'sketch')} 
              className={`p-2 rounded transition-all ${annotationMode === 'sketch' ? 'bg-ghoul-red text-white shadow-md' : 'bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              title={aT.startSketching}
            >
              <Pencil size={16} />
            </button>
            <button 
              onClick={() => setAnnotationMode(annotationMode === 'eraser' ? 'none' : 'eraser')} 
              className={`p-2 rounded transition-all ${annotationMode === 'eraser' ? 'bg-ghoul-red text-white shadow-md' : 'bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              title="Eraser"
            >
              <Eraser size={16} />
            </button>
            
            {/* Divider */}
            <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700"></div>
            
            {/* Color picker */}
            <div className="relative w-8 h-8 rounded-full border-2 border-gray-300 dark:border-zinc-700 overflow-hidden cursor-pointer">
              <div className="absolute inset-0" style={{ backgroundColor: annotationColor }}></div>
              <input 
                type="color" 
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
                value={annotationColor}
                onChange={(e) => setAnnotationColor(e.target.value)} 
              />
            </div>
            
            {/* Font size control */}
            <div className="flex items-center gap-1">
              <Type size={14} className="text-gray-500 dark:text-zinc-500" />
              <input
                type="number"
                min="8"
                max="48"
                value={annotationFontSize}
                onChange={(e) => setAnnotationFontSize(Number(e.target.value))}
                className="w-12 px-1 py-1 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-black/30 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Stroke width control */}
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border-2 border-gray-500 dark:border-zinc-400"></div>
              <input
                type="number"
                min="1"
                max="10"
                value={annotationStrokeWidth}
                onChange={(e) => setAnnotationStrokeWidth(Number(e.target.value))}
                className="w-12 px-1 py-1 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-black/30 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Divider */}
            <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700"></div>
            
            {/* Action buttons */}
            <button 
              onClick={handleUndo} 
              disabled={annotationHistory.length === 0}
              className={`p-2 rounded transition-all ${annotationHistory.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'} bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500`}
              title={aT.undo}
            >
              <Undo2 size={16} />
            </button>
            <button 
              onClick={handleClearAnnotations} 
              className="p-2 rounded transition-all bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5"
              title={aT.clear}
            >
              <RotateCcw size={16} />
            </button>
            <button 
              onClick={handleAnnotationDone} 
              className="p-2 rounded transition-all bg-green-600 text-white hover:bg-green-700 shadow-md"
              title={aT.done}
            >
              <CheckCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};