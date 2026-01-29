// src/configuracion/empresa-config/dto/update-empresa-config.dto.ts
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateEmpresaConfigDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  razon_social?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  titulo?: string;

  @IsOptional()
  @IsString()
  @Length(11, 11)
  ruc?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  direccion?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  numero?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codigo_postal?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  registro_patronal?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  departamento_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  provincia_id?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  distrito_id?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rep_apellido_paterno?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  rep_apellido_materno?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  rep_nombres?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logo_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caratula_url?: string | null;
}
