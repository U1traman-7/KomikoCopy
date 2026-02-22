import { aiTools, ToolItem } from '../constants';
import toast from 'react-hot-toast';
import { useEffect, useState } from "react";

export const useCollectForyou = () => {

  const [collList,setCollList]=useState([]as ToolItem[])

  /**默认收藏为8个页面已经配置。collect_for_you_dic内保存的是剔除的tab配置， */
  const removeCollectFunc=(item:ToolItem)=>{
    const list=collList.filter((i:ToolItem)=>i.path!==item.path)
    setCollList(list)
    localStorage.setItem('collect_for_you_dic',JSON.stringify(list))
  }

  const addCollectFunc=(item:ToolItem)=>{
    if(collList.some((i:ToolItem)=>i.path == item.path)){
      toast.success('Already collected')
      return
    }
    const list=[...collList,item]
    setCollList(list)
    localStorage.setItem('collect_for_you_dic',JSON.stringify(list))
  }

  useEffect(()=>{
    const str=localStorage.getItem('collect_for_you_dic')
    if(!str){
        const tools=aiTools.flatMap(toolSet => toolSet.entries)
        .filter(tool => tool.recommended)
        setCollList(tools)
        localStorage.setItem('collect_for_you_dic',JSON.stringify(tools))

    }else{
        const dicStr=str||'[]'
        setCollList(JSON.parse(dicStr))
    }
  },[])

  return {collList,removeCollectFunc,addCollectFunc};
}
