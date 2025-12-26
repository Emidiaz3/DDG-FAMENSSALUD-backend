// src/prestamos/dto/listar-prestamos-afiliado-query.dto.ts
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListarPrestamosAfiliadoQueryDto {
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
  @IsDateString()
  fecha_desde?: string;

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipo_prestamo_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  estado_prestamo_id?: number;
}
