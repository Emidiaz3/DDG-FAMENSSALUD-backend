// src/aportes/dto/crear-aporte.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CrearAporteDto {
  @IsInt()
  afiliado_id: number;

  @IsNotEmpty()
  @IsDateString()
  fecha_aporte: string; // YYYY-MM-DD

  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  monto_aporte: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  origen?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  referencia_lote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;

  // Opcionales legacy
  @IsOptional()
  @IsString()
  @MaxLength(8)
  codtra_legacy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  codafi2_legacy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(11)
  codafi_legacy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  codret_legacy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1)
  estafi_legacy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ind_legacy?: string;
}
