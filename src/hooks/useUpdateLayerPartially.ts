import { useAtom } from "jotai";
import { IDiffItem, NODE_OP_ENUMS } from "../Components/InfCanva/types";
import { CNodeType, appStateAtom } from "../state";
import Konva from "konva";
import { getComicPageGroupIdOfCNode } from "../helpers/id";
import { initImage } from "../Components/InfCanva/utils";
import { pick } from 'lodash-es'
export const useUpdateLayerPartially = (layerRef: React.MutableRefObject<Konva.Layer>) => {
    const [_, setAppState] = useAtom(appStateAtom)
    return async (diffItem: IDiffItem, type: 'undo' | 'redo') => {
        let CNodeId
        let konvaShape: any
        let destCNode
        let parentKonvaShape: Konva.Shape | Konva.Group

        switch (diffItem.type) {
            case NODE_OP_ENUMS.NodeAttrChange:
                if (type == 'undo') {
                    destCNode = diffItem.old?.cnode!
                } else {
                    destCNode = diffItem.new?.cnode!
                }
                CNodeId = diffItem.old?.cnode?.attrs.id;
                konvaShape = layerRef.current.find(`#${CNodeId}`)[0]

                // 这里不能简单的把CNode.attrs赋给konvaShape，需要取一下
                const changedAttrs = [
                    // rect only
                    'strokeWidth',
                    'fill',
                    // all
                    'width',
                    'height',

                    // text only
                    'fontSize',
                    'fontFamily',
                    'align'
                ]
                const destCNodeAttrs = Object.keys(destCNode.attrs);
                const intersection = destCNodeAttrs.filter(attr => changedAttrs.includes(attr));
                konvaShape.setAttrs(pick(destCNode.attrs, intersection))

                if (destCNode.cType === CNodeType.COMIC_TEXT) {
                    konvaShape.text(destCNode.attrs.text)
                } else if (destCNode.cType === CNodeType.COMIC_IMAGE) {
                    if (diffItem.old?.cnode?.imageUrl !== diffItem.new?.cnode?.imageUrl) {
                        const image = await initImage(destCNode?.imageUrl!)
                        konvaShape.image(image)
                    } else if (destCNode?.attrs?.imageUrls && diffItem.old?.cnode?.attrs.imageIndex !== diffItem.new?.cnode?.attrs.imageIndex) {
                        const image = await initImage(destCNode?.attrs.imageUrls[destCNode.attrs.imageIndex!])
                        konvaShape.image(image)
                    }
                }
                break;
            case NODE_OP_ENUMS.NodeTransform:
                if (type == 'undo') {
                    destCNode = diffItem.old?.cnode!
                } else {
                    destCNode = diffItem.new?.cnode!
                }
                CNodeId = diffItem.old?.cnode?.attrs.id;

                let konvaGroupShape
                if (diffItem.old?.cnode?.cType === CNodeType.COMIC_PAGE || diffItem.old?.cnode?.cType === CNodeType.COMIC_BUBBLE) {
                    konvaGroupShape = layerRef.current.find(`#group-${CNodeId}`)[0]
                } else if (diffItem.old?.cnode?.cType === CNodeType.COMIC_IMAGE || diffItem.old?.cnode?.cType === CNodeType.COMIC_TEXT) {
                    konvaGroupShape = layerRef.current.find(`#${CNodeId}`)[0]
                }
                konvaGroupShape?.setAttrs({
                    scaleX: destCNode.attrs.scaleX,
                    scaleY: destCNode.attrs.scaleY,
                    skewX: destCNode.attrs.skewX,
                    skewY: destCNode.attrs.skewY,
                    rotation: destCNode.attrs.rotation,
                    x: destCNode.attrs.x,
                    y: destCNode.attrs.y,
                })
                break;
            case NODE_OP_ENUMS.NodeAdd:
                CNodeId = diffItem.new?.cnode?.attrs?.id;
                if ([CNodeType.COMIC_IMAGE, CNodeType.COMIC_TEXT].includes(diffItem.new?.cnode?.cType!)) {
                    konvaShape = layerRef.current.find(`#${CNodeId}`)[0]
                } else if (diffItem.new?.cnode?.cType == CNodeType.COMIC_PAGE || diffItem.new?.cnode?.cType == CNodeType.COMIC_BUBBLE) {
                    konvaShape = layerRef.current.find(`#${getComicPageGroupIdOfCNode(CNodeId!)}`)[0]
                }
                if (type === 'undo') {
                    konvaShape.visible(false)
                } else if (type === 'redo') {
                    konvaShape.visible(true)
                }
                break
            case NODE_OP_ENUMS.NodeRemove:
                destCNode = diffItem.old?.cnode
                if (destCNode?.cType === CNodeType.COMIC_PAGE || destCNode?.cType === CNodeType.COMIC_BUBBLE) {
                    konvaShape = layerRef.current.find(`#${getComicPageGroupIdOfCNode(destCNode?.attrs.id!)}`)[0]
                } else {
                    konvaShape = layerRef.current.find(`#${destCNode?.attrs.id}`)[0]
                }
                if (type === 'undo') {
                    konvaShape.visible(true)
                } else {
                    konvaShape.visible(false)
                }
                break;
            case NODE_OP_ENUMS.NodeMove:
                destCNode = diffItem.old?.cnode
                if (destCNode?.cType === CNodeType.COMIC_PAGE || destCNode?.cType === CNodeType.COMIC_BUBBLE) {
                    konvaShape = layerRef.current.find(`#${getComicPageGroupIdOfCNode(destCNode?.attrs.id!)}`)[0]
                } else {
                    konvaShape = layerRef.current.find(`#${destCNode?.attrs.id}`)[0]
                }
                if (type === 'undo') {
                    konvaShape.setZIndex(diffItem.old?.zIndex)
                } else {
                    konvaShape.setZIndex(diffItem.new?.zIndex)
                }
                break;
        }
        layerRef.current.batchDraw()
    }
}
