/* eslint-disable */
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import toast, { Toaster } from 'react-hot-toast';
import {
  selectedImageAtom,
  characterImagePromptAtom,
  characterGenderAtom,
  authAtom,
} from '../../state';
import {
  Button,
  Input,
  Image,
  Card,
  CardHeader,
  CardBody,
  Radio,
  RadioGroup,
  Switch,
  Tabs,
  Tab,
  Textarea,
  Checkbox,
} from '@nextui-org/react';
import { Analytics } from '@vercel/analytics/react';
import { NextUIProvider } from '@nextui-org/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Header } from '../../Components/Header';
import { Sidebar } from '../../Components/Sidebar';
import mixpanel from 'mixpanel-browser';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import { hasError, toastError, toastWarn } from '@/utils/index';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { useCheckAuth } from '@/hooks/useCheckAuth';
import { PublicVisibilityToggle } from '@/components/PublicVisibilityToggle';

// 动态加载Canvas相关工具函数
const loadCanvasUtils = async () => {
  const { generateText, createCharacter } = await import(
    '../../Components/InfCanva/utils'
  );
  return { generateText, createCharacter };
};

const CharacterPage = () => {
  const { t } = useTranslation('character_edit');
  const router = useRouter();
  const { id } = router.query;
  const [selectedImage, setSelectedImage] = useAtom(selectedImageAtom);
  const [characterImagePrompt, setCharacterImagePrompt] = useAtom(
    characterImagePromptAtom,
  );
  // const [characterGender, setCharacterGender] = useAtom(characterGenderAtom);
  // const isAuth = useAtomValue(authAtom);
  const setIsAuth = useSetAtom(authAtom);

  const [Name, setName] = useState<string>('');
  const [Gender, setGender] = useState<string>('');
  const [Age, setAge] = useState<string>('');
  const [Profession, setProfession] = useState<string>('');
  const [Personality, setPersonality] = useState<string>('');
  const [Interests, setInterests] = useState<string>('');
  const [Intro, setIntro] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [charData, setCharData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { submit: openModal } = useOpenModal();
  const [isPublic, setIsPublic] = useState(true);
  const promptFromCharacter = useRef<string>('');

  const checkAuth = useCheckAuth(() => {
    toast.error(t('authRequired') || 'Login required to edit characters');
    router.push(id ? `/character/${id}` : '/');
  });
  // 检查认证状态
  useEffect(() => {
    // const checkAuth = async () => {
    //   try {
    //     const response = await fetch('/api/is_auth', {
    //       headers: {
    //         'X-Device-Id': await getDeviceId(),
    //       },
    //     });
    //     const data = await response.json();
    //     if (data.is_auth === false) {
    //       setIsAuth(false);
    //       toast.error(t('authRequired') || 'Login required to edit characters');
    //       router.push(id ? `/character/${id}` : '/');
    //       return;
    //     }
    //     setIsAuth(true);
    //   } catch (error) {
    //     console.error('Failed to check authentication:', error);
    //     toast.error(t('authError') || 'Authentication error');
    //     router.push('/');
    //   }
    // };

    checkAuth();
  }, []);

  // Fetch character data if id is provided
  useEffect(() => {
    const fetchCharacter = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/getCharacterProfile?uniqid=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch character');
        }

        const character = await response.json();
        setCharData(character);
        setIsEditing(true);

        // Set form values
        setName(character.character_name || '');
        setAge(character.age || '');
        setProfession(character.profession || '');
        setPersonality(character.personality || '');
        setInterests(character.interests || '');
        setIntro(character.intro || '');
        // setCharacterGender(character.gender || '');
        setGender(character.gender || '');
        setIsPublic(character.is_public ?? true);
        console.log('is_public', character);
      } catch (error) {
        console.error('Error fetching character:', error);
        toast.error(
          t('fetchCharacterError') || 'Error fetching character data',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCharacter();
    }
  }, [id, t]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const { mediaUrl, prompt = '' } = router.query;

    if (mediaUrl) {
      setSelectedImage(mediaUrl as string);
      setCharacterImagePrompt(prompt as string);
      promptFromCharacter.current = prompt as string;
      const timer = setTimeout(() => {
        if (Object.keys(router.query).length > 0) {
          router.replace(router.pathname, undefined, { shallow: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [router?.query, router.isReady]);

  const handleSave = async () => {
    if (Name === '') {
      toast.error(t('name_required_error'));
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && charData) {
        // Update existing character
        const response = await fetch('/api/updateCharacter', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            character_uniqid: id,
            name: Name,
            age: Age,
            profession: Profession,
            personality: Personality,
            interests: Interests,
            intro: Intro,
            gender: Gender || '',
            is_public: isPublic,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update character');
        }

        const updatedCharacter = await response.json();
        if (hasError(updatedCharacter)) {
          if (
            updatedCharacter.error_code ===
            ERROR_CODES.VIP_STYLE_REQUIRES_SUBSCRIPTION
          ) {
            openModal('pricing');
            return;
          }
          throw new Error(updatedCharacter.error || 'Failed to update character');
        }

        try {
          mixpanel.track('update.character', {
            name: Name,
            age: Age,
            profession: Profession,
            personality: Personality,
            interests: Interests,
            intro: Intro,
          });
        } catch (error) { }

        toast.success(
          t('characterUpdated') || 'Character updated successfully',
        );
        router.push(`/character/${id}`);
      } else {
        // Create new character
        try {
          mixpanel.track('create.character', {
            name: Name,
            age: Age,
            profession: Profession,
            personality: Personality,
            interests: Interests,
            intro: Intro,
            prompt: characterImagePrompt,
          });
        } catch (error) { }

        const { createCharacter } = await loadCanvasUtils();
        const uniqid = await createCharacter(
          Name,
          characterImagePrompt,
          Age,
          Profession,
          Personality,
          Interests,
          Intro,
          Gender || t('gender_required'),
          [selectedImage],
          t,
          promptFromCharacter.current,
          isPublic,
        );
        // console.log(uniqid);
        if (typeof uniqid === 'object' && hasError(uniqid)) {
          if (
            uniqid.error_code === ERROR_CODES.CHARACTER_NOT_ENOUGH ||
            uniqid.error_code === ERROR_CODES.VIP_STYLE_REQUIRES_SUBSCRIPTION
          ) {
            // toastWarn(t('toast:character.creation.characterLimitExceeded'));
            openModal('pricing');
            return;
          }
          toastError(t('toast:character.creation.failed'));
          return;
        }

        router.push(`/character/${uniqid}`);
        // window.location.href = `/character/${uniqid}`;
        // Dynamically import canvas-confetti to avoid bundling Canvas in server functions
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 250,
          spread: 160,
        });
      }
    } catch (error) {
      console.error('Error saving character:', error);
      toast.error(t('saveFailed') || 'Failed to save character');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NextUIProvider>
      <Head>
        <title>{isEditing ? t('edit_page_title') : t('page_title')}</title>
      </Head>
      <Analytics />
      <Toaster position='top-right' />
      <main className='flex flex-col h-screen caffelabs text-foreground bg-background'>
        <Header />
        <div className='flex'>
          <Sidebar />
          <div className='p-2 md:px-4 pt-20  md:pt-24 w-full h-full md:pl-56 lg:pl-[240px]'>
            <div
              className='flex flex-col justify-center items-center w-full h-full bg-top bg-cover'
              style={{
                backgroundImage:
                  isEditing && charData
                    ? `url(${charData.character_pfp})`
                    : `url(${selectedImage})`,
              }}>
              <Card className='p-4 bg-card bg-opacity-80 rounded-lg overflow-y-auto w-[94%] max-w-xl'>
                <div className='flex justify-between items-center'>
                  <h1 className='flex-1 mb-2 text-2xl font-bold'>
                    {isEditing
                      ? t('edit_character_settings')
                      : t('add_character_settings')}
                  </h1>
                  {!isEditing && (
                    <Button
                      color='default'
                      size='sm'
                      className='pr-3 pl-3 text-center bg-opacity-80'
                      onClick={async () => {
                        const prompt = `Generate a original character settings for the following character:
Appearance: "${characterImagePrompt}"
Existing settings: {"name": "${Name}", "age": "${Age}", "profession": "${Profession}", "personality": "${Personality}", "interests": "${Interests}", "intro": "${Intro}")}
Output a JSON dict that completes the settings: {
    "name": string,
    "age": string,
    "profession": string, // less than 10 words
    "personality": string, // less than 20 words
    "interests": string, // less than 20 words
    "intro": string, // including brief world settings and backstory, less than 200 words
}
Only output the JSON dict without code block.Keep JSON style with quote surrounding.`;
                        console.log(prompt);
                        const { generateText } = await loadCanvasUtils();
                        let output = await generateText(prompt, undefined, t);
                        output = output
                          .replace('```json', '')
                          .replace('```', '');
                        const settings = JSON.parse(output);
                        Name === '' && setName(settings.name);
                        Age === '' && setAge(settings.age.toString());
                        Profession === '' && setProfession(settings.profession);
                        Personality === '' &&
                          setPersonality(settings.personality);
                        Interests === '' && setInterests(settings.interests);
                        Intro === '' && setIntro(settings.intro);
                      }}>
                      {t('auto_fill')}
                    </Button>
                  )}
                </div>
                <Input
                  value={Name}
                  isRequired
                  onChange={e => setName(e.target.value)}
                  label={t('name')}
                  placeholder={t('name_placeholder')}
                  className='mb-4'
                  variant='underlined'
                />
                <Input
                  value={Gender}
                  onChange={e => setGender(e.target.value)}
                  label={t('gender')}
                  placeholder={t('gender_placeholder')}
                  className='mb-4'
                  variant='underlined'
                />
                {/* <Input label="世界观" placeholder="自由" className="mb-4" variant="underlined" /> */}
                <Input
                  value={Age}
                  onChange={e => setAge(e.target.value)}
                  label={t('age')}
                  placeholder={t('age_placeholder')}
                  className='mb-4'
                  variant='underlined'
                />
                <Input
                  value={Profession}
                  onChange={e => setProfession(e.target.value)}
                  label={t('profession')}
                  placeholder={t('profession_placeholder')}
                  className='mb-4'
                  variant='underlined'
                />
                <Input
                  value={Personality}
                  onChange={e => setPersonality(e.target.value)}
                  label={t('personality')}
                  placeholder={t('personality_placeholder')}
                  className='mb-4'
                  variant='underlined'
                />
                <Input
                  value={Interests}
                  onChange={e => setInterests(e.target.value)}
                  label={t('interests')}
                  placeholder={t('interests_placeholder')}
                  className='mb-4'
                  variant='underlined'
                />
                <Textarea
                  value={Intro}
                  onChange={e => setIntro(e.target.value)}
                  label={t('intro')}
                  placeholder={t('intro_placeholder')}
                  className='mb-4'
                  minRows={5}
                  labelPlacement='outside'
                />
                <PublicVisibilityToggle
                  isPublic={isPublic}
                  onToggle={setIsPublic}
                  useStore={false}
                  showCrown
                  classNames={{
                    label: '!font-normal',
                  }}
                  detectPlan
                />
              </Card>
              <div className='mt-3 mb-20 lg:mb-3 flex justify-between w-[94%] max-w-xl relative z-20'>
                <Button
                  size='lg'
                  color='primary'
                  fullWidth
                  className='w-full transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
                  onClick={handleSave}
                  isLoading={isLoading}>
                  {isEditing
                    ? t('update_character')
                    : t('bring_character_to_life')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </NextUIProvider>
  );
};

export default CharacterPage;
