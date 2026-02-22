// import Konva from "konva" // 移除静态导入避免被打包到主bundle
import { CNodeType } from "../state"

/**
 * cnode_id: CNode的id，uuidv4，无任何前缀
 */
export const getImagesWrapperIdOfCNode = (cnode_id: string): string => {
    return `images-wrapper-${cnode_id}`
}

/**
* cnode_id: CNode的id，uuidv4，无任何前缀
*/
export const getComicPageGroupIdOfCNode = (cnode_id: string): string => {
    return `group-${cnode_id}`
}
export const getCNodeId = (s: string) => {
    return s.split('group-')[1] || s.split('images-wrapper-')[1] || s
}

// 使用any类型替代Konva.Node以避免静态导入
export function isComicPage(konvaNode: any) {
    return konvaNode && konvaNode.attrs.cType === CNodeType.COMIC_PAGE
}

export function isComicImage(konvaNode?: any) {
    return konvaNode && konvaNode.attrs.cType === CNodeType.COMIC_IMAGE
}

export function isComicBubble(konvaNode: any) {
    return konvaNode && konvaNode.attrs.cType === CNodeType.COMIC_BUBBLE
}