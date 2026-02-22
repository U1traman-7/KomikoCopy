/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Tabs,
  Tab,
} from '@nextui-org/react';
import {
  uploadImageFromUrl,
  uploadImageFromUrlWithFile,
} from '@/utils/uploadUtils';
import UploadFile from '../UploadFile';
import {
  filterValidImage,
  mergeMediaData,
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
} from './utils';
import { ResultCard } from './ResultCard';
import { ImageData } from './utils';
import FAQ from '@/components/FAQ';
import { BACKGROUND_REMOVAL } from '../../../api/tools/_zaps';
import { BiSolidZap } from 'react-icons/bi';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { toastError, toastWarn } from '@/utils/index';
import { getCreateYoursData } from '../../utilities/tools';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { useRouter } from 'next/router';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';

const getId = genId();

type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any;
};

interface ImagesResponse {
  data: ImageData[];
}

// API call for background removal
const backgroundRemovalAPI = async (
  input_image: string,
  reverse: boolean = false,
  userId?: string,
): Promise<string | { error: string; error_code: number }> => {
  const remove_type = reverse ? 'foreground' : 'background';

  const params = {
    image: input_image,
    reverse: reverse,
    meta_data: {
      remove_type: remove_type,
    },
  };

  if (input_image && !input_image.match(/^https?:\/\//)) {
    params.image = await uploadImageFromUrlWithFile(input_image, userId);
  }
  console.log('params', params);
  const response = await fetch('/api/tools/background-removal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} `);
  }

  const data = await response.json();
  if (data.error) {
    // toast.error(data.error);
    // throw new Error('no zaps');
    return { error: data.error, error_code: data.error_code };
  }
  if (data.output) {
    return data.output;
  }
  return '';
};

// API call for image operations
const imagesAPI = async (params: ImageApiParams): Promise<ImagesResponse> => {
  const response = await fetch('/api/tools/image-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} `);
  }

  return await response.json();
};

const faqs = [
  {
    id: 1,
    question: 'What is AI Background Remover Tool?',
    answer:
      'AI Background Remover is a cutting-edge online tool that uses advanced artificial intelligence to automatically remove backgrounds from anime, manga, and comic images. Our AI-powered Background Remover delivers high-definition quality results with transparent backgrounds in seconds, perfect for creating professional anime artwork, manga edits, and comic illustrations with removed backgrounds.',
  },
  {
    id: 2,
    question: 'How does AI Background Removal work?',
    answer:
      'Our AI Background Removal uses state-of-the-art machine learning models specifically trained on anime and manga artwork to automatically detect and remove image backgrounds. The AI analyzes each pixel to ensure precise edge detection, even with complex anime hairstyles and intricate designs, creating perfect transparent backgrounds. This makes it the ideal choice for professional background removal in anime, manga, and comic art.',
  },
  {
    id: 3,
    question: 'What are the benefits of using AI Background Remover?',
    answer: [
      'HD quality background removal results for anime and manga images in seconds',
      'Advanced AI-powered edge detection optimized for anime character designs',
      'Remove backgrounds from complex anime and manga scenes automatically',
      'Professional background removal tool for manga editing, fanart creation, and anime artwork processing',
      'Easy-to-use online background remover interface designed for anime and comic artists',
      'Preserve intricate details in anime character designs during background removal',
      'Batch processing for efficient manga panel and comic page background removal',
    ],
  },
  {
    id: 4,
    question: 'What image formats does AI Background Removal Tool support?',
    answer:
      'AI Background Remover supports all common image formats used in anime and manga creation, including JPG, PNG, and WEBP. After you remove the background from your anime or manga image, the output is provided as a high-quality PNG file with a transparent background, perfect for digital art and illustration workflows.',
  },
  {
    id: 5,
    question: 'Is AI Background Remover free to use?',
    answer:
      'You can start using our AI Background Removal tool with zaps (credits). For professional anime and manga artists with extensive background removal needs, our paid plans offer additional zaps and faster processing through our AI Background Removal Tool.',
  },
  {
    id: 6,
    question:
      'How accurate is AI in removing backgrounds from anime and manga images?',
    answer:
      'AI is highly accurate in removing backgrounds from anime and manga images. Our AI models are specifically trained on a vast dataset of anime, manga, and comic art styles, enabling them to precisely identify and separate characters from complex backgrounds. This specialized training allows for excellent results even with intricate anime hairstyles, detailed clothing, and dynamic poses typical in anime and manga art.',
  },
  {
    id: 7,
    question: 'Can AI Background Remover handle manga panels and comic pages?',
    answer:
      'Yes, AI Background Remover is designed to handle manga panels and comic pages efficiently. Our tool can process multiple panels simultaneously, making it ideal for manga artists and comic creators who need to remove or modify backgrounds across entire pages or chapters. The AI is trained to recognize panel structures and preserve important elements while removing unwanted backgrounds.',
  },
  {
    id: 8,
    question:
      'How can Background Remover benefit fanart creators and cosplayers?',
    answer:
      'Fanart creators can use Background Remover to easily extract anime characters from original scenes and place them in new environments or create unique compositions. Cosplayers can utilize the tool to remove backgrounds from their cosplay photos, allowing for easy integration into digital backgrounds or creation of promotional materials. The high-quality transparent backgrounds produced by our AI make it simple to blend cosplay photos with anime-style artwork or other digital elements.',
  },
  {
    id: 9,
    question:
      'Is AI Background Remover suitable for professional anime and manga production?',
    answer:
      'Absolutely. AI Background Remover is designed to meet the high standards required in professional anime and manga production. It offers fast processing times, batch capabilities, and high-quality outputs that maintain image integrity. This makes it an invaluable tool for animation studios, manga publishers, and professional artists looking to streamline their workflow and enhance their creative process.',
  },
  {
    id: 10,
    question: 'How does AI handle complex anime and manga art styles?',
    answer:
      'AI is trained on a diverse range of anime and manga art styles, from classic to modern, simple to complex. It can handle various artistic techniques including cel shading, line art, watercolor effects, and detailed backgrounds common in anime and manga. The AI is adept at preserving fine details such as hair strands, clothing textures, and small accessories while accurately removing backgrounds.',
  },
];

export function ToolsBackgroundRemovalPage({ isMobile }: any) {
  const { t } = useTranslation(['background-removal', 'toast']);
  const { t: tc } = useTranslation('common');
  const {
    inputImage: imageInput,
    setInputImage,
    hasMedia,
    mediaItem,
    isFromTool,
  } = useProcessInitialImage();

  // State management
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: '/images/examples/background-removal/background.webp',
      prompt: t('common:exampleResult'),
    },
  ]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<'foreground' | 'background'>(
    'background',
  );

  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const { submit: openModal } = useOpenModal();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(() => {
    return profile.plan === 'Free';
  });
  // const btnText = useBtnText('Remove', 'Remove');

  // Load images from storage
  const fetchImages = async (needMerge?: boolean) => {
    try {
      const response = await imagesAPI({
        method: 'getImages',
        tool: 'background-removal',
      });
      if (response.data) {
        const subs = await filterValidImage(response.data);
        if (!subs.length) {
          return;
        }
        if (!needMerge) {
          setResultImages(subs);
          return;
        }
        setResultImages(resultImages => {
          const oldData = mergeMediaData(
            resultImages.filter(d => d.id !== -1),
            subs,
            'url_path',
          ) as ImageData[];
          return [...oldData];
        });
      }
    } catch (error: any) {
      console.error('fetchImages failed', error);
      if (error.message.indexOf('401')) {
        return;
      }
      toast.error(t('toast:common.fetchFailed'));
    }
  };

  // Initial load
  useEffect(() => {
    isAuth && fetchImages();
  }, [isAuth]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // get remove_type from meta_data
        if (generation.meta_data) {
          const remove_type = generation.meta_data.remove_type;
          setSelectedTab(remove_type as 'foreground' | 'background');
        }

        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);
  // Handle image input change
  const handleChange = async (url: string) => {
    if (url) {
      // createObjectURL 转base64
      const base64 = await fetch(url)
        .then(res => res.arrayBuffer())
        .then(buffer => Buffer.from(buffer).toString('base64'));
      // 添加base64前缀
      const base64Data = `data:image/png;base64,${base64}`;
      setInputImage(base64Data);
    }
  };

  // Handle image delete
  const handleDeleteClick = (imageId: number) => {
    if (typeof imageId === 'number' && imageId < 0) {
      setResultImages(resultImages =>
        resultImages.filter(d => d.id !== imageId),
      );
      return;
    }
    setImageToDelete(imageId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteModalOpen(false);
    if (imageToDelete) {
      try {
        const response = await imagesAPI({
          method: 'deleteImage',
          tool: 'background-removal',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          deleteMediaData(setResultImages, imageToDelete);
          toast.success(t('toast:common.deleteSuccess'));
        } else {
          toast.error(t('toast:common.deleteFailed'));
        }
        setImageToDelete(null);
      } catch (error) {
        console.error('deleteImage failed', error);
        toast.error(t('toast:common.deleteFailed'));
      }
    }
  };

  // Handle image download
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${Date.now()}.png`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toast:common.downloadFailed'));
    }
  };

  // Update result list
  const refreshList = async (id: number, resultUrl: string) => {
    await dispatchGenerated(id);
    setResultImages(resultImages => {
      const index = resultImages.findIndex(d => d.id === id);
      resultImages[index] = {
        id,
        url_path: resultUrl,
      };
      if (index > -1) {
        return [...resultImages];
      }
      return resultImages;
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    if (profile.credit < BACKGROUND_REMOVAL) {
      // toast.error(t('toast:backgroundRemoval.purchaseZaps'));
      openModal('pricing');
      return;
    }

    try {
      let url = imageInput;

      const id = getId();
      setResultImages([
        {
          id,
          url_path: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultImages.filter(d => d.id !== -1),
      ]);

      const imageOutputUrl = await backgroundRemovalAPI(
        url,
        selectedTab === 'foreground',
        profile?.id,
      );
      if (
        !imageOutputUrl ||
        (typeof imageOutputUrl === 'object' && 'error' in imageOutputUrl)
      ) {
        if (typeof imageOutputUrl === 'object' && 'error' in imageOutputUrl) {
          if (imageOutputUrl.error === 'no zaps') {
            // toastError(t('toast:common.noZaps'));
            openModal('pricing');
          }
          if (imageOutputUrl.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
            toastWarn(t('toast:common.rateLimitExceeded'));
          }
        } else {
          toast.error(t('toast:backgroundRemoval.failed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setResultImages(resultImages => {
          const index = resultImages.findIndex(d => d.id === id);
          if (index > -1) {
            resultImages.splice(index, 1);
            return [...resultImages];
          }
          return resultImages;
        });
        return;
      }

      const resultUrl = imageOutputUrl as string;
      setProfile(profile => ({
        ...profile,
        credit: profile.credit - BACKGROUND_REMOVAL,
      }));

      await refreshList(id, resultUrl);

      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'background-removal',
        url_path: resultUrl,
        id: null,
        meta_data: {
          remove_type: selectedTab,
        },
        model: 'Background Removal',
      });

      if (response.data && response.data.length > 0) {
        setResultImages(resultImages => {
          const index = resultImages.findIndex(d => d.id === id);
          if (index > -1) {
            resultImages[index] = {
              id: response.data[0].id,
              url_path: resultUrl,
            };
            return [...resultImages];
          }
          return resultImages;
        });
        toast.success(t('toast:backgroundRemoval.success'));
      } else {
        toast.error(t('toast:backgroundRemoval.failed'));
      }
    } catch (error) {
      console.error('Background removal failed:', error);
      if ((error as any).message === 'no zaps') {
        // toast.error(t('toast:common.noZaps'));
        openModal('pricing');
        return;
      }
      toast.error(t('toast:backgroundRemoval.failed'));
    }
  };

  // Fix the type error in handleTabChange
  const handleTabChange = (key: 'foreground' | 'background') => {
    setSelectedTab(key);
  };

  return (
    <div className='overflow-y-auto items-stretch pb-4 md:pb-16 -mt-4 min-h-screen bg-background'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-1 md:px-6 2xl:px-16'>
        <h1 className='mt-2 mb-3 text-2xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-4xl lg:text-5xl'>
          {t('title')}
        </h1>
        <p className='mx-auto mb-6 max-w-4xl text-center text-muted-foreground text-xs md:text-lg lg:text-xl'>
          {t('description')}
        </p>

        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Input area */}
          <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-5'>
            <Card className='p-4 md:px-6 md:pt-4 md:pb-6 flex flex-col h-full md:transition-all duration-300 shadow-md md:shadow-2xl border-1.5 border-primary-200 bg-card rounded-xl'>
              <div className='flex justify-between items-center mb-3 md:mb-6'>
                <h2 className='text-lg font-bold text-primary-800 dark:text-primary-400 md:text-2xl'>
                  {t('uploadImage')}
                </h2>
              </div>

              {/* {isFromTool && hasMedia && (
                <div className="p-2 mb-4 text-sm text-blue-700 bg-blue-50 rounded-lg">
                  <p>{tc('from_other_tools', {
                    input_type: tc('input_types.image'),
                    tools: tc(`tools.${mediaItem.source}`),
                  })}</p>
                </div>
              )} */}

              <div className='flex flex-col flex-1'>
                <div className='flex-1 min-h-[300px] max-h-[400px] mb-4'>
                  <UploadFile
                    onChange={handleChange}
                    type='image'
                    initialImage={imageInput}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>

                <div className='flex mb-4 md:mb-6'>
                  <div className='inline-flex relative p-1 bg-muted rounded-lg'>
                    <div
                      className='absolute rounded-md transition-transform duration-200 ease-in-out bg-primary'
                      style={{
                        width: '50%',
                        height: 'calc(100% - 8px)',
                        transform: `translateX(${selectedTab === 'background' ? '100%' : '0'})`,
                        top: '4px',
                        left: '4px',
                      }}
                    />
                    <button
                      onClick={() => handleTabChange('foreground')}
                      className={`relative px-3 py-2 rounded-md transition-colors duration-200 text-sm md:px-4 md:text-base ${
                        selectedTab === 'foreground'
                          ? 'text-white'
                          : 'text-muted-foreground'
                      }`}>
                      {t('removeForeground')}
                    </button>
                    <button
                      onClick={() => handleTabChange('background')}
                      className={`relative px-3 py-2 rounded-md transition-colors duration-200 text-sm md:px-4 md:text-base ${
                        selectedTab === 'background'
                          ? 'text-white'
                          : 'text-muted-foreground'
                      }`}>
                      {t('removeBackground')}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                color='primary'
                className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-md hover:shadow-lg'
                size='lg'
                onClick={handleSubmit}
                isDisabled={!imageInput}>
                {selectedTab === 'foreground'
                  ? t('removeForeground')
                  : t('removeBackground')}
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color='primary'
                    size='sm'
                    className='bg-white'>
                    -{BACKGROUND_REMOVAL}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Output area */}
          <div className='flex flex-col col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='p-4 md:pb-6 md:px-6 md:pt-4 flex flex-col h-full shadow-md shadow-gray-200 md:shadow-2xl border-1.5 border-primary-50 bg-card rounded-xl max-h-[750px]'>
              <h2 className='mb-4 md:mb-6 text-lg font-bold text-primary-800 dark:text-primary-400 md:text-2xl'>
                {t('processedImages')}
              </h2>
              <div className='flex overflow-hidden flex-col flex-1 w-full'>
                <div className='overflow-y-auto flex-1 rounded-lg'>
                  {resultImages?.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6'>
                      {resultImages.map((image, index) => (
                        <ResultCard
                          key={image.id}
                          type='image'
                          index={index}
                          data={image}
                          handleDelete={handleDeleteClick}
                          handleDownload={handleDownload}
                          showPrompt={!!image.prompt}
                          isExample={image.id === -1}
                          tool='background-removal'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-64 text-muted-foreground'>
                      <p className='text-center text-sm md:text-base'>
                        {t('processedImagesEmpty')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Add SEO Section */}
        <div className='flex flex-col justify-center items-center mb-8'>
          <div className='col-span-12'>
            <h2 className='pt-10 md:pt-16 mt-12 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mt-16 md:text-3xl'>
              {t('whatIsTitle')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('whatIsDescription')}
            </p>

            <h2 className='pt-10 md:pt-16 mt-12 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
              {t('howToTitle')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('howToDescription')}
            </p>

            <div className='grid grid-cols-1 gap-4 mb-6 md:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
              {[
                {
                  step: 1,
                  title: t('steps.step1.title'),
                  content: t('steps.step1.content'),
                },
                {
                  step: 2,
                  title: t('steps.step2.title'),
                  content: t('steps.step2.content'),
                },
                {
                  step: 3,
                  title: t('steps.step3.title'),
                  content: t('steps.step3.content'),
                },
                {
                  step: 4,
                  title: t('steps.step4.title'),
                  content: t('steps.step4.content'),
                },
              ].map(step => (
                <div
                  key={step.title}
                  className='flex flex-col p-6 h-full bg-card rounded-xl border border-primary-100 border-border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-12 md:h-12 text-xl font-bold text-white bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                    {step.step}
                  </div>
                  <div className='flex-grow'>
                    <h3 className='mb-3 text-lg font-bold text-primary-800 dark:text-primary-400 md:text-xl'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className='pt-12 text-center md:pt-16'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mb-6 md:text-3xl'>
                {t('examplesTitle')}
              </h2>
              <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('examplesDescription')}
              </p>
            </div>

            <div className='grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3'>
              {/* Example 1 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='p-6 pb-2'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                    <img
                      src='/images/examples/background-removal/input.webp'
                      alt='Original Anime Image'
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('exampleInput')}
                  </p>
                </div>
                <div className='p-4 bg-primary-50 dark:bg-primary-900/20'>
                  <p className='font-medium text-primary-800 dark:text-primary-400'>
                    Original anime image with background
                  </p>
                </div>
              </div>

              {/* Example 2 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='p-6 pb-2'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                    <img
                      src='/images/examples/background-removal/foreground.webp'
                      alt='Anime Background Only'
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('exampleOutputBackground')}
                  </p>
                </div>
                <div className='p-4 bg-primary-50 dark:bg-primary-900/20'>
                  <p className='font-medium text-primary-800 dark:text-primary-400'>
                    Background isolated from character
                  </p>
                </div>
              </div>

              {/* Example 3 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='p-6 pb-2'>
                  <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                    <img
                      src='/images/examples/background-removal/background.webp'
                      alt='Extracted Anime Character'
                      className='object-cover w-full h-full'
                    />
                  </div>
                  <p className='text-xs text-center text-muted-foreground md:text-sm'>
                    {t('exampleOutputCharacter')}
                  </p>
                </div>
                <div className='p-4 bg-primary-50 dark:bg-primary-900/20'>
                  <p className='font-medium text-primary-800 dark:text-primary-400'>
                    Character with transparent background
                  </p>
                </div>
              </div>
            </div>

            {/* Why use section */}
            <div className='py-10 md:py-16 mt-10 bg-gradient-to-b from-background dark:from-gray-900 rounded-xl to-primary-100 dark:to-gray-800'>
              <h2 className='mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:text-3xl'>
                {t('whyChooseTitle')}
              </h2>
              <p className='mx-auto mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
                {t('whyChooseDescription')}
              </p>
              <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                {[
                  {
                    title: t('features.feature1.title'),
                    content: t('features.feature1.content'),
                    icon: '🎨',
                  },
                  {
                    title: t('features.feature2.title'),
                    content: t('features.feature2.content'),
                    icon: '⚡',
                  },
                  {
                    title: t('features.feature3.title'),
                    content: t('features.feature3.content'),
                    icon: '🎯',
                  },
                  {
                    title: t('features.feature4.title'),
                    content: t('features.feature4.content'),
                    icon: '📱',
                  },
                  {
                    title: t('features.feature5.title'),
                    content: t('features.feature5.content'),
                    icon: '💎',
                  },
                  {
                    title: t('features.feature6.title'),
                    content: t('features.feature6.content'),
                    icon: '🚀',
                  },
                ].map(feature => (
                  <div
                    key={feature.title}
                    className='p-6 bg-card rounded-xl border border-primary-100 border-border shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <div className='flex items-center mb-4'>
                      <span className='mr-3 text-xl md:text-2xl'>
                        {feature.icon}
                      </span>
                      <h3 className='text-lg font-semibold text-primary-800 dark:text-primary-400 md:text-xl'>
                        {feature.title}
                      </h3>
                    </div>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {feature.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className='my-12 md:my-24'>
              <MoreAITools category='illustration' />
            </div>

            <h2 className='mt-12 mb-4 text-xl font-bold text-center text-primary-900 dark:text-primary-400 md:mt-16 md:text-3xl'>
              {t('faqTitle')}
            </h2>
            <p className='mx-auto mb-6 max-w-3xl text-center text-muted-foreground text-sm md:text-base'>
              {t('faqDescription')}
            </p>

            <div className='flex justify-center items-center'>
              <div className='w-full md:w-[1000px]'>
                <FAQ
                  faqs={[
                    {
                      id: 1,
                      question: t('faqs.question1'),
                      answer: t('faqs.answer1'),
                    },
                    {
                      id: 2,
                      question: t('faqs.question2'),
                      answer: t('faqs.answer2'),
                    },
                    {
                      id: 3,
                      question: t('faqs.question3'),
                      answer: t('faqs.answer3'),
                    },
                    {
                      id: 4,
                      question: t('faqs.question4'),
                      answer: t('faqs.answer4'),
                    },
                    {
                      id: 5,
                      question: t('faqs.question5'),
                      answer: t('faqs.answer5'),
                    },
                    {
                      id: 6,
                      question: t('faqs.question6'),
                      answer: t('faqs.answer6'),
                    },
                    {
                      id: 7,
                      question: t('faqs.question7'),
                      answer: t('faqs.answer7'),
                    },
                    {
                      id: 8,
                      question: t('faqs.question8'),
                      answer: t('faqs.answer8'),
                    },
                    {
                      id: 9,
                      question: t('faqs.question9'),
                      answer: t('faqs.answer9'),
                    },
                    {
                      id: 10,
                      question: t('faqs.question10'),
                      answer: t('faqs.answer10'),
                    },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        classNames={{
          backdrop: 'bg-black/50 backdrop-blur-sm',
          base: 'border border-primary-200',
        }}>
        <ModalContent>
          <ModalHeader className='text-primary-800 dark:text-primary-400'>
            {t('deleteModal.title')}
          </ModalHeader>
          <ModalBody>
            <p>{t('deleteModal.message')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              {t('deleteModal.cancel')}
            </Button>
            <Button color='danger' onPress={handleConfirmDelete}>
              {t('deleteModal.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
