import { post } from "./request";

// create world
interface CreateParams {
  title: string;
  story: string;
  description: string;
  criteria?: string;
  rule?: string;
  cover: string
}
export const create = (params: CreateParams) => post<APIResponse<string>>('/api/createWorld', params)
