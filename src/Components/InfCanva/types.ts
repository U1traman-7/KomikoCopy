import { CNode } from "../../state"

export interface IEditAction {
    type: 'setStyle' | string,
    payload: object
}

export enum NODE_OP_ENUMS {
    'NodeAttrChange' ,
    'NodeTransform',
    'NodeAdd', 
    'NodeRemove',
    'NodeMove',
}

export interface IDiffItem {
    type: NODE_OP_ENUMS,
    commitId: string,
    parentCNodeId?: 'Layer' | string,// NodeAdd时需要记录
    old?: {
        cnode?: CNode,
        zIndex?: number
    },
    new?: {
        cnode?: CNode,
        zIndex?: number
    }
}