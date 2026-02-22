/* eslint-disable */
import { KonvaEventObject, Node, NodeConfig } from 'konva/lib/Node';
import Konva from 'konva';
import { LayerOptions, LAYER_OPTIONS, DrawAction } from '../../constants';
import { MdOutlineFormatColorReset } from 'react-icons/md';
import {
  Button,
  Card,
  Divider,
  Select,
  SelectItem,
  Slider,
  Tab,
  Tabs,
  Tooltip,
} from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { AiOutlineDelete } from 'react-icons/ai';
import { HiOutlineTrash } from 'react-icons/hi';
import { HiOutlineDocumentDuplicate } from 'react-icons/hi';
import { v4 as uuidv4 } from 'uuid';
import { LuImageOff } from 'react-icons/lu';
import { HiOutlineDownload } from 'react-icons/hi';
import { downloadURI } from '../../utilities';
import { addWatermark } from '../../utilities/watermark';
import { HiMiniMagnifyingGlassPlus } from 'react-icons/hi2';
import { LuAlignLeft, LuAlignCenter, LuAlignRight } from 'react-icons/lu';
import toast from 'react-hot-toast';
const WATERMARK_IMAGE = '/images/watermark_3.webp';
import { LuRefreshCw } from 'react-icons/lu';
import { useAtom } from 'jotai';
import { profileAtom } from 'state';
import { BACKGROUND_REMOVAL } from '../../../api/tools/_zaps';
import { useTranslation } from 'react-i18next';
import { useOpenModal } from 'hooks/useOpenModal';
interface DrawingNode extends NodeConfig {
  child?: DrawingNode[];
}
interface OptionsProps {
  stage: any;
  onLayerChange: (action: LayerOptions) => void;
  onDelete: () => void;
  onImageLoaded: (
    imageUrls: { id: number; url: string }[],
    options: {
      replace: boolean | string;
      updateSize?: boolean; // 是否更新为新图片的 size/width，upscale用，默认为false
      imageIndex?: number | undefined;
      prompt?: string;
      model?: string;
      selectedCharImages?: any[];
    },
  ) => void;
  onDuplicate: () => void;
  onElementChange: (payload: any) => void;
  currentSelectedShape: {
    // controls the properties of the currently selected element
    type: DrawAction;
    id: string;
    node: Node<NodeConfig>;
    originTargetAttrs?: DrawingNode;
  };
  isMobile: boolean;
  tool?: string;
}

const fontFamilies = [
  'Wildwords',
  'Anime Ace',
  'CCMeanwhile',
  'Tight Spot',
  'Digital Strip',
  'Comic Sans MS',
  'Arial',
  'Times New Roman',
  'Georgia',
].map(i => ({
  key: i,
  label: i,
}));

export default function Options({
  stage,
  onLayerChange,
  onDelete,
  onDuplicate,
  onElementChange,
  onImageLoaded,
  currentSelectedShape,
  isMobile,
  tool = 'create',
}: OptionsProps) {
  const [replace, setReplace] = useState(false);
  const { t } = useTranslation(['create', 'toast']);
  const { t: tCommon } = useTranslation('common');

  const [stroke, setStroke] = useState(
    currentSelectedShape.originTargetAttrs?.strokeWidth || 0,
  );
  const [fontSize, setFontSize] = useState(
    currentSelectedShape.originTargetAttrs?.fontSize || 50,
  );
  const [fontFamily, setFontFamily] = useState([
    currentSelectedShape?.originTargetAttrs?.fontFamily || 'Arial',
  ]);
  const [textAlign, setTextAlign] = useState(
    currentSelectedShape.originTargetAttrs?.align,
  );
  const [textColor, setTextColor] = useState(
    currentSelectedShape.originTargetAttrs?.fill,
  );
  const [profile, setProfile] = useAtom(profileAtom);
  const { submit: openModal } = useOpenModal();

  useEffect(() => {
    setStroke(currentSelectedShape.originTargetAttrs?.strokeWidth);
    setFontSize(currentSelectedShape.originTargetAttrs?.fontSize);
    setFontFamily([currentSelectedShape.originTargetAttrs?.fontFamily]);
    setTextAlign(currentSelectedShape.originTargetAttrs?.align);
    setTextColor(currentSelectedShape.originTargetAttrs?.fill);
    console.log(
      textAlign,
      'font',
      currentSelectedShape.originTargetAttrs?.align,
    );
  }, [currentSelectedShape]);

  async function removeBackground() {
    if (profile.credit < BACKGROUND_REMOVAL) {
      toast.error(t('notEnoughZaps'));
      return;
    }
    try {
      // get image URL
      const inputImage = currentSelectedShape.node.toDataURL();

      // Call background removal API
      const params = {
        image: inputImage,
        reverse: false, // Keep foreground, remove background
      };

      const response = await fetch('/api/tools/background-removal', {
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
        toast.error(data.error);
        throw new Error('no zaps');
      }

      if (!data.output) {
        throw new Error('No output from API');
      }
      setProfile({
        ...profile,
        credit: profile.credit - BACKGROUND_REMOVAL,
      });

      setReplace(true);
      // load image
      onImageLoaded([{ id: -1, url: data.output }], {
        replace: 'refresh',
      });
    } catch (error) {
      console.error('Background removal failed:', error);
      if ((error as any).message === 'no zaps') {
        // toast.error(t('notEnoughZaps'));
        openModal('pricing');
        return;
      }
      toast.error(t('backgroundRemovalFailed'));
    }
  }

  async function upscaleImage() {
    const inputImage = await currentSelectedShape.node.toDataURL({
      pixelRatio: 1 / stage.scaleX(),
    });
    console.log(inputImage);
    // const app = await client("UpScendAI/R-Esrgan");
    // const result: any = await app.predict("/predict", [
    //   inputImage, 	// blob in 'parameter_0' Image component
    //   "2x", // string  in 'Resolution model' Radio component
    // ]);

    // const imageUrl = result.data[0]["url"];
    const data = {
      image: inputImage,
      scale: 2,
    };

    const url = `/api/tools/image-upscale`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    let imageUrl;
    if (!response.ok) {
      console.log('ERROR CALLING API');
      // console.error(await response.text());
      // toast.error(`Failed to generate image: ${response.status} ${await response.text()}`);
      toast.error(t('toast:image.generation.failed'));
      imageUrl = [];
    } else {
      imageUrl = await response.json();
      imageUrl = imageUrl.output;
      console.log(imageUrl);
    }

    onImageLoaded([{ id: -1, url: imageUrl }], {
      replace: 'refresh',
    });
  }

  async function regenerateImage() {
    const prompt = currentSelectedShape.node.attrs.prompt;
    const model = currentSelectedShape.node.attrs.model;
    const selectedCharImages =
      currentSelectedShape.node.attrs.selectedCharImages;
    const referenceImage = currentSelectedShape.node.attrs.referenceImage;
    console.log(currentSelectedShape.node);
    const imageSize = {
      width: Math.floor(currentSelectedShape.node.attrs.width / 8) * 8,
      height: Math.floor(currentSelectedShape.node.attrs.height / 8) * 8,
    };
    const { generateImage } = await loadCanvasUtils();
    generateImage(
      prompt,
      model,
      imageSize,
      selectedCharImages,
      referenceImage,
      1,
      onImageLoaded,
      (g: boolean) => {},
      true,
      currentSelectedShape.node,
      undefined,
      t,
      tool,
    );
  }

  const onDownload = async () => {
    const dataURL = currentSelectedShape.node.toDataURL({
      pixelRatio: 1 / stage.scaleX(),
    });

    const watermarkUrl = await addWatermark(dataURL);
    downloadURI(watermarkUrl, 'Komiko.png');
  };
  return (
    <Card
      className='p-2 bg-muted'
      // borderRadius={"md"}
      // width="200px"
      // border="1px solid #ddd"
      // p={3}
      // bg="white"
    >
      {currentSelectedShape.originTargetAttrs?.image &&
        currentSelectedShape.type != DrawAction.Bubble && (
          <div>
            <div className='text-[10.5px] text-foreground'>{t('ai')}</div>
            <div className='flex gap-1 mt-1'>
              <Tooltip content={t('regenerateUsingPrompt')}>
                <Button
                  size='sm'
                  className='w-7 h-7 bg-muted'
                  isIconOnly={true}
                  onClick={regenerateImage}>
                  <LuRefreshCw className='w-3.7 h-3.7' />
                </Button>
              </Tooltip>
              <Tooltip content={t('removeBackground')}>
                <Button
                  size='sm'
                  className='w-7 h-7 bg-muted'
                  isIconOnly={true}
                  onClick={removeBackground}>
                  <LuImageOff className='w-3.5 h-3.5' />
                </Button>
              </Tooltip>
              {!isMobile && (
                <Tooltip content={t('upscaleSelectedImage')}>
                  <Button
                    size='sm'
                    className='w-7 h-7 bg-muted'
                    isIconOnly={true}
                    onClick={upscaleImage}>
                    <HiMiniMagnifyingGlassPlus className='w-4 h-4' />
                  </Button>
                </Tooltip>
              )}
              {/* TODO: add pose estimate model */}
            </div>
            <Divider className='mt-3 mb-2' />
          </div>
        )}

      {currentSelectedShape.originTargetAttrs?.name == DrawAction.Text && (
        <div>
          <div className='text-[10.5px] text-foreground'>{t('text')}</div>
          <Tooltip content={t('doubleClickToEditText')}>
            <Button
              size='sm'
              className='w-7 bg-muted w-full text-left text-[13px] bg-primary-100'
              onClick={() => {
                console.log(currentSelectedShape.node);
                currentSelectedShape.node.attrs.onDblClick({
                  target: currentSelectedShape.node,
                } as any);
              }}>
              {t('editText')}
            </Button>
          </Tooltip>

          {!isMobile && (
            <div>
              <Select
                label=''
                className='mt-1'
                size='sm'
                placeholder={t('selectFont')}
                selectedKeys={fontFamily}
                onChange={e => {
                  setFontFamily([e.target.value]);
                  onElementChange({
                    type: 'setStyle',
                    payload: {
                      fontFamily: e.target.value,
                    },
                  });
                }}>
                {fontFamilies.map(font => (
                  <SelectItem key={font.key}>{font.label}</SelectItem>
                ))}
              </Select>
              <div className='text-[10.5px] text-foreground mt-2 mb-1'>
                {t('color')}
              </div>
              <div className='flex flex-wrap gap-[3px] max-w-[115px]'>
                {[
                  'black',
                  'white',
                  '#646361',
                  '#3E5B7D',
                  '#867190',
                  '#BF7B7B',
                  '#A5CACD',
                  '#F0E066',
                  '#F8AC9E',
                  '#92CC42',
                  '#EF5048',
                  '#45B6EE',
                  '#17AA70',
                  '#E95AAC',
                  '#F7B45E',
                  '#9B2194',
                  '#EED5C1',
                  '#467C64',
                  '#0253E8',
                  '#CA9BF0',
                ].map(color => (
                  <div
                    className='w-5 h-5 rounded-full'
                    style={{
                      backgroundColor: color,
                      borderWidth: 1.5,
                      borderColor: textColor == color ? 'black' : 'gray',
                    }}
                    onClick={() => {
                      setTextColor(color);
                      onElementChange({
                        type: 'setStyle',
                        payload: {
                          fill: color,
                        },
                      });
                    }}></div>
                ))}
              </div>

              <div className='flex gap-1 justify-between mt-2'>
                <div className='text-[10.5px] text-foreground'>
                  {t('fontSize')}
                </div>
                <div className='text-[10.5px] text-foreground'>{fontSize}</div>
              </div>
              <Slider
                size='sm'
                className='mb-1 text-xs'
                step={1}
                maxValue={200}
                minValue={0}
                aria-label='Font size'
                value={fontSize}
                onChange={v => {
                  setFontSize(v);
                }}
                onChangeEnd={v => {
                  onElementChange({
                    type: 'setStyle',
                    payload: {
                      fontSize: v,
                    },
                  });
                }}
              />
              <div className='flex gap-1 justify-between mt-2'>
                <div className='text-[10.5px] text-foreground'>
                  {t('strokeWidth')}
                </div>
                <div className='text-[10.5px] text-foreground'>{stroke}</div>
              </div>
              <Slider
                size='sm'
                className='mb-1 text-xs'
                step={1}
                maxValue={10}
                minValue={0}
                aria-label='Stroke witdh'
                value={stroke}
                onChange={v => {
                  setStroke(v);
                }}
                onChangeEnd={v => {
                  onElementChange({
                    type: 'setStyle',
                    payload: {
                      stroke: 'white',
                      strokeWidth: v,
                    },
                  });
                }}
              />
              <div className='text-[10.5px] text-foreground'>{t('align')}</div>
              <div className='flex gap-1'>
                <Tabs
                  fullWidth
                  aria-label='Options'
                  size={'sm'}
                  variant='light'
                  onSelectionChange={e => {
                    setTextAlign(e);
                    onElementChange({
                      type: 'setStyle',
                      payload: {
                        align: e,
                      },
                    });
                  }}
                  selectedKey={textAlign}>
                  <Tab
                    key='left'
                    title={<LuAlignLeft />}
                    className='w-[30px]'></Tab>
                  <Tab
                    key='center'
                    title={<LuAlignCenter />}
                    className='w-[30px]'
                  />
                  <Tab
                    key='right'
                    title={<LuAlignRight />}
                    className='w-[30px]'
                  />
                </Tabs>
              </div>
            </div>
          )}
          <Divider className='mt-2 mb-2' />
        </div>
      )}

      {currentSelectedShape.originTargetAttrs?.name == DrawAction.Rectangle && (
        <div>
          <div className='text-[10.5px] text-foreground'>
            {t('backgroundFill')}
          </div>
          <div className='flex gap-1 mt-1'>
            {(isMobile
              ? ['black', 'white']
              : ['black', 'white', 'transparent']
            ).map(color => (
              <Tooltip
                content={t(
                  `set${color.charAt(0).toUpperCase() + color.slice(1)}Background`,
                )}
                key={color}>
                <div
                  key={color}
                  className='w-7 h-7 rounded-md border border-border cursor-pointer border-w-1'
                  style={{
                    backgroundColor: color == 'transparent' ? 'hsl(var(--nextui-secondary-50, 197 47% 92%))' : color,
                  }}
                  onClick={() => {
                    onElementChange({
                      type: 'setStyle',
                      payload: { fill: color },
                    });
                  }}></div>
              </Tooltip>
            ))}
          </div>
          <Divider className='mt-3 mb-2' />

          {
            <div>
              <div className='text-[10.5px] text-foreground'>
                {t('borderWidth')}
              </div>
              <Slider
                size='sm'
                className=''
                step={0.5}
                maxValue={15}
                minValue={0}
                aria-label='stroke'
                value={stroke}
                onChange={v => {
                  setStroke(v);
                }}
                onChangeEnd={v => {
                  onElementChange({
                    type: 'setStyle',
                    payload: {
                      strokeWidth: v,
                    },
                  });
                }}
              />
              <Divider className='mt-3 mb-2' />
            </div>
          }
        </div>
      )}

      <div>
        <div className='text-[10.5px] text-foreground'>{t('layers')}</div>
        <div className='flex gap-1 mt-1'>
          {LAYER_OPTIONS.map(({ id, label_key, icon }) => (
            <Tooltip content={tCommon(label_key)} key={id}>
              <Button
                size='sm'
                className='w-5 h-7 bg-muted ph-0'
                isIconOnly={true}
                onClick={() => onLayerChange(id)}>
                {icon}
              </Button>
            </Tooltip>
          ))}
        </div>
        <Divider className='mt-3 mb-2' />
      </div>

      <div>
        <div className='text-[10.5px] text-foreground'>{t('element')}</div>
        <div className='flex gap-1 mt-1 mb-1'>
          <Tooltip content={t('downloadSelectedElement')}>
            <Button
              size='sm'
              className='w-7 h-7 bg-muted'
              isIconOnly={true}
              onClick={onDownload}>
              <HiOutlineDownload />
            </Button>
          </Tooltip>
          {!isMobile && (
            <div>
              <Tooltip content={t('duplicateSelectedElement')}>
                <Button
                  size='sm'
                  className='w-7 h-7 bg-muted'
                  isIconOnly={true}
                  onClick={onDuplicate}>
                  <HiOutlineDocumentDuplicate />
                </Button>
              </Tooltip>
            </div>
          )}
          <Tooltip content={t('deleteSelectedElement')}>
            <Button
              size='sm'
              className='w-7 h-7 bg-red-100'
              isIconOnly={true}
              onClick={onDelete}>
              <HiOutlineTrash />
            </Button>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}

// 动态加载Canvas相关工具函数
const loadCanvasUtils = async () => {
  const { generateImage } = await import('../InfCanva/utils');
  return { generateImage };
};
