export interface APIResponse<T> {
  data: T;
  code: number;
  error?: string;
  error_code?: number;
}
