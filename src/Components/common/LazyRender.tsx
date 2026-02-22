import React, { useEffect, useRef, useState } from 'react';

interface LazyRenderProps {
  threshold?: number;
  rootMargin?: string;
  children: React.ReactNode;
}

// Lightweight lazy mount wrapper using IntersectionObserver
export default function LazyRender({
  threshold = 0.1,
  rootMargin = '200px 0px',
  children,
}: LazyRenderProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return <div ref={ref}>{visible ? children : null}</div>;
}

