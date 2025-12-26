// src/operaciones/dto/resumen-adeudos-query.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class ResumenAdeudosQueryDto {
  @IsOptional()
  @IsString()
  fecha_desde?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  fecha_hasta?: string; // YYYY-MM-DD
}
