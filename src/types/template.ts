// 模板相关的共享类型定义

export type TemplateType = 'image' | 'video' | 'expression' | 'dance' | 'mixed';

export interface TemplateInputField {
  input_field: string;
  placeholder: string | null;
  type?: 'text' | 'textarea' | 'choice';
  choices?: Array<{
    value: string;
    label: string;
  }>;
  question?: string;
}

export interface StyleTemplate {
  id: string;
  urlSlug?: string;
  displayName?: string;
  type: TemplateType;
  name_key: string;
  url?: string;
  display_url?: string;
  is_pro_model: boolean;
  support_v2v: boolean;
  support_playground: boolean;
  prompt: { prompt: string };
  ratio: string;
  input_media: Array<{
    media_type: string;
    min_count: number;
    max_count: number;
  }>;
  metadata?: any;
  character_inputs?: TemplateInputField[];
  need_middleware?: boolean;
  video_pipeline_type?: string;
  order?: number;
  usage_count?: number;
  description?: string;
  is_trending?: boolean;
  i18n?: { name?: Record<string, string>; description?: Record<string, string> } | null;
}

export interface TemplateCategory {
  id: string;
  type: TemplateType;
  name_key: string;
  icon?: string;
  emoji?: string;
  support_v2v: boolean;
  support_playground: boolean;
  order?: number;
  templates: StyleTemplate[];
}
