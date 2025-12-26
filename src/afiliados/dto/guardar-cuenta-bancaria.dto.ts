// src/afiliados/dto/guardar-cuenta-bancaria.dto.ts
import { IsInt, IsNotEmpty, IsString, Length } from 'class-validator';

export class GuardarCuentaBancariaDto {
  @IsInt()
  banco_id: number;

  @IsInt()
  moneda_id: number;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  nro_cuenta: string;

  // Si más adelante quieres manejar vigencias manuales:
  // @IsOptional()
  // @IsDateString()
  // fecha_inicio?: string;
}
