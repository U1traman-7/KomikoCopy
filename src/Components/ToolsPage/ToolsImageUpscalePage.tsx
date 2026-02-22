/* eslint-disable */
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Slider,
  Image as NextImage,
} from '@nextui-org/react';
import UploadFile from '../UploadFile';
import {
  deleteMediaData,
  dispatchGenerated,
  GenerationStatus,
  genId,
  filterValidImage,
} from './utils';
import { ResultCard } from './ResultCard';
import { ImageData } from './utils';
import FAQ from '@/components/FAQ';
import { IMAGE_UPSCALE } from '../../../api/tools/_zaps';
import { BiSolidZap } from 'react-icons/bi';
import { authAtom, profileAtom } from 'state';
import { useAtom, useAtomValue } from 'jotai';
import { useBtnText } from 'hooks/useBtnText';
import { useTranslation } from 'react-i18next';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { toastError, toastWarn } from '@/utils/index';
import { useProcessInitialImage } from 'hooks/useProcessInitialImage';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { getCreateYoursData } from '../../utilities/tools';
import { useRouter } from 'next/router';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';
import { uploadImage } from '@/api/upload';
import { uploadImageFromUrlWithFile } from '@/utils/uploadUtils';

const getId = genId();

type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any; // 允许其他可选参数
};
interface ImagesResponse {
  data: ImageData[];
}
// 调用视频生成API
const imagesAPI = async (params: ImageApiParams): Promise<ImagesResponse> => {
  const response = await fetch('/api/tools/image-generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// 1. 调用 image Upscale API
const imageUpscaleAPI = async (
  input_image: string,
  times: number = 4,
  model: string = 'gfpgan',
  userId?: string,
): Promise<string | { error: string; error_code?: number }> => {
  const params: { [key: string]: any } = {
    image: input_image,
    scale: times,
    model,
  };

  if (params.image && !params.image.match(/^https?:\/\//)) {
    const imageUrl = await uploadImageFromUrlWithFile(params.image, userId);
    params.image = imageUrl;
  }

  const response = await fetch('/api/tools/image-upscale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
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

// 获取图片尺寸
const getImageDimensions = (
  base64String: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = base64String;
  });
};

export default function ToolsPage({ isMobile }: any) {
  const { t } = useTranslation('image-upscaling');

  const {
    inputImage: imageInput,
    setInputImage,
    hasMedia,
    mediaItem,
    isFromTool,
  } = useProcessInitialImage();

  const [scaleFactor, setScaleFactor] = useState(4);

  // video results list
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: '/images/examples/image-upscaling/input.jpg',
      prompt: t('common:exampleResult'),
    },
  ]);
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);

  const btnText = useBtnText('Upscale Image', 'Upscale Image');
  const { submit: openModal } = useOpenModal();
  const [isPublic, setIsPublic] = useState(() => {
    return profile.plan === 'Free';
  });

  // 从 Supabase 加载 视频
  const fetchImages = async () => {
    try {
      const response = await imagesAPI({
        method: 'getImages',
        tool: 'image-upscale',
      });
      if (response.data) {
        const subs = await filterValidImage(response.data);
        if (!subs.length) {
          return;
        }
        setResultImages(subs);
      }
    } catch (error: any) {
      console.error('fetchImages failed', error);
      if (error.message.indexOf('401')) {
        return;
      }
      toast.error(t('toasts.upscaleFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };
  /* ******************************  初始更新状态    *****************************  */
  // 初始加载数据
  useEffect(() => {
    isAuth && fetchImages();
  }, [isAuth]);

  /* ******************************  点击删除视频相关    *****************************  */
  // 点击删除按钮时保存视频 ID
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

  // 确认删除时使用保存的 ID
  const handleConfirmDelete = async () => {
    setDeleteModalOpen(false);
    if (imageToDelete) {
      try {
        const response = await imagesAPI({
          method: 'deleteImage',
          tool: 'image-upscale',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteImage success');
          deleteMediaData(setResultImages, imageToDelete); // 使用deleteMediaData
          toast.success(t('toasts.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteImage failed');
          toast.error(t('toasts.deleteFailed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setImageToDelete(null); // 清除保存的 ID
      } catch (error) {
        console.error('deleteImage failed', error);
        toast.error(t('toasts.deleteFailed'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    }
  };

  /* ******************************  下载短视频   *****************************  */
  // 下载短视频按键
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${Date.now()}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // 释放 URL 对象
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toasts.downloadFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  // 将blob 转换为 base64
  const blobToDataURL = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleChange = async (url: string) => {
    if (url) {
      // 将createObjectURL 转换为 base64
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await blobToDataURL(blob);
      setInputImage(base64);
    }
  };

  // 添加refreshList函数
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
    if (profile.credit < IMAGE_UPSCALE) {
      // toast.error(t('toasts.purchaseMoreZaps'), {
      //     position: "top-center",
      //     style: {
      //         background: '#555',
      //         color: '#fff',
      //     }
      // });
      openModal('pricing');
      return;
    }
    let model = 'real-esrgan';

    const imageDimensions = await getImageDimensions(imageInput);
    console.log('Image dimensions:', imageDimensions);
    if (imageDimensions.width * imageDimensions.height > 2096704) {
      // toastError(t('toasts.imageTooLarge'));
      // return;
      model = 'gfpgan';
    }

    try {
      let url = imageInput;

      // 添加生成中状态
      const id = getId();
      setResultImages([
        {
          id,
          url_path: '',
          status: GenerationStatus.GENERATING,
        },
        ...resultImages.filter(d => d.id !== -1),
      ]);

      // 调用 API 处理视频
      const imageOutputUrl = await imageUpscaleAPI(
        url,
        scaleFactor,
        model,
        profile?.id,
      );

      if (
        !imageOutputUrl ||
        (typeof imageOutputUrl === 'object' && imageOutputUrl.error)
      ) {
        if (!imageOutputUrl) {
          toastError(t('toasts.upscaleFailed'));
        } else if (
          typeof imageOutputUrl === 'object' &&
          imageOutputUrl.error === 'no zaps'
        ) {
          // toastError(t('toast:common.noZaps'))
          openModal('pricing');
        } else if (
          typeof imageOutputUrl === 'object' &&
          imageOutputUrl.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED
        ) {
          toastWarn(t('toast:common.rateLimitExceeded'));
        } else {
          toastError(t('toasts.upscaleFailed'));
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
      setProfile(profile => {
        return {
          ...profile,
          credit: profile.credit - IMAGE_UPSCALE,
        };
      });
      await refreshList(id, imageOutputUrl as string);

      // 上传视频数据到 DB
      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'image-upscale',
        url_path: imageOutputUrl,
        id: null,
        model: 'Image Upscaling',
      });
      if (response.data && response.data.length > 0) {
        setResultImages(resultImages => {
          const index = resultImages.findIndex(d => d.id === id);
          if (index > -1) {
            resultImages[index] = {
              ...resultImages[index],
              id: response.data[0].id,
            };
          }
          return [...resultImages];
        });
        toast.success(t('toasts.upscaleSuccess'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.error(t('toasts.upscaleFailed'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Image upscale failed:', error);
      if ((error as any).message === 'no zaps') {
        // toast.error(t('toasts.noZaps'), {
        //     position: "top-center",
        //     style: {
        //         background: '#555',
        //         color: '#fff',
        //     }
        // });
        openModal('pricing');
        return;
      }
      toast.error(t('toasts.upscaleFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  // Replace faqs with translated version
  const faqs = [
    {
      id: 1,
      question: t('faq.question1'),
      answer: t('faq.answer1'),
    },
    {
      id: 2,
      question: t('faq.question2'),
      answer: t('faq.answer2'),
    },
    {
      id: 3,
      question: t('faq.question3'),
      answer: [
        t('faq.answer3.point1'),
        t('faq.answer3.point2'),
        t('faq.answer3.point3'),
        t('faq.answer3.point4'),
        t('faq.answer3.point5'),
      ],
    },
    {
      id: 4,
      question: t('faq.question4'),
      answer: t('faq.answer4'),
    },
    {
      id: 5,
      question: t('faq.question5'),
      answer: t('faq.answer5'),
    },
    {
      id: 6,
      question: t('faq.question6'),
      answer: t('faq.answer6'),
    },
    {
      id: 7,
      question: t('faq.question7'),
      answer: t('faq.answer7'),
    },
    {
      id: 8,
      question: t('faq.question8'),
      answer: t('faq.answer8'),
    },
    {
      id: 9,
      question: t('faq.question9'),
      answer: t('faq.answer9'),
    },
    {
      id: 10,
      question: t('faq.question10'),
      answer: t('faq.answer10'),
    },
  ];

  return (
    // Add min-h-screen to ensure minimum screen height, overflow-y-auto to allow vertical scrolling
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen bg-background'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        <h1 className='mt-2 mb-3 text-2xl font-bold text-center text-heading md:text-3xl lg:text-4xl'>
          {t('title')}
        </h1>
        <p className='mx-auto mb-4 md:mb-6 max-w-4xl text-xs text-center text-muted-foreground md:text-xs lg:text-base px-4 md:px-20'>
          {t('description')}
        </p>
        <div className='grid grid-cols-12 gap-4 mt-4'>
          {/* Left input area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-5'>
            <Card className='bg-card p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>{t('inputImage')}</h2>
              </div>

              {/* {isFromTool && hasMedia && (
                                <div className="p-2 mb-4 text-sm text-blue-700 bg-blue-50 rounded-lg">
                                    <p>{t('common:from_other_tools', {
                                        input_type: t('common:input_types.image'),
                                        tools: t(`common:tools.${mediaItem.source}`),
                                    })}</p>
                                </div>
                            )} */}

              <div className='mb-6'>
                <UploadFile
                  onChange={handleChange}
                  type='image'
                  initialImage={imageInput}
                />
              </div>

              {/* Add the scale factor slider */}
              <div className='mb-6'>
                <label className='block mb-2 text-sm font-medium'>
                  {t('scaleFactor')}: {scaleFactor}x
                </label>
                <Slider
                  size='sm'
                  step={1}
                  minValue={1}
                  maxValue={10}
                  value={scaleFactor}
                  onChange={value => setScaleFactor(Number(value))}
                  className='max-w-md'
                  aria-label={t('scaleFactor')}
                  marks={[
                    {
                      value: 1,
                      label: '1x',
                    },
                    {
                      value: 10,
                      label: '10x',
                    },
                  ]}
                />
              </div>

              <Button
                color='primary'
                className='w-full mt-2'
                size='lg'
                onClick={handleSubmit}
                isDisabled={!imageInput}>
                {t('upscaleImage')}
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-card'>
                    -{IMAGE_UPSCALE}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area */}
          <div className='col-span-12 md:col-span-6 lg:col-span-7'>
            <Card className='bg-card p-6 h-full'>
              <h2 className='mb-6 text-2xl font-bold'>{t('imageResults')}</h2>
              <div className='w-full h-[calc(460px-7rem)] flex flex-col'>
                <div className='overflow-y-auto flex-1'>
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
                          tool='image-upscale'></ResultCard>
                      ))}
                    </div>
                  ) : (
                    <div className='flex justify-center items-center h-full text-muted-foreground'>
                      {t('resultsPlaceholder')}
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
            <h2 className='mt-14 md:mt-16 mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('whatIsSection.title')}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base px-4 md:px-20 mb-4 md:mb-6'>
              <p>{t('whatIsSection.description')}</p>
            </div>

            <h2 className='mt-14 md:mt-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('howToSection.title')}
            </h2>
            <p className='mx-auto mb-4 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base px-4 md:px-20'>
              {t('howToSection.description')}
            </p>

            <div className='grid grid-cols-1 gap-8 md:px-4 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
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
              ].map((step: any) => (
                <div
                  key={step.title}
                  className='flex flex-col p-4 md:p-6 h-full bg-card rounded-xl border border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:translate-y-[-5px]'>
                  <div className='flex justify-center items-center mb-4 w-8 h-8 md:w-14 md:h-14 text-xl font-bold text-primary-foreground bg-gradient-to-r to-purple-600 rounded-full from-primary-600 md:text-2xl'>
                    {step.step}
                  </div>
                  <div className='flex-grow'>
                    <h3 className='mb-3 text-lg font-bold text-primary-600 md:text-xl'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {step.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className='grid grid-cols-12 gap-4 mt-8 mb-8'>
              <div className='col-span-12'>
                <h2 className='mt-14 md:mt-16 mb-4 md:mb-6 text-xl font-bold text-center text-heading md:text-3xl'>
                  {t('examples.title')}
                </h2>
                <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base px-4 md:px-20 mb-4 md:mb-6'>
                  <p>{t('examples.description')}</p>
                </div>
                <div className='grid grid-cols-12 gap-4'>
                  {/* Example input video */}
                  <div className='flex flex-col col-span-5 items-center'>
                    <div className='flex overflow-hidden justify-center items-center mt-8 mb-2 w-full'>
                      <NextImage
                        src='/images/examples/image-upscaling/input.jpg'
                        alt={t('examples.inputAlt1')}
                        width={300}
                        height={300}
                        className='object-cover object-top w-full h-full !rounded-none'
                      />
                    </div>
                    <p className='text-xs md:text-sm text-center text-muted-foreground'>
                      {t('examples.inputCaption1')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col col-span-7 items-center'>
                    <div className='flex overflow-hidden justify-center items-center mb-2 w-full'>
                      <NextImage
                        src='/images/examples/image-upscaling/upscaled.png'
                        alt={t('examples.outputAlt1')}
                        width={400}
                        height={400}
                        className='object-cover object-top w-full h-full !rounded-none'
                      />
                    </div>
                    <p className='text-xs md:text-sm text-center text-muted-foreground'>
                      {t('examples.outputCaption1')}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-12 gap-4 mt-8'>
                  {/* Example input video */}
                  <div className='flex flex-col col-span-5 items-center'>
                    <div className='flex overflow-hidden justify-center items-center mt-8 mb-2 w-full'>
                      <NextImage
                        src='/images/examples/image-upscaling/input2.jpg'
                        alt={t('examples.inputAlt2')}
                        width={300}
                        height={300}
                        className='object-cover object-top w-full h-full !rounded-none'
                      />
                    </div>
                    <p className='text-xs md:text-sm text-center text-muted-foreground'>
                      {t('examples.inputCaption2')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col col-span-7 items-center'>
                    <div className='flex overflow-hidden justify-center items-center mb-2 w-full'>
                      <NextImage
                        src='/images/examples/image-upscaling/upscaled2.png'
                        alt={t('examples.outputAlt2')}
                        width={400}
                        height={400}
                        className='object-cover object-top w-full h-full !rounded-none'
                      />
                    </div>
                    <p className='text-xs md:text-sm text-center text-muted-foreground'>
                      {t('examples.outputCaption2')}
                    </p>
                  </div>
                </div>
                <div className='grid grid-cols-12 gap-4 mt-8'>
                  {/* Example input video */}
                  <div className='flex flex-col col-span-5 items-center'>
                    <div className='flex overflow-hidden justify-center items-center mt-8 mb-2 w-full'>
                      <NextImage
                        src='/images/examples/image-upscaling/input3.jpg'
                        alt={t('examples.inputAlt3')}
                        width={300}
                        height={300}
                        className='object-cover object-top w-full h-full !rounded-none'
                      />
                    </div>
                    <p className='text-xs md:text-sm text-center text-muted-foreground'>
                      {t('examples.inputCaption3')}
                    </p>
                  </div>

                  {/* Example output image */}
                  <div className='flex flex-col col-span-7 items-center'>
                    <div className='flex overflow-hidden justify-center items-center mb-2 w-full'>
                      <NextImage
                        src='/images/examples/image-upscaling/upscaled3.png'
                        alt={t('examples.outputAlt3')}
                        width={400}
                        height={400}
                        className='object-cover object-top w-full h-full !rounded-none'
                      />
                    </div>
                    <p className='text-xs md:text-sm text-center text-muted-foreground'>
                      {t('examples.outputCaption3')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className='mt-14 md:mt-16 mb-4 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('whyChoose.title')}
            </h2>
            <p className='mx-auto mb-4 md:mb-10 max-w-3xl text-center text-muted-foreground text-sm md:text-base px-4 md:px-20'>
              {t('whyChoose.description')}
            </p>
            <div className='py-14 md:py-16 bg-gradient-to-b from-background rounded-xl to-primary-100'>
              <div className='grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3'>
                {[
                  {
                    title: t('features.feature1.title'),
                    content: t('features.feature1.content'),
                  },
                  {
                    title: t('features.feature2.title'),
                    content: t('features.feature2.content'),
                  },
                  {
                    title: t('features.feature3.title'),
                    content: t('features.feature3.content'),
                  },
                  {
                    title: t('features.feature4.title'),
                    content: t('features.feature4.content'),
                  },
                  {
                    title: t('features.feature5.title'),
                    content: t('features.feature5.content'),
                  },
                  {
                    title: t('features.feature6.title'),
                    content: t('features.feature6.content'),
                  },
                ].map(feature => (
                  <div
                    key={feature.title}
                    className='p-4 md:p-6 bg-card rounded-xl border border-primary-100 shadow-md transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] hover:border-primary-300'>
                    <h3 className='mb-2 text-md md:text-xl font-semibold text-primary-600'>
                      {feature.title}
                    </h3>
                    <p className='text-muted-foreground text-sm md:text-base'>
                      {feature.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className='my-12 md:my-16'>
              <MoreAITools category='illustration' />
            </div>
            <h2 className='mt-14 md:mt-16 mb-2 text-xl font-bold text-center text-heading md:text-3xl'>
              {t('guide.title')}
            </h2>
            <div className='mx-auto max-w-4xl text-center text-muted-foreground text-sm md:text-base px-4 md:px-20 mb-4 md:mb-6'>
              <p>{t('guide.description')}</p>
            </div>

            <div className='flex justify-center'>
              <div className='max-w-[1000px] w-full'>
                <FAQ faqs={faqs} />
              </div>
            </div>
          </div>
        </div>

        {/* 确认对话框 */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}>
          <ModalContent>
            <ModalHeader>{t('deleteModal.title')}</ModalHeader>
            <ModalBody>{t('deleteModal.message')}</ModalBody>
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
    </div>
  );
}
