import { failed, setToolModel, MiddlewareFunc } from '../index.js';

// Temporary type declaration to fix compilation
type RequestImproved<P = any> = Request & {
  params?: P;
  log?: {
    cost?: number;
    tool?: string;
    model?: string;
    generationResult?: 0 | 2 | 4;
  }
};

export * from './auth.js';
export * from './canGenerate.js';
export * from './canConsume.js';
export * from './bindParams.js';
export * from './origin.js';
export const headerHandler = (model?: string, tool?: string) => async (request: Request) => {
  try {
    let params = (request as any).params;
    if (!params) {
      params = await request.json();
      (request as any).params = params;
    }
    const { tool: toolName, model: modelName } = params || {};
    setToolModel({
      request,
      tool: (tool || toolName) ?? null,
      model: (model || modelName) ?? null
    });
    return { success: true }
  } catch (e) {
    console.error(e);
    return { success: false, response: failed('Image generation failed') }
  }
};

export const bindGenerationLogData = (request: RequestImproved, data: any) => {
  const log = request.log || {};
  request.log = Object.assign(log, data);
}

export const getParams = async (request: RequestImproved) => {
  let params = request.params;
  if (!params) {
    params = await request.json();
    request.params = params;
  }
  return params;
}
