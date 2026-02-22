import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useDisclosure, Spinner, Button, Skeleton } from "@nextui-org/react";
import { authAtom, isMobileAtom } from "../../state";
import useInfiniteScroll from "../Feed/useInfiniteScroll";
import Masonry from "react-masonry-css";
import { useTranslation } from 'react-i18next';
import { FaVolumeUp, FaVolumeMute, FaPlay } from "react-icons/fa";
import ModalVideo from "../ModalVideo";
import { isVideoValid } from "../../utilities";
import { useLazyValidation } from "../../hooks/useLazyValidation";

type VideoItem = {
  id: number;
  created_at: string;
  video_url?: string;
  tool?: string;
  user_id?: string;
  prompt?: string | null;
  model?: string | null;
  video_path?: string | null;
  uniqid?: string;
  user_uniqid?: string;
  title?: string;
  media?: string[];
  image?: string;
  _validatedUrl?: string;
};

// Video URL validation cache
const CACHE_KEY = 'video_url_validation_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

const getCachedValidation = (url: string): boolean | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const cache = JSON.parse(cached);
    const entry = cache[url];
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      delete cache[url];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.isValid ? true : null;
  } catch {
    return null;
  }
};

const setCachedValidation = (url: string, isValid: boolean) => {
  if (!isValid) return;
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const cache = cached ? JSON.parse(cached) : {};
    cache[url] = { isValid, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
};

// Cached video validation function
const validateVideoWithCache = async (url: string): Promise<boolean> => {
  const cached = getCachedValidation(url);
  if (cached === true) return true;

  const isValid = await isVideoValid(url);
  if (isValid) {
    setCachedValidation(url, true);
  }
  return isValid;
};

// Extract video URL from item
const getVideoUrlFromItem = (item: VideoItem | undefined): string | null => {
  if (!item) return null;
  if (item.video_url) {
    try {
      const url = new URL(item.video_url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return item.video_url;
      }
    } catch {}
  }

  if (item.media && item.media.length > 0) {
    const videoUrl = item.media[0];
    if (videoUrl) {
      try {
        if (videoUrl.includes('http')) {
          const url = new URL(videoUrl);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            return videoUrl;
          }
        } else if (videoUrl.startsWith('/')) {
          return `${window.location.origin}${videoUrl}`;
        }
      } catch {}
    }
  }

  return null;
};

interface LazyVideoProps {
  item: VideoItem;
  index: number;
  onVideoClick: (index: number) => void;
  onValidationComplete: (index: number, isValid: boolean, url: string) => void;
  videoRefs: React.MutableRefObject<Map<number, HTMLVideoElement>>;
  playingVideos: Set<number>;
  videoMutedStates: Map<number, boolean>;
  onVideoHover: (index: number, isHovering: boolean) => void;
  onToggleMute: (e: React.MouseEvent, el: HTMLVideoElement | null | undefined, index: number) => void;
}

const LazyVideo = memo(({
  item,
  index,
  onVideoClick,
  onValidationComplete,
  videoRefs,
  playingVideos,
  videoMutedStates,
  onVideoHover,
  onToggleMute,
}: LazyVideoProps) => {
  const videoUrl = getVideoUrlFromItem(item);

  const { elementRef, status, isValid } = useLazyValidation({
    validateFn: validateVideoWithCache,
    url: videoUrl,
    rootMargin: '300px',
  });

  const [videoLoaded, setVideoLoaded] = useState(false);
  const isPlaying = playingVideos.has(index);

  // Notify parent when validation completes
  useEffect(() => {
    if (status === 'valid' || status === 'invalid') {
      onValidationComplete(index, status === 'valid', videoUrl || '');
    }
  }, [status, index, onValidationComplete, videoUrl]);

  // Don't render if no URL or validation failed
  if (!videoUrl || status === 'invalid') {
    return null;
  }

  return (
    <div
      ref={elementRef}
      className='mb-2 md:mb-4 relative overflow-hidden rounded-lg cursor-pointer'
      key={`video-${item.id || index}`}
      onMouseEnter={() => status === 'valid' && onVideoHover(index, true)}
      onMouseLeave={() => status === 'valid' && onVideoHover(index, false)}
      onClick={() => status === 'valid' && onVideoClick(index)}>

      {/* Show skeleton while pending or validating */}
      {(status === 'pending' || status === 'validating' || (status === 'valid' && !videoLoaded)) && (
        <Skeleton className='w-full rounded-lg' disableAnimation>
          <div className='h-48 rounded-lg bg-default-300' />
        </Skeleton>
      )}

      {/* Only render video after validation passes */}
      {status === 'valid' && (
        <>
          <video
            ref={el => {
              if (el) videoRefs.current.set(index, el);
            }}
            className={`w-full h-auto rounded-lg ${!videoLoaded ? 'absolute opacity-0' : ''}`}
            src={videoUrl}
            muted={true}
            loop
            playsInline
            preload='metadata'
            poster={item.image || ''}
            onLoadedData={() => setVideoLoaded(true)}
          />
          {videoLoaded && !isPlaying && (
            <div className='absolute inset-0 flex justify-center items-center bg-black bg-opacity-30'>
              <FaPlay size={40} color='white' />
            </div>
          )}
          {videoLoaded && isPlaying && (
            <button
              onClick={e => onToggleMute(e, videoRefs.current.get(index), index)}
              className='absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-3 z-10'>
              {(videoMutedStates.get(index) ?? true) ? (
                <FaVolumeMute size={16} color='white' />
              ) : (
                <FaVolumeUp size={16} color='white' />
              )}
            </button>
          )}
          {videoLoaded && (item.title || (item.prompt && !(item.tool === 'video-effect' && item.model?.toLowerCase().includes('sora')))) && (
            <div className='absolute bottom-0 left-0 w-full p-2 bg-black bg-opacity-50 text-white'>
              <p className='text-sm font-medium line-clamp-3'>
                {item.title || item.prompt}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
});

LazyVideo.displayName = 'LazyVideo';

const ProfileVideos = ({ prelist }: { prelist?: VideoItem[] }) => {
  const { t } = useTranslation(['profile', 'profile_gallery']);
  const [fetchedList, setFetchedList] = useState<VideoItem[]>([]);
  const [validatedItems, setValidatedItems] = useState<Map<number, { isValid: boolean; url: string }>>(new Map());
  const [isMobile] = useAtom(isMobileAtom);
  const [page, setPage] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [activeItemId, setActiveItemId] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const [playingVideos, setPlayingVideos] = useState<Set<number>>(new Set());
  const [videoMutedStates, setVideoMutedStates] = useState<Map<number, boolean>>(new Map());
  const isAuth = useAtomValue(authAtom);
  const [hasMore, setHasMore] = useState(true);
  const initialLoadComplete = useRef(false);

  // Combined list
  const list = [...(prelist || []), ...fetchedList];

  const fetchMoreData = async (isInitial = false) => {
    try {
      if (isInitial && initialLoadComplete.current) {
        return;
      }

      if ((!hasMore && !isInitial) || (!isInitial && isLoading)) {
        return;
      }

      setIsLoading(true);
      const newPage = isInitial ? 1 : page + 1;

      console.log("Fetching videos from gallery API, page:", newPage);
      const response = await fetch(`/api/fetchGallery?page=${newPage}&mediaType=video`);

      if (!response.ok) {
        throw new Error('Error fetching video data');
      }

      const rawData = await response.json();

      if (rawData && Array.isArray(rawData) && rawData.length > 0) {
        setFetchedList((prev) => {
          if (isInitial) {
            return rawData;
          }
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = rawData.filter((item: VideoItem) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });

        console.log("Fetched videos:", rawData.length, "items");

        if (!isInitial) {
          setPage((prev) => prev + 1);
        } else {
          initialLoadComplete.current = true;
        }

        if (rawData.length < 10) {
          setHasMore(false);
        }
      } else {
        console.log("No data returned from API or empty array");
        if (!isInitial) {
          setHasMore(false);
        } else {
          initialLoadComplete.current = true;
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  const [lastElementRef, isFetching, setIsFetching] = useInfiniteScroll(() => {
    if (hasMore && !isLoading && initialLoadComplete.current) {
      fetchMoreData(false);
    }
  });

  useEffect(() => {
    if (isAuth && !initialLoadComplete.current && !isLoading) {
      fetchMoreData(true);
    }
  }, [isAuth]);

  const handleVideoHover = useCallback((index: number, isHovering: boolean) => {
    const videoElement = videoRefs.current.get(index);
    if (videoElement) {
      if (isHovering) {
        if (!videoMutedStates.has(index)) {
          videoElement.muted = true;
          setVideoMutedStates(prev => {
            const newMap = new Map(prev);
            newMap.set(index, true);
            return newMap;
          });
        } else {
          videoElement.muted = videoMutedStates.get(index) ?? true;
        }
        videoElement.play().then(() => {
          setPlayingVideos(prev => {
            const newSet = new Set(prev);
            newSet.add(index);
            return newSet;
          });
        }).catch(err => console.error("Failed to play video:", err));
      } else {
        videoElement.pause();
        videoElement.currentTime = 0;
        setPlayingVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(index);
          return newSet;
        });
      }
    }
  }, [videoMutedStates]);

  const handleVideoClick = useCallback((index: number) => {
    setActiveItemId(index);
    onOpen();
  }, [onOpen]);

  const toggleMute = useCallback((e: React.MouseEvent, elementRef: HTMLVideoElement | null | undefined, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (elementRef) {
      const newMutedState = !elementRef.muted;
      elementRef.muted = newMutedState;
      setVideoMutedStates(prev => {
        const newMap = new Map(prev);
        newMap.set(index, newMutedState);
        return newMap;
      });
    }
  }, []);

  const handleValidationComplete = useCallback((index: number, isValid: boolean, url: string) => {
    setValidatedItems(prev => {
      const newMap = new Map(prev);
      newMap.set(index, { isValid, url });
      return newMap;
    });
  }, []);

  const handleDeleteVideo = useCallback((videoId: number) => {
    setFetchedList(prev => prev.filter(item => item.id !== videoId));
  }, []);

  // Get active video URL for modal
  const activeItem = list[activeItemId];
  const activeVideoUrl = validatedItems.get(activeItemId)?.url || getVideoUrlFromItem(activeItem) || '';

  // Check if all items have been validated
  const validCount = Array.from(validatedItems.values()).filter(v => v.isValid).length;

  const renderContent = () => {
    // Show loading on initial load
    if (isLoading && list.length === 0 && !initialLoadComplete.current) {
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
            <p className='text-danger mb-4'>{error}</p>
            <Button
              className='bg-primary text-primary-foreground px-4 py-2 rounded-lg'
              onClick={() => fetchMoreData(true)}>
              {t('tryAgain')}
            </Button>
          </div>
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className='flex justify-center items-center h-64'>
          <p className='text-muted-foreground text-lg'>{t('noVideosFound')}</p>
        </div>
      );
    }

    return (
      <Masonry
        breakpointCols={{
          default: 4,
          1200: 4,
          640: 2,
        }}
        className='flex w-full md:gap-3 gap-2 mx-auto'
        columnClassName='my-masonry-grid_column'>
        {list.map((item, index) => (
          <LazyVideo
            key={`video-${item.id || index}`}
            item={item}
            index={index}
            onVideoClick={handleVideoClick}
            onValidationComplete={handleValidationComplete}
            videoRefs={videoRefs}
            playingVideos={playingVideos}
            videoMutedStates={videoMutedStates}
            onVideoHover={handleVideoHover}
            onToggleMute={toggleMute}
          />
        ))}
      </Masonry>
    );
  };

  return (
    <div className='container relative mx-auto max-w-[100rem] flex-grow px-0 pb-24'>
      <ModalVideo
        isOpen={isOpen}
        onClose={onClose}
        activeVideoUrl={activeVideoUrl}
        prompt={activeItem?.prompt || activeItem?.title || ''}
        model={activeItem?.model || ''}
        tool={activeItem?.tool || ''}
        videoId={activeItem?.id}
        onDelete={handleDeleteVideo}
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
          <p className='text-muted-foreground'>
            {t('noMoreVideos', { ns: 'profile_gallery' })}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProfileVideos;
