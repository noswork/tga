import React, { useRef, useEffect } from 'react';
import { ArrowRight, Square, Type, Pencil, Eraser, Undo2, RotateCcw, CheckCircle, GripVertical } from 'lucide-react';
import { AnnotationMode, Annotation } from '../types';
import { SIZE_OPTIONS } from '../config';

interface AnnotationToolbarProps {
  annotationMode: AnnotationMode;
  setAnnotationMode: (mode: AnnotationMode) => void;
  annotationColor: string;
  setAnnotationColor: (color: string) => void;
  annotationSize: number;
  setAnnotationSize: (size: number) => void;
  annotationHistory: Annotation[][];
  onUndo: () => void;
  onClear: () => void;
  onDone: () => void;
  translations: {
    addArrow: string;
    addRectangle: string;
    addText: string;
    startSketching: string;
    undo: string;
    clear: string;
    done: string;
  };
}

export const AnnotationToolbar: React.FC<AnnotationToolbarProps> = ({
  annotationMode,
  setAnnotationMode,
  annotationColor,
  setAnnotationColor,
  annotationSize,
  setAnnotationSize,
  annotationHistory,
  onUndo,
  onClear,
  onDone,
  translations: aT,
}) => {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = React.useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = React.useState(false);
  const [toolbarDragStart, setToolbarDragStart] = React.useState({ x: 0, y: 0 });

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
  }, [isDraggingToolbar, toolbarDragStart, toolbarPosition]);

  return (
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
        
        {/* Unified size selector */}
        <div className="flex items-center gap-1">
          <Type size={14} className="text-gray-500 dark:text-zinc-500" />
          <select
            value={annotationSize}
            onChange={(e) => setAnnotationSize(Number(e.target.value))}
            className="px-1 py-1 text-xs rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-black/30 text-gray-900 dark:text-white"
          >
            {SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        {/* Divider */}
        <div className="w-px h-8 bg-gray-300 dark:bg-zinc-700"></div>
        
        {/* Action buttons */}
        <button 
          onClick={onUndo} 
          disabled={annotationHistory.length === 0}
          className={`p-2 rounded transition-all ${annotationHistory.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/5 dark:hover:bg-white/5'} bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500`}
          title={aT.undo}
        >
          <Undo2 size={16} />
        </button>
        <button 
          onClick={onClear} 
          className="p-2 rounded transition-all bg-gray-100 dark:bg-black/30 text-gray-500 dark:text-zinc-500 hover:bg-black/5 dark:hover:bg-white/5"
          title={aT.clear}
        >
          <RotateCcw size={16} />
        </button>
        <button 
          onClick={onDone} 
          className="p-2 rounded transition-all bg-green-600 text-white hover:bg-green-700 shadow-md"
          title={aT.done}
        >
          <CheckCircle size={16} />
        </button>
      </div>
    </div>
  );
};

