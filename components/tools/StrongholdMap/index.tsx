import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../../../constants';
import { StrongholdMapProps, MarkMode, AnnotationMode, SharedMapState, MapVersion } from './types';
import { V3_MAP_CONFIG, V3_HEX_DX, V3_HEX_DY, V3_HEX_H, V3_MAIN_CITY_CENTER, V3_MAIN_CITY_CELLS, V3_BUILDING_DATA, V3_ICON_IMAGES, WATERMARK_TILES, STORAGE_KEYS, V1_MAP_CONFIG, V1_HEX_DX, V1_HEX_DY, V1_HEX_H, V1_MAIN_CITY_CENTER, V1_MAIN_CITY_CELLS, V1_BUILDING_DATA, V1_ICON_IMAGES, V2_MAP_CONFIG, V2_HEX_DX, V2_HEX_DY, V2_HEX_H, V2_MAIN_CITY_CENTER, V2_MAIN_CITY_CELLS, V2_BUILDING_DATA, V2_ICON_IMAGES } from './config';
import { keyFor, hexToRgba, inBounds, computeCenter, decodeMapShareState } from './utils';
import { useMapState } from './hooks/useMapState';
import { useAnnotations } from './hooks/useAnnotations';
import { ControlPanel } from './components/ControlPanel';
import { AnnotationToolbar } from './components/AnnotationToolbar';
import { TextInput } from './components/TextInput';

const getMapConfig = (v: MapVersion) => {
  if (v === 'v1') return V1_MAP_CONFIG;
  if (v === 'v2') return V2_MAP_CONFIG;
  return V3_MAP_CONFIG;
};
const getHexDx = (v: MapVersion) => {
  if (v === 'v1') return V1_HEX_DX;
  if (v === 'v2') return V2_HEX_DX;
  return V3_HEX_DX;
};
const getHexDy = (v: MapVersion) => {
  if (v === 'v1') return V1_HEX_DY;
  if (v === 'v2') return V2_HEX_DY;
  return V3_HEX_DY;
};
const getHexH = (v: MapVersion) => {
  if (v === 'v1') return V1_HEX_H;
  if (v === 'v2') return V2_HEX_H;
  return V3_HEX_H;
};
const getMainCityCells = (v: MapVersion) => {
  if (v === 'v1') return V1_MAIN_CITY_CELLS;
  if (v === 'v2') return V2_MAIN_CITY_CELLS;
  return V3_MAIN_CITY_CELLS;
};
const getMainCityCenter = (v: MapVersion) => {
  if (v === 'v1') return V1_MAIN_CITY_CENTER;
  if (v === 'v2') return V2_MAIN_CITY_CENTER;
  return V3_MAIN_CITY_CENTER;
};
const getBuildingData = (v: MapVersion) => {
  if (v === 'v1') return V1_BUILDING_DATA;
  if (v === 'v2') return V2_BUILDING_DATA;
  return V3_BUILDING_DATA;
};
const getIconImages = (v: MapVersion) => {
  if (v === 'v1') return V1_ICON_IMAGES;
  if (v === 'v2') return V2_ICON_IMAGES;
  return V3_ICON_IMAGES;
};

export const StrongholdMap: React.FC<StrongholdMapProps> = ({ lang, onClose }) => {
  const t = translations[lang].tools.map;
  const aT = t.annotation;
  const svgRef = useRef<SVGSVGElement>(null);
  const [markMode, setMarkMode] = useState<MarkMode>('add');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [isExporting, setIsExporting] = useState(false);
  const [exportQuality, setExportQuality] = useState(2);
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>('none');
  const [annotationColor, setAnnotationColor] = useState('#ef4444');
  const [annotationSize, setAnnotationSize] = useState(12);
  const [textInputVisible, setTextInputVisible] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState({ x: 0, y: 0 });
  const [textInputValue, setTextInputValue] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [mapVersion, setMapVersionState] = useState<MapVersion>(() => {
    return (localStorage.getItem(STORAGE_KEYS.mapVersion) as MapVersion) || 'v3';
  });

  const setMapVersion = (v: MapVersion) => {
    localStorage.setItem(STORAGE_KEYS.mapVersion, v);
    setMapVersionState(v);
    const center = getMainCityCenter(v);
    const { cx, cy } = computeCenter(center.x, center.y, v);
    const cfg = getMapConfig(v);
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      state.current.scale = cfg.minScale;
      state.current.translate.x = svgRect.width / 2 - cx * cfg.minScale;
      state.current.translate.y = svgRect.height / 2 - cy * cfg.minScale;
      requestAnimationFrame(applyTransform);
    }
  };
  const annotationLayerRef = useRef<SVGGElement>(null);
  const justCompletedTextDragRef = useRef(false);
  const layerRefsCache = useRef<Record<string, SVGGElement | null>>({});
  const hoverLabelRef = useRef<SVGGElement | null>(null);
  
  const state = useMapState();
  const {
    annotations,
    setAnnotations,
    annotationHistory,
    setAnnotationHistory,
    isDrawingRef,
    currentAnnotationRef,
    sketchPathRef,
    addAnnotation,
    renderAnnotation,
    renderCurrentAnnotation,
    handleUndo,
    handleClearAnnotations,
  } = useAnnotations(annotationMode, annotationColor, annotationSize, annotationLayerRef, (msg) => {
    setShareMessage(msg);
    setTimeout(() => setShareMessage(null), 4000);
  });

  const applyTransform = () => {
    const { scale, translate, lastHoveredKey } = state.current;
    const matrix = `matrix(${scale}, 0, 0, ${scale}, ${translate.x}, ${translate.y})`;
    if (!svgRef.current) return;

    ['hex-layer', 'mark-layer', 'highlight-layer', 'building-layer', 'label-layer', 'annotation-layer'].forEach(id => {
      const el = layerRefsCache.current[id] ?? svgRef.current!.querySelector(`#${id}`);
      if (el) el.setAttribute("transform", matrix);
    });

    if (lastHoveredKey && svgRef.current) {
       const cell = state.current.cellMap.get(lastHoveredKey);
       const labelGroup = layerRefsCache.current['hover-label'] ?? svgRef.current.querySelector('#hover-label');
       if (cell && labelGroup && state.current.scale > 0) {
         labelGroup.setAttribute("transform", `translate(${cell.cx}, ${cell.cy}) scale(${1/state.current.scale})`);
       }
    }
  };

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = state.current;
      const intensity = 1.1;
      const direction = e.deltaY < 0 ? intensity : 1 / intensity;
      const cfg = getMapConfig(mapVersion);
      const targetScale = Math.min(Math.max(s.scale * direction, cfg.minScale), cfg.maxScale);
      
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

    // Cache layer refs for fast access in applyTransform
    layerRefsCache.current = {
      'hex-layer': hexLayer,
      'mark-layer': markLayer,
      'highlight-layer': highlightLayer,
      'building-layer': buildingLayer,
      'label-layer': labelLayer,
      'annotation-layer': annotationLayer,
    };

    const cfg = getMapConfig(mapVersion);
    const halfH = getHexH(mapVersion) / 2;
    const r = cfg.r;
    const halfR = r / 2;
    const points = `${r},0 ${halfR},${halfH} ${-halfR},${halfH} ${-r},0 ${-halfR},${-halfH} ${halfR},${-halfH}`;
    const hexFragment = document.createDocumentFragment();

    const maxEven = cfg.maxEven;
    const maxOdd = cfg.maxOdd;
    const inBounds = (x: number, y: number) => {
      if (y % 2 === 0) return x >= 0 && x <= maxEven.x && y >= 0 && y <= maxEven.y;
      return x >= 0 && x <= maxOdd.x && y >= 0 && y <= maxOdd.y;
    };

    for (let y = 0; y <= maxOdd.y; y++) {
      const startX = y % 2 === 0 ? 0 : 1;
      const maxX = y % 2 === 0 ? maxEven.x : maxOdd.x;
      
      for (let x = startX; x <= maxX; x += 2) {
        if (!inBounds(x, y)) continue;
        const { cx, cy } = computeCenter(x, y, mapVersion);
        
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

    const buildingData = getBuildingData(mapVersion);
    const iconImages = getIconImages(mapVersion);
    const mainCityCenter = getMainCityCenter(mapVersion);
    const mainCityCells = getMainCityCells(mapVersion);

    for (const [type, coords] of Object.entries(buildingData)) {
      const imageUrl = iconImages[type];
      if (!imageUrl) continue;

      coords.forEach(([x, y]) => {
        if (!inBounds(x, y)) return;
        const cell = state.current.cellMap.get(keyFor(x, y));
        if (!cell) return;

        let size = 60;
        if (type === 'mainCity' || type === 'city') size = 90;
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
    hoverLabelRef.current = hoverLabelGroup;

    if (!annotationLayer) {
      const newAnnotationLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
      newAnnotationLayer.setAttribute("id", "annotation-layer");
      svg.appendChild(newAnnotationLayer);
      annotationLayerRef.current = newAnnotationLayer;
    } else {
      annotationLayerRef.current = annotationLayer;
    }

    // 初始渲染已儲存的 annotations（annotationLayerRef 剛設定好，useEffect 已錯過）
    if (annotationLayerRef.current) {
      const savedAnnotations = (() => {
        try {
          const saved = localStorage.getItem(STORAGE_KEYS.annotations);
          return saved ? JSON.parse(saved) : [];
        } catch { return []; }
      })();
      savedAnnotations.forEach((ann: any) => {
        const el = annotationLayerRef.current!.querySelector(`[data-annotation-id="${ann.id}"]`);
        if (!el) renderAnnotation(ann);
      });
    }

    applyTransform();

    // 從 localStorage 載入的輔助函數
    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.marks);
        if (saved) {
          const marks = JSON.parse(saved);
          marks.forEach((m: any) => {
            if (m && typeof m.x === 'number' && typeof m.y === 'number' && m.color) {
              createMark(m.x, m.y, m.color);
            }
          });
        }
      } catch (e) {
        console.warn('從 localStorage 載入標記失敗:', e);
      }
    };

    // 從 URL 載入分享地圖的邏輯
    const loadSharedMap = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const mapId = params.get('mapId');

        if (mapId) {
          // 從 Cloudflare Worker API 載入分享地圖
          try {
            const loadController = new AbortController();
            const loadTimeout = setTimeout(() => loadController.abort(), 10000);
            const response = await fetch(`https://tga-share.nossite.com/map/${mapId}`, { signal: loadController.signal });
            clearTimeout(loadTimeout);

            if (!response.ok) {
              const errorData = await response.json();
              console.warn('❌ 載入分享地圖失敗:', errorData.error);
              loadFromLocalStorage();
              return;
            }

            const result = await response.json();
            const shared: SharedMapState = result.data;

            if (shared.marks && Array.isArray(shared.marks)) {
              shared.marks.forEach((m) => {
                if (m && typeof m.x === 'number' && typeof m.y === 'number' && m.color) {
                  createMark(m.x, m.y, m.color);
                }
              });
              localStorage.setItem(STORAGE_KEYS.marks, JSON.stringify(shared.marks));
            }

            if (shared.annotations && Array.isArray(shared.annotations) && shared.annotations.length > 0) {
              setAnnotationHistory([]);
              setAnnotations(shared.annotations);
            }

            return;
          } catch (e) {
            console.error('❌ 載入分享地圖時發生錯誤:', e);
            // API 失敗時嘗試從 localStorage 載入
            loadFromLocalStorage();
            return;
          }
        }

        // 檢查舊版 URL 格式（向後相容）
        const token = params.get('map');
        const shared = token ? decodeMapShareState(token) : null;

        if (shared) {
          if (Array.isArray(shared.marks)) {
            shared.marks.forEach((m) => {
              if (m && typeof m.x === 'number' && typeof m.y === 'number' && m.color) {
                createMark(m.x, m.y, m.color);
              }
            });
            localStorage.setItem(STORAGE_KEYS.marks, JSON.stringify(shared.marks));
          }

          // 應用舊版分享註解
          if (Array.isArray(shared.annotations) && shared.annotations.length > 0) {
            setAnnotationHistory([]);
            setAnnotations(shared.annotations);
          }
        } else {
          loadFromLocalStorage();
        }
      } catch (e) {
        console.warn('⚠️ 載入地圖時發生錯誤:', e);
        loadFromLocalStorage();
      }
    };

    // 延遲執行確保 DOM 已準備好
    setTimeout(() => {
      loadSharedMap();
    }, 100);
  }, [mapVersion]);

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
    
    const markLayer = layerRefsCache.current['mark-layer'];
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
    localStorage.setItem(STORAGE_KEYS.marks, JSON.stringify(arr));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const s = state.current;
    
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
      
      if (annotationMode !== 'none' && annotationMode !== 'eraser') {
        s.isPanning = false;
        s.dragging = false;
        s.annotationStart = { x: wx, y: wy };
        isDrawingRef.current = true;
        
        if (annotationMode === 'arrow' || annotationMode === 'rectangle' || annotationMode === 'text') {
          currentAnnotationRef.current = { type: annotationMode, start: { x: wx, y: wy }, end: { x: wx, y: wy }, color: annotationColor, size: annotationSize };
        } else if (annotationMode === 'sketch') {
          if (!annotationLayerRef.current) return;
          const sketchId = Date.now();
          const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
          g.setAttribute("data-annotation-id", String(sketchId));
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", `M ${wx} ${wy}`);
          path.setAttribute("stroke", annotationColor);
          path.setAttribute("stroke-width", String(annotationSize));
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
            size: annotationSize 
          };
        }
        return;
      }
      
      s.isPanning = true;
      s.dragging = false;
      s.startPointer = { x: e.clientX, y: e.clientY };
      s.lastPointer = { x: e.clientX, y: e.clientY };
      
      if (svgRef.current) {
         svgRef.current.classList.add('hex-map', 'panning');
         const highlightLayer = layerRefsCache.current['highlight-layer'];
         if (highlightLayer) highlightLayer.innerHTML = '';
         if (hoverLabelRef.current) hoverLabelRef.current.style.display = 'none';
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

    if (s.pointers.size === 0 && !s.dragging && !s.isPanning && annotationMode === 'none') {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const group = target?.closest('.hex-group') as HTMLElement;
      
      const highlightLayer = layerRefsCache.current['highlight-layer'] as SVGGElement;
      const hoverLabel = hoverLabelRef.current as SVGGElement;
      const labelText = hoverLabel?.querySelector('text');
      const labelBg = hoverLabel?.querySelector('rect');
      
      if (highlightLayer) highlightLayer.innerHTML = '';

      if (group) {
        let x = Number(group.dataset.x);
        let y = Number(group.dataset.y);
        const key = keyFor(x, y);
        
        const isMainCity = V3_MAIN_CITY_CELLS.has(key);
        let displayKey = key;
        let highlightKeys = [key];

        if (isMainCity) {
          displayKey = keyFor(V3_MAIN_CITY_CENTER.x, V3_MAIN_CITY_CENTER.y);
          highlightKeys = Array.from(V3_MAIN_CITY_CELLS);
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
       const highlightLayer = layerRefsCache.current['highlight-layer'];
       if (highlightLayer) highlightLayer.innerHTML = '';
       if (hoverLabelRef.current) hoverLabelRef.current.style.display = "none";
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
            const start = currentAnnotationRef.current.start;
            const end = currentAnnotationRef.current.end;
            const centerX = (start.x + end.x) / 2;
            const bottomY = Math.max(start.y, end.y);
            const boxHeight = Math.abs(end.y - start.y);
            
            if (svgRef.current) {
              const rect = svgRef.current.getBoundingClientRect();
              const screenX = centerX * s.scale + s.translate.x + rect.left;
              const screenY = bottomY * s.scale + s.translate.y + rect.top;
              
              const spacing = Math.max(boxHeight * s.scale * 0.2, annotationSize * s.scale * 0.5, 20);
              
              currentAnnotationRef.current.textBox = {
                start: { x: start.x, y: start.y },
                end: { x: end.x, y: end.y },
                centerX,
                bottomY
              };
              
              setTextInputPosition({ 
                x: screenX, 
                y: screenY + spacing
              });
              setTextInputValue('');
              setTextInputVisible(true);
              justCompletedTextDragRef.current = true;
              // Reset the flag after a short delay to allow click event to be processed
              setTimeout(() => {
                justCompletedTextDragRef.current = false;
              }, 100);
            }
          } else {
            currentAnnotationRef.current = null;
          }
        }
      } else if (annotationMode === 'sketch') {
        if (currentAnnotationRef.current && sketchPathRef.current) {
          const pathData = sketchPathRef.current.getAttribute("d") || '';
          if (pathData.length > 10) {
            addAnnotation(currentAnnotationRef.current);
          } else {
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

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as Element;
    if (target.closest('input[type="text"]') || 
        (target as HTMLElement).tagName === 'INPUT' ||
        target.closest('[data-text-input-container]')) return;
    
    if (textInputVisible) {
      // Don't close the input if we just completed a text drag (left click release)
      if (justCompletedTextDragRef.current && annotationMode === 'text') {
        return;
      }
      if (annotationLayerRef.current) {
        const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
        if (temp) temp.remove();
      }
      if (currentAnnotationRef.current) {
        currentAnnotationRef.current = null;
      }
      setTextInputVisible(false);
      setTextInputValue('');
      return;
    }
    
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
      if (!target.closest('#annotation-layer')) {
        e.stopPropagation();
        return;
      }
    }
    
    if (annotationMode !== 'none' && annotationMode !== 'eraser') return;
    
    if (state.current.dragging) return;
    
    if (annotationMode !== 'eraser' && target.closest('#annotation-layer')) return;
    
    const group = target.closest('.hex-group') as HTMLElement;
    if (!group) return;

    let x = Number(group.dataset.x);
    let y = Number(group.dataset.y);
    let keysToProcess = [keyFor(x, y)];

    if (getMainCityCells(mapVersion).has(keyFor(x, y))) {
      keysToProcess = Array.from(getMainCityCells(mapVersion));
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
    if (annotationMode !== 'none' && annotationMode !== 'eraser') return;
    
    const s = state.current;
    const dist = Math.hypot(e.clientX - s.startPointer.x, e.clientY - s.startPointer.y);
    if (dist > 10) return;

    const processRemoval = (x: number, y: number) => {
      const key = keyFor(x, y);
      let keysToProcess = [key];
      if (V3_MAIN_CITY_CELLS.has(key)) keysToProcess = Array.from(V3_MAIN_CITY_CELLS);
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
    const HIT_RADIUS = getMapConfig(mapVersion).r * 2.0; 

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
    await new Promise(r => setTimeout(r, 100));

    try {
      const svg = svgRef.current;
      const serializer = new XMLSerializer();
      const clone = svg.cloneNode(true) as SVGElement;
      const isDark = document.documentElement.classList.contains('dark');
      
      ['hex-layer', 'mark-layer', 'building-layer', 'annotation-layer'].forEach(id => 
        clone.querySelector(`#${id}`)?.removeAttribute('transform')
      );
      
      clone.querySelector('#label-layer')?.remove(); 
      clone.querySelector('#highlight-layer')?.remove();
      
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

      const scale = exportQuality; 
      const currentMapConfig = getMapConfig(mapVersion);
      const currentHexDx = getHexDx(mapVersion);
      const currentHexDy = getHexDy(mapVersion);
      const w = (currentMapConfig.maxEven.x + 4) * currentHexDx;
      const h = (currentMapConfig.maxOdd.y + 4) * (currentHexDy / 2);
      
      clone.setAttribute("viewBox", `-100 -100 ${w} ${h}`);
      clone.setAttribute("width", String(w * scale));
      clone.setAttribute("height", String(h * scale));
      
      const style = document.createElement("style");
      const polyFill = isDark ? 'rgba(24, 24, 27, 0.5)' : '#ffffff';
      // Enhanced stroke colors for better visibility in exported images
      const polyStroke = isDark ? '#71717a' : '#52525b'; // Zinc 500 (dark mode) / Zinc 600 (light mode) - better contrast
      
      style.textContent = `
        .hex-polygon { fill: ${polyFill}; stroke: ${polyStroke}; stroke-width: 2.5; }
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
        canvas.width = w * scale;
        canvas.height = h * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Match the updated background colors from CSS variables
          ctx.fillStyle = isDark ? '#18181b' : '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(img, 0, 0, w * scale, h * scale);

          ctx.save();
          ctx.scale(scale, scale); 
          
          ctx.font = '700 32px "Rajdhani", monospace';
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.07)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const stepX = 300; 
          const stepY = 200; 
          const angle = -30 * (Math.PI / 180); 

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
          setShareMessage('✗ 匯出失敗');
          setTimeout(() => setShareMessage(null), 4000);
          URL.revokeObjectURL(url);
      }
      img.src = url;
    } catch (e) {
      console.error("Export failed", e);
      setIsExporting(false);
      setShareMessage('✗ 匯出失敗');
      setTimeout(() => setShareMessage(null), 4000);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const marks = Array.from(state.current.markedCells.values()).map((v) => ({
        x: v.x,
        y: v.y,
        color: v.color,
      }));

      const payload: SharedMapState = {
        marks,
        annotations,
      };

      // 呼叫 Cloudflare Worker API
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('https://tga-share.nossite.com/map/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分享失敗');
      }

      const { url: shareUrl } = await response.json();

      // 複製到剪貼簿
      let copySuccess = false;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copySuccess = true;
        } catch (clipboardError) {
          console.warn('Clipboard API 失敗，嘗試備用方案:', clipboardError);
        }
      }

      // Fallback 到舊方法
      if (!copySuccess) {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = shareUrl;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          textarea.setAttribute('readonly', '');
          document.body.appendChild(textarea);

          textarea.select();
          textarea.setSelectionRange(0, shareUrl.length);

          copySuccess = document.execCommand('copy');
          document.body.removeChild(textarea);

          if (!copySuccess) {
            throw new Error('複製失敗');
          }
        } catch (fallbackError) {
          console.error('備用複製方法失敗:', fallbackError);
          throw new Error('無法複製至剪貼簿');
        }
      }

      // 顯示成功訊息（包含短網址）
      setShareMessage(`✓ 已複製短網址！\n${shareUrl}`);
      setTimeout(() => setShareMessage(null), 5000);
    } catch (e) {
      console.error('無法生成分享連結:', e);
      setShareMessage(e instanceof Error ? e.message : '無法複製分享連結');
      setTimeout(() => setShareMessage(null), 4000);
    } finally {
      setIsSharing(false);
    }
  };

  const handleClearAll = () => {
    state.current.markedCells.forEach(v => removeMark(v.x, v.y));
    saveMarks();
  };

  const handleTextInputEnter = (value: string) => {
    if (value && currentAnnotationRef.current && currentAnnotationRef.current.textBox) {
      const textBox = currentAnnotationRef.current.textBox;
      addAnnotation({ 
        type: 'text', 
        start: textBox.start,
        end: textBox.end,
        x: textBox.centerX, 
        y: textBox.bottomY, 
        text: value, 
        color: annotationColor, 
        size: annotationSize 
      });
    }
    setTextInputVisible(false);
    setTextInputValue('');
  };

  const handleTextInputEscape = () => {
    setTextInputVisible(false);
    setTextInputValue('');
  };

  const handleTextInputBlur = () => {
    setTextInputVisible(false);
    setTextInputValue('');
  };

  return (
    <div className="w-full h-full bg-ccg-light dark:bg-ghoul-black text-gray-900 dark:text-white flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-300 relative z-10 overscroll-none">
      <ControlPanel
        lang={lang}
        onClose={onClose}
        markMode={markMode}
        setMarkMode={setMarkMode}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        exportQuality={exportQuality}
        setExportQuality={setExportQuality}
        isExporting={isExporting}
        onExport={handleExport}
        onClearAll={handleClearAll}
        annotationMode={annotationMode}
        onShare={handleShare}
        isSharing={isSharing}
        shareMessage={shareMessage}
        mapVersion={mapVersion}
        setMapVersion={setMapVersion}
      />

      <div className="flex-1 relative bg-[var(--map-bg)] transition-colors duration-300 overflow-hidden cursor-crosshair select-none z-10 order-1 lg:order-2 min-h-0 overscroll-none">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[linear-gradient(var(--grid-line-color)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line-color)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        
        <div className="atmospheric-layer absolute inset-0 z-[5] pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.06] select-none" style={{ mixBlendMode: 'overlay' }} aria-hidden="true">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250%] h-[250%] flex flex-wrap content-center justify-center rotate-[-20deg] gap-24">
               {WATERMARK_TILES.map((_, i) => (
                 <div key={i} className="w-48 flex justify-center items-center">
                    <span className="text-4xl font-black font-ghoul text-black dark:text-white uppercase tracking-[0.2em]">noswork</span>
                 </div>
               ))}
            </div>
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
        
        <TextInput
          visible={textInputVisible}
          position={textInputPosition}
          value={textInputValue}
          onChange={setTextInputValue}
          onEnter={handleTextInputEnter}
          onEscape={handleTextInputEscape}
          onBlur={handleTextInputBlur}
          currentAnnotationRef={currentAnnotationRef}
          annotationLayerRef={annotationLayerRef}
        />

        <AnnotationToolbar
          annotationMode={annotationMode}
          setAnnotationMode={setAnnotationMode}
          annotationColor={annotationColor}
          setAnnotationColor={setAnnotationColor}
          annotationSize={annotationSize}
          setAnnotationSize={setAnnotationSize}
          annotationHistory={annotationHistory}
          onUndo={handleUndo}
          onClear={handleClearAnnotations}
          onDone={handleExport}
          translations={aT}
        />
      </div>
    </div>
  );
};

