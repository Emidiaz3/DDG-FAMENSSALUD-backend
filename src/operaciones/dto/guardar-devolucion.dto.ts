import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuardarDevolucionDto {
  // 👇 si viene => editar, si NO viene => crear
  @IsOptional()
  @IsString()
  devolucion_id?: string;

  // 👇 solo obligatorio al crear (en editar se puede omitir)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  afiliado_id?: number;

  @IsOptional()
  @IsDateString()
  fecha_devolucion?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto_devolucion?: number;

  @IsOptional()
  @IsString()
  observacion_devolucion?: string | null;
}
