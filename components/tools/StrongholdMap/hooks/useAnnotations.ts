import { useState, useRef, useEffect } from 'react';
import { Annotation, AnnotationMode } from '../types';
import { STORAGE_KEYS } from '../config';

export const useAnnotations = (
  annotationMode: AnnotationMode,
  annotationColor: string,
  annotationSize: number,
  annotationLayerRef: React.RefObject<SVGGElement>,
  onError?: (msg: string) => void
) => {
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.annotations);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('載入註解失敗:', e);
    }
    return [];
  });
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.annotations, JSON.stringify(annotations));
    } catch (e) {
      console.warn('儲存註解失敗:', e);
      onError?.('✗ 儲存失敗：儲存空間不足');
    }
  }, [annotations]);

  const isDrawingRef = useRef(false);
  const currentAnnotationRef = useRef<Annotation | null>(null);
  const sketchPathRef = useRef<SVGPathElement | null>(null);

  // Build a <g> element for an annotation (shared by renderAnnotation + renderCurrentAnnotation)
  const buildAnnotationElement = (annotation: Annotation, temp = false): SVGGElement | null => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    if (temp) {
      g.setAttribute("data-temp", "true");
    } else {
      g.setAttribute("data-annotation-id", String(annotation.id || Date.now()));
    }

    if (annotation.type === 'arrow') {
      const { start, end, color, size } = annotation;
      if (!start || !end) return null;
      const strokeWidth = size || annotationSize;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy);
      if (len < 1) return null;
      const angle = Math.atan2(dy, dx);
      const headLen = strokeWidth * 4;
      const headAngle = Math.PI / 6;

      // Single path: line + arrowhead as one connected shape
      const x1 = start.x;
      const y1 = start.y;
      const x2 = end.x;
      const y2 = end.y;
      const lx1 = x2 - headLen * Math.cos(angle - headAngle);
      const ly1 = y2 - headLen * Math.sin(angle - headAngle);
      const lx2 = x2 - headLen * Math.cos(angle + headAngle);
      const ly2 = y2 - headLen * Math.sin(angle + headAngle);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2} M ${lx1} ${ly1} L ${x2} ${y2} L ${lx2} ${ly2}`);
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", String(strokeWidth));
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("fill", "none");
      g.appendChild(path);

    } else if (annotation.type === 'rectangle') {
      const { start, end, color, size } = annotation;
      if (!start || !end) return null;
      const strokeWidth = size || annotationSize;
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(Math.min(start.x, end.x)));
      rect.setAttribute("y", String(Math.min(start.y, end.y)));
      rect.setAttribute("width", String(Math.abs(end.x - start.x)));
      rect.setAttribute("height", String(Math.abs(end.y - start.y)));
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", color);
      rect.setAttribute("stroke-width", String(strokeWidth));
      g.appendChild(rect);

    } else if (annotation.type === 'text') {
      const { x, y, text, color, size, start, end } = annotation;
      const strokeWidth = size || annotationSize;
      const fontSize = strokeWidth * 2;

      if (start && end) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", String(Math.min(start.x, end.x)));
        rect.setAttribute("y", String(Math.min(start.y, end.y)));
        rect.setAttribute("width", String(Math.abs(end.x - start.x)));
        rect.setAttribute("height", String(Math.abs(end.y - start.y)));
        rect.setAttribute("fill", "none");
        rect.setAttribute("stroke", color);
        rect.setAttribute("stroke-width", String(strokeWidth));
        g.appendChild(rect);
      }

      if (!temp && text) {
        const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let textX = x || 0;
        let textY = y || 0;
        if (start && end) {
          textX = Math.min(start.x, end.x) + Math.abs(end.x - start.x) / 2;
          const boxBottom = Math.max(start.y, end.y);
          const boxHeight = Math.abs(end.y - start.y);
          textY = boxBottom + Math.max(boxHeight * 0.2, fontSize * 0.5);
        }
        textEl.setAttribute("x", String(textX));
        textEl.setAttribute("y", String(textY));
        textEl.setAttribute("fill", color);
        textEl.setAttribute("font-size", String(fontSize));
        textEl.setAttribute("font-weight", "bold");
        textEl.setAttribute("font-family", "monospace");
        textEl.setAttribute("text-anchor", "middle");
        textEl.setAttribute("dominant-baseline", "hanging");
        textEl.textContent = text;
        g.appendChild(textEl);
      }

    } else if (annotation.type === 'sketch') {
      const { pathData, color, size } = annotation;
      const strokeWidth = size || annotationSize;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", pathData || '');
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", String(strokeWidth));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      g.appendChild(path);
    }

    return g;
  };

  const renderAnnotation = (annotation: Annotation) => {
    if (!annotationLayerRef.current) return;
    const el = buildAnnotationElement(annotation);
    if (el) annotationLayerRef.current.appendChild(el);
  };

  const renderCurrentAnnotation = () => {
    if (!currentAnnotationRef.current || !annotationLayerRef.current) return;
    const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
    if (temp) temp.remove();
    const el = buildAnnotationElement(currentAnnotationRef.current, true);
    if (el) annotationLayerRef.current.appendChild(el);
  };

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations(prev => {
      const newAnnotation = { ...annotation, id: Date.now() };
      setAnnotationHistory(history => [...history, [...prev]]);
      return [...prev, newAnnotation];
    });
  };

  const handleUndo = () => {
    if (annotationHistory.length === 0) return;
    const previous = annotationHistory[annotationHistory.length - 1];
    setAnnotations(previous);
    setAnnotationHistory(prev => prev.slice(0, -1));
    if (annotationLayerRef.current) {
      annotationLayerRef.current.innerHTML = '';
      previous.forEach(renderAnnotation);
    }
  };

  const handleClearAnnotations = () => {
    setAnnotations(prev => {
      setAnnotationHistory(history => [...history, [...prev]]);
      if (annotationLayerRef.current) annotationLayerRef.current.innerHTML = '';
      return [];
    });
  };

  // Diff-based re-render: only add new annotations, remove deleted ones
  useEffect(() => {
    if (!annotationLayerRef.current) return;

    const layer = annotationLayerRef.current;
    const existingIds = new Set(
      Array.from(layer.querySelectorAll('[data-annotation-id]')).map(el =>
        Number(el.getAttribute('data-annotation-id'))
      )
    );
    const currentIds = new Set(annotations.map(a => a.id));

    // Remove deleted annotations
    existingIds.forEach(id => {
      if (!currentIds.has(id)) {
        layer.querySelector(`[data-annotation-id="${id}"]`)?.remove();
      }
    });

    // Add new annotations
    annotations.forEach(ann => {
      if (ann.id && !existingIds.has(ann.id)) {
        const el = buildAnnotationElement(ann);
        if (el) layer.appendChild(el);
      }
    });
  }, [annotations]);

  // Close text input when switching tools
  useEffect(() => {
    if (annotationMode !== 'text') {
      annotationLayerRef.current?.querySelector('[data-temp="true"]')?.remove();
      currentAnnotationRef.current = null;
    }
  }, [annotationMode]);

  return {
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
  };
};
