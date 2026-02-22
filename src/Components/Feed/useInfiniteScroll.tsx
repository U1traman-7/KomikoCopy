import { useState, useEffect, useRef, useCallback} from "react";

// 简单的防抖函数
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

const useInfiniteScroll = (callback: () => void, options = {}) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const callbackRef = useRef(callback);
  const isInitialLoad = useRef(true);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 创建一个引用回调函数，可以直接绑定到DOM元素
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();

    if (node && !isFetching) {
      observer.current = new IntersectionObserver(entries => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isFetching) {
          setIsFetching(true);
        }
      }, {
        rootMargin: `${typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.3, 300) : 200}px`, // 减少rootMargin，避免过早触发
        threshold: 0.1 // 提高阈值，需要更多元素可见才触发
      });

      observer.current.observe(node);
    }
  }, [isFetching]);

  // 初次加载时或组件挂载时立即触发一次数据加载
  useEffect(() => {
    // 组件挂载后，如果是初次加载，立即触发一次加载
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      // 延迟一点点，确保组件完全渲染
      const timer = setTimeout(() => {
        setIsFetching(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  // 手动触发加载的函数
  const manualFetch = useCallback(() => {
    if (!isFetching) {
      setIsFetching(true);
    }
  }, [isFetching]);

  // 使用防抖处理，避免频繁触发
  useEffect(() => {
    if (!isFetching) return;

    const timeoutId = setTimeout(() => {
      callbackRef.current();
      setIsFetching(false);
    }, 300); // 增加延迟时间，避免频繁触发
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [isFetching]);

  return [lastElementRef, isFetching, setIsFetching, manualFetch] as const;
};

export default useInfiniteScroll;
