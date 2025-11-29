import { Lang } from '../../../types';

export interface StrongholdMapProps {
  lang: Lang;
  onClose: () => void;
}

export type MarkMode = 'add' | 'remove';
export type AnnotationMode = 'none' | 'arrow' | 'rectangle' | 'text' | 'sketch' | 'eraser';

export interface MapState {
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
}

export interface CellData {
  group: SVGGElement;
  polygon: SVGPolygonElement;
  cx: number;
  cy: number;
  points: string;
}

export interface MarkData {
  x: number;
  y: number;
  color: string;
  el: SVGPolygonElement;
}

export interface Annotation {
  id?: number;
  type: 'arrow' | 'rectangle' | 'text' | 'sketch';
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  x?: number;
  y?: number;
  text?: string;
  color: string;
  size: number;
  pathData?: string;
  textBox?: {
    start: { x: number; y: number };
    end: { x: number; y: number };
    centerX: number;
    bottomY: number;
  };
}

export interface SharedMapState {
  marks: {
    x: number;
    y: number;
    color: string;
  }[];
  annotations: Annotation[];
}


