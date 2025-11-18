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

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  status: 'success' | 'error';
  data: PaginatedData<T>;
  errors?: ApiError[];
}
