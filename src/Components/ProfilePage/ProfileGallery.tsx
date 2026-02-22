/* eslint-disable */
import { useState, useEffect, useCallback, memo } from 'react';
import { Image, Button, useDisclosure, Spinner, Skeleton } from '@nextui-org/react';
import useInfiniteScroll from '../Feed/useInfiniteScroll';
import { authAtom, isMobileAtom } from '../../state';
import mixpanel from 'mixpanel-browser';
import { useAtom, useAtomValue } from 'jotai';
import Masonry from 'react-masonry-css';
import { useTranslation } from 'react-i18next';
import ModalImage from '../ModalImage';
import { isImageValid } from '../../utilities';
import { useLazyValidation, ValidationStatus } from '../../hooks/useLazyValidation';

interface GalleryItem {
  id?: number;
  uniqid?: string;
  url_path: string;
  prompt?: string;
  model?: string;
}

interface LazyImageProps {
  item: GalleryItem;
  index: number;
  onOpen: (index: number, uniqid: string) => void;
  onValidationComplete: (index: number, isValid: boolean) => void;
}

// LazyImage component with lazy validation
const LazyImage = memo(({ item, index, onOpen, onValidationComplete }: LazyImageProps) => {
  const { elementRef, status, isValid } = useLazyValidation({
    validateFn: isImageValid,
    url: item.url_path,
    rootMargin: '300px',
  });

  const [imageLoaded, setImageLoaded] = useState(false);

  // Notify parent when validation completes
  useEffect(() => {
    if (status === 'valid' || status === 'invalid') {
      onValidationComplete(index, status === 'valid');
    }
  }, [status, index, onValidationComplete]);

  // Don't render anything if validation failed
  if (status === 'invalid') {
    return null;
  }

  const imageKey = `${item.id || item.uniqid || index}-${item.url_path}`;

  return (
    <div
      ref={elementRef}
      className='mb-2 md:mb-4 cursor-pointer relative'
      key={imageKey}>
      {/* Show skeleton while pending or validating */}
      {(status === 'pending' || status === 'validating' || (status === 'valid' && !imageLoaded)) && (
        <Skeleton className='w-full rounded-lg' disableAnimation>
          <div className='h-48 rounded-lg bg-default-300' />
        </Skeleton>
      )}
      {/* Only render image after validation passes */}
      {status === 'valid' && (
        <Image
          isZoomed
          onClick={() => onOpen(index, item.uniqid || '')}
          src={item.url_path}
          loading='lazy'
          onLoad={() => setImageLoaded(true)}
          className={`w-full ${!imageLoaded ? 'absolute opacity-0' : ''}`}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

const ProfileGallery = ({ prelist }: { prelist?: any[] }) => {
  const { t } = useTranslation('profile_gallery');
  const [fetchedList, setFetchedList] = useState<GalleryItem[]>([]);
  const [validatedIndices, setValidatedIndices] = useState<Map<number, boolean>>(new Map());
  const [isMobile, setIsMobile] = useAtom(isMobileAtom);
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeItemId, setActiveItemId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const isAuth = useAtomValue(authAtom);

  // Combined list from prelist and fetched data
  const list = [...(prelist || []), ...fetchedList];

  // Get active image URL for modal
  const activeItem = list[activeItemId];
  const activeImageUrl = activeItem?.url_path?.match(/^https?:\/\/[^\/]+/)
    ? activeItem?.url_path
    : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/${activeItem?.url_path}`;

  const getPath = useCallback((url_path: string): string | null => {
    if (!url_path || url_path.trim() === '') {
      return null;
    }
    if (url_path?.includes('proxy') || url_path?.includes('http')) {
      return url_path;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/husbando-land/image_generation/${url_path}`;
  }, []);

  const fetchMoreData = async (isInitial = false) => {
    try {
      if ((!hasMore && !isInitial) || (!isInitial && isLoading)) return;

      setIsLoading(true);
      const newPage = isInitial ? 1 : page + 1;

      console.log('Fetching gallery page:', newPage);
      const response = await fetch(`/api/fetchGallery?page=${newPage}`);
      if (!response.ok) {
        throw new Error('Error fetching data');
      }
      const rawData = await response.json();

      if (rawData && Array.isArray(rawData) && rawData.length > 0) {
        // Transform data with full URLs - no validation here
        const transformedData = rawData
          .map((item: any) => ({
            ...item,
            url_path: getPath(item.url_path),
          }))
          .filter((item: any) => item.url_path !== null);

        setFetchedList(prev => {
          if (isInitial) {
            return transformedData;
          }
          // Avoid duplicates
          const existingIds = new Set(
            prev.map(item => item.id || item.uniqid),
          );
          const uniqueNewData = transformedData.filter(
            (item: GalleryItem) => !existingIds.has(item.id || item.uniqid),
          );
          return [...prev, ...uniqueNewData];
        });

        console.log('Fetched data:', transformedData.length, 'items');

        if (!isInitial) {
          setPage(prev => prev + 1);
        }

        if (rawData.length < 10) {
          setHasMore(false);
        }
      } else {
        console.log('No data returned from API or empty array');
        if (!isInitial) {
          setHasMore(false);
        }
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load gallery',
      );
    } finally {
      setIsLoading(false);
      if (isInitial) {
        setHasInitialLoaded(true);
      }
      setIsFetching(false);
    }
  };

  const [lastElementRef, isFetching, setIsFetching] = useInfiniteScroll(() => {
    if (hasMore && !isLoading && hasInitialLoaded) {
      fetchMoreData(false);
    }
  });

  // Initial data load
  useEffect(() => {
    if (isAuth) {
      fetchMoreData(true);
    }
  }, [isAuth]);

  const checkIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  useEffect(() => {
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  const handleOpen = useCallback((index: number, uniqid: string) => {
    try {
      mixpanel.track('click.home.open_image');
    } catch (error) {}
    setActiveItemId(index);
    onOpen();
  }, [onOpen]);

  const handleValidationComplete = useCallback((index: number, isValid: boolean) => {
    setValidatedIndices(prev => {
      const newMap = new Map(prev);
      newMap.set(index, isValid);
      return newMap;
    });
  }, []);

  const handleDelete = useCallback(() => {
    const itemToDelete = list[activeItemId];
    if (itemToDelete) {
      setFetchedList(prev => prev.filter(item => item.id !== itemToDelete.id));
    }
  }, [activeItemId, list]);

  //! HANDLE MODAL SIZE
  const adjustHeight = useCallback(() => {
    const img = document.getElementById('leftElement');
    const rightElement = document.getElementById('rightElement');
    if (img && rightElement) {
      rightElement.style.height = `${img.offsetHeight - 1}px`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', adjustHeight);
    return () => {
      window.removeEventListener('resize', adjustHeight);
    };
  }, [adjustHeight]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(adjustHeight, 10);
      setTimeout(adjustHeight, 100);
      setTimeout(adjustHeight, 250);
      setTimeout(adjustHeight, 500);
    }
  }, [isOpen, adjustHeight]);

  // Count validated valid items for "no images" check
  const validCount = Array.from(validatedIndices.values()).filter(Boolean).length;
  const allValidated = validatedIndices.size === list.length && list.length > 0;

  const renderContent = () => {
    // Show loading on initial load
    if (isLoading && list.length === 0 && !hasInitialLoaded) {
      return (
        <div className='flex justify-center items-center h-64'>
          <Spinner size='lg' color='default' />
        </div>
      );
    }

    if (error) {
      return (
        <div className='flex justify-center items-center h-64 text-center'>
          <div>
            <p className='mb-4 text-danger'>{error}</p>
            <Button
              className='px-4 py-2 text-primary-foreground rounded-lg bg-primary'
              onClick={() => fetchMoreData(true)}>
              {t('tryAgain')}
            </Button>
          </div>
        </div>
      );
    }

    // Show "no images" only after all items validated and none are valid
    if (list.length === 0 || (allValidated && validCount === 0)) {
      if (list.length === 0) {
        return (
          <div className='flex justify-center items-center h-64'>
            <p className='text-lg text-muted-foreground'>{t('noImagesFound')}</p>
          </div>
        );
      }
    }

    return (
      <Masonry
        breakpointCols={{
          default: 4,
          1200: 3,
          640: 2,
        }}
        className='flex md:gap-3 gap-2'
        columnClassName='my-masonry-grid_column'>
        {list.map((item, index) => {
          if (!item.url_path) return null;

          return (
            <LazyImage
              key={`${item.id || item.uniqid || index}-${item.url_path}`}
              item={item}
              index={index}
              onOpen={handleOpen}
              onValidationComplete={handleValidationComplete}
            />
          );
        })}
      </Masonry>
    );
  };

  return (
    <div className='container relative mx-auto max-w-[100rem] flex-grow px-0 pb-24'>
      <ModalImage
        isOpen={isOpen}
        onClose={onClose}
        prompt={activeItem?.prompt || ''}
        activeImageUrl={activeImageUrl}
        model={activeItem?.model || ''}
        generationId={activeItem?.id}
        type='ai-anime-generator'
        onDelete={handleDelete}
      />

      {renderContent()}

      {!error && list.length > 0 && hasMore && (
        <div ref={lastElementRef} style={{ height: 20 }} className='mt-40'>
          {(isFetching || isLoading) && (
            <div className='flex justify-center mt-4'>
              <Spinner size='sm' color='secondary' />
            </div>
          )}
        </div>
      )}

      {!hasMore && list.length > 0 && (
        <div className='flex justify-center mt-8 mb-8'>
          <p className='text-muted-foreground'>{t('noMoreImages')}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileGallery;
