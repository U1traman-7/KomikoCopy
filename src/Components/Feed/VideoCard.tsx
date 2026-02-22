/* eslint-disable */
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { Card, CardBody, CardFooter, Avatar, Button } from '@nextui-org/react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { FaVolumeUp, FaVolumeMute, FaPlay } from 'react-icons/fa';
import { FiMaximize } from 'react-icons/fi';
import { Post } from '../../state';
import PostCard from './PostCard';

interface VideoCardProps {
  item: Post;
  handleOpen: (id: number, uniqid: string) => void;
  handleLike: (id: number) => void;
  handleFollow?: (id: number) => void;
  handleComment: (id: number) => void;
  handleCommentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  comment: string;
  isOpen: boolean;
  handleClose: () => void;
  useAnchor?: boolean;
  showMore?: boolean;
  shouldShowDelete?: boolean;
}

const VideoPreview = ({
  item,
  handleOpen,
  handleLike,
  router,
}: {
  item: Post;
  handleOpen: (id: number, uniqid: string) => void;
  handleLike: (id: number) => void;
  router: any;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [videoMuted, setVideoMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // 延迟加载视频
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // 提前50px
      },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleVideoHover = (isHovering: boolean) => {
    if (videoRef.current) {
      if (isHovering) {
        videoRef.current.muted = videoMuted;
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
            setShowPlayButton(false);
          })
          .catch(err => {
            console.error('Failed to play video:', err);
            setIsPlaying(false);
            setShowPlayButton(true);
          });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        setVideoMuted(true);
        setIsPlaying(false);
        setShowPlayButton(true);
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (videoRef.current) {
      const newMutedState = !videoRef.current.muted;
      videoRef.current.muted = newMutedState;
      setVideoMuted(newMutedState);
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleOpen(item.id, item.uniqid);
  };

  const handleVideoLoaded = () => {
    setIsLoaded(true);
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  return (
    <div
      ref={cardRef}
      className='transition-shadow duration-300 ease-in-out shadow-none hover:shadow-lg rounded-xl'>
      <div className='border border-border rounded-xl overflow-hidden shadow-sm'>
        <Card className='bg-background shadow-none rounded-xl'>
          <CardBody
            className='overflow-visible p-0 w-full cursor-pointer'
            onClick={() => handleOpen(item.id, item.uniqid)}
            onMouseEnter={() => handleVideoHover(true)}
            onMouseLeave={() => handleVideoHover(false)}>
            <div className='relative overflow-hidden rounded-t-xl'>
              {!isVisible && (
                <div
                  className='flex justify-center items-center bg-muted'
                  style={{ height: '160px' }}>
                  <FaPlay size={40} color='rgba(0,0,0,0.2)' />
                </div>
              )}

              {isVisible && (
                <>
                  {isLoading && (
                    <div
                      className='flex justify-center items-center bg-muted animate-pulse'
                      style={{ height: '160px' }}>
                      <FaPlay size={40} color='rgba(0,0,0,0.2)' />
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className={`w-full object-cover rounded-none ${isLoading ? 'hidden' : 'block'}`}
                    src={item.media[0]}
                    muted={videoMuted}
                    loop
                    playsInline
                    preload='none' // 改为 none 以节省内存
                    crossOrigin='anonymous'
                    onError={e => console.error('Video error:', e)}
                    onLoadedData={handleVideoLoaded}
                    onLoadStart={handleLoadStart}
                  />
                </>
              )}
              {showPlayButton && isLoaded && (
                <div className='absolute inset-0 flex justify-center items-center bg-black bg-opacity-30'>
                  <FaPlay size={40} color='white' />
                </div>
              )}
              {/* Expand button - bottom left */}
              {isLoaded && (
                <Button
                  type='button'
                  size='sm'
                  aria-label='Expand'
                  onPress={handleExpand}
                  className='absolute bottom-2 left-2 z-10 rounded-md bg-black/40 hover:bg-black/70 text-white w-7 h-7 min-w-7 min-h-7'
                  isIconOnly>
                  <FiMaximize className='w-3.5 h-3.5' />
                </Button>
              )}
              {/* Mute button - bottom right */}
              {isPlaying && (
                <button
                  onClick={toggleMute}
                  className='absolute bottom-2 right-2 bg-black bg-opacity-50 rounded-full p-3 z-10'>
                  {videoMuted ? (
                    <FaVolumeMute size={16} color='white' />
                  ) : (
                    <FaVolumeUp size={16} color='white' />
                  )}
                </button>
              )}
            </div>
          </CardBody>
          <CardFooter className='justify-between pt-2 pr-3 pb-1 pl-3 text-sm'>
            <b className='overflow-hidden max-h-16 whitespace-normal text-ellipsis'>
              {item.title}
            </b>
          </CardFooter>
          <CardFooter className='justify-between pt-0 pr-3 pb-3 pl-3 text-small'>
            <div className='flex items-center align-center'>
              <Avatar
                radius='full'
                className='w-5 h-5 text-tiny'
                src={item.image}
                name={item.user_name}
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/user/${item.user_uniqid}`);
                }}
                style={{ cursor: 'pointer' }}
              />
              <p
                className='ml-1 text-sm cursor-pointer text-default-500'
                onClick={e => {
                  e.stopPropagation();
                  router.push(`/user/${item.user_uniqid}`);
                }}>
                {item.user_name}
              </p>
            </div>
            <div className='flex flex-col gap-1 items-start align-center text-default-500'>
              <div
                className='flex justify-center items-center cursor-pointer'
                onClick={e => {
                  e.stopPropagation();
                  handleLike(item.id);
                }}>
                {item.liked ? (
                  <AiFillHeart className='text-sm text-red-500' />
                ) : (
                  <AiOutlineHeart className='text-sm' />
                )}
                <span className='ml-1'> {item.votes}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const VideoCard: React.FC<VideoCardProps> = props => {
  const router = useRouter();
  const { item, isOpen } = props;

  console.log('isOpen shouldShowDelete', isOpen, props.shouldShowDelete);
  // 如果Modal打开，使用PostCard
  if (isOpen) {
    return <PostCard {...props} />;
  }

  // 否则显示视频预览
  return (
    <div key={item.id} className='caffelabs text-foreground mb-2 md:mb-3'>
      <VideoPreview
        item={item}
        handleOpen={props.handleOpen}
        handleLike={props.handleLike}
        router={router}
      />
    </div>
  );
};

export default VideoCard;
