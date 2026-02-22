import { CNode, CNodeType } from "../state"
import { useListenTransform } from "./useListenTransform"
import { useCreateComicImage } from "./useCreateComicImage"
import { useCreateText } from "./useCreateText"
import { DrawAction } from "../constants"


export const useCreateComicPage = () => {
  const listenTransform = useListenTransform()
  const createComicImage = useCreateComicImage()
  const createComicText = null; //useCreateText()

  return async (cnode: CNode) => {
    // 服务端安全检查
    if (typeof window === 'undefined') {
      return null;
    }

    const Konva = (await import('konva')).default;
    
    let mainShape = new Konva.Rect({
      id: cnode.attrs.id,
      name: cnode.attrs.name,
      width: cnode.attrs.width,
      height: cnode.attrs.height,
      fill: cnode.attrs.fill,
      stroke: cnode.attrs.stroke ? cnode.attrs.stroke : 'orange',
      strokeWidth: cnode.attrs.strokeWidth,
      draggable: false,
      strokeScaleEnabled: false,
      x: 0,
      y: 0,
    })
    const group = new Konva.Group({
      id: `group-${cnode.attrs.id}`,
      cType: CNodeType.COMIC_PAGE,
      draggable: true,
      // name: cnode.attrs.name,
      width: mainShape!.getClientRect().width,
      height: mainShape!.getClientRect().height,
      rotation: cnode.attrs.rotation,
      skewX: cnode.attrs.skewX, //,
      skewY: cnode.attrs.skewY,
      // 这两个不要
      scaleX: cnode.attrs.scaleX,
      scaleY: cnode.attrs.scaleY,
      x: cnode.attrs.x,
      y: cnode.attrs.y,
      clip: {
        x: 0,
        y: 0,
        width: cnode.attrs.width,
        height: cnode.attrs.height,
      },
    })
    listenTransform(group)
    group.add(mainShape!)

    if (cnode.children) {
      const konvaGroupWithChildren = await createKonvaGroupWithChildren(cnode, createComicImage, createComicText)
      if (konvaGroupWithChildren) group.add(konvaGroupWithChildren)
    } else {
      const konvaGroups4Children = await createKonvaGroups4Children(cnode, createComicImage, createComicText)
      if (konvaGroups4Children) group.add(konvaGroups4Children)
    }
    // mainShape = new Konva.Rect({
    //   id: cnode.attrs.id,
    //   name: cnode.attrs.name,
    //   width: cnode.attrs.width,
    //   height: cnode.attrs.height,
    //   fill: "transparent",
    //   stroke: cnode.attrs.stroke ? cnode.attrs.stroke : 'orange',
    //   strokeWidth: cnode.attrs.strokeWidth,
    //   draggable: false,
    //   x: 0,
    //   y: 0,
    // })
    // group.add(mainShape)
    // console.log(mainShape, group)
    return group
  }
}


export async function createKonvaGroups4Children(cnode: CNode, createComicImage: any, createComicText: any) {
  if (typeof window === 'undefined') return null;
  const Konva = (await import('konva')).default;
  
  const konvaGroups4Children = new Konva.Group({
    id: `images-wrapper-${cnode.attrs.id}`,
    draggable: false,
    width: cnode.attrs.width,
    height: cnode.attrs.height,
    x: (cnode.attrs.strokeWidth || 0) / 2,
    y: (cnode.attrs.strokeWidth || 0) / 2,
    clip: {
      x: 0,
      y: 0,
      width: cnode.attrs.width! - cnode.attrs.strokeWidth,
      height: cnode.attrs.height! - cnode.attrs.strokeWidth,
    },
  })
  return konvaGroups4Children
}
export async function createKonvaGroupWithChildren(cnode: CNode, createComicImage: any, createComicText: any) {
  if (typeof window === 'undefined') return null;

  let stateIdMap: any = {}
  let sortedChildren: any = []
  if (cnode.childSorting) {
    cnode.children!.forEach((i: CNode) => {
      stateIdMap[i.attrs.id!] = i
    })
    for (let i = 0; i < cnode.childSorting.length; i++) {
      const childId = cnode.childSorting![i]
      sortedChildren.push(stateIdMap[childId])
    }
  } else {
    sortedChildren = cnode.children
  }

  const konvaGroups4Children = await createKonvaGroups4Children(cnode, createComicImage, createComicText)
  if (!konvaGroups4Children) return null;

  for (const item of sortedChildren) {
    // visiable false 的node都扔掉
    if(item.visible === false) {
      continue
    }
    if (item.cType === CNodeType.COMIC_IMAGE) {
      const childImage = await createComicImage(item)
      if (childImage) konvaGroups4Children.add(childImage)
    } else if (item.cType === CNodeType.COMIC_TEXT) {
      const childText = await createComicText(item)
      if (childText) {
        if (item.attrs.x === 0) {
          // initial creation, put text in center
          console.log(5)
          const textWidth = childText.getClientRect().width;
          const textHeight = childText.getClientRect().height;
          childText.x((cnode.attrs.width! - textWidth) / 2);
          childText.y((cnode.attrs.height! - textHeight) / 2);
          console.log(6, childText)
        }
        konvaGroups4Children.add(childText)
      }
    }
  }
  return konvaGroups4Children;
}
