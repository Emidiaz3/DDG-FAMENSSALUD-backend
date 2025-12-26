export type ModoAportes = 'actual' | 'historico' | 'todos';

// listar-resumen-aportes-query.dto.ts
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListarResumenAportesQueryDto {
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
  search?: string;

  @IsOptional()
  @Type(() => Boolean)
  estado?: boolean;

  @IsOptional()
  @IsIn(['actual', 'historico', 'todos'])
  modo?: ModoAportes;
}
