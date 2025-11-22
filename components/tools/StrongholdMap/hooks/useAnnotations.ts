import { useState, useRef, useEffect } from 'react';
import { Annotation, AnnotationMode } from '../types';

export const useAnnotations = (
  annotationMode: AnnotationMode,
  annotationColor: string,
  annotationSize: number,
  annotationLayerRef: React.RefObject<SVGGElement>
) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [annotationHistory, setAnnotationHistory] = useState<Annotation[][]>([]);
  const isDrawingRef = useRef(false);
  const currentAnnotationRef = useRef<any>(null);
  const sketchPathRef = useRef<SVGPathElement | null>(null);

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations(prev => {
      const newAnnotation = { ...annotation, id: Date.now() };
      setAnnotationHistory(history => [...history, [...prev]]);
      return [...prev, newAnnotation];
    });
  };

  const renderAnnotation = (annotation: Annotation) => {
    if (!annotationLayerRef.current) return;
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-annotation-id", String(annotation.id || Date.now()));
    
    if (annotation.type === 'arrow') {
      const { start, end, color, size } = annotation;
      if (!start || !end) return;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const strokeWidth = size || annotationSize;
      const arrowHeadSize = Math.max(strokeWidth * 2, strokeWidth * 3);
      
      const lineEndX = end.x - arrowHeadSize * Math.cos(angle);
      const lineEndY = end.y - arrowHeadSize * Math.sin(angle);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(lineEndX));
      line.setAttribute("y2", String(lineEndY));
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", String(strokeWidth));
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
      const { start, end, color, size } = annotation;
      if (!start || !end) return;
      const strokeWidth = size || annotationSize;
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
      rect.setAttribute("stroke-width", String(strokeWidth));
      g.appendChild(rect);
    } else if (annotation.type === 'text') {
      const { x, y, text, color, size, start, end } = annotation;
      const strokeWidth = size || annotationSize;
      const fontSize = strokeWidth * 2; // 文字大小是框线条大小的2倍
      
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
        rect.setAttribute("stroke-width", String(strokeWidth));
        g.appendChild(rect);
      }
      
      const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      let textX = x || 0;
      let textY = y || 0;
      if (start && end) {
        textX = (Math.min(start.x, end.x) + Math.abs(end.x - start.x) / 2);
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
      textEl.textContent = text || '';
      g.appendChild(textEl);
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
    
    annotationLayerRef.current.appendChild(g);
  };

  const renderCurrentAnnotation = () => {
    if (!currentAnnotationRef.current || !annotationLayerRef.current) return;
    
    const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
    if (temp) temp.remove();
    
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("data-temp", "true");
    
    const annotation = currentAnnotationRef.current;
    if (annotation.type === 'arrow') {
      const { start, end, color, size } = annotation;
      if (!start || !end) return;
      const strokeWidth = size || annotationSize;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const angle = Math.atan2(dy, dx);
      const arrowHeadSize = Math.max(strokeWidth * 2, strokeWidth * 3);
      
      const lineEndX = end.x - arrowHeadSize * Math.cos(angle);
      const lineEndY = end.y - arrowHeadSize * Math.sin(angle);
      
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(start.x));
      line.setAttribute("y1", String(start.y));
      line.setAttribute("x2", String(lineEndX));
      line.setAttribute("y2", String(lineEndY));
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", String(strokeWidth));
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
      const { start, end, color, size } = annotation;
      if (!start || !end) return;
      const strokeWidth = size || annotationSize;
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
      rect.setAttribute("stroke-width", String(strokeWidth));
      g.appendChild(rect);
    } else if (annotation.type === 'text') {
      const { start, end, color, size } = annotation;
      if (!start || !end) return;
      const strokeWidth = size || annotationSize;
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
      rect.setAttribute("stroke-width", String(strokeWidth));
      g.appendChild(rect);
    }
    
    annotationLayerRef.current.appendChild(g);
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
      if (annotationLayerRef.current) {
        annotationLayerRef.current.innerHTML = '';
      }
      return [];
    });
  };

  // Re-render annotations when they change
  useEffect(() => {
    if (!annotationLayerRef.current) return;
    annotationLayerRef.current.innerHTML = '';
    annotations.forEach(ann => {
      renderAnnotation(ann);
    });
  }, [annotations]);

  // Close text input when switching tools
  useEffect(() => {
    if (annotationMode !== 'text') {
      if (annotationLayerRef.current) {
        const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
        if (temp) temp.remove();
      }
      if (currentAnnotationRef.current) {
        currentAnnotationRef.current = null;
      }
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

