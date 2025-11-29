import React, { useRef, useEffect } from 'react';
import { Annotation } from '../types';

interface TextInputProps {
  visible: boolean;
  position: { x: number; y: number };
  value: string;
  onChange: (value: string) => void;
  onEnter: (value: string) => void;
  onEscape: () => void;
  onBlur: () => void;
  currentAnnotationRef: React.MutableRefObject<any>;
  annotationLayerRef: React.RefObject<SVGGElement>;
}

export const TextInput: React.FC<TextInputProps> = ({
  visible,
  position,
  value,
  onChange,
  onEnter,
  onEscape,
  onBlur,
  currentAnnotationRef,
  annotationLayerRef,
}) => {
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && textInputRef.current) {
      requestAnimationFrame(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          textInputRef.current.select();
        }
      });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      data-text-input-container
      className="absolute z-40 bg-white dark:bg-[#18181b] rounded-lg shadow-2xl border border-gray-200 dark:border-zinc-800 p-2 pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            if (value.trim() && currentAnnotationRef.current && currentAnnotationRef.current.textBox) {
              onEnter(value.trim());
              // Clear the temporary selection box
              if (annotationLayerRef.current) {
                const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
                if (temp) temp.remove();
              }
              currentAnnotationRef.current = null;
            }
          } else if (e.key === 'Escape') {
            // Clear the temporary selection box
            if (annotationLayerRef.current) {
              const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
              if (temp) temp.remove();
            }
            if (currentAnnotationRef.current) {
              currentAnnotationRef.current = null;
            }
            onEscape();
          }
        }}
        onBlur={(e) => {
          const inputEl = e.currentTarget;
          const container = inputEl.parentElement;

          setTimeout(() => {
            const activeElement = document.activeElement;

            if (
              activeElement !== inputEl &&
              (!container || !container.contains(activeElement))
            ) {
              if (!textInputRef.current?.matches(':focus')) {
                // Clear the temporary selection box
                if (annotationLayerRef.current) {
                  const temp = annotationLayerRef.current.querySelector('[data-temp="true"]');
                  if (temp) temp.remove();
                }
                if (currentAnnotationRef.current) {
                  currentAnnotationRef.current = null;
                }
                onBlur();
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
  );
};

