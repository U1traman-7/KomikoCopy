import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, ChangeEventHandler } from "react";
import { Button, ScrollShadow } from "@nextui-org/react";
import { Card, Chip, CardBody, CardFooter, CardHeader, Avatar, Textarea} from "@nextui-org/react";
import dynamic from 'next/dynamic';
import { Header } from '../../Components/Header'
import { Sidebar } from '../../Components/Sidebar';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Divider, Tabs, Tab} from "@nextui-org/react";
import { IconHeart, IconSend2, IconShare3 } from '@tabler/icons-react';
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { formatDistanceToNow, parseISO } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image'
import mixpanel from 'mixpanel-browser';
import { useTranslation } from 'react-i18next';

import { CharacterLeaderboard } from '../../Components/Leaderboard';
import { UserLeaderboard } from '../../Components/Leaderboard';

// Dynamically import Image component with no SSR
const DynamicImage = dynamic(() => import("@nextui-org/react").then(mod => mod.Image), { ssr: false });

export interface Character {
    id: number;
    authUserId: string;
    character_uniqid: string;
    created_at: string;
    character_name: string;
    character_description: string;
    file_uniqid: string;
    age: string;
    profession: string;
    personality: string;
    interests: string;
    intro: string;
    character_pfp: string;
    rizz: number;
    num_adopt: number;
}

const tags = ["Trending", "Newest", "Most Likes"];

function formatRelativeTime(timestamp: string) {
    const date = parseISO(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
}

export default function Home({characters}: {characters: Character[]}) {
    const { t } = useTranslation('leaderboard');

    useEffect(() => { const timeoutId = setTimeout(() => { if (typeof window !== 'undefined') {
        try { mixpanel.track('visit.page.leaderboard', {}); console.log('tracking mixpanel'); }
        catch (error) { console.error('Mixpanel tracking failed:', error); } } }, 800);
    return () => clearTimeout(timeoutId); }, []);

    enum TabName {
      CHARACTERS = 'characters',
      KOMIFANS = 'komifans',
    }
    const [tabName, setTabName] = useState<TabName>(TabName.CHARACTERS);

    return (
        <div className="flex flex-col h-screen caffelabs text-foreground bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <div className="flex justify-center p-0 pt-0 pb-0 w-full h-full md:pl-4 md:pr-4 md:pl-48 lg:pl-60 2xl:pl-80">

                    <div className="container pr-2 pl-2 mx-auto max-w-md lg:max-w-2xl lg:pr-40 md:pl-0 md:pr-0">
                        <Card
                            radius="lg"
                            className="mt-20 border-none"
                            >
                        <Image
                            alt="Woman listing to music"
                            className="object-cover w-full"
                            height={100}
                            src="/images/leaderboard.webp"
                            width={200}
                        />
                        <CardFooter className="justify-between absolute before:rounded-xl rounded-large bottom-8 w-[calc(100%_-_1rem)] md:w-[calc(100%_-_4rem)] shadow-small z-10">
                            <p className="text-6xl text-white">{t('leaderboard')}</p>
                        </CardFooter>
                        </Card>
                        <Tabs aria-label="Options" radius="full"
                            size="lg"
                            classNames={{
                                tabList: "bg-card flex justify-center mx-auto",
                            }}
                            className = "mx-auto mt-4 w-full"
                            onSelectionChange={(e) => {
                                setTabName(e as TabName);
                            }}
                        >
                            <Tab key={TabName.CHARACTERS} title={t('characters')} />
                            <Tab key={TabName.KOMIFANS} title={t('komifans')} />

                        </Tabs>
                        <div className='px-1 py-3'>
                          {tabName === TabName.CHARACTERS && <CharacterLeaderboard characters={characters} />}
                          {tabName === TabName.KOMIFANS && <UserLeaderboard />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const getServerSideProps = async () => {
  const origin = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${origin}/api/fetchLeaderboard?page=1&sortby=All Time&board=character`).catch();
  const data = await res.json().catch();
  if(!data || data.error) {
    return {
      props: {
        characters: []
      }
    }
  }

  return {
    props: {
      characters: data
    }
  }
}
