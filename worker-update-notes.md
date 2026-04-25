# Cloudflare Worker 更新說明

## 需要更新的原因

`navigator.sendBeacon()` 發送的請求使用 `Content-Type: text/plain` 而不是 `application/json`，需要在 worker 中處理這種情況。

## 更新方法

在 worker 的 `POST /map/share` 處理部分，修改請求解析邏輯：

```javascript
// ==================== POST /map/share ====================
if (request.method === 'POST' && path === '/map/share') {
  try {
    // 解析請求資料（支援 sendBeacon 的 text/plain）
    const contentType = request.headers.get('Content-Type') || '';
    let data;
    
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      // sendBeacon 會使用 text/plain
      const text = await request.text();
      data = JSON.parse(text);
    }
    
    // 基本資料驗證
    if (!data || typeof data !== 'object') {
      return jsonResponse({ 
        success: false,
        error: '無效的資料格式' 
      }, 400, corsHeaders);
    }

    // ... 其餘代碼保持不變
```

## 替代方案（不更新 worker）

如果暫時不想更新 worker，可以修改前端代碼，在離開時也使用 fetch：

```typescript
// 在 useAutoSave.ts 中
if (useBeacon) {
  // 使用 fetch + keepalive 代替 sendBeacon
  fetch('https://tga-share.nossite.com/map/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentState),
    keepalive: true,
  }).catch(() => {
    // 靜默失敗
  });
  
  lastSavedStateRef.current = currentStateStr;
  console.log('✓ 離開時自動保存已發送');
}
```

## 建議

**推薦更新 worker**，因為：
1. `sendBeacon()` 更可靠，瀏覽器保證會發送
2. 不會阻塞頁面關閉
3. 是標準的頁面離開時發送數據的方式
