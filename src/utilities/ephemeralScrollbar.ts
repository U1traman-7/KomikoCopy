let cleanup: (() => void) | null = null;

export function setupEphemeralScrollbar() {
  if (cleanup) return cleanup;
  if (typeof window === 'undefined') return () => {};

  const html = document.documentElement;
  const body = document.body;

  let raf: number | null = null;
  let timeoutId: number | null = null;

  const add = () => {
    if (!html.classList.contains('scrolling')) html.classList.add('scrolling');
    if (!body.classList.contains('scrolling')) body.classList.add('scrolling');
  };
  const remove = () => {
    html.classList.remove('scrolling');
    body.classList.remove('scrolling');
  };

  const onScroll = () => {
    // Throttle via rAF to avoid excessive class toggles
    if (raf) cancelAnimationFrame(raf);
    add();
    if (timeoutId) window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      remove();
    }, 700); // keep visible briefly after scrolling stops
    raf = requestAnimationFrame(() => {});
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  cleanup = () => {
    window.removeEventListener('scroll', onScroll as any);
    remove();
  };

  return cleanup;
}

