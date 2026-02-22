import {
  Chip,
  NextUIProvider,
  Tab,
  Spinner,
  Input,
  Button,
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Divider,
  Image,
} from '@nextui-org/react';
import toast, { Toaster } from 'react-hot-toast';
import { Header } from '../../Components/Header';
import { CreateCharacterButton } from '../../Components/MainApp';
import { Sidebar } from '../../Components/Sidebar';
import {
  exportImageAtom,
  postContentAtom,
  postTitleAtom,
  profileAtom,
} from '../../state';
import { useAtom } from 'jotai';
import mixpanel from 'mixpanel-browser';
import { downloadURI, shareLink } from '../../utilities';
import { generateWatermarkedImage } from '../../utilities/watermark';
import Head from 'next/head';
import { motion } from 'framer-motion'; // Import framer-motion
import { BiSolidZap } from 'react-icons/bi';
// 动态导入Canvas相关依赖
// import { generateImageGetUrls, generateText } from '../../Components/InfCanva/utils';
import { IoIosArrowBack } from 'react-icons/io';
// import html2canvas from 'html2canvas';
import { TbMusic, TbMusicOff } from 'react-icons/tb';
import { IconShare3 } from '@tabler/icons-react';
import { LuImageOff, LuImage } from 'react-icons/lu';
import { FaRuler } from 'react-icons/fa6';
import { HiOutlineDownload } from 'react-icons/hi';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'react-i18next';
import { SEOTags } from '@/components/common/SEOTags';

// 动态加载Canvas相关工具函数
const loadCanvasUtils = async () => {
  const [{ generateImageGetUrls, generateText }, html2canvas] =
    await Promise.all([
      import('../../Components/InfCanva/utils'),
      import('html2canvas'),
    ]);
  return {
    generateImageGetUrls,
    generateText,
    html2canvas: html2canvas.default || html2canvas,
  };
};

type Ranking = 'F' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
const rankingColor: { [key in Ranking]: string } = {
  F: '#FF4C4C', // Example color for F (can be changed)
  B: '#FF8C00', // Example color for B (can be changed)
  A: '#2BC760', // Specified color for A
  S: '#1D9BF0', // Example color for S (can be changed)
  SS: '#563AFA', // Example color for SS (can be changed)
  SSS: '#FFC300', // Specified color for SSS
};

const rankingZaps: { [key in Ranking]: number } = {
  F: 0,
  B: 10,
  A: 20,
  S: 30,
  SS: 40,
  SSS: 50,
};
export default function Page({ initialCharData, initialWorldData }: any) {
  const router = useRouter();
  const { world_id, character_id } = router.query;
  const [profile, setProfile] = useAtom(profileAtom);
  const [LLMConvo, setLLMConvo] = useState<any[]>([]);
  const [storyline, setStoryline] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [userInput, setUserInput] = useState<string>('');
  const [customInput, setCustomInput] = useState<string>('');
  const [currentRole, setCurrentRole] = useState<string>('');
  const [currentLine, setCurrentLine] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [ranking, setRanking] = useState<string>('');
  const [options, setOptions] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [exportImage, setExportImage] = useAtom(exportImageAtom);
  const [postTitle, setPostTitle] = useAtom(postTitleAtom);
  const [postContent, setPostContent] = useAtom(postContentAtom);
  const elementRef = useRef<HTMLDivElement>(null);
  const excludeRef = useRef<HTMLDivElement>(null);
  const excludeRef2 = useRef<HTMLDivElement>(null);
  const excludeRef3 = useRef<HTMLDivElement>(null);
  const excludeRef4 = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [doGenerateImage, setDoGenerateImage] = useState<boolean>(true);
  const [generatingImage, setGeneratingImage] = useState<boolean>(false);
  const { t } = useTranslation('world_play');
  useEffect(() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const isMobileView = windowWidth < 768;
    setIsMobile(isMobileView);
  }, []);
  const [worldData, setWorldData] = useState(initialWorldData);
  const [charData, setCharData] = useState(initialCharData);
  const [profileRefreshKey, setProfileRefreshKey] = useState(false);

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
        console.log('calling fetch profile');

        const data = await response.json();
        setProfile({ ...data, authUserId: data.id });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [profileRefreshKey]);

  // Play music
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  useEffect(() => {
    if (worldData.music && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [worldData]);

  // Fetch character and world data
  useEffect(() => {
    (async () => {
      if (charData && worldData) {
        handlePlayPause();
        if (!charData.character_pfp) {
          setExportImage(worldData.cover);
        } else {
          setExportImage(charData.character_pfp);
        }

        const sysPrompt = `Act as an interactive story game simulator.

    GAME INFO
    Title: ${worldData.title}
    Description for player: ${worldData.description}
    Reference storyline: ${worldData.story}
    Setting and rules: ${worldData.rule}
    ${worldData.criteria ? `Criteria for game success (story ends): ${worldData.criteria}` : ''}

    CHARACTER INFO
    Name: ${charData.character_name}
    Gender: ${charData.gender}
    Age: ${charData.age}
    Profession: ${charData.profession}
    Personality: ${charData.personality}
    Interests: ${charData.interests}
    Appearance: ${charData.character_description}
    Introduction: ${charData.intro}

    PLAYER INFO
    Username: ${profile.user_name}
    Player may or may not act as the character ${charData.character_name} depending on the story game setting. If player act as the character, refer to the player as ${charData.character_name}. If player doesn't act as the character, refer to the player as you.

    For every player input, the simulator will generate a short piece of story plot that further develop the character ${charData.character_name} and the story game ${worldData.title}. Output a JSON in the following format:
    {
        "story": [
            {
                "role": string, // use "Narrator", "Player", "${charData.character_name}" or the name of other characters
                "line": string, // The line of the role. Keep each line short with no more than 2 sentences. Split long line into multiple lines. For character and player, wrap non-verbal cues and context in parentheses. No need for parenthesis when role is Narrator. When Narrator refers to the player, use the second person, e.g., you do this, you feel that. No quotation marks inside the line.
            }
            ... // more lines featuring different roles
        ],
        "image_prompt": string, // prompt for Stable Diffusion to generate image of the character ${charData.character_name} in the latest story scene. Rule: 1. Write the prompt as a list of phrases separated by commas. 2. Phrases should follow this order: 1x (choose from 1boy or 1girl or left empty), action and expression (e.g., reading books, frown), outfit (e.g., wearing a pink dress), characteristics (e.g., blonde hair, blue eyes), scenario (e.g., wide shot, neon light, in a castle). The image should be highly aesthetic
        "story_ends": boolean, // true if the story ends, false if the story continues
        "endgame_message": string, // a very short and fun humorous endgame message, left empty when story_ends is false
        "ranking": string, // choose one of "F", "B", "A", "S", "SS", "SSS" based on player's performance. "SSS" should be very hard to achieve, give more "A" "S" and "SS". Left empty when story_ends is false.
        "suggested_input": [
            string,
            ... // a list of 3 suggested input for player to choose from to continue the story, keep each input short with <= 5 words
        ]
    }
    Directly output the JSON and nothing else`;
        const initLLMConvo = [
          {
            role: 'user',
            parts: [
              {
                text: sysPrompt,
              },
            ],
          },
        ];
        await continueStory(initLLMConvo, charData);

        try {
          mixpanel.track('play.world', {
            world_title: worldData.title,
            character_name: charData.character_name,
            world_id: world_id,
          });
        } catch (error) {}

        // player number +1
      }
    })();
  }, [world_id]);
  const lineColor =
    currentRole == 'END'
      ? '#F5EFE5'
      : currentRole == 'Narrator'
        ? '#F5EFE5'
        : '#f4f1fe';

  const sendUserInput = async (input: string) => {
    setCurrentRole('Narrator');
    setCurrentLine('(Loading...)');
    setUserInput(input);
    setOptions([]);
    await continueStory(
      LLMConvo.concat([
        {
          role: 'user',
          parts: [
            {
              text: input,
            },
          ],
        },
      ]),
    );

    try {
      mixpanel.track('play.world.continue', {
        llm_convo: LLMConvo,
        world_id: world_id,
      });
    } catch (error) {}
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: `${worldData.title} - ${t('journey_with', { character: charData.character_name })}`,
    description: `${t('join_me_on_my_journey')} ${charData.character_name} ${t('in')} ${worldData.title}. ${worldData.description}`,
    image: charData.character_pfp || worldData.cover,
    author: {
      '@type': 'Organization',
      name: 'KomikoAI',
    },
    publisher: {
      '@type': 'Organization',
      name: 'KomikoAI',
    },
    gameItem: {
      '@type': 'Thing',
      name: charData.character_name,
    },
  };

  return (
    <NextUIProvider>
      <Head>
        <SEOTags
          canonicalPath={`/world/play?world_id=${world_id}&character_id=${character_id}`}
          title={`${worldData.title} - ${t('journey_with', { character: charData.character_name })} | KomikoAI`}
          description={`${t('join_me_on_my_journey')} ${charData.character_name} ${t('in')} ${worldData.title}. ${worldData.description}`}
          ogImage={charData.character_pfp || worldData.cover}
          structuredData={structuredData}
          locale={router.locale || 'en'}
        />
        <meta name='robots' content='index,follow' />
      </Head>
      <Analytics />
      <div>
        <Toaster position='top-right' />
      </div>
      <main className='flex flex-col h-full caffelabs text-foreground bg-background'>
        <Header />
        <audio ref={audioRef} src={worldData.music} loop />
        <div className='flex'>
          <div className='hidden md:block'>
            <Sidebar />
          </div>
          <div
            className='fixed pb-24 w-full h-full md:pl-56 lg:pl-[240px] ml-5'
            style={{
              cursor:
                currentLine === '(Loading...)' ||
                currentStep == storyline.length - 1
                  ? undefined
                  : 'pointer', // 控制鼠标样式
            }}
            onClick={async () => {
              if (currentStep < storyline.length - 1) {
                const step = currentStep + 1;
                setCurrentStep(step);
                setCurrentLine(storyline[step].line);
                setCurrentRole(storyline[step].role);
              }
            }}>
            <div
              ref={elementRef}
              style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                backgroundImage: `url('${exportImage}')`, // Replace with your image path
                backgroundSize: 'cover',
                backgroundPosition: 'top',
              }}>
              <div className='w-full h-full'>
                {
                  <div
                    className='absolute top-[85px] left-3 w-full flex items-center'
                    ref={excludeRef2}>
                    <Button
                      isIconOnly
                      size='sm'
                      className='bg-transparent rounded-full'
                      onClick={() => {
                        router.push(`/world?character_id=${character_id}`);
                      }}>
                      <IoIosArrowBack
                        className='w-7 h-7 text-white'
                        color='white'
                      />
                    </Button>
                    <div className='flex items-center px-2 py-1 ml-2 bg-card rounded-full shadow-md opacity-90'>
                      <BiSolidZap className='w-5 h-5 text-orange-400' />
                      <p className='ml-1 font-semibold'>
                        {t('zaps', { credit: profile.credit })}
                      </p>
                      {generatingImage && (
                        <Spinner
                          size='sm'
                          className='ml-1 w-5 h-5'
                          color='secondary'
                        />
                      )}
                    </div>
                    <div className='flex absolute right-7 items-center'>
                      <Button
                        isIconOnly
                        size='sm'
                        className='mr-2 bg-transparent rounded-full'
                        onClick={() => {
                          setDoGenerateImage(!doGenerateImage);
                        }}>
                        {doGenerateImage ? (
                          <LuImage className='w-6 h-6' color='white' />
                        ) : (
                          <LuImageOff className='w-6 h-6' color='white' />
                        )}
                      </Button>
                      <Button
                        isIconOnly
                        size='sm'
                        className='bg-transparent rounded-full'
                        onClick={() => {
                          handlePlayPause();
                        }}>
                        {isPlaying ? (
                          <TbMusic className='w-7 h-7' color='white' />
                        ) : (
                          <TbMusicOff className='w-7 h-7' color='white' />
                        )}
                      </Button>
                    </div>
                  </div>
                }
                {currentRole === 'END' && (
                  <motion.div
                    initial={{ opacity: 0.2, y: 16 }} // Initial state (slightly below)
                    animate={{ opacity: 1, y: 0 }} // End state (at original position)
                    transition={{ duration: 0.5 }} // Animation duration
                    key={currentRole} // Key to trigger re-animation
                    className='absolute top-[130px] w-full flex flex-col justify-center items-center'>
                    <img
                      src={'/images/banner.webp'}
                      style={{
                        maxWidth: '500px',
                        width: '90%',
                        height: 'auto',
                      }}
                    />
                    <p
                      className='absolute text-center'
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontSize: '5rem',
                        fontWeight: '800',
                        color: rankingColor[ranking as Ranking],
                        // color: 'transparent',
                        // background: `linear-gradient(180deg, ${rankingColor[ranking as Ranking]}, white)`,
                        // WebkitBackgroundClip: 'text',
                        // backgroundClip: 'text',
                        WebkitTextStroke: '1.5px #ffffff',
                        textShadow: `0px 10px 30px ${rankingColor[ranking as Ranking]}`,
                        margin: 0,
                        top: '-12px',
                      }}>
                      {ranking}
                    </p>
                    <p className='text-muted-foreground'>
                      ————— {t('rewards_divider')} —————
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        paddingTop: '5px',
                      }}>
                      <BiSolidZap className='mr-1 w-5 h-5 text-orange-400' />
                      {t('zaps_label')}
                      <div style={{ marginLeft: '10px', fontWeight: 'bold' }}>
                        x {rankingZaps[ranking as Ranking]}
                      </div>
                    </div>
                  </motion.div>
                )}
                {currentStep <= 0 && worldData.description && (
                  <div className='absolute bottom-[24rem] px-8 w-full'>
                    <div className='flex justify-center items-center h-full'>
                      <Card className='bg-black opacity-70 p-[11px] mb-5 max-w-[550px] h-full'>
                        <div className='h-full text-white'>
                          <b>{t('intro')}:</b> {worldData.description}
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
                {currentStep > 0 && userInput !== '' && (
                  <div className='absolute bottom-[24rem] px-5 w-full'>
                    <div className='max-w-[600px] mx-auto'>
                      <motion.div
                        initial={{ opacity: 0.2, y: 16 }} // Initial state (slightly below)
                        animate={{ opacity: 1, y: 0 }} // End state (at original position)
                        transition={{ duration: 0.5 }} // Animation duration
                        key={userInput} // Key to trigger re-animation
                        className='flex justify-end w-full'>
                        {/* <Image src={profile.image} /> */}
                        <Card
                          className='bg-black opacity-70 py-1.5 px-3 mb-5 max-w-[300px]'
                          style={{
                            boxShadow: '0 0 10px 3px rgba(0, 0, 0, 0.5)',
                            opacity: 0.8,
                          }}>
                          <div className='text-white'>{userInput}</div>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                )}
                {currentLine && (
                  <div className='absolute top-[calc(100%-24rem)] px-5 w-full z-20'>
                    <div className='flex justify-center items-center'>
                      <motion.div
                        initial={
                          currentLine == '(Loading...)'
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0.2, y: 16 }
                        } // Initial state (slightly below)
                        animate={{ opacity: 1, y: 0 }} // End state (at original position)
                        transition={{ duration: 0.5 }} // Animation duration
                        key={currentLine} // Key to trigger re-animation
                        className='w-full max-w-[600px]'>
                        <Card
                          className='overflow-y-auto relative w-full'
                          style={{
                            backgroundColor: lineColor,
                            opacity: 0.9,
                            fontSize:
                              currentRole == 'END' ? '1.1rem' : undefined,
                            boxShadow: `0 0 15px 5px ${lineColor}`,
                          }}>
                          <div className=' p-4 max-h-[20rem] overflow-y-auto'>
                            {currentRole !== '' &&
                              currentRole !== 'Narrator' &&
                              currentRole !== 'END' && (
                                <div>
                                  <div
                                    className='flex gap-2 items-center leading-relaxed text-md'
                                    style={{
                                      justifyContent:
                                        currentRole == 'Player' ||
                                        currentRole == 'You'
                                          ? 'end'
                                          : 'start',
                                    }}>
                                    {(currentRole == 'Player' ||
                                      currentRole == 'You') && (
                                      <Image
                                        className='object-cover object-top w-8 h-8'
                                        src={profile.image}
                                      />
                                    )}
                                    {currentRole == charData.character_name && (
                                      <Image
                                        className='object-cover object-top w-8 h-8'
                                        src={charData.character_pfp}
                                      />
                                    )}
                                    <div className='text-muted-foreground'>
                                      {currentRole == 'Player'
                                        ? t('you')
                                        : currentRole}
                                    </div>
                                  </div>
                                  <Divider className='my-2' />
                                </div>
                              )}
                            <div
                              className='leading-relaxed text-md'
                              style={{
                                color:
                                  currentLine == '(Loading...)'
                                    ? 'gray'
                                    : 'black',
                              }}>
                              {currentLine}
                            </div>
                            {currentLine !== '(Loading...)' &&
                              currentRole != 'END' && (
                                <img
                                  src='/images/next.gif'
                                  className='absolute right-2 bottom-2 w-5 h-5 opacity-60'
                                />
                              )}

                            {currentStep === storyline.length - 1 &&
                              currentRole !== 'END' &&
                              options &&
                              options.length > 0 && (
                                <div className='flex flex-col gap-2 mt-2'>
                                  {options.map((option: string) => (
                                    <div className='px-5 w-full'>
                                      <Button
                                        className='w-full rounded-full border-dashed opacity-100 border-1'
                                        style={{
                                          backgroundColor:
                                            currentRole == 'Narrator'
                                              ? '#F5E4CB'
                                              : '#DFD7FE',
                                          borderColor:
                                            currentRole == 'Narrator'
                                              ? '#F8B95B'
                                              : '#826AFB',
                                        }}
                                        onClick={() => {
                                          sendUserInput(option);
                                        }}>
                                        {option}
                                      </Button>
                                    </div>
                                  ))}
                                  <div className='flex gap-2 items-center px-5 w-full'>
                                    <input
                                      className='p-2 w-full text-base text-center rounded-full border-dashed opacity-100 border-1'
                                      placeholder={t('enter_your_own_response')}
                                      style={{
                                        backgroundColor: '#f3f4f6',
                                        // currentRole == "Narrator" ? "#F5E4CB" : "#DFD7FE",
                                        borderColor:
                                          currentRole == 'Narrator'
                                            ? '#F8B95B'
                                            : '#826AFB',
                                      }}
                                      value={customInput}
                                      onChange={(e: any) =>
                                        setCustomInput(e.target.value)
                                      }
                                    />
                                    <Button
                                      className='rounded-full'
                                      onClick={() => {
                                        setCustomInput('');
                                        sendUserInput(customInput);
                                      }}>
                                      {t('send')}
                                    </Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        </Card>
                      </motion.div>
                    </div>
                  </div>
                )}
                {currentRole == 'END' && (
                  <div
                    className='absolute bottom-[100px] w-full flex justify-center gap-3'
                    ref={excludeRef}>
                    {/* <Button
                                            size="md"
                                            color="primary"
                                            variant='flat'

                                            className="w-[140px] bg-primary-100 py-2 rounded-lg z-10 rounded-full"
                                            onClick={() => {
                                                router.push(`/world?character_id=${character_id}`);
                                            }}
                                        >
                                            End Journey
                                        </Button> */}
                    <Button
                      size='md'
                      color='primary'
                      variant='flat'
                      className='w-[140px] bg-primary-100 py-2 rounded-lg z-10 rounded-full'
                      onClick={async () => {
                        setPostTitle(
                          `${worldData.title} - ${t('journey_with')} ${charData.character_name}`,
                        );
                        let url = window.location.origin + router.asPath;
                        let storyContent = `${storyline
                          .map((line: any) => {
                            let role;
                            if (line.role == 'Player') {
                              role = 'You: ';
                            } else if (line.role == 'Narrator') {
                              role = '';
                            } else {
                              role = line.role + ': ';
                            }
                            return `${role}${line.line}`;
                          })
                          .join('\n')}`;
                        setPostContent(
                          `${t('join_me_on_the_journey')}: ${url}\n\n${storyContent}`,
                        );
                        if (elementRef.current) {
                          if (excludeRef.current)
                            excludeRef.current.style.display = 'none';
                          if (excludeRef2.current)
                            excludeRef2.current.style.display = 'none';
                          if (excludeRef3.current)
                            excludeRef3.current.style.display = 'none';
                          if (excludeRef4.current)
                            excludeRef4.current.style.display = 'none';
                          const { html2canvas } = await loadCanvasUtils();
                          const canvas = await html2canvas(elementRef.current);
                          const imgData = canvas.toDataURL('image/png');
                          setExportImage(imgData);
                        }
                        router.push(`/publish`);
                      }}>
                      {t('post')}
                    </Button>
                    <Button
                      size='md'
                      color='primary'
                      // variant='flat'

                      className='w-[140px] py-2 rounded-lg z-10 rounded-full'
                      onClick={async () => {
                        await shareLink(
                          window.location.origin + router.asPath,
                          `${t('i_just_completed_my_journey')} ${charData.character_name} - ${worldData.title}`,
                          `${t('i_just_completed_my_journey')} ${charData.character_name} - ${worldData.title}`,
                        );
                      }}>
                      <IconShare3
                        stroke={1.4}
                        className={`w-6 h-6 text-lg`}
                        color='white'
                      />
                      {t('share')}
                    </Button>
                  </div>
                )}

                <div
                  className='flex fixed bottom-4 gap-3 justify-between items-center px-4 text-white'
                  ref={excludeRef3}>
                  <div>
                    {t('created_by')} @{worldData.user_name}
                  </div>
                </div>
                <div
                  className='flex fixed bottom-2 right-4 gap-3 justify-between items-center text-white'
                  ref={excludeRef4}>
                  <div>
                    <Button
                      className='bg-opacity-0 rounded-full'
                      isIconOnly
                      onClick={async () => {
                        const watermarkedImage =
                          await generateWatermarkedImage(exportImage);
                        downloadURI(watermarkedImage, 'KomikoAI.png');
                      }}>
                      <HiOutlineDownload
                        className={`w-7 h-7 text-lg`}
                        color='white'
                      />
                    </Button>
                    <Button
                      className='bg-opacity-0 rounded-full'
                      isIconOnly
                      onClick={async () => {
                        await shareLink(
                          window.location.origin + router.asPath,
                          `${t('join_me_on_my_journey')} ${charData.character_name} - ${worldData.title}`,
                          `${t('join_me_on_my_journey')} ${charData.character_name} - ${worldData.title}`,
                        );
                      }}>
                      <IconShare3
                        stroke={2}
                        className={`w-7 h-7 text-lg`}
                        color='white'
                      />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </NextUIProvider>
  );

  async function continueStory(
    initLLMConvo: { role: string; parts: { text: string }[] }[],
    altCharData?: any,
  ) {
    let _charData = charData;
    if (altCharData) _charData = altCharData;
    setLLMConvo(initLLMConvo); // include the new user choice

    let text: string;
    let outputJSON: any;
    for (let i in [1, 2, 3]) {
      try {
        const response = await fetch(`/api/callLLMGemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contents: initLLMConvo }),
        });

        const result = await response.json();
        text = result.text;
        outputJSON = JSON.parse(text);
        break;
      } catch (error) {
        console.error('Error calling LLMGemini:', error);
      }
    }

    const newLLMConvo = initLLMConvo.concat([
      {
        role: 'model',
        parts: [
          {
            text: text!,
          },
        ],
      },
    ]);
    setLLMConvo(newLLMConvo); // include the model output
    const newStory = outputJSON.story;
    const newStoryline = storyline.concat(newStory);
    if (outputJSON.story_ends) {
      newStoryline.push({ role: 'END', line: outputJSON.endgame_message });
      setRanking(outputJSON.ranking);
    }
    setStoryline(newStoryline);
    const step = currentStep + 1;
    setCurrentStep(step);
    setCurrentLine(newStoryline[step].line);
    setCurrentRole(newStoryline[step].role);
    setOptions(outputJSON.suggested_input);

    // Generate image // don't generate in the first time
    if (doGenerateImage && !altCharData) {
      const imagePrompt = outputJSON.image_prompt;
      setGeneratingImage(true);
      const { generateImageGetUrls } = await loadCanvasUtils();
      const imageUrls = await generateImageGetUrls(
        `<${_charData.character_uniqid}>, ${imagePrompt}`,
        isMobile ? 'portrait' : 'landscape',
        1,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        t,
      );
      if (imageUrls.length > 0) setExportImage(imageUrls[0]);
      setGeneratingImage(false);
    }

    // Deduct credits
    // const { data: creditData, error: error } = await supabase.from('User').select('credit').eq("id", profile.authUserId).single();
    // const profileNew  = await fetch('/api/fetchProfile')
    // setProfile({ ...profile, credit: creditData?.credit });
    setProfileRefreshKey(!profileRefreshKey);

    // if (outputJSON.story_ends) { // Update credit and world num players
    //     const { data: creditData, error: error } = await supabase.from('User').select('credit').eq("id", profile.authUserId).single();
    //     if (error) {
    //         throw error;
    //     }
    //     await supabase.from('User').update({ credit: creditData?.credit + rankingZaps[ranking as Ranking] }).eq("id", profile.authUserId);
    // }
  }
}

export async function getServerSideProps(context: any) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { world_id, character_id } = context.query;

  let initialCharData = {
    age: 'loading...',
    authUserId: 'loading...',
    character_description: 'loading...',
    character_name: 'Character not found',
    character_uniqid: 'loading...',
    created_at: 'loading...',
    file_uniqid: 'loading...',
    gender: 'loading...',
    id: 'loading...',
    character_pfp: '',
    interests: 'loading...',
    intro: 'loading...',
    loras: [],
    personality: 'loading...',
    profession: 'loading...',
    user_image: 'loading...',
    user_name: 'loading...',
  };

  let initialWorldData = {
    id: '',
    title: 'World not found',
    description: '',
    criteria: '',
    story: '',
    rule: '',
    cover: '',
    music: '',
    user_name: '',
  };

  if (character_id && world_id) {
    const { data: char, error: charError } = await supabase
      .from('CustomCharacters')
      .select('*')
      .eq('character_uniqid', character_id)
      .single();

    initialCharData = char || initialCharData;

    const { data: world, error: worldError } = await supabase
      .from('Worlds')
      .select('*, User (user_name)')
      .eq('id', world_id)
      .single();

    if (world) {
      initialWorldData = {
        ...world,
        description: world.description.replace(
          /{character}/g,
          initialCharData.character_name,
        ),
        criteria: world.criteria.replace(
          /{character}/g,
          initialCharData.character_name,
        ),
        story: world.story
          ? world.story.replace(/{character}/g, initialCharData.character_name)
          : '',
        rule: world.rule
          ? world.rule.replace(/{character}/g, initialCharData.character_name)
          : '',
        user_name: world.User?.user_name ?? null,
      };
    }
  }

  const { data: worldData3, error: worldError3 } = await supabase
    .from('Worlds')
    .update({ numPlayers: (initialWorldData as any).numPlayers + 1 })
    .eq('id', initialWorldData.id);
  return {
    props: {
      initialCharData,
      initialWorldData,
    },
  };
}
