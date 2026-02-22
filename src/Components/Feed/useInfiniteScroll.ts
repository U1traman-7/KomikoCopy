import { useState, useEffect, useRef, useCallback } from "react";

interface InfiniteScrollOptions {
  rootMargin?: string;
  threshold?: number;
  root?: Element | null;
}

const useInfiniteScroll = (
  callback: () => void, 
  options: InfiniteScrollOptions = {
    rootMargin: "0px 0px 800px 0px",
    threshold: 0.01
  }
) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const callbackRef = useRef(callback);

  // 更新回调引用，确保总是使用最新的回调函数
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    
    if (node) {
      observer.current = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isFetching) {
          setIsFetching(true);
          callbackRef.current();
        }
      }, {
        root: options.root || null,
        rootMargin: options.rootMargin || "0px 0px 800px 0px",
        threshold: options.threshold || 0.01
      });
      
      observer.current.observe(node);
    }
  }, [isFetching, options.root, options.rootMargin, options.threshold]);

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return [lastElementRef, isFetching, setIsFetching] as const;
};

export default useInfiniteScroll; 