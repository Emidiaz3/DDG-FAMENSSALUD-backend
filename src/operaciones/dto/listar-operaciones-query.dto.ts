import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListarOperacionesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  fecha_desde?: string; // 'YYYY-MM-DD'

  @IsOptional()
  @IsString()
  fecha_hasta?: string; // 'YYYY-MM-DD'
}
