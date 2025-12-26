// src/prestamos/dto/listar-prestamos-query.dto.ts
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsDateString,
} from 'class-validator';

export class ListarPrestamosQueryDto {
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

  // filtro texto: codigo_trabajador, nombres, apellidos, doc_identidad
  @IsOptional()
  @IsString()
  search?: string;

  // filtros
  @IsOptional()
  @IsDateString()
  fecha_desde?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string; // YYYY-MM-DD

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamento_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  base_id?: number;

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
