import React, { useState, useRef, useEffect } from 'react';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  loading?: 'lazy' | 'eager';
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  rootMargin = '50px',
  threshold = 0.1,
  loading = 'lazy',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold,
        rootMargin,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultPlaceholder = (
    <div className='w-full h-full bg-muted flex items-center justify-center rounded-lg'>
      <div className='text-muted-foreground text-sm'>Loading image...</div>
    </div>
  );

  return (
    <div ref={imgRef} className='w-full h-full flex items-center justify-center'>
      {!isVisible ? (
        placeholder || defaultPlaceholder
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={className} 
          loading={loading}
        />
      )}
    </div>
  );
};

export default LazyImage;
