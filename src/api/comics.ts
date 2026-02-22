import { post } from './request';

interface GenerateComicsParams {
  idea: string;
  num_images: number;
  comicType: string;
  adjective: string;
  art_style: string;
  tool: string;
  meta_data?: any;
}

interface GenerateComicsResponse {
  images: string[];
  texts: string[];
  error?: string;
  error_code?: number;
}

export const generateComics = (params: GenerateComicsParams) =>
  post<GenerateComicsResponse>('/api/v2/generateComicsGemini', params);
