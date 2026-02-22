import { Card, Image, Button, Divider, Tooltip } from '@nextui-org/react';
import {
  IconShare3,
  IconBrain,
  IconHeart,
  IconId,
  IconUser,
  IconBriefcase,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { shareLink } from '../../utilities';
import mixpanel from 'mixpanel-browser';
import { useState } from 'react';
import { useUser } from '../../hooks/useUser';
import Link from 'next/link';
import { getLocalizedField } from '../../utils/i18nText';

interface CharacterCardProps {
  charData: any;
  isDeleting: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  charData,
  isDeleting,
}) => {
  const { t, i18n } = useTranslation('character');
  const currentUser = useUser();
  const displayCollectCount = (charData.num_collected || 0) + 1;

  // 获取当前语言
  const currentLocale = i18n.language || 'en';

  // 获取本地化文本（支持 i18n 列格式）
  const localizedCharacterName = getLocalizedField(
    charData,
    'character_name',
    currentLocale,
  );
  const localizedIntro = getLocalizedField(charData, 'intro', currentLocale);
  const localizedPersonality = getLocalizedField(
    charData,
    'personality',
    currentLocale,
  );
  const localizedInterests = getLocalizedField(
    charData,
    'interests',
    currentLocale,
  );
  const localizedGender = getLocalizedField(charData, 'gender', currentLocale);
  const localizedProfession = getLocalizedField(
    charData,
    'profession',
    currentLocale,
  );

  return (
    <Card className='flex overflow-hidden flex-col mt-3 w-full bg-card border border-border shadow-md max-w-xl mx-auto'>
      <div className='flex relative justify-between items-center px-4 h-10 bg-gradient-to-r from-primary-100 to-primary-200'>
        <div className='flex gap-2 items-center'>
          <IconId size={16} className='text-primary-500' />
          <h2 className='text-sm font-medium text-primary-600'>
            {t('id')}: {charData.character_uniqid}
          </h2>
        </div>
        <div className='flex space-x-1.5'>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className='w-1.5 h-5 bg-card bg-opacity-40 rounded-full'
                style={{ opacity: 0.4 + i * 0.1 }}></div>
            ))}
        </div>
      </div>

      <div className='flex flex-col p-4 md:flex-row'>
        {/* Left Column - Character Image */}
        <div className='relative w-full md:w-[45%] flex flex-col items-center mb-4 md:mb-0'>
          <div className='w-full max-w-[300px] aspect-[3/4] overflow-hidden rounded-lg border border-border  '>
            <Image
              src={charData.character_pfp}
              alt={localizedCharacterName}
              className='w-full h-full rounded-lg shadow-sm'
              style={{
                objectFit: 'cover',
                objectPosition: 'top',
              }}
              width={300}
              height={400}
            />
          </div>

          {/* Author Info - Moved here with subtle prominence */}
          <div className='w-full max-w-[300px] mt-3'>
            {charData.user_name && (
              <p className='text-sm font-medium text-center'>
                {(() => {
                  const authorName = charData.user_name;
                  const isCurrentUser = currentUser?.name === authorName;
                  if (isCurrentUser) {
                    return (
                      <span className='bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600'>
                        {t('createdBy', { author: 'you' })}
                      </span>
                    );
                  }
                  // No user_uniqid - just show text without link
                  if (!charData.user_uniqid) {
                    return (
                      <span className='bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600'>
                        {t('createdBy', { author: `@${authorName}` })}
                      </span>
                    );
                  }
                  return (
                    <>
                      <span className='bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600'>
                        {t('createdBy', { author: '' }).replace(
                          /\s*$/,
                          '',
                        )}{' '}
                      </span>
                      <Link
                        href={`/user/${charData.user_uniqid}`}
                        className='bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 underline decoration-primary-400/50 hover:decoration-primary-600 decoration-1 underline-offset-2 transition-all'>
                        @{authorName}
                      </Link>
                    </>
                  );
                })()}
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Character Info with Profile */}
        <div className='w-full md:w-[55%] md:pl-4 flex flex-col'>
          <div className='flex-1'>
            <div className='flex justify-between items-start mb-1'>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold text-heading'>
                  {localizedCharacterName}
                </h1>
                <Tooltip
                  content={t('collectedCountDesc', {
                    count: displayCollectCount,
                  })}
                  placement='top'>
                  <div className='flex items-center gap-1 px-2 py-1 bg-red-50 rounded-full'>
                    <IconHeart
                      size={16}
                      className='text-red-500 fill-red-500'
                    />
                    <span className='text-sm font-medium text-red-600'>
                      {displayCollectCount}
                    </span>
                  </div>
                </Tooltip>
              </div>
              <Tooltip content={t('shareCharacter')} placement='top'>
                <Button
                  className='rounded-lg shadow-sm transition-colors transition-shadow duration-200 ease-in-out bg-primary-100 hover:bg-primary-200 text-primary-600 hover:shadow-md'
                  isIconOnly
                  size='sm'
                  onClick={async () => {
                    try {
                      mixpanel.track('share.character', {
                        ...charData,
                      });
                    } catch (error) {}
                    let url = `${window.origin}/character/${charData.character_uniqid}`;
                    await shareLink(
                      url,
                      t('checkOutMyCharacter'),
                      t('checkOutMyCharacter'),
                    );
                  }}>
                  <IconShare3
                    stroke={1.5}
                    className={`w-5 h-5 text-primary-600`}
                  />
                </Button>
              </Tooltip>
            </div>
            <div className='flex gap-2 items-center mb-2'>
              <div className='flex flex-col gap-1 text-xs'>
                <h3 className='text-muted-foreground text-[10px] uppercase tracking-wide'>
                  {t('gender')}
                </h3>
                <div className='flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-foreground max-w-[150px]'>
                  <IconUser size={14} className='text-muted-foreground shrink-0' />
                  <span className='truncate'>
                    {localizedGender || 'unknown'}
                  </span>
                </div>
              </div>
              <div className='flex flex-col gap-1 text-xs'>
                <h3 className='text-muted-foreground text-[10px] uppercase tracking-wide'>
                  {t('profession')}
                </h3>
                <div className='flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-foreground max-w-[150px]'>
                  <IconBriefcase size={14} className='text-muted-foreground shrink-0' />
                  <span className='truncate'>
                    {localizedProfession || 'unknown'}
                  </span>
                </div>
              </div>
            </div>
            <Divider className='my-2 bg-border' />

            {/* Profile Data */}
            <div className='space-y-3'>
              <div className='flex flex-col gap-1'>
                <h3 className='text-muted-foreground text-[10px] uppercase tracking-wide'>
                  {t('intro')}
                </h3>
                <CollapsibleText
                  text={localizedIntro || 'unknown'}
                  maxLength={100}
                />
              </div>

              {[
                {
                  label: t('personality'),
                  value: localizedPersonality,
                  icon: IconBrain,
                },
                {
                  label: t('interests'),
                  value: localizedInterests,
                  icon: IconHeart,
                },
              ].map((item, index) => (
                <div key={index} className='flex flex-col gap-1'>
                  <h3 className='text-muted-foreground text-[10px] uppercase tracking-wide'>
                    {item.label}
                  </h3>
                  <div className='p-2 bg-muted rounded border border-border'>
                    <div className='flex gap-2 items-start'>
                      <item.icon
                        size={16}
                        className='text-muted-foreground mt-0.5 flex-shrink-0'
                      />
                      <span className='text-sm text-foreground'>
                        {item.value || 'unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const CollapsibleText = ({
  text,
  maxLength,
}: {
  text: string;
  maxLength: number;
}) => {
  const { t } = useTranslation('character');
  const [isExpanded, setIsExpanded] = useState(false);

  if (text.length <= maxLength) {
    return (
      <div className='py-1 pl-3 text-sm text-foreground border-l-4 border-border'>
        {text}
      </div>
    );
  }

  return (
    <div className='py-1 pl-3 text-sm text-foreground border-l-4 border-border'>
      <div className={`${isExpanded ? '' : 'max-h-20 overflow-hidden'}`}>
        {text}
      </div>
      <span
        className='inline-flex items-center mt-1 text-xs cursor-pointer text-primary-500'
        onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? t('less') || 'Less' : t('more') || 'More'}
        {isExpanded ? (
          <IconChevronUp size={14} className='ml-1' />
        ) : (
          <IconChevronDown size={14} className='ml-1' />
        )}
      </span>
    </div>
  );
};
