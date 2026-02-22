import { useState, useEffect, useRef, useCallback } from 'react';

export type ValidationStatus = 'pending' | 'validating' | 'valid' | 'invalid';

interface UseLazyValidationOptions {
  validateFn: (url: string) => Promise<boolean>;
  url: string | null;
  enabled?: boolean;
  rootMargin?: string;
}

/**
 * Hook for lazy validation of media resources using IntersectionObserver.
 * Only validates when the element enters the viewport.
 */
export const useLazyValidation = ({
  validateFn,
  url,
  enabled = true,
  rootMargin = '300px',
}: UseLazyValidationOptions) => {
  const [status, setStatus] = useState<ValidationStatus>('pending');
  const elementRef = useRef<HTMLDivElement>(null);
  const hasValidated = useRef(false);

  // Memoize validateFn to avoid unnecessary re-runs
  const stableValidateFn = useCallback(validateFn, []);

  useEffect(() => {
    // Reset if URL changes
    if (hasValidated.current && status !== 'pending') {
      return;
    }

    if (!enabled || !url || !elementRef.current) {
      return;
    }

    const element = elementRef.current;

    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !hasValidated.current) {
          hasValidated.current = true;
          setStatus('validating');

          try {
            const isValid = await stableValidateFn(url);
            setStatus(isValid ? 'valid' : 'invalid');
          } catch (error) {
            console.error('Validation error:', error);
            setStatus('invalid');
          }

          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [url, enabled, stableValidateFn, rootMargin, status]);

  return {
    elementRef,
    status,
    isValid: status === 'valid',
    isValidating: status === 'validating',
    isPending: status === 'pending',
  };
};

export default useLazyValidation;
