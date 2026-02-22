/* eslint-disable */
import React, { memo, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaDownload } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
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
import {
  Button,
  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Select,
  SelectItem,
  Tooltip,
} from '@nextui-org/react';
import { BiSolidZap } from 'react-icons/bi';
import { TOOL_CARD_STYLES } from './shared/toolCardStyles';
import { useAtom, useAtomValue } from 'jotai';
import { authAtom, profileAtom } from 'state';
import { calculateLineArtColorizeCost } from '../../../api/tools/_zaps';
import { toastWarn } from '@/utils/index';
import { useBtnText } from 'hooks/useBtnText';
import { BsInfoCircleFill } from 'react-icons/bs';
import { MdOutlineAnimation } from 'react-icons/md';
import { ToolsModel, ToolsModelType } from '../../../api/tools/_zaps';
import { ERROR_CODES } from '../../../api/_constants';
import { useTranslation } from 'react-i18next';
import { useOpenModal } from 'hooks/useOpenModal';
import { getCreateYoursData } from '../../utilities/tools';
import { useRouter } from 'next/router';

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

// 1. 检查并调整图片尺寸 1024*1024 �?格式
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

      // 转换�?base64
      resolve(canvas.toDataURL('image/jpeg', 1));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// 3. 调用 inbetween API
const sketchSimplifierAPI = async (
  image: string,
  prompt: string,
  referenceImage?: string,
  white_bg = false,
  model: ToolsModelType = ToolsModel.BASIC,
  simplification_level = 2,
): Promise<{ output: string; error?: string; error_code?: number }> => {
  const params: { [key: string]: any } = {
    user_prompt: prompt || '',
    sketch_b64: image,
    negative_prompt: '',
    scale: simplification_level, // Pass the level directly (1-4)
    white_bg,
    model,
  };

  if (referenceImage) {
    params.ipadapter_b64 = referenceImage;
  }

  const response = await fetch('/api/tools/sketch-simplifier', {
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
  if (data) {
    return data;
  } else {
    throw new Error('No output from sketchSimplifier API');
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

export default function SketchSimplifierPage({ isMobile }: any) {
  const router = useRouter();
  // State management
  const [selectedModel, setSelectedModel] = useState<ToolsModelType>(
    ToolsModel.BASIC,
  );
  const [cost, setCost] = useState(
    calculateLineArtColorizeCost(false, ToolsModel.ADVANCED),
  );

  const [loading, setLoading] = useState(false);

  const [inputImage, setInputImage] = useState<string>('');
  const [profile, setProfile] = useAtom(profileAtom);
  const isAuth = useAtomValue(authAtom);
  const { t } = useTranslation(['sketch-simplification', 'common']);

  // video results list
  const [resultImages, setResultImages] = useState<ImageData[]>([
    {
      id: -1,
      url_path: '/images/examples/sketch_simplifier/output2.webp',
      prompt: t('common:exampleResult'),
    },
  ]);
  // 删除 组件
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const [whiteBg, setWhiteBg] = useState(false);
  const [simplificationLevel, setSimplificationLevel] = useState(2);

  const btnText = useBtnText('Simplify Image', 'Simplify Image');
  const { submit: openModal } = useOpenModal();
  const [isPublic, setIsPublic] = useState(() => {
    return profile.plan === 'Free';
  });

  // Update cost when model or white background changes
  useEffect(() => {
    setCost(calculateLineArtColorizeCost(whiteBg, selectedModel));
  }, [selectedModel, whiteBg]);

  // const taskPipeRef = useRef<EventSource | null>(null);

  // const updateImages = async (event: { data: string }) => {
  //   try {
  //     const data = JSON.parse(event.data);
  //     if (data.type !== 'progress') {
  //       return;
  //     }
  //     if (data.data.max !== data.data.value) {
  //       return;
  //     }
  //     const id = data.data.prompt_id;
  //     const filename = await getHistoryImage(id, TaskType.LINE_ART_COLORIZE);
  //     // imagesAPI({ method: "generateImage", tool: "colorize-line-art", url_path: proxyImageUrl(filename), prompt, id: null });
  //     const imageUrl = proxyImageUrl(filename);

  //     setResultImages((resultImages) => {
  //       const index = resultImages.findIndex(d => d.id === id);
  //       if (index < 0) {
  //         return resultImages;
  //       }
  //       resultImages[index] = {
  //         ...resultImages[index],
  //         url_path: imageUrl,
  //       };
  //       return [...resultImages];
  //     });
  //   } catch (error) {
  //     console.error('Error parsing event data:', error);
  //   }
  // };

  // �?Supabase 加载 视频
  const fetchImages = async (needMerge?: boolean) => {
    try {
      const response = await imagesAPI({
        method: 'getImages',
        tool: 'sketch-simplifier',
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
      toast.error(t('sketch-simplification:ui.toast.fetchImagesFailed'), {
        position: 'top-center',
        style: {
          background: '#555',
          color: '#fff',
        },
      });
    }
  };
  /* ******************************  初始更新状�?   *****************************  */
  // 初始加载数据
  useEffect(() => {
    isAuth && fetchImages();
  }, [isAuth]);

  // useEffect(() => {
  //   if(resultImages.length <= 0) {
  //     return;
  //   }
  //   resultImages.some(resultImage => {
  //     if (resultImage.status !== GenerationStatus.GENERATING || !resultImage.url_path) {
  //       return false;
  //     }
  //     preloadImage(resultImage.url_path)
  //       .then(() => dispatchGenerated(resultImage.id))
  //       .then(() => {
  //         return imagesAPI({ method: "generateImage", tool: "colorize-line-art", url_path: resultImage.url_path, prompt: resultImage.prompt, id: null });
  //       })
  //       .then((response) => {
  //         if (!response.data || response.data.length <= 0) {
  //           return;
  //         }
  //         const id = response.data[0].id;
  //         setResultImages(resultImages => {
  //           const index = resultImages.findIndex(d => d.id === resultImage.id);
  //           if (index < 0) {
  //             return resultImages;
  //           }
  //           resultImages[index] = {
  //             ...resultImages[index],
  //             id,
  //             status: GenerationStatus.DONE,
  //           };
  //           return [...resultImages];
  //         });
  //       })

  // }, [resultImages])

  // Get Generation preset from PostData(create yours)
  useEffect(() => {
    if (!router.isReady) return;
    const generationId = router.query.generationId;
    if (generationId) {
      const prePostData = getCreateYoursData(generationId as string);
      const generation = prePostData?.generation;

      if (generation) {
        // get model

        console.log('model', generation.model);
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
  // 点击删除按钮时保存视�?ID
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
          tool: 'sketch-simplifier',
          id: imageToDelete,
        });
        if (response.data && response.data.length > 0) {
          console.log('deleteImage success');
          deleteMediaData(setResultImages, imageToDelete);
          toast.success(t('sketch-simplification:ui.toast.deleteSuccess'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        } else {
          console.log('deleteImage failed');
          toast.error(t('sketch-simplification:ui.toast.deleteFailed'), {
            position: 'top-center',
            style: {
              background: '#555',
              color: '#fff',
            },
          });
        }
        setImageToDelete(null); // 清除保存�?ID
      } catch (error) {
        console.error('deleteImage failed', error);
        toast.error(t('sketch-simplification:ui.toast.deleteFailed'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      }
    }
  };

  /* ******************************  下载短视�?  *****************************  */
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
      toast.error(t('sketch-simplification:ui.toast.downloadFailed'), {
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
    console.log('Processing images...');
    if (profile.credit < cost) {
      // toast.error('Please purchase more zaps', {
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
        prompt: '',
        status: GenerationStatus.GENERATING,
      },
      ...resultImages.filter(d => d.id !== -1),
    ]);

    const processedSketch = await processImage(inputImage);
    try {
      const result = await sketchSimplifierAPI(
        processedSketch,
        whiteBg ? 'white background, simple background' : '',
        undefined,
        whiteBg,
        selectedModel,
        simplificationLevel,
      );

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

      // const returnUrl = !result.output?.includes('http') || !result.output?.includes('data:') ? proxyImageUrl(result.output) : result.output;
      const returnUrl = result.output;
      await refreshList(id, returnUrl);
      const model =
        selectedModel === ToolsModel.ADVANCED ? 'Advanced' : 'Basic';
      const response = await imagesAPI({
        method: 'generateImage',
        tool: 'sketch-simplifier',
        url_path: returnUrl,
        prompt: '',
        id: null,
        model,
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
        toast.success(t('sketch-simplification:ui.toast.simplifySuccess'), {
          position: 'top-center',
          style: {
            background: '#555',
            color: '#fff',
          },
        });
      } else {
        toast.error(t('sketch-simplification:ui.toast.simplifyFailed'), {
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
        // toast.error('no zaps', {
        //     position: "top-center",
        //     style: {
        //         background: '#555',
        //         color: '#fff',
        //     }
        // });
        openModal('pricing');
        return;
      }
      toast.error(t('sketch-simplification:ui.toast.createImageFailed'), {
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

  // const handleWhiteBgChange = (value: boolean) => {
  //   console.log('handleWhiteBgChange', value);
  //   setWhiteBg(value);
  // };

  // const handleSimplificationLevelChange = (value: number) => {
  //   console.log('handleSimplificationLevelChange', value);
  //   setSimplificationLevel(value);
  // };

  return (
    <div className='flex flex-col md:flex-row gap-4 md:gap-4 lg:gap-6 mt-4 md:mb-24 mb-12'>
      {/* Left input area */}
      <div className='w-full md:flex-none md:w-5/12 lg:w-5/12'>
        <Card
          className={`p-4 md:px-6 md:pt-4 md:pb-6 transition-all duration-300 ${TOOL_CARD_STYLES.inputCard}`}>
          <div className='flex justify-between items-center mb-3 md:mb-4'>
            <h2 className='text-lg font-bold text-primary-600 md:text-2xl'>
              {t('sketch-simplification:ui.input.title')}
            </h2>
            <Tooltip
              content={t('sketch-simplification:ui.input.tooltip')}
              color='primary'>
              <span>
                <BsInfoCircleFill className='text-primary-500' />
              </span>
            </Tooltip>
          </div>

          {/* Upload image area */}
          <div className='mb-4'>
            <label className='block mb-2 font-bold text-foreground text-sm md:text-base'>
              {t('sketch-simplification:ui.input.sketchImage')}
            </label>
            <div className='h-[200px] md:h-[300px]'>
              <UploadFile
                onChange={handleChange}
                accept='.png,.jpg,.jpeg,.webp'
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Model selection */}
          <div className='mb-4'>
            <p className='block mb-1 font-bold text-foreground text-sm md:text-base'>
              {t('sketch-simplification:ui.input.aiModel')}
            </p>
            {/* <div className="mb-2 text-xs text-muted-foreground md:text-sm"><Chip size='sm' color='primary' className="mr-0.5">New</Chip> Check out our latest advanced model! Please note that generation may occasionally fail due to our service provider's content moderation policies.</div> */}
            <Select
              selectedKeys={[`${selectedModel}`]}
              placeholder={t('sketch-simplification:ui.input.selectModel')}
              defaultSelectedKeys={[ToolsModel.BASIC + '']}
              className='w-full'
              onSelectionChange={keys => {
                const selected = +Array.from(keys)[0] as ToolsModelType;
                setSelectedModel(selected);
                // Reset options when switching to Basic model
                if (selected === ToolsModel.BASIC) {
                  setWhiteBg(false);
                  setSimplificationLevel(2);
                }
              }}
              aria-label='Select model'
              classNames={{
                trigger:
                  'border-border hover:border-primary-500 transition-all duration-300',
              }}>
              <SelectItem key={ToolsModel.BASIC} value={ToolsModel.BASIC}>
                {t('sketch-simplification:ui.input.models.basic')}
              </SelectItem>
              <SelectItem key={ToolsModel.ADVANCED} value={ToolsModel.ADVANCED}>
                {t('sketch-simplification:ui.input.models.advanced')}
              </SelectItem>
            </Select>
          </div>

          {/* Submit button */}
          <Button
            isLoading={loading}
            color='primary'
            className='w-full mt-2 transform transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary-600 to-purple-600 text-primary-foreground shadow-md hover:shadow-lg'
            size='lg'
            onPress={handleSubmit}
            isDisabled={!inputImage}>
            {btnText}
            {isAuth && (
              <Chip
                startContent={
                  <BiSolidZap className='mr-0 w-4 h-4 text-orange-400' />
                }
                variant='bordered'
                color={'primary'}
                size='sm'
                className='bg-card'>
                -{cost}/{profile.credit}
              </Chip>
            )}
          </Button>
        </Card>
      </div>

      {/* Right output area */}
      <div className='w-full md:flex-1 md:relative h-[600px] md:h-auto'>
        <Card
          className={`p-4 md:pb-6 md:px-6 md:pt-4 shadow-primary-100 ${TOOL_CARD_STYLES.outputCard} h-full md:absolute md:inset-0 flex flex-col`}>
          <h2 className='flex items-center mb-4 md:mb-6 text-lg font-bold text-primary-600 md:text-2xl'>
            <FaDownload className='mr-2 text-primary-600' />
            {t('sketch-simplification:ui.output.title')}
          </h2>
          <div className='flex overflow-hidden flex-col flex-1 w-full'>
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
                      tool='sketch-simplifier'
                    />
                  ))}
                </div>
              ) : (
                <div className='flex flex-col justify-center items-center h-64 text-muted-foreground rounded-lg border-2 border-border border-dashed'>
                  <MdOutlineAnimation
                    size={48}
                    className='mb-4 text-primary-300'
                  />
                  <p className='text-center text-sm md:text-base'>
                    {t('sketch-simplification:ui.output.emptyState')}
                  </p>
                  <p className='mt-2 text-xs text-center md:text-sm'>
                    {t('sketch-simplification:ui.output.uploadPrompt')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        classNames={TOOL_CARD_STYLES.modalClassNames}>
        <ModalContent>
          <ModalHeader className='text-primary-600'>
            {t('sketch-simplification:ui.modal.deleteTitle')}
          </ModalHeader>
          <ModalBody>
            <p>{t('sketch-simplification:ui.modal.deleteMessage')}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant='light' onPress={() => setDeleteModalOpen(false)}>
              {t('sketch-simplification:ui.modal.cancel')}
            </Button>
            <Button color='danger' onPress={handleConfirmDelete}>
              {t('sketch-simplification:ui.modal.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
