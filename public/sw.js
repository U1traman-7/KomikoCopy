const CACHE_NAME = 'komiko-2025122501';
const STATIC_CACHE = 'komiko-static-2025122501';
const API_CACHE = 'komiko-api-2025122501';
const VIDEO_CACHE = 'komiko-video-2025122501';

// 缓存大小限制，防止内存泄漏
const MAX_CACHE_SIZE = {
  STATIC: 50, // 静态资源最多50个
  API: 20, // API响应最多20个
  PAGES: 10, // 页面最多10个
  VIDEO: 100, // 视频模板最多100个
};

// 缓存时间限制 (毫秒)
const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000, // 静态资源24小时
  API: 5 * 60 * 1000, // API响应5分钟
  PAGES: 60 * 60 * 1000, // 页面1小时
  VIDEO: 7 * 24 * 60 * 60 * 1000, // 视频模板7天
};

// 检测是否为开发环境
const isDevelopment =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname.endsWith('.local') ||
  self.location.port === '3000'; // Next.js dev

// 紧急开关 - 如果发现问题可以快速禁用
const isEmergencyDisabled =
  self.location.search.includes('disable-sw') ||
  self.location.hash.includes('disable-sw');

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/favicons/favicon-32x32.png',
  '/images/favicons/apple-icon-152x152.png',
  // 添加关键字体文件
  '/fonts/animeace2_bld.ttf',
];

// 缓存清理计数器，避免频繁清理
const cacheCleanupCounters = {
  [STATIC_CACHE]: 0,
  [API_CACHE]: 0,
  [CACHE_NAME]: 0,
  [VIDEO_CACHE]: 0,
};

// CloudFront 域名白名单
// const ALLOWED_CDN_ORIGINS = ['https://d31cygw67xifd4.cloudfront.net'];

// 缓存清理工具 - 优化版本
async function limitCacheSize(cacheName, maxSize) {
  try {
    // 每10次操作才执行一次清理检查，减少性能影响
    cacheCleanupCounters[cacheName] =
      (cacheCleanupCounters[cacheName] || 0) + 1;
    if (cacheCleanupCounters[cacheName] % 10 !== 0) {
      return;
    }

    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxSize) {
      // 删除最旧的缓存项
      const keysToDelete = keys.slice(0, keys.length - maxSize);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
      // console.log(
      //   `清理缓存 ${cacheName}: 删除了 ${keysToDelete.length} 个旧项`,
      // );

      // 如果删除的项目很多，发送性能警告
      if (keysToDelete.length > 20) {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SW_PERFORMANCE_WARNING',
              message: `Large cache cleanup: ${keysToDelete.length} items deleted from ${cacheName}`,
              cacheSize: keys.length,
            });
          });
        });
      }
    }
  } catch (error) {
    console.error(`清理缓存 ${cacheName} 失败:`, error);
  }
}

// 检查缓存是否过期
function isCacheExpired(response, ttl) {
  const cachedTime = response.headers.get('sw-cached-time');
  if (!cachedTime) return true;

  return Date.now() - parseInt(cachedTime) > ttl;
}

// 添加缓存时间戳
async function addCacheTimestamp(response) {
  try {
    // Skip timestamping for large responses to avoid memory issues
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      // 10MB limit
      console.warn('Response too large for timestamping, using original');
      return response;
    }

    const headers = new Headers(response.headers);
    headers.set('sw-cached-time', Date.now().toString());

    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
  } catch (error) {
    console.warn('添加缓存时间戳失败，使用原始响应:', error);
    return response;
  }
}
// 优化的缓存助手函数
async function cacheResponse(cacheName, request, response, maxSize) {
  if (!response || !response.ok) {
    return;
  }

  try {
    const cache = await caches.open(cacheName);
    const responseForCache = response.clone();
    const responseWithTimestamp = await addCacheTimestamp(responseForCache);

    if (
      responseWithTimestamp &&
      responseWithTimestamp.status >= 200 &&
      responseWithTimestamp.status < 300 &&
      responseWithTimestamp.status !== 206
    ) {
      await cache.put(request, responseWithTimestamp);
      limitCacheSize(cacheName, maxSize).catch(error => {
        console.error(`限制缓存大小失败 (${cacheName}):`, error);
      });
    }
  } catch (error) {
    console.error(`缓存响应失败 (${cacheName}):`, error);
    reportError(error, 'cache_response');
  }
}

// 安装事件 - 预缓存静态资源
self.addEventListener('install', event => {
  // console.log('Service Worker installing...');

  // 立即激活新的 Service Worker，跳过等待
  event.waitUntil(self.skipWaiting());

  // 在开发环境中跳过预缓存
  if (isDevelopment) {
    // console.log('Development mode: skipping precaching');
    return;
  }

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => {
        // console.log('Caching static assets');
        return Promise.allSettled(
          STATIC_ASSETS.map(asset =>
            cache.add(asset).catch(error => {
              console.warn(`缓存资源失败: ${asset}`, error);
              // 不阻止其他资源的缓存
              return null;
            }),
          ),
        ).then(results => {
          const failed = results.filter(result => result.status === 'rejected');
          if (failed.length > 0) {
            console.warn(
              `${failed.length} 个静态资源缓存失败，但Service Worker继续安装`,
            );
          }
          // console.log('Static assets caching completed');
        });
      })
      .catch(error => {
        console.error('Error opening static cache during install:', error);
        // 即使预缓存失败，也要继续安装Service Worker
      }),
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
  // console.log('Service Worker activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== VIDEO_CACHE
          ) {
            // console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      ).then(() => {
        // 强制所有客户端立即使用新的 Service Worker
        return self.clients.claim();
      });
    }),
  );
});

// Fetch事件 - 缓存策略
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 紧急开关 - 如果启用则跳过所有缓存逻辑
  if (isEmergencyDisabled) {
    // console.log('SW: Emergency disabled, letting request pass through');
    return; // 让所有请求直接通过
  }

  // 在开发环境中跳过所有缓存逻辑
  if (isDevelopment) {
    return; // 让所有请求直接通过，不进行缓存
  }

  // 记录所有被拦截的请求
  if (url.origin === self.location.origin) {
    // console.log(`SW: 处理请求 ${request.method} ${url.pathname}`, {
    //   destination: request.destination,
    //   mode: request.mode,
    //   pauseCaching: self.pauseCaching,
    //   timestamp: new Date().toISOString(),
    // });
  }

  // 检测高CPU活动，暂停缓存减少性能影响
  if (self.pauseCaching) {
    return; // 暂停缓存期间直接通过
  }

  // 跳过非GET请求
  if (request.method !== 'GET') {
    return;
  }

  // 跳过Chrome扩展请求
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // 检查是否为允许缓存的 CDN 视频
  // const isCDNVideo = ALLOWED_CDN_ORIGINS.some(origin => url.origin === origin);

  if (url.origin !== self.location.origin) {
    return;
  }

  // CDN 视频缓存策略 (Cache First with long TTL)
  // if (isCDNVideo) {
  //   event.respondWith(
  //     caches.match(request).then(cachedResponse => {
  //       // 检查缓存是否过期
  //       if (
  //         cachedResponse &&
  //         !isCacheExpired(cachedResponse, CACHE_TTL.VIDEO)
  //       ) {
  //         return cachedResponse;
  //       }

  //       // 使用 cors 模式获取跨域视频
  //       const corsRequest = new Request(request.url, {
  //         mode: 'cors',
  //         credentials: 'omit',
  //       });

  //       return fetch(corsRequest)
  //         .then(async response => {
  //           if (!response || !response.ok) {
  //             return response;
  //           }

  //           // 只缓存成功的 CORS 响应
  //           if (response.type === 'cors' || response.type === 'basic') {
  //             const responseClone = response.clone();

  //             // 异步缓存，不阻塞响应
  //             cacheResponse(
  //               VIDEO_CACHE,
  //               request,
  //               responseClone,
  //               MAX_CACHE_SIZE.VIDEO,
  //             ).catch(error => {
  //               console.warn('视频缓存失败:', error);
  //             });
  //           }

  //           return response;
  //         })
  //         .catch(error => {
  //           console.error('获取视频失败:', error);
  //           // 离线时返回缓存，即使过期
  //           return cachedResponse || Promise.reject(error);
  //         });
  //     }),
  //   );
  //   return;
  // }

  // 静态资源缓存策略 (Cache First)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'video' ||
    request.destination === 'audio'
  ) {
    event.respondWith(
      caches
        .match(request)
        .then(cachedResponse => {
          // 检查缓存是否过期
          if (
            cachedResponse &&
            !isCacheExpired(cachedResponse, CACHE_TTL.STATIC)
          ) {
            return cachedResponse;
          }

          // 使用新请求对象避免复用问题，并明确处理重定向
          const fetchRequest = new Request(request.url, {
            method: request.method,
            headers: request.headers,
            mode: request.mode,
            credentials: request.credentials,
            redirect: 'follow',
          });

          return fetch(fetchRequest)
            .then(async response => {
              const responseClone = response.clone();

              const isRangeRequest = request.headers.get('range');
              if (!isRangeRequest) {
                cacheResponse(
                  STATIC_CACHE,
                  request,
                  responseClone,
                  MAX_CACHE_SIZE.STATIC,
                ).catch(error => {
                  console.warn('静态资源缓存失败:', error);
                });
              }

              return response;
            })
            .catch(error => {
              console.error('获取静态资源失败:', error);
              throw error;
            });
        })
        .catch(() => {
          // 离线时的回退
          if (request.destination === 'image') {
            return new Response('<svg>...</svg>', {
              headers: { 'Content-Type': 'image/svg+xml' },
            });
          }
        }),
    );
    return;
  }

  // API缓存策略 (Network First with Cache Fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(async response => {
          // 只缓存GET请求的成功响应
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();

            cacheResponse(
              API_CACHE,
              request,
              responseClone,
              MAX_CACHE_SIZE.API,
            ).catch(error => {
              console.warn('API响应缓存失败:', error);
            });
          }
          return response;
        })
        .catch(error => {
          console.error('API请求失败:', error);
          // 网络失败时使用缓存，即使过期也返回
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              // console.log('使用缓存的API响应 (可能过期):', request.url);
              return cachedResponse;
            }
            // 如果没有缓存，返回离线消息
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'You are currently offline',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              },
            );
          });
        }),
    );
    return;
  }

  // 页面缓存策略 (Network First)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async response => {
          // 缓存成功的页面响应
          if (response.status === 200) {
            const responseClone = response.clone();
            cacheResponse(
              CACHE_NAME,
              request,
              responseClone,
              MAX_CACHE_SIZE.PAGES,
            ).catch(error => {
              console.warn('页面响应缓存失败:', error);
            });
          }
          return response;
        })
        .catch(error => {
          console.error('页面请求失败:', error);
          // 网络失败时，尝试从缓存获取，即使过期也返回
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              // console.log('使用缓存的页面 (可能过期):', request.url);
              return cachedResponse;
            }
            // 如果没有缓存的页面，返回主页缓存或离线页面
            return caches.match('/').then(homeResponse => {
              if (homeResponse) {
                return homeResponse;
              }
              // 最后的离线回退
              return new Response(
                `<!DOCTYPE html>
                    <html>
                    <head>
                      <title>KomikoAI - Offline</title>
                      <meta name="viewport" content="width=device-width, initial-scale=1">
                      <style>
                        body {
                          font-family: Arial, sans-serif;
                          text-align: center;
                          padding: 50px;
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          min-height: 100vh;
                          margin: 0;
                          display: flex;
                          flex-direction: column;
                          justify-content: center;
                          align-items: center;
                        }
                        .offline-container {
                          background: rgba(255, 255, 255, 0.1);
                          backdrop-filter: blur(10px);
                          border-radius: 20px;
                          padding: 40px;
                          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                          border: 1px solid rgba(255, 255, 255, 0.2);
                          max-width: 400px;
                          width: 90%;
                        }
                        .offline-icon {
                          font-size: 64px;
                          margin-bottom: 20px;
                          animation: pulse 2s infinite;
                        }
                        @keyframes pulse {
                          0% { transform: scale(1); }
                          50% { transform: scale(1.1); }
                          100% { transform: scale(1); }
                        }
                        .status-indicator {
                          display: inline-flex;
                          align-items: center;
                          gap: 8px;
                          margin: 20px 0;
                          padding: 10px 20px;
                          border-radius: 25px;
                          font-size: 14px;
                          font-weight: 500;
                        }
                        .status-offline {
                          background: rgba(239, 68, 68, 0.2);
                          border: 1px solid rgba(239, 68, 68, 0.3);
                        }
                        .status-online {
                          background: rgba(34, 197, 94, 0.2);
                          border: 1px solid rgba(34, 197, 94, 0.3);
                        }
                        .status-dot {
                          width: 8px;
                          height: 8px;
                          border-radius: 50%;
                        }
                        .dot-offline { background: #ef4444; }
                        .dot-online { background: #22c55e; }
                        button {
                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          border: none;
                          padding: 12px 24px;
                          border-radius: 25px;
                          font-size: 16px;
                          font-weight: 500;
                          cursor: pointer;
                          transition: all 0.3s ease;
                          margin-top: 20px;
                          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                        }
                        button:hover:not(:disabled) {
                          transform: translateY(-2px);
                          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                        }
                        button:disabled {
                          opacity: 0.5;
                          cursor: not-allowed;
                          transform: none;
                        }
                        .auto-retry-info {
                          font-size: 12px;
                          opacity: 0.8;
                          margin-top: 15px;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="offline-container">
                        <h1>You're offline</h1>
                        <p>Check your internet connection and try again.</p>
                        <div id="status-indicator" class="status-indicator status-offline">
                          <div class="status-dot dot-offline"></div>
                          <span>Offline</span>
                        </div>

                        <button id="retry-btn" onclick="handleRetry()" disabled>
                          Retry
                        </button>

                        <div class="auto-retry-info">
                          Will automatically retry when connection is restored
                        </div>
                      </div>

                      <script>
                        function updateNetworkStatus() {
                          const isOnline = navigator.onLine;
                          const statusIndicator = document.getElementById('status-indicator');
                          const retryBtn = document.getElementById('retry-btn');

                          if (isOnline) {
                            statusIndicator.className = 'status-indicator status-online';
                            statusIndicator.innerHTML = '<div class="status-dot dot-online"></div><span>Online</span>';
                            retryBtn.disabled = false;
                            retryBtn.textContent = 'Retry';
                          } else {
                            statusIndicator.className = 'status-indicator status-offline';
                            statusIndicator.innerHTML = '<div class="status-dot dot-offline"></div><span>Offline</span>';
                            retryBtn.disabled = true;
                            retryBtn.textContent = 'Waiting for connection...';
                          }
                        }

                        function handleRetry() {
                          if (navigator.onLine) {
                            window.location.reload();
                          } else {
                            console.log('Cannot retry while offline');
                          }
                        }

                        // 监听网络状态变化
                        window.addEventListener('online', function() {
                          updateNetworkStatus();
                          // 网络恢复时自动重试
                          setTimeout(() => {
                            if (navigator.onLine) {
                              window.location.reload();
                            }
                          }, 1000);
                        });

                        window.addEventListener('offline', updateNetworkStatus);

                        // 初始状态检查
                        updateNetworkStatus();

                        // 定期检查网络状态（作为备用）
                        setInterval(updateNetworkStatus, 5000);
                      </script>
                    </body>
                    </html>`,
                {
                  status: 200,
                  headers: { 'Content-Type': 'text/html' },
                },
              );
            });
          });
        }),
    );
    return;
  }
});

// 监听消息（用于手动缓存清理等）
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName)),
        );
      }),
    );
  }

  // 处理暂停/恢复缓存的消息（用于视频压缩性能优化）
  if (event.data && event.data.type === 'PAUSE_CACHING') {
    self.pauseCaching = true;
    // console.log('SW: 暂停缓存以减少视频压缩期间的性能影响');
  }

  if (event.data && event.data.type === 'RESUME_CACHING') {
    self.pauseCaching = false;
    // console.log('SW: 恢复缓存');
  }

  // 健康检查
  if (event.data && event.data.type === 'HEALTH_CHECK') {
    caches
      .keys()
      .then(cacheNames => {
        const healthData = {
          status: 'healthy',
          pauseCaching: self.pauseCaching,
          cacheNames: cacheNames,
          timestamp: Date.now(),
          version: CACHE_NAME,
        };

        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(healthData);
        } else {
          // 如果没有 port，通过 client 发送
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SW_HEALTH_RESPONSE',
                data: healthData,
              });
            });
          });
        }
      })
      .catch(error => {
        console.error('SW: 健康检查失败:', error);
        const errorData = {
          status: 'error',
          error: error.message,
          timestamp: Date.now(),
        };

        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(errorData);
        }
      });
  }

  // 手动清理过期缓存
  if (event.data && event.data.type === 'CLEANUP_EXPIRED_CACHE') {
    event.waitUntil(cleanupExpiredCache());
  }

  // 强制清理所有缓存并重新安装
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    event.waitUntil(
      caches
        .keys()
        .then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName)),
          );
        })
        .then(() => {
          // 通知主线程重新加载页面
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'FORCE_RELOAD',
                message: 'Service Worker updated, reloading page...',
              });
            });
          });
        }),
    );
  }
});

// 错误报告函数
function reportError(error, context = 'unknown') {
  console.error(`SW Error [${context}]:`, error);

  // 通知主线程
  self.clients
    .matchAll()
    .then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ERROR',
          error: error.message || error.toString(),
          errorType: context,
          timestamp: Date.now(),
          stack: error.stack,
        });
      });
    })
    .catch(err => {
      console.error('SW: 无法发送错误报告到主线程:', err);
    });
}

// 清理过期缓存
async function cleanupExpiredCache() {
  try {
    const cacheNames = await caches.keys();
    // console.log('SW: 开始清理过期缓存...');

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();

        for (const request of requests) {
          try {
            const response = await cache.match(request);
            if (response) {
              const ttl = cacheName.includes('static')
                ? CACHE_TTL.STATIC
                : cacheName.includes('api')
                  ? CACHE_TTL.API
                  : cacheName.includes('video')
                    ? CACHE_TTL.VIDEO
                    : CACHE_TTL.PAGES;

              if (isCacheExpired(response, ttl)) {
                await cache.delete(request);
                // console.log('SW: 删除过期缓存:', request.url);
              }
            }
          } catch (error) {
            console.warn(`SW: 处理缓存项失败 ${request.url}:`, error);
            // 继续处理其他项目，不中断整个清理过程
          }
        }
      } catch (error) {
        console.warn(`SW: 处理缓存 ${cacheName} 失败:`, error);
        reportError(error, 'cache_cleanup');
      }
    }
    // console.log('SW: 过期缓存清理完成');
  } catch (error) {
    console.error('SW: 清理过期缓存失败:', error);
    reportError(error, 'cache_cleanup_fatal');
  }
}

// 定期清理过期缓存 - 每小时执行一次
setInterval(
  () => {
    if (!self.pauseCaching) {
      cleanupExpiredCache();
    }
  },
  60 * 60 * 1000,
); // 1小时

// 监听未捕获的错误，防止SW崩溃
self.addEventListener('error', event => {
  console.error('Service Worker 未捕获错误:', event.error);

  // 向主线程发送错误信息，用于 PostHog 追踪
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ERROR',
        error: event.error?.message || String(event.error),
        errorType: 'uncaught',
      });
    });
  });

  // 不阻止事件，让SW继续运行
});

self.addEventListener('unhandledrejection', event => {
  console.error('Service Worker 未处理的Promise拒绝:', event.reason);

  // 向主线程发送错误信息
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ERROR',
        error: event.reason?.message || String(event.reason),
        errorType: 'unhandled_rejection',
      });
    });
  });

  // 阻止错误传播到全局
  event.preventDefault();
});
