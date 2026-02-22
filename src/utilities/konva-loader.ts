// 集中管理的Konva动态加载器
// 避免在服务器端加载Konva导致的构建错误

let konvaInstance: any = null;
let reactKonvaInstance: any = null;

export const loadKonva = async () => {
  if (typeof window === 'undefined') {
    // 服务器端返回空对象
    return null;
  }

  if (!konvaInstance) {
    konvaInstance = await import('konva');
  }
  return konvaInstance.default;
};

export const loadReactKonva = async () => {
  if (typeof window === 'undefined') {
    // 服务器端返回空对象
    return null;
  }

  if (!reactKonvaInstance) {
    reactKonvaInstance = await import('react-konva');
  }
  return reactKonvaInstance;
};

export const loadAllKonva = async () => {
  if (typeof window === 'undefined') {
    return {
      Konva: null,
      Stage: null,
      Layer: null,
      Rect: null,
      Path: null,
      Line: null,
      Text: null,
      Transformer: null,
      Group: null,
      Image: null,
    };
  }

  const [konva, reactKonva] = await Promise.all([
    loadKonva(),
    loadReactKonva()
  ]);

  return {
    Konva: konva,
    Stage: reactKonva?.Stage,
    Layer: reactKonva?.Layer,
    Rect: reactKonva?.Rect,
    Path: reactKonva?.Path,
    Line: reactKonva?.Line,
    Text: reactKonva?.Text,
    Transformer: reactKonva?.Transformer,
    Group: reactKonva?.Group,
    Image: reactKonva?.Image,
  };
};

// 服务器端安全的类型定义
export type KonvaType = any;
export type ReactKonvaType = any; 