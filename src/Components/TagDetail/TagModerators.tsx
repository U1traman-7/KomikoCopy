import React from 'react';
import { Avatar, Button, Card, CardBody, Skeleton } from '@nextui-org/react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

interface Moderator {
  id: number;
  user_id: string;
  role: string;
  user_name?: string;
  user_image?: string;
  user_uniqid?: string;
}

interface TagModeratorsProps {
  moderators: Moderator[];
  isLoading?: boolean;
  applyUrl?: string;
  canApply?: boolean;
}

// Moderator application form URL
const DEFAULT_APPLY_URL = 'https://duskuifxovd2.sg.larksuite.com/share/base/form/shrlgk9QBOCKgqRlI53sS3v3qEg';

export const TagModerators: React.FC<TagModeratorsProps> = ({
  moderators,
  isLoading = false,
  applyUrl = DEFAULT_APPLY_URL,
  canApply = true,
}) => {
  const { t } = useTranslation('tags');

  if (isLoading) {
    return (
      <Card className="bg-card w-full">
        <CardBody className="p-4">
          <Skeleton className="w-32 h-5 mb-3 rounded-lg" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-content1/50 backdrop-blur-sm">
      <CardBody className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-default-700">
            {t('moderators')}
          </h3>
        </div>

        {/* Layout: Apply button on LEFT, Moderators on RIGHT (per design spec) */}
        <div className="flex items-center gap-3">
          {/* Apply Button - positioned on left */}
          {canApply && (
            <Button
              as="a"
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              variant="flat"
              color="primary"
              className="flex-shrink-0"
            >
              {t('applyModerator')}
            </Button>
          )}

          {/* Moderator List */}
          <div className="flex items-center gap-2 flex-wrap">
            {moderators.length > 0 ? (
              moderators.map((mod) => (
                <Link
                  key={mod.id}
                  href={`/profile/${mod.user_uniqid || mod.user_id}`}
                  className="group"
                >
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-default-100 hover:bg-default-200 transition-colors">
                    <Avatar
                      src={mod.user_image}
                      name={mod.user_name?.charAt(0) || '?'}
                      size="sm"
                      className="w-6 h-6"
                    />
                    <span className="text-xs text-default-700 group-hover:text-primary-500 transition-colors">
                      {mod.user_name || 'Anonymous'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <span className="text-xs text-default-400">
                {t('noModerators')}
              </span>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default TagModerators;

