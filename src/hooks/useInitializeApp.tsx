'use client';
import { useEffect } from 'react';
import {
  initializeTemplateData,
  templateDataManager,
} from '../utils/templateCache';
import { getI2iStyleNameKeyMapping } from '../Components/StyleTemplatePicker/styles';

// 全局标志，避免重复初始化
let isInitialized = false;
let isInitializing = false;

export function useInitializeApp() {
  useEffect(() => {
    // 如果已经初始化过或正在初始化，跳过
    if (isInitialized || isInitializing) {
      return;
    }

    // 如果模板数据已经加载完成，跳过
    if (templateDataManager.isDataLoaded()) {
      isInitialized = true;
      return;
    }

    // 应用启动时初始化所有模板数据
    const initData = async () => {
      if (isInitializing) return;

      isInitializing = true;
      try {
        console.log('[App] Initializing template data...');
        await initializeTemplateData();
        // 同时预加载 image 模板的 nameKey mapping
        await getI2iStyleNameKeyMapping();
        console.log('[App] Template data initialized successfully');
        isInitialized = true;
      } catch (error) {
        console.error('[App] Failed to initialize template data:', error);
      } finally {
        isInitializing = false;
      }
    };

    initData();
  }, []);
}

// 也可以作为高阶组件使用
export function withTemplateInitialization<P extends object>(
  Component: React.ComponentType<P>,
) {
  return function InitializedComponent(props: P) {
    useInitializeApp();
    return <Component {...props} />;
  };
}
