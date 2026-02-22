/* eslint-disable */
import { DrawAction } from '../../constants';
import { sleep } from '../../utilities';
import {
  Button,
  Popover,
  PopoverContent,
  Image,
  Tooltip,
  PopoverTrigger,
  Card,
} from '@nextui-org/react';
import { BsDiscord } from 'react-icons/bs';
import { HiMiniPhoto } from 'react-icons/hi2';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';

import {
  Arrow,
  Circle,
  Eraser,
  Hand,
  Line,
  Pencil,
  Rectangle,
  Select,
  Text,
  SendToBack,
  SendBackward,
  SendForward,
  SendToFront,
} from '../../icons';

import { HiOutlineChatBubbleOvalLeft } from 'react-icons/hi2';

import { useState } from 'react';
import mixpanel from 'mixpanel-browser';
import { IconShare3 } from '@tabler/icons-react';
import { ImageUploadButton } from '../ImageUploadButton';

interface ActionButtonProps {
  onActionChange: any;
  selectedAction: DrawAction | undefined;
  setBubbleImageUrl: (data: string) => void;
  handleExport: (margin?: number, post?: boolean) => void;
  isMobile: boolean;
  shouldDisablePublish: boolean;
  onImageUpload?: (file: File) => void;
}

export default function ActionButtons({
  onActionChange,
  selectedAction,
  setBubbleImageUrl,
  handleExport,
  isMobile,
  shouldDisablePublish,
  onImageUpload,
}: ActionButtonProps) {
  const { t } = useTranslation('create');
  const router = useRouter();
  const [openBubbleSelector, setOpenBubbleSelector] = useState(false);
  const PAINT_DRAW_OPTIONS = [
    {
      id: DrawAction.Select,
      label: t('selectAndMove'),
      icon: isMobile ? <Hand /> : <Select />,
      keyBind: '1',
    },
    {
      id: DrawAction.Rectangle,
      label: t('createPanel'),
      icon: <Rectangle />,
      keyBind: '2',
    },
    {
      id: DrawAction.Bubble,
      label: t('addSpeechBubble'),
      icon: <HiOutlineChatBubbleOvalLeft />,
      keyBind: '3',
    },
    { id: DrawAction.Text, label: t('addText'), icon: <Text />, keyBind: '4' },
    {
      id: DrawAction.Image,
      label: t('uploadImage'),
      icon: <HiMiniPhoto />,
      keyBind: '5',
    },
    // {
    //   id: DrawAction.MarkArea,
    //   label: "Select an area to modify (inpaint)",
    //   icon: <LuBoxSelect />,
    //   keyBind: "5",
    // },
    // {
    //   id: DrawAction.Circle,
    //   label: "Circle--C or 4",
    //   icon: <Circle />,
    //   keyBind: "4",
    // },
    // {
    //   id: DrawAction.Arrow,
    //   label: "Arrow--A or 5",
    //   icon: <Arrow />,
    //   keyBind: "5",
    // },
    // { id: DrawAction.Line, label: "Line--L or 6", icon: <Line />, keyBind: "6" },
    // {
    //   id: DrawAction.Scribble,
    //   label: "Draw freehand",
    //   icon: <Pencil />,
    //   keyBind: "3",
    // },

    // {
    //   id: DrawAction.Eraser,
    //   label: "Eraser--E or 0",
    //   icon: <Eraser />,
    //   keyBind: "0",
    // },
  ];
  if (!isMobile) {
    PAINT_DRAW_OPTIONS.push({
      id: DrawAction.Move,
      label: t('navigate'),
      icon: <Hand />,
      keyBind: '0',
    });
  }
  return (
    <div className='p-2 bg-muted w-[100%] border-b border-border flex justify-between'>
      <div
        // href="https://app.komiko.ai"
        onClick={() => router.push('/')}>
        <img
          src={isMobile ? '/images/favicon.webp' : '/images/logo_new.webp'}
          className='h-[40px] ml-[20px] dark:brightness-200'
        />
      </div>
      <div className='flex justify-center align-center'>
        <div className='flex gap-2 justify-between'>
          {PAINT_DRAW_OPTIONS.map(({ label, icon, id, keyBind }) => {
            if (id === DrawAction.Image && onImageUpload) {
              return (
                <ImageUploadButton
                  key={id}
                  onImageUpload={onImageUpload}
                  disabled={shouldDisablePublish}
                  tooltipContent={`${label} (${keyBind})`}
                />
              );
            }

            if (id != DrawAction.Bubble) {
              return (
                <Tooltip
                  key={id}
                  content={`${label} (${keyBind})`}
                  placement='bottom'
                  delay={500}>
                  <Button
                    isIconOnly
                    size='md'
                    className={
                      selectedAction === id
                        ? 'w-5 bg-primary-100'
                        : 'w-5 bg-muted'
                    }
                    fullWidth={false}
                    // isSelected={}
                    onClick={async () => {
                      await onActionChange(id);
                    }}>
                    {icon}
                  </Button>
                </Tooltip>
              );
            } else if (id == DrawAction.Bubble) {
              return (
                <Tooltip
                  key={id}
                  showArrow={true}
                  className='w-[70%]'
                  content={`${label} (${keyBind})`}
                  placement='bottom'
                  delay={0}>
                  <div>
                    <Popover
                      key={id}
                      placement='bottom'
                      isOpen={openBubbleSelector}
                      onBlur={() => setOpenBubbleSelector(false)}>
                      <PopoverTrigger>
                        <Button
                          isIconOnly
                          size='md'
                          className={
                            selectedAction === id
                              ? 'w-5 bg-primary-100'
                              : 'w-5 bg-muted'
                          }
                          fullWidth={false}
                          onClick={() => {
                            setBubbleImageUrl(bubbleTemplates[0].url);
                            // onActionChange(id);
                            setOpenBubbleSelector(!openBubbleSelector);
                          }}>
                          {icon}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className='mt-2 bg-muted'>
                        <div className='flex flex-wrap justify-center'>
                          {bubbleTemplates
                            .concat(stickerTemplates)
                            .map((bubble, idx) => (
                              <Button
                                isIconOnly
                                key={idx}
                                className='m-1 p-2 w-[100px] h-[100px]'
                                variant='light'
                                onClick={async () => {
                                  setBubbleImageUrl(bubble.url);
                                  onActionChange(id, bubble.url);
                                  setOpenBubbleSelector(false);
                                }}>
                                <Image
                                  className=''
                                  width='auto'
                                  height='auto'
                                  src={bubble.url}
                                  style={{
                                    maxWidth: '100px',
                                    maxHeight: '100px',
                                  }}
                                />
                              </Button>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </Tooltip>
              );
            }
          })}

          {/* <Tooltip content={"Export as PNG"} placement="bottom" delay={500}>
            <Button color="primary" size="md" className="text-sm" onClick={handleExport}>
              {"Export"}
            </Button>
          </Tooltip> */}
          {/* {!isMobile && <Tooltip content={"Export your story as PNG"} placement="bottom" delay={500}>
            <Button variant="flat" color="primary" size="md" className="text-sm" onClick={() => {
              try { mixpanel.track('click.canvas.export'); } catch (error) { }
              handleExport(0, false)
            }}>
              {"Export"}
            </Button>
          </Tooltip>} */}
          <Popover placement='bottom' showArrow={true}>
            <PopoverTrigger>
              <Button
                color={shouldDisablePublish ? 'default' : 'primary'}
                variant={shouldDisablePublish ? 'flat' : 'solid'}
                size='md'
                className={`flex gap-1 items-center text-sm ${shouldDisablePublish ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => {
                  if (!shouldDisablePublish) {
                    try {
                      mixpanel.track('click.canvas.publish');
                    } catch (error) {}
                    handleExport(0, true);
                  }
                }}>
                <IconShare3 stroke={1.2} className={`w-5 h-5 text-lg`} />
                {t('share')}
              </Button>
            </PopoverTrigger>
            {shouldDisablePublish && (
              <PopoverContent>
                <div className='px-1 py-2'>
                  <div className='text-small font-bold'>
                    🎨 {t('imagesGenerating')}
                  </div>
                  <div className='text-tiny'>
                    {t('allImagesStillGenerating')}
                  </div>
                </div>
              </PopoverContent>
            )}
          </Popover>
        </div>
      </div>
      <Button
        isIconOnly={isMobile}
        className='ml-2 text-primary-foreground bg-muted'
        style={{ backgroundColor: '#5865F2' }}
        onClick={() => {
          try {
            mixpanel.track('click.canvas.discord');
          } catch (error) {}
          window.open('https://discord.gg/KJNSBVVkvN', '_blank');
        }}>
        <BsDiscord className='w-5 h-5' /> {isMobile ? '' : t('joinDiscord')}
      </Button>
    </div>
  );
}

const bubbleTemplates = [
  { id: 1, url: '/images/bubbles/1.webp' },
  { id: 2, url: '/images/bubbles/2.webp' },
  { id: 3, url: '/images/bubbles/3.webp' },
  { id: 4, url: '/images/bubbles/4.webp' },
  { id: 5, url: '/images/bubbles/5.webp' },
  { id: 6, url: '/images/bubbles/6.webp' },
  { id: 7, url: '/images/bubbles/7.webp' },
  { id: 8, url: '/images/bubbles/8.webp' },
  { id: 9, url: '/images/bubbles/9.webp' },
  { id: 10, url: '/images/bubbles/10.webp' },
  { id: 11, url: '/images/bubbles/11.webp' },
  { id: 12, url: '/images/bubbles/12.webp' },
  { id: 13, url: '/images/bubbles/13.webp' },
  { id: 14, url: '/images/bubbles/14.webp' },
];

const stickerTemplates = [
  { id: 1, url: '/images/stickers/1.webp' },
  // { id: 2, url: '/images/stickers/2.webp' },
  { id: 3, url: '/images/stickers/3.webp' },
  { id: 4, url: '/images/stickers/4.webp' },
  { id: 5, url: '/images/stickers/5.webp' },
  // { id: 6, url: '/images/stickers/6.webp' },
  { id: 7, url: '/images/stickers/7.webp' },
  { id: 8, url: '/images/stickers/8.webp' },
  { id: 12, url: '/images/stickers/12.webp' },
  { id: 9, url: '/images/stickers/9.webp' },
  // { id: 11, url: '/images/stickers/11.webp' },
  { id: 13, url: '/images/stickers/gradient_white.webp' },
  { id: 13, url: '/images/stickers/gradient_black.webp' },
];
