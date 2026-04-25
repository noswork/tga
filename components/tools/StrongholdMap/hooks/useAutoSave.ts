import { useEffect, useRef, useState } from 'react';
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

  // 追蹤 Map 的大小變化來觸發 useEffect
  const [mapSize, setMapSize] = useState(markedCells.size);
  const [annotationsCount, setAnnotationsCount] = useState(annotations.length);

  // 更新 refs 和追蹤變化
  useEffect(() => {
    markedCellsRef.current = markedCells;
    annotationsRef.current = annotations;
    setMapSize(markedCells.size);
    setAnnotationsCount(annotations.length);

    console.log('[AutoSave] 狀態更新:', {
      marks: markedCells.size,
      annotations: annotations.length,
    });
  }, [markedCells, annotations]);

  // 保存函數（可被定時器和離開事件共用）
  const saveMap = async (useBeacon = false) => {
    console.log('[AutoSave] saveMap 被調用, useBeacon:', useBeacon);

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

    console.log('[AutoSave] 當前狀態:', {
      marksCount: marks.length,
      annotationsCount: annotationsRef.current.length,
    });

    // 計算當前狀態的 hash（用於比較是否有變化）
    const currentStateStr = JSON.stringify(currentState);

    // 檢查是否有變化
    if (currentStateStr === lastSavedStateRef.current) {
      console.log('[AutoSave] 沒有變化，跳過保存');
      return;
    }

    // 檢查是否為空狀態（沒有標記也沒有註解）
    if (marks.length === 0 && annotationsRef.current.length === 0) {
      console.log('[AutoSave] 空狀態，跳過保存');
      lastSavedStateRef.current = currentStateStr;
      return;
    }

    // 避免重複保存
    if (isSavingRef.current) {
      console.log('[AutoSave] 正在保存中，跳過');
      return;
    }

    console.log('[AutoSave] 開始保存...');

    try {
      isSavingRef.current = true;

      if (useBeacon) {
        // 使用 sendBeacon 在頁面關閉時發送（更可靠）
        const blob = new Blob([JSON.stringify(currentState)], { type: 'application/json' });
        const sent = navigator.sendBeacon('https://tga-share.nossite.com/map/share', blob);

        if (sent) {
          lastSavedStateRef.current = currentStateStr;
          console.log('[AutoSave] ✓ 離開時自動保存已發送');
        } else {
          console.warn('[AutoSave] ✗ sendBeacon 發送失敗');
        }
      } else {
        // 正常的 fetch 請求
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        console.log('[AutoSave] 發送 fetch 請求...');

        const response = await fetch('https://tga-share.nossite.com/map/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentState),
          signal: controller.signal,
          keepalive: true, // 允許請求在頁面關閉後繼續
        });

        clearTimeout(timeout);

        console.log('[AutoSave] 收到響應:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('[AutoSave] 響應內容:', result);

          const { id, url } = result;

          // 更新 URL 參數（靜默更新，不刷新頁面）
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('mapId', id);
          window.history.replaceState({}, '', newUrl.toString());

          // 更新最後保存的狀態
          lastSavedStateRef.current = currentStateStr;

          console.log(`[AutoSave] ✓ 自動保存成功 | ID: ${id} | URL: ${url}`);
        } else {
          const errorText = await response.text();
          console.warn('[AutoSave] ✗ 自動保存失敗:', response.status, errorText);
        }
      }
    } catch (e) {
      // 靜默失敗，不打擾用戶
      console.warn('[AutoSave] ✗ 自動保存時發生錯誤:', e);
    } finally {
      isSavingRef.current = false;
    }
  };

  // 定時自動保存
  useEffect(() => {
    if (!enabled) {
      console.log('[AutoSave] 功能已停用');
      return;
    }

    // 清除現有的定時器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('[AutoSave] 設置 30 秒定時器');

    // 設置 30 秒後自動保存
    saveTimeoutRef.current = setTimeout(() => {
      console.log('[AutoSave] 30 秒到，開始檢查是否需要保存');
      saveMap(false);
    }, 30000); // 30 秒

    // 清理函數
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [mapSize, annotationsCount, enabled]); // 使用 mapSize 和 annotationsCount 來觸發

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
