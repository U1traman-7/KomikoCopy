/* eslint-disable */
import React, { memo, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaDownload } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import UploadFile from '../UploadFile';
import {
  filterValidImage,
  genId,
  ImageData,
  GenerationStatus,
  deleteMediaData,
  mergeMediaData,
  dispatchGenerated,
  preloadImage,
} from './utils';
import { ResultCard } from './ResultCard';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import { MoreAITools } from '@/Components/SEO/MoreAITools';
import { getCreateYoursData } from '../../utilities/tools';

import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  CardBody,
  Link,
  Image as NextUIImage,
  AccordionItem,
  Accordion,
  Chip,
  Switch,
  Select,
  SelectItem,
  Tooltip,
} from '@nextui-org/react';
import FAQ from '@/Components/SEO/FAQ';
import Hero from '@/Components/SEO/Hero';
import WhatIs from '@/Components/SEO/WhatIs';
import HowToUse from '@/Components/SEO/HowToUse';
import Benefits from '@/Components/SEO/Benefits';
import { BiSolidZap } from 'react-icons/bi';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import {
  calculateLineArtColorizeCost,
  ToolsModel,
  ToolsModelType,
} from '../../../api/tools/_zaps';
import { proxyImageUrl, toastWarn } from '@/utils/index';
import { useBtnText } from 'hooks/useBtnText';
import { BsInfoCircleFill } from 'react-icons/bs';
import { MdOutlineAnimation } from 'react-icons/md';
import { useTranslation } from 'react-i18next';
import { aiTools, ToolItem } from '../../constants';

import { ToolCard } from 'pages';
import { useRouter } from 'next/router';
import { ERROR_CODES } from '../../../api/_constants';
import { useOpenModal } from 'hooks/useOpenModal';
import { PublicVisibilityToggle } from '../PublicVisibilityToggle/PublicVisibilityToggle';

type ImageApiParams = {
  method: 'getImages' | 'generateImage' | 'deleteImage';
  tool: string;
  [key: string]: any; // 允许其他可选参数
};
interface ImagesResponse {
  data: ImageData[];
}

const getId = genId();
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

// 1. 检查并调整图片尺寸 1024*1024 和 格式
const processImage = async (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxSize = 1024;
      let width = img.width;
      let height = img.height;

      // 计算缩放比例
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // 创建 canvas 进行缩放
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      // 转换为 base64
      resolve(canvas.toDataURL('image/jpeg', 1));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// 3. 调用 inbetween API
const lineArtColorizeAPI = async (
  image: string,
  prompt: string,
  referenceImage?: string,
  white_bg = false,
  model: ToolsModelType = ToolsModel.BASIC,
): Promise<{ output: string; error?: string; error_code?: number }> => {
  // const params: { [key: string]: any } = {
  //     det: "Lineart_Anime",
  //     eta: 1,
  //     seed: 4,
  //     scale: 9,
  //     prompt: prompt || "",
  //     a_prompt: "masterpiece, best quality, ultra-detailed, illustration, disheveled hair",
  //     n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, pubic hair,extra digit, fewer digits, cropped, worst quality, low quality",
  //     strength: 1,
  //     ddim_steps: 25,
  //     input_image: image,
  //     image_resolution: 1024,
  //     detect_resolution: 1024
  // }

  const params: { [key: string]: any } = {
    user_prompt: prompt || '',
    sketch_b64: image,
    negative_prompt: '',
    // ipadapter_b64: referenceImage,
    white_bg,
    model,
  };

  if (referenceImage) {
    params.ipadapter_b64 = referenceImage;
  }

  const response = await fetch('/api/tools/line-art-colorize-new', {
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
  // if(data.error &&data.error === 'no zaps') {
  //   toast.error(data.error);
  //   throw new Error('no zaps');
  // }else if(data.error){
  //   throw new Error(data.error);
  // }
  if (data) {
    return data;
  } else {
    throw new Error('No output from lineArtColorize API');
  }
};


const urlToBase64 = async (url: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(url);
    const blob = await response.blob();

    // Create a FileReader to convert blob to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        // const base64 = base64String.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

export default function LineArtColorizePage({ isMobile }: any) {
  const { t } = useTranslation(['line-art-colorization', 'toast']);
  const router = useRouter();
  // State management
  const [prompt, setPrompt] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ToolsModelType>(
    ToolsModel.BASIC,
  );

  const [loading, setLoading] = useState(false);

  const [inputImage, setInputImage] = useState<string>('');
  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const [isPublic, setIsPublic] = useState(() => profile?.plan === 'Free');

  // video results list
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: '/images/examples/line-art-colorize/output_girl.webp',
      prompt: t('common:exampleResult'),
    },
  ]);
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  // Add new state for reference image
  const [referenceImage, setReferenceImage] = useState<string>('');

  const [whiteBg, setWhiteBg] = useState(false);
  const [cost, setCost] = useState(
    calculateLineArtColorizeCost(whiteBg, selectedModel),
  );
  const { submit: openModal } = useOpenModal();

  // 从 Supabase 加载 视频
  const fetchImages = async (needMerge?: boolean) => {
    try {
      const response = await imagesAPI({
        method: 'getImages',
        tool: 'colorize-line-art',
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
            resultImages,
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
      toast.error(t('toast:lineArtColorize.fetchFailed'), {
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

  useEffect(() => {
    setCost(calculateLineArtColorizeCost(whiteBg, selectedModel));
  }, [whiteBg, selectedModel]);

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // get model
        const model = generation.model;
        if (model === 'Advanced') {
          setSelectedModel(ToolsModel.ADVANCED);
        } else {
          setSelectedModel(ToolsModel.BASIC);
        }

        // clear query
        router.replace({
          pathname: router.pathname,
          query: {},
        });
      }
    }
  }, [router.isReady, router.query.generationId]);
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
          tool: 'colorize-line-art',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteImage success');
          deleteMediaData(setResultImages, imageToDelete);
          toast.success(t('toast:lineArtColorize.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteImage failed');
          toast.error(t('toast:lineArtColorize.deleteFailed'), {
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
        toast.error(t('toast:lineArtColorize.deleteFailed'), {
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
  // 下载图片按键
  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `image-${Date.now()}.jpg`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // 释放 URL 对象
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('toast:lineArtColorize.downloadFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };

  /* ******************************   图片上传生成视频相关    *****************************  */

  const handleChange = async (url: string) => {
    const base64 = await urlToBase64(url);
    setInputImage(base64);
  };

  // Add reference image change handler
  const handleReferenceChange = async (url: string) => {
    if (!url) {
      setReferenceImage('');
      return;
    }
    const base64 = await urlToBase64(url);
    setReferenceImage(base64);
  };

  // const initTaskPipe = async () => {
  //   console.log('initTaskPipe');
  //   // 如果已经有活跃连接，直接返回
  //   if (taskPipeRef.current && taskPipeRef.current.readyState === EventSource.OPEN) {
  //     return;
  //   }

  //   // 如果有旧连接，先关闭
  //   if (taskPipeRef.current) {
  //     taskPipeRef.current.close();
  //     taskPipeRef.current = null;
  //   }

  //   const taskPipe = createTaskPipe();

  //   taskPipe.addEventListener('message', updateImages);

  //   // 添加错误处理
  //   taskPipe.addEventListener('error', (error) => {
  //     console.error('TaskPipe error:', error);
  //     // 可以在这里添加重连逻辑或错误提示
  //     taskPipe.close();
  //   });

  //   taskPipeRef.current = taskPipe;
  // };

  // 添加清理函数
  // useEffect(() => {
  //   return () => {
  //     // 组件卸载时关闭连接
  //     if (taskPipeRef.current) {
  //       taskPipeRef.current.close();
  //       taskPipeRef.current = null;
  //     }
  //   };
  // }, []);

  const refreshList = async (id: number, resultUrl: string) => {
    await dispatchGenerated(id);
    await preloadImage(resultUrl);
    setResultImages(resultImages => {
      const index = resultImages.findIndex(d => d.id === id);
      if (index < 0) {
        return resultImages;
      }
      resultImages[index] = {
        ...resultImages[index],
        url_path: resultUrl,
        status: GenerationStatus.DONE,
      };
      return [...resultImages];
    });
  };

  const removeGeneration = (id: number) => {
    setResultImages(resultImages => {
      const index = resultImages.findIndex(d => d.id === id);
      if (index < 0) {
        return resultImages;
      }
      const newResultImages = [...resultImages];
      newResultImages.splice(index, 1);
      return newResultImages;
    });
  };

  // Handle submission
  const handleSubmit = async () => {
    // TODO: Handle image submission and get result
    console.log('Processing images...');
    if (profile.credit < cost) {
      // toast.error(t('toast:lineArtColorize.purchaseMoreZaps'), {
      //     position: "top-center",
      //     style: {
      //         background: '#555',
      //         color: '#fff',
      //     }
      // });
      openModal('pricing');
      return;
    }

    const id = getId();
    setResultImages([
      {
        id,
        url_path: '',
        prompt,
        status: GenerationStatus.GENERATING,
      },
      ...resultImages,
    ]);

    const processedReference = referenceImage
      ? await processImage(referenceImage)
      : undefined;
    const processedSketch = await processImage(inputImage);
    try {
      // setLoading(true);
      const result = await lineArtColorizeAPI(
        processedSketch,
        whiteBg ? `${prompt}` : prompt,
        processedReference, // Add reference image URL to API call
        whiteBg,
        selectedModel,
      );
      // setLoading(false);
      // initTaskPipe()

      if (result.error) {
        if (result.error_code === ERROR_CODES.RATE_LIMIT_EXCEEDED) {
          toastWarn(t('toast:common.rateLimitExceeded'));
        } else {
          toast.error(result.error, {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        removeGeneration(id);
        return;
      }

      setProfile(profile => {
        return {
          ...profile,
          credit: profile.credit - cost,
        };
      });
      // 3. 调用 API 处理两张图片

      // const returnUrl = !result.output?.includes('http') || !result.output?.includes('data:') ? proxyImageUrl(result.output) : result.output;
      const returnUrl = result.output;
      await refreshList(id, returnUrl);
      const model = selectedModel === ToolsModel.BASIC ? 'Basic' : 'Advanced';
      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'colorize-line-art',
        url_path: returnUrl,
        prompt,
        model,
        id: null,
      });
      if (response.data && response.data.length > 0) {
        setResultImages(resultImages => {
          const index = resultImages.findIndex(d => d.id === id);
          if (index < 0) {
            return resultImages;
          }
          resultImages[index] = {
            ...resultImages[index],
            id: response.data[0].id,
            status: GenerationStatus.DONE,
          };
          return [...resultImages];
        });
        toast.success(t('toast:lineArtColorize.colorizeSuccess'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.error(t('toast:lineArtColorize.colorizeFailed'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('create image failed:', error);
      removeGeneration(id);
      if ((error as any).message === 'no zaps') {
        // toast.error(t('toast:lineArtColorize.noZaps'), {

        //     position: "top-center",
        //     style: {
        //         background: '#555',
        //         color: '#fff',
        //     }
        // });
        openModal('pricing');
        return;
      }
      toast.error(t('toast:lineArtColorize.createFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWhiteBgChange = (value: boolean) => {
    console.log('handleWhiteBgChange', value);
    setWhiteBg(value);
  };

  return (
    <div className='overflow-y-auto pb-16 -mt-4 min-h-screen'>
      <div className='container relative mx-auto max-w-[100rem] flex-grow px-4 md:px-6 2xl:px-16'>
        {/* Hero Section */}
        <div className='pt-6'>
          <Hero
            title={t('hero.title')}
            description={t('hero.description')}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 mt-4 md:grid-cols-12 md:gap-6'>
          {/* Left input area - 在移动设备上占满宽度 */}
          <div className='col-span-1 md:col-span-6 lg:col-span-5'>
            <Card className='bg-card p-4 md:p-6 transition-all duration-300 shadow-2xl border-1.5 border-primary-200'>
              <div className='flex justify-between items-center mb-3'>
                <h2 className='text-2xl font-bold text-heading'>
                  {t('input.title')}
                </h2>
                <Tooltip content={t('input.tooltip')} color='primary'>
                  <span>
                    <BsInfoCircleFill className='text-primary' />
                  </span>
                </Tooltip>
              </div>

              <div className='mb-4'>
                <label className='block mb-2 font-medium text-foreground'>
                  {t('input.lineArt.label')}
                </label>
                <UploadFile
                  onChange={handleChange}
                  accept='.png,.jpg,.jpeg,.webp'
                  className='rounded-lg border-2 border-dashed transition-all duration-300 border-primary-200 hover:border-primary-400'
                />
              </div>

              {/* Add reference image upload section */}
              <div className='mb-4'>
                <label className='block mb-2 font-medium text-foreground'>
                  {t('input.referenceImage.label')}
                </label>
                <p className='mb-2 text-sm text-muted-foreground'>
                  {t('input.referenceImage.description')}
                </p>
                <UploadFile
                  onChange={handleReferenceChange}
                  accept='.png,.jpg,.jpeg,.webp'
                  removable
                  initialImage={referenceImage}
                  onRemove={() => {
                    setReferenceImage('');
                  }}
                  className='rounded-lg border-2 border-dashed transition-all duration-300 border-primary-200 hover:border-primary-400'
                />
              </div>
              <div className='flex flex-row justify-between items-center mb-4'>
                <p className=''>{t('input.transparentBackground')}</p>
                <Switch
                  isSelected={whiteBg}
                  onValueChange={handleWhiteBgChange}
                />
              </div>

              {/* Prompt input */}
              <div className='mb-4'>
                <div className='flex justify-between items-center mb-2'>
                  <p className='font-bold text-foreground text-sm'>
                    {t('input.prompt.label')}
                  </p>
                </div>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={t('input.prompt.placeholder')}
                  className='p-3 w-full rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-input dark:bg-input dark:text-foreground dark:placeholder:text-muted-foreground'
                  rows={2}
                />
              </div>

              {/* Model selection */}
              <div className='mb-6'>
                <p className='block mb-1 font-medium text-foreground'>
                  {t('input.model.label')}
                </p>
                <Select
                  selectedKeys={[`${selectedModel}`]}
                  placeholder={t('input.model.placeholder')}
                  defaultSelectedKeys={[ToolsModel.BASIC + '']}
                  className='w-full'
                  onSelectionChange={keys => {
                    const selected = +Array.from(keys)[0] as ToolsModelType;
                    setSelectedModel(selected);
                    console.log('selected', selected);
                  }}
                  aria-label={t('input.model.ariaLabel')}
                  classNames={{
                    trigger:
                      'border-border hover:border-primary transition-all duration-300 bg-input',
                    label: '!text-foreground',
                    value: '!text-foreground',
                  }}>
                  <SelectItem key={ToolsModel.BASIC} value={ToolsModel.BASIC}>
                    {t('input.model.options.basic')}
                  </SelectItem>
                  <SelectItem
                    key={ToolsModel.ADVANCED}
                    value={ToolsModel.ADVANCED}>
                    {t('input.model.options.advanced')}
                  </SelectItem>
                </Select>
              </div>

              <div className='mb-2'>
                <PublicVisibilityToggle
                  isPublic={isPublic}
                  onToggle={setIsPublic}
                  label={t('common:publicVisibility.label')}
                  tooltip={t('common:publicVisibility.tooltip')}
                  variant='section'
                />
              </div>

              {/* Submit button */}
              <Button
                isLoading={loading}
                color='primary'
                className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-primary-400 text-primary-foreground shadow-md hover:shadow-lg'
                size='lg'
                onClick={handleSubmit}
                isDisabled={!inputImage}>
                {t('colorize_image')}
                {isAuth && (
                  <Chip
                    startContent={
                      <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                    }
                    variant='bordered'
                    color={'primary'}
                    size='sm'
                    className='bg-card'
                    classNames={{
                      content: 'dark:text-foreground',
                    }}>
                    -{cost}/{profile.credit}
                  </Chip>
                )}
              </Button>
            </Card>
          </div>

          {/* Right output area - 在移动设备上占满宽度 */}
          <div className='col-span-1 md:col-span-6 lg:col-span-7'>
            <Card className='bg-card p-4 md:p-6 h-full shadow-2xl border-1.5 border-primary-50'>
              <h2 className='flex items-center mb-6 text-2xl font-bold text-heading'>
                <FaDownload className='mr-2 text-heading' />
                {t('output.title')}
              </h2>
              <div className='w-full max-h-[calc(971px-7rem)] flex flex-col'>
                <div className='overflow-y-auto flex-1 rounded-lg'>
                  {resultImages?.length > 0 ? (
                    <div className='grid grid-cols-1 gap-6'>
                      {resultImages.map((img, index) => (
                        <ResultCard
                          showPrompt
                          key={img.id}
                          index={index}
                          type='image'
                          data={img}
                          handleDownload={handleDownload}
                          handleDelete={handleDeleteClick}
                          isExample={img.id === -1}
                          tool='lineart-colorize'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                      <MdOutlineAnimation
                        size={48}
                        className='mb-4 text-primary-300'
                      />
                      <p className='text-center'>{t('output.empty.message')}</p>
                      <p className='mt-2 text-sm text-center'>
                        {t('output.empty.instruction')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* SEO Section */}
        <div className='flex flex-col justify-center items-center mt-8 mb-8'>
          <div className='col-span-12'>
            <WhatIs
              title={t('seo.whatIs.title')}
              description={t('seo.whatIs.description')}
            />

            <HowToUse
              title={t('seo.howTo.title')}
              steps={[
                {
                  title: t('seo.steps.step1.title'),
                  content: t('seo.steps.step1.content'),
                },
                {
                  title: t('seo.steps.step2.title'),
                  content: t('seo.steps.step2.content'),
                },
                {
                  title: t('seo.steps.step3.title'),
                  content: t('seo.steps.step3.content'),
                },
                {
                  title: t('seo.steps.step4.title'),
                  content: t('seo.steps.step4.content'),
                },
              ]}
            />

            <div className='pt-12 text-center md:pt-16'>
              <h2 className='mb-4 text-2xl font-bold text-center md:mb-6 md:text-3xl text-heading'>
                {t('examples.title')}
              </h2>
              <p className='px-2 mx-auto mb-4 max-w-4xl text-sm text-center text-muted-foreground md:mb-6 md:text-md lg:text-lg md:px-0'>
                {t('examples.description')}
              </p>
            </div>

            <div className='grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2'>
              {/* Example 1 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-2 p-4 md:gap-4 md:p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='https://replicate.delivery/pbxt/KloAOzLTaJKdkQOT7cjj1BDvKaiNWWPb4VkcOwPSTy3jZkiV/326143.png'
                        alt={t('examples.example1.inputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.inputLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/output_girl.webp'
                        alt={t('examples.example1.outputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
                <div className='p-3 md:p-4 bg-primary-50 dark:bg-muted'>
                  <p className='text-sm font-medium md:text-base text-heading-muted dark:text-foreground'>
                    {t('examples.example1.prompt')}
                  </p>
                </div>
              </div>

              {/* Example 2 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-2 p-4 md:gap-4 md:p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/input3.jpeg'
                        alt={t('examples.example2.inputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.inputLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/output3.jpeg'
                        alt={t('examples.example2.outputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
                <div className='p-3 md:p-4 bg-primary-50 dark:bg-muted'>
                  <p className='text-sm font-medium md:text-base text-heading-muted dark:text-foreground'>
                    {t('examples.example2.prompt')}
                  </p>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2'>
              {/* Example 1 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-2 p-4 md:gap-4 md:p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/input4.webp'
                        alt={t('examples.example1.inputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.inputLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/output4.webp'
                        alt={t('examples.example1.outputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
                <div className='p-3 md:p-4 bg-primary-50 dark:bg-muted'>
                  <p className='text-sm font-medium md:text-base text-heading-muted dark:text-foreground'>
                    {t('examples.example4.prompt')}
                  </p>
                </div>
              </div>

              {/* Example 2 */}
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-2 gap-2 p-4 md:gap-4 md:p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/input5.webp'
                        alt={t('examples.example2.inputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.inputLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg aspect-square'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/output5.webp'
                        alt={t('examples.example2.outputAlt')}
                        className='object-cover w-full h-full'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
                <div className='p-3 md:p-4 bg-primary-50 dark:bg-muted'>
                  <p className='text-sm font-medium md:text-base text-heading-muted dark:text-foreground'>
                    {t('examples.example5.prompt')}
                  </p>
                </div>
              </div>
            </div>

            {/* Example with reference image */}
            <div className='mt-6 md:mt-8'>
              <div className='flex overflow-hidden flex-col bg-card rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl'>
                <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 md:p-6'>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/input.jpg'
                        alt={t('examples.example3.inputAlt')}
                        className='object-contain w-full h-auto'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.inputLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/input_ref.jpg'
                        alt={t('examples.example3.referenceAlt')}
                        className='object-contain w-full h-auto'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.referenceLabel')}
                    </p>
                  </div>
                  <div className='flex flex-col'>
                    <div className='overflow-hidden mb-2 w-full rounded-lg'>
                      <NextUIImage
                        src='/images/examples/line-art-colorize/output1.webp'
                        alt={t('examples.example3.outputAlt')}
                        className='object-contain w-full h-auto'
                      />
                    </div>
                    <p className='text-sm text-center text-muted-foreground'>
                      {t('examples.outputLabel')}
                    </p>
                  </div>
                </div>
                <div className='p-3 md:p-4 bg-primary-50 dark:bg-muted'>
                  <p className='text-sm font-medium md:text-base text-heading-muted dark:text-foreground'>
                    {t('examples.example3.prompt')}
                  </p>
                </div>
              </div>
            </div>

            {/* Why use section */}
            <Benefits
              title={t('whyUse.title')}
              description={t('whyUse.description')}
              features={[
                {
                  title: t('whyUse.features.referenceGuided.title'),
                  content: t('whyUse.features.referenceGuided.content'),
                  icon: '🎨',
                },
                {
                  title: t('whyUse.features.specifyColors.title'),
                  content: t('whyUse.features.specifyColors.content'),
                  icon: '🖌️',
                },
                {
                  title: t('whyUse.features.customArtStyles.title'),
                  content: t('whyUse.features.customArtStyles.content'),
                  icon: '💎',
                },
                {
                  title: t('whyUse.features.effortlessFilling.title'),
                  content: t('whyUse.features.effortlessFilling.content'),
                  icon: '💪',
                },
                {
                  title: t('whyUse.features.smartColorization.title'),
                  content: t('whyUse.features.smartColorization.content'),
                  icon: '🧠',
                },
                {
                  title: t('whyUse.features.highQualityOutputs.title'),
                  content: t('whyUse.features.highQualityOutputs.content'),
                  icon: '🎨',
                },
                {
                  title: t('whyUse.features.streamlinedWorkflow.title'),
                  content: t('whyUse.features.streamlinedWorkflow.content'),
                  icon: '💫',
                },
                {
                  title: t('whyUse.features.mangaPanelConsistency.title'),
                  content: t('whyUse.features.mangaPanelConsistency.content'),
                  icon: '📚',
                },
                {
                  title: t('whyUse.features.instantEnhancement.title'),
                  content: t('whyUse.features.instantEnhancement.content'),
                  icon: '⚡️',
                },
              ]}
            />

            <div className='my-12 md:my-16'>
              <MoreAITools category='illustration' />
            </div>

            <FAQ
              title={t('faq.title')}
              description={t('faq.description')}
              faqs={t('faq.items', { returnObjects: true }) as any[]}
            />
          </div>
        </div>
      </div>
      {/* 确认对话框 */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalContent>
          <ModalHeader>{t('deleteModal.title')}</ModalHeader>
          <ModalBody>{t('deleteModal.message')}</ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button color='danger' onPress={handleConfirmDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
