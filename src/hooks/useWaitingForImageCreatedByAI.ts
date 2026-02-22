/* eslint-disable */
import { useAtom } from 'jotai';
import { useRef, useEffect } from 'react';
import { appStateAtom } from '../state';
import { deepClone } from '../utilities';
import { useUpdateAppState } from './useUpdateAppState';
import { initImage } from '../Components/InfCanva/utils';

export function useWaitingForImageCreatedByAI() {
  const [appState] = useAtom(appStateAtom);
  const appStateRef = useRef(appState);
  const updateAppState = useUpdateAppState();

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  return ({
    asyncImageFunc,
    konvaImage,
    CNode,
    transformerRef,
    model,
  }: {
    asyncImageFunc: () => Promise<{ imageUrls: { id: number; url: string }[] }>;
    konvaImage: any;
    CNode: any;
    transformerRef?: any;
    model?: string;
  }) => {
    if (asyncImageFunc) {
      asyncImageFunc()
        .then(async res => {
          // asyncImageFunc is defined in InfCanva/utils and other generate image functions
          console.log({ res, konvaImage, CNode });
          const _imageObj = await initImage(
            res.imageUrls[konvaImage.attrs.imageIndex].url,
          );
          konvaImage.image(_imageObj);
          konvaImage.attrs.imageUrls = res.imageUrls;
          if (model === 'Gemini') {
            const x = konvaImage.getAttr('x');
            const y = konvaImage.getAttr('y');
            const width = konvaImage.getAttr('width');
            const height = konvaImage.getAttr('height');
            // 找到中心点
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            konvaImage.attrs.width = _imageObj.width;
            konvaImage.attrs.height = _imageObj.height;
            // 调整图片到原中心点位置
            konvaImage.setAttrs?.({
              x: centerX - _imageObj.width / 2,
              y: centerY - _imageObj.height / 2,
              width: _imageObj.width,
              height: _imageObj.height,
            });
            transformerRef?.current?.forceUpdate?.();
          }
          // console.log('transformerRef', transformerRef?.current)
          // konvaImage.attrs.imageIndex = 0;
          const CNodeId = CNode.attrs.id;
          let _CNode = appStateRef.current.find(i => i.attrs.id === CNodeId);
          if (!_CNode) {
            console.log(2);
            for (let i = 0; i < appStateRef.current.length; i++) {
              _CNode = appStateRef.current[i].children?.find(
                cd => cd.attrs.id === CNodeId,
              );
              if (_CNode) {
                break;
              }
            }
          }
          if (_CNode) {
            _CNode.imageUrl = res.imageUrls[0].url;
            _CNode.attrs.imageUrls = res.imageUrls;
            // _CNode.attrs.imageIndex = 0;
          }
          // No need to update undo here
          updateAppState(deepClone(appStateRef.current));
        })
        .catch(e => {
          // alert(e?.message);
          console.error(e);
        });
    }
  };
}
