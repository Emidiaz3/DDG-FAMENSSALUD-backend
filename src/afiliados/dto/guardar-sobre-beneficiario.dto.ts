// src/afiliados/dto/guardar-sobre-beneficiario.dto.ts
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class GuardarSobreBeneficiarioDto {
  @IsNotEmpty()
  @IsDateString()
  fecha_recepcion: string;

  @IsNotEmpty()
  @IsBoolean()
  en_buen_estado: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  observacion?: string;
}
