// src/common/utils/pagination.util.ts
import { ApiResponse } from '../interfaces/api-response.interface';
import {
  PaginatedData,
  PaginationMeta,
} from '../interfaces/pagination.interface';

export function okPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
  message?: string,
): ApiResponse<PaginatedData<T>> {
  const safePage = page < 1 ? 1 : page;
  const safeLimit = limit < 1 ? 1 : limit;

  const totalPages = total === 0 ? 1 : Math.ceil(total / safeLimit);

  const pagination: PaginationMeta = {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
  };

  return {
    status: 'success',
    data: {
      items,
      pagination,
    },
    message,
  };
}
