import { useAtom } from "jotai";
import Konva from "konva";
import { useRef, useEffect } from "react";
import { NODE_OP_ENUMS } from "../Components/InfCanva/types";
import { getCNodeId } from "../helpers/id";
import { appStateAtom } from "../state";
import { deepClone } from "../utilities";
import { useUpdateAppState } from "./useUpdateAppState";
import { v4 as uuidv4 } from "uuid";

export function useDeleteCNode() {
  const [appState] = useAtom(appStateAtom)
  const appStateRef = useRef(appState);
  const updateAppState = useUpdateAppState()

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  return (konvaNode: Konva.Group | Konva.Image | Konva.Text) => {
    const _appState = deepClone(appStateRef.current)
    let parentCNodeId = 'Layer'
    let _oldCNode
    if (konvaNode instanceof Konva.Group) {
      const CNodeId = getCNodeId(konvaNode.attrs.id)
      let idx = _appState.findIndex((i: any) => i.attrs.id === CNodeId)
      _oldCNode = deepClone(_appState[idx])
      _appState[idx].visible = false
    } else if (konvaNode instanceof Konva.Image) {
      const res = deleteImageCNodeFromAppState(konvaNode, _appState)
      parentCNodeId = res.parentCNodeId
      _oldCNode = res.cnode
    } else if (konvaNode instanceof Konva.Text) {
      // 为了方便debug，此处的每一种CNode尽量单独处理，后面有时间写单元测试的话再考虑合并逻辑
      const CNodeId = getCNodeId(konvaNode.attrs.id)
      let idx = _appState.findIndex((i: any) => i.attrs.id === CNodeId)
      _oldCNode = deepClone(_appState[idx])
      _appState[idx].visible = false
    }
    updateAppState(_appState, undefined, {
      type: NODE_OP_ENUMS.NodeRemove,
      commitId: uuidv4(),
      parentCNodeId,
      old: {
        cnode: deepClone(_oldCNode)
      },
      new: {
        cnode: undefined
      }
    })
  }
}


function deleteImageCNodeFromAppState(knovaImage: Konva.Image, appState: any) {
  const CNodeId = knovaImage.attrs.id
  let idx = appState.findIndex((i: any) => i.attrs.id === CNodeId)
  let parentCNodeId // 被删除cnode所属的group，如果为 undefined，说明当前删除节点时Layer的直接子节点
  let cnode // 被删除的cnode
  if (idx > -1) {
    cnode = deepClone(appState[idx])
    appState[idx].visible = false

  } else {
    for (let i = 0; i < appState.length; i++) {
      let cnodeIndex
      if (appState[i].children) {
        cnodeIndex = appState[i].children?.findIndex((i: any) => i.attrs.id === CNodeId)
      }
      if (cnodeIndex > -1) {
        cnode = deepClone(appState[i].children[cnodeIndex])
        parentCNodeId = appState[i].attrs.id
        appState[i].children[cnodeIndex].visible = false

        break
      }
    }
  }
  return { parentCNodeId, cnode }
}