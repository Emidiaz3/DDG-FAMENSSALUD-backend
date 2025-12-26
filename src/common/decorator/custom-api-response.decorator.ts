// custom-api-response.decorator.ts
import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { ApiResponseInterceptor } from '../interceptor/api-response.interceptor';

export function ApiResponse() {
  return applyDecorators(UseInterceptors(ApiResponseInterceptor));
}
