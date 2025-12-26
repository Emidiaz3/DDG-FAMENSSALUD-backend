import {
  ApiError,
  ApiResponse,
  PaginatedResponse,
} from '../interfaces/api-response.interface';

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return {
    status: 'success',
    data,
    message,
  };
}

export function fail(
  message: string,
  errors?: ApiError[],
  code?: string,
): ApiResponse<null> {
  return {
    status: 'error',
    message,
    errors: errors ?? (code ? [{ message, code }] : [{ message }]),
  };
}

// export function paginatedOk<T>(
//   items: T[],
//   total: number,
//   page: number,
//   pageSize: number,
// ): PaginatedResponse<T> {
//   const totalPages = Math.ceil(total / pageSize);

//   return {
//     status: 'success',
//     data: {
//       items,
//       total,
//       page,
//       pageSize,
//       totalPages,
//     },
//   };
// }
