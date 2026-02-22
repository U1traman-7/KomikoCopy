/**
 * Service Worker 健康监控和管理工具
 * 防止 SW 导致的性能问题和崩溃
 *
 * Usage:
 * ```typescript
 * import { initServiceWorkerMonitor, stopServiceWorkerMonitor } from './serviceWorkerMonitor';
 *
 * // Initialize monitoring (call once during app startup)
 * try {
 *   await initServiceWorkerMonitor();
 * } catch (error) {
 *   console.error('Failed to initialize SW monitor:', error);
 * }
 *
 * // Stop monitoring when needed (e.g., during cleanup)
 * stopServiceWorkerMonitor();
 * ```
 */

interface ServiceWorkerHealth {
	isActive: boolean;
	cacheSize: number;
	lastCleanup: number;
	errors: string[];
}

class ServiceWorkerMonitor {
	private healthData: ServiceWorkerHealth = {
		isActive: false,
		cacheSize: 0,
		lastCleanup: 0,
		errors: [],
	};

	private maxErrors = 10;
	private cleanupInterval = 30 * 60 * 1000; // 30分钟
	private monitoringIntervalId: NodeJS.Timeout | null = null;
	private isInitialized = false;

	public async init(): Promise<void> {
		if (this.isInitialized) {
			console.warn("ServiceWorkerMonitor already initialized");
			return;
		}

		try {
			await this.startMonitoring();
			this.isInitialized = true;
			console.log("ServiceWorkerMonitor initialized successfully");
		} catch (error) {
			console.error("Failed to initialize ServiceWorkerMonitor:", error);
			this.recordError(`Initialization failed: ${error}`);
			throw error;
		}
	}

	private async startMonitoring(): Promise<void> {
		if ("serviceWorker" in navigator) {
			try {
				// 监听 SW 状态变化
				navigator.serviceWorker.addEventListener("controllerchange", () => {
					console.log("Service Worker controller changed");
					this.checkHealth().catch((error) => {
						console.error(
							"Health check failed after controller change:",
							error,
						);
						this.recordError(
							`Health check failed after controller change: ${error}`,
						);
					});
				});

				// 监听 SW 消息
				navigator.serviceWorker.addEventListener("message", (event) => {
					if (event.data.type === "SW_ERROR") {
						this.recordError(event.data.error);
					}
				});

				// 定期健康检查 - 存储 interval ID 以便后续清理
				this.monitoringIntervalId = setInterval(() => {
					this.checkHealth().catch((error) => {
						console.error("Scheduled health check failed:", error);
						this.recordError(`Scheduled health check failed: ${error}`);
					});
				}, 5 * 60 * 1000); // 每5分钟检查一次

				// 初始健康检查
				await this.checkHealth();
			} catch (error) {
				console.error("Error setting up service worker monitoring:", error);
				this.recordError(`Monitoring setup failed: ${error}`);
				throw error;
			}
		} else {
			console.warn("Service Worker not supported in this browser");
		}
	}

	public stopMonitoring(): void {
		if (this.monitoringIntervalId) {
			clearInterval(this.monitoringIntervalId);
			this.monitoringIntervalId = null;
			console.log("ServiceWorkerMonitor stopped");
		}
		this.isInitialized = false;
	}

	public async checkHealth(): Promise<ServiceWorkerHealth> {
		try {
			this.healthData.isActive = !!navigator.serviceWorker.controller;

			if (this.healthData.isActive) {
				// 检查缓存大小
				this.healthData.cacheSize = await this.getCacheSize();

				// 检查是否需要清理
				const now = Date.now();
				if (now - this.healthData.lastCleanup > this.cleanupInterval) {
					await this.triggerCacheCleanup();
					this.healthData.lastCleanup = now;
				}
			}
		} catch (error) {
			this.recordError(`Health check failed: ${error}`);
		}

		return this.healthData;
	}

	private async getCacheSize(): Promise<number> {
		try {
			const cacheNames = await caches.keys();
			let totalSize = 0;

			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				const keys = await cache.keys();
				totalSize += keys.length;
			}

			return totalSize;
		} catch (error) {
			this.recordError(`Failed to get cache size: ${error}`);
			return 0;
		}
	}

	public async triggerCacheCleanup(): Promise<void> {
		if (navigator.serviceWorker.controller) {
			const beforeSize = this.healthData.cacheSize;

			navigator.serviceWorker.controller.postMessage({
				type: "CLEANUP_EXPIRED_CACHE",
			});
			console.log("触发Service Worker缓存清理");

			// 延迟一点时间后检查清理效果并追踪
			setTimeout(async () => {
				try {
					const afterSize = await this.getCacheSize();
					const itemsDeleted = beforeSize - afterSize;

					if (typeof window !== "undefined" && itemsDeleted > 0) {
						import("./analytics")
							.then(({ trackServiceWorkerCacheCleanup }) => {
								trackServiceWorkerCacheCleanup("manual", itemsDeleted);
							})
							.catch((err) => {
								console.warn(
									"Failed to track SW cache cleanup to PostHog:",
									err,
								);
							});
					}
				} catch (error) {
					console.warn("Failed to track cache cleanup:", error);
				}
			}, 2000);
		}
	}

	public async emergencyCleanup(): Promise<void> {
		try {
			// 追踪紧急清理事件
			if (typeof window !== "undefined") {
				import("./analytics")
					.then(({ trackServiceWorkerCacheCleanup }) => {
						trackServiceWorkerCacheCleanup(
							"emergency",
							this.healthData.cacheSize,
						);
					})
					.catch((err) => {
						console.warn("Failed to track emergency cleanup to PostHog:", err);
					});
			}

			// 清理所有缓存
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames.map((cacheName) => caches.delete(cacheName)),
			);

			// 重新注册 Service Worker
			if ("serviceWorker" in navigator) {
				const registrations = await navigator.serviceWorker.getRegistrations();
				await Promise.all(registrations.map((reg) => reg.unregister()));

				// 重新注册
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			}

			console.log("紧急清理完成，页面将重新加载");
		} catch (error) {
			this.recordError(`Emergency cleanup failed: ${error}`);
		}
	}

	public pauseServiceWorker(): void {
		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: "PAUSE_CACHING",
			});
			console.log("暂停Service Worker缓存");
		}
	}

	public resumeServiceWorker(): void {
		if (navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: "RESUME_CACHING",
			});
			console.log("恢复Service Worker缓存");
		}
	}

	private recordError(error: string): void {
		this.healthData.errors.push(`${new Date().toISOString()}: ${error}`);

		// 追踪错误到 PostHog
		if (typeof window !== "undefined") {
			import("./analytics")
				.then(({ trackServiceWorkerError }) => {
					trackServiceWorkerError(error, "uncaught");
				})
				.catch((err) => {
					console.warn("Failed to track SW error to PostHog:", err);
				});
		}

		// 限制错误记录数量
		if (this.healthData.errors.length > this.maxErrors) {
			this.healthData.errors = this.healthData.errors.slice(-this.maxErrors);
		}

		// 如果错误太多，考虑紧急措施
		if (this.healthData.errors.length >= this.maxErrors) {
			console.warn("Service Worker错误过多，考虑紧急清理");

			// 追踪性能警告到 PostHog
			if (typeof window !== "undefined") {
				import("./analytics")
					.then(({ trackServiceWorkerPerformanceWarning }) => {
						trackServiceWorkerPerformanceWarning(
							`Too many SW errors: ${this.healthData.errors.length}/${this.maxErrors}`,
							this.healthData.cacheSize,
						);
					})
					.catch((err) => {
						console.warn(
							"Failed to track SW performance warning to PostHog:",
							err,
						);
					});
			}

			// 自动紧急清理
			// this.emergencyCleanup();
		}
	}

	public getHealth(): ServiceWorkerHealth {
		return { ...this.healthData };
	}

	public isMonitoringActive(): boolean {
		return this.isInitialized && this.monitoringIntervalId !== null;
	}

	public async getDetailedStats(): Promise<{
		caches: { name: string; size: number }[];
		registration: ServiceWorkerRegistration | null;
		controller: ServiceWorker | null;
	}> {
		const cacheNames = await caches.keys();
		const caches_stats = await Promise.all(
			cacheNames.map(async (name) => {
				const cache = await caches.open(name);
				const keys = await cache.keys();
				return { name, size: keys.length };
			}),
		);

		const registration = await navigator.serviceWorker.getRegistration();

		return {
			caches: caches_stats,
			registration: registration || null,
			controller: navigator.serviceWorker.controller,
		};
	}
}

// 单例实例
export const swMonitor = new ServiceWorkerMonitor();

// 初始化函数 - 必须在使用其他功能前调用
export const initServiceWorkerMonitor = async (): Promise<void> => {
	try {
		await swMonitor.init();
	} catch (error) {
		console.error("Failed to initialize Service Worker Monitor:", error);
		throw error;
	}
};

// 停止监控函数
export const stopServiceWorkerMonitor = (): void => {
	swMonitor.stopMonitoring();
};

// 导出工具函数
export const pauseSWDuringVideoCompression = () => {
	swMonitor.pauseServiceWorker();
};

export const resumeSWAfterVideoCompression = () => {
	swMonitor.resumeServiceWorker();
};

export const checkSWHealth = () => {
	return swMonitor.checkHealth();
};

export const triggerSWCleanup = () => {
	return swMonitor.triggerCacheCleanup();
};

export const emergencySWCleanup = () => {
	return swMonitor.emergencyCleanup();
};

export const isServiceWorkerMonitoringActive = (): boolean => {
	return swMonitor.isMonitoringActive();
};
