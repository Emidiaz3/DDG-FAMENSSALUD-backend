// src/seguridad/auth/dto/refresh-token-body.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class RefreshTokenBodyDto {
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
