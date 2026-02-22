import React, { useEffect, useState } from 'react';
import { Avatar, Card, CardBody, Skeleton } from '@nextui-org/react';
import Link from 'next/link';

interface ModTag {
  id: number;
  name: string;
  logo_url?: string | null;
  is_nsfw?: boolean;
  role: string;
  moderator_since: string;
}

interface ProfileModTabProps {
  userId?: string;
  userUniqid?: string;
}

export const ProfileModTab: React.FC<ProfileModTabProps> = ({
  userId,
  userUniqid,
}) => {
  const [tags, setTags] = useState<ModTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModTags = async () => {
      if (!userId && !userUniqid) {
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        if (userId) {
          params.append('userId', userId);
        } else if (userUniqid) {
          params.append('userUniqid', userUniqid);
        }

        const response = await fetch(`/api/tag/moderated?${params}`);
        const data = await response.json();

        if (data.tags) {
          setTags(data.tags);
        }
      } catch (error) {
        console.error('Error fetching mod tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModTags();
  }, [userId, userUniqid]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardBody className="p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="w-24 h-4 rounded-lg mb-2" />
                    <Skeleton className="w-16 h-3 rounded-lg" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {tags.map((tag) => (
          <Link key={tag.id} href={`/tags/${tag.name}`}>
            <Card
              className="w-full hover:bg-default-100 transition-colors cursor-pointer"
              isPressable
            >
              <CardBody className="p-3">
                <div className="flex items-center gap-3">
                  {tag.logo_url ? (
                    <Avatar
                      src={tag.logo_url}
                      name={tag.name.charAt(0).toUpperCase()}
                      className="w-12 h-12 flex-shrink-0"
                      classNames={{
                        img: 'object-cover object-[50%_25%]',
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-default-400">#</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      #{tag.name}
                    </p>
                    <p className="text-xs text-default-400 capitalize">
                      {tag.role}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProfileModTab;
