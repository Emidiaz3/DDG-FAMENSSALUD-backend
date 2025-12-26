// src/afiliados/dto/listar-aportes-afiliado-query.dto.ts
import { IsInt, IsOptional, IsDateString, Min } from 'class-validator';

export class ListarAportesAfiliadoQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
}
