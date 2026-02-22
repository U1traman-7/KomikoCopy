declare global {
  type RequestImproved<P = any> = Request & {
    params?: P;
    log?: {
      cost?: number;
      tool?: string;
      model?: string;
      generationResult?: 0 | 2 | 4;
    }
  };
}

export { };
