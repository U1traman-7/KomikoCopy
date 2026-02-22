/* eslint-disable */
import { Button, ButtonGroup, Divider, Tooltip } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { useAtomValue } from 'jotai';
import { authAtom } from '../../state';
import mixpanel from 'mixpanel-browser';
import toast from 'react-hot-toast';
import { IconEdit, IconTrash, IconUserSquare } from '@tabler/icons-react';
import { PiMagicWand } from 'react-icons/pi';
import { BsShareFill } from 'react-icons/bs';
import { MdAnimation } from 'react-icons/md';
import { TbPhotoEdit, TbWalk, TbSparkles } from 'react-icons/tb';
import { HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi';

import { createQueryParams } from '../ToolsPage/ResultCard';
interface CharacterActionsProps {
  charData: any;
  isOwnCharacter: boolean;
  isCollected: boolean;
  isCollecting: boolean;
  onOpenDeleteModal: () => void;
  onCollectCharacter: () => void;
  onAddToRecent?: (character: any) => void;
}

export const CharacterActions: React.FC<CharacterActionsProps> = ({
  charData,
  isOwnCharacter,
  isCollected,
  isCollecting,
  onOpenDeleteModal,
  onCollectCharacter,
  onAddToRecent,
}) => {
  const { t } = useTranslation('character');
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);
  if (!charData.character_pfp || charData.character_uniqid === 'loading...') {
    return null;
  }

  // 定义所有按钮的配置
  const actionButtons = [
    {
      key: 'generateImage',
      icon: <PiMagicWand className='w-4 h-4 flex-shrink-0' />,
      label: t('generateImage'),
      onClick: () => {
        try {
          mixpanel.track('create.image.character', { ...charData });
        } catch (error) {}
        onAddToRecent?.(charData);
        const queryParams = createQueryParams(
          charData.character_pfp,
          'character',
          `@${charData.character_uniqid}`,
          'character',
        );
        queryParams.append('characterId', charData.character_uniqid);
        router.push(`/ai-anime-generator?${queryParams.toString()}`);
      },
    },
    {
      key: 'animate',
      icon: <MdAnimation className='w-4 h-4 flex-shrink-0 mr-1' />,
      label: t('animate'),
      onClick: () => {
        try {
          mixpanel.track('create.animation.character', { ...charData });
        } catch (error) {}
        onAddToRecent?.(charData);
        const queryParams = createQueryParams(
          charData.character_pfp,
          'character',
          '',
          'character',
        );
        queryParams.append('characterId', charData.character_uniqid);
        router.push(`/image-animation-generator?${queryParams.toString()}`);
      },
    },
    {
      key: 'dance',
      icon: <TbWalk className='w-4 h-4 flex-shrink-0' />,
      label: t('dance'),
      onClick: () => {
        try {
          mixpanel.track('create.dance.character', { ...charData });
        } catch (error) {}
        onAddToRecent?.(charData);
        const queryParams = createQueryParams(
          charData.character_pfp,
          'character',
          '',
          'character',
        );
        queryParams.append('mode', 'dance');
        router.push(`/dance-video-generator?${queryParams.toString()}`);
      },
    },
    {
      key: 'videoEffects',
      icon: <TbSparkles className='w-4 h-4 flex-shrink-0 mr-1' />,
      label: t('videoEffects'),
      onClick: () => {
        try {
          mixpanel.track('create.video-effects.character', { ...charData });
        } catch (error) {}
        onAddToRecent?.(charData);
        const queryParams = createQueryParams(
          charData.character_pfp,
          'character',
          '',
          'character',
        );
        queryParams.append('activeTab', 'templates');
        router.push(
          `/ai-video-effects?${queryParams.toString()}`,
        );
      },
    },
    {
      key: 'imagePlayground',
      icon: <TbPhotoEdit className='w-4 h-4 flex-shrink-0 mr-1' />,
      label: t('imagePlayground'),
      onClick: () => {
        try {
          if (charData && charData.character_pfp) {
            const queryParams = new URLSearchParams();
            queryParams.append('mediaType', 'character');
            queryParams.append('source', 'character');
            queryParams.append('prompt', charData.character_name || '');
            queryParams.append('mediaUrl', charData.character_pfp);
            queryParams.append('characterId', charData.character_uniqid);
            queryParams.append('style', '');
            router.push(`/playground?${queryParams.toString()}`);
          }
        } catch (error) {
          console.error('Failed to process image:', error);
          toast.error(t('error.imageProcessingFailed'));
        }
      },
    },
  ];

  return (
    <div className='flex flex-col pt-4 w-full max-w-xl mx-auto'>
      <div className='overflow-hidden w-full bg-card rounded-xl border border-border shadow-md'>
        {/* 工具按钮组 */}
        <div className='p-1'>
          {/* 移动端：两行布局 */}
          <div className='block md:hidden'>
            {/* 第一行：Generate Image, Animate, Dance */}
            <ButtonGroup
              className='w-full mb-1 items-center'
              radius='md'
              variant='light'
              size='sm'>
              {actionButtons.slice(0, 3).map(btn => (
                <Button
                  key={btn.key}
                  onClick={btn.onClick}
                  startContent={btn.icon}
                  className='flex gap-1 items-center justify-center px-2 h-10 text-primary'>
                  <span className='text-sm'>{btn.label}</span>
                </Button>
              ))}
            </ButtonGroup>

            {/* 第二行：Video Effects, Image Playground, 编辑/删除（带文字） */}
            <ButtonGroup className='mb-1 w-full' radius='md' variant='light'>
              {actionButtons.slice(3, 5).map(btn => (
                <Button
                  key={btn.key}
                  onClick={btn.onClick}
                  isIconOnly={isOwnCharacter}
                  className='flex h-10 text-primary xs:flex-none sm:flex-1'>
                  {btn.icon}
                  <span
                    className={`text-sm ${isOwnCharacter ? 'xs:hidden sm:block' : ''}`}>
                    {btn.label}
                  </span>
                </Button>
              ))}

              {isAuth && isOwnCharacter && (
                <>
                  <Button
                    variant='light'
                    onClick={() => {
                      router.push(
                        `/character/edit?id=${charData.character_uniqid}`,
                      );
                    }}
                    startContent={<IconEdit className='w-4 h-4 mr-1' />}
                    className='text-blue-600 w-auto flex gap-1 items-center justify-center px-2 h-10'>
                    <span className='text-sm'>{t('editCharacter')}</span>
                  </Button>

                  <Button
                    variant='light'
                    onClick={onOpenDeleteModal}
                    className='text-red-600 w-auto flex gap-1 items-center justify-center px-2 h-10'>
                    <IconTrash className='w-4 h-4 mr-1' />
                    <span className='text-sm'>{t('deleteCharacter')}</span>
                  </Button>
                </>
              )}
            </ButtonGroup>
          </div>

          {/* 桌面端：两栏布局 */}
          <div className='hidden md:block'>
            {/* 第一栏：主要创作按钮 */}
            <ButtonGroup className='w-full mb-1' radius='md' variant='light'>
              {isOwnCharacter ? (
                // 当不是自己的角色时，只显示前3个按钮和工具按钮
                <>
                  {actionButtons.slice(0, 3).map(btn => (
                    <Button
                      key={btn.key}
                      onClick={btn.onClick}
                      className='flex gap-1 items-center px-3 h-10 text-primary'>
                      {btn.icon}
                      <span>{btn.label}</span>
                    </Button>
                  ))}

                  {/* Video Effects / Playground + Edit/Delete (icon-only with tooltips) */}
                  <ToolButtonsWithTooltips
                    charData={charData}
                    onOpenDeleteModal={onOpenDeleteModal}
                    isOwnCharacter={isOwnCharacter}
                  />
                </>
              ) : (
                // 当是自己的角色时，显示所有action按钮
                actionButtons.map(btn => (
                  <Button
                    key={btn.key}
                    onClick={btn.onClick}
                    className='flex gap-1 items-center px-3 h-10 text-primary'>
                    {btn.icon}
                    <span>{btn.label}</span>
                  </Button>
                ))
              )}
            </ButtonGroup>
          </div>
        </div>

        {/* 分隔线 */}
        <Divider className='w-full bg-muted' />

        <div className='p-2'>
          {isOwnCharacter ? (
            <PostCharacterButton charData={charData} />
          ) : (
            <CollectCharacterButton
              isCollected={isCollected}
              isCollecting={isCollecting}
              onCollect={onCollectCharacter}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ToolButtonsWithTooltips = ({
  charData,
  onOpenDeleteModal,
  isOwnCharacter,
}: {
  charData: any;
  onOpenDeleteModal: () => void;
  isOwnCharacter: boolean;
}) => {
  const { t } = useTranslation('character');
  const router = useRouter();
  const isAuth = useAtomValue(authAtom);

  const tools = [
    {
      path: '/ai-video-effects',
      icon: <TbSparkles className='w-4 h-4' />,
      labelKey: 'videoEffects',
      queryParams: { activeTab: 'templates' },
    },
    {
      path: '/playground',
      icon: <TbPhotoEdit className='w-4 h-4' />,
      labelKey: 'imagePlayground',
      queryParams: { style: '' },
    },
  ];

  return (
    <>
      {tools.map((tool, idx) => (
        <Tooltip key={idx} content={t(tool.labelKey)} placement='top'>
          <Button
            isIconOnly
            variant='light'
            aria-label={t(tool.labelKey)}
            onClick={() => {
              try {
                if (charData && charData.character_pfp) {
                  const queryParams = new URLSearchParams();
                  queryParams.append('mediaType', 'character');
                  queryParams.append('source', 'character');
                  queryParams.append('prompt', charData.character_name || '');
                  queryParams.append('mediaUrl', charData.character_pfp);
                  queryParams.append('characterId', charData.character_uniqid);
                  if (tool.queryParams) {
                    for (const [key, value] of Object.entries(
                      tool.queryParams,
                    )) {
                      queryParams.append(key, value);
                    }
                  }
                  router.push(`${tool.path}?${queryParams.toString()}`);
                }
              } catch (error) {
                console.error('Failed to process image:', error);
                toast.error(t('error.imageProcessingFailed'));
              }
            }}
            className='h-10 text-primary min-w-[40px] w-auto px-1 md:px-2'>
            {tool.icon}
          </Button>
        </Tooltip>
      ))}

      {isAuth && isOwnCharacter && (
        <>
          <Tooltip content={t('editCharacter')} placement='top'>
            <Button
              isIconOnly
              variant='light'
              onClick={() => {
                router.push(`/character/edit?id=${charData.character_uniqid}`);
              }}
              className='h-10 text-blue-600 min-w-[40px] w-auto px-1 md:px-2'>
              <IconEdit className='w-4 h-4 mr-1' />
            </Button>
          </Tooltip>

          <Tooltip content={t('deleteCharacter')} placement='top'>
            <Button
              isIconOnly
              variant='light'
              onClick={onOpenDeleteModal}
              className='h-10 text-red-600 min-w-[40px] w-auto px-1 md:px-2'>
              <IconTrash className='w-4 h-4 mr-1' />
            </Button>
          </Tooltip>
        </>
      )}
    </>
  );
};

const PostCharacterButton = ({ charData }: { charData: any }) => {
  const { t } = useTranslation('character');
  const router = useRouter();

  return (
    <Button
      className='flex justify-center items-center w-full h-10 font-medium text-primary-foreground bg-gradient-to-r rounded-lg shadow-sm transition-all from-primary-400 to-primary-500 hover:shadow-md'
      onClick={async () => {
        try {
          mixpanel.track('post.character', { ...charData });
        } catch (error) {}

        // 构建发布内容
        const publishContent = `${t('checkOutMyCharacter')}: ${window.origin}/character/${charData.character_uniqid}

${t('name')}: ${charData.character_name}
${t('gender')}: ${charData.gender}
${t('age')}: ${charData.age}
${t('profession')}: ${charData.profession}
${t('personality')}: ${charData.personality}
${t('interests')}: ${charData.interests}
${t('intro')}: ${charData.intro}`;

        const queryParams = new URLSearchParams();
        queryParams.append('mediaType', 'image');
        queryParams.append('source', 'character');
        queryParams.append('prompt', `My OC ${charData.character_name}`);
        queryParams.append('content', publishContent);
        queryParams.append('mediaUrl', charData.character_pfp);
        queryParams.append('tags', `OC,@${charData.character_uniqid}`);

        router.push(`/publish?${queryParams.toString()}`);
      }}>
      <div className='flex justify-center items-center mr-2 w-5 h-5'>
        <BsShareFill className='w-4 h-4' />
      </div>
      <span>{t('post')}</span>
    </Button>
  );
};

const CollectCharacterButton = ({
  isCollected,
  isCollecting,
  onCollect,
}: {
  isCollected: boolean;
  isCollecting: boolean;
  onCollect: () => void;
}) => {
  const { t } = useTranslation('character');

  return (
    <Button
      className={`flex justify-center items-center w-full h-10 font-medium rounded-lg shadow-sm transition-all ${
        isCollected
          ? 'text-muted-foreground bg-muted hover:bg-muted/80'
          : 'text-primary-foreground bg-gradient-to-r from-primary-400 to-primary-500 hover:shadow-md'
      }`}
      onClick={onCollect}
      isLoading={isCollecting}
      isDisabled={isCollecting}>
      {!isCollecting && (
        <div className='flex justify-center items-center mr-2 w-5 h-5'>
          {isCollected ? (
            <HiOutlineTrash className='w-4 h-4' />
          ) : (
            <HiOutlinePlus className='w-4 h-4' />
          )}
        </div>
      )}
      <span>
        {isCollecting
          ? t('loading')
          : isCollected
            ? t('unadoptCharacter')
            : t('adoptCharacter')}
      </span>
    </Button>
  );
};
