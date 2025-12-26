// src/prestamos/dto/listar-pagos-prestamo-query.dto.ts
import { IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class ListarPagosPrestamoQueryDto {
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
  fecha_desde?: string; // YYYY-MM-DD

  @IsOptional()
  @IsDateString()
  fecha_hasta?: string; // YYYY-MM-DD

  @IsOptional()
  @IsInt()
  @Min(1)
  tipo_pago_prestamo_id?: number;
}
