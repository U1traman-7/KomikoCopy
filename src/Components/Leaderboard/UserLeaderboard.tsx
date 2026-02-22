import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, ChangeEventHandler } from 'react';
import { Button, ScrollShadow } from '@nextui-org/react';
import {
  Card,
  Chip,
  CardBody,
  CardFooter,
  CardHeader,
  Image,
  Avatar,
  Textarea,
} from '@nextui-org/react';
import dynamic from 'next/dynamic';
import { Header } from '../../Components/Header';
import { Sidebar } from '../../Components/Sidebar';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider,
  Tabs,
  Tab,
} from '@nextui-org/react';
import { IconHeart, IconSend2, IconShare3 } from '@tabler/icons-react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { formatDistanceToNow, parseISO } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { userListAtom, User } from '../../state';
import { useAtom } from 'jotai';
import { useTranslation } from 'react-i18next';

import useInfiniteScroll from '../../Components/Feed/useInfiniteScroll'; // adjust the path as necessary

// Dynamically import Image component with no SSR
const DynamicImage = dynamic(
  () => import('@nextui-org/react').then(mod => mod.Image),
  { ssr: false },
);

const tags = ['All Time', 'Monthly', 'Weekly'];

function formatRelativeTime(timestamp: string) {
  const date = parseISO(timestamp);
  return formatDistanceToNow(date, { addSuffix: true });
}

export default function CharacterLeaderboard() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [list, setList] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string>(tags[0]);

  // ! HANDLE SCROLL
  const fetchMoreData = async (isInitial = false) => {
    const newPage = isInitial ? 1 : page;
    setPage(prev => prev + 1);
    const newData = await fetch(
      `/api/fetchLeaderboard?page=${newPage}&sortby=${selectedTag}&board=user`,
    ).then(res => res.json());
    console.log(
      `/api/fetchLeaderboard?page=${newPage}&sortby=${selectedTag}&board=user`,
    );
    console.log(newData);
    if (Array.isArray(newData)) {
      setList(prev => (isInitial ? newData : [...prev, ...newData]));
    } else {
      console.log('fetched invalid data');
    }
  };
  const [lastElementRef, isFetching] = useInfiniteScroll(() =>
    fetchMoreData(false),
  );

  // ! HANDLE FOLLOW
  const handleFollow = async (id: number) => {
    const updatedList = list.map(item => {
      if (item.id === id) {
        console.log(item);
        const updatedItem = { ...item, followed: !item.followed };
        let followValue = 0;
        if (item.followed) {
          followValue = -1;
        } else {
          followValue = 1;
        }

        console.log(
          JSON.stringify({ followingUserId: item.id, value: followValue }),
        );
        // Make API call to update follow
        fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            followingUserId: item.id,
            value: followValue,
          }),
        });
        return updatedItem;
      }
      return item;
    });
    setList(updatedList);
  };

  return (
    <>
      {/*
            //! CHARACTER FEED
            */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-1'>
        {list.map((item, index) => (
          <div key={index} className='items-center'>
            <Card className='bg-card items-center w-full shadow-none'>
              <CardBody className='flex flex-row justify-between items-center p-0'>
                <div className='flex flex-row h-full'>
                  <Avatar
                    name={item.user_name}
                    alt={item.user_uniqid}
                    className='object-cover w-20 h-20 rounded-full cursor-pointer'
                    src={item.image}
                    onClick={() => {
                      router.push(`/user/${item.user_uniqid}`);
                    }}
                  />
                  <div className='flex flex-col justify-center pl-6 h-20 text-lg'>
                    <p
                      className='cursor-pointer'
                      onClick={() => {
                        router.push(`/user/${item.user_uniqid}`);
                      }}>
                      {item.user_name}
                    </p>
                    <p className='text-default-500 text-md'>
                      {t('likes', { count: item.post_likes || 0 })}
                    </p>
                  </div>
                </div>
                <div>
                  <>
                    {item.followed ? (
                      <Button
                        variant='ghost'
                        radius='full'
                        size='md'
                        className='text-foreground bg-card shadow-none'
                        onClick={() => handleFollow(item.id)}>
                        {t('following')}
                      </Button>
                    ) : (
                      <Button
                        color='primary'
                        variant='solid'
                        radius='full'
                        size='md'
                        className='px-8 capitalize bg-primary-300'
                        onClick={() => handleFollow(item.id)}>
                        {t('follow')}
                      </Button>
                    )}
                  </>
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
        <div
          ref={lastElementRef}
          style={{ height: 20 }}
          className='mt-40 w-full'></div>
      </div>
    </>
  );
}
