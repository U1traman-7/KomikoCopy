import { CardFooter, NextUIProvider, Tab, Tabs } from '@nextui-org/react';
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { Analytics } from "@vercel/analytics/react";
import { Card, CardBody, CardHeader, Avatar, Button, Divider, Image } from "@nextui-org/react";
import toast, { Toaster } from 'react-hot-toast';
import { Header } from '../../Components/Header'
import { CreateCharacterButton } from '../../Components/MainApp';
import { Sidebar } from '../../Components/Sidebar';
import { exportImageAtom, postContentAtom, postTitleAtom, profileAtom } from '../../state';
import { useAtom } from 'jotai';
import mixpanel from 'mixpanel-browser';
import { getCharacterProfile } from '../../utilities';
import Head from 'next/head';
import { CharacterBar } from '@/Components/character/CharacterBar';
import Script from 'next/script';
import { GetServerSideProps } from 'next';
import { useTranslation } from 'react-i18next';

interface WorldProps {
  id: string;
  title: string;
  description: string;
  criteria: string;
  story: string;
  cover?: string;
  numPlayers: string;
  User: any;
}


export default function Page({ worlds, characters }: { worlds: WorldProps[], characters: any[] }) {
  const { t } = useTranslation('world');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try { mixpanel.track('visit.page.worlds', {}); console.log('tracking mixpanel'); }
        catch (error) { console.error('Mixpanel tracking failed:', error); }
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, []);

  const router = useRouter()
  const { character_id } = router.query
  const [selectedCharName, setSelectedCharName] = useState(t('loadingText'));
  const [allCharData, setAllCharData] = useState<any[]>([]);
  const [profile, setProfile] = useAtom(profileAtom);
  const [charData, setCharData] = useState(characters?.[0] || {
    age: t('loadingText'),
    authUserId: t('loadingText'),
    character_description: t('loadingText'),
    character_name: t('chooseCharacter'),
    character_uniqid: t('loadingText'),
    created_at: t('loadingText'),
    file_uniqid: t('loadingText'),
    gender: t('loadingText'),
    id: t('loadingText'),
    character_pfp: t('loadingText'),
    interests: t('loadingText'),
    intro: t('loadingText'),
    loras: [],
    personality: t('loadingText'),
    profession: t('loadingText'),
    user_image: t('loadingText'),
    user_name: t('loadingText'),
  })

  //! FETCH PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/fetchProfile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ method: 'profile' }),
        });
        console.log("calling fetch profile");

        const data = await response.json();
        setProfile({ ...data, authUserId: data.id });

      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);


  const WorldCard: React.FC<WorldProps> = ({ id, title, description, criteria, cover, numPlayers, User }) => (
    <Card isHoverable className="flex flex-row items-start h-full">
      <div className="flex-shrink-0 w-[120px] h-full">
        <img
          src={cover}
          className="object-cover rounded h-full w-[120px]"
          alt={title}
        />
        <div className="absolute bottom-0 left-1 text-sm text-white">@{User?.user_name}</div>
      </div>
      {/* 文本内容 */}
      <div className="flex-grow p-3">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-muted-foreground">{t('playedCount', { count: numPlayers })}</div>
        <div className="mt-1 text-xs">{description.replace(/{character}/g, charData.character_name)}</div>
        {criteria && <div className="mt-1 text-xs text-foreground"><b>{t('goalLabel')}</b> <i>{criteria.replace(/{character}/g, charData.character_name)}</i></div>}
        <div className="mt-2">
          <a href={`/world/play?world_id=${id}&character_id=${charData.character_uniqid}`} onClick={(e) => e.preventDefault()}>
            <Button size="sm" color="primary" isDisabled={allCharData.length == 0} onClick={() => {
              try { mixpanel.track('click.worlds.begin'); } catch (error) { }
              router.push(`/world/play?world_id=${id}&character_id=${charData.character_uniqid}`);
            }}>{t('beginJourneyButton')}</Button>
          </a>
        </div>
      </div>
    </Card>
  );

  return (
    <NextUIProvider>
      <Head>
        <title>{t('pageTitle')}</title>
        {/* //! googleAds  */}
      </Head>
      <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-16476793251"></Script>
      <Script
        dangerouslySetInnerHTML={{
          __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'AW-16476793251');
                        `,
        }}
      ></Script>
      <Analytics />
      <div><Toaster position="top-right" /></div>
      <main className="flex flex-col h-full caffelabs text-foreground bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <div className="overflow-y-auto p-4 pt-20 pb-24 w-full h-full md:pl-56 lg:pl-[240px] ml-5">


            <div className="flex overflow-y-auto flex-col items-center w-full h-full">
              {/* // Character Bar */}
              <CharacterBar
                selectedCharName={selectedCharName}
                setSelectedCharName={setSelectedCharName}
                allCharData={allCharData}
                setAllCharData={setAllCharData}
                charData={charData}
                setCharData={setCharData}
                defaultCharIds={["Furina_(Genshin_Impact)", "Scaramouche_(Genshin_Impact)", "Tartaglia_(Genshin_Impact)", "Gojou_Satoru"]}
                initialCharData={characters?.[0]}
              />
              {allCharData.length == 0 && <div className="m-1 text-xl text-primary-700">{t('noCharactersMessage')}</div>}
            </div>
            <div className="grid grid-cols-1 gap-3 mt-2 lg:grid-cols-2 md:ml-5">
              <Card isHoverable className="flex flex-row items-start h-full">
                <div className="flex-shrink-0 w-[120px] h-full flex items-center justify-center bg-muted">
                  <div className="text-4xl">🤩</div>
                </div>
                <div className="flex-grow p-3">
                  <div className="text-sm font-bold">{t('createWorldTitle')}</div>
                  <div className="mt-1 text-xs">{t('createWorldDescription')}</div>
                  <div className="mt-2">
                    <Button size="sm" color="primary" onClick={() => {
                      router.push(`/world/create`)
                    }}>{t('createWorldButton')}</Button>
                  </div>
                </div>
              </Card>
              {worlds?.map((game, index) => (
                <WorldCard key={index} {...game} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </NextUIProvider >
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const origin = process.env.NEXT_PUBLIC_API_URL!;
  const url = new URL(origin + req.url);
  const characterId = url.searchParams.get('character_id');

  const promises = [
    fetch(`${origin}/api/worlds`)
      .then((res) => res.json())
      .catch(),
    getCharacterProfile([characterId || '']).catch(),
  ];
  const [worlds, characters] = await Promise.all(promises);
  return {
    props: {
      worlds: worlds?.error ? [] : worlds,
      characters: characters?.error ? [] : characters,
    }
  };
}
