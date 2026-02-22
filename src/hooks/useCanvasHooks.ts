// 客户端安全的Canvas hooks包装器
import { useEffect, useState } from 'react';
import { useReflushLayer } from './useReflushLayer';
import { useCreateText } from './useCreateText';
import { useCreateBubble } from './useCreateBubble';

export const useCanvasHooks = (stageRef: any, appStateRef: any, deSelect: any) => {
  const [isClient, setIsClient] = useState(false);

  // 确保只在客户端运行
  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
  }, []);

  // 始终调用hooks（遵循hooks规则），但传递isClient状态
  const reflushLayer = useReflushLayer(stageRef, appStateRef, deSelect);
  const createText = useCreateText(stageRef, appStateRef, deSelect);
  const createBubble = useCreateBubble();

  return {
    reflushLayer: isClient ? reflushLayer : async () => {},
    createText: isClient ? createText : async () => null,
    createBubble: isClient ? createBubble : async () => null,
    isLoaded: isClient
  };
}; 