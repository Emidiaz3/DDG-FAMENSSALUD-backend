import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GuardarExcesoDto {
  @IsOptional()
  @IsString()
  exceso_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  afiliado_id?: number;

  @IsOptional()
  @IsDateString()
  fecha_exceso?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto_exceso?: number;

  @IsOptional()
  @IsString()
  observacion_exceso?: string | null;
}
