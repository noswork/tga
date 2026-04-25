import { useEffect, useRef } from 'react';
import { Annotation, MarkData, SharedMapState } from '../types';

interface UseAutoSaveProps {
  markedCells: Map<string, MarkData>;
  annotations: Annotation[];
  enabled?: boolean;
}

export const useAutoSave = ({ markedCells, annotations, enabled = true }: UseAutoSaveProps) => {
  const lastSavedStateRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const markedCellsRef = useRef(markedCells);
  const annotationsRef = useRef(annotations);

  // 更新 refs
  useEffect(() => {
    markedCellsRef.current = markedCells;
    annotationsRef.current = annotations;
  }, [markedCells, annotations]);

  // 保存函數（可被定時器和離開事件共用）
  const saveMap = async (useBeacon = false) => {
    // 準備當前狀態
    const marks = Array.from(markedCellsRef.current.values()).map((v) => ({
      x: v.x,
      y: v.y,
      color: v.color,
    }));

    const currentState: SharedMapState = {
      marks,
      annotations: annotationsRef.current,
    };

    // 計算當前狀態的 hash（用於比較是否有變化）
    const currentStateStr = JSON.stringify(currentState);

    // 檢查是否有變化
    if (currentStateStr === lastSavedStateRef.current) {
      return;
    }

    // 檢查是否為空狀態（沒有標記也沒有註解）
    if (marks.length === 0 && annotationsRef.current.length === 0) {
      lastSavedStateRef.current = currentStateStr;
      return;
    }

    // 避免重複保存
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;

      if (useBeacon) {
        // 使用 sendBeacon 在頁面關閉時發送（更可靠）
        const blob = new Blob([JSON.stringify(currentState)], { type: 'application/json' });
        const sent = navigator.sendBeacon('https://tga-share.nossite.com/map/share', blob);

        if (sent) {
          lastSavedStateRef.current = currentStateStr;
          console.log('✓ 離開時自動保存已發送');
        }
      } else {
        // 正常的 fetch 請求
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch('https://tga-share.nossite.com/map/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentState),
          signal: controller.signal,
          keepalive: true, // 允許請求在頁面關閉後繼續
        });

        clearTimeout(timeout);

        if (response.ok) {
          const { id, url } = await response.json();

          // 更新 URL 參數（靜默更新，不刷新頁面）
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('mapId', id);
          window.history.replaceState({}, '', newUrl.toString());

          // 更新最後保存的狀態
          lastSavedStateRef.current = currentStateStr;

          console.log(`✓ 自動保存成功 | ID: ${id}`);
        } else {
          console.warn('自動保存失敗:', await response.text());
        }
      }
    } catch (e) {
      // 靜默失敗，不打擾用戶
      console.warn('自動保存時發生錯誤:', e);
    } finally {
      isSavingRef.current = false;
    }
  };

  // 定時自動保存
  useEffect(() => {
    if (!enabled) return;

    // 清除現有的定時器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 設置 30 秒後自動保存
    saveTimeoutRef.current = setTimeout(() => {
      saveMap(false);
    }, 30000); // 30 秒

    // 清理函數
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [markedCells, annotations, enabled]);

  // 監聽頁面離開事件
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      // 使用 sendBeacon 確保請求能發送出去
      saveMap(true);
    };

    const handleVisibilityChange = () => {
      // 當頁面變為隱藏時（例如切換標籤頁）也保存
      if (document.visibilityState === 'hidden') {
        saveMap(true);
      }
    };

    // 監聽多個事件以確保保存
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  return null;
};
