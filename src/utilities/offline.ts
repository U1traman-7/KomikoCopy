// Simple offline/online utilities and a guarded reload helper

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

export function isOnline(): boolean {
  if (!isBrowser()) return true;
  return navigator.onLine;
}

export function onNetworkChange(callback: (online: boolean) => void): () => void {
  if (!isBrowser()) return () => {};

  const handler = () => callback(navigator.onLine);
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  // initial tick
  queueMicrotask(handler);
  return () => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
}

// Avoid infinite reload loops when offline.
// If offline, persist an intent and reload once connectivity returns.
export function safeReload(reason?: string): void {
  if (!isBrowser()) return;

  try {
    if (navigator.onLine) {
      window.location.reload();
      return;
    }

    // mark pending reload
    try {
      localStorage.setItem("__pending_reload__", "1");
      if (reason) localStorage.setItem("__pending_reload_reason__", reason);
    } catch (_) {}

    const once = () => {
      window.removeEventListener("online", once);
      try {
        localStorage.removeItem("__pending_reload__");
        localStorage.removeItem("__pending_reload_reason__");
      } catch (_) {}
      // double-check we're online before reloading
      if (navigator.onLine) {
        window.location.reload();
      }
    };

    window.addEventListener("online", once, { once: true } as any);
  } catch (_) {
    // last resort
  }
}

// Check on boot if there was a pending reload request
export function maybeResumePendingReload(): void {
  if (!isBrowser()) return;
  try {
    const pending = localStorage.getItem("__pending_reload__");
    if (pending && navigator.onLine) {
      localStorage.removeItem("__pending_reload__");
      localStorage.removeItem("__pending_reload_reason__");
      window.location.reload();
    }
  } catch (_) {}
}


