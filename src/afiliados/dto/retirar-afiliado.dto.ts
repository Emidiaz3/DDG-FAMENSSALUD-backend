// src/afiliados/dto/retirar-afiliado.dto.ts
import {
  IsDateString,
  IsInt,
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

  @IsInt()
  @Min(1)
  motivo_retiro_id: number; // 👈 NUEVO (FK)

  @IsOptional()
  @IsString()
  @MaxLength(200)
  observacion?: string;

  @IsNumber()
  @Min(0)
  monto_aportes_acumulado: number; // 7413.25
}
