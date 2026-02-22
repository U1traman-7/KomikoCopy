import { post } from './request';
import {
  ModelIds,
  TASK_TYPES,
  TaskTypes,
  GenerationStatusType,
} from '../../api/_constants';
import { APIResponse } from './type';

export interface SubmitTaskParams {
  target_model: (typeof ModelIds)[keyof typeof ModelIds];
  prompt?: string;
  image?: string;
  video?: string;
  tool?: string;
  [key: string]: any;
  meta_data?: any;
}
export const submitTask = (params: SubmitTaskParams) =>
  post<APIResponse<{ task_ids: number[] }>>('/api/generation/submit', params);

export interface GenerationTask {
  id: number; // Database internal ID (primary key)
  status: GenerationStatusType;
  output: string;
  cost: number;
  prompt?: string;
  model: number;
  generation_id?: number;
  meta_data?: string;
  failure?: string;
  failureCode?: string;
}

interface QueryTaskParams {
  taskIds?: number[];
  status?: GenerationStatusType | GenerationStatusType[];
  tool?: string;
  type?: TaskTypes;
}
export const queryTask = ({ taskIds, status, tool, type }: QueryTaskParams) =>
  post<APIResponse<{ tasks: GenerationTask[] }>>('/api/generation/query', {
    task_ids: taskIds,
    status,
    tool,
    type,
  });
