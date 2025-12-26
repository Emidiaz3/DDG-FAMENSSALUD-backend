import { PaginatedData } from './pagination.interface';

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  errors?: ApiError[];
  message?: string;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
