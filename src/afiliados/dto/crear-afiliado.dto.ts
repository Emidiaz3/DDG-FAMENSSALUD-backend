import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  Length,
  ValidateNested,
} from 'class-validator';
import { GuardarCuentaBancariaDto } from './guardar-cuenta-bancaria.dto';
import { GuardarSobreBeneficiarioDto } from './guardar-sobre-beneficiario.dto';

export class GuardarAfiliadoDto {
  // 👇 Solo cuando sea actualización
  @IsOptional()
  @IsInt()
  id?: number;

  // --- Identificación ---
  @IsNotEmpty()
  @IsString()
  @Length(1, 10)
  codigo_trabajador: string;

  @IsOptional()
  @IsString()
  @Length(8, 20)
  doc_identidad?: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  ap_paterno: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  ap_materno: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 80)
  nombres: string;

  // --- Datos de contacto ---
  @IsOptional()
  @IsString()
  @Length(0, 200)
  direccion?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Length(0, 120)
  email?: string;

  // --- Ubicación ---
  @IsOptional()
  @IsInt()
  pais_id?: number;

  @IsOptional()
  @IsInt()
  departamento_id?: number;

  @IsOptional()
  @IsInt()
  provincia_id?: number;

  @IsOptional()
  @IsInt()
  distrito_id?: number;

  // --- Información institucional ---
  @IsOptional()
  @IsInt()
  base_id?: number;

  @IsOptional()
  @IsInt()
  regimen_laboral_id?: number;

  @IsNotEmpty()
  @IsDateString()
  fecha_ingreso: string;

  @IsNotEmpty()
  @IsDateString()
  fecha_nacimiento: string;

  // --- Estado ---
  @IsOptional()
  @IsString()
  @Length(0, 20)
  estado?: string; // No se modifica en update

  // --- Cuenta bancaria (histórica) ---
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardarCuentaBancariaDto)
  cuenta_bancaria?: GuardarCuentaBancariaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuardarSobreBeneficiarioDto)
  sobre_beneficiario?: GuardarSobreBeneficiarioDto;
}
