import { get } from "./request";

export const storyNum = (params: { tags: string }) => get<APIResponse<number>>('/api/storyNum', params)
