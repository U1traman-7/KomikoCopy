import { CNode, CNodeType } from "../state";
import { useListenTransform } from "./useListenTransform";
import { getCNodeId } from "../helpers/id";
import { deepClone } from "../utilities";
import { NODE_OP_ENUMS } from "../Components/InfCanva/types";
import { useUpdateAppState } from "./useUpdateAppState";
import { v4 as uuidv4 } from "uuid";
import { loadKonva } from "../utilities/konva-loader";

export const useCreateText = (stageRef: any, appStateRef: any, deSelect: any) => {
  const updateAppState = useUpdateAppState()
  const listenTransform = useListenTransform()

  const handleTextDblClick = (e: any) => {
    console.log(`handleTextDblClick`)
    const stage = stageRef.current;
    const textNode = e.target as Konva.Text;
    const absPos = textNode.getAbsolutePosition();
    const stageBox = stage.container().getBoundingClientRect();

    const textArea = document.createElement('textarea');
    document.body.appendChild(textArea);

    textArea.value = textNode.text();
    textArea.style.position = 'absolute';
    textArea.style.top = `${absPos.y + stageBox.top}px`;
    textArea.style.left = `${absPos.x + stageBox.left}px`;
    textArea.style.fontSize = `${textNode.fontSize() * stage.scaleX()}px`;
    textArea.style.border = 'none';
    textArea.style.padding = '0px';
    textArea.style.margin = '0px';
    textArea.style.overflow = 'hidden';
    textArea.style.background = 'none';
    textArea.style.outline = 'none';
    textArea.style.resize = 'none';
    textArea.style.scale = `${textNode.attrs.scaleX} ${textNode.attrs.scaleY}`;
    textArea.style.lineHeight = `${textNode.lineHeight()}`;
    textArea.style.fontFamily = textNode.fontFamily();
    textArea.style.transformOrigin = 'left top';
    textArea.style.textAlign = textNode.align();
    textArea.style.color = textNode.fill().toString();
    textArea.style.stroke = textNode.stroke().toString();
    textArea.style.strokeWidth = `${Math.floor(textNode.strokeWidth() * stage.scaleX())}px`;
    textArea.style.transform = `rotate(${textNode.rotation()}deg)`;
    textArea.style.width = 'auto';
    textArea.style.height = 'auto';
    // textArea.cols = 1;
    // textArea.rows = 1;
    textArea.style.whiteSpace = 'pre';

    const adjustTextAreaSize = () => {
      textArea.style.height = 'auto';
      textArea.style.height = `${textArea.scrollHeight}px`;
      textArea.style.width = 'auto';
      textArea.style.width = `${textArea.scrollWidth}px`;
    };
    adjustTextAreaSize()
    textArea.addEventListener('input', adjustTextAreaSize);
    textArea.focus();
    textNode.text(""); // Don't display the actual Konva Text node
    deSelect();


    const findNodeById: any = (node: any, id: any) => {
      if (node.attrs.id === id) {
        return node;
      }
      if (node.children) {
        for (let child of node.children) {
          const result = findNodeById(child, id);
          if (result) {
            return result;
          }
        }
      }
      return null;
    };

    textArea.addEventListener('blur', () => {
      textNode.text(textArea.value);

      const _appState = deepClone(appStateRef.current);
      const CNodeId = getCNodeId(textNode.attrs.id);
      console.log("On blur", textNode.attrs.id, CNodeId);

      let oldCNode = null;
      for (let item of _appState) {
        oldCNode = findNodeById(item, CNodeId);
        if (oldCNode) break;
      }
      if (oldCNode) {
        const _oldCNode = deepClone(oldCNode);
        oldCNode.attrs.text = textNode.text();
        const _newCNode = deepClone(oldCNode);
        updateAppState(_appState, undefined, {
          type: NODE_OP_ENUMS.NodeAttrChange,
          commitId: uuidv4(),
          old: {
            cnode: _oldCNode
          },
          new: {
            cnode: _newCNode
          }
        });
        console.log(_oldCNode.attrs.text, 'o', _newCNode.attrs.text, 'n');
      }

      document.body.removeChild(textArea);
      // handleStageOnClick(e)
    });
  };

  return async (cnode: CNode) => {
    // Load Konva dynamically on client side
    const Konva = await loadKonva();
    if (!Konva) {
      return null; // Server side
    }
    
    const text = new Konva.Text({
      ...cnode.attrs,
      cType: CNodeType.COMIC_TEXT,
      scaleX: 1,
      scaleY: 1,
      height: undefined,
      width: undefined,
      text: cnode.attrs.text,
      fill: cnode.attrs.color,
      stroke: cnode.attrs.stroke,
      strokeWidth: cnode.attrs.strokeWidth,
    })
    text.scaleX(cnode.attrs.scaleX ?? 1);
    text.scaleY(cnode.attrs.scaleY ?? 1);

    text.attrs.onDblClick = handleTextDblClick;
    text.on('dblclick', handleTextDblClick);
    listenTransform(text)
    return text
  }
}