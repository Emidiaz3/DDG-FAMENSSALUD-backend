import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  IsEnum,
} from 'class-validator';
import { TipoPrestamoEnum } from '../prestamos.constants';

export class CrearPrestamoDto {
  @IsInt()
  @Min(1)
  afiliado_id: number;

  @IsNotEmpty()
  @IsDateString()
  fecha_prestamo: string; // YYYY-MM-DD

  @Type(() => Number) // para que el JSON "4" se transforme a número
  @IsEnum(TipoPrestamoEnum)
  tipo_prestamo_id: TipoPrestamoEnum;

  @IsNumber({ maxDecimalPlaces: 2 })
  tasa_interes_mensual: number; // viene del front, pero se valida contra catálogo

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto_prestamo: number;

  @IsInt()
  @Min(1)
  numero_cuotas_pactadas: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto_girado_banco: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  porcentaje_seguro: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  monto_seguro: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  prestamo_origen_id?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion_prestamo?: string;
}
