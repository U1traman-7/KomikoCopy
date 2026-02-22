import Konva from "konva"
import { CNode, CNodeType } from "../state"
import { useListenTransform } from "./useListenTransform"

export const useCreateMarkArea = () => {
  const listenTransform = useListenTransform()

  return async (cnode: CNode) => {
    let mainShape;
    mainShape = new Konva.Rect({
      id: cnode.attrs.id,
      cType: CNodeType.COMIC_MARK_AREA,
      name: cnode.attrs.name,
      width: cnode.attrs.width,
      height: cnode.attrs.height,
      fill: cnode.attrs.fill,
      stroke: cnode.attrs.stroke ? cnode.attrs.stroke : 'orange',
      strokeWidth: cnode.attrs.strokeWidth,
      draggable: false,
      x: cnode.attrs.x,
      y: cnode.attrs.y,
      dash: cnode.attrs.dash
    })
    mainShape.zIndex(0)

    listenTransform(mainShape)

    return mainShape
  }
}