// src/afiliados/dto/retirar-afiliado.dto.ts
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RetirarAfiliadoDto {
  @IsOptional()
  @IsDateString()
  fecha_retiro?: string; // si no viene, usamos hoy

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  motivo_retiro: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;

  @IsNumber()
  @Min(0)
  monto_aportes_acumulado: number; // 7413.25

  @IsNumber()
  @Min(0)
  factor_beneficio: number; // 5

  @IsNumber()
  @Min(0)
  porcentaje_gastos_adm: number; // 5 (porcentaje)
}
