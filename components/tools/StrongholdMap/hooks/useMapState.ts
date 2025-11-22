import { useRef } from 'react';
import { MapState } from '../types';

export const useMapState = () => {
  const state = useRef<MapState>({
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

  return state;
};

