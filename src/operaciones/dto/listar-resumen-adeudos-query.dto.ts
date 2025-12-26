// src/operaciones/dto/listar-resumen-adeudos-query.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListarResumenAdeudosQueryDto {
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
  fecha_desde?: string; // YYYY-MM-DD (aplica a exceso y devolución)

  @IsOptional()
  @IsString()
  fecha_hasta?: string; // YYYY-MM-DD (aplica a exceso y devolución)
}
