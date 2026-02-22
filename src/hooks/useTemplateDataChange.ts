import { useEffect } from 'react';
import { templateDataManager } from '../utils/templateCache';

/**
 * 监听模板数据变化的 hook，自动管理订阅/取消订阅生命周期
 * 当 templateDataManager 完成数据加载后会触发 callback
 */
export const useTemplateDataChange = (callback: () => void) => {
  useEffect(() => {
    const unsubscribe = templateDataManager.addDataChangeListener(callback);
    return unsubscribe;
  }, [callback]);
};
