/**
 * TGA Map Share Service
 * 為 Tokyo Ghoul Awakening 地圖分享功能提供短網址服務
 *
 * 網域：tga-share.nossite.com
 * 格式：https://tga-share.nossite.com/map/abc12345
 *
 * API 端點：
 * - POST /map/share - 儲存地圖並返回短網址
 * - GET /map/:id - 讀取地圖資料
 * - GET /map/:id/stats - 查詢訪問統計
 * - GET /health - 健康檢查
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 標頭（允許所有來源訪問）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // ==================== CORS Preflight ====================
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // ==================== POST /map/share ====================
    // 儲存地圖資料並返回短網址
    if (request.method === 'POST' && path === '/map/share') {
      try {
        // 解析請求資料（支援 sendBeacon 的 text/plain 和正常的 application/json）
        const contentType = request.headers.get('Content-Type') || '';
        let data;

        if (contentType.includes('application/json')) {
          data = await request.json();
        } else {
          // sendBeacon 會使用 text/plain 或 application/x-www-form-urlencoded
          const text = await request.text();
          try {
            data = JSON.parse(text);
          } catch (e) {
            return jsonResponse({
              success: false,
              error: '無效的 JSON 格式'
            }, 400, corsHeaders);
          }
        }

        // 基本資料驗證
        if (!data || typeof data !== 'object') {
          return jsonResponse({
            success: false,
            error: '無效的資料格式'
          }, 400, corsHeaders);
        }

        if (!Array.isArray(data.marks) || !Array.isArray(data.annotations)) {
          return jsonResponse({
            success: false,
            error: '資料結構錯誤：缺少 marks 或 annotations'
          }, 400, corsHeaders);
        }

        // 資料大小檢查（限制 100KB）
        const dataStr = JSON.stringify(data);
        const sizeInBytes = new Blob([dataStr]).size;
        const sizeInKB = (sizeInBytes / 1024).toFixed(2);

        if (sizeInBytes > 100000) {
          return jsonResponse({
            success: false,
            error: `資料太大（${sizeInKB} KB），請減少標記或註解（上限 100 KB）`
          }, 413, corsHeaders);
        }

        // 速率限制（每個 IP 每小時最多 20 次分享）
        const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
        const rateLimitKey = `ratelimit:${clientIp}`;
        const rateLimitCount = parseInt(await env.TGA_MAPS.get(rateLimitKey) || '0');

        if (rateLimitCount >= 20) {
          return jsonResponse({
            success: false,
            error: '請求過於頻繁，請稍後再試（每小時限制 20 次）'
          }, 429, corsHeaders);
        }

        // 更新速率限制計數
        await env.TGA_MAPS.put(rateLimitKey, String(rateLimitCount + 1), {
          expirationTtl: 3600, // 1 小時後重置
        });

        // 生成唯一短 ID（防止碰撞）
        const shortId = await generateUniqueShortId(env);

        // 建立元資料
        const metadata = {
          createdAt: new Date().toISOString(),
          ip: clientIp,
          marksCount: data.marks.length,
          annotationsCount: data.annotations.length,
          sizeBytes: sizeInBytes,
        };

        // 儲存地圖資料（保存 30 天）
        await env.TGA_MAPS.put(shortId, dataStr, {
          expirationTtl: 60 * 60 * 24 * 30, // 30 天
          metadata: metadata,
        });

        // 初始化訪問統計
        await env.TGA_MAPS.put(`stats:${shortId}`, '0', {
          expirationTtl: 60 * 60 * 24 * 30,
        });

        // 返回短網址（使用 tga-share.nossite.com）
        const shareUrl = `https://tga-share.nossite.com/map/${shortId}`;

        console.log(`✓ 分享成功 | ID: ${shortId} | Size: ${sizeInKB} KB | IP: ${clientIp}`);

        return jsonResponse({
          success: true,
          id: shortId,
          url: shareUrl,
          expiresIn: '30 天',
          size: `${sizeInKB} KB`,
        }, 200, corsHeaders);

      } catch (e) {
        console.error('儲存失敗:', e);
        return jsonResponse({
          success: false,
          error: '伺服器錯誤：' + e.message
        }, 500, corsHeaders);
      }
    }

    // ==================== GET /map/:id ====================
    // 讀取地圖資料
    if (request.method === 'GET' && path.startsWith('/map/')) {
      const shortId = path.replace('/map/', '').replace('/stats', '').trim();

      // 檢查是否為統計查詢
      if (path.endsWith('/stats')) {
        // 轉到統計處理
        return handleStats(env, shortId, corsHeaders);
      }

      // 驗證 ID 格式（10位時間戳_4字元隨機碼）
      if (!/^\d{10}_[A-Za-z0-9]{4}$/.test(shortId)) {
        return jsonResponse({
          success: false,
          error: '無效的分享 ID 格式（應為 10位時間戳_4字元隨機碼）'
        }, 400, corsHeaders);
      }

      try {
        // 從 KV 讀取資料
        const data = await env.TGA_MAPS.get(shortId);

        if (!data) {
          return jsonResponse({
            success: false,
            error: '分享連結不存在或已過期（有效期 30 天）'
          }, 404, corsHeaders);
        }

        // 增加訪問統計（非阻塞）
        ctx.waitUntil(incrementViewCount(env, shortId));

        // 檢查是否為瀏覽器直接訪問
        const acceptHeader = request.headers.get('Accept') || '';
        const isBrowserVisit = acceptHeader.includes('text/html');

        if (isBrowserVisit) {
          // 重定向到主站
          const mainSiteUrl = `https://tga.nossite.com/?mapId=${shortId}`;
          return Response.redirect(mainSiteUrl, 302);
        }

        // API 請求：返回 JSON 資料
        const parsedData = JSON.parse(data);

        console.log(`✓ 讀取成功 | ID: ${shortId}`);

        return jsonResponse({
          success: true,
          data: parsedData,
          id: shortId,
        }, 200, corsHeaders);

      } catch (e) {
        console.error('讀取失敗:', e);
        return jsonResponse({
          success: false,
          error: '伺服器錯誤：' + e.message
        }, 500, corsHeaders);
      }
    }

    // ==================== GET /health ====================
    // 健康檢查端點
    if (path === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'TGA Map Share Service',
        version: '1.1.0',
        domain: 'tga-share.nossite.com',
        timestamp: new Date().toISOString(),
        features: ['auto-save', 'sendBeacon-support'],
      }, 200, corsHeaders);
    }

    // ==================== 404 Not Found ====================
    return jsonResponse({
      success: false,
      error: 'Not Found',
      availableEndpoints: [
        'POST /map/share',
        'GET /map/:id',
        'GET /map/:id/stats',
        'GET /health',
      ]
    }, 404, corsHeaders);
  }
};

// ==================== 輔助函數 ====================

/**
 * 處理統計查詢
 */
async function handleStats(env, shortId, corsHeaders) {
  // 驗證 ID 格式
  if (!/^\d{10}_[A-Za-z0-9]{4}$/.test(shortId)) {
    return jsonResponse({
      success: false,
      error: '無效的分享 ID 格式'
    }, 400, corsHeaders);
  }

  try {
    const views = await env.TGA_MAPS.get(`stats:${shortId}`);
    const exists = await env.TGA_MAPS.get(shortId);

    if (!exists) {
      return jsonResponse({
        success: false,
        error: '分享連結不存在'
      }, 404, corsHeaders);
    }

    return jsonResponse({
      success: true,
      id: shortId,
      views: parseInt(views || '0'),
    }, 200, corsHeaders);

  } catch (e) {
    return jsonResponse({
      success: false,
      error: '查詢失敗：' + e.message
    }, 500, corsHeaders);
  }
}

/**
 * 生成唯一短 ID（時間戳前綴，支援 KV 按序瀏覽）
 * 格式：1742001234_aBcD（Unix 秒數_4位隨機）
 */
async function generateUniqueShortId(env) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const ts = String(Math.floor(Date.now() / 1000)).padStart(10, '0');
  let attempts = 0;

  while (attempts < 10) {
    let suffix = '';
    for (let i = 0; i < 4; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const id = `${ts}_${suffix}`;
    const exists = await env.TGA_MAPS.get(id);
    if (!exists) return id;
    attempts++;
  }

  throw new Error('無法生成唯一 ID，請稍後重試');
}

/**
 * 增加訪問統計
 */
async function incrementViewCount(env, shortId) {
  try {
    const statsKey = `stats:${shortId}`;
    const currentViews = parseInt(await env.TGA_MAPS.get(statsKey) || '0');
    await env.TGA_MAPS.put(statsKey, String(currentViews + 1), {
      expirationTtl: 60 * 60 * 24 * 30,
    });
  } catch (e) {
    console.error('統計更新失敗:', e);
    // 不影響主流程
  }
}

/**
 * 統一的 JSON 回應函數
 */
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...headers,
    },
  });
}
