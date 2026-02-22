/* eslint-disable */
import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  MutableRefObject,
} from 'react';
import { KonvaEventObject, Node, NodeConfig } from 'konva/lib/Node';
import Konva from 'konva';
import { useAtom } from 'jotai';
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Path as KonvaPath,
  Line as KonvaLine,
  Text as KonvaText,
  Transformer,
  Group,
  Image as KonvaImage,
} from 'react-konva';
import { CallBackProps, STATUS, Step } from 'react-joyride';
import {
  DrawAction,
  LayerOptions,
  SecondaryAction,
  TEMP_IMAGE_URL,
} from '../../constants';
import {
  getNumericVal,
  downloadURI,
  deepClone,
  toastError,
} from '../../utilities';
import { useToast } from '../common/use-toast';
import { generateWatermarkedImage } from '../../utilities/watermark';
import { ActionButtons } from '../ActionButtons';
import { Options } from '../Options';
import { SecondaryActionButtons } from '../SecondaryActionButtons';
import { RightSidebar } from '../RightSidebar';
import { v4 as uuidv4 } from 'uuid';
import { ArrowConfig } from 'konva/lib/shapes/Arrow';
import { LineConfig } from 'konva/lib/shapes/Line';
import { CircleConfig } from 'konva/lib/shapes/Circle';
import { RectConfig } from 'konva/lib/shapes/Rect';
import {
  BgLayer,
  cancelAllShapeDraggable,
  enableCNodeDraggable,
  initImage,
  parseAutoModel,
} from './utils';
import { IEditAction, NODE_OP_ENUMS } from './types';
import {
  CNode,
  CNodeType,
  appStateAtom,
  bgWidthAtom,
  comicPageSortingAtom,
  exportImageAtom,
  historyAtom,
  postGeneratedImageUrlsAtom,
  prevStepsAtom,
  profileAtom,
  redoStepsAtom,
  useAppStateAtom,
} from '../../state';
import {
  Button,
  Card,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';
import { useUpdateLayerPartially } from '../../hooks/useUpdateLayerPartially';
import { useUpdateAppState } from '../../hooks/useUpdateAppState';
import { useDeleteCNode } from '../../hooks/useDeleteCNode';
import {
  useCreateComicPage,
  createKonvaGroups4Children,
} from '../../hooks/useCreateComicPage';
import {
  getCNodeId,
  isComicBubble,
  isComicImage,
  isComicPage,
} from '../../helpers/id';
import { useReflushLayer } from '../../hooks/useReflushLayer';
import { useCreateComicImage } from '../../hooks/useCreateComicImage';
import { useCreateText } from '../../hooks/useCreateText';
import { useCreateBubble } from '../../hooks/useCreateBubble';
import { useCreateMarkArea } from '../../hooks/useCreateMarkArea';
import { useWaitingForImageCreatedByAI } from '../../hooks/useWaitingForImageCreatedByAI';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { throttle } from 'lodash-es';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { initAppState } from './initAppState';
import { loadState, saveState } from '../../utilities/idb';
import { useIndexedDB } from '../../hooks/useIndexedDB';
import { useTranslation } from 'react-i18next';
import { Promotion } from '../Header/Header';
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

interface InfCanvaProps {
  prompt?: string;
}

interface DrawingNode extends NodeConfig {
  child?: DrawingNode[];
  text?: string;
}

interface ScrollPos {
  x: number;
  y: number;
}

interface Touch {
  x: number;
  y: number;
}

export const InfCanva: React.FC<InfCanvaProps> = React.memo(
  function InfCanva() {
    const { t } = useTranslation(['create', 'toast']);

    //   useEffect(() => { const timeoutId = setTimeout(() => { if (typeof window !== 'undefined') {
    //     try { mixpanel.track('visit.page.publish', {}); console.log('tracking mixpanel'); }
    //     catch (error) { console.error('Mixpanel tracking failed:', error); } } }, 800);
    // return () => clearTimeout(timeoutId); }, []);

    const router = useRouter();
    const db = useIndexedDB();
    const [profile, setProfile] = useAtom(profileAtom);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const containerRef = useRef<HTMLDivElement>(null);
    const currentShapeRef = useRef<string>();
    const isPaintRef = useRef(false);
    const stageRef = useRef<any>();
    const layerRef = useRef<any>();
    const appStateRef = useRef<any>();
    // const transformerRef = useRef<Konva.Transformer>(null);
    const transformerRef = useRef<Konva.Transformer | null>(null);
    const [appState, setAppState] = useAtom(appStateAtom);
    const [useAppState, setUseAppState] = useAtom(useAppStateAtom);
    const [comicPageSorting, setComicPageSorting] =
      useAtom(comicPageSortingAtom);
    const [history, setHistory] = useAtom(historyAtom);
    const [exportImage, setExportImage] = useAtom(exportImageAtom);
    const [postGeneratedImageUrls, setPostGeneratedImageUrls] = useAtom(
      postGeneratedImageUrlsAtom,
    );
    const deleteCNode = useDeleteCNode();
    const updateLayerPartially = useUpdateLayerPartially(layerRef);
    const createComicPage = useCreateComicPage();
    const createComicImage = useCreateComicImage();
    const deSelect = useCallback(() => {
      transformerRef?.current?.nodes([]);
      setCurrentSelectedShape(undefined);
    }, []);
    const checkDeselect = useCallback(
      (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (clickedOnEmpty(e)) {
          deSelect();
        }
      },
      [stageRef, deSelect],
    );
    const createText = useCreateText(stageRef, appStateRef, deSelect);
    const createBubble = useCreateBubble();
    const createMarkArea = useCreateMarkArea();
    const reflushLayer = useReflushLayer(stageRef, appStateRef, deSelect);
    const updateAppState = useUpdateAppState();
    const waitingForImageCreatedByAI = useWaitingForImageCreatedByAI();
    const [prevSteps, setPrevSteps] = useAtom(prevStepsAtom);
    const [redoSteps, setRedoSteps] = useAtom(redoStepsAtom);
    const [bottomToolbarPosition, setbottomToolbarPosition] = useState({
      x: 0,
      y: 0,
    });
    const [disableBottomToolbar, setDisableBottomToolbar] = useState(false);

    const [displayComicBg, setDisplayComicBg] = useState(true);
    const [currentDrawnShape, setCurrentDrawnShape] = useState<DrawingNode>();

    const [drawAction, setDrawAction] = useState<DrawAction>(DrawAction.Select);
    const [bubbleImageUrl, setBubbleImageUrl] = useState('');
    const [bgWidth, setBgWidth] = useAtom(bgWidthAtom);
    const [bgHeight, setBgHeight] = useState(100000);

    // Mobile scrolling support
    const [scrollPos, setScrollPos] = useState<ScrollPos>({ x: 0, y: 0 });
    const [isScrolling, setIsScrolling] = useState<boolean>(false);
    const [lastTouch, setLastTouch] = useState<Touch | null>(null);
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(
      null,
    );
    const [isMobile, setIsMobile] = useState(false);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const [initialStageScale, setInitialStageScale] = useState(1);
    const isFirstRender = useRef(true);

    const [currentSelectedShape, setCurrentSelectedShape] = useState<{
      // controls the properties of the currently selected element
      type: DrawAction;
      id: string;
      node: Node<NodeConfig>; // the root node of the e.target, which might be a group
      originTargetAttrs?: DrawingNode; // attrs of e.target, which might be rect or bubble image
    }>();

    const [runTour, setRunTour] = useState(false);
    const tourSteps = [
      {
        target: '.canvaStage',
        content: t('infiniteCanvasDescription'),
        disableBeacon: true,
      },
      {
        target: '.canvaStage',
        content: t('scrollDownDescription'),
      },
      {
        target: '.ActionButtons',
        content: t('addPanelsDescription'),
      },
      {
        target: '.FoldupButton',
        content: t('foldupButtonDescription'),
      },
    ].slice(0, isMobile ? 4 : 3);

    // const handleJoyrideCallback = async (data: CallBackProps) => {
    //   const { status } = data;
    //   const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    //   if (finishedStatuses.includes(status)) {
    //     setRunTour(false);
    //     const res = await supabase.from("User").update({ tour_completed: true }).eq("id", profile.authUserId);
    //     console.log("Set tour completed", profile.authUserId, res, profile.authUserId)
    //   }
    // };
    // useEffect(() => {
    //   console.log("profile.tour_completed", profile)
    //   if (profile.authUserId && profile.authUserId !== "" && profile.tour_completed !== true) {
    //     setRunTour(true); // 在客户端渲染时启动Joyride
    //   }
    // }, [profile]);

    useEffect(() => {
      if (isFirstRender.current) {
        (async () => {
          // Init the canvas at first time rendering
          // const savedAppState = await loadState("appState")
          // const savedComicPageSorting = await loadState("comicPageSorting")
          // const savedAppState = localStorage.getItem("appState");
          // const savedComicPageSorting = localStorage.getItem("comicPageSorting");
          console.log('AAA', -1);
          if (appState && useAppState) {
            // If have appState and useAppState is true (transitioned from another page), use it
            console.log('AAA', 0);
            reflushLayer(layerRef.current, {
              appState: appState,
              comicPageSorting: null,
            });
            setUseAppState(false);
            isFirstRender.current = false;
          } else if (db) {
            console.log('AAA', 111);
            const savedAppState = await db.get('state', 'appState');
            console.log('savedAppState', savedAppState);
            const savedComicPageSorting = await db.get(
              'state',
              'comicPageSorting',
            );
            if (savedAppState && savedComicPageSorting) {
              // Ask user if they want to continue editing the previous comic
              console.log('AAA', 222);
              if (!router.query?.mediaUrl) {
                onOpen();
              }
            } else {
              console.log('AAA', 333);
              // haven't created anything previously, add the tutorial to the canvas
              !router?.query?.mediaUrl &&
                reflushLayer(layerRef.current, {
                  appState: initAppState,
                  comicPageSorting: null,
                });
            }
            isFirstRender.current = false;
          }
        })();
      } else {
        console.log({ prevSteps, appState });
        appStateRef.current = appState;

        // save appState to localStorage
        console.log('appState', appState);
        if (db) {
          (async () => {
            await db.put('state', appState, 'appState');
            await db.put('state', comicPageSorting, 'comicPageSorting');
            console.log('AAA', 888);
          })();
        }
      }
    }, [db, appState, comicPageSorting, router.query?.mediaUrl]);

    /// Handle initial setup and window resize
    // Ensure the stage is always centered and canvas starts at (0, 0)
    useEffect(() => {
      const handleResize = () => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        setWidth(windowWidth);
        setHeight(windowHeight);

        const isMobileView = windowWidth < 768;
        setIsMobile(isMobileView);
        const rightSidebarWidth = isMobileView ? 0 : 380; // 假设 RightSidebar 的宽度是 380px

        let scale = Math.min(
          (0.7 * (windowWidth - rightSidebarWidth)) / bgWidth,
          0.55,
        );
        setInitialStageScale(scale);

        const stage = stageRef.current;
        const container = containerRef.current;

        if (stage && container) {
          console.log(scale, stage.scaleX());
          if (stage.scaleX() != 1) scale = stage.scaleX();
          stage.width(container.offsetWidth);
          stage.height(container.offsetHeight);

          const offsetX =
            (container.offsetWidth + rightSidebarWidth - bgWidth * scale) / 2;
          stage.x(Math.max(offsetX, 0)); // 确保 x 位置不会超出窗口左侧
          console.log('resized', isMobile, rightSidebarWidth, scale);
        }
      };

      if (typeof window !== 'undefined') {
        handleResize(); // Ensure resize logic is applied on component mount
        stageRef.current.y(100); // ensure the top part of the canva is not hidden by header
        window.addEventListener('resize', handleResize);

        return () => {
          window.removeEventListener('resize', handleResize);
        };
      }
    }, [bgWidth, isMobile]);

    const hasImage = (nodes: any[]) => {
      return nodes?.some(node => {
        if (isComicImage(node) && !(node.attrs.visible === false)) {
          return true;
        } else if (isComicPage(node) && !(node.attrs.visible === false)) {
          return hasImage(node.children[1].children);
        }
        return false;
      });
    };

    // Check if all images are still being generated
    const shouldDisablePublish = () => {
      if (!layerRef?.current?.children) return false;

      const allImages: any[] = [];
      const nodes = layerRef.current.children;

      for (const node of nodes) {
        if (isComicImage(node) && !(node.attrs.visible === false)) {
          allImages.push(node);
        } else if (isComicPage(node) && !(node.attrs.visible === false)) {
          const groupChildren = node.children[1].children;
          for (const child of groupChildren) {
            if (isComicImage(child) && !(child.attrs.visible === false)) {
              allImages.push(child);
            }
          }
        }
      }

      // If there are no images, don't disable publish
      if (allImages.length === 0) {
        return false;
      }

      // Check if ALL images are still being generated (placeholders)
      const allImagesGenerating = allImages.every(image => {
        const imageUrl = image.attrs.image.src;

        // Check if the image is a placeholder (still being generated)
        const isPlaceholder =
          imageUrl.includes('purecolor.webp') ||
          imageUrl.includes('loading.webp') ||
          imageUrl.includes('placeholder.jpg') ||
          !imageUrl.startsWith('https');

        return isPlaceholder;
      });

      return allImagesGenerating;
    };

    const handleExport = async (margin: number = 0, post: boolean = true) => {
      // Generate the final image
      // TODO 导出前，hide所有隐藏的形状，导出后，恢复，目前不做也没有任何影响
      const stage = stageRef.current;

      // 保存当前缩放比例
      const originalScale = stage.scaleX();

      // 重置缩放比例到标准比例
      stage.scale({ x: 1, y: 1 });

      transformerRef.current && transformerRef.current.destroy();
      stageRef.current.add(layerRef.current);

      const boundingBox = layerRef.current.getClientRect();

      const uri = stageRef.current.toDataURL({
        x: boundingBox.x - margin,
        y: boundingBox.y - margin,
        width: boundingBox.width + 2 * margin,
        height: boundingBox.height + 2 * margin,
        pixelRatio: 1,
      });

      // 恢复原始缩放比例
      stage.scale({ x: originalScale, y: originalScale });

      // const finalUri = await generateWatermarkedImage(uri);
      const finalUri = uri;
      if (post) {
        if (!hasImage(layerRef?.current?.children)) {
          toastError(t('toast:error.noImageError'));
          return;
        }

        // This check is now handled by the disabled button state
        // The function should not be called when publish should be disabled

        setExportImage(finalUri);

        // Collect generated image urls
        const imageUrls: { id: number; url: string }[] = [];
        const allNodes = layerRef.current.children;
        // console.log('nodes', allNodes);
        for (const node of allNodes) {
          if (isComicImage(node) && !(node.attrs.visible === false)) {
            // const imageUrl = node.attrs.image.src;
            const newImageUrls = node.attrs.imageUrls;
            // if (imageUrl.startsWith('https')) {
            //   imageUrls.push({ id: -1, url: imageUrl });
            // }
            imageUrls.push(...newImageUrls);
          } else if (isComicPage(node) && !(node.attrs.visible === false)) {
            const groupChildren = node.children[1].children;
            for (const child of groupChildren) {
              if (isComicImage(child) && !(child.attrs.visible === false)) {
                const imageUrl = child.attrs.image.src;
                const newImageUrls = child.attrs.imageUrls;
                // if (imageUrl.startsWith('https')) {
                //   imageUrls.push({ id: -1, url: imageUrl });
                // }
                imageUrls.push(...newImageUrls);
              }
            }
          }
        }
        setPostGeneratedImageUrls(imageUrls);
        router.push('/publish');
      } else {
        downloadURI(finalUri, 'Komiko.png');
      }

      transformerRef.current = new Konva.Transformer();
      layerRef.current.add(transformerRef.current);
      currentSelectedShape?.node &&
        transformerRef.current.nodes([currentSelectedShape.node]);
    };

    const clickedOnEmpty = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
      console.log('clickedOnEmpty', e.target);
      return e.target === stageRef?.current;
    };

    const onDrawActionChange = async (id: DrawAction, imageUrl?: string) => {
      if (!isMobile) {
        // on computer, only change the draw action id
        setDrawAction(id);
      } else {
        // on mobile, instantly place the element on the canva
        const center = getCenter();
        let shape: Konva.Node | null = null;
        let newCNode: CNode | null = null;

        if (id === DrawAction.Text) {
          newCNode = {
            cType: CNodeType.COMIC_TEXT,
            attrs: {
              id: uuidv4(),
              x: center.x - 200,
              y: center.y - 500,
              text: t('editMe'),
              color: 'black',
              fontFamily: 'Wildwords',
              fontSize: 75,
              textAlign: 'left',
              stroke: 'white',
              strokeWidth: 0,
              draggable: true,
              name: DrawAction.Text,

              // onDblClick: (e: any) => handleTextDblClick(e),
            },
          };
          shape = await createText(newCNode);
          layerRef.current.add(shape);
          setTimeout(() => {
            shape?.attrs.onDblClick({ target: shape } as any);
          }, 0);
        } else if (id === DrawAction.Rectangle) {
          newCNode = {
            cType: CNodeType.COMIC_PAGE,
            attrs: {
              width: bgWidth == 0 ? 1024 : bgWidth,
              height: bgWidth == 0 ? 512 : bgWidth / 2,
              draggable: true,

              id: uuidv4(),
              x: 0,
              y: center.y - 600,
              scaleX: 1,
              scaleY: 1,
              stroke: 'black',
              strokeWidth: 8,
              fill: 'white',
              name: DrawAction.Rectangle,
            },
          };
          shape = await createComicPage(newCNode);
          layerRef.current.add(shape);
        } else if (id === DrawAction.Bubble) {
          if (bubbleImageUrl) {
            newCNode = {
              cType: CNodeType.COMIC_BUBBLE,
              attrs: {
                id: uuidv4(),
                x: center.x - 300,
                y: center.y - 600,
                scaleX: 1,
                scaleY: 1,
                strokeWidth: 0,
                draggable: true,
                name: DrawAction.Bubble,
                image: undefined,
                imageUrl: imageUrl ?? bubbleImageUrl,
              },
            };
            shape = await createBubble(newCNode);
            layerRef.current.add(shape);
          }
        }

        // Update the app state
        const _appState = deepClone(appState);
        if (newCNode) {
          updateAppState(_appState.concat(newCNode), comicPageSorting, {
            type: NODE_OP_ENUMS.NodeAdd,
            commitId: uuidv4(),
            parentCNodeId: 'Layer',
            new: {
              cnode: newCNode,
            },
          });
        }

        if (shape && drawAction != DrawAction.Text)
          handleStageOnClick({ target: shape }, true); // to select the element
      }
    };
    const onStageMouseUp = useCallback(async () => {
      isPaintRef.current = false;
      if (currentDrawnShape) {
        let shape: Konva.Node | null = null;
        let newCNode: CNode | null = null;

        if (drawAction === DrawAction.Text) {
          newCNode = {
            cType: CNodeType.COMIC_TEXT,
            attrs: {
              ...currentDrawnShape,
              draggable: true,
              // onDblClick: (e: any) => handleTextDblClick(e),
            },
          };
          shape = await createText(newCNode);
          layerRef.current.add(shape);
          setTimeout(() => {
            shape?.attrs.onDblClick({ target: shape } as any);
          }, 0);
        } else if (drawAction === DrawAction.Rectangle) {
          newCNode = {
            cType: CNodeType.COMIC_PAGE,
            attrs: {
              ...currentDrawnShape,
              width:
                currentDrawnShape.width! > 10
                  ? currentDrawnShape.width
                  : bgWidth,
              height:
                currentDrawnShape.height! > 10 ? currentDrawnShape.height : 800,
              draggable: true,
            },
          };
          shape = await createComicPage(newCNode);
          layerRef.current.add(shape);
        } else if (drawAction === DrawAction.Bubble) {
          if (bubbleImageUrl) {
            newCNode = {
              cType: CNodeType.COMIC_BUBBLE,
              attrs: {
                ...currentDrawnShape,
                draggable: true,
              },
              // children: [
              //   {
              //     cType: CNodeType.COMIC_TEXT,
              //     attrs: {
              //       id: uuidv4(),
              //       x: 0,
              //       y: 0,
              //       text: 'Double click\nto edit',
              //       color: "black",
              //       fontFamily: "Wildwords",
              //       fontSize: 70,
              //       textAlign: "center",
              //       stroke: "white",
              //       strokeWidth: 0,
              //       name: DrawAction.Text,
              //       draggable: true,
              //       onDblClick: handleTextDblClick,
              //     },
              //   }
              // ]
            };
            shape = await createBubble(newCNode);
            layerRef.current.add(shape);
          }
        } else if (drawAction === DrawAction.MarkArea) {
          newCNode = {
            cType: CNodeType.COMIC_MARK_AREA,
            attrs: {
              ...currentDrawnShape,
              draggable: true,
            },
          };
          const markRect = await createMarkArea(newCNode);
          layerRef.current.add(markRect);
        }

        // if (newCNode) {
        //   updateAppState(_appState.concat(newCNode), comicPageSorting, {
        //     type: NODE_OP_ENUMS.NodeAdd,
        //     commitId: uuidv4(),
        //     parentCNodeId: 'Layer',
        //     new: {
        //       cnode: newCNode
        //     }
        //   });
        // }

        // if ([
        //   DrawAction.Rectangle,
        //   DrawAction.Text,
        //   DrawAction.Bubble,
        //   DrawAction.MarkArea,
        // ].includes(drawAction)) {
        //   setDrawAction(DrawAction.Select);
        // }
        setDrawAction(DrawAction.Select);

        // Update the app state
        const _appState = deepClone(appState);
        if (newCNode) {
          updateAppState(_appState.concat(newCNode), comicPageSorting, {
            type: NODE_OP_ENUMS.NodeAdd,
            commitId: uuidv4(),
            parentCNodeId: 'Layer',
            new: {
              cnode: newCNode,
            },
          });
        }

        if (shape && drawAction != DrawAction.Text)
          handleStageOnClick({ target: shape }, true); // to select the element
      }
      setCurrentDrawnShape(undefined);
      setDisableBottomToolbar(false);

      if (currentSelectedShape) {
        updatebottomToolbarPosition(currentSelectedShape.node);
      }
    }, [currentDrawnShape, drawAction]);

    const updateCurrentDrawnShape = <T,>(updaterFn: (payload: T) => T) => {
      setCurrentDrawnShape(prevDrawnShape => {
        return {
          ...(prevDrawnShape || {}),
          ...updaterFn(prevDrawnShape as T),
        };
      });
    };

    const getRelativePointerPosition = (stage: any) => {
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = stage.getPointerPosition();
      return transform.point(pos);
    };

    const onStageMouseDown = (
      e: KonvaEventObject<MouseEvent | TouchEvent>,
      inputPos?: { x: number; y: number },
    ) => {
      setDisableBottomToolbar(true);
      checkDeselect(e); // deselect if clicked on empty canvas
      if (!inputPos && drawAction === DrawAction.Select) return;
      let pos;
      if (inputPos) {
        pos = inputPos;
      } else {
        const stage = stageRef?.current;
        pos = getRelativePointerPosition(stage);
      }
      const color = 'black';
      isPaintRef.current = true;
      const x = getNumericVal(pos.x);
      const y = getNumericVal(pos.y);
      const id = uuidv4();
      currentShapeRef.current = id;
      // Check if click is within the canvas area
      // const bgWidth = 1920;
      // const canvasHeight = 100000;

      // if (x < 0 || x > bgWidth || y < 0 || y > canvasHeight) {
      //   console.log('Out of range')
      //   isPaintRef.current = false;
      //   return;
      // }

      switch (drawAction) {
        case DrawAction.Scribble:
          updateCurrentDrawnShape<LineConfig>(() => ({
            id,
            points: [x, y, x, y],
            scaleX: 1,
            scaleY: 1,
            stroke: color,
            name: DrawAction.Scribble,
          }));
          break;
        case DrawAction.Rectangle: {
          updateCurrentDrawnShape<RectConfig>(() => ({
            id,
            height: 1,
            width: 1,
            x,
            y,
            scaleX: 1,
            scaleY: 1,
            stroke: color,
            strokeWidth: 8,
            fill: 'white',
            name: DrawAction.Rectangle,
          }));
          break;
        }
        case DrawAction.MarkArea: {
          updateCurrentDrawnShape<RectConfig>(() => ({
            id,
            height: 1,
            width: 1,
            x,
            y,
            scaleX: 1,
            scaleY: 1,
            stroke: color,
            strokeWidth: 2,
            dash: [10, 5],
            fill: 'transparent',
            name: DrawAction.Rectangle,
          }));
          break;
        }
        case DrawAction.Text: {
          // 添加文本的处理逻辑
          updateCurrentDrawnShape<Konva.TextConfig>(() => ({
            id,
            x,
            y,
            text: '',
            color: 'black',
            fontFamily: 'Wildwords',
            fontSize: 75,
            textAlign: 'left',
            stroke: 'white',
            strokeWidth: 0,
            draggable: true,
            name: DrawAction.Text,
          }));
          break;
        }
        case DrawAction.Bubble: {
          updateCurrentDrawnShape<Konva.ImageConfig>(() => ({
            id,
            x,
            y,
            // data: bubbleImageUrl,
            scaleX: 1,
            scaleY: 1,
            strokeWidth: 0,
            draggable: true,
            name: DrawAction.Bubble,
            image: undefined,
            imageUrl: bubbleImageUrl,
          }));
          break;
        }
      }
    };

    const onStageMouseMove = () => {
      if (drawAction === DrawAction.Select || !isPaintRef.current) return;
      const stage = stageRef?.current;
      const pos = getRelativePointerPosition(stage);
      const x = getNumericVal(pos.x);
      const y = getNumericVal(pos.y);
      switch (drawAction) {
        case DrawAction.Scribble: {
          updateCurrentDrawnShape<LineConfig>(prevScribble => ({
            points: [...(prevScribble.points || []), x, y],
          }));
          break;
        }
        case DrawAction.Circle: {
          updateCurrentDrawnShape<CircleConfig>(prevCircle => ({
            radius:
              ((x - (prevCircle.x || 0)) ** 2 +
                (y - (prevCircle.y || 0)) ** 2) **
              0.5,
          }));
          break;
        }
        case DrawAction.Rectangle:
        case DrawAction.MarkArea: {
          updateCurrentDrawnShape<RectConfig>(prevRectangle => ({
            height: y - (prevRectangle.y || 0),
            width: x - (prevRectangle.x || 0),
          }));
          break;
        }
        case DrawAction.Arrow: {
          updateCurrentDrawnShape<ArrowConfig>(prevArrow => ({
            points: [prevArrow?.points[0], prevArrow?.points[1], x, y],
          }));
          break;
        }
      }
    };

    // const handleTextDblClick = (e: KonvaEventObject<MouseEvent>) => {
    //   console.log(`handleTextDblClick`)
    //   const stage = stageRef.current;
    //   const textNode = e.target as Konva.Text;
    //   const absPos = textNode.getAbsolutePosition();
    //   const stageBox = stage.container().getBoundingClientRect();

    //   const textArea = document.createElement('textarea');
    //   document.body.appendChild(textArea);

    //   textArea.value = textNode.text();
    //   textArea.style.position = 'absolute';
    //   textArea.style.top = `${absPos.y + stageBox.top}px`;
    //   textArea.style.left = `${absPos.x + stageBox.left}px`;
    //   textArea.style.fontSize = `${textNode.fontSize() * stage.scaleX()}px`;
    //   textArea.style.border = 'none';
    //   textArea.style.padding = '0px';
    //   textArea.style.margin = '0px';
    //   textArea.style.overflow = 'hidden';
    //   textArea.style.background = 'none';
    //   textArea.style.outline = 'none';
    //   textArea.style.resize = 'none';
    //   textArea.style.lineHeight = `${textNode.lineHeight()}`;
    //   textArea.style.fontFamily = textNode.fontFamily();
    //   textArea.style.transformOrigin = 'left top';
    //   textArea.style.textAlign = textNode.align();
    //   textArea.style.color = textNode.fill().toString();
    //   textArea.style.stroke = textNode.stroke().toString();
    //   textArea.style.strokeWidth = `${textNode.strokeWidth() * stage.scaleX()}px`;
    //   textArea.style.transform = `rotate(${textNode.rotation()}deg)`;
    //   textArea.style.width = 'auto';
    //   textArea.style.height = 'auto';
    //   // textArea.cols = 1;
    //   // textArea.rows = 1;
    //   textArea.style.whiteSpace = 'pre';

    //   const adjustTextAreaSize = () => {
    //     textArea.style.height = 'auto';
    //     textArea.style.height = `${textArea.scrollHeight}px`;
    //     textArea.style.width = 'auto';
    //     textArea.style.width = `${textArea.scrollWidth}px`;
    //   };
    //   adjustTextAreaSize()
    //   textArea.addEventListener('input', adjustTextAreaSize);
    //   textArea.focus();
    //   textNode.text(""); // Don't display the actual Konva Text node
    //   deSelect();

    //   const findNodeById: any = (node: any, id: any) => {
    //     if (node.attrs.id === id) {
    //       return node;
    //     }
    //     if (node.children) {
    //       for (let child of node.children) {
    //         const result = findNodeById(child, id);
    //         if (result) {
    //           return result;
    //         }
    //       }
    //     }
    //     return null;
    //   };

    //   textArea.addEventListener('blur', () => {
    //     textNode.text(textArea.value);

    //     const _appState = deepClone(appStateRef.current);
    //     const CNodeId = getCNodeId(textNode.attrs.id);
    //     console.log("On blur", textNode.attrs.id, CNodeId);

    //     let oldCNode = null;
    //     for (let item of _appState) {
    //       oldCNode = findNodeById(item, CNodeId);
    //       if (oldCNode) break;
    //     }
    //     if (oldCNode) {
    //       const _oldCNode = deepClone(oldCNode);
    //       oldCNode.attrs.text = textNode.text();
    //       const _newCNode = deepClone(oldCNode);
    //       updateAppState(_appState, undefined, {
    //         type: NODE_OP_ENUMS.NodeAttrChange,
    //         commitId: uuidv4(),
    //         old: {
    //           cnode: _oldCNode
    //         },
    //         new: {
    //           cnode: _newCNode
    //         }
    //       });
    //       console.log(_oldCNode.attrs.text, 'o', _newCNode.attrs.text, 'n');
    //     }

    //     document.body.removeChild(textArea);
    //     // handleStageOnClick(e)
    //   });
    // };

    const isDraggable = false;

    let mouseCursor;
    switch (drawAction) {
      case DrawAction.Move: {
        mouseCursor = 'grab';
        break;
      }
      case DrawAction.Rectangle: {
        mouseCursor = 'crosshair';
        break;
      }
      case DrawAction.Bubble: {
        mouseCursor = 'crosshair';
        break;
      }
      case DrawAction.Text: {
        mouseCursor = 'crosshair';
        break;
      }
      case DrawAction.MarkArea: {
        mouseCursor = 'crosshair';
        break;
      }
      case DrawAction.ZoomIn: {
        mouseCursor = 'zoom-in';
        break;
      }
      case DrawAction.ZoomOut: {
        mouseCursor = 'zoom-out';
        break;
      }
    }
    // const [mouseCursor, setMouseCursor] = useState('default');

    // useEffect(() => {
    //   let cursor;
    //   switch (drawAction) {
    //     case DrawAction.Move:
    //       cursor = "grab";
    //       break;
    //     case DrawAction.Rectangle:
    //       cursor = "crosshair";
    //       break;
    //     case DrawAction.Bubble:
    //       cursor = "crosshair";
    //       break;
    //     case DrawAction.MarkArea:
    //       cursor = "crosshair";
    //       break;
    //     case DrawAction.ZoomIn:
    //       cursor = "zoom-in";
    //       break;
    //     case DrawAction.ZoomOut:
    //       cursor = "zoom-out";
    //       break;
    //     default:
    //       cursor = "default";
    //   }
    //   setMouseCursor(cursor);
    // }, [drawAction]);
    useEffect(() => {
      switch (drawAction) {
        case DrawAction.Select:
          enableCNodeDraggable(layerRef);
          break;
        default:
          break;
      }
    }, [drawAction]);

    const getShapeProps = useCallback(
      (shape: DrawingNode) => ({
        key: `group-${shape.id}`,
        id: `group-${shape.id}`,
        onClick: (e: KonvaEventObject<MouseEvent>) => {
          e.cancelBubble = true;
        },
        scaleX: shape.scaleX,
        scaleY: shape.scaleY,
        draggable: isDraggable,
        name: shape.name,
      }),
      [isDraggable],
    );

    const onSecondaryActionChange = useCallback(
      async (action: SecondaryAction) => {
        deSelect();
        switch (action) {
          case SecondaryAction.Undo:
            transformerRef?.current?.nodes([]);
            const diffItem = prevSteps.pop();
            if (diffItem) {
              updateLayerPartially(diffItem, 'undo');
              setPrevSteps(deepClone(prevSteps));
              setRedoSteps(deepClone(redoSteps.concat(diffItem)));
            }
            break;
          case SecondaryAction.Redo:
            const _version = redoSteps.pop();
            if (_version) {
              updateLayerPartially(_version, 'redo');
              setRedoSteps(deepClone(redoSteps));
              setPrevSteps(deepClone(prevSteps.concat(_version)));
            }
            break;
        }
      },
      [prevSteps, transformerRef.current, reflushLayer],
    );

    const onElementChange = (action: IEditAction) => {
      switch (action.type) {
        case 'setStyle':
          updateElement(currentSelectedShape?.node!, action.payload);
          break;
      }
    };

    function updateElement(node: Konva.Group | Konva.Node, attrs: any) {
      let _node;
      if (node instanceof Konva.Group) {
        _node = layerRef.current.find(
          `#${currentSelectedShape?.originTargetAttrs?.id}`,
        )[0];
      } else {
        _node = node;
      }
      console.log(node, _node);
      _node && _node.setAttrs(attrs);
      console.log(node, attrs);
      if (attrs.strokeWidth) {
        // Make sure the inner group doesn't exceed the stroke width
        _node = layerRef.current.find(
          `#images-wrapper-${currentSelectedShape?.originTargetAttrs?.id}`,
        )[0];
        _node &&
          _node.setAttrs({
            x: attrs.strokeWidth / 2,
            y: attrs.strokeWidth / 2,
            clip: {
              x: 0,
              y: 0,
              width: _node.attrs.width - attrs.strokeWidth,
              height: _node.attrs.height - attrs.strokeWidth,
            },
          });
      }
      // update appState
      const _appState = deepClone(appState);
      const CNodeId = getCNodeId(node.attrs.id);
      const oldCNode = _appState.find(i => i.attrs.id === CNodeId);
      const _oldCNode = deepClone(oldCNode);
      oldCNode && Object.assign(oldCNode.attrs, attrs);
      const _newCNode = deepClone(oldCNode);

      updateAppState(_appState, comicPageSorting, {
        type: NODE_OP_ENUMS.NodeAttrChange,
        commitId: uuidv4(),
        old: {
          cnode: _oldCNode,
        },
        new: {
          cnode: _newCNode,
        },
      });
    }

    const onDelete = () => {
      if (!currentSelectedShape) return;
      // 只隐藏，不然undo/redo不好处理一个已经删除的元素，因为id没了
      // hide() 和 visible(false)的区别是，hide() 不需要再导出时额外处理
      currentSelectedShape.node.visible(false);
      deSelect();
      transformerRef.current?.forceUpdate();
      deleteCNode(currentSelectedShape.node as any);
      layerRef.current.draw();
    };

    // Add keyboard shortcuts support
    useKeyboardShortcuts({
      onDelete: onDelete,
      onUndo: () => onSecondaryActionChange(SecondaryAction.Undo),
      onRedo: () => onSecondaryActionChange(SecondaryAction.Redo),
      onActionChange: onDrawActionChange,
      currentSelectedShape,
      prevSteps,
      redoSteps,
    });

    const onDuplicate = async () => {
      if (!currentSelectedShape) return;
      const offset = 10; // 向右下方偏移的距离
      let _newKonvaShape: any;
      let _originTargetAttrs;
      let newCNode: CNode;
      const _appState = deepClone(appState);

      // selected comic_page, clone it's content
      if (
        currentSelectedShape.node.attrs.cType == CNodeType.COMIC_PAGE ||
        currentSelectedShape.node.attrs.cType == CNodeType.COMIC_BUBBLE
      ) {
        const CNodeId = getCNodeId(currentSelectedShape.node.attrs.id);
        const oldCNode = _appState.find(i => i.attrs.id === CNodeId);
        if (oldCNode) {
          newCNode = deepClone(oldCNode);
          newCNode.attrs.x = oldCNode?.attrs.x! + offset;
          newCNode.attrs.y = oldCNode?.attrs.y! + offset;

          function assignNewIds(_CNode: CNode, newId: string) {
            _CNode.attrs.id = newId;
            let _sorting: Array<string>;
            // TODO 这儿再好好测试下
            // 复制的Comic_page,需要保证其内部元素的排序
            if (_CNode.childSorting) {
              _sorting = _CNode.childSorting;
            } else {
              _sorting = _CNode.children?.map(
                item => item.attrs.id,
              ) as string[];
            }
            _CNode.children &&
              _CNode.children.forEach(child => {
                const _newId = uuidv4();
                const _oldId = child.attrs.id;
                assignNewIds(child, _newId);
                if (_sorting && _sorting.length) {
                  const sortIdPosition = _sorting?.findIndex(
                    id => id === _oldId,
                  );
                  if (sortIdPosition > -1) {
                    _sorting[sortIdPosition!] = _newId;
                  }
                }
              });
            _CNode.childSorting = _sorting;
          }
          assignNewIds(newCNode, uuidv4());
          if (currentSelectedShape.node.attrs.cType == CNodeType.COMIC_PAGE) {
            _newKonvaShape = await createComicPage(newCNode);
          } else if (
            currentSelectedShape.node.attrs.cType == CNodeType.COMIC_BUBBLE
          ) {
            _newKonvaShape = await createBubble(newCNode);
          }
          updateAppState(_appState.concat(newCNode), undefined, {
            type: NODE_OP_ENUMS.NodeAdd,
            commitId: uuidv4(),
            parentCNodeId: 'Layer',
            new: {
              cnode: deepClone(newCNode),
            },
          });
        }
        layerRef.current.add(_newKonvaShape);
        console.log(_newKonvaShape);
        _newKonvaShape = _newKonvaShape?.children[0]; // select the first child, which is the rect or bubble
      } else {
        let elementCNode: CNode;
        if (currentSelectedShape?.node.parent instanceof Konva.Group) {
          // Selected shape inside group
          const konvaElementWrapper = currentSelectedShape?.node.parent;
          const konvaGroup = konvaElementWrapper.parent;
          const groupCNodeId = getCNodeId(konvaGroup!.attrs.id);
          const groupCNode = _appState.find(i => i.attrs.id === groupCNodeId);
          elementCNode = groupCNode?.children?.find(
            i => i.attrs.id === currentSelectedShape?.node.attrs.id,
          )!;

          const newCNode = deepClone(elementCNode);
          newCNode.attrs.x! += offset;
          newCNode.attrs.y! += offset;
          newCNode.attrs.id = uuidv4();
          if (currentSelectedShape.node.attrs.cType == CNodeType.COMIC_IMAGE) {
            _newKonvaShape = await createComicImage(newCNode);
          } else if (
            currentSelectedShape.node.attrs.cType == CNodeType.COMIC_TEXT
          ) {
            _newKonvaShape = await createText(newCNode);
          }
          konvaElementWrapper.add(_newKonvaShape!);
          groupCNode!.children!.push(newCNode);
          updateAppState(_appState, undefined, {
            type: NODE_OP_ENUMS.NodeAdd,
            commitId: uuidv4(),
            parentCNodeId: groupCNodeId,
            new: {
              cnode: deepClone(newCNode),
            },
          }); // 上面的操作都是针对js对象，所以此处appState可以直接用
        } else {
          elementCNode = _appState.find(
            i => i.attrs.id === currentSelectedShape?.node.attrs.id,
          )!;
          const newCNode = deepClone(elementCNode);
          newCNode.attrs.x! += offset;
          newCNode.attrs.y! += offset;
          newCNode.attrs.id = uuidv4();
          if (currentSelectedShape.node.attrs.cType == CNodeType.COMIC_IMAGE) {
            _newKonvaShape = await createComicImage(newCNode);
          } else if (
            currentSelectedShape.node.attrs.cType == CNodeType.COMIC_TEXT
          ) {
            _newKonvaShape = await createText(newCNode);
          }
          layerRef.current.add(_newKonvaShape);
          updateAppState(_appState.concat(newCNode), undefined, {
            type: NODE_OP_ENUMS.NodeAdd,
            commitId: uuidv4(),
            parentCNodeId: 'Layer',
            new: {
              cnode: newCNode,
            },
          });
        }
      }

      handleStageOnClick({ target: _newKonvaShape });
    };

    const onLayerChange = (action: LayerOptions) => {
      if (!currentSelectedShape?.node) return;
      const oldIndex = currentSelectedShape?.node.getZIndex();
      switch (action) {
        case LayerOptions.SendToBack: {
          currentSelectedShape?.node?.moveToBottom();
          break;
        }
        case LayerOptions.SendBackward: {
          currentSelectedShape?.node?.moveDown();
          break;
        }
        case LayerOptions.SendForward: {
          currentSelectedShape?.node?.moveUp();
          break;
        }
        case LayerOptions.SendToFront: {
          currentSelectedShape?.node?.moveToTop();
          break;
        }
      }
      const newIndex = currentSelectedShape?.node.getZIndex();
      console.log({ oldIndex, newIndex });

      function sortLayersChildren() {
        const _groups = currentSelectedShape?.node.parent
          ?.find('Group')
          .filter((i: any) => i.attrs && i.attrs.hasOwnProperty('cType'));
        const _images = currentSelectedShape?.node.parent
          ?.find('Image')
          .filter((i: any) => {
            return (
              i.attrs &&
              i.attrs.hasOwnProperty('cType') &&
              (!i.parent || i.parent instanceof Konva.Layer)
            );
          });
        const _texts = currentSelectedShape?.node.parent
          ?.find('Text')
          .filter((i: any) => {
            return (
              i.attrs &&
              i.attrs.hasOwnProperty('cType') &&
              (!i.parent || i.parent instanceof Konva.Layer)
            );
          });

        const siblings = _groups
          ?.concat(_images || [])
          .concat(_texts || [])
          .sort((a, b) => a.index - b.index);
        const childSorting: any = [];
        siblings?.forEach((konvaShape: Node) => {
          if (
            konvaShape.attrs.id &&
            konvaShape.attrs.id.indexOf('group') > -1
          ) {
            const CNodeId = getCNodeId(konvaShape.attrs.id);
            childSorting.push(CNodeId);
          } else {
            childSorting.push(konvaShape.attrs.id);
          }
        });
        updateAppState(deepClone(appState), childSorting, {
          type: NODE_OP_ENUMS.NodeMove,
          commitId: uuidv4(),
          old: {
            cnode: {
              cType: currentSelectedShape?.node.attrs.cType,
              attrs: {
                id: getCNodeId(currentSelectedShape?.node.attrs.id),
              },
            },
            zIndex: oldIndex,
          },
          new: {
            cnode: {
              cType: currentSelectedShape?.node.attrs.cType,
              attrs: { id: getCNodeId(currentSelectedShape?.node.attrs.id) },
            },
            zIndex: newIndex,
          },
        });
        console.log({ childSorting });
      }

      if (
        currentSelectedShape?.node.attrs.cType === CNodeType.COMIC_PAGE ||
        currentSelectedShape?.node.attrs.cType === CNodeType.COMIC_BUBBLE
      ) {
        sortLayersChildren();
      } else if (
        currentSelectedShape?.node.attrs.cType === CNodeType.COMIC_IMAGE ||
        currentSelectedShape?.node.attrs.cType === CNodeType.COMIC_TEXT
      ) {
        if (currentSelectedShape?.node.parent instanceof Konva.Group) {
          const _images = currentSelectedShape?.node.parent
            ?.find('Image')
            .filter((i: any) => i.attrs && i.attrs.hasOwnProperty('cType'));
          const _texts = currentSelectedShape?.node.parent
            ?.find('Text')
            .filter((i: any) => i.attrs && i.attrs.hasOwnProperty('cType'));
          const siblings = _images
            ?.concat(_texts)
            .sort((a, b) => a.index - b.index);
          const childSorting: any = [];
          siblings?.forEach((konvaShape: Node) => {
            childSorting.push(konvaShape.attrs.id);
          });
          const _appState = deepClone(appState);
          const parentCNodeId = getCNodeId(
            currentSelectedShape?.node.parent?.parent?.attrs.id,
          );
          const parentComicPageCNode = _appState.find(
            i => i.attrs.id === parentCNodeId,
          );
          if (parentComicPageCNode) {
            parentComicPageCNode.childSorting = childSorting;
            updateAppState(_appState, deepClone(comicPageSorting), {
              type: NODE_OP_ENUMS.NodeMove,
              commitId: uuidv4(),
              parentCNodeId,
              old: {
                cnode: {
                  cType: currentSelectedShape?.node.attrs.cType,
                  attrs: {
                    id: getCNodeId(currentSelectedShape?.node.attrs.id),
                  },
                },
                zIndex: oldIndex,
              },
              new: {
                cnode: {
                  cType: currentSelectedShape?.node.attrs.cType,
                  attrs: {
                    id: getCNodeId(currentSelectedShape?.node.attrs.id),
                  },
                },
                zIndex: newIndex,
              },
            });
          }
        } else {
          sortLayersChildren();
        }
      }

      transformerRef.current?.nodes([currentSelectedShape?.node]);
      transformerRef.current?.moveToTop();
    };
    const updatebottomToolbarPosition = (node: Node<NodeConfig>) => {
      if (!node) return;
      const { x, y, width, height } = node.getClientRect();
      setbottomToolbarPosition({
        x: x + width / 2,
        y: y + height,
      });
    };

    const onDragStart = (e: any) => {
      if (
        drawAction === DrawAction.Move &&
        !(e.target instanceof Konva.Stage)
      ) {
        cancelAllShapeDraggable(layerRef);
      }
      console.log('onDragStart', e, drawAction);
      if ([DrawAction.MarkArea].includes(drawAction)) {
        return;
      }

      setDisableBottomToolbar(true);
      handleStageOnClick(e);
    };

    const onDragEnd = (e: any) => {
      console.log('onDragEnd');
      const _appState = deepClone(appState);
      const _comicPageSorting = deepClone(comicPageSorting);
      let CNodeId = '';
      if (
        e.target.attrs.cType == CNodeType.COMIC_PAGE ||
        e.target.attrs.cType == CNodeType.COMIC_BUBBLE
      ) {
        CNodeId = getCNodeId(e.target.attrs.id);
        const CNode = _appState.find(i => i.attrs.id === CNodeId);
        if (CNode) {
          const _oldCNode = deepClone(CNode);
          CNode.attrs.x = e.target.attrs.x;
          CNode.attrs.y = e.target.attrs.y;
          updateAppState(_appState, _comicPageSorting, {
            type: NODE_OP_ENUMS.NodeTransform,
            commitId: uuidv4(),
            old: { cnode: _oldCNode },
            new: { cnode: deepClone(CNode) },
          });
        }
      } else if (
        e.target.attrs.cType == CNodeType.COMIC_IMAGE ||
        e.target.attrs.cType == CNodeType.COMIC_TEXT
      ) {
        CNodeId = e.target.attrs.id;
        if (e.target.parent instanceof Konva.Layer) {
          const elementCNode = _appState.find(i => i.attrs.id === CNodeId);

          if (elementCNode) {
            const _oldCNode = deepClone(elementCNode);
            elementCNode.attrs.x = e.target.attrs.x;
            elementCNode.attrs.y = e.target.attrs.y;
            updateAppState(_appState, _comicPageSorting, {
              type: NODE_OP_ENUMS.NodeTransform,
              commitId: uuidv4(),
              old: { cnode: _oldCNode },
              new: { cnode: deepClone(elementCNode) },
            });
          }
        } else {
          for (let i = 0; i < _appState.length; i++) {
            if (_appState[i].children) {
              const elementCNode = _appState[i].children?.find(
                i => i.attrs.id === CNodeId,
              );
              if (elementCNode) {
                const _oldCNode = deepClone(elementCNode);
                elementCNode.attrs.x = e.target.attrs.x;
                elementCNode.attrs.y = e.target.attrs.y;
                updateAppState(_appState, _comicPageSorting, {
                  type: NODE_OP_ENUMS.NodeTransform,
                  commitId: uuidv4(),
                  old: {
                    cnode: _oldCNode,
                  },
                  new: {
                    cnode: deepClone(elementCNode),
                  },
                });
                break;
              }
            }
          }
        }
      }
      layerRef.current.batchDraw();
      updatebottomToolbarPosition(e.target);
      setDisableBottomToolbar(false);
    };

    const onWheel = (e: any) => {
      e.evt.preventDefault();
      if (e.evt.ctrlKey) {
        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const mousePointTo = {
          x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
          y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
        };

        const newScale =
          e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x:
            -(mousePointTo.x - stage.getPointerPosition().x / newScale) *
            newScale,
          y:
            -(mousePointTo.y - stage.getPointerPosition().y / newScale) *
            newScale,
        };
        // setScrollPos(newPos)
        stage.position(newPos);
        stage.batchDraw();
      } else {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const newPos = {
          x: stage.x() - e.evt.deltaX / scale,
          y: stage.y() - e.evt.deltaY / scale,
        };
        // setScrollPos(newPos)
        stage.position(newPos);
        stage.batchDraw();
      }
      if (currentSelectedShape) {
        updatebottomToolbarPosition(currentSelectedShape.node);
      }
    };

    function handleStageOnClick(e: any, force?: boolean) {
      force = force ?? false;
      // Add transformer
      console.log(drawAction);
      if (
        drawAction !== DrawAction.Select &&
        drawAction !== DrawAction.Text &&
        !force
      )
        return;
      let currentTarget = e.target;
      console.log('currentTarget', currentTarget);
      // window.gg = currentTarget
      if (currentTarget instanceof Konva.Group) {
        // 点击的可能是group，没有xy属性 ，e.target才是真正的图形对象
        // 但是如果是一个group下有多个rect or image，那还是得取这个group的坐标
        currentTarget = currentTarget.children[0];
        // return
      }
      if (!(currentTarget instanceof Konva.Shape)) return;
      const type = currentTarget?.attrs?.name;
      const id = currentTarget?.attrs?.id;
      if (!transformerRef.current) {
        transformerRef.current = new Konva.Transformer();
        layerRef.current.add(transformerRef.current);
      }

      // Check for existing nodes before setting new ones
      transformerRef.current.nodes([]);
      if (
        [DrawAction.Rectangle, DrawAction.Bubble].includes(
          currentTarget.attrs.name,
        ) &&
        currentTarget.parent &&
        (isComicPage(currentTarget.parent) ||
          isComicBubble(currentTarget.parent))
      ) {
        currentTarget.draggable(false);
        const selectedShape = {
          type,
          id,
          node: currentTarget.parent, // 点击rect，选中它的group
          originTargetAttrs: {
            // 记录rect的数据
            ...currentTarget.attrs,
          },
        };
        console.log('selectedShape', selectedShape);
        setCurrentSelectedShape(selectedShape);
        currentTarget.parent.draggable(true);
        transformerRef.current?.nodes([currentTarget.parent]);
        // transformerRef.current.getLayer()?.batchDraw();
        transformerRef.current.moveToTop();
      } else {
        // Clicked on image/text/..., select itself
        setCurrentSelectedShape({
          type,
          id,
          node: currentTarget,
          originTargetAttrs: {
            ...currentTarget.attrs,
          },
        });
        currentTarget.draggable(true);
        if (e.target instanceof Konva.Text) {
          // 悲伤的故事，这里需要改变一下Text的fontSize，不然渲染不出来，暂时还不知道为啥
          const originalFontSize = e.target.attrs.fontSize;
          console.log(e.target.fontSize, 'currentTarget.fontSize --');
          e.target.setFontSize(originalFontSize + 1);
          e.target.setFontSize(originalFontSize);
        }

        transformerRef.current.nodes([currentTarget]);
        // transformerRef.current.getLayer()?.batchDraw();
        transformerRef.current.moveToTop();
      }
      if (currentTarget) {
        updatebottomToolbarPosition(currentTarget);
      }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
    };

    const renderCurrentDrawnShape = useCallback(
      (shape: DrawingNode, attachTransformer = true) => {
        const commonProps = {
          ...getShapeProps(shape),
        };
        let ShapeComponent;
        switch (shape.name) {
          case DrawAction.Rectangle:
            ShapeComponent = <KonvaRect {...shape} />;
            break;
          case DrawAction.Image:
            ShapeComponent = <KonvaImage {...shape} image={shape.image} />;
            break;
          case DrawAction.Scribble:
            ShapeComponent = (
              <KonvaLine lineCap='round' lineJoin='round' {...shape} />
            );
            break;
          case DrawAction.Text:
            ShapeComponent = (
              <KonvaText
                {...shape}
                draggable
                // onDblClick={(e) => handleTextDblClick(e)}
              />
            );
            break;
          default:
            ShapeComponent = null;
            break;
        }

        return (
          <>
            <Group
              {...commonProps}
              key={commonProps.id}
              clipFunc={ctx => {
                ctx.rect(shape.x!, shape.y!, shape.width!, shape.height!);
                ctx.clip();
              }}>
              {ShapeComponent}
            </Group>
          </>
        );
      },
      [getShapeProps], // , isDraggable, currentSelectedShape
    );

    const getCenter = () => {
      // calculate the center of the canvas
      const stage = stageRef.current;
      const scale = stage.scaleX();
      const { x: stageX, y: stageY } = stage.position();
      const centerX = (stage.width() / 2 - stageX) / scale;
      const centerY = (stage.height() / 2 - stageY) / scale;
      return { x: centerX, y: centerY };
    };

    // Shared function to add image to canvas
    const addImageToCanvas = useCallback(
      async (file: File, position?: { x: number; y: number }) => {
        const reader = new FileReader();

        reader.onload = async function () {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.src = reader.result as string;

          img.onload = async function () {
            const maxWidth = bgWidth;
            let width = img.width;
            let height = img.height;

            // Scale image if width exceeds maximum width
            if (width > maxWidth) {
              const scale = maxWidth / width;
              width = maxWidth;
              height = height * scale;
            }

            // Create temporary canvas for image compression
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size to new image size
            canvas.width = width;
            canvas.height = height;

            // Draw compressed image on canvas
            ctx?.drawImage(img, 0, 0, width, height);

            // Get compressed image DataURL
            const compressedImage = canvas.toDataURL('image/png');

            // Calculate position
            let posX, posY;
            if (position) {
              posX = position.x;
              posY = position.y;
            } else {
              // Use canvas center for upload button
              const center = getCenter();
              posX = center.x - width / 2;
              posY = center.y - height / 2;
            }

            const newCNode: any = {
              cType: CNodeType.COMIC_IMAGE,
              attrs: {
                id: uuidv4(),
                name: DrawAction.Image,
                cType: CNodeType.COMIC_IMAGE,
                draggable: true,
                x: posX,
                y: posY,
                imageUrls: [compressedImage],
                imageIndex: 0,
              },
              imageUrl: compressedImage,
            };

            const image = await createComicImage(newCNode);
            const _rect = image.getClientRect();
            newCNode.attrs = {
              ...newCNode.attrs,
              width: _rect.width,
              height: _rect.height,
            };
            image.width(_rect.width);
            image.height(_rect.height);
            layerRef.current.add(image);
            layerRef.current.draw();
            handleStageOnClick({ target: image }, true);

            updateAppState(deepClone(appState).concat(newCNode), undefined, {
              type: NODE_OP_ENUMS.NodeAdd,
              commitId: uuidv4(),
              new: {
                cnode: deepClone(newCNode),
              },
            });
          };
        };

        reader.readAsDataURL(file);
      },
      [bgWidth, createComicImage, appState, updateAppState, getCenter],
    );

    // Drag and drop image onto canva
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const stage = stageRef.current;
      const file = e.dataTransfer.files[0];

      if (!file) return;

      const pointerPos = stage.getPointerPosition();
      const scale = stage.scaleX();
      const stageX = stage.x();
      const stageY = stage.y();
      const posX = (pointerPos.x - stageX) / scale;
      const posY = (pointerPos.y - stageY) / scale;

      addImageToCanvas(file, { x: posX, y: posY });
    };

    // Handle image upload from button
    const handleImageUpload = useCallback(
      (file: File) => {
        addImageToCanvas(file); // Uses canvas center by default
      },
      [addImageToCanvas],
    );

    async function handleImageLoaded(
      imageUrls: { id: number; url: string }[],
      options: {
        replace?: boolean | string;
        updateSize?: boolean;
        imageSize?: { width: number; height: number };
        imageIndex?: number | undefined;
        prompt?: string;
        model?: string;
        selectedCharImages?: any[];
        referenceImage?: string;
        asyncImageFunc?: () => Promise<{
          imageUrls: { id: number; url: string }[];
        }>;
      },
    ) {
      const model = parseAutoModel({
        model: options.model ?? '',
        referenceImage: options.referenceImage ?? '',
        prompt: options.prompt ?? '',
      });
      // 如果当前选中的是图片，说明正在进行的就是针对图片的操作, scale / removeBG
      let imageUrl;
      if (options.asyncImageFunc) {
        // 如果传了这个函数，表示图片需要异步生成，先用一个临时图片占位
        imageUrl = TEMP_IMAGE_URL;
        imageUrls = [{ id: -1, url: imageUrl }];
      } else {
        if (typeof imageUrls === 'string') {
          imageUrl = imageUrls;
          imageUrls = [{ id: -1, url: imageUrl }];
        } else {
          imageUrl = imageUrls[0].url;
        }
      }

      const _appState = deepClone(appState);

      const center = getCenter();
      let centerX, centerY;
      if (isMobile) {
        centerX = center.x - 512;
        centerY = center.y - 1100;
      } else {
        centerX = center.x - 200;
        centerY = center.y - 500;
      }

      if (isComicImage(currentSelectedShape?.node) && options.replace) {
        // Selected an image, will replace it
        let imageCNode;
        let groupCNode;
        let groupCNodeId = '';

        // image.parent是image-groups
        // image.parent.parent 才是 ComicPage
        if (
          currentSelectedShape?.node?.parent?.parent &&
          isComicPage(currentSelectedShape?.node?.parent?.parent)
        ) {
          const konvaGroup = currentSelectedShape?.node.parent.parent;
          groupCNodeId = getCNodeId(konvaGroup.attrs.id);
          groupCNode = _appState.find(i => i.attrs.id === groupCNodeId);
          imageCNode = groupCNode?.children?.find(
            i => i.attrs.id === currentSelectedShape?.node.attrs.id,
          );
        } else {
          // 当前Image直接铺在layer上
          imageCNode = _appState.find(
            i => i.attrs.id === currentSelectedShape?.node.attrs.id,
          );
        }
        if (!imageCNode) return;
        const _oldImageCNode = deepClone(imageCNode);
        const imageObj = await initImage(imageUrl);

        const curNode: any = currentSelectedShape?.node;
        curNode?.image(imageObj);
        if (currentSelectedShape?.node)
          transformerRef.current?.nodes([currentSelectedShape?.node]);
        imageCNode!.imageUrl = imageUrl;
        let imageIndex;
        if (options.replace == 'extend') {
          // Extend imageUrls to include regenerated images
          imageIndex = imageCNode.attrs.imageUrls.length; // Append newly generated image after the existing images
          imageUrls = imageCNode.attrs.imageUrls.concat(imageUrls);
        } else if (options.replace == 'switch') {
          // Switch imageIndex (previous or next image)
          imageIndex = options.imageIndex;
          imageUrls = imageCNode.attrs.imageUrls;
        } else if (options.replace == 'refresh') {
          // Refresh the current image (like upscale or removeBG)
          imageIndex = 0;
          const oldImageUrls = imageCNode.attrs.imageUrls || [];
          imageUrls = [...imageUrls, ...oldImageUrls];
        }
        imageCNode.attrs.imageIndex = imageIndex;
        currentSelectedShape?.node?.setAttrs({
          // ...currentSelectedShape.node.attrs,
          imageIndex: imageIndex,
          imageUrls: imageUrls,
          // width: 1024,
          // height: 1024,
        });
        layerRef.current.batchDraw();
        updateAppState(_appState, undefined, {
          type: NODE_OP_ENUMS.NodeAttrChange,
          commitId: uuidv4(),
          parentCNodeId: groupCNodeId,
          old: {
            cnode: _oldImageCNode,
          },
          new: {
            cnode: deepClone(imageCNode),
          },
        });
        // konva image对象已经有了， CNode也添加到了appState中
        // 等ai生成图片后，分别替换二者就行了
        if (options.replace == 'extend') {
          waitingForImageCreatedByAI({
            asyncImageFunc: options.asyncImageFunc!,
            konvaImage: currentSelectedShape?.node!,
            CNode: imageCNode,
            transformerRef,
            model: model,
          });
        }
      } else if (
        currentSelectedShape?.node instanceof Konva.Group &&
        !isComicBubble(currentSelectedShape?.node)
      ) {
        // appState logic, add a new image in group

        // calculate image size so that it can fill the rectangle
        let imageWidth = currentSelectedShape.node.attrs.width;
        let imageHeight = currentSelectedShape.node.attrs.height;
        if (options.imageSize) {
          const ratioX =
            currentSelectedShape.node.attrs.width / options.imageSize.width;
          const ratioY =
            currentSelectedShape.node.attrs.height / options.imageSize.height;
          const ratio = Math.max(ratioX, ratioY);
          imageWidth = options.imageSize.width * ratio;
          imageHeight = options.imageSize.height * ratio;
        }

        const newCNode = {
          cType: CNodeType.COMIC_IMAGE,
          attrs: {
            id: uuidv4(),
            cType: CNodeType.COMIC_IMAGE,
            draggable: true,
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight,
            imageUrls: imageUrls,
            imageIndex: 0,
            prompt: options.prompt,
            model: options.model,
            selectedCharImages: options.selectedCharImages,
            referenceImage: options.referenceImage,
          },
          imageUrl: imageUrl,
        };

        const image = await createComicImage(newCNode);
        // layer logic
        let konvaGroup4Images: Konva.Group = currentSelectedShape?.node?.find(
          'Group',
        )[0] as Konva.Group;
        if (!konvaGroup4Images) {
          const newGroup = await createKonvaGroups4Children(
            newCNode,
            createComicImage,
            createText,
          );
          if (newGroup) {
            konvaGroup4Images = newGroup;
            currentSelectedShape?.node?.add(konvaGroup4Images);
          }
        }
        konvaGroup4Images?.add(image);
        handleStageOnClick({ target: image }, true);

        const CNodeId = getCNodeId(currentSelectedShape?.node.attrs.id);
        const CNode = _appState.find(i => i.attrs.id === CNodeId);
        if (CNode && !CNode?.children) {
          CNode.children = [];
        }
        CNode?.children?.push(newCNode);
        updateAppState(_appState, undefined, {
          type: NODE_OP_ENUMS.NodeAdd,
          commitId: uuidv4(),
          parentCNodeId: CNodeId,
          new: {
            cnode: deepClone(newCNode),
          },
        });
        waitingForImageCreatedByAI({
          asyncImageFunc: options.asyncImageFunc!,
          konvaImage: image,
          CNode: newCNode,
          transformerRef,
          model: model,
        });
      } else {
        // appState logic, add a new image on canvas (either haven't selected any shape or selected a shape but won't replace it)
        const newCNode = {
          cType: CNodeType.COMIC_IMAGE,
          attrs: {
            id: uuidv4(),
            cType: CNodeType.COMIC_IMAGE,
            draggable: true,
            x: centerX, // center of the canvas
            y: centerY,
            width: options.imageSize?.width,
            height: options.imageSize?.height,
            imageUrls: imageUrls,
            imageIndex: 0,
            prompt: options.prompt,
            model: options.model,
            selectedCharImages: options.selectedCharImages,
            referenceImage: options.referenceImage,
          },
          imageUrl: imageUrl,
        };
        const image = await createComicImage(newCNode);
        const _rect = image.getClientRect();
        newCNode.attrs.width = _rect.width;
        newCNode.attrs.height = _rect.height;
        image.width(_rect.width);
        image.height(_rect.height);
        layerRef.current.add(image);
        layerRef.current.draw();
        // transformerRef.current?.nodes([image])
        handleStageOnClick({ target: image }, true);

        updateAppState(_appState.concat(newCNode), undefined, {
          type: NODE_OP_ENUMS.NodeAdd,
          commitId: uuidv4(),
          new: {
            cnode: deepClone(newCNode),
          },
        });

        // konva image对象已经有了， CNode也添加到了appState中
        // 等ai生成图片后，分别替换二者就行了
        waitingForImageCreatedByAI({
          asyncImageFunc: options.asyncImageFunc!,
          konvaImage: image,
          CNode: newCNode,
          transformerRef,
          model: model,
        });
      }
    }

    function handleArchive() {
      setHistory(
        history.concat({
          versionId: new Date().getTime(),
          detail: {
            appState: deepClone(appState), // TODO,过滤， 把visible的cnode都删掉
            comicPageSorting: deepClone(comicPageSorting),
          },
        }),
      );
    }

    async function handleOnCheckoutVersion(versionId: any) {
      const { appState, comicPageSorting } = history.find(
        (h: any) => h.versionId == versionId,
      )?.detail as any;
      // you have to create a new transformerRef when rewrite layer
      transformerRef.current?.nodes([]);

      setPrevSteps([]);
      setRedoSteps([]);
      await reflushLayer(
        layerRef.current,
        deepClone({
          appState,
          comicPageSorting,
        }),
      );
    }

    const handleTouchMove = (e: any) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      const scale = stage.scaleX();
      if (e.evt.touches.length === 2) {
        // zoom canvas
        const stage = stageRef.current;
        const touch1 = e.evt.touches[0];
        const touch2 = e.evt.touches[1];

        const distX = touch1.clientX - touch2.clientX;
        const distY = touch1.clientY - touch2.clientY;
        const newDistance = Math.sqrt(distX * distX + distY * distY);

        if (lastTouchDistance !== null) {
          const scaleBy = newDistance / lastTouchDistance;
          const oldScale = stage.scaleX();
          const newScale = oldScale * scaleBy;

          const centerX = (touch1.clientX + touch2.clientX) / 2;
          const centerY = (touch1.clientY + touch2.clientY) / 2;

          const pointTo = {
            x: centerX / oldScale - stage.x() / oldScale,
            y: centerY / oldScale - stage.y() / oldScale,
          };

          const newPos = {
            x: -(pointTo.x - centerX / newScale) * newScale,
            y: -(pointTo.y - centerY / newScale) * newScale,
          };

          stage.scale({ x: newScale, y: newScale });
          stage.position(newPos);
          stage.batchDraw();
        }

        setLastTouchDistance(newDistance);
      } else if (e.evt.touches.length === 1 && isScrolling) {
        // scroll
        const touch = e.evt.touches[0];
        const { clientX, clientY } = touch;

        if (lastTouch) {
          const dx = clientX - lastTouch.x;
          const dy = clientY - lastTouch.y;

          // setScrollPos((prevPos) => ({
          //   x: prevPos.x + dx,
          //   y: prevPos.y + dy,
          // }));
          const stagePosition = stage.position();

          stage.position({
            x: stagePosition.x + dx,
            y: stagePosition.y + dy,
          });
        }

        setLastTouch({ x: clientX, y: clientY });
      }
    };

    const handleTouchStart = (e: any) => {
      e.evt.preventDefault(); // 阻止默认行为，例如滚动
      checkDeselect(e);
      if (e.evt.touches.length === 2) {
        setIsScrolling(false); // Disable scrolling when pinch zooming
      } else {
        if (!currentSelectedShape || clickedOnEmpty(e)) {
          // only scroll when no shape selected or clicked on empty
          setIsScrolling(true); // Enable scrolling with one finger
          const touch = e.evt.touches[0];
          setLastTouch({ x: touch.clientX, y: touch.clientY });
        }
      }
    };

    const handleTouchEnd = () => {
      setIsScrolling(false);
      setLastTouch(null);
      setLastTouchDistance(null);
    };

    useEffect(() => {
      if (
        [
          DrawAction.Rectangle,
          DrawAction.Text,
          DrawAction.Bubble,
          DrawAction.MarkArea,
        ].includes(drawAction)
      ) {
        // Cancel all draggable
        cancelAllShapeDraggable(layerRef);
      }
    }, [drawAction]);

    const runOnceRef = useRef(false);
    // 监听router.query.mediaUrl并加载图片到画布（避免重复渲染）
    useEffect(() => {
      if (runOnceRef.current) return;
      runOnceRef.current = true;
      const mediaUrl = router.query.mediaUrl as string | undefined;
      const generation_id = router.query.generation_id as string | undefined;
      if (mediaUrl && typeof window !== 'undefined') {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = mediaUrl;
        img.onload = () => {
          handleImageLoaded(
            [{ id: Number(generation_id) ?? -1, url: mediaUrl }],
            {
              imageSize: { width: img.width, height: img.height },
            },
          );
        };
        img.onerror = () => {
          toastError('Load image failed');
        };
        // 清除地址栏中的mediaUrl参数
        const { pathname, query } = router;
        if (query.mediaUrl) {
          router.replace({ pathname }, undefined, {
            shallow: true,
          });
        }
      }
    }, [router.query.mediaUrl, router.query.generation_id, handleImageLoaded]);

    return (
      <>
        {/* <Joyride
        callback={handleJoyrideCallback}
        continuous
        run={runTour}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={tourSteps}
        styles={{
          options: {
            zIndex: 10000,
          },
        }}
      /> */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement='center'>
          <ModalContent>
            {onClose => (
              <>
                {/* <ModalHeader className="flex flex-col gap-1">Modal Title</ModalHeader> */}
                <ModalBody className='my-4 caffelabs'>
                  {t('unfinishedStory')}
                  <Button
                    color='primary'
                    onClick={async () => {
                      // Restore saved appState
                      // const savedAppState = localStorage.getItem("appState");
                      // const savedComicPageSorting = localStorage.getItem("comicPageSorting");
                      // const savedAppState = await loadState("appState")
                      // const savedComicPageSorting = await loadState("comicPageSorting")
                      const savedAppState = await db.get('state', 'appState');
                      const savedComicPageSorting = await db.get(
                        'state',
                        'comicPageSorting',
                      );
                      // let _appState, _comicPageSorting;
                      // try {
                      //   _appState = JSON.parse(savedAppState!);
                      // } catch (error) {
                      //   console.error("Failed to parse saved appState:", error);
                      // }
                      // try {
                      //   _comicPageSorting = JSON.parse(savedComicPageSorting!);
                      // } catch (error) {
                      //   console.error("Failed to parse saved comicPageSorting:", error);
                      // }
                      reflushLayer(layerRef.current, {
                        appState: savedAppState,
                        comicPageSorting: savedComicPageSorting,
                      });
                      setTimeout(() => {
                        // 在当前场景中，layerRef的上一层是stage
                        //  在layer改变后并没有触发stage的更新，此处需要手动处理一下，
                        // 而且用setTimeout，确保在当前的micro task完成之后
                        stageRef.current?.batchDraw();
                      });
                      onClose();
                    }}>
                    {t('continueStory')}
                  </Button>
                  <Button
                    color='primary'
                    variant='flat'
                    onClick={() => {
                      reflushLayer(layerRef.current, {
                        appState: [],
                        comicPageSorting: null,
                      });
                      onClose();
                    }}>
                    {t('startNewStory')}
                  </Button>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
        <div
          ref={containerRef}
          className='fixed w-screen h-screen'
          onDrop={handleDrop}
          onDragOver={handleDragOver}>
          <Promotion />
          <div
            className='ActionButtons'
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'fixed',
              // top: "12px",
              width: '100%',
              zIndex: 100,
            }}>
            <ActionButtons
              onActionChange={onDrawActionChange}
              selectedAction={drawAction}
              setBubbleImageUrl={setBubbleImageUrl}
              handleExport={handleExport}
              isMobile={isMobile}
              shouldDisablePublish={shouldDisablePublish()}
              onImageUpload={handleImageUpload}
            />
          </div>
          {currentSelectedShape && (
            // <Box zIndex={1} left={4} pos="absolute" top="90px">
            <div
              className='flex fixed top-1/2 z-10 flex-col transform -translate-y-1/2 xs:top-1/4 xs:-translate-y-1/4 md:top-1/2 md:-translate-y-1/2'
              style={{
                right: isMobile ? 1 : 15,
              }}>
              <Options
                stage={stageRef.current}
                currentSelectedShape={currentSelectedShape}
                onElementChange={onElementChange}
                onImageLoaded={handleImageLoaded}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onLayerChange={onLayerChange}
                isMobile={isMobile}
              />
            </div>
          )}
          {!isMobile && (
            <div
              style={{
                zIndex: 1,
                right: '20px',
                position: 'absolute',
                bottom: '20px',
              }}>
              <SecondaryActionButtons
                onActionChange={onSecondaryActionChange}
              />
            </div>
          )}
          <RightSidebar
            onCheckoutVersion={handleOnCheckoutVersion}
            onArchive={handleArchive}
            currentSelectedShape={currentSelectedShape}
            onImageLoaded={handleImageLoaded}
            onElementChange={onElementChange}
            displayComicBg={displayComicBg}
            setDisplayComicBg={setDisplayComicBg}
            setBgWidth={setBgWidth}
            setBgHeight={setBgHeight}
            bgWidth={bgWidth}
            bgHeight={bgHeight}
            handleExport={handleExport}
            isMobile={isMobile}
          />

          <div className='fixed'>
            <Stage
              ref={stageRef}
              onClick={handleStageOnClick}
              onTap={handleStageOnClick}
              onMouseDown={onStageMouseDown}
              onMouseMove={onStageMouseMove}
              onMouseUp={onStageMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              draggable={drawAction === DrawAction.Move}
              width={width}
              height={height}
              scaleX={initialStageScale}
              scaleY={initialStageScale}
              style={{ cursor: mouseCursor }}
              className='bg-primary-50 canvaStage'
              onWheel={onWheel}
              x={scrollPos.x}
              y={scrollPos.y}>
              {displayComicBg && !isMobile && (
                <BgLayer width={bgWidth} height={bgHeight} />
              )}
              <Layer
                ref={layerRef}
                // clipX={0}
                // clipY={0}
                // clipWidth={1920}
                // clipHeight={100000}
              >
                {currentDrawnShape &&
                  renderCurrentDrawnShape(currentDrawnShape)}
              </Layer>
            </Stage>
          </div>
          {currentSelectedShape?.originTargetAttrs?.image &&
            !disableBottomToolbar &&
            currentSelectedShape?.node.attrs.imageUrls?.length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  left: bottomToolbarPosition.x,
                  top: bottomToolbarPosition.y,
                  transform: 'translate(-50%, 0)',
                }}>
                {/* Buttom toolbar for switching image index */}
                <Card className='mt-2'>
                  <div className='flex justify-between items-center p-2'>
                    <Button
                      size='sm'
                      className='w-7 h-7 bg-muted'
                      isIconOnly={true}
                      onClick={() => {
                        const nextIndex =
                          (currentSelectedShape?.node.attrs.imageIndex -
                            1 +
                            currentSelectedShape?.node.attrs.imageUrls.length) %
                          currentSelectedShape?.node.attrs.imageUrls.length;
                        console.log(nextIndex);
                        const imageUrl =
                          currentSelectedShape?.node.attrs.imageUrls[nextIndex];
                        handleImageLoaded([{ id: -1, url: imageUrl }], {
                          replace: 'switch',
                          imageIndex: nextIndex,
                        });
                      }}>
                      <FaAngleLeft className='w-3.5 h-3.5' />
                    </Button>
                    <div className='px-2'>
                      {1 + currentSelectedShape?.node.attrs.imageIndex} /{' '}
                      {`${currentSelectedShape?.node.attrs.imageUrls.length}`}
                    </div>
                    <Button
                      size='sm'
                      className='w-7 h-7 bg-muted'
                      isIconOnly={true}
                      onClick={() => {
                        const nextIndex =
                          (currentSelectedShape?.node.attrs.imageIndex + 1) %
                          currentSelectedShape?.node.attrs.imageUrls.length;
                        const imageUrl =
                          currentSelectedShape?.node.attrs.imageUrls[nextIndex]
                            .url;
                        handleImageLoaded([{ id: -1, url: imageUrl }], {
                          replace: 'switch',
                          imageIndex: nextIndex,
                        });
                      }}>
                      <FaAngleRight className='w-3.5 h-3.5' />
                    </Button>
                  </div>
                </Card>
              </div>
            )}
        </div>
      </>
    );
  },
);
