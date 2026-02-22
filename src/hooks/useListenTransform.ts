import { useAtom } from "jotai";
import { useRef, useEffect } from "react";
import { NODE_OP_ENUMS } from "../Components/InfCanva/types";
import { getCNodeId } from "../helpers/id";
import { appStateAtom, comicPageSortingAtom } from "../state";
import { deepClone } from "../utilities";
import { v4 as uuidv4 } from "uuid";
import { useUpdateAppState } from "./useUpdateAppState";
import { CNode } from "../state"

export function useListenTransform() {
  const [appState] = useAtom(appStateAtom)
  const [comicPageSorting, setComicPageSorting] = useAtom(comicPageSortingAtom)
  const appStateRef = useRef(appState);
  const comicPageSortingRef = useRef(comicPageSorting);
  const updateAppState = useUpdateAppState()

  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    comicPageSortingRef.current = comicPageSorting;
  }, [comicPageSorting]);

  return (konvaNode: any) => {
    console.log('listening')
    konvaNode.on('transformend', function () {
      let CNodeId = '', CNode: any
      let _oldCNode

      const _appState = deepClone(appStateRef.current)
      const _comicPageSorting = deepClone(comicPageSortingRef.current)
      if (konvaNode.className === 'Group') {
        // Group 找到它下面的第一级 Konva.Rect,调整其 stokeWidth
        // const subRect = konvaNode.children[0]
        // var scaleX = konvaNode.scaleX();
        // var scaleY = konvaNode.scaleY();
        // 动态调整 strokeWidth 以保持边框视觉不变
 
        CNodeId = getCNodeId(konvaNode.attrs.id)
        const _CNode = _appState.find(i => i.attrs.id === CNodeId)
        _oldCNode = deepClone(_CNode)
        if (_CNode) {
          updateCNode(_CNode, konvaNode)
          updateAppState(
            _appState,
            _comicPageSorting,
            {
              type: NODE_OP_ENUMS.NodeTransform,
              commitId: uuidv4(),
              old: {
                cnode: _oldCNode
              },
              new: {
                cnode: deepClone(_CNode)
              }
            }
          )
        }
      } else if (konvaNode.className === 'Image' || konvaNode.className === 'Text') {
        CNodeId = konvaNode.attrs.id
        if (konvaNode.parent && konvaNode.parent.className === 'Group') { // Rect内部的image
          for (let i = 0; i < _appState.length; i++) {
            let _CNode = _appState[i].children?.find(i => i.attrs.id === CNodeId)
            _oldCNode = deepClone(_CNode)
            if (_CNode) {
              CNode = updateCNode(_CNode, konvaNode)
              updateAppState(
                _appState,
                undefined,
                {
                  type: NODE_OP_ENUMS.NodeTransform,
                  commitId: uuidv4(),
                  old: {
                    cnode: _oldCNode
                  },
                  new: {
                    cnode: deepClone(_CNode)
                  }
                }
              )
              break;
            }
          }
        } else { // layer下的image
          const _CNode = _appState.find(i => i.attrs.id === CNodeId)
          _oldCNode = deepClone(_CNode)
          if (_CNode) {
            // 实际保存的宽高
            CNode = updateCNode(_CNode, konvaNode)
            updateAppState(
              _appState,
              undefined,
              {
                type: NODE_OP_ENUMS.NodeTransform,
                commitId: uuidv4(),
                old: {
                  cnode: _oldCNode
                },
                new: {
                  cnode: deepClone(_CNode)
                }
              }
            )
          }
        }
      }

      // console.log(CNode, 'transformEnd', konvaNode, appState)

    });
  }
}


function updateCNode(cnode: CNode, konvaNode: any) {
  if (konvaNode.className === 'Group') {
    cnode.attrs.width = konvaNode.attrs.width
    cnode.attrs.height = konvaNode.attrs.height
  } else if (konvaNode.className === 'Image' || konvaNode.className === 'Text') {
    if (!konvaNode.attrs.width) { // 不要把这里和上面的逻辑合并，可能会出问题
      // 主要针对新创建的Konva.Image 和 Konva.Text
      let cr = konvaNode.getClientRect()
      cnode.attrs.width = cr.width
      cnode.attrs.height = cr.height
    } else {
      cnode.attrs.width = konvaNode.attrs.width
      cnode.attrs.height = konvaNode.attrs.height;
    }
  }
  cnode.attrs.x = konvaNode.attrs.x;
  cnode.attrs.y = konvaNode.attrs.y;
  cnode.attrs.scaleX = konvaNode.attrs.scaleX;
  cnode.attrs.scaleY = konvaNode.attrs.scaleY;
  cnode.attrs.skewX = konvaNode.attrs.skewX;
  cnode.attrs.skewY = konvaNode.attrs.skewY;
  cnode.attrs.rotation = konvaNode.attrs.rotation;
  return cnode
}